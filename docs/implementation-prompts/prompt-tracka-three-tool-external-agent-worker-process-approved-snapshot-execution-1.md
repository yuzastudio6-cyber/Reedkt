# TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-APPROVED-SNAPSHOT-EXECUTION-1

Use this only after `TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-DISPATCH-CLAIM-LEASE-1` is merged with validation passed.

Goal: prove the approved-snapshot generated-fixture runtime can be invoked from the bounded worker-process lane after a local/mock worker lease claim.

Required boundaries:

- Worker input must reference the approved snapshot job payload and local/mock worker lease claim.
- Runtime execution remains generated-fixture only for GStreamer, MKVToolNix, and GPAC/MP4Box.
- No private/user media, public URLs, signed URLs, public artifacts, Supabase mutation, SQL execution, production unlock, final render/export, or broad media is allowed.
- Any generated proof output remains under `/tmp` and is not committed.
