import { z } from 'zod'

import type {
  AuditRecordEvidenceRef,
  CostEvidenceRef,
  CostReconciliationEvidenceRef,
  CurrencyExchangeRateEvidenceRef,
  ProductionCostReconciliation,
  ProductionUsageEvent,
  ProviderInvoiceEvidenceRef,
  ProviderRateCard,
  ProviderRateCardEvidenceRef,
  RateCardSourceEvidenceRef,
  SourceLocatorEvidenceRef,
  StorageObjectEvidenceRef,
  MotionStudioVersionReference,
  StorytellingSceneContinuitySlice,
} from '../../../types/motion-studio'

import {
  MOTION_STUDIO_ARTIFACT_KINDS,
  MOTION_STUDIO_PRODUCTION_MODES,
  MOTION_STUDIO_STAGE_ORDER,
} from './constants'
import {
  motionStudioArtifactPayloadSchema,
  motionStudioJsonValueSchema,
  motionStudioRegisteredExtensionSchema,
  motionStudioSourceLocatorSchema,
  motionStudioStorageObjectRefSchema,
  motionStudioTimingAuthoritySchema,
} from './safe-values'
import {
  storytellingSceneContinuitySliceSchema,
  storytellingStoryContinuityGrammarSchema,
} from './story-continuity'

const nonEmpty = z.string().trim().min(1)
const digest = z.string().regex(/^[a-f0-9]{64}$/i)
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)
const signedSafeInteger = z.number().int().refine(Number.isSafeInteger)
const productionMode = z.enum(MOTION_STUDIO_PRODUCTION_MODES)
const actorReference = z.object({
  actorKind: z.enum(['user', 'director', 'system', 'worker', 'reviewer']),
  actorId: nonEmpty,
  displayName: z.string().optional(),
}).strict()
const costUnit = z.enum([
  'input_token', 'cached_input_token', 'output_token', 'image', 'image_edit',
  'video_second', 'audio_second', 'character', 'request', 'cpu_second',
  'gpu_second', 'render_frame', 'render_minute', 'storage_gib_hour',
  'storage_gib_month', 'network_egress_gib', 'search_request',
])
const costEvidenceVersionShape = {
  evidenceVersionId: nonEmpty,
  evidenceDigest: digest,
  capturedAt: nonEmpty,
  extensions: z.array(motionStudioRegisteredExtensionSchema).max(64).readonly().optional(),
}

export const rateCardSourceEvidenceRefSchema = z.object({
  ...costEvidenceVersionShape,
  kind: z.literal('rate_card_source'),
  rateCardSourceRecordId: nonEmpty,
  sourceSystem: z.enum(['provider_official', 'reeditpro_internal']),
  provenanceClass: z.enum(['official_provider_pricing', 'internal_cost_policy']),
}).strict() satisfies z.ZodType<RateCardSourceEvidenceRef>

export const providerInvoiceEvidenceRefSchema = z.object({
  ...costEvidenceVersionShape,
  kind: z.literal('provider_invoice'),
  providerInvoiceRecordId: nonEmpty,
  providerBillingRecordId: nonEmpty,
  sourceSystem: z.literal('provider_billing'),
  provenanceClass: z.literal('provider_invoice'),
}).strict() satisfies z.ZodType<ProviderInvoiceEvidenceRef>

export const storageObjectEvidenceRefSchema = z.object({
  ...costEvidenceVersionShape,
  kind: z.literal('storage_object'),
  storageObjectRef: motionStudioStorageObjectRefSchema,
  sourceSystem: z.literal('private_storage'),
  provenanceClass: z.enum(['stored_rate_card', 'stored_provider_invoice']),
}).strict() satisfies z.ZodType<StorageObjectEvidenceRef>

export const sourceLocatorEvidenceRefSchema = z.object({
  ...costEvidenceVersionShape,
  kind: z.literal('source_locator'),
  sourceLocator: motionStudioSourceLocatorSchema,
  sourceSystem: z.literal('official_public_source'),
  provenanceClass: z.literal('official_provider_pricing'),
}).strict() satisfies z.ZodType<SourceLocatorEvidenceRef>

export const currencyExchangeRateEvidenceRefSchema = z.object({
  ...costEvidenceVersionShape,
  kind: z.literal('source_locator'),
  sourceLocator: motionStudioSourceLocatorSchema,
  sourceSystem: z.literal('official_public_source'),
  provenanceClass: z.literal('official_fx_rate'),
}).strict() satisfies z.ZodType<CurrencyExchangeRateEvidenceRef>

export const auditRecordEvidenceRefSchema = z.object({
  ...costEvidenceVersionShape,
  kind: z.literal('audit_record'),
  auditRecordId: nonEmpty,
  sourceSystem: z.literal('reeditpro_audit'),
  provenanceClass: z.enum(['rate_card_verification', 'cost_reconciliation']),
}).strict() satisfies z.ZodType<AuditRecordEvidenceRef>

export const costEvidenceRefSchema = z.discriminatedUnion('kind', [
  rateCardSourceEvidenceRefSchema,
  providerInvoiceEvidenceRefSchema,
  storageObjectEvidenceRefSchema,
  sourceLocatorEvidenceRefSchema,
  auditRecordEvidenceRefSchema,
]) satisfies z.ZodType<CostEvidenceRef>

const rateCardStorageObjectEvidenceRefSchema = storageObjectEvidenceRefSchema.extend({
  provenanceClass: z.literal('stored_rate_card'),
})
const providerInvoiceStorageObjectEvidenceRefSchema = storageObjectEvidenceRefSchema.extend({
  provenanceClass: z.literal('stored_provider_invoice'),
})
const rateCardAuditRecordEvidenceRefSchema = auditRecordEvidenceRefSchema.extend({
  provenanceClass: z.literal('rate_card_verification'),
})
const costReconciliationAuditRecordEvidenceRefSchema = auditRecordEvidenceRefSchema.extend({
  provenanceClass: z.literal('cost_reconciliation'),
})

export const providerRateCardEvidenceRefSchema = z.discriminatedUnion('kind', [
  rateCardSourceEvidenceRefSchema,
  rateCardStorageObjectEvidenceRefSchema,
  sourceLocatorEvidenceRefSchema,
  rateCardAuditRecordEvidenceRefSchema,
]) satisfies z.ZodType<ProviderRateCardEvidenceRef>

export const costReconciliationEvidenceRefSchema = z.discriminatedUnion('kind', [
  providerInvoiceEvidenceRefSchema,
  providerInvoiceStorageObjectEvidenceRefSchema,
  costReconciliationAuditRecordEvidenceRefSchema,
]) satisfies z.ZodType<CostReconciliationEvidenceRef>

export const motionStudioOwnershipSchema = z.object({
  workspaceId: nonEmpty,
  projectId: nonEmpty,
  editSessionId: nonEmpty,
}).strict()

export const motionStudioVersionReferenceSchema = z.object({
  artifactId: nonEmpty,
  versionId: nonEmpty,
  versionNumber: z.number().int().positive(),
  contentDigest: digest,
}).strict()

export const motionStudioMotionLanguageReferenceSchema = z.object({
  motionLanguageId: nonEmpty,
  motionLanguageVersion: nonEmpty,
  motionLanguageDigest: digest,
}).strict()

export const motionStudioNarrativeFunctionReferenceSchema = z.object({
  narrativeFunctionId: nonEmpty,
  narrativeFunctionVersion: nonEmpty,
  narrativeFunctionDigest: digest,
}).strict()

export { motionStudioTimingAuthoritySchema }

