# Phase 39C VLM Recovery Decision Matrix

## Option A: Controlled L4 GCE/Vertex runtime for SGLang

Move SGLang import-smoke/generated-runtime to a controlled GCE, Vertex, or custom job environment with a reviewed NVIDIA driver/CUDA stack while keeping the L4 GPU class.

Pros: isolates Cloud Run driver/ABI limitation; keeps the L4-only constraint; tests SGLang fairly.

Cons: new runtime environment approval required; additional cost/security/runbook work; not immediate beta readiness.

Required approvals: controlled GCE/Vertex runtime phase; IAM/storage/networking review; private artifact policy; cost cap.

Recommendation: Possible fallback only with explicit human approval.

Confidence: medium

## Option B: Human-approved VLM QA redesign

Keep Qwen/vLLM as advisory label/uncertainty signal only; use OCR, OpenCV, and media-data outputs as authoritative geometry and safe-zone sources.

Pros: fastest product-forward path; aligns with completed OCR chain; reduces dependence on brittle VLM localization; can move beta readiness through deterministic tools.

Cons: lowers VLM role; requires QA contract update; may not satisfy a requirement that VLM owns localization.

Required approvals: human QA contract approval; Phase 46A/46B/46C media-data hardening; later Phase 39E integration redesign.

Recommendation: Default product-forward VLM recovery posture unless VLM-owned localization is mandatory.

Confidence: high

## Option C: Non-Qwen VLM candidate approval

Start a new approval chain for a non-Qwen VLM candidate optimized for generated-image grounding and L4/runtime fit.

Pros: may solve semantic perception issue; cleaner than forcing current Qwen candidates.

Cons: new license/model/runtime review; new download/staging/runtime chain; time/cost risk.

Required approvals: new model approval path; legal/license review; private storage/runtime/generated fixture phases.

Recommendation: Valid only if product explicitly requires VLM-owned perception/localization.

Confidence: medium

## Option D: Different approved GPU/runtime CUDA class

Approve a GPU/runtime environment with newer driver/CUDA support, such as RTX PRO 6000 on Cloud Run if available or another approved GPU platform.

Pros: may unblock SGLang/kernel compatibility; may run larger or more capable models.

Cons: violates current L4-only default; requires explicit approval; higher cost; still may not solve semantic QA.

Required approvals: GPU class approval; cost review; runtime/security review; updated rollback/runbook.

Recommendation: Not default; use only if budget/runtime approval exists.

Confidence: low

## Option E: Continue current Cloud Run L4 SGLang kernel work

Keep trying package/source-build combinations on Cloud Run L4.

Pros: stays within current platform.

Cons: repeated failures; upstream ABI instability; low confidence; burns time without product movement.

Required approvals: specific new upstream fix/version evidence; bounded source-build approval if applicable.

Recommendation: Stop unless there is a specific new upstream fix/version with strong evidence.

Confidence: low

## Option F: Pause VLM and continue Phase 46A media/data hardening

Keep VLM blocked and continue with deterministic media/data tool audit and fixture suite.

Pros: high value for beta readiness; supports OCR/VLM/QA later; lower risk; no blocked GPU runtime dependence.

Cons: VLM remains blocked.

Required approvals: Phase 46A implementation approval.

Recommendation: Immediate next implementation phase unless a human explicitly approves Option A, C, D, or E.

Confidence: high
