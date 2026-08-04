import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  persistCanonicalPrivateMediaArtifact,
} from '../../services/canonical-private-media-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../../services/private-edit-authority-store'
import {
  readPrivateFileIfExistsWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  OFFLINE_BROLL_REMOTION_PREVIEW_PROXY_PROFILE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  type PrivateOfflineMediaBinaryRuntime,
} from '../../tool-execution/media-binary-execution'
import {
  buildOfflineRemotionFinalCompositionRequest,
  type OfflineRemotionBrollPreviewLayerPlanningPayload,
  type PrivateOfflineRemotionRenderRuntime,
} from '../../tool-execution/remotion-render-execution'
import {
  canonicalSkillJson,
  hashSkillValue,
} from '../core/skill-capability-manifest-hash'
import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from '../core/skill-assignment-schema'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import { trackGraphV1Schema } from './b-roll-artifact-types'
import {
  brollCandidateAttemptEvidenceSchema,
  type BrollCandidateAttemptEvidence,
} from './b-roll-candidate-attempt'
import {
  brollCandidateQaReportSchema,
  brollCandidateVersionSchema,
  type BrollCandidateQaReport,
  type BrollCandidateVersion,
} from './b-roll-candidate-qa'
import {
  brollExistingSourceExecutionReceiptSchema,
  type BrollExistingSourceExecutionReceipt,
} from './b-roll-existing-source-execution'
import {
  brollAssignmentCoreSchema,
  brollPlanArtifactSchema,
  brollPlanCoreSchema,
  brollSkillAssignmentSchema,
} from './b-roll-schemas'
import type {
  BrollDisplayTreatment,
  BrollPlanArtifact,
  BrollSkillAssignment,
} from './b-roll-contracts'

const blobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()

const normalizedArtifactSchema = z.object({
  privateObjectIdentityHash: skillSha256Schema,
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(32 * 1024 * 1024),
  mimeType: z.literal('video/x-nut'),
  frameCount: z.number().int().min(24).max(240),
  frameRate: z.union([z.literal(24), z.literal(30)]),
  audioRemoved: z.literal(true),
}).strict()

const selectedArtifactSchema = z.object({
  sourceRoute: z.enum([
    'existing_project_clip',
    'approved_user_asset',
    'gemini_omni_generated_candidate',
    'gemini_omni_edited_uploaded_video',
  ]),
  sourceId: z.string().trim().min(1).max(180).nullable(),
  sourceArtifactRef: editSkillArtifactReferenceSchema.nullable(),
  candidateSetId: skillSha256Schema.nullable(),
  candidateVersionId: skillSha256Schema.nullable(),
  candidateVersionNumber: z.union([z.literal(1), z.literal(2)]).nullable(),
  candidateVersionHash: skillSha256Schema.nullable(),
  audioReviewSource: z.object({
    artifactType: z.string().trim().min(1).max(180),
    privateObjectIdentityHash: skillSha256Schema.nullable(),
    sha256: skillSha256Schema,
    byteLength: z.number().int().positive().max(67_108_864),
  }).strict(),
  normalizedArtifact: normalizedArtifactSchema,
}).strict().superRefine((value, context) => {
  const candidateRoute = value.sourceRoute.startsWith('gemini_omni_')
  const candidateFields = [
    value.candidateSetId,
    value.candidateVersionId,
    value.candidateVersionNumber,
    value.candidateVersionHash,
  ]
  if (
    candidateFields.every((entry) => entry !== null) !== candidateRoute ||
    (value.sourceArtifactRef !== null) !== !candidateRoute ||
    (value.sourceId !== null) !== !candidateRoute
  ) context.addIssue({ code: 'custom', message: 'B-roll selected artifact route is inconsistent.' })
})

const handoffRefSchema = z.object({
  artifactType: z.enum([
    'b_roll_sound_handoff_v1',
    'b_roll_color_handoff_v1',
    'b_roll_transition_handoff_v1',
  ]),
  ref: blobRefSchema,
  artifactHash: skillSha256Schema,
  finalOwner: z.enum(['sound', 'color', 'transition']),
}).strict()

const layerManifestCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_remotion_layer_manifest_v1'),
  assignmentReference: z.object({
    assignmentId: z.string().trim().min(1).max(180),
    assignmentHash: skillSha256Schema,
    artifactRef: blobRefSchema,
  }).strict(),
  manifestRef: skillManifestReferenceSchema,
  planReference: z.object({
    planId: z.string().trim().min(1).max(180),
    planHash: skillSha256Schema,
    artifactRef: blobRefSchema,
  }).strict(),
  selectedArtifact: selectedArtifactSchema,
  exactTimelineRange: skillFrameRangeSchema,
  sourceTrim: skillFrameRangeSchema,
  crop: z.object({
    mode: z.literal('contain'),
    cropSafeSubjectArea: z.string().trim().min(1).max(1_000),
    finalCropOwner: z.literal('render'),
  }).strict(),
  scale: z.literal(1),
  position: z.object({
    mode: z.literal('absolute'),
    xPercent: z.union([z.literal(0), z.literal(50), z.literal(55), z.literal(60), z.literal(65)]),
    yPercent: z.union([z.literal(0), z.literal(6), z.literal(8), z.literal(45)]),
    widthPercent: z.union([z.literal(30), z.literal(34), z.literal(40), z.literal(50), z.literal(100)]),
    heightPercent: z.union([z.literal(30), z.literal(34), z.literal(45), z.literal(100)]),
    opacity: z.union([z.literal(0.45), z.literal(1)]),
  }).strict(),
  displayTreatment: z.enum([
    'full_frame_takeover', 'full_frame_cutaway', 'inset',
    'picture_in_picture', 'split_screen', 'partial_overlay',
    'background_layer',
  ]),
  speakerVisibilityIntent: z.enum(['preserve', 'temporarily_hidden', 'not_applicable']),
  captionSafeBehavior: z.object({
    directive: z.string().trim().min(1).max(2_000),
    captionOverlayRef: editSkillArtifactReferenceSchema,
    reservedZoneCount: z.number().int().nonnegative().max(100),
    collisionPolicy: z.literal('caption_reserved_zone_contract_v1'),
    captionLayerOrder: z.literal(100),
    finalOwner: z.literal('captions'),
    brollMayMutateCaptions: z.literal(false),
  }).strict(),
  layerOrder: z.union([z.literal(0), z.literal(10)]),
  audioDisposition: z.enum([
    'discard', 'retain_as_ambient_candidate',
    'extract_for_sound_skill_review', 'retain_source_audio',
  ]),
  transitionHandoff: handoffRefSchema,
  colorHandoff: handoffRefSchema,
  soundHandoff: handoffRefSchema,
  trackGraphRef: editSkillArtifactReferenceSchema.nullable(),
  outputQaRef: blobRefSchema,
  outputQaHash: skillSha256Schema,
  rendererOwner: z.literal('render'),
  finalCompositionOwnedByBroll: z.literal(false),
  privatePreviewOnly: z.literal(true),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export const brollRemotionLayerManifestSchema = layerManifestCoreSchema.extend({
  layerManifestHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { layerManifestHash, ...core } = value
  if (hashSkillValue(core) !== layerManifestHash) {
    context.addIssue({ code: 'custom', message: 'B-roll Remotion layer manifest hash is invalid.' })
  }
})

