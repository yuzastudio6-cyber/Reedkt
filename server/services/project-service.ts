import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  listPrivateRegularFileNamesWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

interface CreateProjectInput {
  workspaceId: string
  name: string
  description?: string
}

export type ProjectView = {
  id: string
  workspaceId: string
  name: string
  description?: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
  mockOnly?: boolean
  providerCallMade?: false
  workerJobCreated?: false
  renderJobCreated?: false
  creditReservedOrSpent?: false
  supabaseWriteMade?: false
  gcsWriteMade?: false
  productReady?: false
}

type PersistedProjectRecord = {
  recordVersion: 'private-internal-project-v2'
  source: 'project_service_scoped_internal_test_persistence'
  persistedAt: string
  project: ProjectView
  recordChecksumSha256: string
}

const localProjects = new Map<string, ProjectView>()

export function clearLocalProjectMemoryForSmoke(): void {
  localProjects.clear()
}

export function createProjectService(context: ServiceContext) {
  return {
    async createProject(input: CreateProjectInput) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')

      if (usesLocalProjectPersistence(context)) {
        const project: ProjectView = {
          id: createMockId('project'),
          workspaceId: access.workspaceId,
          name: normalizeProjectName(input.name),
          description: normalizeOptionalDescription(input.description),
          createdByUserId: access.userId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          mockOnly: true,
          providerCallMade: false,
          workerJobCreated: false,
          renderJobCreated: false,
          creditReservedOrSpent: false,
          supabaseWriteMade: false,
          gcsWriteMade: false,
          productReady: false,
        }
        await persistLocalProject(project, context.env.localStorageRoot)
        localProjects.set(projectMemoryKey(access.userId, access.workspaceId, project.id), project)

        return {
          project,
          warnings: [
            mockWarning('Project creation'),
            'Backend-local project creation persists private project metadata only; it does not start tools, rendering, credits, providers, beta, or production work.',
          ],
        }
      }

      const adminClient = getRequiredProjectAdminClient(context)
      const { data, error } = await adminClient
        .from('projects')
        .insert({
          workspace_id: access.workspaceId,
          owner_id: access.userId,
          title: normalizeProjectName(input.name),
          metadata_json: {
            description: normalizeOptionalDescription(input.description) ?? null,
          },
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { project: projectViewFromDatabaseRow(data, access.userId, access.workspaceId), warnings: [] }
    },

    async getProject(projectId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (usesLocalProjectPersistence(context)) {
        const cacheKey = projectMemoryKey(access.userId, access.workspaceId, projectId)
        const localProject = localProjects.get(cacheKey) ?? await loadLocalProject({
          projectId,
          userId: access.userId,
          workspaceId: access.workspaceId,
          localStorageRoot: context.env.localStorageRoot,
        })
        if (localProject) {
          localProjects.set(cacheKey, localProject)
          return {
            project: localProject,
            warnings: [mockWarning('Project read')],
          }
        }

        throw new ApiError('PROJECT_NOT_FOUND', 'Project was not found for this workspace.', 404)
      }

      const adminClient = getRequiredProjectAdminClient(context)
      const { data, error } = await adminClient
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('workspace_id', access.workspaceId)
        .eq('owner_id', access.userId)
        .maybeSingle()

      throwOnSupabaseError(error, 'PROJECT_NOT_FOUND')
      if (!data) throw new ApiError('PROJECT_NOT_FOUND', 'Project was not found.', 404)
      return { project: projectViewFromDatabaseRow(data, access.userId, access.workspaceId), warnings: [] }
    },

    async listProjects(workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (usesLocalProjectPersistence(context)) {
        const localProjectRecords = await listLocalProjects({
          userId: access.userId,
          workspaceId: access.workspaceId,
          localStorageRoot: context.env.localStorageRoot,
        })
        for (const project of localProjectRecords) {
          localProjects.set(projectMemoryKey(access.userId, access.workspaceId, project.id), project)
        }

        const projects = [...localProjects.entries()]
          .filter(([key]) => key.startsWith(projectMemoryScopePrefix(access.userId, access.workspaceId)))
          .map(([, project]) => project)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

        return {
          projects,
          warnings: [
            mockWarning('Project list'),
            'Project listing uses signed-in user and workspace scoped private internal-test metadata only.',
          ],
        }
      }

      const adminClient = getRequiredProjectAdminClient(context)
      const { data, error } = await adminClient
        .from('projects')
        .select('*')
        .eq('workspace_id', access.workspaceId)
        .eq('owner_id', access.userId)
        .order('updated_at', { ascending: false })

      throwOnSupabaseError(error)
      return {
        projects: (data ?? []).map((row) => projectViewFromDatabaseRow(row, access.userId, access.workspaceId)),
        warnings: [],
      }
    },

  }
}

async function persistLocalProject(project: ProjectView, localStorageRoot: string): Promise<void> {
  assertLocalProjectSafe(project, project.createdByUserId, project.workspaceId)
  const recordWithoutChecksum = {
    recordVersion: 'private-internal-project-v2' as const,
    source: 'project_service_scoped_internal_test_persistence' as const,
    persistedAt: nowIso(),
    project,
  }
  const record: PersistedProjectRecord = {
    ...recordWithoutChecksum,
    recordChecksumSha256: checksumProjectRecord(recordWithoutChecksum),
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: localProjectRegistryObjectRelativePath(
      project.createdByUserId,
      project.workspaceId,
      project.id,
    ),
    content: `${JSON.stringify(record, null, 2)}\n`,
  })
}

