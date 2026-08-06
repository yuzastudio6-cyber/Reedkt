import type { InternalEditStateBackendSyncResult } from '../../internal-edit-state-backend-sync'
import {
  createLocalInternalProjectHandoff,
  parseLocalInternalProjectHandoffForScope,
  type LocalInternalEditSetupSnapshot,
  type LocalInternalProjectHandoff,
} from '../../local-project-handoff'
import {
  createLocalProjectRecord,
  type LocalProjectRecord,
} from '../../local-projects'
import {
  createProjectCreateIntentId,
  normalizeProjectCreateIntentId,
  type BackendProjectCreateResult,
} from '../../project-backend-sync'
import {
  buildProjectPersistenceScopeStorageKey,
  createProjectPersistenceScopeFingerprint,
  type ProjectPersistenceScope,
} from '../../project-persistence-scope'

export const STORYTELLING_CREATE_JOURNAL_VERSION = 'motion-studio-storytelling-create-journal-v1'
const STORYTELLING_CREATE_JOURNAL_PREFIX = 'reeditpro.motionStudio.storytellingCreate.v1'

export interface StorytellingLibraryCreateAttempt {
  readonly createIntentId: string
  readonly normalizedName: string
  readonly scopeFingerprint: string
  backendProjectRevalidationRequired?: true
  backendProjectResolution?: 'created' | 'not_configured'
  backendProjectId?: string
  project?: LocalProjectRecord
  handoff?: LocalInternalProjectHandoff
}

export interface StorytellingLibraryCreateResult {
  attempt: StorytellingLibraryCreateAttempt
  project: LocalProjectRecord
  handoff: LocalInternalProjectHandoff
  persistence: 'private_backend' | 'browser_local'
}

interface StorytellingLibraryCreateDependencies {
  createBackendProject: (input: {
    category: 'storytelling'
    createIntentId: string
    projectName: string
    scope: ProjectPersistenceScope
  }) => Promise<StorytellingBackendProjectCreateResult>
  persistBackendHandoff: (
    scope: ProjectPersistenceScope,
    handoff: LocalInternalProjectHandoff,
  ) => Promise<InternalEditStateBackendSyncResult>
  persistAttempt?: (attempt: StorytellingLibraryCreateAttempt) => void
}

export type StorytellingBackendProjectCreateResult = BackendProjectCreateResult

export type StorytellingLibraryCreateJournalReadResult =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ready'; attempt: StorytellingLibraryCreateAttempt }

/**
 * Retains one create intent and exact Project/Edit tuple across a recoverable
 * retry. A different normalized title deliberately starts a new intent.
 */
export function prepareStorytellingLibraryCreateAttempt(input: {
  name: string
  scope: ProjectPersistenceScope
  previous?: StorytellingLibraryCreateAttempt
  createIntentId?: () => string
}): StorytellingLibraryCreateAttempt {
  const normalizedName = normalizeStorytellingName(input.name)
  if (!normalizedName) throw new Error('Name the story before creating it.')
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(input.scope)
  if (
    input.previous?.normalizedName === normalizedName &&
    input.previous.scopeFingerprint === scopeFingerprint
  ) return input.previous

  return {
    createIntentId: (input.createIntentId ?? createProjectCreateIntentId)(),
    normalizedName,
    scopeFingerprint,
  }
}

/**
 * Completes the existing project + named-edit handoff lifecycle without
 * publishing a browser-visible record until its reviewed backend handoff save
 * succeeds. The mutable attempt is intentionally retained by the caller when
 * an error is thrown so retry cannot create a second Project/Edit identity.
 */