export type BrollRemotionLayerManifest = z.infer<
  typeof brollRemotionLayerManifestSchema
>

const integrationChecksSchema = z.object({
  exactAuthorizedRange: z.literal(true),
  noOutsideRangeModification: z.literal(true),
  primaryOwnership: z.literal(true),
  captionCollision: z.literal(true),
  transitionBoundary: z.literal(true),
  colorHandoff: z.literal(true),
  soundHandoff: z.literal(true),
  layerOrder: z.literal(true),
  visualDensity: z.literal(true),
  previewIntegrity: z.literal(true),
  resultLineage: z.literal(true),
}).strict()

const integrationQaCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_integration_qa_report_v1'),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  layerManifestHash: skillSha256Schema,
  previewSha256: skillSha256Schema,
  outputQaHash: skillSha256Schema,
  evidenceHashes: z.array(skillSha256Schema).min(6).max(32),
  checks: integrationChecksSchema,
  status: z.literal('passed'),
  privateInternalOnly: z.literal(true),
  productionQualified: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
  evaluatedAt: z.string().datetime({ offset: true }),
}).strict()

export const brollIntegrationQaReportSchema = integrationQaCoreSchema.extend({
  integrationQaHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { integrationQaHash, ...core } = value
  if (hashSkillValue(core) !== integrationQaHash) {
    context.addIssue({ code: 'custom', message: 'B-roll integration QA hash is invalid.' })
  }
})

export type BrollIntegrationQaReport = z.infer<typeof brollIntegrationQaReportSchema>

const costEvidenceSchema = z.object({
  providerCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  candidateInfrastructureCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  integrationInfrastructureCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  totalInternalCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  serviceFeeIncluded: z.literal(false),
  attemptCostEvidenceHashes: z.array(skillSha256Schema).max(2),
  costEvidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const core = {
    providerCostMicros: value.providerCostMicros,
    candidateInfrastructureCostMicros: value.candidateInfrastructureCostMicros,
    integrationInfrastructureCostMicros: value.integrationInfrastructureCostMicros,
    totalInternalCostMicros: value.totalInternalCostMicros,
    serviceFeeIncluded: value.serviceFeeIncluded,
    attemptCostEvidenceHashes: value.attemptCostEvidenceHashes,
  }
  if (
    value.totalInternalCostMicros !== value.providerCostMicros +
      value.candidateInfrastructureCostMicros +
      value.integrationInfrastructureCostMicros ||
    hashSkillValue(core) !== value.costEvidenceHash
  ) context.addIssue({ code: 'custom', message: 'B-roll integration cost evidence is invalid.' })
})

const resultReceiptCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_result_receipt_v1'),
  resultId: skillSha256Schema,
  assignmentReference: layerManifestCoreSchema.shape.assignmentReference,
  manifestRef: skillManifestReferenceSchema,
  planReference: layerManifestCoreSchema.shape.planReference,
  selectedArtifact: selectedArtifactSchema,
  exactTiming: skillFrameRangeSchema,
  layerManifestRef: blobRefSchema,
  layerManifestHash: skillSha256Schema,
  outputQaRef: blobRefSchema,
  outputQaHash: skillSha256Schema,
  integrationQaRef: blobRefSchema,
  integrationQaHash: skillSha256Schema,
  preview: z.object({
    previewArtifactIdentityHash: skillSha256Schema,
    sha256: skillSha256Schema,
    byteLength: z.number().int().positive().max(32 * 1024 * 1024),
    mimeType: z.literal('video/mp4'),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    frameRate: z.union([z.literal(24), z.literal(30)]),
    frameCount: z.number().int().positive().max(240),
    remotionRequestHash: skillSha256Schema,
    remotionAttestationHash: skillSha256Schema,
    privateInternalOnly: z.literal(true),
  }).strict(),
  handoffs: z.object({
    sound: handoffRefSchema,
    color: handoffRefSchema,
    transition: handoffRefSchema,
    captionsFinalOwner: z.literal('captions'),
    trackAllFinalOwner: z.literal('track_all'),
    renderFinalOwner: z.literal('render'),
  }).strict(),
  costEvidence: costEvidenceSchema,
  attemptHistory: z.array(z.object({
    attemptId: skillSha256Schema,
    candidateVersionNumber: z.union([z.literal(1), z.literal(2)]),
    attemptEvidenceHash: skillSha256Schema,
    costEvidenceHash: skillSha256Schema,
    verdict: z.enum(['accepted', 'accepted_after_normalization', 'needs_refinement']),
  }).strict()).max(2),
  selectedCandidateAutomatically: z.literal(false),
  generatedMediaTreatedAsVerifiedProof: z.literal(false),
  generatedAudioFinalMixAllowed: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
  privateInternalOnly: z.literal(true),
  completedAt: z.string().datetime({ offset: true }),
}).strict()

export const brollResultReceiptSchema = resultReceiptCoreSchema.extend({
  resultHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { resultHash, ...core } = value
  if (hashSkillValue(core) !== resultHash) {
    context.addIssue({ code: 'custom', message: 'B-roll result receipt hash is invalid.' })
  }
})

export type BrollResultReceipt = z.infer<typeof brollResultReceiptSchema>

