import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  BrollCaptionManifestReference,
  BrollCaptionOpaqueReference,
  BrollCaptionOwnerReadRequest,
  BrollCaptionOwnerReadResult,
} from '../../src/types/caption-broll-owner-read-adapter'
import {
  CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_AUTHORITY_VERSION,
  CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_READ_PORT_VERSION,
  type CanonicalBrollCaptionInspectionSourceAuthority,
  type CanonicalBrollCaptionInspectionSourceAuthorityReadPort,
} from '../../src/types/canonical-broll-caption-inspection-source-authority'
import type {
  CanonicalCaptionBrollApprovedSnapshotReadPort,
  CanonicalCaptionBrollOwnerReadPort,
} from '../../src/types/canonical-caption-broll-support'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  brollCandidateMediaManifestSchema,
  brollPrivatePreviewMediaManifestSchema,
} from '../edit-skills/b-roll/b-roll-active-artifact-contracts'
import {
  brollCaptionOwnerReadRequestSchema,
  brollCaptionOwnerReadResultSchema,
} from '../edit-skills/b-roll/b-roll-caption-public-contract'
import type { BrollSkillAssignment } from '../edit-skills/b-roll/b-roll-contracts'
import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import {
  brollRemotionLayerManifestSchema,
  brollResultReceiptSchema,
} from '../edit-skills/b-roll/b-roll-remotion-integration'
import {
  brollPlanArtifactSchema,
  brollSkillAssignmentSchema,
} from '../edit-skills/b-roll/b-roll-schemas'
import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from '../edit-skills/core/edit-skill-artifact-store'
import {
  editSkillApprovedWorkGraphSchema,
  editSkillPublicPlanSchema,
  type EditSkillApprovedWorkGraph,
  type EditSkillPublicPlan,
} from '../edit-skills/core/edit-skill-plugin'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import { editSkillWorkResultSchema } from '../edit-skills/core/edit-skill-work-result'
import { skillAssignmentSchema } from
  '../edit-skills/core/skill-assignment-schema'
import type { SkillAssignment } from
  '../edit-skills/core/skill-assignment-types'
import { createCanonicalCaptionBrollOwnerReadPort } from
  './canonical-caption-broll-support-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

export const CANONICAL_BROLL_CAPTION_OWNER_SERVICE_VERSION =
  'canonical-broll-caption-owner-service-v1' as const
export const CANONICAL_BROLL_CAPTION_OWNER_SERVICE_V2_VERSION =
  'canonical-broll-caption-owner-service-v2' as const
export const CANONICAL_BROLL_CAPTION_PRIVATE_VISUAL_REVIEW_READ_PORT_VERSION =
  'canonical-broll-caption-private-visual-review-read-port-v1' as const
export const BROLL_CAPTION_AUTHENTICATED_OWNER_READ_EVIDENCE_VERSION =
  'b_roll_authenticated_owner_read_evidence_v1' as const

const MAX_RECORD_BYTES = 16 * 1024 * 1024
const DEFAULT_PREFIX = 'private/edit-skills/b-roll/v1/caption-owner'
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const domainRefSchema = z.object({
  id: identity,
  version: identity,
  contentHash: sha256,
}).strict()

const inspectionSourceAuthorityCoreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_AUTHORITY_VERSION),
  authorityId: identity,
  canonicalScope: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    planVersionId: identity,
    approvedSnapshotRef: domainRefSchema,
    outputId: identity,
    outputFrameRef: domainRefSchema,
    sceneId: identity,
    authorizedFrameRange: z.object({
      startFrameInclusive: z.number().int().nonnegative(),
      endFrameExclusive: z.number().int().positive(),
      fps: z.number().int().positive().max(120),
    }).strict(),
    masterTimingRef: domainRefSchema,
    masterTimingHash: sha256,
  }).strict(),
  ownerRequestRef: domainRefSchema,
  ownerResultRef: domainRefSchema,
  brollAssignmentRef: domainRefSchema,
  brollPlanRef: domainRefSchema,
  brollApprovedWorkGraphRef: domainRefSchema,
  brollCanonicalWorkGraphRef: domainRefSchema,
  brollResultReceiptRef: domainRefSchema,
  selectedMediaManifestRef: domainRefSchema,
  layoutOccupancyRef: domainRefSchema,
  privateVisualReviewRef: domainRefSchema,
  previewArtifactRef: domainRefSchema,
  integrationQaRef: domainRefSchema,
  selectedNormalizedArtifactRef: domainRefSchema,
  selectedNormalizedArtifact: z.object({
    privateObjectIdentityDigestSha256: sha256,
    byteLength: z.number().int().positive().max(32 * 1024 * 1024),
    mimeType: z.literal('video/x-nut'),
    frameCount: z.number().int().min(24).max(240),
    frameRate: z.union([z.literal(24), z.literal(30)]),
    audioRemoved: z.literal(true),
  }).strict(),
  selectedSourceRoute: z.enum([
    'existing_project_clip',
    'approved_user_asset',
    'gemini_omni_generated_candidate',
    'gemini_omni_edited_uploaded_video',
  ]),
  exactCanonicalBrollWorkAndArtifactRereadVerified: z.literal(true),
  exactPrivateVisualReviewRereadVerified: z.literal(true),
  exactSelectedNormalizedArtifactIdentityVerified: z.literal(true),
  persistedCreateOnlyAndExactReread: z.literal(true),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  sourceSelectionPerformedByCaption: z.literal(false),
  cropOrTimingPerformedByCaption: z.literal(false),
  runtimeOrDispatchAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const inspectionSourceAuthoritySchema =
  inspectionSourceAuthorityCoreSchema.extend({
    authorityDigestSha256: sha256,
  }).strict().superRefine((value, context) => {
    const { authorityDigestSha256, ...core } = value
    if (hashSkillValue(core) !== authorityDigestSha256
      || value.canonicalScope.masterTimingRef.contentHash
        !== value.canonicalScope.masterTimingHash
      || value.canonicalScope.authorizedFrameRange.endFrameExclusive
        <= value.canonicalScope.authorizedFrameRange.startFrameInclusive
      || value.selectedNormalizedArtifactRef.version
        !== 'b_roll_selected_normalized_media_v1'
      || value.selectedNormalizedArtifactRef.contentHash.length !== 64) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical B-roll Caption inspection source authority invalid.',
      })
    }
  })

