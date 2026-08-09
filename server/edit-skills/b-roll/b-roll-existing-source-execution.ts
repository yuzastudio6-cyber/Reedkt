import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  persistCanonicalPrivateMediaArtifact,
  readCanonicalPrivateMediaArtifact,
} from '../../services/canonical-private-media-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../../services/private-edit-authority-store'
import {
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  type OfflineFfmpegExecutionResult,
  type OfflineFfprobeExecutionResult,
  type PrivateOfflineMediaBinaryRuntime,
} from '../../tool-execution/media-binary-execution'
import type { CanonicalWorkItemInput } from '../../validation/edit-planning-authority-schemas'
import {
  revalidateCanonicalBrollPlanAuthority,
} from '../../services/canonical-broll-plan-component-service'
import {
  CANONICAL_BROLL_SKILL_COMPONENT_KEY,
  assertCanonicalBrollComponentRefPropagation,
  type CanonicalBrollSkillPlanComponent,
} from './b-roll-canonical-plan-component'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import {
  sourceMediaArtifactV1Schema,
  type SourceMediaArtifactV1,
} from './b-roll-active-artifact-contracts'

export const BROLL_EXISTING_SOURCE_EXECUTION_VERSION =
  'b_roll_existing_source_execution_v1' as const

const blobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()

const artifactRefSchema = z.object({
  artifactType: z.string().trim().min(1).max(180),
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(16 * 1024 * 1024),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
}).strict()

const executionGateSchema = z.object({
  approvedPlanSnapshotId: z.string().trim().min(1).max(180),
  snapshotHash: skillSha256Schema,
  reservationId: z.string().trim().min(1).max(180),
  reservationStatus: z.enum(['reserved', 'partially_spent']),
  approved: z.literal(true),
  privateInternalExecution: z.literal(true),
  idempotencyKey: z.string().trim().min(1).max(240),
  componentRef: blobRefSchema,
  snapshotComponentRef: blobRefSchema,
  executionPackageComponentRef: blobRefSchema,
}).strict()

const resultCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_EXISTING_SOURCE_EXECUTION_VERSION),
  executionKey: skillSha256Schema,
  approvedPlanSnapshotId: z.string().trim().min(1).max(180),
  reservationId: z.string().trim().min(1).max(180),
  manifestRef: skillManifestReferenceSchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  workGraphHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  selectedSourceId: z.string().trim().min(1).max(180),
  selectedSourceArtifactRef: artifactRefSchema,
  sourceTrim: skillFrameRangeSchema,
  sourceInspectionRef: blobRefSchema,
  sourceInspectionHash: skillSha256Schema,
  normalizedCandidate: z.object({
    privateObjectIdentityHash: skillSha256Schema,
    sha256: skillSha256Schema,
    byteLength: z.number().int().positive().max(32 * 1024 * 1024),
    mimeType: z.literal('video/x-nut'),
    frameCount: z.number().int().positive().max(100_000_000),
    frameRate: z.number().int().positive().max(60),
    container: z.literal('nut'),
    videoCodec: z.literal('ffv1'),
  }).strict(),
  sourceQaReportRef: blobRefSchema,
  sourceQaReportHash: skillSha256Schema,
  layerManifestRef: blobRefSchema,
  layerManifestHash: skillSha256Schema,
  previewManifestRef: blobRefSchema,
  previewManifestHash: skillSha256Schema,
  providerRequestCount: z.literal(0),
  outsideAuthorizedRangeModified: z.literal(false),
  executionCompletedAt: z.string().datetime({ offset: true }),
}).strict()

export const brollExistingSourceExecutionReceiptSchema = resultCoreSchema.extend({
  resultHash: skillSha256Schema,
}).strict().superRefine((result, context) => {
  const { resultHash, ...core } = result
  if (hashSkillValue(core) !== resultHash) {
    context.addIssue({ code: 'custom', message: 'B-roll existing-source result hash is invalid.' })
  }
})

const executionResultSchema = z.object({
  receipt: brollExistingSourceExecutionReceiptSchema,
  receiptRef: blobRefSchema,
}).strict()

const inspectionStageCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_existing_source_inspection_stage_v1'),
  executionKey: skillSha256Schema,
  approvedPlanSnapshotId: z.string().trim().min(1).max(180),
  reservationId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  selectedSourceId: z.string().trim().min(1).max(180),
  selectedSourceSha256: skillSha256Schema,
  sourceInspectionRef: blobRefSchema,
  sourceInspectionHash: skillSha256Schema,
  ffprobeRequestHash: skillSha256Schema,
  ffprobeResultHash: skillSha256Schema,
  videoStreamCount: z.literal(1),
  audioStreamCount: z.number().int().nonnegative().max(32),
  privateInternalOnly: z.literal(true),
  providerRequestCount: z.literal(0),
}).strict()

export const brollExistingSourceInspectionStageSchema =
  inspectionStageCoreSchema.extend({
    inspectionStageHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    const { inspectionStageHash, ...core } = value
    if (hashSkillValue(core) !== inspectionStageHash) {
      context.addIssue({
        code: 'custom',
        message: 'B-roll source inspection stage hash is invalid.',
      })
    }
  })

const normalizationStageCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_existing_source_normalization_stage_v1'),
  executionKey: skillSha256Schema,
  approvedPlanSnapshotId: z.string().trim().min(1).max(180),
  reservationId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  selectedSourceId: z.string().trim().min(1).max(180),
  selectedSourceSha256: skillSha256Schema,
  sourceInspectionHash: skillSha256Schema,
  normalizedCandidate: resultCoreSchema.shape.normalizedCandidate,
  sourceQaReportRef: blobRefSchema,
  sourceQaReportHash: skillSha256Schema,
  ffmpegRequestHash: skillSha256Schema,
  ffmpegResultHash: skillSha256Schema,
  privateInternalOnly: z.literal(true),
  providerRequestCount: z.literal(0),
}).strict()

export const brollExistingSourceNormalizationStageSchema =
  normalizationStageCoreSchema.extend({
    normalizationStageHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    const { normalizationStageHash, ...core } = value
    if (hashSkillValue(core) !== normalizationStageHash) {
      context.addIssue({
        code: 'custom',
        message: 'B-roll source normalization stage hash is invalid.',
      })
    }
  })

export type BrollExistingSourceInspectionStage = z.infer<
  typeof brollExistingSourceInspectionStageSchema
>
export type BrollExistingSourceNormalizationStage = z.infer<
  typeof brollExistingSourceNormalizationStageSchema
>

export type BrollExistingSourceExecutionReceipt = z.infer<
  typeof brollExistingSourceExecutionReceiptSchema
>

export interface BrollProviderRequestObserver {
  getRequestCount(): number
}

export interface BrollExistingSourceExecutionInput {
  localStorageRoot: string
  gate: z.input<typeof executionGateSchema>
  component: CanonicalBrollSkillPlanComponent
  canonicalWorkItems: CanonicalWorkItemInput[]
  source: {
    sourceId: string
    artifactRef: z.input<typeof artifactRefSchema>
    mediaManifest: SourceMediaArtifactV1
    mimeType: 'video/mp4'
    bytes: Buffer
  }
  mediaRuntime: Pick<PrivateOfflineMediaBinaryRuntime, 'execute'>
  providerObserver: BrollProviderRequestObserver
  now?: () => string
}

export interface BrollExistingSourceExecutionPipeline {
  readonly executionKey: string
  readonly sourceTrim: z.infer<typeof skillFrameRangeSchema>
  inspect(): Promise<BrollExistingSourceInspectionStage>
  normalize(): Promise<BrollExistingSourceNormalizationStage>
  finalize(): Promise<{
    receipt: BrollExistingSourceExecutionReceipt
    receiptRef: AuthorityJsonBlobRef
    replayed: boolean
  }>
}

export async function executeBrollExistingSource(
  input: BrollExistingSourceExecutionInput,
): Promise<{
  receipt: BrollExistingSourceExecutionReceipt
  receiptRef: AuthorityJsonBlobRef
  replayed: boolean
}> {
  const pipeline = await createBrollExistingSourceExecutionPipeline(input)
  await pipeline.inspect()
  await pipeline.normalize()
  return pipeline.finalize()
}

