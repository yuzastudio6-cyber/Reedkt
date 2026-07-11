import { expect, test } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  LEGACY_UNSCOPED_LOCAL_PROJECT_HANDOFF_STORAGE_KEY,
} from '../../src/lib/local-project-handoff'
import {
  buildLocalProjectStorageKey,
  LEGACY_UNSCOPED_LOCAL_PROJECT_STORAGE_KEY,
} from '../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../src/lib/project-persistence-scope'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const currentScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const foreignUserScope = {
  ...currentScope,
  userId: 'foreign-local-test-user',
}
const foreignWorkspaceScope = {
  ...currentScope,
  workspaceId: 'workspace-foreign',
}

test.describe('project persistence tenancy', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1280)
  })

  test('shows only the signed-in user and workspace cache across sign-out and return', async ({ page }) => {
    const now = '2026-07-10T12:00:00.000Z'
    const currentProject = projectRecord('project-current', 'Current scoped project', currentScope.workspaceId, now)
    const foreignUserProject = projectRecord('project-foreign-user', 'Foreign user private project', foreignUserScope.workspaceId, now)
    const foreignWorkspaceProject = projectRecord('project-foreign-workspace', 'Foreign workspace private project', foreignWorkspaceScope.workspaceId, now)
    const foreignHandoff = handoffRecord({
      editSessionId: 'project-foreign-user-edit',
      projectId: foreignUserProject.id,
      projectName: foreignUserProject.name,
      workspaceId: foreignUserScope.workspaceId,
      now,
    })

    await page.addInitScript((input) => {
      window.localStorage.setItem(input.legacyProjectKey, JSON.stringify([
        { id: 'legacy-project', name: 'Legacy unscoped private project' },
      ]))
      window.localStorage.setItem(input.legacyHandoffKey, JSON.stringify([
        { projectId: 'legacy-project', editSessionId: 'legacy-edit', projectName: 'Legacy private edit' },
      ]))
      window.localStorage.setItem(input.currentProjectKey, JSON.stringify(input.currentProjectEnvelope))
      window.localStorage.setItem(input.foreignUserProjectKey, JSON.stringify(input.foreignUserProjectEnvelope))
      window.localStorage.setItem(input.foreignWorkspaceProjectKey, JSON.stringify(input.foreignWorkspaceProjectEnvelope))
      window.localStorage.setItem(input.foreignUserHandoffKey, JSON.stringify(input.foreignUserHandoffEnvelope))
    }, {
      legacyProjectKey: LEGACY_UNSCOPED_LOCAL_PROJECT_STORAGE_KEY,
      legacyHandoffKey: LEGACY_UNSCOPED_LOCAL_PROJECT_HANDOFF_STORAGE_KEY,
      currentProjectKey: buildLocalProjectStorageKey(currentScope),
      foreignUserProjectKey: buildLocalProjectStorageKey(foreignUserScope),
      foreignWorkspaceProjectKey: buildLocalProjectStorageKey(foreignWorkspaceScope),
      foreignUserHandoffKey: buildLocalProjectHandoffStorageKey(foreignUserScope),
      currentProjectEnvelope: projectEnvelope(currentScope, [currentProject], now),
      foreignUserProjectEnvelope: projectEnvelope(foreignUserScope, [foreignUserProject], now),
      foreignWorkspaceProjectEnvelope: projectEnvelope(foreignWorkspaceScope, [foreignWorkspaceProject], now),
      foreignUserHandoffEnvelope: handoffEnvelope(foreignUserScope, [foreignHandoff], now),
    })

    await gotoRoute(page, '/projects')
    await expect(page.getByText('Current scoped project')).toBeVisible()
    await expect(page.getByTestId('projects-recovery-local-only')).toBeVisible()
    await expect(page.getByTestId('projects-recovery-local-only')).toContainText(/browser is the recovery source/i)
    await expect(page.getByText('Foreign user private project')).toHaveCount(0)
    await expect(page.getByText('Foreign workspace private project')).toHaveCount(0)
    await expect(page.getByText('Legacy unscoped private project')).toHaveCount(0)
    await expect(page.getByText('Legacy private edit')).toHaveCount(0)

    await page.getByRole('link', { name: /Open project/i }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Current scoped project' })).toBeVisible()
    await expect(page.getByTestId('project-recovery-local-only')).toContainText(/browser is the recovery source/i)
    await gotoRoute(page, '/projects')

    await page.getByTestId('app-session-identity').getByRole('button', { name: /^Sign out$/i }).click()
    await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
    await expect(page.getByTestId('app-shell')).toHaveCount(0)
    await page.getByTestId('local-test-sign-in').click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByText('Current scoped project')).toBeVisible()
    await expect(page.getByText('Foreign user private project')).toHaveCount(0)
  })

  test('allows two projects with the same display name to keep distinct identities', async ({ page }) => {
    const duplicateName = `Same-name project ${Date.now()}`

    await gotoRoute(page, '/projects/new')
    await page.getByLabel(/Project name/i).fill(duplicateName)
    await page.getByRole('button', { name: /^Create project$/i }).click()
    await expect(page).not.toHaveURL(/\/projects\/new$/)
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)
    const firstProjectPath = new URL(page.url()).pathname

    await gotoRoute(page, '/projects/new')
    await page.getByLabel(/Project name/i).fill(duplicateName)
    await page.getByRole('button', { name: /^Create project$/i }).click()
    await expect(page).not.toHaveURL(/\/projects\/new$/)
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)
    const secondProjectPath = new URL(page.url()).pathname

    expect(secondProjectPath).not.toBe(firstProjectPath)

    await gotoRoute(page, '/projects')
    await expect(page.locator('.projects-card').filter({ hasText: duplicateName })).toHaveCount(2)
  })

  test('keeps the new-edit dialog labelled, contained, escapable, and returns focus', async ({ page }) => {
    const projectName = `Keyboard project ${Date.now()}`

    await gotoRoute(page, '/projects/new')
    await page.getByLabel(/Project name/i).fill(projectName)
    await page.getByRole('button', { name: /^Create project$/i }).click()
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    const newEditButton = page.getByRole('button', { name: /^New edit$/i }).first()
    await newEditButton.click()

    const dialog = page.getByRole('dialog', { name: 'Name this edit' })
    const editNameInput = page.getByLabel(/Edit name/i)
    const closeButton = dialog.getByRole('button', { name: /Close new edit panel/i })
    const createEditButton = dialog.getByRole('button', { name: /^Create edit$/i })
    await expect(dialog).toBeVisible()
    await expect(editNameInput).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(closeButton).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(createEditButton).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(closeButton).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(newEditButton).toBeFocused()
  })

  test('fails closed for a malformed current-key envelope with foreign owner metadata', async ({ page }) => {
    const now = '2026-07-10T12:10:00.000Z'
    const project = projectRecord('project-tampered', 'Tampered private project', currentScope.workspaceId, now)
    const envelope = projectEnvelope(currentScope, [project], now)
    envelope.scope.userId = foreignUserScope.userId

    await page.addInitScript(({ envelope, storageKey }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(envelope))
    }, {
      envelope,
      storageKey: buildLocalProjectStorageKey(currentScope),
    })

    await gotoRoute(page, '/projects')
    await expect(page.getByText('Tampered private project')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /No projects yet/i })).toBeVisible()
  })
})