const privateVisualReviewCoreSchema = z.object({
  schemaVersion: z.literal(
    BROLL_CAPTION_AUTHENTICATED_OWNER_READ_EVIDENCE_VERSION),
  reviewId: identity,
  previewArtifactSha256: sha256,
  layerManifestHash: sha256,
  integrationQaHash: sha256,
  reviewedFrameRange: z.object({
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    fps: z.number().int().positive().max(120),
  }).strict(),
  inspectionMode: z.literal('complete_time_private_visual_review'),
  reviewerClass: z.enum(['qualified_visual_ai', 'direct_private_human']),
  disposition: z.enum(['accepted', 'accepted_with_warnings']),
  visibleTextRegionRefs: z.array(domainRefSchema).max(256),
  captionSafeAreaVerified: z.literal(true),
  captionLayerAboveBrollVerified: z.literal(true),
  sourceBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  reviewedAt: timestamp,
}).strict()

export const brollCaptionPrivateVisualReviewSchema =
  privateVisualReviewCoreSchema.extend({
    reviewDigestSha256: sha256,
  }).strict().superRefine((value, context) => {
    const { reviewDigestSha256, ...core } = value
    if (hashSkillValue(core) !== reviewDigestSha256) {
      context.addIssue({
        code: 'custom',
        message: 'B-roll Caption private visual review digest is stale or forged.',
      })
    }
    if (value.reviewedFrameRange.endFrameExclusive
      <= value.reviewedFrameRange.startFrameInclusive) {
      context.addIssue({ code: 'custom', message: 'B-roll visual review range is empty.' })
    }
  })

export type BrollCaptionPrivateVisualReview = z.infer<
  typeof brollCaptionPrivateVisualReviewSchema
>

export function createBrollCaptionPrivateVisualReview(
  input: z.input<typeof privateVisualReviewCoreSchema>,
): BrollCaptionPrivateVisualReview {
  const core = privateVisualReviewCoreSchema.parse(input)
  return brollCaptionPrivateVisualReviewSchema.parse({
    ...core,
    reviewDigestSha256: hashSkillValue(core),
  })
}

export function parseCanonicalBrollCaptionInspectionSourceAuthority(
  value: unknown,
): CanonicalBrollCaptionInspectionSourceAuthority {
  assertClosedContractTree(
    value, 'Canonical B-roll Caption inspection source authority')
  rejectUnsafeText(
    value, 'Canonical B-roll Caption inspection source authority')
  return structuredClone(inspectionSourceAuthoritySchema.parse(value)) as
    CanonicalBrollCaptionInspectionSourceAuthority
}

export interface CanonicalBrollCaptionOwnerService {
  readonly schemaVersion: typeof CANONICAL_BROLL_CAPTION_OWNER_SERVICE_VERSION
  readonly ownerReadPort: CanonicalCaptionBrollOwnerReadPort
  finalizeFromCanonicalWork(input: {
    readonly request: BrollCaptionOwnerReadRequest
    readonly publicAssignment: SkillAssignment
    readonly publicPlan: EditSkillPublicPlan
    readonly approvedWorkGraph: EditSkillApprovedWorkGraph
    readonly assignment: BrollSkillAssignment
    readonly plan: unknown
    readonly workItemResults: readonly unknown[]
  }): Promise<BrollCaptionOwnerReadResult>
  readExact(input: {
    readonly request: BrollCaptionOwnerReadRequest
  }): Promise<BrollCaptionOwnerReadResult>
}

export interface CanonicalBrollCaptionOwnerServiceV2
  extends Omit<CanonicalBrollCaptionOwnerService, 'schemaVersion'> {
  readonly schemaVersion:
    typeof CANONICAL_BROLL_CAPTION_OWNER_SERVICE_V2_VERSION
  readonly inspectionSourceAuthorityReadPort:
    CanonicalBrollCaptionInspectionSourceAuthorityReadPort
  readonly selectedNormalizedArtifactAuthorityPersistedBeforeOwnerResult: true
}

export interface CanonicalBrollCaptionPrivateVisualReviewReadPort {
  readonly schemaVersion:
    typeof CANONICAL_BROLL_CAPTION_PRIVATE_VISUAL_REVIEW_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_broll_private_visual_review_owner'
  readonly callerSuppliedReviewAccepted: false
  readExact(input: {
    readonly ownerRequestRef: BrollCaptionOwnerReadResult['ownerRequestRef']
    readonly previewArtifactRef: BrollCaptionOwnerReadResult[
      'selectedMediaManifestRef']
    readonly layerManifestRef: BrollCaptionOwnerReadResult[
      'layoutOccupancyRef']
    readonly integrationQaRef: BrollCaptionOwnerReadResult[
      'visibleTextEvidenceRef']
    readonly reviewedFrameRange: BrollCaptionPrivateVisualReview[
      'reviewedFrameRange']
  }): Promise<unknown>
}

const admittedVisualReviewReaders = new WeakSet<object>()
const admittedInspectionSourceReaders = new WeakSet<object>()