type CandidateSelectionInput = {
  kind: 'candidate'
  candidateVersion: BrollCandidateVersion
  candidateVersionRef: AuthorityJsonBlobRef
  qaReport: BrollCandidateQaReport
  qaReportRef: AuthorityJsonBlobRef
  normalizedBytes: Buffer
  attemptHistory: BrollCandidateAttemptEvidence[]
}

type ExistingSourceSelectionInput = {
  kind: 'existing_source'
  receipt: BrollExistingSourceExecutionReceipt
  receiptRef: AuthorityJsonBlobRef
  normalizedBytes: Buffer
  attemptHistory: readonly []
}

export interface BrollRemotionIntegrationInput {
  localStorageRoot: string
  assignment: BrollSkillAssignment
  assignmentRef: AuthorityJsonBlobRef
  plan: BrollPlanArtifact
  planRef: AuthorityJsonBlobRef
  selection: CandidateSelectionInput | ExistingSourceSelectionInput
  captionOverlay: {
    reference: z.input<typeof editSkillArtifactReferenceSchema>
    bytes: Buffer
    reservedZoneCount: number
  }
  trackGraph?: {
    reference: z.input<typeof editSkillArtifactReferenceSchema>
    value: z.input<typeof trackGraphV1Schema>
  }
  mediaRuntime: Pick<PrivateOfflineMediaBinaryRuntime, 'execute'>
  remotionRuntime: Pick<PrivateOfflineRemotionRenderRuntime, 'execute'>
  integrationInfrastructureCostMicros: number
  idempotencyKey: string
  now?: () => string
}

