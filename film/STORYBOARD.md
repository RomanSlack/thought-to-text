# Thought to Text: storyboard

A 20.46s, 4:3 (1920x1440, 24fps) re-skin of the reference teardown (`../TEARDOWN.md`). The beat map and timings are identical to the reference; only the content changed. Every time below is absolute seconds and matches `src/theme.ts` and `audio/score.scd`.

| Time | Scene | On screen (verbatim) | VO (ElevenLabs "Will") |
| --- | --- | --- | --- |
| 0.00 to 2.00 | `open` | scrawled "How", bold "how" between red guides, redaction bar, "do you", a selection box, a "Speak" signature, then the sentence types on | "How do you speak, when you can't say a word?" |
| 2.00 to 3.80 | `question` | "how do you speak, when you can't say a word?" A cyan flare settles into a blue wedge, the first thoughts pop in, the vignette closes, then a warm glow and a red loop | |
| 3.80 to 6.20 | `head` | thermal profile head with an implant glow behind the ear. "you dont." then "you just think it." Ripples leave the implant on "think" | "You don't." (3.8) "You just think it." (5.1) |
| 6.20 to 8.30 | `ring` | 13 pixel-art thoughts in a rotating ring. Gold flashes on the heart, bulb and brain | |
| 8.30 to 9.20 | `signal` | BCI chip with a red spark, then it flips edge-on. "signal." | "Through signal," |
| 9.20 to 9.90 | `strip1` | bulb, neuron, heart, eye, moon | |
| 9.90 to 10.60 | `intention` | cursor with a red ribbon. "intention." | "intention," |
| 10.60 to 11.10 | `strip2` | keyboard, tile, robotic hand, headset, pencil | |
| 11.10 to 11.90 | `language` | speech bubble with red glyphs popping. "language." | "language." |
| 11.90 to 13.80 | `scatter` | the ring reforms, explodes, and ink blots black out the thoughts. Then "through" and a brush wipe | |
| 13.80 to 15.90 | `hand` | thermal hand reaching up, with letters lifting off the fingertips. "through ones / own mind, straight to" | "Through one's own mind, straight to text." (14.1) |
| 15.90 to 16.05 | `flick` | red dart on paper | |
| 16.05 to 17.20 | `spell` | T (brain), E (chip), X (cursor), T (letter tile), one per cut | |
| 17.20 to 20.46 | `coda` | blurred brush stroke, then scattered T E X T drift into a typed line with a caret. Red pen loops, then a push-in | (music drops out) |

## Rebuild

```bash
npm run studio                         # scrub
npm run render                         # -> out/thought-to-text.mp4
# audio: edit audio/score.scd, then
#   sclang (see ../score) renders audio/music.wav; python3 audio/mix.py -> audio/mix.wav
#   cp audio/mix.wav public/audio/mix.wav
```

Assets: sprites, thermal plates and the paper scan were generated with imagegen (`assets/*.jsonl` hold the prompts). The sprites were alpha-thresholded and hole-filled into `public/img/sprites/`.
