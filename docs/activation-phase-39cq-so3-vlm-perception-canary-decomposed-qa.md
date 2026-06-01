# Phase 39C-Q-SO3 VLM Perception Canary Decomposed QA

Phase 39C-Q-SO3 narrows the VLM blocker after PR #87 and PR #90. It does not retry full object-region QA first. It first proves whether an already staged official Qwen candidate can see simple generated shapes, text, and UI zones.

Allowed scope:

- Already staged PR #87 official Qwen candidates only.
- Candidate execution order: `Qwen/Qwen3-VL-2B-Instruct`, then `Qwen/Qwen3-VL-4B-Instruct`, then `Qwen/Qwen3-VL-8B-Instruct-FP8`.
- Final selection priority if more than one candidate passes: 8B FP8, then 4B, then 2B.
- Generated synthetic fixtures only.
- Private GCS model copy by exact object path and SHA-256 manifest verification.
- Local verified model path only with `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`.
- Private JSON QA artifacts only under `activation/phase39c/generated-vlm-perception-canary/<run-id>/`.

Blocked scope:

- No new model downloads or model staging.
- No real frames, real video, arbitrary media, broad user media, or public image URLs.
- No provider calls, raw prompts, direct tool execution, public artifacts, beta, production, or Track A.
- Phase 39D and Phase 39E remain blocked unless SO3 passes and a later prompt explicitly starts them.

The SO3 pass condition is intentionally decomposed:

1. P0 image transport sanity passes.
2. P1 freeform perception traces are captured as diagnostic evidence only.
3. P2 labels-only structured output reaches canary label recall >= 0.80.
4. P3 coarse-region structured output reaches canary coarse-region accuracy >= 0.80.
5. P4 safe-zone decision is not `unknown`.
6. P5 composed report passes from P2/P3/P4 only.
7. Only then do the five required generated fixtures run with label recall and coarse-region thresholds >= 0.60.

Execution result:

- Run id: `phase39cq-so3-20260601T154510`.
- Runtime image digest: `sha256:52b2ea85777a0b300d434cc9756d984a1f743b4f7caadeb198d3542109dad59a`.
- Candidate C `Qwen/Qwen3-VL-2B-Instruct`: private assets copied and verified, private QA artifacts uploaded, canary label recall `0.00`, coarse-region accuracy `0.00`, blocked.
- Candidate B `Qwen/Qwen3-VL-4B-Instruct`: private assets copied and verified, private QA artifacts uploaded, canary label recall `0.60`, coarse-region accuracy `0.00`, blocked.
- Candidate A `Qwen/Qwen3-VL-8B-Instruct-FP8`: private assets copied and verified, private QA artifacts uploaded, canary label recall `0.60`, coarse-region accuracy `0.00`, blocked.
- Original generated fixtures were not run because no candidate passed the canary gate.

VLM tool-family beta status remains `blocked`.
