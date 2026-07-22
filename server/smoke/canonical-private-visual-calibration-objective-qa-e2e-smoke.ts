import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { promisify } from 'node:util'

import type { SupabaseClient } from '@supabase/supabase-js'

import { loadRuntimeEnv } from '../config/env'
import { createCanonicalPrivateResourcePlacementManifest } from
  '../edit-architecture/canonical-private-resource-placement-authority'
import {
  assertCanonicalVisualCalibrationProviderQaPair,
  type CanonicalVisualCalibrationObjectiveQaWorkItem,
  type CanonicalVisualCalibrationProviderPlanningWorkItem,
} from '../edit-architecture/canonical-visual-calibration-objective-qa-authority'
import { ApiError } from '../errors/api-error'
import { createCanonicalEditExecutionPackageService } from
  '../services/canonical-edit-execution-package-service'
import { createCanonicalPrivateJobExecutionAdapterService } from
  '../services/canonical-private-job-execution-adapter-service'
import { createCanonicalPrivatePackageWorkQueueService } from
  '../services/canonical-private-package-work-queue-service'
import {
  readCanonicalVisualCalibrationObjectiveQaConsumerReceipt,
} from '../services/canonical-private-visual-calibration-objective-qa-consumer-receipt-service'
import {
  createCanonicalPrivateVisualCalibrationProviderOutputArtifactService,
} from '../services/canonical-private-visual-calibration-provider-output-artifact-service'
import {
  executePrivateInjectedVisualCalibrationLifecycle,
  type PrivateInjectedVisualCalibrationLifecycleResult,
} from '../services/canonical-private-visual-calibration-provider-lifecycle-service'
import { createEditPlanningAuthorityService } from
  '../services/edit-planning-authority-service'
import {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import {
  readPrivateAuthorityJsonBlob,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createControlledVisualCalibrationReferenceFrameReaderPort,
  type CanonicalVisualCalibrationReferenceFrameRead,
  type CanonicalVisualCalibrationReferenceFrameReadRequest,
} from '../services/canonical-visual-calibration-reference-frame-reader-port'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'
import {
  createPrivateWorkerResourceUsageCostEvidence,
  hashPrivateWorkerResourceArtifactManifest,
  hashPrivateWorkerResourceObserverSnapshot,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import type { ServiceContext } from '../types'
import type { CanonicalPrivateWorkGraphJobOutcome } from
  '../validation/canonical-private-work-graph-run-schemas'
import {
  CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
  canonicalMotionStudioStorytellingProductionAuthoritySchema,
} from '../validation/canonical-motion-studio-storytelling-production-authority-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'
import {
  VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE,
  visualCalibrationReferenceFrameBytes,
} from './fixtures/visual-calibration-reference-frame-fixture'

const execFileAsync = promisify(execFile)
let baseTimeMs = Date.now()
const at = (offsetMs: number) => new Date(baseTimeMs + offsetMs).toISOString()
const workspaceId = 'workspace-storytelling-style-authority'
const editSessionId = 'edit-session-idea-first-storytelling-authority'
const ownerUserId = 'user-authority-smoke'
const candidateRoot = await mkdtemp(join(tmpdir(), 'reeditpro-visual-qa-e2e-'))

try {
  await import('./edit-planning-authority-smoke')

  const context = createContext()
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot: canonicalAuthoritySmokeRoot,
    ownerUserId,
    workspaceId,
  })
  const snapshot = aggregate?.snapshots.find((candidate) =>
    candidate.editSessionId === editSessionId &&
    candidate.componentRefs.motionStudioStorytellingProductionAuthority)
  assert.ok(snapshot, 'Idea-first Storytelling snapshot must exist.')
  const productionRef =
    snapshot.componentRefs.motionStudioStorytellingProductionAuthority
  assert.ok(productionRef)
  const productionAuthority =
    canonicalMotionStudioStorytellingProductionAuthoritySchema.parse(
      await readPrivateAuthorityJsonBlob({
        localStorageRoot: canonicalAuthoritySmokeRoot,
        ref: productionRef,
      }),
    )
  context.canonicalMotionStudioStorytellingProductionAuthorityReaderPort = {
    schemaVersion:
      CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
    sourceAuthority: 'motion_studio_storytelling_artifact_repository',
    evidenceClass: 'controlled_local_source_verified_non_promotable',
    productionReady: false,
    async readAndVerifyAuthority(input) {
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.projectId, snapshot.projectId)
      assert.equal(input.editSessionId, editSessionId)
      assert.equal(input.productionId, productionAuthority.productionId)
      assert.equal(
        input.expectedComponentProposalDigest,
        productionAuthority.sourceProposal.componentProposalDigest,
      )
      assert.equal(input.expectedAuthorityHash, productionAuthority.authorityHash)
      return structuredClone(productionAuthority)
    },
  }

  const planning = createEditPlanningAuthorityService(context)
  const approvedAuthority = await planning.loadApprovedExecutionAuthority(
    snapshot.snapshotId,
    workspaceId,
  )
  const approvedProviderWorkItem = approvedAuthority.workItems.find((candidate) =>
    candidate.workItemKey === 'idea-first-visual-calibration-provider')
  const approvedQaWorkItem = approvedAuthority.workItems.find((candidate) =>
    candidate.workItemKey === 'idea-first-visual-calibration-objective-qa')
  assert.ok(approvedProviderWorkItem)
  assert.ok(approvedQaWorkItem)
  assert.equal(approvedQaWorkItem.maximumCreditBudget, 0)
  const remainingReservedCredits = approvedAuthority.reservation.reservedCredits -
    approvedAuthority.reservation.spentCredits -
    approvedAuthority.reservation.releasedCredits -
    approvedAuthority.reservation.refundedCredits
  assert.ok(
    approvedQaWorkItem.maximumCreditBudget <= remainingReservedCredits,
    `QA budget ${approvedQaWorkItem.maximumCreditBudget} exceeds reservation ${remainingReservedCredits}.`,
  )
  assert.ok(
    Date.parse(approvedAuthority.reservation.expiresAt) > Date.now(),
    `Reservation expired at ${approvedAuthority.reservation.expiresAt}.`,
  )
  const planningPair = assertCanonicalVisualCalibrationProviderQaPair({
    providerWorkItem: approvedProviderWorkItem as
      CanonicalVisualCalibrationProviderPlanningWorkItem,
    qaWorkItem: approvedQaWorkItem as
      CanonicalVisualCalibrationObjectiveQaWorkItem,
  })

  const packageService = createCanonicalEditExecutionPackageService(context)
  const createdPackage = await packageService.createPackage({
    workspaceId,
    approvedPlanSnapshotId: snapshot.snapshotId,
    expectedSnapshotHash: snapshot.snapshotHash,
    purpose: 'private_internal_execution_handoff',
    idempotencyKey: 'visual-calibration-e2e-package-v1',
  })
  const packageRead = await packageService.getPackage(
    createdPackage.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
  )
  const executionPackage = packageRead.approvedEditExecutionPackage
  const providerWorkItem = executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === approvedProviderWorkItem.id)
  const qaWorkItem = executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === approvedQaWorkItem.id)
  const providerJob = executionPackage.jobs.find((candidate) =>
    candidate.approvedWorkItemId === providerWorkItem?.id)
  const qaJob = executionPackage.jobs.find((candidate) =>
    candidate.approvedWorkItemId === qaWorkItem?.id)
  assert.ok(providerWorkItem)
  assert.ok(qaWorkItem)
  assert.ok(providerJob)
  assert.ok(qaJob)
  baseTimeMs = Math.max(Date.now(), Date.parse(providerJob.scheduledFor)) + 10_000
  const providerExpectedAssetId = providerJob.expectedAssetIds[0]
  const qaExpectedAssetId = qaJob.expectedAssetIds[0]
  const providerOutputKey = providerWorkItem.expectedOutputs[0]?.outputKey
  assert.ok(providerExpectedAssetId)
  assert.ok(qaExpectedAssetId)
  assert.ok(providerOutputKey)
  assert.notEqual(
    providerExpectedAssetId,
    providerOutputKey,
    'The real package must prove planned asset IDs are not logical output keys.',
  )

  const placementManifest = createCanonicalPrivateResourcePlacementManifest({
    executionPackage,
    toolCapabilityManifest: packageRead.toolCapabilityManifest,
    toolExecutionAuthority: packageRead.toolExecutionAuthority,
  })
  const providerPlacement = placementManifest.placements.find((candidate) =>
    candidate.jobId === providerJob.id)
  const qaPlacement = placementManifest.placements.find((candidate) =>
    candidate.jobId === qaJob.id)
  assert.ok(providerPlacement)
  assert.ok(qaPlacement)
  assert.equal(providerPlacement.privateExecutionReady, false)
  assert.equal(qaPlacement.privateExecutionReady, true)
  assert.equal(qaPlacement.workerType, 'render_worker')

  let queueNow = at(-1_000)
  const packageQueue = createCanonicalPrivatePackageWorkQueueService({
    context,
    ownerUserId,
    executionPackage,
    placementManifest,
    now: () => new Date(queueNow),
  })
  await packageQueue.initialize()
  const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot: canonicalAuthoritySmokeRoot,
    ownerUserId,
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId,
    packageRecordId: executionPackage.packageRecordId,
    approvedPlanSnapshotId: snapshot.snapshotId,
  }
  const candidateBytes = await createMovingCandidate(candidateRoot)
  const providerLifecycle =
    await executePrivateInjectedVisualCalibrationLifecycle({
      scope,
      executionPackage,
      queueDefinition: packageQueue.definition,
      jobId: providerJob.id,
      expectedOutputId: providerExpectedAssetId,
      visualCalibrationContext: planningPair.provider.visualCalibrationContext,
      sourceRequestId: 'visual-calibration-e2e-source-request',
      sourceRequestDigest: digest('visual-calibration-e2e-source-request'),
      providerRequestPayloadDigest:
        digest('visual-calibration-e2e-provider-request-payload'),
      projectDataPolicyDigest: digest('visual-calibration-e2e-data-policy'),
      providerAccountPolicyDigest:
        digest('visual-calibration-e2e-provider-account-policy'),
      idempotencyKey: 'visual-calibration-e2e-provider-attempt-v1',
      providerRateAuthority: {
        evidenceClass: 'official_public_pricing_snapshot_unreleased',
        snapshotId: 'gemini-omni-visual-calibration-e2e-rate-v1',
        snapshotDigest: digest('gemini-omni-visual-calibration-e2e-rate-v1'),
        sourceCode: 'google_gemini_api_pricing_2026_07_21',
        billingUnit: 'input_and_video_output_tokens',
        inputMicrosPerMillionTokens: 1_500_000,
        videoOutputMicrosPerMillionTokens: 17_500_000,
        videoOutputTokensPerSecond: 5_792,
        capturedAt: at(-24 * 60 * 60 * 1_000),
        expiresAt: at(7 * 24 * 60 * 60 * 1_000),
        productionQualified: false,
      },
      maximumAuthorizedProviderCostMicros:
        planningPair.provider.maximumAuthorizedProviderCostMicros,
      maximumAuthorizedInfrastructureCostMicros:
        planningPair.provider.maximumAuthorizedInfrastructureCostMicros,
      workerIdentity: 'private-visual-calibration-provider-worker-e2e',
      credentialSecret:
        'private-injected-visual-calibration-e2e-dispatch-secret-20260721',
      leaseDurationMs: 60_000,
      times: {
        authorizedAt: at(0),
        authorizationExpiresAt: at(60 * 60 * 1_000),
        claimAt: at(1_000),
        issuedAt: at(2_000),
        consumedAt: at(3_000),
        completedAt: at(5_000),
      },
      outcome: {
        state: 'succeeded',
        output: {
          outputId: providerExpectedAssetId,
          role: 'provider_visual_calibration_video_mp4',
          mimeType: 'video/mp4',
          bytes: candidateBytes,
        },
        wallTimeMicroseconds: 900_000,
        rawInfrastructureUsageEvidenceDigest:
          digest('visual-calibration-e2e-provider-worker-usage'),
      },
    })
  assert.equal(providerLifecycle.disposition, 'executed')
  assert.equal(providerLifecycle.authorization.expectedOutputId,
    providerExpectedAssetId)
  assert.equal(providerLifecycle.authorization.expectedOutputKey,
    providerOutputKey)
  assert.equal(providerLifecycle.evidence.providerTransportActivated, false)
  assert.equal(providerLifecycle.evidence.observedProviderRequestCount, 0)
  await persistProviderWorkerUsage({
    scope,
    executionPackage,
    result: providerLifecycle,
  })

  const providerAdmission =
    await createCanonicalPrivateVisualCalibrationProviderOutputArtifactService(
      context,
    ).admit({
      scope,
      executionPackage,
      queueDefinition: packageQueue.definition,
      authorization: providerLifecycle.authorization,
      qaApprovedWorkItemId: qaWorkItem.id,
      projectedAt: at(6_000),
    })
  assert.equal(providerAdmission.output.contentSha256,
    providerLifecycle.privateOutput?.contentSha256)
  assert.equal(providerAdmission.providerCallMade, false)

  const referenceBytes = visualCalibrationReferenceFrameBytes()
  const referenceReader = createReferenceReader(referenceBytes)
  context.canonicalVisualCalibrationReferenceFrameReaderPort = referenceReader
  await activatePrivateOfflineMediaBinaryRuntime()

  queueNow = at(7_000)
  const adapter = createCanonicalPrivateJobExecutionAdapterService(context)
  const qaQueueExecution = await packageQueue.execute({
    jobId: qaJob.id,
    workerType: qaPlacement.workerType,
    operation: async (): Promise<CanonicalPrivateWorkGraphJobOutcome> => {
      const executed = await adapter.execute({
        workspaceId,
        projectId: snapshot.projectId,
        editSessionId,
        jobId: qaJob.id,
        purpose: 'execute_canonical_private_job',
        idempotencyKey: 'visual-calibration-objective-qa-job-adapter-v1',
      })
      return {
        jobId: qaJob.id,
        approvedWorkItemId: qaJob.approvedWorkItemId,
        workItemKey: qaJob.workItemKey,
        required: qaWorkItem.required,
        dependencyJobIds: [...qaJob.dependencyJobIds],
        status: 'completed_private_test',
        artifactId: executed.result.artifactId,
        contentType: executed.result.contentType,
        sha256: executed.result.sha256,
        adapterReplayed: executed.evidence.idempotentAdapterReplay,
        blockedDependencyJobIds: [],
      }
    },
  })
  assert.equal(qaQueueExecution.disposition, 'executed')
  assert.ok('outcome' in qaQueueExecution)
  assert.equal(qaQueueExecution.outcome.status, 'completed_private_test')
  assert.ok(qaQueueExecution.outcome.artifactId)
  const qaArtifactId = qaQueueExecution.outcome.artifactId

  const receiptInput = {
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId,
    approvedPlanSnapshotId: snapshot.snapshotId,
    qaJobId: qaJob.id,
    qaExpectedAssetId,
    qaArtifactId,
  }
  const receipt = await readCanonicalVisualCalibrationObjectiveQaConsumerReceipt(
    context,
    receiptInput,
  )
  assert.equal(receipt.gates.length, 10)
  assert.ok(receipt.gates.every((gate) => gate.status === 'passed'))
  assert.equal(receipt.technicalQa.status, 'passed')
  assert.equal(receipt.technicalQa.privateTestCandidateEvidenceEligible, true)
  assert.equal(receipt.technicalQa.productionCandidateEvidenceAuthorized, false)
  assert.equal(receipt.providerInput.providerExpectedAssetId,
    providerExpectedAssetId)
  assert.equal(receipt.providerInput.providerArtifactId,
    providerAdmission.output.artifactId)
  assert.equal(receipt.internalCost.providerCostMicros, 0)
  assert.ok(receipt.internalCost.providerWorkerInfrastructureCostMicros > 0)
  assert.ok(receipt.internalCost.qaInfrastructureCostMicros > 0)
  assert.equal(
    receipt.internalCost.qaCostAuthorizationClass,
    'approved_internal_production_cost_only',
  )
  assert.equal(receipt.internalCost.qaCustomerCreditBudget, 0)
  assert.equal(
    receipt.internalCost.approvedSnapshotAndActiveReservationRequired,
    true,
  )
  assert.notEqual(
    receipt.internalCost.providerWorkerInfrastructureEvidenceHash,
    receipt.internalCost.qaInfrastructureEvidenceHash,
  )
  assert.equal(
    receipt.internalCost.selectedTotalInternalCostMicros,
    receipt.internalCost.providerCostMicros +
      receipt.internalCost.providerWorkerInfrastructureCostMicros +
      receipt.internalCost.qaInfrastructureCostMicros,
  )
  assert.equal(receipt.internalCost.customerPriceIncluded, false)
  assert.equal(receipt.internalCost.customerCreditsIncluded, false)
  assert.equal(receipt.internalCost.serviceFeeIncluded, false)
  assert.equal(receipt.boundaries.providerCallMadeByQa, false)
  assert.equal(receipt.boundaries.renderExecuted, false)
  assert.equal(receipt.boundaries.finalExportExecuted, false)
  assert.equal(receipt.boundaries.productionReady, false)

  let replayOperationCalled = false
  const qaReplay = await packageQueue.execute({
    jobId: qaJob.id,
    workerType: qaPlacement.workerType,
    operation: async () => {
      replayOperationCalled = true
      throw new Error('Completed queue replay must not execute QA twice.')
    },
  })
  assert.equal(qaReplay.disposition, 'completed_replay')
  assert.equal(replayOperationCalled, false)
  const receiptReplay =
    await readCanonicalVisualCalibrationObjectiveQaConsumerReceipt(
      context,
      receiptInput,
    )
  assert.equal(receiptReplay.receiptHash, receipt.receiptHash)

  context.canonicalVisualCalibrationReferenceFrameReaderPort =
    createReferenceReader(referenceBytes, { tamperFirstVersion: true })
  await assert.rejects(
    () => readCanonicalVisualCalibrationObjectiveQaConsumerReceipt(
      context,
      receiptInput,
    ),
    (error) => error instanceof ApiError &&
      error.code === 'JOB_DEPENDENCY_NOT_READY',
  )
  context.canonicalVisualCalibrationReferenceFrameReaderPort = referenceReader

  const queueEvidence = await packageQueue.evidence()
  assert.equal(queueEvidence.totalJobCount, executionPackage.jobs.length)
  assert.equal(queueEvidence.completedJobCount, 2)
  assert.equal(queueEvidence.claimedJobCount, 1)
  assert.equal(queueEvidence.claimCompletionCount, 1)
  assert.equal(queueEvidence.completedReplayCount, 1)
  assert.equal(queueEvidence.productionAuthority, false)

  console.log(JSON.stringify({
    smoke: 'canonical-private-visual-calibration-objective-qa-e2e',
    operationId: receipt.execution.operationId,
    executionOperation: receipt.execution.executionOperation,
    profileId: receipt.execution.operationProfileId,
    providerOutputKey,
    providerExpectedAssetId,
    qaExpectedAssetId,
    gateCount: receipt.gates.length,
    technicalQaStatus: receipt.technicalQa.status,
    providerCostMicros: receipt.internalCost.providerCostMicros,
    providerWorkerInfrastructureCostMicros:
      receipt.internalCost.providerWorkerInfrastructureCostMicros,
    qaInfrastructureCostMicros:
      receipt.internalCost.qaInfrastructureCostMicros,
    selectedTotalInternalCostMicros:
      receipt.internalCost.selectedTotalInternalCostMicros,
    queueCompletedJobCount: queueEvidence.completedJobCount,
    queueReplayWithoutExecution: !replayOperationCalled,
    providerRequestCount: providerLifecycle.evidence.observedProviderRequestCount,
    productionReady: receipt.boundaries.productionReady,
    receiptHash: receipt.receiptHash,
  }, null, 2))
} finally {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await Promise.all([
    rm(candidateRoot, { recursive: true, force: true }),
    rm(canonicalAuthoritySmokeRoot, { recursive: true, force: true }),
  ])
}

async function createMovingCandidate(root: string): Promise<Buffer> {
  const outputPath = join(root, 'moving-visual-calibration-candidate.mp4')
  await execFileAsync('/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=red:s=320x180:r=24:d=4',
    '-f', 'lavfi', '-i', 'color=c=white:s=40x40:r=24:d=4',
    '-filter_complex',
    "[0:v][1:v]overlay=x='mod(t*80,280)':y='70+30*sin(t*3)':eval=frame:shortest=1,format=yuv420p[v]",
    '-map', '[v]', '-frames:v', '96', '-r', '24', '-g', '24',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
    '-movflags', '+faststart', outputPath,
  ], { maxBuffer: 1024 * 1024 })
  const bytes = await readFile(outputPath)
  assert.ok(bytes.byteLength > 1_024 && bytes.byteLength <= 67_108_864)
  assert.equal(bytes.subarray(4, 8).toString('ascii'), 'ftyp')
  return bytes
}

function createReferenceReader(
  bytes: Buffer,
  options: { tamperFirstVersion?: boolean } = {},
) {
  return createControlledVisualCalibrationReferenceFrameReaderPort(
    async (request) => ({
      firstFrame: referenceFrameRead({
        request,
        kind: 'first',
        bytes,
        ...(options.tamperFirstVersion
          ? { overrideAssetVersionId: 'tampered-first-frame-version' }
          : {}),
      }),
      lastFrame: referenceFrameRead({ request, kind: 'last', bytes }),
      evidenceClass: 'controlled_test_fixture',
      privateObjectRead: true,
      callerLocationAccepted: false,
      browserReadable: false,
      productionAuthority: false,
    }),
  )
}

