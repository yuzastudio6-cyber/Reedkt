# RP-FIX-15 â€” Real SFX Provider Execution Readiness

RP-FIX-15 prepares ReeditPro for future real Mirelo SFX V1.5 and MMAudio V2 execution without enabling live provider calls.

The readiness layer is backend-only planning/reporting. It tells developers whether a project SFX provider route is blocked, mock-only, or ready for a future backend worker transport implementation.

## What It Checks

- Runtime is backend/worker-like, not browser or Vite/frontend.
- Provider mode is `mock`, `disabled`, or `real`.
- Mirelo and MMAudio use Secret Manager reference names, not raw keys.
- Provider docs and review flags are present.
- Edit plan approval, credit estimate approval, credit reservation, provider route, prompt plan, generation request, and worker job are present.
- Storage/output target and provenance policy requirements are known.

## Fail-Closed Behavior

The real provider clients remain intentionally fail-closed:

- no provider SDK imports
- no HTTP requests
- no raw API keys
- no audio bytes
- no Cloud Run deployment
- no Supabase writes
- no Stripe calls
- no rendering or audio processing

`readyForRealTransport: true` means the local records and backend prerequisites are ready for a future worker transport implementation. It does not mean ReeditPro can call Mirelo or MMAudio today.

## API Metadata

Mock route:

```text
sfx.providerReadiness.check
```

The route returns readiness state, block reasons, warnings, required backend capabilities, and a safe next step. It does not execute providers.

## Scenario Coverage

The mock readiness scenarios cover:

- mock mode allowed
- disabled mode blocked
- frontend real mode blocked
- real mode missing Secret Manager references
- real mode with backend refs ready for future transport implementation
- missing credit reservation
- missing generation request
- no-SFX route
- source-footage repair without approval
- Mirelo readiness
- MMAudio readiness

## Future Work

RP-FIX-15 stops before real execution. A later backend milestone must add worker transport, Secret Manager resolution, private storage output handling, provider response parsing for real payloads, spend/refund finalization, and provider-specific QA before any live Mirelo or MMAudio request is allowed.
