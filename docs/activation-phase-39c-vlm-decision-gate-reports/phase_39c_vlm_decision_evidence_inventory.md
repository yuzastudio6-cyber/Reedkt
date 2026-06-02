# Phase 39C VLM Decision Evidence Inventory

Run id: phase39c-decision-20260602

| Phase | PR | Outcome | Blocker |
| --- | --- | --- | --- |
| 39A Qwen3-VL/vLLM approval workflow | [#62](https://github.com/yuzastudio6-cyber/Reedkt/pull/62) | Qwen3-VL/vLLM planning evidence passed as metadata-only approval planning. | none recorded |
| 39B exact Qwen3-VL asset private staging | [#64](https://github.com/yuzastudio6-cyber/Reedkt/pull/64) | Unquantized Qwen/Qwen3-VL-8B-Instruct assets were pinned, checksummed, uploaded privately, and verified. | none recorded |
| 39C generated VLM runtime verification | [#66](https://github.com/yuzastudio6-cyber/Reedkt/pull/66) | Original unquantized 8B BF16 candidate failed on Cloud Run L4 with CUDA OOM before generated fixture inference. | vLLM engine initialization on Cloud Run L4 for BF16 8B |
| 39B-Q/39C-Q official L4-compatible Qwen candidate recovery | [#87](https://github.com/yuzastudio6-cyber/Reedkt/pull/87) | Official Qwen FP8 8B, BF16 4B, and BF16 2B candidates were privately staged and reached output generation, but failed JSON/schema QA. | required structured JSON/schema QA |
| 39C-Q-SO structured-output enforcement | [#90](https://github.com/yuzastudio6-cyber/Reedkt/pull/90) | Structured-output strategies S1-S5 did not pass all generated fixtures. | compact schema QA; object-region QA; safe-zone QA |
| 39C-Q-SO3 perception canary/decomposed QA | [#97](https://github.com/yuzastudio6-cyber/Reedkt/pull/97) | vLLM/Qwen candidates failed simple generated perception canaries; semantic perception/localization is the blocker. | canary label recall threshold; coarse-region accuracy threshold |
| 39C-SG SGLang alternate runtime evaluation | [#100](https://github.com/yuzastudio6-cyber/Reedkt/pull/100) | SGLang source/license/runtime scaffolding passed, but local Docker buildx hung before image digest or Cloud Run execution. | local Docker buildx image build/push |
| 39C-SG-BUILD Cloud Build runtime rerun | [#104](https://github.com/yuzastudio6-cyber/Reedkt/pull/104) | Cloud Build/image push and Cloud Run L4 job execution worked, but SGLang failed before inference with unresolved cuGreenCtxDestroy. | SGLang engine import due sgl_kernel/common_ops.abi3.so undefined symbol cuGreenCtxDestroy |
| 39C-SG-KERNEL compatibility matrix | [#107](https://github.com/yuzastudio6-cyber/Reedkt/pull/107) | K0-K5 kernel compatibility matrix added; import smoke still failed or was blocked. | tested profiles still hit Cloud Run L4 CUDA/driver symbol blocker or related build/runtime blockers |
| 39C-SG-FIXED fixed SGLang kernel runtime | [#110](https://github.com/yuzastudio6-cyber/Reedkt/pull/110) | Fixed-kernel evidence and profiles were added, but execution was blocked by noninteractive gcloud reauthentication. | noninteractive gcloud token refresh |
| 39C-SG-AUTH-RERUN noninteractive auth fixed-kernel rerun | [#115](https://github.com/yuzastudio6-cyber/Reedkt/pull/115) | Noninteractive auth was unblocked and F1/F2/F3 builds/pushes passed, but no fixed-kernel import-smoke profile passed; generated runtime did not run. | fixed-kernel Cloud Run L4 import smoke |

Package-lock summary: unchanged_across_recent_vlm_phases.
Track A status: untouched.
Model/media payload status: not_committed.
