import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buffer } from 'node:stream/consumers'

import type { SupabaseClient } from '@supabase/supabase-js'

import { createReeditProApiApp } from '../app'
import {
  professionalLongFormCustomerDeliveryBrowserDecisionSchema,
  professionalLongFormCustomerDeliveryBrowserReviewSchema,
} from '../../src/backend/api/professional-long-form-customer-delivery-browser-contracts'
import { buildProfessionalExportCreditCoverage } from
  '../../src/lib/professional-export-policy'
import { loadRuntimeEnv } from '../config/env'
import {
  PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
} from '../edit-architecture/professional-long-form-master-timing-execution-contract'
import {
  buildCanonicalProfessionalLongFormSourceLedTimingComponents,
} from '../edit-architecture/professional-long-form-master-timing-execution'
import {
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
} from '../edit-architecture/professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
} from '../edit-architecture/professional-long-form-master-assembly-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
} from '../edit-architecture/professional-long-form-private-master-qa-execution-contract'
import {
  CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION,
} from '../services/canonical-professional-long-form-publication-authority'
import {
  createCanonicalProfessionalLongFormPostApprovalService,
} from '../services/canonical-professional-long-form-post-approval-service'
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
} from '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  createCanonicalProfessionalLongFormFirstChildExecutionService,
} from '../services/canonical-professional-long-form-first-child-execution-service'
import {
  createCanonicalProfessionalLongFormSourceAuthorityExecutionService,
} from '../services/canonical-professional-long-form-source-authority-execution-service'
import {
  createCanonicalProfessionalLongFormMasterTimingExecutionService,
} from '../services/canonical-professional-long-form-master-timing-execution-service'
import {
  createCanonicalProfessionalLongFormObjectChunkSeriesExecutionService,
} from '../services/canonical-professional-long-form-first-object-chunk-execution-service'
import {
  createCanonicalProfessionalLongFormContinuousProgramAudioExecutionService,
} from '../services/canonical-professional-long-form-continuous-program-audio-execution-service'
import {
  createCanonicalProfessionalLongFormCrossChunkColorExecutionService,
} from '../services/canonical-professional-long-form-cross-chunk-color-continuity-execution-service'
import {
  createCanonicalProfessionalLongFormMasterAssemblyExecutionService,
} from '../services/canonical-professional-long-form-master-assembly-execution-service'
import {
  createCanonicalProfessionalLongFormPrivateMasterQaExecutionService,
} from '../services/canonical-professional-long-form-private-master-qa-execution-service'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryPackageService,
} from '../services/canonical-professional-long-form-customer-delivery-package-service'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryExecutionService,
} from '../services/canonical-professional-long-form-customer-delivery-execution-service'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryDecodedQaExecutionService,
} from '../services/canonical-professional-long-form-customer-delivery-decoded-qa-execution-service'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryDownloadService,
} from '../services/canonical-professional-long-form-customer-delivery-download-service'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
} from '../edit-architecture/professional-long-form-customer-delivery-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
} from '../edit-architecture/professional-long-form-customer-delivery-h264-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
} from '../edit-architecture/professional-long-form-customer-delivery-mux-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
} from '../edit-architecture/professional-long-form-customer-delivery-decoded-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID,
} from '../edit-architecture/professional-long-form-customer-delivery-download-execution-contract'
import { createEditPlanningAuthorityService } from
  '../services/edit-planning-authority-service'
import { createExactEditPreferenceService } from
  '../services/exact-edit-preference-service'
import {
  clearPrivateEditAuthorityProcessStateForSmoke,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  clearPrivateExactEditPreferenceProcessStateForSmoke,
  exactEditPreferenceFingerprint,
} from '../services/private-exact-edit-preference-store'
import {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke,
} from '../services/private-canonical-package-work-queue-store'
import {
  clearLocalProjectMemoryForSmoke,
  createProjectService,
} from '../services/project-service'
import { createSourceMediaAuthorityService } from
  '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
  type CanonicalWorkItemInput,
  type PublishCanonicalEditPlanBody,
} from '../validation/edit-planning-authority-schemas'
import type {
  SourceBindingManifestCandidate,
  SourceMediaAuthorityExpectation,
} from '../validation/source-media-authority-schemas'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'
import { ApiError } from '../errors/api-error'

const workspaceId = 'workspace-canonical-color-two-chunk'
const userId = 'user-canonical-color-two-chunk'
const editSessionId = 'edit-session-canonical-color-two-chunk'
const planningRequestId = 'planning-canonical-color-two-chunk'
const fps = 30
const totalFrames = PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS * fps
const sourceCount = 2
const sourceFrames = totalFrames / sourceCount
const localStorageRoot = join(
  tmpdir(),
  `reeditpro-canonical-color-two-chunk-${process.pid}`,
)
let httpServer: Server | undefined

assert.equal(Number.isInteger(sourceFrames), true)

