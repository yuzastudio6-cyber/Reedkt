import { z } from 'zod'

import type {
  MotionStudioResearchChronologyEventV1,
  MotionStudioResearchClaimV2,
  MotionStudioResearchEvidenceFragmentV2,
  MotionStudioResearchReviewEventV1,
  MotionStudioResearchSourceVersionV2,
  MotionStudioResearchWorkspaceDto,
  MotionStudioTechniqueBlueprintV1,
  MotionStudioVisualAssetCandidateV1,
  MotionStudioVisualNeedV2,
} from '../../../types/motion-studio'
import { validateMotionStudioDeepValue } from './safe-values'
import { motionStudioOwnershipSchema, motionStudioVersionReferenceSchema } from './schemas'

const nonEmpty = z.string().trim().min(1)
const boundedText = z.string().trim().min(1).max(2_000)
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const uuid = z.string().uuid()
const isoDate = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)

const sourceKind = z.enum([
  'user_upload', 'web_page', 'official_record', 'archive', 'interview',
  'dataset', 'tutorial_video', 'reference_production', 'user_assertion',
])
const trustStatus = z.enum(['unreviewed', 'reviewed', 'authoritative', 'disputed', 'rejected'])
const rightsStatus = z.enum(['unknown', 'user_authorized', 'licensed', 'public_domain', 'restricted', 'expired'])
const authenticityClass = z.enum([
  'authentic_archive', 'licensed_stock', 'user_supplied', 'official_document',
  'representative_footage', 'deterministic_illustration', 'ai_reconstruction', 'unknown',
])
const researchRelationship = z.enum(['primary', 'secondary', 'official', 'commentary', 'user_asserted', 'unknown'])
const reviewStatus = z.enum(['draft', 'needs_evidence', 'needs_review', 'approved', 'rejected', 'superseded'])
const evidenceRelationship = z.enum(['supports', 'contradicts', 'context_only', 'background'])
const claimClassification = z.enum([
  'verified_fact', 'widely_reported', 'reported_allegation', 'disputed_claim',
  'director_inference', 'creative_reconstruction', 'speculation', 'fiction',
])
const visualNeedKind = z.enum([
  'location', 'person', 'chronology', 'process', 'comparison', 'evidence',
  'data', 'quote', 'transition', 'atmosphere',
])
const visualTreatment = z.enum([
  'authentic_archive', 'user_or_licensed_media', 'representative_footage',
  'deterministic_graphic', 'deterministic_map_chart_document', 'illustration',
  'labeled_ai_reconstruction', 'layered_motion', 'generated_motion',
])

const researchPublicUrlDeepError = '$.locator.canonicalUrl: Absolute URLs must use a SourceLocator.'

function researchDeepSafetyErrors(
  contract: MotionStudioResearchContractName,
  value: unknown,
): string[] {
  const errors = validateMotionStudioDeepValue(value).errors
  if (contract !== 'source_version' || !isValidResearchPublicHttpsLocator(value)) return errors
  return errors.filter((error) => error !== researchPublicUrlDeepError)
}

function appendResearchDeepSafetyIssues(
  contract: MotionStudioResearchContractName,
  value: unknown,
  context: z.RefinementCtx,
): void {
  for (const error of researchDeepSafetyErrors(contract, value)) {
    context.addIssue({ code: 'custom', message: error })
  }
}

function isValidResearchPublicHttpsLocator(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const locator = (value as { locator?: unknown }).locator
  if (!locator || typeof locator !== 'object' || Array.isArray(locator)) return false
  const candidate = locator as { locatorType?: unknown; canonicalUrl?: unknown }
  return candidate.locatorType === 'public_https' &&
    typeof candidate.canonicalUrl === 'string' &&
    publicHttpsUrlError(candidate.canonicalUrl) === undefined
}

const rightsProfileSchema = z.object({
  status: rightsStatus,
  reviewStatus: z.enum(['unreviewed', 'reviewed', 'blocked']),
  evidenceIds: z.array(nonEmpty).max(128).readonly(),
  permittedUses: z.array(boundedText).max(64).readonly(),
  restrictions: z.array(boundedText).max(64).readonly(),
  territories: z.array(nonEmpty.max(120)).max(64).readonly(),
  expiresAt: isoDate.optional(),
}).strict().superRefine((value, context) => {
  if (['restricted', 'expired'].includes(value.status) && value.reviewStatus !== 'blocked') {
    context.addIssue({ code: 'custom', path: ['reviewStatus'], message: 'Restricted or expired rights must be blocked.' })
  }
  if (['licensed', 'public_domain', 'user_authorized'].includes(value.status) && value.reviewStatus === 'reviewed' && value.evidenceIds.length === 0) {
    context.addIssue({ code: 'custom', path: ['evidenceIds'], message: 'Reviewed usable rights require durable evidence.' })
  }
})

