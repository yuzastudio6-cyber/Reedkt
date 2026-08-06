import type {
  ApproveEditReferenceDNAVersionRequest,
  AppendPreferenceStudyMessageRequest,
  ClearPreferenceApplicationRequest,
  ConnectPreferenceApplicationRequest,
  CreatePreferenceApplicationRequest,
  CreatePreferenceEvidenceRequest,
  CreateEditReferenceRequest,
  CreatePreferenceStudyRequest,
  ControlEditReferenceLongFormStudyRequest,
  EditReferenceApiResult,
  EditReferenceDetailData,
  EditReferenceLongFormStudyStatusData,
  EditReferenceLongFormStudyControlData,
  EditReferenceListData,
  EditReferenceMessageData,
  PreferenceApplicationListData,
  PreferenceStudyData,
  PreferenceStudyMessageListData,
  RunEditReferenceDNAQARequest,
  RunPreferenceEvidenceStudyRequest,
  StartEditReferenceLongFormStudyRequest,
  SynthesizePreferenceDNARequest,
  UpdateEditReferenceRequest,
  UpdatePreferenceStudyRequest,
} from '../types/edit-reference'
import type {
  ReadTargetVideoUnderstandingRequest,
  StartTargetVideoUnderstandingRequest,
  TargetVideoUnderstandingApiData,
} from '../types/edit-reference-target-video-understanding'
import type {
  ApplyEditReferenceLongFormStudyReviewRequest,
  EditReferenceLongFormStudyReviewData,
  EditReferenceLongFormStudyReviewSelectionData,
} from '../types/edit-reference-long-form-review'
import { getSupabaseClient } from '../backend/supabase/supabase-client'

interface ApiEnvelope<T> {
  ok: true
  data: T
  warnings: string[]
}

interface ApiErrorEnvelope {
  error?: {
    code?: string
    message?: string
    status?: number
    details?: unknown
  }
}

export interface EditReferenceApiClient {
  available: boolean
  list(workspaceId: string): Promise<EditReferenceApiResult<EditReferenceListData>>
  listApplications(workspaceId: string): Promise<EditReferenceApiResult<PreferenceApplicationListData>>
  get(workspaceId: string, referenceId: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  getStudy(workspaceId: string, studyId: string): Promise<EditReferenceApiResult<PreferenceStudyData>>
  listStudyMessages(workspaceId: string, studyId: string): Promise<EditReferenceApiResult<PreferenceStudyMessageListData>>
  create(input: CreateEditReferenceRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  update(referenceId: string, input: UpdateEditReferenceRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  createStudy(referenceId: string, input: CreatePreferenceStudyRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  updateStudy(studyId: string, input: UpdatePreferenceStudyRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  appendMessage(studyId: string, input: AppendPreferenceStudyMessageRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceMessageData>>
  addEvidence(studyId: string, input: CreatePreferenceEvidenceRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  startLongFormStudy(studyId: string, referenceAssetId: string, input: StartEditReferenceLongFormStudyRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceLongFormStudyStatusData>>
  getLongFormStudy(workspaceId: string, studyId: string, referenceAssetId: string): Promise<EditReferenceApiResult<EditReferenceLongFormStudyStatusData>>
  controlLongFormStudy(studyId: string, referenceAssetId: string, input: ControlEditReferenceLongFormStudyRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceLongFormStudyControlData>>
  getLongFormStudyReview(workspaceId: string, studyId: string, referenceAssetId: string): Promise<EditReferenceApiResult<EditReferenceLongFormStudyReviewData>>
  applyLongFormStudyReview(studyId: string, referenceAssetId: string, input: ApplyEditReferenceLongFormStudyReviewRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceLongFormStudyReviewSelectionData>>
  runEvidenceStudy(studyId: string, input: RunPreferenceEvidenceStudyRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  synthesizePreferenceDNA(studyId: string, input: SynthesizePreferenceDNARequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  runPreferenceDNAQA(studyId: string, dnaVersionId: string, input: RunEditReferenceDNAQARequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  approvePreferenceDNA(studyId: string, dnaVersionId: string, input: ApproveEditReferenceDNAVersionRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  startTargetVideoUnderstanding(projectId: string, editSessionId: string, input: StartTargetVideoUnderstandingRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<TargetVideoUnderstandingApiData>>
  getTargetVideoUnderstanding(projectId: string, editSessionId: string, input: ReadTargetVideoUnderstandingRequest): Promise<EditReferenceApiResult<TargetVideoUnderstandingApiData>>
  createPreferenceApplication(studyId: string, dnaVersionId: string, input: CreatePreferenceApplicationRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  connectPreferenceApplication(applicationId: string, input: ConnectPreferenceApplicationRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  clearPreferenceApplication(applicationId: string, input: ClearPreferenceApplicationRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
}

export function createEditReferenceApiClient(
  configuredBaseUrl?: string,
  getAccessToken: () => Promise<string | undefined> = getSupabaseAccessToken,
): EditReferenceApiClient {
  const baseUrl = (
    configuredBaseUrl
    ?? import.meta.env?.VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL as string | undefined
    ?? import.meta.env?.VITE_REEDITPRO_API_BASE_URL as string | undefined
  )?.trim().replace(/\/$/, '')
  const unavailable = <T>(): Promise<EditReferenceApiResult<T>> => Promise.resolve({
    ok: false,
    status: 503,
    code: 'EDIT_REFERENCE_BACKEND_UNAVAILABLE',
    message: 'The private Edit Reference backend is not configured for this browser runtime.',
  })

  if (!baseUrl) {
    return {
      available: false,
      list: unavailable,
      listApplications: unavailable,
      get: unavailable,
      getStudy: unavailable,
      listStudyMessages: unavailable,
      create: unavailable,
      update: unavailable,
      createStudy: unavailable,
      updateStudy: unavailable,
      appendMessage: unavailable,
      addEvidence: unavailable,
      startLongFormStudy: unavailable,
      getLongFormStudy: unavailable,
      controlLongFormStudy: unavailable,
      getLongFormStudyReview: unavailable,
      applyLongFormStudyReview: unavailable,
      runEvidenceStudy: unavailable,
      synthesizePreferenceDNA: unavailable,
      runPreferenceDNAQA: unavailable,
      approvePreferenceDNA: unavailable,
      startTargetVideoUnderstanding: unavailable,
      getTargetVideoUnderstanding: unavailable,
      createPreferenceApplication: unavailable,
      connectPreferenceApplication: unavailable,
      clearPreferenceApplication: unavailable,
    }
  }

  const request = async <T>(path: string, init?: RequestInit): Promise<EditReferenceApiResult<T>> => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          accept: 'application/json',
          ...(init?.body ? { 'content-type': 'application/json' } : {}),
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
          ...(init?.headers ?? {}),
        },
      })
      const payload = await response.json().catch(() => undefined) as ApiEnvelope<T> | ApiErrorEnvelope | undefined
      if (!response.ok) {
        const error = payload && 'error' in payload ? payload.error : undefined
        return {
          ok: false,
          status: response.status,
          code: error?.code ?? 'EDIT_REFERENCE_REQUEST_FAILED',
          message: error?.message ?? 'Edit Reference request failed.',
          ...(error?.details === undefined ? {} : { details: error.details }),
        }
      }
      if (!payload || !('ok' in payload) || payload.ok !== true) {
        return { ok: false, status: 502, code: 'EDIT_REFERENCE_RESPONSE_INVALID', message: 'Edit Reference returned an invalid response.' }
      }
      return { ok: true, data: payload.data, warnings: payload.warnings ?? [] }
    } catch (error) {
      return {
        ok: false,
        status: 503,
        code: 'EDIT_REFERENCE_NETWORK_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Edit Reference backend could not be reached.',
      }
    }
  }

  const mutation = <T>(path: string, method: 'POST' | 'PATCH', body: unknown, idempotencyKey?: string) => request<T>(path, {
    method,
    headers: { 'idempotency-key': idempotencyKey ?? newIdempotencyKey() },
    body: JSON.stringify(body),
  })

  return {
    available: true,
    list: (workspaceId) => request(`/v1/edit-references?${new URLSearchParams({ workspaceId })}`),
    listApplications: (workspaceId) => request(`/v1/edit-reference-applications?${new URLSearchParams({ workspaceId })}`),
    get: (workspaceId, referenceId) => request(`/v1/edit-references/${encodeURIComponent(referenceId)}?${new URLSearchParams({ workspaceId })}`),
    getStudy: (workspaceId, studyId) => request(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}?${new URLSearchParams({ workspaceId })}`),
    listStudyMessages: (workspaceId, studyId) => request(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/messages?${new URLSearchParams({ workspaceId })}`),
    create: (input, key) => mutation('/v1/edit-references', 'POST', input, key),
    update: (referenceId, input, key) => mutation(`/v1/edit-references/${encodeURIComponent(referenceId)}`, 'PATCH', input, key),
    createStudy: (referenceId, input, key) => mutation(`/v1/edit-references/${encodeURIComponent(referenceId)}/studies`, 'POST', input, key),
    updateStudy: (studyId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}`, 'PATCH', input, key),
    appendMessage: (studyId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/messages`, 'POST', input, key),
    addEvidence: (studyId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/evidence`, 'POST', input, key),
    startLongFormStudy: (studyId, referenceAssetId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/assets/${encodeURIComponent(referenceAssetId)}/long-form-study`, 'POST', input, key),
    getLongFormStudy: (workspaceId, studyId, referenceAssetId) => request(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/assets/${encodeURIComponent(referenceAssetId)}/long-form-study?${new URLSearchParams({ workspaceId })}`),
    controlLongFormStudy: (studyId, referenceAssetId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/assets/${encodeURIComponent(referenceAssetId)}/long-form-study/control`, 'POST', input, key),
    getLongFormStudyReview: (workspaceId, studyId, referenceAssetId) => request(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/assets/${encodeURIComponent(referenceAssetId)}/long-form-study/review?${new URLSearchParams({ workspaceId })}`),
    applyLongFormStudyReview: (studyId, referenceAssetId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/assets/${encodeURIComponent(referenceAssetId)}/long-form-study/review`, 'POST', input, key),
    runEvidenceStudy: (studyId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/evidence-study`, 'POST', input, key),
    synthesizePreferenceDNA: (studyId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna`, 'POST', input, key),
    runPreferenceDNAQA: (studyId, dnaVersionId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna/${encodeURIComponent(dnaVersionId)}/qa`, 'POST', input, key),
    approvePreferenceDNA: (studyId, dnaVersionId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna/${encodeURIComponent(dnaVersionId)}/approve`, 'POST', input, key),
    startTargetVideoUnderstanding: (projectId, editSessionId, input, key) => mutation(`/v1/projects/${encodeURIComponent(projectId)}/edit-sessions/${encodeURIComponent(editSessionId)}/edit-reference-target-understanding`, 'POST', input, key),
    getTargetVideoUnderstanding: (projectId, editSessionId, input) => request(`/v1/projects/${encodeURIComponent(projectId)}/edit-sessions/${encodeURIComponent(editSessionId)}/edit-reference-target-understanding?${new URLSearchParams({
      workspaceId: input.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studySessionId,
      sourceStorageObjectRecordId: input.sourceStorageObjectRecordId,
      sourceMediaAssetId: input.sourceMediaAssetId,
      expectedEditBriefRevision: String(input.expectedEditBriefRevision),
      expectedEditBriefDigestSha256: input.expectedEditBriefDigestSha256,
    })}`),
    createPreferenceApplication: (studyId, dnaVersionId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna/${encodeURIComponent(dnaVersionId)}/applications`, 'POST', input, key),
    connectPreferenceApplication: (applicationId, input, key) => mutation(`/v1/edit-reference-applications/${encodeURIComponent(applicationId)}/connect`, 'POST', input, key),
    clearPreferenceApplication: (applicationId, input, key) => mutation(`/v1/edit-reference-applications/${encodeURIComponent(applicationId)}/clear`, 'POST', input, key),
  }
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  try {
    const client = getSupabaseClient()
    if (!client) return undefined
    const { data } = await client.auth.getSession()
    return data.session?.access_token
  } catch {
    return undefined
  }
}

function newIdempotencyKey(): string {
  return `edit-reference-browser-${crypto.randomUUID()}`
}
