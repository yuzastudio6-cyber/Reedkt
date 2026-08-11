import { z } from 'zod'

import {
  CANONICAL_CAPTION_PRIVATE_REVIEW_DEPENDENCY_BINDING_VERSION,
  type CanonicalCaptionPrivateReviewDependencyBinding,
} from '../../src/types/canonical-caption-private-review-dependency-binding'
import type {
  CanonicalCaptionPostrenderVisualQaWorkBinding,
} from '../../src/types/canonical-caption-postrender-visual-qa-work-binding'
import type {
  CanonicalCaptionRenderedMediaWorkBinding,
} from '../../src/types/canonical-caption-rendered-media-work-binding'
import type {
  CanonicalCaptionSpecialistPlanningProjection,
} from '../../src/types/canonical-caption-specialist-planning'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'

const ASSEMBLY_ROUTE =
  '/v1/edit-executions/packages/:packageRecordId/private-review-assemblies' as const
const DECISION_ROUTE =
  '/v1/edit-executions/private-review-assemblies/:reviewAssemblyId/decisions' as const
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const artifactSchema = z.object({
  role: z.enum([
    'final_captioned_render',
    'deterministic_final_qa',
    'qualified_complete_time_visual_review',
  ]),
  workItemKey: safeKey,
  outputKey: safeKey,
  contentType: z.enum(['video/mp4', 'application/json']),
}).strict()
const bindingWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_PRIVATE_REVIEW_DEPENDENCY_BINDING_VERSION),
  bindingId: safeKey,
  planningProjectionRef: refSchema,
  renderedMediaWorkBindingRef: refSchema,
  postrenderVisualQaWorkBindingRef: refSchema,
  outputId: safeKey,
  confirmedOutputFrameRef: refSchema,
  masterTimingRef: refSchema,
  canonicalMasterTimingId: safeKey,
  requiredReviewArtifacts: z.tuple([
    artifactSchema.extend({
      role: z.literal('final_captioned_render'),
      contentType: z.literal('video/mp4'),
    }).strict(),
    artifactSchema.extend({
      role: z.literal('deterministic_final_qa'),
      contentType: z.literal('application/json'),
    }).strict(),
    artifactSchema.extend({
      role: z.literal('qualified_complete_time_visual_review'),
      contentType: z.literal('application/json'),
    }).strict(),
  ]),
  canonicalPrivateReview: z.object({
    assemblyServiceId: z.literal(
      'canonical_private_review_assembly_service'),
    assemblyResponseSchemaVersion: z.literal(
      'canonical-private-review-assembly-response-v1'),
    assemblyManifestSchemaVersion: z.literal(
      'canonical-private-review-manifest-v1'),
    assemblyRoute: z.literal(ASSEMBLY_ROUTE),
    decisionServiceId: z.literal(
      'canonical_private_review_decision_service'),
    decisionResponseSchemaVersion: z.literal(
      'canonical-private-review-decision-response-v1'),
    decisionManifestSchemaVersion: z.literal(
      'canonical-private-review-decision-manifest-v1'),
    decisionRoute: z.literal(DECISION_ROUTE),
  }).strict(),
  everyRequiredArtifactRequiresCreateOnlyPersistence: z.literal(true),
  everyRequiredArtifactRequiresIndependentQa: z.literal(true),
  everyRequiredArtifactRequiresReconciliation: z.literal(true),
  actualReviewAssemblyCreated: z.literal(false),
  actualPrivateReviewDecisionRecorded: z.literal(false),
  privateReviewAcceptanceClaimed: z.literal(false),
  browserReviewCompletionAccepted: z.literal(false),
  approvedSnapshotMutationGranted: z.literal(false),
  additionalWorkCreationGranted: z.literal(false),
  providerDispatchGranted: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const bindingSchema: z.ZodType<CanonicalCaptionPrivateReviewDependencyBinding> =
  bindingWithoutDigestSchema.extend({ bindingDigestSha256: sha256 }).strict()

interface CaptionPrivateReviewWorkItem {
  workItemKey: string
  expectedOutputs: Array<{
    outputKey: string
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
  }>
  dependencyKeys: string[]
}

export function parseCanonicalCaptionPrivateReviewDependencyBinding(
  value: unknown,
): CanonicalCaptionPrivateReviewDependencyBinding {
  assertClosedContractTree(value, 'Caption private-review dependency binding')
  const parsed = bindingSchema.parse(value)
  if (parsed.bindingDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'bindingDigestSha256')) {
    throw new Error('Caption private-review dependency binding digest failed.')
  }
  const identities = parsed.requiredReviewArtifacts.map((item) =>
    `${item.workItemKey}:${item.outputKey}`)
  if (new Set(identities).size !== identities.length) {
    throw new Error('Caption private-review artifact lineage is duplicated.')
  }
  return structuredClone(parsed)
}

export function prepareCanonicalCaptionPrivateReviewDependencyBinding(input: {
  projection: CanonicalCaptionSpecialistPlanningProjection | undefined
  renderedMediaWorkBinding:
    CanonicalCaptionRenderedMediaWorkBinding | undefined
  postrenderVisualQaWorkBinding:
    CanonicalCaptionPostrenderVisualQaWorkBinding | undefined
  workItems: CaptionPrivateReviewWorkItem[]
}): CanonicalCaptionPrivateReviewDependencyBinding | null {
  if (!input.projection || input.projection.disposition ===
    'no_caption_work_owner_restraint_preserved'
    || !input.renderedMediaWorkBinding
    || !input.postrenderVisualQaWorkBinding) return null
  const media = input.renderedMediaWorkBinding
  const visualQa = input.postrenderVisualQaWorkBinding
  assertRef(visualQa.planningProjectionRef, {
    id: input.projection.projectionId,
    version: input.projection.schemaVersion,
    contentHash: input.projection.projectionDigestSha256,
  }, 'Caption private-review planning projection is crossed.')
  assertRef(visualQa.renderedMediaWorkBindingRef, {
    id: media.bindingId,
    version: media.schemaVersion,
    contentHash: media.bindingDigestSha256,
  }, 'Caption private-review rendered-media authority is crossed.')
  if (visualQa.outputId !== media.outputId
    || visualQa.canonicalMasterTimingId !== media.canonicalMasterTimingId
    || stableAuthorityStringify(visualQa.confirmedOutputFrame.frameRef)
      !== stableAuthorityStringify(media.confirmedOutputFrame.frameRef)
    || stableAuthorityStringify(visualQa.masterTimingRef)
      !== stableAuthorityStringify(media.masterTimingRef)) {
    throw new Error('Caption private-review output, frame, or timing is crossed.')
  }
  const finalItem = requireOutput(input.workItems,
    media.finalComposition.workItemKey, media.finalComposition.outputKey,
    'video/mp4')
  const deterministicItem = requireOutput(input.workItems,
    visualQa.deterministicQa.workItemKey,
    visualQa.deterministicQa.outputKey, 'application/json')
  const visualItem = requireOutput(input.workItems,
    visualQa.visualQaLifecycle.workItemKey,
    visualQa.visualQaLifecycle.outputKey, 'application/json')
  if (deterministicItem.dependencyKeys.length !== 1
    || deterministicItem.dependencyKeys[0] !== finalItem.workItemKey
    || visualItem.dependencyKeys.length !== 1
    || visualItem.dependencyKeys[0] !== deterministicItem.workItemKey) {
    throw new Error(
      'Caption private-review artifacts lost render to deterministic-QA to visual-QA ordering.',
    )
  }
  const withoutDigest = bindingWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_REVIEW_DEPENDENCY_BINDING_VERSION,
    bindingId: `caption.private-review.${visualQa.bindingDigestSha256.slice(0, 40)}`,
    planningProjectionRef: visualQa.planningProjectionRef,
    renderedMediaWorkBindingRef: visualQa.renderedMediaWorkBindingRef,
    postrenderVisualQaWorkBindingRef: {
      id: visualQa.bindingId,
      version: visualQa.schemaVersion,
      contentHash: visualQa.bindingDigestSha256,
    },
    outputId: visualQa.outputId,
    confirmedOutputFrameRef: visualQa.confirmedOutputFrame.frameRef,
    masterTimingRef: visualQa.masterTimingRef,
    canonicalMasterTimingId: visualQa.canonicalMasterTimingId,
    requiredReviewArtifacts: [
      {
        role: 'final_captioned_render',
        workItemKey: finalItem.workItemKey,
        outputKey: media.finalComposition.outputKey,
        contentType: 'video/mp4',
      },
      {
        role: 'deterministic_final_qa',
        workItemKey: deterministicItem.workItemKey,
        outputKey: visualQa.deterministicQa.outputKey,
        contentType: 'application/json',
      },
      {
        role: 'qualified_complete_time_visual_review',
        workItemKey: visualItem.workItemKey,
        outputKey: visualQa.visualQaLifecycle.outputKey,
        contentType: 'application/json',
      },
    ],
    canonicalPrivateReview: {
      assemblyServiceId: 'canonical_private_review_assembly_service',
      assemblyResponseSchemaVersion:
        'canonical-private-review-assembly-response-v1',
      assemblyManifestSchemaVersion: 'canonical-private-review-manifest-v1',
      assemblyRoute: ASSEMBLY_ROUTE,
      decisionServiceId: 'canonical_private_review_decision_service',
      decisionResponseSchemaVersion:
        'canonical-private-review-decision-response-v1',
      decisionManifestSchemaVersion:
        'canonical-private-review-decision-manifest-v1',
      decisionRoute: DECISION_ROUTE,
    },
    everyRequiredArtifactRequiresCreateOnlyPersistence: true,
    everyRequiredArtifactRequiresIndependentQa: true,
    everyRequiredArtifactRequiresReconciliation: true,
    actualReviewAssemblyCreated: false,
    actualPrivateReviewDecisionRecorded: false,
    privateReviewAcceptanceClaimed: false,
    browserReviewCompletionAccepted: false,
    approvedSnapshotMutationGranted: false,
    additionalWorkCreationGranted: false,
    providerDispatchGranted: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  return parseCanonicalCaptionPrivateReviewDependencyBinding({
    ...withoutDigest,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, bindingDigestSha256: '' },
      'bindingDigestSha256'),
  })
}

