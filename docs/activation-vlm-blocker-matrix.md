# VLM Blocker Matrix

| Scope | Current VLM status | Reason |
| --- | --- | --- |
| Exact asset selection | Allowed after HF metadata verification | Uses pinned `Qwen/Qwen3-VL-8B-Instruct` revision only. |
| Private model download | Phase 39B passed | Exact selected assets are staged privately and must be reused by later phases. |
| Private GCS upload | Phase 39B passed for model assets | Phase 39C may upload only private JSON QA artifacts to the approved QA prefix. |
| vLLM runtime | Phase 39C confirmation-gated | Generated synthetic fixture runtime only, local model path only, checksum verified before startup. |
| Transformers inference | Fallback-only and clearly labeled | It may not be called a vLLM pass and cannot unlock Phase 39D if primary vLLM is required and failed. |
| GPU jobs | Guarded L4 only | No unapproved GPU type, provider fallback, or quantized variant is approved. |
| Images/video/media | Generated fixtures only | Real frames, real video, broad media, and arbitrary images/video remain blocked. |
| Provider calls | Blocked | No Qwen, DashScope, HF Inference Providers, OpenAI-compatible VLM endpoints, or external inference. |
| Public output | Blocked | All model assets, runtime reports, and QA artifacts remain private. |
| IAM/GCP infrastructure mutation | Blocked | Phase 39C emits text-only IAM plans and does not change IAM. |
| Beta/production | Blocked | Phase 39C can only become phase-complete while the VLM tool family remains incomplete. |
| Track A | Blocked | No SAM2/render/visual runtime or Track A code changes. |

If private model read, checksum verification, local model preparation, vLLM startup, generated fixture inference, schema validation, hallucination/safety QA, private artifact upload, or GPU/runtime availability fails, Phase 39C remains incomplete and Phase 39D remains blocked.
