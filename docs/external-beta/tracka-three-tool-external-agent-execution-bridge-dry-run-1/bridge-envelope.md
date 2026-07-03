# Three-Tool External Agent Bridge Envelope

The dry run validates the structured envelope created by `buildThreeToolExternalAgentExecutionBridgeInput` and checked by `validateThreeToolExternalAgentExecutionBridgeInput`.

Accepted child route paths:
- `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`
- `/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute`

Accepted command-template IDs:
- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`
- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`

Raw command strings allowed: `false`.

Route execution in this dry-run phase: `false`.

Worker dispatch in this dry-run phase: `false`.

Tool execution in this dry-run phase: `false`.

The bridge dry run is evidence that an external agent can submit a structured three-tool envelope for the next guarded dispatch milestone. It is not evidence of route invocation, worker dispatch, queue mutation, or new tool execution.
