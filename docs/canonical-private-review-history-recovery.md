# Canonical Private Review History Recovery

Status: authenticated private single-host history/download and restart-read evidence

The canonical private-review history service reopens current and superseded private reviews from checksum-protected persistence without restoring execution authority to released reservations.

## Authenticated route

`GET /v1/edit-executions/private-review-history/:reviewAssemblyId/file`

The query binds the workspace, execution package, expected decision-manifest SHA-256, expected final-artifact SHA-256, and history-download purpose. The route requires authenticated workspace access and returns private no-store MP4 bytes with nosniff/sandbox headers.

## Read authority

The history service independently reopens and verifies:

1. the completed canonical private-review assembly and create-only manifest;
2. the completed review decision and create-only decision manifest;
3. exact package, snapshot, project, edit-session, plan-version, and final-artifact lineage;
4. current approved/reserved or superseded/released plan state;
5. the checksum-protected artifact/QA aggregate;
6. exactly one final MP4 artifact, passed QA record, and private-only reconciliation;
7. required received, quality, render-preflight, and final-QA gates;
8. the stored MP4 bytes through the canonical final-composition verifier.

It does not call active execution readiness. A superseded review can therefore be read for history while its normal active-execution download correctly remains blocked.

## Current executable evidence

The canonical lifecycle smoke proves:

- plan-v1 active download fails after its plan is superseded and reservation released;
- a mismatched decision-manifest expectation fails closed;
- authenticated history reopens plan v1 with `reviewState: superseded` and `reservationStatus: released`;
- the reopened bytes hash to the original final-artifact SHA-256;
- history also reopens the accepted current plan-v2 review;
- plan-v1 and plan-v2 history evidence and artifact identities differ;
- newly constructed service/context instances reproduce the exact history evidence and bytes;
- archived execution authority remains false;
- customer credit, billing, settlement, signed URL, and public URL actions remain false.

## Boundaries

This is private single-host recovery evidence, not deployed disaster recovery or production retention. It does not add Supabase, RLS, cloud storage, public sharing, provider calls, billing, settlement, customer charging, deployment, or production readiness.

The authenticated local/private named-edit browser now consumes the hash-bound history descriptor for exact current or superseded review playback without restoring execution authority. The next product integration gate is browser continuation from a structured revision into replacement-plan publication and fresh approval; real-user Supabase/storage and deployed operations remain separate gates.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
