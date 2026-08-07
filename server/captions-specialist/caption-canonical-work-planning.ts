import { z } from 'zod'

import type {
  CanonicalCaptionSpecialistEstimateBindingMetadata,
  CanonicalCaptionSpecialistJobAssignmentIntent,
  CanonicalCaptionSpecialistPlanningBinding,
  CanonicalCaptionSpecialistPlanningBindingV1,
  CanonicalCaptionSpecialistPlanningBindingV2,
  CanonicalCaptionSpecialistPlanningBindingV3,
  CanonicalCaptionSpecialistPlanningProjection,
  CanonicalCaptionSpecialistPlanningProjectionV1,
  CanonicalCaptionSpecialistPlanningProjectionV2,
  CanonicalCaptionSpecialistPlanningProjectionV3,
  CanonicalCaptionSpecialistAssignmentTrigger,
  CanonicalCaptionTrackingJobType,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
  CANONICAL_CAPTION_SPECIALIST_JOB_ASSIGNMENT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
  type CanonicalCaptionSpecialistInitialArtifactRef,
  type CanonicalCaptionSpecialistWorkItemInput,
  type CanonicalCaptionSpecialistWorkItemInputV1,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CAPTIONS_BOUNDARY_JOB_TYPES,
  CAPTIONS_SCENE_JOB_TYPES,
  CAPTIONS_SUPPORTED_JOB_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  CAPTIONS_VIDEO_JOB_TYPES,
  type CaptionsSupportedJobType,
} from
  '../../src/types/captions-specialist'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseProfessionalSkillCompositionTrace,
} from '../../src/lib/professional-skills/professional-skill-composition-trace'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseCaptionEarlyPlanningBundle } from './caption-early-planning'
import { canonicalCaptionMasterTimingDigest } from
  './caption-master-timing-authority'
import { sha256AuthorityValue, stableAuthorityStringify } from
  '../services/private-edit-authority-store'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const trackingJobSchema = z.enum([
  'resolve_subject_occluded_typography',
  'resolve_object_anchored_typography',
  'resolve_environmental_typography',
])
const crossSystemTargetSchema = z.enum([
  'broll', 'living_frame', 'map', 'chart', 'diagram', 'transition',
])
const bindingBodySchema = z.object({
  bindingId: safeKey,
  canonicalScope: z.object({
    ownerUserId: safeKey,
    workspaceId: safeKey,
    projectId: safeKey,
    editSessionId: safeKey,
    planningRequestId: safeKey,
    outputId: safeKey,
  }).strict(),
  confirmedOutputFrame: z.object({
    width: z.number().int().min(320).max(16_384),
    height: z.number().int().min(180).max(16_384),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
    confirmedOutputFrameRef: refSchema,
  }).strict(),
  professionalSkillCompositionTraceRef: refSchema,
  earlyPlanningBundleRef: refSchema,
  canonicalTranscriptRef: refSchema,
  masterTimingRef: refSchema,
  captionEstimateInputRef: refSchema,
  scenePolicies: z.array(z.object({
    sceneId: safeKey,
    trackingJobType: trackingJobSchema.nullable(),
    crossSystemTarget: crossSystemTargetSchema.nullable(),
  }).strict()).max(128),
  privateArtifact: z.literal(true),
  byteFree: z.literal(true),
  rawChatIncluded: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  approvedSnapshotPredictedOrInjected: z.literal(false),
  workCreationAuthorityGrantedToCaption: z.literal(false),
  operationDispatchAuthorityGranted: z.literal(false),
  providerRuntimeAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const bindingV1WithoutDigestSchema = bindingBodySchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION),
}).strict()
const assignmentTriggerSchema = z.enum([
  'approved_early_plan',
  'approved_picture_lock',
  'approved_boundary_requirement',
  'hq_mediated_support_request',
  'canonical_caption_qa_repair',
  'canonical_caption_output_recomposition',
  'canonical_caption_result_inspection',
  'canonical_caption_boundary_inspection',
])
const assignmentIntentSchema:
z.ZodType<CanonicalCaptionSpecialistJobAssignmentIntent> = z.object({
  assignmentId: safeKey,
  jobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
  scopeLevel: z.enum(['video', 'scene', 'boundary']),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRange: z.object({
    startFrame: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
  }).strict(),
  trigger: assignmentTriggerSchema,
  selectionEvidenceRef: refSchema,
  sourceSupportRequestRef: refSchema.nullable(),
  reasonCodes: z.array(safeKey).min(1).max(16),
  callerMayCreateWork: z.literal(false),
  captionMayDispatchPeerDirectly: z.literal(false),
  captionMayExpandScope: z.literal(false),
  browserMayMarkComplete: z.literal(false),
}).strict()
const bindingV2WithoutDigestSchema = bindingBodySchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION),
  assignmentIntents: z.array(assignmentIntentSchema).min(1).max(240),
  assignmentsSelectedByCanonicalPlanOwner: z.literal(true),
  oneAllFeatureEditFabricated: z.literal(false),
}).strict()
const bindingV3WithoutDigestSchema = bindingBodySchema
  .omit({ canonicalTranscriptRef: true })
  .extend({
    schemaVersion: z.literal(
      CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION),
    canonicalTranscriptExpectationRef: refSchema,
    postapprovalCanonicalTranscriptResolutionRequired: z.literal(true),
    assignmentIntents: z.array(assignmentIntentSchema).min(1).max(240),
    assignmentsSelectedByCanonicalPlanOwner: z.literal(true),
    oneAllFeatureEditFabricated: z.literal(false),
  }).strict()
const bindingV1Schema: z.ZodType<CanonicalCaptionSpecialistPlanningBindingV1> =
  bindingV1WithoutDigestSchema.extend({ bindingDigestSha256: sha256 }).strict()
const bindingV2Schema: z.ZodType<CanonicalCaptionSpecialistPlanningBindingV2> =
  bindingV2WithoutDigestSchema.extend({ bindingDigestSha256: sha256 }).strict()
const bindingV3Schema: z.ZodType<CanonicalCaptionSpecialistPlanningBindingV3> =
  bindingV3WithoutDigestSchema.extend({ bindingDigestSha256: sha256 }).strict()