export const motionStudioProductionSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: z.enum([
    'draft',
    'planning',
    'awaiting_review',
    'approved_for_execution',
    'producing',
    'blocked',
    'reviewing',
    'delivery_ready',
    'completed',
    'archived',
  ]),
  currentStage: z.enum(MOTION_STUDIO_STAGE_ORDER),
  workspaceMode: z.enum(['guided', 'studio']),
  defaultProductionMode: z.enum(MOTION_STUDIO_PRODUCTION_MODES),
  userFacingStrategy: z.literal("Director's Hybrid"),
  currentArtifactVersionReferences: z.array(motionStudioVersionReferenceSchema),
  recordVersion: z.number().int().positive(),
  createdAt: nonEmpty,
  updatedAt: nonEmpty,
  runtimeImplemented: z.literal(false),
}).strict()

export const motionStudioArtifactSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  kind: z.enum(MOTION_STUDIO_ARTIFACT_KINDS),
  currentDraftVersion: motionStudioVersionReferenceSchema.optional(),
  currentApprovedVersion: motionStudioVersionReferenceSchema.optional(),
  archivedAt: nonEmpty.optional(),
  createdAt: nonEmpty,
}).strict()

export const motionStudioProductionBriefSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  title: nonEmpty,
  objective: nonEmpty,
  audience: nonEmpty,
  platform: nonEmpty,
  targetDurationSeconds: z.number().finite().positive().optional(),
  language: nonEmpty,
  tone: z.array(nonEmpty),
  prohibitedElements: z.array(nonEmpty),
  openQuestions: z.array(nonEmpty),
}).strict()

export const motionStudioStoryBibleSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  premise: nonEmpty,
  narrativeAngle: nonEmpty,
  narratorPerspective: nonEmpty,
  chapters: z.array(nonEmpty).min(1),
  people: z.array(nonEmpty),
  locations: z.array(nonEmpty),
  events: z.array(nonEmpty),
  emotionalArc: z.array(nonEmpty),
  approvedDecisionIds: z.array(nonEmpty),
}).strict()

const preparedScriptNarrationSegmentSchema = z.object({
  id: nonEmpty,
  order: safeInteger,
  chapterId: nonEmpty,
  sceneId: nonEmpty,
  startTimingAnchorId: nonEmpty,
  endTimingAnchorId: nonEmpty,
  startFrame: safeInteger,
  endFrame: positiveSafeInteger,
  text: z.string().trim().min(1).max(8_000),
  meaning: z.string().trim().min(1).max(2_000),
  visualCue: z.string().trim().min(1).max(2_000),
  preservationPolicy: z.literal('preserve_exact'),
  claimIds: z.array(nonEmpty).max(128),
  sourceReferenceIds: z.array(nonEmpty).max(128),
}).strict()

export const motionStudioPreparedScriptSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  scriptMode: z.literal('prepared'),
  title: z.string().trim().min(1).max(240),
  language: z.string().trim().min(1).max(120),
  timingAuthority: motionStudioTimingAuthoritySchema,
  chapters: z.array(z.object({
    id: nonEmpty,
    order: safeInteger,
    title: z.string().trim().min(1).max(240),
    sceneIds: z.array(nonEmpty).min(1).max(8),
  }).strict()).min(1).max(8),
  narrationSegments: z.array(preparedScriptNarrationSegmentSchema).min(1).max(40),
  userLockedText: z.literal(true),
}).strict().superRefine((value, context) => {
  const chapterIds = new Set<string>()
  const sceneIds = new Set<string>()
  value.chapters.forEach((chapter, index) => {
    if (chapter.order !== index) context.addIssue({ code: 'custom', path: ['chapters', index, 'order'], message: 'Chapter order must be contiguous and zero-based.' })
    if (chapterIds.has(chapter.id)) context.addIssue({ code: 'custom', path: ['chapters', index, 'id'], message: 'Chapter IDs must be unique.' })
    chapterIds.add(chapter.id)
    chapter.sceneIds.forEach((sceneId, sceneIndex) => {
      if (sceneIds.has(sceneId)) context.addIssue({ code: 'custom', path: ['chapters', index, 'sceneIds', sceneIndex], message: 'A scene may belong to only one chapter.' })
      sceneIds.add(sceneId)
    })
  })
  const segmentIds = new Set<string>()
  let nextFrame = 0
  value.narrationSegments.forEach((segment, index) => {
    if (segment.order !== index) context.addIssue({ code: 'custom', path: ['narrationSegments', index, 'order'], message: 'Narration segment order must be contiguous and zero-based.' })
    if (segmentIds.has(segment.id)) context.addIssue({ code: 'custom', path: ['narrationSegments', index, 'id'], message: 'Narration segment IDs must be unique.' })
    segmentIds.add(segment.id)
    if (!chapterIds.has(segment.chapterId)) context.addIssue({ code: 'custom', path: ['narrationSegments', index, 'chapterId'], message: 'Narration segment chapter must exist.' })
    const chapter = value.chapters.find((candidate) => candidate.id === segment.chapterId)
    if (!chapter?.sceneIds.includes(segment.sceneId)) context.addIssue({ code: 'custom', path: ['narrationSegments', index, 'sceneId'], message: 'Narration segment scene must belong to its chapter.' })
    if (segment.startFrame !== nextFrame) context.addIssue({ code: 'custom', path: ['narrationSegments', index, 'startFrame'], message: 'Narration segments must be gap-free and non-overlapping.' })
    if (segment.endFrame <= segment.startFrame) context.addIssue({ code: 'custom', path: ['narrationSegments', index, 'endFrame'], message: 'Narration segments require positive frame duration.' })
    nextFrame = segment.endFrame
  })
  if (nextFrame !== value.timingAuthority.durationFrames) {
    context.addIssue({ code: 'custom', path: ['narrationSegments'], message: 'Narration segments must cover the exact MasterTimingPlan frame range.' })
  }
})

export const motionStudioVisualCoveragePlanSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  needs: z.array(z.object({
    id: nonEmpty,
    narrativePurpose: nonEmpty,
    kind: z.enum(['location', 'person', 'chronology', 'process', 'comparison', 'evidence', 'data', 'quote', 'transition', 'atmosphere']),
    linkedClaimIds: z.array(nonEmpty),
    preferredTreatment: nonEmpty,
    requiredAccuracy: z.enum(['representative', 'precise', 'source_exact']),
    assetIds: z.array(nonEmpty),
    missing: z.boolean(),
  }).strict()),
  coverageStatus: z.enum(['incomplete', 'review_needed', 'complete']),
}).strict()

export const motionStudioArtifactVersionSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactId: nonEmpty,
  kind: z.enum(MOTION_STUDIO_ARTIFACT_KINDS),
  versionNumber: z.number().int().positive(),
  parentVersionId: nonEmpty.optional(),
  state: z.enum(['draft', 'in_review', 'approved', 'locked', 'rejected', 'superseded', 'archived']),
  payload: motionStudioArtifactPayloadSchema,
  contentDigest: digest,
  immutable: z.boolean(),
  provenance: z.object({
    createdBy: actorReference,
    sourceArtifactVersionIds: z.array(nonEmpty),
    sourceAssetIds: z.array(nonEmpty),
    skillRunIds: z.array(nonEmpty),
    toolRunIds: z.array(nonEmpty),
    providerAttemptIds: z.array(nonEmpty),
    createdAt: nonEmpty,
    extensions: z.array(motionStudioRegisteredExtensionSchema).max(64).optional(),
  }).strict(),
  createdAt: nonEmpty,
}).strict().superRefine((value, context) => {
  const expectedSchemaVersion = `motion-studio.${value.kind.replaceAll('_', '-')}.v1`
  if (value.payload.schemaVersion !== expectedSchemaVersion) {
    context.addIssue({
      code: 'custom',
      path: ['payload', 'schemaVersion'],
      message: `Expected ${expectedSchemaVersion} for ${value.kind}.`,
    })
  }
  const payloadResult = motionStudioArtifactDataSchemaForKind(value.kind).safeParse(value.payload.data)
  if (!payloadResult.success) {
    for (const issue of payloadResult.error.issues) {
      context.addIssue({
        code: 'custom',
        path: ['payload', 'data', ...issue.path],
        message: issue.message,
      })
    }
  }
})

export const motionStudioArtifactApprovalSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactId: nonEmpty,
  artifactVersion: motionStudioVersionReferenceSchema,
  approvedSnapshotId: nonEmpty,
  approvalKind: z.enum(['stage_artifact', 'expensive_work', 'picture_lock', 'delivery']),
  approvedBy: actorReference,
  approvalDigest: digest,
  immutable: z.literal(true),
  createdAt: nonEmpty,
}).strict()

export const motionStudioArtifactDependencySchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  upstream: motionStudioVersionReferenceSchema,
  downstream: motionStudioVersionReferenceSchema,
  dependencyKind: z.enum([
    'requires_exact_version', 'derives_from', 'timing_authority',
    'style_authority', 'asset_input', 'approval_input',
  ]),
  invalidationPolicy: z.enum(['always', 'material_change', 'manual_review', 'never']),
  createdAt: nonEmpty,
}).strict()

export const motionStudioArtifactInvalidationSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  causeVersion: motionStudioVersionReferenceSchema,
  affectedVersion: motionStudioVersionReferenceSchema,
  reason: nonEmpty,
  status: z.enum(['open', 'accepted', 'resolved', 'dismissed']),
  impactEstimateId: nonEmpty.optional(),
  createdAt: nonEmpty,
  resolvedAt: nonEmpty.optional(),
}).strict()

export const motionStudioPropertyLockSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactVersionId: nonEmpty,
  targetPath: nonEmpty,
  lockKind: z.enum(['user_lock', 'approval_lock', 'picture_lock', 'system_safety_lock']),
  lockedBy: actorReference,
  reason: nonEmpty,
  lockDigest: digest,
  createdAt: nonEmpty,
  releasedAt: nonEmpty.optional(),
}).strict()

export const motionStudioManualOverrideSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactVersionId: nonEmpty,
  targetPath: nonEmpty,
  previousValueDigest: digest,
  replacementValue: motionStudioJsonValueSchema,
  authoredBy: actorReference,
  reason: nonEmpty,
  conflictPolicy: z.enum(['fail_if_changed', 'require_review']),
  createdAt: nonEmpty,
}).strict()

export const motionStudioSceneDocumentSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  approvedSnapshotId: nonEmpty,
  sceneId: nonEmpty,
  semanticPurpose: nonEmpty,
  productionMode: z.enum(MOTION_STUDIO_PRODUCTION_MODES),
  timingAuthority: motionStudioTimingAuthoritySchema,
  timing: z.object({ startAnchorId: nonEmpty, endAnchorId: nonEmpty }).strict(),
  assetIds: z.array(nonEmpty),
  layerPlanVersion: motionStudioVersionReferenceSchema,
  keyframes: z.array(z.object({
    id: nonEmpty,
    timingAnchorId: nonEmpty,
    frameOffset: z.number().int().refine(Number.isSafeInteger),
    propertyPath: nonEmpty,
    value: motionStudioJsonValueSchema,
    easingId: z.string().optional(),
  }).strict()),
  designTokenReferences: z.array(nonEmpty),
  maskAssetIds: z.array(nonEmpty),
  effectCapabilityIds: z.array(nonEmpty),
  audioCueIds: z.array(nonEmpty),
  propertyLockIds: z.array(nonEmpty),
  manualOverrideIds: z.array(nonEmpty),
  productionRouteIds: z.array(nonEmpty),
  generationReferenceContractVersions: z.array(motionStudioVersionReferenceSchema).max(16).optional(),
  storyContinuity: storytellingSceneContinuitySliceSchema.optional(),
  recipeInstantiationIds: z.array(nonEmpty),
  compilerFingerprint: z.object({
    compilerId: nonEmpty,
    compilerVersion: nonEmpty,
    inputDigest: digest,
    outputDigest: digest.optional(),
  }).strict(),
  brollReferences: z.array(z.object({
    referenceKind: z.literal('existing_b_roll_asset'),
    assetId: nonEmpty,
    editSystemRecordId: nonEmpty,
    intendedUse: nonEmpty,
  }).strict()),
}).strict().superRefine((value, context) => {
  if (value.storyContinuity && (
    value.storyContinuity.workspaceId !== value.workspaceId ||
    value.storyContinuity.projectId !== value.projectId ||
    value.storyContinuity.editSessionId !== value.editSessionId ||
    value.storyContinuity.productionId !== value.productionId ||
    value.storyContinuity.sceneId !== value.sceneId
  )) {
    context.addIssue({ code: 'custom', path: ['storyContinuity'], message: 'SceneDocument continuity changed the exact scope or scene.' })
  }
})

export const motionStudioSceneRecipeSchema = z.object({
  id: nonEmpty,
  definitionVersion: nonEmpty,
  definitionDigest: digest,
  name: nonEmpty,
  scope: z.enum(['system', 'workspace_private']),
  workspaceId: nonEmpty.optional(),
  compatibleProductionModes: z.array(z.enum(MOTION_STUDIO_PRODUCTION_MODES)).min(1),
  requiredInputArtifactKinds: z.array(nonEmpty).min(1),
  outputArtifactKinds: z.array(nonEmpty).min(1),
  professionalSkillIds: z.array(nonEmpty).min(1),
  toolCapabilityIds: z.array(nonEmpty).min(1),
  qualityGateIds: z.array(nonEmpty).min(1),
  fallbackPolicyIds: z.array(nonEmpty).min(1),
  approvalClass: z.enum(['none', 'stage', 'expensive_work']),
  costClass: z.enum(['no_incremental_provider_cost', 'low', 'medium', 'high']),
  compilerVersion: nonEmpty,
  arbitraryCodeAllowed: z.literal(false),
  brollWorkflowEmbedded: z.literal(false),
  compatibleMotionLanguages: z.array(motionStudioMotionLanguageReferenceSchema).min(1),
  compatibleNarrativeFunctions: z.array(motionStudioNarrativeFunctionReferenceSchema).min(1),
  immutable: z.literal(true),
}).strict()

export const motionStudioMotionStrategySchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  defaultMode: productionMode,
  sceneModeOverrides: z.record(z.string(), productionMode),
  routeRationale: z.array(nonEmpty).min(1),
  calibrationRequired: z.boolean(),
  approvedMotionLanguages: z.array(motionStudioMotionLanguageReferenceSchema).min(1),
}).strict()

export const motionStudioResearchPackSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  researchQuestion: nonEmpty,
  sources: z.array(z.object({
    sourceId: nonEmpty,
    title: nonEmpty,
    sourceType: z.enum(['user_upload', 'web_source', 'archive', 'interview', 'dataset', 'other']),
    trustStatus: z.enum(['untrusted_input', 'reviewed', 'authoritative', 'disputed']),
    rightsStatus: z.enum(['unknown', 'user_authorized', 'licensed', 'public_domain', 'restricted']),
    retrievedAt: nonEmpty.optional(),
  }).strict()),
  findings: z.array(nonEmpty),
  contradictions: z.array(nonEmpty),
  unresolvedQuestions: z.array(nonEmpty),
  instructionsFromSourcesExecutable: z.literal(false),
}).strict()

export const motionStudioReferenceContractSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  assetId: nonEmpty,
  roles: z.array(z.enum([
    'style', 'composition', 'character', 'location', 'object', 'motion',
    'camera', 'first_frame', 'last_frame', 'do_not_copy',
  ])).min(1),
  extract: z.array(nonEmpty),
  preserve: z.array(nonEmpty),
  avoidCopying: z.array(nonEmpty),
  contentTrust: z.literal('untrusted_input'),
  executableInstructionsAllowed: z.literal(false),
}).strict()

export const motionStudioClaimLedgerSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  entries: z.array(z.object({
    id: nonEmpty,
    claim: nonEmpty,
    classification: z.enum([
      'verified_fact', 'widely_reported', 'reported_allegation', 'disputed_claim',
      'director_inference', 'creative_reconstruction', 'speculation', 'fiction',
    ]),
    sourceIds: z.array(nonEmpty),
    confidence: z.enum(['low', 'medium', 'high']),
    alternativeInterpretations: z.array(nonEmpty),
    scriptArtifactVersionIds: z.array(nonEmpty),
    sceneIds: z.array(nonEmpty),
    disclosureRequired: z.boolean(),
  }).strict()),
  reviewedAt: nonEmpty.optional(),
}).strict()

export const motionStudioMotionDnaSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  visualIdentity: z.object({
    paletteTokenIds: z.array(nonEmpty),
    typographyTokenIds: z.array(nonEmpty),
    materialDescriptors: z.array(nonEmpty),
    textureDescriptors: z.array(nonEmpty),
  }).strict(),
  compositionGrammar: z.object({
    hierarchyRules: z.array(nonEmpty),
    depthRules: z.array(nonEmpty),
    safeZoneRuleIds: z.array(nonEmpty),
  }).strict(),
  motionGrammar: z.object({
    entranceFamilies: z.array(nonEmpty),
    exitFamilies: z.array(nonEmpty),
    emphasisFamilies: z.array(nonEmpty),
    easingTokenIds: z.array(nonEmpty),
  }).strict(),
  cameraGrammar: z.object({
    allowedMoves: z.array(nonEmpty),
    prohibitedMoves: z.array(nonEmpty),
    parallaxPolicy: nonEmpty,
  }).strict(),
  audioGrammar: z.object({
    speechPriority: z.literal(true),
    cueFamilies: z.array(nonEmpty),
    prohibitedAudioCharacteristics: z.array(nonEmpty),
  }).strict(),
  continuityRules: z.array(nonEmpty),
  storyContinuityGrammar: storytellingStoryContinuityGrammarSchema.optional(),
  prohibitedCharacteristics: z.array(nonEmpty),
  referenceContractIds: z.array(nonEmpty),
}).strict().superRefine((value, context) => {
  const grammar = value.storyContinuityGrammar
  if (!grammar) return
  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (grammar[field] !== value[field]) {
      context.addIssue({
        code: 'custom',
        path: ['storyContinuityGrammar', field],
        message: `Story continuity grammar ${field} must match the Motion DNA authority.`,
      })
    }
  }
  const expectedStyleMarker = `Style authority ${grammar.styleProfile.styleProfileId}` +
    `@${grammar.styleProfile.styleProfileVersion}#${grammar.styleProfile.styleProfileDigest}`
  if (!value.continuityRules.includes(expectedStyleMarker)) {
    context.addIssue({
      code: 'custom',
      path: ['storyContinuityGrammar', 'styleProfile'],
      message: 'Story continuity grammar must bind the exact Motion DNA style authority.',
    })
  }
  const motionReferenceIds = [...new Set(value.referenceContractIds)].sort()
  const grammarReferenceIds = [...new Set(grammar.referenceContractVersions.map((version) => version.artifactId))].sort()
  if (JSON.stringify(motionReferenceIds) !== JSON.stringify(grammarReferenceIds)) {
    context.addIssue({
      code: 'custom',
      path: ['storyContinuityGrammar', 'referenceContractVersions'],
      message: 'Story continuity grammar must bind the exact Motion DNA Reference Contract set.',
    })
  }
})

export const motionStudioMotionLanguageDefinitionSchema = z.object({
  id: nonEmpty,
  version: nonEmpty,
  contentDigest: digest,
  name: nonEmpty,
  scope: z.enum(['system', 'workspace_private']),
  workspaceId: nonEmpty.optional(),
  visualGrammar: z.object({
    visualFamilies: z.array(nonEmpty).min(1),
    shapeLanguage: z.array(nonEmpty).min(1),
    depthLanguage: z.array(nonEmpty).min(1),
  }).strict(),
  typographyGrammar: z.object({
    hierarchyRules: z.array(nonEmpty).min(1),
    typeTokenIds: z.array(nonEmpty).min(1),
    textMotionRules: z.array(nonEmpty).min(1),
  }).strict(),
  colorSemantics: z.object({
    paletteTokenIds: z.array(nonEmpty).min(1),
    accentRules: z.array(nonEmpty).min(1),
    contrastRules: z.array(nonEmpty).min(1),
  }).strict(),
  textureMaterialGrammar: z.object({
    materials: z.array(nonEmpty).min(1),
    textures: z.array(nonEmpty).min(1),
    grainRules: z.array(nonEmpty).min(1),
  }).strict(),
  compositionGrammar: z.object({
    hierarchyRules: z.array(nonEmpty).min(1),
    safeZoneRules: z.array(nonEmpty).min(1),
    densityRules: z.array(nonEmpty).min(1),
  }).strict(),
  cameraGrammar: z.object({
    allowedMoves: z.array(nonEmpty).min(1),
    lensLanguage: z.array(nonEmpty).min(1),
    focusRules: z.array(nonEmpty).min(1),
  }).strict(),
  motionGrammar: z.object({
    entrances: z.array(nonEmpty).min(1),
    exits: z.array(nonEmpty).min(1),
    emphasis: z.array(nonEmpty).min(1),
    easingTokenIds: z.array(nonEmpty).min(1),
  }).strict(),
  transitionGrammar: z.object({
    families: z.array(nonEmpty).min(1),
    continuityRules: z.array(nonEmpty).min(1),
  }).strict(),
  atmosphereGrammar: z.object({
    lightingRules: z.array(nonEmpty).min(1),
    environmentalRules: z.array(nonEmpty).min(1),
    emotionalQualities: z.array(nonEmpty).min(1),
  }).strict(),
  pacingCharacter: z.array(nonEmpty).min(1),
  soundDesignInfluence: z.array(nonEmpty).min(1),
  prohibitedCharacteristics: z.array(nonEmpty).min(1),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.scope === 'workspace_private' && !value.workspaceId) {
    context.addIssue({ code: 'custom', path: ['workspaceId'], message: 'Workspace-private languages require workspaceId.' })
  }
  if (value.scope === 'system' && value.workspaceId) {
    context.addIssue({ code: 'custom', path: ['workspaceId'], message: 'System languages must not carry workspaceId.' })
  }
})

export const motionStudioNarrativeFunctionDefinitionSchema = z.object({
  id: nonEmpty,
  version: nonEmpty,
  contentDigest: digest,
  name: nonEmpty,
  category: z.enum(['orientation', 'introduction', 'temporal', 'explanation', 'comparison', 'evidence', 'emotional', 'transition', 'resolution']),
  semanticPurpose: nonEmpty,
  inputEvidenceRequirements: z.array(nonEmpty).min(1),
  intendedViewerUnderstanding: z.array(nonEmpty).min(1),
  intendedEmotionalOutcome: z.array(nonEmpty),
  requiredEvidenceLevel: z.enum(['none', 'contextual', 'source_backed', 'source_exact']),
  supportedStoryBeatForms: z.array(nonEmpty).min(1),
  continuityExpectations: z.array(nonEmpty).min(1),
  completionCriteria: z.array(nonEmpty).min(1),
  truthAccuracyRequirements: z.array(nonEmpty).min(1),
  allowedVisualTreatmentFamilies: z.array(nonEmpty).min(1),
  pacingGuidance: z.array(nonEmpty).min(1),
  transitionGuidance: z.array(nonEmpty).min(1),
  textDataPrecision: z.enum(['representative', 'precise', 'source_exact']),
  disclosureRequirements: z.array(nonEmpty),
  failureRules: z.array(nonEmpty).min(1),
  fallbackRules: z.array(nonEmpty).min(1),
  providerRoutingAllowed: z.literal(false),
  toolExecutionAllowed: z.literal(false),
  immutable: z.literal(true),
}).strict()

export const motionStudioSceneRecipeInstantiationSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  sceneDocumentVersionId: nonEmpty,
  sceneId: nonEmpty,
  recipeVersion: motionStudioVersionReferenceSchema,
  recipeDefinitionVersion: nonEmpty,
  recipeDefinitionDigest: digest,
  recipeInputDigest: digest,
  motionLanguage: motionStudioMotionLanguageReferenceSchema,
  narrativeFunction: motionStudioNarrativeFunctionReferenceSchema,
  productionMode,
  inputArtifactDigests: z.array(digest).min(1),
  outputBindingIds: z.array(nonEmpty),
  approvalStatus: z.literal('approved'),
  immutable: z.literal(true),
}).strict()

export const motionStudioProductionRouteSchema = z.object({
  id: nonEmpty,
  mode: productionMode,
  capabilityIds: z.array(nonEmpty),
  requiredAssetIds: z.array(nonEmpty),
  deterministic: z.boolean(),
  providerNeutral: z.boolean(),
  approvalRequired: z.boolean(),
  costEstimateRequired: z.boolean(),
  rationale: nonEmpty,
  motionLanguage: motionStudioMotionLanguageReferenceSchema,
  narrativeFunction: motionStudioNarrativeFunctionReferenceSchema,
  sceneRecipeVersion: motionStudioVersionReferenceSchema,
  sceneRecipeDefinitionVersion: nonEmpty,
  sceneRecipeDefinitionDigest: digest,
}).strict()

export const motionStudioUploadedNarrationAuthoritySchema = z.object({
  authorityStatus: z.literal('verified_private_upload'),
  uploadIntentId: nonEmpty,
  mediaAssetId: nonEmpty,
  storageObjectRecordId: nonEmpty,
  authorityRevision: positiveSafeInteger,
  authorityChecksumSha256: digest,
  storageIdentityHash: digest,
  bindingHash: digest,
  mimeType: z.enum(['audio/wav', 'audio/mpeg', 'audio/mp3']),
  byteLength: z.number().int().positive().max(16 * 1024 * 1024).refine(Number.isSafeInteger),
  checksumSha256: digest,
  audioCodec: z.string().trim().min(1).max(80),
  sampleRateHertz: z.number().int().positive().max(384_000).refine(Number.isSafeInteger),
  channelCount: z.number().int().positive().max(8).refine(Number.isSafeInteger),
  durationMilliseconds: z.number().int().positive().max(60 * 60 * 1_000).refine(Number.isSafeInteger),
}).strict()

export const motionStudioVoiceBibleSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  providerCapability: z.enum(['speech_generation', 'uploaded_narration']),
  voiceProfileReference: nonEmpty.optional(),
  performanceDirection: z.array(nonEmpty).min(1),
  pronunciationDictionary: z.record(z.string(), z.string()),
  sceneTakeVersionIds: z.array(nonEmpty),
  alignmentArtifactVersionId: nonEmpty.optional(),
  aiVoiceDisclosureRequired: z.boolean(),
  cloningEnabled: z.literal(false),
  dubbingEnabled: z.literal(false),
  consentEvidenceId: nonEmpty.optional(),
  uploadedNarration: motionStudioUploadedNarrationAuthoritySchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.providerCapability === 'uploaded_narration' && !value.uploadedNarration) {
    context.addIssue({ code: 'custom', path: ['uploadedNarration'], message: 'Uploaded narration capability requires exact verified private upload authority.' })
  }
  if (value.providerCapability === 'speech_generation' && value.uploadedNarration) {
    context.addIssue({ code: 'custom', path: ['uploadedNarration'], message: 'Generated speech and uploaded narration authority cannot be mixed.' })
  }
  if (value.providerCapability === 'uploaded_narration' && value.aiVoiceDisclosureRequired) {
    context.addIssue({ code: 'custom', path: ['aiVoiceDisclosureRequired'], message: 'User-uploaded narration is not classified as generated AI voice.' })
  }
})

export const motionStudioMusicBibleSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  scoreMode: z.enum(['generated_score', 'uploaded_music', 'uploaded_stems', 'hybrid']),
  mood: z.array(nonEmpty).min(1),
  instrumentation: z.array(nonEmpty),
  vocalPolicy: z.enum(['instrumental_only', 'vocals_allowed_outside_speech']),
  speechSafetyRules: z.array(nonEmpty).min(1),
  rightsEvidenceIds: z.array(nonEmpty),
  sourceAssetVersionIds: z.array(nonEmpty),
}).strict()

export const motionStudioCueSheetSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  musicBibleVersion: motionStudioVersionReferenceSchema,
  items: z.array(z.object({
    id: nonEmpty,
    role: z.enum(['music', 'foley', 'ambience', 'exact_sfx', 'transition', 'ducking']),
    startTimingAnchorId: nonEmpty,
    endTimingAnchorId: nonEmpty,
    sourceAssetId: nonEmpty.optional(),
    generationCapability: nonEmpty.optional(),
    reason: nonEmpty,
  }).strict()),
}).strict()

export const motionStudioLayerPlanSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  sceneId: nonEmpty,
  layers: z.array(z.object({
    id: nonEmpty,
    layerType: z.enum([
      'source_footage', 'image', 'generated_video', 'text', 'caption',
      'map', 'chart', 'mask', 'audio', 'effect',
    ]),
    assetIds: z.array(nonEmpty),
    timing: z.object({ startAnchorId: nonEmpty, endAnchorId: nonEmpty }).strict(),
    zIndex: signedSafeInteger,
    relationshipIds: z.array(nonEmpty),
    extensions: z.array(motionStudioRegisteredExtensionSchema).max(64),
  }).strict()).min(1),
}).strict()

export const motionStudioSceneGraphSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  chapterIds: z.array(nonEmpty),
  chapters: z.array(z.object({
    id: nonEmpty,
    title: nonEmpty,
    purpose: nonEmpty,
    sceneIds: z.array(nonEmpty),
  }).strict()),
  scenes: z.array(z.object({
    id: nonEmpty,
    chapterId: nonEmpty,
    title: nonEmpty,
    semanticPurpose: nonEmpty,
    productionMode,
    timing: z.object({ startAnchorId: nonEmpty, endAnchorId: nonEmpty }).strict(),
    shotIds: z.array(nonEmpty),
    requiredAssetIds: z.array(nonEmpty),
    approvalStatus: z.enum(['draft', 'review_needed', 'approved', 'locked']),
  }).strict()),
  shots: z.array(z.object({
    id: nonEmpty,
    sceneId: nonEmpty,
    narrativePurpose: nonEmpty,
    timing: z.object({ startAnchorId: nonEmpty, endAnchorId: nonEmpty }).strict(),
    visualConcept: nonEmpty,
    productionRouteId: nonEmpty,
    assetIds: z.array(nonEmpty),
    referenceContractIds: z.array(nonEmpty),
    exactTextRequired: z.boolean(),
    exactDataRequired: z.boolean(),
    riskScore: z.number().finite().nonnegative(),
  }).strict()),
}).strict()

const motionStudioCommandOperationSchema = z.object({
  operationId: nonEmpty,
  kind: z.enum([
    'create_version', 'set_property', 'insert_item', 'remove_item', 'move_item',
    'replace_asset', 'set_timing_reference', 'lock_property',
    'release_property_lock', 'request_approval', 'invalidate_dependencies',
  ]),
  targetPath: nonEmpty,
  value: motionStudioJsonValueSchema.optional(),
  expectedValueDigest: digest.optional(),
}).strict()

export const motionStudioCommandEnvelopeSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactId: nonEmpty,
  baseVersionId: nonEmpty,
  baseVersionDigest: digest,
  idempotencyKey: nonEmpty,
  actor: actorReference,
  operations: z.array(motionStudioCommandOperationSchema).min(1),
  reason: nonEmpty,
  createdAt: nonEmpty,
}).strict()

