# Three-Tool External-Agent Bridge Contract

Bridge packet: `TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-1`

Ready status: `ready_for_confirmation_gated_three_tool_external_agent_execution_bridge_dry_run`

Future dry-run gate:

`REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DRY_RUN=true`

The bridge source exports:

- `buildThreeToolExternalAgentExecutionBridgeInput`
- `validateThreeToolExternalAgentExecutionBridgeInput`
- `summarizeThreeToolExternalAgentExecutionBridgeBoundary`

The bridge composes these existing child routes:

- `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`
- `/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute`

Allowed child command templates:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`
- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`

The bridge rejects:

- missing approved snapshot / approval / job / worker lease / manifest / QA / cleanup references;
- evidence run IDs that do not match the accepted QA rollup;
- raw command strings;
- raw chat as an execution source;
- arbitrary file paths;
- private/user media refs;
- public URL source-of-truth;
- signed URL source-of-truth;
- route execution requested immediately in this source packet;
- worker dispatch requested immediately in this source packet;
- tool or Docker execution requested immediately in this source packet;
- Supabase mutation, SQL, public artifacts, signed URLs, final render/export, beta/production unlocks.

The bridge is source-level only. Runtime invocation requires a future dry-run packet and a separate confirmation gate.
