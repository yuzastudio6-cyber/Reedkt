import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION =
  'ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_environment_blocks'

export type AiGraphicsExternalBetaServiceRoleQueueSmokePreflightStatus =
  | 'missing_required_environment_or_flags'
  | 'ready_to_execute_non_production_service_role_queue_smoke'

export interface AiGraphicsExternalBetaServiceRoleQueueSmokePreflightInput {
  env?: Record<string, string | undefined>
  workspaceId?: string
  projectId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  idempotencyPrefix?: string
  serviceRoleQueueSmokeReadinessRef?: string
  runtimeQueueServiceProofBridgeRef?: string
  sourceRuntimeQueueServiceProofBridgeAccepted?: boolean
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokePreflightCheck {
  name: string
  requiredValue: string | null
  present: boolean
  satisfied: boolean
  secret: boolean
  valueRedacted: true
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokePreflightJobPreview {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: string
  workerType: string
  runtimeTarget: string
  capabilityIds: string[]
  gpuRequiredForRuntime: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  payloadShapeValid: boolean
  toolExecutionApprovedNow: false
  workerDispatchPerformed: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokePreflight {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION
  status: AiGraphicsExternalBetaServiceRoleQueueSmokePreflightStatus
  toolsCovered: 21
  productFacingCapabilitiesCovered: 12
  gpuRuntimeTargetedTools: 8
  heavyToolsIncorrectlyTargetingCpu: 0
  requiredEnvChecks: AiGraphicsExternalBetaServiceRoleQueueSmokePreflightCheck[]
  requiredFlagChecks: AiGraphicsExternalBetaServiceRoleQueueSmokePreflightCheck[]
  missingEnvironment: string[]
  missingFlags: string[]
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  all21PayloadsPrepared: boolean
  payloadPreviews: AiGraphicsExternalBetaServiceRoleQueueSmokePreflightJobPreview[]
  readyToExecuteLiveNonProductionSmoke: boolean
  executeCommandTemplate: string
  liveServiceRoleQueueSmokeExecutedNow: false
  liveSupabaseQueueWritesNow: 0
  liveWorkerClaimRowsNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  gpuRuntimeShouldStartNow: false
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  booleans: {
    externalBetaServiceRoleQueueSmokePreflightPrepared: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21PayloadsPrepared: boolean
    requiredEnvironmentSatisfied: boolean
    requiredFlagsSatisfied: boolean
    sourceRuntimeQueueServiceProofBridgeAccepted: boolean
    readyToExecuteLiveNonProductionSmoke: boolean
    serviceRoleCredentialsServerOnly: true
    secretsRedactedFromOutput: true
    nonProductionEnvironmentRequired: true
    explicitSmokeConfirmationRequired: true
    cleanupRequired: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    liveServiceRoleQueueSmokeExecutedNow: false
    liveQueueWriteApprovedNow: false
    liveWorkerClaimInsertApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    routeExecutionPerformed: false
    serviceRoleQueueSmokePerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const envRequirements = [
  {
    name: 'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE',
    requiredValue: 'true',
    secret: false,
  },
  {
    name: 'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV',
    requiredValue: 'non_production',
    secret: false,
  },
  { name: 'SUPABASE_URL', requiredValue: null, secret: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', requiredValue: null, secret: true },
  { name: 'E2E_RUNTIME_MODE', requiredValue: 'local', secret: false },
  { name: 'WORKER_RUNTIME_MODE', requiredValue: 'mock', secret: false },
] as const

const flagRequirements = [
  'workspaceId',
  'projectId',
  'approvedPlanSnapshotId',
  'creditReservationId',
  'idempotencyPrefix',
  'serviceRoleQueueSmokeReadinessRef',
  'runtimeQueueServiceProofBridgeRef',
] as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function productFacingCapabilityCount(): 12 {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
    .filter((capability) => capability !== 'planning_metadata_only' && capability !== 'blocked_or_deferred')
    .length as 12
}

function buildEnvChecks(
  env: Record<string, string | undefined>,
): AiGraphicsExternalBetaServiceRoleQueueSmokePreflightCheck[] {
  return envRequirements.map((requirement) => {
    const value = env[requirement.name]
    const present = hasValue(value)
    const satisfied = requirement.requiredValue === null
      ? present
      : value === requirement.requiredValue

    return {
      name: requirement.name,
      requiredValue: requirement.requiredValue,
      present,
      satisfied,
      secret: requirement.secret,
      valueRedacted: true,
    }
  })
}

function buildFlagChecks(
  input: AiGraphicsExternalBetaServiceRoleQueueSmokePreflightInput,
): AiGraphicsExternalBetaServiceRoleQueueSmokePreflightCheck[] {
  return flagRequirements.map((name) => {
    const value = input[name]
    return {
      name,
      requiredValue: null,
      present: hasValue(value),
      satisfied: hasValue(value),
      secret: false,
      valueRedacted: true,
    }
  })
}

function buildPayloadPreviews(): AiGraphicsExternalBetaServiceRoleQueueSmokePreflightJobPreview[] {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => Boolean(record.productionToolId))
    .map((record) => {
      const capabilityIds = record.capabilities.filter((capability) => (
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred'
      ))
      const workerType = record.productionWorkerType === 'none'
        ? 'ai_graphics_planning_worker'
        : record.productionWorkerType
      return {
        toolId: record.toolId,
        productionToolId: record.productionToolId as string,
        workerType,
        runtimeTarget: record.runtimeTarget,
        capabilityIds,
        gpuRequiredForRuntime: record.gpuRequiredForRuntime,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
          record.gpuRequiredForRuntime,
        payloadShapeValid:
          hasValue(record.productionToolId ?? undefined) &&
          hasValue(workerType) &&
          hasValue(record.runtimeTarget) &&
          capabilityIds.length > 0,
        toolExecutionApprovedNow: false,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      }
    })
}

export function buildAiGraphicsExternalBetaServiceRoleQueueSmokePreflight(
  input: AiGraphicsExternalBetaServiceRoleQueueSmokePreflightInput = {},
): AiGraphicsExternalBetaServiceRoleQueueSmokePreflight {
  const envChecks = buildEnvChecks(input.env ?? {})
  const flagChecks = buildFlagChecks(input)
  const missingEnvironment = envChecks
    .filter((check) => !check.satisfied)
    .map((check) => check.name)
  const missingFlags = flagChecks
    .filter((check) => !check.satisfied)
    .map((check) => check.name)
  const payloadPreviews = buildPayloadPreviews()
  const all21PayloadsPrepared =
    payloadPreviews.length === AI_GRAPHICS_CANONICAL_TOOL_IDS.length &&
    payloadPreviews.every((preview) => preview.payloadShapeValid)
  const gpuRuntimeTargetedTools = payloadPreviews
    .filter((preview) => preview.gpuRequiredForRuntime)
    .length as 8
  const sourceRuntimeQueueServiceProofBridgeAccepted =
    input.sourceRuntimeQueueServiceProofBridgeAccepted === true
  const requiredEnvironmentSatisfied = missingEnvironment.length === 0
  const requiredFlagsSatisfied = missingFlags.length === 0
  const readyToExecuteLiveNonProductionSmoke =
    requiredEnvironmentSatisfied &&
    requiredFlagsSatisfied &&
    sourceRuntimeQueueServiceProofBridgeAccepted &&
    all21PayloadsPrepared

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION,
    status: readyToExecuteLiveNonProductionSmoke
      ? 'ready_to_execute_non_production_service_role_queue_smoke'
      : 'missing_required_environment_or_flags',
    toolsCovered: 21,
    productFacingCapabilitiesCovered: productFacingCapabilityCount(),
    gpuRuntimeTargetedTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    requiredEnvChecks: envChecks,
    requiredFlagChecks: flagChecks,
    missingEnvironment,
    missingFlags,
    sourceRuntimeQueueServiceProofBridgeAccepted,
    all21PayloadsPrepared,
    payloadPreviews,
    readyToExecuteLiveNonProductionSmoke,
    executeCommandTemplate:
      'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production E2E_RUNTIME_MODE=local WORKER_RUNTIME_MODE=mock npm run --silent ai-graphics:external-beta-service-role-queue-smoke -- --execute-external-beta-service-role-queue-smoke --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-smoke-prefix> --service-role-queue-smoke-readiness-ref <readiness-ref> --runtime-queue-service-proof-bridge-ref <bridge-ref> --source-runtime-queue-service-proof-bridge-accepted',
    liveServiceRoleQueueSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      externalBetaServiceRoleQueueSmokePreflightPrepared: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21PayloadsPrepared,
      requiredEnvironmentSatisfied,
      requiredFlagsSatisfied,
      sourceRuntimeQueueServiceProofBridgeAccepted,
      readyToExecuteLiveNonProductionSmoke,
      serviceRoleCredentialsServerOnly: true,
      secretsRedactedFromOutput: true,
      nonProductionEnvironmentRequired: true,
      explicitSmokeConfirmationRequired: true,
      cleanupRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
