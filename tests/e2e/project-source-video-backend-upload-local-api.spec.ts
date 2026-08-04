import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { setViewport } from './helpers/layout'
import {
  expectLocalApiHealth,
  signInAndCreateActiveProjectEdit,
  uploadActiveEditorSource,
} from './helpers/real-local-api-journey'

const apiBaseUrl = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ?? 'http://127.0.0.1:9781'
const localStorageRoot = process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'
const fixtureRoot = join(process.cwd(), 'test-results/project-source-video-real-local-api')
const externalFixturePath = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH?.trim()
const fixturePath = externalFixturePath ? resolve(externalFixturePath) : join(fixtureRoot, 'test-source-real-local-api.mp4')

let fixtureReady = false
let fixtureSkipReason = 'FFmpeg fixture generation did not run.'

test.describe('Active named-edit source upload against the real local API', () => {
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
    // The one-command runner owns its shared fixture and backend storage cleanup.
    await rm(fixtureRoot, { force: true, recursive: true })
  })

  test('creates a signed-in project/edit and preserves one finalized private source exactly', async ({ page }) => {
    test.setTimeout(externalFixturePath ? 180_000 : 120_000)
    test.skip(!fixtureReady, fixtureSkipReason)
    await expectLocalApiHealth(apiBaseUrl)
    await setViewport(page, 1440)

    const edit = await signInAndCreateActiveProjectEdit(page, {
      projectName: `Real local upload ${Date.now()}`,
      editName: 'Backend-local source proof',
    })
    const upload = await uploadActiveEditorSource(page, {
      edit,
      fixturePath,
      localStorageRoot,
      timeoutMs: externalFixturePath ? 120_000 : 60_000,
    })

    expect(upload.storageBucket).toBe('source-media')
    expect(upload.storagePath).toContain(`/projects/${edit.projectId}/`)
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'source')
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(
      /provider call made:\s*true|live qwen call:\s*true|final export started|production ready:\s*true|public delivery enabled:\s*true/i,
    )
  })
})
