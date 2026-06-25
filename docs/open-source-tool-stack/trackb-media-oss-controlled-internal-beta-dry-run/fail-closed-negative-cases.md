# Fail-Closed Negative Cases

The dry-run diagnostics reject payloads that miss an approved snapshot, set `executionEnabled: true`, carry signed/public URL-like artifact paths, or include raw prompt metadata.

These checks are source-of-truth contract checks only. They do not execute tools, dispatch workers, or touch private artifacts.
