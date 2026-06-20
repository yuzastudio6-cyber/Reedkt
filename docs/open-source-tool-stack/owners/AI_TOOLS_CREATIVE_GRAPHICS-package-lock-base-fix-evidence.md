# AI_TOOLS_CREATIVE_GRAPHICS Package-Lock Base Fix Evidence

Decision: `package_lock_base_fix_passed_ready_for_ai_graphics_batch_1_execution_approval`

## Original `npm ci` Blocker

The base branch failed before installation because `package.json` and `package-lock.json` were not synchronized:

- Missing from lockfile: `@emnapi/runtime@1.11.1`
- Missing from lockfile: `@emnapi/core@1.11.1`
- Invalid lockfile entry: `@emnapi/wasi-threads@1.2.1` did not satisfy `@emnapi/wasi-threads@1.2.2`
- Missing from lockfile: `@emnapi/core@1.10.0`
- Missing from lockfile: `@emnapi/runtime@1.10.0`
- Missing from lockfile: `@emnapi/wasi-threads@1.2.1`

## Generated Sync Review

`npm install --package-lock-only --ignore-scripts --no-audit --fund=false` was used as a reference sync. Its generated diff fixed `@emnapi/*`, but also stripped unrelated `peer: true` metadata from unrelated packages. That broad generated diff was rejected.

## Accepted Minimal Diff

The accepted repair applies only the `@emnapi/*` package-lock entries and version correction required for `npm ci`:

- `packageLockMutationPerformed`: `true`
- `packageJsonMutationPerformed`: `true`
- `packageJsonDependencyMetadataMutationPerformed`: `false`
- `npmCiPassed`: `true`
- unrelated dependency churn detected: `false`

`package.json` mutation is limited to the validation script entry.

## Validation Evidence

`npm ci` passed after the accepted minimal repair. The command completed with existing audit/deprecation warnings only; no `npm audit fix`, dependency upgrade, Batch 1 dependency install, import smoke, or synthetic fixture execution was performed.
