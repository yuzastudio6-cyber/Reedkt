import {
  acceptedAiGraphicsProductionControlledWorkerDispatchSmokeProof,
  evaluateAiGraphicsProductionControlledWorkerDispatchSmokeProof,
  type AiGraphicsProductionControlledWorkerDispatchSmokeProof,
  type AiGraphicsProductionControlledWorkerDispatchSmokeProofInput,
} from './ai-graphics-production-controlled-worker-dispatch-smoke-proof'

export const AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION =
  'ai_graphics_production_controlled_worker_runtime_smoke_authorization_prepared_runtime_still_blocked'

export type AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationStatus =
  | 'planning_metadata_selected'
  | 'missing_production_controlled_worker_dispatch_smoke_proof'
  | 'production_controlled_worker_dispatch_smoke_proof_rejected'
  | 'awaiting_production_controlled_worker_runtime_smoke_authorization_controls'
  | 'production_controlled_worker_runtime_smoke_authorized_with_runtime_blocks'

export interface AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput
  extends AiGraphicsProductionControlledWorkerDispatchSmokeProofInput {
  sourceProductionControlledWorkerDispatchSmokeProofPacket?:
    AiGraphicsProductionControlledWorkerDispatchSmokeProof
  productionControlledWorkerRuntimeSmokeAuthorizationRef?: string
  productionControlledWorkerRuntimeSmokeRunbookRef?: string
  productionControlledWorkerRuntimeSmokeEnvironmentRef?: string
  productionControlledWorkerRuntimeSmokeDryRunModeRef?: string
  productionControlledWorkerRuntimeSmokeLeasePolicyRef?: string
  productionControlledWorkerRuntimeSmokeDispatchPolicyRef?: string
  productionControlledWorkerRuntimeSmokeGpuOnDemandRef?: string
  productionControlledWorkerRuntimeSmokeArtifactSandboxRef?: string
  productionControlledWorkerRuntimeSmokeTelemetryRef?: string
  productionControlledWorkerRuntimeSmokeCostGuardrailRef?: string
  productionControlledWorkerRuntimeSmokeRollbackRef?: string
  productionControlledWorkerRuntimeSmokeCleanupRef?: string
  productionControlledWorkerRuntimeSmokePostReviewRef?: string
  productionControlledWorkerRuntimeSmokeOperatorRole?: string
}

export interface AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationCandidate {
  authorizationId: 'ai_graphics_production_controlled_worker_runtime_smoke_authorization'
  toolId: string
  capabilityId: string
  workerType: string
  runtimeTarget: string
  jobId: string
  requiredOperatorRole: 'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR'
  requiredFutureWorkerExecutionMode: 'dry_run'
  requiredFutureEnvironment: 'private_non_production_runtime_smoke'
  sourceDispatchSmokeAccepted: boolean
  sourceWorkerModeGateBlockedDispatch: boolean
  sourceBlockedBeforeLease: boolean
  sourceBlockedBeforeRouteOutput: boolean
  runtimeSmokeAuthorizationPreparedWithProvidedEvidence: true
  runtimeSmokeAuthorizationRef: string
  runbookRef: string
  environmentRef: string
  dryRunModeRef: string
  leasePolicyRef: string
  dispatchPolicyRef: string
  gpuOnDemandRef: string
  artifactSandboxRef: string
  telemetryRef: string
  costGuardrailRef: string
  rollbackRef: string
  cleanupRef: string
  postReviewRef: string
  gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: boolean
  gpuRuntimeShouldStartNow: false
  nonProductionWorkerRuntimeSmokeAuthorizedNow: false
  workerLeaseCreationApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  routeExecutionApprovedNow: false
  privateArtifactWriteApprovedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
}