export const motionStudioProviderRequestSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  jobId: nonEmpty,
  attemptId: nonEmpty,
  approvedSnapshotId: nonEmpty,
  internalCostBudgetId: nonEmpty,
  capability: z.enum([
    'image_generation', 'image_edit', 'video_generation', 'video_edit',
    'speech_generation', 'speech_alignment', 'music_generation',
    'synchronized_foley', 'deterministic_render',
  ]),
  inputArtifactVersions: z.array(motionStudioVersionReferenceSchema),
  outputArtifactKind: nonEmpty,
  capabilityConstraints: z.object({
    transportPolicy: z.enum(['disabled', 'loopback_protocol_simulator', 'owner_authorized_external']),
    networkAllowed: z.boolean(),
    requestedDurationFrames: positiveSafeInteger.optional(),
    referenceAssetIds: z.array(nonEmpty).max(512).optional(),
    outputProfileId: nonEmpty.optional(),
    extensions: z.array(motionStudioRegisteredExtensionSchema).max(64),
  }).strict(),
  idempotencyKey: nonEmpty,
  providerPreferencePolicyId: nonEmpty,
}).strict().superRefine((value, context) => {
  const policy = value.capabilityConstraints.transportPolicy
  const networkAllowed = value.capabilityConstraints.networkAllowed
  if ((policy === 'disabled' || policy === 'loopback_protocol_simulator') && networkAllowed) {
    context.addIssue({ code: 'custom', path: ['capabilityConstraints', 'networkAllowed'], message: 'Disabled and loopback-only provider requests cannot allow external network access.' })
  }
  if (policy === 'owner_authorized_external' && !networkAllowed) {
    context.addIssue({ code: 'custom', path: ['capabilityConstraints', 'networkAllowed'], message: 'An owner-authorized external request must explicitly declare backend network use.' })
  }
})

export const motionStudioProviderResultSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  requestId: nonEmpty,
  jobId: nonEmpty,
  attemptId: nonEmpty,
  capability: z.enum([
    'image_generation', 'image_edit', 'video_generation', 'video_edit',
    'speech_generation', 'speech_alignment', 'music_generation',
    'synchronized_foley', 'deterministic_render',
  ]),
  providerAdapterId: nonEmpty,
  providerModelVersion: nonEmpty,
  outputAssetIds: z.array(nonEmpty).min(1),
  usageEventIds: z.array(nonEmpty).min(1),
  provenance: z.object({
    providerRequestDigest: digest,
    inputArtifactVersionIds: z.array(nonEmpty),
    outputAssetIds: z.array(nonEmpty),
    extensions: z.array(motionStudioRegisteredExtensionSchema).max(64),
  }).strict(),
  safetySummary: z.object({
    status: z.enum(['passed', 'review_required', 'rejected']),
    policyIds: z.array(nonEmpty),
    findings: z.array(nonEmpty),
    extensions: z.array(motionStudioRegisteredExtensionSchema).max(64),
  }).strict(),
  completedAt: nonEmpty,
  rawProviderPayloadStored: z.literal(false),
}).strict()

export const providerRateCardSchema = z.object({
  id: nonEmpty,
  providerCapability: nonEmpty,
  providerAdapterId: nonEmpty,
  modelOrService: nonEmpty,
  version: nonEmpty,
  contentDigest: digest,
  currency: z.literal('USD'),
  effectiveFrom: nonEmpty,
  effectiveTo: nonEmpty.optional(),
  unit: costUnit,
  unitPriceMicros: safeInteger,
  minimumChargeMicros: safeInteger,
  roundingRule: nonEmpty,
  sourceReference: providerRateCardEvidenceRefSchema,
  verifiedAt: nonEmpty,
  immutable: z.literal(true),
}).strict() satisfies z.ZodType<ProviderRateCard>

export const toolCostProfileSchema = z.object({
  id: nonEmpty,
  toolId: nonEmpty,
  version: nonEmpty,
  contentDigest: digest,
  currency: z.literal('USD'),
  rates: z.array(z.object({
    unit: costUnit,
    unitPriceMicros: safeInteger,
  }).strict()).min(1),
  immutable: z.literal(true),
}).strict()

export const productionCostEstimateItemSchema = z.object({
  id: nonEmpty,
  workItemKey: nonEmpty,
  capabilityOrToolId: nonEmpty,
  rateCardVersionId: nonEmpty,
  quantity: z.number().nonnegative().finite(),
  unit: costUnit,
  lowInternalCostMicros: safeInteger,
  expectedInternalCostMicros: safeInteger,
  highInternalCostMicros: safeInteger,
  maximumAuthorizedInternalCostMicros: safeInteger,
  retryAllowanceCount: safeInteger,
  assumptions: z.array(nonEmpty).min(1),
}).strict()

export const productionCostEstimateSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  sceneId: nonEmpty.optional(),
  shotId: nonEmpty.optional(),
  currency: z.literal('USD'),
  lowInternalCostMicros: safeInteger,
  expectedInternalCostMicros: safeInteger,
  highInternalCostMicros: safeInteger,
  maximumAuthorizedInternalCostMicros: safeInteger,
  itemIds: z.array(nonEmpty).min(1),
  rateCardVersionIds: z.array(nonEmpty).min(1),
  expiresAt: nonEmpty,
  status: z.enum(['draft', 'reviewed', 'authorized', 'expired', 'superseded', 'cancelled']),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
}).strict()

export const productionCostBudgetSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  estimateId: nonEmpty,
  approvedSnapshotId: nonEmpty,
  maximumAuthorizedInternalCostMicros: safeInteger,
  incurredInternalCostMicros: safeInteger,
  releasedInternalCostMicros: safeInteger,
  status: z.enum(['authorized', 'incurring', 'paused', 'released', 'exhausted', 'cancelled']),
}).strict()

export const productionUsageEventSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  sceneId: nonEmpty.optional(),
  shotId: nonEmpty.optional(),
  skillId: z.string().optional(),
  toolOrCapabilityId: nonEmpty,
  jobId: nonEmpty,
  attemptId: nonEmpty,
  costBudgetId: nonEmpty,
  costEstimateItemId: nonEmpty,
  retryNumber: safeInteger,
  outputAssetId: nonEmpty.optional(),
  rateCardVersionId: nonEmpty,
  unit: costUnit,
  quantity: z.number().nonnegative().finite(),
  internalCostMicros: safeInteger,
  evidenceClass: z.enum(['estimated', 'provider_reported', 'infrastructure_metered', 'invoice_reconciled', 'manually_adjusted']),
  outcome: z.enum(['completed', 'failed', 'cancelled', 'rejected']),
  failureCategory: z.string().optional(),
  evidenceDigest: digest,
  createdAt: nonEmpty,
  extensions: z.array(motionStudioRegisteredExtensionSchema).max(64).readonly().optional(),
}).strict() satisfies z.ZodType<ProductionUsageEvent>

export const productionCostActualSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  usageEventIds: z.array(nonEmpty).min(1),
  provisionalInternalCostMicros: safeInteger,
  reconciledInternalCostMicros: safeInteger.optional(),
  status: z.enum(['provisional', 'reconciled', 'adjusted', 'disputed']),
  currency: z.literal('USD'),
}).strict()

export const productionCostReconciliationSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  actualCostId: nonEmpty,
  providerInvoiceReference: costReconciliationEvidenceRefSchema,
  previousInternalCostMicros: safeInteger,
  reconciledInternalCostMicros: safeInteger,
  evidenceDigest: digest,
  reconciledAt: nonEmpty,
}).strict() satisfies z.ZodType<ProductionCostReconciliation>

export const productionCostAdjustmentSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  actualCostId: nonEmpty,
  direction: z.enum(['increase', 'decrease']),
  amountInternalCostMicros: safeInteger,
  reason: nonEmpty,
  evidenceDigest: digest,
  adjustedAt: nonEmpty,
}).strict()

