import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { SupabaseClient } from '@supabase/supabase-js'

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

  console.log(JSON.stringify({
    ok: true,
    schemaVersion:
      'canonical-professional-long-form-color-and-master-assembly-smoke-v1',
    totalFrames,
    chunkCount: completed.color.validationArtifact.chunkCount,
    boundaryCount: completed.color.validationArtifact.boundaryCount,
    queueCompletedJobCount: master.queueAggregate.summary.completedJobCount,
    queueTotalJobCount: master.queueAggregate.summary.totalJobCount,
    colorInternalCostEvidenceHash: completed.color.costEvidence.evidenceHash,
    masterInternalCostEvidenceHash: master.assembly.costEvidence.evidenceHash,
    privateMasterSha256: master.assembly.runtimeEvidence.outputArtifact.sha256,
    colorExactReplayVerified: replayed.disposition === 'exact_replay',
    masterExactReplayVerified: masterReplay.disposition === 'exact_replay',
    privateMasterQaExecutionAuthorized: false,
    customerDeliveryMasterCreated: false,
    exportExecutionAuthorized: false,
    productReady: false,
    productionReady: false,
  }, null, 2))
} finally {
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
