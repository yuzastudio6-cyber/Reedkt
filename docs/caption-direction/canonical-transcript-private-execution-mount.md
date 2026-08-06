# Canonical Transcript Private Execution Mount

## Outcome

The private Caption planning runner now consumes the exact post-approval
canonical transcript projection instead of accepting only a planning-time
transcript reference.

The canonical transcript owner remains separate from Caption. The additive
`canonical-caption-transcript-support-service-v2` preserves the V1 projection,
rereads canonical source transcript and word-timing evidence, validates the
immutable approved snapshot, recomputes the exact preapproval source-transcript
expectation, persists one closed authenticated Caption transcript record, and
create-only persists its expectation mapping. Caption does
not transcribe audio, mutate the transcript, invent timing, dispatch the speech
runtime, or select a speech provider.

## Restart-safe discovery

`canonical-caption-transcript-evidence-repository-v3` preserves the V2 scope
index and adds one create-only expectation index. They are keyed by:

- owner user, workspace, project, edit session, plan version, and approved
  snapshot reference;
- canonical transcript ID, version, and digest; or
- the exact source-led planning expectation ID, version, and digest.

It resolves only the exact authenticated-read binding and record digest. The
repository rereads and revalidates the index, transcript record, closed tree,
canonical serialization, and all digests. Cross-snapshot, cross-tenant,
cross-plan, or crossed-transcript lookups return no record or fail closed.

The prior `canonical-caption-transcript-evidence-repository-v1` identity is
retained as a historical constant. The new index behavior is published under
V2 rather than silently changing the V1 repository contract.

## Runner behavior

Before a canonical Caption work item executes, the private internal authority
runner now:

1. rereads the exact approved work item and its transcript ref or V3 planning
   expectation;
2. derives the immutable approved-snapshot read scope;
3. locates the authenticated record directly for V1/V2 work or through the
   expectation mapping for V3 work;
4. injects the real transcript ref, authenticated binding ref, immutable
   expectation-binding ref, and repository read port into the
   existing Caption execution service;
5. lets the execution service reread and validate the transcript and binding
   again before Caption planning begins.

The immutable V3 work item continues to contain only its preapproval
expectation. Only the actual specialist call receives the resolved transcript
lineage. If the record or mapping is absent, the work remains waiting at
`canonical_caption_authenticated_transcript_projection`. The runner no longer
allows a Caption planning job to proceed from a bare transcript reference.

## Evidence and remaining boundary

The focused source proof covers creation, exact reread, restart-safe discovery,
idempotent replay, expectation recomputation, create-only remap refusal,
crossed-transcript/expectation refusal, stale snapshot refusal, tampered
word-timing refusal, and one approved V3 Caption planning execution after
resolution. Server typechecking and the existing Caption planning/execution
regressions remain required for publication.

This milestone mounts the authenticated transcript consumer for private
internal execution. It does not itself run Faster-Whisper or manufacture the
upstream private word-timing evidence. A real internal media qualification run
must still prove that the canonical transcript owner writes the expected record
before Caption work is released.

The later bounded local CPU run documented in
`cap-04-private-transcript-real-media-evidence-2026-08-05.md` proves actual
offline model execution and exact Caption-side source-word lineage mechanics,
but its transcript content was correctly rejected during direct inspection.
It is not relabeled as authenticated canonical-owner evidence and does not
release final phrase projection.

All provider, runtime dispatch, timeline mutation, asset mutation, final-QA,
billing, public-delivery, and production authorities remain outside Caption.
