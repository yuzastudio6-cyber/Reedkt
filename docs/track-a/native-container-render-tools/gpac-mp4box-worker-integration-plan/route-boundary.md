# GPAC/MP4Box Route Boundary

Future route work must be backend-only and service-role-owned. It must accept only approved snapshot and job references, never raw frontend file paths, raw chat, public URLs, signed URLs as source-of-truth, arbitrary private media, or user-provided command strings.

Required route behavior:
- verify approved snapshot, approval record, and credit gate references;
- enforce idempotency before enqueueing;
- resolve inputs through a private input manifest with checksums;
- create or reference a private artifact manifest only after worker completion;
- expose readback as sanitized status/QA metadata only;
- keep public artifacts and signed/public delivery blocked.

Blocked in this phase: route implementation, route execution, service-role write execution, Supabase mutation, SQL, storage transfer, worker execution, GPAC/MP4Box execution, FFmpeg/FFprobe helper expansion, render/export, external beta product use, and production.
