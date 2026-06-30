const PACKET = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ENABLEMENT-CURRENT-IMPORT-1' as const
const DECISION = 'completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required' as const
const EXECUTION = 'completed_fail_closed_transport_dependency_contract_no_runtime_invocation' as const
const NEXT_PROMPT = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1' as const

const SELECTED_RUNTIME = {
  platform: 'google_cloud_run_gpu',
  project: 'reeditpro',
  service: 'reeditpro-staging-api',
  qwenWorkerService: 'reeditpro-qwen2-5-vl-l4-worker',
  region: 'us-central1',
  account: 'aiediting@reeditpro.com',
  gpu: 'nvidia_l4',
  scaleToZeroRequired: true,
  minInstances: 0,
  maxInstancesForInitialRuntime: 1,
  cpuFallbackAllowed: false,
} as const

const TRANSPORT_DEPENDENCY_NAMES = [
  'service_role_lease_claim',
  'idempotency_runtime_message',
  'approved_snapshot_handoff',
  'qwen_dispatch_adapter',
  'private_invoke_envelope',
  'private_invoke_transport',
  'response_classification',
  'qa_audit_cost_credit',
  'cleanup_rollback',
  'beta_production_lock',
] as const

const REQUIRED_INJECTED_BOUNDARIES = [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
] as const

const RUNTIME_FALSE_FLAGS = {
  dependenciesEnabledNow: false,
  readyForRealWorkerDispatch: false,
  cloudRunInvocation: false,
  cloudRunServiceDiscoveryAfterTokenProbe: false,
  serviceUrlResolvedNow: false,
  audienceResolvedNow: false,
  identityTokenFetched: false,
  authHeaderCreated: false,
  requestSent: false,
  qwen25VlExecution: false,
  workerExecution: false,
  workerDispatch: false,
  providerCall: false,
  modelCall: false,
  modelImportRun: false,
  modelLoadRun: false,
  vllmEngineInitialized: false,
  promptProcessed: false,
  forwardPassRun: false,
  inferenceRun: false,
  supabaseMutation: false,
  sqlExecution: false,
  serviceRoleRouteExecution: false,
  routeExecution: false,
  secretPayloadAccess: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  generatedAssetCreation: false,
  creditMutation: false,
  finalRenderExport: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  dockerExecution: false,
  remotionExecution: false,
  dependencyMutation: false,
  packageLockMutation: false,
  broadExternalBetaAudienceUnlock: false,
  paidProductionUnlock: false,
  productionUnlock: false,
} as const

export type Qwen25VlTransportDependencyName = (typeof TRANSPORT_DEPENDENCY_NAMES)[number]
export type Qwen25VlTransportInjectedBoundary = (typeof REQUIRED_INJECTED_BOUNDARIES)[number]

export type Qwen25VlTransportDependencyFixture = {
  dependencyNames: readonly Qwen25VlTransportDependencyName[]
  injectedBoundaries: readonly Qwen25VlTransportInjectedBoundary[]
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateInputManifestRef: string
  assetManifestRef: string
  checksumRef: string
  idempotencyKey: string
  serviceRoleLeaseMode: 'contract_only_no_claim'
  serviceUrlResolutionAllowed: false
  audienceResolutionAllowed: false
  identityTokenFetchAllowed: false
  requestSendAllowed: false
  qwenExecutionAllowed: false
  workerDispatchAllowed: false
  generatedAssetCreationAllowed: false
  supabaseMutationAllowed: false
  sqlExecutionAllowed: false
  packageLockMutationAllowed: false
}

export type Qwen25VlTransportDependencyEvaluation = {
  packet: typeof PACKET
  decision: typeof DECISION
  execution: typeof EXECUTION
  status: 'passed_contract_preflight_required' | 'blocked_contract_incomplete'
  missingDependencies: string[]
  missingInjectedBoundaries: string[]
  missingRequiredFields: string[]
  dependenciesEnabledNow: false
  readyForRealWorkerDispatch: false
  runtimeFlags: typeof RUNTIME_FALSE_FLAGS
  nextPrompt: typeof NEXT_PROMPT
}

