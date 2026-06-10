# PROVIDER-GATEWAY-SOUND-0 Provider / License Fixture Boundary Audit

Status: provider gateway fixture boundary audit only.

Workstream owner: PROVIDER_GATEWAY_MODELS.
Requesting workstream: SOUND_MUSIC_AUDIO.
Related source workstreams: SUPABASE_RLS_STORAGE_DATABASE and WORKER_RUNTIME_JOBS.
Current SOUND stage: dry_run_passed.
Target future stage: generated_local_fixture_passed.
Decision: conditional_provider_gateway_acceptance_for_no_provider_local_fixture.

This document does not call providers, create provider requests, create provider webhooks, execute provider fallbacks, read secrets, read Secret Manager, download models, run model inference, create generated outputs, dispatch workers, mutate Supabase, execute SQL, create signed URLs, create public artifacts, create credits, create approvals, or unlock generated_local_fixture_passed.

SUPABASE-SOUND-4 remains globally blocked because cross-owner approvals are incomplete.

## Source-of-truth path

Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot

Signed URLs are not source of truth. Public URLs are blocked. Provider output references must eventually resolve through private source-of-truth records, not delivery links.

## Raw-prompt-safe execution path

user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution

Raw prompt provider execution is blocked. Raw prompt worker execution is blocked. Provider routing must be derived from approved structured records and owner-accepted gateway contracts.

## Accepted by Provider Gateway

The Provider Gateway owner conditionally accepts future no-provider local fixture metadata/spec validation only.

- providerGatewayAllowsNoProviderLocalFixture: true.
- providerGatewayAllowsProviderCalls: false.
- globalGoForSUPABASE_SOUND_4: false.
- local fixture may use mock/reference provider policy ids only.
- provider policies may be represented as metadata only.
- provider route contracts may be drafted for future validation only.
- Lyria may appear only as music/song/soundtrack planning metadata.
- SFX and ambience provider candidates may appear only as blocked, candidate, or license-gated metadata.
- provider cost, retry, error, and fallback semantics remain future-only metadata.

## Rejected / still blocked by Provider Gateway

- real Lyria transport.
- real Mirelo SFX transport.
- real MMAudio transport.
- Dasheng execution or model download.
- Stable Audio execution or model download.
- OpenMOSS execution or model download.
- Meta AudioGen or AudioCraft execution.
- Woosh execution.
- TangoFlux execution.
- ElevenLabs execution.
- provider fallback execution.
- provider requests or provider webhooks.
- provider secrets in repo, frontend, database rows, logs, prompts, or payloads.
- Secret Manager reads.
- generated audio outputs.
- generated_local_fixture_passed claim.

## Provider / model readiness table

| Provider or tool | Boundary decision | Local fixture use | Execution status |
| --- | --- | --- | --- |
| Google Lyria | music/song/soundtrack planning only | metadata only | generation disabled |
| Lyria Pro | music/song/soundtrack planning only | metadata only | generation disabled |
| Lyria 3 Pro | music/song/soundtrack planning only | metadata only | generation disabled |
| Lyria 3 Clip | music/song/soundtrack planning only | metadata only | generation disabled |
| Mirelo SFX | SFX candidate boundary only | mock/reference metadata only | provider calls blocked |
| MMAudio | SFX/video-to-audio candidate boundary only | mock/reference metadata only | provider calls blocked |
| Dasheng-AudioGen | candidate requires license, dependency, model-card, runtime, and quality review | metadata only | model download and execution blocked |
| Stable Audio Open | license-gated candidate only | metadata only | model download and execution blocked |
| Stable Audio 3 Small SFX | license-gated candidate only | metadata only | model download and execution blocked |
| OpenMOSS MOSS-SoundEffect | pending verification | metadata only | blocked until verified |
| Meta AudioGen / AudioCraft | disabled for commercial production | no fixture execution | blocked |
| Woosh | disabled until license policy changes | no fixture execution | blocked |
| TangoFlux | disabled until license policy changes | no fixture execution | blocked |
| ElevenLabs | no SOUND fixture acceptance | no fixture execution | blocked |
| AudioFlux | analysis/processing metadata only | metadata only | no generation route |
| Signalsmith Stretch | stretch/pitch processing metadata only | metadata only | no generation route |
| DeepFilterNet | cleanup candidate requiring review | metadata only | blocked until model/license/readiness review |
| RNNoise | cleanup candidate requiring review | metadata only | blocked until license/readiness review |
| Demucs | separation candidate requiring review | metadata only | blocked until model/license/readiness review |
| FFmpeg | processing tool, not provider transport | no execution in this audit | blocked |
| ffprobe | media inspection tool, not provider transport | no execution in this audit | blocked |

## Lyria boundary

Google Lyria belongs to SOUND_MUSIC_AUDIO only for music/song/soundtrack planning metadata. Lyria must not be presented or routed as an SFX, foley, whoosh, hit, riser, ambience, room-tone, cleanup, or general media-processing provider. Lyria generation remains disabled. Real Google transport remains future PROVIDER_GATEWAY_MODELS work and requires owner acceptance, secret policy approval, cost/error/audit semantics, and worker runtime handoff.

## SFX / ambience provider boundary