export function createCanonicalBrollCaptionPrivateVisualReviewReadPort(
  readExact: CanonicalBrollCaptionPrivateVisualReviewReadPort['readExact'],
): CanonicalBrollCaptionPrivateVisualReviewReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical B-roll private visual-review reader is required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_BROLL_CAPTION_PRIVATE_VISUAL_REVIEW_READ_PORT_VERSION,
    sourceAuthority: 'canonical_broll_private_visual_review_owner' as const,
    callerSuppliedReviewAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedVisualReviewReaders.add(port)
  return port
}

export function isCanonicalBrollCaptionInspectionSourceAuthorityReadPort(
  value: unknown,
): value is CanonicalBrollCaptionInspectionSourceAuthorityReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedInspectionSourceReaders.has(value as object))
}

export interface CanonicalBrollCaptionOwnerServiceInput {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly artifactStore: EditSkillArtifactStore
  readonly approvedSnapshotReadPort: CanonicalCaptionBrollApprovedSnapshotReadPort
  readonly privateVisualReviewReadPort:
    CanonicalBrollCaptionPrivateVisualReviewReadPort
  readonly prefix?: string
}

export function createCanonicalBrollCaptionOwnerService(
  input: CanonicalBrollCaptionOwnerServiceInput,
): CanonicalBrollCaptionOwnerService {
  return createCanonicalBrollCaptionOwnerServiceInternal(input, false) as
    CanonicalBrollCaptionOwnerService
}

export function createCanonicalBrollCaptionOwnerServiceV2(
  input: CanonicalBrollCaptionOwnerServiceInput,
): CanonicalBrollCaptionOwnerServiceV2 {
  return createCanonicalBrollCaptionOwnerServiceInternal(input, true) as
    CanonicalBrollCaptionOwnerServiceV2
}

