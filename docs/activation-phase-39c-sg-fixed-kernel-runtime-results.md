# Phase 39C-SG-FIXED Runtime And Candidate Results

Phase 39C-SG-FIXED runtime escalation is conditional. It may run only after a fixed-kernel profile passes import smoke on Cloud Run L4.

Runtime candidate order is:

1. Candidate C: `Qwen/Qwen3-VL-2B-Instruct`
2. Candidate B: `Qwen/Qwen3-VL-4B-Instruct`
3. Candidate A: `Qwen/Qwen3-VL-8B-Instruct-FP8`

Final selection priority remains A > B > C if more than one candidate passes.

Runtime must copy exact PR #87 private GCS objects, verify every SHA-256 and aggregate hash, prepare a local model directory, pass only the local path to SGLang, block runtime auto-download, run SG0-SG6 canary/decomposed QA, upload private QA artifacts, and keep Phase 39D and Phase 39E blocked.

Before execution, no candidate is selected and VLM tool-family beta status is `blocked`.
