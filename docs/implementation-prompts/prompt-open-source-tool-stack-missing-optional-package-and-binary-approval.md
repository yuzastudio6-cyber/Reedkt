# OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL

Approve a future package/binary phase for DuckDB, Polars, FFmpeg, and FFprobe only if the source-of-truth review remains at decision `missing_optional_install_review_passed_ready_for_package_and_binary_approval`.

Allowed future scope to request separately:

- DuckDB package approval for `duckdb` with a narrowly reviewed package-lock diff.
- Polars package approval for `nodejs-polars` with a narrowly reviewed package-lock diff.
- FFmpeg/FFprobe system binary or worker-container approval with LGPL-safe build metadata and version-probe-only validation.

This prompt does not authorize installation, package-lock mutation, system binary installation, container mutation, import smoke, version probes, fixture proofs, media processing, workers, routes, providers, Supabase/GCS mutation, public artifacts, signed URLs, raw prompts, beta, or production.
