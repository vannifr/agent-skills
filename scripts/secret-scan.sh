#!/bin/sh
set -eu

scan() {
    dir=$1
    report=$(mktemp)
    log=$(mktemp)
    rc=0
    set -- --source "$dir" --no-color --redact --verbose --report-format json --report-path "$report"
    if [ -n "${SCAN_BASELINE:-}" ]; then
        set -- "$@" --baseline-path "$SCAN_BASELINE"
    fi
    gitleaks detect "$@" >"$log" 2>&1 || rc=$?
    cat "$log"
    SCAN_RC=$rc
    SCAN_REPORT=$report
    SCAN_SCANNED=$(sed -n 's/.* \([0-9][0-9]*\) commits scanned.*/\1/p' "$log" | tail -1)
}

selftest() {
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    git -C "$tmp" init -q
    git -C "$tmp" config user.email t@example.invalid
    git -C "$tmp" config user.name t
    printf 'clean\n' >"$tmp/clean.txt"
    git -C "$tmp" add clean.txt
    git -C "$tmp" commit -q -m clean
    scan "$tmp"
    [ "$SCAN_RC" -eq 0 ] || { echo "selftest: clean repo must pass"; exit 1; }
    p1=ghp_
    p2=Q7vK2mX9aB4nR8tL1cZ6wE3yU5hJ0dFgS2pA
    printf 'token = "%s%s"\n' "$p1" "$p2" >"$tmp/planted.txt"
    git -C "$tmp" add planted.txt
    git -C "$tmp" commit -q -m planted
    scan "$tmp"
    [ "$SCAN_RC" -ne 0 ] || { echo "selftest: planted secret must fail"; exit 1; }
    grep -q '"RuleID"' "$SCAN_REPORT" || { echo "selftest: no finding in report (tool error?)"; exit 1; }
    echo "selftest ok: clean passes, planted secret reported"
}

if [ "${1:-}" = selftest ]; then
    selftest
    exit 0
fi

[ "$(git rev-parse --is-shallow-repository)" = false ] || { echo "FAIL: shallow clone, history incomplete"; exit 1; }
[ -z "$(git config --get remote.origin.partialclonefilter || true)" ] || { echo "FAIL: partial clone, history incomplete"; exit 1; }
SCAN_BASELINE=${GITLEAKS_BASELINE:-}
echo "baseline: ${SCAN_BASELINE:-none}"
expected=$(git log --format='COMMIT %H' --numstat | awk '/^COMMIT /{if(c&&f)n++; c=1; f=0; next} NF&&$1!="0"{f=1} END{if(c&&f)n++; print n+0}')
scan .
[ "$SCAN_RC" -eq 0 ] || exit "$SCAN_RC"
if [ -z "$SCAN_SCANNED" ] || [ "$SCAN_SCANNED" -le 0 ]; then
    echo "FAIL: scanner reported no commits scanned"
    exit 1
fi
[ "$SCAN_SCANNED" -ge "$expected" ] || { echo "FAIL: scanned $SCAN_SCANNED, expected at least $expected commits with added lines (shallow or partial clone?)"; exit 1; }
echo "secret scan covered $SCAN_SCANNED commits (at least $expected expected)"
