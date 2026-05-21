import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

interface CreateProjectInput {
  workspaceId: string
  name: string
  description?: string
}

export function createProjectService(context: ServiceContext) {
  return {
    async createProject(input: CreateProjectInput) {
      const userId = getRequiredAuthUserId(context)

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          project: {
            id: createMockId('project'),
            workspaceId: input.workspaceId,
            name: input.name,
            description: input.description,
            createdByUserId: userId,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Project creation')],
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
        return {
          project: {
            id: projectId,
            name: 'Mock Project',
            status: 'mock',
            mockOnly: true,
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
  }
}
