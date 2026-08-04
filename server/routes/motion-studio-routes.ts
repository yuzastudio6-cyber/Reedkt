import { Router } from 'express'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireSensitiveIdempotencyKey } from '../middleware/idempotency'
import { createMotionStudioCommandService } from '../motion-studio/commands'
import { createMotionStudioAnimaticService } from '../motion-studio/animatics'
import { createMotionStudioAudioService } from '../motion-studio/audio'
import { createMotionStudioAudioAcceptanceService } from '../motion-studio/audio-acceptance'
import { createMotionStudioAudioMixService } from '../motion-studio/audio-production'
import { createMotionStudioVoiceCastingService } from '../motion-studio/speech-production'
import { createMotionStudioJobService } from '../motion-studio/jobs'
import { createMotionStudioLayeredService } from '../motion-studio/layered'
import { createMotionStudioGenerationService } from '../motion-studio/generation'
import { createMotionStudioLiveGenerationService } from '../motion-studio/live-generation'
import { createMotionStudioRenderService } from '../motion-studio/render'
import { createMotionStudioResearchService } from '../motion-studio/research'
import { createMotionStudioSceneService } from '../motion-studio/scenes'
import { createMotionStudioStoryWorkspaceService } from '../motion-studio/story-workspace'
import { createCanonicalStorytellingProductionPlanningService } from '../motion-studio/storytelling-production'
import {
  createStorytellingStoryContinuityPlanningService,
  createStorytellingStylePlanningService,
} from '../motion-studio/style-system'
import { validateBody } from '../validation/common-schemas'
import {
  applyMotionStudioCommandRequestSchema,
  approveMotionStudioArtifactVersionRequestSchema,
  createMotionStudioArtifactVersionRequestSchema,
  createMotionStudioProductionRequestSchema,
} from '../validation/motion-studio-command-schemas'
import {
  authorizeMotionStudioWorkGraphRequestSchema,
  cancelMotionStudioJobRequestSchema,
} from '../validation/motion-studio-job-schemas'
import {
  createMotionStudioSceneDraftRequestSchema,
  createMotionStudioTimelineProposalRequestSchema,
} from '../validation/motion-studio-scene-schemas'
import { createMotionStudioPreviewBindingRequestSchema } from '../validation/motion-studio-render-schemas'
import {
  assembleMotionStudioAnimaticRequestSchema,
  createMotionStudioAnimaticBindingRequestSchema,
} from '../validation/motion-studio-animatic-schemas'
import { createMotionStudioLayeredAssemblyRequestSchema } from '../validation/motion-studio-layered-schemas'
import { createMotionStudioGenerationBindingRequestSchema } from '../validation/motion-studio-generation-schemas'
import { createMotionStudioAudioMixBindingRequestSchema } from '../validation/motion-studio-audio-mix-schemas'
import {
  createMotionStudioAudioIntegrationBindingRequestV1Schema,
  createMotionStudioAudioSelectionRequestV1Schema,
} from '../validation/motion-studio-audio-acceptance-schemas'
import { reviewMotionStudioLiveCandidateByOwnerRequestSchema } from '../validation/motion-studio-live-generation-schemas'
import { selectMotionStudioNarratorForPlanningRequestSchema } from '../validation/motion-studio-voice-casting-schemas'
import {
  prepareCanonicalStorytellingPlanningRequestSchema,
  prepareStorytellingMotionStylePlanRequestSchema,
  prepareStorytellingStoryContinuityRequestSchema,
} from '../validation/motion-studio-style-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

const uuidParam = z.string().uuid()
const stableEditId = z.string().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => !value.includes('..'))
const stableCandidateReference = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

