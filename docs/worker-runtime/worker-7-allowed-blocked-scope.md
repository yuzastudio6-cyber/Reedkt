# WORKER-7 Allowed And Blocked Scope

WORKER-7 is expected to execute the controlled no-op worker gate approved by WORKER-6, if the WORKER-6 packet validates and owner scope remains unchanged.

## Allowed

- Read committed worker fixture files only.
- Read approved plan snapshot fixture placeholders.
- Read scoped tool-call manifest placeholders.
- Read worker job payload fixture placeholders.
- Perform local/offline no-op validation only.
- Write ignored local/offline evidence under `<OFFLINE_NOOP_OUTPUT_DIR>`.
- Commit sanitized summaries only.
- Run static diagnostics proving no runtime imports, no job claims, no lease mutation, no queue execution, no route/tool dispatch, no provider calls, and no Supabase mutation.

## Blocked

- Live worker execution.
- Worker job claim.
- Worker lease mutation.
- Queue execution.
- Route execution.
- Tool execution.
- Route handler import.
- Tool runtime import.
- Worker runtime import.
- Provider/model calls.
- Supabase mutation.
- SQL execution.
- GCS upload or storage transfer.
- Signed URL creation.
- Public artifact creation.
- Raw prompt execution.
- Media/audio processing.
- Audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, or Demucs execution.
- Internal beta, external beta, paid production, or production unlock.

## Required Source Evidence

WORKER-7 must use WORKER-6, WORKER-5, WORKER-4, WORKER-3, WORKER-2, TOOL-ROUTE-5, PLAN-SNAPSHOT, and owner-study evidence as source inputs. Missing or inconsistent source evidence must fail closed.

Recommended next prompt: `WORKER-7 - Controlled No-Op Worker Gate Execution`.