const projectionBodySchema = z.object({
  projectionId: safeKey,
  disposition: z.enum([
    'planning_work_projected_downstream_caption_execution_required',
    'no_caption_work_owner_restraint_preserved',
  ]),
  planningBindingRef: refSchema,
  compositionTraceRef: refSchema,
  earlyPlanningBundleRef: refSchema,
  outputId: safeKey,
  captionEstimateLineKey: safeKey.nullable(),
  projectedWorkItemKeys: z.array(safeKey).max(240),
  projectedJobTypes: z.array(z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).max(240),
  projectedSceneIds: z.array(safeKey).max(128),
  postapprovalTranscriptBindingRequired: z.boolean(),
  authenticatedOwnerResumeRequired: z.boolean(),
  downstreamCaptionRenderWorkRequired: z.boolean(),
  deterministicRenderedCaptionQaRequired: z.boolean(),
  qualifiedCompleteTimeVisualReviewRequired: z.boolean(),
  independentPrivateReviewRequired: z.boolean(),
  planningJobsClaimFinishedCaptionMedia: z.literal(false),
  fullyApprovedCaptionExecutionCoverageClaimed: z.literal(false),
  captionWorkItemsCreatedByCanonicalPlanner: z.literal(true),
  captionWorkItemsCreatedByBrowser: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  providerRuntimeAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const projectionV1WithoutDigestSchema = projectionBodySchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION),
}).strict()
const projectionV2WithoutDigestSchema = projectionBodySchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION),
  assignmentIntentRefs: z.array(refSchema).min(1).max(240),
  projectedBoundaryIds: z.array(safeKey).max(128),
  exactAssignmentIntentCoverage: z.literal(true),
  repairOrSupportWorkProjectedOnlyFromTypedTrigger: z.literal(true),
  oneAllFeatureEditFabricated: z.literal(false),
}).strict()
const projectionV3WithoutDigestSchema = projectionV2WithoutDigestSchema.omit({
  schemaVersion: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION),
  canonicalTranscriptExpectationRef: refSchema,
  postapprovalCanonicalTranscriptResolutionRequired: z.literal(true),
}).strict()
const projectionV1Schema:
z.ZodType<CanonicalCaptionSpecialistPlanningProjectionV1> =
  projectionV1WithoutDigestSchema.extend({ projectionDigestSha256: sha256 })
    .strict()
const projectionV2Schema:
z.ZodType<CanonicalCaptionSpecialistPlanningProjectionV2> =
  projectionV2WithoutDigestSchema.extend({ projectionDigestSha256: sha256 })
    .strict()
const projectionV3Schema:
z.ZodType<CanonicalCaptionSpecialistPlanningProjectionV3> =
  projectionV3WithoutDigestSchema.extend({ projectionDigestSha256: sha256 })
    .strict()

type CaptionComponents = CanonicalPlanComponentsInput & {
  professionalSkillPlan?: Record<string, unknown>
  captionEarlyPlanningBundle?: Record<string, unknown>
  captionSpecialistPlanningBinding?: Record<string, unknown>
}

interface JobSpec {
  jobType: CaptionsSupportedJobType
  scopeLevel: 'video' | 'scene' | 'boundary'
  sceneId: string | null
  boundaryId: string | null
  frameRange: { startFrame: number; endFrameExclusive: number }
  assignmentIntent: CanonicalCaptionSpecialistJobAssignmentIntent | null
}

export interface CanonicalCaptionPlanningProjectionWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  dependencyKeys: string[]
  approvedToolIds: string[]
  providerExecutionMode: string
  maximumCreditBudget?: number
  required: boolean
  expectedOutputs: Array<{
    artifactType?: string
    assetRole?: string
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
  }>
  executionInput: Record<string, unknown>
}

export const CANONICAL_CAPTION_SPECIALIST_DOWNSTREAM_APPROVAL_GATES = [
  'caption_rendered_media_work_binding',
  'canonical_postrender_visual_qa_work_and_lifecycle_binding',
  'canonical_caption_independent_private_review_binding',
] as const

export function canonicalCaptionSpecialistMissingApprovalGates(
  projection: CanonicalCaptionSpecialistPlanningProjection | undefined,
  coverage: {
    renderedMediaWorkBound?: boolean
    postrenderVisualQaWorkAndLifecycleBound?: boolean
    independentPrivateReviewBound?: boolean
  } = {},
): Array<typeof CANONICAL_CAPTION_SPECIALIST_DOWNSTREAM_APPROVAL_GATES[number]> {
  return !projection || projection.disposition ===
    'no_caption_work_owner_restraint_preserved'
    ? []
    : CANONICAL_CAPTION_SPECIALIST_DOWNSTREAM_APPROVAL_GATES.filter((gate) => {
        if (gate === 'caption_rendered_media_work_binding') {
          return coverage.renderedMediaWorkBound !== true
        }
        if (gate ===
          'canonical_postrender_visual_qa_work_and_lifecycle_binding') {
          return coverage.postrenderVisualQaWorkAndLifecycleBound !== true
        }
        return coverage.independentPrivateReviewBound !== true
      })
}

export function parseCanonicalCaptionSpecialistPlanningBinding(
  value: unknown,
): CanonicalCaptionSpecialistPlanningBinding {
  assertClosedContractTree(value, 'Canonical Caption planning binding')
  const version = z.object({ schemaVersion: safeKey }).passthrough()
    .parse(value).schemaVersion
  const parsed = version ===
    CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION
    ? bindingV1Schema.parse(value)
    : version === CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION
      ? bindingV2Schema.parse(value)
      : version === CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
        ? bindingV3Schema.parse(value)
      : (() => { throw new Error('Unsupported Caption planning binding version.') })()
  if (parsed.bindingDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'bindingDigestSha256')) {
    throw new Error('Canonical Caption planning binding digest failed.')
  }
  if (new Set(parsed.scenePolicies.map((item) => item.sceneId)).size
      !== parsed.scenePolicies.length) {
    throw new Error('Canonical Caption planning scene policies are duplicated.')
  }
  if (isAssignmentPlanningBinding(parsed)) {
    assertAssignmentIntentSet(parsed)
  }
  return structuredClone(parsed)
}

export function parseCanonicalCaptionSpecialistPlanningProjection(
  value: unknown,
): CanonicalCaptionSpecialistPlanningProjection {
  assertClosedContractTree(value, 'Canonical Caption planning projection')
  const version = z.object({ schemaVersion: safeKey }).passthrough()
    .parse(value).schemaVersion
  const parsed = version ===
    CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION
    ? projectionV1Schema.parse(value)
    : version === CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION
      ? projectionV2Schema.parse(value)
      : version === CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION
        ? projectionV3Schema.parse(value)
      : (() => { throw new Error('Unsupported Caption planning projection version.') })()
  if (parsed.projectionDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'projectionDigestSha256')
    || new Set(parsed.projectedWorkItemKeys).size
      !== parsed.projectedWorkItemKeys.length
    || new Set(parsed.projectedSceneIds).size !== parsed.projectedSceneIds.length) {
    throw new Error('Canonical Caption planning projection is invalid.')
  }
  if (isAssignmentPlanningProjection(parsed)
    && (new Set(parsed.assignmentIntentRefs.map(refKey)).size !==
      parsed.assignmentIntentRefs.length
      || new Set(parsed.projectedBoundaryIds).size !==
        parsed.projectedBoundaryIds.length
      || parsed.assignmentIntentRefs.length !==
        parsed.projectedWorkItemKeys.length)) {
    throw new Error('Canonical Caption assignment projection is invalid.')
  }
  return structuredClone(parsed)
}