export async function completeStorytellingLibraryCreateAttempt(input: {
  attempt: StorytellingLibraryCreateAttempt
  backendPersistenceRequired: boolean
  dependencies: StorytellingLibraryCreateDependencies
  scope: ProjectPersistenceScope
  setup: LocalInternalEditSetupSnapshot
}): Promise<StorytellingLibraryCreateResult> {
  const { attempt, dependencies, scope } = input
  if (attempt.scopeFingerprint !== createProjectPersistenceScopeFingerprint(scope)) {
    throw new Error('The active workspace changed before this story could be created. Start again in the current workspace.')
  }

  if (attempt.backendProjectRevalidationRequired) {
    const revalidatedProject = await dependencies.createBackendProject({
      category: 'storytelling',
      createIntentId: attempt.createIntentId,
      projectName: attempt.normalizedName,
      scope,
    })
    if (revalidatedProject.status === 'failed') {
      throw new Error(revalidatedProject.errorMessage)
    }
    if (attempt.backendProjectResolution === 'created' && (
      revalidatedProject.status !== 'created' ||
      revalidatedProject.projectId !== attempt.backendProjectId
    )) {
      throw new Error('The saved Storytelling project identity could not be revalidated. Nothing was opened.')
    }
    if (
      attempt.backendProjectResolution === 'not_configured' &&
      revalidatedProject.status === 'created'
    ) {
      const projectCreatedAt = attempt.project?.createdAt
      const handoffCreatedAt = attempt.handoff?.createdAt
      const retainedSetup = attempt.handoff?.setup ?? input.setup
      attempt.backendProjectResolution = 'created'
      attempt.backendProjectId = revalidatedProject.projectId
      attempt.project = createLocalProjectRecord({
        category: 'storytelling',
        projectId: revalidatedProject.projectId,
        name: attempt.normalizedName,
        workspaceId: scope.workspaceId,
        ...(projectCreatedAt ? { now: new Date(projectCreatedAt) } : {}),
      })
      attempt.handoff = createLocalInternalProjectHandoff({
        category: 'storytelling',
        editName: attempt.normalizedName,
        editSessionId: createStorytellingEditSessionId(attempt.createIntentId),
        productWorkflow: 'motion_studio.storytelling',
        projectId: revalidatedProject.projectId,
        projectName: attempt.normalizedName,
        setup: retainedSetup,
        workspaceId: scope.workspaceId,
        ...(handoffCreatedAt ? { now: new Date(handoffCreatedAt) } : {}),
      })
    }
    delete attempt.backendProjectRevalidationRequired
  }

  if (!attempt.project) {
    if (!attempt.backendProjectResolution) {
      const backendProjectResult = await dependencies.createBackendProject({
        category: 'storytelling',
        createIntentId: attempt.createIntentId,
        projectName: attempt.normalizedName,
        scope,
      })
      if (backendProjectResult.status === 'failed') {
        throw new Error(backendProjectResult.errorMessage)
      }
      if (backendProjectResult.status === 'not_configured') {
        if (input.backendPersistenceRequired) {
          throw new Error('The Storytelling project could not be created for this workspace. Try again.')
        }
        attempt.backendProjectResolution = 'not_configured'
      } else {
        attempt.backendProjectResolution = 'created'
        attempt.backendProjectId = backendProjectResult.projectId
      }
    }

    attempt.project = createLocalProjectRecord({
      category: 'storytelling',
      projectId: attempt.backendProjectId ?? `local-project-${attempt.createIntentId}`,
      name: attempt.normalizedName,
      workspaceId: scope.workspaceId,
    })
  }

  if (!attempt.handoff) {
    attempt.handoff = createLocalInternalProjectHandoff({
      category: 'storytelling',
      editName: attempt.normalizedName,
      editSessionId: createStorytellingEditSessionId(attempt.createIntentId),
      productWorkflow: 'motion_studio.storytelling',
      projectId: attempt.project.id,
      projectName: attempt.project.name,
      workspaceId: scope.workspaceId,
      setup: input.setup,
    })
  }

  dependencies.persistAttempt?.(attempt)

  if (attempt.backendProjectResolution === 'not_configured') {
    if (input.backendPersistenceRequired) {
      throw new Error('The Storytelling project could not be created for this workspace. Try again.')
    }
    return {
      attempt,
      project: attempt.project,
      handoff: attempt.handoff,
      persistence: 'browser_local',
    }
  }

  if (attempt.backendProjectResolution !== 'created' || !attempt.backendProjectId) {
    throw new Error('The Storytelling project identity could not be verified. Retry without creating a local duplicate.')
  }

  const persistence = await dependencies.persistBackendHandoff(scope, attempt.handoff)
  if (!persistence.ok || !persistence.persisted) {
    throw new Error(
      persistence.errorMessage ??
      'The Storytelling edit could not be saved for account recovery. Nothing was opened.',
    )
  }

  return {
    attempt,
    project: attempt.project,
    handoff: attempt.handoff,
    persistence: 'private_backend',
  }
}

export function buildStorytellingLibraryCreateJournalStorageKey(scope: ProjectPersistenceScope): string {
  return buildProjectPersistenceScopeStorageKey(STORYTELLING_CREATE_JOURNAL_PREFIX, scope)
}

