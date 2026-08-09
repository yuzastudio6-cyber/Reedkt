# Post-CAP-20 Canonical Sequential-Resume Read

Milestone: `POST-CAP-20-CANONICAL-SEQUENTIAL-RESUME-READ`

Status: `caption_consumer_frozen_actual_backend_records_pending`

Caption adapter digest:
`ca8b96817e5525fbfb842d5bbc312dc4fbdf55eee44306e7d2d281247051e5be`.

## Outcome

Caption can now validate and summarize the canonical backend's create-only
sequential specialist-support ledger without importing its implementation or
casting the older incompatible backend V1 wire into Caption's V1 wire.

The shared public type file
`src/types/canonical-specialist-support-resume.ts` is byte-for-byte identical
to the backend source at the frozen commit. Its SHA-256 is
`d2b6128e26bf0a12d66d017f3f6608fc4656fddfa818dbb9a7bfdec8a44137e5`.

## Frozen backend source

- repository: `yuzastudio6-cyber/Reedkt`;
- branch: `codex/backend-workflow-pipeline-continuation`;
- commit: `832f56fc41c90413f6c99cc70d5cd658c8e44675`;
- tree: `14dd5359078c3abbf9a0e524fd6b1d037574d238`;
- authenticated owner projection:
  `canonical-authenticated-specialist-support-artifact-projection-v1`;
- resume record: `canonical-specialist-support-resume-record-v1`;
- call/result pair: `canonical-specialist-call-result-pair-v1`.

The adapter receipt also freezes the exact hashes of the backend's copied
Caption generic public types/parser and closed validator. Caption imports no
backend service or repository code.

## Validation

For every canonical resume record, Caption verifies:

- prior and resumed call/result digests and exact scope, manifest,
  qualification, replay, and producer lineage;
- that the selected request is the first deterministic support-request member;
- exact original-call, request, owner-result, approved-snapshot, and canonical
  scope refs in the authenticated owner projection;
- one exact artifact per requested type, produced by the selected owner and
  bound to the selected request;
- only the current owner result is injected;
- all prior owner artifacts are promoted to canonical inputs with their
  immediate request link cleared;
- step ordinals, prior/resumed chain continuity, and a 32-step bound; and
- all peer-dispatch, timeline, provider, runtime, asset, cost, final-QA,
  public, and production authority flags remain false.

`caption-canonical-specialist-resume-sequence-v1` summarizes a complete chain
only when the last result is no longer `needs_followup`. It binds the initial
and final call/result refs, every canonical record ref, deterministic owner
order, and the exact sequence digest.

## Verification

The focused smoke passes 24 checks. Its two-owner fixture proves the required
`track_all` then `visual_intelligence` chain for Caption safe-region planning.
It rejects stale records, crossed owners, crossed artifact/request refs,
missing prior-owner promotion, crossed initial chains, reversed records,
truncated `needs_followup` chains, authority overclaims, unsafe paths,
inherited fields, and cycles.

This is contract evidence only. No backend persistence service, owner-result
adapter, provider, model, media runtime, billing, public, or production action
is executed.

## Remaining gate

`actualCanonicalResumeRecordConsumed` remains `false`. Internal end-to-end
qualification still requires the canonical backend to mount the Caption call,
persist/reread real owner projections and resume records, and supply those
records to this consumer. Synthetic contract fixtures cannot satisfy that gate.