export function prepareCanonicalCaptionSpecialistPlanningProjection(input: {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  components: CaptionComponents
  estimate: CanonicalEstimateInput
  existingWorkItems: CanonicalWorkItemInput[]
}): {
  projection: CanonicalCaptionSpecialistPlanningProjection | null
  workItems: CanonicalWorkItemInput[]
} {
  const captionCompositionDisposition = input.components.professionalSkillPlan
    ? parseCompositionTrace(input.components.professionalSkillPlan)
        .entries[0].disposition
    : null
  const hasAnyCaptionPlanningComponent = Boolean(
    captionCompositionDisposition === 'selected'
    || captionCompositionDisposition === 'restrained'
    || input.components.captionEarlyPlanningBundle
    || input.components.captionSpecialistPlanningBinding,
  )
  if (!hasAnyCaptionPlanningComponent) {
    return { projection: null, workItems: [] }
  }
  if (!input.components.professionalSkillPlan
    || !input.components.captionEarlyPlanningBundle
    || !input.components.captionSpecialistPlanningBinding) {
    throw new Error(
      'Canonical Caption planning requires the professional plan, early bundle, and planning binding together.',
    )
  }
  if (input.existingWorkItems.some((workItem) =>
    workItem.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS)) {
    throw new Error(
      'Caption specialist work items must be created only by the canonical planner.',
    )
  }
  const trace = parseCompositionTrace(input.components.professionalSkillPlan)
  const bundle = parseCaptionEarlyPlanningBundle(
    input.components.captionEarlyPlanningBundle)
  const binding = parseCanonicalCaptionSpecialistPlanningBinding(
    input.components.captionSpecialistPlanningBinding)
  assertPlanningLineage({ ...input, trace, bundle, binding })
  const entry = trace.entries[0]
  const planningBindingRef = {
    id: binding.bindingId,
    version: binding.schemaVersion,
    contentHash: binding.bindingDigestSha256,
  }
  const compositionTraceRef = {
    id: trace.traceId,
    version: trace.schemaVersion,
    contentHash: trace.traceDigestSha256,
  }
  const earlyPlanningBundleRef = {
    id: bundle.bundleId,
    version: bundle.schemaVersion,
    contentHash: bundle.bundleDigestSha256,
  }
  if (entry.disposition === 'restrained') {
    if (isAssignmentPlanningBinding(binding)) {
      throw new Error(
        'Owner-restraint plans cannot carry selected Caption assignments.',
      )
    }
    if (input.estimate.lineItems.some(isCaptionEstimateLine)) {
      throw new Error('no_captions cannot retain hidden Caption estimate work.')
    }
    return {
      projection: projection({
        idSeed: binding.bindingDigestSha256,
        disposition: 'no_caption_work_owner_restraint_preserved',
        planningBindingRef,
        compositionTraceRef,
        earlyPlanningBundleRef,
        outputId: binding.canonicalScope.outputId,
        captionEstimateLineKey: null,
        workItems: [],
        postapprovalTranscriptBindingRequired: false,
        authenticatedOwnerResumeRequired: false,
        downstreamCaptionRenderWorkRequired: false,
        deterministicRenderedCaptionQaRequired: false,
        qualifiedCompleteTimeVisualReviewRequired: false,
        independentPrivateReviewRequired: false,
        planningBinding: binding,
      }),
      workItems: [],
    }
  }
  if (entry.disposition !== 'selected') {
    throw new Error(
      'Canonical Caption planning requires exact selection or owner restraint.',
    )
  }
  const estimateLine = requireCaptionEstimateLine({
    estimate: input.estimate,
    binding,
    traceRef: compositionTraceRef,
    bundleRef: earlyPlanningBundleRef,
  })
  const snapshotValidation = input.existingWorkItems.filter((workItem) =>
    workItem.workItemType === 'validate_approved_snapshot')
  if (snapshotValidation.length !== 1) {
    throw new Error(
      'Selected Caption planning requires one canonical snapshot-validation work item.',
    )
  }
  const jobSpecs = createJobSpecs(
    bundle,
    binding,
    input.components.timingSummary.totalFrames,
  )
  if (input.existingWorkItems.length + jobSpecs.length > 256) {
    throw new Error(
      'Caption planning exceeds the canonical work-graph bound.',
    )
  }
  const workItems = createWorkItems({
    specs: jobSpecs,
    binding,
    snapshotValidationKey: snapshotValidation[0]!.workItemKey,
    sourceSequenceItemIds: input.components.sourceSequence.map(
      (item) => item.sourceSequenceItemId),
    sourceCleanupDecisionIds: input.components.sourceCleanupPlan.decisions.map(
      (item) => item.decisionId),
  })
  return {
    projection: projection({
      idSeed: binding.bindingDigestSha256,
      disposition:
        'planning_work_projected_downstream_caption_execution_required',
      planningBindingRef,
      compositionTraceRef,
      earlyPlanningBundleRef,
      outputId: binding.canonicalScope.outputId,
      captionEstimateLineKey: estimateLine.lineKey,
      workItems,
      postapprovalTranscriptBindingRequired: true,
      authenticatedOwnerResumeRequired: workItems.some((item) => {
        const jobType = String(item.executionInput.captionJobType)
        return jobType.includes('spatial')
          || jobType.includes('occluded')
          || jobType.includes('anchored')
          || jobType.includes('environmental')
          || jobType.includes('finish_readiness')
          || jobType.includes('broll')
          || jobType.includes('living_frame')
      }),
      downstreamCaptionRenderWorkRequired: true,
      deterministicRenderedCaptionQaRequired: true,
      qualifiedCompleteTimeVisualReviewRequired: true,
      independentPrivateReviewRequired: true,
      planningBinding: binding,
    }),
    workItems,
  }
}

export function assertCanonicalCaptionSpecialistPlanningProjectionMatchesWorkItems(
  projection: CanonicalCaptionSpecialistPlanningProjection,
  workItems: CanonicalCaptionPlanningProjectionWorkItem[],
  planningBindingValue?: unknown,
): void {
  const captionWorkItems = workItems.filter((item) =>
    item.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS)
  if (projection.disposition === 'no_caption_work_owner_restraint_preserved') {
    if (captionWorkItems.length !== 0
      || projection.projectedWorkItemKeys.length !== 0
      || projection.projectedJobTypes.length !== 0
      || projection.projectedSceneIds.length !== 0
      || projection.captionEstimateLineKey !== null
      || projection.postapprovalTranscriptBindingRequired
      || projection.authenticatedOwnerResumeRequired
      || projection.downstreamCaptionRenderWorkRequired
      || projection.deterministicRenderedCaptionQaRequired
      || projection.qualifiedCompleteTimeVisualReviewRequired
      || projection.independentPrivateReviewRequired) {
      throw new Error(
        'Canonical no-captions restraint cannot retain Caption planning or downstream execution work.',
      )
    }
    return
  }
  if (projection.projectedWorkItemKeys.length === 0
    || projection.projectedWorkItemKeys.length
      !== projection.projectedJobTypes.length
    || captionWorkItems.length !== projection.projectedWorkItemKeys.length
    || projection.captionEstimateLineKey === null
    || !projection.postapprovalTranscriptBindingRequired
    || !projection.downstreamCaptionRenderWorkRequired
    || !projection.deterministicRenderedCaptionQaRequired
    || !projection.qualifiedCompleteTimeVisualReviewRequired
    || !projection.independentPrivateReviewRequired) {
    throw new Error(
      'Selected Caption planning projection is missing exact work or downstream coverage requirements.',
    )
  }
  let assignmentBinding:
    | CanonicalCaptionSpecialistPlanningBindingV2
    | CanonicalCaptionSpecialistPlanningBindingV3
    | null = null
  if (isAssignmentPlanningProjection(projection)) {
    if (planningBindingValue === undefined) {
      throw new Error(
        'Canonical Caption assignment projection requires its exact planning binding.',
      )
    }
    const parsedBinding = parseCanonicalCaptionSpecialistPlanningBinding(
      planningBindingValue)
    if (!isAssignmentPlanningBinding(parsedBinding)
      || (projection.schemaVersion ===
        CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION) !==
        (parsedBinding.schemaVersion ===
          CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION)
      || refKey(projection.planningBindingRef) !== refKey({
        id: parsedBinding.bindingId,
        version: parsedBinding.schemaVersion,
        contentHash: parsedBinding.bindingDigestSha256,
      })
      || projection.assignmentIntentRefs.map(refKey).join('|') !==
        parsedBinding.assignmentIntents.map(assignmentIntentRef)
          .map(refKey).join('|')
      || (projection.schemaVersion ===
        CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION
        && (parsedBinding.schemaVersion !==
          CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
          || !exactRef(
            projection.canonicalTranscriptExpectationRef,
            parsedBinding.canonicalTranscriptExpectationRef)))) {
      throw new Error(
        'Canonical Caption assignment projection crossed its binding.',
      )
    }
    assignmentBinding = parsedBinding
  }
  const captionByKey = new Map(captionWorkItems.map((item) =>
    [item.workItemKey, item]))
  const projectedKeySet = new Set(projection.projectedWorkItemKeys)
  if (captionByKey.size !== captionWorkItems.length
    || captionWorkItems.some((item) => !projectedKeySet.has(item.workItemKey))) {
    throw new Error(
      'Canonical Caption work graph contains duplicate or unprojected planning work.',
    )
  }
  const sceneIds = new Set<string>()
  const boundaryIds = new Set<string>()
  for (const [index, workItemKey] of
    projection.projectedWorkItemKeys.entries()) {
    const workItem = captionByKey.get(workItemKey)
    if (!workItem) {
      throw new Error(
        'Canonical Caption planning projection references missing work.',
      )
    }
    const expectedJobType = projection.projectedJobTypes[index]
    const executionInput = workItem.executionInput
    const outputs = workItem.expectedOutputs
    if (workItem.workItemType !== 'custom'
      || workItem.required !== true
      || workItem.approvedToolIds.length !== 0
      || workItem.providerExecutionMode !== 'none'
      || workItem.maximumCreditBudget !== 0
      || workItem.dependencyKeys.length !== 1
      || !([
        CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
        CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION,
        CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION,
      ] as readonly string[]).includes(String(executionInput.schemaVersion))
      || executionInput.operation
        !== CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION
      || executionInput.captionJobType !== expectedJobType
      || executionInput.requestedMode !== 'planning'
      || executionInput.outputId !== projection.outputId
      || executionInput.directPeerDispatchRequested !== false
      || executionInput.providerCallRequested !== false
      || executionInput.timelineMutationRequested !== false
      || executionInput.assetMutationRequested !== false
      || executionInput.qaApprovalRequested !== false
      || executionInput.billingAuthorityRequested !== false
      || executionInput.publicDeliveryRequested !== false
      || executionInput.productionAuthorityRequested !== false
      || outputs.length !== 1
      || outputs[0]?.artifactType !== 'caption_specialist_job_receipt'
      || outputs[0]?.assetRole !== 'qa'
      || outputs[0]?.contentType !== 'application/json'
      || outputs[0]?.required !== true
      || outputs[0]?.previewPlaceholderAllowed !== false) {
      throw new Error(
        'Canonical Caption planning work no longer matches its immutable projection.',
      )
    }
    if (typeof executionInput.sceneId === 'string') {
      sceneIds.add(executionInput.sceneId)
    } else if (executionInput.sceneId !== null) {
      throw new Error('Canonical Caption planning scene lineage is malformed.')
    }
    if (typeof executionInput.boundaryId === 'string') {
      boundaryIds.add(executionInput.boundaryId)
    } else if (executionInput.boundaryId !== null) {
      throw new Error(
        'Canonical Caption planning boundary lineage is malformed.')
    }
    if (projection.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION) {
      const artifactValues = (executionInput as { initialArtifactRefs?: unknown })
        .initialArtifactRefs
      const expectationArtifact = Array.isArray(artifactValues)
        ? artifactValues.find((artifact): artifact is
          CanonicalCaptionSpecialistInitialArtifactRef => Boolean(
          artifact && typeof artifact === 'object'
          && (artifact as { artifactType?: unknown }).artifactType ===
            'canonical_transcript_planning_expectation',
        ))
        : undefined
      if (!expectationArtifact
        || expectationArtifact.producerSkillKey !== 'canonical_transcript'
        || !expectationArtifact.privateArtifact
        || !expectationArtifact.byteFreeRef
        || expectationArtifact.sourceSupportRequestRef !== null
        || !exactRef(
          expectationArtifact,
          projection.canonicalTranscriptExpectationRef,
        )) {
        throw new Error(
          'Canonical Caption V3 work crossed its transcript planning expectation.',
        )
      }
    }
    if (isAssignmentPlanningProjection(projection)) {
      const expectedAssignmentRef = projection.assignmentIntentRefs[index]
      const assignment = assignmentBinding?.assignmentIntents[index]
      const expectedWorkVersion = projection.schemaVersion ===
        CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION
        ? CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
        : CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION
      if (executionInput.schemaVersion !== expectedWorkVersion
        || !assignment
        || stableAuthorityStringify(executionInput.assignmentIntentRef)
          !== stableAuthorityStringify(expectedAssignmentRef)
        || executionInput.assignmentTrigger !==
          canonicalCaptionAssignmentTriggerForJob(expectedJobType)
        || executionInput.captionJobType !== assignment.jobType
        || executionInput.scopeLevel !== assignment.scopeLevel
        || executionInput.outputId !== assignment.outputId
        || executionInput.sceneId !== assignment.sceneId
        || executionInput.boundaryId !== assignment.boundaryId
        || stableAuthorityStringify(executionInput.authorizedFrameRanges)
          !== stableAuthorityStringify([assignment.authorizedFrameRange])
        || stableAuthorityStringify(executionInput.selectionEvidenceRef)
          !== stableAuthorityStringify(assignment.selectionEvidenceRef)
        || stableAuthorityStringify(executionInput.sourceSupportRequestRef)
          !== stableAuthorityStringify(assignment.sourceSupportRequestRef)) {
        throw new Error(
          'Canonical Caption work lost its exact assignment intent.',
        )
      }
    }
  }
  if (stableAuthorityStringify([...sceneIds])
    !== stableAuthorityStringify(projection.projectedSceneIds)) {
    throw new Error(
      'Canonical Caption planning scene lineage no longer matches its projection.',
    )
  }
  if (isAssignmentPlanningProjection(projection)
    && (stableAuthorityStringify([...boundaryIds]) !==
      stableAuthorityStringify(projection.projectedBoundaryIds)
      || projection.assignmentIntentRefs.length !==
        projection.projectedWorkItemKeys.length)) {
    throw new Error(
      'Canonical Caption planning boundary or assignment lineage no longer matches its projection.',
    )
  }
}