export const QWEN2_5_VL_CONTROLLED_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT = {
  packet: PACKET,
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_real_dispatch_transport_dependency_enablement_current_import_1',
  decision: DECISION,
  execution: EXECUTION,
  selectedRuntime: SELECTED_RUNTIME,
  sourceChain: {
    currentIntegrationHead: '2a4fc2846f81feb099bde9c736b1e0bbd0460e69',
    qwenRuntimeStackFreshSourceImport:
      'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import',
    qwenRealDispatchPreflight:
      'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_preflight_passed_runtime_invocation_still_blocked',
    qwenRealDispatchDryRunAttempt:
      'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt',
    qwenRealDispatchAuthPath:
      'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r',
    excludedRemotionPr: '#577 open/draft/blocked/excluded',
  },
  dependencyNames: TRANSPORT_DEPENDENCY_NAMES,
  requiredInjectedBoundaries: REQUIRED_INJECTED_BOUNDARIES,
  dependencyContract: [
    {
      id: 'service_role_lease_claim',
      requires: ['backend_only_service_role_context', 'lease_claim_policy', 'no_frontend_service_role_exposure'],
      enabledNow: false,
    },
    {
      id: 'idempotency_runtime_message',
      requires: ['idempotency_key', 'approved_snapshot_hash', 'runtime_message_persistence'],
      enabledNow: false,
    },
    {
      id: 'approved_snapshot_handoff',
      requires: ['immutable_approved_plan_snapshot', 'confirmed_output_frame', 'credit_reservation_ref'],
      enabledNow: false,
    },
    {
      id: 'qwen_dispatch_adapter',
      requires: ['backend_dispatch_adapter', 'tool_registry_route', 'runtime_policy_guard'],
      enabledNow: false,
    },
    {
      id: 'private_invoke_envelope',
      requires: ['private_input_manifest', 'structured_prompt_envelope', 'no_public_artifact_policy'],
      enabledNow: false,
    },
    {
      id: 'private_invoke_transport',
      requires: ['resolveServiceUrl', 'resolveAudience', 'fetchIdentityToken', 'sendRequest'],
      enabledNow: false,
    },
    {
      id: 'response_classification',
      requires: ['bounded_response_parser', 'safe_error_categories', 'no_generated_asset_without_manifest'],
      enabledNow: false,
    },
    {
      id: 'qa_audit_cost_credit',
      requires: ['qa_report_ref', 'audit_event_ref', 'tool_cost_event_ref', 'no_spend_without_result'],
      enabledNow: false,
    },
    {
      id: 'cleanup_rollback',
      requires: ['cleanup_policy', 'retry_policy', 'rollback_policy'],
      enabledNow: false,
    },
    {
      id: 'beta_production_lock',
      requires: ['single_tester_scope', 'no_broad_external_beta_unlock', 'no_production_unlock'],
      enabledNow: false,
    },
  ] as const,
  runtimeFlags: RUNTIME_FALSE_FLAGS,
  nextPrompt: NEXT_PROMPT,
} as const

function missingString(value: string) {
  return value.trim().length === 0
}

