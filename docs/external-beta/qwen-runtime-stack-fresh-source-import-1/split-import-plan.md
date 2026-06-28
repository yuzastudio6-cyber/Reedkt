# Split Import Plan

Packet: `RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1`

## Split Sequence

1. `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1`
   - Import a narrow backend runtime persistence baseline slice from the current QWEN stack evidence.
   - Validate locally with package install validation, lint, server typecheck, build, build:server, changed diagnostics, and non-executing safety scans.
   - Do not apply migrations or execute SQL.

2. `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-1`
   - Run local-only harness validation after the split import is source-present.
   - No cloud, staging, production, provider call, model call, or real user media.

3. `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-READINESS-ROLLUP-1`
   - Roll up the local harness status into the external-beta source chain.

4. `RP-EXTERNAL-BETA-QWEN-PRODUCT-FLOW-REVALIDATION-1`
   - Revalidate the single-tester product flow only after source import and local harness evidence are clean.

## What This Packet Does Not Do

This packet does not import runtime source, mutate migrations, run Supabase, execute SQL, run a provider/model call, invoke Cloud Run, dispatch workers, process media, unlock broader beta, or unlock production.
