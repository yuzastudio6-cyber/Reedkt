# Safety Boundary

This packet moves the GStreamer/MKVToolNix generated-fixture lane from a local mock queue payload toward the existing backend job service. It is a handoff phase, not an execution phase.

Allowed in this phase:

- Backend route registration.
- Backend job-service handoff.
- Local/mock job batch and job creation in validation.
- Future service-role job batch/job record write only behind the explicit persisted handoff gate and existing backend job service.
- Storing the already-proven generated-fixture runtime invocation body in job payload metadata.

Not enabled in this phase:

- Runtime route invocation: `false`
- GStreamer execution: `false`
- MKVToolNix execution: `false`
- Worker dispatch: `false`
- Worker execution: `false`
- Worker lease claim: `false`
- Private media processing: `false`
- User media processing: `false`
- FFmpeg/FFprobe execution: `false`
- Docker execution: `false`
- Remotion execution: `false`
- Supabase mutation during validation: `false`
- SQL execution: `false`
- Secret payload access: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Final render/export: `false`
- External beta unlock: `false`
- Paid production unlock: `false`
- Production unlock: `false`

Package-lock: `unchanged`

Generated artifacts committed: `none`
