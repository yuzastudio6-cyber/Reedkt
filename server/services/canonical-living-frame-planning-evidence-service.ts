import type {
  PrivateGcpVisualEvidencePackage,
  PrivateGcpVisualUnderstandingPlan,
} from '../../src/types/private-gcp-visual-understanding'
import type {
  LivingFramePlanningEvidenceBinding,
  LivingFramePlanningEvidenceBindingDraft,
  LivingFramePlanningObservationProjection,
  LivingFramePlanningSourceEvidenceProjection,
} from '../../src/types/living-frame-planning-evidence'
import {
  LIVING_FRAME_PLANNING_EVIDENCE_AUTHORITY_BOUNDARY,
  calculateLivingFramePlanningEvidenceDigest,
  createLivingFramePlanningEvidenceBinding,
  livingFrameOutputFrameDigestProjection,
  validateLivingFramePlanningEvidenceBinding,
} from '../../src/lib/living-frame'
import {
  verifyPrivateGcpVisualEvidencePackage,
} from '../../src/lib/private-gcp-visual-understanding-contract'
import { ApiError } from '../errors/api-error'
import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalLivingFramePlanningEvidenceBindingSchema,
  canonicalLivingFramePlanningEvidenceLocatorSchema,
  canonicalLivingFramePlanningEvidenceScopeSchema,
  type CanonicalLivingFramePlanningEvidenceScope,
} from '../validation/canonical-living-frame-planning-evidence-schemas'
import {
  revalidateCanonicalLivingFramePlanningBinding,
} from './canonical-living-frame-planning-binding-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION =
  'canonical-living-frame-planning-evidence-reader-v1' as const
export const PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION =
  'private-living-frame-planning-evidence-reader-result-v1' as const

export interface PrivateLivingFramePlanningEvidenceRecord {
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly plan: PrivateGcpVisualUnderstandingPlan
  readonly evidence: PrivateGcpVisualEvidencePackage
}

export interface PrivateLivingFramePlanningEvidenceReaderResult {
  readonly schemaVersion:
    typeof PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly records: readonly PrivateLivingFramePlanningEvidenceRecord[]
}

export interface CanonicalLivingFramePlanningEvidenceReaderPort {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION
  readonly sourceAuthority: 'private_gcp_visual_evidence_repository'
  readonly evidenceClass: 'controlled_private_source_evidence_reader'
  readonly productionReady: false
  readByServerOwnedLocator(input: {
    readonly serverOwnedLocatorId: string
    readonly expectedScope: CanonicalLivingFramePlanningEvidenceScope
  }): Promise<unknown>
}

export interface BindCanonicalLivingFramePlanningEvidenceInput {
  readonly locator: unknown
  readonly canonicalContext: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly components: CanonicalPlanComponentsInput
  }
  readonly reader:
    | CanonicalLivingFramePlanningEvidenceReaderPort
    | null
    | undefined
}

