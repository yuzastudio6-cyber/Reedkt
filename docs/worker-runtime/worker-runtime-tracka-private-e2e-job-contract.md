# Worker Runtime Track A Private E2E Job Contract

Contract status: `planned_blocked_pending_transactional_runtime_gate`

This contract defines the minimum future Worker Runtime job shape for restricted Track A private E2E revalidation. It is not a runtime API, schema migration, worker implementation, route invocation, provider call, or media execution packet.

## Future Job Family

workerJobFamily: `tracka_private_e2e_revalidation`

executionMode: `future_guarded_private_e2e_only`

executionAllowedInThisPhase: false

approvedPlanSnapshotRequired: true

approvedPlanSnapshotSources: `#334`, `#343`, `#502`

rawPromptExecutionAllowed: false

signedUrlSourceOfTruthAllowed: false

publicArtifactAllowed: false

privateArtifactManifestRequired: true

checksumRequired: true

qaReportRequired: true

toolRouteGateRequired: true

workerRuntimeGateRequired: true

futureTransactionalClaimRequired: true

persistToDatabaseInThisPhase: false

serviceRoleWorkerRuntimeAllowedInThisPhase: false

## Required Future Inputs

| Field | Requirement |
| --- | --- |
| `approvedPlanSnapshotRef` | Required before any future worker execution; must resolve to the restricted #502 scope. |
| `idempotencyKey` | Required for future claim/dispatch safety. |
| `trackAScopeRef` | Must point to `TRACKA-PRIVATE-E2E-REVALIDATION-1` and #497/#502 scope decisions. |
| `toolRouteGateRef` | Must point to the future Tool Route Track A private E2E execution gate result. |
| `workerRuntimeGateRef` | Must point to this gate and the future Gate 2 transactional runtime decision. |
| `artifactManifestPolicy` | Must require private manifest, SHA-256 checksums, QA report, and event log. |
| `blockedScopeRegister` | Must preserve excluded Track A capabilities and beta/production blocks. |

## Allowed Future Track A Payload Scope

- private render/export review path
- corrected caption burn-in
- configurable caption layout policy
- default one-line bottom-safe caption preset
- libass caption burn-in runtime path
- FFmpeg/FFprobe private validation
- Remotion/private preview path if source evidence is sufficient
- private artifact manifest/checksums/QA report

## Blocked Payload Scope

- BiRefNet/text-behind-subject/masking
- SAM2
- Real-ESRGAN
- FILM
- OpenColorIO/OpenImageIO production color
- broad/arbitrary media
- public artifacts
- signed URL source-of-truth
- final delivery/export
- external beta
- paid production
- production

## Contract Decision

Worker runtime execution readiness: blocked_pending_worker_runtime_transactional_execution_gate

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: ready_for_transactional_runtime_gate_planning

trackAInternalBetaUnlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
