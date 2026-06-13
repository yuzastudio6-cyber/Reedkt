# SOUND_MUSIC_AUDIO Blocked-Use Register

This register blocks runtime and delivery paths while preserving planning-only routing evidence.

| Blocked Use | Status | Reason | Allowed Alternative |
| --- | --- | --- | --- |
| Real audio/SFX/music generation | blocked | Provider, worker, cost, rights, and QA gates are not approved. | Cue manifest and provider review handoff. |
| Real audio/media processing | blocked | Track B and Worker Runtime execution gates are not approved. | `track_b_audio_processing_handoff`. |
| FFmpeg/FFprobe execution | blocked | Command allowlist, LGPL configuration, worker path, and QA are future work. | Loudness/normalization planning metadata. |
| DeepFilterNet runtime | blocked | Runtime/private fixture and worker execution are outside this study. | Cleanup need handoff. |
| Demucs/stem separation | blocked | Provenance/legal/human review remains required. | Blocked stem-separation record. |
| Provider/model calls | blocked | Provider Gateway and secret handling are outside this docs-only phase. | `provider_gateway_future_audio_generation_handoff`. |
| Broad media processing | blocked | No broad media worker or private artifact policy is executed here. | Private manifest placeholders. |
| Public artifacts | blocked | Public delivery is not approved. | Private refs and manifest-only evidence. |
| Signed URLs as source of truth | blocked | Signed URLs are temporary delivery mechanics, not immutable source records. | Private manifests, checksums, provenance refs. |
| Raw prompt execution | blocked | Workers must execute approved snapshots, not raw prompts. | Sanitized route dry-run fields. |
| Worker execution | blocked | WORKER-1 was a deterministic dry-run only. | Future route dry-run planning. |
| Route execution | blocked | TOOL-ROUTE-1 is not implemented in this PR. | Owner study handoff. |
| Tool execution | blocked | No audio, media, or graphics tool is run. | Capability records only. |
| Supabase mutation | blocked | This branch lacks the sync layer and no writer is added. | `blocked_current_branch_missing_sync_layer`. |
| SQL/migrations/schema/RLS changes | blocked | Database mutation is outside this owner study. | Docs/status only. |
| GCS upload/storage transfer | blocked | No artifacts are uploaded. | Local docs only. |
| Credit/billing mutation | blocked | Billing backend approval is outside this study. | `billing_future_audio_credit_handoff`. |
| Stripe checkout/webhook/payment processing | blocked | Payment paths are outside this study. | Cost review note only. |
| Internal beta unlock | blocked | Owner studies do not unlock beta. | Route dry-run readiness only. |
| External beta unlock | blocked | External beta requires later cross-workstream signoff. | No action. |
| Paid production/production unlock | blocked | Production readiness is not changed. | No action. |
| Dependency mutation | blocked | No package install or lockfile update is authorized. | Docs and diagnostics only. |
| Final render/export | blocked | Track A owns future final composition/export after worker gates. | Track A handoff only. |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
