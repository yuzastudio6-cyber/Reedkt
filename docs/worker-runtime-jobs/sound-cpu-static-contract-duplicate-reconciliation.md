# SOUND CPU Static Contract Duplicate Reconciliation

## PR #672 Summary

PR #672, `[workers] SOUND CPU static contract plan`, is merged and remains the Worker Runtime owner-lane source of truth. Its merge commit is `f39db99f89a21634b8edc4fee38af39d2df05fbb`.

It owns the canonical static contract packet, job contract register, blocker register, payload/result schema plan, runtime policy placeholders, owner-review prompt, and existing `worker-runtime-jobs:sound-cpu-static-contract-plan:diagnostics` package script.

## PR #678 Summary

PR #678 is open/draft on the same branch. Its original title and file names made it look like a parallel static contract plan. The useful content is a matrix-style compatibility/report view and diagnostic coverage for that view.

## Overlap Table

| Area | PR #672 | PR #678 repaired state |
| --- | --- | --- |
| Source of truth | Yes | No |
| Static contract docs | Owns canonical docs | References #672 only |
| Job contract register | Owns canonical register | No replacement |
| Package diagnostic script | Owns canonical `:diagnostics` script | No duplicate alias |
| Matrix/report view | Not canonical matrix-style supplement | Compatibility supplement only |

## Unique Content From #678

- Compatibility matrix with row-level safety flags.
- Compatibility supplement report.
- Diagnostic validation for the supplement matrix.

## Decision

`retain_as_supplement`

PR #678 should remain draft and be reviewed only as a non-duplicating compatibility supplement. It must not be merged as a second owner-lane static contract plan.

## Final Action Taken

- Reframed PR #678 files as compatibility supplement artifacts.
- Removed the duplicate unsuffixed package script alias.
- Kept PR #672 as the source-of-truth owner-lane static contract plan.

## Safety Boundaries

No worker dispatch, worker claim, worker lease, worker execution, worker router call, job creation, tool execution, package import, media/audio processing, Dockerfile change, Docker build, GCP/Cloud Run call, Supabase mutation, SQL, migration, package-lock mutation, signed URL, public artifact, beta unlock, or production unlock is allowed by this reconciliation.
