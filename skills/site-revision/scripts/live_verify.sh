#!/usr/bin/env bash
# Verify a batch of changes on the live site.
#
# Usage: live_verify.sh https://example.org patterns.txt
#
# patterns.txt, one check per line (blank lines and # comments ignored):
#   present /path/  literal text that must appear
#   absent  /path/  literal text that must be gone
#
# Every request carries a cache-buster. For CSS/JS changes, check the
# hashed asset URL the page references instead (see references/ci-speedups.md).
# Run twice if the first run fails right after a deploy: edge caches can
# lag for a few seconds.
set -u
base="${1:?base URL}"
file="${2:?patterns file}"
pass=0
fail=0
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|'#'*) continue ;; esac
  mode=$(printf '%s' "$line" | awk '{print $1}')
  path=$(printf '%s' "$line" | awk '{print $2}')
  pattern=$(printf '%s' "$line" | cut -d' ' -f3- | sed 's/^ *//')
  body=$(curl -s "${base}${path}?cb=${RANDOM}${RANDOM}")
  if printf '%s' "$body" | grep -qF -- "$pattern"; then found=1; else found=0; fi
  if { [ "$mode" = present ] && [ $found = 1 ]; } || { [ "$mode" = absent ] && [ $found = 0 ]; }; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    echo "FAIL $mode $path :: $pattern"
  fi
done < "$file"
echo "PASS=$pass FAIL=$fail"
[ "$fail" -eq 0 ]
