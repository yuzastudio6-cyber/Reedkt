# MERGE-0 Milestone Post-Merge Checklist

Status: `merge_readiness_packet_created`.

After any milestone PR is merged, perform these checks before claiming the milestone is complete:

- Verify the merge commit or squash commit exists.
- Verify the intended base branch contains the merged change.
- Verify downstream branches that used the merged head as a base are queued for rebase, merge, or retargeting.
- Update source-of-truth docs.
- Update the implementation tracker or implementation prompt record when present.
- Update blocker inventory.
- Update beta readiness scorecard.
- Update Supabase milestone sync classification; keep `docs/status only` unless an approved Supabase path actually ran.
- Confirm no duplicate or superseded PR remains active without a disposition.
- Mark the next PR ready only if parent, validation, checks, and no-scope requirements are satisfied.
- Preserve the no-scope statement when no runtime action occurred.
