# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Dry-Run Coordinator

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_coordinator_defined_no_transport`.

This document records the backend-only dry-run coordinator for Qwen2.5-VL 7B private invocation readiness. It composes the approved-snapshot queue contract, private invoke envelope contract, fail-closed transport adapter preview, and response classifier without resolving service URL, resolving audience, creating an auth header, fetching an identity token, sending a Cloud Run request, running inference, dispatching workers, mutating Supabase, executing SQL, creating generated assets, creating public artifacts, creating signed URLs, mutating credits, unlocking beta, unlocking production, claiming `dry_run_passed`, or claiming `generated_local_fixture_passed`.

## Purpose

The coordinator proves the backend can connect these already-approved local contracts:

1. Validate or reject the approved-snapshot queue fixture.
2. Build a future private invoke envelope from that queue payload.
3. Preview the fail-closed private invoke transport adapter.
4. Classify the current auth/transport blocker or a simulated service response.
5. Refuse runtime state advancement in all current paths.

This gives ReeditPro a single deterministic contract for future private invocation orchestration without creating a transport path.

## Runtime Path

Future execution must keep this path:

```text
user/chat request
→ structured findings and edit intents
→ approved plan snapshot
→ credit reservation
→ queue lease
→ bounded Qwen runtime request
→ private Cloud Run invocation
→ response classification
→ approved persistence and credit handling
```

This dry-run coordinator stops before private Cloud Run invocation.

## Current Default Outcome

The default dry-run outcome is:

- status: `blocked_transport_not_attempted`
- default transport blocker: `auth_session_requires_reauth`
- envelope accepted for future transport: true
- transport adapter preview status: `blocked_transport_disabled`
- transport adapter previewed: true
- response classified locally: true
- transport attempted now: false
- invocation allowed now: false
- runtime can advance now: false

## Invalid Envelope Outcome

When the queue payload is invalid, the coordinator returns:

- status: `blocked_envelope_not_accepted`
- envelope accepted for future transport: false
- transport adapter preview status: `blocked_invalid_envelope`
- transport adapter previewed: true
- response classified locally: true
- transport attempted now: false
- invocation allowed now: false

## Simulated Future Response Outcome

When given a metadata-only future response shape, the coordinator can recognize it through the response classifier, but still returns:

- status: `blocked_response_not_runtime_advanceable`
- transport adapter preview status: `blocked_transport_disabled`
- runtime can advance now: false
- persist output allowed now: false
- credit spend allowed now: false
- retry allowed now: false

This is intentional. A future runtime prompt must add approved persistence, credit, QA, retry, and audit handling before any real state can advance.

## Runtime Gates

All runtime side effects remain closed:

- `transportAttemptedNow=false`
- `transportAdapterPreviewed=true`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `authHeaderCreated=false`
- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `dispatchSubmitted=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`

## Blocked Bypasses

The coordinator blocks:

- resolving service URL in dry run;
- creating auth headers in dry run;
- fetching identity tokens in dry run;
- sending Cloud Run requests in dry run;
- persisting metadata output from dry run;
- spending credit from dry run;
- marking worker success from dry run.

## Current Blocker

Private invocation verification still requires local `gcloud` reauthentication outside Codex. This coordinator does not require that step because it never performs private transport.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_48-PRIVATE-INVOKE-DRY-RUN-ROUTE-CONTRACT: define backend route contract for Qwen dry-run invocation, no transport`
