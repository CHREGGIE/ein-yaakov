#!/bin/bash
# Usage: ./measure.sh file.mp3  ->  prints "integrated_LUFS true_peak_dBTP"
# A file passes the published spec at -16 ±1 LUFS and true peak <= -1 dBTP.
set -euo pipefail
ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | awk '/Integrated loudness:/{f=1} f&&/ I:/{i=$2} /True peak:/{t=1} t&&/Peak:/{p=$2} END{print i, p}'