/**
 * Splits the approved existing-source path into exact durable tool stages.
 * FFprobe runs only in inspect(), FFmpeg runs only in normalize(), and
 * finalize() is a byte-free control-plane projection. The legacy one-call
 * executor above remains wire-compatible by invoking the same stages in order.
 */
export async function createBrollExistingSourceExecutionPipeline(
  input: BrollExistingSourceExecutionInput,
): Promise<BrollExistingSourceExecutionPipeline> {
  const gate = executionGateSchema.parse(input.gate)
  assertCanonicalBrollComponentRefPropagation({
    planComponentRefs: { [CANONICAL_BROLL_SKILL_COMPONENT_KEY]: gate.componentRef },
    snapshotComponentRefs: { [CANONICAL_BROLL_SKILL_COMPONENT_KEY]: gate.snapshotComponentRef },
    executionPackageComponentRefs: {
      [CANONICAL_BROLL_SKILL_COMPONENT_KEY]: gate.executionPackageComponentRef,
    },
  })
  const persistedComponent = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.localStorageRoot,
    ref: gate.componentRef,
  })
  if (
    Array.isArray(persistedComponent) ||
    stableAuthorityStringify(persistedComponent) !== stableAuthorityStringify(input.component)
  ) throw new Error('B-roll execution component does not match immutable plan lineage.')
  const authority = await revalidateCanonicalBrollPlanAuthority({
    localStorageRoot: input.localStorageRoot,
    component: input.component,
    canonicalWorkItems: input.canonicalWorkItems,
  })
  const assignment = authority.assignment!
  const context = authority.context!
  const plan = authority.plan!
  const workGraph = authority.workGraph!
  const source = artifactRefSchema.parse(input.source.artifactRef)
  const mediaManifest = sourceMediaArtifactV1Schema.parse(input.source.mediaManifest)
  assertSourceExecutionAuthority({
    assignment,
    context,
    plan,
    workGraph,
    sourceId: input.source.sourceId,
    source,
    mediaManifest,
  })
  assertSourceBytes(input.source.bytes, source, mediaManifest)
  const sourceTrim = plan.sourceTrim
  if (!sourceTrim) {
    throw new Error('B-roll existing-source execution lacks an approved trim.')
  }
  const executionKey = hashSkillValue({
    schemaVersion: BROLL_EXISTING_SOURCE_EXECUTION_VERSION,
    approvedPlanSnapshotId: gate.approvedPlanSnapshotId,
    snapshotHash: gate.snapshotHash,
    reservationId: gate.reservationId,
    componentHash: input.component.componentHash,
    sourceId: input.source.sourceId,
    sourceSha256: mediaManifest.objectSha256,
    idempotencyKeyHash: sha256Text(gate.idempotencyKey),
  })
  const indexPath = `b-roll/existing-source-executions/${executionKey.slice(0, 2)}/${executionKey}.json`
  const inspectionIndexPath =
    `b-roll/existing-source-inspections/${executionKey.slice(0, 2)}/${executionKey}.json`
  const normalizationIndexPath =
    `b-roll/existing-source-normalizations/${executionKey.slice(0, 2)}/${executionKey}.json`

  const inspect = async (): Promise<BrollExistingSourceInspectionStage> =>
    withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: `b-roll/locks/${executionKey}.inspect.lock`,
      operation: async () => {
        const existing = await readExistingInspectionStage(
          input.localStorageRoot,
          inspectionIndexPath,
        )
        if (existing) return existing
      const providerCountBefore = input.providerObserver.getRequestCount()
      if (!Number.isSafeInteger(providerCountBefore) || providerCountBefore < 0) {
        throw new Error('B-roll provider request observer is invalid.')
      }
      const sourceCommitment = {
        mimeType: input.source.mimeType,
        sourceByteLength: input.source.bytes.byteLength,
        sourceSha256: mediaManifest.objectSha256,
        sourceBytesBase64: input.source.bytes.toString('base64'),
      }
      const inspection = await input.mediaRuntime.execute({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffprobe',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        payload: {
          inspectionProfileId: 'source_intake_v1',
          countFrames: true,
          verifyDurationAndSync: true,
          emitMachineJsonOnly: true,
          ...sourceCommitment,
        },
      })
      if (!('resultJson' in inspection)) throw new Error('B-roll source inspection returned the wrong result type.')
      assertInspectionEvidence({
        inspection,
        sourceObjectSha256: mediaManifest.objectSha256,
      })
      const providerCountAfter = input.providerObserver.getRequestCount()
      if (providerCountAfter !== providerCountBefore) {
        throw new Error('Existing-source B-roll inspection attempted a provider request.')
      }
      const sourceInspection = hashedArtifact({
        schemaVersion: 'b_roll_source_inspection_v1',
        manifestRef: assignment.manifestRef,
        assignmentId: assignment.assignmentId,
        sourceId: input.source.sourceId,
        sourceSha256: mediaManifest.objectSha256,
        ffprobeRequestHash: inspection.evidence.requestEnvelopeSha256,
        ffprobeResultHash: inspection.resultJson.sha256,
        binaryVersion: inspection.evidence.binaryVersion,
        document: JSON.parse(
          inspection.resultJson.bytes.toString('utf8'),
        ) as Record<string, unknown>,
        privateInternalOnly: true,
      }, 'sourceInspectionHash')
      const sourceInspectionRef = await persistJson(
        input.localStorageRoot,
        sourceInspection,
      )
      const streams = Array.isArray(sourceInspection.document.streams)
        ? sourceInspection.document.streams as Array<Record<string, unknown>>
        : []
      const core = inspectionStageCoreSchema.parse({
        schemaVersion: 'b_roll_existing_source_inspection_stage_v1',
        executionKey,
        approvedPlanSnapshotId: gate.approvedPlanSnapshotId,
        reservationId: gate.reservationId,
        assignmentHash: assignment.assignmentHash,
        planHash: plan.planHash,
        selectedSourceId: input.source.sourceId,
        selectedSourceSha256: mediaManifest.objectSha256,
        sourceInspectionRef,
        sourceInspectionHash: sourceInspection.sourceInspectionHash,
        ffprobeRequestHash: inspection.evidence.requestEnvelopeSha256,
        ffprobeResultHash: inspection.resultJson.sha256,
        videoStreamCount: streams.filter((stream) =>
          stream.codec_type === 'video' || stream.codecType === 'video').length,
        audioStreamCount: streams.filter((stream) =>
          stream.codec_type === 'audio' || stream.codecType === 'audio').length,
        privateInternalOnly: true,
        providerRequestCount: 0,
      })
      const stage = brollExistingSourceInspectionStageSchema.parse({
        ...core,
        inspectionStageHash: hashSkillValue(core),
      })
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: inspectionIndexPath,
        content: Buffer.from(`${stableAuthorityStringify(stage)}\n`, 'utf8'),
      })
      return stage
    },
  })

  const normalize = async (): Promise<BrollExistingSourceNormalizationStage> => {
    const inspection = await inspect()
    return withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: `b-roll/locks/${executionKey}.normalize.lock`,
      operation: async () => {
        const existing = await readExistingNormalizationStage(
          input.localStorageRoot,
          normalizationIndexPath,
        )
        if (existing) return existing
        const providerCountBefore = input.providerObserver.getRequestCount()
        if (!Number.isSafeInteger(providerCountBefore) || providerCountBefore < 0) {
          throw new Error('B-roll provider request observer is invalid.')
        }
        const sourceCommitment = {
          mimeType: input.source.mimeType,
          sourceByteLength: input.source.bytes.byteLength,
          sourceSha256: mediaManifest.objectSha256,
          sourceBytesBase64: input.source.bytes.toString('base64'),
        }
        const normalized = await input.mediaRuntime.execute({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffmpeg',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        payload: {
          recipeProfileId: 'approved_trim_transcode_v1',
          timestampPolicy: 'normalize_from_zero',
          overwriteExistingArtifact: false,
          allowUnreviewedCodec: false,
          trimStartFrame: sourceTrim.startFrameInclusive,
          trimEndFrameExclusive: sourceTrim.endFrameExclusive,
          frameRate: sourceTrim.fps as 24 | 25 | 30 | 50 | 60,
          ...sourceCommitment,
        },
      })
      if (
        !('resultArtifact' in normalized) ||
        normalized.resultArtifact.mimeType !== 'video/x-nut'
      ) throw new Error('B-roll normalization returned the wrong private media type.')
      const providerCountAfter = input.providerObserver.getRequestCount()
      if (providerCountAfter !== providerCountBefore) {
        throw new Error('Existing-source B-roll normalization attempted a provider request.')
      }
      const frameCount = sourceTrim.endFrameExclusive - sourceTrim.startFrameInclusive
      assertNormalizationEvidence({
        normalized,
        sourceObjectSha256: mediaManifest.objectSha256,
        sourceTrim,
        frameCount,
      })
      const privateObjectIdentityHash = hashSkillValue({
        kind: 'b_roll_existing_source_normalized_candidate_v1',
        executionKey,
        resultSha256: normalized.resultArtifact.sha256,
      })
      await persistCanonicalPrivateMediaArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash,
        bytes: normalized.resultArtifact.bytes,
        expectedSha256: normalized.resultArtifact.sha256,
      })
      const sourceQaReport = hashedArtifact({
        schemaVersion: 'b_roll_source_qa_report_v1',
        manifestRef: assignment.manifestRef,
        assignmentId: assignment.assignmentId,
        sourceId: input.source.sourceId,
        sourceSha256: mediaManifest.objectSha256,
        normalizedCandidateSha256: normalized.resultArtifact.sha256,
        checks: {
          sourceChecksumVerified: true,
          sourceScopeVerified: true,
          sourceProvenanceRightsPrivacyVerified: true,
          decodableVideoStreamVerified: true,
          exactTrimFrameCountVerified: true,
          outputProbeVerified: true,
          outputCodecApproved: true,
          audioRemovedForCrossSkillHandoff: true,
          providerRequestsVerifiedZero: true,
        },
        status: 'passed',
      }, 'sourceQaReportHash')
      const sourceQaReportRef = await persistJson(
        input.localStorageRoot,
        sourceQaReport,
      )
      const core = normalizationStageCoreSchema.parse({
        schemaVersion: 'b_roll_existing_source_normalization_stage_v1',
        executionKey,
        approvedPlanSnapshotId: gate.approvedPlanSnapshotId,
        reservationId: gate.reservationId,
        assignmentHash: assignment.assignmentHash,
        planHash: plan.planHash,
        selectedSourceId: input.source.sourceId,
        selectedSourceSha256: mediaManifest.objectSha256,
        sourceInspectionHash: inspection.sourceInspectionHash,
        normalizedCandidate: {
          privateObjectIdentityHash,
          sha256: normalized.resultArtifact.sha256,
          byteLength: normalized.resultArtifact.byteLength,
          mimeType: normalized.resultArtifact.mimeType,
          frameCount,
          frameRate: sourceTrim.fps,
          container: 'nut',
          videoCodec: 'ffv1',
        },
        sourceQaReportRef,
        sourceQaReportHash: sourceQaReport.sourceQaReportHash,
        ffmpegRequestHash: normalized.evidence.requestEnvelopeSha256,
        ffmpegResultHash: normalized.resultArtifact.sha256,
        privateInternalOnly: true,
        providerRequestCount: 0,
      })
      const stage = brollExistingSourceNormalizationStageSchema.parse({
        ...core,
        normalizationStageHash: hashSkillValue(core),
      })
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: normalizationIndexPath,
        content: Buffer.from(`${stableAuthorityStringify(stage)}\n`, 'utf8'),
      })
      return stage
    },
  })
  }

  const finalize = async () => {
    const [inspection, normalization] = await Promise.all([
      inspect(),
      normalize(),
    ])
    return withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: `b-roll/locks/${executionKey}.finalize.lock`,
      operation: async () => {
      const existing = await readExistingResult(input.localStorageRoot, indexPath)
      if (existing) return { ...existing, replayed: true }
      const persistedNormalized = await readCanonicalPrivateMediaArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash:
          normalization.normalizedCandidate.privateObjectIdentityHash,
      })
      if (
        !persistedNormalized ||
        persistedNormalized.sha256 !== normalization.normalizedCandidate.sha256
      ) throw new Error('B-roll normalized source artifact is missing before finalization.')
      const layerManifest = hashedArtifact({
        schemaVersion: 'b_roll_remotion_layer_manifest_v1',
        manifestRef: assignment.manifestRef,
        assignmentId: assignment.assignmentId,
        planHash: plan.planHash,
        layerId: `broll-layer-${assignment.assignmentHash.slice(0, 12)}`,
        rendererOwner: 'render',
        visualOwner: plan.coordination.visualOwnership,
        authorizedRange: assignment.writeRangeAuthority.authorizedRange,
        sourceCandidate: {
          privateObjectIdentityHash:
            normalization.normalizedCandidate.privateObjectIdentityHash,
          sha256: normalization.normalizedCandidate.sha256,
          mimeType: normalization.normalizedCandidate.mimeType,
          frameCount: normalization.normalizedCandidate.frameCount,
          fps: sourceTrim.fps,
        },
        displayTreatment: plan.displayTreatment,
        speakerVisibilityIntent: plan.speakerVisibilityIntent,
        captionSafeBehavior: plan.captionSafeBehavior,
        entryIntent: plan.entryIntent,
        exitIntent: plan.exitIntent,
        finalCompositionOwnedByBroll: false,
        outsideAuthorizedRangeModified: false,
      }, 'layerManifestHash')
      const previewManifest = hashedArtifact({
        schemaVersion: 'b_roll_source_trim_preview_v1',
        manifestRef: assignment.manifestRef,
        assignmentId: assignment.assignmentId,
        previewMode: 'private_source_trim_window',
        sourceArtifactRef: source,
        sourceMimeType: 'video/mp4',
        sourceTrim,
        timelineRange: assignment.writeRangeAuthority.authorizedRange,
        normalizedCandidateSha256: normalization.normalizedCandidate.sha256,
        isolatedSourcePlaybackReady: true,
        compositeRemotionPreviewRequired: true,
        privateInternalOnly: true,
        outsideAuthorizedRangeModified: false,
      }, 'previewManifestHash')
      const [layerManifestRef, previewManifestRef] =
        await Promise.all([
          persistJson(input.localStorageRoot, layerManifest),
          persistJson(input.localStorageRoot, previewManifest),
        ])
      const core = resultCoreSchema.parse({
        schemaVersion: BROLL_EXISTING_SOURCE_EXECUTION_VERSION,
        executionKey,
        approvedPlanSnapshotId: gate.approvedPlanSnapshotId,
        reservationId: gate.reservationId,
        manifestRef: assignment.manifestRef,
        assignmentId: assignment.assignmentId,
        assignmentHash: assignment.assignmentHash,
        planHash: plan.planHash,
        workGraphHash: workGraph.workGraphHash,
        authorizedRange: assignment.writeRangeAuthority.authorizedRange,
        selectedSourceId: input.source.sourceId,
        selectedSourceArtifactRef: source,
        sourceTrim,
        sourceInspectionRef: inspection.sourceInspectionRef,
        sourceInspectionHash: inspection.sourceInspectionHash,
        normalizedCandidate: normalization.normalizedCandidate,
        sourceQaReportRef: normalization.sourceQaReportRef,
        sourceQaReportHash: normalization.sourceQaReportHash,
        layerManifestRef,
        layerManifestHash: layerManifest.layerManifestHash,
        previewManifestRef,
        previewManifestHash: previewManifest.previewManifestHash,
        providerRequestCount: 0,
        outsideAuthorizedRangeModified: false,
        executionCompletedAt: (input.now ?? (() => new Date().toISOString()))(),
      })
      const receipt = brollExistingSourceExecutionReceiptSchema.parse({
        ...core,
        resultHash: hashSkillValue(core),
      })
      const receiptRef = await persistJson(input.localStorageRoot, receipt)
      const stored = executionResultSchema.parse({ receipt, receiptRef })
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: indexPath,
        content: Buffer.from(`${stableAuthorityStringify(stored)}\n`, 'utf8'),
      })
      return { ...stored, replayed: false }
    },
  })
  }

  return Object.freeze({
    executionKey,
    sourceTrim,
    inspect,
    normalize,
    finalize,
  })
}

