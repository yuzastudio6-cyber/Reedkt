# RP-INTERNAL-BETA-E2E Negative Gate Safety Boundary

The negative-gate smoke is allowed to call local fail-closed scaffold functions and deterministic planner code only.

## Confirmed Disabled States

- Credit reservation creation: `false`
- Credit spend: `false`
- Worker dispatch executed: `false`
- Worker execution: `false`
- Provider/model calls: `false`
- Model call: `false`
- Raw prompt execution: `false`
- Route execution: `false`
- Remotion execution: `false`
- FFmpeg execution: `false`
- FFprobe execution: `false`
- Media processing: `false`
- Storage object creation: `false`
- Storage object read: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Internal beta unlock: `false`
- External beta unlock: `false`
- Production unlock: `false`

## Boundary

Passing these tests does not make internal beta ready. It only proves the disabled lane is still fail-closed against the most important unsafe entry points. Internal beta remains blocked until runtime enablement, service-role mutation handlers, private artifact policy, provider adapter approval, render worker proof, QA, cleanup, and observability pass separate gates.
