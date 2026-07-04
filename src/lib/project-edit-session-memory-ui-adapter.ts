import type {
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
} from '../types/project-edit-session'
import type { ProjectEditSessionMemoryPackage } from '../types/project-edit-session-memory'
import {
  PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
} from './project-edit-session-api-client-summaries'
import {
  createDefaultMockProjectEditSessionApiClient,
  type ProjectEditSessionApiClient,
} from './project-edit-session-api-client'

type MemoryValueSets = {
  targetLayers: ProjectEditSessionMemoryLayer[]
  facts: string[]
  preferences: string[]
  warnings: string[]
  summary: string
}

export type ProjectEditSessionMemoryLayerCardModel = {
  layer: ProjectEditSessionMemoryLayer
  title: string
  summary: string
  factsCount: number
  preferencesCount: number
  warningsCount: number
  updatedLabel: string
  facts: string[]
  preferences: string[]
  warnings: string[]
  isRevisionLayer: boolean
  isSourceLayer: boolean
  isDnaLayer: boolean
  mockOnly: true
}

export type ProjectEditSessionMemoryUpdateNoticeModel = {
  title: string
  body: string
  updatedLayers: ProjectEditSessionMemoryLayer[]
  warnings: string[]
  safetyLabels: string[]
  mockOnly: true
}

export type ProjectEditSessionMemoryPackageForUI = {
  memoryPackage: ProjectEditSessionMemoryPackage
  layerCards: ProjectEditSessionMemoryLayerCardModel[]
  boundarySummary: string
  mockOnly: true
}

export type ProjectEditSessionMemoryApplyResult = {
  ok: boolean
  updatedLayers: ProjectEditSessionMemoryRecord[]
  notice: ProjectEditSessionMemoryUpdateNoticeModel
  warnings: string[]
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
  mockOnly: true
}

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'

function clientFor(projectId: string, client?: ProjectEditSessionApiClient): ProjectEditSessionApiClient {
  return client ?? createDefaultMockProjectEditSessionApiClient({
    projectId,
    preserveMockSession: true,
  })
}

function titleCase(value: string): string {
  return value
    .replace(/^@/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function includesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase()
  return terms.some((term) => normalized.includes(term))
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Updated in mock session'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function safetyLabels(): string[] {
  return [
    'providerCallMade: false',
    'qwenCallMade: false',
    'deepSeekCallMade: false',
    'supabaseWriteMade: false',
    'storageWriteMade: false',
    'fileBytesRead: false',
    'externalUrlFetched: false',
    'mediaProcessingStarted: false',
    'workerJobCreated: false',
    'generationRequestCreated: false',
    'renderJobCreated: false',
    'creditReservedOrSpent: false',
  ]
}

function memoryValuesFromText(text: string, revisionMode = false): MemoryValueSets {
  const targetLayers: ProjectEditSessionMemoryLayer[] = []
  const facts: string[] = []
  const preferences: string[] = []
  const warnings: string[] = []

  if (revisionMode || includesAny(text, ['faster', 'hook', 'pacing', 'slow it down'])) {
    targetLayers.push('revision_memory', 'user_instruction_memory')
    facts.push(revisionMode ? 'Revision request captured from persistent Edit Chat.' : 'User gave pacing or hook direction.')
    preferences.push(text)
  }

  if (includesAny(text, ['captions', 'subtitles', 'text'])) {
    targetLayers.push('user_instruction_memory', 'session_memory')
    facts.push('User gave caption or text direction.')
    preferences.push(text)
  }

  if (includesAny(text, ['music', 'sfx', 'fake sounds'])) {
    targetLayers.push('user_instruction_memory', 'dna_application_memory')
    preferences.push(text)
    warnings.push(includesAny(text, ['fake sounds']) ? 'Avoid fake source sounds.' : 'Audio/SFX preference captured as mock memory only.')
  }

  if (includesAny(text, ['source', 'clip', 'broll', 'b-roll'])) {
    targetLayers.push('source_memory')
    facts.push(text)
  }

  if (includesAny(text, ['approve', 'keep this version', 'keep it'])) {
    targetLayers.push('approval_memory')
    facts.push('User referenced approval or keeping the current version.')
  }

  if (includesAny(text, ['preview', 'version'])) {
    targetLayers.push('preview_memory')
    facts.push('User referenced preview or version state.')
  }

  if (includesAny(text, ['premium', 'polished', 'clean', 'calm'])) {
    targetLayers.push('session_memory', 'preference_memory')
    preferences.push(text)
  }

  return {
    targetLayers: unique(targetLayers) as ProjectEditSessionMemoryLayer[],
    facts: unique(facts),
    preferences: unique(preferences),
    warnings: unique(warnings),
    summary: targetLayers.length
      ? `Latest mock memory from chat: ${text.slice(0, 120)}`
      : `No durable mock memory extracted from: ${text.slice(0, 80)}`,
  }
}

function latestTimestamp(layers: ProjectEditSessionMemoryRecord[]): string {
  const timestamps = layers
    .map((layer) => new Date(layer.updatedAt).getTime())
    .filter((value) => Number.isFinite(value))
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString()
}

function createMemoryPackage(input: {
  projectId: string
  editSessionId: string
  layers: ProjectEditSessionMemoryRecord[]
}): ProjectEditSessionMemoryPackage {
  const factsCount = input.layers.reduce((count, layer) => count + layer.facts.length, 0)
  const preferencesCount = input.layers.reduce((count, layer) => count + layer.preferences.length, 0)
  const warningsCount = input.layers.reduce((count, layer) => count + layer.warnings.length, 0)
  return {
    id: `project-edit-session-memory-package-${input.editSessionId}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    layers: input.layers,
    readableSummary: input.layers.length
      ? input.layers.map((layer) => `${titleCase(layer.layer)}: ${layer.summary}`).join(' | ')
      : 'No structured Edit Chat memory has been saved yet.',
    factsCount,
    preferencesCount,
    warningsCount,
    updatedAt: latestTimestamp(input.layers),
    mockOnly: true,
  }
}

export function createProjectEditSessionMemoryLayerCardModels(
  layers: ProjectEditSessionMemoryRecord[],
): ProjectEditSessionMemoryLayerCardModel[] {
  return layers.map((memory) => ({
    layer: memory.layer,
    title: titleCase(memory.layer),
    summary: memory.summary,
    factsCount: memory.facts.length,
    preferencesCount: memory.preferences.length,
    warningsCount: memory.warnings.length,
    updatedLabel: formatTimestamp(memory.updatedAt),
    facts: memory.facts,
    preferences: memory.preferences,
    warnings: memory.warnings,
    isRevisionLayer: memory.layer === 'revision_memory',
    isSourceLayer: memory.layer === 'source_memory',
    isDnaLayer: memory.layer === 'dna_application_memory',
    mockOnly: true,
  }))
}

export function createProjectEditSessionMemoryUpdateNoticeModel(input: {
  updatedLayers: ProjectEditSessionMemoryLayer[]
  warnings?: string[]
  revisionMode?: boolean
}): ProjectEditSessionMemoryUpdateNoticeModel {
  const updatedLayers = unique(input.updatedLayers) as ProjectEditSessionMemoryLayer[]
  return {
    title: input.revisionMode ? 'Revision memory updated' : 'Memory updated',
    body: updatedLayers.length
      ? `Mock memory refreshed for ${updatedLayers.map(titleCase).join(', ')}.`
      : 'No durable memory update was needed for that message.',
    updatedLayers,
    warnings: input.warnings ?? [],
    safetyLabels: safetyLabels(),
    mockOnly: true,
  }
}

export function createProjectEditSessionMemoryBoundarySummary(): string {
  return 'Mock/local structured memory only. No Qwen, DeepSeek, embeddings, vector DB, Supabase write, media processing, workers, render, or credits.'
}

export async function loadProjectEditSessionMemoryPackageForUI(input: {
  projectId?: string
  editSessionId: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionMemoryPackageForUI> {
  const projectId = input.projectId ?? DEFAULT_PROJECT_ID
  const api = clientFor(projectId, input.client)
  const response = await api.memory.list<{ memories: ProjectEditSessionMemoryRecord[] }>(input.editSessionId)
  const layers = response.data?.memories ?? []
  const memoryPackage = createMemoryPackage({ projectId, editSessionId: input.editSessionId, layers })
  return {
    memoryPackage,
    layerCards: createProjectEditSessionMemoryLayerCardModels(layers),
    boundarySummary: createProjectEditSessionMemoryBoundarySummary(),
    mockOnly: true,
  }
}

async function applyMockMemoryValuesViaApi(input: {
  projectId: string
  editSessionId: string
  messageId?: string
  revisionId?: string
  text: string
  revisionMode?: boolean
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionMemoryApplyResult> {
  const api = clientFor(input.projectId, input.client)
  const current = await api.memory.list<{ memories: ProjectEditSessionMemoryRecord[] }>(input.editSessionId)
  const existingLayers = current.data?.memories ?? []
  const values = memoryValuesFromText(input.text, input.revisionMode)
  const updatedLayers: ProjectEditSessionMemoryRecord[] = []
  const warnings: string[] = current.ok ? [] : [current.error?.message ?? 'Memory list failed safely.']

  for (const layer of values.targetLayers) {
    const existing = existingLayers.find((memory) => memory.layer === layer)
    const response = await api.memory.upsert<{ memory: ProjectEditSessionMemoryRecord }>({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      layer,
      summary: values.summary,
      facts: unique([...(existing?.facts ?? []), ...values.facts]),
      preferences: unique([...(existing?.preferences ?? []), ...values.preferences]),
      warnings: unique([...(existing?.warnings ?? []), ...values.warnings]),
      updatedFromMessageId: input.messageId,
      updatedFromRevisionId: input.revisionId,
      metadata: {
        rpMilestone: 'RP-EDITSESSION-08',
        source: input.revisionMode ? 'revision_request' : 'user_message',
        deterministicMockExtraction: true,
        safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
      },
    })
    const memory = response.data?.memory
    if (memory) updatedLayers.push(memory)
    if (!response.ok) warnings.push(response.error?.message ?? `Memory upsert failed safely for ${layer}.`)
  }

  return {
    ok: values.targetLayers.length === 0 || updatedLayers.length > 0,
    updatedLayers,
    notice: createProjectEditSessionMemoryUpdateNoticeModel({
      updatedLayers: values.targetLayers,
      warnings,
      revisionMode: input.revisionMode,
    }),
    warnings,
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}

export function getProjectEditSessionMemoryTargetsForText(text: string): ProjectEditSessionMemoryLayer[] {
  return memoryValuesFromText(text).targetLayers
}

export async function applyMockMemoryUpdateFromMessageViaApi(input: {
  projectId: string
  editSessionId: string
  messageId?: string
  text: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionMemoryApplyResult> {
  return applyMockMemoryValuesViaApi(input)
}

export async function applyMockRevisionMemoryUpdateViaApi(input: {
  projectId: string
  editSessionId: string
  messageId?: string
  revisionId?: string
  text: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionMemoryApplyResult> {
  return applyMockMemoryValuesViaApi({ ...input, revisionMode: true })
}
