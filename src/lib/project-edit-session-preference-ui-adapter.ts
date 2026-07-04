import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type {
  ProjectEditSessionPreferenceApplicationPlan,
  ProjectEditSessionPreferenceOption,
  ProjectEditSessionPreferencePanelModel,
  ProjectEditSessionPreferenceState,
} from '../types/project-edit-session-preference'
import {
  createDefaultMockProjectEditSessionApiClient,
  type ProjectEditSessionApiClient,
} from './project-edit-session-api-client'
import { PROJECT_EDIT_SESSION_API_CLIENT_SAFETY } from './project-edit-session-api-client-summaries'

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'

function clientFor(projectId: string, client?: ProjectEditSessionApiClient): ProjectEditSessionApiClient {
  return client ?? createDefaultMockProjectEditSessionApiClient({
    projectId,
    preserveMockSession: true,
  })
}

function fallbackPanel(editSessionId: string): ProjectEditSessionPreferencePanelModel {
  return {
    editSessionId,
    title: 'Selected Edit Preference',
    statusLabel: 'Not Selected',
    doNotCopyRules: [],
    badges: ['Not selected', 'Mock only'],
    canApplyPreference: true,
    canClearPreference: false,
    requiresUserReview: false,
    blockedReasons: [],
    warnings: [],
    mockOnly: true,
  }
}

export interface ProjectEditSessionPreferencePanelForUI {
  response: ReeditProApiResponseEnvelope
  panelModel: ProjectEditSessionPreferencePanelModel
  state?: ProjectEditSessionPreferenceState
  options: ProjectEditSessionPreferenceOption[]
  summary: string[]
  boundarySummary: string
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
  mockOnly: true
}

export interface ProjectEditSessionPreferenceApplyResult {
  ok: boolean
  response: ReeditProApiResponseEnvelope
  state?: ProjectEditSessionPreferenceState
  applicationPlan?: ProjectEditSessionPreferenceApplicationPlan
  panelModel?: ProjectEditSessionPreferencePanelModel
  summary: string[]
  warnings: string[]
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
  mockOnly: true
}

export function createProjectEditSessionPreferenceBoundarySummary(): string {
  return 'Mock/local only. Applying an Edit Preference updates Edit Chat metadata, memory, and history only; no Qwen, DeepSeek, provider, worker, render, media processing, Supabase, or credit action starts.'
}

export function createProjectEditSessionPreferencePanelModelForUI(
  panelModel: ProjectEditSessionPreferencePanelModel | undefined,
  editSessionId: string,
): ProjectEditSessionPreferencePanelModel {
  return panelModel ?? fallbackPanel(editSessionId)
}

export async function listProjectEditSessionPreferenceOptionsForUI(input: {
  projectId?: string
  editSessionId?: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionPreferenceOption[]> {
  const projectId = input.projectId ?? DEFAULT_PROJECT_ID
  const response = await clientFor(projectId, input.client).preference.options<{
    options: ProjectEditSessionPreferenceOption[]
  }>(projectId, input.editSessionId)
  return response.data?.options ?? []
}

export async function loadProjectEditSessionPreferencePanelForUI(input: {
  projectId?: string
  editSessionId: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionPreferencePanelForUI> {
  const projectId = input.projectId ?? DEFAULT_PROJECT_ID
  const client = clientFor(projectId, input.client)
  const [stateResponse, optionsResponse] = await Promise.all([
    client.preference.get<{
      state: ProjectEditSessionPreferenceState
      panelModel: ProjectEditSessionPreferencePanelModel
      summary: string[]
    }>(input.editSessionId),
    client.preference.options<{ options: ProjectEditSessionPreferenceOption[] }>(projectId, input.editSessionId),
  ])
  return {
    response: stateResponse,
    panelModel: createProjectEditSessionPreferencePanelModelForUI(stateResponse.data?.panelModel, input.editSessionId),
    state: stateResponse.data?.state,
    options: optionsResponse.data?.options ?? [],
    summary: stateResponse.data?.summary ?? [],
    boundarySummary: createProjectEditSessionPreferenceBoundarySummary(),
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}

export async function applyPreferenceToProjectEditSessionViaApi(input: {
  projectId?: string
  editSessionId: string
  preferenceOptionId?: string
  preferenceHandle?: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionPreferenceApplyResult> {
  const projectId = input.projectId ?? DEFAULT_PROJECT_ID
  const response = await clientFor(projectId, input.client).preference.apply<{
    state: ProjectEditSessionPreferenceState
    applicationPlan: ProjectEditSessionPreferenceApplicationPlan
    panelModel: ProjectEditSessionPreferencePanelModel
    summary: string[]
  }>({
    projectId,
    editSessionId: input.editSessionId,
    preferenceOptionId: input.preferenceOptionId,
    preferenceHandle: input.preferenceHandle,
  })
  return {
    ok: response.ok,
    response,
    state: response.data?.state,
    applicationPlan: response.data?.applicationPlan,
    panelModel: response.data?.panelModel,
    summary: response.data?.summary ?? [],
    warnings: response.warnings ?? [],
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}

export async function clearPreferenceFromProjectEditSessionViaApi(input: {
  projectId?: string
  editSessionId: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionPreferenceApplyResult> {
  const projectId = input.projectId ?? DEFAULT_PROJECT_ID
  const response = await clientFor(projectId, input.client).preference.clear<{
    state: ProjectEditSessionPreferenceState
    applicationPlan: ProjectEditSessionPreferenceApplicationPlan
    panelModel: ProjectEditSessionPreferencePanelModel
    summary: string[]
  }>(input.editSessionId)
  return {
    ok: response.ok,
    response,
    state: response.data?.state,
    applicationPlan: response.data?.applicationPlan,
    panelModel: response.data?.panelModel,
    summary: response.data?.summary ?? [],
    warnings: response.warnings ?? [],
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}
