# Request Envelope

The dry run validated this external-agent request envelope through `server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.ts`.

Required references preserved:

- approved snapshot: `approved-snapshot-agent-execution-bridge-dry-run-1`
- approval record: `approval-record-agent-execution-bridge-dry-run-1`
- no-spend fixture policy: `no-spend-fixture-policy-agent-execution-bridge-dry-run-1`
- job: `job-agent-execution-bridge-dry-run-1`
- worker lease: `worker-lease-agent-execution-bridge-dry-run-1`
- route idempotency key: `gstreamer-mkvtoolnix:agent-bridge-dry-run-1:approved-snapshot:job:template`
- command template: `gst_controlled_generated_fixture_pipeline_v1`
- private input manifest: `private-input-manifest-agent-execution-bridge-dry-run-1`
- private input manifest SHA-256: `4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357`
- output manifest schema: `output-manifest-schema-agent-execution-bridge-dry-run-1`
- QA report schema: `qa-report-schema-agent-execution-bridge-dry-run-1`
- cleanup policy: `cleanup-policy-agent-execution-bridge-dry-run-1`
- retention policy: `retention-policy-agent-execution-bridge-dry-run-1`
- failure policy: `failure-policy-agent-execution-bridge-dry-run-1`
- audit parent: `audit-parent-agent-execution-bridge-dry-run-1`
- runtime execution run ID: `2026-06-30T16-19-10-513Z-a91246d2`
- runtime execution merge SHA: `4dec43f1edce87531eee61a7704b58545afd50b9`

Rejected external-agent input classes:

- raw command strings allowed: `false`
- raw chat accepted: `false`
- arbitrary file paths accepted: `false`
- public URL source-of-truth accepted: `false`
- signed URL source-of-truth accepted: `false`
- arbitrary private media accepted: `false`

Confirmation required for future dispatch: `true`