function parseCompositionTrace(plan: Record<string, unknown>) {
  const trace = plan.compositionTrace
  if (trace === undefined) {
    throw new Error(
      'The professional skill plan lacks its exact Caption composition trace.',
    )
  }
  return parseProfessionalSkillCompositionTrace(trace)
}

function assertPlanningLineage(input: {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  components: CaptionComponents
  trace: ReturnType<typeof parseProfessionalSkillCompositionTrace>
  bundle: ReturnType<typeof parseCaptionEarlyPlanningBundle>
  binding: CanonicalCaptionSpecialistPlanningBinding
}): void {
  const { binding, bundle, trace } = input
  const traceRef = {
    id: trace.traceId,
    version: trace.schemaVersion,
    contentHash: trace.traceDigestSha256,
  }
  const bundleRef = {
    id: bundle.bundleId,
    version: bundle.schemaVersion,
    contentHash: bundle.bundleDigestSha256,
  }
  const estimateRef = {
    id: bundle.estimateInput.componentId,
    version: bundle.estimateInput.componentVersion,
    contentHash: bundle.estimateInput.componentDigestSha256,
  }
  const scope = binding.canonicalScope
  const frame = binding.confirmedOutputFrame
  const canonicalFrame = input.components.confirmedSettings.outputFrame
  const inputRefKeys = new Set(bundle.inputRefs.map(refKey))
  const scenePolicies = binding.scenePolicies
  const opportunities = bundle.opportunityMap.opportunities
  if (scope.ownerUserId !== input.ownerUserId
    || scope.workspaceId !== input.workspaceId
    || scope.projectId !== input.projectId
    || scope.editSessionId !== input.editSessionId
    || scope.planningRequestId !== input.planningRequestId
    || scope.outputId !== bundle.canonicalScope.outputId
    || bundle.canonicalScope.ownerUserId !== input.ownerUserId
    || bundle.canonicalScope.workspaceId !== input.workspaceId
    || bundle.canonicalScope.projectId !== input.projectId
    || bundle.canonicalScope.editSessionId !== input.editSessionId
    || bundle.canonicalScope.planVersionId !== input.planningRequestId
    || bundle.canonicalScope.approvedSnapshotRef !== null
    || !exactRef(binding.professionalSkillCompositionTraceRef, traceRef)
    || !exactRef(binding.earlyPlanningBundleRef, bundleRef)
    || !exactRef(binding.captionEstimateInputRef, estimateRef)
    || !inputRefKeys.has(refKey(transcriptPlanningRef(binding)))
    || !inputRefKeys.has(refKey(binding.masterTimingRef))
    || binding.masterTimingRef.contentHash
      !== canonicalCaptionMasterTimingDigest(
        input.components.masterTimingPlan)
    || frame.width !== canonicalFrame.width
    || frame.height !== canonicalFrame.height
    || frame.fpsNumerator / frame.fpsDenominator !== canonicalFrame.fps
    || frame.confirmedOutputFrameRef.contentHash
      !== bundle.confirmedOutputFrame.confirmedOutputFrameDigestSha256
    || bundle.confirmedOutputFrame.width !== canonicalFrame.width
    || bundle.confirmedOutputFrame.height !== canonicalFrame.height
    || bundle.confirmedOutputFrame.outputId !== scope.outputId
    || scenePolicies.length !== opportunities.length) {
    throw new Error('Canonical Caption planning lineage is stale or crossed.')
  }
  const segmentById = new Map(input.components.segments.map((segment) =>
    [segment.segmentId, segment]))
  for (const [index, opportunity] of opportunities.entries()) {
    const policy = scenePolicies[index]
    const segment = segmentById.get(opportunity.sceneId)
    if (!policy || policy.sceneId !== opportunity.sceneId
      || policy.crossSystemTarget !== opportunity.handoffTarget
      || Boolean(policy.trackingJobType) !== opportunity.likelyNeedsTracking
      || !segment
      || segment.startFrame !== opportunity.planningFrameRange.startFrame
      || segment.endFrameExclusive
        !== opportunity.planningFrameRange.endFrameExclusive) {
      throw new Error(
        'Canonical Caption planning scene policy or timing is inconsistent.',
      )
    }
  }
  const restrained = trace.entries[0].disposition === 'restrained'
  if (restrained !== (bundle.restraint.restraint === 'no_captions')
    || (restrained && bundle.restraint.ownerApprovedRestraintRef === null)
    || (!restrained && bundle.restraint.captionWorkAllowed !== true)) {
    throw new Error('Canonical Caption selection/restraint lineage diverged.')
  }
}

function requireCaptionEstimateLine(input: {
  estimate: CanonicalEstimateInput
  binding: CanonicalCaptionSpecialistPlanningBinding
  traceRef: { id: string; version: string; contentHash: string }
  bundleRef: { id: string; version: string; contentHash: string }
}) {
  const lines = input.estimate.lineItems.filter(isCaptionEstimateLine)
  if (lines.length !== 1 || lines[0]!.estimatedCredits <= 0
    || lines[0]!.removable) {
    throw new Error(
      'Selected Caption planning requires one non-removable positive canonical estimate line.',
    )
  }
  const metadata = lines[0]!.metadata as unknown as
    CanonicalCaptionSpecialistEstimateBindingMetadata
  const expected: CanonicalCaptionSpecialistEstimateBindingMetadata = {
    schemaVersion: CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
    outputId: input.binding.canonicalScope.outputId,
    compositionTraceRef: input.traceRef,
    earlyPlanningBundleRef: input.bundleRef,
    captionEstimateInputRef: input.binding.captionEstimateInputRef,
    selectedComponentKeys: ['caption_design', 'caption_render_qa'],
    estimateOwnerRemainsCanonical: true,
    serviceFeeIncludedInCaptionWorkCost: false,
    billingAuthorityGrantedToCaption: false,
  }
  if (stableAuthorityStringify(metadata) !== stableAuthorityStringify(expected)) {
    throw new Error('Canonical Caption estimate metadata is stale or crossed.')
  }
  return lines[0]!
}

function isCaptionEstimateLine(line: CanonicalEstimateInput['lineItems'][number]) {
  return line.category === 'caption_specialist'
}

export function canonicalCaptionAssignmentTriggerForJob(
  jobType: CaptionsSupportedJobType,
): CanonicalCaptionSpecialistAssignmentTrigger {
  if ((CAPTIONS_VIDEO_JOB_TYPES as readonly string[]).includes(jobType)) {
    return 'approved_early_plan'
  }
  if ((CAPTIONS_SUPPORT_JOB_TYPES as readonly string[]).includes(jobType)) {
    return 'hq_mediated_support_request'
  }
  if (jobType === 'repair_caption_scene') {
    return 'canonical_caption_qa_repair'
  }
  if (jobType === 'recompose_caption_output') {
    return 'canonical_caption_output_recomposition'
  }
  if (jobType === 'inspect_caption_specific_result') {
    return 'canonical_caption_result_inspection'
  }
  if (jobType === 'inspect_caption_boundary_behavior') {
    return 'canonical_caption_boundary_inspection'
  }
  if ((CAPTIONS_BOUNDARY_JOB_TYPES as readonly string[]).includes(jobType)) {
    return 'approved_boundary_requirement'
  }
  if (jobType === 'reserve_caption_space'
    || jobType === 'plan_caption_blocking_preview') {
    return 'approved_early_plan'
  }
  return 'approved_picture_lock'
}

