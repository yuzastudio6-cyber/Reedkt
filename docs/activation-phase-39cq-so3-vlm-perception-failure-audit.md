# Phase 39C-Q-SO3 Perception Failure Audit

The current VLM failures are layered, not one single bug.

| Layer | Evidence | Current finding |
| --- | --- | --- |
| Memory/runtime startup | PR #66 | Original `Qwen/Qwen3-VL-8B-Instruct` BF16 copied and verified private assets, then vLLM OOMed on Cloud Run L4 before inference. |
| Candidate size/recovery | PR #87 | Official Qwen 8B FP8, 4B BF16, and 2B BF16 candidates were privately staged and verified. Runtime reached generated output, but JSON/schema QA failed. |
| Structured output syntax | PR #90 | Structured-output enforcement improved syntax coverage, but no S1-S5 strategy passed all required image fixtures. |
| Perception semantics | SO3 | The unresolved question is whether candidates can reliably identify simple generated shapes/text/UI zones before full object-region/safe-zone QA. |

SO3 therefore starts with perception canaries and stops early when a candidate cannot pass simple label/zone/safe-zone gates. This avoids another broad structured-output retry that hides semantic failure behind JSON parsing noise.
