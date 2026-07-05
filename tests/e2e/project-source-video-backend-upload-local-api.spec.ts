import { expect, test } from '@playwright/test'
import { rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'
const apiBaseUrl = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ?? 'http://127.0.0.1:9781'
const localStorageRoot = process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'

test.describe('Project source video backend-local upload against real local API', () => {
  test.skip(
    process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API !== 'true',
    'Start the local API/app stack with dev:internal-testing:local-upload or equivalent env before running this spec.',
  )

  test.afterAll(async () => {
    await rm(join(process.cwd(), localStorageRoot), { force: true, recursive: true })
  })

  test('uploads through backend upload-intent endpoints and writes local storage metadata only', async ({ page }) => {
    const healthResponse = await fetch(`${apiBaseUrl}/health`)
    expect(healthResponse.ok).toBe(true)
    const health = await healthResponse.json() as { data?: { runtime?: { mode?: string; mockOnly?: boolean } } }
    expect(health.data?.runtime?.mode).toBe('local')
    expect(health.data?.runtime?.mockOnly).toBe(true)

    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('idle')

    await page.getByTestId('project-source-video-file-input').setInputFiles({
      name: 'test-source-real-local-api.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('playwright real local api source video upload bytes'),
    })

    await page.getByRole('button', { name: /Upload for testing/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('source-media/workspaces/mock-workspace/projects/mock-project-edit-chat-foundation/source-media/')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('test-source-real-local-api.mp4')
    await expect(page.getByText(/media processing started|worker job created|render job created|export job created|credit reserved|provider call made|production ready/i)).toHaveCount(0)

    const statusText = await page.getByTestId('project-source-video-backend-upload-status').innerText()
    const objectPathMatch = statusText.match(/source-media\/(workspaces\/mock-workspace\/projects\/mock-project-edit-chat-foundation\/source-media\/[^\s]+)/)
    expect(objectPathMatch?.[1]).toBeTruthy()

    const objectStat = await stat(join(process.cwd(), localStorageRoot, 'source-media', objectPathMatch?.[1] ?? 'missing'))
    expect(objectStat.size).toBe(Buffer.byteLength('playwright real local api source video upload bytes'))
  })
})