export function buildDefaultQwen25VlTransportDependencyFixture(): Qwen25VlTransportDependencyFixture {
  return {
    dependencyNames: TRANSPORT_DEPENDENCY_NAMES,
    injectedBoundaries: REQUIRED_INJECTED_BOUNDARIES,
    approvedPlanSnapshotRef: 'approved-plan-snapshot://qwen-transport-dependency-current-import/local-fixture',
    creditReservationRef: 'credit-reservation://qwen-transport-dependency-current-import/no-spend',
    privateInputManifestRef: 'manifest://qwen-transport-dependency-current-import/private-input',
    assetManifestRef: 'manifest://qwen-transport-dependency-current-import/asset-manifest',
    checksumRef: 'sha256:qwen-transport-dependency-current-import-local-fixture',
    idempotencyKey: 'qwen-transport-dependency-current-import-local-fixture-v1',
    serviceRoleLeaseMode: 'contract_only_no_claim',
    serviceUrlResolutionAllowed: false,
    audienceResolutionAllowed: false,
    identityTokenFetchAllowed: false,
    requestSendAllowed: false,
    qwenExecutionAllowed: false,
    workerDispatchAllowed: false,
    generatedAssetCreationAllowed: false,
    supabaseMutationAllowed: false,
    sqlExecutionAllowed: false,
    packageLockMutationAllowed: false,
  }
}

export function evaluateQwen25VlTransportDependencyFixture(
  fixture: Qwen25VlTransportDependencyFixture,
): Qwen25VlTransportDependencyEvaluation {
  const missingDependencies = TRANSPORT_DEPENDENCY_NAMES.filter(
    (dependency) => !fixture.dependencyNames.includes(dependency),
  )
  const missingInjectedBoundaries = REQUIRED_INJECTED_BOUNDARIES.filter(
    (boundary) => !fixture.injectedBoundaries.includes(boundary),
  )
  const missingRequiredFields: string[] = []

  for (const [field, value] of [
    ['approvedPlanSnapshotRef', fixture.approvedPlanSnapshotRef],
    ['creditReservationRef', fixture.creditReservationRef],
    ['privateInputManifestRef', fixture.privateInputManifestRef],
    ['assetManifestRef', fixture.assetManifestRef],
    ['checksumRef', fixture.checksumRef],
    ['idempotencyKey', fixture.idempotencyKey],
  ] as const) {
    if (missingString(value)) missingRequiredFields.push(field)
  }

  for (const [field, value] of [
    ['serviceUrlResolutionAllowed', fixture.serviceUrlResolutionAllowed],
    ['audienceResolutionAllowed', fixture.audienceResolutionAllowed],
    ['identityTokenFetchAllowed', fixture.identityTokenFetchAllowed],
    ['requestSendAllowed', fixture.requestSendAllowed],
    ['qwenExecutionAllowed', fixture.qwenExecutionAllowed],
    ['workerDispatchAllowed', fixture.workerDispatchAllowed],
    ['generatedAssetCreationAllowed', fixture.generatedAssetCreationAllowed],
    ['supabaseMutationAllowed', fixture.supabaseMutationAllowed],
    ['sqlExecutionAllowed', fixture.sqlExecutionAllowed],
    ['packageLockMutationAllowed', fixture.packageLockMutationAllowed],
  ] as const) {
    if (value !== false) missingRequiredFields.push(field)
  }

  if (fixture.serviceRoleLeaseMode !== 'contract_only_no_claim') {
    missingRequiredFields.push('serviceRoleLeaseMode')
  }

  const isComplete =
    missingDependencies.length === 0 &&
    missingInjectedBoundaries.length === 0 &&
    missingRequiredFields.length === 0

  return {
    packet: PACKET,
    decision: DECISION,
    execution: EXECUTION,
    status: isComplete ? 'passed_contract_preflight_required' : 'blocked_contract_incomplete',
    missingDependencies,
    missingInjectedBoundaries,
    missingRequiredFields,
    dependenciesEnabledNow: false,
    readyForRealWorkerDispatch: false,
    runtimeFlags: RUNTIME_FALSE_FLAGS,
    nextPrompt: NEXT_PROMPT,
  }
}

export function runQwen25VlTransportDependencyCurrentImport1(): Qwen25VlTransportDependencyEvaluation {
  return evaluateQwen25VlTransportDependencyFixture(buildDefaultQwen25VlTransportDependencyFixture())
}

export type Qwen25VlControlledRealDispatchTransportDependencyEnablement =
  typeof QWEN2_5_VL_CONTROLLED_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT
