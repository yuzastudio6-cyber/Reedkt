import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsBetaProductionReadinessRollup,
} from '../tool-registry/ai-graphics-beta-production-readiness-rollup'
import type {
  AiGraphicsBetaEvidenceBundleInput,
} from '../tool-registry/ai-graphics-beta-evidence-bundle'
import type {
  AiGraphicsInternalBetaProductionWorkerGateReadiness,
} from '../tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness'
import type {
  AiGraphicsExternalBetaNativeGpuProofCollection,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-collection'
import type {
  AiGraphicsExternalBetaActivatedLaunchReadiness,
} from '../tool-registry/ai-graphics-external-beta-activated-launch-readiness'

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
    throw new Error(`Production worker gate readiness packet must include object field: ${field}.`)
  }
  return value as Record<string, unknown>
}

function assertField(record: Record<string, unknown>, key: string, expected: unknown): void {
  if (record[key] !== expected) {
    throw new Error(
      `Production worker gate readiness packet field ${key} must equal ${String(expected)}; received ${String(
        record[key],
      )}.`,
    )
  }
}

function validateProductionWorkerGateReadinessPacket(
  packet: unknown,
): AiGraphicsInternalBetaProductionWorkerGateReadiness {
  const record = asRecord(packet, 'packet')
  assertField(
    record,
    'decision',
    'ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime',
  )
  assertField(record, 'status', 'owner_approved_production_worker_gate_checks_ready')
  assertField(record, 'totalAiGraphicsTools', 21)
  assertField(record, 'totalProductFacingCapabilities', 12)
  assertField(record, 'productionWorkerGateChecksAcceptedWithProvidedEvidence', 21)
  assertField(record, 'capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence', 12)
  assertField(record, 'hardFailedGateChecksWithProvidedEvidence', 0)
  assertField(record, 'productionWorkerGateChecksReadyNow', 0)
  assertField(record, 'capabilityProductionWorkerGateScenariosReadyNow', 0)

  const booleans = asRecord(record.booleans, 'booleans')
  for (const [key, expected] of Object.entries({
    ownerApprovedProductionWorkerGateEvidenceAccepted: true,
    all21ProductionWorkerGateChecksAcceptedWithProvidedEvidence: true,
    all12CapabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence: true,
    productionWorkerGateHardFailuresWithProvidedEvidenceAbsent: true,
  })) {
    assertField(booleans, key, expected)
  }
  for (const key of requiredSourceFalseBooleans) {
    assertField(booleans, key, false)
  }

  if (!Array.isArray(record.productionWorkerGateChecks) || record.productionWorkerGateChecks.length !== 21) {
    throw new Error('Production worker gate readiness packet must include exactly 21 gate-check records.')
  }
  if (
    !Array.isArray(record.capabilityProductionWorkerGateScenarios) ||
    record.capabilityProductionWorkerGateScenarios.length !== 12
  ) {
    throw new Error('Production worker gate readiness packet must include exactly 12 capability gate scenarios.')
  }

  const sourceJobReadiness = asRecord(record.sourceProductionWorkerJobReadiness, 'sourceProductionWorkerJobReadiness')
  if (
    sourceJobReadiness.status !== 'owner_approved_production_worker_jobs_ready' ||
    sourceJobReadiness.productionWorkerJobPayloadsReadyWithProvidedEvidence !== 21 ||
    sourceJobReadiness.capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence !== 12
  ) {
    throw new Error('Production worker gate readiness packet must preserve owner-approved source job readiness.')
  }
  if (
    !Array.isArray(sourceJobReadiness.productionWorkerJobPayloads) ||
    sourceJobReadiness.productionWorkerJobPayloads.length !== 21
  ) {
    throw new Error('Production worker gate readiness packet must preserve exactly 21 source job payloads.')
  }

  const expectedGpuTools = new Set(Object.keys(expectedGpuRuntimeTargets))
  const gpuGateChecks = record.productionWorkerGateChecks.filter((gateCheck): boolean => {
    const gateRecord = asRecord(gateCheck, 'productionWorkerGateChecks[]')
    return expectedGpuTools.has(String(gateRecord.toolId))
  })
  if (gpuGateChecks.length !== 8) {
    throw new Error(`Production worker gate readiness packet must include exactly 8 GPU/model gate checks; got ${gpuGateChecks.length}.`)
  }

  for (const gateCheck of record.productionWorkerGateChecks) {
    const gateRecord = asRecord(gateCheck, 'productionWorkerGateChecks[]')
    const toolId = String(gateRecord.toolId)
    assertField(gateRecord, 'sourceProductionWorkerJobReadyWithProvidedEvidence', true)
    assertField(gateRecord, 'gateChecksAcceptedWithProvidedEvidence', true)
    assertField(gateRecord, 'canEnqueueProductionWorkerJobNow', false)
    assertField(gateRecord, 'canDispatchProductionWorkerJobNow', false)
    assertField(gateRecord, 'canRunProductionWorkerRouteNow', false)
    assertField(gateRecord, 'canExecuteToolNow', false)
    if (Array.isArray(gateRecord.hardFailedGateNames) && gateRecord.hardFailedGateNames.length !== 0) {
      throw new Error(`Production worker gate readiness packet has hard failed gates for ${toolId}.`)
    }

    const expectedGpuTarget = expectedGpuRuntimeTargets[toolId]
    if (expectedGpuTarget) {
      assertField(gateRecord, 'workerType', 'gpu_ai_worker')
      assertField(gateRecord, 'runtimeTarget', expectedGpuTarget)
    } else if (gateRecord.workerType === 'gpu_ai_worker' || String(gateRecord.runtimeTarget).includes('nvidia_l4')) {
      throw new Error(`Unexpected GPU/model gate check for non-GPU tool: ${toolId}.`)
    }
  }

  const gpuSourcePayloads = sourceJobReadiness.productionWorkerJobPayloads.filter((candidate): boolean => {
    const candidateRecord = asRecord(candidate, 'sourceProductionWorkerJobReadiness.productionWorkerJobPayloads[]')
    return expectedGpuTools.has(String(candidateRecord.sourceToolId))
  })
  if (gpuSourcePayloads.length !== 8) {
    throw new Error(`Production worker gate readiness packet must preserve exactly 8 GPU/model source payloads; got ${gpuSourcePayloads.length}.`)
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

  return packet as AiGraphicsInternalBetaProductionWorkerGateReadiness
}

function readSourceProductionWorkerGateReadinessPacket(): {
  sourceProductionWorkerGateReadinessPacket?: AiGraphicsInternalBetaProductionWorkerGateReadiness
  sourceEvidenceMode: 'constructed_from_cli_flags' | 'internal_beta_production_worker_gate_readiness_packet'
} {
  const packet = readJsonFile('--internal-beta-production-worker-gate-readiness-packet')
  if (!packet) return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  const validatedPacket = validateProductionWorkerGateReadinessPacket(packet)

  return {
    sourceProductionWorkerGateReadinessPacket: validatedPacket,
    sourceEvidenceMode: 'internal_beta_production_worker_gate_readiness_packet',
  }
}

function readSourceExternalBetaNativeGpuProofCollectionPacket():
  AiGraphicsExternalBetaNativeGpuProofCollection | undefined {
  return readJsonFile('--external-beta-native-gpu-proof-collection-packet') as
    AiGraphicsExternalBetaNativeGpuProofCollection | undefined
}

function readSourceExternalBetaActivatedLaunchReadinessPacket():
  AiGraphicsExternalBetaActivatedLaunchReadiness | undefined {
  return readJsonFile('--external-beta-activated-launch-readiness-packet') as
    AiGraphicsExternalBetaActivatedLaunchReadiness | undefined
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput = {
  approvedPlanSnapshotGatePassed: allTechnicalGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed: allTechnicalGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed: allTechnicalGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed: allTechnicalGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed: allTechnicalGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  modelWeightManifestReviewPacket: readJsonFile('--model-weight-manifest-review-packet') as AiGraphicsBetaEvidenceBundleInput['modelWeightManifestReviewPacket'],
  gpuRuntimeProofResultPacket: readJsonFile('--gpu-runtime-proof-result-packet') as AiGraphicsBetaEvidenceBundleInput['gpuRuntimeProofResultPacket'],
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

const sourcePacket = readSourceProductionWorkerGateReadinessPacket()
const sourceExternalBetaNativeGpuProofCollectionPacket =
  readSourceExternalBetaNativeGpuProofCollectionPacket()
const sourceExternalBetaActivatedLaunchReadinessPacket =
  readSourceExternalBetaActivatedLaunchReadinessPacket()
const readiness = buildAiGraphicsBetaProductionReadinessRollup({
  evidenceBundleInput,
  sourceProductionWorkerGateReadinessPacket:
    sourcePacket.sourceProductionWorkerGateReadinessPacket,
  sourceExternalBetaNativeGpuProofCollectionPacket,
  sourceExternalBetaActivatedLaunchReadinessPacket,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
})

const output = {
  ...readiness,
  input: {
    validatorOnly: true,
    sourceEvidenceMode: sourcePacket.sourceEvidenceMode,
    sourceProductionWorkerGateReadinessPacketRead:
      Boolean(sourcePacket.sourceProductionWorkerGateReadinessPacket),
    sourceExternalBetaNativeGpuProofCollectionPacketRead:
      Boolean(sourceExternalBetaNativeGpuProofCollectionPacket),
    sourceExternalBetaActivatedLaunchReadinessPacketRead:
      Boolean(sourceExternalBetaActivatedLaunchReadinessPacket),
    ownerApprovalRefProvided: Boolean(valueAfterFlag('--owner-approval-ref')),
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
  hasFlag('--require-internal-beta-go-no-go-ready') &&
  !readiness.booleans.internalBetaGoNoGoReadyWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-external-beta-ready') && !readiness.booleans.externalBetaReadyNow) {
  process.exitCode = 3
}

if (hasFlag('--require-production-ready')) {
  process.exitCode = 3
}