export interface AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION
  sourceProductionControlledWorkerDispatchSmokeProofDecision: string | null
  status: AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationStatus
  capabilityId: string
  requestedToolId: string | null
  sourceProductionControlledWorkerDispatchSmokeProofAccepted: boolean
  productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted: boolean
  productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: boolean
  missingAuthorizationControls: string[]
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 21 | 0
  runtimeReadyForOnDemandProductionToolCallTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  runtimeSmokeAuthorizationCandidate:
    AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationCandidate | null
  evidence: {
    authorizationRef: string | null
    runbookRef: string | null
    environmentRef: string | null
    dryRunModeRef: string | null
    leasePolicyRef: string | null
    dispatchPolicyRef: string | null
    gpuOnDemandRef: string | null
    artifactSandboxRef: string | null
    telemetryRef: string | null
    costGuardrailRef: string | null
    rollbackRef: string | null
    cleanupRef: string | null
    postReviewRef: string | null
    requiredOperatorRole: 'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR'
    requiredFutureEnvironment: 'private_non_production_runtime_smoke'
    requiredFutureWorkerExecutionMode: 'dry_run'
    sourceDispatchSmokeProofRequired: true
  }
  policy: {
    sourceControlledWorkerDispatchSmokeProofRequired: true
    privateAuthorizationRefsRequired: true
    operatorAuthorizationRequiredBeforeFutureDryRunSmoke: true
    futureDryRunSmokeMayRemoveProductionBlockedOnlyInNonProduction: true
    authorizationOnlyNoWorkerLeaseCreation: true
    authorizationOnlyNoWorkerDispatch: true
    authorizationOnlyNoToolExecution: true
    authorizationOnlyNoRouteExecution: true
    authorizationOnlyNoProviderRuntime: true
    authorizationOnlyNoBrowserWebglCanvasRuntime: true
    authorizationOnlyNoGpuRuntimeStart: true
    authorizationOnlyNoPrivateArtifactWrite: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresControlledWorkerRuntimeSmokeProofPacket: true
  }
  booleans: {
    productionControlledWorkerRuntimeSmokeAuthorizationPrepared: true
    sourceProductionControlledWorkerDispatchSmokeProofAccepted: boolean
    productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted: boolean
    productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: boolean
    nonProductionDryRunWorkerRuntimeSmokeAuthorizationPrepared: boolean
    sourceWorkerModeGateBlockedDispatch: boolean
    sourceBlockedBeforeWorkerLease: boolean
    sourceBlockedBeforeRouteOutput: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: false
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    futureSmokeMustUsePrivateNonProductionDryRun: true
    gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: boolean
    gpuRuntimeShouldStartNow: false
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    nonProductionWorkerRuntimeSmokeAuthorizedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
    privateArtifactWriteApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreated: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNowPerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const gpuTools = new Set([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

function hasValue(value?: string): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPrivateEvidenceRef(value: string | undefined): boolean {
  if (!hasValue(value)) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('gcs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('production-evidence://')
}

function missingAuthorizationControls(
  input: AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput,
): string[] {
  return [
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeAuthorizationRef)
      ? 'productionControlledWorkerRuntimeSmokeAuthorizationRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeRunbookRef)
      ? 'productionControlledWorkerRuntimeSmokeRunbookRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeEnvironmentRef)
      ? 'productionControlledWorkerRuntimeSmokeEnvironmentRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeDryRunModeRef)
      ? 'productionControlledWorkerRuntimeSmokeDryRunModeRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeLeasePolicyRef)
      ? 'productionControlledWorkerRuntimeSmokeLeasePolicyRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeDispatchPolicyRef)
      ? 'productionControlledWorkerRuntimeSmokeDispatchPolicyRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeGpuOnDemandRef)
      ? 'productionControlledWorkerRuntimeSmokeGpuOnDemandRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeArtifactSandboxRef)
      ? 'productionControlledWorkerRuntimeSmokeArtifactSandboxRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeTelemetryRef)
      ? 'productionControlledWorkerRuntimeSmokeTelemetryRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeCostGuardrailRef)
      ? 'productionControlledWorkerRuntimeSmokeCostGuardrailRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeRollbackRef)
      ? 'productionControlledWorkerRuntimeSmokeRollbackRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeCleanupRef)
      ? 'productionControlledWorkerRuntimeSmokeCleanupRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokePostReviewRef)
      ? 'productionControlledWorkerRuntimeSmokePostReviewRef: private/backend production evidence ref is required'
      : undefined,
    input.productionControlledWorkerRuntimeSmokeOperatorRole !==
      'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR'
      ? 'productionControlledWorkerRuntimeSmokeOperatorRole: AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR is required'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationStatus {
  if (!input.hasSource) return 'missing_production_controlled_worker_dispatch_smoke_proof'
  if (!input.sourceAccepted) {
    return 'production_controlled_worker_dispatch_smoke_proof_rejected'
  }
  return input.controlsAccepted
    ? 'production_controlled_worker_runtime_smoke_authorized_with_runtime_blocks'
    : 'awaiting_production_controlled_worker_runtime_smoke_authorization_controls'
}

function buildAuthorizationCandidate(
  input: {
    source: AiGraphicsProductionControlledWorkerDispatchSmokeProof
    controls: AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput
  },
): AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationCandidate | null {
  const smoke = input.source.controlledWorkerDispatchSmokeRecord
  if (!smoke) return null

  return {
    authorizationId:
      'ai_graphics_production_controlled_worker_runtime_smoke_authorization',
    toolId: smoke.toolId,
    capabilityId: smoke.capabilityId,
    workerType: smoke.workerType,
    runtimeTarget: smoke.runtimeTarget,
    jobId: smoke.jobId,
    requiredOperatorRole: 'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR',
    requiredFutureWorkerExecutionMode: 'dry_run',
    requiredFutureEnvironment: 'private_non_production_runtime_smoke',
    sourceDispatchSmokeAccepted: true,
    sourceWorkerModeGateBlockedDispatch: true,
    sourceBlockedBeforeLease: true,
    sourceBlockedBeforeRouteOutput: true,
    runtimeSmokeAuthorizationPreparedWithProvidedEvidence: true,
    runtimeSmokeAuthorizationRef:
      input.controls.productionControlledWorkerRuntimeSmokeAuthorizationRef ?? '',
    runbookRef: input.controls.productionControlledWorkerRuntimeSmokeRunbookRef ?? '',
    environmentRef:
      input.controls.productionControlledWorkerRuntimeSmokeEnvironmentRef ?? '',
    dryRunModeRef:
      input.controls.productionControlledWorkerRuntimeSmokeDryRunModeRef ?? '',
    leasePolicyRef:
      input.controls.productionControlledWorkerRuntimeSmokeLeasePolicyRef ?? '',
    dispatchPolicyRef:
      input.controls.productionControlledWorkerRuntimeSmokeDispatchPolicyRef ?? '',
    gpuOnDemandRef:
      input.controls.productionControlledWorkerRuntimeSmokeGpuOnDemandRef ?? '',
    artifactSandboxRef:
      input.controls.productionControlledWorkerRuntimeSmokeArtifactSandboxRef ?? '',
    telemetryRef:
      input.controls.productionControlledWorkerRuntimeSmokeTelemetryRef ?? '',
    costGuardrailRef:
      input.controls.productionControlledWorkerRuntimeSmokeCostGuardrailRef ?? '',
    rollbackRef:
      input.controls.productionControlledWorkerRuntimeSmokeRollbackRef ?? '',
    cleanupRef:
      input.controls.productionControlledWorkerRuntimeSmokeCleanupRef ?? '',
    postReviewRef:
      input.controls.productionControlledWorkerRuntimeSmokePostReviewRef ?? '',
    gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: gpuTools.has(smoke.toolId),
    gpuRuntimeShouldStartNow: false,
    nonProductionWorkerRuntimeSmokeAuthorizedNow: false,
    workerLeaseCreationApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    routeExecutionApprovedNow: false,
    privateArtifactWriteApprovedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
}

export function acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization(
  packet:
    | AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization
    | undefined,
): packet is AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION &&
      packet.status ===
        'production_controlled_worker_runtime_smoke_authorized_with_runtime_blocks' &&
      packet.sourceProductionControlledWorkerDispatchSmokeProofAccepted === true &&
      packet.productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence === true &&
      packet.runtimeSmokeAuthorizationCandidate !== null &&
      packet.runtimeReadyForOnDemandProductionToolCallTools === 0 &&
      packet.externalBetaReadyNowTools === 0 &&
      packet.productionReadyNowTools === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.nonProductionWorkerRuntimeSmokeAuthorizedNow === false &&
      packet.booleans.workerLeaseCreationApprovedNow === false &&
      packet.booleans.workerDispatchApprovedNow === false &&
      packet.booleans.toolExecutionApprovedNow === false &&
      packet.booleans.gpuRuntimeApprovedNow === false &&
      packet.booleans.runtimeReadyNow === false &&
      packet.booleans.externalBetaReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export async function evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization(
  input: AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput = {},
): Promise<AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization> {
  const source =
    input.sourceProductionControlledWorkerDispatchSmokeProofPacket ??
    await evaluateAiGraphicsProductionControlledWorkerDispatchSmokeProof(input)
  const sourceAccepted =
    acceptedAiGraphicsProductionControlledWorkerDispatchSmokeProof(source)
  const missingControls = sourceAccepted ? missingAuthorizationControls(input) : []
  const controlsAccepted = sourceAccepted && missingControls.length === 0
  const status = statusFromInput({
    hasSource: Boolean(input.sourceProductionControlledWorkerDispatchSmokeProofPacket),
    sourceAccepted,
    controlsAccepted,
  })
  const candidate = controlsAccepted
    ? buildAuthorizationCandidate({ source, controls: input })
    : null
  const prepared =
    status ===
      'production_controlled_worker_runtime_smoke_authorized_with_runtime_blocks' &&
    candidate !== null
  const sourceSmoke = source.controlledWorkerDispatchSmokeRecord

  const rejectionReasons = [
    !input.sourceProductionControlledWorkerDispatchSmokeProofPacket
      ? 'source production controlled worker dispatch smoke proof packet is missing'
      : undefined,
    input.sourceProductionControlledWorkerDispatchSmokeProofPacket && !sourceAccepted
      ? 'source production controlled worker dispatch smoke proof packet is not accepted'
      : undefined,
    ...missingControls,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION,
    sourceProductionControlledWorkerDispatchSmokeProofDecision:
      source.decision ?? null,
    status,
    capabilityId: source.capabilityId,
    requestedToolId: source.requestedToolId,
    sourceProductionControlledWorkerDispatchSmokeProofAccepted: sourceAccepted,
    productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted:
      controlsAccepted,
    productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence:
      prepared,
    missingAuthorizationControls: missingControls,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: sourceAccepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    runtimeSmokeAuthorizationCandidate: candidate,
    evidence: {
      authorizationRef:
        input.productionControlledWorkerRuntimeSmokeAuthorizationRef ?? null,
      runbookRef: input.productionControlledWorkerRuntimeSmokeRunbookRef ?? null,
      environmentRef:
        input.productionControlledWorkerRuntimeSmokeEnvironmentRef ?? null,
      dryRunModeRef:
        input.productionControlledWorkerRuntimeSmokeDryRunModeRef ?? null,
      leasePolicyRef:
        input.productionControlledWorkerRuntimeSmokeLeasePolicyRef ?? null,
      dispatchPolicyRef:
        input.productionControlledWorkerRuntimeSmokeDispatchPolicyRef ?? null,
      gpuOnDemandRef:
        input.productionControlledWorkerRuntimeSmokeGpuOnDemandRef ?? null,
      artifactSandboxRef:
        input.productionControlledWorkerRuntimeSmokeArtifactSandboxRef ?? null,
      telemetryRef:
        input.productionControlledWorkerRuntimeSmokeTelemetryRef ?? null,
      costGuardrailRef:
        input.productionControlledWorkerRuntimeSmokeCostGuardrailRef ?? null,
      rollbackRef:
        input.productionControlledWorkerRuntimeSmokeRollbackRef ?? null,
      cleanupRef: input.productionControlledWorkerRuntimeSmokeCleanupRef ?? null,
      postReviewRef:
        input.productionControlledWorkerRuntimeSmokePostReviewRef ?? null,
      requiredOperatorRole: 'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR',
      requiredFutureEnvironment: 'private_non_production_runtime_smoke',
      requiredFutureWorkerExecutionMode: 'dry_run',
      sourceDispatchSmokeProofRequired: true,
    },
    policy: {
      sourceControlledWorkerDispatchSmokeProofRequired: true,
      privateAuthorizationRefsRequired: true,
      operatorAuthorizationRequiredBeforeFutureDryRunSmoke: true,
      futureDryRunSmokeMayRemoveProductionBlockedOnlyInNonProduction: true,
      authorizationOnlyNoWorkerLeaseCreation: true,
      authorizationOnlyNoWorkerDispatch: true,
      authorizationOnlyNoToolExecution: true,
      authorizationOnlyNoRouteExecution: true,
      authorizationOnlyNoProviderRuntime: true,
      authorizationOnlyNoBrowserWebglCanvasRuntime: true,
      authorizationOnlyNoGpuRuntimeStart: true,
      authorizationOnlyNoPrivateArtifactWrite: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresControlledWorkerRuntimeSmokeProofPacket: true,
    },
    booleans: {
      productionControlledWorkerRuntimeSmokeAuthorizationPrepared: true,
      sourceProductionControlledWorkerDispatchSmokeProofAccepted: sourceAccepted,
      productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted:
        controlsAccepted,
      productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence:
        prepared,
      nonProductionDryRunWorkerRuntimeSmokeAuthorizationPrepared: prepared,
      sourceWorkerModeGateBlockedDispatch:
        sourceSmoke?.workerModeGateStatus === 'blocked',
      sourceBlockedBeforeWorkerLease: sourceSmoke?.blockedBeforeLease === true,
      sourceBlockedBeforeRouteOutput:
        sourceSmoke?.blockedBeforeRouteOutput === true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: sourceAccepted,
      runtimeReadyForOnDemandProductionToolCall: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      futureSmokeMustUsePrivateNonProductionDryRun: true,
      gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob:
        candidate?.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob ?? false,
      gpuRuntimeShouldStartNow: false,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      nonProductionWorkerRuntimeSmokeAuthorizedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNowPerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
