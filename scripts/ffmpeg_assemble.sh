#!/usr/bin/env bash
# FFmpeg video assembly script for YouTube Shorts
# Usage: ./ffmpeg_assemble.sh output.mp4 audio.mp3 clip1.mp4 clip2.mp4 [clip3.mp4 ...]

set -e  # Exit on error

OUT=$1
AUDIO=$2
shift 2
CLIPS=("$@")

# Validate inputs
if [ -z "$OUT" ] || [ -z "$AUDIO" ] || [ ${#CLIPS[@]} -eq 0 ]; then
  echo "Usage: $0 output.mp4 audio.mp3 clip1.mp4 clip2.mp4 [clip3.mp4 ...]"
  exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg is not installed"
  exit 1
fi

# Create output directory if it doesn't exist
OUT_DIR=$(dirname "$OUT")
if [ ! -d "$OUT_DIR" ]; then
  mkdir -p "$OUT_DIR"
fi

# Validate input files exist
if [ ! -f "$AUDIO" ]; then
  echo "Error: Audio file not found: $AUDIO"
  exit 1
fi

for clip in "${CLIPS[@]}"; do
  if [ ! -f "$clip" ]; then
    echo "Error: Video clip not found: $clip"
    exit 1
  fi
done

# Create temporary concat file
CONCAT_FILE=$(mktemp /tmp/concat_XXXXXX.txt)
trap "rm -f $CONCAT_FILE" EXIT

# Write concat file (use absolute paths to avoid issues)
> "$CONCAT_FILE"
for clip in "${CLIPS[@]}"; do
  ABS_PATH=$(cd "$(dirname "$clip")" && pwd)/$(basename "$clip")
  echo "file '$ABS_PATH'" >> "$CONCAT_FILE"
done

echo "Concatenating ${#CLIPS[@]} video clips..."
echo "Audio file: $AUDIO"
echo "Output: $OUT"

# Concatenate videos and overlay audio
# Scale to 1080x1920 (vertical format for Shorts)
# Use force_original_aspect_ratio=decrease to maintain aspect ratio
# Pad to exact dimensions if needed
ffmpeg -f concat -safe 0 -i "$CONCAT_FILE" \
  -i "$AUDIO" \
  -c:v libx264 \
  -c:a aac \
  -shortest \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p" \
  -r 30 \
  -preset medium \
  -crf 23 \
  -b:a 128k \
  -y \
  "$OUT"

# Clean up concat file
rm -f "$CONCAT_FILE"

echo "Video assembly complete: $OUT"




