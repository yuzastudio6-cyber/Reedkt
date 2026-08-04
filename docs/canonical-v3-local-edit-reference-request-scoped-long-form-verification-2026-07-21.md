# Canonical V3 Local Request-Scoped Edit Reference Study — 2026-07-21

Status: `local_signed_in_request_path_verified_production_blocked`

This slice connects the mounted signed-in Edit Reference upload and whole-video
study flow to the isolated canonical V3 PostgreSQL authority. It does not
modify the frozen historical `supabase/migrations/` chain and does not perform
any remote Supabase, cloud, provider, billing, deployment, or public action.

## Mounted path

The existing `/preferences` library and Study Chat remain the only product
surface. For each authenticated HTTP request, the backend now:

1. validates the real signed-in user and workspace write membership through
   the local Supabase Auth/RLS boundary;
2. finalizes the private upload through a process-branded server-only media
   authority and verifies its checksum before accepting it as study evidence;
3. probes the exact private bytes and derives immutable storage, media, and
   source lineage on the server;
4. registers that finalized source in `preference_assets` before any durable
   pre-plan enqueue;
5. creates or resumes the long-form run through the one canonical distributed
   pre-plan state port;
6. records start, pause, resume, cancel, or recovery as an append-only domain
   event rather than mutating the immutable evidence asset;
7. projects the latest verified long-form summary into the existing
   Preference aggregate after reload; and
8. keeps cross-user status and control requests denied by the exact tenant
   boundary.

The browser never supplies storage generation, storage ETag, checksum,
duration, audio presence, plan identity, work-item counts, or run state as an
authority. Those values are re-read and rebound by the server and SQL
transactions before the user-facing projection is committed.

## Reliability and recovery

The source registration is idempotent and conflict detecting. The distributed
run remains resumable without a browser session or fixed whole-study timeout.
The domain projection is append-only, ordered per reference asset, linked to
the exact run revision and assistant message, and covered by the existing
domain receipt/audit ledger. Exact committed receipts reconstruct the same
aggregate after response loss instead of rerunning the source registration or
creating a second run.

The mounted Chromium proof covers:

- signed-in private video upload and finalization;
- durable study creation and visible checkpointed progress;
- status read by the owner and denial for a second user/workspace;
- denial of the second user's control attempt;
- pause, reload, preserved progress, and resume from the same run; and
- exact library/Study Chat/DNA/QA/approval behavior on the same database
  reset.

The SQL postconditions verify immutable source/event rows, role grants,
run/plan/source/message lineage, latest-event aggregate projection, and the
absence of direct browser mutation authority.

The uninterrupted local verification applied 12 isolated migrations and
restored 50 reviewed data tables after a destructive reset. The backup
archive SHA-256 was
`9f6cdb10ccd0eaec1e09161e6c4bbe9796aff725ebd5cc11114ac870d0bf62fe`, and
the restored logical-state SHA-256 was
`345ec3cfa777672d3ec263119133785eb00a00b8fed596fecbe6329f60dfc5d2`.
The final frozen source manifest verifies 141 files, including the mounted
upload authorization and idempotency regression proof.

## Deliberately closed gates

This is local loopback evidence only. The runtime deliberately reports
`productionAuthority: false`. Real worker dispatch, private-object reads from
a deployed worker, multi-replica lease recovery, provider execution,
provider/checkback/cost qualification, deployed Auth/RLS/Storage, same-SHA
staging recovery, customer pricing, credits, service fees, wallet mutation,
billing, deployment, and public delivery remain closed.

The long-form run and the Edit Reference domain event are currently committed
by two separate local transactions. Exact replay and reconciliation are
verified, but a future same-release hosted adapter must supply the reviewed
cross-authority transaction/outbox boundary before production promotion.

The exact-edit target-study source authority also remains a separate release
gate; this slice registers library Preference evidence only and does not
fabricate target-source media authority.

`productionReady` remains `false`.
