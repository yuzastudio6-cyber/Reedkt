# Negative Cases

The smoke and diagnostics require these blockers:

- Missing confirmation: `blocked_missing_narrow_route_worker_source_implementation_confirmation`
- Invalid source packet evidence: `blocked_source_execution_packet_validation_failed`
- Invalid route source: `blocked_route_source_validation_failed`
- Invalid worker source: `blocked_worker_source_validation_failed`
- Missing #2085 QA rollup: `blocked_missing_source_execution_packet_qa_rollup`
- Idempotency mismatch: `blocked_source_implementation_idempotency_mismatch`
- Runtime/tool/media/Supabase/SQL/unlock request: `blocked_route_worker_or_tool_execution_not_enabled`

The source implementation rejects route registration, route execution, worker dispatch, worker execution, worker process start, worker lease claim, persistent job queue writes, GStreamer execution, MKVToolNix execution, Docker execution, FFmpeg/FFprobe execution, Remotion execution, media processing, Supabase mutation, SQL execution, signed/public artifact creation, final export, and beta/production unlocks.
