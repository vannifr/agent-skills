#!/bin/sh
set -eu
tmp=$(mktemp -d)
git init -q "$tmp"
git -C "$tmp" config user.email t@example.invalid
git -C "$tmp" config user.name t
printf 'key = "%s%s"\n' ghp_ Q7vK2mX9aB4nR8tL1cZ6wE3yU5hJ0dFgS2pA > "$tmp/planted.txt"
git -C "$tmp" add planted.txt
git -C "$tmp" commit -q -m planted
gitleaks git --redact "$tmp" && exit 1
rm -rf "$tmp"
