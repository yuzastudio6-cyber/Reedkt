# Edit Level Estimates Boundary

RP-EDITLEVEL-09 is mock/local policy and UI only.

Forbidden in this milestone:

- no credit reservation
- no credit spend
- no credit record
- no render/export
- no worker
- no provider call
- no Qwen call
- no Qwen2.5-VL call
- no DeepSeek call
- no real planner
- no edit plan creation
- no media processing
- no upload or file-byte read
- no external fetch
- no Supabase migration or persistence

All estimate packages and items preserve false side-effect flags and keep `mockOnly: true` plus `estimateOnly: true`.

Runtime `basic | pro | premium` behavior remains unchanged. Public Normal/Premium/Ultra Premium selection and canonical-to-legacy compatibility stay at the existing UI boundary only.
