import type {
  ApplyMotionStudioCommandRequest,
  ApproveMotionStudioArtifactVersionRequest,
  ArtifactApproval,
  AuthorizeMotionStudioWorkGraphRequest,
  CancelMotionStudioJobRequest,
  AssembleMotionStudioAnimaticRequest,
  CreateMotionStudioAnimaticBindingRequest,
  CreateMotionStudioArtifactVersionRequest,
  CreateMotionStudioProductionRequest,
  CreateMotionStudioSceneDraftRequest,
  CreateMotionStudioTimelineProposalRequest,
  CreateMotionStudioPreviewBindingRequest,
  CreateMotionStudioLayeredAssemblyRequest,
  CreateMotionStudioGenerationBindingRequest,
  CreateMotionStudioAudioMixBindingRequest,
  CreateMotionStudioAudioSelectionRequestV1,
  CreateMotionStudioAudioIntegrationBindingRequestV1,
  MotionStudioArtifactDto,
  MotionStudioAnimaticAssemblyReceiptDto,
  MotionStudioAnimaticBindingDto,
  MotionStudioAnimaticWorkspaceDto,
  MotionStudioAudioWorkspaceDto,
  MotionStudioNarratorPlanningSelectionReceiptDto,
  MotionStudioVoiceCastingWorkspaceDto,
  SelectMotionStudioNarratorForPlanningRequest,
  MotionStudioAudioMixBindingDto,
  MotionStudioAudioMixWorkspaceDto,
  MotionStudioAudioSelectionCommitReceiptDtoV1,
  MotionStudioAudioIntegrationBindingReceiptDtoV1,
  MotionStudioCommandResponseDto,
  MotionStudioProductionDto,
  MotionStudioSceneDraftReceiptDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioTimelineProposalDto,
  MotionStudioPreviewBindingDto,
  MotionStudioPreviewWorkspaceDto,
  MotionStudioResearchWorkspaceDto,
  MotionStudioStoryWorkspaceDto,
  MotionStudioLayeredAssemblyDto,
  MotionStudioLayeredWorkspaceDto,
  MotionStudioGenerationBindingDto,
  MotionStudioGenerationWorkspaceDto,
  MotionStudioLiveCandidateReviewDto,
  MotionStudioLiveGenerationWorkspaceDto,
  ReviewMotionStudioLiveCandidateRequest,
  MotionStudioJobCancellationReceiptDto,
  MotionStudioWorkGraphAuthorizationReceiptDto,
  MotionStudioWorkGraphDto,
  PrepareStorytellingMotionStylePlanRequest,
  PrepareStorytellingMotionStylePlanResponse,
  PrepareStorytellingStoryContinuityRequest,
  PrepareStorytellingStoryContinuityResponse,
  PrepareCanonicalStorytellingPlanningRequest,
  PrepareCanonicalStorytellingPlanningResponse,
} from '../../types/motion-studio'
import { callReeditProApi, getReeditProApiAuthorizationHeader } from './frontend-api-client'
import { getBackendApiBaseUrl, getBackendRuntimeStatus } from './backend-runtime-config'