function assertSourceExecutionAuthority(input: {
  assignment: NonNullable<Awaited<ReturnType<typeof revalidateCanonicalBrollPlanAuthority>>['assignment']>
  context: NonNullable<Awaited<ReturnType<typeof revalidateCanonicalBrollPlanAuthority>>['context']>
  plan: NonNullable<Awaited<ReturnType<typeof revalidateCanonicalBrollPlanAuthority>>['plan']>
  workGraph: NonNullable<Awaited<ReturnType<typeof revalidateCanonicalBrollPlanAuthority>>['workGraph']>
  sourceId: string
  source: z.infer<typeof artifactRefSchema>
  mediaManifest: SourceMediaArtifactV1
}): void {
  const { assignment, context, plan, workGraph, source, sourceId, mediaManifest } = input
  const selected = context.sourceCandidates.find((candidate) =>
    candidate.sourceId === sourceId)
  const timelineDuration = assignment.writeRangeAuthority.authorizedRange.endFrameExclusive -
    assignment.writeRangeAuthority.authorizedRange.startFrameInclusive
  const sourceDuration = plan.sourceTrim
    ? plan.sourceTrim.endFrameExclusive - plan.sourceTrim.startFrameInclusive
    : 0
  if (
    !['use_existing_project_clip', 'use_uploaded_user_asset'].includes(plan.decision) ||
    !['existing_source', 'approved_user_asset'].includes(workGraph.route) ||
    plan.providerRequestPlanned ||
    workGraph.workItems.some((item) => item.providerRouteId !== undefined) ||
    plan.sourceCandidateId !== sourceId ||
    !plan.sourceArtifactRef ||
    hashSkillValue(plan.sourceArtifactRef) !== hashSkillValue(source) ||
    source.ownerUserId !== assignment.ownerUserId ||
    source.workspaceId !== assignment.workspaceId ||
    source.projectId !== assignment.projectId ||
    source.artifactType !== 'source_media_artifact_v1' ||
    source.sha256 !== hashSkillValue(mediaManifest) ||
    mediaManifest.sourceId !== sourceId ||
    mediaManifest.ownerUserId !== assignment.ownerUserId ||
    mediaManifest.workspaceId !== assignment.workspaceId ||
    mediaManifest.projectId !== assignment.projectId ||
    mediaManifest.mimeType !== 'video/mp4' ||
    !mediaManifest.provenanceVerified ||
    !mediaManifest.rightsApproved ||
    !mediaManifest.privacyApproved ||
    !plan.sourceTrim ||
    ![24, 25, 30, 50, 60].includes(plan.sourceTrim.fps) ||
    plan.sourceTrim.fps !== assignment.writeRangeAuthority.authorizedRange.fps ||
    sourceDuration !== timelineDuration ||
    !selected ||
    hashSkillValue(selected.artifactRef) !== hashSkillValue(source) ||
    !selected.sourceRange ||
    hashSkillValue(selected.sourceRange) !== hashSkillValue(plan.sourceTrim) ||
    !selected.provenanceVerified ||
    !selected.rightsApproved ||
    !selected.privacyApproved ||
    !selected.proofSafe ||
    !selected.approvedByUser
  ) throw new Error('B-roll existing-source execution authority is invalid or provider-bearing.')
}

function assertSourceBytes(
  bytes: Buffer,
  source: z.infer<typeof artifactRefSchema>,
  mediaManifest: SourceMediaArtifactV1,
): void {
  if (
    bytes.byteLength !== mediaManifest.byteLength ||
    sha256Bytes(bytes) !== mediaManifest.objectSha256 ||
    source.sha256 !== hashSkillValue(mediaManifest) ||
    source.artifactType !== 'source_media_artifact_v1'
  ) throw new Error('B-roll source bytes do not match the approved source artifact.')
}

function assertInspectionEvidence(input: {
  inspection: OfflineFfprobeExecutionResult
  sourceObjectSha256: string
}): void {
  const inspection = input.inspection as unknown as {
    resultJson: { document: Record<string, unknown> }
    evidence: { sourceSha256: string; containerExitCode: number; oomKilled: boolean }
  }
  const streams = Array.isArray(inspection.resultJson.document.streams)
    ? inspection.resultJson.document.streams as Array<Record<string, unknown>>
    : []
  if (
    !streams.some((stream) => stream.codecType === 'video') ||
    inspection.evidence.sourceSha256 !== input.sourceObjectSha256 ||
    inspection.evidence.containerExitCode !== 0 ||
    inspection.evidence.oomKilled
  ) throw new Error('B-roll existing-source FFprobe inspection failed.')
}

function assertNormalizationEvidence(input: {
  normalized: OfflineFfmpegExecutionResult
  sourceObjectSha256: string
  sourceTrim: z.infer<typeof skillFrameRangeSchema>
  frameCount: number
}): void {
  const normalized = input.normalized as unknown as {
    evidence: {
      sourceSha256: string
      resultSha256: string
      semanticEvidence: Record<string, unknown>
      containerExitCode: number
      oomKilled: boolean
    }
    resultArtifact: { sha256: string }
  }
  const semantic = normalized.evidence.semanticEvidence
  if (
    normalized.evidence.sourceSha256 !== input.sourceObjectSha256 ||
    normalized.evidence.resultSha256 !== normalized.resultArtifact.sha256 ||
    normalized.evidence.containerExitCode !== 0 ||
    normalized.evidence.oomKilled ||
    semantic.outputFrameCount !== input.frameCount ||
    semantic.trimStartFrame !== input.sourceTrim.startFrameInclusive ||
    semantic.trimEndFrameExclusive !== input.sourceTrim.endFrameExclusive ||
    semantic.outputContainer !== 'nut' ||
    semantic.outputVideoCodec !== 'ffv1' ||
    semantic.outputProbeVerified !== true ||
    semantic.audioRemoved !== true
  ) throw new Error('B-roll existing-source FFmpeg normalization failed.')
}

