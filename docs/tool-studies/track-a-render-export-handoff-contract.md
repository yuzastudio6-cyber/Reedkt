# TRACK_A_RENDER_EXPORT Handoff Contract

This contract describes the fields Track A expects from upstream workstreams and the review-only outputs Track A may hand to future milestones. It is not an execution schema and does not approve runtime behavior.

## Consumed Handoffs

| From | Required Fields | Track A Use | Blocked If Missing |
| --- | --- | --- | --- |
| Approved plan snapshot | `snapshotId`, `approvedForRuntime`, `executionStatus`, `frame`, `timingPlanId`, `rendererPlanRefs`, `qaGateRefs` | Establish final composition planning boundary. | snapshot id, frame confirmation, timing refs, QA status |
| AI Tools creative graphics | `manifestId`, `assetType`, `sourceDataRefs`, `checksum`, `alphaPolicy`, `bounds`, `timingRefs`, `qaStatus` | Plan graphic/card/vector/animation layer intake. | checksum, provenance, safe-zone QA, alpha policy |
| MAP_GEOSPATIAL | `geojsonRefs`, `styleManifestId`, `cameraManifestId`, `timingManifestId`, `renderManifestId`, `qaStatus` | Plan map overlays, routes, pins, camera framing, and label-safe layout. | style/camera/timing refs, map QA, source confidence |
| WEB_SEARCH_CAPTURE | `sourceManifestId`, `captureManifestId`, `extractionManifestId`, `sourceLabels`, `qaStatus` | Plan evidence cards and browser/source visual references. | source provenance, redaction, extraction QA |
| TRACK_B_MEDIA_PROCESSING | `mediaAnalysisManifestId`, `shotSummaryRefs`, `trimRefs`, `colorAudioReadiness`, `qaStatus` | Plan media-aware layout, preview readiness, and render constraints. | media readiness summary, trim review, QA |
| SOUND_MUSIC_AUDIO | `cueManifestId`, `duckingPlanId`, `loudnessPolicy`, `sfxTimingRefs`, `qaStatus` | Align visual timing, transition moments, and final artifact QA with sound/music. | cue timing, voice clarity QA, loudness policy |
| Captions/subtitles | `captionPlanId`, `subtitleRefs`, `safeZoneRefs`, `styleRefs`, `timingRefs`, `readabilityQa` | Plan caption burn-in preview route and subtitle sidecar policy. | readability QA, safe-zone refs, timing refs |

## Track A Review-Only Outputs

| Output | Required Fields | Consumer | Notes |
| --- | --- | --- | --- |
| `final_composition_planning` | `compositionPlanId`, `sourcePlanId`, `frame`, `layers`, `timingRefs`, `assetRefs`, `captionRefs`, `audioCueRefs`, `qaGates`, `blockedReasons` | Worker Runtime future, Frontend review | Candidate-only until runtime approval. |
| `private_preview_planning` | `previewPlanId`, `reviewScope`, `placeholderPolicy`, `privateRefs`, `checksumRefs`, `qaGates`, `blockedReasons` | Frontend/Product UX, Compliance | Private review only. |
| `render_manifest_policy` | `renderManifestId`, `renderer`, `frame`, `fps`, `durationFrames`, `layerRefs`, `dependencies`, `checksums`, `qaGates` | Worker Runtime future | Descriptive policy, not command input in this phase. |
| `export_manifest_policy` | `exportManifestId`, `formatTargets`, `captionPolicy`, `audioPolicy`, `deliveryPolicy`, `qaGates`, `blockedReasons` | Billing, Compliance, Product UX | Delivery remains blocked. |
| `final_artifact_qa_handoff` | `qaHandoffId`, `renderManifestRef`, `exportManifestRef`, `privateArtifactRefs`, `checksums`, `reviewStatus`, `rollbackPlan` | QA, Observability, Compliance | No artifact is declared final in TOOL-STUDY-0. |

## Cleanup And Rollback Fields

Future execution phases must define cleanup and rollback fields before Track A can be used:

- temporary artifact retention
- failed render cleanup
- partial export cleanup
- checksum mismatch handling
- private review revocation
- delivery rollback
- user revision link
- audit event link

## Blocked Handoffs

- Raw prompts to Track A execution.
- Raw provider responses to Track A execution.
- Public artifacts as Track A source-of-truth.
- Signed URLs as Track A source-of-truth.
- Worker jobs without approved snapshot id and idempotency key.
- Supabase writes outside a future approved backend/service-role boundary.
- Render/export commands in docs or prompts.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