export const motionStudioApiClient = {
  createProduction(
    projectId: string,
    editSessionId: string,
    request: CreateMotionStudioProductionRequest,
    idempotencyKey: string,
  ) {
    return callReeditProApi<CreateMotionStudioProductionRequest, { production: MotionStudioProductionDto }>(
      'motionStudio.production.create',
      request,
      { params: { projectId, editSessionId }, idempotencyKey },
    )
  },
  getProduction(projectId: string, editSessionId: string) {
    return callReeditProApi<undefined, { production: MotionStudioProductionDto }>(
      'motionStudio.production.get',
      undefined,
      { params: { projectId, editSessionId } },
    )
  },
  createInitialArtifactVersion(productionId: string, request: CreateMotionStudioArtifactVersionRequest, idempotencyKey: string) {
    return callReeditProApi<CreateMotionStudioArtifactVersionRequest, { artifact: MotionStudioArtifactDto }>(
      'motionStudio.artifactVersion.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  getArtifact(productionId: string, artifactId: string) {
    return callReeditProApi<undefined, { artifact: MotionStudioArtifactDto }>(
      'motionStudio.artifact.get',
      undefined,
      { params: { productionId, artifactId } },
    )
  },
  applyCommand(productionId: string, artifactId: string, request: ApplyMotionStudioCommandRequest, idempotencyKey: string) {
    return callReeditProApi<ApplyMotionStudioCommandRequest, MotionStudioCommandResponseDto>(
      'motionStudio.command.apply',
      request,
      { params: { productionId, artifactId }, idempotencyKey },
    )
  },
  approveArtifact(productionId: string, artifactId: string, request: ApproveMotionStudioArtifactVersionRequest, idempotencyKey: string) {
    return callReeditProApi<ApproveMotionStudioArtifactVersionRequest, { approval: ArtifactApproval; artifact: MotionStudioArtifactDto }>(
      'motionStudio.artifact.approve',
      request,
      { params: { productionId, artifactId }, idempotencyKey },
    )
  },
  authorizeWorkGraph(productionId: string, request: AuthorizeMotionStudioWorkGraphRequest, idempotencyKey: string) {
    return callReeditProApi<AuthorizeMotionStudioWorkGraphRequest, {
      authorization: MotionStudioWorkGraphAuthorizationReceiptDto
      workGraph: MotionStudioWorkGraphDto
    }>(
      'motionStudio.workGraph.authorize',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  getWorkGraph(productionId: string) {
    return callReeditProApi<undefined, { workGraph: MotionStudioWorkGraphDto }>(
      'motionStudio.workGraph.get',
      undefined,
      { params: { productionId } },
    )
  },
  getSceneWorkspace(productionId: string) {
    return callReeditProApi<undefined, { sceneWorkspace: MotionStudioSceneWorkspaceDto }>(
      'motionStudio.sceneWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  getResearchWorkspace(productionId: string) {
    return callReeditProApi<undefined, { researchWorkspace: MotionStudioResearchWorkspaceDto }>(
      'motionStudio.researchWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  getStoryWorkspace(productionId: string) {
    return callReeditProApi<undefined, { storyWorkspace: MotionStudioStoryWorkspaceDto }>(
      'motionStudio.storyWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  prepareStorytellingStylePlan(
    productionId: string,
    request: PrepareStorytellingMotionStylePlanRequest,
    idempotencyKey: string,
  ) {
    return callReeditProApi<PrepareStorytellingMotionStylePlanRequest, PrepareStorytellingMotionStylePlanResponse>(
      'motionStudio.storytellingStylePlanPreparation.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  prepareStorytellingStoryContinuity(
    productionId: string,
    request: PrepareStorytellingStoryContinuityRequest,
    idempotencyKey: string,
  ) {
    return callReeditProApi<
      PrepareStorytellingStoryContinuityRequest,
      PrepareStorytellingStoryContinuityResponse
    >(
      'motionStudio.storyContinuityPreparation.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  prepareCanonicalStorytellingPlanning(
    productionId: string,
    request: PrepareCanonicalStorytellingPlanningRequest,
    idempotencyKey: string,
  ) {
    return callReeditProApi<
      PrepareCanonicalStorytellingPlanningRequest,
      PrepareCanonicalStorytellingPlanningResponse
    >(
      'motionStudio.canonicalStorytellingPlanningPreparation.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  getAudioWorkspace(productionId: string) {
    return callReeditProApi<undefined, { audioWorkspace: MotionStudioAudioWorkspaceDto }>(
      'motionStudio.audioWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  getVoiceCastingWorkspace(productionId: string) {
    return callReeditProApi<undefined, { voiceCastingWorkspace: MotionStudioVoiceCastingWorkspaceDto }>(
      'motionStudio.voiceCastingWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  selectNarratorForPlanning(
    productionId: string,
    request: SelectMotionStudioNarratorForPlanningRequest,
    idempotencyKey: string,
  ) {
    return callReeditProApi<SelectMotionStudioNarratorForPlanningRequest, {
      receipt: MotionStudioNarratorPlanningSelectionReceiptDto
    }>(
      'motionStudio.voiceCastingSelection.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  getAudioMixWorkspace(productionId: string) {
    return callReeditProApi<undefined, { audioMixWorkspace: MotionStudioAudioMixWorkspaceDto }>(
      'motionStudio.audioMixWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  createAudioMixBinding(
    productionId: string,
    request: CreateMotionStudioAudioMixBindingRequest,
    idempotencyKey: string,
  ) {
    return callReeditProApi<CreateMotionStudioAudioMixBindingRequest, {
      binding: MotionStudioAudioMixBindingDto
      audioMixWorkspace: MotionStudioAudioMixWorkspaceDto
    }>(
      'motionStudio.audioMixBinding.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  createAudioSelection(
    productionId: string,
    request: CreateMotionStudioAudioSelectionRequestV1,
    idempotencyKey: string,
  ) {
    return callReeditProApi<CreateMotionStudioAudioSelectionRequestV1, {
      selection: MotionStudioAudioSelectionCommitReceiptDtoV1
    }>(
      'motionStudio.audioSelection.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  createAudioIntegrationBinding(
    productionId: string,
    request: CreateMotionStudioAudioIntegrationBindingRequestV1,
    idempotencyKey: string,
  ) {
    return callReeditProApi<CreateMotionStudioAudioIntegrationBindingRequestV1, {
      binding: MotionStudioAudioIntegrationBindingReceiptDtoV1
    }>(
      'motionStudio.audioIntegrationBinding.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  getPreviewWorkspace(productionId: string) {
    return callReeditProApi<undefined, { previewWorkspace: MotionStudioPreviewWorkspaceDto }>(
      'motionStudio.previewWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  getGenerationWorkspace(productionId: string) {
    return callReeditProApi<undefined, { generationWorkspace: MotionStudioGenerationWorkspaceDto }>(
      'motionStudio.generationWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  getLiveGenerationWorkspace(productionId: string) {
    return callReeditProApi<undefined, { liveGenerationWorkspace: MotionStudioLiveGenerationWorkspaceDto }>(
      'motionStudio.liveGenerationWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  reviewLiveCandidate(candidateId: string, request: ReviewMotionStudioLiveCandidateRequest, idempotencyKey: string) {
    return callReeditProApi<ReviewMotionStudioLiveCandidateRequest, {
      candidateReview: MotionStudioLiveCandidateReviewDto
      liveGenerationWorkspace: MotionStudioLiveGenerationWorkspaceDto
      automaticFallbackSubmitted: false
    }>(
      'motionStudio.liveCandidateReview.create',
      request,
      { params: { candidateId }, idempotencyKey },
    )
  },
  createGenerationBinding(productionId: string, request: CreateMotionStudioGenerationBindingRequest, idempotencyKey: string) {
    return callReeditProApi<CreateMotionStudioGenerationBindingRequest, {
      binding: MotionStudioGenerationBindingDto
      generationWorkspace: MotionStudioGenerationWorkspaceDto
    }>(
      'motionStudio.generationBinding.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  createRenderBinding(productionId: string, request: CreateMotionStudioPreviewBindingRequest, idempotencyKey: string) {
    return callReeditProApi<CreateMotionStudioPreviewBindingRequest, {
      binding: MotionStudioPreviewBindingDto
      previewWorkspace: MotionStudioPreviewWorkspaceDto
    }>(
      'motionStudio.renderBinding.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  getLayeredWorkspace(productionId: string) {
    return callReeditProApi<undefined, { layeredWorkspace: MotionStudioLayeredWorkspaceDto }>(
      'motionStudio.layeredWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  createLayeredAssembly(productionId: string, request: CreateMotionStudioLayeredAssemblyRequest, idempotencyKey: string) {
    return callReeditProApi<CreateMotionStudioLayeredAssemblyRequest, {
      assembly: MotionStudioLayeredAssemblyDto
      layeredWorkspace: MotionStudioLayeredWorkspaceDto
    }>(
      'motionStudio.layeredAssembly.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  getAnimaticWorkspace(productionId: string) {
    return callReeditProApi<undefined, { animaticWorkspace: MotionStudioAnimaticWorkspaceDto }>(
      'motionStudio.animaticWorkspace.get',
      undefined,
      { params: { productionId } },
    )
  },
  assembleAnimatic(productionId: string, request: AssembleMotionStudioAnimaticRequest, idempotencyKey: string) {
    return callReeditProApi<AssembleMotionStudioAnimaticRequest, { assembly: MotionStudioAnimaticAssemblyReceiptDto }>(
      'motionStudio.animaticAssembly.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  createAnimaticBinding(productionId: string, request: CreateMotionStudioAnimaticBindingRequest, idempotencyKey: string) {
    return callReeditProApi<CreateMotionStudioAnimaticBindingRequest, {
      binding: MotionStudioAnimaticBindingDto
      animaticWorkspace: MotionStudioAnimaticWorkspaceDto
    }>(
      'motionStudio.animaticBinding.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  createSceneDraft(productionId: string, request: CreateMotionStudioSceneDraftRequest, idempotencyKey: string) {
    return callReeditProApi<CreateMotionStudioSceneDraftRequest, {
      receipt: MotionStudioSceneDraftReceiptDto
      sceneWorkspace: MotionStudioSceneWorkspaceDto
    }>(
      'motionStudio.sceneDraft.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  createTimelineProposal(productionId: string, request: CreateMotionStudioTimelineProposalRequest, idempotencyKey: string) {
    return callReeditProApi<CreateMotionStudioTimelineProposalRequest, {
      proposal: MotionStudioTimelineProposalDto
      sceneWorkspace: MotionStudioSceneWorkspaceDto
    }>(
      'motionStudio.timelineProposal.create',
      request,
      { params: { productionId }, idempotencyKey },
    )
  },
  cancelJob(jobId: string, request: CancelMotionStudioJobRequest, idempotencyKey: string) {
    return callReeditProApi<CancelMotionStudioJobRequest, { cancellation: MotionStudioJobCancellationReceiptDto }>(
      'motionStudio.job.cancel',
      request,
      { params: { jobId }, idempotencyKey },
    )
  },
}

export type MotionStudioPrivatePreviewMediaResult =
  | { ok: true; blob: Blob }
  | { ok: false; message: string; statusCode: number }

export async function fetchMotionStudioPrivatePreviewMedia(
  artifactId: string,
  expectedSha256: string,
  expectedByteLength: number,
): Promise<MotionStudioPrivatePreviewMediaResult> {
  return fetchVerifiedMotionStudioPrivateMedia(
    `/v1/motion-studio/preview-artifacts/${encodeURIComponent(artifactId)}/content`,
    expectedSha256,
    expectedByteLength,
    'preview',
  )
}

export async function fetchMotionStudioPrivateAnimaticMedia(
  artifactId: string,
  expectedSha256: string,
  expectedByteLength: number,
): Promise<MotionStudioPrivatePreviewMediaResult> {
  return fetchVerifiedMotionStudioPrivateMedia(
    `/v1/motion-studio/animatic-artifacts/${encodeURIComponent(artifactId)}/content`,
    expectedSha256,
    expectedByteLength,
    'animatic',
  )
}

export async function fetchMotionStudioPrivateAudioMix(
  artifactId: string,
  expectedSha256: string,
  expectedByteLength: number,
): Promise<MotionStudioPrivatePreviewMediaResult> {
  return fetchVerifiedMotionStudioPrivateMedia(
    `/v1/motion-studio/audio-mix-artifacts/${encodeURIComponent(artifactId)}/content`,
    expectedSha256,
    expectedByteLength,
    'Storytelling audio mix',
    'audio/wav',
  )
}

export async function fetchMotionStudioPrivateAudioCandidate(
  candidateReference: string,
  expectedSha256: string,
  expectedByteLength: number,
): Promise<MotionStudioPrivatePreviewMediaResult> {
  return fetchVerifiedMotionStudioPrivateMedia(
    `/v1/motion-studio/audio-candidates/${encodeURIComponent(candidateReference)}/content`,
    expectedSha256,
    expectedByteLength,
    'Storytelling audio candidate',
    'audio/wav',
  )
}

export async function fetchMotionStudioPrivateGeneratedMedia(
  assetVersionId: string,
  expectedMimeType: 'image/png' | 'video/mp4',
  expectedSha256: string,
  expectedByteLength: number,
): Promise<MotionStudioPrivatePreviewMediaResult> {
  return fetchVerifiedMotionStudioPrivateMedia(
    `/v1/motion-studio/media-asset-versions/${encodeURIComponent(assetVersionId)}/content`,
    expectedSha256,
    expectedByteLength,
    'generated-media candidate',
    expectedMimeType,
  )
}

async function fetchVerifiedMotionStudioPrivateMedia(
  path: string,
  expectedSha256: string,
  expectedByteLength: number,
  label: string,
  expectedMimeType: 'image/png' | 'video/mp4' | 'audio/wav' = 'video/mp4',
): Promise<MotionStudioPrivatePreviewMediaResult> {
  const runtime = getBackendRuntimeStatus()
  const apiBaseUrl = getBackendApiBaseUrl()
  if (runtime.mockOnly || runtime.mode === 'mock' || !apiBaseUrl) {
    return { ok: false, message: `Private ${label} playback requires the reviewed backend HTTP runtime.`, statusCode: 503 }
  }
  try {
    const authorization = await getReeditProApiAuthorizationHeader()
    const response = await fetch(new URL(path, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`), {
      method: 'GET',
      credentials: 'omit',
      headers: { accept: expectedMimeType, ...(authorization ? { authorization } : {}) },
    })
    if (!response.ok) return { ok: false, message: `Private ${label} request failed with status ${response.status}.`, statusCode: response.status }
    if (response.headers.get('content-type')?.split(';')[0].trim() !== expectedMimeType) {
      return { ok: false, message: `Private ${label} response had the wrong media type.`, statusCode: 502 }
    }
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength !== expectedByteLength || !globalThis.crypto?.subtle) {
      return { ok: false, message: `Private ${label} byte authority could not be verified.`, statusCode: 409 }
    }
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    const actualSha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
    if (actualSha256 !== expectedSha256) {
      return { ok: false, message: `Private ${label} bytes failed checksum verification.`, statusCode: 409 }
    }
    return { ok: true, blob: new Blob([bytes], { type: expectedMimeType }) }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `Private ${label} transport failed.`,
      statusCode: 503,
    }
  }
}