function hashedArtifact<T extends Record<string, unknown>, K extends string>(
  core: T,
  hashKey: K,
): T & Record<K, string> {
  return { ...core, [hashKey]: hashSkillValue(core) } as T & Record<K, string>
}

async function persistJson(
  localStorageRoot: string,
  value: Record<string, unknown>,
): Promise<AuthorityJsonBlobRef> {
  return putPrivateAuthorityJsonBlob({ localStorageRoot, value, maxBytes: 2 * 1024 * 1024 })
}

async function readExistingInspectionStage(
  localStorageRoot: string,
  relativePath: string,
): Promise<BrollExistingSourceInspectionStage | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath,
  })
  if (!text) return undefined
  const stage = brollExistingSourceInspectionStageSchema.parse(JSON.parse(text))
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot,
    ref: stage.sourceInspectionRef,
  })
  if (
    Array.isArray(persisted) ||
    persisted.sourceInspectionHash !== stage.sourceInspectionHash
  ) throw new Error('B-roll source inspection stage lost its persisted evidence.')
  return stage
}

async function readExistingNormalizationStage(
  localStorageRoot: string,
  relativePath: string,
): Promise<BrollExistingSourceNormalizationStage | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath,
  })
  if (!text) return undefined
  const stage = brollExistingSourceNormalizationStageSchema.parse(
    JSON.parse(text),
  )
  const [persisted, persistedQa] = await Promise.all([
    readCanonicalPrivateMediaArtifact({
      localStorageRoot,
      privateObjectIdentityHash:
        stage.normalizedCandidate.privateObjectIdentityHash,
    }),
    readPrivateAuthorityJsonBlob({
      localStorageRoot,
      ref: stage.sourceQaReportRef,
    }),
  ])
  if (
    !persisted ||
    persisted.sha256 !== stage.normalizedCandidate.sha256 ||
    persisted.bytes.byteLength !== stage.normalizedCandidate.byteLength ||
    Array.isArray(persistedQa) ||
    persistedQa.sourceQaReportHash !== stage.sourceQaReportHash
  ) throw new Error('B-roll source normalization stage lost its media artifact.')
  return stage
}

async function readExistingResult(
  localStorageRoot: string,
  relativePath: string,
): Promise<{ receipt: BrollExistingSourceExecutionReceipt; receiptRef: AuthorityJsonBlobRef } | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath,
  })
  if (!text) return undefined
  const stored = executionResultSchema.parse(JSON.parse(text))
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot,
    ref: stored.receiptRef,
  })
  const receipt = brollExistingSourceExecutionReceiptSchema.parse(persisted)
  if (stableAuthorityStringify(receipt) !== stableAuthorityStringify(stored.receipt)) {
    throw new Error('B-roll existing-source replay index changed after commit.')
  }
  return stored
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
