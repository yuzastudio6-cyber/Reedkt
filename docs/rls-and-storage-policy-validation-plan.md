# RLS And Storage Policy Validation Plan

This plan defines local/staging test cases for future Supabase validation. It does not run migrations and does not connect to remote Supabase.

## A. Workspace/Member Access

| Test case | Setup | Expected result |
| --- | --- | --- |
| Owner can read own workspace/project | Create owner user, workspace, membership, project | Owner can select workspace, membership, project, chat, media metadata, plan summaries. |
| Member can read assigned workspace/project | Add member to workspace/project context | Member can select project-scoped records allowed by policy. |
| Non-member cannot read | Create unrelated user and project | Non-member selects return no rows. |
| Editor/member role differences | Create editor and viewer/member roles where supported | Editor can write allowed draft/project fields; viewer cannot mutate edit/source/execution state. |
| Workspace bootstrap safety | New user has no workspace | User cannot create privileged membership outside approved bootstrap path. |

## B. Project/Media/Source Sequence

| Test case | Setup | Expected result |
| --- | --- | --- |
| User can read own project media | Project member with media rows | Member reads media metadata but not private object data directly. |
| Non-member cannot read media | Unrelated user queries media | No rows returned. |
| Uploaded source order preserved | Insert uploaded clips/source sequence with explicit order | Source order query returns deterministic uploaded order. |
| Source sequence protected after approval | Mark plan/snapshot approved | Normal user cannot mutate source sequence in a way that changes the approved snapshot. |
| Storage object link required for ready media | Media marked ready without canonical object | Readiness validation fails or blocks downstream work. |

## C. Approved Snapshots

| Test case | Setup | Expected result |
| --- | --- | --- |
| Normal user cannot mutate snapshot JSON | Approved snapshot exists | Update/delete of immutable payload fails. |
| Backend/service-role creates snapshot | Use future service-role/local admin test harness | Snapshot creation succeeds only when gates pass. |
| Snapshot immutability validated | Attempt to change approved payload | Trigger/policy blocks mutation; audit behavior is preserved. |
| Snapshot references approved plan/credit/reservation | Create snapshot without required links | Creation gate fails. |
| New revision creates new snapshot/version | Approved snapshot plus material revision | Existing snapshot remains immutable; new approval path required. |

## D. Credits

| Test case | Setup | Expected result |
| --- | --- | --- |
| Ledger append-only | Existing ledger entry | Update/delete fails. |
| Reservation requires approved estimate | Estimate not approved | Reservation creation fails. |
| Spend/refund backend-only | Normal user attempts mutation | Mutation is blocked. |
| Normal user cannot mutate balance | User updates wallet/balance fields | Mutation is blocked. |
| Reservation links to approved snapshot before work | Job/provider/render request without active reservation | Execution gate fails. |

## E. Jobs/Workers

| Test case | Setup | Expected result |
| --- | --- | --- |
| Normal user cannot claim jobs | User attempts worker claim insert/update | Mutation blocked. |
| Worker claim backend/worker-only | Future worker identity claims job through backend path | Claim succeeds only after snapshot/credit/dependency gates. |
| Job events append-only | Existing event | Update/delete blocked. |
| Duplicate active claim blocked | Two claim attempts for one job | Only one active claim succeeds. |
| Stale heartbeat recovery planned | Expired claim/lease | Future backend may mark stale; normal user cannot. |

## F. Storage

| Test case | Setup | Expected result |
| --- | --- | --- |
| Private source media | Source object in `source-media` | Non-member cannot read; member access only through approved policy or signed route. |
| Signed URL events do not store signed URLs | Create signed URL event | Row stores metadata/expiry/request context, not signed URL value. |
| Canonical records store bucket/path only | Insert storage object record | Record contains bucket/path and safe metadata only. |
| Worker-temp cleanup planned | Temp worker object exists | Object is private and flagged for cleanup/lifecycle policy. |
| Generated/previews/exports private | Objects in generated/previews/exports buckets | Private by default; no anonymous public access. |
| Workspace/project path parsing | Test old and new object paths | Canonical path format is accepted; noncanonical paths do not grant unintended access. |

## G. Provider/Tool/Render

| Test case | Setup | Expected result |
| --- | --- | --- |
| Provider attempts backend-only | Normal user inserts/updates provider attempt | Mutation blocked. |
| Tool runtime checks backend/worker-only | Normal user writes readiness result | Mutation blocked. |
| Render job execution backend/worker-only | Normal user updates render job state | Mutation blocked. |
| QA report writes backend/worker-only | Normal user inserts blocking/passing QA result | Mutation blocked. |
| User can read relevant preview/QA summaries | Project member queries preview/QA | Sanitized project-scoped rows are readable. |
| Blocking QA blocks export | Render/export has blocking QA | Export readiness gate fails. |