const publicHttpsLocatorSchema = z.object({
  locatorType: z.literal('public_https'),
  canonicalUrl: z.string().url().max(4_096).superRefine((value, context) => {
    const error = publicHttpsUrlError(value)
    if (error) context.addIssue({ code: 'custom', message: error })
  }),
  canonicalUrlHash: digest,
  displayHost: nonEmpty.max(253),
}).strict().superRefine((value, context) => {
  try {
    if (new URL(value.canonicalUrl).hostname.toLowerCase() !== value.displayHost.toLowerCase()) {
      context.addIssue({ code: 'custom', path: ['displayHost'], message: 'Display host must match the canonical locator host.' })
    }
  } catch {
    // The URL field emits the primary validation error.
  }
})

const sourceLocatorSchema = z.discriminatedUnion('locatorType', [
  publicHttpsLocatorSchema,
  z.object({
    locatorType: z.literal('private_asset_version'),
    assetId: uuid,
    assetVersionId: uuid,
    contentDigest: digest,
  }).strict(),
  z.object({ locatorType: z.literal('fixture'), fixtureId: nonEmpty.max(240), fixtureDigest: digest }).strict(),
  z.object({ locatorType: z.literal('user_assertion'), assertionId: uuid }).strict(),
])

export const motionStudioResearchSourceVersionV2Schema: z.ZodType<MotionStudioResearchSourceVersionV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.research-source-version.v2'),
    moduleId: z.literal('storytelling'),
    moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
    stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
    productionId: uuid,
    sourceId: uuid,
    sourceVersionId: uuid,
    sourceVersionNumber: positiveSafeInteger,
    sourceKind,
    retrievalMethod: z.enum(['fixture', 'private_upload', 'authorized_https_capture']),
    locator: sourceLocatorSchema,
    title: nonEmpty.max(500),
    creatorOrPublisher: nonEmpty.max(500).optional(),
    publishedAt: isoDate.optional(),
    accessedAt: isoDate,
    language: nonEmpty.max(120).optional(),
    contentDigest: digest,
    trustStatus,
    trustRationale: boundedText,
    rights: rightsProfileSchema,
    authenticityClass,
    relationship: researchRelationship,
    promptInjection: z.object({
      status: z.enum(['not_detected', 'detected', 'needs_review']),
      findings: z.array(boundedText).max(64).readonly(),
    }).strict(),
    privacyClass: z.enum(['standard', 'sensitive', 'restricted']),
    retentionClass: z.enum(['project_lifetime', 'review_window', 'legal_hold']),
    sourceContentExecutable: z.literal(false),
    canApproveWork: z.literal(false),
    canAuthorizeSpend: z.literal(false),
    supersedesSourceVersionId: uuid.optional(),
    tombstonedAt: isoDate.optional(),
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    const expectedLocator = value.retrievalMethod === 'fixture'
      ? 'fixture'
      : value.retrievalMethod === 'private_upload'
        ? 'private_asset_version'
        : 'public_https'
    if (value.locator.locatorType !== expectedLocator) {
      context.addIssue({ code: 'custom', path: ['locator'], message: 'Retrieval method and locator authority must match.' })
    }
    if (value.promptInjection.status === 'detected' && value.promptInjection.findings.length === 0) {
      context.addIssue({ code: 'custom', path: ['promptInjection', 'findings'], message: 'Detected prompt injection requires a finding.' })
    }
    if (value.sourceVersionId === value.supersedesSourceVersionId) {
      context.addIssue({ code: 'custom', path: ['supersedesSourceVersionId'], message: 'A source version cannot supersede itself.' })
    }
  }).superRefine((value, context) => appendResearchDeepSafetyIssues('source_version', value, context))