async function loadLocalProject(input: {
  projectId: string
  userId: string
  workspaceId: string
  localStorageRoot: string
}): Promise<ProjectView | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: localProjectRegistryObjectRelativePath(
      input.userId,
      input.workspaceId,
      input.projectId,
    ),
  })
  if (!content) return undefined
  return parseLocalProjectRecord(content, input.userId, input.workspaceId, input.projectId)
}

async function listLocalProjects(input: {
  userId: string
  workspaceId: string
  localStorageRoot: string
}): Promise<ProjectView[]> {
  const registryDirectory = localProjectRegistryDirectoryRelativePath(input.userId, input.workspaceId)
  const fileNames = await listPrivateRegularFileNamesWithinRoot({
    rootPath: input.localStorageRoot,
    relativeDirectoryPath: registryDirectory,
  })

  const projects: ProjectView[] = []
  for (const fileName of fileNames) {
    if (!fileName.endsWith('.json') || fileName.startsWith('._')) continue
    const content = await readPrivateTextFileIfExistsWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: `${registryDirectory}/${fileName}`,
    })
    if (!content) continue
    try {
      projects.push(parseLocalProjectRecord(content, input.userId, input.workspaceId))
    } catch (error) {
      if (error instanceof ApiError) continue
      throw error
    }
  }
  return projects
}

function parseLocalProjectRecord(
  content: string,
  expectedUserId: string,
  expectedWorkspaceId: string,
  expectedProjectId?: string,
): ProjectView {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Private internal project registry record is not valid JSON.', 400)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal project registry record is not an object.', 400)
  }
  const record = parsed as Partial<PersistedProjectRecord>
  if (
    record.recordVersion !== 'private-internal-project-v2' ||
    record.source !== 'project_service_scoped_internal_test_persistence' ||
    !record.project ||
    typeof record.recordChecksumSha256 !== 'string'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal project registry record version is not supported.', 400)
  }

  const expectedChecksum = checksumProjectRecord({
    recordVersion: record.recordVersion,
    source: record.source,
    persistedAt: record.persistedAt ?? '',
    project: record.project,
  })
  if (record.recordChecksumSha256 !== expectedChecksum) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal project registry checksum is invalid.', 400)
  }

  assertLocalProjectSafe(record.project, expectedUserId, expectedWorkspaceId)
  if (expectedProjectId && record.project.id !== expectedProjectId) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal project registry ID does not match the requested project.', 400)
  }
  return record.project
}

function assertLocalProjectSafe(project: ProjectView, expectedUserId: string, expectedWorkspaceId: string): void {
  if (
    !project.id?.trim() ||
    project.workspaceId !== expectedWorkspaceId ||
    !project.name?.trim() ||
    project.createdByUserId !== expectedUserId ||
    !project.createdAt?.trim() ||
    !project.updatedAt?.trim() ||
    project.mockOnly !== true
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal project metadata or ownership scope is invalid.', 400)
  }
}

function projectViewFromDatabaseRow(
  value: unknown,
  fallbackUserId: string,
  expectedWorkspaceId: string,
): ProjectView {
  if (!value || typeof value !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Project database response is invalid.', 500)
  }
  const row = value as Record<string, unknown>
  const id = stringField(row.id)
  const workspaceId = stringField(row.workspace_id) ?? stringField(row.workspaceId)
  const name = stringField(row.title) ?? stringField(row.name)
  if (!id || workspaceId !== expectedWorkspaceId || !name) {
    throw new ApiError('VALIDATION_FAILED', 'Project database response did not match the authorized workspace.', 500)
  }
  const metadata = row.metadata_json && typeof row.metadata_json === 'object'
    ? row.metadata_json as Record<string, unknown>
    : undefined
  return {
    id,
    workspaceId,
    name,
    description: stringField(row.description) ?? stringField(metadata?.description),
    createdByUserId: stringField(row.owner_id) ?? stringField(row.created_by) ?? fallbackUserId,
    createdAt: stringField(row.created_at) ?? nowIso(),
    updatedAt: stringField(row.updated_at) ?? nowIso(),
  }
}

function checksumProjectRecord(value: Omit<PersistedProjectRecord, 'recordChecksumSha256'>): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function localProjectRegistryObjectRelativePath(
  userId: string,
  workspaceId: string,
  projectId: string,
): string {
  return `${localProjectRegistryDirectoryRelativePath(userId, workspaceId)}/project-${sha256(projectId)}.json`
}

export function localProjectRegistryDirectoryRelativePath(userId: string, workspaceId: string): string {
  return [
    'projects',
    'private-internal-project-registry-v2',
    `user-${sha256(userId)}`,
    `workspace-${sha256(workspaceId)}`,
  ].join('/')
}

function projectMemoryScopePrefix(userId: string, workspaceId: string): string {
  return `${userId}\u0000${workspaceId}\u0000`
}

function projectMemoryKey(userId: string, workspaceId: string, projectId: string): string {
  return `${projectMemoryScopePrefix(userId, workspaceId)}${projectId}`
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeProjectName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 120) || 'Untitled project'
}

function normalizeOptionalDescription(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ').slice(0, 500)
  return normalized || undefined
}

function usesLocalProjectPersistence(context: ServiceContext): boolean {
  return !context.clients.admin || context.env.mockOnly || context.env.allowInternalTestExecutionWithSupabase
}

function getRequiredProjectAdminClient(context: ServiceContext): NonNullable<ServiceContext['clients']['admin']> {
  const adminClient = context.clients.admin
  if (!adminClient) {
    throw new ApiError('INTERNAL_ERROR', 'Supabase admin client is unavailable for project persistence.', 500)
  }
  return adminClient
}
