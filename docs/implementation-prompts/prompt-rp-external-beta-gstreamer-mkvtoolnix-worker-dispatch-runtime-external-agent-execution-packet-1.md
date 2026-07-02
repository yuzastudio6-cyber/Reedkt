# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-EXECUTION-PACKET-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-DRY-RUN-1` is merged with decision `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_dry_run_envelope`.

Required source inputs:

- source-gate PR #2158 merge SHA `488df755ef9f9954e8696ed336f9106bada06319`;
- dry-run PR #2162 merge SHA `ef5b15adcf5de407f3083abb64ffc14b298692cc`;
- runtime execution packet PR #2166 merge SHA `fc0706786e3413fdfc364d62a87adb45cc64ca36`;
- execution QA PR #2169 merge SHA `b5e0177750f2fdaef0a3e8780e31026838b17d23`;
- external-agent handoff PR #2170 merge SHA `3b96c009902fe72265446264398018b489401880`;
- dry-run decision `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_dry_run_envelope`;
- route path `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`;
- worker source `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`;
- target `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`;
- product-ready end-to-end local OSS tools `0`.

The next packet must remain guarded and narrow. It may plan or prove a guarded external-agent dispatch runtime execution packet only if it names the exact confirmation gate, source evidence, idempotency, rollback, cleanup, fixture scope, and safety boundaries.

It must not broaden to arbitrary user media, public URLs, signed URL source-of-truth, broad worker registration, production unlock, paid production, public artifacts, or final delivery/export.