const evidenceLocatorSchema = z.discriminatedUnion('locatorType', [
  z.object({ locatorType: z.literal('page'), pageNumber: positiveSafeInteger }).strict(),
  z.object({ locatorType: z.literal('timestamp'), startMilliseconds: safeInteger, endMilliseconds: positiveSafeInteger }).strict()
    .refine((value) => value.endMilliseconds > value.startMilliseconds, { message: 'Timestamp locator requires a positive range.', path: ['endMilliseconds'] }),
  z.object({ locatorType: z.literal('paragraph'), paragraphNumber: positiveSafeInteger }).strict(),
  z.object({ locatorType: z.literal('table_cell'), tableId: nonEmpty.max(240), row: safeInteger, column: safeInteger }).strict(),
  z.object({ locatorType: z.literal('frame'), frameNumber: safeInteger }).strict(),
  z.object({ locatorType: z.literal('dataset_row'), datasetId: nonEmpty.max(240), rowKey: nonEmpty.max(500) }).strict(),
  z.object({ locatorType: z.literal('user_assertion'), assertionId: uuid }).strict(),
])

export const motionStudioResearchEvidenceFragmentV2Schema: z.ZodType<MotionStudioResearchEvidenceFragmentV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.research-evidence-fragment.v2'),
    productionId: uuid,
    evidenceFragmentId: uuid,
    sourceId: uuid,
    sourceVersionId: uuid,
    locator: evidenceLocatorSchema,
    normalizedParaphrase: boundedText,
    copyrightSafeExcerpt: z.string().trim().min(1).max(240).optional(),
    contentDigest: digest,
    relationship: evidenceRelationship,
    extraction: z.object({
      method: z.enum(['fixture', 'human', 'ocr', 'transcription', 'structured_parse']),
      skillRunId: nonEmpty.max(240).optional(),
      toolRunId: nonEmpty.max(240).optional(),
      confidence: z.enum(['low', 'medium', 'high']),
    }).strict(),
    reviewStatus: z.enum(['unreviewed', 'reviewed', 'rejected']),
    qualityWarnings: z.array(boundedText).max(64).readonly(),
    sourceContentExecutable: z.literal(false),
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    if (value.extraction.method !== 'fixture' && !value.extraction.skillRunId && !value.extraction.toolRunId) {
      context.addIssue({ code: 'custom', path: ['extraction'], message: 'Non-fixture extraction requires skill or tool lineage.' })
    }
    if (value.reviewStatus === 'reviewed' && value.extraction.confidence === 'low' && value.qualityWarnings.length === 0) {
      context.addIssue({ code: 'custom', path: ['qualityWarnings'], message: 'Reviewed low-confidence evidence requires a warning.' })
    }
  }).superRefine((value, context) => appendResearchDeepSafetyIssues('evidence_fragment', value, context))

const claimEvidenceLinkSchema = z.object({
  evidenceFragmentId: uuid,
  relationship: evidenceRelationship,
  weight: z.enum(['corroborating', 'primary', 'material_contradiction', 'contextual']),
}).strict().superRefine((value, context) => {
  if (value.weight === 'material_contradiction' && value.relationship !== 'contradicts') {
    context.addIssue({ code: 'custom', path: ['relationship'], message: 'Material contradiction weight requires contradicting evidence.' })
  }
  if (value.weight === 'contextual' && !['context_only', 'background'].includes(value.relationship)) {
    context.addIssue({ code: 'custom', path: ['relationship'], message: 'Contextual weight cannot count as support.' })
  }
})

const downstreamReferencesSchema = z.object({
  scriptArtifactVersionIds: z.array(uuid).max(128).readonly(),
  narrationSegmentIds: z.array(nonEmpty).max(256).readonly(),
  sceneIds: z.array(nonEmpty).max(256).readonly(),
  shotIds: z.array(nonEmpty).max(512).readonly(),
  visualNeedIds: z.array(uuid).max(256).readonly(),
  finalUseIds: z.array(nonEmpty).max(512).readonly(),
}).strict()

export const motionStudioResearchClaimV2Schema: z.ZodType<MotionStudioResearchClaimV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.research-claim.v2'),
    productionId: uuid,
    claimId: uuid,
    claimLedgerArtifactVersion: motionStudioVersionReferenceSchema,
    claimText: boundedText,
    classification: claimClassification,
    evidenceLinks: z.array(claimEvidenceLinkSchema).max(256).readonly(),
    namedAttributionRequired: z.boolean(),
    namedAttribution: nonEmpty.max(500).optional(),
    confidence: z.enum(['low', 'medium', 'high']),
    confidenceRationale: boundedText,
    materiality: z.enum(['background', 'supporting', 'material']),
    alternativeInterpretations: z.array(boundedText).max(64).readonly(),
    realPersonRisk: z.enum(['none', 'caution', 'high']),
    legalReviewRequired: z.boolean(),
    disclosureRequired: z.boolean(),
    disclosureText: boundedText.optional(),
    safeWording: boundedText,
    downstreamReferences: downstreamReferencesSchema,
    status: reviewStatus,
    reviewedBy: uuid.optional(),
    reviewedAt: isoDate.optional(),
    approvedArtifactVersionId: uuid.optional(),
    approvedArtifactDigest: digest.optional(),
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    const support = value.evidenceLinks.filter((link) => link.relationship === 'supports')
    const contradiction = value.evidenceLinks.some((link) => link.weight === 'material_contradiction')
    const requiresSupport = ['verified_fact', 'widely_reported', 'reported_allegation', 'disputed_claim'].includes(value.classification)
    if (requiresSupport && support.length === 0) {
      context.addIssue({ code: 'custom', path: ['evidenceLinks'], message: 'This factual classification requires supporting evidence.' })
    }
    if (value.classification === 'verified_fact' && contradiction) {
      context.addIssue({ code: 'custom', path: ['classification'], message: 'A materially contradicted claim cannot be classified as verified fact.' })
    }
    if (value.namedAttributionRequired && !value.namedAttribution) {
      context.addIssue({ code: 'custom', path: ['namedAttribution'], message: 'Required attribution must be explicit.' })
    }
    const disclosureClassification = ['reported_allegation', 'disputed_claim', 'director_inference', 'creative_reconstruction', 'speculation']
    if (disclosureClassification.includes(value.classification) && (!value.disclosureRequired || !value.disclosureText)) {
      context.addIssue({ code: 'custom', path: ['disclosureText'], message: 'This classification requires a durable disclosure.' })
    }
    if (value.status === 'approved') {
      if (!value.reviewedBy || !value.reviewedAt || !value.approvedArtifactVersionId || !value.approvedArtifactDigest) {
        context.addIssue({ code: 'custom', path: ['status'], message: 'Approved claims require exact reviewer and approved artifact authority.' })
      }
      if (value.materiality === 'material' && (support.length === 0 || contradiction)) {
        context.addIssue({ code: 'custom', path: ['status'], message: 'A material claim cannot be approved without support or with unresolved contradiction.' })
      }
      if (value.status === 'approved' && value.disclosureRequired && !value.disclosureText) {
        context.addIssue({ code: 'custom', path: ['disclosureText'], message: 'Approval cannot omit a required disclosure.' })
      }
    } else if (value.approvedArtifactVersionId || value.approvedArtifactDigest) {
      context.addIssue({ code: 'custom', path: ['approvedArtifactVersionId'], message: 'Only approved claims may carry approved artifact authority.' })
    }
  }).superRefine((value, context) => appendResearchDeepSafetyIssues('claim', value, context))

export const motionStudioResearchChronologyEventV1Schema: z.ZodType<MotionStudioResearchChronologyEventV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.research-chronology-event.v1'),
    productionId: uuid,
    chronologyEventId: uuid,
    title: nonEmpty.max(500),
    description: boundedText,
    timePrecision: z.enum(['exact', 'day', 'month', 'year', 'range', 'unknown']),
    startAt: isoDate.optional(),
    endAt: isoDate.optional(),
    eraLabel: nonEmpty.max(120).optional(),
    timezone: nonEmpty.max(120).optional(),
    participantIds: z.array(nonEmpty).max(128).readonly(),
    placeIds: z.array(nonEmpty).max(128).readonly(),
    evidenceFragmentIds: z.array(uuid).max(256).readonly(),
    uncertainty: z.array(boundedText).max(64).readonly(),
    contradictionStatus: z.enum(['none', 'unresolved', 'resolved_with_disclosure']),
    reviewStatus,
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    if (value.timePrecision === 'unknown' && (value.startAt || value.endAt)) {
      context.addIssue({ code: 'custom', path: ['timePrecision'], message: 'Unknown chronology cannot invent a timestamp.' })
    }
    if (value.timePrecision !== 'unknown' && !value.startAt) {
      context.addIssue({ code: 'custom', path: ['startAt'], message: 'Known chronology requires a start time.' })
    }
    if (value.startAt && value.endAt && Date.parse(value.endAt) < Date.parse(value.startAt)) {
      context.addIssue({ code: 'custom', path: ['endAt'], message: 'Chronology end cannot precede its start.' })
    }
    if (value.contradictionStatus === 'unresolved' && value.reviewStatus === 'approved') {
      context.addIssue({ code: 'custom', path: ['reviewStatus'], message: 'Unresolved chronology cannot be approved.' })
    }
  }).superRefine((value, context) => appendResearchDeepSafetyIssues('chronology_event', value, context))

export const motionStudioVisualNeedV2Schema: z.ZodType<MotionStudioVisualNeedV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.visual-need.v2'),
    productionId: uuid,
    visualNeedId: uuid,
    visualCoverageArtifactVersion: motionStudioVersionReferenceSchema,
    narrativePurpose: boundedText,
    narrativeFunctionVersion: motionStudioVersionReferenceSchema.optional(),
    kind: visualNeedKind,
    narrationSegmentIds: z.array(nonEmpty).max(256).readonly(),
    sceneIds: z.array(nonEmpty).max(256).readonly(),
    shotIds: z.array(nonEmpty).max(512).readonly(),
    linkedClaimIds: z.array(uuid).max(256).readonly(),
    evidenceFragmentIds: z.array(uuid).max(256).readonly(),
    requiredAuthenticity: z.union([authenticityClass, z.literal('any_labeled')]),
    requiredAccuracy: z.enum(['representative', 'precise', 'source_exact']),
    acceptableTreatments: z.array(visualTreatment).min(1).max(16).readonly(),
    prohibitedTreatments: z.array(visualTreatment).max(16).readonly(),
    disclosureRules: z.array(boundedText).max(64).readonly(),
    candidateIds: z.array(uuid).max(256).readonly(),
    selectedAssetVersionIds: z.array(uuid).max(256).readonly(),
    missingCoverageReason: boundedText.optional(),
    recommendation: z.object({
      route: z.enum(['deterministic', 'existing_asset', 'candidate_ingest', 'future_generation']),
      editability: z.enum(['low', 'medium', 'high']),
      costClass: z.enum(['no_incremental_provider_cost', 'low', 'medium', 'high']),
      risk: z.enum(['low', 'medium', 'high']),
      rationale: boundedText,
    }).strict(),
    status: reviewStatus,
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    const overlap = value.acceptableTreatments.filter((item) => value.prohibitedTreatments.includes(item))
    if (overlap.length) context.addIssue({ code: 'custom', path: ['prohibitedTreatments'], message: 'A treatment cannot be both acceptable and prohibited.' })
    const uncovered = value.candidateIds.length === 0 && value.selectedAssetVersionIds.length === 0
    if (uncovered !== Boolean(value.missingCoverageReason)) {
      context.addIssue({ code: 'custom', path: ['missingCoverageReason'], message: 'Missing coverage must be explicit only when no candidate or selected asset exists.' })
    }
  }).superRefine((value, context) => appendResearchDeepSafetyIssues('visual_need', value, context))

export const motionStudioVisualAssetCandidateV1Schema: z.ZodType<MotionStudioVisualAssetCandidateV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.visual-asset-candidate.v1'),
    productionId: uuid,
    candidateId: uuid,
    visualNeedId: uuid,
    sourceId: uuid,
    sourceVersionId: uuid,
    candidateType: visualTreatment,
    preview: z.object({
      label: nonEmpty.max(500),
      mimeType: nonEmpty.max(120).optional(),
      pixelWidth: positiveSafeInteger.optional(),
      pixelHeight: positiveSafeInteger.optional(),
      mediaDurationMilliseconds: positiveSafeInteger.optional(),
    }).strict(),
    authenticityClass,
    contentMatch: z.enum(['low', 'medium', 'high']),
    technicalSuitability: z.enum(['unsuitable', 'review_needed', 'suitable']),
    rights: rightsProfileSchema,
    privacyRisk: z.enum(['none', 'caution', 'blocked']),
    likenessRisk: z.enum(['none', 'caution', 'blocked']),
    linkedClaimIds: z.array(uuid).max(256).readonly(),
    proposedUse: boundedText,
    expectedIncrementalInternalCostMicros: safeInteger,
    currency: z.literal('USD'),
    expiresAt: isoDate.optional(),
    selectionStatus: z.enum(['discovered', 'needs_review', 'selected', 'rejected', 'expired']),
    selectedAssetVersionId: uuid.optional(),
    rejectionReason: boundedText.optional(),
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    if (value.selectionStatus === 'selected') {
      if (!value.selectedAssetVersionId || value.rights.reviewStatus !== 'reviewed' || !['user_authorized', 'licensed', 'public_domain'].includes(value.rights.status)) {
        context.addIssue({ code: 'custom', path: ['selectionStatus'], message: 'Selection requires reviewed usable rights and an existing asset version.' })
      }
      if (value.technicalSuitability !== 'suitable' || value.privacyRisk === 'blocked' || value.likenessRisk === 'blocked') {
        context.addIssue({ code: 'custom', path: ['selectionStatus'], message: 'Blocked or unsuitable candidates cannot be selected.' })
      }
    } else if (value.selectedAssetVersionId) {
      context.addIssue({ code: 'custom', path: ['selectedAssetVersionId'], message: 'Only a selected candidate can reference an ingested asset version.' })
    }
    if (value.selectionStatus === 'rejected' && !value.rejectionReason) {
      context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'Rejected candidates require a reason.' })
    }
    if (value.selectionStatus === 'expired' && !value.expiresAt) {
      context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expired candidates require an expiry time.' })
    }
  }).superRefine((value, context) => appendResearchDeepSafetyIssues('visual_candidate', value, context))

export const motionStudioResearchReviewEventV1Schema: z.ZodType<MotionStudioResearchReviewEventV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.research-review-event.v1'),
    productionId: uuid,
    reviewEventId: uuid,
    reviewKind: z.enum(['claim', 'rights', 'provenance', 'authenticity', 'visual_candidate', 'research_qa']),
    subjectType: z.enum(['source_version', 'evidence_fragment', 'claim', 'chronology_event', 'visual_need', 'visual_candidate', 'technique_blueprint']),
    subjectId: uuid,
    decision: z.enum(['approved', 'rejected', 'needs_review', 'blocked']),
    rationale: boundedText,
    reviewerId: uuid,
    priorReviewEventId: uuid.optional(),
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().refine((value) => value.reviewEventId !== value.priorReviewEventId, {
    message: 'A review event cannot consume itself.', path: ['priorReviewEventId'],
  }).superRefine((value, context) => appendResearchDeepSafetyIssues('review_event', value, context))

export const motionStudioTechniqueBlueprintV1Schema: z.ZodType<MotionStudioTechniqueBlueprintV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion_studio.reference.technique-blueprint.v1'),
    productionId: uuid,
    techniqueBlueprintId: uuid,
    referenceContractArtifactVersion: motionStudioVersionReferenceSchema,
    sourceVersionId: uuid,
    title: nonEmpty.max(500),
    timestampedSteps: z.array(z.object({
      stepId: uuid,
      startMilliseconds: safeInteger,
      endMilliseconds: positiveSafeInteger,
      summary: boundedText,
      evidenceFragmentIds: z.array(uuid).min(1).max(64).readonly(),
    }).strict().refine((value) => value.endMilliseconds > value.startMilliseconds, {
      message: 'Technique step requires a positive time range.', path: ['endMilliseconds'],
    })).max(256).readonly(),
    toolsAndModelsMentioned: z.array(nonEmpty.max(240)).max(128).readonly(),
    promptPatternSummaries: z.array(boundedText).max(128).readonly(),
    motionPrinciples: z.array(boundedText).max(128).readonly(),
    stylePrinciples: z.array(boundedText).max(128).readonly(),
    decisionRules: z.array(boundedText).max(128).readonly(),
    failureCases: z.array(boundedText).max(128).readonly(),
    manualCorrections: z.array(boundedText).max(128).readonly(),
    reusableTechniques: z.array(boundedText).max(128).readonly(),
    claimsRequiringVerification: z.array(uuid).max(128).readonly(),
    sourceInstructionsExecutable: z.literal(false),
    toolExecutionAllowed: z.literal(false),
    spendingAuthorityAllowed: z.literal(false),
    copiedPublisherIdentityAllowed: z.literal(false),
    copiedExactLayoutAllowed: z.literal(false),
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => appendResearchDeepSafetyIssues('technique_blueprint', value, context))

const workspaceSourceSchema = z.object({
  sourceId: uuid,
  sourceVersionId: uuid,
  title: nonEmpty.max(500),
  sourceKind,
  displayOrigin: nonEmpty.max(500),
  trustStatus,
  rightsStatus,
  authenticityClass,
  promptInjectionStatus: z.enum(['not_detected', 'detected', 'needs_review']),
  reviewStatus: z.enum(['unreviewed', 'reviewed', 'blocked']),
}).strict()

