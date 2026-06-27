# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Dry-Run Route Contract

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_route_contract_registered_mock_only`.

This document records the mock-only backend API route contract for the Qwen2.5-VL 7B private invoke dry-run coordinator. It registers a local route in the ReeditPro API route map and mock router. It does not deploy a backend route, resolve a service URL, resolve an audience, create an auth header, fetch an identity token, send a Cloud Run request, run inference, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Route Definition

- route ID: `jobs.qwen2_5_vl.privateInvoke.dryRun`
- method: `POST`
- path: `/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock`
- domain: `jobs`
- runtime mode: `mock`
- status: `mock_ready`
- security level: `workspace_editor`
- mock handler: `handleMockQwenPrivateInvokeDryRun`

The route requires no Supabase, no service role, no provider secret, and no Stripe secret in the mock runtime.

## Mock Handler Behavior

The handler composes:

1. approved-snapshot local queue validation;
2. Qwen private invoke envelope shaping;
3. Qwen private invoke response classification;
4. fail-closed dry-run result reporting.

The handler rejects raw prompt-like request body fields before calling the dry-run coordinator.

## Runtime Path

Future execution must keep this path:

```text
frontend-safe caller
→ backend API route
→ approved-snapshot queue payload
→ Qwen private invoke dry-run coordinator
→ future backend-only Cloud Run transport
```

Current execution stops at the local mock router and dry-run coordinator.

## Current Allowed Response

The default mock route response returns:

- `ok=true` at the API envelope level because the mock route handled the request;
- route data status: `blocked_transport_not_attempted`;
- `transportAttemptedNow=false`;
- `invocationAllowedNow=false`;
- `runtimeCanAdvanceNow=false`;
- `cloudRunInvocationAttempted=false`;
- `identityTokenFetched=false`;
- `inferenceRun=false`.

This response is useful for local UI/backend contract wiring, but it is not Qwen model output.

## Rejected Request Body Fields

The mock route rejects raw prompt-shaped fields, including:

- `prompt`
- `raw_prompt`
- `rawPrompt`
- `rawWorkerPrompt`
- `raw_worker_prompt`
- `rawPromptPayload`
- `workerPrompt`

Rejected raw prompt requests return a mock API error and do not execute the dry-run coordinator.

## No-Action Confirmation

This route contract:

- does not deploy an HTTP route;
- does not call the real Cloud Run service;
- does not fetch or print identity tokens;
- does not import or load the model;
- does not initialize vLLM;
- does not run inference;
- does not dispatch workers;
- does not mutate Supabase;
- does not execute SQL;
- does not create generated assets;
- does not create public artifacts;
- does not create signed URLs;
- does not reserve, spend, release, or refund credits.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_49-PRIVATE-INVOKE-AUTH-REVERIFY-PLAN: prepare guarded auth reverify after user gcloud reauth, no invocation`
