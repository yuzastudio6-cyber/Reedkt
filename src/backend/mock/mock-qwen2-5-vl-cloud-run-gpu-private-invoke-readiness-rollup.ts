import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result'
import { QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result'
import { QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW } from './mock-qwen2-5-vl-private-invoke-runtime-readiness-review'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN } from './mock-qwen2-5-vl-approved-fixture-inference-smoke-plan'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE } from './mock-qwen2-5-vl-approved-fixture-inference-service-source'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT } from './mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_EXECUTE_RESULT } from './mock-qwen2-5-vl-approved-fixture-inference-smoke-execute-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT } from './mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW } from './mock-qwen2-5-vl-approved-fixture-inference-result-review'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_FIX } from './mock-qwen2-5-vl-structured-fixture-output-fix'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT } from './mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW } from './mock-qwen2-5-vl-structured-fixture-output-result-review'
import { QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT } from './mock-qwen2-5-vl-private-runtime-readiness-review-result'
import { QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW } from './mock-qwen2-5-vl-approved-worker-integration-readiness-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN } from './mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan'
import { QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR } from './mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator'
import { QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT } from './mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN } from './mock-qwen2-5-vl-backend-runtime-persistence-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW } from './mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT } from './mock-qwen2-5-vl-backend-runtime-persistence-migration-draft'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT } from './mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PLAN } from './mock-qwen2-5-vl-backend-runtime-persistence-local-harness-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_CREATE } from './mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-create'

export type Qwen25VlPrivateInvokeReadinessStatus =
  | 'ready'
  | 'blocked_auth_reverify_required'
  | 'blocked_runtime_acceptance_required'
  | 'blocked_identity_token_path_required'
  | 'blocked_token_creator_permission_required'
  | 'blocked_routing_contract_response_required'
  | 'blocked_internal_ingress_private_caller_required'
  | 'blocked_direct_vpc_route_config_required'
  | 'blocked_cpu_only_internal_caller_source_required'
  | 'blocked_cpu_only_internal_caller_deploy_required'
  | 'blocked_cpu_only_internal_caller_contract_smoke_required'
  | 'blocked_approved_fixture_inference_smoke_execution_required'
  | 'blocked_approved_fixture_inference_smoke_fix_required'
  | 'blocked_approved_fixture_inference_result_review_required'
  | 'blocked_approved_fixture_structured_output_fix_required'
  | 'blocked_approved_fixture_structured_output_result_review_required'
  | 'blocked_private_runtime_readiness_review_required'
  | 'blocked_approved_worker_integration_review_required'
  | 'blocked_backend_runtime_dispatch_implementation_required'
  | 'blocked_fail_closed_backend_runtime_dispatch_coordinator_required'
  | 'blocked_controlled_backend_dispatch_dry_run_required'
  | 'blocked_backend_runtime_persistence_plan_required'
  | 'blocked_backend_runtime_persistence_schema_draft_required'
  | 'blocked_backend_runtime_persistence_migration_draft_required'
  | 'blocked_backend_runtime_persistence_local_harness_config_required'
  | 'blocked_backend_runtime_persistence_local_harness_config_verify_required'
  | 'blocked_approved_fixture_inference_service_deploy_required'