export const motionStudioResearchWorkspaceDtoSchema: z.ZodType<MotionStudioResearchWorkspaceDto> = z.object({
  productionId: uuid,
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  stage: z.literal('research'),
  state: z.enum(['empty', 'partial', 'processing', 'reconciliation', 'needs_review', 'blocked', 'failure', 'cancelled', 'approved']),
  scope: z.object({
    approvedStoryUnderstandingVersionId: uuid.optional(),
    externalRetrievalAllowed: z.literal(false),
    fixtureOnly: z.boolean(),
    maximumAuthorizedInternalCostMicros: safeInteger,
  }).strict(),
  sources: z.array(workspaceSourceSchema).max(256).readonly(),
  evidence: z.array(z.object({
    evidenceFragmentId: uuid,
    sourceVersionId: uuid,
    locatorLabel: nonEmpty.max(500),
    normalizedParaphrase: boundedText,
    relationship: evidenceRelationship,
    reviewStatus: z.enum(['unreviewed', 'reviewed', 'rejected']),
    warnings: z.array(boundedText).max(64).readonly(),
  }).strict()).max(2_000).readonly(),
  claims: z.array(z.object({
    claimId: uuid,
    claimText: boundedText,
    classification: claimClassification,
    confidence: z.enum(['low', 'medium', 'high']),
    materiality: z.enum(['background', 'supporting', 'material']),
    status: reviewStatus,
    supportCount: safeInteger,
    contradictionCount: safeInteger,
    disclosureRequired: z.boolean(),
    blockingReason: boundedText.optional(),
  }).strict()).max(1_000).readonly(),
  chronology: z.array(z.object({
    chronologyEventId: uuid,
    title: nonEmpty.max(500),
    timeLabel: nonEmpty.max(500),
    contradictionStatus: z.enum(['none', 'unresolved', 'resolved_with_disclosure']),
    reviewStatus,
  }).strict()).max(1_000).readonly(),
  visualNeeds: z.array(z.object({
    visualNeedId: uuid,
    narrativePurpose: boundedText,
    kind: visualNeedKind,
    route: z.enum(['deterministic', 'existing_asset', 'candidate_ingest', 'future_generation']),
    candidateCount: safeInteger,
    selectedAssetCount: safeInteger,
    status: reviewStatus,
    blockingReason: boundedText.optional(),
  }).strict()).max(1_000).readonly(),
  candidates: z.array(z.object({
    candidateId: uuid,
    visualNeedId: uuid,
    label: nonEmpty.max(500),
    candidateType: visualTreatment,
    authenticityClass,
    rightsStatus,
    technicalSuitability: z.enum(['unsuitable', 'review_needed', 'suitable']),
    selectionStatus: z.enum(['discovered', 'needs_review', 'selected', 'rejected', 'expired']),
    blockingReason: boundedText.optional(),
  }).strict()).max(2_000).readonly(),
  techniqueBlueprints: z.array(z.object({
    techniqueBlueprintId: uuid,
    title: nonEmpty.max(500),
    stepCount: safeInteger,
    failureCaseCount: safeInteger,
    sourceInstructionsExecutable: z.literal(false),
  }).strict()).max(256).readonly(),
  reviewQueue: z.array(z.object({
    subjectType: z.enum(['source_version', 'evidence_fragment', 'claim', 'chronology_event', 'visual_need', 'visual_candidate', 'technique_blueprint']),
    subjectId: uuid,
    label: nonEmpty.max(500),
    reason: boundedText,
    severity: z.enum(['info', 'warning', 'blocking']),
  }).strict()).max(2_000).readonly(),
  summary: z.object({
    sourceCount: safeInteger,
    evidenceCount: safeInteger,
    claimCount: safeInteger,
    approvedClaimCount: safeInteger,
    unresolvedContradictionCount: safeInteger,
    visualNeedCount: safeInteger,
    missingVisualCoverageCount: safeInteger,
    rightsBlockedCandidateCount: safeInteger,
  }).strict(),
  externalEvidence: z.object({
    state: z.enum([
      'not_requested', 'authorized', 'preflight_passed', 'processing',
      'reconciliation', 'needs_review', 'approved', 'rejected', 'blocked',
      'failure', 'cancelled',
    ]),
    requestCount: safeInteger,
    capturedRecordCount: safeInteger,
    binaryCaptureCount: z.number().int().min(0).max(1).refine(Number.isSafeInteger),
    externalSourceCount: safeInteger,
    openQuestionCount: safeInteger,
    openQuestions: z.array(boundedText).max(64).readonly(),
    reviewOnlyCandidateCount: safeInteger,
    finalAssetRegistrationAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    updatedAt: isoDate,
  }).strict(),
  externalRetrievalPerformed: z.boolean(),
  providerCallMade: z.literal(false),
  providerCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  localFixtureOnly: z.boolean(),
  updatedAt: isoDate,
}).strict().superRefine((value, context) => {
  const expected = {
    sourceCount: value.sources.length,
    evidenceCount: value.evidence.length,
    claimCount: value.claims.length,
    approvedClaimCount: value.claims.filter((claim) => claim.status === 'approved').length,
    unresolvedContradictionCount: value.chronology.filter((event) => event.contradictionStatus === 'unresolved').length,
    visualNeedCount: value.visualNeeds.length,
    missingVisualCoverageCount: value.visualNeeds.filter((need) => need.candidateCount === 0 && need.selectedAssetCount === 0).length,
    rightsBlockedCandidateCount: value.candidates.filter((candidate) => ['unknown', 'restricted', 'expired'].includes(candidate.rightsStatus)).length,
  }
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value.summary[key as keyof typeof expected] !== expectedValue) {
      context.addIssue({ code: 'custom', path: ['summary', key], message: `Summary ${key} must equal its projected records.` })
    }
  }
  if (value.externalEvidence.openQuestionCount !== value.externalEvidence.openQuestions.length) {
    context.addIssue({ code: 'custom', path: ['externalEvidence', 'openQuestionCount'], message: 'External open-question count must equal its safe projected records.' })
  }
  if (value.externalRetrievalPerformed !== (value.externalEvidence.requestCount > 0)) {
    context.addIssue({ code: 'custom', path: ['externalRetrievalPerformed'], message: 'External retrieval state must match the immutable attempt count.' })
  }
  if (value.localFixtureOnly !== !value.externalRetrievalPerformed || value.scope.fixtureOnly !== !value.externalRetrievalPerformed) {
    context.addIssue({ code: 'custom', path: ['scope', 'fixtureOnly'], message: 'Fixture-only flags must match whether an external attempt occurred.' })
  }
  appendResearchDeepSafetyIssues('workspace', value, context)
})

