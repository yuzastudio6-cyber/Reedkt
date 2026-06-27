import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaProductionWorkerGateReadiness,
} from '../tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness'
import type {
  AiGraphicsInternalBetaProductionWorkerJobReadiness,
} from '../tool-registry/ai-graphics-internal-beta-production-worker-job-readiness'
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
    throw new Error(`Production worker job readiness packet must include object field: ${field}.`)
  }
  return value as Record<string, unknown>
}

function assertField(record: Record<string, unknown>, key: string, expected: unknown): void {
  if (record[key] !== expected) {
    throw new Error(
      `Production worker job readiness packet field ${key} must equal ${String(expected)}; received ${String(
        record[key],
      )}.`,
    )
  }
}

function validateProductionWorkerJobReadinessPacket(
  packet: unknown,
): AiGraphicsInternalBetaProductionWorkerJobReadiness {
  const record = asRecord(packet, 'packet')
  assertField(
    record,
    'decision',
    'ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime',
  )
  assertField(record, 'status', 'owner_approved_production_worker_jobs_ready')
  assertField(record, 'totalAiGraphicsTools', 21)
  assertField(record, 'totalProductFacingCapabilities', 12)
  assertField(record, 'productionWorkerJobPayloadsReadyWithProvidedEvidence', 21)
  assertField(record, 'capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence', 12)
  assertField(record, 'productionWorkerJobPayloadsReadyNow', 0)
  assertField(record, 'capabilityProductionWorkerJobScenariosReadyNow', 0)

  const booleans = asRecord(record.booleans, 'booleans')
  for (const [key, expected] of Object.entries({
    ownerApprovedProductionWorkerJobEvidenceAccepted: true,
    all21ProductionWorkerJobPayloadsReadyWithProvidedEvidence: true,
    all12CapabilityProductionWorkerJobScenariosReadyWithProvidedEvidence: true,
  })) {
    assertField(booleans, key, expected)
  }
  for (const key of requiredSourceFalseBooleans) {
    assertField(booleans, key, false)
  }

  if (!Array.isArray(record.productionWorkerJobPayloads) || record.productionWorkerJobPayloads.length !== 21) {
    throw new Error('Production worker job readiness packet must include exactly 21 production worker job payloads.')
  }
  if (
    !Array.isArray(record.capabilityProductionWorkerJobScenarios) ||
    record.capabilityProductionWorkerJobScenarios.length !== 12
  ) {
    throw new Error('Production worker job readiness packet must include exactly 12 capability job scenarios.')
  }

  const expectedGpuTools = new Set(Object.keys(expectedGpuRuntimeTargets))
  const gpuPayloads = record.productionWorkerJobPayloads.filter((candidate): boolean => {
    const candidateRecord = asRecord(candidate, 'productionWorkerJobPayloads[]')
    return expectedGpuTools.has(String(candidateRecord.sourceToolId))
  })
  if (gpuPayloads.length !== 8) {
    throw new Error(`Production worker job readiness packet must include exactly 8 GPU/model payloads; got ${gpuPayloads.length}.`)
  }

  for (const candidate of record.productionWorkerJobPayloads) {
    const candidateRecord = asRecord(candidate, 'productionWorkerJobPayloads[]')
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
      throw new Error(`Unexpected GPU/model production worker job payload for non-GPU tool: ${toolId}.`)
    }
  }

  return packet as AiGraphicsInternalBetaProductionWorkerJobReadiness
}

function readSourceProductionWorkerJobReadinessPacket(): {
  sourceProductionWorkerJobReadinessPacket?: AiGraphicsInternalBetaProductionWorkerJobReadiness
  sourceEvidenceMode: 'constructed_from_cli_flags' | 'internal_beta_production_worker_job_readiness_packet'
} {
  const packet = readJsonFile('--internal-beta-production-worker-job-readiness-packet')
  if (!packet) return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  const validatedPacket = validateProductionWorkerJobReadinessPacket(packet)

  return {
    sourceProductionWorkerJobReadinessPacket: validatedPacket,
    sourceEvidenceMode: 'internal_beta_production_worker_job_readiness_packet',
  }
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

const sourcePacket = readSourceProductionWorkerJobReadinessPacket()
const readiness = buildAiGraphicsInternalBetaProductionWorkerGateReadiness({
  evidenceBundleInput,
  sourceProductionWorkerJobReadinessPacket:
    sourcePacket.sourceProductionWorkerJobReadinessPacket,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  workspaceId: valueAfterFlag('--workspace-id'),
  projectId: valueAfterFlag('--project-id'),
  approvedPlanSnapshotId: valueAfterFlag('--approved-plan-snapshot-id'),
  editPlanId: valueAfterFlag('--edit-plan-id'),
  creditReservationId: valueAfterFlag('--credit-reservation-id'),
  privateArtifactManifestRef: valueAfterFlag('--private-artifact-manifest-ref'),
})

const output = {
  ...readiness,
  input: {
    validatorOnly: true,
    sourceEvidenceMode: sourcePacket.sourceEvidenceMode,
    sourceProductionWorkerJobReadinessPacketRead:
      Boolean(sourcePacket.sourceProductionWorkerJobReadinessPacket),
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
  hasFlag('--require-owner-approved-production-worker-gates-ready') &&
  !readiness.ownerApprovedProductionWorkerGateEvidenceAccepted
) {
  process.exitCode = 2
}
