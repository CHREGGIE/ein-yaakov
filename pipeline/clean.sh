#!/bin/bash
# Usage: ./clean.sh input.m4a output.mp3
# Two-pass version of the tested preset: pass 1 measures loudness after the
# rumble/hum/noise filters, pass 2 normalizes linearly to -16 LUFS from those
# measurements, then limits peaks and encodes to the published MP3 spec.
set -euo pipefail
IN="$1"; OUT="$2"
PRE="highpass=f=80:poles=2,equalizer=f=60:t=q:w=8:g=-8,equalizer=f=120:t=q:w=8:g=-8,afftdn=nr=10:nf=-50:tn=1"
TARGET="I=-16:TP=-2:LRA=11"

M=$(ffmpeg -hide_banner -nostats -i "$IN" -af "$PRE,loudnorm=$TARGET:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$M" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
LN="loudnorm=$TARGET:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true"
POST="$LN,alimiter=limit=0.708:level=disabled,aresample=44100"

ffmpeg -hide_banner -nostats -loglevel error -y -i "$IN" -af "$PRE,$POST" -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k "$OUT"
