import { z } from 'zod'

import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_BINDING_VERSION,
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION,
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS,
  type CanonicalCaptionPostrenderVisualQaWorkBinding,
  type CanonicalCaptionPostrenderVisualQaWorkItemInput,
} from '../../src/types/canonical-caption-postrender-visual-qa-work-binding'
import type {
  CanonicalCaptionRenderedMediaWorkBinding,
} from '../../src/types/canonical-caption-rendered-media-work-binding'
import type {
  CanonicalCaptionSpecialistPlanningProjection,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
} from '../../src/types/caption-direction-visual-review-authenticated-read'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_SHARED_LIFECYCLE_RESULT_VERSION,
} from '../../src/types/caption-direction-visual-review-shared-lifecycle'
import {
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
  CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION,
} from '../../src/types/canonical-postrender-visual-qa-lifecycle'
import {
  CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION,
} from '../../src/types/canonical-postrender-visual-qa-work-request'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type {
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'

const FFPROBE_OPERATION = 'tool.ffprobe.inspect_approved_media.v1' as const
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const bindingWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_BINDING_VERSION),
  bindingId: safeKey,
  planningProjectionRef: refSchema,
  renderedMediaWorkBindingRef: refSchema,
  outputId: safeKey,
  confirmedOutputFrame: z.object({
    frameRef: refSchema,
    width: z.number().int().min(320).max(16_384),
    height: z.number().int().min(180).max(16_384),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
  }).strict(),
  masterTimingRef: refSchema,
  canonicalMasterTimingId: safeKey,
  finalRender: z.object({ workItemKey: safeKey, outputKey: safeKey }).strict(),
  deterministicQa: z.object({
    workItemKey: safeKey,
    outputKey: safeKey,
    operation: z.literal('inspect_final_artifact'),
    canonicalOperationId: z.literal(FFPROBE_OPERATION),
  }).strict(),
  visualQaLifecycle: z.object({
    workItemKey: safeKey,
    outputKey: safeKey,
    workerClass: z.literal(
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS),
    operation: z.literal(
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION),
    dependencyKeys: z.array(safeKey).length(1),
    maximumAttempts: z.literal(2),
    maximumCreditBudget: z.literal(0),
    workRequestSchemaVersion: z.literal(
      CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION),
    lifecycleResultSchemaVersion: z.literal(
      CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION),
    captionLifecycleProjectionSchemaVersion: z.literal(
      CAPTION_RENDERED_VISUAL_REVIEW_SHARED_LIFECYCLE_RESULT_VERSION),
    authenticatedReadRequestSchemaVersion: z.literal(
      CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION),
    authenticatedReadResultSchemaVersion: z.literal(
      CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION),
    sharedProviderCapabilityId: z.literal(
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID),
    sharedProviderOperationId: z.literal(
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID),
    sharedProviderOperationVersion: z.literal(
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION),
  }).strict(),
  approvalCoverageBindsScheduledWorkNotCompletedResult: z.literal(true),
  actualRenderedArtifactRequiredAtExecution: z.literal(true),
  actualDeterministicQaPassRequiredAtExecution: z.literal(true),
  actualCompleteTimeModelInspectionRequiredForCompletion: z.literal(true),
  actualLifecycleResultPersisted: z.literal(false),
  authenticatedLifecycleResultReread: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  providerDispatchGrantedAtPlanning: z.literal(false),
  providerCallMadeAtPlanning: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGranted: z.literal(false),
  repairAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const bindingSchema: z.ZodType<CanonicalCaptionPostrenderVisualQaWorkBinding> =
  bindingWithoutDigestSchema.extend({ bindingDigestSha256: sha256 }).strict()

interface CaptionPostrenderWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInput: Record<string, unknown>
  expectedOutputs: Array<{
    outputKey: string
    artifactType?: string
    assetRole?: string
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
    segmentIds: string[]
    timingIds: string[]
    rendererLayerIds: string[]
  }>
  dependencyKeys: string[]
  approvedToolIds: string[]
  providerExecutionMode: string
  maxAttempts: number
  maximumCreditBudget: number
}