export async function executeBrollRemotionIntegration(
  input: BrollRemotionIntegrationInput,
): Promise<{
  receipt: BrollResultReceipt
  receiptRef: AuthorityJsonBlobRef
  layerManifest: BrollRemotionLayerManifest
  layerManifestRef: AuthorityJsonBlobRef
  integrationQa: BrollIntegrationQaReport
  integrationQaRef: AuthorityJsonBlobRef
  replayed: boolean
}> {
  const assignment = brollSkillAssignmentSchema.parse(input.assignment)
  const plan = brollPlanArtifactSchema.parse(input.plan)
  assertPlanAuthority(assignment, plan)
  await assertAuthorityRef(input.localStorageRoot, input.assignmentRef, assignment)
  await assertAuthorityRef(input.localStorageRoot, input.planRef, plan)
  const caption = validateCaptionOverlay(input.captionOverlay, assignment)
  const trackGraphRef = validateTrackGraph(input.trackGraph, assignment, plan)
  const selection = await validateSelection(input.localStorageRoot, input.selection, assignment, plan)
  const durationFrames = assignment.writeRangeAuthority.authorizedRange.endFrameExclusive -
    assignment.writeRangeAuthority.authorizedRange.startFrameInclusive
  if (
    selection.selectedArtifact.normalizedArtifact.frameCount !== durationFrames ||
    selection.selectedArtifact.normalizedArtifact.frameRate !==
      assignment.writeRangeAuthority.authorizedRange.fps
  ) throw new Error('B-roll normalized selection does not match the exact authorized timing range.')
  if (
    !Number.isSafeInteger(input.integrationInfrastructureCostMicros) ||
    input.integrationInfrastructureCostMicros < 0 ||
    input.integrationInfrastructureCostMicros > 100_000_000 ||
    typeof input.idempotencyKey !== 'string' || input.idempotencyKey.length < 1 ||
    input.idempotencyKey.length > 240
  ) throw new Error('B-roll integration execution or cost authority is invalid.')
  const previewLayer = brollRemotionPreviewLayerForTreatment(plan.displayTreatment)
  const executionKey = hashSkillValue({
    domain: 'reeditpro:b-roll-remotion-integration:v1',
    assignmentHash: assignment.assignmentHash,
    planHash: plan.planHash,
    normalizedSha256: selection.selectedArtifact.normalizedArtifact.sha256,
    outputQaHash: selection.outputQaHash,
    captionSha256: caption.reference.sha256,
    trackGraphSha256: trackGraphRef?.sha256 ?? null,
    previewLayer,
    integrationInfrastructureCostMicros: input.integrationInfrastructureCostMicros,
    idempotencyKeyHash: sha256Text(input.idempotencyKey),
  })
  const indexPath = `b-roll/remotion-integrations/${executionKey.slice(0, 2)}/${executionKey}.json`
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: `b-roll/remotion-integrations/locks/${executionKey}.lock`,
    operation: async () => {
      const replay = await readIntegrationReplay(input.localStorageRoot, indexPath)
      if (replay) return { ...replay, replayed: true }
      const proxy = await input.mediaRuntime.execute({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffmpeg',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        payload: {
          recipeProfileId: OFFLINE_BROLL_REMOTION_PREVIEW_PROXY_PROFILE,
          timestampPolicy: 'normalize_from_zero',
          overwriteExistingArtifact: false,
          allowUnreviewedCodec: false,
          trimStartFrame: 0,
          trimEndFrameExclusive: durationFrames,
          frameRate: selection.selectedArtifact.normalizedArtifact.frameRate,
          outputContainer: 'matroska',
          outputCodec: 'libvpx-vp9',
          constantQuality: 12,
          outputPixelFormat: 'yuv420p',
          preserveAudio: false,
          metadataPolicy: 'strip_all',
          technicalProxyOnly: true,
          creativeColorTransformApplied: false,
          mimeType: 'video/x-nut',
          sourceByteLength: selection.normalizedBytes.byteLength,
          sourceSha256: selection.selectedArtifact.normalizedArtifact.sha256,
          sourceBytesBase64: selection.normalizedBytes.toString('base64'),
        },
      })
      if (
        !('resultArtifact' in proxy) ||
        proxy.resultArtifact.mimeType !== 'video/x-matroska' ||
        proxy.evidence.semanticEvidence.technicalProxyOnly !== true ||
        proxy.evidence.semanticEvidence.creativeColorTransformApplied !== false ||
        proxy.evidence.semanticEvidence.audioRemoved !== true ||
        proxy.evidence.semanticEvidence.outputFrameCount !== durationFrames
      ) throw new Error('B-roll Remotion preview proxy failed its exact non-creative contract.')
      const proxyIdentity = hashSkillValue({
        domain: 'reeditpro:b-roll-remotion-preview-proxy:v1',
        executionKey,
        normalizedSha256: selection.selectedArtifact.normalizedArtifact.sha256,
        proxySha256: proxy.resultArtifact.sha256,
      })
      await persistCanonicalPrivateMediaArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash: proxyIdentity,
        bytes: proxy.resultArtifact.bytes,
        expectedSha256: proxy.resultArtifact.sha256,
      })
      const [width, height] = previewDimensions(plan)
      const remotionRequest = buildOfflineRemotionFinalCompositionRequest({
        planningPayload: {
          compositionProfileId: 'approved_source_caption_final_v1',
          width,
          height,
          fps: selection.selectedArtifact.normalizedArtifact.frameRate,
          durationFrames,
          sourceStartFrame: 0,
          sourceEndFrameExclusive: durationFrames,
          sourceFit: 'contain',
          panelBackground: '#000000',
          audioPolicy: 'preserve_source',
          sourceMediaPolicy: 'approved_b_roll_qa_normalized_preview_proxy_v1',
          brollPreviewLayer: previewLayer,
          captionOverlayPolicy: 'approved_full_frame_rgba',
        },
        source: {
          mimeType: 'video/x-matroska',
          bytes: proxy.resultArtifact.bytes,
          sha256: proxy.resultArtifact.sha256,
        },
        captionOverlay: {
          mimeType: 'image/png',
          bytes: caption.bytes,
          sha256: caption.reference.sha256,
        },
      })
      const remotion = await input.remotionRuntime.execute(remotionRequest)
      assertRemotionResult(remotion, {
        width, height,
        fps: selection.selectedArtifact.normalizedArtifact.frameRate,
        frameCount: durationFrames,
      })
      const previewArtifactIdentityHash = hashSkillValue({
        domain: 'reeditpro:b-roll-private-preview:v1',
        executionKey,
        remotionArtifactSha256: remotion.artifact.sha256,
      })
      const previewRelativePath =
        `b-roll/remotion-integrations/previews/${previewArtifactIdentityHash}.mp4`
      await persistPrivatePreview(
        input.localStorageRoot,
        previewRelativePath,
        remotion.artifact.bytes,
        remotion.artifact.sha256,
      )
      const handoffs = await createCrossSkillHandoffs({
        localStorageRoot: input.localStorageRoot,
        assignment,
        plan,
        selection: selection.selectedArtifact,
        outputQaHash: selection.outputQaHash,
      })
      const layerCore = layerManifestCoreSchema.parse({
        schemaVersion: 'b_roll_remotion_layer_manifest_v1',
        assignmentReference: {
          assignmentId: assignment.assignmentId,
          assignmentHash: assignment.assignmentHash,
          artifactRef: input.assignmentRef,
        },
        manifestRef: assignment.manifestRef,
        planReference: {
          planId: plan.planId,
          planHash: plan.planHash,
          artifactRef: input.planRef,
        },
        selectedArtifact: selection.selectedArtifact,
        exactTimelineRange: assignment.writeRangeAuthority.authorizedRange,
        sourceTrim: selection.sourceTrim,
        crop: {
          mode: 'contain',
          cropSafeSubjectArea: plan.shotSpecification?.cropSafeSubjectArea ??
            'Preserve the approved source crop and all salient content.',
          finalCropOwner: 'render',
        },
        scale: 1,
        position: {
          mode: previewLayer.position,
          xPercent: previewLayer.xPercent,
          yPercent: previewLayer.yPercent,
          widthPercent: previewLayer.widthPercent,
          heightPercent: previewLayer.heightPercent,
          opacity: previewLayer.opacity,
        },
        displayTreatment: previewLayer.displayTreatment,
        speakerVisibilityIntent: plan.speakerVisibilityIntent,
        captionSafeBehavior: {
          directive: plan.captionSafeBehavior,
          captionOverlayRef: caption.reference,
          reservedZoneCount: caption.reservedZoneCount,
          collisionPolicy: 'caption_reserved_zone_contract_v1',
          captionLayerOrder: 100,
          finalOwner: 'captions',
          brollMayMutateCaptions: false,
        },
        layerOrder: previewLayer.layerOrder,
        audioDisposition: plan.audioDisposition,
        transitionHandoff: handoffs.transition,
        colorHandoff: handoffs.color,
        soundHandoff: handoffs.sound,
        trackGraphRef,
        outputQaRef: selection.outputQaRef,
        outputQaHash: selection.outputQaHash,
        rendererOwner: 'render',
        finalCompositionOwnedByBroll: false,
        privatePreviewOnly: true,
        outsideAuthorizedRangeModified: false,
      })
      const layerManifest = brollRemotionLayerManifestSchema.parse({
        ...layerCore,
        layerManifestHash: hashSkillValue(layerCore),
      })
      const layerManifestRef = await persistJson(input.localStorageRoot, layerManifest)
      const integrationQaCore = integrationQaCoreSchema.parse({
        schemaVersion: 'b_roll_integration_qa_report_v1',
        assignmentHash: assignment.assignmentHash,
        planHash: plan.planHash,
        layerManifestHash: layerManifest.layerManifestHash,
        previewSha256: remotion.artifact.sha256,
        outputQaHash: selection.outputQaHash,
        evidenceHashes: [
          assignment.assignmentHash,
          plan.planHash,
          selection.selectedArtifact.normalizedArtifact.sha256,
          selection.outputQaHash,
          proxy.resultArtifact.sha256,
          remotion.artifact.sha256,
          layerManifest.layerManifestHash,
          handoffs.sound.artifactHash,
          handoffs.color.artifactHash,
          handoffs.transition.artifactHash,
          ...(trackGraphRef ? [trackGraphRef.sha256] : []),
        ],
        checks: {
          exactAuthorizedRange: true,
          noOutsideRangeModification: true,
          primaryOwnership: true,
          captionCollision: true,
          transitionBoundary: true,
          colorHandoff: true,
          soundHandoff: true,
          layerOrder: true,
          visualDensity: true,
          previewIntegrity: true,
          resultLineage: true,
        },
        status: 'passed',
        privateInternalOnly: true,
        productionQualified: false,
        outsideAuthorizedRangeModified: false,
        evaluatedAt: (input.now ?? (() => new Date().toISOString()))(),
      })
      const integrationQa = brollIntegrationQaReportSchema.parse({
        ...integrationQaCore,
        integrationQaHash: hashSkillValue(integrationQaCore),
      })
      const integrationQaRef = await persistJson(input.localStorageRoot, integrationQa)
      const costEvidence = buildCostEvidence(
        selection.attemptHistory,
        input.integrationInfrastructureCostMicros,
      )
      const completedAt = (input.now ?? (() => new Date().toISOString()))()
      const resultId = hashSkillValue({
        domain: 'reeditpro:b-roll-result:v1',
        executionKey,
        layerManifestHash: layerManifest.layerManifestHash,
        integrationQaHash: integrationQa.integrationQaHash,
      })
      const resultCore = resultReceiptCoreSchema.parse({
        schemaVersion: 'b_roll_result_receipt_v1',
        resultId,
        assignmentReference: layerManifest.assignmentReference,
        manifestRef: assignment.manifestRef,
        planReference: layerManifest.planReference,
        selectedArtifact: selection.selectedArtifact,
        exactTiming: assignment.writeRangeAuthority.authorizedRange,
        layerManifestRef,
        layerManifestHash: layerManifest.layerManifestHash,
        outputQaRef: selection.outputQaRef,
        outputQaHash: selection.outputQaHash,
        integrationQaRef,
        integrationQaHash: integrationQa.integrationQaHash,
        preview: {
          previewArtifactIdentityHash,
          sha256: remotion.artifact.sha256,
          byteLength: remotion.artifact.byteLength,
          mimeType: 'video/mp4',
          width,
          height,
          frameRate: remotion.artifact.fps,
          frameCount: remotion.artifact.durationFrames,
          remotionRequestHash: remotion.evidence.requestEnvelopeSha256,
          remotionAttestationHash: remotion.attestation.attestationHash,
          privateInternalOnly: true,
        },
        handoffs: {
          sound: handoffs.sound,
          color: handoffs.color,
          transition: handoffs.transition,
          captionsFinalOwner: 'captions',
          trackAllFinalOwner: 'track_all',
          renderFinalOwner: 'render',
        },
        costEvidence,
        attemptHistory: selection.attemptHistory.map((attempt, index) => ({
          attemptId: attempt.attemptId,
          candidateVersionNumber: attempt.candidateVersionNumber,
          attemptEvidenceHash: attempt.attemptEvidenceHash,
          costEvidenceHash: attempt.cost.costEvidenceHash,
          verdict: index === selection.attemptHistory.length - 1
            ? selection.verdict
            : 'needs_refinement',
        })),
        selectedCandidateAutomatically: false,
        generatedMediaTreatedAsVerifiedProof: false,
        generatedAudioFinalMixAllowed: false,
        outsideAuthorizedRangeModified: false,
        privateInternalOnly: true,
        completedAt,
      })
      const receipt = brollResultReceiptSchema.parse({
        ...resultCore,
        resultHash: hashSkillValue(resultCore),
      })
      const receiptRef = await persistJson(input.localStorageRoot, receipt)
      const index = {
        receipt,
        receiptRef,
        layerManifest,
        layerManifestRef,
        integrationQa,
        integrationQaRef,
      }
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: indexPath,
        content: Buffer.from(`${stableAuthorityStringify(index)}\n`, 'utf8'),
      })
      return { ...index, replayed: false }
    },
  })
}

