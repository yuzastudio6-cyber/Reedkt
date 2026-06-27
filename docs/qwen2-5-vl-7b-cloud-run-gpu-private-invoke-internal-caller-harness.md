# Qwen2.5-VL 7B Private Invoke Internal Caller Harness

Decision: `qwen2_5_vl_private_invoke_internal_caller_harness_planned_no_deploy_no_inference`.

Mode: `qwen2_5_vl_private_invoke_internal_caller_harness_plan_only`.

This packet plans the next private invocation path for the Qwen2.5-VL 7B Cloud Run GPU worker. It does not deploy a caller, create a load balancer, create Private Service Connect, change VPC configuration, call Cloud Run, run inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create signed URLs, mutate credits, unlock beta, or unlock production.

## Current Evidence

- The Qwen GPU worker service is ready.
- The Qwen GPU worker service ingress is `internal-and-cloud-load-balancing`.
- The Qwen GPU worker service still uses NVIDIA L4 with scale-to-zero posture.
- The service-level invoker binding is present for the Qwen runtime service account.
- No URL maps, backend services, or serverless network endpoint groups were found for this Qwen worker in the current read-only inventory.
- The previous direct local generated-host request returned HTTP `404`, which is now classified as an invalid route for the restricted ingress posture.

## Source-Of-Truth Rules

- Public ingress relaxation remains blocked.
- Unauthenticated invoker remains blocked.
- Browser direct Cloud Run invocation remains blocked.
- Service URL and identity token values must not be stored in repo evidence.
- Qwen remains a visual-understanding and QA metadata tool, not an AI video generator, renderer, exporter, or OCR source of truth.
- Future workers must use approved snapshots and structured payloads, not raw chat.

## Preferred Harness Shape

Preferred path: a future CPU-only Cloud Run Job caller harness.

Why this is preferred:

- it has no GPU;
- it has no minimum instances;
- it runs only when explicitly executed;
- it can be bounded to one task and zero retries for smoke execution;
- it avoids Serverless VPC Access connector idle VM cost;
- it keeps the Qwen GPU worker private;
- it can use a service-account identity that already has or can receive narrow target-service invoker permission.

Future job shape:

- resource type: Cloud Run Job
- CPU/GPU: CPU-only, no GPU
- task count: `1`
- max retries: `0`
- timeout: bounded smoke timeout only
- service account: narrow Qwen private-invoke caller identity
- network path: Direct VPC egress or equivalent approved private route
- target: Qwen worker contract `POST /`
- request source: approved-snapshot local queue fixture
- expected response: HTTP `403`, reason `qwen_inference_disabled_after_contract_check`
- inference: disabled
- output persistence: disabled

## Alternative Harness Paths

| Path | Status | Cost posture | Notes |
| --- | --- | --- | --- |
| CPU-only Cloud Run Job with Direct VPC egress | preferred future path | run only when executed | Lowest idle-cost path if private routing prerequisites are approved. |
| Internal Application Load Balancer with serverless NEG | fallback | persistent LB components may cost more | Useful if an internal IP or routing control is required. |
| Private Service Connect path | fallback | more networking setup | Useful for multi-project or managed-service-style access. |
| Serverless VPC Access connector | not preferred | connector can have idle VM cost | Use only if Direct VPC egress is not viable. |
| Public ingress relaxation | forbidden | unsafe | Must not be used for this smoke. |

## Required Future Preconditions

- Approved internal caller harness branch.
- No public ingress relaxation.
- No unauthenticated invoker.
- CPU-only caller image or source scaffold that contains no model weights and no inference runtime.
- Direct VPC egress or approved equivalent private route.
- Private Google Access, private DNS, internal load balancer, or Private Service Connect proof, depending on selected path.
- Target service IAM remains service-level and narrow.
- One bounded request, no retries.
- Identity token fetched inside the future caller and never printed or stored.
- Service URL or internal target value redacted from repo evidence.
- Expected fail-closed JSON contract observed before any inference-enable step.

## Runtime Gates

- `internalCallerHarnessPlanRecorded=true`
- `preferredHarnessKind=cloud_run_job_cpu_only`
- `selectedNetworkPath=direct_vpc_egress_preferred`
- `publicIngressRelaxationAllowed=false`
- `unauthenticatedInvokerAllowed=false`
- `callerHarnessDeployed=false`
- `callerHarnessExecuted=false`
- `internalLoadBalancerCreated=false`
- `privateServiceConnectConfigured=false`
- `vpcConnectorCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_55-PRIVATE-INVOKE-INTERNAL-CALLER-DEPLOY: deploy controlled CPU-only internal caller harness, no inference`