export function prepareCanonicalCaptionPostrenderVisualQaWorkItem(input: {
  projection: CanonicalCaptionSpecialistPlanningProjection | undefined
  renderedMediaWorkBinding:
    CanonicalCaptionRenderedMediaWorkBinding | null
  workItems: CaptionPostrenderWorkItem[]
}): CanonicalWorkItemInput | null {
  if (!input.projection || input.projection.disposition ===
    'no_caption_work_owner_restraint_preserved'
    || !input.renderedMediaWorkBinding) return null
  const deterministicQa = requireDeterministicFinalQa(
    input.workItems, input.renderedMediaWorkBinding)
  if (!deterministicQa) return null
  if (input.workItems.some((item) => item.workerClass ===
    CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS)) {
    throw new Error(
      'Caption post-render visual-QA work must be created only by the canonical planner.',
    )
  }
  const deterministicOutput = deterministicQa.expectedOutputs[0]!
  const media = input.renderedMediaWorkBinding
  const identity = calculateSkillContractDigest({
    planningProjectionDigestSha256:
      input.projection.projectionDigestSha256,
    renderedMediaWorkBindingDigestSha256: media.bindingDigestSha256,
    deterministicQaWorkItemKey: deterministicQa.workItemKey,
    deterministicQaOutputKey: deterministicOutput.outputKey,
  }, '__no_digest_field__')
  const workItemKey = `caption:postrender-visual-qa:${identity.slice(0, 40)}`
  const outputKey = `caption-postrender-visual-qa-${identity.slice(0, 32)}`
  const executionInput: CanonicalCaptionPostrenderVisualQaWorkItemInput = {
    schemaVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_INPUT_VERSION,
    operation: CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION,
    outputId: media.outputId,
    confirmedOutputFrameRef: media.confirmedOutputFrame.frameRef,
    masterTimingRef: media.masterTimingRef,
    canonicalMasterTimingId: media.canonicalMasterTimingId,
    finalRenderWorkItemKey: media.finalComposition.workItemKey,
    finalRenderOutputKey: media.finalComposition.outputKey,
    deterministicQaWorkItemKey: deterministicQa.workItemKey,
    deterministicQaOutputKey: deterministicOutput.outputKey,
    workRequestSchemaVersion:
      CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION,
    lifecycleResultSchemaVersion:
      CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION,
    sharedProviderCapabilityId:
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
    sharedProviderOperationId:
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
    sharedProviderOperationVersion:
      CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
    authenticatedCaptionReadRequired: true,
    completeTimeCoverageRequired: true,
    sampledFramesCreatedOnlyAfterExactRenderReread: true,
    rawPromptAccepted: false,
    browserCompletionAccepted: false,
    directProviderDispatchRequested: false,
    assetMutationRequested: false,
    qaApprovalRequested: false,
    billingAuthorityRequested: false,
    publicDeliveryRequested: false,
    productionAuthorityRequested: false,
  }
  return {
    workItemKey,
    workItemType: 'custom',
    workerClass: CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS,
    executionInput: structuredClone(executionInput) as unknown as
      Record<string, unknown>,
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey,
      artifactType: 'canonical_postrender_visual_qa_lifecycle_result',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [...deterministicOutput.segmentIds],
      timingIds: [...deterministicOutput.timingIds],
      rendererLayerIds: [...deterministicOutput.rendererLayerIds],
    }],
    dependencyKeys: [deterministicQa.workItemKey],
    approvedToolIds: [],
    providerExecutionMode: 'none',
    fallbackPolicy: {
      policy: 'fail_closed_then_repair_or_private_review',
      automaticProviderRetryLimit: 1,
      browserLocalCompletionAllowed: false,
      userApprovalRequiredForScopeOrCostChange: true,
    },
    maxAttempts: 2,
    attemptTimeoutSeconds: 1_800,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 0,
    required: true,
  }
}

export function parseCanonicalCaptionPostrenderVisualQaWorkBinding(
  value: unknown,
): CanonicalCaptionPostrenderVisualQaWorkBinding {
  assertClosedContractTree(value, 'Caption post-render visual-QA work binding')
  const parsed = bindingSchema.parse(value)
  if (parsed.bindingDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'bindingDigestSha256')) {
    throw new Error('Caption post-render visual-QA work binding digest failed.')
  }
  if (parsed.visualQaLifecycle.dependencyKeys[0] !==
    parsed.deterministicQa.workItemKey) {
    throw new Error(
      'Caption post-render visual-QA work lost deterministic-QA ordering.',
    )
  }
  return structuredClone(parsed)
}

