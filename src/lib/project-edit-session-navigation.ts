import type { ProjectEditSessionNavigationBoundary } from '../types/project-edit-session-navigation'

function segment(value: string): string {
  return encodeURIComponent(value)
}

export function createProjectHomePath(projectId: string): string {
  return `/projects/${segment(projectId)}`
}

export function createProjectEditSessionPath(projectId: string, editSessionId: string): string {
  return `${createProjectHomePath(projectId)}/edits/${segment(editSessionId)}`
}

export function createProjectEditSessionChatPath(projectId: string, editSessionId: string): string {
  return `${createProjectEditSessionPath(projectId, editSessionId)}/chat`
}

export function createProjectEditSessionBriefPath(projectId: string, editSessionId: string): string {
  return `${createProjectEditSessionPath(projectId, editSessionId)}/brief`
}

export function createProjectEditSessionHistoryPath(projectId: string, editSessionId: string): string {
  return `${createProjectEditSessionPath(projectId, editSessionId)}/history`
}

export function createProjectEditSessionVersionsPath(projectId: string, editSessionId: string): string {
  return `${createProjectEditSessionPath(projectId, editSessionId)}/versions`
}

export function createProjectEditSessionPreviewPath(projectId: string, editSessionId: string): string {
  return `${createProjectEditSessionPath(projectId, editSessionId)}/preview`
}

export function createProjectEditSessionDetailsPath(projectId: string, editSessionId: string): string {
  return `${createProjectEditSessionPath(projectId, editSessionId)}/details`
}

export function createLegacyEditorPath(): string {
  return '/projects/new'
}

export function createProjectEditSessionNavigationBoundary(): ProjectEditSessionNavigationBoundary {
  return {
    mockOnly: true,
    startsProgress: false,
    startsRender: false,
    startsWorker: false,
    callsProvider: false,
    callsModel: false,
    reservesCredits: false,
    writesRemoteSupabase: false,
    warnings: [
      'Navigation changes route chrome only; it does not start edit execution.',
      'The Brief route is read-only in RP-EDITBRIEF-05; marker creation, Marker Chat, uploads, and export changes remain future work.',
      'Versions and Preview routes show mock history state only; real render/export remains future gated.',
      'The retired /editor route redirects to Project start; session-specific testing uses Project Home, Edit Chat, and Brief.',
    ],
  }
}
