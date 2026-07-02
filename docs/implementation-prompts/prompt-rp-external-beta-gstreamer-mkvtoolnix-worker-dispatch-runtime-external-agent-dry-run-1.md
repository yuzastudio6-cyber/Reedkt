# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-DRY-RUN-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-HANDOFF-1` passes and is merged.

Required source inputs:

- source-gate PR #2158 merge SHA `488df755ef9f9954e8696ed336f9106bada06319`;
- dry-run PR #2162 merge SHA `ef5b15adcf5de407f3083abb64ffc14b298692cc`;
- runtime execution packet PR #2166 merge SHA `fc0706786e3413fdfc364d62a87adb45cc64ca36`;
- execution QA PR #2169 merge SHA `b5e0177750f2fdaef0a3e8780e31026838b17d23`;
- handoff decision `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_handoff_contract`;
- route path `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`;
- worker source `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`;
- required confirmation gate `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_DRY_RUN`;
- readiness `ready_for_confirmation_gated_external_agent_dispatch_dry_run`;
- product-ready end-to-end local OSS tools `0`.

The dry-run packet may create a metadata-only external-agent dry-run envelope. It must not execute the route, invoke an external agent runtime, start a worker, mutate worker leases, write persistent queue records, mutate Supabase, execute SQL, process media, run GStreamer/MKVToolNix, run Docker, create signed/public artifacts, or unlock final delivery/production.