function referenceFrameRead(input: {
  request: CanonicalVisualCalibrationReferenceFrameReadRequest
  kind: 'first' | 'last'
  bytes: Buffer
  overrideAssetVersionId?: string
}): CanonicalVisualCalibrationReferenceFrameRead {
  const expected = input.kind === 'first'
    ? input.request.firstFrame
    : input.request.lastFrame
  return {
    assetId: expected.assetId,
    assetVersionId:
      input.overrideAssetVersionId ?? expected.expectedAssetVersionId,
    sha256: expected.expectedSha256,
    byteLength: input.bytes.byteLength,
    privateObjectIdentityHash: digest(`${input.kind}-frame-private-object`),
    storageEvidenceHash: digest(`${input.kind}-frame-storage-evidence`),
    readbackEvidenceHash: digest(`${input.kind}-frame-readback-evidence`),
    checksumReadbackVerified: true,
    input: {
      inputMode: 'private_verified_stream_v1',
      byteLength: input.bytes.byteLength,
      sha256: expected.expectedSha256,
      async openStream() {
        return Readable.from([Buffer.from(input.bytes)])
      },
    },
  }
}

async function persistProviderWorkerUsage(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: Parameters<
    typeof createCanonicalPrivateResourcePlacementManifest
  >[0]['executionPackage']
  result: PrivateInjectedVisualCalibrationLifecycleResult
}): Promise<void> {
  const attempt = input.result.dispatchEntry.attempt
  const workItem = input.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === input.result.authorization.approvedWorkItemId)
  assert.ok(workItem)
  const runtimeExecutionIdentityDigest =
    digest(`provider-runtime:${attempt.dispatchAttemptId}`)
  const containerIdentityDigest =
    digest(`provider-container:${attempt.dispatchAttemptId}`)
  const measurementAgentDigest =
    digest(`provider-measurement:${attempt.dispatchAttemptId}`)
  const snapshot = (value: {
    capturedAt: string
    cpuUsageNanoseconds: number
    memoryCurrentBytes: number
    memoryPeakBytes: number
  }) => {
    const withoutDigest = {
      schemaVersion: 'private-worker-resource-observer-snapshot-v1' as const,
      runtimeExecutionIdentityDigest,
      containerIdentityDigest,
      measurementAgentDigest,
      ...value,
      gpuActiveMilliseconds: null,
    }
    return {
      ...withoutDigest,
      rawSnapshotDigest:
        hashPrivateWorkerResourceObserverSnapshot(withoutDigest),
    }
  }
  const inputArtifacts = [{
    artifactId: input.result.authorization.sourceRequestId,
    sha256: input.result.authorization.sourceRequestDigest,
    byteLength: 1,
  }]
  const outputArtifacts = input.result.privateOutput
    ? [{
        artifactId: input.result.privateOutput.assetVersionId,
        sha256: input.result.privateOutput.contentSha256,
        byteLength: input.result.privateOutput.byteLength,
      }]
    : []
  await createPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: input.scope.localStorageRoot,
    evidenceClass: 'private_injected_observed_usage_test',
    operation: {
      kind: 'registered_provider_operation',
      operationId: input.result.authorization.operationId,
    },
    identity: {
      ownerUserId: input.result.authorization.ownerUserId,
      workspaceId: input.result.authorization.workspaceId,
      projectId: input.result.authorization.projectId,
      editSessionId: input.result.authorization.editSessionId,
      approvedPlanSnapshotId:
        input.result.authorization.approvedPlanSnapshotId,
      approvedPlanSnapshotHash: input.result.authorization.snapshotHash,
      packageRecordId: input.result.authorization.packageRecordId,
      packageHash: input.result.authorization.packageHash,
      approvedWorkItemId: input.result.authorization.approvedWorkItemId,
      approvedWorkItemHash: sha256AuthorityValue(workItem),
      jobId: input.result.authorization.queueJobId,
      executionAttemptId: attempt.dispatchAttemptId,
      attemptOrdinal: attempt.queueClaimDeliveryAttempt,
      leaseId: attempt.queueClaimId,
      leaseHash: attempt.queueClaimHash,
      dispatchGrantId: input.result.grant.grantId,
      dispatchGrantHash: input.result.grant.immutableGrantHash,
      idempotencyKeyHash: input.result.authorization.idempotencyKeyHash,
    },
    attemptInputHash:
      input.result.authorization.providerRequestPayloadDigest,
    runtime: {
      workerClass: 'provider_worker',
      runtimeExecutionIdentityDigest,
      runtimeImageDigest: digest(`provider-image:${attempt.dispatchAttemptId}`),
      runtimeAttestationDigest:
        digest(`provider-attestation:${attempt.dispatchAttemptId}`),
      containerIdentityDigest,
      cloudExecutionResourceDigest: null,
      measurementAgentVersion: 'visual-calibration-e2e-provider-meter-v1',
      measurementAgentDigest,
      leaseExpiresAt: input.result.grant.queueClaimExpiresAt,
    },
    allocation: { vcpuCount: 1, memoryMib: 1_024, gpuCount: 0 },
    startSnapshot: snapshot({
      capturedAt: at(3_200),
      cpuUsageNanoseconds: 1_000_000,
      memoryCurrentBytes: 8 * 1024 * 1024,
      memoryPeakBytes: 8 * 1024 * 1024,
    }),
    finishSnapshot: snapshot({
      capturedAt: at(4_200),
      cpuUsageNanoseconds: 3_000_000,
      memoryCurrentBytes: 12 * 1024 * 1024,
      memoryPeakBytes: 16 * 1024 * 1024,
    }),
    input: {
      artifacts: inputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'input',
        artifacts: inputArtifacts,
      }),
    },
    output: {
      disposition: 'accepted',
      artifacts: outputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'output',
        artifacts: outputArtifacts,
      }),
    },
    networkEgressBytes: 0,
    outcome: { state: 'completed', failureCategory: 'none' },
    createdAt: at(5_000),
  })
}

