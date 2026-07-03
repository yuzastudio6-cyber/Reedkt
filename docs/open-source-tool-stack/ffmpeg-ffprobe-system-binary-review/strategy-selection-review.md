# FFmpeg / FFprobe Strategy Selection Review

Recommended strategy: `repo_owned_render_worker_dockerfile_path_after_tracka_source_of_truth_merge`

## central_local_system_binary

- Owner: `OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF`
- Recommended: false
- Package-lock impact: none
- Docker/container impact: none
- Media-processing risk: low only for future version probes; high if expanded beyond version probes
- Reason: Central source-of-truth does not yet contain enough FFmpeg/FFprobe binary provenance.

## repo_owned_render_worker_dockerfile_path

- Owner: `TRACK_A_RENDER_EXPORT`
- Recommended: true
- Package-lock impact: none
- Docker/container impact: metadata-only in this phase; future container proof requires separate approval
- Media-processing risk: blocked in this phase
- Reason: Relevant Track A evidence exists but must be reconciled into central source-of-truth first.

## worker_container_image

- Owner: `WORKER_RUNTIME_JOBS`
- Recommended: false
- Package-lock impact: none
- Docker/container impact: future owner handoff only
- Media-processing risk: blocked
- Reason: Worker/container ownership should follow Track A source-of-truth reconciliation.

## sound_music_audio_owner_lane

- Owner: `SOUND_MUSIC_AUDIO`
- Recommended: false
- Package-lock impact: none
- Docker/container impact: none
- Media-processing risk: audio processing remains blocked
- Reason: Sound handoff is informative, not the central next blocker.
