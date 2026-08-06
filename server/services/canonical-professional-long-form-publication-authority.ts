import { z } from 'zod'

import {
  PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS,
  PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY,
  buildProfessionalLongFormControllerExecutionInput,
  professionalLongFormControllerExecutionInputSchema,
  type ProfessionalLongFormControllerExecutionInput,
} from '../edit-architecture/professional-long-form-approved-snapshot-bridge'
import {
  PROFESSIONAL_LONG_FORM_OBJECT_PLAN_SEED_VERSION,
  verifyProfessionalLongFormObjectPlanSeed,
  type ProfessionalLongFormObjectPlanSeed,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import type { SourceBindingManifestCandidate } from '../validation/source-media-authority-schemas'
import {
  type AuthorityJsonBlobRef,
  type AuthorityPlanWorkItemRecord,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION =
  'canonical-professional-long-form-seed-draft-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY =
  'professional-long-form-object-controller' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_OUTPUT_KEY =
  'professional-long-form-derived-child-graph' as const

const safeIdentity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

export const canonicalProfessionalLongFormSeedDraftSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION),
  identity: z.object({
    workspaceId: safeIdentity,
    projectId: safeIdentity,
    editSessionId: safeIdentity,
    planningRequestId: safeIdentity,
  }).strict(),
  runtimeRegion: z.unknown(),
  confirmedOutputFrame: z.unknown(),
  totalFrames: z.unknown(),
  sourceRanges: z.unknown(),
  executionPolicy: z.unknown(),
  approvalAndCostBoundary: z.unknown(),
}).strict()

export type CanonicalProfessionalLongFormSeedDraft = z.infer<
  typeof canonicalProfessionalLongFormSeedDraftSchema
>

export interface PreparedCanonicalProfessionalLongFormPublication {
  seed: ProfessionalLongFormObjectPlanSeed
  seedRef: AuthorityJsonBlobRef
  controllerExecutionInput: ProfessionalLongFormControllerExecutionInput
  controllerWorkItem: CanonicalWorkItemInput
}

export interface LoadedCanonicalProfessionalLongFormPublicationAuthority {
  seed: ProfessionalLongFormObjectPlanSeed
  seedRef: AuthorityJsonBlobRef
  controllerExecutionInput: ProfessionalLongFormControllerExecutionInput
  controllerWorkItem: AuthorityPlanWorkItemRecord
}

export function prepareCanonicalProfessionalLongFormPublication(input: {
  seedDraft: unknown
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  components: CanonicalPlanComponentsInput
  sourceMediaAuthority: SourceBindingManifestCandidate
  existingWorkItems: readonly CanonicalWorkItemInput[]
}): PreparedCanonicalProfessionalLongFormPublication {
  const draftResult = canonicalProfessionalLongFormSeedDraftSchema.safeParse(
    input.seedDraft,
  )
  if (!draftResult.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Professional long-form seed draft validation failed.',
      400,
      draftResult.error.flatten(),
    )
  }
  const draft = draftResult.data
  if (
    draft.identity.workspaceId !== input.workspaceId ||
    draft.identity.projectId !== input.projectId ||
    draft.identity.editSessionId !== input.editSessionId ||
    draft.identity.planningRequestId !== input.planningRequestId
  ) {
    throw validationError(
      'Professional long-form seed identity does not match canonical publication scope.',
    )
  }
  if (
    input.existingWorkItems.length >= 256 ||
    input.existingWorkItems.some((workItem) =>
      workItem.workItemKey === CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY ||
      workItem.workerClass === PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS)
  ) {
    throw validationError(
      'Canonical publication cannot add the unique professional long-form controller within the work-item ceiling.',
    )
  }

  const approvedTimingHash = canonicalTimingHash(input.components)
  const seed = verifySeed({
    schemaVersion: PROFESSIONAL_LONG_FORM_OBJECT_PLAN_SEED_VERSION,
    identity: {
      ...draft.identity,
      approvedTimingHash,
    },
    runtimeRegion: draft.runtimeRegion,
    confirmedOutputFrame: draft.confirmedOutputFrame,
    totalFrames: draft.totalFrames,
    sourceRanges: draft.sourceRanges,
    executionPolicy: draft.executionPolicy,
    approvalAndCostBoundary: draft.approvalAndCostBoundary,
  }, 400)
  assertSeedMatchesCanonicalAuthority({
    seed,
    components: input.components,
    sourceMediaAuthority: input.sourceMediaAuthority,
  })

  const seedRef = authorityRefForValue(seed)
  if (seedRef.byteLength > 2 * 1024 * 1024) {
    throw validationError(
      'Professional long-form seed exceeds the canonical component byte ceiling.',
    )
  }
  const controllerExecutionInput = buildProfessionalLongFormControllerExecutionInput({
    planSeedHash: seedRef.sha256,
    planSeedComponentRefSha256: seedRef.sha256,
  })
  return {
    seed,
    seedRef,
    controllerExecutionInput,
    controllerWorkItem: buildControllerWorkItem({
      seed,
      seedRef,
      executionInput: controllerExecutionInput,
    }),
  }
}

