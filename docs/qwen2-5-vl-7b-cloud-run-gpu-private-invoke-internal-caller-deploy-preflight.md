# Qwen2.5-VL 7B Private Invoke Internal Caller Deploy Preflight

Decision: `qwen2_5_vl_private_invoke_internal_caller_deploy_preflight_blocked_private_route_required_no_deploy_no_inference`.

Mode: `qwen2_5_vl_private_invoke_internal_caller_deploy_preflight_only`.

This packet records the read-only preflight for deploying the controlled CPU-only internal caller harness. It does not deploy a Cloud Run Job, build or push a caller image, create a service account, change IAM, enable Private Google Access, create an internal load balancer, create Private Service Connect, create a Serverless VPC Access connector, call Cloud Run, run inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create signed URLs, mutate credits, unlock beta, or unlock production.

## Current Evidence

- The Qwen GPU worker service is ready.
- The Qwen GPU worker service ingress remains `internal-and-cloud-load-balancing`.
- The Qwen GPU worker service still uses NVIDIA L4 with scale-to-zero posture.
- The target service-level invoker binding remains narrow.
- Artifact Registry repositories exist for staging and worker images.
- No dedicated Qwen private-invoke internal caller job was found in the current `us-central1` Cloud Run Job inventory.
- The `us-central1` default subnet has Private Google Access set to `false`.
- No internal load balancer, Private Service Connect path, or approved equivalent private route is recorded for this caller.

## Source-Of-Truth Rules

- Public ingress relaxation remains blocked.
- Unauthenticated invoker remains blocked.
- Browser direct Cloud Run invocation remains blocked.
- Service URL and identity token values must not be stored in repo evidence.
- Qwen remains a visual-understanding and QA metadata tool, not an AI video generator, renderer, exporter, or OCR source of truth.
- Future workers must use approved snapshots and structured payloads, not raw chat.

## Deploy Preflight Result

The CPU-only Cloud Run Job caller harness is still the preferred path, but deployment is blocked until the private route is approved and proven.

Primary blocker: `direct_vpc_egress_private_route_not_ready`.

Why this blocks deployment:

- The selected preferred route is Direct VPC egress.
- Restricted Cloud Run-to-Cloud Run calls need an approved internal route.
- The inspected default subnet does not currently satisfy the Private Google Access prerequisite for this route.
- Deploying a caller before that route is ready would create a resource that cannot prove the private contract path.

Secondary blocker: `cpu_only_internal_caller_image_not_defined`.

Why this remains blocked:

- No dedicated no-model, CPU-only caller image or source scaffold is recorded yet.
- Reusing the Qwen GPU worker image would be the wrong cost and safety posture.
- The caller should contain only the bounded contract request logic and no model loader, no vLLM runtime, and no inference path.

## Required Future Preconditions

- Approve the Direct VPC egress plus Private Google Access path, or approve an equivalent internal load balancer or Private Service Connect path.
- Keep the Qwen target service ingress `internal-and-cloud-load-balancing`.
- Keep the target service IAM narrow and service-level.
- Define a CPU-only caller image or source scaffold that contains no model weights, no model import, no vLLM runtime, and no inference runtime.
- Keep the caller bounded to one task, zero retries, no GPU, and no minimum instances.
- Fetch any future identity token only inside the caller and never print or store the token.
- Send at most one future contract request.
- Observe the expected fail-closed contract response before any inference enablement step.

## Runtime Gates

- `internalCallerDeployPreflightRecorded=true`
- `targetServiceReady=true`
- `targetServiceIngressInternalAndCloudLoadBalancing=true`
- `artifactRegistryReposPresent=true`
- `dedicatedCallerJobFound=false`
- `defaultSubnetPrivateGoogleAccess=false`
- `approvedPrivateRouteReady=false`
- `cpuOnlyCallerImageDefined=false`
- `callerHarnessDeployAllowedNow=false`
- `callerHarnessDeployed=false`
- `callerHarnessExecuted=false`
- `internalLoadBalancerCreated=false`
- `privateServiceConnectConfigured=false`
- `vpcConnectorCreated=false`
- `privateGoogleAccessChanged=false`
- `serviceAccountCreated=false`
- `iamPolicyChanged=false`
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

`QWEN2_5_VL_STACK_TOOL_55A-PRIVATE-INVOKE-INTERNAL-ROUTE-APPROVAL: approve Direct VPC private route for CPU-only caller harness, no inference`