const motionStudioStoryboardPanelSchema = z.object({
  id: nonEmpty,
  order: safeInteger,
  chapterId: nonEmpty,
  sceneId: nonEmpty,
  sceneDocument: motionStudioVersionReferenceSchema,
  timelineProposalId: nonEmpty,
  timelineProposalOutputDigest: digest,
  narrationSegmentIds: z.array(nonEmpty).min(1).max(40),
  startFrame: safeInteger,
  endFrame: positiveSafeInteger,
  title: z.string().trim().min(1).max(240),
  visualDescription: z.string().trim().min(1).max(2_000),
  storyContinuity: storytellingSceneContinuitySliceSchema.optional(),
  visualTreatment: z.literal('deterministic_placeholder'),
  finalAssetEligible: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.storyContinuity?.sceneId !== undefined && value.storyContinuity.sceneId !== value.sceneId) {
    context.addIssue({ code: 'custom', path: ['storyContinuity'], message: 'Storyboard continuity changed the exact panel scene.' })
  }
})

const motionStudioAnimaticSceneBindingSchema = z.object({
  order: safeInteger,
  sceneId: nonEmpty,
  storyboardPanelId: nonEmpty,
  sceneDocument: motionStudioVersionReferenceSchema,
  timelineProposalId: nonEmpty,
  timelineProposalOutputDigest: digest,
  narrationSegmentIds: z.array(nonEmpty).min(1).max(40),
  startFrame: safeInteger,
  endFrame: positiveSafeInteger,
  storyContinuity: storytellingSceneContinuitySliceSchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.storyContinuity?.sceneId !== undefined && value.storyContinuity.sceneId !== value.sceneId) {
    context.addIssue({ code: 'custom', path: ['storyContinuity'], message: 'Animatic continuity changed the exact scene binding.' })
  }
})

const previewOnlyPlaceholderPolicySchema = z.object({
  previewOnly: z.literal(true),
  finalRenderAllowed: z.literal(false),
  userVisibleDisclosure: z.string().trim().min(1).max(500),
}).strict()

function validateExactAnimaticRanges(
  ranges: readonly { order: number; sceneId: string; startFrame: number; endFrame: number }[],
  durationFrames: number,
  context: z.RefinementCtx,
  path: 'panels' | 'orderedScenes',
): void {
  const sceneIds = new Set<string>()
  let nextFrame = 0
  ranges.forEach((range, index) => {
    if (range.order !== index) context.addIssue({ code: 'custom', path: [path, index, 'order'], message: 'Scene order must be contiguous and zero-based.' })
    if (sceneIds.has(range.sceneId)) context.addIssue({ code: 'custom', path: [path, index, 'sceneId'], message: 'Scene IDs must be unique within one animatic.' })
    sceneIds.add(range.sceneId)
    if (range.startFrame !== nextFrame) context.addIssue({ code: 'custom', path: [path, index, 'startFrame'], message: 'Animatic scenes must be gap-free and non-overlapping.' })
    if (range.endFrame <= range.startFrame) context.addIssue({ code: 'custom', path: [path, index, 'endFrame'], message: 'Animatic scenes require positive frame duration.' })
    nextFrame = range.endFrame
  })
  if (nextFrame !== durationFrames) context.addIssue({ code: 'custom', path: [path], message: 'Animatic scenes must cover the exact MasterTimingPlan frame range.' })
}

function validateStoryContinuitySequence(
  scenes: readonly { sceneId: string; storyContinuity?: StorytellingSceneContinuitySlice }[],
  context: z.RefinementCtx,
  path: 'panels' | 'orderedScenes',
  authority: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    preparedScriptVersion: MotionStudioVersionReference
  },
): void {
  const continuity = scenes.filter((scene) => scene.storyContinuity !== undefined)
  if (continuity.length === 0) return
  if (continuity.length !== scenes.length) {
    context.addIssue({ code: 'custom', path: [path], message: 'A continuity-bound story cannot mix bound and unbound scenes.' })
    return
  }
  const first = scenes[0]!.storyContinuity!
  scenes.forEach((scene, index) => {
    const current = scene.storyContinuity!
    if (current.workspaceId !== authority.workspaceId ||
        current.projectId !== authority.projectId ||
        current.editSessionId !== authority.editSessionId ||
        current.productionId !== authority.productionId ||
        JSON.stringify(current.sourcePreparedScriptVersion) !== JSON.stringify(authority.preparedScriptVersion)) {
      context.addIssue({ code: 'custom', path: [path, index, 'storyContinuity'], message: 'Story continuity changed the exact workspace, project, edit, production, or Prepared Script authority.' })
    }
    if (current.sourceGrammarDigest !== first.sourceGrammarDigest ||
        JSON.stringify(current.sourceMotionDnaVersion) !== JSON.stringify(first.sourceMotionDnaVersion) ||
        JSON.stringify(current.sourcePreparedScriptVersion) !== JSON.stringify(first.sourcePreparedScriptVersion)) {
      context.addIssue({ code: 'custom', path: [path, index, 'storyContinuity'], message: 'Story continuity sequence changed its exact grammar, Motion DNA, or Prepared Script authority.' })
    }
    if (index === 0) return
    const previous = scenes[index - 1]!.storyContinuity!
    const outgoingId = previous.outgoingTransition?.id
    const incomingId = current.incomingTransition?.id
    if (outgoingId !== incomingId) {
      context.addIssue({ code: 'custom', path: [path, index, 'storyContinuity', 'incomingTransition'], message: 'Adjacent story continuity transitions do not reconcile.' })
    }
  })
}

export const motionStudioStoryboardSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactType: z.literal('storyboard'),
  approvedSnapshotId: nonEmpty,
  preparedScriptVersion: motionStudioVersionReferenceSchema,
  voiceBibleVersion: motionStudioVersionReferenceSchema,
  timingAuthority: motionStudioTimingAuthoritySchema,
  panels: z.array(motionStudioStoryboardPanelSchema).min(1).max(8),
  placeholderPolicy: previewOnlyPlaceholderPolicySchema,
  status: z.literal('review_needed'),
  notes: z.array(z.string().trim().min(1).max(2_000)).max(64),
}).strict().superRefine((value, context) => {
  validateExactAnimaticRanges(value.panels, value.timingAuthority.durationFrames, context, 'panels')
  validateStoryContinuitySequence(value.panels, context, 'panels', value)
  const panelIds = new Set<string>()
  value.panels.forEach((panel, index) => {
    if (panelIds.has(panel.id)) context.addIssue({ code: 'custom', path: ['panels', index, 'id'], message: 'Storyboard panel IDs must be unique.' })
    panelIds.add(panel.id)
  })
})

export const motionStudioAnimaticPlanSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactType: z.literal('animatic'),
  approvedSnapshotId: nonEmpty,
  preparedScriptVersion: motionStudioVersionReferenceSchema,
  voiceBibleVersion: motionStudioVersionReferenceSchema,
  storyboardVersion: motionStudioVersionReferenceSchema,
  timingAuthority: motionStudioTimingAuthoritySchema,
  narrationAuthorityDigest: digest,
  registeredProfileId: z.literal('motion_studio_prepared_script_animatic_v1'),
  orderedScenes: z.array(motionStudioAnimaticSceneBindingSchema).min(1).max(8),
  placeholderPolicy: previewOnlyPlaceholderPolicySchema,
  status: z.literal('review_needed'),
  privateReviewOnly: z.literal(true),
  finalAssetEligible: z.literal(false),
  notes: z.array(z.string().trim().min(1).max(2_000)).max(64),
}).strict().superRefine((value, context) => {
  validateExactAnimaticRanges(value.orderedScenes, value.timingAuthority.durationFrames, context, 'orderedScenes')
  validateStoryContinuitySequence(value.orderedScenes, context, 'orderedScenes', value)
  const panelIds = new Set<string>()
  value.orderedScenes.forEach((scene, index) => {
    if (panelIds.has(scene.storyboardPanelId)) context.addIssue({ code: 'custom', path: ['orderedScenes', index, 'storyboardPanelId'], message: 'Animatic storyboard panel bindings must be unique.' })
    panelIds.add(scene.storyboardPanelId)
  })
})

