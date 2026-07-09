import { getSupabaseClient } from '../backend/supabase/supabase-client'
import type {
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoPreviewReviewResult,
} from '../types/project-source-video'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

interface PreviewReviewData {
  previewReview: {
    id: string
    renderId?: string
    render_id?: string
    workspaceId?: string
    workspace_id?: string
    reviewStatus?: string
    review_status?: string
    notes?: string
    createdAt?: string
    created_at?: string
    mockOnly?: true
  }
}

export interface CreateProjectSourceVideoPreviewReviewInput {
  apiBaseUrl: string
  notes?: string
  previewResult: ProjectSourceVideoLocalEditPreviewResult
  reviewStatus: 'approved' | 'changes_requested'
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function createIdempotencyKey(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`
}

function createHeaders(input: Record<string, string | undefined>): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(input)) {
    if (value) headers.set(key, value)
  }
  return headers
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  const client = getSupabaseClient()
  if (!client) return undefined
  const { data } = await client.auth.getSession()
  return data.session?.access_token
}

async function parseEnvelope<TData>(response: Response): Promise<ApiEnvelope<TData>> {
  const payload = await response.json().catch(() => undefined)
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: {
        code: 'PREVIEW_REVIEW_BAD_RESPONSE',
        message: 'Preview review backend returned a non-JSON response.',
      },
    }
  }
  return payload as ApiEnvelope<TData>
}

function assertOk<TData>(envelope: ApiEnvelope<TData>, fallback: string): TData {
  if (!envelope.ok || !envelope.data) {
    throw new Error(envelope.error?.message ?? fallback)
  }
  return envelope.data
}

function assertSafeNotes(notes: string | undefined): string | undefined {
  const trimmed = notes?.trim()
  if (!trimmed) return undefined
  if (/service.?role|api.?key|secret|signed.?url|token|sk-[a-z0-9_-]+/i.test(trimmed)) {
    throw new Error('Preview review notes contain secret-like or signed URL text.')
  }
  return trimmed
}

export async function createProjectSourceVideoPreviewReview(
  input: CreateProjectSourceVideoPreviewReviewInput,
): Promise<ProjectSourceVideoPreviewReviewResult> {
  if (!input.previewResult.renderId) {
    throw new Error('Preview review requires a preview render id.')
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const safeNotes = assertSafeNotes(input.notes)
  const envelope = await parseEnvelope<PreviewReviewData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/renders/${encodeURIComponent(input.previewResult.renderId)}/preview-review`,
  ), {
    method: 'POST',
    headers: createHeaders({
      'Content-Type': 'application/json',
      'idempotency-key': createIdempotencyKey('preview-review'),
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      reviewStatus: input.reviewStatus,
      notes: safeNotes,
    }),
  }))
  const review = assertOk(envelope, 'Preview review failed.').previewReview
  const reviewStatus = review.reviewStatus ?? review.review_status
  if (reviewStatus !== 'approved' && reviewStatus !== 'changes_requested') {
    throw new Error('Preview review returned an unsupported status.')
  }

  return {
    id: review.id,
    renderId: review.renderId ?? review.render_id ?? input.previewResult.renderId,
    workspaceId: review.workspaceId ?? review.workspace_id ?? input.workspaceId,
    reviewStatus,
    notes: review.notes ?? safeNotes,
    createdAt: review.createdAt ?? review.created_at,
    mockOnly: review.mockOnly,
    finalExportStarted: false,
    providerCallMade: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: [
      ...(envelope.warnings ?? []),
      'Preview review records the internal tester decision only; it does not start final export, provider calls, workers, Supabase/GCS writes, beta, production, or billing.',
    ],
  }
}
