import { getSupabaseClient } from '../backend/supabase/supabase-client'
import type { ProjectEditSessionRecord } from '../types/project-edit-session'
import { PROJECT_EDIT_SESSION_API_CLIENT_SAFETY } from './project-edit-session-api-client-summaries'
import {
  getNewEditSessionPreferenceHandle,
  validateNewEditSessionForm,
  type NewEditSessionCreateResult,
  type NewEditSessionFormState,
  type NewEditSessionSourceNote,
} from './project-edit-session-create-flow-ui-adapter'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

export type ProjectEditSessionBackendLocalRecord = ProjectEditSessionRecord & {
  backendLocalSessionStored?: true
  readbackVerified?: true
  providerCallMade?: false
  workerJobCreated?: false
  renderJobCreated?: false
  creditReservedOrSpent?: false
  supabaseWriteMade?: false
  gcsWriteMade?: false
  productReady?: false
}

interface ProjectEditSessionData {
  editSession: ProjectEditSessionBackendLocalRecord
}

export interface ProjectEditSessionBackendLocalConfig {
  available: boolean
  apiBaseUrl?: string
  workspaceId: string
  mode: 'backend_local_edit_session' | 'unavailable'
  message: string
  warnings: string[]
}

export interface CreateProjectEditSessionBackendLocalInput {
  apiBaseUrl: string
  form: NewEditSessionFormState
  projectId: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

const DEFAULT_WORKSPACE_ID = 'mock-workspace'

function envValue(env: Record<string, string | undefined>, key: string): string | undefined {
  const value = env[key]?.trim()
  return value ? value : undefined
}

export function createProjectEditSessionBackendLocalConfig(
  env: Record<string, string | undefined>,
): ProjectEditSessionBackendLocalConfig {
  const apiBaseUrl = envValue(env, 'VITE_REEDITPRO_API_BASE_URL') ?? envValue(env, 'VITE_API_BASE_URL')
  const workspaceId = envValue(env, 'VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID') ?? DEFAULT_WORKSPACE_ID

  if (!apiBaseUrl) {
    return {
      available: false,
      workspaceId,
      mode: 'unavailable',
      message: 'Edit creation needs the backend API URL before it can create a backend-local edit.',
      warnings: ['Set VITE_REEDITPRO_API_BASE_URL for backend-local edit session creation.'],
    }
  }

  return {
    available: true,
    apiBaseUrl,
    workspaceId,
    mode: 'backend_local_edit_session',
    message: 'Backend-local edit session creation is available for internal testing.',
    warnings: [
      'Creating an edit session does not upload media, create credits, run tools, render, export, or unlock beta/production.',
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
        code: 'EDIT_SESSION_BAD_RESPONSE',
        message: 'Edit session backend returned a non-JSON response.',
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

function normalizedSourceNotes(sourceNotes: NewEditSessionSourceNote[]) {
  return sourceNotes
    .map((sourceNote) => ({
      label: sourceNote.label.trim(),
      notes: sourceNote.notes.trim(),
      importance: sourceNote.importance,
    }))
    .filter((sourceNote) => sourceNote.label || sourceNote.notes)
}

export async function createProjectEditSessionBackendLocalFromNewEditForm(
  input: CreateProjectEditSessionBackendLocalInput,
): Promise<NewEditSessionCreateResult> {
  const validation = validateNewEditSessionForm(input.form)
  if (!validation.ok) {
    return {
      ok: false,
      sourceRecords: [],
      responseSummaries: [],
      warnings: validation.errors,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
      mockOnly: true,
    }
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const preferenceHandle = getNewEditSessionPreferenceHandle(input.form.preferenceChoiceId)
  const sourceNotes = normalizedSourceNotes(input.form.sourceNotes)
  const commonHeaders = {
    'Content-Type': 'application/json',
    authorization: accessToken ? `Bearer ${accessToken}` : undefined,
  }

  const createEnvelope = await parseEnvelope<ProjectEditSessionData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions`,
  ), {
    method: 'POST',
    headers: createHeaders({
      ...commonHeaders,
      'idempotency-key': createIdempotencyKey('edit-session-create'),
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      name: input.form.name.trim(),
      aspectRatio: input.form.aspectRatio,
      platformTarget: input.form.platformTarget,
      selectedEditLevel: input.form.selectedEditLevel,
      selectedEditPreferenceHandle: preferenceHandle,
      metadata: {
        createdFromProjectHome: true,
        rpMilestone: 'project-first-clean-ui',
        preferenceChoiceId: input.form.preferenceChoiceId,
        preferenceNote: input.form.preferenceNote.trim() || undefined,
        sourceNotes,
        safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
      },
    }),
  }))
  const created = assertOk(createEnvelope, 'Backend-local edit session creation failed.').editSession
  if (!created.id) throw new Error('Edit session creation did not return an edit id.')

  const readback = await readProjectEditSessionBackendLocal({
    apiBaseUrl: input.apiBaseUrl,
    editSessionId: created.id,
    workspaceId: input.workspaceId,
    fetchImpl,
    getAccessToken: input.getAccessToken,
  })

  if (readback.editSession.id !== created.id || readback.editSession.projectId !== input.projectId) {
    throw new Error('Edit session readback did not match the created edit.')
  }

  return {
    ok: true,
    session: ({ ...created, readbackVerified: true }) as ProjectEditSessionRecord,
    sourceRecords: [],
    responseSummaries: [
      'Create edit session: backend-local route completed safely.',
      'Read edit session: backend-local readback verified before opening the brief workspace.',
    ],
    warnings: [
      ...(createEnvelope.warnings ?? []),
      ...readback.warnings,
      'Backend-local edit creation did not upload media, approve an edit plan, run tools, render, reserve credits, write Supabase/GCS, or unlock beta/production.',
    ],
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    openRoute: `/projects/${input.projectId}/edits/${created.id}/brief`,
    backendLocalSessionCreated: true,
    mockOnly: true,
  }
}

export async function readProjectEditSessionBackendLocal(input: {
  apiBaseUrl: string
  editSessionId: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}): Promise<{ editSession: ProjectEditSessionBackendLocalRecord; warnings: string[] }> {
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const envelope = await parseEnvelope<ProjectEditSessionData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/edit-sessions/${encodeURIComponent(input.editSessionId)}?workspaceId=${encodeURIComponent(input.workspaceId)}`,
  ), {
    method: 'GET',
    headers: createHeaders({
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
  }))

  return {
    editSession: assertOk(envelope, 'Edit session readback failed.').editSession,
    warnings: envelope.warnings ?? [],
  }
}
