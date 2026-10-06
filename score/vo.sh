#!/usr/bin/env bash
# Regenerate the voiceover lines with ElevenLabs. Optional: the takes are already in score/vo/.
#   ELEVENLABS_API_KEY=... ./vo.sh            (or put it in ../.env)
set -euo pipefail
cd "$(dirname "$0")"
[[ -f ../.env ]] && set -a && . ../.env && set +a
: "${ELEVENLABS_API_KEY:?set ELEVENLABS_API_KEY (see .env.example)}"
VOICE="${ELEVENLABS_VOICE_ID:-bIHbv24MWmeRgasZH58o}"   # "Will": young, relaxed

gen() {
	curl -sf -o "vo/$1.mp3" "https://api.elevenlabs.io/v1/text-to-speech/$VOICE?output_format=mp3_44100_128" \
		-H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" \
		-d "{\"text\": \"$2\", \"model_id\": \"eleven_multilingual_v2\", \"voice_settings\": {\"stability\": 0.55, \"similarity_boost\": 0.8, \"style\": 0.15, \"speed\": 0.95}}"
	echo "vo/$1.mp3"
}
mkdir -p vo
gen l1  "How do you speak, when you can't say a word?"
gen l2a "You don't."
gen l2b "You just think it."
gen l3  "Through signal... intention... language."
gen l4  "Through one's own mind, straight to text."
