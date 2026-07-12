import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, stat } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-vertical-dna'
const apiBaseUrl = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ?? 'http://127.0.0.1:9781'
const localStorageRoot = process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'
const fixtureRoot = join(process.cwd(), 'test-results/project-source-video-real-local-api')
const externalFixturePath = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH?.trim()
const fixturePath = externalFixturePath ? resolve(externalFixturePath) : join(fixtureRoot, 'test-source-real-local-api.mp4')
const fixtureFileName = basename(fixturePath)
const uploadedFixtureFileName = fixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')

let fixtureReady = false
let fixtureSkipReason = 'FFmpeg fixture generation did not run.'

test.describe('Project source video backend-local upload against real local API', () => {
  test.skip(
    process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API !== 'true',
    'Start the local API/app stack with dev:internal-testing:local-upload or equivalent env before running this spec.',
  )

  test.beforeAll(async () => {
    if (externalFixturePath) {
      try {
        const fixtureStat = await stat(fixturePath)
        fixtureReady = fixtureStat.isFile() && fixtureStat.size > 0 && extname(fixturePath).toLowerCase() === '.mp4'
        fixtureSkipReason = fixtureReady ? '' : 'External real-video fixture must be a non-empty MP4 file.'
      } catch (caught) {
        fixtureSkipReason = caught instanceof Error ? caught.message : 'External real-video fixture was not found.'
        fixtureReady = false
      }
      return
    }

    await mkdir(fixtureRoot, { recursive: true })

    try {
      execFileSync('ffmpeg', [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'testsrc=size=320x180:rate=30',
        '-t',
        '1',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        fixturePath,
      ], { stdio: 'pipe' })
      fixtureReady = true
      fixtureSkipReason = ''
    } catch (caught) {
      fixtureSkipReason = caught instanceof Error ? caught.message : 'FFmpeg fixture generation failed.'
      fixtureReady = false
    }
  })

  test.afterAll(async () => {
    // The local-upload runner owns the shared backend-local storage cleanup after all specs finish.
    await rm(fixtureRoot, { force: true, recursive: true })
  })

  test('uploads through backend upload-intent endpoints and creates gated preview, QA, and private export outputs', async ({ page }) => {
    test.setTimeout(externalFixturePath ? 180_000 : 90_000)
    test.skip(!fixtureReady, fixtureSkipReason)

    const healthResponse = await fetch(`${apiBaseUrl}/health`)
    expect(healthResponse.ok).toBe(true)
    const health = await healthResponse.json() as { data?: { runtime?: { mode?: string; mockOnly?: boolean } } }
    expect(health.data?.runtime?.mode).toBe('local')
    expect(health.data?.runtime?.mockOnly).toBe(true)

    await setViewport(page, 1440)

    if (process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH === 'true') {
      await gotoRoute(page, `/sign-in?redirect=${encodeURIComponent(briefPath)}`)
      await expect(page.getByTestId('auth-local-testing-session-notice')).toContainText('Local app session is enabled')
      await page.getByLabel('Email').fill('source.upload.tester@reeditpro.local')
      await page.getByLabel('Password').fill('reeditpro-testing')
      await page.getByTestId('auth-submit-button').click()
      await expect(page).toHaveURL(new RegExp(`${briefPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    } else {
      await gotoRoute(page, briefPath)
    }

    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('idle')

    await page.getByTestId('project-source-video-file-input').setInputFiles(fixturePath)

    await page.getByRole('button', { name: /Upload for testing/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata', {
      timeout: externalFixturePath ? 120_000 : 30_000,
    })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded', { timeout: externalFixturePath ? 120_000 : 30_000 })
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('source-media/workspaces/mock-workspace/projects/mock-project-edit-chat-foundation/source-media/')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText(uploadedFixtureFileName)
    await expect(page.locator('body')).not.toContainText(/provider call made:\s*true|live qwen call:\s*true|final export started|production ready:\s*true/i)

    const statusText = await page.getByTestId('project-source-video-backend-upload-status').innerText()
    const objectPathMatch = statusText.match(/source-media\/(workspaces\/mock-workspace\/projects\/mock-project-edit-chat-foundation\/source-media\/[^\s]+)/)
    expect(objectPathMatch?.[1]).toBeTruthy()

    const objectStat = await stat(join(process.cwd(), localStorageRoot, 'source-media', objectPathMatch?.[1] ?? 'missing'))
    const fixtureStat = await stat(fixturePath)
    expect(objectStat.size).toBe(fixtureStat.size)

    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('local edit plan and credit estimate')
    await page.getByRole('button', { name: /Save optional direction/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Optional direction saved and read back')
    await expect(page.getByTestId('project-edit-plan-credit-estimate')).toContainText('expected')
    await page.getByRole('button', { name: /Approve local test plan/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Local edit plan and credit estimate approved')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Local edit preview smoke is available')
    await page.getByRole('button', { name: /Run local edit preview/i }).click()
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Preview object', { timeout: 30_000 })
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText(/Preview object\s*(preview-media|previews)\//)
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('/previews/')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Private review')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Review ranges')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Qwen 3.7 Max identity recorded, no live call')
    await expect(page.locator('body')).not.toContainText(/provider call made:\s*true|live qwen call:\s*true|final export started|production ready:\s*true/i)

    await page.getByLabel('Review notes').fill('Internal preview approved for private export QA.')
    await page.getByRole('button', { name: /Approve preview/i }).click()
    await expect(page.getByTestId('project-edit-preview-review-status')).toContainText('Decision')
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
    const exportObjectPathMatch = finalExportText.match(/(exports)\/(workspaces\/mock-workspace\/projects\/mock-project-edit-chat-foundation\/exports\/[^\s]+)/)
    expect(exportObjectPathMatch?.[1]).toBe('exports')
    expect(exportObjectPathMatch?.[2]).toBeTruthy()
    const exportStat = await stat(join(process.cwd(), localStorageRoot, exportObjectPathMatch?.[1] ?? 'missing', exportObjectPathMatch?.[2] ?? 'missing'))
    expect(exportStat.size).toBeGreaterThan(0)

    await expect(page.getByTestId('project-edit-main-playback-selector').getByRole('button', { name: 'Final' })).toBeEnabled()
    await expect(page.getByTestId('project-source-video-local-mode')).toContainText('Private final export')
    await page.getByTestId('project-edit-private-export-review-player').getByRole('button', { name: /Review/i }).click()
    await expect(page.getByTestId('project-edit-private-artifact-video')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/provider call made:\s*true|live qwen call:\s*true|production ready:\s*true|signed url (created|enabled|ready)|public delivery enabled:\s*true/i)
  })
})
