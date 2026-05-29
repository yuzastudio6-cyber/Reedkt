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