export function assertCanonicalCaptionPrivateReviewDependencyBindingMatches(
  binding: CanonicalCaptionPrivateReviewDependencyBinding,
  input: {
    projection: CanonicalCaptionSpecialistPlanningProjection
    renderedMediaWorkBinding: CanonicalCaptionRenderedMediaWorkBinding
    postrenderVisualQaWorkBinding:
      CanonicalCaptionPostrenderVisualQaWorkBinding
    workItems: CaptionPrivateReviewWorkItem[]
  },
): void {
  const expected = prepareCanonicalCaptionPrivateReviewDependencyBinding(input)
  if (!expected || stableAuthorityStringify(expected)
    !== stableAuthorityStringify(binding)) {
    throw new Error(
      'Caption private-review dependency binding no longer matches its immutable work graph.',
    )
  }
}

function requireOutput(
  workItems: CaptionPrivateReviewWorkItem[],
  workItemKey: string,
  outputKey: string,
  contentType: 'video/mp4' | 'application/json',
): CaptionPrivateReviewWorkItem {
  const items = workItems.filter((item) => item.workItemKey === workItemKey)
  const output = items[0]?.expectedOutputs.find((item) =>
    item.outputKey === outputKey)
  if (items.length !== 1 || !output || !output.required
    || output.previewPlaceholderAllowed || output.contentType !== contentType) {
    throw new Error('Caption private-review required artifact is missing.')
  }
  return items[0]!
}

function assertRef(
  actual: { id: string; version: string; contentHash: string },
  expected: { id: string; version: string; contentHash: string },
  message: string,
): void {
  if (stableAuthorityStringify(actual) !== stableAuthorityStringify(expected)) {
    throw new Error(message)
  }
}
