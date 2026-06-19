# PR #305 npm ci Hydration Attempt

Command run in disposable PR #305 worktree:

```bash
npm ci --ignore-scripts --no-audit --no-fund
```

Result: `hydration_completed`.

- Target head: `757686f49d85cb7d346b55a1712e1d34a6bdde03`.
- Disposable worktree: `/private/tmp/reeditpro-pr-305-hydration-validation`.
- Started: `2026-06-19T15:39:15.931Z`.
- Ended: `2026-06-19T15:39:20.430Z`.
- Duration: `4499ms`.
- Exit code: `0`.
- Timeout cap: `1800000ms`.
- Hung: `false`.
- Interrupted: `false`.
- Package file mutation: `false`.
- Required tool binaries after hydration: `tsx`, `eslint`, `tsc`, and `vite` all present.

The safe npm output consisted of three `uuid` deprecation warnings and `added 755 packages in 4s`.

No PR #305 validation commands were run after hydration. PR #305 still requires a separate validation rerun before any merge-ready claim.