function projectRecord(id: string, name: string, workspaceId: string, now: string) {
  return {
    id,
    workspaceId,
    name,
    category: 'storytelling' as const,
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry' as const,
  }
}

function handoffRecord(input: {
  editSessionId: string
  projectId: string
  projectName: string
  workspaceId: string
  now: string
}) {
  return {
    id: input.editSessionId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    projectName: input.projectName,
    editName: 'Foreign private edit',
    category: 'storytelling' as const,
    editorPath: `/projects/${input.projectId}/edits/${input.editSessionId}`,
    stage: 'created' as const,
    sourceFileCount: 0,
    createdAt: input.now,
    updatedAt: input.now,
    persistence: 'browser_local_internal_testing' as const,
  }
}

function projectEnvelope(
  scope: typeof currentScope,
  projects: ReturnType<typeof projectRecord>[],
  now: string,
) {
  return {
    recordVersion: 2 as const,
    scope: { ...scope },
    scopeFingerprint: createProjectPersistenceScopeFingerprint(scope),
    projects,
    savedAt: now,
  }
}

function handoffEnvelope(
  scope: typeof currentScope,
  handoffs: ReturnType<typeof handoffRecord>[],
  now: string,
) {
  return {
    recordVersion: 2 as const,
    scope: { ...scope },
    scopeFingerprint: createProjectPersistenceScopeFingerprint(scope),
    handoffs,
    savedAt: now,
  }
}
