# Gate And Input Contract

Required gate for the next runtime dry run:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_DRY_RUN=true`

Required refs:

- approved snapshot
- approval record
- credit/no-spend policy
- job
- worker lease
- route idempotency key
- command-template allowlist
- private input manifest
- output manifest schema
- QA report schema
- cleanup policy
- retention policy
- failure policy
- audit parent

Rejected inputs:

- raw command strings
- raw chat
- frontend file paths
- public URL source-of-truth
- signed URL source-of-truth
- arbitrary private media
- unmanifested files
- provider/model prompt payloads
- service-role secret payloads
- broad service-role handlers
- final render/export requests
- unlock attempts

Blocked unless separately approved in a later packet:

- arbitrary user/private media
- FFmpeg/FFprobe expansion
- Docker deployment
- Remotion rendering
- Supabase mutation
- SQL execution
- signed/public artifact flows
- broad external beta audience expansion
- paid production or production unlock

This plan phase performs no runtime validation. It only defines the future gate and allowed input envelope.