export function prepareCanonicalCaptionPostrenderVisualQaWorkBinding(input: {
  projection: CanonicalCaptionSpecialistPlanningProjection | undefined
  renderedMediaWorkBinding:
    CanonicalCaptionRenderedMediaWorkBinding | undefined
  workItems: CaptionPostrenderWorkItem[]
}): CanonicalCaptionPostrenderVisualQaWorkBinding | null {
  if (!input.projection || input.projection.disposition ===
    'no_caption_work_owner_restraint_preserved'
    || !input.renderedMediaWorkBinding) return null
  const media = input.renderedMediaWorkBinding
  const deterministicQa = requireDeterministicFinalQa(input.workItems, media)
  if (!deterministicQa) return null
  const lifecycleItems = input.workItems.filter((item) =>
    item.workerClass === CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS)
  if (lifecycleItems.length === 0) return null
  if (lifecycleItems.length !== 1) {
    throw new Error('Caption post-render visual-QA work is duplicated.')
  }
  const lifecycle = lifecycleItems[0]!
  assertVisualQaLifecycleWorkItem(lifecycle, media, deterministicQa)
  const qaOutput = deterministicQa.expectedOutputs[0]!
  const lifecycleOutput = lifecycle.expectedOutputs[0]!
  const withoutDigest = bindingWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_BINDING_VERSION,
    bindingId: `caption.postrender-visual-qa.${media.bindingDigestSha256.slice(0, 40)}`,
    planningProjectionRef: {
      id: input.projection.projectionId,
      version: input.projection.schemaVersion,
      contentHash: input.projection.projectionDigestSha256,
    },
    renderedMediaWorkBindingRef: {
      id: media.bindingId,
      version: media.schemaVersion,
      contentHash: media.bindingDigestSha256,
    },
    outputId: media.outputId,
    confirmedOutputFrame: media.confirmedOutputFrame,
    masterTimingRef: media.masterTimingRef,
    canonicalMasterTimingId: media.canonicalMasterTimingId,
    finalRender: {
      workItemKey: media.finalComposition.workItemKey,
      outputKey: media.finalComposition.outputKey,
    },
    deterministicQa: {
      workItemKey: deterministicQa.workItemKey,
      outputKey: qaOutput.outputKey,
      operation: 'inspect_final_artifact',
      canonicalOperationId: FFPROBE_OPERATION,
    },
    visualQaLifecycle: {
      workItemKey: lifecycle.workItemKey,
      outputKey: lifecycleOutput.outputKey,
      workerClass: CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS,
      operation: CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION,
      dependencyKeys: [...lifecycle.dependencyKeys],
      maximumAttempts: 2,
      maximumCreditBudget: 0,
      workRequestSchemaVersion:
        CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION,
      lifecycleResultSchemaVersion:
        CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION,
      captionLifecycleProjectionSchemaVersion:
        CAPTION_RENDERED_VISUAL_REVIEW_SHARED_LIFECYCLE_RESULT_VERSION,
      authenticatedReadRequestSchemaVersion:
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION,
      authenticatedReadResultSchemaVersion:
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
      sharedProviderCapabilityId:
        CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
      sharedProviderOperationId:
        CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
      sharedProviderOperationVersion:
        CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
    },
    approvalCoverageBindsScheduledWorkNotCompletedResult: true,
    actualRenderedArtifactRequiredAtExecution: true,
    actualDeterministicQaPassRequiredAtExecution: true,
    actualCompleteTimeModelInspectionRequiredForCompletion: true,
    actualLifecycleResultPersisted: false,
    authenticatedLifecycleResultReread: false,
    browserLocalCompletionAccepted: false,
    directPeerDispatchGranted: false,
    providerDispatchGrantedAtPlanning: false,
    providerCallMadeAtPlanning: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGranted: false,
    repairAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  return parseCanonicalCaptionPostrenderVisualQaWorkBinding({
    ...withoutDigest,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, bindingDigestSha256: '' },
      'bindingDigestSha256'),
  })
}

export function assertCanonicalCaptionPostrenderVisualQaWorkBindingMatches(
  binding: CanonicalCaptionPostrenderVisualQaWorkBinding,
  input: {
    projection: CanonicalCaptionSpecialistPlanningProjection
    renderedMediaWorkBinding: CanonicalCaptionRenderedMediaWorkBinding
    workItems: CaptionPostrenderWorkItem[]
  },
): void {
  const expected = prepareCanonicalCaptionPostrenderVisualQaWorkBinding(input)
  if (!expected || stableAuthorityStringify(expected)
    !== stableAuthorityStringify(binding)) {
    throw new Error(
      'Caption post-render visual-QA binding no longer matches its immutable work graph.',
    )
  }
}

