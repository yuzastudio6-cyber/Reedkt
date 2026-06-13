# TRACK_B_MEDIA_PROCESSING Blocked-Use Register

Every item below remains blocked in TOOL-STUDY-0.

| Blocked Use | Status | Reason | Required Future Approval |
| --- | --- | --- | --- |
| Real media processing | blocked | Docs/diagnostics only. | Track B controlled runtime approval. |
| Real FFmpeg/FFprobe execution | blocked | No command execution in TOOL-STUDY-0. | FFmpeg/FFprobe runtime and license/build review. |
| Real OCR execution | blocked | OCR model/runtime path is not approved here. | OCR runtime, model, privacy, and QA approval. |
| Real OpenCV execution | blocked | Computer vision runtime is not approved here. | OpenCV runtime and native dependency review. |
| Real PyAV execution | blocked | Media decode/access runtime is not approved here. | PyAV/FFmpeg-linked runtime review. |
| Real PySceneDetect execution | blocked | Scene detection runtime is not approved here. | Scene fixture/runtime approval. |
| Real Sharp/libvips execution | blocked | Derivative generation is not approved here. | Dependency/security/LGPL review and runtime approval. |
| Real audio cleanup execution | blocked | Audio cleanup execution is outside this packet. | Sound/Track B controlled cleanup approval. |
| DeepFilterNet runtime | blocked | Prior evidence is bounded; no rerun here. | Runtime rerun and QA approval. |
| Signalsmith Stretch runtime | blocked | Prior evidence is bounded; no rerun here. | Runtime rerun and audio quality approval. |
| Demucs runtime | blocked | Provenance/legal/model-artifact review unresolved. | Human/legal/provenance approval. |
| Qwen3-VL runtime | blocked | VLM/provider/model runtime not approved. | Provider Gateway and VLM runtime approval. |
| vLLM runtime | blocked | Model serving/GPU runtime not approved. | Serving architecture/security approval. |
| Broad media | blocked | No broad artifact scope or retention policy. | Broad-media owner approval. |
| Public artifacts | blocked | Private artifacts only by default. | Public delivery/access-control policy. |
| Signed URLs as source-of-truth | blocked | Signed URLs are delivery mechanisms, not truth records. | Separate delivery-only policy if ever approved. |
| Raw prompt execution | blocked | Workers execute approved snapshots/manifests only. | None; raw prompt execution remains disallowed. |
| Worker Runtime execution | blocked | WORKER-1 is dry-run only. | Transactional runtime approval. |
| Provider/model calls | blocked | Provider Gateway owns provider execution policy. | Explicit provider/model execution phase. |
| Production unlock | blocked | This packet is not a production gate. | Production readiness gate. |
| External beta unlock | blocked | This packet is owner-study only. | External beta gate. |
| Paid production unlock | blocked | Billing/credits outside scope. | Billing/production approval. |
| Unapproved dependency mutation | blocked | No packages are added. | Dependency/security/license approval. |
| Supabase mutation | blocked | No writer exists or is added. | Supabase owner path. |
| Credit/billing mutation | blocked | Billing not owned by Track B. | Billing/Stripe/credits milestone. |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
