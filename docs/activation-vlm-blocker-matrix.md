# VLM Blocker Matrix

| Scope | Phase 39B status | Reason |
| --- | --- | --- |
| Exact asset selection | Allowed after HF metadata verification | Uses pinned `Qwen/Qwen3-VL-8B-Instruct` revision only. |
| Private model download | Confirmation-gated | Requires the current-shell VLM model download confirmation. |
| Private GCS upload | Confirmation-gated | Requires the current-shell VLM private GCS upload confirmation and approved private prefix. |
| vLLM runtime | Blocked | Phase 39C only after private staged assets pass. |
| Transformers inference | Blocked | No inference or model instantiation in Phase 39B. |
| GPU jobs | Blocked | Runtime/cost review deferred to Phase 39C. |
| Images/video/media | Blocked | Phase 39B handles model files only. |
| Provider calls | Blocked | No Qwen, DashScope, HF Inference Providers, OpenAI-compatible VLM endpoints, or external inference. |
| Public output | Blocked | All model assets and safe manifests remain private. |
| IAM/GCP infrastructure mutation | Blocked | Upload to approved prefix only; no IAM changes or bucket creation. |
| Beta/production | Blocked | Phase 39B is private staging evidence only. |
| Track A | Blocked | No SAM2/render/visual runtime or Track A code changes. |

If source/license metadata changes, the exact revision cannot be resolved, the file list differs, disk/access is insufficient, download/checksum/upload/verification fails, or GCS object metadata is unreliable, Phase 39B remains incomplete and Phase 39C remains blocked.
