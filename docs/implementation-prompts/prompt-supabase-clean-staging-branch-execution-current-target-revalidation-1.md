# SUPABASE-CLEAN-STAGING-BRANCH-EXECUTION-CURRENT-TARGET-REVALIDATION-1

Use this after `SUPABASE-CLEAN-STAGING-TARGET-OWNER-APPROVAL-1` is merged.

## Scope

Run only against a clean non-production staging branch/project. Do not mutate production or the current divergent staging target.

The execution packet must:

- include an explicit confirmation gate;
- name the clean target;
- verify safe credential context without printing payloads;
- apply the reviewed migration chain only to the clean target;
- run migration history, RLS, storage, worker RPC, and artifact/readback checks;
- produce sanitized reports and checksums;
- keep public artifacts, signed URL source-of-truth flows, worker/provider execution, and beta unlocks blocked until their own gates pass.

If the clean target cannot be selected or created safely, stop with the exact blocker and do not fall back to mutating the divergent existing staging database.
