#!/usr/bin/env python3
"""Decompose a video into shots so an agent can read its pacing and design.

One command produces an analysis bundle: shot boundaries, per-shot motion and
color stats, labeled contact sheets, per-shot keyframes, an audio envelope with
onset times, and a manifest.json tying it together.

Requires: ffmpeg, ffprobe, python3 with numpy and Pillow.
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------- utilities

def die(msg):
    print(f"teardown: {msg}", file=sys.stderr)
    sys.exit(1)


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, **kw)


def load_font(size):
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ):
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    return ImageFont.load_default()


# ---------------------------------------------------------------- probing

def probe(path):
    out = run(["ffprobe", "-v", "error", "-print_format", "json",
               "-show_format", "-show_streams", str(path)])
    if out.returncode != 0:
        die(f"ffprobe failed: {out.stderr.decode().strip()}")
    data = json.loads(out.stdout)
    video = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    audio = next((s for s in data["streams"] if s["codec_type"] == "audio"), None)
    if video is None:
        die("no video stream found")
    num, den = (video.get("avg_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    return {
        "path": str(path),
        "duration": float(data["format"]["duration"]),
        "size_bytes": int(data["format"]["size"]),
        "width": video["width"],
        "height": video["height"],
        "fps": round(fps, 4),
        "video_codec": video["codec_name"],
        "audio_codec": audio["codec_name"] if audio else None,
        "has_audio": audio is not None,
    }


# ---------------------------------------------------------- visual analysis

def sample_frames(path, fps, width, height):
    """Decode the whole video once at low resolution. Returns (N,H,W,3) uint8."""
    cmd = ["ffmpeg", "-v", "error", "-i", str(path),
           "-vf", f"fps={fps},scale={width}:{height}",
           "-pix_fmt", "rgb24", "-f", "rawvideo", "-"]
    proc = run(cmd)
    if proc.returncode != 0:
        die(f"frame sampling failed: {proc.stderr.decode().strip()}")
    frame_bytes = width * height * 3
    n = len(proc.stdout) // frame_bytes
    if n < 2:
        die("video too short to analyze")
    return np.frombuffer(proc.stdout[:n * frame_bytes], dtype=np.uint8).reshape(
        n, height, width, 3)


def detect_boundaries(frames, fps, z_thresh, floor, min_shot):
    """Find cuts and transitions from the frame-difference signal.

    A one-sample spike is a hard cut. A sustained run of elevated difference is
    a dissolve, wipe, or camera move, so it is reported with its duration.
    """
    diff = np.abs(frames[1:].astype(np.int16) - frames[:-1].astype(np.int16))
    d = diff.mean(axis=(1, 2, 3)) / 255.0

    med = float(np.median(d))
    mad = float(np.median(np.abs(d - med))) or 1e-6
    z = (d - med) / (1.4826 * mad)

    hot = (z > z_thresh) & (d > floor)
    events, i = [], 0
    while i < len(hot):
        if hot[i]:
            j = i
            while j + 1 < len(hot) and hot[j + 1]:
                j += 1
            # d[k] is the change between frame k and k+1, so the new shot starts at k+1.
            events.append({
                "start_t": (i + 1) / fps,
                "end_t": (j + 1) / fps,
                "frames": j - i + 1,
                "peak": float(d[i:j + 1].max()),
                "kind": "cut" if j == i else "transition",
            })
            i = j + 1
        else:
            i += 1

    duration = len(frames) / fps
    cuts = [0.0] + [e["start_t"] for e in events] + [duration]
    shots = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        if shots and (b - a) < min_shot:
            shots[-1][1] = b  # too short to be a shot, fold into the previous one
        else:
            shots.append([a, b])
    if len(shots) > 1 and (shots[0][1] - shots[0][0]) < min_shot:
        shots[1][0] = shots[0][0]
        shots.pop(0)

    return shots, events, d


def find_beats(d, fps, a, b, min_beat, z_thresh=2.2):
    """Split one continuous shot into beats.

    Motion-graphics ads hold a single camera for many seconds while the message
    changes underneath: text swaps, a UI types itself, a card flies in. Those are
    the units of pacing, so within a long shot we rerun peak detection against
    that shot's own noise floor instead of the whole video's.
    """
    lo, hi = int(a * fps), int(b * fps)
    seg = d[lo:hi]
    if len(seg) < 4:
        return []
    med = float(np.median(seg))
    mad = float(np.median(np.abs(seg - med))) or 1e-6
    z = (seg - med) / (1.4826 * mad)

    picks = []
    for i in range(1, len(seg) - 1):
        if z[i] > z_thresh and seg[i] >= seg[i - 1] and seg[i] > seg[i + 1]:
            t = a + (i + 1) / fps
            if t - a < min_beat or b - t < min_beat:
                continue
            if picks and t - picks[-1] < min_beat:
                if seg[i] > seg[int((picks[-1] - a) * fps) - 1]:
                    picks[-1] = t  # keep the stronger of two crowded peaks
                continue
            picks.append(t)
    return picks


def palette(img, colors=5):
    small = img.copy()
    small.thumbnail((160, 160))
    q = small.convert("RGB").quantize(colors=colors, method=Image.FASTOCTREE)
    pal = q.getpalette()
    total = small.width * small.height
    out = []
    for count, idx in sorted(q.getcolors(), reverse=True)[:colors]:
        r, g, b = pal[idx * 3:idx * 3 + 3]
        out.append({"hex": f"#{r:02x}{g:02x}{b:02x}", "share": round(count / total, 3)})
    return out


def motion_class(v):
    if v < 0.006:
        return "static"
    if v < 0.02:
        return "subtle"
    if v < 0.05:
        return "moderate"
    return "high"


def extract_keyframes(path, segments, outdir, max_width, per_shot):
    """Pull readable stills at the head, middle, and tail of each segment."""
    frames_dir = outdir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    labels = {1: ["mid"], 2: ["in", "out"], 3: ["in", "mid", "out"]}[per_shot]
    result = []
    for seg in segments:
        a, b = seg["start"], seg["end"]
        span = b - a
        pad = min(0.08, span * 0.15)
        picks = {"in": a + pad, "mid": a + span / 2, "out": max(a + pad, b - pad)}
        shot_frames = []
        for label in labels:
            t = picks[label]
            out = frames_dir / f"{seg['id']}_{label}.jpg"
            r = run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(path),
                     "-frames:v", "1", "-vf", f"scale={max_width}:-2",
                     "-q:v", "3", str(out)])
            if r.returncode == 0 and out.exists():
                shot_frames.append({"label": label, "t": round(t, 3),
                                    "path": str(out.relative_to(outdir))})
        result.append(shot_frames)
    return result


def contact_sheets(segments, keyframes, outdir, cols, rows, cell_w):
    """Grid of one still per segment, stamped with its id and timing."""
    sheets_dir = outdir / "sheets"
    sheets_dir.mkdir(parents=True, exist_ok=True)
    font = load_font(16)
    per_sheet = cols * rows
    reps = []
    for i, kfs in enumerate(keyframes):
        pick = next((k for k in kfs if k["label"] == "mid"), kfs[0] if kfs else None)
        if pick:
            reps.append((i, pick))

    paths = []
    for s in range(0, len(reps), per_sheet):
        chunk = reps[s:s + per_sheet]
        thumbs = [(idx, Image.open(outdir / k["path"]).convert("RGB")) for idx, k in chunk]
        cell_h = int(cell_w * thumbs[0][1].height / thumbs[0][1].width)
        bar = 26
        n_rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell_w, n_rows * (cell_h + bar)), (18, 18, 20))
        draw = ImageDraw.Draw(sheet)
        for n, (idx, img) in enumerate(thumbs):
            x = (n % cols) * cell_w
            y = (n // cols) * (cell_h + bar)
            sheet.paste(img.resize((cell_w, cell_h)), (x, y))
            seg = segments[idx]
            draw.text((x + 6, y + cell_h + 5),
                      f"{seg['id']}  {seg['start']:.2f}-{seg['end']:.2f}s  "
                      f"({seg['end'] - seg['start']:.2f}s)",
                      fill=(235, 235, 235), font=font)
        out = sheets_dir / f"shots_{s // per_sheet:02d}.jpg"
        sheet.save(out, quality=88)
        paths.append(str(out.relative_to(outdir)))
    return paths


def timeline_plot(outdir, duration, motion, mfps, rms, rms_hz, shots, beats, onsets):
    """One image showing motion energy, loudness, and where the cuts land."""
    W, H = 1400, 340
    top, mid_y, bot = 30, 170, 300
    img = Image.new("RGB", (W, H), (16, 16, 18))
    d = ImageDraw.Draw(img)
    font = load_font(14)
    x_of = lambda t: 60 + (W - 80) * (t / duration)

    for t in beats:
        d.line([(x_of(t), top + 10), (x_of(t), bot)], fill=(48, 48, 56))
    for a, b in shots:
        d.line([(x_of(a), top - 8), (x_of(a), bot)], fill=(110, 110, 125))
    for t in onsets:
        d.line([(x_of(t), bot), (x_of(t), bot + 12)], fill=(90, 140, 200))

    def curve(sig, hz, y0, y1, color):
        if sig is None or len(sig) == 0:
            return
        peak = float(np.max(sig)) or 1.0
        pts = []
        for i, v in enumerate(sig):
            t = i / hz
            if t > duration:
                break
            pts.append((x_of(t), y1 - (y1 - y0) * min(1.0, v / peak)))
        if len(pts) > 1:
            d.line(pts, fill=color, width=1)

    curve(motion, mfps, top, mid_y - 20, (240, 170, 60))
    curve(rms, rms_hz, mid_y + 10, bot, (90, 200, 150))
    d.text((8, top - 14), "motion", fill=(240, 170, 60), font=font)
    d.text((8, mid_y + 10), "audio", fill=(90, 200, 150), font=font)

    step = 5 if duration <= 90 else 15
    for t in range(0, int(duration) + 1, step):
        d.line([(x_of(t), bot + 14), (x_of(t), bot + 20)], fill=(120, 120, 130))
        d.text((x_of(t) - 8, bot + 22), f"{t}s", fill=(160, 160, 170), font=font)

    out = outdir / "timeline.png"
    img.save(out)
    return str(out.relative_to(outdir))


def zoom_sheet(path, outdir, a, b, every, max_width, cols):
    """Dense fixed-interval strip over one time range, for drilling into a beat."""
    frames_dir = outdir / "frames" / "zoom"
    frames_dir.mkdir(parents=True, exist_ok=True)
    times = [a + i * every for i in range(int((b - a) / every) + 1)]
    cells = []
    for t in times:
        out = frames_dir / f"t{t:07.3f}.jpg".replace(".", "_", 1)
        r = run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(path),
                 "-frames:v", "1", "-vf", f"scale={max_width}:-2", "-q:v", "3", str(out)])
        if r.returncode == 0 and out.exists():
            cells.append((t, Image.open(out).convert("RGB")))
    if not cells:
        die("zoom range produced no frames")

    cell_w = max_width // 2
    cell_h = int(cell_w * cells[0][1].height / cells[0][1].width)
    bar, n_rows = 24, (len(cells) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w, n_rows * (cell_h + bar)), (18, 18, 20))
    draw = ImageDraw.Draw(sheet)
    font = load_font(16)
    for n, (t, img) in enumerate(cells):
        x, y = (n % cols) * cell_w, (n // cols) * (cell_h + bar)
        sheet.paste(img.resize((cell_w, cell_h)), (x, y))
        draw.text((x + 6, y + cell_h + 4), f"{t:.2f}s", fill=(235, 235, 235), font=font)
    sheets_dir = outdir / "sheets"
    sheets_dir.mkdir(parents=True, exist_ok=True)
    out = sheets_dir / f"zoom_{a:.2f}-{b:.2f}.jpg".replace(".", "_", 2)
    sheet.save(out, quality=90)
    return out


def inspect_frame(path, outdir, t, width, step=0.1):
    """One large still with a normalized coordinate grid, for reading layout.

    Component positions should be quoted as fractions of frame width and height
    so they survive a change of resolution or aspect ratio.
    """
    out_dir = outdir / "frames" / "inspect"
    out_dir.mkdir(parents=True, exist_ok=True)
    raw = out_dir / f"t{t:07.3f}.jpg".replace(".", "_", 1)
    r = run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(path),
             "-frames:v", "1", "-vf", f"scale={width}:-2", "-q:v", "2", str(raw)])
    if r.returncode != 0 or not raw.exists():
        die(f"could not extract a frame at {t}s")

    img = Image.open(raw).convert("RGB")
    pad = 34
    canvas = Image.new("RGB", (img.width + pad, img.height + pad), (24, 24, 28))
    canvas.paste(img, (pad, 0))
    d = ImageDraw.Draw(canvas, "RGBA")
    font = load_font(13)

    n = int(round(1 / step))
    for i in range(n + 1):
        f = i * step
        x = pad + img.width * f
        y = img.height * f
        heavy = abs(f - 0.5) < 1e-6
        color = (255, 90, 90, 190) if heavy else (110, 200, 255, 90)
        d.line([(x, 0), (x, img.height)], fill=color)
        d.line([(pad, y), (canvas.width, y)], fill=color)
        if i < n:
            d.text((x + 3, img.height + 4), f"{f:.1f}", fill=(200, 200, 210), font=font)
            d.text((4, y + 3), f"{f:.1f}", fill=(200, 200, 210), font=font)

    out = out_dir / f"grid_t{t:07.3f}.jpg".replace(".", "_", 1)
    canvas.save(out, quality=92)
    return out


# ----------------------------------------------------------- audio analysis

def analyze_audio(path, outdir, duration, hop_ms=50):
    sr = 16000
    wav = outdir / "audio.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-vn",
         "-ac", "1", "-ar", str(sr), str(wav)])
    raw = run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1",
               "-ar", str(sr), "-f", "s16le", "-"])
    if raw.returncode != 0 or not raw.stdout:
        return None, None, sr
    x = np.frombuffer(raw.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    hop = int(sr * hop_ms / 1000)
    n = len(x) // hop
    rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(axis=1))
    hz = 1000 / hop_ms

    db = 20 * np.log10(np.maximum(rms, 1e-6))
    quiet = db < -45
    silences, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j + 1 < n and quiet[j + 1]:
                j += 1
            if (j - i + 1) / hz >= 0.3:
                silences.append([round(i / hz, 2), round((j + 1) / hz, 2)])
            i = j + 1
        else:
            i += 1

    flux = np.maximum(0, np.diff(rms, prepend=rms[0]))
    thresh = float(np.median(flux) + 3 * (np.median(np.abs(flux - np.median(flux))) or 1e-6))
    onsets = []
    for i in range(1, n - 1):
        if flux[i] > thresh and flux[i] >= flux[i - 1] and flux[i] > flux[i + 1]:
            t = round(i / hz, 2)
            if not onsets or t - onsets[-1] > 0.12:
                onsets.append(t)

    return {
        "wav": str(wav.relative_to(outdir)),
        "rms_hz": hz,
        "peak_dbfs": round(float(db.max()), 1),
        "mean_dbfs": round(float(db[db > -60].mean()) if (db > -60).any() else -60, 1),
        "silences": silences,
        "onsets": onsets,
    }, rms, hz


# ------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Decompose a video into shots for analysis.")
    ap.add_argument("video")
    ap.add_argument("-o", "--outdir", default=None,
                    help="output directory (default: <video-stem>.teardown)")
    ap.add_argument("--sample-fps", type=float, default=10.0,
                    help="analysis sampling rate, raise for very fast cutting (default 10)")
    ap.add_argument("--sensitivity", type=float, default=4.0,
                    help="cut detection z-threshold, lower finds more cuts (default 4)")
    ap.add_argument("--floor", type=float, default=0.035,
                    help="minimum frame difference to count as a cut (default 0.035)")
    ap.add_argument("--min-shot", type=float, default=0.35,
                    help="shots shorter than this merge into the previous one (default 0.35s)")
    ap.add_argument("--max-beat", type=float, default=2.5,
                    help="scenes longer than this are subdivided into beats (default 2.5s)")
    ap.add_argument("--min-beat", type=float, default=0.6,
                    help="minimum spacing between beats inside a scene (default 0.6s)")
    ap.add_argument("--beat-sensitivity", type=float, default=2.2,
                    help="beat detection z-threshold, lower finds more beats (default 2.2)")
    ap.add_argument("--no-beats", action="store_true",
                    help="skip beat subdivision, report hard cuts only")
    ap.add_argument("--frames-per-shot", type=int, choices=[1, 2, 3], default=3)
    ap.add_argument("--frame-width", type=int, default=960)
    ap.add_argument("--sheet-cols", type=int, default=4)
    ap.add_argument("--sheet-rows", type=int, default=3)
    ap.add_argument("--no-audio", action="store_true")
    ap.add_argument("--zoom", metavar="START:END",
                    help="drill into one time range instead of running the full pass, "
                         "e.g. --zoom 8.2:10.1")
    ap.add_argument("--zoom-every", type=float, default=0.2,
                    help="seconds between frames in zoom mode (default 0.2)")
    ap.add_argument("--inspect", type=float, metavar="T",
                    help="one large still at time T with a normalized coordinate "
                         "grid, for reading component layout, then exit")
    ap.add_argument("--grid-step", type=float, default=0.1,
                    help="grid spacing as a fraction of the frame (default 0.1)")
    args = ap.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            die(f"{tool} not found on PATH")

    src = Path(args.video).expanduser().resolve()
    if not src.exists():
        die(f"no such file: {src}")
    outdir = Path(args.outdir).expanduser() if args.outdir else \
        src.parent / f"{src.stem}.teardown"
    outdir.mkdir(parents=True, exist_ok=True)

    meta = probe(src)
    print(f"[1/5] {meta['width']}x{meta['height']} @ {meta['fps']}fps, "
          f"{meta['duration']:.1f}s", file=sys.stderr)

    if args.inspect is not None:
        if not 0 <= args.inspect <= meta["duration"]:
            die(f"--inspect must fall inside 0..{meta['duration']:.2f}s")
        print(inspect_frame(src, outdir, args.inspect, max(args.frame_width, 1280),
                            args.grid_step))
        return

    if args.zoom:
        try:
            za, zb = (float(v) for v in args.zoom.split(":"))
        except ValueError:
            die("--zoom expects START:END in seconds, e.g. 8.2:10.1")
        if not 0 <= za < zb <= meta["duration"]:
            die(f"--zoom range must fall inside 0..{meta['duration']:.2f}s")
        out = zoom_sheet(src, outdir, za, zb, args.zoom_every,
                         args.frame_width, args.sheet_cols)
        print(out)
        return

    aw = 160
    ah = max(2, int(aw * meta["height"] / meta["width"]) // 2 * 2)
    frames = sample_frames(src, args.sample_fps, aw, ah)
    shots, events, motion = detect_boundaries(
        frames, args.sample_fps, args.sensitivity, args.floor, args.min_shot)

    segments, beat_marks = [], []
    for si, (a, b) in enumerate(shots):
        splits = [] if args.no_beats or (b - a) <= args.max_beat else \
            find_beats(motion, args.sample_fps, a, b, args.min_beat, args.beat_sensitivity)
        beat_marks.extend(splits)
        edges = [a] + splits + [b]
        for bi, (p, q) in enumerate(zip(edges[:-1], edges[1:])):
            segments.append({
                "id": f"S{si:02d}b{bi}" if len(edges) > 2 else f"S{si:02d}",
                "scene": si, "beat": bi,
                "start": round(p, 3), "end": round(q, 3),
                "boundary_in": "scene" if bi == 0 else "beat",
            })
    print(f"[2/5] {len(shots)} scenes, {len(segments)} beats, "
          f"{len(events)} boundary events", file=sys.stderr)

    keyframes = extract_keyframes(src, segments, outdir, args.frame_width,
                                  args.frames_per_shot)
    print(f"[3/5] extracted {sum(len(k) for k in keyframes)} keyframes", file=sys.stderr)

    sheets = contact_sheets(segments, keyframes, outdir, args.sheet_cols,
                            args.sheet_rows, args.frame_width // 2)
    print(f"[4/5] {len(sheets)} contact sheets", file=sys.stderr)

    audio, rms, rms_hz = (None, None, None)
    if meta["has_audio"] and not args.no_audio:
        audio, rms, rms_hz = analyze_audio(src, outdir, meta["duration"])

    onsets = audio["onsets"] if audio else []
    plot = timeline_plot(outdir, meta["duration"], motion, args.sample_fps,
                         rms, rms_hz or 20, shots, beat_marks, onsets)

    for i, seg in enumerate(segments):
        a, b = seg["start"], seg["end"]
        lo, hi = int(a * args.sample_fps), max(int(a * args.sample_fps) + 1,
                                              int(b * args.sample_fps) - 1)
        win = motion[lo:hi] if hi <= len(motion) else motion[lo:]
        m_mean = float(win.mean()) if len(win) else 0.0
        mid = next((k for k in keyframes[i] if k["label"] == "mid"), keyframes[i][0])
        img = Image.open(outdir / mid["path"]).convert("RGB")
        gray = np.asarray(img.convert("L"), dtype=np.float32)

        seg["duration"] = round(b - a, 3)
        seg["motion"] = {"mean": round(m_mean, 4),
                         "max": round(float(win.max()) if len(win) else 0.0, 4),
                         "class": motion_class(m_mean)}
        seg["brightness"] = round(float(gray.mean()) / 255, 3)
        seg["contrast"] = round(float(gray.std()) / 255, 3)
        seg["palette"] = palette(img)
        seg["keyframes"] = [k["path"] for k in keyframes[i]]

        nxt = next((e for e in events if abs(e["start_t"] - b) < 0.25), None)
        seg["transition_out"] = {
            "kind": nxt["kind"] if nxt else ("beat" if i + 1 < len(segments) else "end"),
            "duration": round(nxt["end_t"] - nxt["start_t"], 2) if nxt else 0.0,
        }
        if onsets:
            seg["nearest_onset_delta"] = round(min(abs(o - a) for o in onsets), 2)
        if audio and rms is not None:
            lo_a, hi_a = int(a * rms_hz), max(int(a * rms_hz) + 1, int(b * rms_hz))
            win_a = rms[lo_a:hi_a]
            if len(win_a):
                seg["loudness_dbfs"] = round(
                    float(20 * np.log10(max(float(win_a.mean()), 1e-6))), 1)

    durs = [s["duration"] for s in segments]
    scene_durs = [round(b - a, 3) for a, b in shots]
    manifest = {
        "video": meta,
        "settings": {"sample_fps": args.sample_fps, "sensitivity": args.sensitivity,
                     "min_shot": args.min_shot, "max_beat": args.max_beat,
                     "beat_sensitivity": args.beat_sensitivity},
        "pacing": {
            "scene_count": len(shots),
            "beat_count": len(segments),
            "median_beat": round(float(np.median(durs)), 2),
            "mean_beat": round(float(np.mean(durs)), 2),
            "shortest_beat": round(min(durs), 2),
            "longest_beat": round(max(durs), 2),
            "median_scene": round(float(np.median(scene_durs)), 2),
            "beats_per_second": round(len(segments) / meta["duration"], 2),
            "hard_cuts": sum(1 for e in events if e["kind"] == "cut"),
            "transitions": sum(1 for e in events if e["kind"] == "transition"),
        },
        "scenes": [{"index": i, "start": round(a, 3), "end": round(b, 3),
                    "duration": round(b - a, 3),
                    "beats": [s["id"] for s in segments if s["scene"] == i]}
                   for i, (a, b) in enumerate(shots)],
        "beats": segments,
        "audio": audio,
        "sheets": sheets,
        "timeline": plot,
    }
    (outdir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"[5/5] wrote {outdir}/manifest.json", file=sys.stderr)
    print(outdir)


if __name__ == "__main__":
    main()
