# VLM Blocker Matrix

| Scope | Current VLM status | Reason |
| --- | --- | --- |
| Exact asset selection | Allowed after HF metadata verification | Uses pinned `Qwen/Qwen3-VL-8B-Instruct` revision only. |
| Private model download | Phase 39B passed | Exact selected assets are staged privately and must be reused by later phases. |
| Private GCS upload | Phase 39B passed for model assets | Phase 39C may upload only private JSON QA artifacts to the approved QA prefix. |
| vLLM runtime | Phase 39C/39C-Q blocked | Original BF16 8B remains blocked on L4 CUDA OOM. Phase 39B-Q/39C-Q recovery candidates verified private assets and reached generated fixture execution, but all failed the structured JSON/schema QA gate. |
| Official Qwen L4-compatible recovery | Phase 39B-Q/39C-Q blocked after all approved candidates attempted | `Qwen/Qwen3-VL-8B-Instruct-FP8`, `Qwen/Qwen3-VL-4B-Instruct`, and `Qwen/Qwen3-VL-2B-Instruct` were attempted in order with exact revision pinning, private GCS staging, checksum verification, local model path runtime, generated fixtures only, and private QA artifacts. Candidate fallback is exhausted for this prompt. |
| Structured output recovery | Phase 39C-Q-SO implemented but blocked | Only PR #87 staged official Qwen candidates were rerun. Complete matrix run `phase39cq-so-20260601T035158` blocked all candidates on direct JSON/schema QA. Follow-up run `phase39cq-so-20260601T041325` reached 2B S1/S3/S4 generated-fixture execution but still failed compact schema/object-region/safe-zone QA; 4B and 8B FP8 direct-constructor retries were cancelled after no safe report artifacts were produced. S0/S6 are diagnostic only. New model downloads, new staging, real media, providers, public output, beta, production, Phase 39D, Phase 39E, and Track A remain blocked. |
| Transformers inference | Fallback-only and clearly labeled | It may not be called a vLLM pass and cannot unlock Phase 39D if primary vLLM is required and failed. |
| GPU jobs | Guarded L4 only | No unapproved GPU type, provider fallback, or quantized variant is approved. |
| Images/video/media | Generated fixtures only | Real frames, real video, broad media, and arbitrary images/video remain blocked. |
| Provider calls | Blocked | No Qwen, DashScope, HF Inference Providers, OpenAI-compatible VLM endpoints, or external inference. |
| Public output | Blocked | All model assets, runtime reports, and QA artifacts remain private. |
| IAM/GCP infrastructure mutation | Guarded scoped IAM only | Phase 39C defaults to text-only IAM plans. Recorded evidence adds only conditional model-read and QA-create bindings for the staging GPU worker service account; future IAM mutation still requires explicit current-shell confirmation. |
| Beta/production | Blocked | Phase 39C can only become phase-complete while the VLM tool family remains incomplete. |
| Track A | Blocked | No SAM2/render/visual runtime or Track A code changes. |

If private model read, checksum verification, local model preparation, vLLM startup, generated fixture inference, schema validation, hallucination/safety QA, private artifact upload, or GPU/runtime availability fails, Phase 39C/39C-Q/39C-Q-SO remains incomplete and Phase 39D remains blocked. Current Phase 39C-Q-SO result: no approved official Qwen candidate passed S1-S5 direct structured-output QA. The active next path is a blocker-specific vLLM structured-output compatibility/debug follow-up; a different GPU class, non-Qwen VLM candidate, or different runtime still requires separate approval.
