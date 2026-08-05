# Caption specialist backend-workflow integration merge

Milestone: Dependency-complete backend integration base

Status: Source integration complete; private execution and actual evidence gates
remain closed

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
history. It does not claim the final internal status. The canonical backend
must still mount Caption job execution and supply actual persisted/reread
transcript, Visual Intelligence, Track All, SoundSync, B-roll, complete-time
visual-review, and independent private-review evidence before the terminal
projection can be created.

This is an internal-testing integration base, not a public or production SaaS
release.