export function createMotionStudioRoutes(): Router {
  const router = Router()

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/motion-studio',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioProductionRequestSchema, request.body)
      const result = await createMotionStudioCommandService(getServiceContext(request)).createProduction(
        parseRouteParam(uuidParam, getRouteParam(request, 'projectId'), 'projectId'),
        parseRouteParam(stableEditId, getRouteParam(request, 'editSessionId'), 'editSessionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/research-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioResearchService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/story-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioStoryWorkspaceService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/storytelling-style-plan-preparations',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(prepareStorytellingMotionStylePlanRequestSchema, request.body)
      const result = await createStorytellingStylePlanningService(getServiceContext(request)).prepare(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/story-continuity-preparations',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(prepareStorytellingStoryContinuityRequestSchema, request.body)
      const result = await createStorytellingStoryContinuityPlanningService(
        getServiceContext(request),
      ).prepare(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/canonical-storytelling-planning-preparations',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(
        prepareCanonicalStorytellingPlanningRequestSchema,
        request.body,
      )
      const result = await createCanonicalStorytellingProductionPlanningService(
        getServiceContext(request),
      ).prepare(
        parseRouteParam(
          uuidParam,
          getRouteParam(request, 'productionId'),
          'productionId',
        ),
        body,
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/audio-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioAudioService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/voice-casting-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioVoiceCastingService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/voice-casting-selections',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(selectMotionStudioNarratorForPlanningRequestSchema, request.body)
      const result = await createMotionStudioVoiceCastingService(getServiceContext(request)).selectNarratorForPlanning(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/audio-mix-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioAudioMixService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/audio-selections',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioAudioSelectionRequestV1Schema, request.body)
      const result = await createMotionStudioAudioAcceptanceService(
        getServiceContext(request),
      ).createSelection(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/audio-integration-bindings',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(
        createMotionStudioAudioIntegrationBindingRequestV1Schema,
        request.body,
      )
      const result = await createMotionStudioAudioAcceptanceService(
        getServiceContext(request),
      ).createIntegrationBinding(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/audio-mix-bindings',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioAudioMixBindingRequestSchema, request.body)
      const result = await createMotionStudioAudioMixService(getServiceContext(request)).createBinding(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/generation-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioGenerationService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/live-generation-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/live-candidates/:candidateId/human-reviews',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const review = validateBody(reviewMotionStudioLiveCandidateByOwnerRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).reviewCandidateByOwner({
        candidateId: parseRouteParam(uuidParam, getRouteParam(request, 'candidateId'), 'candidateId'),
        review,
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/generation-bindings',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioGenerationBindingRequestSchema, request.body)
      const result = await createMotionStudioGenerationService(getServiceContext(request)).createBinding(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/media-asset-versions/:assetVersionId/content',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioGenerationService(getServiceContext(request)).readPrivateMedia(
        parseRouteParam(uuidParam, getRouteParam(request, 'assetVersionId'), 'assetVersionId'),
      )
      const extension = result.media.mimeType === 'image/png' ? 'png' : 'mp4'
      response.status(200)
      response.setHeader('content-type', result.media.mimeType)
      response.setHeader('content-length', String(result.bytes.byteLength))
      response.setHeader('content-disposition', `inline; filename="motion-studio-generated-${result.media.assetVersionId}.${extension}"`)
      response.setHeader('etag', `"${result.media.sha256}"`)
      response.setHeader('cache-control', 'private, no-store')
      response.send(result.bytes)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/preview-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioRenderService(getServiceContext(request)).getPreviewWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/render-bindings',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioPreviewBindingRequestSchema, request.body)
      const result = await createMotionStudioRenderService(getServiceContext(request)).createBinding(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/layered-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioLayeredService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/layered-assemblies',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioLayeredAssemblyRequestSchema, request.body)
      const result = await createMotionStudioLayeredService(getServiceContext(request)).createAssembly(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/animatic-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioAnimaticService(getServiceContext(request)).getWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/animatic-assemblies',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(assembleMotionStudioAnimaticRequestSchema, request.body)
      const result = await createMotionStudioAnimaticService(getServiceContext(request)).assemble(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/animatic-bindings',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioAnimaticBindingRequestSchema, request.body)
      const result = await createMotionStudioAnimaticService(getServiceContext(request)).createBinding(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/animatic-artifacts/:artifactId/content',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioAnimaticService(getServiceContext(request)).readPrivateArtifact(
        parseRouteParam(uuidParam, getRouteParam(request, 'artifactId'), 'artifactId'),
      )
      response.status(200)
      response.setHeader('content-type', 'video/mp4')
      response.setHeader('content-length', String(result.bytes.byteLength))
      response.setHeader('content-disposition', `inline; filename="motion-studio-animatic-${result.artifact.id}.mp4"`)
      response.setHeader('etag', `"${result.artifact.sha256}"`)
      response.setHeader('cache-control', 'private, no-store')
      response.send(result.bytes)
    }),
  )

  router.get(
    '/v1/motion-studio/audio-candidates/:candidateReference/content',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioAudioMixService(
        getServiceContext(request),
      ).readPrivateCandidate(
        parseRouteParam(
          stableCandidateReference,
          getRouteParam(request, 'candidateReference'),
          'candidateReference',
        ),
      )
      response.status(200)
      response.setHeader('content-type', 'audio/wav')
      response.setHeader('content-length', String(result.bytes.byteLength))
      response.setHeader(
        'content-disposition',
        'inline; filename="reeditpro-storytelling-audio-candidate.wav"',
      )
      response.setHeader('etag', `"${result.candidate.sha256}"`)
      response.setHeader('cache-control', 'private, no-store')
      response.send(result.bytes)
    }),
  )

  router.get(
    '/v1/motion-studio/audio-mix-artifacts/:artifactId/content',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioAudioMixService(getServiceContext(request)).readPrivateArtifact(
        parseRouteParam(uuidParam, getRouteParam(request, 'artifactId'), 'artifactId'),
      )
      response.status(200)
      response.setHeader('content-type', 'audio/wav')
      response.setHeader('content-length', String(result.bytes.byteLength))
      response.setHeader('content-disposition', `inline; filename="motion-studio-audio-mix-${result.artifact.id}.wav"`)
      response.setHeader('etag', `"${result.artifact.artifact_sha256}"`)
      response.setHeader('cache-control', 'private, no-store')
      response.send(result.bytes)
    }),
  )

  router.get(
    '/v1/motion-studio/preview-artifacts/:artifactId/content',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioRenderService(getServiceContext(request)).readPrivateArtifact(
        parseRouteParam(uuidParam, getRouteParam(request, 'artifactId'), 'artifactId'),
      )
      response.status(200)
      response.setHeader('content-type', 'video/mp4')
      response.setHeader('content-length', String(result.bytes.byteLength))
      response.setHeader('content-disposition', `inline; filename="motion-studio-preview-${result.artifact.id}.mp4"`)
      response.setHeader('etag', `"${result.artifact.sha256}"`)
      response.setHeader('cache-control', 'private, no-store')
      response.send(result.bytes)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/scene-workspace',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioSceneService(getServiceContext(request)).getSceneWorkspace(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/scene-drafts',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioSceneDraftRequestSchema, request.body)
      const result = await createMotionStudioSceneService(getServiceContext(request)).createSceneDraft(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/timeline-proposals',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioTimelineProposalRequestSchema, request.body)
      const result = await createMotionStudioSceneService(getServiceContext(request)).createTimelineProposal(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/motion-studio',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioCommandService(getServiceContext(request)).getProduction(
        parseRouteParam(uuidParam, getRouteParam(request, 'projectId'), 'projectId'),
        parseRouteParam(stableEditId, getRouteParam(request, 'editSessionId'), 'editSessionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/artifact-versions',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioArtifactVersionRequestSchema, request.body)
      const result = await createMotionStudioCommandService(getServiceContext(request)).createInitialArtifactVersion(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/artifacts/:artifactId',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioCommandService(getServiceContext(request)).getArtifact(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        parseRouteParam(uuidParam, getRouteParam(request, 'artifactId'), 'artifactId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/artifacts/:artifactId/commands',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(applyMotionStudioCommandRequestSchema, request.body)
      const result = await createMotionStudioCommandService(getServiceContext(request)).applyCommand(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        parseRouteParam(uuidParam, getRouteParam(request, 'artifactId'), 'artifactId'),
        body,
        getIdempotencyKey(request),
      )
      if (result.data.result.status !== 'applied') {
        const code = result.data.result.status === 'locked' ? 'MOTION_STUDIO_LOCKED' : 'MOTION_STUDIO_CONFLICT'
        throw new ApiError(code, result.data.result.message, 409, { commandResult: result.data.result })
      }
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/artifacts/:artifactId/approvals',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(approveMotionStudioArtifactVersionRequestSchema, request.body)
      const result = await createMotionStudioCommandService(getServiceContext(request)).approveArtifact(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        parseRouteParam(uuidParam, getRouteParam(request, 'artifactId'), 'artifactId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/motion-studio/productions/:productionId/work-graph-authorizations',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(authorizeMotionStudioWorkGraphRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).authorizeWorkGraph(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/motion-studio/productions/:productionId/work-graph',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createMotionStudioJobService(getServiceContext(request)).getWorkGraph(
        parseRouteParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/motion-studio/jobs/:jobId/cancellation',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(cancelMotionStudioJobRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).cancelJob(
        parseRouteParam(stableEditId, getRouteParam(request, 'jobId'), 'jobId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  return router
}

function parseRouteParam<T>(schema: z.ZodType<T>, value: string, name: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', `Route parameter ${name} is invalid.`, 400)
  return parsed.data
}
