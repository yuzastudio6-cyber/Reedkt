# Tool Readiness Diagnostics

Prompt 13 diagnostics are static/local only.

## Commands

```sh
npm run smoke:tool-readiness-worker-runtime-foundation
npm run foundation:tool-readiness
npm run foundation:tool-readiness:report
npm run tool:readiness:diagnostics
npm run foundation:validate
```

## Checks

- Registry loads.
- Required tools are present.
- Every tool has an explicit readiness state.
- Blocked tools include blocked reasons.
- No tool enables production, external beta, or broad real media.
- No tool enables runtime execution in Prompt 13.
- No tool requires signed URLs as source of truth.
- Heavy tools are not frontend-executed.
- Provider tools remain disabled.
- VLM and vLLM remain blocked by policy.
- Demucs remains blocked pending model approval.
- Prompt 13 routes are read-only.
- Foundation validation includes the Prompt 13 diagnostic.

## Safety

Diagnostics do not connect to Supabase, execute SQL, read secrets, invoke workers, run tools, transfer storage, process media, call providers, render, export, deploy, or mutate source files.
