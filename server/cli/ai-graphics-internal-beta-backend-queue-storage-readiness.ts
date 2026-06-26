import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaBackendQueueStorageReadiness,
} from '../tool-registry/ai-graphics-internal-beta-backend-queue-storage-readiness'
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

function queueValue(flag: string, defaultValue: string): string | undefined {
  return valueAfterFlag(flag) ??
    (hasFlag('--all-queue-admission-prerequisites-provided') ? defaultValue : undefined)
}

async function main() {
  const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
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

  const queueStorageReadiness =
    await buildAiGraphicsInternalBetaBackendQueueStorageReadiness({
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
    })

  const output = {
    ...queueStorageReadiness,
    input: {
      validatorOnly: true,
      committedJsRuntimeProofsRead: hasFlag('--use-committed-js-runtime-proofs'),
      allQueueAdmissionPrerequisitesProvided:
        hasFlag('--all-queue-admission-prerequisites-provided'),
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      supabaseMutationPerformed: false,
      liveWorkerClaimCreated: false,
      liveWorkerLeaseCreated: false,
      productionWorkerDispatchPerformed: false,
      productionWorkerRouteExecutionPerformed: false,
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

  console.log(JSON.stringify(output, null, 2))

  if (
    hasFlag('--require-mock-service-queue-records-ready') &&
    !queueStorageReadiness.booleans.all21BackendQueueStorageRecordsCreatedWithProvidedEvidence
  ) {
    process.exitCode = 2
  }

  if (
    hasFlag('--require-live-supabase-job-writes') ||
    hasFlag('--require-live-worker-claims') ||
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
