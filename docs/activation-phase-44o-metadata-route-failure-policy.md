# Phase 44O Metadata Route Failure Policy

Phase 44O must fail closed for unsafe requests.

Required failure fixtures cover secret payload access, raw chat execution, route execution, runtime execution, tool execution, DuckDB runtime, worker execution, sidecar execution, Demucs, VLM, provider calls, public output, arbitrary paths, media artifacts, signed URL source, and cost hard-blocks.

If any fixture does not block with the expected reason, the phase is blocked.
