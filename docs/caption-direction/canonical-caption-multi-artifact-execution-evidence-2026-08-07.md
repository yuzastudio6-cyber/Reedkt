# Canonical Caption Multi-Artifact Execution Evidence

Milestone: `POST-CAP-12-CANONICAL-MULTI-ARTIFACT-EVIDENCE`

Status: `source_regression_passed_ready_for_private_internal_evidence`

## Outcome

Canonical Caption execution and qualification can now retain the complete
artifact output of incoming-support and V3 cross-system jobs. The legacy
private verifier previously admitted exactly one produced artifact, even
though the Caption runtime correctly emits:

- one base Caption job receipt for ordinary jobs;
- that receipt plus one request-bound output for incoming Caption support;
- the receipt plus Caption-owned outbound payload and handoff records for a
  single cross-system assignment;
- one coordination plan, eight payloads, and eight handoffs in addition to
  the base receipt for the aggregate Caption-to-Visual plan.

That one-artifact assumption prevented valid jobs from entering canonical
private qualification after successful execution.

## Version-safe correction

`canonical-caption-specialist-execution-receipt-v1` remains byte-for-byte
compatible for its frozen single-artifact lane. Its existing fixture retains
the exact historical receipt digest
`3e2e6416e37c7836f7d3e8c7a65dccd4f8fd3541568183618807c12638688c39`.

The additive `canonical-caption-specialist-execution-receipt-v2` is used when
a result contains a non-single artifact set or when a V3 cross-system input is
present. V2 binds:

- the exact ordered produced-artifact count and canonical digest;
- the exact persisted cross-system execution-input ref when applicable;
- create-only/reread truth for that cross-system input;
- the same closed runtime, provider, asset, QA, billing, delivery, and
  production authority fields as V1.

The shared artifact contract now enforces exact job-specific multiplicity,
Caption ownership, private byte-free refs, unique identities, and one exact
incoming support-request lineage. It refuses missing aggregate handoffs,
unexpected artifact types, changed artifact digests, crossed request refs, or
V1 receipts used for multi-artifact work.

## Terminal traceability

The canonical internal runner binds the returned cross-system input ref to the
V2 receipt before writing its private planning artifact. The artifact verifier
reopens that object and validates the exact artifact set against the receipt.
The qualification-run reader then rereads the current persisted specialist
result and requires its produced refs to match the verified artifact byte for
byte before assembling an occurrence.

This closes the source-level traceability gap; it does not claim that a
representative 41-job private run has already produced terminal evidence.

## Evidence

- canonical Caption execution: 54 checks, including frozen V1 digest,
  two-artifact V2 support admission, changed-artifact refusal, and direct
  private artifact reread;
- canonical transcript/cross-system execution: 48 checks, including the
  four-artifact Caption-to-B-roll lane and exact 18-artifact aggregate
  multiplicity;
- qualification-run reader: 25 assertions;
- B-roll support: 17 checks;
- SoundSync support: 16 checks;
- Visual Intelligence support: 17 checks;
- Track All support: 28 Caption assertions plus 37- and 68-check owner proofs;
- CAP-12: 82 assertions;
- integration routing: 41 assertions;
- Caption source-integration aggregate: 47 suites, 20/20 historical
  milestones, 41/41 current job implementations, and 41/41 source paths ready;
- server typecheck with an 8 GiB Node heap: passed;
- targeted and full ESLint: passed;
- production build: passed, 2,969 modules;
- frontend/server boundary: passed, 1,147 files;
- current secret scan: passed, 6,859 files;
- reachable-history secret scan: passed, 15,683 blobs;
- Git diff whitespace validation: passed.

## Current truth

The Caption specialist remains at 41/41 implemented and source-ready paths,
with five canonical shared-owner mounts present. Terminal private-internal
qualification is still 0/41 because the nine real-evidence groups have not yet
been reconciled into one representative canonical catalog. Five groups have
standalone actual private evidence, but none is promoted merely by this source
integration correction.

No media, model, Docker, Remotion, FFmpeg, provider, billing, public-delivery,
or production action was performed for this milestone. Direct visual
inspection was not applicable because this change creates no raster or video
output.