export type MotionStudioResearchContractName =
  | 'source_version'
  | 'evidence_fragment'
  | 'claim'
  | 'chronology_event'
  | 'visual_need'
  | 'visual_candidate'
  | 'review_event'
  | 'technique_blueprint'
  | 'workspace'

const researchSchemas: Record<MotionStudioResearchContractName, z.ZodTypeAny> = {
  source_version: motionStudioResearchSourceVersionV2Schema,
  evidence_fragment: motionStudioResearchEvidenceFragmentV2Schema,
  claim: motionStudioResearchClaimV2Schema,
  chronology_event: motionStudioResearchChronologyEventV1Schema,
  visual_need: motionStudioVisualNeedV2Schema,
  visual_candidate: motionStudioVisualAssetCandidateV1Schema,
  review_event: motionStudioResearchReviewEventV1Schema,
  technique_blueprint: motionStudioTechniqueBlueprintV1Schema,
  workspace: motionStudioResearchWorkspaceDtoSchema,
}

export function validateMotionStudioResearchBoundary(
  contract: MotionStudioResearchContractName,
  value: unknown,
): { ok: boolean; errors: readonly string[] } {
  const parsed = researchSchemas[contract].safeParse(value)
  const errors = parsed.success
    ? []
    : parsed.error.issues.map((issue) => `${issue.path.length ? issue.path.join('.') : '$'}: ${issue.message}`)
  const deepErrors = researchDeepSafetyErrors(contract, value)
  const combinedErrors = [...new Set([...errors, ...deepErrors])]
  return { ok: combinedErrors.length === 0, errors: combinedErrors }
}

function publicHttpsUrlError(value: string): string | undefined {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return 'A valid public HTTPS URL is required.'
  }
  if (parsed.protocol !== 'https:') return 'Only HTTPS research locators are allowed.'
  if (parsed.username || parsed.password) return 'Research locators cannot contain user information or credentials.'
  if (parsed.port && parsed.port !== '443') return 'Research locators cannot use an unapproved port.'
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return 'Local research hosts are forbidden.'
  if (host === '169.254.169.254' || host === 'metadata.google.internal') return 'Cloud metadata hosts are forbidden.'
  if (isBlockedIpv4(host) || isBlockedIpv6(host)) return 'Private, link-local, loopback, multicast, and reserved addresses are forbidden.'
  return undefined
}

function isBlockedIpv4(host: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false
  const octets = host.split('.').map(Number)
  if (octets.some((value) => value < 0 || value > 255)) return true
  const [a, b] = octets
  return a === 0 || a === 10 || a === 127 || a >= 224 || a >= 240 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19))
}

function isBlockedIpv6(host: string): boolean {
  if (!host.includes(':')) return false
  const normalized = host.toLowerCase()
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || /^fe[89ab]/.test(normalized) || normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
}
