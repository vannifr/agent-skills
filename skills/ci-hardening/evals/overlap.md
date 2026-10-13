# Registry overlap

date: 2026-10-13
query: ci pipeline audit green gates verify nothing; secret scan zero commits scanned must-fail proof
closest: testland/multi-tool-finding-triage (gate over scanner reports) and vannifr/ci-local-parity (local and CI drift)
different: This skill audits whether each existing CI gate verifies anything, by requiring a non-zero count in the log and a must-fail proof per gate, while the closest matches generate pipelines, run one scanner or merge scanner reports.

The other results are pipeline generators, single-scanner wrappers or repository housekeeping sweeps. None audits gate effectiveness.
