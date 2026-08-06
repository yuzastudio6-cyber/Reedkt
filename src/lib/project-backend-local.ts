import { getSupabaseClient } from '../backend/supabase/supabase-client'
import { resolveReceiverSafeFetch } from './receiver-safe-fetch'

interface ProjectEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

export interface ProjectBackendLocalConfig {
  available: boolean
  apiBaseUrl?: string
  workspaceId: string
  mode: 'backend_local_project' | 'unavailable'
  message: string
  warnings: string[]
}

export interface ProjectBackendLocalRecord {
  id: string
  workspaceId?: string
  name: string
  description?: string
  createdByUserId?: string
  createdAt?: string
  updatedAt?: string
  mockOnly?: true
  providerCallMade?: false
  workerJobCreated?: false
  renderJobCreated?: false
  creditReservedOrSpent?: false
  supabaseWriteMade?: false
  gcsWriteMade?: false
  productReady?: false
}

interface ProjectBackendLocalData {
  project: ProjectBackendLocalRecord
}

interface ProjectBackendLocalListData {
  projects: ProjectBackendLocalRecord[]
}

export interface CreateProjectBackendLocalInput {
  apiBaseUrl: string
  description?: string
  name: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

const DEFAULT_WORKSPACE_ID = 'mock-workspace'

function envValue(env: Record<string, string | undefined>, key: string): string | undefined {
  const value = env[key]?.trim()
  return value ? value : undefined
}

export function createProjectBackendLocalConfig(env: Record<string, string | undefined>): ProjectBackendLocalConfig {
  const apiBaseUrl = envValue(env, 'VITE_REEDITPRO_API_BASE_URL') ?? envValue(env, 'VITE_API_BASE_URL')
  const workspaceId = envValue(env, 'VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID') ?? DEFAULT_WORKSPACE_ID

  if (!apiBaseUrl) {
    return {
      available: false,
      workspaceId,
      mode: 'unavailable',
      message: 'Project creation needs the backend API URL before it can create a test project.',
      warnings: ['Set VITE_REEDITPRO_API_BASE_URL for backend-local project creation.'],
    }
  }

  return {
    available: true,
    apiBaseUrl,
    workspaceId,
    mode: 'backend_local_project',
    message: 'Backend-local project creation is available for internal testing.',
    warnings: [
      'Creating a project does not upload media, create credits, run tools, render, export, or unlock beta/production.',
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

async function parseEnvelope<TData>(response: Response): Promise<ProjectEnvelope<TData>> {
  const payload = await response.json().catch(() => undefined)
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: {
        code: 'PROJECT_BAD_RESPONSE',
        message: 'Project backend returned a non-JSON response.',
      },
    }
  }
  return payload as ProjectEnvelope<TData>
}

function assertOk<TData>(envelope: ProjectEnvelope<TData>, fallback: string): TData {
  if (!envelope.ok || !envelope.data) {
    throw new Error(envelope.error?.message ?? fallback)
  }
  return envelope.data
}

export async function createProjectBackendLocal(
  input: CreateProjectBackendLocalInput,
): Promise<{
  project: ProjectBackendLocalRecord
  readback: ProjectBackendLocalRecord
  warnings: string[]
}> {
  const name = input.name.trim()
  if (!name) throw new Error('Project name is required.')

  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const headers = {
    'Content-Type': 'application/json',
    authorization: accessToken ? `Bearer ${accessToken}` : undefined,
  }

  const createEnvelope = await parseEnvelope<ProjectBackendLocalData>(await fetchImpl(joinUrl(input.apiBaseUrl, '/v1/projects'), {
    method: 'POST',
    headers: createHeaders({
      ...headers,
      'idempotency-key': createIdempotencyKey('project-create'),
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      name,
      description: input.description?.trim() || undefined,
    }),
  }))
  const project = assertOk(createEnvelope, 'Project creation failed.').project
  if (!project.id) throw new Error('Project creation did not return a project id.')

  const readbackEnvelope = await parseEnvelope<ProjectBackendLocalData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/projects/${encodeURIComponent(project.id)}`,
  ), {
    method: 'GET',
    headers: createHeaders({
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
  }))
  const readback = assertOk(readbackEnvelope, 'Project readback failed.').project
  if (readback.id !== project.id) {
    throw new Error('Project readback did not match the created project.')
  }

  return {
    project,
    readback,
    warnings: [
      ...(createEnvelope.warnings ?? []),
      ...(readbackEnvelope.warnings ?? []),
      'Project create/readback completed before edit creation; no media, tool, render, Supabase, GCS, beta, production, or billing work started.',
    ],
  }
}

export async function readProjectBackendLocal(input: {
  apiBaseUrl: string
  projectId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}): Promise<{ project: ProjectBackendLocalRecord; warnings: string[] }> {
  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const envelope = await parseEnvelope<ProjectBackendLocalData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/projects/${encodeURIComponent(input.projectId)}`,
  ), {
    method: 'GET',
    headers: createHeaders({
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
  }))
  return {
    project: assertOk(envelope, 'Project readback failed.').project,
    warnings: envelope.warnings ?? [],
  }
}

export async function listProjectsBackendLocal(input: {
  apiBaseUrl: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}): Promise<{ projects: ProjectBackendLocalRecord[]; warnings: string[] }> {
  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const envelope = await parseEnvelope<ProjectBackendLocalListData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/projects?workspaceId=${encodeURIComponent(input.workspaceId)}`,
  ), {
    method: 'GET',
    headers: createHeaders({
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
  }))
  return {
    projects: assertOk(envelope, 'Project list readback failed.').projects,
    warnings: envelope.warnings ?? [],
  }
}
