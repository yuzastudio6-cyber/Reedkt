# Safe Retry Policy

No retry was performed because the initial approved command completed successfully.

If the hydration blocker returns in a later phase, a retry may only happen after removing disposable `node_modules`, and must use the same command:

```bash
npm ci --ignore-scripts --no-audit --no-fund
```

An isolated npm cache path and safe logging may be used if they are recorded. `npm install`, `npm rebuild`, lifecycle scripts, package-lock mutation, runtime execution, media processing, and product validation remain out of scope.