export async function bindCanonicalLivingFramePlanningEvidence(
  input: BindCanonicalLivingFramePlanningEvidenceInput,
): Promise<LivingFramePlanningEvidenceBinding> {
  const locator =
    canonicalLivingFramePlanningEvidenceLocatorSchema.safeParse(input.locator)
  if (!locator.success) {
    throw validation(
      'Canonical Living Frame planning evidence locator is invalid.',
      'canonical_living_frame_planning_evidence_locator',
    )
  }
  const scope =
    canonicalLivingFramePlanningEvidenceScopeSchema.safeParse({
      workspaceId: input.canonicalContext.workspaceId,
      projectId: input.canonicalContext.projectId,
      editSessionId: input.canonicalContext.editSessionId,
    })
  if (!scope.success) {
    throw validation(
      'Canonical Living Frame planning evidence scope is invalid.',
      'canonical_living_frame_planning_evidence_scope',
    )
  }
  const parsedComponents = canonicalPlanComponentsSchema.safeParse(
    input.canonicalContext.components,
  )
  if (!parsedComponents.success) {
    throw validation(
      'Canonical Living Frame planning evidence requires valid canonical plan components.',
      'canonical_plan_components',
    )
  }
  const components = parsedComponents.data
  const livingFrame = await revalidateCanonicalLivingFramePlanningBinding({
    components,
  })
  if (!livingFrame) {
    throw conflict(
      'Canonical Living Frame planning evidence requires the exact deferred parent component.',
      'canonical_living_frame_deferred_component',
    )
  }

  const canonicalBindings = {
    workspaceId: scope.data.workspaceId,
    projectId: scope.data.projectId,
    editSessionId: scope.data.editSessionId,
    livingFrameComponentDigestSha256: livingFrame.contractDigestSha256,
    compiledIntentDigestSha256:
      sha256AuthorityValue(components.compiledIntent),
    sourceSequenceDigestSha256:
      sha256AuthorityValue(components.sourceSequence),
    outputFrameDigestSha256: sha256AuthorityValue(
      livingFrameOutputFrameDigestProjection(components),
    ),
    masterTimingDigestSha256:
      sha256AuthorityValue(components.masterTimingPlan),
    ideaFirstAuthorityDigestSha256:
      components.motionStudioStorytellingProductionAuthority?.authorityHash
      ?? null,
  }

  if (components.motionStudioStorytellingProductionAuthority) {
    if (
      locator.data.serverOwnedLocatorId !== null
      || components.sourceSequence.length !== 0
      || components.sourceCleanupSummary.status !== 'not_applicable'
      || components.sourceCleanupPlan.status !== 'not_applicable'
      || components.sourceCleanupPlan.decisions.length !== 0
      || components.motionStudioStorytellingProductionAuthority.sourceMode !==
        'idea_first_no_uploaded_media'
      || !components.motionStudioStorytellingProductionAuthority
        .noUploadedSourceExpected
      || components.motionStudioStorytellingProductionAuthority
        .fabricatedUploadRecordCount !== 0
    ) {
      throw conflict(
        'Idea-first Living Frame evidence is not applicable only under the exact canonical source-less authority.',
        'canonical_idea_first_source_authority',
      )
    }
    return createAndRevalidateBinding({
      contractVersion: 'living-frame-planning-evidence-binding-v1',
      contractSource:
        'living_frame_private_visual_evidence_projection_planning_only',
      status: 'not_applicable_idea_first',
      runtimeReadiness: 'planning_evidence_only',
      sourceMode: 'idea_first_no_uploaded_media',
      evidenceClass: 'not_applicable_canonical_idea_first',
      canonicalBindings,
      sourceEvidence: [],
      sourceEvidenceCount: 0,
      evidenceSetDigestSha256:
        await calculateLivingFramePlanningEvidenceDigest([]),
      authorityBoundary:
        LIVING_FRAME_PLANNING_EVIDENCE_AUTHORITY_BOUNDARY,
    })
  }

  if (locator.data.serverOwnedLocatorId === null) {
    throw blocked(
      'Uploaded-media Living Frame planning requires a server-owned visual evidence locator.',
      'living_frame_visual_evidence_locator',
    )
  }
  assertReader(input.reader)
  const rawResult = await input.reader.readByServerOwnedLocator({
    serverOwnedLocatorId: locator.data.serverOwnedLocatorId,
    expectedScope: scope.data,
  })
  const result = parseReaderResult(rawResult)
  if (
    result.workspaceId !== scope.data.workspaceId
    || result.projectId !== scope.data.projectId
    || result.editSessionId !== scope.data.editSessionId
  ) {
    throw conflict(
      'Living Frame visual evidence belongs to another canonical scope.',
      'living_frame_visual_evidence_scope',
    )
  }
  if (result.records.length !== components.sourceSequence.length) {
    throw conflict(
      'Living Frame visual evidence does not cover the exact canonical source sequence.',
      'living_frame_visual_evidence_source_coverage',
    )
  }

  const seenSequenceItems = new Set<string>()
  const seenMediaAssets = new Set<string>()
  const sourceEvidence: LivingFramePlanningSourceEvidenceProjection[] = []
  for (const [index, source] of components.sourceSequence.entries()) {
    const record = result.records[index]
    if (
      !record
      || record.sourceSequenceItemId !== source.sourceSequenceItemId
      || record.mediaAssetId !== source.mediaAssetId
      || source.uploadedOrder !== index + 1
      || source.checksumSha256 === undefined
      || seenSequenceItems.has(record.sourceSequenceItemId)
      || seenMediaAssets.has(record.mediaAssetId)
    ) {
      throw conflict(
        'Living Frame visual evidence source identity or order is stale.',
        'living_frame_visual_evidence_source_identity',
      )
    }
    seenSequenceItems.add(record.sourceSequenceItemId)
    seenMediaAssets.add(record.mediaAssetId)
    sourceEvidence.push(await projectSourceEvidence({
      scope: scope.data,
      source,
      record,
    }))
  }

  return createAndRevalidateBinding({
    contractVersion: 'living-frame-planning-evidence-binding-v1',
    contractSource:
      'living_frame_private_visual_evidence_projection_planning_only',
    status: 'available_for_preapproval_reasoning',
    runtimeReadiness: 'planning_evidence_only',
    sourceMode: 'uploaded_media',
    evidenceClass:
      'private_source_bound_visual_observation_projection',
    canonicalBindings,
    sourceEvidence,
    sourceEvidenceCount: sourceEvidence.length,
    evidenceSetDigestSha256:
      await calculateLivingFramePlanningEvidenceDigest(sourceEvidence),
    authorityBoundary: LIVING_FRAME_PLANNING_EVIDENCE_AUTHORITY_BOUNDARY,
  })
}

