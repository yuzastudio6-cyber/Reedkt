# Tool Command Approval

Approval status: `future_command_classes_only`

## GStreamer

Allowed future command category: `bounded_non_decode_synthetic_or_explicit_fixture_pipeline_after_plan`

Disallowed: real media decode, broad user-media pipelines, network-dependent pipelines, render/export pipelines, and product runtime pipelines.

## MKVToolNix

Allowed future command category: `mux_or_identify_explicitly_approved_fixture_after_plan`

Disallowed: broad media probing, public artifact generation, signed URL delivery, and product delivery.

## Global Boundaries

- FFmpeg/FFprobe: `disallowed`
- Render/export: `disallowed`
- Network: `disabled_by_default_where_possible`
- Container: `future_plan_must_define_exact_image_and_cleanup`
- Output: `temporary_private_cleaned`
- Stdout: `sanitized_metadata_only`

No command execution is authorized by this packet.
