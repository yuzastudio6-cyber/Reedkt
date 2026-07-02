# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-HANDOFF-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-QA-1` passes and is merged.

Required source inputs:

- source-gate PR #2158 merge SHA `488df755ef9f9954e8696ed336f9106bada06319`;
- dry-run PR #2162 merge SHA `ef5b15adcf5de407f3083abb64ffc14b298692cc`;
- runtime execution packet PR #2166 merge SHA `fc0706786e3413fdfc364d62a87adb45cc64ca36`;
- execution-packet decision `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet`;
- execution-packet QA decision `qa_passed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet_evidence`;
- execution-packet run ID `2026-07-02T16-27-38-186Z-1ce73813`;
- runtime delegate run ID `2026-07-02T16-27-38-291Z-a5f6a279`;
- route path `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`;
- worker source `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`;
- readiness `ready_for_external_agent_worker_dispatch_runtime_handoff`;
- product-ready end-to-end local OSS tools `0`.

The handoff packet may define the next external-agent contract for the narrow generated-fixture route/runtime delegate. It must not broaden to arbitrary media, raw caller commands, raw chat execution, broad worker registration, public artifacts, signed URL source-of-truth, Supabase mutation, SQL execution, final render/export, broad external beta audience unlock, paid production unlock, or production unlock.

The handoff must preserve explicit confirmation gates, exact route path, exact worker source, approved fixture scope, idempotency keys, cleanup policy, artifact manifest requirements, QA evidence requirements, rollback notes, and non-production target metadata for `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