try {
  await rm(localStorageRoot, { recursive: true, force: true })
  clearLocalProjectMemoryForSmoke()
  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateExactEditPreferenceProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()

  const context = createContext()
  const project = (await createProjectService(context).createProject({
    workspaceId,
    name: 'Canonical two-chunk color-continuity proof',
  })).project
  const planningInputAuthority = await preparePlanningInputAuthority(
    context,
    project.id,
  )
  const sourceFixture = await prepareSourceMediaAuthority(context, project.id)
  const planningService = createEditPlanningAuthorityService(context)
  const published = await planningService.publishCanonicalPlan({
    ...createCanonicalPlanBody({
      projectId: project.id,
      planningInputAuthority,
      sourceFixture,
    }),
    projectId: project.id,
    editSessionId,
    idempotencyKey: 'publish-canonical-color-two-chunk',
    professionalLongFormSeedDraft: createSeedDraft({
      projectId: project.id,
      sourceFixture,
    }),
  })
  const authority = published.authority as unknown as Record<string, unknown>
  const plan = authority.plan as Record<string, unknown>
  const estimate = authority.estimate as Record<string, unknown>
  const approved = await planningService.approveAndFundCanonicalPlan({
    workspaceId,
    editPlanId: String(plan.id),
    expectedAuthorityRevision: Number(authority.authorityRevision),
    expectedPlanHash: String(plan.planHash),
    expectedEstimateHash: String(estimate.estimateHash),
    idempotencyKey: 'approve-canonical-color-two-chunk',
  })
  const approvedAuthority = approved.authority as unknown as Record<string, unknown>
  const snapshot = approvedAuthority.snapshot as Record<string, unknown>
  const snapshotId = String(snapshot.snapshotId)

  const postApproval = await
    createCanonicalProfessionalLongFormPostApprovalService(context)
      .deriveAndPersist({ workspaceId, approvedPlanSnapshotId: snapshotId })
  assert.equal(postApproval.bridge.expandedGraph.chunkCount, 2)
  assert.equal(postApproval.childJobManifest.summary.childJobCount, 11)
  const promotion = await
    createCanonicalProfessionalLongFormChildPackagePromotionService(context)
      .promote({ workspaceId, approvedPlanSnapshotId: snapshotId })
  assert.equal(promotion.queueAggregate.summary.totalJobCount, 11)

  await createCanonicalProfessionalLongFormFirstChildExecutionService(context)
    .authorizeAndExecute({ workspaceId, approvedPlanSnapshotId: snapshotId })
  await createCanonicalProfessionalLongFormSourceAuthorityExecutionService(context)
    .authorizeAndExecute({ workspaceId, approvedPlanSnapshotId: snapshotId })
  await createCanonicalProfessionalLongFormMasterTimingExecutionService(context)
    .authorizeAndExecute({ workspaceId, approvedPlanSnapshotId: snapshotId })
  await activatePrivateOfflineMediaBinaryRuntime()

  const series =
    createCanonicalProfessionalLongFormObjectChunkSeriesExecutionService(context)
  const firstPair = await series.executeNext({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  const colorService =
    createCanonicalProfessionalLongFormCrossChunkColorExecutionService(context)
  await expectApiError(
    () => colorService.execute({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    }),
    'JOB_DEPENDENCY_NOT_READY',
  )
  const secondPair = await series.executeNext({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(firstPair.selectedChunkIndex, 1)
  assert.equal(secondPair.selectedChunkIndex, 2)
  assert.equal(secondPair.readiness.allObjectChunkPairsCompleted, true)

  const audio = await
    createCanonicalProfessionalLongFormContinuousProgramAudioExecutionService(
      context,
    ).execute({ workspaceId, approvedPlanSnapshotId: snapshotId })
  assert.equal(audio.queueAggregate.summary.completedJobCount, 8)

  const masterService =
    createCanonicalProfessionalLongFormMasterAssemblyExecutionService(context)
  await expectApiError(
    () => masterService.execute({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    }),
    'JOB_DEPENDENCY_NOT_READY',
  )

  await expectApiError(
    () => colorService.execute({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
      callerThreshold: 255,
    } as unknown as {
      workspaceId: string
      approvedPlanSnapshotId: string
    }),
    'VALIDATION_FAILED',
  )
  const completed = await colorService.execute({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(completed.disposition, 'completed')
  assert.equal(completed.queueAggregate.summary.totalJobCount, 11)
  assert.equal(completed.queueAggregate.summary.completedJobCount, 9)
  assert.equal(completed.queueAggregate.summary.queuedJobCount, 2)
  assert.equal(completed.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(completed.color.validationArtifact.chunkCount, 2)
  assert.equal(completed.color.validationArtifact.boundaryCount, 1)
  assert.equal(completed.color.validationArtifact.boundaryResults.length, 1)
  assert.equal(
    completed.color.validationArtifact.boundaryResults[0]?.outcome,
    'passed',
  )
  assert.equal(
    completed.color.validationArtifact.boundaryResults[0]?.boundaryBefore,
    'approved_hard_cut',
  )
  assert.equal(
    completed.color.reconciliation.downstreamFinalization
      .everyRequiredDependencySatisfied,
    true,
  )
  assert.equal(
    completed.color.reconciliation.downstreamFinalization.executionAuthorized,
    false,
  )
  assert.equal(completed.color.costEvidence.boundary, 'internal_production_cost_only')
  assert.equal(completed.color.costEvidence.identity.toolId, 'ffmpeg')
  assert.equal(
    completed.color.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
  )
  assert.equal(
    completed.color.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
  )
  assert.equal(completed.color.costEvidence.outcome.status, 'completed')
  assert.equal(completed.readiness.secondExportEstimateCreated, false)
  assert.equal(completed.readiness.secondExportChargeCreated, false)
  assert.equal(completed.readiness.customerBillingAuthorized, false)
  assert.equal(completed.readiness.walletMutationAuthorized, false)
  assert.equal(completed.readiness.liveGoogleCloudVerified, false)
  assert.equal(completed.readiness.publicDeliveryAuthorized, false)
  assert.equal(completed.readiness.productReady, false)
  assert.equal(completed.readiness.productionReady, false)
  assert.doesNotMatch(
    stableAuthorityStringify(completed.color.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const replayed = await
    createCanonicalProfessionalLongFormCrossChunkColorExecutionService(context)
      .execute({ workspaceId, approvedPlanSnapshotId: snapshotId })
  assert.equal(replayed.disposition, 'exact_replay')
  assert.equal(replayed.evidenceHash, completed.evidenceHash)
  assert.equal(
    replayed.color.validationArtifact.validationHash,
    completed.color.validationArtifact.validationHash,
  )
  assert.equal(
    replayed.color.costEvidence.evidenceHash,
    completed.color.costEvidence.evidenceHash,
  )

  const master = await masterService.execute({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(master.disposition, 'completed')
  assert.equal(master.queueAggregate.summary.totalJobCount, 11)
  assert.equal(master.queueAggregate.summary.completedJobCount, 10)
  assert.equal(master.queueAggregate.summary.queuedJobCount, 1)
  assert.equal(master.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(master.assembly.runtimeEvidence.outputArtifact.mediaFormat, 'mkv')
  assert.equal(master.assembly.runtimeEvidence.outputArtifact.videoCodec, 'vp9')
  assert.equal(master.assembly.runtimeEvidence.outputArtifact.audioCodec, 'flac')
  assert.equal(master.assembly.runtimeEvidence.outputArtifact.frameCount, totalFrames)
  assert.equal(
    master.assembly.reconciliation.downstreamPrivateMasterQa
      .everyRequiredDependencySatisfied,
    true,
  )
  assert.equal(
    master.assembly.reconciliation.downstreamPrivateMasterQa
      .executionAuthorized,
    false,
  )
  assert.equal(master.assembly.costEvidence.boundary, 'internal_production_cost_only')
  assert.equal(master.assembly.costEvidence.identity.toolId, 'ffmpeg')
  assert.equal(
    master.assembly.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
  )
  assert.equal(
    master.assembly.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
  )
  assert.equal(master.readiness.privateMasterQaExecutionAuthorized, false)
  assert.equal(master.readiness.customerDeliveryMasterCreated, false)
  assert.equal(master.readiness.exportExecutionAuthorized, false)
  assert.equal(master.readiness.secondExportEstimateCreated, false)
  assert.equal(master.readiness.secondExportChargeCreated, false)
  assert.equal(master.readiness.publicDeliveryAuthorized, false)
  assert.equal(master.readiness.productReady, false)
  assert.equal(master.readiness.productionReady, false)
  assert.doesNotMatch(
    stableAuthorityStringify(master.assembly.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const masterReplay = await
    createCanonicalProfessionalLongFormMasterAssemblyExecutionService(context)
      .execute({ workspaceId, approvedPlanSnapshotId: snapshotId })
  assert.equal(masterReplay.disposition, 'exact_replay')
  assert.equal(masterReplay.evidenceHash, master.evidenceHash)
  assert.equal(
    masterReplay.assembly.runtimeEvidence.artifactHash,
    master.assembly.runtimeEvidence.artifactHash,
  )
  assert.equal(
    masterReplay.assembly.costEvidence.evidenceHash,
    master.assembly.costEvidence.evidenceHash,
  )

  const privateMasterQaService =
    createCanonicalProfessionalLongFormPrivateMasterQaExecutionService(context)
  await expectApiError(
    () => privateMasterQaService.execute({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
      callerCodec: 'h264',
    } as unknown as {
      workspaceId: string
      approvedPlanSnapshotId: string
    }),
    'VALIDATION_FAILED',
  )
  const privateMasterQa = await privateMasterQaService.execute({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(privateMasterQa.disposition, 'completed')
  assert.equal(privateMasterQa.queueAggregate.summary.totalJobCount, 11)
  assert.equal(privateMasterQa.queueAggregate.summary.completedJobCount, 11)
  assert.equal(privateMasterQa.queueAggregate.summary.queuedJobCount, 0)
  assert.equal(privateMasterQa.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(privateMasterQa.qa.artifact.outcome, 'passed')
  assert.equal(privateMasterQa.qa.artifact.observed.container, 'matroska')
  assert.equal(privateMasterQa.qa.artifact.observed.streamCount, 2)
  assert.equal(privateMasterQa.qa.artifact.observed.videoCodec, 'vp9')
  assert.equal(privateMasterQa.qa.artifact.observed.audioCodec, 'flac')
  assert.equal(privateMasterQa.qa.artifact.observed.frameCount, totalFrames)
  assert.equal(privateMasterQa.qa.artifact.observed.width, 3_840)
  assert.equal(privateMasterQa.qa.artifact.observed.height, 2_160)
  assert.equal(privateMasterQa.qa.artifact.observed.sampleRate, 48_000)
  assert.equal(privateMasterQa.qa.artifact.observed.channels, 2)
  assert.equal(
    privateMasterQa.qa.artifact.masterArtifact.sha256,
    master.assembly.runtimeEvidence.outputArtifact.sha256,
  )
  assert.equal(
    privateMasterQa.qa.reconciliation.graph.privateReviewGraphComplete,
    true,
  )
  assert.equal(
    privateMasterQa.qa.reconciliation.graph.remainingIncompleteAfterThisQa,
    0,
  )
  assert.equal(
    privateMasterQa.qa.reconciliation.downstream
      .customerDeliveryMasterExecutionAuthorized,
    false,
  )
  assert.equal(privateMasterQa.qa.costEvidence.boundary,
    'internal_production_cost_only')
  assert.equal(privateMasterQa.qa.costEvidence.identity.toolId, 'ffprobe')
  assert.equal(
    privateMasterQa.qa.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
  )
  assert.equal(
    privateMasterQa.qa.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
  )
  assert.equal(privateMasterQa.readiness.privateReviewGraphComplete, true)
  assert.equal(privateMasterQa.readiness.customerDeliveryMasterCreated, false)
  assert.equal(
    privateMasterQa.readiness.customerDeliveryMasterExecutionAuthorized,
    false,
  )
  assert.equal(privateMasterQa.readiness.exportExecutionAuthorized, false)
  assert.equal(privateMasterQa.readiness.secondExportEstimateCreated, false)
  assert.equal(privateMasterQa.readiness.secondExportChargeCreated, false)
  assert.equal(privateMasterQa.readiness.providerActivationAuthorized, false)
  assert.equal(privateMasterQa.readiness.customerBillingAuthorized, false)
  assert.equal(privateMasterQa.readiness.walletMutationAuthorized, false)
  assert.equal(privateMasterQa.readiness.liveGoogleCloudVerified, false)
  assert.equal(privateMasterQa.readiness.publicDeliveryAuthorized, false)
  assert.equal(privateMasterQa.readiness.productReady, false)
  assert.equal(privateMasterQa.readiness.productionReady, false)
  assert.doesNotMatch(
    stableAuthorityStringify(privateMasterQa.qa.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )

  const deliveryService =
    createCanonicalProfessionalLongFormCustomerDeliveryPackageService(context)
  const delivery = await deliveryService.prepare({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(delivery.disposition, 'created')
  assert.equal(delivery.package.outputContract.chunkCount, 2)
  assert.equal(delivery.package.graph.summary.totalJobCount, 9)
  assert.equal(delivery.queueAggregate.summary.totalJobCount, 9)
  assert.equal(delivery.queueAggregate.summary.queuedJobCount, 9)
  assert.equal(delivery.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(delivery.queueAggregate.summary.completedJobCount, 0)
  assert.equal(
    delivery.package.outputContract.mediaPolicyId,
    'approved_h264_aac_yuv420p_bt709_web_master_v1',
  )
  assert.equal(delivery.package.outputContract.outputVideoCodec, 'h264')
  assert.equal(delivery.package.outputContract.outputAudioCodec, 'aac')
  assert.equal(delivery.package.outputContract.fastStartRequired, true)
  assert.equal(
    delivery.package.commercialBoundary
      .approvedFourKEstimateAndReservationReused,
    true,
  )
  assert.equal(
    delivery.package.commercialBoundary
      .customerDeliveryCoveredByOriginalApprovedEstimate,
    true,
  )
  assert.equal(
    delivery.package.commercialBoundary.secondExportEstimateCreated,
    false,
  )
  assert.equal(
    delivery.package.commercialBoundary.secondExportChargeCreated,
    false,
  )
  const deliveryRoot = delivery.queueDefinition.jobs[0]
  assert.deepEqual(
    deliveryRoot?.satisfiedPromotionDependencyJobIds,
    [delivery.package.sourceReview.privateMasterQa.sourceJobId],
  )
  assert.equal(deliveryRoot?.privateExecutionReady, false)
  const deliveryMux = delivery.package.graph.workItems.find((workItem) =>
    workItem.kind === 'mux_customer_delivery_h264_aac_master')
  assert.equal(deliveryMux?.dependencyJobIds.length, 2)
  assert.equal(
    delivery.package.readiness.exactRunnerAuthorityVerified,
    false,
  )
  assert.equal(delivery.readiness.customerDeliveryMediaExecutionVerified, false)
  assert.equal(delivery.readiness.customerBillingAuthorized, false)
  assert.equal(delivery.readiness.walletMutationAuthorized, false)
  assert.equal(delivery.readiness.publicDeliveryAuthorized, false)
  assert.equal(delivery.readiness.productReady, false)
  assert.equal(delivery.readiness.productionReady, false)

  const deliveryPristineReplay = await deliveryService.prepare({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(deliveryPristineReplay.disposition, 'exact_replay')
  assert.equal(deliveryPristineReplay.evidenceHash, delivery.evidenceHash)
  const deliveryExecutionService =
    createCanonicalProfessionalLongFormCustomerDeliveryExecutionService(context)
  const deliveryRootExecution = await deliveryExecutionService.executeRoot({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(deliveryRootExecution.queueAggregate.summary.completedJobCount, 1)
  assert.equal(deliveryRootExecution.queueAggregate.summary.queuedJobCount, 8)
  assert.equal(
    deliveryRootExecution.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
  )
  assert.equal(
    deliveryRootExecution.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
  )
  assert.equal(deliveryRootExecution.costEvidence.resourceUsage.vcpuCount, 1)
  assert.equal(deliveryRootExecution.costEvidence.resourceUsage.memoryGib, 1)
  assert.equal(deliveryRootExecution.terminal.h264ExecutionAuthorized, false)
  assert.doesNotMatch(
    stableAuthorityStringify(deliveryRootExecution.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )
  await prepareOfflineRemotionDockerRuntime()
  await activatePrivateOfflineRemotionRenderRuntime()
  const deliveryH264Execution =
    await deliveryExecutionService.executeFirstH264Chunk({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryH264Execution.disposition, 'completed')
  assert.equal(deliveryH264Execution.queueAggregate.summary.completedJobCount, 2)
  assert.equal(deliveryH264Execution.queueAggregate.summary.queuedJobCount, 7)
  assert.equal(deliveryH264Execution.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(
    deliveryH264Execution.h264.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
  )
  assert.equal(
    deliveryH264Execution.h264.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
  )
  assert.equal(deliveryH264Execution.h264.costEvidence.resourceUsage.vcpuCount, 4)
  assert.equal(deliveryH264Execution.h264.costEvidence.resourceUsage.memoryGib, 8)
  assert.equal(deliveryH264Execution.h264.outputArtifact.mediaFormat, 'mp4')
  assert.equal(deliveryH264Execution.h264.outputArtifact.videoCodec, 'h264')
  assert.equal(deliveryH264Execution.h264.outputArtifact.videoProfile, 'high')
  assert.equal(deliveryH264Execution.h264.outputArtifact.encoderCrf, 18)
  assert.equal(deliveryH264Execution.h264.outputArtifact.encoderPreset, 'medium')
  assert.equal(deliveryH264Execution.h264.outputArtifact.pixelFormat, 'yuv420p')
  assert.equal(deliveryH264Execution.h264.outputArtifact.colorSpace, 'bt709')
  assert.equal(deliveryH264Execution.h264.outputArtifact.audioStreamCount, 0)
  assert.equal(deliveryH264Execution.h264.terminal.independentQaCompleted, false)
  assert.equal(
    deliveryH264Execution.readiness.h264HighCrf18MediumVideoOnlyExecutionVerified,
    true,
  )
  assert.equal(
    deliveryH264Execution.readiness.independentH264ChunkQaVerified,
    false,
  )
  assert.equal(deliveryH264Execution.readiness.publicDeliveryAuthorized, false)
  assert.equal(deliveryH264Execution.readiness.productReady, false)
  assert.equal(deliveryH264Execution.readiness.productionReady, false)
  assert.doesNotMatch(
    stableAuthorityStringify(deliveryH264Execution.h264.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const privateMasterQaReplay = await
    createCanonicalProfessionalLongFormPrivateMasterQaExecutionService(context)
      .execute({ workspaceId, approvedPlanSnapshotId: snapshotId })
  assert.equal(privateMasterQaReplay.disposition, 'exact_replay')
  assert.equal(privateMasterQaReplay.evidenceHash, privateMasterQa.evidenceHash)
  assert.equal(
    privateMasterQaReplay.qa.artifact.qaHash,
    privateMasterQa.qa.artifact.qaHash,
  )
  assert.equal(
    privateMasterQaReplay.qa.costEvidence.evidenceHash,
    privateMasterQa.qa.costEvidence.evidenceHash,
  )
  const deliveryRootReplay = await deliveryExecutionService.executeRoot({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(
    deliveryRootReplay.terminal.terminalHash,
    deliveryRootExecution.terminal.terminalHash,
  )
  assert.equal(
    deliveryRootReplay.costEvidence.evidenceHash,
    deliveryRootExecution.costEvidence.evidenceHash,
  )
  const deliveryH264Replay =
    await deliveryExecutionService.executeFirstH264Chunk({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryH264Replay.disposition, 'exact_replay')
  assert.equal(
    deliveryH264Replay.h264.terminal.terminalHash,
    deliveryH264Execution.h264.terminal.terminalHash,
  )
  assert.equal(
    deliveryH264Replay.h264.costEvidence.evidenceHash,
    deliveryH264Execution.h264.costEvidence.evidenceHash,
  )
  const deliveryH264QaExecution =
    await deliveryExecutionService.executeFirstH264ChunkQa({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryH264QaExecution.disposition, 'completed')
  assert.equal(
    deliveryH264QaExecution.queueAggregate.summary.completedJobCount,
    3,
  )
  assert.equal(
    deliveryH264QaExecution.queueAggregate.summary.queuedJobCount,
    6,
  )
  assert.equal(
    deliveryH264QaExecution.queueAggregate.summary.leasedJobCount,
    0,
  )
  assert.equal(
    deliveryH264QaExecution.qa.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
  )
  assert.equal(
    deliveryH264QaExecution.qa.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
  )
  assert.equal(
    deliveryH264QaExecution.qa.costEvidence.resourceUsage.vcpuCount,
    2,
  )
  assert.equal(
    deliveryH264QaExecution.qa.costEvidence.resourceUsage.memoryGib,
    4,
  )
  assert.equal(deliveryH264QaExecution.qa.artifact.observed.container, 'mp4')
  assert.equal(deliveryH264QaExecution.qa.artifact.observed.codecName, 'h264')
  assert.equal(deliveryH264QaExecution.qa.artifact.observed.codecProfile, 'High')
  assert.equal(deliveryH264QaExecution.qa.artifact.observed.pixelFormat, 'yuv420p')
  assert.equal(deliveryH264QaExecution.qa.artifact.observed.colorSpace, 'bt709')
  assert.equal(deliveryH264QaExecution.qa.artifact.observed.videoStreamCount, 1)
  assert.equal(deliveryH264QaExecution.qa.artifact.observed.audioStreamCount, 0)
  assert.equal(
    deliveryH264QaExecution.qa.artifact.observed.frameCount,
    deliveryH264Execution.h264.outputArtifact.durationFrames,
  )
  assert.equal(deliveryH264QaExecution.qa.terminal.muxExecutionAuthorized, false)
  assert.equal(
    deliveryH264QaExecution.readiness
      .exactH264HighProfileFrameColorDurationVerified,
    true,
  )
  assert.equal(deliveryH264QaExecution.readiness.muxExecutionAuthorized, false)
  assert.equal(deliveryH264QaExecution.readiness.publicDeliveryAuthorized, false)
  assert.equal(deliveryH264QaExecution.readiness.productReady, false)
  assert.equal(deliveryH264QaExecution.readiness.productionReady, false)
  assert.doesNotMatch(
    stableAuthorityStringify(deliveryH264QaExecution.qa.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const deliveryH264QaReplay =
    await deliveryExecutionService.executeFirstH264ChunkQa({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryH264QaReplay.disposition, 'exact_replay')
  assert.equal(
    deliveryH264QaReplay.qa.artifact.qaHash,
    deliveryH264QaExecution.qa.artifact.qaHash,
  )
  assert.equal(
    deliveryH264QaReplay.qa.terminal.terminalHash,
    deliveryH264QaExecution.qa.terminal.terminalHash,
  )
  assert.equal(
    deliveryH264QaReplay.qa.costEvidence.evidenceHash,
    deliveryH264QaExecution.qa.costEvidence.evidenceHash,
  )
  const deliveryH264Series =
    await deliveryExecutionService.executeAllH264ChunksAndIndependentQa({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryH264Series.disposition, 'completed')
  assert.equal(deliveryH264Series.h264Chunks.length, 2)
  assert.equal(deliveryH264Series.independentQa.length, 2)
  assert.equal(
    deliveryH264Series.queueAggregate.summary.completedJobCount,
    5,
  )
  assert.equal(deliveryH264Series.queueAggregate.summary.queuedJobCount, 4)
  assert.equal(deliveryH264Series.queueAggregate.summary.leasedJobCount, 0)
  assert.deepEqual(
    deliveryH264Series.h264Chunks.map((chunk) =>
      chunk.outputArtifact.chunkIndex),
    [1, 2],
  )
  assert.deepEqual(
    deliveryH264Series.independentQa.map((qa) =>
      qa.artifact.observed.codecProfile),
    ['High', 'High'],
  )
  assert.deepEqual(
    deliveryH264Series.independentQa.map((qa) =>
      qa.artifact.observed.frameCount),
    deliveryH264Series.h264Chunks.map((chunk) =>
      chunk.outputArtifact.durationFrames),
  )
  assert.equal(
    new Set(deliveryH264Series.h264Chunks.map((chunk) =>
      chunk.outputArtifact.objectIdentity)).size,
    2,
  )
  const deliveryMuxEntry = deliveryH264Series.queueAggregate.entries[5]
  assert.equal(deliveryMuxEntry?.state, 'queued')
  assert.equal(deliveryMuxEntry?.definition.dependencyJobIds.length, 2)
  assert.equal(deliveryMuxEntry?.professionalLongFormExecutionAuthorization,
    undefined)
  assert.ok(deliveryMuxEntry?.definition.dependencyJobIds.every(
    (dependencyJobId) => deliveryH264Series.queueAggregate.entries.find(
      (entry) => entry.definition.jobId === dependencyJobId)?.state ===
        'completed',
  ))
  assert.equal(deliveryH264Series.readiness.allMuxDependenciesSatisfied, true)
  assert.equal(deliveryH264Series.readiness.muxExecutionAuthorized, false)
  assert.equal(deliveryH264Series.readiness.secondExportEstimateCreated, false)
  assert.equal(deliveryH264Series.readiness.secondExportChargeCreated, false)
  assert.equal(deliveryH264Series.readiness.publicDeliveryAuthorized, false)
  assert.equal(deliveryH264Series.readiness.productReady, false)
  assert.equal(deliveryH264Series.readiness.productionReady, false)
  for (const evidence of [
    ...deliveryH264Series.h264Chunks.map((chunk) => chunk.costEvidence),
    ...deliveryH264Series.independentQa.map((qa) => qa.costEvidence),
  ]) assert.doesNotMatch(
    stableAuthorityStringify(evidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const deliveryH264SeriesReplay =
    await deliveryExecutionService.executeAllH264ChunksAndIndependentQa({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryH264SeriesReplay.disposition, 'exact_replay')
  assert.equal(deliveryH264SeriesReplay.evidenceHash,
    deliveryH264Series.evidenceHash)
  assert.deepEqual(
    deliveryH264SeriesReplay.h264Chunks.map((chunk) =>
      chunk.terminal.terminalHash),
    deliveryH264Series.h264Chunks.map((chunk) =>
      chunk.terminal.terminalHash),
  )
  assert.deepEqual(
    deliveryH264SeriesReplay.independentQa.map((qa) =>
      qa.terminal.terminalHash),
    deliveryH264Series.independentQa.map((qa) =>
      qa.terminal.terminalHash),
  )

  const deliveryMuxExecution =
    await deliveryExecutionService.executePrivateH264AacMasterMux({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryMuxExecution.disposition, 'completed')
  assert.equal(
    deliveryMuxExecution.prerequisiteSeriesDependencySetHash,
    deliveryMuxExecution.mux.authority.lineage.dependencySetHash,
  )
  assert.equal(deliveryMuxExecution.queueAggregate.summary.completedJobCount, 6)
  assert.equal(deliveryMuxExecution.queueAggregate.summary.queuedJobCount, 3)
  assert.equal(deliveryMuxExecution.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(deliveryMuxExecution.mux.outputArtifact.mediaFormat, 'mp4')
  assert.equal(deliveryMuxExecution.mux.outputArtifact.videoCodec, 'h264')
  assert.equal(deliveryMuxExecution.mux.outputArtifact.videoProfile, 'high')
  assert.equal(
    deliveryMuxExecution.mux.outputArtifact.videoStreamCopiedWithoutReencode,
    true,
  )
  assert.equal(deliveryMuxExecution.mux.outputArtifact.audioCodec, 'aac_lc')
  assert.equal(deliveryMuxExecution.mux.outputArtifact.audioBitrate, 192_000)
  assert.equal(deliveryMuxExecution.mux.outputArtifact.sampleRate, 48_000)
  assert.equal(deliveryMuxExecution.mux.outputArtifact.channels, 2)
  assert.equal(deliveryMuxExecution.mux.outputArtifact.audioEncodeCount, 1)
  assert.equal(
    deliveryMuxExecution.mux.outputArtifact.frontLoadedInitializationMetadata,
    true,
  )
  assert.equal(
    deliveryMuxExecution.mux.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
  )
  assert.equal(
    deliveryMuxExecution.mux.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
  )
  assert.equal(deliveryMuxExecution.mux.costEvidence.resourceUsage.vcpuCount, 4)
  assert.equal(deliveryMuxExecution.mux.costEvidence.resourceUsage.memoryGib, 8)
  assert.equal(deliveryMuxExecution.mux.terminal.decodedVideoQaCompleted, false)
  assert.equal(deliveryMuxExecution.mux.terminal.decodedAudioQaCompleted, false)
  assert.equal(deliveryMuxExecution.mux.terminal.privateDownloadReconciled, false)
  assert.equal(
    deliveryMuxExecution.readiness.completeProgramVideoReencoded,
    false,
  )
  assert.equal(deliveryMuxExecution.readiness.decodedVideoQaVerified, false)
  assert.equal(deliveryMuxExecution.readiness.decodedAudioQaVerified, false)
  assert.equal(deliveryMuxExecution.readiness.privateDownloadVerified, false)
  assert.equal(deliveryMuxExecution.readiness.secondExportEstimateCreated, false)
  assert.equal(deliveryMuxExecution.readiness.secondExportChargeCreated, false)
  assert.equal(deliveryMuxExecution.readiness.publicDeliveryAuthorized, false)
  assert.equal(deliveryMuxExecution.readiness.productReady, false)
  assert.equal(deliveryMuxExecution.readiness.productionReady, false)
  assert.doesNotMatch(
    stableAuthorityStringify(deliveryMuxExecution.mux.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )
  assert.equal(
    deliveryMuxExecution.queueAggregate.entries[6]?.state,
    'queued',
  )
  assert.equal(
    deliveryMuxExecution.queueAggregate.entries[7]?.state,
    'queued',
  )
  assert.equal(
    deliveryMuxExecution.queueAggregate.entries[8]?.state,
    'queued',
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const deliveryMuxReplay =
    await deliveryExecutionService.executePrivateH264AacMasterMux({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
    })
  assert.equal(deliveryMuxReplay.disposition, 'exact_replay')
  assert.equal(
    deliveryMuxReplay.prerequisiteSeriesDependencySetHash,
    deliveryMuxExecution.prerequisiteSeriesDependencySetHash,
  )
  assert.equal(deliveryMuxReplay.evidenceHash, deliveryMuxExecution.evidenceHash)
  assert.equal(
    deliveryMuxReplay.mux.terminal.terminalHash,
    deliveryMuxExecution.mux.terminal.terminalHash,
  )
  assert.equal(
    deliveryMuxReplay.mux.costEvidence.evidenceHash,
    deliveryMuxExecution.mux.costEvidence.evidenceHash,
  )
  assert.equal(
    deliveryMuxReplay.mux.outputArtifact.sha256,
    deliveryMuxExecution.mux.outputArtifact.sha256,
  )

  const decodedQaService =
    createCanonicalProfessionalLongFormCustomerDeliveryDecodedQaExecutionService(
      context,
    )
  const decodedVideoQa = await decodedQaService.executeDecodedVideoQa({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(decodedVideoQa.disposition, 'completed')
  assert.equal(decodedVideoQa.qa.objectiveEvidence.outcome,
    'needs_user_review')
  assert.equal(decodedVideoQa.queueAggregate.summary.completedJobCount, 7)
  assert.equal(decodedVideoQa.queueAggregate.summary.queuedJobCount, 2)
  assert.equal(decodedVideoQa.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(decodedVideoQa.qa.terminal.decodedAudioQaCompleted, false)
  assert.equal(decodedVideoQa.qa.terminal.privateDownloadReconciled, false)
  assert.equal(
    decodedVideoQa.qa.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
  )
  assert.equal(
    decodedVideoQa.qa.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
  )
  assert.equal(decodedVideoQa.qa.costEvidence.resourceUsage.vcpuCount, 2)
  assert.equal(decodedVideoQa.qa.costEvidence.resourceUsage.memoryGib, 2)
  assert.equal(decodedVideoQa.readiness.privateDownloadExecutionAuthorized, false)
  assert.equal(decodedVideoQa.readiness.secondExportEstimateCreated, false)
  assert.equal(decodedVideoQa.readiness.secondExportChargeCreated, false)
  assert.equal(decodedVideoQa.readiness.productReady, false)
  assert.equal(decodedVideoQa.readiness.productionReady, false)

  const decodedAudioQa = await decodedQaService.executeDecodedAudioQa({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(decodedAudioQa.disposition, 'completed')
  assert.equal(decodedAudioQa.qa.objectiveEvidence.outcome,
    'needs_user_review')
  assert.equal(decodedAudioQa.queueAggregate.summary.completedJobCount, 8)
  assert.equal(decodedAudioQa.queueAggregate.summary.queuedJobCount, 1)
  assert.equal(decodedAudioQa.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(decodedAudioQa.qa.terminal.decodedVideoQaCompleted, true)
  assert.equal(
    decodedAudioQa.qa.artifact.actualSpeechIntelligibilityAnalysisPerformed,
    false,
  )
  assert.equal(
    decodedAudioQa.qa.terminal.actualSpeechIntelligibilityAnalysisPerformed,
    false,
  )
  assert.equal(
    decodedAudioQa.qa.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
  )
  assert.equal(
    decodedAudioQa.qa.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
  )
  assert.equal(decodedAudioQa.qa.costEvidence.resourceUsage.vcpuCount, 2)
  assert.equal(decodedAudioQa.qa.costEvidence.resourceUsage.memoryGib, 2)
  assert.equal(decodedAudioQa.readiness.privateDownloadExecutionAuthorized, false)
  assert.equal(decodedAudioQa.readiness.customerPriceOrCreditsMutated, false)
  assert.equal(decodedAudioQa.readiness.productReady, false)
  assert.equal(decodedAudioQa.readiness.productionReady, false)
  const privateDownloadEntry = decodedAudioQa.queueAggregate.entries[8]
  assert.equal(privateDownloadEntry?.state, 'queued')
  assert.equal(privateDownloadEntry?.deliveryAttemptCount, 0)
  assert.equal(
    privateDownloadEntry?.professionalLongFormExecutionAuthorization,
    undefined,
  )
  for (const evidence of [
    decodedVideoQa.qa.costEvidence,
    decodedAudioQa.qa.costEvidence,
  ]) assert.doesNotMatch(
    stableAuthorityStringify(evidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const decodedQaReplay = await decodedQaService.executeBothDecodedQa({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
  })
  assert.equal(decodedQaReplay.disposition, 'exact_replay')
  assert.equal(decodedQaReplay.qualityDisposition, 'user_review_required')
  assert.equal(decodedQaReplay.readiness.bothObjectiveQaGatesPassed, false)
  assert.equal(
    decodedQaReplay.videoQa.terminal.terminalHash,
    decodedVideoQa.qa.terminal.terminalHash,
  )
  assert.equal(
    decodedQaReplay.audioQa.terminal.terminalHash,
    decodedAudioQa.qa.terminal.terminalHash,
  )
  assert.equal(
    decodedQaReplay.queueAggregate.aggregateHash,
    decodedAudioQa.queueAggregate.aggregateHash,
  )

  const deliveryDownloadService =
    createCanonicalProfessionalLongFormCustomerDeliveryDownloadService(context)
  const qualityReview = await deliveryDownloadService.inspectQualityReview({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
    packageRecordId: delivery.package.identity.packageRecordId,
  })
  assert.equal(
    qualityReview.status,
    'quality_review_required_private_download_blocked',
  )
  assert.equal(qualityReview.reviewPacket.reviewItems.length, 3)
  assert.deepEqual(
    qualityReview.reviewPacket.reviewItems.map((item) => item.category),
    [
      'decoded_video_integrity',
      'decoded_audio_quality_sync',
      'speech_intelligibility_attestation',
    ],
  )
  assert.equal(
    qualityReview.reviewPacket.decodedQa.video.outcome,
    'needs_user_review',
  )
  assert.equal(
    qualityReview.reviewPacket.decodedQa.audio.outcome,
    'needs_user_review',
  )
  assert.equal(
    qualityReview.reviewPacket.actualSpeechIntelligibilityAnalysisPerformed,
    false,
  )
  assert.equal(
    qualityReview.reviewPacket.privateDownloadExecutionAuthorized,
    false,
  )
  httpServer = await listenServer(createServer(createReeditProApiApp(
    context.env,
    {
      clients: {
        admin: createMembershipAdminClient(),
        public: createAuthPublicClient(),
      },
    },
  )))
  const httpBaseUrl = `http://127.0.0.1:${serverPort(httpServer)}`
  const browserToken = 'verified-canonical-color-http-token'
  const otherUserBrowserToken = 'verified-canonical-color-other-user-token'
  const qualityReviewPath =
    '/v1/edit-executions/professional-long-form/' +
    `customer-delivery-packages/${
      encodeURIComponent(delivery.package.identity.packageRecordId)
    }/quality-review`
  const qualityReviewUrl = new URL(qualityReviewPath, httpBaseUrl)
  qualityReviewUrl.searchParams.set('workspaceId', workspaceId)
  qualityReviewUrl.searchParams.set(
    'approvedPlanSnapshotId',
    snapshotId,
  )
  const unauthenticatedQualityReview = await fetchJsonResponse(
    qualityReviewUrl,
  )
  assert.equal(unauthenticatedQualityReview.status, 401)
  assert.equal(
    unauthenticatedQualityReview.json.error?.code,
    'AUTH_REQUIRED',
  )
  const crossUserQualityReview = await fetchJsonResponse(
    qualityReviewUrl,
    { token: otherUserBrowserToken },
  )
  assert.equal(crossUserQualityReview.status, 403)
  assert.equal(
    crossUserQualityReview.json.error?.code,
    'WORKSPACE_ACCESS_DENIED',
  )
  const browserQualityReviewResponse = await fetchJsonResponse(
    qualityReviewUrl,
    { token: browserToken, origin: 'http://localhost:4173' },
  )
  assert.equal(browserQualityReviewResponse.status, 200)
  const browserQualityReview =
    professionalLongFormCustomerDeliveryBrowserReviewSchema.parse(
      browserQualityReviewResponse.json.data
        ?.professionalLongFormCustomerDeliveryQualityReview,
    )
  assert.equal(
    browserQualityReview.identity.packageRecordId,
    delivery.package.identity.packageRecordId,
  )
  assert.equal(
    browserQualityReview.authority.reviewPacketHash,
    qualityReview.reviewPacket.packetHash,
  )
  assert.equal(
    browserQualityReview.authority.masterSha256,
    qualityReview.reviewPacket.master.sha256,
  )
  assert.equal(browserQualityReview.reviewItems.length, 3)
  assert.equal(browserQualityReview.decision, null)
  assert.equal(browserQualityReview.privateDownload, null)
  assert.equal(
    browserQualityReview.readiness.qualityReviewMediaReady,
    true,
  )
  assert.equal(
    browserQualityReview.readiness
      .entireProgramPlaybackRequiredBeforeAcceptance,
    true,
  )
  assert.equal(
    browserQualityReview.commercialBoundary.secondExportEstimateCreated,
    false,
  )
  assert.equal(
    browserQualityReview.commercialBoundary.secondExportChargeCreated,
    false,
  )
  assert.equal(
    browserQualityReview.commercialBoundary.exportTimeCreditPromptAllowed,
    false,
  )
  assert.equal(
    containsForbiddenBrowserAuthority(browserQualityReview),
    false,
  )

  const reviewMediaUrl = new URL(
    browserQualityReview.reviewMedia.path,
    httpBaseUrl,
  )
  reviewMediaUrl.searchParams.set('workspaceId', workspaceId)
  reviewMediaUrl.searchParams.set('approvedPlanSnapshotId', snapshotId)
  reviewMediaUrl.searchParams.set(
    'expectedReviewPacketHash',
    browserQualityReview.reviewMedia.expectedReviewPacketHash,
  )
  reviewMediaUrl.searchParams.set(
    'expectedMasterSha256',
    browserQualityReview.reviewMedia.expectedMasterSha256,
  )
  const unauthenticatedReviewMedia = await fetchBinaryResponse(
    reviewMediaUrl,
    { range: 'bytes=0-31' },
  )
  assert.equal(unauthenticatedReviewMedia.status, 401)
  const browserReviewRange = await fetchBinaryResponse(reviewMediaUrl, {
    token: browserToken,
    range: 'bytes=0-31',
    origin: 'http://localhost:4173',
  })
  assert.equal(browserReviewRange.status, 206)
  assert.equal(browserReviewRange.bytes.byteLength, 32)
  assert.equal(browserReviewRange.headers.get('accept-ranges'), 'bytes')
  assert.equal(
    browserReviewRange.headers.get('content-range'),
    `bytes 0-31/${browserQualityReview.authority.masterByteSize}`,
  )
  assert.equal(
    browserReviewRange.headers.get('x-reeditpro-artifact-sha256'),
    browserQualityReview.authority.masterSha256,
  )
  assert.equal(
    browserReviewRange.headers.get(
      'x-reeditpro-quality-review-packet-sha256',
    ),
    browserQualityReview.authority.reviewPacketHash,
  )
  assert.match(
    browserReviewRange.headers.get('access-control-expose-headers') ?? '',
    /content-range/iu,
  )
  assert.match(
    browserReviewRange.headers.get('access-control-expose-headers') ?? '',
    /x-reeditpro-quality-review-packet-sha256/iu,
  )
  const acceptedDecisionRequest = {
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
    expectedReviewPacketHash: qualityReview.reviewPacket.packetHash,
    expectedMasterSha256: qualityReview.reviewPacket.master.sha256,
    expectedVideoObjectiveEvidenceHash:
      qualityReview.reviewPacket.decodedQa.video.objectiveEvidenceHash,
    expectedAudioObjectiveEvidenceHash:
      qualityReview.reviewPacket.decodedQa.audio.objectiveEvidenceHash,
    decision: 'accept_exact_private_customer_delivery' as const,
    attestation: {
      entirePrivateMasterPlaybackReviewed: true as const,
      exactVideoQualityAccepted: true as const,
      exactAudioQualityAndSyncAccepted: true as const,
      knownQaReviewItemsAccepted: true as const,
      approvedIntentSatisfied: true as const,
      speechIntelligibilityDisposition:
        'no_speech_expected_under_approved_snapshot' as const,
      noPublicDeliveryRequested: true as const,
    },
  }
  await expectApiError(
    () => deliveryDownloadService.recordQualityDecision({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
      packageRecordId: delivery.package.identity.packageRecordId,
      idempotencyKey: 'accept-canonical-customer-delivery-wrong-master',
      decisionRequest: {
        ...acceptedDecisionRequest,
        expectedMasterSha256: sha256Text('wrong-customer-delivery-master'),
      },
    }),
    'VALIDATION_FAILED',
  )
  const qualityDecisionUrl = new URL(
    `${qualityReviewPath}/../quality-decision`,
    httpBaseUrl,
  )
  const browserDecisionResponse = await postJsonResponse(
    qualityDecisionUrl,
    acceptedDecisionRequest,
    {
      token: browserToken,
      idempotencyKey: 'accept-canonical-customer-delivery-quality',
    },
  )
  assert.equal(browserDecisionResponse.status, 201)
  const browserDecision =
    professionalLongFormCustomerDeliveryBrowserDecisionSchema.parse(
      browserDecisionResponse.json.data
        ?.professionalLongFormCustomerDeliveryQualityDecision,
    )
  assert.equal(browserDecision.disposition, 'recorded')
  assert.equal(
    browserDecision.status,
    'quality_accepted_private_download_reconciled',
  )
  assert.equal(
    browserDecision.decision.value,
    'accept_exact_private_customer_delivery',
  )
  assert.ok(browserDecision.privateDownload)
  assert.equal(
    browserDecision.commercialBoundary.secondExportEstimateCreated,
    false,
  )
  assert.equal(
    browserDecision.commercialBoundary.secondExportChargeCreated,
    false,
  )
  assert.equal(
    browserDecision.commercialBoundary.customerCreditsMutated,
    false,
  )
  assert.equal(containsForbiddenBrowserAuthority(browserDecision), false)
  const browserDecisionReplayResponse = await postJsonResponse(
    qualityDecisionUrl,
    acceptedDecisionRequest,
    {
      token: browserToken,
      idempotencyKey: 'accept-canonical-customer-delivery-quality',
    },
  )
  assert.equal(browserDecisionReplayResponse.status, 200)
  const browserDecisionReplay =
    professionalLongFormCustomerDeliveryBrowserDecisionSchema.parse(
      browserDecisionReplayResponse.json.data
        ?.professionalLongFormCustomerDeliveryQualityDecision,
    )
  assert.equal(browserDecisionReplay.disposition, 'exact_replay')
  assert.equal(
    browserDecisionReplay.decision.decisionHash,
    browserDecision.decision.decisionHash,
  )
  const browserDecisionConflict = await postJsonResponse(
    qualityDecisionUrl,
    {
      ...acceptedDecisionRequest,
      expectedAudioObjectiveEvidenceHash:
        sha256Text('wrong-browser-audio-evidence'),
    },
    {
      token: browserToken,
      idempotencyKey: 'accept-canonical-customer-delivery-quality',
    },
  )
  assert.equal(browserDecisionConflict.status, 409)
  assert.equal(browserDecisionConflict.json.error?.code, 'IDEMPOTENCY_CONFLICT')
  const acceptedDelivery =
    await deliveryDownloadService.recordQualityDecision({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
      packageRecordId: delivery.package.identity.packageRecordId,
      idempotencyKey: 'accept-canonical-customer-delivery-quality',
      decisionRequest: acceptedDecisionRequest,
    })
  assert.equal(acceptedDelivery.disposition, 'exact_replay')
  assert.equal(
    acceptedDelivery.status,
    'quality_accepted_private_download_reconciled',
  )
  assert.ok(acceptedDelivery.download)
  assert.equal(
    acceptedDelivery.download.queueAggregate.summary.completedJobCount,
    9,
  )
  assert.equal(acceptedDelivery.download.queueAggregate.summary.queuedJobCount, 0)
  assert.equal(acceptedDelivery.download.queueAggregate.summary.leasedJobCount, 0)
  assert.equal(
    acceptedDelivery.download.costEvidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID,
  )
  assert.equal(
    acceptedDelivery.download.costEvidence.identity.workloadProfileId,
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID,
  )
  assert.equal(acceptedDelivery.download.costEvidence.resourceUsage.vcpuCount, 1)
  assert.equal(acceptedDelivery.download.costEvidence.resourceUsage.memoryGib, 1)
  assert.equal(acceptedDelivery.download.costEvidence.resourceUsage.gpuCount, 0)
  assert.equal(
    acceptedDelivery.download.artifact.delivery.sha256,
    deliveryMuxExecution.mux.outputArtifact.sha256,
  )
  assert.equal(
    acceptedDelivery.download.artifact.commercialBoundary
      .secondExportEstimateCreated,
    false,
  )
  assert.equal(
    acceptedDelivery.download.artifact.commercialBoundary
      .secondExportChargeCreated,
    false,
  )
  assert.doesNotMatch(
    stableAuthorityStringify(acceptedDelivery.download.costEvidence),
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u,
  )
  const privateDownloadFile = await deliveryDownloadService.readPrivateDownload({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
    packageRecordId: delivery.package.identity.packageRecordId,
    expectedQualityDecisionHash:
      acceptedDelivery.decisionRecord.decision.decisionHash,
    expectedMasterSha256: deliveryMuxExecution.mux.outputArtifact.sha256,
  })
  const downloadedBytes = await buffer(await privateDownloadFile.openStream())
  assert.equal(downloadedBytes.byteLength, privateDownloadFile.byteSize)
  assert.equal(
    createHash('sha256').update(downloadedBytes).digest('hex'),
    privateDownloadFile.sha256,
  )
  const firstRangeBytes = await buffer(
    await privateDownloadFile.openStream({ start: 0, end: 31 }),
  )
  assert.equal(firstRangeBytes.byteLength, 32)
  assert.deepEqual(firstRangeBytes, downloadedBytes.subarray(0, 32))
  assert.deepEqual(Buffer.from(browserReviewRange.bytes), firstRangeBytes)
  const browserDownloadDescriptor = browserDecision.privateDownload
  assert.ok(browserDownloadDescriptor)
  const browserDownloadUrl = new URL(
    browserDownloadDescriptor.path,
    httpBaseUrl,
  )
  browserDownloadUrl.searchParams.set('workspaceId', workspaceId)
  browserDownloadUrl.searchParams.set(
    'approvedPlanSnapshotId',
    snapshotId,
  )
  browserDownloadUrl.searchParams.set(
    'expectedQualityDecisionHash',
    browserDownloadDescriptor.expectedQualityDecisionHash,
  )
  browserDownloadUrl.searchParams.set(
    'expectedMasterSha256',
    browserDownloadDescriptor.expectedMasterSha256,
  )
  const browserDownloadRange = await fetchBinaryResponse(
    browserDownloadUrl,
    { token: browserToken, range: 'bytes=0-31' },
  )
  assert.equal(browserDownloadRange.status, 206)
  assert.deepEqual(Buffer.from(browserDownloadRange.bytes), firstRangeBytes)
  assert.equal(
    browserDownloadRange.headers.get(
      'x-reeditpro-quality-decision-sha256',
    ),
    browserDecision.decision.decisionHash,
  )
  assert.equal(
    browserDownloadRange.headers.get(
      'x-reeditpro-private-download-delivery-id',
    ),
    acceptedDelivery.download.artifact.identity.privateDownloadDeliveryId,
  )
  assert.match(
    browserDownloadRange.headers.get('cache-control') ?? '',
    /no-store/iu,
  )
  const invalidBrowserRange = await fetchBinaryResponse(
    browserDownloadUrl,
    {
      token: browserToken,
      range: `bytes=${browserDownloadDescriptor.byteSize}-` +
        `${browserDownloadDescriptor.byteSize + 1}`,
    },
  )
  assert.equal(invalidBrowserRange.status, 416)
  assert.equal(
    invalidBrowserRange.headers.get('content-range'),
    `bytes */${browserDownloadDescriptor.byteSize}`,
  )
  const wrongDecisionDownloadUrl = new URL(browserDownloadUrl)
  wrongDecisionDownloadUrl.searchParams.set(
    'expectedQualityDecisionHash',
    sha256Text('wrong-browser-quality-decision'),
  )
  const wrongDecisionDownload = await fetchBinaryResponse(
    wrongDecisionDownloadUrl,
    { token: browserToken, range: 'bytes=0-31' },
  )
  assert.equal(wrongDecisionDownload.status, 403)
  const crossUserDownload = await fetchBinaryResponse(
    browserDownloadUrl,
    { token: otherUserBrowserToken, range: 'bytes=0-31' },
  )
  assert.equal(crossUserDownload.status, 403)
  assert.equal(privateDownloadFile.publicUrlCreated, false)
  assert.equal(privateDownloadFile.externalDownloadLinkCreated, false)
  assert.equal(privateDownloadFile.productReady, false)
  assert.equal(privateDownloadFile.productionReady, false)

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const acceptedDeliveryReplay =
    await deliveryDownloadService.recordQualityDecision({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
      packageRecordId: delivery.package.identity.packageRecordId,
      idempotencyKey: 'accept-canonical-customer-delivery-quality',
      decisionRequest: acceptedDecisionRequest,
    })
  assert.equal(acceptedDeliveryReplay.disposition, 'exact_replay')
  assert.equal(
    acceptedDeliveryReplay.decisionRecord.recordHash,
    acceptedDelivery.decisionRecord.recordHash,
  )
  assert.equal(
    acceptedDeliveryReplay.download?.terminal.terminalHash,
    acceptedDelivery.download.terminal.terminalHash,
  )
  assert.equal(
    acceptedDeliveryReplay.download?.costEvidence.evidenceHash,
    acceptedDelivery.download.costEvidence.evidenceHash,
  )
  assert.equal(
    acceptedDeliveryReplay.download?.queueAggregate.aggregateHash,
    acceptedDelivery.download.queueAggregate.aggregateHash,
  )
  const postDecisionReview = await deliveryDownloadService.inspectQualityReview({
    workspaceId,
    approvedPlanSnapshotId: snapshotId,
    packageRecordId: delivery.package.identity.packageRecordId,
  })
  assert.equal(postDecisionReview.status, 'quality_decision_already_recorded')
  assert.equal(
    postDecisionReview.decisionRecord?.decision.decisionHash,
    acceptedDelivery.decisionRecord.decision.decisionHash,
  )
  assert.equal(
    postDecisionReview.readiness.authenticatedQualityDecisionRecorded,
    true,
  )
  assert.equal(postDecisionReview.readiness.privateDownloadExecutionAuthorized, true)
  assert.equal(postDecisionReview.readiness.privateDownloadReconciliationComplete, true)
  assert.equal(postDecisionReview.readiness.authenticatedPrivateByteStreamReady, true)
  const browserPostDecisionReviewResponse = await fetchJsonResponse(
    qualityReviewUrl,
    { token: browserToken },
  )
  assert.equal(browserPostDecisionReviewResponse.status, 200)
  const browserPostDecisionReview =
    professionalLongFormCustomerDeliveryBrowserReviewSchema.parse(
      browserPostDecisionReviewResponse.json.data
        ?.professionalLongFormCustomerDeliveryQualityReview,
    )
  assert.equal(
    browserPostDecisionReview.status,
    'quality_decision_already_recorded',
  )
  assert.equal(
    browserPostDecisionReview.decision?.decisionHash,
    acceptedDelivery.decisionRecord.decision.decisionHash,
  )
  assert.ok(browserPostDecisionReview.privateDownload)
  assert.equal(
    browserPostDecisionReview.readiness.authenticatedPrivateDownloadReady,
    true,
  )
  assert.equal(
    containsForbiddenBrowserAuthority(browserPostDecisionReview),
    false,
  )
  const unauthorizedContext: ServiceContext = {
    ...context,
    auth: {
      userId: 'user-outside-canonical-customer-delivery',
      accessToken: 'verified-outside-canonical-customer-delivery-token',
      isMockUser: false,
    },
  }
  await expectApiError(
    () => createCanonicalProfessionalLongFormCustomerDeliveryDownloadService(
      unauthorizedContext,
    ).readPrivateDownload({
      workspaceId,
      approvedPlanSnapshotId: snapshotId,
      packageRecordId: delivery.package.identity.packageRecordId,
      expectedQualityDecisionHash:
        acceptedDelivery.decisionRecord.decision.decisionHash,
      expectedMasterSha256: deliveryMuxExecution.mux.outputArtifact.sha256,
    }),
    'WORKSPACE_ACCESS_DENIED',
  )

  console.log(JSON.stringify({
    ok: true,
    schemaVersion:
      'canonical-professional-long-form-private-master-qa-smoke-v1',
    totalFrames,
    chunkCount: completed.color.validationArtifact.chunkCount,
    boundaryCount: completed.color.validationArtifact.boundaryCount,
    queueCompletedJobCount:
      privateMasterQa.queueAggregate.summary.completedJobCount,
    queueTotalJobCount: privateMasterQa.queueAggregate.summary.totalJobCount,
    colorInternalCostEvidenceHash: completed.color.costEvidence.evidenceHash,
    masterInternalCostEvidenceHash: master.assembly.costEvidence.evidenceHash,
    privateMasterQaInternalCostEvidenceHash:
      privateMasterQa.qa.costEvidence.evidenceHash,
    privateMasterSha256: master.assembly.runtimeEvidence.outputArtifact.sha256,
    colorExactReplayVerified: replayed.disposition === 'exact_replay',
    masterExactReplayVerified: masterReplay.disposition === 'exact_replay',
    privateMasterQaExactReplayVerified:
      privateMasterQaReplay.disposition === 'exact_replay',
    customerDeliveryPackageExactReplayVerified:
      deliveryPristineReplay.disposition === 'exact_replay',
    customerDeliveryRootExactReplayVerified:
      deliveryRootReplay.terminal.terminalHash ===
        deliveryRootExecution.terminal.terminalHash,
    customerDeliveryFirstH264ExactReplayVerified:
      deliveryH264Replay.h264.terminal.terminalHash ===
        deliveryH264Execution.h264.terminal.terminalHash,
    customerDeliveryFirstH264QaExactReplayVerified:
      deliveryH264QaReplay.qa.terminal.terminalHash ===
        deliveryH264QaExecution.qa.terminal.terminalHash,
    customerDeliveryEveryH264AndQaExactReplayVerified:
      deliveryH264SeriesReplay.evidenceHash ===
        deliveryH264Series.evidenceHash,
    customerDeliveryMuxExactReplayVerified:
      deliveryMuxReplay.mux.terminal.terminalHash ===
        deliveryMuxExecution.mux.terminal.terminalHash,
    privateMasterQaCompleted: true,
    privateReviewGraphComplete: true,
    customerDeliveryPackageJobCount:
      delivery.package.graph.summary.totalJobCount,
    customerDeliveryPackageHash: delivery.package.packageHash,
    customerDeliveryWorkGraphHash: delivery.package.graph.workGraphHash,
    customerDeliveryQueueAggregateHash:
      decodedQaReplay.queueAggregate.aggregateHash,
    customerDeliveryPackagePrepared: true,
    customerDeliveryRootCompleted: true,
    customerDeliveryFirstH264Completed: true,
    customerDeliveryFirstH264Sha256:
      deliveryH264Execution.h264.outputArtifact.sha256,
    customerDeliveryFirstH264InternalCostEvidenceHash:
      deliveryH264Execution.h264.costEvidence.evidenceHash,
    customerDeliveryFirstH264QaArtifactHash:
      deliveryH264QaExecution.qa.artifact.qaHash,
    customerDeliveryFirstH264QaInternalCostEvidenceHash:
      deliveryH264QaExecution.qa.costEvidence.evidenceHash,
    customerDeliveryH264ChunkCount:
      deliveryH264Series.h264Chunks.length,
    customerDeliveryH264QaCount:
      deliveryH264Series.independentQa.length,
    customerDeliverySecondH264Sha256:
      deliveryH264Series.h264Chunks[1]?.outputArtifact.sha256,
    customerDeliverySecondH264QaArtifactHash:
      deliveryH264Series.independentQa[1]?.artifact.qaHash,
    customerDeliveryAllMuxDependenciesSatisfied: true,
    customerDeliveryIndependentH264QaCompleted: true,
    customerDeliveryMasterCreated: true,
    customerDeliveryMasterSha256:
      deliveryMuxExecution.mux.outputArtifact.sha256,
    customerDeliveryMuxInternalCostEvidenceHash:
      deliveryMuxExecution.mux.costEvidence.evidenceHash,
    customerDeliveryDecodedVideoQaCompleted: true,
    customerDeliveryDecodedAudioQaCompleted: true,
    customerDeliveryDecodedVideoQaObjectiveOutcome:
      decodedQaReplay.videoQa.objectiveEvidence.outcome,
    customerDeliveryDecodedAudioQaObjectiveOutcome:
      decodedQaReplay.audioQa.objectiveEvidence.outcome,
    customerDeliveryDecodedQaQualityDisposition:
      decodedQaReplay.qualityDisposition,
    customerDeliveryDecodedVideoQaInternalCostEvidenceHash:
      decodedQaReplay.videoQa.costEvidence.evidenceHash,
    customerDeliveryDecodedAudioQaInternalCostEvidenceHash:
      decodedQaReplay.audioQa.costEvidence.evidenceHash,
    customerDeliveryDecodedQaExactReplayVerified: true,
    customerDeliveryQualityReviewPacketHash:
      qualityReview.reviewPacket.packetHash,
    customerDeliveryQualityDecisionHash:
      acceptedDelivery.decisionRecord.decision.decisionHash,
    customerDeliveryPrivateDownloadInternalCostEvidenceHash:
      acceptedDelivery.download.costEvidence.evidenceHash,
    customerDeliveryPrivateDownloadDeliveryId:
      acceptedDelivery.download.artifact.identity.privateDownloadDeliveryId,
    customerDeliveryPrivateDownloadReconciled: true,
    customerDeliveryAuthenticatedPrivateByteStreamVerified: true,
    customerDeliveryBrowserSafeReviewReceiptVerified: true,
    customerDeliveryPreDecisionAuthenticatedRangeVerified: true,
    customerDeliveryBrowserDecisionAndExactReplayVerified: true,
    customerDeliveryBrowserCrossUserDenialVerified: true,
    customerDeliveryBrowserPrivateDownloadRangeVerified: true,
    customerDeliveryBrowserNoSecondEstimateChargeOrCreditPromptVerified: true,
    customerDeliveryPrivateDownloadExactReplayVerified: true,
    customerDeliveryFinalQueueCompletedJobCount:
      acceptedDelivery.download.queueAggregate.summary.completedJobCount,
    customerDeliveryFinalQueueAggregateHash:
      acceptedDelivery.download.queueAggregate.aggregateHash,
    exportExecutionAuthorized: false,
    productReady: false,
    productionReady: false,
  }, null, 2))
} finally {
  if (httpServer) await closeServer(httpServer)
  await rm(localStorageRoot, { recursive: true, force: true })
}

function createContext(): ServiceContext {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    SUPABASE_URL: 'https://canonical-color-smoke.supabase.co',
    SUPABASE_ANON_KEY: 'canonical-color-smoke-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'canonical-color-smoke-test-service-role',
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
    REEDITPRO_INTERNAL_SERVICE_TOKEN:
      'rp-canonical-color-smoke-test-only-8Kq4Yp2Ns6Vm9Tx3',
    LOCAL_STORAGE_ROOT: localStorageRoot,
  })
  return {
    env,
    clients: { admin: createMembershipAdminClient(), public: null },
    requestId: 'canonical-professional-long-form-cross-chunk-color-smoke',
    auth: {
      userId,
      accessToken: 'verified-canonical-color-smoke-token',
      isMockUser: false,
    },
  }
}

async function preparePlanningInputAuthority(
  context: ServiceContext,
  projectId: string,
) {
  const service = createExactEditPreferenceService(context)
  const initialized = await service.initialize({
    workspaceId,
    projectId,
    editSessionId,
    idempotencyKey: 'initialize-canonical-color-preferences',
  })
  const updated = await service.updateCurrent({
    workspaceId,
    projectId,
    editSessionId,
    expectedRevision: initialized.preferenceRecord.recordRevision,
    patch: {
      editLevel: 'basic',
      targetPlatform: 'youtube',
      cleanupPreference: 'balanced_cleanup',
    },
    idempotencyKey: 'update-canonical-color-preferences',
  })
  const evidence = await service.recordPlanningEvidence({
    workspaceId,
    projectId,
    editSessionId,
    expectedRevision: updated.preferenceRecord.recordRevision,
    sourcePreparation: {
      status: 'ready',
      evidenceHash: sha256Text('canonical-color-source-preparation-ready'),
    },
    frameConfirmation: {
      status: 'confirmed',
      aspectRatio: '16:9',
      confirmationId: 'canonical-color-frame-confirmation',
    },
    idempotencyKey: 'record-canonical-color-planning-evidence',
  })
  return {
    exactEditPreference: {
      recordRevision: evidence.preferenceRecord.recordRevision,
      preferenceRevision: evidence.preferenceRecord.preferenceRevision,
      preferenceFingerprintSha256: exactEditPreferenceFingerprint(
        evidence.preferenceRecord.values,
      ),
    },
    preferenceApplication: {
      status: 'not_selected' as const,
      applicationVersion: 0 as const,
    },
    editBrief: { status: 'not_used' as const },
  }
}

interface SourceFixture {
  expectation: SourceMediaAuthorityExpectation
  candidate: SourceBindingManifestCandidate
  sourceSequence: PublishCanonicalEditPlanBody[
    'canonicalPlan'
  ]['components']['sourceSequence']
}

async function prepareSourceMediaAuthority(
  context: ServiceContext,
  projectId: string,
): Promise<SourceFixture> {
  const uploadService = createUploadService(context)
  const sourceSequence: SourceFixture['sourceSequence'] = []
  const durationSeconds = sourceFrames / fps
  const baseSourcePath = join(localStorageRoot, 'fixture-color-source-base.mp4')
  const generatedBase = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `color=c=0x174EA6:s=3840x2160:r=${fps}`,
    '-f', 'lavfi', '-i',
    `sine=frequency=440:sample_rate=48000:duration=${durationSeconds}`,
    '-map', '0:v:0', '-map', '1:a:0', '-frames:v', String(sourceFrames),
    '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
    '-x264-params',
    `keyint=${sourceFrames}:min-keyint=${sourceFrames}:scenecut=0:open-gop=0:colorprim=bt709:transfer=bt709:colormatrix=bt709`,
    '-bf', '0', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', String(durationSeconds), '-movflags', '+faststart',
    '-threads', '1', '-y', baseSourcePath,
  ], { encoding: 'utf8' })
  assert.equal(generatedBase.status, 0, generatedBase.stderr)
  const baseBytes = await readFile(baseSourcePath)
  await rm(baseSourcePath, { force: true })
  for (let index = 0; index < sourceCount; index += 1) {
    const bytes = Buffer.from(baseBytes)
    const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
    const created = await uploadService.createUploadIntent({
      workspaceId,
      projectId,
      uploadPurpose: 'source_media',
      originalFileName: `canonical-color-source-${index + 1}.mp4`,
      mimeType: 'video/mp4',
      expectedSizeBytes: bytes.byteLength,
      checksumSha256,
    })
    await uploadService.uploadLocalObject(
      created.uploadIntent.id,
      workspaceId,
      bytes,
      'video/mp4',
      bytes.byteLength,
    )
    const finalized = await uploadService.finalizeUploadIntent({
      workspaceId,
      uploadIntentId: created.uploadIntent.id,
    })
    sourceSequence.push({
      sourceSequenceItemId: `source-${index + 1}`,
      mediaAssetId: finalized.mediaAsset.id,
      uploadedOrder: index + 1,
      checksumSha256,
      required: true,
    })
  }
  const candidate = (await createSourceMediaAuthorityService(context)
    .buildManifestCandidate({
      workspaceId,
      projectId,
      uploadPurpose: 'source_media',
      orderedItems: sourceSequence.map((item) => ({
        sourceSequenceItemId: item.sourceSequenceItemId,
        mediaAssetId: item.mediaAssetId,
        uploadedOrder: item.uploadedOrder,
        checksumSha256: item.checksumSha256!,
        required: item.required,
      })),
    })).sourceBindingManifestCandidate
  return {
    expectation: {
      authorityRevision: candidate.authorityRevision,
      authorityChecksumSha256: candidate.authorityChecksumSha256,
      sourceSequenceHash: candidate.sourceSequenceHash,
      candidateHash: candidate.candidateHash,
    },
    candidate,
    sourceSequence,
  }
}

function createCanonicalPlanBody(input: {
  projectId: string
  planningInputAuthority: Awaited<ReturnType<typeof preparePlanningInputAuthority>>
  sourceFixture: SourceFixture
}): PublishCanonicalEditPlanBody {
  const sourceRanges = buildSourceRanges(input.sourceFixture)
  const sourceCleanupDecisions = input.sourceFixture.sourceSequence.map((source) => ({
    decisionId: `cleanup-${source.sourceSequenceItemId}`,
    sourceSequenceItemId: source.sourceSequenceItemId,
    action: 'preserve' as const,
    startFrame: 0,
    endFrameExclusive: sourceFrames,
    reason: 'Preserve the exact bounded source for canonical color proof.',
    confidence: 1,
    meaningPreservationStatus: 'passed' as const,
    userReviewStatus: 'not_required' as const,
  }))
  const segments = sourceRanges.map((range, index) => ({
    segmentId: range.segmentId,
    startFrame: range.timelineStartFrame,
    endFrameExclusive: range.timelineEndFrameExclusive,
    operationIds: [`canonical-color-operation-${index + 1}`],
  }))
  const timingComponents =
    buildCanonicalProfessionalLongFormSourceLedTimingComponents({
      fps,
      frameRate: { numerator: 30, denominator: 1 },
      totalFrames,
      segments,
      sourceCleanupPlan: { status: 'confirmed', decisions: sourceCleanupDecisions },
      approvedHardCutCount: 1,
    })
  const professionalExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS,
    outputFps: fps,
    approvedAspectRatio: '16:9',
  })
  return {
    workspaceId,
    planningRequestId,
    planningInputAuthority: input.planningInputAuthority,
    sourceMediaAuthority: input.sourceFixture.expectation,
    canonicalPlan: {
      schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
      components: {
        compiledIntent: {
          goal: 'Create a bounded professional two-chunk 4K color proof.',
        },
        professionalEditingDirective: {
          pacing: 'source-led',
          mustFollowRules: ['Preserve meaning.', 'Use approved hard cuts.'],
        },
        confirmedSettings: {
          aspectRatio: '16:9',
          outputFrame: { width: 3_840, height: 2_160, fps },
          outputFramePurpose: 'private_canonical_4k_master_review',
          professionalExportCoverage,
          outputFrameConfirmed: true,
          sourceOrderConfirmed: true,
          sourceCleanupConfirmed: true,
          editLevel: 'basic',
          targetPlatform: 'youtube',
          preferenceSnapshotId: 'server-default-exact-edit-preferences-v1',
          preferenceRevision: 1,
        },
        sourceSequence: input.sourceFixture.sourceSequence.map((source) => ({
          ...source,
        })),
        sourceCleanupSummary: {
          status: 'confirmed',
          cleanupPreference: 'balanced_cleanup',
          trimValidationStatus: 'passed',
          meaningValidationStatus: 'passed',
          userReviewRequired: false,
        },
        sourceCleanupPlan: { status: 'confirmed', decisions: sourceCleanupDecisions },
        ...timingComponents,
        segments,
        visualAssetPlan: {
          assets: [],
          randomBrollAllowed: false,
          requiredPlaceholdersAllowedInFinal: false,
        },
        colorPipelinePlan: {
          status: 'planned',
          policy: 'source_bound_transform_plus_boundary_continuity_v1',
        },
        rendererPlan: {
          renderer: 'object_backed_chunk_graph_then_private_4k_finalizer',
          frameOwnedByRenderer: true,
          packageQueuePromotionRequired: true,
        },
        toolStrategyPlan: { toolIds: [], exactOperationIds: [] },
        qaPlan: {
          status: 'passed',
          checks: ['intent', 'timing', 'source_order', 'frame', 'chunk_qa'],
        },
        qaSummary: { status: 'passed', approvalBlocked: false },
        providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
        fallbackPolicy: {
          unapprovedFallbackAllowed: false,
          requiredChildFailureBlocksFinalization: true,
        },
      },
      estimate: {
        lineItems: [
          {
            lineKey: 'planning',
            label: 'Planning',
            category: 'planning',
            estimatedCredits: 5,
            removable: false,
            metadata: {},
          },
          {
            lineKey: 'long-form-object-graph',
            label: 'Professional long-form object execution planning',
            category: 'planning',
            estimatedCredits: 7,
            removable: false,
            metadata: {
              childExecutionIncludedInApprovedReservation: true,
              timingComplexityIncludedInApprovedEstimate: true,
              timingComplexityProfileId:
                PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
              timingComplexityLevel: 'simple',
            },
          },
          {
            lineKey: '4k-export-ceiling',
            label: '4K UHD render and export ceiling',
            category: 'render',
            estimatedCredits:
              professionalExportCoverage.maximumInternalToolCostCredits,
            removable: false,
            metadata: {
              requiresSeparateExportEstimate: false,
              allowsAdditionalExportCharge: false,
            },
          },
        ],
        fallbackAllowanceCredits: 3,
        validForSeconds: 3_600,
      },
      workItems: [
        authorityPreflightWorkItem({
          workItemKey: 'long-form-snapshot-preflight',
          workItemType: 'validate_approved_snapshot',
          operation: 'validate_long_form_snapshot_seed_manifest',
          outputKey: 'long-form-snapshot-preflight-evidence',
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
        }),
        authorityPreflightWorkItem({
          workItemKey: 'long-form-source-authority-preflight',
          workItemType: 'custom',
          operation: 'validate_long_form_source_range_authority',
          outputKey: 'long-form-source-authority-preflight-evidence',
          sourceSequenceItemIds: input.sourceFixture.sourceSequence.map((source) =>
            source.sourceSequenceItemId),
          sourceCleanupDecisionIds: sourceCleanupDecisions.map((decision) =>
            decision.decisionId),
        }),
        authorityPreflightWorkItem({
          workItemKey: 'long-form-estimate-frame-preflight',
          workItemType: 'custom',
          operation: 'validate_long_form_4k_estimate_and_frame_authority',
          outputKey: 'long-form-estimate-frame-preflight-evidence',
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
        }),
      ],
    },
  }
}

function createSeedDraft(input: {
  projectId: string
  sourceFixture: SourceFixture
}) {
  return {
    schemaVersion: CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION,
    identity: {
      workspaceId,
      projectId: input.projectId,
      editSessionId,
      planningRequestId,
    },
    runtimeRegion: 'us-east1' as const,
    confirmedOutputFrame: {
      frameTemplateId: 'landscape-16x9-uhd-v1',
      width: 3_840,
      height: 2_160,
      confirmed: true as const,
      deliveryCeilingProfileId: 'uhd_2160_4k_ceiling_v1' as const,
      frameRate: { profileId: 'fps_30' as const, numerator: 30, denominator: 1 },
    },
    totalFrames,
    sourceRanges: buildSourceRanges(input.sourceFixture),
    executionPolicy: {
      videoChunkPolicy: 'object_backed_frame_exact_mezzanine_v1' as const,
      audioPolicy: 'single_continuous_timeline_mix_v1' as const,
      colorPolicy: 'source_bound_transform_plus_boundary_continuity_v1' as const,
      transitionPolicy: 'approved_hard_cuts_only_v1' as const,
      objectResidencyPolicy: 'single_region_no_cross_region_copy_v1' as const,
      finalizationPolicy: 'compatible_object_mezzanine_concat_or_block_v1' as const,
      requiredAssetPlaceholderPolicy: 'forbidden_in_final_v1' as const,
    },
    approvalAndCostBoundary: {
      originalApprovedFourKEstimateReused: true as const,
      originalApprovedReservationReused: true as const,
      secondExportEstimateAllowed: false as const,
      secondExportChargeAllowed: false as const,
      attemptLevelInternalProductionCostEvidenceRequired: true as const,
      customerCommercialAuthorityIncluded: false as const,
    },
  }
}

function buildSourceRanges(sourceFixture: SourceFixture) {
  return sourceFixture.sourceSequence.map((source, index) => {
    const binding = sourceFixture.candidate.bindings.find((candidate) =>
      candidate.sourceSequenceItemId === source.sourceSequenceItemId)
    assert.ok(binding)
    return {
      segmentId: `canonical-color-segment-${index + 1}`,
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: binding.mediaAssetId,
      sourceObjectGeneration: binding.generation ?? '1',
      sourceObjectRegion: 'us-east1' as const,
      sourceByteLength: binding.sizeBytes,
      sourceSha256: binding.checksumSha256,
      sourceCleanupDecisionId: `cleanup-${source.sourceSequenceItemId}`,
      sourceStartFrame: 0,
      sourceEndFrameExclusive: sourceFrames,
      timelineStartFrame: index * sourceFrames,
      timelineEndFrameExclusive: (index + 1) * sourceFrames,
      editorialBoundaryBefore:
        index === 0 ? 'timeline_start' as const : 'approved_hard_cut' as const,
    }
  })
}

function authorityPreflightWorkItem(input: {
  workItemKey: string
  workItemType: 'validate_approved_snapshot' | 'custom'
  operation: string
  outputKey: string
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
}): CanonicalWorkItemInput {
  return {
    workItemKey: input.workItemKey,
    workItemType: input.workItemType,
    workerClass: 'authority_worker',
    executionInput: { operation: input.operation, executionAuthorized: false },
    sourceSequenceItemIds: input.sourceSequenceItemIds,
    sourceCleanupDecisionIds: input.sourceCleanupDecisionIds,
    expectedOutputs: [{
      outputKey: input.outputKey,
      artifactType: 'authority_validation_evidence',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [],
      timingIds: [],
      rendererLayerIds: [],
    }],
    dependencyKeys: [],
    approvedToolIds: [],
    providerExecutionMode: 'none',
    fallbackPolicy: {
      policy: 'block_before_long_form_child_derivation',
      automaticFallbackAuthorized: false,
    },
    maxAttempts: 1,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 0,
    required: true,
  }
}

function createMembershipAdminClient(): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected canonical color smoke table: ${tableName}`)
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
            selectedUserId === userId
          return {
            data: allowed
              ? { workspace_id: workspaceId, user_id: userId, role: 'owner' }
              : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

function createAuthPublicClient(): SupabaseClient {
  return {
    auth: {
      async getUser(token: string) {
        const resolvedUserId = token === 'verified-canonical-color-http-token'
          ? userId
          : token === 'verified-canonical-color-other-user-token'
            ? 'user-outside-canonical-customer-delivery'
            : null
        return resolvedUserId
          ? {
              data: {
                user: {
                  id: resolvedUserId,
                  email: `${resolvedUserId}@example.invalid`,
                },
              },
              error: null,
            }
          : {
              data: { user: null },
              error: { message: 'Invalid smoke token.' },
            }
      },
    },
  } as unknown as SupabaseClient
}

interface HttpJsonEnvelope {
  ok?: boolean
  data?: Record<string, unknown>
  error?: { code?: string; message?: string }
  warnings?: unknown[]
}

async function fetchJsonResponse(
  url: URL,
  options: { token?: string; origin?: string } = {},
): Promise<{ status: number; json: HttpJsonEnvelope; headers: Headers }> {
  const response = await fetch(url, {
    headers: {
      ...(options.token
        ? { authorization: `Bearer ${options.token}` }
        : {}),
      ...(options.origin ? { origin: options.origin } : {}),
    },
  })
  return {
    status: response.status,
    json: await response.json() as HttpJsonEnvelope,
    headers: response.headers,
  }
}

async function postJsonResponse(
  url: URL,
  body: unknown,
  options: { token: string; idempotencyKey: string },
): Promise<{ status: number; json: HttpJsonEnvelope; headers: Headers }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${options.token}`,
      'content-type': 'application/json',
      'idempotency-key': options.idempotencyKey,
    },
    body: JSON.stringify(body),
  })
  return {
    status: response.status,
    json: await response.json() as HttpJsonEnvelope,
    headers: response.headers,
  }
}

async function fetchBinaryResponse(
  url: URL,
  options: { token?: string; range?: string; origin?: string } = {},
): Promise<{ status: number; bytes: Uint8Array; headers: Headers }> {
  const response = await fetch(url, {
    headers: {
      ...(options.token
        ? { authorization: `Bearer ${options.token}` }
        : {}),
      ...(options.range ? { range: options.range } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
    },
  })
  return {
    status: response.status,
    bytes: new Uint8Array(await response.arrayBuffer()),
    headers: response.headers,
  }
}

function listenServer(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

function serverPort(server: Server): number {
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected long-form HTTP smoke server to have a TCP port.')
  }
  return address.port
}

function containsForbiddenBrowserAuthority(
  value: unknown,
  key = '',
): boolean {
  if (/^(?:ownerUserId|approvedPlanId|qualityDecisionId|jobId|approvedWorkItemId|queueCompletionHash|canonicalResultHash|attemptInternalCostEvidenceHash|validationArtifactRef|objectiveEvidenceRef|deliveryPackageRef|deliveryPackageHash|placementManifestHash|queueDefinitionHash|reviewedQueueAggregateHash|recordHash|idempotencyKeyHash|decisionRequestHash|localFilePath|storageObjectPath|privateObjectIdentityHash|authorityRef|costEvidence)$/u.test(key)) {
    return true
  }
  if (Array.isArray(value)) {
    return value.some((entry) => containsForbiddenBrowserAuthority(entry))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([childKey, childValue]) =>
      containsForbiddenBrowserAuthority(childValue, childKey))
  }
  return false
}

async function expectApiError(
  action: () => Promise<unknown>,
  expectedCode: ApiError['code'],
): Promise<void> {
  let caught: unknown
  try { await action() } catch (error) { caught = error }
  assert.ok(caught instanceof ApiError && caught.code === expectedCode)
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
