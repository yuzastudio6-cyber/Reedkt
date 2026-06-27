# Qwen2.5-VL 7B Private Invoke Direct VPC Route Config Result

Decision: `qwen2_5_vl_private_invoke_direct_vpc_route_config_configured_subnet_no_deploy_no_inference`.

Mode: `qwen2_5_vl_private_invoke_direct_vpc_route_config_result`.

This packet records the controlled Google Cloud networking change for the future Qwen2.5-VL CPU-only internal caller harness. It created a dedicated Direct VPC egress subnet with Private Google Access enabled. It did not deploy a Cloud Run Job, build or push a caller image, create a service account, change IAM, change the default subnet, create an internal load balancer, create Private Service Connect, create a Serverless VPC Access connector, call Cloud Run, run inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create signed URLs, mutate credits, unlock beta, or unlock production.

## Configured Route Artifact

- subnet name: `qwen-private-caller-us-central1`
- project: `reeditpro`
- region: `us-central1`
- network: `default`
- CIDR: `10.40.0.0/26`
- purpose: `PRIVATE`
- Private Google Access: `true`
- description: `Qwen private invoke CPU-only caller Direct VPC egress subnet; no runtime execution`

The default `us-central1/default` subnet remains unchanged and still has Private Google Access set to `false`.

## Why Dedicated Subnet

The route approval selected Direct VPC egress plus Private Google Access as the preferred private route because it avoids public ingress relaxation and avoids Serverless VPC Access connector idle VM cost. A dedicated subnet keeps this path scoped to the future Qwen caller instead of broadening the existing default subnet.

The chosen `/26` range follows Cloud Run Direct VPC egress subnet sizing guidance for Cloud Run jobs. It is larger than a single task needs, but it satisfies the minimum reservation requirement while keeping the address range isolated.

## Remaining Blockers

- CPU-only internal caller source/image is not defined.
- No Cloud Run Job caller has been deployed.
- No caller has been executed.
- No private invoke contract request has been sent from the configured route.
- No fail-closed contract response has been observed from the internal caller path.

## Runtime Gates

- `directVpcRouteConfigResultRecorded=true`
- `gcpNetworkMutationOccurred=true`
- `dedicatedCallerSubnetCreated=true`
- `dedicatedCallerSubnetName=qwen-private-caller-us-central1`
- `dedicatedCallerSubnetPrivateGoogleAccess=true`
- `dedicatedCallerSubnetCidr=10.40.0.0/26`
- `defaultSubnetChanged=false`
- `defaultSubnetPrivateGoogleAccess=false`
- `directVpcPrivateRoutePrerequisiteReady=true`
- `cpuOnlyCallerImageDefined=false`
- `callerHarnessDeployAllowedNow=false`
- `callerHarnessDeployed=false`
- `callerHarnessExecuted=false`
- `internalLoadBalancerCreated=false`
- `privateServiceConnectConfigured=false`
- `vpcConnectorCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_55C-PRIVATE-INVOKE-CPU-CALLER-SOURCE: add CPU-only internal caller harness source, no deploy/no inference`
