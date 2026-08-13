import { Router } from 'express'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE,
} from '../../src/types/track-all-sam3_1-gpu-start'
import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_ROUTE,
} from '../../src/types/track-all-sam3_1-gpu-invocation'
import {
  TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_ROUTE,
} from '../../src/types/track-all-sam3_1-l4-task-qa-gpu-start'
import {
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE,
} from '../../src/types/track-all-sam3_1-caption-evidence-finalization'
import {
  TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_ROUTE,
} from '../../src/types/track-all-sam3_1-task-qa-evidence-finalization'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import {
  requireStrictInternalServiceAuth,
} from '../middleware/internal-service-auth'
import {
  parseTrackAllSam31AuthenticatedGpuInvocationRequest,
  parseTrackAllSam31AuthenticatedGpuStartRequest,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  parseTrackAllSam31L4TaskQaGpuStartRequest,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-authenticated-start-service'
import {
  parseTrackAllSam31CaptionEvidenceFinalizationRequest,
} from '../services/canonical-track-all-sam3_1-caption-evidence-finalization-service'
import {
  parseTrackAllSam31TaskQaEvidenceFinalizationRequest,
} from '../services/canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

/**
 * Internal Orchestra/Track All start boundary. The request carries only the
 * exact approved snapshot and work identity. All media, prompt, SAM release,
 * A100/L4 placement, account-effective price, lease, funding, and cloud-job
 * identity is reread or derived by the canonical backend.
 */
export function createTrackAllSam31Routes(): Router {
  const router = Router()
  router.post(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseInvocationRequestBody(request.body)
      const context = getServiceContext(request)
      const runtime =
        context.trackAllSam31AuthenticatedGpuInvocationRuntimePort
      if (!runtime) throw new ApiError(
        'TOOL_NOT_READY',
        'The current Track All SAM 3.1 A100 endpoint runtime is not released.',
        503,
        { requiredGate: 'track_all_sam3_1_current_a100_endpoint_release' },
      )
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Authenticated user context is required.',
        401,
      )
      const idempotencyKey = getIdempotencyKey(request)
      if (body.requestId !== idempotencyKey) throw new ApiError(
        'IDEMPOTENCY_KEY_MISMATCH',
        'The Track All SAM 3.1 invocation must use its exact request ID.',
        409,
      )
      const result = await runtime.invokeApprovedTrackAllWork({
        authenticatedOwnerUserId: context.auth.userId,
        workspaceId: getRouteParam(request, 'workspaceId'),
        idempotencyKey,
        request: body,
      })
      sendOk(response, { invocation: result }, [
        'The canonical backend reread the approved Track All work, funding, account-effective A100 serving price, qualified SAM 3.1 release, current endpoint readiness, and fixed server task before one user-triggered dedicated-endpoint invocation. It did not create a historical A100 Cloud Job or accept caller-selected media, model, endpoint, GPU, image, command, or price.',
      ], 202)
    }),
  )
  router.post(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseRequestBody(request.body)
      const context = getServiceContext(request)
      const runtime = context.trackAllSam31AuthenticatedGpuStartRuntimePort
      if (!runtime) throw new ApiError(
        'TOOL_NOT_READY',
        'The canonical Track All SAM 3.1 funded GPU runtime is not released.',
        503,
        { requiredGate: 'track_all_sam3_1_funded_gpu_runtime_release' },
      )
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Authenticated user context is required.',
        401,
      )
      const idempotencyKey = getIdempotencyKey(request)
      if (body.requestId !== idempotencyKey) throw new ApiError(
        'IDEMPOTENCY_KEY_MISMATCH',
        'The Track All SAM 3.1 request must use its exact request ID as the idempotency key.',
        409,
      )
      const result = await runtime.startApprovedTrackAllWork({
        authenticatedOwnerUserId: context.auth.userId,
        workspaceId: getRouteParam(request, 'workspaceId'),
        idempotencyKey,
        request: body,
      })
      sendOk(response, { start: result }, [
        'The canonical backend reread the approved Track All work, funding, account-effective prices, qualified SAM 3.1 release, and server-owned task material before starting one scale-from-zero GPU job. No browser-selected model, media, command, GPU route, or price was accepted.',
      ], 202)
    }),
  )
  router.post(
    TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseL4TaskQaStartRequestBody(request.body)
      const context = getServiceContext(request)
      const runtime =
        context.trackAllSam31L4TaskQaAuthenticatedStartRuntimePort
      if (!runtime) throw new ApiError(
        'TOOL_NOT_READY',
        'The canonical Track All L4 mask-QA GPU runtime is not released.',
        503,
        { requiredGate: 'track_all_sam3_1_l4_task_qa_gpu_runtime_release' },
      )
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Authenticated user context is required.',
        401,
      )
      const idempotencyKey = getIdempotencyKey(request)
      if (body.requestId !== idempotencyKey) throw new ApiError(
        'IDEMPOTENCY_KEY_MISMATCH',
        'The Track All L4 task-QA request must use its exact request ID.',
        409,
      )
      const result = await runtime.startApprovedTaskQaWork({
        authenticatedOwnerUserId: context.auth.userId,
        workspaceId: getRouteParam(request, 'workspaceId'),
        idempotencyKey,
        request: body,
      })
      sendOk(response, { start: result }, [
        'The canonical backend reread the approved L4 QA work, funding, account-effective price, admitted SAM result, and exact private mask manifest before persisting one fixed task and starting one scale-from-zero L4 job. No mask bytes, path, command, image, GPU route, environment, or price was accepted from the caller.',
      ], 202)
    }),
  )
  router.post(
    TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseTaskQaFinalizationRequestBody(request.body)
      const context = getServiceContext(request)
      const runtime =
        context.trackAllSam31TaskQaEvidenceFinalizationRuntimePort
      if (!runtime) throw new ApiError(
        'TOOL_NOT_READY',
        'The canonical Track All SAM 3.1 task-QA evidence finalizer is not released.',
        503,
        { requiredGate: 'track_all_sam3_1_task_qa_evidence_release' },
      )
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Authenticated user context is required.',
        401,
      )
      const idempotencyKey = getIdempotencyKey(request)
      if (body.requestId !== idempotencyKey) throw new ApiError(
        'IDEMPOTENCY_KEY_MISMATCH',
        'The Track All task-QA finalization request must use its exact request ID as the idempotency key.',
        409,
      )
      const result = await runtime.finalizeTaskQaEvidence({
        authenticatedOwnerUserId: context.auth.userId,
        workspaceId: getRouteParam(request, 'workspaceId'),
        idempotencyKey,
        request: body,
      })
      sendOk(response, { taskQaEvidence: result }, [
        'The canonical backend accepted only immutable references, then reread the admitted SAM 3.1 result, private L4 worker output, exact L4 launch/envelope/terminal usage and cost lineage, and independent private review before persisting the final measurement and review. It performed no GPU work, asset mutation, billing, QA approval, or delivery.',
      ])
    }),
  )
  router.post(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseFinalizationRequestBody(request.body)
      const context = getServiceContext(request)
      const runtime =
        context.trackAllSam31CaptionEvidenceFinalizationRuntimePort
      if (!runtime) throw new ApiError(
        'TOOL_NOT_READY',
        'The canonical Track All SAM 3.1 Caption evidence finalizer is not released.',
        503,
        { requiredGate: 'track_all_sam3_1_caption_evidence_finalizer_release' },
      )
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Authenticated user context is required.',
        401,
      )
      const idempotencyKey = getIdempotencyKey(request)
      if (body.requestId !== idempotencyKey) throw new ApiError(
        'IDEMPOTENCY_KEY_MISMATCH',
        'The Track All Caption finalization request must use its exact request ID as the idempotency key.',
        409,
      )
      const result = await runtime.finalizeCaptionEvidence({
        authenticatedOwnerUserId: context.auth.userId,
        workspaceId: getRouteParam(request, 'workspaceId'),
        idempotencyKey,
        request: body,
      })
      sendOk(response, { finalization: result }, [
        'The canonical backend reread the admitted SAM 3.1 result, separately persisted L4 mask-QA measurement, and independent complete-scene private review before creating the byte-free specialist-resume projection. No evidence, media, GPU work, asset mutation, billing, or QA approval was accepted from the caller.',
      ])
    }),
  )
  return router
}

function parseInvocationRequestBody(value: unknown) {
  try {
    return parseTrackAllSam31AuthenticatedGpuInvocationRequest(value)
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The Track All SAM 3.1 endpoint invocation request is invalid.',
      400,
    )
  }
}

function parseRequestBody(value: unknown) {
  try {
    return parseTrackAllSam31AuthenticatedGpuStartRequest(value)
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The Track All SAM 3.1 start request is invalid.',
      400,
    )
  }
}

function parseL4TaskQaStartRequestBody(value: unknown) {
  try {
    return parseTrackAllSam31L4TaskQaGpuStartRequest(value)
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The Track All SAM 3.1 L4 task-QA start request is invalid.',
      400,
    )
  }
}

function parseFinalizationRequestBody(value: unknown) {
  try {
    return parseTrackAllSam31CaptionEvidenceFinalizationRequest(value)
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The Track All SAM 3.1 Caption evidence finalization request is invalid.',
      400,
    )
  }
}

function parseTaskQaFinalizationRequestBody(value: unknown) {
  try {
    return parseTrackAllSam31TaskQaEvidenceFinalizationRequest(value)
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The Track All SAM 3.1 task-QA evidence finalization request is invalid.',
      400,
    )
  }
}
