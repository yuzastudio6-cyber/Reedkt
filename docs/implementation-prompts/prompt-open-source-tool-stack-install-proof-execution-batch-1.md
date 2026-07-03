# OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1

Use the source branch containing `approved_for_future_open_source_tool_stack_batch_1_install_proof_execution` as the base for the Batch 1 proof execution packet.

Allowed future proof scope is still narrow:

- DuckDB and Polars import/version plus synthetic metadata-only checks, only if already present.
- Sharp/libvips import/version metadata only.
- FFmpeg and FFprobe version probes only.
- Route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation.

Do not install dependencies, mutate `package-lock.json`, add new JS tool dependencies, install system binaries, process real media, run routes/workers/providers, mutate Supabase/GCS, create public artifacts, create signed URLs, run raw prompts, merge PRs, or unlock beta/production.

If any selected package or binary is missing, fail closed with exact blocker metadata instead of installing it.

Expected decision for a passing execution packet: `open_source_tool_stack_batch_1_install_proof_execution_passed_ready_for_next_install_proof_batch_review`.
