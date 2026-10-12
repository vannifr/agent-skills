# Agent rules

Protected paths: `.woodpecker.yml`, `.githooks/` and `scripts/selftest.sh`
are covered by the signed protected manifest. An AI session must not commit
changes to them, also not on explicit request; changes go to the owner as a
patch with a handover note.
