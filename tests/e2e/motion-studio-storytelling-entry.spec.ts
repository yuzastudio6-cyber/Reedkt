import { Buffer } from 'node:buffer'
import { expect, test, type Page } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import {
  buildLocalProjectStorageKey,
  type LocalProjectRecord,
} from '../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../src/lib/project-persistence-scope'
import type { MotionStudioProductionDto } from '../../src/types/motion-studio'
import type { EditingCategory } from '../../src/types/reeditpro'
import { activeProductLocalTestScope } from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const handoffStorageKey = buildLocalProjectHandoffStorageKey(activeProductLocalTestScope)
const apiOrigin = 'http://127.0.0.1:8791'

test.describe('Motion Studio Storytelling source-less Chat entry', () => {

  test('starts from an idea without source, survives reload, then accepts optional source attachment', async ({ page }) => {
    const fixture = await installCategorizedFixture(
      page,
      'storytelling-idea-first',
      'storytelling',
      'motion_studio.storytelling',
    )
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    await page.route(
      `${apiOrigin}/v1/projects/${fixture.project.id}/edit-sessions/${fixture.edit.editSessionId}/motion-studio`,
      async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          status: 200,
          body: JSON.stringify({ ok: true, statusCode: 200, data: { production }, warnings: [], mockOnly: false }),
        })
      },
    )
    await installCanonicalPrivateSourceUploadFixture(page, fixture.project.id)
    await setViewport(page, 1440)
    await gotoRoute(page, fixture.editPath)

    await expect(page.getByTestId('edit-upload-gate')).toHaveCount(0)
    await expect(page.getByTestId('storytelling-director-start')).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
    await expect(page.getByTestId('edit-preview-rail')).toHaveCount(0)
    await expect(page.getByTestId('editor-header')).toContainText(fixture.edit.editName ?? fixture.project.name)
    await expect(page.getByTestId('editor-header')).not.toContainText('Planning setup')
    await expect(page.getByTestId('editor-header')).not.toContainText('Edit Preferences')
    await expect(page.getByTestId('editor-header')).not.toContainText('Estimate pending')
    await expect(page.getByTestId('edit-workspace-motion-studio')).toHaveCount(0)

    const preparedStarter = page.getByRole('button', { name: 'Use prepared story' })
    await preparedStarter.focus()
    await preparedStarter.press('Enter')
    await expect(page.getByTestId('chat-composer-textarea')).toBeFocused()
    await expect(page.getByTestId('chat-composer-textarea')).toHaveValue(/I already have a prepared story/)
    await expect(page.locator('article[data-message-type="user_message"]')).toHaveCount(0)

    const direction = 'Tell a tense documentary story about a rescue operation, beginning with the failed first attempt.'
    await page.getByTestId('chat-composer-textarea').fill(direction)
    await page.getByTestId('chat-composer-send').click()
    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: direction })).toBeVisible()
    await expect(page.getByText(/saved that as the starting story direction/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your story direction is captured' })).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toHaveValue('')
    await expectNoGenerationBeforeApproval(page)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Your story direction is captured' })).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
    await expect(page.getByTestId('chat-composer-textarea')).toHaveValue('')
    await expect(page.getByRole('link', { name: 'Back to Storytelling library' })).toHaveAttribute(
      'href',
      '/motion-studio/storytelling',
    )

    await page.locator('.chat-attachment-tray input[type="file"]').setInputFiles({
      name: 'optional-story-source.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('mock-safe optional Storytelling source bytes'),
    })
    await expect(page.getByTestId('source-summary')).toBeVisible()
    await expect(page.getByTestId('source-summary')).toContainText('optional-story-source.mp4')
    await expect(page.getByTestId('storytelling-director-start')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your story direction is captured' })).toBeVisible()
    await expect(page.getByTestId('storytelling-source-upload-status')).toContainText('private source file is ready')
    await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
    await expect(page.getByTestId('edit-preview-rail')).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('does not let a Storytelling query override unlock a non-Storytelling edit', async ({ page }) => {
    const fixture = await installCategorizedFixture(page, 'storytelling-query-spoof', 'lifestyle')
    await setViewport(page, 1440)
    await gotoRoute(page, `${fixture.editPath}?category=storytelling`)

    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Upload source video' })).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
    await expect(page.getByTestId('storytelling-director-start')).toHaveCount(0)
    await expect(page.getByTestId('editor-header')).toContainText('Source needed')
  })

})

function createProduction(projectId: string, editSessionId: string): MotionStudioProductionDto {
  return {
    id: '81818181-8181-4181-8181-818181818181',
    projectId,
    editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: 'draft',
    currentStage: 'director_brief',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:00.000Z',
    localCandidateOnly: true,
  }
}

async function installCanonicalPrivateSourceUploadFixture(page: Page, projectId: string) {
  const uploadIntentId = 'storytelling-source-upload-intent'
  const objectPath = `workspaces/${activeProductLocalTestScope.workspaceId}/projects/${projectId}/source-media/${uploadIntentId}/optional-story-source.mp4`
  const checksumSha256 = 'a'.repeat(64)

  await page.route(`${apiOrigin}/v1/projects/${projectId}/upload-intents`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      status: 201,
      body: JSON.stringify({
        ok: true,
        data: {
          uploadIntent: {
            id: uploadIntentId,
            targetBucket: 'source-media',
            targetPath: objectPath,
          },
          uploadTarget: {
            uploadMethod: 'PUT',
            uploadUrl: `/v1/upload-intents/${uploadIntentId}/local-object`,
            uploadHeaders: { 'content-type': 'video/mp4' },
            bucketName: 'source-media',
            objectPath,
            uploadProtocol: 'single_put',
            supportsResume: false,
          },
        },
        warnings: [],
      }),
    })
  })

  await page.route(`${apiOrigin}/v1/upload-intents/${uploadIntentId}/local-object`, async (route) => {
    await route.fulfill({ status: 201, body: '' })
  })

  await page.route(`${apiOrigin}/v1/upload-intents/${uploadIntentId}/finalize`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      status: 201,
      body: JSON.stringify({
        ok: true,
        data: {
          uploadIntent: {
            id: uploadIntentId,
            status: 'finalized',
            mockOnly: false,
          },
          storageObjectRecord: {
            id: 'storytelling-source-object',
            bucketName: 'source-media',
            objectPath,
            storageProvider: 'local_private',
            mimeType: 'video/mp4',
            sizeBytes: 44,
            checksumSha256,
            mockOnly: false,
          },
          mediaAsset: {
            id: 'storytelling-source-media',
            workspaceId: activeProductLocalTestScope.workspaceId,
            projectId,
            fileName: 'optional-story-source.mp4',
            mimeType: 'video/mp4',
            storageBucket: 'source-media',
            storagePath: objectPath,
            storageProvider: 'local_private',
            sizeBytes: 44,
            checksumSha256,
            status: 'ready',
            mockOnly: false,
          },
        },
        warnings: [],
      }),
    })
  })
}

async function installCategorizedFixture(
  page: Page,
  label: string,
  category: EditingCategory,
  productWorkflow: LocalInternalProjectHandoff['productWorkflow'] = 'video_edit',
): Promise<{
  edit: LocalInternalProjectHandoff
  editPath: string
  project: LocalProjectRecord
  projectPath: string
}> {
  const id = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const projectId = `qa-project-${id}`
  const editSessionId = `qa-edit-${id}`
  const now = '2026-07-18T12:00:00.000Z'
  const project: LocalProjectRecord = {
    id: projectId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    name: `Category project ${id}`,
    category,
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry',
  }
  const editPath = productWorkflow === 'motion_studio.storytelling'
    ? `/motion-studio/storytelling/projects/${projectId}/edits/${editSessionId}`
    : `/projects/${projectId}/edits/${editSessionId}`
  const edit: LocalInternalProjectHandoff = {
    id: editSessionId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId,
    editSessionId,
    projectName: project.name,
    editName: `Category edit ${id}`,
    category,
    productWorkflow,
    editorPath: editPath,
    stage: 'created',
    sourceFileCount: 0,
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_local_internal_testing',
  }
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(activeProductLocalTestScope)

  await page.addInitScript((input) => {
    if (!window.localStorage.getItem(input.projectStorageKey)) {
      window.localStorage.setItem(input.projectStorageKey, JSON.stringify({
        recordVersion: 2,
        scope: input.scope,
        scopeFingerprint: input.scopeFingerprint,
        projects: [input.project],
        savedAt: input.now,
      }))
    }
    if (!window.localStorage.getItem(input.handoffStorageKey)) {
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
    handoffStorageKey,
    now,
    project,
    projectStorageKey: buildLocalProjectStorageKey(activeProductLocalTestScope),
    scope: activeProductLocalTestScope,
    scopeFingerprint,
  })

  return { edit, editPath, project, projectPath: `/projects/${projectId}` }
}
