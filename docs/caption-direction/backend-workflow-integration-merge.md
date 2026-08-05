# Caption specialist backend-workflow integration merge

Milestone: Dependency-complete backend integration base

Status: Source integration, the canonical Caption planning-job mount, and the
authenticated canonical transcript projection are complete; actual media and
terminal evidence gates remain closed

## Integrated histories

- Canonical backend source head:
  `4c7ebbf2f1b977aec898bbc9de07762246b8e66c`
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

This does not claim the final internal status. The canonical planner still has
to publish exact Caption work items into real approved plans, and the complete
private path still needs actual worker-backed transcript projection, persisted
Visual Intelligence, Track All, SoundSync, B-roll, complete-time visual-review,
and independent private-review evidence before the terminal projection can be
created.

This is an internal-testing integration base, not a public or production SaaS
release.