export function brollRemotionPreviewLayerForTreatment(
  treatment: BrollDisplayTreatment,
): OfflineRemotionBrollPreviewLayerPlanningPayload {
  const fixed = {
    full_frame_takeover: [0, 0, 100, 100, 1, 10],
    full_frame_cutaway: [0, 0, 100, 100, 1, 10],
    inset: [60, 8, 34, 34, 1, 10],
    picture_in_picture: [65, 6, 30, 30, 1, 10],
    split_screen: [50, 0, 50, 100, 1, 10],
    partial_overlay: [55, 45, 40, 45, 1, 10],
    background_layer: [0, 0, 100, 100, 0.45, 0],
  } as const
  if (treatment === 'no_display') {
    throw new Error('A no-display B-roll plan cannot enter Remotion integration.')
  }
  const geometry = fixed[treatment]
  return {
    displayTreatment: treatment,
    position: 'absolute',
    crop: 'contain',
    xPercent: geometry[0],
    yPercent: geometry[1],
    widthPercent: geometry[2],
    heightPercent: geometry[3],
    scale: 1,
    opacity: geometry[4],
    layerOrder: geometry[5],
  }
}

async function validateSelection(
  localStorageRoot: string,
  input: CandidateSelectionInput | ExistingSourceSelectionInput,
  assignment: BrollSkillAssignment,
  plan: BrollPlanArtifact,
): Promise<{
  selectedArtifact: z.infer<typeof selectedArtifactSchema>
  sourceTrim: z.infer<typeof skillFrameRangeSchema>
  outputQaRef: AuthorityJsonBlobRef
  outputQaHash: string
  verdict: 'accepted' | 'accepted_after_normalization'
  normalizedBytes: Buffer
  attemptHistory: BrollCandidateAttemptEvidence[]
}> {
  if (input.kind === 'candidate') {
    const version = brollCandidateVersionSchema.parse(input.candidateVersion)
    const qa = brollCandidateQaReportSchema.parse(input.qaReport)
    await assertAuthorityRef(localStorageRoot, input.candidateVersionRef, version)
    await assertAuthorityRef(localStorageRoot, input.qaReportRef, qa)
    const attempts = input.attemptHistory.map((attempt) =>
      brollCandidateAttemptEvidenceSchema.parse(attempt))
    if (
      !['generate_with_gemini_omni', 'edit_uploaded_video_with_gemini_omni'].includes(plan.decision) ||
      !['accepted', 'accepted_after_normalization'].includes(qa.verdict) ||
      version.verdict !== qa.verdict || version.qaReportHash !== qa.qaReportHash ||
      version.qaReportRef.sha256 !== input.qaReportRef.sha256 ||
      version.assignmentHash !== assignment.assignmentHash ||
      version.planHash !== plan.planHash ||
      version.normalizedCandidate.sha256 !== qa.normalizedCandidateSha256 ||
      attempts.length !== version.versionNumber || attempts.length < 1 || attempts.length > 2 ||
      attempts.at(-1)?.attemptId !== version.attemptId ||
      attempts.some((attempt, index) =>
        attempt.candidateVersionNumber !== index + 1 ||
        attempt.assignmentHash !== assignment.assignmentHash ||
        attempt.planHash !== plan.planHash)
    ) throw new Error('B-roll candidate selection lacks accepted immutable QA lineage.')
    assertNormalizedBytes(input.normalizedBytes, version.normalizedCandidate)
    return {
      selectedArtifact: selectedArtifactSchema.parse({
        sourceRoute: plan.decision === 'edit_uploaded_video_with_gemini_omni'
          ? 'gemini_omni_edited_uploaded_video'
          : 'gemini_omni_generated_candidate',
        sourceId: null,
        sourceArtifactRef: null,
        candidateSetId: version.candidateSetId,
        candidateVersionId: version.candidateVersionId,
        candidateVersionNumber: version.versionNumber,
        candidateVersionHash: version.candidateVersionHash,
        audioReviewSource: {
          artifactType: 'provider_b_roll_candidate_video_mp4',
          privateObjectIdentityHash:
            version.rawCandidate.privateObjectIdentityHash,
          sha256: version.rawCandidate.sha256,
          byteLength: version.rawCandidate.byteLength,
        },
        normalizedArtifact: normalizedArtifactFrom(version.normalizedCandidate),
      }),
      sourceTrim: {
        startFrameInclusive: 0,
        endFrameExclusive: version.normalizedCandidate.frameCount,
        fps: version.normalizedCandidate.frameRate,
      },
      outputQaRef: input.qaReportRef,
      outputQaHash: qa.qaReportHash,
      verdict: qa.verdict as 'accepted' | 'accepted_after_normalization',
      normalizedBytes: input.normalizedBytes,
      attemptHistory: attempts,
    }
  }
  const receipt = brollExistingSourceExecutionReceiptSchema.parse(input.receipt)
  await assertAuthorityRef(localStorageRoot, input.receiptRef, receipt)
  const persistedQa = await readPrivateAuthorityJsonBlob({
    localStorageRoot,
    ref: receipt.sourceQaReportRef,
  })
  const sourceQaRecord = persistedQa as Record<string, unknown>
  const { sourceQaReportHash: persistedQaHash, ...sourceQaCore } = sourceQaRecord
  if (
    !['use_existing_project_clip', 'use_uploaded_user_asset'].includes(plan.decision) ||
    receipt.assignmentHash !== assignment.assignmentHash ||
    receipt.planHash !== plan.planHash ||
    receipt.sourceQaReportHash !== persistedQaHash ||
    hashSkillValue(sourceQaCore) !== persistedQaHash ||
    sourceQaRecord.status !== 'passed' ||
    input.attemptHistory.length !== 0
  ) throw new Error('B-roll existing-source selection lacks passed immutable QA lineage.')
  assertNormalizedBytes(input.normalizedBytes, {
    ...receipt.normalizedCandidate,
    audioRemoved: true,
  })
  return {
    selectedArtifact: selectedArtifactSchema.parse({
      sourceRoute: plan.decision === 'use_uploaded_user_asset'
        ? 'approved_user_asset'
        : 'existing_project_clip',
      sourceId: receipt.selectedSourceId,
      sourceArtifactRef: receipt.selectedSourceArtifactRef,
      candidateSetId: null,
      candidateVersionId: null,
      candidateVersionNumber: null,
      candidateVersionHash: null,
      audioReviewSource: {
        artifactType: receipt.selectedSourceArtifactRef.artifactType,
        privateObjectIdentityHash: null,
        sha256: receipt.selectedSourceArtifactRef.sha256,
        byteLength: receipt.selectedSourceArtifactRef.byteLength,
      },
      normalizedArtifact: normalizedArtifactFrom(receipt.normalizedCandidate),
    }),
    sourceTrim: receipt.sourceTrim,
    outputQaRef: receipt.sourceQaReportRef,
    outputQaHash: receipt.sourceQaReportHash,
    verdict: 'accepted_after_normalization',
    normalizedBytes: input.normalizedBytes,
    attemptHistory: [],
  }
}

