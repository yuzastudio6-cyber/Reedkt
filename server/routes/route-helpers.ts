import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import type { RuntimeRequest, ServiceContext } from '../types'

export function asyncRoute(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next)
  }
}

export function sendOk(response: Response, data: unknown, warnings: string[] = [], status = 200): void {
  response.status(status).json({ ok: true, data, warnings })
}

export function getServiceContext(request: Request): ServiceContext {
  const runtimeRequest = request as RuntimeRequest
  if (!runtimeRequest.runtime) {
    throw new ApiError('INTERNAL_ERROR', 'Runtime state is missing from request.', 500)
  }

  return {
    env: runtimeRequest.runtime.env,
    clients: runtimeRequest.runtime.clients,
    requestId: runtimeRequest.context?.requestId ?? 'request-unknown',
    auth: runtimeRequest.context?.auth,
    idempotency: runtimeRequest.context?.idempotency,
    storageAdapter: runtimeRequest.runtime.storageAdapter,
    planningPreferenceApplicationAuthorityPort:
      runtimeRequest.runtime.planningPreferenceApplicationAuthorityPort,
    planningExactEditPreferenceAuthorityPort:
      runtimeRequest.runtime.planningExactEditPreferenceAuthorityPort,
    canonicalDurableUploadTargetStatePort:
      runtimeRequest.runtime.canonicalDurableUploadTargetStatePort,
    canonicalUploadTargetCredentialEscrow:
      runtimeRequest.runtime.canonicalUploadTargetCredentialEscrow,
    canonicalDurableUploadTargetRequestAuthorityFactory:
      runtimeRequest.runtime.canonicalDurableUploadTargetRequestAuthorityFactory,
    canonicalPrivateProjectRequestAuthorityFactory:
      runtimeRequest.runtime.canonicalPrivateProjectRequestAuthorityFactory,
    editReferenceStudyChatRuntimePort:
      runtimeRequest.runtime.editReferenceStudyChatRuntimePort,
    canonicalMotionStudioStorytellingProductionAuthorityReaderPort:
      runtimeRequest.runtime.canonicalMotionStudioStorytellingProductionAuthorityReaderPort,
    canonicalMotionStudioAudioCandidateReviewReaderPort:
      runtimeRequest.runtime.canonicalMotionStudioAudioCandidateReviewReaderPort,
    canonicalMotionStudioAudioSelectionTransitionPort:
      runtimeRequest.runtime.canonicalMotionStudioAudioSelectionTransitionPort,
    canonicalVisualCalibrationReferenceFrameReaderPort:
      runtimeRequest.runtime.canonicalVisualCalibrationReferenceFrameReaderPort,
    canonicalProviderAttemptRuntimeRecordSourcePort:
      runtimeRequest.runtime.canonicalProviderAttemptRuntimeRecordSourcePort,
    visualIntelligenceReportRepository:
      runtimeRequest.runtime.visualIntelligenceReportRepository,
    visualIntelligenceOrchestraJobRuntimePort:
      runtimeRequest.runtime.visualIntelligenceOrchestraJobRuntimePort,
    editReferenceVisualIntelligenceBindingStore:
      runtimeRequest.runtime.editReferenceVisualIntelligenceBindingStore,
    editReferenceVisualIntelligenceReadPort:
      runtimeRequest.runtime.editReferenceVisualIntelligenceReadPort,
    motionStudioCommandRepositoryRuntimePort:
      runtimeRequest.runtime.motionStudioCommandRepositoryRuntimePort,
    editReferenceExactEditApplyRuntimePort:
      runtimeRequest.runtime.editReferenceExactEditApplyRuntimePort,
    editReferenceApplicationPreparationRuntimePort:
      runtimeRequest.runtime.editReferenceApplicationPreparationRuntimePort,
    editReferenceLongFormStudyRuntimePort:
      runtimeRequest.runtime.editReferenceLongFormStudyRuntimePort,
    editReferenceLongFormStudyRuntimePortFactory:
      runtimeRequest.runtime.editReferenceLongFormStudyRuntimePortFactory,
    editReferenceDomainRepositoryRuntimePort:
      runtimeRequest.runtime.editReferenceDomainRepositoryRuntimePort,
    editReferenceSignedInPrivateMediaRuntimePort:
      runtimeRequest.runtime.editReferenceSignedInPrivateMediaRuntimePort,
    editReferenceExactEditBriefRuntimePortFactory:
      runtimeRequest.runtime.editReferenceExactEditBriefRuntimePortFactory,
    editReferenceTargetUnderstandingPackageRuntimePortFactory:
      runtimeRequest.runtime
        .editReferenceTargetUnderstandingPackageRuntimePortFactory,
    editBriefPrivateWorkspaceRuntimePort:
      runtimeRequest.runtime.editBriefPrivateWorkspaceRuntimePort,
    kimiK3SourceLedChatAssistantPort:
      runtimeRequest.runtime.kimiK3SourceLedChatAssistantPort,
    canonicalSourceCleanupAuthorityReadPort:
      runtimeRequest.runtime.canonicalSourceCleanupAuthorityReadPort,
    canonicalSourceVisualIntelligenceOrchestraReadPort:
      runtimeRequest.runtime
        .canonicalSourceVisualIntelligenceOrchestraReadPort,
    canonicalSourceLedOrchestraPlanningReconciliationPort:
      runtimeRequest.runtime
        .canonicalSourceLedOrchestraPlanningReconciliationPort,
    trackAllSam31AuthenticatedGpuStartRuntimePort:
      runtimeRequest.runtime.trackAllSam31AuthenticatedGpuStartRuntimePort,
    canonicalCaptionPostrenderVisualQaEvidenceRepository:
      runtimeRequest.runtime
        .canonicalCaptionPostrenderVisualQaEvidenceRepository,
  }
}

export function getIdempotencyKey(request: Request): string {
  const key = (request as RuntimeRequest).context?.idempotency?.key ?? request.header('idempotency-key')?.trim()
  if (!key) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required.', 400)
  return key
}

export function getRouteParam(request: Request, name: string): string {
  const value = request.params[name]
  if (typeof value === 'string' && value.trim()) return value
  throw new ApiError('VALIDATION_FAILED', `Route parameter ${name} is required.`, 400)
}
