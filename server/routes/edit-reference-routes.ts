import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireSensitiveIdempotencyKey } from '../middleware/idempotency'
import { createEditReferenceService, type EditReferenceServiceResult } from '../services/edit-reference-service'
import {
  assertEditReferenceUploadPersistenceAvailable,
  createUploadService,
} from '../services/upload-service'
import { authorizeWorkspaceAccess } from '../services/workspace-access-service'
import {
  EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES,
  EDIT_REFERENCE_MEDIA_RIGHTS_BASES,
  EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS,
  EDIT_REFERENCE_STUDY_GOALS,
  EDIT_REFERENCE_STUDY_LIFECYCLE_STATUSES,
  EDIT_REFERENCE_TARGET_BUDGET_PREFERENCES,
  EDIT_REFERENCE_TARGET_CONTENT_TYPES,
  EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES,
  EDIT_REFERENCE_TARGET_SOURCE_MODES,
} from '../../src/types/edit-reference'
import {
  EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_KINDS,
  EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
} from '../../src/types/edit-reference-long-form-review'
import { idSchema, validateBody } from '../validation/common-schemas'
import { createUploadIntentSchema } from '../validation/upload-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

const workspaceSchema = z.object({ workspaceId: idSchema.max(160) })
const createReferenceSchema = workspaceSchema.extend({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2_000).optional(),
  initialGoals: z.array(z.enum(EDIT_REFERENCE_STUDY_GOALS)).min(1).max(EDIT_REFERENCE_STUDY_GOALS.length),
}).strict()
const updateReferenceSchema = workspaceSchema.extend({
  expectedReferenceRevision: z.number().int().positive(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2_000).optional(),
  status: z.literal('archived').optional(),
}).strict().refine((body) => body.name !== undefined || body.description !== undefined || body.status !== undefined, {
  message: 'At least one Edit Reference field must be updated.',
})
const createStudySchema = workspaceSchema.extend({
  expectedReferenceRevision: z.number().int().positive(),
  title: z.string().trim().min(1).max(160),
}).strict()
const updateStudySchema = workspaceSchema.extend({
  expectedStudyRevision: z.number().int().positive(),
  title: z.string().trim().min(1).max(160).optional(),
  status: z.enum(EDIT_REFERENCE_STUDY_LIFECYCLE_STATUSES).optional(),
}).strict().refine((body) => body.title !== undefined || body.status !== undefined, {
  message: 'At least one Preference Study field must be updated.',
})
const appendMessageSchema = workspaceSchema.extend({
  expectedStudyRevision: z.number().int().positive(),
  clientMessageId: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(8_000),
  findingCorrectionEvidenceId: idSchema.max(200).optional(),
}).strict()
const evidenceMutationFields = {
  workspaceId: idSchema.max(160),
  expectedStudyRevision: z.number().int().positive(),
  title: z.string().trim().min(1).max(160),
}
const manualEvidenceSchema = z.object({
  ...evidenceMutationFields,
  sourceType: z.literal('manual_user_evidence'),
  category: z.enum(EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES),
  summary: z.string().trim().min(1).max(4_000),
  intendedUse: z.enum(['transferable', 'non_transferable', 'do_not_copy', 'requires_user_review']),
  supersedesEvidenceId: idSchema.max(200).optional(),
}).strict()
const referenceMetadataEvidenceSchema = z.object({
  ...evidenceMutationFields,
  sourceType: z.literal('reference_video_metadata'),
  sourceLabel: z.string().trim().min(1).max(240),
  rightsBasis: z.enum(EDIT_REFERENCE_MEDIA_RIGHTS_BASES),
  durationSeconds: z.number().finite().min(0).max(30 * 24 * 60 * 60).optional(),
  width: z.number().int().positive().max(16_384).optional(),
  height: z.number().int().positive().max(16_384).optional(),
  hasAudio: z.boolean().optional(),
  storageObjectRecordId: idSchema.max(200).optional(),
  mediaAssetId: idSchema.max(200).optional(),
}).strict().refine((body) => Boolean(body.storageObjectRecordId) === Boolean(body.mediaAssetId), {
  message: 'A private reference upload requires both its storage object and media asset identities.',
})
const previousApprovedEditEvidenceSchema = z.object({
  ...evidenceMutationFields,
  sourceType: z.literal('previous_approved_edit_snapshot'),
  projectId: idSchema.max(200),
  editSessionId: idSchema.max(200),
  approvedSnapshotId: idSchema.max(200),
  summary: z.string().trim().max(2_000).optional(),
  rightsBasis: z.literal('workspace_approved_edit'),
}).strict()
const createEvidenceSchema = z.discriminatedUnion('sourceType', [
  manualEvidenceSchema,
  referenceMetadataEvidenceSchema,
  previousApprovedEditEvidenceSchema,
])
const studyRevisionSchema = workspaceSchema.extend({
  expectedStudyRevision: z.number().int().positive(),
}).strict()
const runEvidenceStudySchema = studyRevisionSchema.extend({
  retryBlockedSkills: z.literal(true).optional(),
}).strict()
const startLongFormStudySchema = studyRevisionSchema
const controlLongFormStudySchema = workspaceSchema.extend({
  expectedRunRevision: z.number().int().positive(),
  action: z.enum(EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS),
}).strict()
const applyLongFormStudyReviewSchema = studyRevisionSchema.extend({
  expectedReviewPackageDigestSha256: z.string().regex(/^[a-f0-9]{64}$/),
  decisions: z.array(z.object({
    schemaVersion: z.literal(EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION),
    findingId: idSchema.max(240),
    decision: z.enum(EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_KINDS),
  }).strict()).min(1).max(7),
  acknowledgeAdaptNotCopy: z.boolean(),
  acknowledgeFactSafetyReview: z.boolean(),
}).strict().superRefine((body, context) => {
  if (new Set(body.decisions.map((decision) => decision.findingId)).size !== body.decisions.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Each study area can have only one review choice.' })
  }
})
const synthesizePreferenceDNASchema = studyRevisionSchema
const runPreferenceDNAQASchema = studyRevisionSchema.extend({
  expectedDNAContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()
const approvePreferenceDNASchema = runPreferenceDNAQASchema.extend({
  qaResultId: idSchema.max(200),
  acknowledgeAdaptNotCopy: z.literal(true),
  acknowledgeQAReview: z.boolean(),
  reasoningReviewAcknowledgement: z.object({
    schemaVersion: z.literal('edit-reference-qwen-dna-approval-request-v1'),
    expectedApprovalBindingDigestSha256: z.string().regex(/^[a-f0-9]{64}$/),
    acknowledgeAiAssistedSynthesis: z.literal(true),
    acknowledgeConfidenceAndLimitations: z.literal(true),
  }).strict().optional(),
}).strict()
const targetContextSchema = z.object({
  projectId: idSchema.max(200),
  editSessionId: idSchema.max(200),
  projectName: z.string().trim().min(1).max(160),
  editName: z.string().trim().min(1).max(160),
  sourceMode: z.enum(EDIT_REFERENCE_TARGET_SOURCE_MODES),
  contentType: z.enum(EDIT_REFERENCE_TARGET_CONTENT_TYPES),
  sourceSummary: z.string().trim().min(1).max(2_000),
  currentUserInstruction: z.string().trim().min(1).max(4_000),
  selectedEditLevel: z.enum(['normal', 'premium', 'ultra_premium']),
  aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5']),
  outputFrameConfirmed: z.literal(true),
  platformTarget: z.enum(['tiktok_reel', 'instagram_reel', 'instagram_feed', 'youtube_shorts', 'youtube_standard', 'linkedin', 'website', 'podcast_clip', 'ad_creative', 'internal_review', 'custom']),
  storyRole: z.string().trim().min(1).max(500),
  budgetPreference: z.enum(EDIT_REFERENCE_TARGET_BUDGET_PREFERENCES),
  directives: z.object({
    captions: z.enum(EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES),
    music: z.enum(EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES),
    sfx: z.enum(EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES),
    sourceOrder: z.enum(['adapt', 'preserve']),
  }).strict(),
  approvedConstraints: z.array(z.string().trim().min(1).max(500)).max(12),
}).strict()
const approvalStatusSchema = z.enum(['not_requested', 'requested', 'approved', 'rejected', 'reset_after_revision'])
const integrationSafetySchema = z.object({
  providerCallMade: z.literal(false),
  modelCallMade: z.literal(false),
  fileBytesRead: z.literal(false),
  externalUrlFetched: z.literal(false),
  mediaProcessingStarted: z.literal(false),
  workerJobCreated: z.literal(false),
  generationRequestCreated: z.literal(false),
  renderJobCreated: z.literal(false),
  creditReservedOrSpent: z.literal(false),
  approvedPlanMutationMade: z.literal(false),
  supabaseWriteMade: z.literal(false),
}).strict()
const downstreamInvalidationReceiptSchema = z.object({
  receiptVersion: z.literal('edit-reference-downstream-invalidation-receipt-v1'),
  applicationId: idSchema.max(200),
  applicationContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  contextHash: z.string().trim().min(1).max(80),
  projectId: idSchema.max(200),
  editSessionId: idSchema.max(200),
  reason: z.enum(['replace', 'remove']),
  sessionUpdatedAt: z.string().datetime(),
  approvalStatusBefore: approvalStatusSchema,
  approvalStatusAfter: approvalStatusSchema,
  approvalResetRequired: z.boolean(),
  sessionContextInvalidated: z.literal(true),
  approvedPlanMutationMade: z.literal(false),
  invalidatedAt: z.string().datetime(),
  mockOnly: z.literal(true),
  safety: integrationSafetySchema,
}).strict()
const createPreferenceApplicationSchema = workspaceSchema.extend({
  expectedReferenceRevision: z.number().int().positive(),
  expectedDNAContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  acknowledgeAdaptNotCopy: z.literal(true),
  applicationSource: z.enum(['setup_selector', 'chat_tag', 'session_panel']).optional(),
  targetContext: targetContextSchema,
  targetUnderstandingPackageId: idSchema.max(240),
  targetUnderstandingPackageDigestSha256: z.string().regex(/^[a-f0-9]{64}$/),
  targetUnderstandingSourceStorageObjectRecordId: idSchema.max(200),
  targetUnderstandingSourceMediaAssetId: idSchema.max(200),
  targetUnderstandingEditBriefDigestSha256: z.string().regex(/^[a-f0-9]{64}$/),
  replacesApplicationId: idSchema.max(200).optional(),
  expectedReplacedReferenceRevision: z.number().int().positive().optional(),
  invalidationReceipt: downstreamInvalidationReceiptSchema.optional(),
}).strict().superRefine((body, context) => {
  const replacementFields = [body.replacesApplicationId, body.expectedReplacedReferenceRevision, body.invalidationReceipt]
  const providedCount = replacementFields.filter((value) => value !== undefined).length
  if (providedCount !== 0 && providedCount !== replacementFields.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Replacement requires all exact lifecycle fields.' })
  }
  if (body.invalidationReceipt && body.invalidationReceipt.reason !== 'replace') {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Replacement requires a replace invalidation receipt.' })
  }
})
const targetSessionReceiptSchema = z.object({
  receiptVersion: z.literal('edit-reference-project-session-receipt-v1'),
  projectId: idSchema.max(200),
  editSessionId: idSchema.max(200),
  sessionName: z.string().trim().min(1).max(160),
  sessionUpdatedAt: z.string().datetime(),
  aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5']),
  platformTarget: z.enum(['tiktok_reel', 'instagram_reel', 'instagram_feed', 'youtube_shorts', 'youtube_standard', 'linkedin', 'website', 'podcast_clip', 'ad_creative', 'internal_review', 'custom']),
  selectedEditLevel: z.enum(['normal', 'premium', 'ultra_premium']),
  outputFrameConfirmed: z.literal(true),
  approvalStatusBefore: approvalStatusSchema,
  approvalStatusAfter: approvalStatusSchema,
  approvalResetRequired: z.boolean(),
  stagedContextHash: z.string().trim().min(1).max(80),
  stagedApplicationContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  stagedAt: z.string().datetime(),
  mockOnly: z.literal(true),
}).strict()
const connectPreferenceApplicationSchema = workspaceSchema.extend({
  expectedReferenceRevision: z.number().int().positive(),
  expectedApplicationContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  targetSessionReceipt: targetSessionReceiptSchema,
}).strict()
const clearPreferenceApplicationSchema = workspaceSchema.extend({
  expectedReferenceRevision: z.number().int().positive(),
  expectedApplicationContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  invalidationReceipt: downstreamInvalidationReceiptSchema.refine((receipt) => receipt.reason === 'remove', {
    message: 'Removal requires a remove invalidation receipt.',
  }),
}).strict()

export function createEditReferenceRoutes(): Router {
  const router = Router()

  router.get('/v1/edit-references', requireAuth, asyncRoute(async (request, response) => {
    const query = workspaceSchema.safeParse(request.query)
    if (!query.success) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400, query.error.flatten())
    const result = await createEditReferenceService(getServiceContext(request)).listReferences(query.data.workspaceId)
    sendOk(response, result.data, result.warnings)
  }))

  router.get('/v1/edit-reference-applications', requireAuth, asyncRoute(async (request, response) => {
    const query = workspaceSchema.safeParse(request.query)
    if (!query.success) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400, query.error.flatten())
    const result = await createEditReferenceService(getServiceContext(request)).listApplications(query.data.workspaceId)
    sendOk(response, result.data, result.warnings)
  }))

  router.post('/v1/edit-references', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(createReferenceSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).createReference(body, getDurableIdempotencyKey(request))
    sendMutation(response, result, 201)
  }))

  router.post(
    '/v1/edit-references/:referenceId/upload-intents',
    requireAuth,
    requireEditReferenceUploadWriteAccess,
    requireEditReferenceUploadPersistence,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createUploadIntentSchema, request.body)
      if (body.uploadPurpose !== 'reference_media') {
        throw new ApiError('VALIDATION_FAILED', 'Edit Reference uploads accept reference video only.', 400)
      }
      const referenceId = getRouteParam(request, 'referenceId')
      const context = getServiceContext(request)
      const reference = await createEditReferenceService(context).getReference(body.workspaceId, referenceId)
      if (!body.chatSessionId || body.chatSessionId !== reference.data.detail.study.id) {
        throw new ApiError(
          'WORKSPACE_ACCESS_DENIED',
          'The upload must belong to the active study for this Edit Reference.',
          403,
        )
      }
      const result = await createUploadService(context).createUploadIntent({
        ...body,
        editReferenceId: reference.data.detail.reference.id,
        idempotencyKey: getDurableIdempotencyKey(request),
      })
      sendOk(response, {
        uploadIntent: result.uploadIntent,
        uploadTarget: result.uploadTarget,
        signedUrlEvent: result.signedUrlEvent,
      }, result.warnings, 201)
    }),
  )

  router.get('/v1/edit-references/:referenceId', requireAuth, asyncRoute(async (request, response) => {
    const query = workspaceSchema.safeParse(request.query)
    if (!query.success) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400, query.error.flatten())
    const result = await createEditReferenceService(getServiceContext(request)).getReference(query.data.workspaceId, getRouteParam(request, 'referenceId'))
    sendOk(response, result.data, result.warnings)
  }))

  router.patch('/v1/edit-references/:referenceId', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(updateReferenceSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).updateReference(
      getRouteParam(request, 'referenceId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result)
  }))

  router.post('/v1/edit-references/:referenceId/studies', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(createStudySchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).createStudy(
      getRouteParam(request, 'referenceId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.patch('/v1/edit-reference-studies/:studyId', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(updateStudySchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).updateStudy(
      getRouteParam(request, 'studyId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result)
  }))

  router.get('/v1/edit-reference-studies/:studyId', requireAuth, asyncRoute(async (request, response) => {
    const query = workspaceSchema.safeParse(request.query)
    if (!query.success) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400, query.error.flatten())
    const result = await createEditReferenceService(getServiceContext(request)).getStudy(query.data.workspaceId, getRouteParam(request, 'studyId'))
    sendOk(response, result.data, result.warnings)
  }))

  router.get('/v1/edit-reference-studies/:studyId/messages', requireAuth, asyncRoute(async (request, response) => {
    const query = workspaceSchema.safeParse(request.query)
    if (!query.success) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400, query.error.flatten())
    const result = await createEditReferenceService(getServiceContext(request)).listStudyMessages(query.data.workspaceId, getRouteParam(request, 'studyId'))
    sendOk(response, result.data, result.warnings)
  }))

  router.get('/v1/edit-reference-studies/:studyId/assets/:referenceAssetId/long-form-study', requireAuth, asyncRoute(async (request, response) => {
    const query = workspaceSchema.safeParse(request.query)
    if (!query.success) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400, query.error.flatten())
    const result = await createEditReferenceService(getServiceContext(request)).getLongFormStudy(
      query.data.workspaceId,
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'referenceAssetId'),
    )
    sendOk(response, result.data, result.warnings)
  }))

  router.get('/v1/edit-reference-studies/:studyId/assets/:referenceAssetId/long-form-study/review', requireAuth, asyncRoute(async (request, response) => {
    const query = workspaceSchema.safeParse(request.query)
    if (!query.success) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400, query.error.flatten())
    const result = await createEditReferenceService(getServiceContext(request)).getLongFormStudyReview(
      query.data.workspaceId,
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'referenceAssetId'),
    )
    sendOk(response, result.data, result.warnings)
  }))

  router.post('/v1/edit-reference-studies/:studyId/messages', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(appendMessageSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).appendMessage(
      getRouteParam(request, 'studyId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.post('/v1/edit-reference-studies/:studyId/evidence', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(createEvidenceSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).addEvidence(
      getRouteParam(request, 'studyId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.post('/v1/edit-reference-studies/:studyId/assets/:referenceAssetId/long-form-study', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(startLongFormStudySchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).startLongFormStudy(
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'referenceAssetId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 202)
  }))

  router.post('/v1/edit-reference-studies/:studyId/assets/:referenceAssetId/long-form-study/control', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(controlLongFormStudySchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).controlLongFormStudy(
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'referenceAssetId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 200)
  }))

  router.post('/v1/edit-reference-studies/:studyId/assets/:referenceAssetId/long-form-study/review', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(applyLongFormStudyReviewSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).applyLongFormStudyReview(
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'referenceAssetId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 200)
  }))

  router.post('/v1/edit-reference-studies/:studyId/evidence-study', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(runEvidenceStudySchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).runEvidenceStudy(
      getRouteParam(request, 'studyId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.post('/v1/edit-reference-studies/:studyId/preference-dna', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(synthesizePreferenceDNASchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).synthesizePreferenceDNA(
      getRouteParam(request, 'studyId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.post('/v1/edit-reference-studies/:studyId/preference-dna/:dnaVersionId/qa', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(runPreferenceDNAQASchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).runPreferenceDNAQA(
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'dnaVersionId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.post('/v1/edit-reference-studies/:studyId/preference-dna/:dnaVersionId/approve', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(approvePreferenceDNASchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).approvePreferenceDNA(
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'dnaVersionId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.post('/v1/edit-reference-studies/:studyId/preference-dna/:dnaVersionId/applications', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(createPreferenceApplicationSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).createPreferenceApplication(
      getRouteParam(request, 'studyId'),
      getRouteParam(request, 'dnaVersionId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result, 201)
  }))

  router.post('/v1/edit-reference-applications/:applicationId/connect', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(connectPreferenceApplicationSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).connectPreferenceApplication(
      getRouteParam(request, 'applicationId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result)
  }))

  router.post('/v1/edit-reference-applications/:applicationId/clear', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(clearPreferenceApplicationSchema, request.body)
    const result = await createEditReferenceService(getServiceContext(request)).clearPreferenceApplication(
      getRouteParam(request, 'applicationId'),
      body,
      getDurableIdempotencyKey(request),
    )
    sendMutation(response, result)
  }))

  return router
}

function getDurableIdempotencyKey(request: Request): string {
  const value = request.header('idempotency-key')?.trim()
  if (!value) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required.', 400)
  if (value.length > 200) throw new ApiError('VALIDATION_FAILED', 'Idempotency-Key is too long.', 400)
  return value
}

function requireEditReferenceUploadPersistence(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    assertEditReferenceUploadPersistenceAvailable(getServiceContext(request))
    next()
  } catch (error) {
    next(error)
  }
}

async function requireEditReferenceUploadWriteAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(createUploadIntentSchema, request.body)
    await authorizeWorkspaceAccess(getServiceContext(request), body.workspaceId, 'write')
    next()
  } catch (error) {
    next(error)
  }
}

function sendMutation<T>(response: Response, result: EditReferenceServiceResult<T>, status = 200): void {
  response.setHeader('Idempotency-Replayed', result.replayed ? 'true' : 'false')
  sendOk(response, result.data, result.warnings, status)
}
