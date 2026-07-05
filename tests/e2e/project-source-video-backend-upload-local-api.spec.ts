import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'
const apiBaseUrl = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ?? 'http://127.0.0.1:9781'
const localStorageRoot = process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'
const fixtureRoot = join(process.cwd(), 'test-results/project-source-video-real-local-api')
const fixturePath = join(fixtureRoot, 'test-source-real-local-api.mp4')

let fixtureReady = false
let fixtureSkipReason = 'FFmpeg fixture generation did not run.'

test.describe('Project source video backend-local upload against real local API', () => {
  test.skip(
    process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API !== 'true',
    'Start the local API/app stack with dev:internal-testing:local-upload or equivalent env before running this spec.',
  )

  test.beforeAll(async () => {
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
    await rm(join(process.cwd(), localStorageRoot), { force: true, recursive: true })
    await rm(fixtureRoot, { force: true, recursive: true })
  })

  test('uploads through backend upload-intent endpoints and creates a gated local preview smoke output', async ({ page }) => {
    test.skip(!fixtureReady, fixtureSkipReason)

    const healthResponse = await fetch(`${apiBaseUrl}/health`)
    expect(healthResponse.ok).toBe(true)
    const health = await healthResponse.json() as { data?: { runtime?: { mode?: string; mockOnly?: boolean } } }
    expect(health.data?.runtime?.mode).toBe('local')
    expect(health.data?.runtime?.mockOnly).toBe(true)

    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('idle')

    await page.getByTestId('project-source-video-file-input').setInputFiles(fixturePath)

    await page.getByRole('button', { name: /Upload for testing/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('source-media/workspaces/mock-workspace/projects/mock-project-edit-chat-foundation/source-media/')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('test-source-real-local-api.mp4')
    await expect(page.locator('body')).not.toContainText(/provider call made:\s*true|live qwen call:\s*true|final export started|production ready:\s*true/i)

    const statusText = await page.getByTestId('project-source-video-backend-upload-status').innerText()
    const objectPathMatch = statusText.match(/source-media\/(workspaces\/mock-workspace\/projects\/mock-project-edit-chat-foundation\/source-media\/[^\s]+)/)
    expect(objectPathMatch?.[1]).toBeTruthy()

    const objectStat = await stat(join(process.cwd(), localStorageRoot, 'source-media', objectPathMatch?.[1] ?? 'missing'))
    const fixtureStat = await stat(fixturePath)
    expect(objectStat.size).toBe(fixtureStat.size)

    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Local edit preview smoke is available')
    await page.getByRole('button', { name: /Run local edit preview/i }).click()
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Preview object', { timeout: 30_000 })
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText(/Preview object\s*(preview-media|previews)\//)
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('/previews/')
    await expect(page.getByTestId('project-source-video-local-preview-smoke-status')).toContainText('Qwen 3.7 Max identity recorded, no live call')
    await expect(page.locator('body')).not.toContainText(/provider call made:\s*true|live qwen call:\s*true|final export started|production ready:\s*true/i)
  })
})
