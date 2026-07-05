import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaQueueAdapterReadiness,
} from '../tool-registry/ai-graphics-internal-beta-queue-adapter-readiness'
import type {
  AiGraphicsInternalBetaQueueAdmissionReadiness,
} from '../tool-registry/ai-graphics-internal-beta-queue-admission-readiness'
import type {
  AiGraphicsBetaEvidenceBundleInput,
} from '../tool-registry/ai-graphics-beta-evidence-bundle'

const expectedGpuRuntimeTargets: Record<string, string> = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile(flag: string): unknown | undefined {
  const filePath = valueAfterFlag(flag)
  if (!filePath) return undefined

  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist for ${flag}: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

function readJsonPath(filePath: string): unknown {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

function readJsonObjectFile(filePath: string): Record<string, unknown> {
  const packet = readJsonPath(filePath)
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    throw new Error(`Evidence packet must be a JSON object: ${filePath}`)
  }

  return packet as Record<string, unknown>
}

function isQueueAdmissionReadinessPacket(
  packet: unknown,
): packet is AiGraphicsInternalBetaQueueAdmissionReadiness {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return false
  const record = packet as Record<string, unknown>
  const booleans = record.booleans
  return (
    record.decision ===
      'ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks' &&
    record.status === 'internal_beta_queue_admission_ready_runtime_still_blocked' &&
    Array.isArray(record.queueAdmissionPackets) &&
    record.queueAdmissionPackets.length === 21 &&
    Boolean(
      booleans &&
      typeof booleans === 'object' &&
      !Array.isArray(booleans) &&
      (booleans as Record<string, unknown>).all21QueueAdmissionPacketsReadyWithProvidedEvidence === true,
    )
  )
}

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
] as const

const sourceFalseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
] as const

function assertBooleanField(
  object: Record<string, unknown>,
  key: string,
  expected: boolean,
  flag: string,
): void {
  if (object[key] !== expected) {
    throw new Error(
      `${flag} must have ${key}=${String(expected)}; received ${String(object[key])}`,
    )
  }
}

