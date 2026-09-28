#!/usr/bin/env bash
# Scan every image in a directory for privacy-sensitive metadata: GPS
# position, serial numbers, author/owner names and the editing software.
# Harmless tags (orientation, resolution, colour profile) are not
# reported. Self-tests first: a copy with a known tag must be detected,
# otherwise the filter is broken and a clean result means nothing.
#
# To strip what it finds while keeping the colour profile and
# orientation:
#   exiftool -overwrite_original -all= -tagsfromfile @ -icc_profile -orientation <file>
#
# Usage: exif_scan.sh public/assets/img
# Requires exiftool.
set -u
dir="${1:?image directory}"
command -v exiftool >/dev/null || { echo "exiftool not installed"; exit 2; }

metadata() {
  exiftool -a -G1 -s -gps:all -SerialNumber -InternalSerialNumber \
    -LensSerialNumber -BodySerialNumber -Artist -Author -Creator -By-line \
    -OwnerName -CameraOwnerName -Software -CreatorTool -HistorySoftwareAgent \
    "$1" 2>/dev/null
}

sample=$(find "$dir" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) | head -1)
[ -n "$sample" ] || sample=$(find "$dir" -maxdepth 1 -type f -iname '*.png' | head -1)
if [ -n "$sample" ]; then
  tmp=$(mktemp -d)
  cp "$sample" "$tmp/"
  probe="$tmp/$(basename "$sample")"
  exiftool -q -overwrite_original -Artist="self-test" "$probe" 2>/dev/null
  if [ -z "$(metadata "$probe")" ]; then
    echo "SELF-TEST FAILED: a planted tag was not detected; fix the filter first"
    rm -rf "$tmp"
    exit 2
  fi
  rm -rf "$tmp"
fi

found=0
count=0
for f in "$dir"/*; do
  [ -f "$f" ] || continue
  count=$((count + 1))
  result=$(metadata "$f")
  if [ -n "$result" ]; then
    found=$((found + 1))
    echo "--- $f"
    echo "$result" | head -5
  fi
done
echo "$count files scanned, $found with sensitive metadata"
[ "$found" -eq 0 ]
