# Approved Demucs Model Artifacts

This directory is a company-controlled slot for Demucs model artifacts. Git must
only contain templates and documentation here. Real model files, approval
manifests, and checksum files are intentionally ignored.

Runtime Demucs separation is allowed only when:

- `DEMUCS_ENABLED=true`
- `DEMUCS_MODEL_ID` matches the approved model directory
- `DEMUCS_MODEL_PATH` points at the approved local/company-controlled model file
- `DEMUCS_APPROVAL_PATH` points at a valid `approval.json`
- `DEMUCS_ALLOW_RUNTIME_DOWNLOADS=false`

The worker must fail closed if approval, provenance, or checksum validation fails.
