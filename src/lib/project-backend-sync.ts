import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import type { EditingCategory } from '../types/reeditpro'
import type { LocalProjectRecord } from './local-projects'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  expectedProjectPersistenceBackendUserId,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'
const INTERNAL_TEST_PROJECT_DESCRIPTION = 'Internal ReEditPro testing project created before source upload.'
const CATEGORY_MARKER = 'reeditpro_category:'

type BackendProjectResponse = {
  project?: Record<string, unknown>
}

type BackendProjectListResponse = {
  projects?: Array<Record<string, unknown>>
}

export type BackendProjectCreateResult =
  | { status: 'created'; projectId: string }
  | { status: 'not_configured' }
  | { status: 'failed'; errorMessage: string }

type ProjectBackendReadFailureStatus =
  | 'not_found'
  | 'access_denied'
  | 'unavailable'
  | 'invalid_response'

export type ProjectBackendReadResult =
  | {
      status: 'found'
      project: LocalProjectRecord
      warnings: string[]
    }
  | {
      status: ProjectBackendReadFailureStatus
      backendConfigured?: boolean
      errorMessage: string
      retryable: boolean
      warnings: string[]
    }

export type ProjectBackendListResult =
  | {
      status: 'ready'
      projects: LocalProjectRecord[]
      warnings: string[]
    }
  | {
      status: Exclude<ProjectBackendReadFailureStatus, 'not_found'>
      backendConfigured?: boolean
      errorMessage: string
      retryable: boolean
      warnings: string[]
    }

const editingCategories: EditingCategory[] = [
  'storytelling',
  'lifestyle',
  'business_brand',
  'education_explainer',
  'documentary_case_study',
]

export async function createBackendProjectForInternalTesting(input: {
  category: EditingCategory
  createIntentId: string
  projectName: string
  scope: ProjectPersistenceScope
}): Promise<{ id: string } | undefined> {
  const createIntentId = normalizeProjectCreateIntentId(input.createIntentId)
  if (!createIntentId) return undefined

  const response = await requestBackendProjectCreation(input, createIntentId)

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }

  const projectId = stringField(response.data?.project, 'id')
  const workspaceId = stringField(response.data?.project, 'workspaceId') ?? stringField(response.data?.project, 'workspace_id')
  const createdByUserId = stringField(response.data?.project, 'createdByUserId') ??
    stringField(response.data?.project, 'owner_id') ??
    stringField(response.data?.project, 'created_by')
  return response.ok &&
    projectId &&
    workspaceId === input.scope.workspaceId &&
    createdByUserId === expectedProjectPersistenceBackendUserId(input.scope)
      ? { id: projectId }
      : undefined
}

/**
 * Exact, discriminated create/readback result for callers that must never
 * convert an unknown backend outcome into a second browser-local project.
 */
export async function createBackendProjectForInternalTestingResult(input: {
  category: EditingCategory
  createIntentId: string
  projectName: string
  scope: ProjectPersistenceScope
}): Promise<BackendProjectCreateResult> {
  const createIntentId = normalizeProjectCreateIntentId(input.createIntentId)
  if (!createIntentId) {
    return { status: 'failed', errorMessage: 'The project create identity is invalid.' }
  }

  const status = getFrontendApiClientStatus()
  if (status.mode === 'mock') return { status: 'not_configured' }
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      status: 'failed',
      errorMessage: 'Project recovery is misconfigured. No local duplicate was created.',
    }
  }

  const response = await requestBackendProjectCreation(input, createIntentId)
  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }

  const projectId = stringField(response.data?.project, 'id')
  const projectName = stringField(response.data?.project, 'name')
  const workspaceId = stringField(response.data?.project, 'workspaceId') ??
    stringField(response.data?.project, 'workspace_id')
  const createdByUserId = stringField(response.data?.project, 'createdByUserId') ??
    stringField(response.data?.project, 'owner_id') ??
    stringField(response.data?.project, 'created_by')
  if (
    response.ok &&
    projectId &&
    projectName === input.projectName.trim() &&
    workspaceId === input.scope.workspaceId &&
    createdByUserId === expectedProjectPersistenceBackendUserId(input.scope)
  ) {
    return { status: 'created', projectId }
  }

  if (response.statusCode === 401 || response.statusCode === 403) {
    return {
      status: 'failed',
      errorMessage:
        'Your signed-in workspace could not authorize project creation. Refresh the session and retry; no local duplicate was created.',
    }
  }
  if (response.statusCode === 409) {
    return {
      status: 'failed',
      errorMessage:
        'This project creation is still recoverable. Retry the same action to confirm it without creating a duplicate.',
    }
  }
  if (response.statusCode === 0 || response.statusCode >= 500) {
    return {
      status: 'failed',
      errorMessage:
        'Private project creation is temporarily unavailable. Retry to recover the same project; no local duplicate was created.',
    }
  }
  return {
    status: 'failed',
    errorMessage: 'Project creation could not be confirmed. Retry to recover the same project.',
  }
}

async function requestBackendProjectCreation(
  input: {
    category: EditingCategory
    projectName: string
    scope: ProjectPersistenceScope
  },
  createIntentId: string,
) {
  return callReeditProApi<
    { workspaceId: string; name: string; description: string },
    BackendProjectResponse
  >(
    'projects.create',
    {
      workspaceId: input.scope.workspaceId,
      name: input.projectName,
      description: createInternalTestingProjectDescription(input.category),
    },
    {
      context: {
        workspaceId: input.scope.workspaceId,
      },
      idempotencyKey: `project-create:${input.scope.workspaceId}:${createIntentId}`,
    },
  )
}

export async function fetchLocalProjectRecordFromBackend(
  scope: ProjectPersistenceScope,
  projectId: string,
  fallbackCategory: EditingCategory = 'storytelling',
): Promise<LocalProjectRecord | undefined> {
  const result = await readLocalProjectRecordFromBackend(scope, projectId, fallbackCategory)
  return result.status === 'found' ? result.project : undefined
}

export async function readLocalProjectRecordFromBackend(
  scope: ProjectPersistenceScope,
  projectId: string,
  fallbackCategory: EditingCategory = 'storytelling',
): Promise<ProjectBackendReadResult> {
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      status: 'unavailable',
      backendConfigured: false,
      errorMessage: 'Account project recovery is not configured for this browser session.',
      retryable: false,
      warnings: status.warnings,
    }
  }

  const response = await callReeditProApi<undefined, BackendProjectResponse>(
    'projects.get',
    undefined,
    { params: { projectId }, query: { workspaceId: scope.workspaceId } },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }

  const failure = classifyProjectReadFailure(response, 'project')
  if (failure) return failure

  const backendProject = response.data?.project
  if (!backendProject) {
    return {
      status: 'invalid_response',
      errorMessage: 'The project response was incomplete.',
      retryable: false,
      warnings: response.warnings,
    }
  }
  const project = localProjectRecordFromBackendProject(
    backendProject,
    fallbackCategory,
    scope.workspaceId,
    expectedProjectPersistenceBackendUserId(scope),
    projectId,
  )
  if (!project) {
    return {
      status: 'invalid_response',
      errorMessage: 'The recovered project did not match the signed-in user, workspace, and project route.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  return {
    status: 'found',
    project,
    warnings: response.warnings,
  }
}

export async function listLocalProjectRecordsFromBackend(
  scope: ProjectPersistenceScope,
  fallbackCategory: EditingCategory = 'storytelling',
): Promise<LocalProjectRecord[]> {
  const result = await listLocalProjectRecordsFromBackendResult(scope, fallbackCategory)
  return result.status === 'ready' ? result.projects : []
}

export async function listLocalProjectRecordsFromBackendResult(
  scope: ProjectPersistenceScope,
  fallbackCategory: EditingCategory = 'storytelling',
): Promise<ProjectBackendListResult> {
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      status: 'unavailable',
      backendConfigured: false,
      errorMessage: 'Account project recovery is not configured for this browser session.',
      retryable: false,
      warnings: status.warnings,
    }
  }

  const response = await callReeditProApi<undefined, BackendProjectListResponse>(
    'projects.list',
    undefined,
    { query: { workspaceId: scope.workspaceId } },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }

  const failure = classifyProjectReadFailure(response, 'project_list')
  if (failure) return failure

  const backendProjects = response.data?.projects
  if (!Array.isArray(backendProjects)) {
    return {
      status: 'invalid_response',
      errorMessage: 'The project list response was incomplete.',
      retryable: false,
      warnings: response.warnings,
    }
  }
  const projects = backendProjects
    .map((project) => localProjectRecordFromBackendProject(
      project,
      fallbackCategory,
      scope.workspaceId,
      expectedProjectPersistenceBackendUserId(scope),
    ))
  if (projects.some((project) => !project)) {
    return {
      status: 'invalid_response',
      errorMessage: 'The project list contained data that did not match the signed-in user and workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  return {
    status: 'ready',
    projects: projects as LocalProjectRecord[],
    warnings: response.warnings,
  }
}

export function createInternalTestingProjectDescription(category: EditingCategory): string {
  return `${INTERNAL_TEST_PROJECT_DESCRIPTION} ${CATEGORY_MARKER}${category}`
}

export function parseInternalTestingProjectCategory(value: unknown): EditingCategory | undefined {
  if (typeof value !== 'string') return undefined
  const markerIndex = value.indexOf(CATEGORY_MARKER)
  if (markerIndex < 0) return undefined
  const category = value.slice(markerIndex + CATEGORY_MARKER.length).trim().split(/\s+/)[0]
  return isEditingCategory(category) ? category : undefined
}

export function normalizeProjectCreateKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled'
}

export function createProjectCreateIntentId(): string {
  const randomId = globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `intent-${randomId}`
}

export function normalizeProjectCreateIntentId(value: string): string | undefined {
  const normalized = value.trim()
  return normalized.length >= 8 && normalized.length <= 100 && /^[A-Za-z0-9_-]+$/.test(normalized)
    ? normalized
    : undefined
}

function classifyProjectReadFailure(
  response: {
    ok: boolean
    statusCode: number
    data?: BackendProjectResponse | BackendProjectListResponse
    error?: { code?: string }
    warnings: string[]
  },
  expected: 'project',
): Exclude<ProjectBackendReadResult, { status: 'found' }> | undefined
function classifyProjectReadFailure(
  response: {
    ok: boolean
    statusCode: number
    data?: BackendProjectResponse | BackendProjectListResponse
    error?: { code?: string }
    warnings: string[]
  },
  expected: 'project_list',
): Exclude<ProjectBackendListResult, { status: 'ready' }> | undefined
function classifyProjectReadFailure(
  response: {
    ok: boolean
    statusCode: number
    data?: BackendProjectResponse | BackendProjectListResponse
    error?: { code?: string }
    warnings: string[]
  },
  expected: 'project' | 'project_list',
): Exclude<ProjectBackendReadResult, { status: 'found' }> | Exclude<ProjectBackendListResult, { status: 'ready' }> | undefined {
  const responseCode = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    responseCode === 'AUTH_REQUIRED' ||
    responseCode === 'AUTH_INVALID' ||
    responseCode === 'WORKSPACE_ACCESS_DENIED'
  ) {
    return {
      status: 'access_denied',
      errorMessage: expected === 'project'
        ? 'This project is not available to the signed-in workspace.'
        : 'Projects are not available to the signed-in workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (expected === 'project' && (response.statusCode === 404 || responseCode === 'PROJECT_NOT_FOUND')) {
    return {
      status: 'not_found',
      errorMessage: 'This project could not be found.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (
    responseCode === 'VALIDATION_FAILED' ||
    responseCode === 'invalid_json_response' ||
    responseCode === 'invalid_backend_response'
  ) {
    return {
      status: 'invalid_response',
      errorMessage: expected === 'project'
        ? 'The project response could not be safely matched to this route.'
        : 'The project list response could not be safely matched to this workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (!response.ok) {
    return {
      status: 'unavailable',
      backendConfigured: true,
      errorMessage: expected === 'project'
        ? 'The project could not be recovered from the account connection.'
        : 'Projects could not be recovered from the account connection.',
      retryable: response.statusCode >= 500 || responseCode === 'http_transport_failed',
      warnings: response.warnings,
    }
  }

  if (
    (expected === 'project' && !('project' in (response.data ?? {}))) ||
    (expected === 'project_list' && !Array.isArray((response.data as BackendProjectListResponse | undefined)?.projects))
  ) {
    return {
      status: 'invalid_response',
      errorMessage: expected === 'project'
        ? 'The project response was incomplete.'
        : 'The project list response was incomplete.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  return undefined
}

function localProjectRecordFromBackendProject(
  project: Record<string, unknown>,
  fallbackCategory: EditingCategory,
  expectedWorkspaceId: string,
  expectedUserId: string,
  expectedProjectId?: string,
): LocalProjectRecord | undefined {
  const id = stringField(project, 'id')
  const name = stringField(project, 'name')
  const workspaceId = stringField(project, 'workspaceId') ?? stringField(project, 'workspace_id')
  const createdByUserId = stringField(project, 'createdByUserId') ??
    stringField(project, 'owner_id') ??
    stringField(project, 'created_by')
  if (
    !id ||
    (expectedProjectId && id !== expectedProjectId) ||
    workspaceId !== expectedWorkspaceId ||
    createdByUserId !== expectedUserId ||
    !name
  ) return undefined

  const description = stringField(project, 'description')
  const createdAt = stringField(project, 'createdAt') ?? stringField(project, 'created_at') ?? new Date().toISOString()
  const updatedAt = stringField(project, 'updatedAt') ?? stringField(project, 'updated_at') ?? createdAt

  return {
    id,
    workspaceId,
    name,
    category: parseInternalTestingProjectCategory(description) ?? fallbackCategory,
    createdAt,
    updatedAt,
    persistence: 'browser_scoped_project_registry',
  }
}

function stringField(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isEditingCategory(value: string): value is EditingCategory {
  return editingCategories.includes(value as EditingCategory)
}