function createCanonicalBrollCaptionOwnerServiceInternal(
  input: CanonicalBrollCaptionOwnerServiceInput,
  inspectionSourceAuthorityEnabled: boolean,
): CanonicalBrollCaptionOwnerService | CanonicalBrollCaptionOwnerServiceV2 {
  assertDependencies(input)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const read = async (requestInput: BrollCaptionOwnerReadRequest) => {
    const request = parseBrollCaptionOwnerReadRequest(requestInput)
    const result = await readJson(
      input.objectPort,
      resultPath(prefix, request),
      parseBrollCaptionOwnerReadResult,
    )
    if (!result) throw new Error('Canonical B-roll Caption owner result is unavailable.')
    assertResultMatchesRequest(request, result)
    return result
  }
  const ownerReadPort = createCanonicalCaptionBrollOwnerReadPort(
    async ({ request }) => read(request),
  )
  const inspectionSourceAuthorityReadPort = inspectionSourceAuthorityEnabled
    ? createInspectionSourceAuthorityReadPort(input.objectPort, prefix)
    : null
  const service = {
    schemaVersion: inspectionSourceAuthorityEnabled
      ? CANONICAL_BROLL_CAPTION_OWNER_SERVICE_V2_VERSION
      : CANONICAL_BROLL_CAPTION_OWNER_SERVICE_VERSION,
    ownerReadPort,
    readExact: ({ request }: {
      readonly request: BrollCaptionOwnerReadRequest
    }) => read(request),
    async finalizeFromCanonicalWork(untrusted: Parameters<
      CanonicalBrollCaptionOwnerService['finalizeFromCanonicalWork']>[0]) {
      assertClosedContractTree(untrusted, 'Canonical B-roll Caption owner finalization')
      const request = parseBrollCaptionOwnerReadRequest(untrusted.request)
      const publicAssignment = skillAssignmentSchema.parse(
        untrusted.publicAssignment)
      const publicPlan = editSkillPublicPlanSchema.parse(untrusted.publicPlan)
      const approvedWorkGraph = editSkillApprovedWorkGraphSchema.parse(
        untrusted.approvedWorkGraph)
      const assignment = brollSkillAssignmentSchema.parse(untrusted.assignment)
      const plan = brollPlanArtifactSchema.parse(untrusted.plan)
      const workItemResults = untrusted.workItemResults.map((value) =>
        editSkillWorkResultSchema.parse(value))
      await assertSnapshotAuthority(input.approvedSnapshotReadPort, request)
      assertBrollExecutionLineage({
        request,
        publicAssignment,
        publicPlan,
        approvedWorkGraph,
        assignment,
        plan,
        workItemResults,
      })
      const refs = exactOutputRefs(workItemResults)
      const scope = {
        ownerUserId: request.canonicalScope.ownerUserId,
        workspaceId: request.canonicalScope.workspaceId,
        projectId: request.canonicalScope.projectId,
      }
      const [media, layer, receipt, preview] = await Promise.all([
        readArtifact(input.artifactStore, refs.media, scope,
          brollCandidateMediaManifestSchema.parse),
        readArtifact(input.artifactStore, refs.layer, scope,
          brollRemotionLayerManifestSchema.parse),
        readArtifact(input.artifactStore, refs.receipt, scope,
          brollResultReceiptSchema.parse),
        readArtifact(input.artifactStore, refs.preview, scope,
          brollPrivatePreviewMediaManifestSchema.parse),
      ])
      assertCanonicalArtifacts({
        request,
        publicAssignment,
        publicPlan,
        approvedWorkGraph,
        assignment,
        plan,
        media,
        layer,
        receipt,
        preview,
      })
      const selectedMediaManifestRef = opaqueRef(
        `broll.media.${media.mediaManifestHash.slice(0, 32)}`,
        media.schemaVersion,
        media.mediaManifestHash,
      )
      const layoutOccupancyRef = opaqueRef(
        `broll.layout.${layer.layerManifestHash.slice(0, 32)}`,
        layer.schemaVersion,
        layer.layerManifestHash,
      )
      const review = await rereadPrivateVisualReview(
        input.privateVisualReviewReadPort,
        {
          ownerRequestRef: opaqueRef(
            request.requestId,
            request.schemaVersion,
            request.requestDigestSha256,
          ),
          previewArtifactRef: opaqueRef(
            `broll.preview.${preview.objectSha256.slice(0, 32)}`,
            preview.schemaVersion,
            preview.objectSha256,
          ),
          layerManifestRef: layoutOccupancyRef,
          integrationQaRef: opaqueRef(
            `broll.integration-qa.${receipt.integrationQaHash.slice(0, 32)}`,
            'b_roll_integration_qa_v1',
            receipt.integrationQaHash,
          ),
          reviewedFrameRange: structuredClone(
            request.canonicalScope.authorizedFrameRange),
        },
      )
      assertCanonicalReview({ request, review, layer, receipt, preview })
      const cropTiming = createCropTimingProjection(request, layer)
      const cropTimingRef = await persistProjectedRecord({
        port: input.objectPort,
        prefix,
        kind: 'crop-timing',
        id: `broll.crop.${cropTiming.projectionDigestSha256.slice(0, 32)}`,
        version: cropTiming.schemaVersion,
        digest: cropTiming.projectionDigestSha256,
        value: cropTiming,
      })
      const visibleText = createVisibleTextEvidence(request, review)
      const visibleTextEvidenceRef = await persistProjectedRecord({
        port: input.objectPort,
        prefix,
        kind: 'visible-text',
        id: `broll.visible-text.${visibleText.evidenceDigestSha256.slice(0, 32)}`,
        version: visibleText.schemaVersion,
        digest: visibleText.evidenceDigestSha256,
        value: visibleText,
      })
      const withoutDigest: Omit<BrollCaptionOwnerReadResult,
        'resultDigestSha256'> = {
        schemaVersion: 'b_roll_caption_owner_read_result_v1',
        resultId: `broll.caption.result.${request.requestDigestSha256.slice(0, 32)}`,
        ownerSkillKey: 'b_roll',
        requestingSkillKey: 'captions',
        requestedJobType: 'provide_caption_broll_composition_constraints',
        mediationMode: 'hq_mediated_owner_read',
        brollManifestRef: exactBrollManifestRef(),
        canonicalScope: structuredClone(request.canonicalScope),
        ownerRequestRef: opaqueRef(
          request.requestId,
          request.schemaVersion,
          request.requestDigestSha256,
        ),
        brollResultReceiptRef: opaqueRef(
          `broll.result.${receipt.resultId.slice(0, 32)}`,
          receipt.schemaVersion,
          receipt.resultHash,
        ),
        selectedMediaManifestRef,
        layoutOccupancyRef,
        cropTimingRef,
        visibleTextEvidenceRef,
        sourceContractVersions: {
          selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
          layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
          cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
          visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
        },
        authenticatedOwnerEvidenceRef: opaqueRef(
          review.reviewId,
          review.schemaVersion,
          review.reviewDigestSha256,
        ),
        exactPrivateOwnerRereadVerified: true,
        exactCanonicalScopeVerified: true,
        exactApprovedSnapshotVerified: true,
        exactOutputFrameAndMasterTimingVerified: true,
        sourceSelectionPerformedByCaption: false,
        cropOrTimingPerformedByCaption: false,
        mediaBytesIncluded: false,
        mediaLocatorIncluded: false,
        rawChatIncluded: false,
        credentialsIncluded: false,
        sourceSelectionAuthorityGranted: false,
        cropOrTimingMutationAuthorityGranted: false,
        runtimeOrDispatchAuthorityGranted: false,
        assetMutationAuthorityGranted: false,
        finalQaApprovalGranted: false,
        billingAuthorityGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      }
      const result = parseBrollCaptionOwnerReadResult({
        ...withoutDigest,
        resultDigestSha256: hashSkillValue(withoutDigest),
      })
      if (inspectionSourceAuthorityReadPort) {
        const sourceAuthority = createInspectionSourceAuthority({
          request,
          result,
          publicAssignment,
          publicPlan,
          approvedWorkGraph,
          assignment,
          plan,
          receipt,
          preview,
          review,
        })
        await persistJson(
          input.objectPort,
          inspectionSourceAuthorityPath(prefix, sourceAuthority.ownerResultRef),
          sourceAuthority,
        )
        const rereadSourceAuthority =
          await inspectionSourceAuthorityReadPort.readExact({
            ownerRequestRef: sourceAuthority.ownerRequestRef,
            ownerResultRef: sourceAuthority.ownerResultRef,
          })
        if (!rereadSourceAuthority
          || hashSkillValue(rereadSourceAuthority)
            !== hashSkillValue(sourceAuthority)) {
          throw new Error(
            'Canonical B-roll inspection source authority changed after persistence.')
        }
      }
      await persistJson(input.objectPort, resultPath(prefix, request), result)
      const reread = await read(request)
      if (hashSkillValue(reread) !== hashSkillValue(result)) {
        throw new Error('Canonical B-roll Caption result changed after persistence.')
      }
      return reread
    },
  }
  if (!inspectionSourceAuthorityReadPort) {
    return Object.freeze(service) as CanonicalBrollCaptionOwnerService
  }
  return Object.freeze({
    ...service,
    inspectionSourceAuthorityReadPort,
    selectedNormalizedArtifactAuthorityPersistedBeforeOwnerResult:
      true as const,
  }) as CanonicalBrollCaptionOwnerServiceV2
}

