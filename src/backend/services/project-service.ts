import type { ChatSessionRecord, ProjectRecord, ProjectStatus } from '../../types'
import type { CreateProjectRequest } from '../contracts/chat-editor-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createProject(
  db: MockDatabase,
  input: CreateProjectRequest,
): ServiceResult<ProjectRecord> {
  const project: ProjectRecord = {
    id: createMockId('project'),
    userId: input.userId,
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description,
    status: 'collecting_context',
    targetPlatform: 'tiktok_reels_shorts',
    aspectRatio: '9:16',
    createdFromChat: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      approvalGate: 'plan_and_credit_estimate_required_before_generation',
    },
  }

  return ok(insertMockRecord(db, 'projects', project))
}

export function getProject(db: MockDatabase, projectId: string): ServiceResult<ProjectRecord> {
  const project = findMockRecord(db, 'projects', projectId)

  return project ? ok(project) : fail('PROJECT_NOT_FOUND', `Project ${projectId} was not found.`)
}

export function setCurrentChatSession(
  db: MockDatabase,
  projectId: string,
  chatSession: ChatSessionRecord,
): ServiceResult<ProjectRecord> {
  return updateProjectStatus(db, projectId, 'collecting_context', {
    currentChatSessionId: chatSession.id,
  })
}

export function setCurrentEditPlan(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<ProjectRecord> {
  return updateProjectStatus(db, projectId, 'awaiting_approval', {
    currentEditPlanId: editPlanId,
  })
}

export function markProjectPlanning(db: MockDatabase, projectId: string): ServiceResult<ProjectRecord> {
  return updateProjectStatus(db, projectId, 'planning')
}

export function markProjectAwaitingApproval(
  db: MockDatabase,
  projectId: string,
): ServiceResult<ProjectRecord> {
  return updateProjectStatus(db, projectId, 'awaiting_approval')
}

export function markProjectGenerating(db: MockDatabase, projectId: string): ServiceResult<ProjectRecord> {
  return updateProjectStatus(db, projectId, 'generating')
}

export function markProjectPreviewReady(
  db: MockDatabase,
  projectId: string,
  latestPreviewRenderId?: string,
): ServiceResult<ProjectRecord> {
  return updateProjectStatus(db, projectId, 'preview_ready', { latestPreviewRenderId })
}

function updateProjectStatus(
  db: MockDatabase,
  projectId: string,
  status: ProjectStatus,
  patch: Partial<ProjectRecord> = {},
): ServiceResult<ProjectRecord> {
  const project = findMockRecord(db, 'projects', projectId)

  if (!project) {
    return fail('PROJECT_NOT_FOUND', `Project ${projectId} was not found.`)
  }

  Object.assign(project, patch, {
    status,
    updatedAt: nowIso(),
  })

  return ok(project)
}