function createContext(): ServiceContext {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    SUPABASE_URL: 'https://visual-calibration-e2e.supabase.co',
    SUPABASE_ANON_KEY: 'visual-calibration-e2e-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'visual-calibration-e2e-service-role',
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
    REEDITPRO_INTERNAL_SERVICE_TOKEN:
      'rp-visual-calibration-e2e-internal-service-secret-20260721',
    LOCAL_STORAGE_ROOT: canonicalAuthoritySmokeRoot,
  })
  return {
    env,
    clients: {
      admin: createMembershipAdminClient(),
      public: null,
    },
    requestId: 'canonical-visual-calibration-objective-qa-e2e',
    auth: {
      userId: ownerUserId,
      accessToken: 'verified-visual-calibration-e2e-token',
      isMockUser: false,
    },
  }
}

function createMembershipAdminClient(): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected visual-calibration E2E table ${tableName}.`)
      }
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() { return query },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const allowed = selectedWorkspaceId === workspaceId &&
            selectedUserId === ownerUserId
          return {
            data: allowed
              ? {
                  workspace_id: workspaceId,
                  user_id: ownerUserId,
                  role: 'owner',
                }
              : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

function digest(label: string): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:visual-calibration-objective-qa-e2e:v1',
    label,
  })
}

assert.equal(
  visualCalibrationReferenceFrameBytes().toString('base64'),
  VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.pngBase64,
)
