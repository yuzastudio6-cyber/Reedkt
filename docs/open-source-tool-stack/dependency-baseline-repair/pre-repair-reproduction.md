# Pre-Repair Reproduction

Command: `npm ci --dry-run --ignore-scripts --no-audit --no-fund`.

Result: `failed_without_tracked_file_mutation`.

Recorded blockers:

- missing @emnapi/runtime@1.11.1
- missing @emnapi/core@1.11.1
- invalid @emnapi/wasi-threads@1.2.1 not satisfying 1.2.2
- missing @emnapi/core@1.10.0
- missing @emnapi/runtime@1.10.0
- missing @emnapi/wasi-threads@1.2.1

No dependency tree was installed during this reproduction step.
