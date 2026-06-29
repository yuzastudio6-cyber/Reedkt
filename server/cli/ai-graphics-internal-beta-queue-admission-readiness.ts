import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaQueueAdmissionReadiness,
} from '../tool-registry/ai-graphics-internal-beta-queue-admission-readiness'
import type {
  AiGraphicsInternalBetaRuntimeEnqueueApproval,
} from '../tool-registry/ai-graphics-internal-beta-runtime-enqueue-approval'
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

function readJsonObjectFile(flag: string): Record<string, unknown> | undefined {
  const parsed = readJsonFile(flag)
  if (!parsed) return undefined
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Evidence packet file for ${flag} must contain a JSON object`)
  }
  return parsed as Record<string, unknown>
}

function readJsonPath(filePath: string): unknown {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

function readProofPacket(flag: string, committedPath: string): unknown | undefined {
  const fromFlag = readJsonFile(flag)
  if (fromFlag) return fromFlag
  if (hasFlag('--use-committed-js-runtime-proofs')) return readJsonPath(committedPath)
  return undefined
}

function isRuntimeEnqueueApprovalPacket(
  value: unknown,
): value is AiGraphicsInternalBetaRuntimeEnqueueApproval {
  return Boolean(
    typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).decision ===
        'ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks' &&
      typeof (value as Record<string, unknown>).status === 'string' &&
      Array.isArray((value as Record<string, unknown>).toolScopes) &&
      typeof (value as Record<string, unknown>).booleans === 'object',
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

const sourceFalseGateKeys = falseGateKeys.filter((key) => key !== 'gpuRuntimeShouldStartNow')

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

function validateSourceRollup(record: Record<string, unknown>, flag: string): void {
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

function validateSourceGoNoGo(record: Record<string, unknown>, flag: string): void {
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
  validateSourceRollup(asRecord(record.sourceRollup, 'sourceGoNoGo.sourceRollup'), flag)
}

function validateGoNoGoOwnerApprovalSource(record: Record<string, unknown>, flag: string): void {
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

  validateSourceGoNoGo(asRecord(record.sourceGoNoGo, 'sourceGoNoGoOwnerApproval.sourceGoNoGo'), flag)
}

function validateRuntimeEnqueueApprovalPacket(
  packet: AiGraphicsInternalBetaRuntimeEnqueueApproval,
  flag: string,
): void {
  const packetRecord = packet as unknown as Record<string, unknown>
  const booleans = packetRecord.booleans
  if (typeof booleans !== 'object' || booleans === null || Array.isArray(booleans)) {
    throw new Error(`${flag} must contain a booleans object`)
  }
  const booleanRecord = booleans as Record<string, unknown>

  if (packet.status !== 'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked') {
    throw new Error(
      `${flag} must be runtime-enqueue approved and runtime-blocked; received ${packet.status}`,
    )
  }
  assertField(
    packetRecord,
    'sourceGoNoGoOwnerApprovalDecision',
    'ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks',
    flag,
  )
  assertNumberField(packetRecord, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(packetRecord, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(packetRecord, 'enqueueScopeCandidateToolsWithProvidedEvidence', 21, flag)
  assertNumberField(packetRecord, 'enqueueScopeApprovedToolsWithProvidedEvidence', 21, flag)
  assertNumberField(packetRecord, 'gpuRuntimeTargetedTools', 8, flag)
  assertNumberField(packetRecord, 'gpuRuntimeStartAllowedForAcceptedJobTools', 8, flag)
  assertNumberField(packetRecord, 'heavyToolsIncorrectlyTargetingCpu', 0, flag)
  assertNumberField(packetRecord, 'liveWorkerQueueApprovedNowTools', 0, flag)
  assertNumberField(packetRecord, 'liveWorkerExecutionApprovedNowTools', 0, flag)
  assertNumberField(packetRecord, 'internalBetaReadyNowTools', 0, flag)
  assertNumberField(packetRecord, 'externalBetaReadyNowTools', 0, flag)
  assertNumberField(packetRecord, 'productionReadyNowTools', 0, flag)

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
    assertBooleanField(booleanRecord, key, expected, flag)
  }
  assertBooleanField(booleanRecord, 'cpuFallbackAllowedForHeavyTools', false, flag)
  for (const key of falseGateKeys) {
    assertBooleanField(booleanRecord, key, false, flag)
  }

  validateGoNoGoOwnerApprovalSource(
    asRecord(packetRecord.sourceGoNoGoOwnerApproval, 'sourceGoNoGoOwnerApproval'),
    flag,
  )

  if (!Array.isArray(packet.toolScopes) || packet.toolScopes.length !== 21) {
    throw new Error(`${flag} must contain exactly 21 toolScopes`)
  }
  const gpuScopes = packet.toolScopes.filter((scope) => scope.gpuRequiredForRuntime)
  if (gpuScopes.length !== 8) {
    throw new Error(`${flag} must contain exactly 8 GPU runtime-targeted tool scopes`)
  }
  for (const scope of packet.toolScopes) {
    if (scope.gpuRuntimeShouldStartNow !== false) {
      throw new Error(`${flag} tool ${scope.toolId} must have gpuRuntimeShouldStartNow=false`)
    }
    if (scope.gpuRuntimeStartAllowedForAcceptedJob !== scope.gpuRequiredForRuntime) {
      throw new Error(
        `${flag} tool ${scope.toolId} must allow GPU start exactly when GPU runtime is required`,
      )
    }
    if (scope.gpuRequiredForRuntime) {
      if (scope.runtimeActivationPolicy?.onDemandOnly !== true) {
        throw new Error(`${flag} tool ${scope.toolId} must be on-demand GPU only`)
      }
      if (scope.runtimeActivationPolicy?.noIdleGpuRuntimeApproved !== true) {
        throw new Error(`${flag} tool ${scope.toolId} must block idle GPU runtime`)
      }
      if (scope.runtimeActivationPolicy?.startsOnlyForApprovedWorkerOrToolCall !== true) {
        throw new Error(`${flag} tool ${scope.toolId} must start only for approved worker/tool call`)
      }
      if (scope.runtimeActivationPolicy?.cpuFallbackAllowedForHeavyTools !== false) {
        throw new Error(`${flag} tool ${scope.toolId} must block CPU fallback`)
      }
    }
  }
}

function readSourceRuntimeEnqueueApprovalPacket(): {
  sourceRuntimeEnqueueApproval?: AiGraphicsInternalBetaRuntimeEnqueueApproval
  sourceEvidenceMode: 'constructed_from_cli_flags' | 'internal_beta_runtime_enqueue_approval_packet'
} {
  const sourcePacket = readJsonObjectFile('--internal-beta-runtime-enqueue-approval-packet')
  if (!sourcePacket) return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  if (!isRuntimeEnqueueApprovalPacket(sourcePacket)) {
    throw new Error(
      '--internal-beta-runtime-enqueue-approval-packet does not contain an AI graphics internal beta runtime-enqueue approval packet',
    )
  }
  validateRuntimeEnqueueApprovalPacket(
    sourcePacket,
    '--internal-beta-runtime-enqueue-approval-packet',
  )
  return {
    sourceRuntimeEnqueueApproval: sourcePacket,
    sourceEvidenceMode: 'internal_beta_runtime_enqueue_approval_packet',
  }
}

function queueValue(flag: string, defaultValue: string): string | undefined {
  return valueAfterFlag(flag) ??
    (hasFlag('--all-queue-admission-prerequisites-provided') ? defaultValue : undefined)
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const sourcePacket = readSourceRuntimeEnqueueApprovalPacket()
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput | undefined =
  sourcePacket.sourceRuntimeEnqueueApproval
    ? undefined
    : {
        approvedPlanSnapshotGatePassed:
          allTechnicalGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
        creditReservationGatePassed:
          allTechnicalGatesPassed || hasFlag('--credit-reservation-gate-passed'),
        artifactBoundaryGatePassed:
          allTechnicalGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
        toolRouteGatePassed:
          allTechnicalGatesPassed || hasFlag('--tool-route-gate-passed'),
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

const queueAdmission = buildAiGraphicsInternalBetaQueueAdmissionReadiness({
  sourceRuntimeEnqueueApprovalPacket: sourcePacket.sourceRuntimeEnqueueApproval,
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
  ...queueAdmission,
  input: {
    validatorOnly: true,
    sourceEvidenceMode: sourcePacket.sourceEvidenceMode,
    internalBetaRuntimeEnqueueApprovalPacketRead: Boolean(
      valueAfterFlag('--internal-beta-runtime-enqueue-approval-packet'),
    ),
    committedJsRuntimeProofsRead: hasFlag('--use-committed-js-runtime-proofs'),
    allQueueAdmissionPrerequisitesProvided:
      hasFlag('--all-queue-admission-prerequisites-provided'),
    evidencePacketFilesRead: [
      valueAfterFlag('--internal-beta-runtime-enqueue-approval-packet'),
      valueAfterFlag('--model-weight-manifest-review-packet'),
      valueAfterFlag('--gpu-runtime-proof-result-packet'),
      valueAfterFlag('--external-beta-native-gpu-proof-collection-packet'),
      valueAfterFlag('--node-runtime-proof-packet'),
      valueAfterFlag('--browser-runtime-proof-packet'),
      valueAfterFlag('--satori-font-runtime-proof-packet'),
    ].filter(Boolean).length,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
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
  hasFlag('--require-queue-admission-ready') &&
  !queueAdmission.booleans.all21QueueAdmissionPacketsReadyWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-live-worker-queue') || hasFlag('--require-runtime-ready') || hasFlag('--require-production-ready')) {
  process.exitCode = 3
}
