---
name: remake-an-edit
description: Decompile a reference edit (ad, poem film, promo) into a beat map, then rebuild it on a new theme with Remotion visuals, a SuperCollider score cut to the same beats, and an ElevenLabs voiceover. Use when asked to "make one like this", clone an edit's pacing, or re-skin this repo's film.
---

# Remake an edit

1. **Decompile.** `python3 tools/teardown.py ref.mp4 -o ref.teardown`, then `--zoom A:B --zoom-every 0.15` over every section. Read the strips, not guesses. Write `reference/TEARDOWN.md` (beat table, verbatim copy, motion vocabulary) and `template.json`. Transcribe the VO (faster-whisper) to get word timings.
2. **Keep the timing, swap the nouns.** Same beat count, same durations, same cut points. Write the new copy so its rhythm matches the original lines.
3. **Picture** (`film/`): every scene works in absolute seconds from `src/theme.ts`, pure function of the frame. Assets: pixel sprites + thermal plates via image generation (`film/assets/prompts/`), then threshold alpha and fill holes.
4. **Sound** (`score/`): edit `score.scd` (events placed by absolute time on the cut list), `vo.sh` for new lines, `render.sh` to render + mix. Duck music ~6 dB under VO.
5. **Review loop.** Render at `--scale=0.5`, run teardown `--zoom` on your own render, compare strips to the reference, fix numbers, repeat. Two passes minimum.

Never commit API keys (`.env` is ignored) or the reference footage.
