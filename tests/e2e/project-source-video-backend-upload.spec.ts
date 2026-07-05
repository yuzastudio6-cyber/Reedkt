import { expect, test } from '@playwright/test'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'
const apiBaseUrl = 'http://127.0.0.1:9781'

test.describe('Project source video backend-local upload', () => {
  test.skip(
    process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD !== 'true',
    'Backend-local upload UI requires VITE_REEDITPRO_API_BASE_URL and VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD=true at dev-server start.',
  )

  test('uploads selected source video through the internal backend-local upload lane without starting media runtime', async ({ page }) => {
    const calls: string[] = []

    await page.route(`${apiBaseUrl}/v1/projects/mock-project-edit-chat-foundation/upload-intents`, async (route) => {
      calls.push(`create:${route.request().method()}`)
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          ok: true,
          data: {
            uploadIntent: {
              id: 'upload-intent-playwright',
              targetBucket: 'source-media',
              targetPath: 'workspaces/mock-workspace/projects/mock-project-edit-chat-foundation/source-media/upload-intent-playwright/test-source.mp4',
            },
            uploadTarget: {
              uploadUrl: '/v1/upload-intents/upload-intent-playwright/local-object',
              uploadHeaders: {
                'content-type': 'video/mp4',
              },
            },
          },
          warnings: ['mock intercepted upload intent'],
        }),
      })
    })

    await page.route(`${apiBaseUrl}/v1/upload-intents/upload-intent-playwright/local-object`, async (route) => {
      calls.push(`upload:${route.request().method()}`)
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          ok: true,
          data: {
            localObjectUpload: {
              uploadIntentId: 'upload-intent-playwright',
              bucketName: 'source-media',
              objectPath: 'workspaces/mock-workspace/projects/mock-project-edit-chat-foundation/source-media/upload-intent-playwright/test-source.mp4',
              sizeBytes: 42,
              checksumSha256: 'sha256-playwright',
              status: 'uploaded',
            },
          },
          warnings: ['mock intercepted local object upload'],
        }),
      })
    })

    await page.route(`${apiBaseUrl}/v1/upload-intents/upload-intent-playwright/finalize`, async (route) => {
      calls.push(`finalize:${route.request().method()}`)
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          ok: true,
          data: {
            storageObjectRecord: {
              id: 'storage-object-playwright',
              bucketName: 'source-media',
              objectPath: 'workspaces/mock-workspace/projects/mock-project-edit-chat-foundation/source-media/upload-intent-playwright/test-source.mp4',
              sizeBytes: 42,
              checksumSha256: 'sha256-playwright',
            },
            mediaAsset: {
              id: 'media-asset-playwright',
            },
          },
          warnings: ['mock intercepted finalize'],
        }),
      })
    })

    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('idle')

    await page.getByTestId('project-source-video-file-input').setInputFiles({
      name: 'test-source.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('playwright backend-local upload bytes'),
    })

    await page.getByRole('button', { name: /Upload for testing/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Source video uploaded to backend-local storage metadata')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('uploaded')
    await expect(page.getByTestId('project-source-video-backend-upload-status')).toContainText('source-media/workspaces/mock-workspace/projects/mock-project-edit-chat-foundation/source-media/upload-intent-playwright/test-source.mp4')
    await expect(page.getByText(/media processing started|worker job created|render job created|export job created|credit reserved|provider call made|production ready/i)).toHaveCount(0)

    expect(calls).toEqual(['create:POST', 'upload:PUT', 'finalize:POST'])
  })
})
