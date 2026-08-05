import { z } from 'zod'

import type {
  CanonicalCaptionSpecialistEstimateBindingMetadata,
  CanonicalCaptionSpecialistPlanningBinding,
  CanonicalCaptionSpecialistPlanningProjection,
  CanonicalCaptionTrackingJobType,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
  type CanonicalCaptionSpecialistInitialArtifactRef,
  type CanonicalCaptionSpecialistWorkItemInput,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
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
const bindingWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION),
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
const bindingSchema: z.ZodType<CanonicalCaptionSpecialistPlanningBinding> =
  bindingWithoutDigestSchema.extend({ bindingDigestSha256: sha256 }).strict()
const projectionWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION),
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
const projectionSchema: z.ZodType<CanonicalCaptionSpecialistPlanningProjection> =
  projectionWithoutDigestSchema.extend({ projectionDigestSha256: sha256 })
    .strict()

type CaptionComponents = CanonicalPlanComponentsInput & {
  professionalSkillPlan?: Record<string, unknown>
  captionEarlyPlanningBundle?: Record<string, unknown>
  captionSpecialistPlanningBinding?: Record<string, unknown>
}

interface JobSpec {
  jobType: CaptionsSupportedJobType
  scopeLevel: 'video' | 'scene'
  sceneId: string | null
  frameRange: { startFrame: number; endFrameExclusive: number }
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
  'caption_postapproval_artifact_execution',
  'caption_rendered_media_work_binding',
  'canonical_postrender_visual_qa_lifecycle_writer_and_result',
  'canonical_caption_independent_private_review_binding',
] as const

export function canonicalCaptionSpecialistMissingApprovalGates(
  projection: CanonicalCaptionSpecialistPlanningProjection | undefined,
): Array<typeof CANONICAL_CAPTION_SPECIALIST_DOWNSTREAM_APPROVAL_GATES[number]> {
  return !projection || projection.disposition ===
    'no_caption_work_owner_restraint_preserved'
    ? []
    : [...CANONICAL_CAPTION_SPECIALIST_DOWNSTREAM_APPROVAL_GATES]
}

export function parseCanonicalCaptionSpecialistPlanningBinding(
  value: unknown,
): CanonicalCaptionSpecialistPlanningBinding {
  assertClosedContractTree(value, 'Canonical Caption planning binding')
  const parsed = bindingSchema.parse(value)
  if (parsed.bindingDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'bindingDigestSha256')) {
    throw new Error('Canonical Caption planning binding digest failed.')
  }
  if (new Set(parsed.scenePolicies.map((item) => item.sceneId)).size
      !== parsed.scenePolicies.length) {
    throw new Error('Canonical Caption planning scene policies are duplicated.')
  }
  return structuredClone(parsed)
}

export function parseCanonicalCaptionSpecialistPlanningProjection(
  value: unknown,
): CanonicalCaptionSpecialistPlanningProjection {
  assertClosedContractTree(value, 'Canonical Caption planning projection')
  const parsed = projectionSchema.parse(value)
  if (parsed.projectionDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'projectionDigestSha256')
    || new Set(parsed.projectedWorkItemKeys).size
      !== parsed.projectedWorkItemKeys.length
    || new Set(parsed.projectedSceneIds).size !== parsed.projectedSceneIds.length) {
    throw new Error('Canonical Caption planning projection is invalid.')
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
  const hasAnyCaptionPlanningComponent = Boolean(
    input.components.professionalSkillPlan
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
    }),
    workItems,
  }
}

export function assertCanonicalCaptionSpecialistPlanningProjectionMatchesWorkItems(
  projection: CanonicalCaptionSpecialistPlanningProjection,
  workItems: CanonicalCaptionPlanningProjectionWorkItem[],
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
      || executionInput.schemaVersion
        !== CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION
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
  }
  if (stableAuthorityStringify([...sceneIds])
    !== stableAuthorityStringify(projection.projectedSceneIds)) {
    throw new Error(
      'Canonical Caption planning scene lineage no longer matches its projection.',
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
    || !inputRefKeys.has(refKey(binding.canonicalTranscriptRef))
    || !inputRefKeys.has(refKey(binding.masterTimingRef))
    || binding.masterTimingRef.contentHash
      !== sha256AuthorityValue(input.components.masterTimingPlan)
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

function createJobSpecs(
  bundle: ReturnType<typeof parseCaptionEarlyPlanningBundle>,
  binding: CanonicalCaptionSpecialistPlanningBinding,
  totalFrames: number,
): JobSpec[] {
  const specs: JobSpec[] = [{
    jobType: 'inspect_project_caption_continuity',
    scopeLevel: 'video',
    sceneId: null,
    frameRange: {
      startFrame: 0,
      endFrameExclusive: totalFrames,
    },
  }]
  const blockingByScene = new Map(bundle.blockingMetadata.scenes.map((item) =>
    [item.sceneId, item]))
  const policyByScene = new Map(binding.scenePolicies.map((item) =>
    [item.sceneId, item]))
  for (const opportunity of bundle.opportunityMap.opportunities) {
    const common = {
      scopeLevel: 'scene' as const,
      sceneId: opportunity.sceneId,
      frameRange: opportunity.planningFrameRange,
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

function createWorkItems(input: {
  specs: JobSpec[]
  binding: CanonicalCaptionSpecialistPlanningBinding
  snapshotValidationKey: string
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
}): CanonicalWorkItemInput[] {
  const transcript = artifactRef(
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
    const scopeKey = spec.sceneId ?? 'video'
    const identity = sha256AuthorityValue({
      bindingDigestSha256: input.binding.bindingDigestSha256,
      index,
      jobType: spec.jobType,
      sceneId: spec.sceneId,
    })
    const workItemKey = `caption:${identity.slice(0, 48)}`
    const dependencyKey = priorByScene.get(scopeKey)
      ?? input.snapshotValidationKey
    priorByScene.set(scopeKey, workItemKey)
    const executionInput: CanonicalCaptionSpecialistWorkItemInput = {
      schemaVersion: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
      operation: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
      captionJobType: spec.jobType,
      requestedMode: 'planning',
      scopeLevel: spec.scopeLevel,
      outputId: input.binding.canonicalScope.outputId,
      sceneId: spec.sceneId,
      boundaryId: null,
      authorizedFrameRanges: [spec.frameRange],
      initialArtifactRefs: [transcript, frame, timing],
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
}): CanonicalCaptionSpecialistPlanningProjection {
  const withoutDigest = projectionWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION,
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
  value: Omit<CanonicalCaptionSpecialistPlanningBinding,
  'bindingDigestSha256'>,
): string {
  return calculateSkillContractDigest(
    { ...value, bindingDigestSha256: '' }, 'bindingDigestSha256')
}

export function captionTrackingJobType(
  value: string | null,
): CanonicalCaptionTrackingJobType | null {
  return value === null ? null : trackingJobSchema.parse(value)
}