export function canonicalCaptionAssignmentScopeForJob(
  jobType: CaptionsSupportedJobType,
): 'video' | 'scene' | 'boundary' | 'support' {
  if ((CAPTIONS_VIDEO_JOB_TYPES as readonly string[]).includes(jobType)) {
    return 'video'
  }
  if ((CAPTIONS_SCENE_JOB_TYPES as readonly string[]).includes(jobType)) {
    return 'scene'
  }
  if ((CAPTIONS_BOUNDARY_JOB_TYPES as readonly string[]).includes(jobType)) {
    return 'boundary'
  }
  return 'support'
}

function assertAssignmentIntentSet(
  binding:
    | CanonicalCaptionSpecialistPlanningBindingV2
    | CanonicalCaptionSpecialistPlanningBindingV3,
): void {
  const ids = new Set<string>()
  const occurrences = new Set<string>()
  for (const assignment of binding.assignmentIntents) {
    const expectedTrigger = canonicalCaptionAssignmentTriggerForJob(
      assignment.jobType)
    const expectedScope = canonicalCaptionAssignmentScopeForJob(
      assignment.jobType)
    const supportJob = expectedScope === 'support'
    const scopeValid = supportJob
      ? true
      : assignment.scopeLevel === expectedScope
    const identifiersValid = assignment.scopeLevel === 'video'
      ? assignment.sceneId === null && assignment.boundaryId === null
      : assignment.scopeLevel === 'scene'
        ? assignment.sceneId !== null && assignment.boundaryId === null
        : assignment.boundaryId !== null
    const occurrence = [
      assignment.jobType,
      assignment.scopeLevel,
      assignment.outputId,
      assignment.sceneId ?? 'no-scene',
      assignment.boundaryId ?? 'no-boundary',
      assignment.authorizedFrameRange.startFrame,
      assignment.authorizedFrameRange.endFrameExclusive,
    ].join('|')
    if (ids.has(assignment.assignmentId)
      || occurrences.has(occurrence)
      || assignment.outputId !== binding.canonicalScope.outputId
      || assignment.trigger !== expectedTrigger
      || !scopeValid
      || !identifiersValid
      || assignment.authorizedFrameRange.endFrameExclusive <=
        assignment.authorizedFrameRange.startFrame
      || new Set(assignment.reasonCodes).size !== assignment.reasonCodes.length
      || supportJob !== (assignment.sourceSupportRequestRef !== null)) {
      throw new Error(
        'Canonical Caption assignment intent is duplicated, crossed, or semantically invalid.',
      )
    }
    ids.add(assignment.assignmentId)
    occurrences.add(occurrence)
  }
  const requiredVideoJobs = CAPTIONS_VIDEO_JOB_TYPES.filter((jobType) =>
    !binding.assignmentIntents.some((assignment) =>
      assignment.jobType === jobType && assignment.scopeLevel === 'video'))
  if (requiredVideoJobs.length > 0) {
    throw new Error(
      'Canonical Caption V2 selected planning requires every video-level planning assignment.',
    )
  }
}

function createJobSpecs(
  bundle: ReturnType<typeof parseCaptionEarlyPlanningBundle>,
  binding: CanonicalCaptionSpecialistPlanningBinding,
  totalFrames: number,
): JobSpec[] {
  if (isAssignmentPlanningBinding(binding)) {
    return createJobSpecsV2(bundle, binding, totalFrames)
  }
  const specs: JobSpec[] = [{
    jobType: 'inspect_project_caption_continuity',
    scopeLevel: 'video',
    sceneId: null,
    boundaryId: null,
    frameRange: {
      startFrame: 0,
      endFrameExclusive: totalFrames,
    },
    assignmentIntent: null,
  }]
  const blockingByScene = new Map(bundle.blockingMetadata.scenes.map((item) =>
    [item.sceneId, item]))
  const policyByScene = new Map(binding.scenePolicies.map((item) =>
    [item.sceneId, item]))
  for (const opportunity of bundle.opportunityMap.opportunities) {
    const common = {
      scopeLevel: 'scene' as const,
      sceneId: opportunity.sceneId,
      boundaryId: null,
      frameRange: opportunity.planningFrameRange,
      assignmentIntent: null,
    }
    specs.push(
      { jobType: 'check_caption_finish_readiness', ...common },
      { jobType: 'resolve_semantic_caption_phrases', ...common },
    )
    if ((blockingByScene.get(opportunity.sceneId)?.approximateTrackCount ?? 0)
      > 1) {
      specs.push({ jobType: 'resolve_multi_track_caption_scene', ...common })
    }
    const trackingJobType = policyByScene.get(
      opportunity.sceneId)?.trackingJobType
    if (trackingJobType) specs.push({ jobType: trackingJobType, ...common })
    if (opportunity.integrationClass === 'reserved_composition') {
      specs.push({ jobType: 'resolve_spatial_typography', ...common })
    } else if (opportunity.integrationClass === 'structural_typography') {
      specs.push({ jobType: 'resolve_hero_typography', ...common })
    } else if (opportunity.integrationClass === 'cross_system_transform') {
      if (opportunity.handoffTarget === 'broll') {
        specs.push({
          jobType: 'provide_caption_broll_composition_constraints', ...common,
        })
      } else if (opportunity.handoffTarget === 'living_frame') {
        specs.push({
          jobType: 'provide_caption_living_frame_handoff_constraints',
          ...common,
        })
      } else {
        throw new Error(
          'The selected Caption cross-system target lacks an authenticated owner adapter.',
        )
      }
    }
    specs.push(
      { jobType: 'compile_caption_scene_graph', ...common },
      { jobType: 'compile_caption_render_spec', ...common },
    )
    if (bundle.approvalEnvelope.accessibleOutputKinds.length > 0) {
      specs.push({
        jobType: 'compile_accessible_caption_projection', ...common,
      })
    }
    if (bundle.approvalEnvelope.maximumMotionLevel !== 'none') {
      specs.push({
        jobType: 'compile_reduced_motion_caption_projection', ...common,
      })
    }
  }
  if (specs[0]!.frameRange.endFrameExclusive <= 0) {
    throw new Error('Selected Caption planning has no authorized output range.')
  }
  return specs
}

