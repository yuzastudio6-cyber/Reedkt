# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Transport Adapter

Decision: `qwen2_5_vl_cloud_run_gpu_private_invoke_transport_adapter_defined_fail_closed`.

This packet adds a backend-only Qwen2.5-VL private invoke transport adapter boundary. The adapter composes the existing approved-snapshot queue envelope, private invoke config contract, private invoke envelope builder, and response classifier. It is designed for future Cloud Run private invocation, but it refuses by default and calls no service URL, audience, identity-token, or request dependency unless every runtime approval gate is explicitly true and backend transport dependencies are injected.

This packet does not refresh `gcloud` auth, resolve a live service URL, create an auth header, fetch an identity token, invoke Cloud Run, run Qwen inference, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## What The Adapter Implements

- validates the approved-snapshot queue payload through the existing local queue contract;
- builds the future private invoke envelope without storing service URL or token values;
- checks runtime approval gates before transport dependencies can be called;
- checks dependency injection for service URL, audience, identity-token, and request sender;
- classifies any future transport response through the existing response classifier;
- refuses by default when invocation is disabled.

## Required Runtime Approval Gates

All of these must be true before the adapter can call injected transport dependencies:

- `invocationEnabledNow`
- `authReverifyPassed`
- `cloudRunServiceDescribeVerified`
- `cloudRunIamPolicyVerified`
- `runtimeServiceAccountVerified`
- `projectInvokerPolicyVerified`

Default adapter status: every gate remains false unless a future backend runtime injects explicit approval. Repository evidence now shows the guarded read-only auth/IAM reverify passed, the smoke runner can use the non-key impersonation token path, narrow TokenCreator/Run Invoker bindings are present, the internal caller harness plan is defined, deploy preflight identified the private route blocker, Direct VPC plus Private Google Access is configured through a dedicated future-caller subnet, CPU-only caller source is defined, and the controlled CPU-only caller job is deployed Ready. The adapter still refuses by default until the CPU-only internal caller reaches the expected fail-closed contract response.

## Required Transport Dependencies

Future backend runtime must inject all of these dependencies:

- `resolveServiceUrl`
- `resolveAudience`
- `fetchIdentityToken`
- `sendRequest`

No default dependency performs Google Cloud, token, network, worker, Supabase, SQL, storage, billing, or artifact side effects.

## Default Runtime Result

The default adapter result is `blocked_transport_disabled`. In that path:

- local envelope validation is allowed;
- runtime approval is checked;
- transport dependencies are not called;
- service URL resolution is false;
- audience resolution is false;
- auth header creation is false;
- identity token fetching is false;
- Cloud Run invocation is false;
- service runtime request sending is false;
- inference is false;
- worker dispatch is false;
- Supabase mutation is false;
- generated asset creation is false;
- beta readiness is false;
- production readiness is false.

## Current Blocker

The latest guarded auth/IAM reverify passed and the controlled private invoke smoke plan is defined. After the narrow authz fix, the smoke minted an identity token and sent exactly one authenticated contract request, but the response was HTTP `404` instead of the expected fail-closed contract JSON. The routing fix records ingress `internal-and-cloud-load-balancing`, and the harness plan selects a CPU-only Cloud Run Job with Direct VPC egress as the preferred no-idle-GPU future path. The Direct VPC route config created a dedicated future-caller subnet with Private Google Access enabled and left the default subnet unchanged. The CPU-only caller source is defined with no model loader, no vLLM runtime, no CUDA dependency, and no inference path. The controlled caller job is deployed Ready with zero executions after deploy. The remaining blocker is executing one controlled caller contract smoke while preserving the same token-fetch policy, request shape, cost guard posture, and no-inference/no-beta/no-production boundaries before runtime may advance.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_55E-PRIVATE-INVOKE-CPU-CALLER-CONTRACT-SMOKE: execute one controlled CPU-only caller contract smoke, no inference`