function validateTrackGraph(
  input: BrollRemotionIntegrationInput['trackGraph'],
  assignment: BrollSkillAssignment,
  plan: BrollPlanArtifact,
): z.infer<typeof editSkillArtifactReferenceSchema> | null {
  if (plan.coordination.trackingDependency === 'needs_other_skill') {
    throw new Error('B-roll integration needs_other_skill: Track All must supply track_graph_v1.')
  }
  const required = plan.coordination.trackingDependency === 'satisfied'
  if (required !== Boolean(input)) {
    throw new Error('B-roll Track All dependency does not match the approved plan.')
  }
  if (!input) return null
  const reference = editSkillArtifactReferenceSchema.parse(input.reference)
  const graph = trackGraphV1Schema.parse(input.value)
  if (
    reference.artifactType !== 'track_graph_v1' ||
    reference.ownerUserId !== assignment.ownerUserId ||
    reference.workspaceId !== assignment.workspaceId ||
    reference.projectId !== assignment.projectId ||
    graph.ownerUserId !== assignment.ownerUserId ||
    graph.workspaceId !== assignment.workspaceId ||
    graph.projectId !== assignment.projectId ||
    graph.assignmentId !== assignment.assignmentId ||
    graph.assignmentHash !== assignment.assignmentHash ||
    hashSkillValue(graph.authorizedRange) !==
      hashSkillValue(assignment.writeRangeAuthority.authorizedRange) ||
    hashSkillValue(graph) !== reference.sha256 ||
    Buffer.byteLength(canonicalSkillJson(graph), 'utf8') !== reference.byteLength ||
    stableAuthorityStringify(reference) !==
      stableAuthorityStringify(plan.coordination.trackGraphRef)
  ) throw new Error('B-roll rejected a forged or non-model-neutral track_graph_v1 dependency.')
  return reference
}

