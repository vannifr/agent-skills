#!/bin/sh
git diff --name-only "${CI_PREV_COMMIT_SHA:-}..${CI_COMMIT_SHA}" 2>/dev/null | cut -d/ -f1 | sort -u
echo "no changed directories" >&2