async function projectSourceEvidence(input: {
  scope: CanonicalLivingFramePlanningEvidenceScope
  source: CanonicalPlanComponentsInput['sourceSequence'][number]
  record: PrivateLivingFramePlanningEvidenceRecord
}): Promise<LivingFramePlanningSourceEvidenceProjection> {
  const { plan, evidence } = input.record
  let verification
  try {
    if (
      !plan
      || !evidence
      || plan.phase !== 'preplan_internal_source_analysis'
      || plan.workspaceId !== input.scope.workspaceId
      || plan.projectId !== input.scope.projectId
      || plan.editSessionId !== input.scope.editSessionId
      || plan.source.sourceAssetId !== input.source.mediaAssetId
      || plan.source.sourceChecksumSha256 !== input.source.checksumSha256
    ) {
      throw new Error('source_identity_mismatch')
    }
    verification = verifyPrivateGcpVisualEvidencePackage({ plan, evidence })
  } catch {
    throw conflict(
      'Living Frame visual evidence plan is stale, malformed, or belongs to another source.',
      'living_frame_visual_evidence_plan_identity',
    )
  }
  if (
    !verification.ok
    || verification.blocked
    || !verification.reasoningConsumptionAllowed
    || verification.userReviewRequired
    || verification.providerCallMade
    || verification.customerChargeCreated
  ) {
    throw conflict(
      'Living Frame visual evidence did not pass reasoning-consumption gates.',
      verification.userReviewRequired
        ? 'living_frame_visual_evidence_user_review_required'
        : 'living_frame_visual_evidence_verification',
    )
  }

  const orderedObservations = [...evidence.observations].sort(
    (left, right) =>
      left.startFrame - right.startFrame
      || left.endFrameExclusive - right.endFrameExclusive
      || left.observationId.localeCompare(right.observationId),
  )
  const observations: LivingFramePlanningObservationProjection[] =
    await Promise.all(orderedObservations.map(
      async (observation, order) => ({
        observationId: observation.observationId,
        order,
        startFrame: observation.startFrame,
        endFrameExclusive: observation.endFrameExclusive,
        category: observation.category,
        summary: observation.summary,
        confidenceBasisPoints: observation.confidenceBasisPoints,
        evidenceSampleCount: observation.evidenceSampleIds.length,
        evidenceSampleSetDigestSha256:
          await calculateLivingFramePlanningEvidenceDigest(
            [...observation.evidenceSampleIds].sort(),
          ),
      }),
    ))
  return {
    sourceSequenceItemId: input.source.sourceSequenceItemId,
    mediaAssetId: input.source.mediaAssetId,
    uploadedOrder: input.source.uploadedOrder,
    sourceChecksumSha256: input.source.checksumSha256!,
    planHashSha256: plan.planHash,
    evidencePackageHashSha256: evidence.evidencePackageHash,
    checkpointSha256: evidence.checkpointSha256,
    coverageDigestSha256: evidence.coverageDigestSha256,
    cacheKeySha256: evidence.cacheKeySha256,
    observationCount: observations.length,
    observations,
    observationSetDigestSha256:
      await calculateLivingFramePlanningEvidenceDigest(observations),
    reasoningConsumptionAllowed: true,
    userReviewRequired: false,
  }
}

