# Caption specialist backend-workflow integration merge

Milestone: Dependency-complete backend integration base

Status: Source integration, the canonical Caption planning-job mount, and the
authenticated canonical transcript projection are complete; actual media and
terminal evidence gates remain closed

## Integrated histories

- Canonical backend source head:
  `62fddefd38daf41f759426b25ff494bd6cadbb06`
- Complete Caption specialist source head:
  `70176e1cae1023c5f42b7c44f2acb10b8f974646`
- Integration branch: `codex/backend-caption-specialist-integration-v1`

The branches diverged from
`bfd269fa3ff6aca397f53eb4519ca0ed22b0b251`. The Caption history changed 235
paths and the backend history changed 361 paths. Fifteen paths overlapped, but
twelve were byte-identical and Git merged two more without intervention.

The single content conflict was the Visual Intelligence route catalog. Its
resolution preserves both distinct routes:

- the backend service-role Orchestra Visual Intelligence job route; and
- the Caption workspace-member authenticated postrender visual-QA reread route.

Neither route is relabeled or allowed to satisfy the other.

## Integration repairs

Two source assumptions were corrected after the merge:

1. The backend Track All smoke helper now accepts any closed object interface
   before cloning it to a generic record. No runtime or record behavior changed.
2. CAP-19 now verifies the backend's canonical read-only Qwen model-role record
   instead of importing a provider module that the backend deliberately removed.
   Fresh Qwen execution remains forbidden.
3. The Track All/SAM 3.1 bridge now consumes the backend's v2 authenticated
   evidence record. It requires the independently persisted task-level scene-QA
   authority before the exact scene evidence may be projected or used to resume
   Caption. The v2 source update does not count as live GPU qualification.
4. The protected Track All finalization route now closes the source handoff
   from persisted SAM result, L4 mask QA, and independent private scene review
   to the v2 Caption evidence record. Caption validates the bounded result
   against the exact record and owner projection before accepting it for
   specialist resume; the route does not run the specialist or any media tool.
5. Canonical Caption planning execution now rereads the current exact head of
   the existing sequential support-resume ledger. A retried work item can bind
   its receipt to a completed resumed result, while a missing owner projection
   or missing resume record remains fail-closed as `needs_followup`.

## Evidence

The merged tree passes:

- the canonical specialist support-resume service;
- the canonical Caption-to-Visual Intelligence support service;
- the canonical Caption-to-Track All/SAM 3.1 support service;
- both Caption authenticated owner-read adapters;
- the terminal qualification contract;
- all CAP-01 through CAP-20 source milestones;
- server typecheck, full lint/build, frontend boundary, secrets, history, and
  dependency audit.

These checks are source/static. No Docker, FFmpeg, FFprobe, Remotion, browser,
Python, provider, model, GPU, billing, public-delivery, or production action was
started by this merge.

## Current boundary

The merge makes the complete Caption implementation and the backend's current
canonical Visual Intelligence/Track All support owners coexist on one clean
history.

The additive `canonical-caption-specialist-execution-receipt-v1` mount now:

- exact-binds one approved snapshot, execution package, work item, derived job,
  planned manifest entry, estimate, and reservation;
- derives the postapproval Caption call identity on the server, so a caller
  cannot predict or inject the immutable snapshot hash;
- accepts only byte-free canonical transcript, confirmed-frame, and
  MasterTiming references as starting evidence;
- runs the existing Caption specialist planning contract and persists/rereads
  the exact call/result pair through the shared create-only sequential-resume
  repository; and
- returns advanced owner needs as HQ-mediated support requests with every peer,
  provider, media, timeline, asset, cost, final-QA, public, and production
  authority closed.

The mount deliberately does not treat Visual Intelligence, Track All,
SoundSync, B-roll, or Living Frame results as ordinary input references. Those
results must still pass their canonical owner adapter and the authenticated
support/resume ledger.

The additive canonical transcript support bridge now closes the earlier
reference-only transcript gap. It:

- rereads the exact approved snapshot twice;
- rereads each completed canonical source-transcript owner result twice;
- accepts word timing only through a process-bound private owner reader and
  rereads the same word artifact twice;
- verifies exact source order, source identity, transcript digest, segment
  frames, word order, word timing, language, and optional complete diarization;
- creates one immutable `caption-canonical-transcript-v1` plus its exact
  `caption-canonical-transcript-authenticated-read-binding-v1`;
- persists and rereads the private transcript record create-only; and
- lets the approved Caption execution mount inject the full private payload
  only when the work item carries both exact transcript and binding refs.

The bridge does not run transcription, select a model, call a provider, mutate
timing, or grant Caption runtime, asset, QA, billing, public, or production
authority. Missing diarization remains explicit; the bridge never invents a
speaker. A real internal run must supply the already-completed canonical
worker's private word-timing reader before speaker-independent Caption jobs can
claim authenticated transcript execution evidence.

This does not claim the final internal status. The canonical planner now
publishes exact Caption planning work, and the canonical private job adapter
can commit completed planning receipts through the shared lease, manifest,
artifact-QA, and reconciliation owners. The planner now also binds the selected
Caption projection to the existing approved libass overlay work and Remotion
final canvas through `canonical-caption-rendered-media-work-binding-v1`.
The binding is content-addressed, exact-frame and MasterTiming bound, and
recomputed from the immutable work graph before approval and execution reread.
The planner now also freezes one ordered postrender visual-review work item and
the exact final-render, deterministic-QA, visual-review, assembly, and decision
lineage required by canonical private review. This is approval coverage only:
the complete private path still needs the real qualified visual-review result,
actual independent private-review acceptance, and terminal projection.
Transcript and specialist-owner evidence remain fail-closed whenever their
exact authenticated records are unavailable.

The terminal handoff is now source-mounted as
`canonical-caption-terminal-evidence-assembly-v1`. The backend workflow must
provide only its admitted completed-work/owner reader and the canonical
private-review reader. The assembly exact-rereads both sources twice, persists
the existing terminal evidence bundle create-only, and exposes the existing
terminal read port. A caller cannot submit the bundle or promote a partial run.
The mount remains empty until all evidence belongs to one exact snapshot,
package, work graph, and output set.

This is an internal-testing integration base, not a public or production SaaS
release.