function assertBrollExecutionLineage(input: {
  request: BrollCaptionOwnerReadRequest
  publicAssignment: SkillAssignment
  publicPlan: EditSkillPublicPlan
  approvedWorkGraph: EditSkillApprovedWorkGraph
  assignment: BrollSkillAssignment
  plan: z.infer<typeof brollPlanArtifactSchema>
  workItemResults: z.infer<typeof editSkillWorkResultSchema>[]
}): void {
  const {
    request,
    publicAssignment,
    publicPlan,
    approvedWorkGraph,
    assignment,
    plan,
    workItemResults,
  } = input
  const scope = request.canonicalScope
  const exactRange = assignment.writeRangeAuthority.authorizedRange
  const workItemByKey = new Map(approvedWorkGraph.workItems.map((item) =>
    [item.workItemKey, item]))
  if (
    publicAssignment.assignmentId !== assignment.assignmentId ||
    publicAssignment.ownerUserId !== assignment.ownerUserId ||
    publicAssignment.workspaceId !== assignment.workspaceId ||
    publicAssignment.projectId !== assignment.projectId ||
    publicAssignment.editSessionId !== assignment.editSessionId ||
    hashSkillValue(publicAssignment.authorizedRange) !== hashSkillValue(exactRange) ||
    publicAssignment.reason !== assignment.reason ||
    publicAssignment.intendedViewerBenefit !== assignment.expectedViewerBenefit ||
    publicAssignment.visualOwnership !== assignment.requestedVisualOwnership ||
    hashSkillValue(publicAssignment.manifestRef)
      !== hashSkillValue(assignment.manifestRef) ||
    publicPlan.envelope.assignmentId !== publicAssignment.assignmentId ||
    publicPlan.envelope.assignmentHash !== publicAssignment.assignmentHash ||
    publicPlan.envelope.planId !== plan.planId ||
    publicPlan.payloadRef.artifactType !== 'b_roll_plan_v1' ||
    publicPlan.payloadRef.sha256 !== hashSkillValue(plan) ||
    approvedWorkGraph.assignmentId !== publicAssignment.assignmentId ||
    approvedWorkGraph.assignmentHash !== publicAssignment.assignmentHash ||
    approvedWorkGraph.planId !== publicPlan.envelope.planId ||
    approvedWorkGraph.planHash !== publicPlan.envelope.planHash ||
    approvedWorkGraph.approvedWorkGraphHash.length !== 64 ||
    approvedWorkGraph.workItems.length !== workItemResults.length ||
    workItemByKey.size !== approvedWorkGraph.workItems.length ||
    assignment.ownerUserId !== scope.ownerUserId ||
    assignment.workspaceId !== scope.workspaceId ||
    assignment.projectId !== scope.projectId ||
    assignment.editSessionId !== scope.editSessionId ||
    !assignment.segmentIds.includes(scope.sceneId) ||
    assignment.masterTimingHash !== scope.masterTimingHash ||
    exactRange.startFrameInclusive !== scope.authorizedFrameRange.startFrameInclusive ||
    exactRange.endFrameExclusive !== scope.authorizedFrameRange.endFrameExclusive ||
    exactRange.fps !== scope.authorizedFrameRange.fps ||
    plan.assignmentId !== assignment.assignmentId ||
    plan.assignmentHash !== assignment.assignmentHash ||
    request.planningConstraintRef.id !== plan.planId ||
    request.planningConstraintRef.version !== plan.schemaVersion ||
    request.planningConstraintRef.contentHash !== plan.planHash ||
    workItemResults.length === 0 ||
    workItemResults.some((result) =>
      result.status !== 'succeeded' ||
      result.assignmentId !== assignment.assignmentId ||
      result.assignmentHash !== publicAssignment.assignmentHash ||
      result.planId !== plan.planId ||
      result.planHash !== publicPlan.envelope.planHash ||
      result.manifestRef.manifestHash !== BROLL_CAPABILITY_MANIFEST.manifestHash ||
      !workItemByKey.has(result.workItemKey) ||
      workItemByKey.get(result.workItemKey)?.workItemHash !== result.workItemHash ||
      result.outsideAuthorizedRangeModified ||
      result.authorizedRange.startFrameInclusive !== exactRange.startFrameInclusive ||
      result.authorizedRange.endFrameExclusive !== exactRange.endFrameExclusive ||
      result.authorizedRange.fps !== exactRange.fps)
  ) throw new Error('Canonical B-roll work crossed Caption scope or timing authority.')
}

function exactOutputRefs(
  results: z.infer<typeof editSkillWorkResultSchema>[],
): {
  media: EditSkillArtifactReference
  layer: EditSkillArtifactReference
  receipt: EditSkillArtifactReference
  preview: EditSkillArtifactReference
} {
  const all = results.flatMap((result) => result.outputArtifactRefs)
  const one = (artifactType: string) => {
    const refs = all.filter((ref) => ref.artifactType === artifactType)
    if (refs.length !== 1) {
      throw new Error(`Canonical B-roll requires one exact ${artifactType} output.`)
    }
    return refs[0]!
  }
  return {
    media: one('b_roll_candidate_media_manifest_v1'),
    layer: one('b_roll_remotion_layer_manifest_v1'),
    receipt: one('b_roll_result_receipt_v1'),
    preview: one('b_roll_private_preview_media_manifest_v1'),
  }
}