export async function persistPreparedCanonicalProfessionalLongFormPublication(input: {
  context: ServiceContext
  publication: PreparedCanonicalProfessionalLongFormPublication
}): Promise<AuthorityJsonBlobRef> {
  const persistedRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.publication.seed as unknown as Record<string, unknown>,
    maxBytes: 2 * 1024 * 1024,
  })
  if (stableAuthorityStringify(persistedRef) !== stableAuthorityStringify(input.publication.seedRef)) {
    throw validationError(
      'Persisted professional long-form seed reference changed from its validated content identity.',
    )
  }
  return persistedRef
}

export async function loadCanonicalProfessionalLongFormPublicationAuthority(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  components: CanonicalPlanComponentsInput
  sourceMediaAuthority: SourceBindingManifestCandidate
  componentRefs: Record<string, AuthorityJsonBlobRef>
  planWorkItems: readonly AuthorityPlanWorkItemRecord[]
}): Promise<LoadedCanonicalProfessionalLongFormPublicationAuthority | undefined> {
  const seedRef = input.componentRefs[PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY]
  const controllerCandidates = input.planWorkItems.filter((workItem) =>
    workItem.workItemKey === CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY ||
    workItem.workerClass === PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS)
  if (!seedRef && controllerCandidates.length === 0) return undefined
  if (!seedRef || controllerCandidates.length !== 1) {
    throw validationError(
      'Professional long-form publication lost its unique seed/controller authority.',
    )
  }

  const seedValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: seedRef,
  })
  const seed = verifySeed(seedValue, 409)
  if (
    seedRef.sha256 !== sha256AuthorityValue(seed) ||
    seed.identity.workspaceId !== input.workspaceId ||
    seed.identity.projectId !== input.projectId ||
    seed.identity.editSessionId !== input.editSessionId ||
    seed.identity.planningRequestId !== input.planningRequestId
  ) {
    throw validationError(
      'Professional long-form seed does not match its canonical plan lineage.',
    )
  }
  assertSeedMatchesCanonicalAuthority({
    seed,
    components: input.components,
    sourceMediaAuthority: input.sourceMediaAuthority,
  })

  const controllerWorkItem = controllerCandidates[0]!
  const [executionInputValue, fallbackPolicyValue] = await Promise.all([
    readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: controllerWorkItem.executionInputRef,
    }),
    readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: controllerWorkItem.fallbackPolicyRef,
    }),
  ])
  const controllerExecutionInput = professionalLongFormControllerExecutionInputSchema.parse(
    executionInputValue,
  )
  const expectedExecutionInput = buildProfessionalLongFormControllerExecutionInput({
    planSeedHash: seedRef.sha256,
    planSeedComponentRefSha256: seedRef.sha256,
  })
  const expectedWorkItem = buildControllerWorkItem({
    seed,
    seedRef,
    executionInput: expectedExecutionInput,
  })
  const reconstructedWorkItem = {
    workItemKey: controllerWorkItem.workItemKey,
    workItemType: controllerWorkItem.workItemType,
    workerClass: controllerWorkItem.workerClass,
    executionInput: controllerExecutionInput,
    sourceSequenceItemIds: controllerWorkItem.sourceSequenceItemIds,
    sourceCleanupDecisionIds: controllerWorkItem.sourceCleanupDecisionIds,
    expectedOutputs: controllerWorkItem.expectedOutputs,
    dependencyKeys: controllerWorkItem.dependencyKeys,
    approvedToolIds: controllerWorkItem.approvedToolIds,
    approvedProviderRoute: controllerWorkItem.approvedProviderRoute,
    providerExecutionMode: controllerWorkItem.providerExecutionMode,
    fallbackPolicy: fallbackPolicyValue,
    maxAttempts: controllerWorkItem.maxAttempts,
    attemptTimeoutSeconds: controllerWorkItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: controllerWorkItem.scheduledDelaySeconds,
    maximumCreditBudget: controllerWorkItem.maximumCreditBudget,
    required: controllerWorkItem.required,
  }
  if (
    controllerWorkItem.executionInputHash !== controllerWorkItem.executionInputRef.sha256 ||
    stableAuthorityStringify(controllerExecutionInput) !==
      stableAuthorityStringify(expectedExecutionInput) ||
    stableAuthorityStringify(reconstructedWorkItem) !==
      stableAuthorityStringify(expectedWorkItem)
  ) {
    throw validationError(
      'Professional long-form controller no longer matches its persisted seed authority.',
    )
  }
  return { seed, seedRef, controllerExecutionInput, controllerWorkItem }
}

