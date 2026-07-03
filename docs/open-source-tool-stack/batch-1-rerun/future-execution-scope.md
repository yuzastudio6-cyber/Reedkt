# Future Execution Scope

Decision: `approved_for_future_open_source_tool_stack_batch_1_install_proof_execution`.

The approved future scope is narrow: version/import probes and committed metadata validators only. The future packet must use `OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1` and fail closed if a declared package or system binary is missing.

Allowed future proof classes:

- DuckDB and Polars import/version checks with synthetic in-memory metadata only, if already present.
- Sharp/libvips import/version metadata only.
- FFmpeg and FFprobe version-only probes.
- Route/capability manifest, fixture/report, and inventory/proof matrix validation.

Still blocked: dependency installation, package-lock mutation, new JS tool dependencies, system binary installation, real media processing, Sharp image-buffer proof, route execution, worker execution, provider calls, Supabase/GCS writes, public artifacts, signed URLs, raw prompts, beta, and production.
