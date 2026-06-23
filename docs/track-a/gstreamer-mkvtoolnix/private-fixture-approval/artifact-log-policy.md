# Artifact And Log Policy

Policy status: `approved_for_future_plan_only`

- Temp-only artifacts: `required_for_future_plan`
- Committed SRT/MKV/media artifacts: `blocked`
- Committed private artifacts: `blocked`
- Public artifacts: `blocked`
- Signed URLs: `blocked`
- GCS upload: `blocked_without_separate_approval`
- Mandatory cleanup: `required`
- Secret payloads in logs: `blocked`
- Private contents in stdout/stderr: `blocked`
- Reports: `safe_metadata_only`

Future planning must define exact cleanup verification before any execution prompt can be considered.
