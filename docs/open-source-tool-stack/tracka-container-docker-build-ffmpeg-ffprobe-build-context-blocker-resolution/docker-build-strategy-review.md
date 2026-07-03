# Docker Build Strategy Review

| Strategy | Risk | Owner | Exact command availability | Allowed next | Reason |
| --- | --- | --- | --- | --- | --- |
| `generate_existing_build_context_then_rerun_approved_docker_build` | medium | OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF with Track A awareness | available_for_future_approval | true | Committed package scripts and Vite configs map exactly to every Dockerfile COPY directory. |
| `slim_version_probe_only_dockerfile` | medium | TRACK_A_RENDER_EXPORT plus Docker/container owner | not_currently_approved | false | Safer for version-only probing, but this phase must not mutate Dockerfiles. |
| `tracka_worker_image_handoff` | low | TRACK_A_RENDER_EXPORT and WORKER_RUNTIME_JOBS | not_required_before_next_approval | false | Useful later if build-context generation policy changes, but exact commands are already derivable. |
| `block_pending_source_policy` | low | OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF | not_needed | false | Not selected because exact build-context commands are now available. |

Selected strategy: `generate_existing_build_context_then_rerun_approved_docker_build`.
