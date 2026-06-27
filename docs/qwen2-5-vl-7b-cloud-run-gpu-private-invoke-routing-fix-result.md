# Qwen2.5-VL 7B Private Invoke Routing Fix Result

Decision: `qwen2_5_vl_private_invoke_routing_fix_blocked_internal_caller_required_no_inference`.

Mode: `qwen2_5_vl_private_invoke_routing_fix_result`.

This packet records the private invoke routing fix after the narrow authorization fix. Authz is no longer the primary blocker: the previous smoke minted an audience-bound identity token through non-key service-account impersonation and sent one bounded authenticated request, but the request returned HTTP `404` before the fail-closed Qwen contract body was observed.

The target Cloud Run service is intentionally restricted with ingress `internal-and-cloud-load-balancing`. A direct local request to the generated service host is not valid evidence for this ingress posture unless an approved internal caller path exists. The routing fix therefore updates the guarded smoke runner so it blocks before token fetch and before request send when restricted ingress is detected and `REEDITPRO_QWEN25_VL_PRIVATE_INVOKE_INTERNAL_ROUTE_CONFIRMED` is not explicitly set.

No Cloud Run ingress was changed. No public invoker was added. No internal load balancer, Private Service Connect path, VPC connector, worker caller, service URL value, identity token value, provider credential, generated asset, signed URL, Supabase row, SQL mutation, credit mutation, beta unlock, or production unlock was created by this packet.

## Files

- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts`
- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-routing-fix-result.ts`
- `server/smoke/qwen2-5-vl-private-invoke-routing-fix-result-smoke.ts`

## Routing Evidence

| Area | Status | Evidence | Missing Evidence |
| --- | --- | --- | --- |
| Service readiness | ready | Cloud Run service is ready and still uses NVIDIA L4 fail-closed runtime gates. | none |
| Service ingress | restricted | Ingress is `internal-and-cloud-load-balancing`. | approved internal route evidence |
| Cloud Run service IAM | ready | Runtime service account has service-level invoker permission from the previous authz fix. | none |
| Direct local generated-host smoke | blocked | Previous direct local request returned HTTP `404` and did not produce the fail-closed contract JSON. | approved internal caller path |
| Internal load balancer route | missing | No URL map or backend service route was found for this Qwen worker. | internal LB or equivalent private path |
| VPC/PSC caller path | missing | No approved VPC-routed caller harness was found in this packet. | VPC, PSC, or internal caller harness acceptance |
| Public ingress relaxation | forbidden | Public ingress relaxation remains blocked by the private invoke plan and service spec. | none |

## Runner Guard

The runner now recognizes restricted ingress before identity-token fetch:

- guarded env: `REEDITPRO_QWEN25_VL_PRIVATE_INVOKE_INTERNAL_ROUTE_CONFIRMED`
- blocker: `private_ingress_internal_caller_required`
- blocks before token fetch when the internal route is not confirmed: `true`
- blocks before request when the internal route is not confirmed: `true`
- service URL value stored: `false`
- identity token value stored: `false`

This keeps the smoke honest: a future contract request must come from an approved internal caller path rather than from a local direct service-host request.

## Runtime Gates

- `routingFixRecorded=true`
- `restrictedIngressObserved=true`
- `restrictedIngressDirectLocalRequestBlocked=true`
- `internalCallerHarnessApproved=false`
- `internalCallerHarnessCreated=false`
- `internalLoadBalancerCreated=false`
- `privateServiceConnectConfigured=false`
- `vpcConnectorCreated=false`
- `publicIngressRelaxed=false`
- `unauthenticatedInvokerAdded=false`
- `serviceUrlResolvedNow=false`
- `serviceUrlValueStored=false`
- `audienceResolvedNow=false`
- `audienceValueStored=false`
- `authHeaderCreated=false`
- `identityTokenFetched=false`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `serviceAccountKeyCreated=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `responseClassifiedLocally=false`
- `retryAttempted=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Required Next Step

The next step is not public ingress. The next step is an approved internal caller harness or equivalent private path that can reach the fail-closed service contract while preserving one-request, no-retry, no-token-printing, no-service-URL-storage, no-inference, no-assets, no-credits, no-beta, and no-production posture.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_54-PRIVATE-INVOKE-INTERNAL-CALLER-HARNESS: create controlled internal caller or internal LB/PSC path for contract smoke, no inference`
