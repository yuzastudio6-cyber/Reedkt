import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { createEditReferenceService, type EditReferenceServiceResult } from '../services/edit-reference-service'
import {
  EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES,
  EDIT_REFERENCE_MEDIA_RIGHTS_BASES,
  EDIT_REFERENCE_STUDY_GOALS,
  EDIT_REFERENCE_STUDY_LIFECYCLE_STATUSES,
  EDIT_REFERENCE_TARGET_BUDGET_PREFERENCES,
  EDIT_REFERENCE_TARGET_CONTENT_TYPES,
  EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES,
  EDIT_REFERENCE_TARGET_SOURCE_MODES,
} from '../../src/types/edit-reference'
import { idSchema, validateBody } from '../validation/common-schemas'
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
  durationSeconds: z.number().finite().min(0).max(86_400).optional(),
  width: z.number().int().positive().max(16_384).optional(),
  height: z.number().int().positive().max(16_384).optional(),
  hasAudio: z.boolean().optional(),
}).strict()
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
const runEvidenceStudySchema = workspaceSchema.extend({
  expectedStudyRevision: z.number().int().positive(),
}).strict()
const synthesizePreferenceDNASchema = runEvidenceStudySchema
const runPreferenceDNAQASchema = runEvidenceStudySchema.extend({
  expectedDNAContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()
const approvePreferenceDNASchema = runPreferenceDNAQASchema.extend({
  qaResultId: idSchema.max(200),
  acknowledgeAdaptNotCopy: z.literal(true),
  acknowledgeQAReview: z.boolean(),
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
const createPreferenceApplicationSchema = workspaceSchema.extend({
  expectedReferenceRevision: z.number().int().positive(),
  expectedDNAContentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  acknowledgeAdaptNotCopy: z.literal(true),
  targetContext: targetContextSchema,
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

  return router
}

function getDurableIdempotencyKey(request: Request): string {
  const value = request.header('idempotency-key')?.trim()
  if (!value) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required.', 400)
  if (value.length > 200) throw new ApiError('VALIDATION_FAILED', 'Idempotency-Key is too long.', 400)
  return value
}

function sendMutation<T>(response: Response, result: EditReferenceServiceResult<T>, status = 200): void {
  response.setHeader('Idempotency-Replayed', result.replayed ? 'true' : 'false')
  sendOk(response, result.data, result.warnings, status)
}