function assertSeedMatchesCanonicalAuthority(input: {
  seed: ProfessionalLongFormObjectPlanSeed
  components: CanonicalPlanComponentsInput
  sourceMediaAuthority: SourceBindingManifestCandidate
}): void {
  const { seed, components, sourceMediaAuthority } = input
  const frame = seed.confirmedOutputFrame
  const settingsFrame = components.confirmedSettings.outputFrame
  const rate = frame.frameRate.numerator / frame.frameRate.denominator
  const durationSeconds = seed.totalFrames / rate
  if (
    seed.identity.approvedTimingHash !== canonicalTimingHash(components) ||
    frame.width !== settingsFrame.width ||
    frame.height !== settingsFrame.height ||
    Math.abs(rate - settingsFrame.fps) > 1e-9 ||
    components.timingSummary.totalFrames !== seed.totalFrames ||
    Math.abs(components.timingSummary.fps - rate) > 1e-9 ||
    Math.abs(components.confirmedSettings.professionalExportCoverage.durationSeconds -
      durationSeconds) > 1e-6 ||
    components.confirmedSettings.professionalExportCoverage.outputFps !== settingsFrame.fps ||
    components.confirmedSettings.professionalExportCoverage.assumption !== 'always_estimate_4k_uhd' ||
    components.confirmedSettings.professionalExportCoverage.allowsAdditionalExportCharge ||
    components.confirmedSettings.professionalExportCoverage.requiresSeparateExportEstimate
  ) {
    throw validationError(
      'Professional long-form seed does not match confirmed frame, timing, or one-estimate 4K authority.',
    )
  }

  const sourceBindings = new Map(sourceMediaAuthority.bindings.map((binding) => [
    binding.sourceSequenceItemId,
    binding,
  ]))
  const cleanupDecisions = new Map(components.sourceCleanupPlan.decisions.map((decision) => [
    decision.decisionId,
    decision,
  ]))
  const segments = new Map(components.segments.map((segment) => [segment.segmentId, segment]))
  for (const range of seed.sourceRanges) {
    const binding = sourceBindings.get(range.sourceSequenceItemId)
    const cleanup = cleanupDecisions.get(range.sourceCleanupDecisionId)
    const segment = segments.get(range.segmentId)
    const expectedGeneration = binding?.storageProvider === 'google_cloud_storage'
      ? binding.generation
      : '1'
    if (
      !binding ||
      binding.mediaAssetId !== range.mediaAssetId ||
      binding.checksumSha256 !== range.sourceSha256 ||
      binding.sizeBytes !== range.sourceByteLength ||
      !expectedGeneration ||
      expectedGeneration !== range.sourceObjectGeneration ||
      !cleanup ||
      cleanup.sourceSequenceItemId !== range.sourceSequenceItemId ||
      cleanup.action === 'cut' ||
      range.sourceStartFrame < cleanup.startFrame ||
      range.sourceEndFrameExclusive > cleanup.endFrameExclusive ||
      !segment ||
      segment.startFrame !== range.timelineStartFrame ||
      segment.endFrameExclusive !== range.timelineEndFrameExclusive
    ) {
      throw validationError(
        'Professional long-form source range does not match canonical source, cleanup, segment, or storage authority.',
      )
    }
  }
}

function buildControllerWorkItem(input: {
  seed: ProfessionalLongFormObjectPlanSeed
  seedRef: AuthorityJsonBlobRef
  executionInput: ProfessionalLongFormControllerExecutionInput
}): CanonicalWorkItemInput {
  return {
    workItemKey: CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY,
    workItemType: 'custom',
    workerClass: PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS,
    executionInput: input.executionInput,
    sourceSequenceItemIds: [...new Set(input.seed.sourceRanges.map((range) =>
      range.sourceSequenceItemId))],
    sourceCleanupDecisionIds: [...new Set(input.seed.sourceRanges.map((range) =>
      range.sourceCleanupDecisionId))],
    expectedOutputs: [{
      outputKey: CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_OUTPUT_KEY,
      artifactType: 'professional_long_form_child_graph_manifest',
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
      policy: 'block_before_child_derivation',
      planSeedHash: input.seedRef.sha256,
      automaticFallbackAuthorized: false,
    },
    maxAttempts: 1,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 0,
    required: true,
  }
}

function canonicalTimingHash(components: CanonicalPlanComponentsInput): string {
  return sha256AuthorityValue({
    masterTimingPlan: authorityRefForValue(components.masterTimingPlan),
    captionVisualCueTimingPlan: authorityRefForValue(
      components.captionVisualCueTimingPlan,
    ),
    soundSyncTransitionTimingPlan: authorityRefForValue(
      components.soundSyncTransitionTimingPlan,
    ),
    timingValidationPlan: authorityRefForValue(components.timingValidationPlan),
    timingSummary: authorityRefForValue(components.timingSummary),
  })
}

function authorityRefForValue(value: unknown): AuthorityJsonBlobRef {
  const serialized = stableAuthorityStringify(value)
  return {
    sha256: sha256AuthorityValue(value),
    byteLength: Buffer.byteLength(serialized, 'utf8'),
  }
}

function validationError(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function verifySeed(
  value: unknown,
  statusCode: 400 | 409,
): ProfessionalLongFormObjectPlanSeed {
  try {
    return verifyProfessionalLongFormObjectPlanSeed(value)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'VALIDATION_FAILED',
      statusCode === 400
        ? 'Professional long-form seed draft is invalid.'
        : 'Persisted professional long-form seed authority is invalid.',
      statusCode,
      { reason: error instanceof Error ? error.message : String(error) },
    )
  }
}
