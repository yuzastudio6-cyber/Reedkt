import { expect, test } from '@playwright/test'
import { stat } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const apiBaseUrl = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ?? 'http://127.0.0.1:9781'
const localStorageRoot = process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'
const externalFixturePath = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH?.trim()
const fixturePath = externalFixturePath ? resolve(externalFixturePath) : ''
const fixtureFileName = fixturePath ? basename(fixturePath) : 'internal-testing.mp4'
const uploadedFixtureFileName = fixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')

let fixtureReady = false
let fixtureSkipReason = 'Real video fixture path was not provided.'

test.describe('Project creation to edit upload against real local API', () => {
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

  test('creates a project, creates a named edit, uploads video, and approves a local plan', async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!fixtureReady, fixtureSkipReason)

    const healthResponse = await fetch(`${apiBaseUrl}/health`)
    expect(healthResponse.ok).toBe(true)
    const health = await healthResponse.json() as { data?: { runtime?: { mode?: string; mockOnly?: boolean } } }
    expect(health.data?.runtime?.mode).toBe('local')
    expect(health.data?.runtime?.mockOnly).toBe(true)

    await setViewport(page, 1440)

    if (process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH === 'true') {
      await gotoRoute(page, `/sign-in?redirect=${encodeURIComponent('/projects/new')}`)
      await expect(page.getByTestId('auth-local-testing-session-notice')).toContainText('Local app session is enabled')
      await page.getByLabel('Email').fill('source.upload.tester@reeditpro.local')
      await page.getByLabel('Password').fill('reeditpro-testing')
      await page.getByTestId('auth-submit-button').click()
      await expect(page).toHaveURL(/\/projects\/new$/)
    } else {
      await gotoRoute(page, '/projects/new')
    }

    const projectName = `Browser QA Project ${Date.now()}`
    const editName = 'Real video browser QA edit'

    await expect(page.getByTestId('project-create-flow')).toContainText('Start with the project')
    await page.getByTestId('project-create-name-input').fill(projectName)
    await page.getByRole('button', { name: /^Create project$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/?]+\?newEdit=1$/)
    await expect(page.getByTestId('project-edit-session-home')).toBeVisible()
    await expect(page.getByTestId('new-edit-session-create-panel')).toBeVisible()
    await expect(page.getByText(projectName)).toBeVisible()

    await page.getByTestId('new-edit-name-input').fill(editName)
    await page.getByTestId('new-edit-aspect-16:9').click()
    await page.getByTestId('new-edit-platform-youtube_standard').click()
    await expect(page.getByRole('button', { name: /^Create edit$/i })).toBeEnabled()
    await page.getByRole('button', { name: /^Create edit$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^/]+\/brief$/)
    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByText(editName)).toBeVisible()
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('idle')

    await page.getByTestId('project-source-video-file-input').setInputFiles(fixturePath)
    await page.getByRole('button', { name: /Upload for testing/i }).click()

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata', {
      timeout: 120_000,
    })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded', { timeout: 120_000 })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText(uploadedFixtureFileName)

    const statusText = await page.getByTestId('project-source-video-backend-upload-status').innerText()
    const objectPathMatch = statusText.match(/source-media\/(workspaces\/mock-workspace\/projects\/[^/]+\/source-media\/[^\s]+)/)
    expect(objectPathMatch?.[1]).toBeTruthy()
    const objectStat = await stat(join(process.cwd(), localStorageRoot, 'source-media', objectPathMatch?.[1] ?? 'missing'))
    const fixtureStat = await stat(fixturePath)
    expect(objectStat.size).toBe(fixtureStat.size)

    await page.getByRole('button', { name: /Save optional direction/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Optional direction saved and read back')

    await expect(page.getByTestId('project-edit-plan-credit-estimate')).toContainText('expected')
    await page.getByRole('button', { name: /Approve local test plan/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Local edit plan and credit estimate approved')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('Story cleanup')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('Private review checks')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).not.toContainText(/caption_design|professional_edit_qa|source_order_preservation/)

    await expect(page.locator('body')).not.toContainText(/provider call made:\s*true|live qwen call:\s*true|render job created:\s*true|worker job created:\s*true|credit reserved:\s*true|production ready:\s*true|signed url (created|enabled|ready)|public delivery enabled:\s*true/i)
  })

  test('uploads video and approves a local plan without saving optional direction', async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!fixtureReady, fixtureSkipReason)

    const healthResponse = await fetch(`${apiBaseUrl}/health`)
    expect(healthResponse.ok).toBe(true)
    const health = await healthResponse.json() as { data?: { runtime?: { mode?: string; mockOnly?: boolean } } }
    expect(health.data?.runtime?.mode).toBe('local')
    expect(health.data?.runtime?.mockOnly).toBe(true)

    await setViewport(page, 1440)

    if (process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH === 'true') {
      await gotoRoute(page, `/sign-in?redirect=${encodeURIComponent('/projects/new')}`)
      await expect(page.getByTestId('auth-local-testing-session-notice')).toContainText('Local app session is enabled')
      await page.getByLabel('Email').fill('source.upload.tester@reeditpro.local')
      await page.getByLabel('Password').fill('reeditpro-testing')
      await page.getByTestId('auth-submit-button').click()
      await expect(page).toHaveURL(/\/projects\/new$/)
    } else {
      await gotoRoute(page, '/projects/new')
    }

    const projectName = `Brief Optional QA Project ${Date.now()}`
    const editName = 'Prompt first browser QA edit'

    await page.getByTestId('project-create-name-input').fill(projectName)
    await page.getByRole('button', { name: /^Create project$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/?]+\?newEdit=1$/)
    await expect(page.getByTestId('new-edit-session-create-panel')).toBeVisible()
    await page.getByTestId('new-edit-name-input').fill(editName)
    await page.getByTestId('new-edit-aspect-16:9').click()
    await page.getByTestId('new-edit-platform-youtube_standard').click()
    await page.getByRole('button', { name: /^Create edit$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^/]+\/brief$/)
    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByText(editName)).toBeVisible()

    await page.getByTestId('project-source-video-file-input').setInputFiles(fixturePath)
    await page.getByRole('button', { name: /Upload for testing/i }).click()

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata', {
      timeout: 120_000,
    })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded', { timeout: 120_000 })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText(uploadedFixtureFileName)
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('default professional direction')
    await expect(page.getByTestId('project-edit-plan-credit-estimate')).toContainText('expected')

    await page.getByRole('button', { name: /Approve local test plan/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Local edit plan and credit estimate approved')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('default professional direction')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('Story cleanup')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('Private review checks')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).not.toContainText(/caption_design|professional_edit_qa|source_order_preservation/)
    await expect(page.getByTestId('project-edit-plan-backend-record')).toContainText('Backend-local plan record')
    await expect(page.locator('body')).not.toContainText(/Optional direction saved and read back|provider call made:\s*true|live qwen call:\s*true|render job created:\s*true|worker job created:\s*true|credit reserved:\s*true|production ready:\s*true|signed url (created|enabled|ready)|public delivery enabled:\s*true/i)
  })

  test('uploads video and approves a local plan from an unsaved prompt', async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!fixtureReady, fixtureSkipReason)

    const healthResponse = await fetch(`${apiBaseUrl}/health`)
    expect(healthResponse.ok).toBe(true)
    const health = await healthResponse.json() as { data?: { runtime?: { mode?: string; mockOnly?: boolean } } }
    expect(health.data?.runtime?.mode).toBe('local')
    expect(health.data?.runtime?.mockOnly).toBe(true)

    await setViewport(page, 1440)

    if (process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH === 'true') {
      await gotoRoute(page, `/sign-in?redirect=${encodeURIComponent('/projects/new')}`)
      await expect(page.getByTestId('auth-local-testing-session-notice')).toContainText('Local app session is enabled')
      await page.getByLabel('Email').fill('source.upload.tester@reeditpro.local')
      await page.getByLabel('Password').fill('reeditpro-testing')
      await page.getByTestId('auth-submit-button').click()
      await expect(page).toHaveURL(/\/projects\/new$/)
    } else {
      await gotoRoute(page, '/projects/new')
    }

    const projectName = `Prompt Plan QA Project ${Date.now()}`
    const editName = 'Prompt driven browser QA edit'
    const promptDirection = 'Make this a clean YouTube intro with simple product callouts, no captions, no music, and natural voice-first pacing.'

    await page.getByTestId('project-create-name-input').fill(projectName)
    await page.getByRole('button', { name: /^Create project$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/?]+\?newEdit=1$/)
    await expect(page.getByTestId('new-edit-session-create-panel')).toBeVisible()
    await page.getByTestId('new-edit-name-input').fill(editName)
    await page.getByTestId('new-edit-aspect-16:9').click()
    await page.getByTestId('new-edit-platform-youtube_standard').click()
    await page.getByRole('button', { name: /^Create edit$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^/]+\/brief$/)
    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByText(editName)).toBeVisible()

    await page.getByTestId('project-source-video-file-input').setInputFiles(fixturePath)
    await page.getByRole('button', { name: /Upload for testing/i }).click()

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata', {
      timeout: 120_000,
    })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded', { timeout: 120_000 })
    await page.getByLabel('Instructions').fill(promptDirection)

    await expect(page.getByTestId('project-edit-plan-approval-card')).toContainText(promptDirection)
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('chat prompt')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('Caption restraint')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('Visual clarity')
    await expect(page.getByTestId('project-edit-plan-credit-estimate')).toContainText('expected')

    await page.getByRole('button', { name: /Approve local test plan/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Local edit plan and credit estimate approved')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('chat prompt')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('Caption restraint')
    await expect(page.getByTestId('project-edit-skill-activity-summary')).not.toContainText(/caption_design|professional_edit_qa|source_order_preservation/)
    await expect(page.getByTestId('project-edit-plan-backend-record')).toContainText('Backend-local plan record')
    await expect(page.locator('body')).not.toContainText(/Optional direction saved and read back|provider call made:\s*true|live qwen call:\s*true|render job created:\s*true|worker job created:\s*true|credit reserved:\s*true|production ready:\s*true|signed url (created|enabled|ready)|public delivery enabled:\s*true/i)
  })

  test('uploads video and completes private review and export from a project-created edit', async ({ page }) => {
    test.setTimeout(240_000)
    test.skip(!fixtureReady, fixtureSkipReason)

    const healthResponse = await fetch(`${apiBaseUrl}/health`)
    expect(healthResponse.ok).toBe(true)
    const health = await healthResponse.json() as { data?: { runtime?: { mode?: string; mockOnly?: boolean } } }
    expect(health.data?.runtime?.mode).toBe('local')
    expect(health.data?.runtime?.mockOnly).toBe(true)

    await setViewport(page, 1440)

    if (process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH === 'true') {
      await gotoRoute(page, `/sign-in?redirect=${encodeURIComponent('/projects/new')}`)
      await expect(page.getByTestId('auth-local-testing-session-notice')).toContainText('Local app session is enabled')
      await page.getByLabel('Email').fill('source.upload.tester@reeditpro.local')
      await page.getByLabel('Password').fill('reeditpro-testing')
      await page.getByTestId('auth-submit-button').click()
      await expect(page).toHaveURL(/\/projects\/new$/)
    } else {
      await gotoRoute(page, '/projects/new')
    }

    const projectName = `Private Export QA Project ${Date.now()}`
    const editName = 'Private review browser QA edit'
    const promptDirection = 'Cut this into a clean internal test edit with natural pacing, light product callouts, no captions, and no music.'

    await page.getByTestId('project-create-name-input').fill(projectName)
    await page.getByRole('button', { name: /^Create project$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/?]+\?newEdit=1$/)
    await page.getByTestId('new-edit-name-input').fill(editName)
    await page.getByTestId('new-edit-aspect-16:9').click()
    await page.getByTestId('new-edit-platform-youtube_standard').click()
    await page.getByRole('button', { name: /^Create edit$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^/]+\/brief$/)
    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByText(editName)).toBeVisible()

    await page.getByTestId('project-source-video-file-input').setInputFiles(fixturePath)
    await page.getByRole('button', { name: /Upload for testing/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata', {
      timeout: 120_000,
    })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded', { timeout: 120_000 })
    await page.getByLabel('Instructions').fill(promptDirection)

    await expect(page.getByTestId('project-edit-plan-approval-card')).toContainText(promptDirection)
    await expect(page.getByTestId('project-edit-skill-activity-summary')).toContainText('chat prompt')
    await page.getByRole('button', { name: /Approve local test plan/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Local edit plan and credit estimate approved')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Local edit preview smoke is available')

    await page.getByRole('button', { name: /Run local edit preview/i }).click()
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Preview object', { timeout: 30_000 })
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Private review')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Review ranges')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Qwen 3.7 Max identity recorded, no live call')

    await page.getByLabel('Review notes').fill('Project-created private preview approved for QA and private export.')
    await page.getByRole('button', { name: /Approve preview/i }).click()
    await expect(page.getByTestId('project-edit-preview-review-status')).toContainText('approved')
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Preview review approved and recorded')

    await page.getByRole('button', { name: /Run QA check/i }).click()
    await expect(page.getByTestId('project-edit-professional-qa-result')).toContainText('Preview approved')
    await expect(page.getByTestId('project-edit-professional-qa-result')).toContainText('Private internal boundary intact')
    await expect(page.getByTestId('project-edit-professional-qa-result')).not.toContainText(/blocked|required|mismatch/i)
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Professional QA checkpoint passed')

    await page.getByRole('button', { name: /Create private export/i }).click()
    await expect(page.getByTestId('project-edit-final-export-result')).toContainText('Export ready', { timeout: 30_000 })
    await expect(page.getByTestId('project-edit-final-export-result')).toContainText('/exports/')
    await expect(page.getByTestId('project-edit-final-export-result')).toContainText('Checksum')
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Private final export is ready for internal review')

    const finalExportText = await page.getByTestId('project-edit-final-export-result').innerText()
    const exportObjectPathMatch = finalExportText.match(/(exports)\/(workspaces\/mock-workspace\/projects\/[^/]+\/exports\/[^\s]+)/)
    expect(exportObjectPathMatch?.[1]).toBe('exports')
    expect(exportObjectPathMatch?.[2]).toBeTruthy()
    const exportStat = await stat(join(process.cwd(), localStorageRoot, exportObjectPathMatch?.[1] ?? 'missing', exportObjectPathMatch?.[2] ?? 'missing'))
    expect(exportStat.size).toBeGreaterThan(0)

    await expect(page.getByTestId('project-edit-main-playback-selector').getByRole('button', { name: 'Final' })).toBeEnabled()
    await expect(page.getByTestId('project-source-video-local-mode')).toContainText('Private final export')
    await page.getByTestId('project-edit-private-export-review-player').getByRole('button', { name: /Review/i }).click()
    await expect(page.getByTestId('project-edit-private-artifact-video')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/Optional direction saved and read back|provider call made:\s*true|live qwen call:\s*true|render job created:\s*true|worker job created:\s*true|credit reserved:\s*true|production ready:\s*true|signed url (created|enabled|ready)|public delivery enabled:\s*true/i)
  })
})