function validateCaptionOverlay(
  input: BrollRemotionIntegrationInput['captionOverlay'],
  assignment: BrollSkillAssignment,
): {
  reference: z.infer<typeof editSkillArtifactReferenceSchema>
  bytes: Buffer
  reservedZoneCount: number
} {
  const reference = editSkillArtifactReferenceSchema.parse(input.reference)
  if (
    !Buffer.isBuffer(input.bytes) || input.bytes.byteLength < 1_024 ||
    input.bytes.byteLength > 8 * 1024 * 1024 ||
    input.bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    sha256Bytes(input.bytes) !== reference.sha256 ||
    input.bytes.byteLength !== reference.byteLength ||
    reference.ownerUserId !== assignment.ownerUserId ||
    reference.workspaceId !== assignment.workspaceId ||
    reference.projectId !== assignment.projectId ||
    !Number.isSafeInteger(input.reservedZoneCount) || input.reservedZoneCount < 0 ||
    input.reservedZoneCount > 100
  ) throw new Error('B-roll caption-safe preview dependency is invalid.')
  return { reference, bytes: input.bytes, reservedZoneCount: input.reservedZoneCount }
}

function assertPlanAuthority(
  assignment: BrollSkillAssignment,
  plan: BrollPlanArtifact,
): void {
  const { assignmentHash, ...rawAssignmentCore } = assignment
  const { planHash, ...rawPlanCore } = plan
  const assignmentCore = brollAssignmentCoreSchema.parse(rawAssignmentCore)
  const planCore = brollPlanCoreSchema.parse(rawPlanCore)
  if (
    hashSkillValue(assignmentCore) !== assignmentHash ||
    hashSkillValue(planCore) !== planHash ||
    plan.assignmentId !== assignment.assignmentId ||
    plan.assignmentHash !== assignment.assignmentHash ||
    stableAuthorityStringify(plan.manifestRef) !==
      stableAuthorityStringify(assignment.manifestRef) ||
    stableAuthorityStringify(plan.authorizedRange) !==
      stableAuthorityStringify(assignment.writeRangeAuthority.authorizedRange) ||
    plan.outsideAuthorizedRangeModified !== false ||
    !plan.planningQaPassed ||
    ['use_no_broll', 'needs_other_skill', 'needs_user_confirmation', 'blocked'].includes(plan.decision)
  ) throw new Error('B-roll Remotion integration lost exact approved plan authority.')
}

async function createCrossSkillHandoffs(input: {
  localStorageRoot: string
  assignment: BrollSkillAssignment
  plan: BrollPlanArtifact
  selection: z.infer<typeof selectedArtifactSchema>
  outputQaHash: string
}): Promise<{
  sound: z.infer<typeof handoffRefSchema>
  color: z.infer<typeof handoffRefSchema>
  transition: z.infer<typeof handoffRefSchema>
}> {
  const common = {
    manifestRef: input.assignment.manifestRef,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    planHash: input.plan.planHash,
    exactRange: input.assignment.writeRangeAuthority.authorizedRange,
    selectedNormalizedArtifactSha256:
      input.selection.normalizedArtifact.sha256,
    outputQaHash: input.outputQaHash,
    outsideAuthorizedRangeModified: false as const,
  }
  const sound = hashed({
    schemaVersion: 'b_roll_sound_handoff_v1' as const,
    ...common,
    finalOwner: 'sound' as const,
    audioDisposition: input.plan.audioDisposition,
    rawGeneratedOrSourceArtifactRef: input.selection.audioReviewSource,
    generatedAudioFinalMixAllowed: false as const,
    brollMayMutateFinalMix: false as const,
  }, 'handoffHash')
  const color = hashed({
    schemaVersion: 'b_roll_color_handoff_v1' as const,
    ...common,
    finalOwner: 'color' as const,
    colorIntent: input.plan.shotSpecification?.colorMood ??
      'Match the approved source and surrounding scene continuity.',
    creativeColorTransformAppliedByBroll: false as const,
    brollMayApplyFinalGrade: false as const,
  }, 'handoffHash')
  const transition = hashed({
    schemaVersion: 'b_roll_transition_handoff_v1' as const,
    ...common,
    finalOwner: 'transition' as const,
    entryIntent: input.plan.entryIntent,
    exitIntent: input.plan.exitIntent,
    brollMayApplySpecializedTransition: false as const,
  }, 'handoffHash')
  const [soundRef, colorRef, transitionRef] = await Promise.all([
    persistJson(input.localStorageRoot, sound),
    persistJson(input.localStorageRoot, color),
    persistJson(input.localStorageRoot, transition),
  ])
  return {
    sound: handoffRefSchema.parse({
      artifactType: 'b_roll_sound_handoff_v1',
      ref: soundRef,
      artifactHash: sound.handoffHash,
      finalOwner: 'sound',
    }),
    color: handoffRefSchema.parse({
      artifactType: 'b_roll_color_handoff_v1',
      ref: colorRef,
      artifactHash: color.handoffHash,
      finalOwner: 'color',
    }),
    transition: handoffRefSchema.parse({
      artifactType: 'b_roll_transition_handoff_v1',
      ref: transitionRef,
      artifactHash: transition.handoffHash,
      finalOwner: 'transition',
    }),
  }
}

function buildCostEvidence(
  attempts: BrollCandidateAttemptEvidence[],
  integrationInfrastructureCostMicros: number,
): z.infer<typeof costEvidenceSchema> {
  const providerCostMicros = attempts.reduce(
    (total, attempt) => total + attempt.cost.providerCostMicros,
    0,
  )
  const candidateInfrastructureCostMicros = attempts.reduce(
    (total, attempt) => total + attempt.cost.infrastructureCostMicros,
    0,
  )
  const core = {
    providerCostMicros,
    candidateInfrastructureCostMicros,
    integrationInfrastructureCostMicros,
    totalInternalCostMicros: providerCostMicros +
      candidateInfrastructureCostMicros + integrationInfrastructureCostMicros,
    serviceFeeIncluded: false as const,
    attemptCostEvidenceHashes: attempts.map((attempt) =>
      attempt.cost.costEvidenceHash),
  }
  return costEvidenceSchema.parse({
    ...core,
    costEvidenceHash: hashSkillValue(core),
  })
}

function previewDimensions(plan: BrollPlanArtifact): readonly [number, number] {
  const ratio = plan.shotSpecification?.aspectRatio ??
    plan.cropSafeProviderAspectRatio
  if (ratio === '16:9') return [640, 360]
  if (ratio === '9:16') return [360, 640]
  if (ratio === '1:1') return [480, 480]
  if (ratio === '4:5') return [480, 600]
  throw new Error('B-roll private preview requires a Remotion-supported confirmed output frame.')
}

