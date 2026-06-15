# Batch 1 Candidate Review

Decision: `blocked_pending_package_lock_sync_review`.

Batch 1 evaluates only install/proof approval readiness. No dependency install, package-lock mutation, tool run, worker run, route run, provider call, media processing, Supabase write, GCS upload, public artifact, signed URL source-of-truth use, raw prompt execution, beta unlock, or production unlock is approved here.

| Candidate | Tool / validator | Owner | Type | Approval status | Execution now | Required next action |
| --- | --- | --- | --- | --- | --- | --- |
| duckdb_metadata_query_proof | DuckDB | TRACK_B_MEDIA_PROCESSING | dependency_system_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair dependency baseline first; later approval may run import/version and an empty metadata-only query |
| polars_metadata_dataframe_proof | Polars | TRACK_B_MEDIA_PROCESSING | dependency_system_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair dependency baseline first; later approval may run import/version with synthetic non-media rows |
| sharp_libvips_import_version_probe | Sharp/libvips | TRACK_B_MEDIA_PROCESSING | dependency_system_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair package-lock sync first; later approval may run version-only import without processing images |
| ffmpeg_version_probe | FFmpeg | TRACK_B_MEDIA_PROCESSING | dependency_system_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair dependency baseline first; later approval may run version-only binary probe in the approved environment |
| ffprobe_version_probe | FFprobe | TRACK_B_MEDIA_PROCESSING | dependency_system_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair dependency baseline first; later approval may run version-only binary probe |
| route_capability_manifest_validation | Route/capability manifest validation | TOOL_ROUTE_EXECUTION | no_dependency_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair dependency baseline first; later approval may run metadata-only manifest validation |
| fixture_report_validation_harness | Fixture/report validation harness | TOOL_ROUTE_EXECUTION | no_dependency_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair dependency baseline first; later approval may validate committed reports only |
| open_source_tool_inventory_validator | Open-source inventory/proof matrix validator | CROSS_CHAT_COORDINATION | no_dependency_candidate | conditionally_eligible_after_dependency_baseline_repair | false | repair dependency baseline first; later approval may run inventory/proof matrix consistency validation |
