import type { ProjectEditSessionCardModel } from '../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'
import type {
  ProjectEditSessionPreferenceOption,
  ProjectEditSessionPreferencePanelModel,
  ProjectEditSessionPreferenceState,
} from '../types/project-edit-session-preference'
import {
  createDefaultMockProjectEditSessionApiClient,
  type ProjectEditSessionApiClient,
} from './project-edit-session-api-client'
import {
  createProjectEditSessionBundleClientSummary,
  createProjectEditSessionCardListSummary,
} from './project-edit-session-api-client-summaries'

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'

function defaultClient(client?: ProjectEditSessionApiClient): ProjectEditSessionApiClient {
  return client ?? createDefaultMockProjectEditSessionApiClient({
    projectId: DEFAULT_PROJECT_ID,
    preserveMockSession: true,
  })
}

function dataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export async function listProjectEditSessionCardsViaApi(
  projectId = DEFAULT_PROJECT_ID,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  const response = await api.cardModels.list<{ cardModels: ProjectEditSessionCardModel[] }>(projectId)
  const cardModels = response.data?.cardModels ?? []
  return {
    response,
    cardModels,
    summary: createProjectEditSessionCardListSummary(cardModels),
  }
}

export async function getProjectEditSessionBundleViaApi(
  editSessionId: string,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  const response = await api.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(editSessionId)
  const bundle = response.data?.bundle
  return {
    response,
    bundle,
    summary: createProjectEditSessionBundleClientSummary(bundle),
  }
}

export async function createProjectEditSessionViaApi(
  input: unknown,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  return api.sessions.create(input)
}

export async function duplicateProjectEditSessionViaApi(
  input: unknown,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  return api.sessions.duplicate(input)
}

export async function appendProjectEditSessionMessageViaApi(
  input: unknown,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  return api.messages.append(input)
}

export async function listProjectEditSessionPreferenceOptionsViaApi(
  projectId = DEFAULT_PROJECT_ID,
  editSessionId?: string,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  const response = await api.preference.options<{
    options: ProjectEditSessionPreferenceOption[]
    summary: string[]
  }>(projectId, editSessionId)
  return {
    response,
    options: response.data?.options ?? [],
    summary: response.data?.summary ?? [],
  }
}

export async function getProjectEditSessionPreferenceStateViaApi(
  editSessionId: string,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  const response = await api.preference.get<{
    state: ProjectEditSessionPreferenceState
    panelModel: ProjectEditSessionPreferencePanelModel
    summary: string[]
  }>(editSessionId)
  return {
    response,
    state: response.data?.state,
    panelModel: response.data?.panelModel,
    summary: response.data?.summary ?? [],
  }
}

export async function applyEditPreferenceToProjectEditSessionViaApi(
  input: unknown,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  return api.preference.apply(input)
}

export async function clearEditPreferenceFromProjectEditSessionViaApi(
  editSessionId: string,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  return api.preference.clear(editSessionId)
}

export async function loadProjectEditSessionPreferenceDNASummaryViaApi(
  input: unknown,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  const response = await api.preference.dnaSummary<{
    option: ProjectEditSessionPreferenceOption
    summary: string[]
  }>(input)
  return {
    response,
    option: response.data?.option,
    summary: response.data?.summary ?? [],
  }
}

export function createProjectEditSessionPreferencePanelModel(
  panelModel: ProjectEditSessionPreferencePanelModel | undefined,
) {
  return panelModel
}

export async function loadProjectEditSessionMemoryViaApi(
  editSessionId: string,
  client?: ProjectEditSessionApiClient,
) {
  const api = defaultClient(client)
  const response = await api.memory.list(editSessionId)
  return {
    response,
    memories: Array.isArray(dataRecord(response.data).memories) ? dataRecord(response.data).memories : [],
  }
}

export function createProjectEditSessionSummaryForUI(bundle: ProjectEditSessionBundleRecord | undefined) {
  return createProjectEditSessionBundleClientSummary(bundle)
}

export function createProjectEditSessionCardModelsForUI(cardModels: ProjectEditSessionCardModel[]) {
  return createProjectEditSessionCardListSummary(cardModels)
}