function assertRemotionResult(
  result: Awaited<ReturnType<PrivateOfflineRemotionRenderRuntime['execute']>>,
  expected: { width: number; height: number; fps: 24 | 30; frameCount: number },
): void {
  if (
    result.artifact.mimeType !== 'video/mp4' ||
    result.artifact.width !== expected.width ||
    result.artifact.height !== expected.height ||
    result.artifact.fps !== expected.fps ||
    result.artifact.durationFrames !== expected.frameCount ||
    result.artifact.bytes.subarray(4, 8).toString('ascii') !== 'ftyp' ||
    result.evidence.semanticEvidence.approvedBrollQaNormalizedPreviewProxyVerified !== true ||
    result.evidence.semanticEvidence.approvedBrollTreatmentGeometryApplied !== true ||
    result.evidence.semanticEvidence.approvedBrollLayerOrderApplied !== true ||
    result.readiness.privateInternalOnly !== true || result.readiness.productReady !== false
  ) throw new Error('B-roll private Remotion preview failed integrity verification.')
}

async function persistPrivatePreview(
  root: string,
  relativePath: string,
  bytes: Buffer,
  expectedSha256: string,
): Promise<void> {
  if (
    bytes.byteLength < 1_024 || bytes.byteLength > 32 * 1024 * 1024 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp' ||
    sha256Bytes(bytes) !== expectedSha256
  ) throw new Error('B-roll private preview bytes are invalid.')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: root,
    relativePath,
    content: bytes,
  })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored || !stored.equals(bytes) || sha256Bytes(stored) !== expectedSha256) {
    throw new Error('B-roll private preview changed after create-only persistence.')
  }
}

async function assertAuthorityRef(
  root: string,
  ref: AuthorityJsonBlobRef,
  expected: Record<string, unknown>,
): Promise<void> {
  const parsedRef = blobRefSchema.parse(ref)
  const stored = await readPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    ref: parsedRef,
  })
  if (
    Array.isArray(stored) ||
    stableAuthorityStringify(stored) !== stableAuthorityStringify(expected)
  ) throw new Error('B-roll content-addressed authority reference changed after persistence.')
}

async function readIntegrationReplay(
  root: string,
  relativePath: string,
): Promise<{
  receipt: BrollResultReceipt
  receiptRef: AuthorityJsonBlobRef
  layerManifest: BrollRemotionLayerManifest
  layerManifestRef: AuthorityJsonBlobRef
  integrationQa: BrollIntegrationQaReport
  integrationQaRef: AuthorityJsonBlobRef
} | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: root,
    relativePath,
  })
  if (!text) return undefined
  const value = z.object({
    receipt: brollResultReceiptSchema,
    receiptRef: blobRefSchema,
    layerManifest: brollRemotionLayerManifestSchema,
    layerManifestRef: blobRefSchema,
    integrationQa: brollIntegrationQaReportSchema,
    integrationQaRef: blobRefSchema,
  }).strict().parse(JSON.parse(text))
  await Promise.all([
    assertAuthorityRef(root, value.receiptRef, value.receipt),
    assertAuthorityRef(root, value.layerManifestRef, value.layerManifest),
    assertAuthorityRef(root, value.integrationQaRef, value.integrationQa),
    assertHandoffRef(root, value.receipt.handoffs.sound),
    assertHandoffRef(root, value.receipt.handoffs.color),
    assertHandoffRef(root, value.receipt.handoffs.transition),
    assertPersistedPreview(root, value.receipt),
  ])
  return value
}

async function assertHandoffRef(
  root: string,
  handoff: z.infer<typeof handoffRefSchema>,
): Promise<void> {
  const stored = await readPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    ref: handoff.ref,
  })
  if (Array.isArray(stored)) throw new Error('B-roll handoff replay artifact is invalid.')
  const { handoffHash, ...core } = stored
  if (
    handoffHash !== handoff.artifactHash ||
    hashSkillValue(core) !== handoff.artifactHash ||
    stored.schemaVersion !== handoff.artifactType ||
    stored.finalOwner !== handoff.finalOwner
  ) throw new Error('B-roll handoff replay artifact changed after commit.')
}

async function assertPersistedPreview(
  root: string,
  receipt: BrollResultReceipt,
): Promise<void> {
  const relativePath =
    `b-roll/remotion-integrations/previews/${receipt.preview.previewArtifactIdentityHash}.mp4`
  const stored = await readPrivateFileIfExistsWithinRoot({
    rootPath: root,
    relativePath,
  })
  if (
    !stored || stored.byteLength !== receipt.preview.byteLength ||
    sha256Bytes(stored) !== receipt.preview.sha256 ||
    stored.subarray(4, 8).toString('ascii') !== 'ftyp'
  ) throw new Error('B-roll private preview replay artifact changed after commit.')
}

function assertNormalizedBytes(
  bytes: Buffer,
  artifact: { sha256: string; byteLength: number; mimeType: string; audioRemoved: boolean },
): void {
  if (
    !Buffer.isBuffer(bytes) || bytes.byteLength !== artifact.byteLength ||
    artifact.mimeType !== 'video/x-nut' || artifact.audioRemoved !== true ||
    sha256Bytes(bytes) !== artifact.sha256 ||
    !bytes.subarray(0, 25).toString('ascii').includes('nut/multimedia')
  ) throw new Error('B-roll Remotion received media that was not the QA-normalized artifact.')
}

function normalizedArtifactFrom(artifact: {
  privateObjectIdentityHash: string
  sha256: string
  byteLength: number
  mimeType: string
  frameCount: number
  frameRate: number
}): z.infer<typeof normalizedArtifactSchema> {
  return normalizedArtifactSchema.parse({
    privateObjectIdentityHash: artifact.privateObjectIdentityHash,
    sha256: artifact.sha256,
    byteLength: artifact.byteLength,
    mimeType: 'video/x-nut',
    frameCount: artifact.frameCount,
    frameRate: artifact.frameRate,
    audioRemoved: true,
  })
}

function hashed<T extends Record<string, unknown>, K extends string>(
  core: T,
  key: K,
): T & Record<K, string> {
  return { ...core, [key]: hashSkillValue(core) } as T & Record<K, string>
}

async function persistJson(
  localStorageRoot: string,
  value: Record<string, unknown>,
): Promise<AuthorityJsonBlobRef> {
  return putPrivateAuthorityJsonBlob({
    localStorageRoot,
    value,
    maxBytes: 2 * 1024 * 1024,
  })
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
