# Phase 39C VLM Recovery Decision Matrix

## Option A: Controlled L4 GCE/Vertex Runtime For SGLang

Move SGLang import-smoke and generated runtime to a controlled GCE, Vertex, or custom job environment with a reviewed NVIDIA driver/CUDA stack while keeping L4.

Recommendation: possible fallback only with explicit human approval.

## Option B: Human-Approved VLM QA Redesign

Keep VLM as an advisory label/uncertainty signal and use OCR/OpenCV/media-data outputs as authoritative geometry and safe-zone sources.

Recommendation: default VLM recovery posture unless VLM-owned localization is mandatory.

## Option C: Non-Qwen VLM Candidate Approval

Start a new model approval path for a non-Qwen VLM candidate optimized for generated-image grounding and L4/runtime fit.

Recommendation: valid only if product explicitly requires VLM-owned perception/localization.

## Option D: Different Approved GPU/Runtime CUDA Class

Approve a newer GPU/runtime CUDA environment.

Recommendation: not default; requires explicit budget, runtime, and security approval.

## Option E: Continue Cloud Run L4 SGLang Kernel Work

Keep trying package/source-build combinations on Cloud Run L4.

Recommendation: stop unless there is a specific new upstream fix/version with strong evidence.

## Option F: Pause VLM And Continue Phase 46A

Keep VLM blocked and continue deterministic media/data tool readiness.

Recommendation: immediate next implementation phase unless a human explicitly approves another VLM recovery path.
