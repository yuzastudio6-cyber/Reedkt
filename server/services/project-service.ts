import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

interface CreateProjectInput {
  workspaceId: string
  name: string
  description?: string
}

interface MockProjectRecord {
  id: string
  workspaceId: string
  name: string
  description?: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
  mockOnly: true
  providerCallMade: false
  workerJobCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
}

const mockProjects = new Map<string, MockProjectRecord>()

export function createProjectService(context: ServiceContext) {
  return {
    async createProject(input: CreateProjectInput) {
      const userId = getRequiredAuthUserId(context)

      if (!context.clients.admin || context.env.mockOnly) {
        const now = nowIso()
        const project: MockProjectRecord = {
          id: createMockId('project'),
          workspaceId: input.workspaceId,
          name: input.name.trim(),
          description: input.description?.trim() || undefined,
          createdByUserId: userId,
          createdAt: now,
          updatedAt: now,
          mockOnly: true,
          providerCallMade: false,
          workerJobCreated: false,
          renderJobCreated: false,
          creditReservedOrSpent: false,
          supabaseWriteMade: false,
          gcsWriteMade: false,
          productReady: false,
        }
        mockProjects.set(project.id, project)
        return {
          project,
          warnings: [
            mockWarning('Project creation'),
            'Backend-local project creation does not start edit planning, tools, rendering, credits, Supabase writes, GCS, beta, or production work.',
          ],
        }
      }

      const { data, error } = await context.clients.admin
        .from('projects')
        .insert({
          workspace_id: input.workspaceId,
          name: input.name,
          description: input.description ?? null,
          created_by: userId,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { project: data, warnings: [] }
    },

    async getProject(projectId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        const existing = mockProjects.get(projectId)
        if (existing) {
          return {
            project: existing,
            warnings: [mockWarning('Project read')],
          }
        }
        return {
          project: {
            id: projectId,
            name: 'Mock Project',
            status: 'mock',
            mockOnly: true,
            providerCallMade: false,
            workerJobCreated: false,
            renderJobCreated: false,
            creditReservedOrSpent: false,
            supabaseWriteMade: false,
            gcsWriteMade: false,
            productReady: false,
          },
          warnings: [mockWarning('Project read')],
        }
      }

      const { data, error } = await context.clients.admin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle()

      throwOnSupabaseError(error, 'PROJECT_NOT_FOUND')
      if (!data) throw new ApiError('PROJECT_NOT_FOUND', 'Project was not found.', 404)
      return { project: data, warnings: [] }
    },

    async listProjects(workspaceId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        const projects = Array.from(mockProjects.values())
          .filter((project) => project.workspaceId === workspaceId)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        return {
          projects,
          warnings: [
            mockWarning('Project list'),
            'Backend-local project listing reads mock-safe project records only; no tools, rendering, credits, Supabase writes, GCS, beta, or production work starts.',
          ],
        }
      }

      const { data, error } = await context.clients.admin
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })

      throwOnSupabaseError(error)
      return { projects: data ?? [], warnings: [] }
    },
  }
}
