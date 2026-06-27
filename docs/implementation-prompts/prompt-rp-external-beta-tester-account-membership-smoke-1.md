# RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1

Use this prompt only after an actual external tester account has been added to `external-beta-testers@reeditpro.com`.

Prerequisite source:

- `RP-EXTERNAL-BETA-OWNER-MEMBER-SMOKE-READBACK-1`
- decision `completed_owner_member_group_access_smoke_readback_external_tester_membership_still_pending`
- external tester member count `0` at owner-member readback time

Required future scope:

- read-only Google Group membership readback;
- verify the named tester account is a member;
- safe authenticated tester-account `GET` smoke for `/health`, `/ready`, and `/api/runtime/status`;
- unauthenticated `/health` remains `403`;
- no broad IAM, no production IAM, no public artifacts, no signed URL source-of-truth, no provider/model calls, no workers, no Supabase mutation, no SQL, no media processing, no paid production, no final delivery/export.

If no actual external tester account is present, keep the gate blocked with `blocked_pending_actual_external_tester_account_membership`.