Mirelo, MMAudio, Dasheng, Stable Audio, and OpenMOSS may appear only as blocked, candidate, mock/reference, pending-verification, or license-gated metadata for future review. SFX and ambience fixture planning must not create provider requests, webhooks, fallbacks, model downloads, generated audio, storage writes, or public artifacts.

## Secret policy

Provider secrets must not appear in repo files, browser code, database rows, logs, prompts, payloads, manifests, or smoke output. Future execution may use Secret Manager reference names only after Provider Gateway owner acceptance and secure backend/worker integration. The no-provider local fixture path must not read Secret Manager and must not include secret values.

## Future provider route contract requirements

Before any future provider transport or provider-backed fixture, Provider Gateway must approve a route contract that includes:

- providerPolicyRef.
- providerModelRef.
- license and compliance status.
- commercial and export permission status.
- allowed execution stage.
- approved snapshot reference.
- generation request reference.
- credit gate reference.
- worker runtime gate reference.
- idempotency key.
- retry and fallback policy.
- cost and error semantics.
- audit evidence.
- raw prompt execution blocked.

## Required before PROVIDER-GATEWAY-SOUND-1

- provider and license readiness table approved.
- Lyria music/song/soundtrack-only boundary approved.
- SFX and ambience provider boundary approved.
- Secret Manager reference-name policy approved.
- provider route contract draft approved.
- fallback disabled or controlled-fallback policy approved.
- cost/error/audit handoff accepted.
- no-provider local fixture validation accepted.

## Cross-owner status after Provider Gateway decision

### PROVIDER_GATEWAY_MODELS

owner: PROVIDER_GATEWAY_MODELS.
status: accepted_conditionally.
evidence: conditional no-provider local fixture metadata/spec acceptance; all provider calls blocked; all secrets blocked.
missingEvidence: provider route contract draft; license/compliance table approval; fallback policy approval; cost/error/audit acceptance.

### WORKER_RUNTIME_JOBS

owner: WORKER_RUNTIME_JOBS.
status: accepted_conditionally.
evidence: WORKER-RUNTIME-SOUND-0 conditionally accepts future payload-shape validation only.
missingEvidence: no-dispatch payload-shape validation smoke and owner acceptance for any future worker-facing contract changes.

### SUPABASE_RLS_STORAGE_DATABASE

owner: SUPABASE_RLS_STORAGE_DATABASE.
status: accepted_conditionally.
evidence: SUPABASE-SOUND-3D conditionally accepts future local/throwaway/non-production SQL validation only.
missingEvidence: no live rows, no storage writes, no active migration, and no SUPABASE-SOUND-4 authorization.

### SOUND_MUSIC_AUDIO

owner: SOUND_MUSIC_AUDIO.
status: missing.
evidence: SOUND dry-run, fixture spec, handoff packet, and owner checklist exist.
missingEvidence: explicit no-provider local fixture scope acceptance for the next phase.

### OBSERVABILITY_AUDIT_COST

owner: OBSERVABILITY_AUDIT_COST.
status: missing.
evidence: dry-run evidence identifies QA/audit/cost handoff needs.
missingEvidence: accepted evidence capture shape, audit event expectations, abuse/cost checks, and fixture QA evidence policy.

### BILLING_STRIPE_CREDITS

owner: BILLING_STRIPE_CREDITS.
status: missing.
evidence: all current fixture plans keep credit rows and spend blocked.
missingEvidence: no-spend/no-reservation acceptance and future placeholder cost evidence policy.

### TRACK_A_RENDER_EXPORT

owner: TRACK_A_RENDER_EXPORT.
status: missing.
evidence: Track A final export remains false in SOUND/Worker Runtime/Supabase specs.
missingEvidence: no-export acceptance for generated/local fixture planning.

### TRACK_B_MEDIA_PROCESSING

owner: TRACK_B_MEDIA_PROCESSING.
status: missing.
evidence: Track B processing remains not accepted in SOUND/Worker Runtime/Supabase specs.
missingEvidence: no-processing acceptance and fixture boundary for any future audio/media handoff.

## Go / no-go for SUPABASE-SOUND-4

Provider Gateway conditionally accepts no-provider local fixture metadata/spec validation, but globalGoForSUPABASE_SOUND_4 remains false. SUPABASE-SOUND-4 cannot proceed until SOUND, Observability, Billing, Track A, and Track B owner evidence is collected and no owner disputes the no-provider fixture boundary.

## Runtime / provider / gate behavior

- provider calls: false.
- provider requests: false.
- provider webhooks: false.
- provider fallback execution: false.
- provider secrets accessed: false.
- Secret Manager reads: false.
- model downloads: false.
- model inference: false.
- generated outputs: false.
- worker dispatch: false.
- Supabase mutation: false.
- SQL execution: false.
- signed URL creation: false.
- public artifact creation: false.
- credit or approval record creation: false.

## Supabase update classification

Supabase update required: no.
Supabase update status: read-only / handoff-only.
Supabase environment touched: no.
SQL executed: no.
Migration deployed: no.
Evidence docs: SOUND-3A through SOUND-3D, SUPABASE-SOUND-1 through SUPABASE-SOUND-3D, WORKER-RUNTIME-SOUND-0, and this Provider Gateway audit.
Blockers: no global go, no live rows, no storage writes, no provider route acceptance for execution, no provider calls, no generated assets.
Next Supabase action: none from Provider Gateway before OBSERVABILITY-SOUND-0.

## Recommendation

OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit
