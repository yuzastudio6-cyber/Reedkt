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

function isProductionWorkerJobReadinessPacket(
  packet: unknown,
): packet is AiGraphicsInternalBetaProductionWorkerJobReadiness {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return false
  const record = packet as Record<string, unknown>
  const booleans = record.booleans
  return (
    record.decision === 'ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime' &&
    record.status === 'owner_approved_production_worker_jobs_ready' &&
    record.totalAiGraphicsTools === 21 &&
    record.totalProductFacingCapabilities === 12 &&
    record.productionWorkerJobPayloadsReadyWithProvidedEvidence === 21 &&
    record.capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence === 12 &&
    record.productionWorkerJobPayloadsReadyNow === 0 &&
    Array.isArray(record.productionWorkerJobPayloads) &&
    record.productionWorkerJobPayloads.length === 21 &&
    Boolean(
      booleans &&
      typeof booleans === 'object' &&
      !Array.isArray(booleans) &&
      (booleans as Record<string, unknown>).ownerApprovedProductionWorkerJobEvidenceAccepted === true &&
      (booleans as Record<string, unknown>).all21ProductionWorkerJobPayloadsReadyWithProvidedEvidence === true &&
      (booleans as Record<string, unknown>).agentCanExecuteToolsNow === false &&
      (booleans as Record<string, unknown>).productionWorkerJobEnqueueApprovedNow === false &&
      (booleans as Record<string, unknown>).runtimeReadyNow === false,
    )
  )
}

function readSourceProductionWorkerJobReadinessPacket(): {
  sourceProductionWorkerJobReadinessPacket?: AiGraphicsInternalBetaProductionWorkerJobReadiness
  sourceEvidenceMode: 'constructed_from_cli_flags' | 'internal_beta_production_worker_job_readiness_packet'
} {
  const packet = readJsonFile('--internal-beta-production-worker-job-readiness-packet')
  if (!packet) return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  if (!isProductionWorkerJobReadinessPacket(packet)) {
    throw new Error(
      '--internal-beta-production-worker-job-readiness-packet must report owner_approved_production_worker_jobs_ready with all 21 production-worker job payloads ready by evidence and runtime gates still false.',
    )
  }

  return {
    sourceProductionWorkerJobReadinessPacket: packet,
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
