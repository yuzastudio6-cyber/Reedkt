import type {
  ApproveEditReferenceDNAVersionRequest,
  AppendPreferenceStudyMessageRequest,
  ConnectPreferenceApplicationRequest,
  CreatePreferenceApplicationRequest,
  CreatePreferenceEvidenceRequest,
  CreateEditReferenceRequest,
  CreatePreferenceStudyRequest,
  EditReferenceApiResult,
  EditReferenceDetailData,
  EditReferenceListData,
  EditReferenceMessageData,
  PreferenceApplicationListData,
  PreferenceStudyData,
  PreferenceStudyMessageListData,
  RunEditReferenceDNAQARequest,
  RunPreferenceEvidenceStudyRequest,
  SynthesizePreferenceDNARequest,
  UpdateEditReferenceRequest,
  UpdatePreferenceStudyRequest,
} from '../types/edit-reference'

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
  runEvidenceStudy(studyId: string, input: RunPreferenceEvidenceStudyRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  synthesizePreferenceDNA(studyId: string, input: SynthesizePreferenceDNARequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  runPreferenceDNAQA(studyId: string, dnaVersionId: string, input: RunEditReferenceDNAQARequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  approvePreferenceDNA(studyId: string, dnaVersionId: string, input: ApproveEditReferenceDNAVersionRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  createPreferenceApplication(studyId: string, dnaVersionId: string, input: CreatePreferenceApplicationRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
  connectPreferenceApplication(applicationId: string, input: ConnectPreferenceApplicationRequest, idempotencyKey?: string): Promise<EditReferenceApiResult<EditReferenceDetailData>>
}

export function createEditReferenceApiClient(
  configuredBaseUrl = import.meta.env.VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL as string | undefined,
): EditReferenceApiClient {
  const baseUrl = configuredBaseUrl?.trim().replace(/\/$/, '')
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
      runEvidenceStudy: unavailable,
      synthesizePreferenceDNA: unavailable,
      runPreferenceDNAQA: unavailable,
      approvePreferenceDNA: unavailable,
      createPreferenceApplication: unavailable,
      connectPreferenceApplication: unavailable,
    }
  }

  const request = async <T>(path: string, init?: RequestInit): Promise<EditReferenceApiResult<T>> => {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          accept: 'application/json',
          ...(init?.body ? { 'content-type': 'application/json' } : {}),
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
    runEvidenceStudy: (studyId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/evidence-study`, 'POST', input, key),
    synthesizePreferenceDNA: (studyId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna`, 'POST', input, key),
    runPreferenceDNAQA: (studyId, dnaVersionId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna/${encodeURIComponent(dnaVersionId)}/qa`, 'POST', input, key),
    approvePreferenceDNA: (studyId, dnaVersionId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna/${encodeURIComponent(dnaVersionId)}/approve`, 'POST', input, key),
    createPreferenceApplication: (studyId, dnaVersionId, input, key) => mutation(`/v1/edit-reference-studies/${encodeURIComponent(studyId)}/preference-dna/${encodeURIComponent(dnaVersionId)}/applications`, 'POST', input, key),
    connectPreferenceApplication: (applicationId, input, key) => mutation(`/v1/edit-reference-applications/${encodeURIComponent(applicationId)}/connect`, 'POST', input, key),
  }
}

function newIdempotencyKey(): string {
  return `edit-reference-browser-${crypto.randomUUID()}`
}
