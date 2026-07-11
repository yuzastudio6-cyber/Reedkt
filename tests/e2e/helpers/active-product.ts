import type { Page } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../../src/lib/local-project-handoff'
import {
  buildLocalProjectStorageKey,
  type LocalProjectRecord,
} from '../../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../../src/lib/project-persistence-scope'

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
): Promise<ActiveProductRouteFixture> {
  const id = normalizeFixtureId(label)
  const projectId = `qa-project-${id}`
  const editSessionId = `qa-edit-${id}`
  const now = '2026-07-10T12:00:00.000Z'
  const project: LocalProjectRecord = {
    id: projectId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    name: `Viewport project ${id}`,
    category: 'storytelling',
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry',
  }
  const editPath = `/projects/${projectId}/edits/${editSessionId}`
  const edit: LocalInternalProjectHandoff = {
    id: editSessionId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId,
    editSessionId,
    projectName: project.name,
    editName: `Upload gate ${id}`,
    category: project.category,
    editorPath: editPath,
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
      projects: [input.project],
      savedAt: input.now,
    }))
    window.localStorage.setItem(input.handoffStorageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      handoffs: [input.edit],
      savedAt: input.now,
    }))
  }, {
    edit,
    handoffStorageKey: buildLocalProjectHandoffStorageKey(activeProductLocalTestScope),
    now,
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
