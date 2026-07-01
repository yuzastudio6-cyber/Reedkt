# Narrow External-Agent Runtime Bridge Negative Cases

The bridge rejects these unsafe or out-of-scope requests:

- `blocked_missing_narrow_external_agent_runtime_bridge_reference`
- `blocked_invalid_narrow_external_agent_runtime_bridge_state`
- `blocked_unapproved_narrow_external_agent_runtime_command_template`
- `blocked_unsupported_narrow_external_agent_runtime_input`
- `blocked_unsafe_narrow_external_agent_runtime_bridge_request`
- `blocked_narrow_external_agent_runtime_source_evidence_mismatch`

Explicit rejected inputs include raw commands, raw chat, arbitrary file paths, private media paths, user media paths, public URL source-of-truth, signed URL source-of-truth, route execution, worker dispatch, worker execution, worker process start, worker lease claim, persistent queue write, GStreamer execution, MKVToolNix execution, Docker execution, Docker push/deploy, FFmpeg/FFprobe execution, Remotion execution, media processing, Supabase mutation, SQL execution, signed URL creation, public artifact creation, final render/export, broad external beta unlock, paid production unlock, and production unlock.

The implementation is intentionally a backend-source validation bridge only. It is not a hidden route or worker execution lane.
