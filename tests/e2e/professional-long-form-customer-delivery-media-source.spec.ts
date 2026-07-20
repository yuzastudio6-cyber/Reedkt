import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

let fixtureRoot = ''
let fixtureBytes = Buffer.alloc(0)
let fixtureSha256 = ''
const rangeRequests: Array<{ start: number; end: number }> = []

test.beforeAll(async () => {
  fixtureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-mse-browser-'))
  const fixturePath = join(fixtureRoot, 'private-review-fragmented.mp4')
  execFileSync('/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=660:sample_rate=48000',
    '-t', '3', '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-profile:v', 'high', '-level:v', '5.1',
    '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
    '-map_metadata', '-1', '-map_chapters', '-1',
    '-metadata', 'creation_time=1970-01-01T00:00:00Z',
    '-movflags',
    '+frag_keyframe+empty_moov+default_base_moof+negative_cts_offsets',
    '-f', 'mp4', '-y', fixturePath,
  ], { stdio: 'pipe' })
  fixtureBytes = await readFile(fixturePath)
  fixtureSha256 = createHash('sha256').update(fixtureBytes).digest('hex')
  expect(fixtureBytes.byteLength).toBeGreaterThan(64 * 1024)
})

test.afterAll(async () => {
  if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true })
})

test('appends and decodes exact authenticated private ranges without a whole-file browser blob', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  rangeRequests.length = 0
  await page.route('**/v1/edit-executions/professional-long-form/customer-delivery-packages/delivery-package-media-source-browser/quality-review/media?**', async (
    route,
  ) => {
    const request = route.request()
    const requestUrl = new URL(request.url())
    expect(requestUrl.searchParams.get('workspaceId'))
      .toBe('workspace-media-source-browser')
    expect(requestUrl.searchParams.get('approvedPlanSnapshotId'))
      .toBe('snapshot-media-source-browser')
    expect(requestUrl.searchParams.get('expectedReviewPacketHash'))
      .toBe('b'.repeat(64))
    expect(requestUrl.searchParams.get('expectedMasterSha256'))
      .toBe(fixtureSha256)
    expect(request.headers().authorization)
      .toBe('Bearer customer-delivery-media-source-playwright-token')
    expect(request.headers().accept).toBe('video/mp4')
    const range = request.headers().range
    const match = /^bytes=(\d+)-(\d+)$/u.exec(range ?? '')
    if (!match) {
      await route.fulfill({ status: 416, body: '' })
      return
    }
    const start = Number(match[1])
    const end = Number(match[2])
    expect(Number.isSafeInteger(start)).toBe(true)
    expect(Number.isSafeInteger(end)).toBe(true)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThanOrEqual(start)
    expect(end).toBeLessThan(fixtureBytes.byteLength)
    expect(end - start + 1).toBeLessThanOrEqual(64 * 1024)
    rangeRequests.push({ start, end })
    await route.fulfill({
      status: 206,
      headers: {
        'accept-ranges': 'bytes',
        'cache-control': 'private, no-store',
        'content-length': String(end - start + 1),
        'content-range': `bytes ${start}-${end}/${fixtureBytes.byteLength}`,
        'content-type': 'video/mp4',
        'x-reeditpro-artifact-sha256': fixtureSha256,
        'x-reeditpro-quality-review-packet-sha256': 'b'.repeat(64),
      },
      body: fixtureBytes.subarray(start, end + 1),
    })
  })

  await page.goto('/')
  await page.evaluate(({ byteSize, masterSha256 }) => {
    window.__reeditproCustomerDeliveryMediaSourceFixture = {
      byteSize,
      frameCount: 90,
      masterSha256,
    }
  }, { byteSize: fixtureBytes.byteLength, masterSha256: fixtureSha256 })
  await page.evaluate(async () => {
    await import(
      '/tests/e2e/fixtures/mount-professional-long-form-customer-delivery-media-source-harness.ts'
    )
  })

  const status = page.getByTestId('customer-delivery-media-source-status')
  await expect(status).toHaveText('stream_complete')
  expect(Number(await status.getAttribute('data-range-request-count')))
    .toBeGreaterThan(1)
  const video = page.getByTestId('customer-delivery-media-source-video')
  await expect(video).toBeVisible()
  await page.getByTestId('customer-delivery-media-source-play').click()
  await expect.poll(async () => video.evaluate((element) =>
    (element as HTMLVideoElement).ended), { timeout: 15_000 }).toBe(true)

  const result = await page.evaluate(() => {
    const videoElement = document.querySelector(
      '[data-testid="customer-delivery-media-source-video"]',
    ) as HTMLVideoElement | null
    const harness = window.__reeditproCustomerDeliveryMediaSourceHarness
    if (!videoElement || !harness) return null
    return {
      coverage: harness.controller.getCoverage(),
      duration: videoElement.duration,
      errorCode: videoElement.error?.code ?? null,
      state: harness.controller.getState(),
    }
  })
  expect(result).not.toBeNull()
  expect(result?.errorCode).toBeNull()
  expect(result?.duration).toBeCloseTo(3, 1)
  expect(result?.state.status).toBe('stream_complete')
  expect(result?.coverage.coveragePermille).toBe(1_000)
  expect(result?.coverage.fullProgramPlaybackObserved).toBe(true)
  expect(rangeRequests.length).toBeGreaterThan(1)
  expect(rangeRequests[0]?.start).toBe(0)
  expect(rangeRequests.at(-1)?.end).toBe(fixtureBytes.byteLength - 1)
  expect(pageErrors).toEqual([])

  await page.evaluate(() => {
    window.__reeditproCustomerDeliveryMediaSourceHarness?.controller.dispose()
  })
})
