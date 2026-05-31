import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { getRequiredAuthUserId, mockWarning, sanitizeJson, throwOnSupabaseError } from './service-helpers'

interface CreateProjectInput {
  workspaceId: string
  name: string
  description?: string
}

interface ProjectRow {
  id?: string
  workspace_id?: string
  owner_id?: string
  title?: string
  editing_category?: string | null
  status?: string
  metadata_json?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

interface WorkspaceMemberRow {
  id?: string
  workspace_id?: string
  user_id?: string
  role?: string | null
  created_at?: string
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function projectSummary(project: ProjectRow) {
  return {
    id: stringValue(project.id),
    workspaceId: stringValue(project.workspace_id),
    ownerId: stringValue(project.owner_id),
    title: stringValue(project.title),
    editingCategory: stringValue(project.editing_category),
    status: stringValue(project.status),
    metadata: sanitizeJson(project.metadata_json),
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }
}

function membershipSummary(member: WorkspaceMemberRow) {
  return {
    id: stringValue(member.id),
    workspaceId: stringValue(member.workspace_id),
    userId: stringValue(member.user_id),
    role: stringValue(member.role) ?? 'viewer',
    createdAt: member.created_at,
  }
}

export function createProjectService(context: ServiceContext) {
  return {
    async createProject(_input: CreateProjectInput): Promise<{ project: null; warnings: string[] }> {
      getRequiredAuthUserId(context)
      throw new ApiError(
        'VALIDATION_FAILED',
        'Project creation is outside Prompt 3 scope. Prompt 3 only enables project access checks against canonical workspace membership.',
        409,
      )
    },

    async getProject(projectId: string) {
      const result = await this.checkProjectAccess(projectId)
      return {
        project: result.project,
        membership: result.membership,
        warnings: result.warnings,
      }
    },

    async checkProjectAccess(projectId: string) {
      const userId = getRequiredAuthUserId(context)

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          status: 'backend_required' as const,
          hasAccess: false,
          project: null,
          membership: null,
          warnings: [mockWarning('Project access check')],
        }
      }

      const { data: projectData, error: projectError } = await context.clients.admin
        .from('projects')
        .select('id, workspace_id, owner_id, title, editing_category, status, metadata_json, created_at, updated_at')
        .eq('id', projectId)
        .maybeSingle()

      throwOnSupabaseError(projectError, 'PROJECT_NOT_FOUND')
      if (!projectData) throw new ApiError('PROJECT_NOT_FOUND', 'Project was not found or is not accessible.', 404)

      const project = projectData as ProjectRow
      const workspaceId = stringValue(project.workspace_id)
      if (!workspaceId) {
        throw new ApiError('INTERNAL_ERROR', 'Project is missing canonical workspace_id.', 500)
      }

      const { data: membershipData, error: membershipError } = await context.clients.admin
        .from('workspace_members')
        .select('id, workspace_id, user_id, role, created_at')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()

      throwOnSupabaseError(membershipError)
      if (!membershipData) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Project was not found or is not accessible.', 403)
      }

      return {
        status: 'ready' as const,
        hasAccess: true,
        project: projectSummary(project),
        membership: membershipSummary(membershipData as WorkspaceMemberRow),
        warnings: [],
      }
    },
  }
}
