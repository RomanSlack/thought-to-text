"""Place the ElevenLabs VO lines on the cut list, duck the music under them, write the film's soundtrack."""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = str(Path(__file__).resolve().parent)
FILM_AUDIO = Path(ROOT).parent / "film" / "public" / "audio" / "mix.wav"
DUR = 20.46


def load(path, ch=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x if ch == 1 else x.reshape(-1, ch)


def rms_frames(x, win=0.01):
    n = int(SR * win)
    frames = x[: len(x) // n * n].reshape(-1, n)
    return np.sqrt((frames ** 2).mean(1)), n


def speech_bounds(x, thresh_db=-40):
    r, n = rms_frames(x)
    on = np.where(20 * np.log10(r + 1e-9) > thresh_db)[0]
    return on[0] * n, (on[-1] + 1) * n


def split_at_pauses(x, parts, thresh_db=-40, min_gap=0.15):
    """Split a clip at its (parts - 1) longest silent gaps."""
    r, n = rms_frames(x)
    loud = 20 * np.log10(r + 1e-9) > thresh_db
    gaps, start = [], None
    for i, v in enumerate(loud):
        if not v and start is None:
            start = i
        if v and start is not None:
            if (i - start) * n / SR >= min_gap and start > 0:
                gaps.append((i - start, start, i))
            start = None
    cuts = sorted(sorted(gaps, reverse=True)[: parts - 1], key=lambda g: g[1])
    edges = [0] + [((a + b) // 2) * n for _, a, b in cuts] + [len(x)]
    return [x[edges[i]: edges[i + 1]] for i in range(parts)]


vo = np.zeros(int(SR * DUR) + SR, np.float32)


def place(clip, onset):
    s, e = speech_bounds(clip)
    pre = int(0.03 * SR)                       # keep a breath of attack
    seg = clip[max(0, s - pre): e + int(0.25 * SR)]
    at = int(onset * SR) - min(pre, s)
    vo[at: at + len(seg)] += seg
    print(f"  placed {len(seg) / SR:.2f}s at {onset:.2f}s")


# speech onsets taken from the original VO (whisper word timings) and the cut list
place(load(f"{ROOT}/vo/l1.mp3"), 0.05)
place(load(f"{ROOT}/vo/l2a.mp3"), 3.8)
place(load(f"{ROOT}/vo/l2b.mp3"), 5.10)
for part, t in zip(split_at_pauses(load(f"{ROOT}/vo/l3.mp3"), 3), [8.04, 9.9, 11.1]):
    place(part, t)                              # "Through signal," / "intention," / "language."
place(load(f"{ROOT}/vo/l4.mp3"), 14.1)           # lands "text." just before the T cut

vo = vo[: int(SR * DUR)]
vo *= 0.5 / np.abs(vo).max()

# music, ducked about 6 dB under the voice with a smoothed envelope
music = load(f"{ROOT}/music.wav", 2)[: len(vo)]
music = np.pad(music, ((0, len(vo) - len(music)), (0, 0)))
r, n = rms_frames(vo)
env = np.repeat((r > 0.01).astype(np.float32), n)
env = np.pad(env, (0, len(vo) - len(env)))
k = int(0.12 * SR)
env = np.convolve(env, np.ones(k) / k, mode="same")
duck = 1 - 0.5 * np.clip(env * 1.5, 0, 1)
mix = music * duck[:, None] + vo[:, None]
mix *= 0.95 / np.abs(mix).max()


def write(path, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(1 if x.ndim == 1 else x.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


write(f"{ROOT}/vo.wav", vo)
write(f"{ROOT}/mix.wav", mix)
FILM_AUDIO.write_bytes(Path(f"{ROOT}/mix.wav").read_bytes())
print(f"wrote vo.wav, mix.wav -> {FILM_AUDIO}")