function createJobSpecsV2(
  bundle: ReturnType<typeof parseCaptionEarlyPlanningBundle>,
  binding:
    | CanonicalCaptionSpecialistPlanningBindingV2
    | CanonicalCaptionSpecialistPlanningBindingV3,
  totalFrames: number,
): JobSpec[] {
  const opportunityByScene = new Map(
    bundle.opportunityMap.opportunities.map((item) => [item.sceneId, item]))
  const assignmentKeys = new Set(binding.assignmentIntents.map((item) =>
    `${item.jobType}|${item.scopeLevel}|${item.sceneId ?? 'no-scene'}`))
  const requiredSceneJobs: CaptionsSupportedJobType[] = [
    'reserve_caption_space',
    'plan_caption_blocking_preview',
    'check_caption_finish_readiness',
    'resolve_late_bound_caption_scene',
    'resolve_semantic_caption_phrases',
    'compile_caption_scene_graph',
    'compile_caption_render_spec',
    ...(bundle.approvalEnvelope.accessibleOutputKinds.length > 0
      ? ['compile_accessible_caption_projection' as const] : []),
    ...(bundle.approvalEnvelope.maximumMotionLevel !== 'none'
      ? ['compile_reduced_motion_caption_projection' as const] : []),
  ]
  for (const opportunity of bundle.opportunityMap.opportunities) {
    if (requiredSceneJobs.some((jobType) =>
      !assignmentKeys.has(`${jobType}|scene|${opportunity.sceneId}`))) {
      throw new Error(
        'Canonical Caption V2 planning omits required scene lifecycle work.',
      )
    }
  }
  return binding.assignmentIntents.map((assignment) => {
    const range = assignment.authorizedFrameRange
    const opportunity = assignment.sceneId === null
      ? null : opportunityByScene.get(assignment.sceneId)
    if (range.endFrameExclusive > totalFrames
      || (assignment.sceneId !== null && (!opportunity
        || range.startFrame < opportunity.planningFrameRange.startFrame
        || range.endFrameExclusive >
          opportunity.planningFrameRange.endFrameExclusive))) {
      throw new Error(
        'Canonical Caption assignment exceeds its approved output or scene range.',
      )
    }
    return {
      jobType: assignment.jobType,
      scopeLevel: assignment.scopeLevel,
      sceneId: assignment.sceneId,
      boundaryId: assignment.boundaryId,
      frameRange: structuredClone(range),
      assignmentIntent: structuredClone(assignment),
    }
  })
}

function createWorkItems(input: {
  specs: JobSpec[]
  binding: CanonicalCaptionSpecialistPlanningBinding
  snapshotValidationKey: string
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
}): CanonicalWorkItemInput[] {
  const transcript = input.binding.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
    ? artifactRef(
        input.binding.canonicalTranscriptExpectationRef,
        'canonical_transcript_planning_expectation',
        'canonical_transcript',
      )
    : artifactRef(
        input.binding.canonicalTranscriptRef,
        'canonical_transcript',
        'canonical_transcript',
      )
  const frame = artifactRef(
    input.binding.confirmedOutputFrame.confirmedOutputFrameRef,
    'confirmed_output_frame',
    'canonical_layout_owner',
  )
  const timing = artifactRef(
    input.binding.masterTimingRef,
    'master_timing_or_planning_timing',
    'canonical_timing_owner',
  )
  const priorByScene = new Map<string, string>()
  return input.specs.map((spec, index) => {
    const scopeKey = spec.scopeLevel === 'video'
      ? 'video'
      : spec.scopeLevel === 'scene'
        ? `scene:${spec.sceneId}`
        : `boundary:${spec.boundaryId}`
    const identity = sha256AuthorityValue({
      bindingDigestSha256: input.binding.bindingDigestSha256,
      index,
      jobType: spec.jobType,
      sceneId: spec.sceneId,
      boundaryId: spec.boundaryId,
      assignmentIntent: spec.assignmentIntent,
    })
    const workItemKey = `caption:${identity.slice(0, 48)}`
    const dependencyKey = priorByScene.get(scopeKey)
      ?? input.snapshotValidationKey
    priorByScene.set(scopeKey, workItemKey)
    const initialArtifactRefs = [transcript, frame, timing]
    if (spec.assignmentIntent?.sourceSupportRequestRef) {
      initialArtifactRefs.push(artifactRef(
        spec.assignmentIntent.sourceSupportRequestRef,
        'source_skill_support_request',
        'head_of_orchestra',
      ))
    }
    const baseExecutionInput: Omit<CanonicalCaptionSpecialistWorkItemInputV1,
      'schemaVersion'> = {
      operation: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
      captionJobType: spec.jobType,
      requestedMode: 'planning',
      scopeLevel: spec.scopeLevel,
      outputId: input.binding.canonicalScope.outputId,
      sceneId: spec.sceneId,
      boundaryId: spec.boundaryId,
      authorizedFrameRanges: [spec.frameRange],
      initialArtifactRefs,
      rawChatIncluded: false,
      transcriptTextIncluded: false,
      mediaBytesIncluded: false,
      pathsUrlsOrCredentialsIncluded: false,
      directPeerDispatchRequested: false,
      providerCallRequested: false,
      timelineMutationRequested: false,
      assetMutationRequested: false,
      qaApprovalRequested: false,
      billingAuthorityRequested: false,
      publicDeliveryRequested: false,
      productionAuthorityRequested: false,
    }
    const executionInput: CanonicalCaptionSpecialistWorkItemInput =
      spec.assignmentIntent === null
        ? {
            ...baseExecutionInput,
            schemaVersion:
              CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
          }
        : {
            ...baseExecutionInput,
            schemaVersion: input.binding.schemaVersion ===
              CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
              ? CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
              : CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION,
            assignmentIntentRef: assignmentIntentRef(spec.assignmentIntent),
            assignmentTrigger: spec.assignmentIntent.trigger,
            sourceSupportRequestRef: spec.assignmentIntent
              .sourceSupportRequestRef === null
              ? null : structuredClone(
                spec.assignmentIntent.sourceSupportRequestRef),
            selectionEvidenceRef: structuredClone(
              spec.assignmentIntent.selectionEvidenceRef),
          }
    return {
      workItemKey,
      workItemType: 'custom',
      workerClass: CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
      executionInput: structuredClone(executionInput) as unknown as
        Record<string, unknown>,
      sourceSequenceItemIds: [...input.sourceSequenceItemIds],
      sourceCleanupDecisionIds: [...input.sourceCleanupDecisionIds],
      expectedOutputs: [{
        outputKey: `caption-receipt-${identity.slice(0, 40)}`,
        artifactType: 'caption_specialist_job_receipt',
        assetRole: 'qa',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'application/json',
        segmentIds: spec.sceneId ? [spec.sceneId] : [],
        timingIds: [input.binding.masterTimingRef.id],
        rendererLayerIds: [],
      }],
      dependencyKeys: [dependencyKey],
      approvedToolIds: [],
      providerExecutionMode: 'none',
      fallbackPolicy: {
        policy: 'fail_closed_or_hq_mediated_support_resume',
        lowerCostFallbackAuthorityGranted: false,
        userReviewRequiredBeforeScopeChange: true,
      },
      maxAttempts: 1,
      attemptTimeoutSeconds: 120,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: 0,
      required: true,
    }
  })
}

function assignmentIntentRef(
  assignment: CanonicalCaptionSpecialistJobAssignmentIntent,
) {
  return {
    id: assignment.assignmentId,
    version: CANONICAL_CAPTION_SPECIALIST_JOB_ASSIGNMENT_VERSION,
    contentHash: sha256AuthorityValue(assignment),
  }
}

function artifactRef(
  ref: { id: string; version: string; contentHash: string },
  artifactType: CanonicalCaptionSpecialistInitialArtifactRef['artifactType'],
  producerSkillKey: string,
): CanonicalCaptionSpecialistInitialArtifactRef {
  return {
    ...structuredClone(ref),
    artifactType,
    producerSkillKey,
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  }
}

