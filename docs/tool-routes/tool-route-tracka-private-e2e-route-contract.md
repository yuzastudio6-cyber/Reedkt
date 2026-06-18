# Tool Route Track A Private E2E Route Contract

Contract status: `planned_blocked_pending_route_contract_dry_run_gate`

This contract defines the future Tool Route boundary for restricted Track A private E2E revalidation. It is not a route implementation, execution authorization, worker dispatch path, provider call, media processing path, Supabase mutation, signed URL path, or delivery path.

## Future Route Contract

routeFamily: `tracka_private_e2e_revalidation`

executionMode: `future_guarded_private_e2e_only`

workerJobFamily: `tracka_private_e2e_revalidation`

workerRuntimeGateRequired: true

workerRuntimeGateSource: #505 and future Worker Gate 2

approvedPlanSnapshotRequired: true

toolRouteGateRequired: true

rawPromptExecutionAllowed: false

signedUrlSourceOfTruthAllowed: false

publicArtifactAllowed: false

privateArtifactManifestRequired: true

checksumRequired: true

QAReportRequired: true

executionAllowedInThisPhase: false

## Allowed Scope

allowedScope: restricted Track A scope from #502/#497

- private render/export review path
- corrected caption burn-in
- configurable caption layout policy
- default one-line bottom-safe caption preset
- libass caption burn-in runtime path
- FFmpeg/FFprobe private validation
- Remotion/private preview path only if current-source evidence is sufficient
- private artifact manifest/checksums/QA report

## Excluded Scope

excludedScope: BiRefNet/SAM2/Real-ESRGAN/FILM/broad media/public delivery/final delivery

- BiRefNet/text-behind-subject/masking
- SAM2 segmentation/runtime
- Real-ESRGAN enhancement
- FILM interpolation runtime
- OpenColorIO/OpenImageIO production color management
- broad/arbitrary user media
- public artifacts
- signed URL source-of-truth
- final delivery/export
- external beta
- paid production
- production

## Route Contract Decision

TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1 decision: completed_repo_audit_gate_planning

Tool Route execution readiness: blocked_pending_tool_route_contract_dry_run_gate

TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: ready_for_route_contract_dry_run_gate_planning

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: ready_for_transactional_runtime_gate_planning

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
