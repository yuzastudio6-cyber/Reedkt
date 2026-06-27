import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaGoNoGo,
} from '../tool-registry/ai-graphics-internal-beta-go-no-go'
import type {
  AiGraphicsBetaEvidenceBundle,
  AiGraphicsBetaEvidenceBundleInput,
} from '../tool-registry/ai-graphics-beta-evidence-bundle'
import type {
  AiGraphicsBetaProductionReadinessRollup,
} from '../tool-registry/ai-graphics-beta-production-readiness-rollup'

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

const requiredRollupFalseBooleans = [
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

function isBetaEvidenceBundle(value: unknown): value is AiGraphicsBetaEvidenceBundle {
  return Boolean(
    typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).decision ===
        'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults' &&
      Array.isArray((value as Record<string, unknown>).tools) &&
      Array.isArray((value as Record<string, unknown>).gpuRuntimeTargetedTools),
  )
}

function readPrebuiltEvidenceBundle(): {
  evidenceBundle?: AiGraphicsBetaEvidenceBundle
  evidenceSourceMode:
    | 'constructed_from_cli_flags'
    | 'beta_evidence_bundle_packet'
    | 'beta_evidence_local_assembly_packet'
} {
  const betaEvidenceBundlePacket = readJsonObjectFile('--beta-evidence-bundle-packet')
  const localAssemblyPacket = readJsonObjectFile('--beta-evidence-local-assembly-packet')

  if (betaEvidenceBundlePacket && localAssemblyPacket) {
    throw new Error(
      'Use either --beta-evidence-bundle-packet or --beta-evidence-local-assembly-packet, not both',
    )
  }

  if (betaEvidenceBundlePacket) {
    if (!isBetaEvidenceBundle(betaEvidenceBundlePacket)) {
      throw new Error('--beta-evidence-bundle-packet does not contain an AI graphics beta evidence bundle')
    }
    return {
      evidenceBundle: betaEvidenceBundlePacket,
      evidenceSourceMode: 'beta_evidence_bundle_packet',
    }
  }

  if (localAssemblyPacket) {
    const evidenceBundle = localAssemblyPacket.betaEvidenceBundle
    if (!isBetaEvidenceBundle(evidenceBundle)) {
      throw new Error(
        '--beta-evidence-local-assembly-packet does not contain betaEvidenceBundle',
      )
    }
    return {
      evidenceBundle,
      evidenceSourceMode: 'beta_evidence_local_assembly_packet',
    }
  }

  return { evidenceSourceMode: 'constructed_from_cli_flags' }
}

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Beta/production readiness rollup packet must include object field: ${field}.`)
  }
  return value as Record<string, unknown>
}

function assertField(record: Record<string, unknown>, key: string, expected: unknown): void {
  if (record[key] !== expected) {
    throw new Error(
      `Beta/production readiness rollup packet field ${key} must equal ${String(expected)}; received ${String(
        record[key],
      )}.`,
    )
  }
}

function validateBetaProductionReadinessRollup(
  packet: unknown,
): AiGraphicsBetaProductionReadinessRollup {
  const record = asRecord(packet, 'packet')
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

  const expectedTargets = asRecord(record.expectedGpuRuntimeTargets, 'expectedGpuRuntimeTargets')
  for (const [toolId, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
    assertField(expectedTargets, toolId, runtimeTarget)
  }
  if (Object.keys(expectedTargets).length !== 8) {
    throw new Error('Beta/production readiness rollup packet must preserve exactly 8 GPU runtime targets.')
  }

  const booleans = asRecord(record.booleans, 'booleans')
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
  for (const key of requiredRollupFalseBooleans) {
    assertField(booleans, key, false)
  }

  const productionWorkerGateReadiness = asRecord(
    record.productionWorkerGateReadiness,
    'productionWorkerGateReadiness',
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
    throw new Error('Beta/production readiness rollup packet must preserve exactly 21 production worker gate checks.')
  }

  const expectedGpuTools = new Set(Object.keys(expectedGpuRuntimeTargets))
  const gpuGateChecks = productionWorkerGateReadiness.productionWorkerGateChecks.filter((gateCheck): boolean => {
    const gateRecord = asRecord(gateCheck, 'productionWorkerGateReadiness.productionWorkerGateChecks[]')
    return expectedGpuTools.has(String(gateRecord.toolId))
  })
  if (gpuGateChecks.length !== 8) {
    throw new Error(`Beta/production readiness rollup packet must preserve exactly 8 GPU/model gate checks; got ${gpuGateChecks.length}.`)
  }

  for (const gateCheck of productionWorkerGateReadiness.productionWorkerGateChecks) {
    const gateRecord = asRecord(gateCheck, 'productionWorkerGateReadiness.productionWorkerGateChecks[]')
    const toolId = String(gateRecord.toolId)
    assertField(gateRecord, 'sourceProductionWorkerJobReadyWithProvidedEvidence', true)
    assertField(gateRecord, 'gateChecksAcceptedWithProvidedEvidence', true)
    assertField(gateRecord, 'canEnqueueProductionWorkerJobNow', false)
    assertField(gateRecord, 'canDispatchProductionWorkerJobNow', false)
    assertField(gateRecord, 'canRunProductionWorkerRouteNow', false)
    assertField(gateRecord, 'canExecuteToolNow', false)
    if (Array.isArray(gateRecord.hardFailedGateNames) && gateRecord.hardFailedGateNames.length !== 0) {
      throw new Error(`Beta/production readiness rollup packet has hard failed gates for ${toolId}.`)
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
    'sourceProductionWorkerJobReadiness',
  )
  if (
    sourceJobReadiness.status !== 'owner_approved_production_worker_jobs_ready' ||
    sourceJobReadiness.productionWorkerJobPayloadsReadyWithProvidedEvidence !== 21 ||
    sourceJobReadiness.capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence !== 12
  ) {
    throw new Error('Beta/production readiness rollup packet must preserve owner-approved source job readiness.')
  }
  if (
    !Array.isArray(sourceJobReadiness.productionWorkerJobPayloads) ||
    sourceJobReadiness.productionWorkerJobPayloads.length !== 21
  ) {
    throw new Error('Beta/production readiness rollup packet must preserve exactly 21 source job payloads.')
  }

  const gpuSourcePayloads = sourceJobReadiness.productionWorkerJobPayloads.filter((candidate): boolean => {
    const candidateRecord = asRecord(candidate, 'sourceProductionWorkerJobReadiness.productionWorkerJobPayloads[]')
    return expectedGpuTools.has(String(candidateRecord.sourceToolId))
  })
  if (gpuSourcePayloads.length !== 8) {
    throw new Error(`Beta/production readiness rollup packet must preserve exactly 8 GPU/model source payloads; got ${gpuSourcePayloads.length}.`)
  }

  for (const candidate of sourceJobReadiness.productionWorkerJobPayloads) {
    const candidateRecord = asRecord(candidate, 'sourceProductionWorkerJobReadiness.productionWorkerJobPayloads[]')
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

  return packet as AiGraphicsBetaProductionReadinessRollup
}

function readSourceBetaProductionReadinessRollupPacket(): {
  sourceBetaProductionReadinessRollupPacket?: AiGraphicsBetaProductionReadinessRollup
  rollupSourceMode: 'constructed_from_cli_flags' | 'beta_production_readiness_rollup_packet'
} {
  const packet = readJsonFile('--beta-production-readiness-rollup-packet')
  if (!packet) return { rollupSourceMode: 'constructed_from_cli_flags' }
  const validatedPacket = validateBetaProductionReadinessRollup(packet)

  return {
    sourceBetaProductionReadinessRollupPacket: validatedPacket,
    rollupSourceMode: 'beta_production_readiness_rollup_packet',
  }
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const prebuiltEvidence = readPrebuiltEvidenceBundle()
const sourceRollupPacket = readSourceBetaProductionReadinessRollupPacket()
if (sourceRollupPacket.sourceBetaProductionReadinessRollupPacket && prebuiltEvidence.evidenceBundle) {
  throw new Error(
    'Use either --beta-production-readiness-rollup-packet or a beta evidence packet, not both',
  )
}
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput | undefined =
  prebuiltEvidence.evidenceBundle || sourceRollupPacket.sourceBetaProductionReadinessRollupPacket
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
        workerGatePassed:
          allTechnicalGatesPassed || hasFlag('--worker-gate-passed'),
        browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
        modelWeightManifestReviewPacket: readJsonFile('--model-weight-manifest-review-packet') as
          AiGraphicsBetaEvidenceBundleInput['modelWeightManifestReviewPacket'],
        gpuRuntimeProofResultPacket: readJsonFile('--gpu-runtime-proof-result-packet') as
          AiGraphicsBetaEvidenceBundleInput['gpuRuntimeProofResultPacket'],
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

const goNoGo = buildAiGraphicsInternalBetaGoNoGo({
  sourceBetaProductionReadinessRollupPacket:
    sourceRollupPacket.sourceBetaProductionReadinessRollupPacket,
  evidenceBundle: prebuiltEvidence.evidenceBundle,
  evidenceBundleInput,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaGoNoGoApproved: hasFlag('--internal-beta-go-no-go-approved'),
  internalBetaGoNoGoRef: valueAfterFlag('--internal-beta-go-no-go-ref'),
  internalBetaGoNoGoApproverRole:
    valueAfterFlag('--internal-beta-go-no-go-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
})

const output = {
  ...goNoGo,
  input: {
    validatorOnly: true,
    evidenceSourceMode: prebuiltEvidence.evidenceSourceMode,
    rollupSourceMode: sourceRollupPacket.rollupSourceMode,
    betaProductionReadinessRollupPacketRead:
      Boolean(sourceRollupPacket.sourceBetaProductionReadinessRollupPacket),
    betaEvidenceBundlePacketRead: Boolean(valueAfterFlag('--beta-evidence-bundle-packet')),
    betaEvidenceLocalAssemblyPacketRead: Boolean(valueAfterFlag('--beta-evidence-local-assembly-packet')),
    ownerApprovalRefProvided: Boolean(valueAfterFlag('--owner-approval-ref')),
    internalBetaGoNoGoRefProvided: Boolean(valueAfterFlag('--internal-beta-go-no-go-ref')),
    evidencePacketFilesRead: [
      valueAfterFlag('--beta-evidence-bundle-packet'),
      valueAfterFlag('--beta-evidence-local-assembly-packet'),
      valueAfterFlag('--beta-production-readiness-rollup-packet'),
      valueAfterFlag('--model-weight-manifest-review-packet'),
      valueAfterFlag('--gpu-runtime-proof-result-packet'),
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
  hasFlag('--require-internal-beta-go-no-go-approved') &&
  !goNoGo.booleans.all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-runtime-ready') || hasFlag('--require-external-beta-ready') || hasFlag('--require-production-ready')) {
  process.exitCode = 3
}
