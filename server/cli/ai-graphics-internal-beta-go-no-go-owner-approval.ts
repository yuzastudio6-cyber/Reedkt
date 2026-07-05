import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaGoNoGoOwnerApproval,
} from '../tool-registry/ai-graphics-internal-beta-go-no-go-owner-approval'
import type {
  AiGraphicsInternalBetaGoNoGo,
} from '../tool-registry/ai-graphics-internal-beta-go-no-go'
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

const requiredSourceFalseBooleans = [
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
]

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

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Internal beta go/no-go packet must include object field: ${field}.`)
  }
  return value as Record<string, unknown>
}

function assertField(record: Record<string, unknown>, key: string, expected: unknown): void {
  if (record[key] !== expected) {
    throw new Error(
      `Internal beta go/no-go packet field ${key} must equal ${String(expected)}; received ${String(
        record[key],
      )}.`,
    )
  }
}

function validateSourceRollup(record: Record<string, unknown>): void {
  assertField(record, 'decision', 'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks')
  assertField(record, 'status', 'owner_approved_worker_gates_ready_runtime_still_blocked')
  assertField(record, 'totalAiGraphicsTools', 21)
  assertField(record, 'totalProductFacingCapabilities', 12)
  assertField(record, 'properlyInstalledForPlannedSurface', 21)
  assertField(record, 'productionMappedTools', 21)
  assertField(record, 'duplicateProductionMappings', 0)
  assertField(record, 'gpuRuntimeTargetedTools', 8)
  assertField(record, 'gpuRuntimeTargetsExact', true)
  assertField(record, 'gpuRuntimeOnDemandOnly', true)
  assertField(record, 'heavyToolsIncorrectlyTargetingCpu', 0)
  assertField(record, 'productionWorkerGateChecksAcceptedWithProvidedEvidence', 21)
  assertField(record, 'capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence', 12)
  assertField(record, 'hardFailedProductionWorkerGateChecksWithProvidedEvidence', 0)
  assertField(record, 'internalBetaReadyNowTools', 0)
  assertField(record, 'externalBetaReadyNowTools', 0)
  assertField(record, 'productionReadyNowTools', 0)

  const expectedTargets = asRecord(record.expectedGpuRuntimeTargets, 'sourceRollup.expectedGpuRuntimeTargets')
  for (const [toolId, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
    assertField(expectedTargets, toolId, runtimeTarget)
  }
  if (Object.keys(expectedTargets).length !== 8) {
    throw new Error('Internal beta go/no-go packet source rollup must preserve exactly 8 GPU runtime targets.')
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
    assertField(booleans, key, expected)
  }
  for (const key of requiredSourceFalseBooleans) {
    assertField(booleans, key, false)
  }

  const productionWorkerGateReadiness = asRecord(
    record.productionWorkerGateReadiness,
    'sourceRollup.productionWorkerGateReadiness',
  )
  assertField(productionWorkerGateReadiness, 'status', 'owner_approved_production_worker_gate_checks_ready')
  assertField(productionWorkerGateReadiness, 'productionWorkerGateChecksAcceptedWithProvidedEvidence', 21)
  assertField(
    productionWorkerGateReadiness,
    'capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence',
    12,
  )
  assertField(productionWorkerGateReadiness, 'hardFailedGateChecksWithProvidedEvidence', 0)
  assertField(productionWorkerGateReadiness, 'productionWorkerGateChecksReadyNow', 0)
  if (
    !Array.isArray(productionWorkerGateReadiness.productionWorkerGateChecks) ||
    productionWorkerGateReadiness.productionWorkerGateChecks.length !== 21
  ) {
    throw new Error('Internal beta go/no-go packet source rollup must preserve exactly 21 production worker gate checks.')
  }

  const expectedGpuTools = new Set(Object.keys(expectedGpuRuntimeTargets))
  const gpuGateChecks = productionWorkerGateReadiness.productionWorkerGateChecks.filter((gateCheck): boolean => {
    const gateRecord = asRecord(gateCheck, 'sourceRollup.productionWorkerGateChecks[]')
    return expectedGpuTools.has(String(gateRecord.toolId))
  })
  if (gpuGateChecks.length !== 8) {
    throw new Error(`Internal beta go/no-go packet source rollup must preserve exactly 8 GPU/model gate checks; got ${gpuGateChecks.length}.`)
  }

  for (const gateCheck of productionWorkerGateReadiness.productionWorkerGateChecks) {
    const gateRecord = asRecord(gateCheck, 'sourceRollup.productionWorkerGateChecks[]')
    const toolId = String(gateRecord.toolId)
    assertField(gateRecord, 'sourceProductionWorkerJobReadyWithProvidedEvidence', true)
    assertField(gateRecord, 'gateChecksAcceptedWithProvidedEvidence', true)
    assertField(gateRecord, 'canEnqueueProductionWorkerJobNow', false)
    assertField(gateRecord, 'canDispatchProductionWorkerJobNow', false)
    assertField(gateRecord, 'canRunProductionWorkerRouteNow', false)
    assertField(gateRecord, 'canExecuteToolNow', false)
    if (Array.isArray(gateRecord.hardFailedGateNames) && gateRecord.hardFailedGateNames.length !== 0) {
      throw new Error(`Internal beta go/no-go packet source rollup has hard failed gates for ${toolId}.`)
    }

    const expectedGpuTarget = expectedGpuRuntimeTargets[toolId]
    if (expectedGpuTarget) {
      assertField(gateRecord, 'workerType', 'gpu_ai_worker')
      assertField(gateRecord, 'runtimeTarget', expectedGpuTarget)
    } else if (gateRecord.workerType === 'gpu_ai_worker' || String(gateRecord.runtimeTarget).includes('nvidia_l4')) {
      throw new Error(`Unexpected GPU/model gate check for non-GPU tool: ${toolId}.`)
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
    throw new Error('Internal beta go/no-go packet source rollup must preserve owner-approved source job readiness.')
  }
  if (
    !Array.isArray(sourceJobReadiness.productionWorkerJobPayloads) ||
    sourceJobReadiness.productionWorkerJobPayloads.length !== 21
  ) {
    throw new Error('Internal beta go/no-go packet source rollup must preserve exactly 21 source job payloads.')
  }

  const gpuSourcePayloads = sourceJobReadiness.productionWorkerJobPayloads.filter((candidate): boolean => {
    const candidateRecord = asRecord(candidate, 'sourceRollup.productionWorkerJobPayloads[]')
    return expectedGpuTools.has(String(candidateRecord.sourceToolId))
  })
  if (gpuSourcePayloads.length !== 8) {
    throw new Error(`Internal beta go/no-go packet source rollup must preserve exactly 8 GPU/model source payloads; got ${gpuSourcePayloads.length}.`)
  }

  for (const candidate of sourceJobReadiness.productionWorkerJobPayloads) {
    const candidateRecord = asRecord(candidate, 'sourceRollup.productionWorkerJobPayloads[]')
    const toolId = String(candidateRecord.sourceToolId)
    const payload = asRecord(candidateRecord.productionWorkerJobPayload, `productionWorkerJobPayload:${toolId}`)
    const metadata = asRecord(payload.metadata, `productionWorkerJobPayload.metadata:${toolId}`)
    const policy = asRecord(metadata.aiGraphicsRuntimeActivationPolicy, `runtimeActivationPolicy:${toolId}`)
    assertField(candidateRecord, 'productionWorkerJobReadyWithProvidedEvidence', true)
    assertField(candidateRecord, 'canEnqueueProductionWorkerJobNow', false)
    assertField(candidateRecord, 'canRunProductionWorkerRouteNow', false)
    assertField(candidateRecord, 'canExecuteToolNow', false)
    assertField(policy, 'onDemandOnly', true)
    assertField(policy, 'noIdleGpuRuntimeApproved', true)
    assertField(policy, 'startsOnlyForApprovedWorkerOrToolCall', true)
    assertField(policy, 'cpuFallbackAllowedForHeavyTools', false)
    assertField(metadata, 'gpuRuntimeOnDemandOnly', true)
    assertField(metadata, 'noIdleGpuRuntimeApproved', true)
    assertField(metadata, 'startsOnlyForApprovedWorkerOrToolCall', true)
    assertField(metadata, 'cpuFallbackAllowedForHeavyTools', false)

    const expectedGpuTarget = expectedGpuRuntimeTargets[toolId]
    if (expectedGpuTarget) {
      assertField(candidateRecord, 'sourceRuntimeTarget', expectedGpuTarget)
      assertField(payload, 'workerType', 'gpu_ai_worker')
      assertField(metadata, 'aiGraphicsRuntimeTarget', expectedGpuTarget)
    } else if (payload.workerType === 'gpu_ai_worker' || String(candidateRecord.sourceRuntimeTarget).includes('nvidia_l4')) {
      throw new Error(`Unexpected GPU/model source job payload for non-GPU tool: ${toolId}.`)
    }
  }
}

function validateInternalBetaGoNoGoPacket(value: unknown): AiGraphicsInternalBetaGoNoGo {
  const record = asRecord(value, 'packet')
  assertField(record, 'decision', 'ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks')
  assertField(record, 'status', 'internal_beta_go_no_go_approved_runtime_still_blocked')
  assertField(record, 'totalAiGraphicsTools', 21)
  assertField(record, 'totalProductFacingCapabilities', 12)
  assertField(record, 'goNoGoCandidateToolsWithProvidedEvidence', 21)
  assertField(record, 'goNoGoCandidateCapabilitiesWithProvidedEvidence', 12)
  assertField(record, 'internalBetaGoNoGoReadyWithProvidedEvidence', true)
  assertField(record, 'internalBetaGoNoGoApprovalRecordAccepted', true)
  assertField(record, 'internalBetaGoNoGoApprovedToolsWithProvidedEvidence', 21)
  assertField(record, 'internalBetaReadyNowTools', 0)
  assertField(record, 'externalBetaReadyNowTools', 0)
  assertField(record, 'productionReadyNowTools', 0)

  const approvalRecord = asRecord(record.requiredApprovalRecord, 'requiredApprovalRecord')
  assertField(approvalRecord, 'approverRole', 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER')
  assertField(approvalRecord, 'approvesRuntimeNow', false)

  const booleans = asRecord(record.booleans, 'booleans')
  for (const [key, expected] of Object.entries({
    sourceBetaProductionReadinessRollupAccepted: true,
    internalBetaGoNoGoReadyWithProvidedEvidence: true,
    internalBetaGoNoGoApprovalRecordAccepted: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence: true,
  })) {
    assertField(booleans, key, expected)
  }
  for (const key of requiredSourceFalseBooleans) {
    assertField(booleans, key, false)
  }

  validateSourceRollup(asRecord(record.sourceRollup, 'sourceRollup'))
  return value as AiGraphicsInternalBetaGoNoGo
}

function readSourceGoNoGoPacket(): {
  sourceGoNoGo?: AiGraphicsInternalBetaGoNoGo
  sourceEvidenceMode: 'constructed_from_cli_flags' | 'internal_beta_go_no_go_packet'
} {
  const sourcePacket = readJsonObjectFile('--internal-beta-go-no-go-packet')
  if (!sourcePacket) return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  const validatedPacket = validateInternalBetaGoNoGoPacket(sourcePacket)
  return {
    sourceGoNoGo: validatedPacket,
    sourceEvidenceMode: 'internal_beta_go_no_go_packet',
  }
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const sourcePacket = readSourceGoNoGoPacket()
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput | undefined =
  sourcePacket.sourceGoNoGo
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

const ownerApprovalGranted = hasFlag('--internal-beta-go-no-go-owner-approval-granted')
const ownerApprovalRef = valueAfterFlag('--internal-beta-go-no-go-owner-approval-ref')
const ownerApproverRole =
  valueAfterFlag('--internal-beta-go-no-go-owner-approver-role') ??
  'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'

const ownerApproval = buildAiGraphicsInternalBetaGoNoGoOwnerApproval({
  sourceInternalBetaGoNoGoPacket: sourcePacket.sourceGoNoGo,
  evidenceBundleInput,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaGoNoGoOwnerApprovalGranted: ownerApprovalGranted,
  internalBetaGoNoGoOwnerApprovalRef: ownerApprovalRef,
  internalBetaGoNoGoOwnerApproverRole: ownerApproverRole,
})

const output = {
  ...ownerApproval,
  input: {
    validatorOnly: true,
    sourceEvidenceMode: sourcePacket.sourceEvidenceMode,
    internalBetaGoNoGoPacketRead: Boolean(valueAfterFlag('--internal-beta-go-no-go-packet')),
    ownerApprovalRefProvided: Boolean(valueAfterFlag('--owner-approval-ref')),
    internalBetaGoNoGoOwnerApprovalRefProvided: Boolean(ownerApprovalRef),
    evidencePacketFilesRead: [
      valueAfterFlag('--internal-beta-go-no-go-packet'),
      valueAfterFlag('--model-weight-manifest-review-packet'),
      valueAfterFlag('--gpu-runtime-proof-result-packet'),
      valueAfterFlag('--external-beta-native-gpu-proof-collection-packet'),
      valueAfterFlag('--node-runtime-proof-packet'),
      valueAfterFlag('--browser-runtime-proof-packet'),
      valueAfterFlag('--satori-font-runtime-proof-packet'),
    ].filter(Boolean).length,
    committedJsRuntimeProofsRead: hasFlag('--use-committed-js-runtime-proofs'),
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
  hasFlag('--require-internal-beta-go-no-go-owner-approved') &&
  !ownerApproval.booleans.all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-runtime-ready') || hasFlag('--require-external-beta-ready') || hasFlag('--require-production-ready')) {
  process.exitCode = 3
}