function requireDeterministicFinalQa(
  workItems: CaptionPostrenderWorkItem[],
  media: CanonicalCaptionRenderedMediaWorkBinding,
): CaptionPostrenderWorkItem | null {
  const items = workItems.filter((item) => item.workItemType === 'run_final_qa'
    && item.workerClass === 'qa_worker'
    && item.executionInput.operation === 'inspect_final_artifact')
  if (items.length === 0) return null
  if (items.length !== 1) {
    throw new Error('Caption requires one deterministic final-QA owner.')
  }
  const item = items[0]!
  const output = item.expectedOutputs[0]
  const operationIds = item.executionInput.approvedToolOperationIds
  const payload = item.executionInput.structuredPayload
  if (item.expectedOutputs.length !== 1 || !output
    || output.artifactType !== 'final_qa_report'
    || output.assetRole !== 'qa' || output.contentType !== 'application/json'
    || !output.required || output.previewPlaceholderAllowed
    || item.dependencyKeys.length !== 1
    || item.dependencyKeys[0] !== media.finalComposition.workItemKey
    || item.approvedToolIds.length !== 1
    || item.approvedToolIds[0] !== 'ffprobe'
    || !Array.isArray(operationIds) || operationIds.length !== 1
    || operationIds[0] !== FFPROBE_OPERATION
    || typeof payload !== 'object' || payload === null
    || Array.isArray(payload)
    || (payload as Record<string, unknown>).inspectionProfileId
      !== 'final_export_v1'
    || (payload as Record<string, unknown>).countFrames !== true
    || (payload as Record<string, unknown>).verifyDurationAndSync !== true
    || (payload as Record<string, unknown>).emitMachineJsonOnly !== true
    || output.timingIds.length !== 1
    || output.timingIds[0] !== media.canonicalMasterTimingId) {
    throw new Error(
      'Caption post-render visual QA requires exact deterministic final-QA evidence first.',
    )
  }
  return item
}

function assertVisualQaLifecycleWorkItem(
  item: CaptionPostrenderWorkItem,
  media: CanonicalCaptionRenderedMediaWorkBinding,
  deterministicQa: CaptionPostrenderWorkItem,
): void {
  const parsedInput = item.executionInput as unknown as
    CanonicalCaptionPostrenderVisualQaWorkItemInput
  const output = item.expectedOutputs[0]
  const deterministicOutput = deterministicQa.expectedOutputs[0]!
  if (item.workItemType !== 'custom'
    || item.workerClass !== CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS
    || item.dependencyKeys.length !== 1
    || item.dependencyKeys[0] !== deterministicQa.workItemKey
    || item.approvedToolIds.length !== 0
    || item.providerExecutionMode !== 'none'
    || item.maxAttempts !== 2 || item.maximumCreditBudget !== 0
    || item.expectedOutputs.length !== 1 || !output
    || output.artifactType
      !== 'canonical_postrender_visual_qa_lifecycle_result'
    || output.assetRole !== 'qa' || output.contentType !== 'application/json'
    || !output.required || output.previewPlaceholderAllowed
    || stableAuthorityStringify(output.segmentIds)
      !== stableAuthorityStringify(deterministicOutput.segmentIds)
    || stableAuthorityStringify(output.timingIds)
      !== stableAuthorityStringify(deterministicOutput.timingIds)
    || stableAuthorityStringify(output.rendererLayerIds)
      !== stableAuthorityStringify(deterministicOutput.rendererLayerIds)
    || parsedInput.schemaVersion
      !== CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_INPUT_VERSION
    || parsedInput.operation
      !== CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION
    || parsedInput.outputId !== media.outputId
    || stableAuthorityStringify(parsedInput.confirmedOutputFrameRef)
      !== stableAuthorityStringify(media.confirmedOutputFrame.frameRef)
    || stableAuthorityStringify(parsedInput.masterTimingRef)
      !== stableAuthorityStringify(media.masterTimingRef)
    || parsedInput.canonicalMasterTimingId !== media.canonicalMasterTimingId
    || parsedInput.finalRenderWorkItemKey
      !== media.finalComposition.workItemKey
    || parsedInput.finalRenderOutputKey !== media.finalComposition.outputKey
    || parsedInput.deterministicQaWorkItemKey !== deterministicQa.workItemKey
    || parsedInput.deterministicQaOutputKey !== deterministicOutput.outputKey
    || parsedInput.workRequestSchemaVersion
      !== CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION
    || parsedInput.lifecycleResultSchemaVersion
      !== CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION
    || parsedInput.sharedProviderCapabilityId
      !== CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID
    || parsedInput.sharedProviderOperationId
      !== CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID
    || parsedInput.sharedProviderOperationVersion
      !== CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION
    || parsedInput.authenticatedCaptionReadRequired !== true
    || parsedInput.completeTimeCoverageRequired !== true
    || parsedInput.sampledFramesCreatedOnlyAfterExactRenderReread !== true
    || parsedInput.rawPromptAccepted !== false
    || parsedInput.browserCompletionAccepted !== false
    || parsedInput.directProviderDispatchRequested !== false
    || parsedInput.assetMutationRequested !== false
    || parsedInput.qaApprovalRequested !== false
    || parsedInput.billingAuthorityRequested !== false
    || parsedInput.publicDeliveryRequested !== false
    || parsedInput.productionAuthorityRequested !== false) {
    throw new Error(
      'Caption post-render visual-QA work lost its exact lifecycle authority.',
    )
  }
}