function assertNumberField(
  object: Record<string, unknown>,
  key: string,
  expected: number,
  flag: string,
): void {
  if (object[key] !== expected) {
    throw new Error(`${flag} must have ${key}=${expected}; received ${String(object[key])}`)
  }
}

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Expected object field ${field}`)
  }
  return value as Record<string, unknown>
}

function assertField(
  object: Record<string, unknown>,
  key: string,
  expected: unknown,
  flag: string,
): void {
  if (object[key] !== expected) {
    throw new Error(`${flag} must have ${key}=${String(expected)}; received ${String(object[key])}`)
  }
}

function validateNestedSourceRollup(record: Record<string, unknown>, flag: string): void {
  assertField(record, 'decision', 'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks', flag)
  assertField(record, 'status', 'owner_approved_worker_gates_ready_runtime_still_blocked', flag)
  assertNumberField(record, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(record, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(record, 'properlyInstalledForPlannedSurface', 21, flag)
  assertNumberField(record, 'productionMappedTools', 21, flag)
  assertNumberField(record, 'duplicateProductionMappings', 0, flag)
  assertNumberField(record, 'gpuRuntimeTargetedTools', 8, flag)
  assertField(record, 'gpuRuntimeTargetsExact', true, flag)
  assertField(record, 'gpuRuntimeOnDemandOnly', true, flag)
  assertNumberField(record, 'heavyToolsIncorrectlyTargetingCpu', 0, flag)
  assertNumberField(record, 'productionWorkerGateChecksAcceptedWithProvidedEvidence', 21, flag)
  assertNumberField(record, 'capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence', 12, flag)
  assertNumberField(record, 'hardFailedProductionWorkerGateChecksWithProvidedEvidence', 0, flag)
  assertNumberField(record, 'internalBetaReadyNowTools', 0, flag)
  assertNumberField(record, 'externalBetaReadyNowTools', 0, flag)
  assertNumberField(record, 'productionReadyNowTools', 0, flag)

  const expectedTargets = asRecord(record.expectedGpuRuntimeTargets, 'sourceRollup.expectedGpuRuntimeTargets')
  for (const [toolId, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
    assertField(expectedTargets, toolId, runtimeTarget, flag)
  }
  if (Object.keys(expectedTargets).length !== 8) {
    throw new Error(`${flag} sourceRollup must preserve exactly 8 GPU runtime targets`)
  }

  const booleans = asRecord(record.booleans, 'sourceRollup.booleans')
  for (const [key, expected] of Object.entries({
    internalBetaGoNoGoReadyWithProvidedEvidence: true,
    sourceProductionWorkerGateAcceptedWithProvidedEvidence: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21ToolsProperlyInstalledForPlannedSurface: true,
    all21ToolsMappedToProductionRegistry: true,
    noDuplicateProductionMappings: true,
    gpuHeavyToolsTargetGpuRuntime: true,
    gpuRuntimeTargetsExact: true,
    gpuRuntimeOnDemandOnly: true,
    productionWorkerGateHardFailuresWithProvidedEvidenceAbsent: true,
  })) {
    assertBooleanField(booleans, key, expected, flag)
  }
  for (const key of sourceFalseGateKeys) {
    assertBooleanField(booleans, key, false, flag)
  }

  const productionWorkerGateReadiness = asRecord(
    record.productionWorkerGateReadiness,
    'sourceRollup.productionWorkerGateReadiness',
  )
  assertField(productionWorkerGateReadiness, 'status', 'owner_approved_production_worker_gate_checks_ready', flag)
  assertNumberField(productionWorkerGateReadiness, 'productionWorkerGateChecksAcceptedWithProvidedEvidence', 21, flag)
  assertNumberField(
    productionWorkerGateReadiness,
    'capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence',
    12,
    flag,
  )
  assertNumberField(productionWorkerGateReadiness, 'hardFailedGateChecksWithProvidedEvidence', 0, flag)
  assertNumberField(productionWorkerGateReadiness, 'productionWorkerGateChecksReadyNow', 0, flag)
  if (
    !Array.isArray(productionWorkerGateReadiness.productionWorkerGateChecks) ||
    productionWorkerGateReadiness.productionWorkerGateChecks.length !== 21
  ) {
    throw new Error(`${flag} sourceRollup must preserve exactly 21 production worker gate checks`)
  }

  const expectedGpuTools = new Set(Object.keys(expectedGpuRuntimeTargets))
  const gpuGateChecks = productionWorkerGateReadiness.productionWorkerGateChecks.filter((gateCheck): boolean => {
    const gateRecord = asRecord(gateCheck, 'sourceRollup.productionWorkerGateChecks[]')
    return expectedGpuTools.has(String(gateRecord.toolId))
  })
  if (gpuGateChecks.length !== 8) {
    throw new Error(`${flag} sourceRollup must preserve exactly 8 GPU/model gate checks; got ${gpuGateChecks.length}`)
  }

  for (const gateCheck of productionWorkerGateReadiness.productionWorkerGateChecks) {
    const gateRecord = asRecord(gateCheck, 'sourceRollup.productionWorkerGateChecks[]')
    const toolId = String(gateRecord.toolId)
    assertBooleanField(gateRecord, 'sourceProductionWorkerJobReadyWithProvidedEvidence', true, flag)
    assertBooleanField(gateRecord, 'gateChecksAcceptedWithProvidedEvidence', true, flag)
    assertBooleanField(gateRecord, 'canEnqueueProductionWorkerJobNow', false, flag)
    assertBooleanField(gateRecord, 'canDispatchProductionWorkerJobNow', false, flag)
    assertBooleanField(gateRecord, 'canRunProductionWorkerRouteNow', false, flag)
    assertBooleanField(gateRecord, 'canExecuteToolNow', false, flag)
    if (Array.isArray(gateRecord.hardFailedGateNames) && gateRecord.hardFailedGateNames.length !== 0) {
      throw new Error(`${flag} sourceRollup has hard failed gates for ${toolId}`)
    }

    const expectedGpuTarget = expectedGpuRuntimeTargets[toolId]
    if (expectedGpuTarget) {
      assertField(gateRecord, 'workerType', 'gpu_ai_worker', flag)
      assertField(gateRecord, 'runtimeTarget', expectedGpuTarget, flag)
    } else if (gateRecord.workerType === 'gpu_ai_worker' || String(gateRecord.runtimeTarget).includes('nvidia_l4')) {
      throw new Error(`${flag} has unexpected GPU/model gate check for non-GPU tool: ${toolId}`)
    }
  }

  const sourceJobReadiness = asRecord(
    productionWorkerGateReadiness.sourceProductionWorkerJobReadiness,
    'sourceRollup.sourceProductionWorkerJobReadiness',
  )
  if (
    sourceJobReadiness.status !== 'owner_approved_production_worker_jobs_ready' ||
    sourceJobReadiness.productionWorkerJobPayloadsReadyWithProvidedEvidence !== 21 ||
    sourceJobReadiness.capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence !== 12
  ) {
    throw new Error(`${flag} sourceRollup must preserve owner-approved source job readiness`)
  }
  if (
    !Array.isArray(sourceJobReadiness.productionWorkerJobPayloads) ||
    sourceJobReadiness.productionWorkerJobPayloads.length !== 21
  ) {
    throw new Error(`${flag} sourceRollup must preserve exactly 21 source job payloads`)
  }

  const gpuSourcePayloads = sourceJobReadiness.productionWorkerJobPayloads.filter((candidate): boolean => {
    const candidateRecord = asRecord(candidate, 'sourceRollup.productionWorkerJobPayloads[]')
    return expectedGpuTools.has(String(candidateRecord.sourceToolId))
  })
  if (gpuSourcePayloads.length !== 8) {
    throw new Error(`${flag} sourceRollup must preserve exactly 8 GPU/model source payloads; got ${gpuSourcePayloads.length}`)
  }

  for (const candidate of sourceJobReadiness.productionWorkerJobPayloads) {
    const candidateRecord = asRecord(candidate, 'sourceRollup.productionWorkerJobPayloads[]')
    const toolId = String(candidateRecord.sourceToolId)
    const payload = asRecord(candidateRecord.productionWorkerJobPayload, `productionWorkerJobPayload:${toolId}`)
    const metadata = asRecord(payload.metadata, `productionWorkerJobPayload.metadata:${toolId}`)
    const policy = asRecord(metadata.aiGraphicsRuntimeActivationPolicy, `runtimeActivationPolicy:${toolId}`)
    assertBooleanField(candidateRecord, 'productionWorkerJobReadyWithProvidedEvidence', true, flag)
    assertBooleanField(candidateRecord, 'canEnqueueProductionWorkerJobNow', false, flag)
    assertBooleanField(candidateRecord, 'canRunProductionWorkerRouteNow', false, flag)
    assertBooleanField(candidateRecord, 'canExecuteToolNow', false, flag)
    assertBooleanField(policy, 'onDemandOnly', true, flag)
    assertBooleanField(policy, 'noIdleGpuRuntimeApproved', true, flag)
    assertBooleanField(policy, 'startsOnlyForApprovedWorkerOrToolCall', true, flag)
    assertBooleanField(policy, 'cpuFallbackAllowedForHeavyTools', false, flag)
    assertBooleanField(metadata, 'gpuRuntimeOnDemandOnly', true, flag)
    assertBooleanField(metadata, 'noIdleGpuRuntimeApproved', true, flag)
    assertBooleanField(metadata, 'startsOnlyForApprovedWorkerOrToolCall', true, flag)
    assertBooleanField(metadata, 'cpuFallbackAllowedForHeavyTools', false, flag)

    const expectedGpuTarget = expectedGpuRuntimeTargets[toolId]
    if (expectedGpuTarget) {
      assertField(candidateRecord, 'sourceRuntimeTarget', expectedGpuTarget, flag)
      assertField(payload, 'workerType', 'gpu_ai_worker', flag)
      assertField(metadata, 'aiGraphicsRuntimeTarget', expectedGpuTarget, flag)
    } else if (payload.workerType === 'gpu_ai_worker' || String(candidateRecord.sourceRuntimeTarget).includes('nvidia_l4')) {
      throw new Error(`${flag} has unexpected GPU/model source job payload for non-GPU tool: ${toolId}`)
    }
  }
}

function validateNestedSourceGoNoGo(record: Record<string, unknown>, flag: string): void {
  assertField(record, 'decision', 'ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks', flag)
  assertField(record, 'status', 'internal_beta_go_no_go_approved_runtime_still_blocked', flag)
  assertNumberField(record, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(record, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(record, 'goNoGoCandidateToolsWithProvidedEvidence', 21, flag)
  assertNumberField(record, 'goNoGoCandidateCapabilitiesWithProvidedEvidence', 12, flag)
  assertBooleanField(record, 'internalBetaGoNoGoReadyWithProvidedEvidence', true, flag)
  assertBooleanField(record, 'internalBetaGoNoGoApprovalRecordAccepted', true, flag)
  assertNumberField(record, 'internalBetaGoNoGoApprovedToolsWithProvidedEvidence', 21, flag)
  assertNumberField(record, 'internalBetaReadyNowTools', 0, flag)
  assertNumberField(record, 'externalBetaReadyNowTools', 0, flag)
  assertNumberField(record, 'productionReadyNowTools', 0, flag)

  const booleans = asRecord(record.booleans, 'sourceGoNoGo.booleans')
  for (const [key, expected] of Object.entries({
    sourceBetaProductionReadinessRollupAccepted: true,
    internalBetaGoNoGoReadyWithProvidedEvidence: true,
    internalBetaGoNoGoApprovalRecordAccepted: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence: true,
  })) {
    assertBooleanField(booleans, key, expected, flag)
  }
  for (const key of sourceFalseGateKeys) {
    assertBooleanField(booleans, key, false, flag)
  }

  validateNestedSourceRollup(asRecord(record.sourceRollup, 'sourceGoNoGo.sourceRollup'), flag)
}

function validateNestedGoNoGoOwnerApproval(record: Record<string, unknown>, flag: string): void {
  assertField(record, 'decision', 'ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks', flag)
  assertField(record, 'status', 'internal_beta_go_no_go_owner_approved_runtime_still_blocked', flag)
  assertNumberField(record, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(record, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(record, 'ownerApprovedToolsWithProvidedEvidence', 21, flag)
  assertNumberField(record, 'ownerApprovedCapabilitiesWithProvidedEvidence', 12, flag)
  assertNumberField(record, 'internalBetaReadyNowTools', 0, flag)
  assertNumberField(record, 'externalBetaReadyNowTools', 0, flag)
  assertNumberField(record, 'productionReadyNowTools', 0, flag)

  const booleans = asRecord(record.booleans, 'sourceGoNoGoOwnerApproval.booleans')
  for (const [key, expected] of Object.entries({
    sourceInternalBetaGoNoGoAccepted: true,
    internalBetaGoNoGoOwnerApprovalRecordAccepted: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence: true,
    agentCanSelectForPlanning: true,
  })) {
    assertBooleanField(booleans, key, expected, flag)
  }
  for (const key of sourceFalseGateKeys) {
    assertBooleanField(booleans, key, false, flag)
  }

  validateNestedSourceGoNoGo(asRecord(record.sourceGoNoGo, 'sourceGoNoGoOwnerApproval.sourceGoNoGo'), flag)
}

function validateNestedRuntimeEnqueueApproval(record: Record<string, unknown>, flag: string): void {
  assertField(record, 'decision', 'ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks', flag)
  assertField(record, 'status', 'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked', flag)
  assertField(record, 'sourceGoNoGoOwnerApprovalDecision', 'ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks', flag)
  assertNumberField(record, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(record, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(record, 'enqueueScopeCandidateToolsWithProvidedEvidence', 21, flag)
  assertNumberField(record, 'enqueueScopeApprovedToolsWithProvidedEvidence', 21, flag)
  assertNumberField(record, 'gpuRuntimeTargetedTools', 8, flag)
  assertNumberField(record, 'gpuRuntimeStartAllowedForAcceptedJobTools', 8, flag)
  assertNumberField(record, 'heavyToolsIncorrectlyTargetingCpu', 0, flag)
  assertNumberField(record, 'liveWorkerQueueApprovedNowTools', 0, flag)
  assertNumberField(record, 'liveWorkerExecutionApprovedNowTools', 0, flag)

  const booleans = asRecord(record.booleans, 'sourceRuntimeEnqueueApproval.booleans')
  for (const [key, expected] of Object.entries({
    sourceGoNoGoOwnerApprovalAccepted: true,
    internalBetaRuntimeEnqueueApprovalRecordAccepted: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21RuntimeEnqueueScopesPrepared: true,
    all21RuntimeEnqueueScopesApprovedWithProvidedEvidence: true,
    gpuHeavyToolsTargetGpuRuntime: true,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    gpuStartsOnlyForApprovedWorkerOrToolCall: true,
    gpuRuntimeStartAllowedOnlyForAcceptedJobs: true,
    agentCanSelectForPlanning: true,
  })) {
    assertBooleanField(booleans, key, expected, flag)
  }
  assertBooleanField(booleans, 'gpuRuntimeShouldStartNow', false, flag)
  assertBooleanField(booleans, 'cpuFallbackAllowedForHeavyTools', false, flag)
  for (const key of sourceFalseGateKeys) {
    assertBooleanField(booleans, key, false, flag)
  }

  if (!Array.isArray(record.toolScopes) || record.toolScopes.length !== 21) {
    throw new Error(`${flag} sourceRuntimeEnqueueApproval must contain exactly 21 tool scopes`)
  }
  const gpuScopes = record.toolScopes.filter((scope) => (
    asRecord(scope, 'sourceRuntimeEnqueueApproval.toolScopes[]').gpuRequiredForRuntime === true
  ))
  if (gpuScopes.length !== 8) {
    throw new Error(`${flag} sourceRuntimeEnqueueApproval must contain exactly 8 GPU scopes`)
  }
  for (const scope of record.toolScopes) {
    const scopeRecord = asRecord(scope, 'sourceRuntimeEnqueueApproval.toolScopes[]')
    const toolId = String(scopeRecord.toolId)
    assertBooleanField(scopeRecord, 'enqueueScopeApprovedWithProvidedEvidence', true, flag)
    assertBooleanField(scopeRecord, 'gpuRuntimeShouldStartNow', false, flag)
    if (scopeRecord.gpuRuntimeStartAllowedForAcceptedJob !== scopeRecord.gpuRequiredForRuntime) {
      throw new Error(`${flag} sourceRuntimeEnqueueApproval tool ${toolId} has mismatched GPU start authorization`)
    }
    const expectedGpuTarget = expectedGpuRuntimeTargets[toolId]
    if (expectedGpuTarget) {
      assertField(scopeRecord, 'workerType', 'gpu_ai_worker', flag)
      assertField(scopeRecord, 'runtimeTarget', expectedGpuTarget, flag)
      const policy = asRecord(scopeRecord.runtimeActivationPolicy, `sourceRuntimeEnqueueApproval.runtimeActivationPolicy:${toolId}`)
      assertBooleanField(policy, 'onDemandOnly', true, flag)
      assertBooleanField(policy, 'noIdleGpuRuntimeApproved', true, flag)
      assertBooleanField(policy, 'startsOnlyForApprovedWorkerOrToolCall', true, flag)
      assertBooleanField(policy, 'cpuFallbackAllowedForHeavyTools', false, flag)
    } else if (scopeRecord.workerType === 'gpu_ai_worker' || String(scopeRecord.runtimeTarget).includes('nvidia_l4')) {
      throw new Error(`${flag} has unexpected GPU/model runtime-enqueue scope for non-GPU tool: ${toolId}`)
    }
  }

  validateNestedGoNoGoOwnerApproval(
    asRecord(record.sourceGoNoGoOwnerApproval, 'sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval'),
    flag,
  )
}

function validateQueueAdmissionReadinessPacket(
  packet: AiGraphicsInternalBetaQueueAdmissionReadiness,
  flag: string,
): void {
  const packetRecord = packet as unknown as Record<string, unknown>
  const booleans = packetRecord.booleans
  if (typeof booleans !== 'object' || booleans === null || Array.isArray(booleans)) {
    throw new Error(`${flag} must contain a booleans object`)
  }
  const booleanRecord = booleans as Record<string, unknown>

  assertNumberField(packetRecord, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(packetRecord, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(packetRecord, 'queueAdmissionPacketsPrepared', 21, flag)
  assertNumberField(packetRecord, 'queueAdmissionPacketsReadyWithProvidedEvidence', 21, flag)
  assertNumberField(packetRecord, 'queueAdmissionCapabilitiesReadyWithProvidedEvidence', 12, flag)
  assertNumberField(packetRecord, 'runtimeAdmissionPacketsReadyWithProvidedEvidence', 21, flag)
  assertNumberField(packetRecord, 'gpuRuntimeStartAllowedForAcceptedJobTools', 8, flag)
  assertNumberField(packetRecord, 'liveWorkerQueueApprovedNowTools', 0, flag)
  assertNumberField(packetRecord, 'liveWorkerExecutionApprovedNowTools', 0, flag)
  assertField(
    packetRecord,
    'sourceRuntimeEnqueueApprovalDecision',
    'ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks',
    flag,
  )

  for (const [key, expected] of Object.entries({
    sourceRuntimeEnqueueScopeAccepted: true,
    queueAdmissionPrerequisitesSatisfied: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21QueueAdmissionPacketsPrepared: true,
    all21QueueAdmissionPacketsReadyWithProvidedEvidence: true,
    all21RuntimeAdmissionPacketsReadyWithProvidedEvidence: true,
    all12CapabilitiesReadyWithProvidedEvidence: true,
    approvedPlanSnapshotRefAccepted: true,
    creditReservationRefAccepted: true,
    privateArtifactManifestOnly: true,
    gpuHeavyToolsTargetGpuRuntime: true,
    gpuRuntimeTargetsExact: true,
    gpuRuntimeOnDemandOnly: true,
    onDemandRuntimeAdmissionApplied: true,
    gpuRuntimeStartAllowedOnlyForAcceptedJobs: true,
    agentCanSelectForPlanning: true,
  })) {
    assertBooleanField(booleanRecord, key, expected, flag)
  }
  for (const key of falseGateKeys) {
    assertBooleanField(booleanRecord, key, false, flag)
  }
  validateNestedRuntimeEnqueueApproval(
    asRecord(packetRecord.sourceRuntimeEnqueueApproval, 'sourceRuntimeEnqueueApproval'),
    flag,
  )

  if (!Array.isArray(packet.queueAdmissionPackets) || packet.queueAdmissionPackets.length !== 21) {
    throw new Error(`${flag} must contain exactly 21 queueAdmissionPackets`)
  }
  const gpuPackets = packet.queueAdmissionPackets.filter((candidate) => candidate.gpuRequiredForRuntime)
  if (gpuPackets.length !== 8) {
    throw new Error(`${flag} must contain exactly 8 GPU runtime-targeted queue packets`)
  }
  for (const queuePacket of packet.queueAdmissionPackets) {
    if (queuePacket.queueAdmissionReadyWithProvidedEvidence !== true) {
      throw new Error(`${flag} tool ${queuePacket.toolId} must be queue-admission ready`)
    }
    if (queuePacket.runtimeAdmissionReadyWithProvidedEvidence !== true) {
      throw new Error(`${flag} tool ${queuePacket.toolId} must be runtime-admission ready`)
    }
    if (queuePacket.gpuRuntimeShouldStartNow !== false) {
      throw new Error(`${flag} tool ${queuePacket.toolId} must have gpuRuntimeShouldStartNow=false`)
    }
    if (queuePacket.gpuRuntimeStartAllowedForAcceptedJob !== queuePacket.gpuRequiredForRuntime) {
      throw new Error(
        `${flag} tool ${queuePacket.toolId} must allow GPU start exactly when GPU runtime is required`,
      )
    }
  }
}

function readSourceQueueAdmissionReadinessPacket(): {
  sourceQueueAdmissionReadinessPacket?: AiGraphicsInternalBetaQueueAdmissionReadiness
  sourceEvidenceMode:
    | 'constructed_from_cli_flags'
    | 'internal_beta_queue_admission_readiness_packet'
} {
  const filePath = valueAfterFlag('--internal-beta-queue-admission-readiness-packet')
  if (!filePath) {
    return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  }

  const packet = readJsonObjectFile(filePath)
  if (!isQueueAdmissionReadinessPacket(packet)) {
    throw new Error(
      'Queue-admission readiness packet must report internal_beta_queue_admission_ready_runtime_still_blocked with all 21 queue-admission packets ready.',
    )
  }
  validateQueueAdmissionReadinessPacket(
    packet,
    '--internal-beta-queue-admission-readiness-packet',
  )

  return {
    sourceQueueAdmissionReadinessPacket: packet,
    sourceEvidenceMode: 'internal_beta_queue_admission_readiness_packet',
  }
}

function readProofPacket(flag: string, committedPath: string): unknown | undefined {
  const fromFlag = readJsonFile(flag)
  if (fromFlag) return fromFlag
  if (hasFlag('--use-committed-js-runtime-proofs')) return readJsonPath(committedPath)
  return undefined
}

function queueValue(flag: string, defaultValue: string): string | undefined {
  return valueAfterFlag(flag) ??
    (hasFlag('--all-queue-admission-prerequisites-provided') ? defaultValue : undefined)
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const {
  sourceQueueAdmissionReadinessPacket,
  sourceEvidenceMode,
} = readSourceQueueAdmissionReadinessPacket()
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput = {
  approvedPlanSnapshotGatePassed:
    allTechnicalGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed:
    allTechnicalGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed:
    allTechnicalGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed: allTechnicalGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed: allTechnicalGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  modelWeightManifestReviewPacket: readJsonFile(
    '--model-weight-manifest-review-packet',
  ) as AiGraphicsBetaEvidenceBundleInput['modelWeightManifestReviewPacket'],
  gpuRuntimeProofResultPacket: readJsonFile(
    '--gpu-runtime-proof-result-packet',
  ) as AiGraphicsBetaEvidenceBundleInput['gpuRuntimeProofResultPacket'],
  sourceExternalBetaNativeGpuProofCollectionPacket: readJsonFile(
    '--external-beta-native-gpu-proof-collection-packet',
  ) as AiGraphicsBetaEvidenceBundleInput['sourceExternalBetaNativeGpuProofCollectionPacket'],
  nodeRuntimeProofPacket: readProofPacket(
    '--node-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
  ) as AiGraphicsBetaEvidenceBundleInput['nodeRuntimeProofPacket'],
  browserRuntimeProofPacket: readProofPacket(
    '--browser-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  ) as AiGraphicsBetaEvidenceBundleInput['browserRuntimeProofPacket'],
  satoriFontRuntimeProofPacket: readProofPacket(
    '--satori-font-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
  ) as AiGraphicsBetaEvidenceBundleInput['satoriFontRuntimeProofPacket'],
}

const queueAdapterReadiness = buildAiGraphicsInternalBetaQueueAdapterReadiness({
  sourceQueueAdmissionReadinessPacket,
  evidenceBundleInput,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaGoNoGoOwnerApprovalGranted:
    hasFlag('--internal-beta-go-no-go-owner-approval-granted'),
  internalBetaGoNoGoOwnerApprovalRef:
    valueAfterFlag('--internal-beta-go-no-go-owner-approval-ref'),
  internalBetaGoNoGoOwnerApproverRole:
    valueAfterFlag('--internal-beta-go-no-go-owner-approver-role') ??
    'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaRuntimeEnqueueApprovalGranted:
    hasFlag('--internal-beta-runtime-enqueue-approval-granted'),
  internalBetaRuntimeEnqueueApprovalRef:
    valueAfterFlag('--internal-beta-runtime-enqueue-approval-ref'),
  internalBetaRuntimeEnqueueApproverRole:
    valueAfterFlag('--internal-beta-runtime-enqueue-approver-role') ??
    'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  approvedPlanSnapshotId:
    queueValue('--approved-plan-snapshot-id', 'approved_snapshot_ai_graphics_internal_beta_fixture'),
  creditReservationId:
    queueValue('--credit-reservation-id', 'credit_reservation_ai_graphics_internal_beta_fixture'),
  privateArtifactManifestRef:
    queueValue('--private-artifact-manifest-ref', 'private://ai-graphics/internal-beta/artifact-manifest.json'),
  artifactBoundaryApprovalRef:
    queueValue('--artifact-boundary-approval-ref', 'artifact_boundary_ai_graphics_internal_beta_owner_ref'),
  toolRouteApprovalRef:
    queueValue('--tool-route-approval-ref', 'tool_route_ai_graphics_internal_beta_owner_ref'),
  workerApprovalRef:
    queueValue('--worker-approval-ref', 'worker_ai_graphics_internal_beta_owner_ref'),
  workerQueueTransportRef:
    queueValue('--worker-queue-transport-ref', 'worker_queue_transport_ai_graphics_internal_beta_ref'),
  workerIdempotencyNamespace:
    queueValue('--worker-idempotency-namespace', 'ai_graphics_internal_beta_queue_admission'),
  internalBetaRuntimeOwnerApprovalRef:
    queueValue('--internal-beta-runtime-owner-approval-ref', 'internal_beta_runtime_owner_approval_ai_graphics_ref'),
  nodeRuntimeProofRef:
    queueValue('--node-runtime-proof-ref', 'private://ai-graphics/runtime-proofs/node-cpu-static.json'),
  browserRuntimeProofRef:
    queueValue('--browser-runtime-proof-ref', 'private://ai-graphics/runtime-proofs/browser-runtime.json'),
  satoriFontRuntimeProofRef:
    queueValue('--satori-font-runtime-proof-ref', 'private://ai-graphics/runtime-proofs/satori-font-runtime.json'),
  nativeGpuRuntimeProofRef:
    queueValue('--native-gpu-runtime-proof-ref', 'private://ai-graphics/runtime-proofs/native-nvidia-l4.json'),
  modelWeightManifestRef:
    queueValue('--model-weight-manifest-ref', 'private://ai-graphics/model-weight-manifests/review-packet.json'),
})

const output = {
  ...queueAdapterReadiness,
  input: {
    validatorOnly: true,
    committedJsRuntimeProofsRead: hasFlag('--use-committed-js-runtime-proofs'),
    sourceEvidenceMode,
    internalBetaQueueAdmissionReadinessPacketRead:
      Boolean(sourceQueueAdmissionReadinessPacket),
    allQueueAdmissionPrerequisitesProvided:
      hasFlag('--all-queue-admission-prerequisites-provided'),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    workerLeaseCreated: false,
    productionWorkerDispatchPerformed: false,
    productionWorkerRouteExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}

console.log(JSON.stringify(output, null, 2))

if (
  hasFlag('--require-queue-adapter-ready') &&
  !queueAdapterReadiness.booleans.all21QueueAdapterSubmissionsReadyWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-backend-queue-submit') || hasFlag('--require-runtime-ready') || hasFlag('--require-production-ready')) {
  process.exitCode = 3
}