function assertCanonicalArtifacts(input: {
  request: BrollCaptionOwnerReadRequest
  publicAssignment: SkillAssignment
  publicPlan: EditSkillPublicPlan
  approvedWorkGraph: EditSkillApprovedWorkGraph
  assignment: BrollSkillAssignment
  plan: z.infer<typeof brollPlanArtifactSchema>
  media: z.infer<typeof brollCandidateMediaManifestSchema>
  layer: z.infer<typeof brollRemotionLayerManifestSchema>
  receipt: z.infer<typeof brollResultReceiptSchema>
  preview: z.infer<typeof brollPrivatePreviewMediaManifestSchema>
}): void {
  const {
    request,
    publicAssignment,
    publicPlan,
    approvedWorkGraph,
    assignment,
    plan,
    media,
    layer,
    receipt,
    preview,
  } = input
  const range = request.canonicalScope.authorizedFrameRange
  if (
    media.ownerUserId !== request.canonicalScope.ownerUserId ||
    media.workspaceId !== request.canonicalScope.workspaceId ||
    media.projectId !== request.canonicalScope.projectId ||
    media.editSessionId !== request.canonicalScope.editSessionId ||
    media.assignmentId !== assignment.assignmentId ||
    media.assignmentHash !== publicAssignment.assignmentHash ||
    media.planId !== plan.planId ||
    media.planHash !== publicPlan.envelope.planHash ||
    media.approvedWorkGraphHash !== approvedWorkGraph.approvedWorkGraphHash ||
    layer.assignmentReference.assignmentId !== assignment.assignmentId ||
    layer.assignmentReference.assignmentHash !== assignment.assignmentHash ||
    layer.planReference.planId !== plan.planId ||
    layer.planReference.planHash !== plan.planHash ||
    layer.exactTimelineRange.startFrameInclusive !== range.startFrameInclusive ||
    layer.exactTimelineRange.endFrameExclusive !== range.endFrameExclusive ||
    layer.exactTimelineRange.fps !== range.fps ||
    layer.captionSafeBehavior.finalOwner !== 'captions' ||
    layer.captionSafeBehavior.captionLayerOrder !== 100 ||
    layer.finalCompositionOwnedByBroll ||
    receipt.layerManifestHash !== layer.layerManifestHash ||
    receipt.preview.sha256 !== preview.objectSha256 ||
    preview.assignmentHash !== publicAssignment.assignmentHash ||
    preview.planHash !== publicPlan.envelope.planHash ||
    preview.approvedWorkGraphHash !== approvedWorkGraph.approvedWorkGraphHash ||
    receipt.outsideAuthorizedRangeModified ||
    preview.outsideAuthorizedRangeModified ||
    preview.finalCustomerExport ||
    !preview.privateOnly
  ) throw new Error('Canonical B-roll artifacts do not prove the requested Caption owner scope.')
}

async function rereadPrivateVisualReview(
  port: CanonicalBrollCaptionPrivateVisualReviewReadPort,
  request: Parameters<CanonicalBrollCaptionPrivateVisualReviewReadPort[
    'readExact']>[0],
): Promise<BrollCaptionPrivateVisualReview> {
  const first = brollCaptionPrivateVisualReviewSchema.parse(
    await port.readExact(structuredClone(request)))
  const second = brollCaptionPrivateVisualReviewSchema.parse(
    await port.readExact(structuredClone(request)))
  if (hashSkillValue(first) !== hashSkillValue(second)) {
    throw new Error('Canonical B-roll private visual review changed during reread.')
  }
  return first
}

function assertCanonicalReview(input: {
  request: BrollCaptionOwnerReadRequest
  review: BrollCaptionPrivateVisualReview
  layer: z.infer<typeof brollRemotionLayerManifestSchema>
  receipt: z.infer<typeof brollResultReceiptSchema>
  preview: z.infer<typeof brollPrivatePreviewMediaManifestSchema>
}): void {
  const { request, review, layer, receipt, preview } = input
  const range = request.canonicalScope.authorizedFrameRange
  if (
    receipt.preview.sha256 !== review.previewArtifactSha256 ||
    preview.objectSha256 !== review.previewArtifactSha256 ||
    review.layerManifestHash !== layer.layerManifestHash ||
    review.integrationQaHash !== receipt.integrationQaHash ||
    review.reviewedFrameRange.startFrameInclusive !== range.startFrameInclusive ||
    review.reviewedFrameRange.endFrameExclusive !== range.endFrameExclusive ||
    review.reviewedFrameRange.fps !== range.fps
  ) throw new Error('Canonical B-roll private visual review crossed its evidence.')
}

function createCropTimingProjection(
  request: BrollCaptionOwnerReadRequest,
  layer: z.infer<typeof brollRemotionLayerManifestSchema>,
) {
  const core = {
    schemaVersion: 'b_roll_caption_crop_timing_projection_v1' as const,
    ...structuredClone(request.canonicalScope),
    sourceTrim: structuredClone(layer.sourceTrim),
    exactTimelineRange: structuredClone(layer.exactTimelineRange),
    cropMode: layer.crop.mode,
    cropSafeSubjectArea: layer.crop.cropSafeSubjectArea,
    entryIntent: 'respect_story_timing_entry' as const,
    exitIntent: 'respect_story_timing_exit' as const,
  }
  return Object.freeze({
    ...core,
    projectionDigestSha256: hashSkillValue(core),
  })
}

function createVisibleTextEvidence(
  request: BrollCaptionOwnerReadRequest,
  review: BrollCaptionPrivateVisualReview,
) {
  const core = {
    schemaVersion: 'b_roll_caption_visible_text_evidence_v1' as const,
    ...structuredClone(request.canonicalScope),
    inspectionDisposition: review.disposition,
    visibleTextRegionRefs: structuredClone(review.visibleTextRegionRefs),
    producerEvidenceRef: opaqueRef(
      review.reviewId,
      review.schemaVersion,
      review.reviewDigestSha256,
    ),
    providerOrModelIdentityExposed: false as const,
    privateOnly: true as const,
    publicDeliveryAllowed: false as const,
  }
  return Object.freeze({ ...core, evidenceDigestSha256: hashSkillValue(core) })
}

