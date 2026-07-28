import { expect, test } from '@playwright/test'
import { stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { setViewport } from './helpers/layout'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
} from './helpers/routes'
import {
  createAndApproveActivePlan,
  expectLocalApiHealth,
  readActiveHandoff,
  signInAndCreateActiveProjectEdit,
  uploadActiveEditorSource,
} from './helpers/real-local-api-journey'

const apiBaseUrl = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ?? 'http://127.0.0.1:9781'
const localStorageRoot = process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'
const externalFixturePath = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH?.trim()
const fixturePath = externalFixturePath ? resolve(externalFixturePath) : ''

let fixtureReady = false
let fixtureSkipReason = 'Real video fixture path was not provided.'

test.describe('Active signed-in project to approved named-edit plan', () => {
  test.skip(
    process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API !== 'true',
    'Start the local API/app stack with dev:internal-testing:local-upload or equivalent env before running this spec.',
  )

  test.beforeAll(async () => {
    if (!fixturePath) return
    try {
      const fixtureStat = await stat(fixturePath)
      fixtureReady = fixtureStat.isFile() && fixtureStat.size > 0 && extname(fixturePath).toLowerCase() === '.mp4'
      fixtureSkipReason = fixtureReady ? '' : 'External real-video fixture must be a non-empty MP4 file.'
    } catch (caught) {
      fixtureSkipReason = caught instanceof Error ? caught.message : 'External real-video fixture was not found.'
      fixtureReady = false
    }
  })

  test('uploads real source, plans from chat direction, and records approval safely', async ({ page }) => {
    test.setTimeout(240_000)
    test.skip(!fixtureReady, fixtureSkipReason)
    await expectLocalApiHealth(apiBaseUrl)
    await setViewport(page, 1440)

    const edit = await signInAndCreateActiveProjectEdit(page, {
      projectName: `Prompt-first local API ${Date.now()}`,
      editName: 'Prompt-first approved edit',
    })
    await uploadActiveEditorSource(page, {
      edit,
      fixturePath,
      localStorageRoot,
    })

    const prompt = 'Create a clean source-led internal review with natural pacing, restrained visuals, no music, and no captions.'
    const outcome = await createAndApproveActivePlan(page, { prompt, timeoutMs: 90_000 })
    expect(['canonical_approved_snapshot', 'private_review_ready']).toContain(outcome)

    const handoff = await readActiveHandoff(page, edit)
    expect(handoff?.setup?.customInstructions).toContain(prompt)
    expect(handoff?.stage).toMatch(/plan_approved|private_review_ready/)
    expect(handoff?.approvedSnapshotId).toBeTruthy()
    await expect(page.locator('body')).not.toContainText(
      /provider call made:\s*true|live qwen call:\s*true|production ready:\s*true|signed url (created|enabled|ready)|public delivery enabled:\s*true/i,
    )
  })

  test('uses the inline Edit Brief on the canonical named-edit route before approval', async ({ page }) => {
    test.setTimeout(240_000)
    test.skip(!fixtureReady, fixtureSkipReason)
    await expectLocalApiHealth(apiBaseUrl)
    await setViewport(page, 1440)

    const edit = await signInAndCreateActiveProjectEdit(page, {
      projectName: `Inline Brief local API ${Date.now()}`,
      editName: 'Inline Brief approved edit',
    })
    await uploadActiveEditorSource(page, {
      edit,
      fixturePath,
      localStorageRoot,
    })

    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }).first())
    await expect(page.getByText(/Source prep is ready for 1 uploaded source file/i)).toBeVisible()
    await clickWhenReady(page.getByTestId('editor-header-edit-brief'))
    await expect(page).toHaveURL(/[?&]view=brief(?:&|$)/)
    await expect(page.getByTestId('editor-edit-brief-canvas')).toBeVisible()
    await expect(page.getByText(/Prepare the source in Chat first/i)).toHaveCount(0)
    const details = page.getByTestId('edit-brief-direction-details')
    if (await details.getAttribute('open') === null) {
      await clickWhenReady(details.locator('summary'))
    }
    const goal = 'Keep the speaker clear, preserve the full source meaning, and use a restrained professional finish.'
    await page.getByTestId('edit-brief-goal-input').fill(goal)
    const durableBriefSave = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return ['POST', 'PATCH'].includes(response.request().method())
        && /^\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/edit-brief$/.test(
          url.pathname,
        )
    })
    await clickWhenReady(page.getByTestId('edit-brief-mark-ready'))
    expect((await durableBriefSave).ok()).toBe(true)
    await expect(page.getByTestId('edit-brief-authority-status')).toHaveAttribute(
      'data-state',
      'saved',
    )
    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
    await expect(page).not.toHaveURL(/[?&]view=brief(?:&|$)/)

    const outcome = await createAndApproveActivePlan(page, {
      sourceAlreadyPrepared: true,
      timeoutMs: 90_000,
    })
    expect(['canonical_approved_snapshot', 'private_review_ready']).toContain(outcome)
    const handoff = await readActiveHandoff(page, edit)
    expect(handoff?.editBriefState?.editBrief.goal).toBe(goal)
    expect(handoff?.approvedSnapshotId).toBeTruthy()
  })

  test('restores exact uploaded-source authority after reloading the named edit', async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!fixtureReady, fixtureSkipReason)
    await expectLocalApiHealth(apiBaseUrl)
    await setViewport(page, 1440)

    const edit = await signInAndCreateActiveProjectEdit(page, {
      projectName: `Reload source local API ${Date.now()}`,
      editName: 'Reloaded source authority edit',
    })
    const uploaded = await uploadActiveEditorSource(page, {
      edit,
      fixturePath,
      localStorageRoot,
    })
    const sourceChecksum = uploaded.handoff.sourceMediaAssets?.[0]?.checksumSha256
    const sourceStoragePath = uploaded.storagePath

    await page.reload()
    await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('source-summary')).toContainText(
      uploaded.handoff.sourceMediaAssets?.[0]?.fileName ?? '',
    )
    await expect(page.getByTestId('edit-upload-gate')).toHaveCount(0)
    const restored = await readActiveHandoff(page, edit)
    expect(restored?.sourceMediaAssets?.[0]?.checksumSha256).toBe(sourceChecksum)
    expect(restored?.sourceMediaAssets?.[0]?.storagePath).toBe(sourceStoragePath)
    expect(restored?.sourceMediaAssets?.[0]?.privateArtifact).toBe(true)
    expect(restored?.sourceMediaAssets?.[0]?.publicUrl).toBeNull()
    expect(restored?.sourceMediaAssets?.[0]?.signedUrl).toBeNull()
  })
})
