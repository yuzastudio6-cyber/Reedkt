# Internal Testing QA Wrapper

## Decision

`internal_testing_qa_wrapper_passed_ready_for_repeated_local_internal_testing`

## Summary

This milestone adds `npm run qa:internal-testing` as the single local command for repeated internal testing of the current production-shaped mock UI path.

The wrapper runs the safe smoke checks for Edit Preferences, Preference Video limits, Project Edit Brief internal testing, Project Edit Brief mock E2E, and beta readiness. It then starts a local Vite server, runs focused Playwright checks for `/internal-testing` and `/edit-preferences`, and shuts the server down.

## Boundaries

- No upload or file-byte read.
- No reference URL fetch or media processing.
- No Qwen, DeepSeek, provider, worker, render/export, or credit execution.
- No live Supabase read/write, Storage, signed URL, SQL, or migration.
- No external beta, real-user-media beta, paid production, or product-ready claim.

The wrapper fails fast when explicit live/runtime enablement environment flags are set.

## Command

```bash
npm run qa:internal-testing
```

Optional local port override:

```bash
INTERNAL_TESTING_QA_PORT=4341 npm run qa:internal-testing
```

## Validation

- `npm run qa:internal-testing`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run smoke:preference-video-mock-limits-internal-testing-closeout`
- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run smoke:edit-preferences-route-entrypoint`
- `npm run smoke:beta-readiness`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
