import type { Page } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalProductWorkflow,
  type LocalInternalProjectHandoff,
} from '../../../src/lib/local-project-handoff'
import {
  buildLocalProjectStorageKey,
  type LocalProjectRecord,
} from '../../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../../src/lib/project-persistence-scope'
import type { EditingCategory } from '../../../src/types/reeditpro'

export const activeProductLocalTestScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}

export type ActiveProductRouteFixture = {
  edit: LocalInternalProjectHandoff
  editPath: string
  project: LocalProjectRecord
  projectPath: string
}

/**
 * Seeds the exact scoped browser envelopes used by the active project and named-edit routes.
 * The fixture is deliberately local-test only: it does not mock a production workspace,
 * bearer token, provider execution, billing, or backend durability.
 */
export async function installActiveProductRouteFixture(
  page: Page,
  label: string,
  options: {
    category?: EditingCategory
    preserveOnReload?: boolean
    productWorkflow?: LocalProductWorkflow
  } = {},
): Promise<ActiveProductRouteFixture> {
  const id = normalizeFixtureId(label)
  const projectId = `qa-project-${id}`
  const editSessionId = `qa-edit-${id}`
  const now = '2026-07-10T12:00:00.000Z'
  const project: LocalProjectRecord = {
    id: projectId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    name: `Viewport project ${id}`,
    category: options.category ?? 'storytelling',
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry',
  }
  const editPath = options.productWorkflow === 'motion_studio.storytelling'
    ? `/motion-studio/storytelling/projects/${projectId}/edits/${editSessionId}`
    : `/projects/${projectId}/edits/${editSessionId}`
  const edit: LocalInternalProjectHandoff = {
    id: editSessionId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId,
    editSessionId,
    projectName: project.name,
    editName: `Upload gate ${id}`,
    category: project.category,
    productWorkflow: options.productWorkflow ?? 'video_edit',
    editorPath: editPath,
    stage: 'created',
    sourceFileCount: 0,
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_local_internal_testing',
  }
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(activeProductLocalTestScope)

  await page.addInitScript((input) => {
    if (!input.preserveOnReload || !window.localStorage.getItem(input.projectStorageKey)) {
      window.localStorage.setItem(input.projectStorageKey, JSON.stringify({
        recordVersion: 2,
        scope: input.scope,
        scopeFingerprint: input.scopeFingerprint,
        projects: [input.project],
        savedAt: input.now,
      }))
    }
    if (!input.preserveOnReload || !window.localStorage.getItem(input.handoffStorageKey)) {
      window.localStorage.setItem(input.handoffStorageKey, JSON.stringify({
        recordVersion: 2,
        scope: input.scope,
        scopeFingerprint: input.scopeFingerprint,
        handoffs: [input.edit],
        savedAt: input.now,
      }))
    }
  }, {
    edit,
    handoffStorageKey: buildLocalProjectHandoffStorageKey(activeProductLocalTestScope),
    now,
    preserveOnReload: options.preserveOnReload === true,
    project,
    projectStorageKey: buildLocalProjectStorageKey(activeProductLocalTestScope),
    scope: activeProductLocalTestScope,
    scopeFingerprint,
  })

  return {
    edit,
    editPath,
    project,
    projectPath: `/projects/${projectId}`,
  }
}

export type ProductWorkflowSeparationFixture = {
  motionEdit: LocalInternalProjectHandoff
  normalEdit: LocalInternalProjectHandoff
}

/**
 * Proves that Storytelling is a content category, not a Motion Studio switch.
 * Both records use that category; only the explicit product workflow decides
 * which library owns the edit.
 */
export async function installProductWorkflowSeparationFixture(
  page: Page,
  label: string,
): Promise<ProductWorkflowSeparationFixture> {
  const id = normalizeFixtureId(label)
  const now = '2026-07-10T12:00:00.000Z'
  const normalProjectId = `qa-normal-project-${id}`
  const normalEditSessionId = `qa-normal-edit-${id}`
  const motionProjectId = `qa-motion-project-${id}`
  const motionEditSessionId = `storytelling-edit-${id}`
  const normalProject: LocalProjectRecord = {
    id: normalProjectId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    name: 'Normal Storytelling Project',
    category: 'storytelling',
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry',
  }
  const motionProject: LocalProjectRecord = {
    id: motionProjectId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    name: 'Motion Storytelling Project',
    category: 'storytelling',
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry',
  }
  const normalEdit: LocalInternalProjectHandoff = {
    id: normalEditSessionId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId: normalProjectId,
    editSessionId: normalEditSessionId,
    projectName: normalProject.name,
    editName: 'Normal Storytelling Edit',
    category: 'storytelling',
    productWorkflow: 'video_edit',
    editorPath: `/projects/${normalProjectId}/edits/${normalEditSessionId}`,
    stage: 'created',
    sourceFileCount: 0,
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_local_internal_testing',
  }
  const motionEdit: LocalInternalProjectHandoff = {
    id: motionEditSessionId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId: motionProjectId,
    editSessionId: motionEditSessionId,
    projectName: motionProject.name,
    editName: 'Motion Studio Story',
    category: 'storytelling',
    productWorkflow: 'motion_studio.storytelling',
    editorPath: `/motion-studio/storytelling/projects/${motionProjectId}/edits/${motionEditSessionId}`,
    stage: 'created',
    sourceFileCount: 0,
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_local_internal_testing',
  }
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(activeProductLocalTestScope)

  await page.addInitScript((input) => {
    window.localStorage.setItem(input.projectStorageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      projects: input.projects,
      savedAt: input.now,
    }))
    window.localStorage.setItem(input.handoffStorageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      handoffs: input.edits,
      savedAt: input.now,
    }))
  }, {
    edits: [normalEdit, motionEdit],
    handoffStorageKey: buildLocalProjectHandoffStorageKey(activeProductLocalTestScope),
    now,
    projects: [normalProject, motionProject],
    projectStorageKey: buildLocalProjectStorageKey(activeProductLocalTestScope),
    scope: activeProductLocalTestScope,
    scopeFingerprint,
  })

  return { motionEdit, normalEdit }
}

export function missingNamedEditPath(label: string): string {
  const id = normalizeFixtureId(label)
  return `/projects/qa-missing-project-${id}/edits/qa-missing-edit-${id}`
}

function normalizeFixtureId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'active-product'
}
