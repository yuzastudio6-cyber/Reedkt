import { getSupabaseClient } from '../backend/supabase/supabase-client'
import { resolveReceiverSafeFetch } from './receiver-safe-fetch'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

export interface ProjectEditBriefBackendLocalConfig {
  available: boolean
  apiBaseUrl?: string
  workspaceId: string
  mode: 'backend_local_edit_brief' | 'unavailable'
  message: string
  warnings: string[]
}

export interface ProjectEditBriefBackendLocalRecord {
  id: string
  workspaceId: string
  projectId: string
  editSessionId: string
  briefText: string
  sourceStorageObjectRecordId?: string
  sourceMediaAssetId?: string
  revisionNumber: number
  savedByUserId?: string
  createdAt?: string
  updatedAt?: string
  contentDigestSha256: string
  backendLocalBriefStored?: true
  persistenceAuthority?: 'canonical_v3_local_supabase_rls'
  runtimeSource?: 'verified_live'
  readbackVerified?: true
  providerCallMade?: false
  workerJobCreated?: false
  renderJobCreated?: false
  creditReservedOrSpent?: false
  supabaseWriteMade?: boolean
  gcsWriteMade?: false
  productReady?: false
  remoteMutationMade?: false
  mockOnly?: boolean
}

interface ProjectEditBriefBackendLocalData {
  editBrief: ProjectEditBriefBackendLocalRecord
}

export interface SaveProjectEditBriefBackendLocalInput {
  apiBaseUrl: string
  briefText: string
  editSessionId: string
  projectId: string
  sourceMediaAssetId?: string
  sourceStorageObjectRecordId?: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

const DEFAULT_WORKSPACE_ID = 'mock-workspace'

function envValue(env: Record<string, string | undefined>, key: string): string | undefined {
  const value = env[key]?.trim()
  return value ? value : undefined
}

export function createProjectEditBriefBackendLocalConfig(env: Record<string, string | undefined>): ProjectEditBriefBackendLocalConfig {
  const apiBaseUrl = envValue(env, 'VITE_REEDITPRO_API_BASE_URL') ?? envValue(env, 'VITE_API_BASE_URL')
  const workspaceId = envValue(env, 'VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID') ?? DEFAULT_WORKSPACE_ID

  if (!apiBaseUrl) {
    return {
      available: false,
      workspaceId,
      mode: 'unavailable',
      message: 'Edit brief save needs the backend API URL before it can persist a backend-local brief.',
      warnings: ['Set VITE_REEDITPRO_API_BASE_URL for backend-local edit brief save/readback.'],
    }
  }

  return {
    available: true,
    apiBaseUrl,
    workspaceId,
    mode: 'backend_local_edit_brief',
    message: 'Backend-local edit brief save/readback is available for internal testing.',
    warnings: [
      'Saving the brief does not upload media, run tools, render, export, reserve credits, or unlock beta/production.',
    ],
  }
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
        code: 'EDIT_BRIEF_BAD_RESPONSE',
        message: 'Edit brief backend returned a non-JSON response.',
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

function assertSafeBriefText(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Edit brief is required.')
  if (/service.?role|api.?key|secret|signed.?url|token|sk-[a-z0-9_-]+/i.test(trimmed)) {
    throw new Error('Edit brief contains secret-like or signed URL text.')
  }
  return trimmed
}

export async function saveProjectEditBriefBackendLocal(
  input: SaveProjectEditBriefBackendLocalInput,
): Promise<{
  editBrief: ProjectEditBriefBackendLocalRecord
  readback: ProjectEditBriefBackendLocalRecord
  warnings: string[]
}> {
  const briefText = assertSafeBriefText(input.briefText)
  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const commonHeaders = {
    'Content-Type': 'application/json',
    authorization: accessToken ? `Bearer ${accessToken}` : undefined,
  }

  const createEnvelope = await parseEnvelope<ProjectEditBriefBackendLocalData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions/${encodeURIComponent(input.editSessionId)}/local-brief`,
  ), {
    method: 'POST',
    headers: createHeaders({
      ...commonHeaders,
      'idempotency-key': createIdempotencyKey('edit-brief-save'),
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      briefText,
      sourceStorageObjectRecordId: input.sourceStorageObjectRecordId,
      sourceMediaAssetId: input.sourceMediaAssetId,
    }),
  }))
  const editBrief = assertOk(createEnvelope, 'Edit brief save failed.').editBrief

  const readback = await readProjectEditBriefBackendLocal({
    apiBaseUrl: input.apiBaseUrl,
    editSessionId: input.editSessionId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    fetchImpl,
    getAccessToken: input.getAccessToken,
  })

  if (
    readback.editBrief.id !== editBrief.id ||
    readback.editBrief.editSessionId !== input.editSessionId ||
    readback.editBrief.briefText !== briefText ||
    readback.editBrief.contentDigestSha256 !== editBrief.contentDigestSha256 ||
    !/^[a-f0-9]{64}$/.test(readback.editBrief.contentDigestSha256)
  ) {
    throw new Error('Edit brief readback did not match the saved brief.')
  }

  return {
    editBrief: {
      ...editBrief,
      readbackVerified: true,
    },
    readback: {
      ...readback.editBrief,
      readbackVerified: true,
    },
    warnings: [
      ...(createEnvelope.warnings ?? []),
      ...readback.warnings,
      editBrief.persistenceAuthority === 'canonical_v3_local_supabase_rls'
        ? 'Exact Edit Brief was saved and read back through isolated local RLS authority before plan approval; no tools, render, credits, remote Supabase, GCS, beta, or production work started.'
        : 'Backend-local edit brief was saved and read back before plan approval; no tools, render, credits, Supabase, GCS, beta, or production work started.',
    ],
  }
}

export async function readProjectEditBriefBackendLocal(input: {
  apiBaseUrl: string
  editSessionId: string
  projectId: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}): Promise<{ editBrief: ProjectEditBriefBackendLocalRecord; warnings: string[] }> {
  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const envelope = await parseEnvelope<ProjectEditBriefBackendLocalData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions/${encodeURIComponent(input.editSessionId)}/local-brief?workspaceId=${encodeURIComponent(input.workspaceId)}`,
  ), {
    method: 'GET',
    headers: createHeaders({
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
  }))

  return {
    editBrief: assertOk(envelope, 'Edit brief readback failed.').editBrief,
    warnings: envelope.warnings ?? [],
  }
}
