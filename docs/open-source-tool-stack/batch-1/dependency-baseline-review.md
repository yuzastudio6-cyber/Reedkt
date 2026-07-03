# Dependency Baseline Review

Decision: `blocked_pending_package_lock_sync_review`.

The non-mutating dependency baseline command was: `npm ci --dry-run --ignore-scripts --no-audit --no-fund`. It returned the current source-branch lockfile mismatch without changing `package-lock.json` and without installing dependencies.

Required blocker facts:

- missing @emnapi/runtime@1.11.1
- missing @emnapi/core@1.11.1
- invalid @emnapi/wasi-threads@1.2.1 not satisfying 1.2.2
- missing @emnapi/core@1.10.0
- missing @emnapi/runtime@1.10.0
- missing @emnapi/wasi-threads@1.2.1

Next prompt: `DEPENDENCY_BASELINE_REPAIR_BEFORE_TOOL_BATCH_1`.
