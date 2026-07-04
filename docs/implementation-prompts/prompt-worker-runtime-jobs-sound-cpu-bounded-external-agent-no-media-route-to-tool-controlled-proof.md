# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-CONTROLLED-PROOF

Run one controlled local proof that the existing internal no-media route can call the controlled SOUND CPU tool runner.

Required source evidence:
- Route-to-tool source gate decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_source_gate_completed_with_warnings_ready_for_controlled_route_to_tool_proof`.
- The route remains default-off unless `REEDITPRO_SOUND_CPU_NO_MEDIA_ROUTE_TO_TOOL_EXECUTION_ENABLED=1`.
- The controlled Python runner has already proven all 15 accepted tools with synthetic in-memory operations.

Allowed proof scope:
- Hydrate a disposable Python venv outside tracked source.
- Run a localhost-only HTTP proof against `/api/internal/workers/sound-cpu/no-media-agent-call`.
- Set only the bounded env gate and controlled Python path for the proof process.
- Use synthetic/no-media envelope input and one or more allowlisted tool ids.

Do not run real user media, worker dispatch, media file open, provider/model calls, Supabase/SQL, artifact writes, Docker/Cloud Run, beta, production, or broad route/runtime unlocks. Stop if the proof cannot keep those gates closed.