function createInspectionSourceAuthority(input: {
  request: BrollCaptionOwnerReadRequest
  result: BrollCaptionOwnerReadResult
  publicAssignment: SkillAssignment
  publicPlan: EditSkillPublicPlan
  approvedWorkGraph: EditSkillApprovedWorkGraph
  assignment: BrollSkillAssignment
  plan: z.infer<typeof brollPlanArtifactSchema>
  receipt: z.infer<typeof brollResultReceiptSchema>
  preview: z.infer<typeof brollPrivatePreviewMediaManifestSchema>
  review: BrollCaptionPrivateVisualReview
}): CanonicalBrollCaptionInspectionSourceAuthority {
  const normalized = input.receipt.selectedArtifact.normalizedArtifact
  const ownerResultRef = opaqueRef(
    input.result.resultId,
    input.result.schemaVersion,
    input.result.resultDigestSha256,
  )
  const core = inspectionSourceAuthorityCoreSchema.parse({
    schemaVersion:
      CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_AUTHORITY_VERSION,
    authorityId: `broll.caption.inspection-source.${
      input.result.resultDigestSha256.slice(0, 40)}`,
    canonicalScope: structuredClone(input.request.canonicalScope),
    ownerRequestRef: structuredClone(input.result.ownerRequestRef),
    ownerResultRef,
    brollAssignmentRef: opaqueRef(
      input.assignment.assignmentId,
      input.assignment.schemaVersion,
      input.assignment.assignmentHash,
    ),
    brollPlanRef: opaqueRef(
      input.plan.planId,
      input.plan.schemaVersion,
      input.plan.planHash,
    ),
    brollApprovedWorkGraphRef: opaqueRef(
      `${input.assignment.assignmentId}.approved-work-graph`,
      input.approvedWorkGraph.schemaVersion,
      input.approvedWorkGraph.approvedWorkGraphHash,
    ),
    brollCanonicalWorkGraphRef: opaqueRef(
      `${input.assignment.assignmentId}.canonical-work-graph`,
      input.approvedWorkGraph.pluginWorkGraphType,
      input.approvedWorkGraph.pluginWorkGraphHash,
    ),
    brollResultReceiptRef: structuredClone(
      input.result.brollResultReceiptRef),
    selectedMediaManifestRef: structuredClone(
      input.result.selectedMediaManifestRef),
    layoutOccupancyRef: structuredClone(input.result.layoutOccupancyRef),
    privateVisualReviewRef: opaqueRef(
      input.review.reviewId,
      input.review.schemaVersion,
      input.review.reviewDigestSha256,
    ),
    previewArtifactRef: opaqueRef(
      `broll.preview.${input.preview.objectSha256.slice(0, 32)}`,
      input.preview.schemaVersion,
      input.preview.objectSha256,
    ),
    integrationQaRef: opaqueRef(
      `broll.integration-qa.${input.receipt.integrationQaHash.slice(0, 32)}`,
      'b_roll_integration_qa_v1',
      input.receipt.integrationQaHash,
    ),
    selectedNormalizedArtifactRef: opaqueRef(
      `broll.selected-normalized.${
        normalized.privateObjectIdentityHash.slice(0, 16)}`,
      'b_roll_selected_normalized_media_v1',
      normalized.sha256,
    ),
    selectedNormalizedArtifact: {
      privateObjectIdentityDigestSha256:
        normalized.privateObjectIdentityHash,
      byteLength: normalized.byteLength,
      mimeType: normalized.mimeType,
      frameCount: normalized.frameCount,
      frameRate: normalized.frameRate,
      audioRemoved: normalized.audioRemoved,
    },
    selectedSourceRoute: input.receipt.selectedArtifact.sourceRoute,
    exactCanonicalBrollWorkAndArtifactRereadVerified: true,
    exactPrivateVisualReviewRereadVerified: true,
    exactSelectedNormalizedArtifactIdentityVerified: true,
    persistedCreateOnlyAndExactReread: true,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    credentialsIncluded: false,
    sourceSelectionPerformedByCaption: false,
    cropOrTimingPerformedByCaption: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  if (input.publicAssignment.assignmentHash
      !== input.assignment.assignmentHash
    || input.publicPlan.envelope.planHash !== input.plan.planHash
    || input.result.brollResultReceiptRef.contentHash
      !== input.receipt.resultHash) {
    throw new Error(
      'Canonical B-roll inspection source authority crossed approved work.')
  }
  return parseCanonicalBrollCaptionInspectionSourceAuthority({
    ...core,
    authorityDigestSha256: hashSkillValue(core),
  })
}

function createInspectionSourceAuthorityReadPort(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
): CanonicalBrollCaptionInspectionSourceAuthorityReadPort {
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_b_roll_owner_private_inspection_source' as const,
    callerSuppliedAuthorityAccepted: false as const,
    async readExact(untrusted: {
      readonly ownerRequestRef: BrollCaptionOpaqueReference
      readonly ownerResultRef: BrollCaptionOpaqueReference
    }) {
      assertClosedContractTree(
        untrusted, 'Canonical B-roll inspection source locator')
      const ownerRequestRef = domainRefSchema.parse(untrusted.ownerRequestRef)
      const ownerResultRef = domainRefSchema.parse(untrusted.ownerResultRef)
      const authority = await readJson(
        objectPort,
        inspectionSourceAuthorityPath(prefix, ownerResultRef),
        parseCanonicalBrollCaptionInspectionSourceAuthority,
      )
      if (!authority) return null
      if (!sameRef(authority.ownerRequestRef, ownerRequestRef)
        || !sameRef(authority.ownerResultRef, ownerResultRef)) {
        throw new Error(
          'Canonical B-roll inspection source authority crossed its locator.')
      }
      return authority
    },
  })
  admittedInspectionSourceReaders.add(port)
  return port
}

