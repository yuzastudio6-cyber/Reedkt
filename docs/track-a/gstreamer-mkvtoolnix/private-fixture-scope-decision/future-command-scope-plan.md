# Future Command Scope Plan

Plan status: `approval_only_no_execution`

This phase does not authorize or run commands. It defines the minimum command categories that a later private fixture approval may consider.

## GStreamer

Allowed future category: `bounded_private_fixture_pipeline_after_approval`

Disallowed categories: broad user-media pipelines, render/export pipelines, network-dependent pipelines, and unbounded media processing.

## MKVToolNix

Allowed future category: `bounded_private_fixture_mux_or_identify_after_approval`

Disallowed categories: public artifact generation, signed URL delivery, broad user-media processing, and product delivery.

## Global Boundaries

- FFmpeg/FFprobe: `not_allowed`
- Render/export: `not_allowed`
- User media: `not_allowed`
- Network: `disabled_by_default_where_possible`
- Outputs: `temp_private_and_cleaned`
- Logs: `sanitized`
