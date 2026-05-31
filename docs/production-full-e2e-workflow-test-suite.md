# Production Full E2E Workflow Test Suite

Milestone 16B adds a dry-run-first production workflow test suite that connects the approved worker/runtime phases from media foundation through final render/export QA.

The suite uses approved snapshot IDs, tool execution plan IDs, idempotency keys, private artifact refs, and generated fixture metadata. It does not deploy, run `gcloud`, call providers, download model weights, process arbitrary user media, expose signed URLs as source of truth, or use Revideo as a production path.

The E2E orchestrator validates stage ordering, artifact handoff, QA aggregation, fallback summaries, readiness blockers, and final-delivery rules. Local-dev generated fixture mode remains optional and must use generated temp media only when explicitly enabled and tool availability is safe.

## Milestone 17 Consumption

M17 consumes E2E dry-run results for beta readiness. Internal dry-run testing may be allowed only when the E2E suite passes and safety/cost/security docs exist.

External beta, real user media beta, and paid production remain blocked until human-run deployment, readiness, model/license, security, cost, storage, and legal approvals pass.

## Activation Phase 35A Dependency

The full E2E workflow must not consume SAM2 masks, temporal tracking, or
full-video text-behind-subject output after Phase 35A. SAM2 remains
download/runtime blocked until later explicit Phase 35B/35C/35D gates pass, and
all SAM2 artifacts must remain private.

After Phase 35C, the full E2E workflow still must not consume SAM2 real-video
masks or tracking output. Phase 35C provides generated/synthetic runtime proof
only; Phase 35D controlled short real-video temporal tracking must pass before
any SAM2 real-video mask path can be considered.

After Phase 35D, the full E2E workflow still must not consume full-video SAM2
masks or text-behind-subject video output. Phase 35D is limited to one private
short segment and can only inform a later controlled segment preview gate.

## Activation Phase 40A Dependency

The full E2E workflow must not consume OpenColorIO, OpenImageIO, or Kornia
runtime output after Phase 40A. Phase 40A records source/license/scope evidence
only and approves Phase 40B generated-fixture runtime planning. Pro color/image
real-video processing, final delivery color transforms, providers, Revideo,
production, external beta, paid production, broad media, and public output remain
blocked until later explicit phases.

## Activation Phase 40B Dependency

After Phase 40B, the full E2E workflow may reference only generated-fixture
OpenColorIO/OpenImageIO/Kornia runtime evidence. It still must not consume
real-video pro color/image output, final delivery transforms, public output,
providers, Revideo, production, external beta, paid production, broad media, or
Track B tools until later explicit phases approve those scopes.