export const motionStudioExportManifestSchema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  approvedSnapshotId: nonEmpty,
  fineCutVersion: motionStudioVersionReferenceSchema,
  qualityReportVersion: motionStudioVersionReferenceSchema,
  timelineManifestId: nonEmpty,
  renderManifestId: nonEmpty,
  existingExportRecordId: nonEmpty,
  outputAssetIds: z.array(nonEmpty),
  provenanceRecordIds: z.array(nonEmpty),
  internalCostActualId: nonEmpty,
  status: z.enum(['planned', 'qa_blocked', 'ready_for_existing_export_system', 'completed', 'failed']),
  createdAt: nonEmpty,
}).strict()

function motionStudioReviewArtifactSchema(
  artifactType: 'sound_event_plan' | 'storyboard' | 'animatic' | 'fine_cut' | 'quality_report',
): z.ZodTypeAny {
  return motionStudioOwnershipSchema.extend({
    id: nonEmpty,
    productionId: nonEmpty,
    artifactType: z.literal(artifactType),
    sourceArtifactVersions: z.array(motionStudioVersionReferenceSchema),
    assetReferences: z.array(nonEmpty),
    status: z.enum(['draft', 'review_needed', 'approved', 'locked', 'blocked']),
    notes: z.array(nonEmpty),
    extensions: z.array(motionStudioRegisteredExtensionSchema).max(64),
  }).strict()
}

const motionStudioLiveHumanAssessmentsSchema = z.object({
  intentAlignment: z.enum(['passed', 'failed']),
  referenceAdherence: z.enum(['passed', 'failed']),
  continuity: z.enum(['passed', 'failed']),
  visibleArtifacts: z.enum(['passed', 'failed']),
  safety: z.enum(['passed', 'failed']),
}).strict()

export const motionStudioLiveCandidateReviewInputSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionCategory: z.enum([
    'reference_adherence', 'continuity', 'visual_artifact', 'intent_alignment', 'safety',
  ]).optional(),
  assessments: motionStudioLiveHumanAssessmentsSchema,
  notes: z.array(z.string().trim().min(1).max(500)).max(8).readonly(),
}).strict().superRefine((value, context) => {
  const failed = Object.values(value.assessments).some((assessment) => assessment === 'failed')
  if (value.decision === 'approved' && (failed || value.rejectionCategory)) {
    context.addIssue({ code: 'custom', path: ['decision'], message: 'Approval requires every explicit human assessment to pass.' })
  }
  if (value.decision === 'rejected' && (!failed || !value.rejectionCategory)) {
    context.addIssue({ code: 'custom', path: ['rejectionCategory'], message: 'Rejection requires a failed assessment and matching category.' })
  }
  const categoryAssessment = value.rejectionCategory === 'reference_adherence'
    ? value.assessments.referenceAdherence
    : value.rejectionCategory === 'continuity'
      ? value.assessments.continuity
      : value.rejectionCategory === 'visual_artifact'
        ? value.assessments.visibleArtifacts
        : value.rejectionCategory === 'intent_alignment'
          ? value.assessments.intentAlignment
          : value.rejectionCategory === 'safety'
            ? value.assessments.safety
            : undefined
  if (value.decision === 'rejected' && categoryAssessment !== 'failed') {
    context.addIssue({ code: 'custom', path: ['rejectionCategory'], message: 'The rejection category must identify a failed assessment.' })
  }
})

export const motionStudioLiveCandidateQualityReportV1Schema = motionStudioOwnershipSchema.extend({
  id: nonEmpty,
  productionId: nonEmpty,
  artifactType: z.literal('quality_report'),
  reportType: z.literal('live_generation_candidate_review'),
  approvedSnapshotId: nonEmpty,
  candidateId: nonEmpty,
  operationKind: z.enum([
    'gpt_image_generation', 'gpt_image_edit', 'wan_image_to_video', 'hailuo_image_to_video_fallback',
  ]),
  jobId: nonEmpty,
  jobAttemptId: nonEmpty,
  mediaAssetId: nonEmpty,
  mediaAssetVersionId: nonEmpty,
  mediaSha256: digest,
  technicalQaEvidenceDigest: digest,
  technicallyComplete: z.literal(true),
  automatedSafetyStatus: z.enum(['passed', 'review_required']),
  humanReview: motionStudioLiveCandidateReviewInputSchema,
  reviewedBy: nonEmpty,
  reviewedAt: nonEmpty,
  sourceArtifactVersions: z.array(motionStudioVersionReferenceSchema).max(8).readonly(),
  assetReferences: z.array(nonEmpty).min(1).max(8).readonly(),
  status: z.enum(['approved', 'blocked']),
  notes: z.array(nonEmpty.max(500)).max(16).readonly(),
  extensions: z.array(motionStudioRegisteredExtensionSchema).length(0).readonly(),
}).strict().superRefine((value, context) => {
  if (value.humanReview.decision === 'approved' && value.status !== 'approved') {
    context.addIssue({ code: 'custom', path: ['status'], message: 'An approved human review requires approved report status.' })
  }
  if (value.humanReview.decision === 'rejected' && value.status !== 'blocked') {
    context.addIssue({ code: 'custom', path: ['status'], message: 'A rejected human review requires blocked report status.' })
  }
  if (value.automatedSafetyStatus !== 'passed' && value.humanReview.decision === 'approved') {
    context.addIssue({ code: 'custom', path: ['automatedSafetyStatus'], message: 'Automated safety review must pass before approval.' })
  }
  if (!value.assetReferences.includes(value.mediaAssetVersionId)) {
    context.addIssue({ code: 'custom', path: ['assetReferences'], message: 'Quality evidence must bind the exact candidate media version.' })
  }
})

export function motionStudioArtifactDataSchemaForKind(kind: typeof MOTION_STUDIO_ARTIFACT_KINDS[number]): z.ZodTypeAny {
  const schemas: Record<typeof MOTION_STUDIO_ARTIFACT_KINDS[number], z.ZodTypeAny> = {
    production_brief: motionStudioProductionBriefSchema,
    story_bible: motionStudioStoryBibleSchema,
    prepared_script: motionStudioPreparedScriptSchema,
    research_pack: motionStudioResearchPackSchema,
    claim_ledger: motionStudioClaimLedgerSchema,
    visual_coverage_plan: motionStudioVisualCoveragePlanSchema,
    reference_contract: motionStudioReferenceContractSchema,
    motion_dna: motionStudioMotionDnaSchema,
    motion_language: motionStudioMotionLanguageDefinitionSchema,
    narrative_function: motionStudioNarrativeFunctionDefinitionSchema,
    motion_strategy: motionStudioMotionStrategySchema,
    voice_bible: motionStudioVoiceBibleSchema,
    music_bible: motionStudioMusicBibleSchema,
    cue_sheet: motionStudioCueSheetSchema,
    scene_graph: motionStudioSceneGraphSchema,
    scene_recipe: motionStudioSceneRecipeSchema,
    layer_plan: motionStudioLayerPlanSchema,
    scene_document: motionStudioSceneDocumentSchema,
    sound_event_plan: motionStudioReviewArtifactSchema('sound_event_plan'),
    storyboard: motionStudioStoryboardSchema,
    animatic: motionStudioAnimaticPlanSchema,
    fine_cut: motionStudioReviewArtifactSchema('fine_cut'),
    quality_report: z.union([
      motionStudioReviewArtifactSchema('quality_report'),
      motionStudioLiveCandidateQualityReportV1Schema,
    ]),
    export_manifest: motionStudioExportManifestSchema,
  }
  return schemas[kind]
}
