# Negative Test Matrix

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-DISABLED-WORKER-SCAFFOLD-1`

Smoke script: `server/smoke/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-smoke.ts`

Smoke script status: `passed`

## Required Blocking Categories

| Case | Expected blocker |
| --- | --- |
| missing approved snapshot | `blocked_missing_approved_plan_snapshot` |
| missing approval record | `blocked_missing_approval_record` |
| missing credit reservation or no-spend fixture policy | `blocked_missing_credit_or_no_spend_policy` |
| missing disabled worker lease | `blocked_missing_worker_lease` |
| missing idempotency key | `blocked_missing_idempotency_key` |
| unapproved command template | `blocked_unapproved_command_template` |
| raw command string | `blocked_raw_command_string` |
| missing private input manifest | `blocked_missing_private_input_manifest` |
| manifest checksum mismatch | `blocked_manifest_checksum_mismatch` |
| raw chat, frontend file path, arbitrary media, unmanifested file, provider/model payload, or service-role secret payload | `blocked_unapproved_media_source` |
| public URL or signed URL source-of-truth | `blocked_public_or_signed_url_source` |
| missing output manifest schema | `blocked_output_manifest_missing` |
| missing QA report schema | `blocked_qa_report_missing` |
| missing cleanup, retention, or failure policy | `blocked_cleanup_policy_missing` |
| worker, route, tool, media, Supabase, SQL, Docker, Remotion, or FFmpeg/FFprobe execution attempt | `blocked_worker_or_tool_execution_attempt` |
| signed/public artifact, final export, beta/production unlock, dependency, or package-lock mutation attempt | `blocked_delivery_or_unlock_attempt` |

## Allowed Metadata Template IDs

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

These IDs are metadata only in this phase. The smoke confirms they validate as contract metadata but does not execute them.
