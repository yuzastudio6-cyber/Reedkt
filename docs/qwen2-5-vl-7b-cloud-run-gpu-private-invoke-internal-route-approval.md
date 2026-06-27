# Qwen2.5-VL 7B Private Invoke Internal Route Approval

Decision: `qwen2_5_vl_private_invoke_internal_route_approval_conditional_direct_vpc_no_config_no_inference`.

Mode: `qwen2_5_vl_private_invoke_internal_route_approval_only`.

This packet conditionally approves the future private route shape for the Qwen2.5-VL CPU-only internal caller harness. It does not enable Private Google Access, change subnet configuration, create an internal load balancer, create Private Service Connect, create a Serverless VPC Access connector, deploy a Cloud Run Job, build or push a caller image, create a service account, change IAM, call Cloud Run, run inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create signed URLs, mutate credits, unlock beta, or unlock production.

## Route Decision

Selected future route: `direct_vpc_egress_with_private_google_access`.

This is the preferred route because it keeps the caller CPU-only, run-on-use, and no-idle-GPU while avoiding the persistent cost profile of a Serverless VPC Access connector. It also preserves the target Qwen worker's restricted ingress posture.

Fallback routes remain available only if Direct VPC egress cannot be configured safely:

- internal Application Load Balancer with serverless NEG;
- Private Service Connect through an approved internal load balancer path;
- Serverless VPC Access connector only if Direct VPC egress is not viable.

Public ingress relaxation and unauthenticated invoker remain forbidden.

## Evidence Considered

- Qwen target service is ready.
- Qwen target service ingress is `internal-and-cloud-load-balancing`.
- Qwen target service is NVIDIA L4-backed with scale-to-zero posture.
- Qwen target service IAM remains narrow.
- No dedicated CPU-only caller job exists yet.
- `us-central1/default` currently has Private Google Access disabled.
- No internal load balancer or Private Service Connect path is recorded for this caller.
- Cloud Run private networking guidance requires extra configuration for Cloud Run or App Engine callers to be recognized as internal when the destination uses internal ingress.

## Conditional Acceptance

The Direct VPC private route is accepted for a future configuration prompt only if all of these remain true:

- the caller stays CPU-only;
- the caller has no model weights, no vLLM runtime, and no inference path;
- the caller uses one task, zero retries, no GPU, and no minimum instances;
- the target service keeps `internal-and-cloud-load-balancing` ingress;
- the target service IAM stays service-level and narrow;
- service URL and token values are never stored in repo evidence;
- the future contract smoke sends at most one request;
- the expected response remains fail-closed with inference disabled;
- beta and production remain blocked.

## Still Blocked

- Private Google Access is not enabled by this packet.
- Direct VPC egress is not configured by this packet.
- No Cloud Run Job caller is deployed.
- No caller image/source is defined here.
- No internal load balancer or Private Service Connect path is created.
- No Cloud Run request is sent.
- No model import, load, vLLM initialization, forward pass, or inference runs.

## Runtime Gates

- `internalRouteApprovalRecorded=true`
- `selectedFutureRoute=direct_vpc_egress_with_private_google_access`
- `futureDirectVpcRouteConfigApproved=true`
- `futurePrivateGoogleAccessConfigApproved=true`
- `fallbackInternalLoadBalancerAllowedIfDirectVpcBlocked=true`
- `fallbackPrivateServiceConnectAllowedIfDirectVpcBlocked=true`
- `serverlessVpcAccessConnectorPreferred=false`
- `publicIngressRelaxationAllowed=false`
- `unauthenticatedInvokerAllowed=false`
- `gcpNetworkMutationAllowedNow=false`
- `privateGoogleAccessChanged=false`
- `directVpcEgressConfigured=false`
- `internalLoadBalancerCreated=false`
- `privateServiceConnectConfigured=false`
- `vpcConnectorCreated=false`
- `callerHarnessDeployAllowedNow=false`
- `callerHarnessDeployed=false`
- `callerHarnessExecuted=false`
- `serviceUrlResolvedNow=false`
- `serviceUrlValueStored=false`
- `identityTokenFetched=false`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_55B-PRIVATE-INVOKE-DIRECT-VPC-ROUTE-CONFIG: configure Direct VPC private route for CPU-only caller harness, no inference`
