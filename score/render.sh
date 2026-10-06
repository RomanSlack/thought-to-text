#!/usr/bin/env bash
# Render the score (SuperCollider NRT) and mix in the voiceover.
#   score/music.wav  -> music only
#   score/mix.wav    -> music + VO, also copied to film/public/audio/mix.wav
# Needs sclang + scsynth on PATH. Portable install: set SC_PREFIX (its usr/ dir) and SCLANG_CONF (a sclang conf.yaml).
set -euo pipefail
cd "$(dirname "$0")"
if [[ -n "${SC_PREFIX:-}" ]]; then
	export PATH="$SC_PREFIX/bin:$PATH"
	export LD_LIBRARY_PATH="$SC_PREFIX/lib/x86_64-linux-gnu:$SC_PREFIX/lib:${LD_LIBRARY_PATH:-}"
fi
export QT_QPA_PLATFORM=offscreen
timeout 600 sclang ${SCLANG_CONF:+-l "$SCLANG_CONF"} score.scd
python3 mix.py
