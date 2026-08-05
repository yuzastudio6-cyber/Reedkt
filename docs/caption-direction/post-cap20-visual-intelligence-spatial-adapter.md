# Post-CAP-20 Visual Intelligence Spatial Adapter

Milestone: `POST-CAP-20-VISUAL-INTELLIGENCE-SPATIAL-ADAPTER`

Status: `caption_consumer_frozen_actual_owner_result_pending`

Caption adapter digest:
`11909574e81c8a4189bd43cdfc9c44bd63e0f2f873395b5142c6361a954d215b`.

## Outcome

Caption can now exact-reread an authenticated immutable Visual Intelligence
report together with its provider-neutral spatial-evidence companion and
project the pair into the existing
`caption-visual-intelligence-evidence-packet-v1` occupancy lane.

The public `src/types/visual-intelligence.ts` file is byte-for-byte identical
to the frozen backend source. Its SHA-256 is
`59b71de0c66c97c3129920c38c39262b259fc0434895d029c3b430ab895ca5c1`.

## Frozen source

- repository: `yuzastudio6-cyber/Reedkt`;
- branch: `codex/backend-workflow-pipeline-continuation`;
- commit: `5130e3c70f3f633e6877aa3feff4dc296eba525b`;
- tree: `03c2f34cddf23e6d180869068c1c0367129e37d2`;
- report: `visual-intelligence-report-v1`;
- authenticated read result:
  `visual-intelligence-authenticated-read-result-v1`;
- spatial companion: `visual-intelligence-spatial-evidence-v1`.

No Visual Intelligence server service, provider adapter, lifecycle store, or
runtime implementation is imported by Caption.

## Exact admission

The adapter independently verifies:

- authenticated-read and report digests;
- immutable completed reread and closed authority flags;
- report disposition, reinspection, artifact, finding, evidence, and coverage
  consistency;
- spatial-companion digest, unique observations, known artifacts, and known
  report evidence refs;
- exact owner, workspace, project, edit session, approved snapshot, output,
  frame, FPS, source artifact, checksum, scene, range, operation, profile, and
  expected-outcome binding to the Caption support payload; and
- every observation role required by Caption.

The result is a Caption-owned projection. Visual Intelligence remains the
evidence owner. Caption performs no provider call, dispatch, media execution,
asset mutation, cost mutation, or QA approval.

## Deliberate limitation

Spatial evidence v1 contains semantic rectangles. It explicitly does not
claim deterministic pixel geometry, exact every-frame inspection, or a
pixel-bound regional contrast measurement. Caption preserves
`measuredContrastRatioMilli: null`.

Consequently, this adapter can qualify authenticated occupancy evidence, but
it cannot select a stable Caption region by itself. The occupancy manifest
remains blocked with `caption_visual.no_safe_candidate` until a canonical
pixel-bound readability/contrast owner supplies the missing evidence.

The adapter also refuses `rendered_caption_inspection`. Complete-time rendered
Caption appearance still requires the separate qualified visual-review and
independent final-QA paths.

## Verification

The focused smoke passes 15 checks. It proves a five-role occupancy projection
and rejects crossed scenes, deterministic-pixel claims, invented contrast,
unknown evidence refs, wrong output frames, stale snapshot rereads, missing
required roles, and attempts to reuse spatial v1 as rendered-caption review.

The fixture is source evidence only. No provider, model, media, browser,
container, billing, public, or production runtime is started.

## Remaining integration gate

An actual canonical Visual Intelligence owner result has not yet been
persisted, reread, projected, and injected into a real Caption job. The generic
canonical sequential-resume consumer is ready for that artifact, but this
source fixture does not claim that the backend mount has occurred.