export function readStorytellingLibraryCreateAttemptJournalResult(
  scope: ProjectPersistenceScope,
): StorytellingLibraryCreateJournalReadResult {
  if (!canUseLocalStorage()) return { status: 'empty' }
  try {
    const raw = window.localStorage.getItem(buildStorytellingLibraryCreateJournalStorageKey(scope))
    if (!raw) return { status: 'empty' }
    const parsed = JSON.parse(raw) as unknown
    const attempt = parseStorytellingLibraryCreateJournal(parsed, scope)
    return attempt ? { status: 'ready', attempt } : { status: 'invalid' }
  } catch {
    return { status: 'invalid' }
  }
}

export function writeStorytellingLibraryCreateAttemptJournal(
  scope: ProjectPersistenceScope,
  attempt: StorytellingLibraryCreateAttempt,
): void {
  if (!canUseLocalStorage()) {
    throw new Error('This browser cannot retain the Storytelling create identity for safe recovery.')
  }
  if (attempt.scopeFingerprint !== createProjectPersistenceScopeFingerprint(scope)) {
    throw new Error('The Storytelling create identity does not belong to the active workspace.')
  }
  const journalAttempt = { ...attempt }
  delete journalAttempt.backendProjectRevalidationRequired
  const envelope = {
    schemaVersion: STORYTELLING_CREATE_JOURNAL_VERSION,
    scopeFingerprint: attempt.scopeFingerprint,
    attempt: journalAttempt,
    savedAt: new Date().toISOString(),
  }
  if (!parseStorytellingLibraryCreateJournal(envelope, scope)) {
    throw new Error('The Storytelling create identity could not be safely journaled.')
  }
  window.localStorage.setItem(
    buildStorytellingLibraryCreateJournalStorageKey(scope),
    JSON.stringify(envelope),
  )
}

export function clearStorytellingLibraryCreateAttemptJournal(scope: ProjectPersistenceScope): void {
  if (!canUseLocalStorage()) return
  window.localStorage.removeItem(buildStorytellingLibraryCreateJournalStorageKey(scope))
}

function parseStorytellingLibraryCreateJournal(
  value: unknown,
  scope: ProjectPersistenceScope,
): StorytellingLibraryCreateAttempt | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const envelope = value as {
    schemaVersion?: unknown
    scopeFingerprint?: unknown
    attempt?: unknown
    savedAt?: unknown
  }
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(scope)
  if (
    envelope.schemaVersion !== STORYTELLING_CREATE_JOURNAL_VERSION ||
    envelope.scopeFingerprint !== scopeFingerprint ||
    typeof envelope.savedAt !== 'string' ||
    !isIsoTimestamp(envelope.savedAt) ||
    !envelope.attempt ||
    typeof envelope.attempt !== 'object' ||
    Array.isArray(envelope.attempt)
  ) return undefined

  const record = envelope.attempt as Partial<StorytellingLibraryCreateAttempt>
  const createIntentId = typeof record.createIntentId === 'string'
    ? normalizeProjectCreateIntentId(record.createIntentId)
    : undefined
  const normalizedName = typeof record.normalizedName === 'string'
    ? normalizeStorytellingName(record.normalizedName)
    : ''
  if (
    !createIntentId ||
    normalizedName !== record.normalizedName ||
    record.scopeFingerprint !== scopeFingerprint ||
    (record.backendProjectResolution !== undefined &&
      record.backendProjectResolution !== 'created' &&
      record.backendProjectResolution !== 'not_configured')
  ) return undefined

  const backendProjectId = optionalBoundedId(record.backendProjectId)
  if (
    (record.backendProjectId !== undefined && !backendProjectId) ||
    (record.backendProjectResolution === 'created' && !backendProjectId) ||
    (record.backendProjectResolution === 'not_configured' && backendProjectId) ||
    (record.project !== undefined && !record.backendProjectResolution)
  ) return undefined

  const attempt: StorytellingLibraryCreateAttempt = {
    createIntentId,
    normalizedName,
    scopeFingerprint,
    ...(record.backendProjectResolution
      ? { backendProjectResolution: record.backendProjectResolution }
      : {}),
    ...(backendProjectId ? { backendProjectId } : {}),
  }

  if (record.project !== undefined) {
    const project = parseJournalProject(record.project, attempt, scope)
    if (!project) return undefined
    attempt.project = project
  }
  if (record.handoff !== undefined) {
    if (!attempt.project) return undefined
    const handoff = parseJournalHandoff(record.handoff, attempt, scope)
    if (!handoff) return undefined
    attempt.handoff = handoff
  }
  if (attempt.backendProjectResolution) {
    attempt.backendProjectRevalidationRequired = true
  }
  return attempt
}