async function assertSnapshotAuthority(
  port: CanonicalCaptionBrollApprovedSnapshotReadPort,
  request: BrollCaptionOwnerReadRequest,
): Promise<void> {
  const readInput = {
    approvedSnapshotRef: structuredClone(request.canonicalScope.approvedSnapshotRef),
  }
  const first = await port.readExact(readInput)
  const second = await port.readExact(readInput)
  assertClosedContractTree(first, 'Canonical B-roll snapshot authority')
  assertClosedContractTree(second, 'Canonical B-roll snapshot authority')
  const expected = {
    canonicalScope: request.canonicalScope,
    planningConstraintRef: request.planningConstraintRef,
  }
  if (hashSkillValue(first) !== hashSkillValue(second)
    || hashSkillValue(first) !== hashSkillValue(expected)) {
    throw new Error('Canonical B-roll Caption request is stale against its snapshot.')
  }
}

async function readArtifact<T>(
  store: EditSkillArtifactStore,
  reference: EditSkillArtifactReference,
  scope: { ownerUserId: string; workspaceId: string; projectId: string },
  parser: (value: unknown) => T,
): Promise<T> {
  const first = parser(await store.readJson({ reference, ...scope }))
  const second = parser(await store.readJson({ reference, ...scope }))
  if (hashSkillValue(first) !== hashSkillValue(second)
    || hashSkillValue(first) !== reference.sha256) {
    throw new Error('Canonical B-roll output changed during exact reread.')
  }
  return first
}

async function persistProjectedRecord(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  prefix: string
  kind: string
  id: string
  version: string
  digest: string
  value: unknown
}) {
  await persistJson(
    input.port,
    `${input.prefix}/${input.kind}/${input.digest}.json`,
    input.value,
  )
  return opaqueRef(input.id, input.version, input.digest)
}

async function persistJson(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical B-roll Caption owner record size is invalid.')
  }
  const contentSha256 = createHash('sha256').update(body).digest('hex')
  await port.createOnly({ objectPath: path, body, contentSha256 })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('Canonical B-roll Caption owner create-only reread failed.')
  }
}

async function readJson<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  parser: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical B-roll Caption owner record bytes are invalid.')
  }
  return parser(JSON.parse(body.toString('utf8')) as unknown)
}

function resultPath(prefix: string, request: BrollCaptionOwnerReadRequest): string {
  return `${prefix}/results/${request.requestDigestSha256}.json`
}

function inspectionSourceAuthorityPath(
  prefix: string,
  ownerResultRef: BrollCaptionOpaqueReference,
): string {
  const ref = domainRefSchema.parse(ownerResultRef)
  return `${prefix}/inspection-source-authorities/${ref.contentHash}.json`
}

function opaqueRef(id: string, version: string, contentHash: string) {
  return domainRefSchema.parse({ id, version, contentHash })
}

function sameRef(
  left: BrollCaptionOpaqueReference,
  right: BrollCaptionOpaqueReference,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|(?:secret|token|password|credential)=/iu
        .test(current)) {
        throw new Error(`${label} contains unsafe text.`)
      }
    } else if (Array.isArray(current)) {
      stack.push(...current)
    } else if (current && typeof current === 'object') {
      stack.push(...Object.values(current))
    }
  }
}

function assertResultMatchesRequest(
  request: BrollCaptionOwnerReadRequest,
  result: BrollCaptionOwnerReadResult,
): void {
  if (hashSkillValue(result.canonicalScope) !== hashSkillValue(request.canonicalScope)
    || result.ownerRequestRef.id !== request.requestId
    || result.ownerRequestRef.version !== request.schemaVersion
    || result.ownerRequestRef.contentHash !== request.requestDigestSha256) {
    throw new Error('Canonical B-roll Caption result crossed its request.')
  }
}

function parseBrollCaptionOwnerReadRequest(
  value: unknown,
): BrollCaptionOwnerReadRequest {
  const parsed = brollCaptionOwnerReadRequestSchema.parse(value)
  return { ...parsed, brollManifestRef: exactBrollManifestRef() }
}

function parseBrollCaptionOwnerReadResult(
  value: unknown,
): BrollCaptionOwnerReadResult {
  const parsed = brollCaptionOwnerReadResultSchema.parse(value)
  return { ...parsed, brollManifestRef: exactBrollManifestRef() }
}

function exactBrollManifestRef(): BrollCaptionManifestReference {
  const reference = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  if (reference.skillKey !== 'b_roll'
    || reference.skillVersion !== '1.0.0'
    || reference.contractVersion !== 'b_roll.skill_contract.v1') {
    throw new Error('Canonical B-roll manifest identity changed unexpectedly.')
  }
  return {
    schemaVersion: 'edit-skill-manifest-reference-v1',
    skillKey: 'b_roll',
    skillVersion: '1.0.0',
    contractVersion: 'b_roll.skill_contract.v1',
    manifestHash: reference.manifestHash,
  }
}

function assertDependencies(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  artifactStore: EditSkillArtifactStore
  approvedSnapshotReadPort: CanonicalCaptionBrollApprovedSnapshotReadPort
  privateVisualReviewReadPort:
    CanonicalBrollCaptionPrivateVisualReviewReadPort
}): void {
  if (!input.objectPort || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
    || !input.artifactStore || typeof input.artifactStore.readJson !== 'function'
    || !input.approvedSnapshotReadPort
    || typeof input.approvedSnapshotReadPort.readExact !== 'function'
    || !admittedVisualReviewReaders.has(input.privateVisualReviewReadPort)) {
    throw new Error('Canonical B-roll Caption owner dependencies are incomplete.')
  }
}