export type Qwen25VlPrivateInvokeReadinessGate = {
  id: string
  label: string
  status: Qwen25VlPrivateInvokeReadinessStatus
  evidence: string[]
  missingEvidence: string[]
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_mock_only',
  decision:
    'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_persistence_local_harness_config_created_verify_required',
  upstreamCpuCallerSourceDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE.decision,
  upstreamCpuCallerDeployDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT.decision,
  upstreamCpuCallerContractSmokeDecision:
    QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT.decision,
  upstreamRuntimeReadinessReviewDecision:
    QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW.decision,
  upstreamApprovedFixtureInferenceSmokePlanDecision:
    QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN.decision,
  upstreamApprovedFixtureInferenceServiceSourceDecision:
    QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE.decision,
  upstreamApprovedFixtureInferenceServiceDeployDecision:
    QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT.decision,
  upstreamApprovedFixtureInferenceSmokeExecuteDecision:
    QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_EXECUTE_RESULT.decision,
  upstreamApprovedFixtureInferenceSmokeFixDecision:
    QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.decision,
  upstreamApprovedFixtureInferenceResultReviewDecision:
    QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW.decision,
  upstreamStructuredFixtureOutputFixDecision:
    QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_FIX.decision,
  upstreamStructuredFixtureOutputSmokeRetryDecision:
    QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT.decision,
  upstreamStructuredFixtureOutputResultReviewDecision:
    QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW.decision,
  upstreamPrivateRuntimeReadinessReviewResultDecision:
    QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT.decision,
  upstreamApprovedWorkerIntegrationReadinessReviewDecision:
    QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW.decision,
  upstreamBackendRuntimeDispatchImplementationPlanDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN.decision,
  upstreamFailClosedBackendRuntimeDispatchCoordinatorDecision:
    QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR.decision,
  upstreamControlledBackendDispatchDryRunDecision:
    QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT.decision,
  upstreamBackendRuntimePersistencePlanDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN.decision,
  upstreamBackendRuntimePersistenceSchemaDraftReviewDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW.decision,
  upstreamBackendRuntimePersistenceMigrationDraftDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT.decision,
  upstreamBackendRuntimePersistenceLocalValidationResultDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT.decision,
  upstreamBackendRuntimePersistenceLocalHarnessPlanDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PLAN.decision,
  upstreamBackendRuntimePersistenceLocalHarnessConfigCreateDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_CREATE.decision,
  selectedRuntime: {
    platform: 'google_cloud_run_gpu',
    gpu: 'nvidia_l4',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    costPosture: 'scale_to_zero_required',
    minInstancesRequired: 0,
    maxInstancesForInitialPrivateInvoke: 1,
    cpuFallbackAllowed: false,
    reason:
      'NVIDIA L4 on Cloud Run GPU is the current cost-friendly target for bounded Qwen visual-analysis requests that should run only when invoked and scale back down when idle.',
  },
  readinessGates: [
    {
      id: 'production_registry_profile',
      label: 'Production tool registry profile',
      status: 'ready',
      evidence: [
        'qwen_vl profile registered as Qwen2.5-VL 7B Instruct.',
        'Profile is visual_analysis, gpu_ai_worker scoped, gpuRequired=true, cpuAllowed=false.',
      ],
      missingEvidence: [],
    },
    {
      id: 'production_readiness_spec',
      label: 'Production readiness spec',
      status: 'ready',
      evidence: [
        'Qwen2.5-VL 7B Instruct appears in model-weight readiness specs.',
        'qwen-vl-utils import check is optional and model-weight gated.',
      ],
      missingEvidence: [],
    },
    {
      id: 'private_invoke_route',
      label: 'Private invoke dry-run route',
      status: 'ready',
      evidence: [
        'Route id jobs.qwen2_5_vl.privateInvoke.dryRun is registered as mock_ready.',
        'Route path is /api/jobs/qwen2-5-vl/private-invoke/dry-run/mock.',
        'Raw prompt-shaped inputs are rejected before dry-run coordination.',
      ],
      missingEvidence: [],
    },
    {
      id: 'frontend_client',
      label: 'Frontend-safe API client',
      status: 'ready',
      evidence: [
        'callQwen25VlPrivateInvokeDryRun uses the central ReeditPro API client.',
        'getQwen25VlPrivateInvokeFrontendClientStatus exposes fail-closed readiness.',
      ],
      missingEvidence: [],
    },
    {
      id: 'chat_ui_surface',
      label: 'Chat-native readiness UI',
      status: 'ready',
      evidence: [
        'InlineQwenPlannerRoutingCard surfaces route/client readiness.',
        'UI displays blocked Cloud Run invocation, inference, worker dispatch, generated assets, service URL, auth header, identity token, and raw prompt state.',
      ],
      missingEvidence: [],
    },
    {
      id: 'cloud_run_auth_reverify',
      label: 'Cloud Run auth/IAM reverify',
      status: 'ready',
      evidence: [
        'gcloud version, active project, and active account-domain probes passed.',
        'Cloud Run service describe, Cloud Run service IAM policy read, runtime service account describe, and project invoker policy read passed.',
        'No identity token was fetched and no Cloud Run invocation was attempted.',
      ],
      missingEvidence: [],
    },
    {
      id: 'private_invoke_smoke_plan',
      label: 'Controlled private invoke smoke plan',
      status: 'ready',
      evidence: [
        'Private invoke smoke plan defines backend-only health/readiness and contract POST candidates.',
        'Expected POST response is 403 qwen_inference_disabled_after_contract_check with contractSatisfiedForFutureRuntime=true and modelInferenceEnabled=false.',
        'Plan keeps token fetch, service URL resolution, Cloud Run request, inference, worker dispatch, Supabase, assets, signed/public artifacts, credits, beta, and production false.',
      ],
      missingEvidence: [],
    },
    {
      id: 'private_invoke_smoke_execution',
      label: 'Controlled private invoke smoke execution',
      status: 'ready',
      evidence: [
        'Read-only auth/IAM reverify passed without Cloud Run invocation.',
        'Observed Cloud Run posture uses one NVIDIA L4, concurrency 1, no min scale annotation, and template max scale 1.',
        'Private invoke smoke plan is defined.',
        'Controlled smoke runner supports non-key service-account impersonation, TokenCreator and Run Invoker bindings are present, and one bounded request returned HTTP 404 instead of the expected fail-closed contract JSON.',
        'Routing fix records ingress internal-and-cloud-load-balancing and blocks future direct local service-host requests before token fetch unless an approved internal route is confirmed.',
        'Internal caller harness plan selects a CPU-only Cloud Run Job with Direct VPC egress as the preferred no-idle-GPU future path.',
        'Deploy preflight found the preferred route is not ready because Private Google Access is disabled on the inspected default subnet and no equivalent private route is recorded.',
        'Internal route approval conditionally accepts Direct VPC egress with Private Google Access for a future configuration prompt only.',
        'Direct VPC route config created a dedicated qwen-private-caller-us-central1 subnet with Private Google Access enabled and left the default subnet unchanged.',
        'CPU-only internal caller source is defined with no model loader, no vLLM runtime, no CUDA dependency, and no inference path.',
        'CPU-only internal caller image was built and pushed, a dedicated caller service account was created, narrow service-level Run Invoker was granted, and the controlled Cloud Run Job was deployed Ready without execution.',
        'CPU caller Docker command was fixed to run the caller by default, the caller now parses service JSON, and one controlled execution completed with HTTP 403, serviceReason qwen_inference_disabled_after_contract_check, contractSatisfiedForFutureRuntime=true, runtimeContractExecutesNow=false, and modelInferenceEnabled=false.',
      ],
      missingEvidence: [
        'No beta or production runtime approval has been granted.',
      ],
    },
    {
      id: 'private_invoke_runtime_readiness_review',
      label: 'Private invoke runtime readiness review',
      status: 'ready',
      evidence: [
        'Fail-closed private invoke contract path is proven through the CPU-only internal caller.',
        'Persistent CPU caller and GPU service configs remain fail-closed after the smoke.',
        'Runtime readiness review is recorded and defines the first approved-fixture inference smoke requirements.',
      ],
      missingEvidence: [],
    },
    {
      id: 'first_approved_fixture_inference_smoke_plan',
      label: 'First approved-fixture inference smoke plan',
      status: 'ready',
      evidence: [
        'Runtime readiness review requires approved snapshot, private artifact, worker, QA, cost, no-public-output, no-beta, and no-production evidence before any inference smoke.',
        'Qwen remains visual understanding and QA metadata only.',
        'First approved-fixture inference smoke plan is recorded with the existing local queue contract, model revision, checksum, and use-case ranking.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_fixture_inference_service_source',
      label: 'Approved-fixture inference service source',
      status: 'ready',
      evidence: [
        'GPU service source supports a gated lazy vLLM approved-fixture inference path while preserving default fail-closed behavior.',
        'CPU caller source supports the future fixture inference response expectation while preserving the fail-closed contract smoke expectation.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_fixture_inference_service_deploy',
      label: 'Approved-fixture inference service deploy',
      status: 'ready',
      evidence: [
        'GPU service image was built and deployed with gated fixture inference source.',
        'GPU service revision is ready with NVIDIA L4, template max scale 1, internal ingress, no public unauthenticated access, and read-only private model-cache mount.',
        'CPU caller image was rebuilt and the Cloud Run Job was updated with fixture-response expectation support while keeping execution disabled.',
        'Post-deploy config verification confirmed all model import, inference, provider, media, public output, Track A, worker, and generated asset gates remain disabled by default.',
      ],
      missingEvidence: [],
    },
    {
      id: 'first_approved_fixture_inference_smoke_execution',
      label: 'First approved-fixture inference smoke execution',
      status: 'ready',
      evidence: [
        'One controlled private approved-fixture inference smoke was attempted through the CPU caller.',
        'The temporary GPU service fixture gates were restored to fail-closed after the attempt.',
        'The model weights loaded from the private mount, but vLLM failed KV-cache allocation before inference.',
        'No metadata output, generated asset, public artifact, signed URL, beta readiness, or production readiness was created.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_fixture_inference_smoke_fix_retry',
      label: 'Approved-fixture inference smoke fix retry',
      status: 'ready',
      evidence: [
        'Patched GPU service source bounds QWEN_FIXTURE_IMAGE_SIZE_PX from 128 to 384 pixels.',
        'Patched GPU worker image was built and deployed fail-closed before retry.',
        'Controlled retry qwen25-approved-fixture-smoke-fix-20260627t184430z used one temporary NVIDIA L4 fixture revision and one CPU caller execution.',
        'The retry observed HTTP 200 with qwen_fixture_inference_smoke_completed, vLLM initialized, and metadata-only output was created.',
        'Output evidence is stored only as length, hash, object count, text-like region count, and schema-key metadata.',
        'The GPU service was restored to fail-closed revision reeditpro-qwen2-5-vl-l4-worker-00010-rth and the persistent CPU caller job remains disabled.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_fixture_inference_result_review',
      label: 'Approved-fixture inference result review',
      status: 'ready',
      evidence: [
        'Result review accepts the controlled retry as private invocation, model-cache load, vLLM initialization, and L4 bounded fixture profile evidence.',
        'Sanitized metadata shows parsedJson=false, schemaKeys=[], objectCount=0, and textLikeRegionCount=0.',
        'Raw model output text is intentionally not stored in the repo.',
        'Structured visual QA metadata is not accepted for runtime advancement.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_fixture_structured_output_source_fix',
      label: 'Structured fixture output source fix',
      status: 'ready',
      evidence: [
        'Fixture prompt now requires one minified JSON object with schema version qwen_fixture_visual_metadata_v1.',
        'Service parser recovers direct, fenced, and prose-wrapped JSON objects.',
        'Sanitized metadata summary now reports schemaValid, required schema keys, missing schema keys, object/text row counts, and normalized metadata hash.',
        'CPU caller now requires parsedJson=true, schemaValid=true, non-empty object rows, non-empty text-like region rows, and rawOutputStoredInRepo=false before a fixture smoke can pass.',
        'Local parser validation passed without loading Qwen or invoking Cloud Run.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_fixture_structured_output_smoke_retry',
      label: 'Structured fixture output smoke retry',
      status: 'ready',
      evidence: [
        'Fixed GPU image was built and deployed fail-closed before retry.',
        'One controlled private approved-fixture structured output smoke ran through CPU caller execution reeditpro-qwen2-5-vl-private-caller-hn9sw.',
        'The retry observed HTTP 200 with qwen_fixture_inference_smoke_completed, parsedJson=true, schemaValid=true, objectCount=3, and textLikeRegionCount=1.',
        'Raw model output text is not stored in the repo; evidence is stored as schema keys, counts, and hashes only.',
        'GPU service was restored to fail-closed revision reeditpro-qwen2-5-vl-l4-worker-00013-kms and the persistent CPU caller job remains disabled.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_fixture_structured_output_result_review',
      label: 'Structured fixture output result review',
      status: 'ready',
      evidence: [
        'Structured output smoke retry passed and produced schema-valid metadata-only evidence.',
        'Result review accepted schema version, required schema keys, object rows, text-like region rows, spatial relations, blocked actions, normalized metadata hash, and raw output exclusion.',
        'Default GPU service and persistent CPU caller configs remain fail-closed after the retry.',
      ],
      missingEvidence: [],
    },
    {
      id: 'private_runtime_readiness_result_review',
      label: 'Private runtime readiness result review',
      status: 'ready',
      evidence: [
        'Private runtime readiness review accepted the controlled fixture runtime evidence for metadata-only fixture readiness review.',
        'The structured fixture retry proved Qwen can load, initialize vLLM, run one bounded request, return schema-valid metadata, and restore fail-closed.',
        'Qwen remains visual understanding and visual QA metadata only.',
      ],
      missingEvidence: [],
    },
    {
      id: 'approved_worker_integration_review',
      label: 'Approved worker integration review',
      status: 'ready',
      evidence: [
        'Approved worker integration readiness review accepted the local queue contract, fail-closed dispatch adapter, private invoke plan/config, structured fixture metadata, and private runtime evidence.',
        'The review confirms Qwen has the approved-snapshot worker integration shape needed for the next backend runtime dispatch implementation step.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_dispatch_implementation',
      label: 'Backend runtime dispatch implementation',
      status: 'ready',
      evidence: [
        'Backend runtime dispatch implementation plan is recorded.',
        'The plan identifies the existing queue, lease, idempotency, Qwen adapter, envelope, config, and transport-preview surfaces required for the next fail-closed coordinator.',
      ],
      missingEvidence: [],
    },
    {
      id: 'fail_closed_backend_runtime_dispatch_coordinator',
      label: 'Fail-closed backend runtime dispatch coordinator',
      status: 'ready',
      evidence: [
        'Fail-closed backend runtime dispatch coordinator is implemented.',
        'Coordinator composes worker job schema, approved snapshot checks, credit checks, source-of-truth checks, idempotency conflict detection, backend lease precondition, Qwen fail-closed adapter, private invoke envelope, and transport preview.',
        'Coordinator returns deterministic blocked outcomes without creating jobs, claiming real leases, invoking Cloud Run, or creating generated assets.',
      ],
      missingEvidence: [],
    },
    {
      id: 'controlled_backend_dispatch_dry_run',
      label: 'Controlled backend dispatch dry-run review',
      status: 'ready',
      evidence: [
        'Controlled backend dispatch dry-run review is recorded.',
        'All eight fail-closed coordinator outcomes are covered with no runtime side effects.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_persistence_plan',
      label: 'Backend runtime persistence plan',
      status: 'ready',
      evidence: [
        'Backend runtime persistence plan is recorded.',
        'The plan maps Qwen dispatch to existing approved snapshot, credit reservation, jobs, job events, worker runtime configs, worker leases, backend runtime messages, job claim attempts, idempotency, worker claim, storage object, signed URL audit, tool runtime check, QA, and audit surfaces.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_persistence_schema_draft',
      label: 'Backend runtime persistence schema draft',
      status: 'ready',
      evidence: [
        'Backend runtime persistence schema draft review is recorded.',
        'The review confirms Qwen should reuse existing approved snapshot, credit reservation, job, event, worker runtime config, worker lease, runtime message, claim, idempotency, private storage, signed URL audit, tool check, QA, and audit surfaces.',
        'The review defines Qwen-specific worker type, job type, idempotency, payload, source-of-truth, lease/claim, RLS, event sanitization, and no-parallel-queue constraints for a future draft migration and SQL test pack.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_persistence_migration_draft',
      label: 'Backend runtime persistence migration draft',
      status: 'ready',
      evidence: [
        'Backend runtime persistence migration draft is recorded.',
        'Draft SQL extends existing ReEditPro runtime surfaces instead of creating a parallel Qwen queue.',
        'Draft local SQL tests cover Qwen job payload refs, sanitized events, non-secret runtime configs, leases, runtime messages, claim attempts, qwen_vl tool runtime checks, one-active claim/lease indexes, signed URL source-of-truth rejection, and raw prompt column rejection.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_persistence_local_validation_result',
      label: 'Backend runtime persistence local validation result',
      status: 'ready',
      evidence: [
        'Backend runtime persistence local validation result is recorded.',
        'Local SQL validation was not attempted because this worktree has no supabase/config.toml or approved local/non-production database harness.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_persistence_local_harness_plan',
      label: 'Backend runtime persistence local harness plan',
      status: 'ready',
      evidence: [
        'Backend runtime persistence local harness plan is recorded.',
        'Plan rejects plain PostgreSQL, cloud/staging/production, live data, and manual platform stubs for Qwen draft validation.',
        'Plan requires a reviewed repo-local Supabase-compatible config before any SQL or harness execution.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_persistence_local_harness_config',
      label: 'Backend runtime persistence local harness config',
      status: 'ready',
      evidence: [
        'Safe repo-local supabase/config.toml is created for the Qwen persistence validation harness.',
        'Config uses loopback-only URLs and contains no remote refs, key values, database passwords, environment expansion, provider settings, worker dispatch settings, Cloud Run settings, GPU settings, or model runtime settings.',
      ],
      missingEvidence: [],
    },
    {
      id: 'backend_runtime_persistence_local_harness_config_verify',
      label: 'Backend runtime persistence local harness config verification',
      status: 'blocked_backend_runtime_persistence_local_harness_config_verify_required',
      evidence: [
        'Config creation report is recorded.',
        'No Supabase CLI command, Docker service, SQL, database, migration validation, Cloud Run request, inference, worker dispatch, or generated asset action has run.',
      ],
      missingEvidence: [
        'Verify the committed config text, local toolchain, repo state, and harness prerequisites before any SQL, Supabase runtime, Docker, Cloud Run, inference, generated assets, beta, or production action.',
      ],
    },
  ] satisfies Qwen25VlPrivateInvokeReadinessGate[],
  runtimeFlags: {
    registryProfileReady: true,
    productionReadinessSpecRegistered: true,
    routeMockReady: true,
    frontendClientReady: true,
    uiSurfacingReady: true,
    privateInvocationAuthVerified: true,
    cloudRunServiceDescribeVerified: true,
    cloudRunIamPolicyVerified: true,
    runtimeServiceAccountVerified: true,
    projectInvokerPolicyVerified: true,
    privateInvokeSmokePlanDefined: true,
    internalCallerHarnessPlanDefined: true,
    internalCallerDeployPreflightRecorded: true,
    internalRouteApprovalRecorded: true,
    futureDirectVpcRouteConfigApproved: true,
    directVpcRouteConfigResultRecorded: true,
    gcpNetworkMutationOccurred: true,
    dedicatedCallerSubnetCreated: true,
    dedicatedCallerSubnetPrivateGoogleAccess: true,
    defaultSubnetPrivateGoogleAccess: false,
    defaultSubnetChanged: false,
    approvedPrivateRouteReady: true,
    directVpcPrivateRoutePrerequisiteReady: true,
    cpuOnlyCallerSourceDefined: true,
    cpuOnlyCallerImageSourceDefined: true,
    cpuOnlyCallerImageDefined: true,
    cpuOnlyCallerImageBuilt: true,
    cpuOnlyCallerImagePushed: true,
    cpuOnlyCallerImageDeployed: true,
    cpuOnlyCallerJobDeployed: true,
    callerHarnessReady: true,
    callerHarnessExecuted: true,
    jobExecutionCount: 1,
    serviceAccountCreated: true,
    targetServiceInvokerIamChanged: true,
    directVpcEgressConfigured: true,
    privateGoogleAccessChanged: false,
    internalCallerHarnessDeployed: true,
    privateInvokeSmokeAttempted: true,
    privateInvokeSmokeBlockedBeforeRequest: false,
    privateInvokeSmokeExecuted: true,
    privateInvokeSmokePassed: true,
    failClosedResponseObserved: true,
    contractSatisfiedForFutureRuntime: true,
    runtimeContractExecutesNow: false,
    runtimeReadinessReviewRecorded: true,
    firstApprovedFixtureInferenceSmokePlanDefined: true,
    approvedFixtureInferenceServiceSourceDefined: true,
    approvedFixtureInferenceServiceDeployed: true,
    approvedFixtureInferenceServiceDeployVerified: true,
    approvedFixtureInferenceGpuImageBuilt: true,
    approvedFixtureInferenceGpuImagePushed: true,
    approvedFixtureInferenceGpuServiceReady: true,
    approvedFixtureInferenceGpuServiceRevisionReady: true,
    approvedFixtureInferenceCpuCallerImageBuilt: true,
    approvedFixtureInferenceCpuCallerImagePushed: true,
    approvedFixtureInferenceCpuCallerJobUpdated: true,
    approvedFixtureInferenceCpuCallerJobReady: true,
    approvedFixtureInferenceCpuCallerJobExecuted: true,
    firstApprovedFixtureInferenceSmokeAttempted: true,
    firstApprovedFixtureInferenceSmokeExecuted: true,
    firstApprovedFixtureInferenceSmokePassed: false,
    approvedFixtureInferenceSmokeFixRequired: false,
    approvedFixtureInferenceSmokeFixAttempted: true,
    approvedFixtureInferenceSmokeFixPassed: true,
    approvedFixtureInferenceSmokeResultReviewRequired: false,
    temporaryFixtureInferenceServiceRevisionDeployed: true,
    temporaryFixtureInferenceServiceRestored: true,
    serviceRestoredFailClosedAfterFixtureAttempt: true,
    privateInvokeReady: false,
    betaReady: false,
    productionReady: false,
    serviceUrlResolvedNow: true,
    serviceUrlValueStored: false,
    audienceResolvedNow: true,
    audienceValueStored: false,
    authHeaderCreated: true,
    identityTokenFetched: true,
    serviceAccountImpersonationConfigured: true,
    serviceAccountImpersonationAttempted: true,
    serviceAccountKeyCreated: false,
    cloudRunInvocationAttempted: true,
    restrictedIngressDirectLocalRequestBlocked: true,
    serviceRuntimeRequestSent: true,
    responseClassifiedLocally: true,
    modelImportRun: true,
    modelLoadRun: true,
    modelLoadCompleted: true,
    vllmKvCacheMemoryFailureObserved: true,
    vllmEngineInitialized: false,
    inferenceRun: false,
    approvedFixtureInferenceVllmEngineInitialized: true,
    approvedFixtureInferenceMetadataOutputCreated: true,
    approvedFixtureInferenceMetadataOutputAcceptedForRuntime: false,
    controlledApprovedFixtureInferenceCompleted: true,
    approvedFixtureInferenceResultReviewRecorded: true,
    approvedFixtureInferenceInvocationEvidenceAccepted: true,
    approvedFixtureInferenceStructuredOutputAccepted: true,
    approvedFixtureInferenceStructuredOutputFixRequired: false,
    structuredFixtureOutputSourceFixDefined: true,
    structuredFixturePromptSchemaTargetDefined: true,
    structuredFixtureJsonExtractionDefined: true,
    structuredFixtureMetadataNormalizationDefined: true,
    structuredFixtureCpuCallerPassConditionTightened: true,
    structuredFixtureOutputLocalParserValidationPassed: true,
    structuredFixtureOutputSmokeRetryRequired: false,
    structuredFixtureOutputSmokeRetryAttempted: true,
    structuredFixtureOutputSmokeRetryPassed: true,
    structuredFixtureOutputAcceptedForReview: true,
    structuredFixtureOutputResultReviewRequired: false,
    structuredFixtureOutputResultReviewRecorded: true,
    structuredFixtureMetadataAccepted: true,
    privateRuntimeReadinessReviewRequired: false,
    privateRuntimeReadinessReviewRecorded: true,
    controlledPrivateFixtureRuntimeEvidenceAccepted: true,
    privateFixtureStructuredMetadataAccepted: true,
    privateInvokeReadyForControlledFixtureMetadata: true,
    approvedWorkerIntegrationReviewRequired: false,
    approvedWorkerIntegrationReadinessReviewRecorded: true,
    approvedWorkerIntegrationEvidenceAccepted: true,
    localQueueContractAcceptedForWorkerIntegration: true,
    failClosedDispatchAdapterAcceptedForWorkerIntegration: true,
    privateInvokePlanAndConfigAcceptedForWorkerIntegration: true,
    structuredFixtureMetadataAcceptedForWorkerIntegration: true,
    privateRuntimeEvidenceAcceptedForWorkerIntegration: true,
    backendRuntimeDispatchImplementationRequired: false,
    backendRuntimeDispatchImplementationPlanRecorded: true,
    failClosedBackendRuntimeDispatchCoordinatorRequired: false,
    backendRuntimeDispatchCoordinatorImplemented: true,
    controlledBackendDispatchDryRunRequired: false,
    controlledBackendDispatchDryRunReviewed: true,
    backendRuntimePersistencePlanRequired: false,
    backendRuntimePersistencePlanRecorded: true,
    backendRuntimePersistenceSchemaDraftRequired: false,
    backendRuntimePersistenceSchemaDraftReviewRecorded: true,
    backendRuntimePersistenceMigrationDraftRequired: false,
    backendRuntimePersistenceMigrationDraftRecorded: true,
    backendRuntimePersistenceLocalValidationRequired: false,
    backendRuntimePersistenceLocalValidationResultRecorded: true,
    backendRuntimePersistenceLocalValidationAttempted: false,
    backendRuntimePersistenceLocalValidationPassed: false,
    backendRuntimePersistenceLocalHarnessRequired: false,
    backendRuntimePersistenceLocalHarnessPlanRecorded: true,
    backendRuntimePersistenceLocalHarnessConfigRequired: false,
    backendRuntimePersistenceLocalHarnessConfigCreated: true,
    backendRuntimePersistenceLocalHarnessConfigVerificationRequired: true,
    backendRuntimePersistenceLocalHarnessConfigVerificationPassed: false,
    configTomlCreated: true,
    configTomlExistsAfter: true,
    configVerificationRequired: true,
    configVerificationPassed: false,
    approvedLocalHarnessExists: false,
    readyForRealWorkerDispatch: false,
    structuredFixtureOutputSchemaValid: true,
    structuredFixtureOutputParsedJson: true,
    structuredFixtureOutputObjectCount: 3,
    structuredFixtureOutputTextLikeRegionCount: 1,
    structuredFixtureOutputRawOutputStoredInRepo: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  blockedUntil: [
    'backend_runtime_persistence_local_harness_config_verify_required',
    'beta_and_production_approval_required',
  ],
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58S-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-CONFIG-VERIFY: verify safe local Supabase config and Qwen persistence harness prerequisites, no SQL/no deploy/no cloud/no assets/no beta',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeReadinessRollup =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP
