import type { EditingCategory } from '../types/reeditpro'
import {
  buildProjectPersistenceScopeStorageKey,
  createProjectPersistenceScopeFingerprint,
  isProjectPersistenceScopeActive,
  normalizeProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

export type LocalProjectRecord = {
  id: string
  workspaceId: string
  name: string
  category: EditingCategory
  createdAt: string
  updatedAt: string
  persistence: 'browser_scoped_project_registry'
}

type ScopedLocalProjectEnvelope = {
  recordVersion: 2
  scope: {
    authMode: ProjectPersistenceScope['authMode']
    userId: string
    workspaceId: string
  }
  scopeFingerprint: string
  projects: LocalProjectRecord[]
  savedAt: string
}

export const LEGACY_UNSCOPED_LOCAL_PROJECT_STORAGE_KEY = 'reeditpro.localProjects.v1'
const SCOPED_STORAGE_PREFIX = 'reeditpro.localProjects.v2'

export function buildLocalProjectStorageKey(scope: ProjectPersistenceScope): string {
  return buildProjectPersistenceScopeStorageKey(SCOPED_STORAGE_PREFIX, requireScope(scope))
}

export function createLocalProjectRecord(input: {
  category: EditingCategory
  name: string
  projectId: string
  workspaceId: string
  now?: Date
}): LocalProjectRecord {
  const now = input.now ?? new Date()
  return {
    id: normalizeProjectId(input.projectId) ?? `local-project-${createSlug(input.name)}`,
    workspaceId: normalizeWorkspaceId(input.workspaceId),
    name: normalizeProjectName(input.name),
    category: input.category,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    persistence: 'browser_scoped_project_registry',
  }
}

export function saveLocalProjectRecord(
  scope: ProjectPersistenceScope,
  project: LocalProjectRecord,
): LocalProjectRecord {
  const normalizedScope = requireScope(scope)
  const normalized = normalizeProjectRecord(project, normalizedScope.workspaceId)
  if (!isProjectPersistenceScopeActive(normalizedScope)) return normalized
  const next = [
    normalized,
    ...listLocalProjectRecords(normalizedScope).filter((item) => item.id !== normalized.id),
  ].slice(0, 32)
  writeProjects(normalizedScope, next)
  return normalized
}

export function listLocalProjectRecords(scope: ProjectPersistenceScope): LocalProjectRecord[] {
  const normalizedScope = normalizeProjectPersistenceScope(scope)
  if (!normalizedScope || !isProjectPersistenceScopeActive(normalizedScope) || !canUseLocalStorage()) return []

  try {
    const raw = window.localStorage.getItem(buildLocalProjectStorageKey(normalizedScope))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!isMatchingEnvelope(parsed, normalizedScope)) return []
    return parsed.projects
      .map((project) => parseProjectRecord(project, normalizedScope.workspaceId))
      .filter((item): item is LocalProjectRecord => Boolean(item))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } catch {
    return []
  }
}

export function getLocalProjectRecord(
  scope: ProjectPersistenceScope,
  projectId: string,
): LocalProjectRecord | undefined {
  return listLocalProjectRecords(scope).find((project) => project.id === projectId)
}

function normalizeProjectRecord(project: LocalProjectRecord, expectedWorkspaceId: string): LocalProjectRecord {
  if (project.workspaceId !== expectedWorkspaceId) {
    throw new Error('Local project record does not belong to the active workspace.')
  }
  return {
    ...project,
    id: normalizeProjectId(project.id) ?? `local-project-${createSlug(project.name)}`,
    workspaceId: expectedWorkspaceId,
    name: normalizeProjectName(project.name),
    persistence: 'browser_scoped_project_registry',
  }
}

function parseProjectRecord(value: unknown, expectedWorkspaceId: string): LocalProjectRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<LocalProjectRecord>
  if (
    typeof record.id !== 'string' ||
    record.workspaceId !== expectedWorkspaceId ||
    typeof record.name !== 'string' ||
    typeof record.category !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    return null
  }

  return normalizeProjectRecord({
    id: record.id,
    workspaceId: expectedWorkspaceId,
    name: record.name,
    category: record.category as EditingCategory,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    persistence: 'browser_scoped_project_registry',
  }, expectedWorkspaceId)
}

function isMatchingEnvelope(
  value: unknown,
  scope: ProjectPersistenceScope,
): value is ScopedLocalProjectEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Partial<ScopedLocalProjectEnvelope>
  return record.recordVersion === 2 &&
    record.scope?.authMode === scope.authMode &&
    record.scope?.userId === scope.userId &&
    record.scope?.workspaceId === scope.workspaceId &&
    record.scopeFingerprint === createProjectPersistenceScopeFingerprint(scope) &&
    Array.isArray(record.projects) &&
    typeof record.savedAt === 'string'
}

function writeProjects(scope: ProjectPersistenceScope, projects: LocalProjectRecord[]) {
  if (!canUseLocalStorage()) return
  const envelope: ScopedLocalProjectEnvelope = {
    recordVersion: 2,
    scope: {
      authMode: scope.authMode,
      userId: scope.userId,
      workspaceId: scope.workspaceId,
    },
    scopeFingerprint: createProjectPersistenceScopeFingerprint(scope),
    projects,
    savedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(buildLocalProjectStorageKey(scope), JSON.stringify(envelope))
}

function requireScope(scope: ProjectPersistenceScope): ProjectPersistenceScope {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized) throw new Error('A valid signed-in project persistence scope is required.')
  return normalized
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeProjectName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 120) || 'Untitled project'
}

function normalizeProjectId(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed.slice(0, 160) : undefined
}

function normalizeWorkspaceId(value: string) {
  const normalized = value.trim().slice(0, 160)
  if (!normalized) throw new Error('A workspace id is required for local project persistence.')
  return normalized
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled'
}
