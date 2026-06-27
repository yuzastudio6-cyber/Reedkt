import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaQueueDispatcherReadiness,
} from '../tool-registry/ai-graphics-internal-beta-queue-dispatcher-readiness'
import type {
  AiGraphicsInternalBetaQueueAdmissionReadiness,
} from '../tool-registry/ai-graphics-internal-beta-queue-admission-readiness'
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

async function main() {
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

  const queueDispatcherReadiness =
    await buildAiGraphicsInternalBetaQueueDispatcherReadiness({
      sourceQueueAdmissionReadinessPacket,
      evidenceBundleInput,
      ownerApprovalGranted: hasFlag('--owner-approval-granted'),
      ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
      ownerApproverRole:
        valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
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
    ...queueDispatcherReadiness,
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
      liveWorkerLeaseCreated: false,
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
    hasFlag('--require-dispatcher-probe-ready') &&
    !queueDispatcherReadiness.booleans.all21DispatcherProbeJobsCompletedWithProvidedEvidence
  ) {
    process.exitCode = 2
  }

  if (
    hasFlag('--require-live-backend-queue-submit') ||
    hasFlag('--require-live-worker-dispatch') ||
    hasFlag('--require-runtime-ready') ||
    hasFlag('--require-production-ready')
  ) {
    process.exitCode = 3
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