function projection(input: {
  idSeed: string
  disposition: CanonicalCaptionSpecialistPlanningProjection['disposition']
  planningBindingRef: { id: string; version: string; contentHash: string }
  compositionTraceRef: { id: string; version: string; contentHash: string }
  earlyPlanningBundleRef: { id: string; version: string; contentHash: string }
  outputId: string
  captionEstimateLineKey: string | null
  workItems: CanonicalWorkItemInput[]
  postapprovalTranscriptBindingRequired: boolean
  authenticatedOwnerResumeRequired: boolean
  downstreamCaptionRenderWorkRequired: boolean
  deterministicRenderedCaptionQaRequired: boolean
  qualifiedCompleteTimeVisualReviewRequired: boolean
  independentPrivateReviewRequired: boolean
  planningBinding: CanonicalCaptionSpecialistPlanningBinding
}): CanonicalCaptionSpecialistPlanningProjection {
  const body = {
    projectionId: `caption.planning.${input.idSeed.slice(0, 40)}`,
    disposition: input.disposition,
    planningBindingRef: input.planningBindingRef,
    compositionTraceRef: input.compositionTraceRef,
    earlyPlanningBundleRef: input.earlyPlanningBundleRef,
    outputId: input.outputId,
    captionEstimateLineKey: input.captionEstimateLineKey,
    projectedWorkItemKeys: input.workItems.map((item) => item.workItemKey),
    projectedJobTypes: input.workItems.map((item) =>
      item.executionInput.captionJobType),
    projectedSceneIds: [...new Set(input.workItems.flatMap((item) =>
      typeof item.executionInput.sceneId === 'string'
        ? [item.executionInput.sceneId] : []))],
    postapprovalTranscriptBindingRequired:
      input.postapprovalTranscriptBindingRequired,
    authenticatedOwnerResumeRequired: input.authenticatedOwnerResumeRequired,
    downstreamCaptionRenderWorkRequired:
      input.downstreamCaptionRenderWorkRequired,
    deterministicRenderedCaptionQaRequired:
      input.deterministicRenderedCaptionQaRequired,
    qualifiedCompleteTimeVisualReviewRequired:
      input.qualifiedCompleteTimeVisualReviewRequired,
    independentPrivateReviewRequired: input.independentPrivateReviewRequired,
    planningJobsClaimFinishedCaptionMedia: false,
    fullyApprovedCaptionExecutionCoverageClaimed: false,
    captionWorkItemsCreatedByCanonicalPlanner: true,
    captionWorkItemsCreatedByBrowser: false,
    directPeerDispatchGranted: false,
    providerRuntimeAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const withoutDigest = input.planningBinding.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
    ? projectionV3WithoutDigestSchema.parse({
        ...body,
        schemaVersion:
          CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION,
        assignmentIntentRefs: input.planningBinding.assignmentIntents.map(
          assignmentIntentRef),
        projectedBoundaryIds: [...new Set(
          input.planningBinding.assignmentIntents.flatMap((assignment) =>
            assignment.boundaryId === null ? [] : [assignment.boundaryId]))],
        exactAssignmentIntentCoverage: true,
        repairOrSupportWorkProjectedOnlyFromTypedTrigger: true,
        oneAllFeatureEditFabricated: false,
        canonicalTranscriptExpectationRef:
          input.planningBinding.canonicalTranscriptExpectationRef,
        postapprovalCanonicalTranscriptResolutionRequired: true,
      })
    : input.planningBinding.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION
      ? projectionV2WithoutDigestSchema.parse({
        ...body,
        schemaVersion:
          CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION,
        assignmentIntentRefs: input.planningBinding.assignmentIntents.map(
          assignmentIntentRef),
        projectedBoundaryIds: [...new Set(
          input.planningBinding.assignmentIntents.flatMap((assignment) =>
            assignment.boundaryId === null ? [] : [assignment.boundaryId]))],
        exactAssignmentIntentCoverage: true,
        repairOrSupportWorkProjectedOnlyFromTypedTrigger: true,
        oneAllFeatureEditFabricated: false,
      })
      : projectionV1WithoutDigestSchema.parse({
        ...body,
        schemaVersion:
          CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION,
      })
  return parseCanonicalCaptionSpecialistPlanningProjection({
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, projectionDigestSha256: '' },
      'projectionDigestSha256'),
  })
}

function refKey(ref: { id: string; version: string; contentHash: string }) {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}

function exactRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
) {
  return refKey(left) === refKey(right)
}

export function calculateCanonicalCaptionSpecialistPlanningBindingDigest(
  value: object,
): string {
  return calculateSkillContractDigest(
    { ...value, bindingDigestSha256: '' }, 'bindingDigestSha256')
}

export function createCanonicalCaptionSpecialistPlanningBindingV2(
  input: Omit<CanonicalCaptionSpecialistPlanningBindingV2,
    'schemaVersion' | 'bindingDigestSha256'>,
): CanonicalCaptionSpecialistPlanningBindingV2 {
  assertClosedContractTree(input, 'Canonical Caption V2 planning input')
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion:
      CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION,
  }
  return parseCanonicalCaptionSpecialistPlanningBinding({
    ...withoutDigest,
    bindingDigestSha256:
      calculateCanonicalCaptionSpecialistPlanningBindingDigest(withoutDigest),
  }) as CanonicalCaptionSpecialistPlanningBindingV2
}

export function createCanonicalCaptionSpecialistPlanningBindingV3(
  input: Omit<CanonicalCaptionSpecialistPlanningBindingV3,
    'schemaVersion' | 'bindingDigestSha256'>,
): CanonicalCaptionSpecialistPlanningBindingV3 {
  assertClosedContractTree(input, 'Canonical Caption V3 planning input')
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion:
      CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION,
  }
  return parseCanonicalCaptionSpecialistPlanningBinding({
    ...withoutDigest,
    bindingDigestSha256:
      calculateCanonicalCaptionSpecialistPlanningBindingDigest(withoutDigest),
  }) as CanonicalCaptionSpecialistPlanningBindingV3
}

function isAssignmentPlanningBinding(
  value: CanonicalCaptionSpecialistPlanningBinding,
): value is CanonicalCaptionSpecialistPlanningBindingV2
  | CanonicalCaptionSpecialistPlanningBindingV3 {
  return value.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION
    || value.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
}

function isAssignmentPlanningProjection(
  value: CanonicalCaptionSpecialistPlanningProjection,
): value is CanonicalCaptionSpecialistPlanningProjectionV2
  | CanonicalCaptionSpecialistPlanningProjectionV3 {
  return value.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION
    || value.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION
}

function transcriptPlanningRef(
  binding: CanonicalCaptionSpecialistPlanningBinding,
): { id: string; version: string; contentHash: string } {
  return binding.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
    ? binding.canonicalTranscriptExpectationRef
    : binding.canonicalTranscriptRef
}

export function captionTrackingJobType(
  value: string | null,
): CanonicalCaptionTrackingJobType | null {
  return value === null ? null : trackingJobSchema.parse(value)
}
