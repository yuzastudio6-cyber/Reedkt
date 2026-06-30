import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_preflight_verified_execution_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CK-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-PLAN: plan controlled Qwen real-dispatch transport dependency enablement execution, no Cloud Run invocation/no inference/no generated assets/no beta' as const

const implementation =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PREFLIGHT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_preflight',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationDecision:
    implementation.decision,
  preflightDecision: {
    implementationAcceptedForPreflight: true,
    transportDependencyEnablementPreflightRecorded: true,
    transportDependencyEnablementPreflightPassed: true,
    controlledTransportDependencyEnablementExecutionPlanRequired: true,
    dependenciesEnabledNow: false,
    readyForRealWorkerDispatch: false,
    approvesRealBackendLeaseClaimNow: false,
    approvesInjectedPrivateInvokeDependenciesNow: false,
    approvesServiceUrlResolutionNow: false,
    approvesAudienceResolutionNow: false,
    approvesIdentityTokenFetchNow: false,
    approvesPrivateRequestSendNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  verifiedDependencySurfaces: implementation.dependencySurfaces.map((surface) => ({
    id: surface.id,
    owner: surface.owner,
    implementationVerified: surface.implemented,
    preflightVerified: true,
    enabledNow: surface.enabledNow,
    executionAllowedNow: surface.executionAllowedNow,
    requiredEvidence: surface.requiredEvidence,
  })),
  verifiedPreflightChecks: [
    {
      id: 'implementation_record_present',
      status: 'verified',
      evidence:
        'The controlled transport dependency enablement implementation record is present and points to the approved plan.',
      executionAllowedNow: false,
    },
    {
      id: 'dependency_surface_inventory',
      status: 'verified',
      evidence:
        'All nine dependency surfaces are implemented, disabled now, and execution-blocked now.',
      executionAllowedNow: false,
    },
    {
      id: 'local_fail_closed_contract_previews',
      status: 'verified',
      evidence:
        'Dispatch adapter, private invoke envelope, private invoke transport preview, and response classifier all remain fail-closed.',
      executionAllowedNow: false,
    },
    {
      id: 'injected_transport_dependency_shape',
      status: 'verified',
      evidence:
        'The future injected dependency shape is limited to resolveServiceUrl, resolveAudience, fetchIdentityToken, and sendRequest, and calls are disallowed now.',
      executionAllowedNow: false,
    },
    {
      id: 'approved_snapshot_source_of_truth',
      status: 'verified',
      evidence:
        'Workers must execute approved snapshots with private manifest, checksum, and approved snapshot refs; raw chat, raw worker prompts, signed URLs, and public URLs remain rejected.',
      executionAllowedNow: false,
    },
    {
      id: 'cost_controlled_runtime_posture',
      status: 'verified',
      evidence:
        'NVIDIA L4 Cloud Run GPU remains selected with scale-to-zero, minimum instances zero, initial maximum one, and CPU fallback disabled.',
      executionAllowedNow: false,
    },
    {
      id: 'frontend_boundary',
      status: 'verified',
      evidence:
        'Frontend code may not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets.',
      executionAllowedNow: false,
    },
    {
      id: 'qa_audit_cost_credit_cleanup',
      status: 'verified',
      evidence:
        'QA, audit, cost, credit, cleanup, and rollback dependencies are represented only as future handoff expectations.',
      executionAllowedNow: false,
    },
    {
      id: 'beta_production_public_artifact_lock',
      status: 'verified',
      evidence:
        'Beta, production, generated asset, public artifact, and signed URL unlocks remain blocked.',
      executionAllowedNow: false,
    },
  ],
  selectedRuntime: implementation.selectedRuntime,
  localContractPreview: implementation.localContractPreview,
  transportDependencyShape: implementation.transportDependencyShape,
  sourceOfTruthRules: implementation.sourceOfTruthRules,
  runtimeFlags: {
    ...implementation.runtimeFlags,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightPassed:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired:
      true,
  },
  warnings: [
    'Preflight verifies implemented dependency surfaces only; dependencies are not enabled now.',
    'No service URL resolution, audience resolution, identity token fetch, request send, Cloud Run invocation, or Qwen inference occurs in this preflight.',
    'A controlled execution plan is still required before any later dependency-enable attempt.',
  ],
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflight =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PREFLIGHT
