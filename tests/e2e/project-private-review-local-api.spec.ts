import { expect, test } from '@playwright/test'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

import { setViewport } from './helpers/layout'
import { clickWhenReady } from './helpers/routes'
import {
  createAndApproveActivePlan,
  expectLocalApiHealth,
  readActiveHandoff,
  signInAndCreateActiveProjectEdit,
  uploadActiveEditorSource,
} from './helpers/real-local-api-journey'

const apiBaseUrl =
  process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ??
  'http://127.0.0.1:9781'
const localStorageRoot =
  process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT ??
  '.reeditpro-local-upload-storage-playwright'
const externalFixturePath =
  process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH?.trim()
const fixturePath = externalFixturePath ? resolve(externalFixturePath) : ''

let fixtureReady = false
let fixtureSkipReason = 'Real video fixture path was not provided.'

test.describe('Active signed-in private review through the canonical local API', () => {
  test.skip(
    process.env.PLAYWRIGHT_PRIVATE_REVIEW_LOCAL_API !== 'true',
    'Run npm run test:internal-testing:local-private-review-e2e.',
  )

  test.beforeAll(async () => {
    if (!fixturePath) return
    try {
      const fixtureStat = await stat(fixturePath)
      fixtureReady =
        fixtureStat.isFile() &&
        fixtureStat.size > 0 &&
        extname(fixturePath).toLowerCase() === '.mp4'
      fixtureSkipReason = fixtureReady
        ? ''
        : 'Private-review fixture must be a non-empty MP4 file.'
    } catch (caught) {
      fixtureSkipReason =
        caught instanceof Error
          ? caught.message
          : 'Private-review fixture was not found.'
      fixtureReady = false
    }
  })

  test('executes only the approved package and accepts the private review', async ({
    page,
  }) => {
    test.setTimeout(20 * 60_000)
    test.skip(!fixtureReady, fixtureSkipReason)
    await expectLocalApiHealth(apiBaseUrl)
    await setViewport(page, 1440)

    const edit = await signInAndCreateActiveProjectEdit(page, {
      projectName: `Private review local API ${Date.now()}`,
      editName: 'Approved private review edit',
    })
    await uploadActiveEditorSource(page, {
      edit,
      fixturePath,
      localStorageRoot,
      timeoutMs: 180_000,
    })

    const outcome = await createAndApproveActivePlan(page, {
      prompt:
        'Create a clean source-led private review with natural pacing, no generated media, no music, and no captions.',
      timeoutMs: 120_000,
    })
    expect(outcome).toBe('canonical_approved_snapshot')

    const journey = page.getByTestId('canonical-journey-status')
    await expect(journey).toHaveAttribute(
      'data-journey-stage',
      'approved_snapshot_available',
    )
    await clickWhenReady(
      page.getByTestId('canonical-execution-package-request-submit'),
    )
    await expect(journey).toHaveAttribute(
      'data-journey-stage',
      'execution_in_progress',
      { timeout: 60_000 },
    )
    await expect(journey).toContainText(/Private preparation handoff is ready/i)

    await clickWhenReady(
      page.getByTestId('canonical-private-edit-preparation-submit'),
    )
    const privateReviewReady = page.locator(
      '[data-testid="canonical-journey-status"][data-journey-stage="private_review_ready"]',
    )
    const preparationBlocked = page.getByTestId(
      'canonical-private-edit-preparation-blocked',
    )
    await expect(privateReviewReady.or(preparationBlocked)).toBeVisible({
      timeout: 15 * 60_000,
    })
    if (await preparationBlocked.isVisible()) {
      throw new Error(
        `Canonical private preparation failed closed: ${(await preparationBlocked.innerText())
          .replaceAll(/\s+/g, ' ')
          .trim()}`,
      )
    }

    await clickWhenReady(page.getByTestId('canonical-private-review-load'))
    const player = page.getByTestId('canonical-private-review-player')
    await expect(player).toBeVisible({ timeout: 60_000 })
    const source = await player
      .locator('video')
      .evaluate((video) => (video as HTMLVideoElement).currentSrc)
    expect(source).toMatch(/^blob:/)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      clickWhenReady(page.getByRole('button', { name: /Download review/i })),
    ])
    expect(download.suggestedFilename()).toMatch(/\.mp4$/i)
    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()
    const reviewBytes = await readFile(downloadPath!)
    expect(reviewBytes.byteLength).toBeGreaterThan(1_024)
    expect(reviewBytes.subarray(4, 8).toString('ascii')).toBe('ftyp')

    await clickWhenReady(page.getByTestId('canonical-private-review-accept'))
    await expect(journey).toHaveAttribute(
      'data-journey-stage',
      'private_review_accepted',
      { timeout: 60_000 },
    )
    await expect(journey).toContainText(/Private review approved/i)
    await expect(journey).toContainText(
      /Public delivery is still a separate release step/i,
    )

    const handoff = await readActiveHandoff(page, edit)
    // This browser-local record is a planning cache, not runtime authority. It
    // must not self-promote from a canonical server review decision.
    expect(handoff?.stage).toBe('plan_approved')
    expect(handoff?.approvedSnapshotId).toBeTruthy()

    await page.reload()
    await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByTestId('canonical-journey-status')).toHaveAttribute(
      'data-journey-stage',
      'private_review_accepted',
      { timeout: 60_000 },
    )
    await expect(page.getByTestId('canonical-journey-status')).toContainText(
      /Private review approved/i,
    )
    await expect(page.locator('body')).not.toContainText(
      /provider call made:\s*true|live qwen call:\s*true|production ready:\s*true|public delivery enabled:\s*true/i,
    )
  })
})
