# RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1

Use this prompt only after `RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1` is merged and the staging API route preflight has passed with HTTP `424` fail-closed.

Required source-of-truth:

- Staging API revision: `reeditpro-staging-api-00008-4ct`
- Route: `POST /api/providers/qwen2-5-vl/structured-visual-metadata`
- Route preflight run ID: `2026-06-30T03-49-20-516Z-10d064e3`
- Decision: `completed_confirmed_qwen_transport_runtime_preflight_route_reached_fail_closed_no_provider_execution`

The next phase may plan a separately confirmed provider runtime fixture only if it names the exact approved snapshot, fixture source, target service, service account, runtime gate, cleanup policy, and cost/credit boundary. It must not broaden to arbitrary user media, raw prompts, public artifacts, signed URL source-of-truth, worker dispatch, final render/export, broad external beta, paid production, or production unlock.

Default state before a future confirmed packet: `blocked_pending_separate_confirmed_provider_runtime_packet`.