function parseJournalProject(
  value: unknown,
  attempt: StorytellingLibraryCreateAttempt,
  scope: ProjectPersistenceScope,
): LocalProjectRecord | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const record = value as Partial<LocalProjectRecord>
  if (
    record.workspaceId !== scope.workspaceId ||
    record.name !== attempt.normalizedName ||
    record.category !== 'storytelling' ||
    typeof record.id !== 'string' ||
    typeof record.createdAt !== 'string' ||
    !isIsoTimestamp(record.createdAt) ||
    record.id !== expectedStorytellingProjectId(attempt)
  ) return undefined

  const canonical = createLocalProjectRecord({
    category: 'storytelling',
    name: attempt.normalizedName,
    projectId: record.id,
    workspaceId: scope.workspaceId,
    now: new Date(record.createdAt),
  })
  return canonicalJson(canonical) === canonicalJson(value) ? canonical : undefined
}

function parseJournalHandoff(
  value: unknown,
  attempt: StorytellingLibraryCreateAttempt,
  scope: ProjectPersistenceScope,
): LocalInternalProjectHandoff | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !attempt.project) return undefined
  const record = value as Partial<LocalInternalProjectHandoff>
  const expectedEditSessionId = createStorytellingEditSessionId(attempt.createIntentId)
  const normalizedValue = record.productWorkflow === undefined && record.editSessionId === expectedEditSessionId
    ? {
        ...record,
        productWorkflow: 'motion_studio.storytelling',
        editorPath: `/motion-studio/storytelling/projects/${encodeURIComponent(attempt.project.id)}/edits/${encodeURIComponent(expectedEditSessionId)}`,
      }
    : value
  const normalizedRecord = normalizedValue as Partial<LocalInternalProjectHandoff>
  const parsed = parseLocalInternalProjectHandoffForScope(normalizedValue, scope)
  if (
    !parsed ||
    canonicalJson(parsed) !== canonicalJson(normalizedValue) ||
    normalizedRecord.workspaceId !== scope.workspaceId ||
    normalizedRecord.projectId !== attempt.project.id ||
    normalizedRecord.projectName !== attempt.normalizedName ||
    normalizedRecord.editName !== attempt.normalizedName ||
    normalizedRecord.category !== 'storytelling' ||
    normalizedRecord.productWorkflow !== 'motion_studio.storytelling' ||
    normalizedRecord.stage !== 'created' ||
    normalizedRecord.sourceFileCount !== 0 ||
    normalizedRecord.editSessionId !== expectedEditSessionId ||
    typeof normalizedRecord.createdAt !== 'string' ||
    !isIsoTimestamp(normalizedRecord.createdAt)
  ) return undefined

  const canonical = createLocalInternalProjectHandoff({
    category: 'storytelling',
    editName: attempt.normalizedName,
    editSessionId: normalizedRecord.editSessionId,
    productWorkflow: 'motion_studio.storytelling',
    projectId: attempt.project.id,
    projectName: attempt.normalizedName,
    setup: parsed.setup,
    workspaceId: scope.workspaceId,
    now: new Date(normalizedRecord.createdAt),
  })
  return canonicalJson(canonical) === canonicalJson(normalizedValue) ? canonical : undefined
}

function expectedStorytellingProjectId(attempt: StorytellingLibraryCreateAttempt): string {
  return attempt.backendProjectResolution === 'created' && attempt.backendProjectId
    ? attempt.backendProjectId
    : `local-project-${attempt.createIntentId}`
}

function createStorytellingEditSessionId(createIntentId: string): string {
  return `storytelling-edit-${createIntentId}`.slice(0, 160)
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJsonValue(value))
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortJsonValue(child)]),
  )
}

function optionalBoundedId(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized && normalized.length <= 160 ? normalized : undefined
}

function isIsoTimestamp(value: string): boolean {
  const timestamp = new Date(value)
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeStorytellingName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80)
}