async function createAndRevalidateBinding(
  draft: LivingFramePlanningEvidenceBindingDraft,
): Promise<LivingFramePlanningEvidenceBinding> {
  let binding
  try {
    binding = await createLivingFramePlanningEvidenceBinding(draft)
  } catch {
    throw validation(
      'Living Frame planning evidence projection is unsafe or invalid.',
      'living_frame_planning_evidence_projection',
    )
  }
  const parsed =
    canonicalLivingFramePlanningEvidenceBindingSchema.safeParse(binding)
  if (!parsed.success) {
    throw validation(
      'Living Frame planning evidence projection failed server schema validation.',
      'living_frame_planning_evidence_projection',
    )
  }
  const revalidated =
    await validateLivingFramePlanningEvidenceBinding(parsed.data)
  if (!revalidated.ok) {
    throw conflict(
      'Living Frame planning evidence projection failed digest revalidation.',
      'living_frame_planning_evidence_digest',
    )
  }
  return revalidated.binding
}

function assertReader(
  reader:
    | CanonicalLivingFramePlanningEvidenceReaderPort
    | null
    | undefined,
): asserts reader is CanonicalLivingFramePlanningEvidenceReaderPort {
  if (
    !reader
    || reader.schemaVersion !==
      CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION
    || reader.sourceAuthority !== 'private_gcp_visual_evidence_repository'
    || reader.evidenceClass !==
      'controlled_private_source_evidence_reader'
    || reader.productionReady !== false
    || typeof reader.readByServerOwnedLocator !== 'function'
  ) {
    throw blocked(
      'Living Frame planning is blocked until the private visual evidence reader is available.',
      'living_frame_private_visual_evidence_reader',
    )
  }
}

function parseReaderResult(
  value: unknown,
): PrivateLivingFramePlanningEvidenceReaderResult {
  if (!isPlainRecord(value)) {
    throw conflict(
      'Living Frame visual evidence reader returned an invalid result.',
      'living_frame_visual_evidence_reader_result',
    )
  }
  const allowedKeys = new Set([
    'schemaVersion',
    'workspaceId',
    'projectId',
    'editSessionId',
    'records',
  ])
  if (
    Object.keys(value).some((key) => !allowedKeys.has(key))
    || value.schemaVersion !==
      PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION
    || typeof value.workspaceId !== 'string'
    || typeof value.projectId !== 'string'
    || typeof value.editSessionId !== 'string'
    || !Array.isArray(value.records)
    || value.records.length > 1_000
  ) {
    throw conflict(
      'Living Frame visual evidence reader returned an invalid result.',
      'living_frame_visual_evidence_reader_result',
    )
  }
  const records = value.records.map((entry) => {
    if (!isPlainRecord(entry)) {
      throw conflict(
        'Living Frame visual evidence reader returned an invalid source record.',
        'living_frame_visual_evidence_reader_record',
      )
    }
    const recordKeys = new Set([
      'sourceSequenceItemId',
      'mediaAssetId',
      'plan',
      'evidence',
    ])
    if (
      Object.keys(entry).some((key) => !recordKeys.has(key))
      || typeof entry.sourceSequenceItemId !== 'string'
      || typeof entry.mediaAssetId !== 'string'
      || !isPlainRecord(entry.plan)
      || !isPlainRecord(entry.evidence)
    ) {
      throw conflict(
        'Living Frame visual evidence reader returned an invalid source record.',
        'living_frame_visual_evidence_reader_record',
      )
    }
    return {
      sourceSequenceItemId: entry.sourceSequenceItemId,
      mediaAssetId: entry.mediaAssetId,
      plan: entry.plan as unknown as PrivateGcpVisualUnderstandingPlan,
      evidence: entry.evidence as unknown as PrivateGcpVisualEvidencePackage,
    }
  })
  return {
    schemaVersion:
      PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION,
    workspaceId: value.workspaceId,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    records,
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function validation(message: string, requiredGate: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate,
    planningOnly: true,
    productionReady: false,
  })
}

function conflict(message: string, requiredGate: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate,
    planningOnly: true,
    productionReady: false,
  })
}

function blocked(message: string, requiredGate: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate,
    planningOnly: true,
    productionReady: false,
  })
}
