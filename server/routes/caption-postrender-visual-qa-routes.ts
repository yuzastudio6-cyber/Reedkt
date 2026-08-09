import { Router } from 'express'

import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE,
} from '../../src/types/caption-direction-visual-review-authenticated-read'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import {
  createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService,
} from '../services/canonical-caption-postrender-visual-qa-authenticated-read-service'
import {
  asyncRoute,
  getServiceContext,
  sendOk,
} from './route-helpers'

/**
 * Authenticated read-only projection for Caption post-render visual review.
 * It cannot schedule work, invoke a provider, approve QA, repair media, or
 * accept browser-local completion.
 */
export function createCaptionPostrenderVisualQaRoutes(): Router {
  const router = Router()
  router.post(
    CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE,
    requireAuth,
    asyncRoute(async (request, response) => {
      const context = getServiceContext(request)
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Caption visual-review evidence requires an authenticated user.',
        401,
      )
      if (!context.canonicalCaptionPostrenderVisualQaEvidenceRepository
        && !context
          .canonicalCaptionPostrenderVisualIntelligenceEvidenceRepository) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'The canonical Caption visual-review repository is not mounted.',
          503,
          {
            requiredGate:
              'canonical_caption_postrender_visual_intelligence_evidence_repository',
          },
        )
      }
      const authenticatedRead = await
        createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
          repository: context
            .canonicalCaptionPostrenderVisualQaEvidenceRepository,
          visualIntelligenceRepository: context
            .canonicalCaptionPostrenderVisualIntelligenceEvidenceRepository,
        }).read({
          authenticatedOwnerUserId: context.auth.userId,
          request: request.body,
        })
      sendOk(response, { authenticatedRead }, [
        authenticatedRead.disposition === 'completed'
          ? 'The server reread exact immutable Caption visual-review evidence. Private human review remains separate.'
          : authenticatedRead.disposition === 'pending'
            ? 'Caption visual review is still pending canonical render or qualified model evidence.'
            : 'No canonical Caption visual-review lifecycle exists for this exact output set.',
      ])
    }),
  )
  return router
}
