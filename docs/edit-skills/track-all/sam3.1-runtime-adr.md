# ADR: Track All SAM 3.1 runtime

Decision: accepted for implementation, real inference blocked pending evidence.

## Decision

Preserve `tool.sam3_1.segment_and_track_subject.v1` as immutable historical authority. Add the forward-only Track All operation `tool.sam3_1.track_masklets.v2`. V2 owns a server-compiled session plan rather than accepting a model request.

The V2 plan permits only:

- exact private source and checkpoint leases;
- text concept, positive/negative points, bounding boxes, and exact object IDs;
- approved brush/reference-image evidence resolved before GPU dispatch, not caller byte/path input;
- non-zero initialization frame;
- bounded forward, backward, or bidirectional propagation;
- at most one approved refinement;
- object removal, reset, cancellation, and mandatory close;
- exact frame, object, bucket, time, cost, and attempt ceilings;
- create-only private masklet output.

The operation forbids caller-selected modules, classes, checkpoints, commands, GPUs, endpoints, paths, URLs, retries, fallbacks, and prices. Raw user chat is compiled server-side to a bounded target prompt and never reaches the worker.

## Session ownership

Track All owns a content-addressed state transition ledger:

`planned -> started -> prompted -> propagated -> persisted -> reconciled -> closed`.

One assignment/plan/attempt is the only writer. Multiple concepts require distinct stages or an explicit reset. `close_session` runs in `finally` after success, failure, cancellation, timeout, unknown-outcome reconciliation, or partial persistence. Unknown outcomes must be reconciled before another submission.

## Runtime classes

- `internal_qualification_adapter`: injected masklets, never production.
- `canonical_private_execution_adapter`: real private execution only after route evidence is accepted.
- `production_worker_adapter`: intentionally absent until production qualification.

A100 is primary. L4 is not an automatic cheap fallback; it is eligible only after independent qualification, known terminal A100 disposition, equivalent quality, updated estimate, and approval coverage. SAM2, BiRefNet, rembg, and transparent-background tools are not tracking fallbacks.

## Compatibility

The existing Orchestra/SAM binding remains compatibility evidence. The public Track All plugin is the source of truth. No head-orchestra code is added here.

## Implemented V2 authority

TRACK-07 implements the V2 authority as a distinct strict,
content-addressed server contract. Its operation authority hash is
`cd6f408a7328ff3a4d54e054dd29b7438d8571533e67003856b5c84bfc4d1a1a`.
The contract binds the exact Track All manifest, assignment, approved snapshot,
work item, attempt, lease, reservation, private source checksum and range,
anonymous object IDs, initialization frame, prompt stages, propagation,
object/bucket/frame ceilings, rate authority, and mandatory close policy.

The separately hashed attempt-evidence contract distinguishes
`real_private_sam3_1_inference`, `injected_masklets_test_only`, and
`not_executed`. Injected evidence must report zero model requests and cannot be
validated as real evidence. Real evidence requires strict checkpoint load,
CUDA inference, one exact model request, private output, and close evidence
after the terminal observation. This milestone exercises contract and injected
lifecycle validation only; it performs no SAM inference and leaves the route
`blocked`.
