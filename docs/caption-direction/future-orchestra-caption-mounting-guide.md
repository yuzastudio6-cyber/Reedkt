# Future Orchestra Mounting Guide — Captions Specialist

Status: `mounting_ready_for_current_29_job_surface`

Full 41-job surface ready: no; 12 jobs require authenticated shared-owner
evidence first.

## Purpose

This guide explains how the future HQ/Orchestra can mount the completed Caption
specialist without changing Caption ownership or implementing a second
dispatcher. It is an integration guide only. CAP-20 does not implement the HQ
reasoning loop, central scheduler, or Orchestra runtime.

## Frozen public seam

The future mount must reread these existing public contracts:

- `skill-capability-manifest-v2`;
- `skill-qualification-snapshot-v1`;
- `orchestra-skill-call-v1`;
- `skill-support-request-v1`; and
- `orchestra-skill-job-result-v1`.

The assignee key is exactly `captions`. The manifest, planning qualification
snapshot, final CAP-20 job report, confirmed output frame, approved snapshot,
and authorized ranges must digest-match before invocation.

CAP-11 V1 and CAP-12 V2 Caption↔Living Frame payloads remain typed artifacts
inside the neutral support/result lineage. They are not peer dispatch
contracts, and no Living Frame implementation is imported.

## Mount sequence

1. Reread the exact Caption manifest and qualification snapshot.
2. Validate one bounded `OrchestraSkillCall` against the current admitted job
   report, canonical scope, confirmed frame, and approved snapshot.
3. Invoke the standalone Caption harness with byte-free artifact refs.
4. If the result is `needs_followup`, persist the exact support request and let
   future HQ mediate it to the canonical owner.
5. Reread and validate the owner-produced artifact; never accept browser-local
   completion or a Caption-forged substitute.
6. Inject the artifact and resume the exact original call/idempotency lineage.
7. Persist and reread the final `OrchestraSkillJobResult`.

Direct peer dispatch, support recursion, authorized-range expansion, timeline
mutation, raw chat transfer, media-byte transfer, and caller-selected paths or
URLs remain forbidden.

## Current admitted surface

The mount may admit only the 29 job types marked
`admitted_private_internal` or `admitted_contract_boundary` in
`caption-final-job-qualification-report-v1`. There is no blocked job inside
that surface.

The 12 `conditional_shared_owner_not_admitted` jobs must fail closed until the
backend workflow supplies exact evidence from:

- Visual Intelligence for busy-background/final visual occupancy;
- Track All for masks, tracks, subject planes, and object anchors;
- the canonical transcript/diarization owner for multi-speaker evidence;
- SoundSync for typographic sound/transition timing support; and
- the authenticated B-roll owner for selected/cropped/timed media lineage.

Living Frame and Transition handoffs remain typed boundary contracts. Caption
stays above Living Frame unless an explicit StoryTiming-bound information-owner
handoff says otherwise. SoundSync owns audio; StoryTiming owns executable
frames; Remotion owns final canvas; independent QA owns final approval.

## Result and retry behavior

- A fully satisfied current-surface call returns `completed` with immutable
  Caption artifact refs.
- A missing shared dependency returns `needs_followup` with one or more neutral
  support requests; it does not dispatch the peer.
- Stale scope, snapshot, frame, transcript, timing, font, occupancy, mask,
  receiver, or result lineage returns `blocked` and requires exact reread or a
  new approved version.
- Retry is idempotent and resumes the original call only after canonical
  evidence injection.
- Local deterministic repair may change only the affected Caption scope and
  must create N+1 evidence followed by technical QA and direct visual
  reinspection.
- Failed provider/shared-owner evidence remains separate from a valid Caption
  render. It cannot overwrite or falsely complete the Caption result.

## Authority boundary

Mounting must not give Caption provider, model, operation dispatch, asset-store,
work-graph, credit, billing, final-QA, public-delivery, or production authority.
The future Orchestra coordinates calls; it does not replace canonical owners or
rewrite immutable approved plans.
