# SOUND_MUSIC_AUDIO Internal Beta Gap Map

Decision: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

This gap map keeps Sound/Music/Audio in planning-only status. It does not request internal beta enablement.

| Gap | Status | Needed Before Runtime | Current Action |
| --- | --- | --- | --- |
| Cue manifest persistence | gap_recorded | Approved source-of-truth persistence path and Supabase owner approval. | Docs-only manifest fields recorded. |
| Supabase milestone sync | `blocked_current_branch_missing_sync_layer` | Separate Supabase sync layer if future milestone wants registry writes. | No writer added. |
| Worker runtime for audio processing | blocked | Transactional worker approvals, private media refs, checksums, QA gates. | Route to future Worker Runtime and Track B. |
| Provider audio generation | blocked | Provider Gateway approval, schemas, cost cap, secrets backend-only, redaction. | Mirelo/MMAudio/Lyria recorded as future blocked routes. |
| DeepFilterNet runtime | blocked | Worker approval, bounded private fixture tests, QA, license/security review. | Track B/Sound handoff only. |
| FFmpeg/FFprobe execution | blocked | LGPL configuration review, worker path, command allowlist, QA. | Planning metadata only. |
| Demucs/stem separation | blocked | Provenance/legal/human approval, model source review, worker review. | Blocked path documented. |
| AudioFlux analysis | blocked | Benchmarks, worker approval, speech-safe timing QA. | `audioflux_planning` only. |
| Signalsmith Stretch | blocked | Quality benchmarks, worker approval, bounded stretch settings. | `signalsmith_stretch_handoff` only. |
| Internal sound library | gap_recorded | Provenance, checksums, retention, source-of-truth policy, private refs. | Future planning only. |
| Track A final mix/render/export | blocked | Approved manifests, worker gates, final QA, export policy. | Track A handoff only. |
| Billing and credits | blocked | Credit estimate, user approval, backend ledger path. | Billing handoff only. |
| Public artifact delivery | blocked | Separate product/storage/legal approval. | Explicitly not allowed. |
| Beta and production | blocked | Owner studies, route dry-runs, worker gates, QA, compliance, beta signoff. | No beta/production unlock. |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
