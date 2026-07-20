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
const watchRequests: Array<{
  authorization?: string
  idempotencyKey?: string
  body: Record<string, unknown>
}> = []

test.beforeAll(async () => {
  fixtureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-mse-browser-'))
  const fixturePath = join(fixtureRoot, 'private-review-fragmented.mp4')
  execFileSync('/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=660:sample_rate=48000',
    '-t', '36', '-map', '0:v:0', '-map', '1:a:0',
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

test('decodes authenticated ranges and recovers an evicted backward seek without a whole-file browser blob', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  rangeRequests.length = 0
  watchRequests.length = 0
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
  await page.route('**/v1/edit-executions/professional-long-form/customer-delivery-packages/delivery-package-media-source-browser/quality-review/watch-checkpoints', async (
    route,
  ) => {
    const request = route.request()
    const body = request.postDataJSON() as Record<string, unknown>
    const sequence = body.sequence
    expect(sequence === 1 || sequence === 2).toBe(true)
    watchRequests.push({
      authorization: request.headers().authorization,
      idempotencyKey: request.headers()['idempotency-key'],
      body,
    })
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: {
          professionalLongFormCustomerDeliveryWatch:
            watchReceipt(sequence as 1 | 2),
        },
        warnings: [],
      }),
    })
  })

  await page.goto('/')
  await page.evaluate(({ byteSize, masterSha256 }) => {
    window.__reeditproCustomerDeliveryMediaSourceFixture = {
      byteSize,
      frameCount: 1_080,
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
  const initialRangeRequestCount = Number(
    await status.getAttribute('data-range-request-count'),
  )
  expect(initialRangeRequestCount).toBeGreaterThan(1)
  const initialRangeRequests = structuredClone(rangeRequests)
  const video = page.getByTestId('customer-delivery-media-source-video')
  await expect(video).toBeVisible()
  const startedWatch = await page.evaluate(async () =>
    window.__reeditproCustomerDeliveryMediaSourceHarness
      ?.recordWatchStart())
  expect(startedWatch).toEqual({
    sequence: 1,
    acceptanceGateSatisfied: false,
  })
  await page.getByTestId('customer-delivery-media-source-play').click()
  await expect.poll(async () => video.evaluate((element) =>
    (element as HTMLVideoElement).ended), { timeout: 30_000 }).toBe(true)

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
  expect(result?.duration).toBeCloseTo(36, 1)
  expect(result?.state.status).toBe('stream_complete')
  expect(result?.coverage.coveragePermille).toBe(1_000)
  expect(result?.coverage.fullProgramPlaybackObserved).toBe(true)
  const completedWatch = await page.evaluate(async () =>
    window.__reeditproCustomerDeliveryMediaSourceHarness
      ?.recordCurrentWatchCoverage())
  expect(completedWatch).toEqual({
    sequence: 2,
    acceptanceGateSatisfied: true,
  })
  expect(watchRequests).toHaveLength(2)
  expect(watchRequests.map((request) => request.authorization)).toEqual([
    'Bearer customer-delivery-media-source-playwright-token',
    'Bearer customer-delivery-media-source-playwright-token',
  ])
  expect(watchRequests.every((request) =>
    /^professional-long-form-watch:[a-f0-9]{64}$/u.test(
      request.idempotencyKey ?? '',
    ))).toBe(true)
  expect(watchRequests[0]?.body).toMatchObject({
    expectedPreviousWatchEvidenceHash: null,
    sequence: 1,
    coveredIntervals: [{ startFrame: 0, endFrameExclusive: 1 }],
  })
  expect(watchRequests[1]?.body).toMatchObject({
    expectedPreviousWatchEvidenceHash: '1'.repeat(64),
    sequence: 2,
    coveredIntervals: [{ startFrame: 0, endFrameExclusive: 1_080 }],
  })
  expect(initialRangeRequests.length).toBeGreaterThan(1)
  expect(initialRangeRequests[0]?.start).toBe(0)
  expect(initialRangeRequests.at(-1)?.end)
    .toBe(fixtureBytes.byteLength - 1)

  await expect.poll(async () => video.evaluate((element) => {
    const media = element as HTMLVideoElement
    return media.buffered.length > 0 ? media.buffered.start(0) : 0
  }), { timeout: 10_000 }).toBeGreaterThan(1)
  const rangeRequestCountBeforeRecovery = rangeRequests.length
  await video.evaluate((element) => {
    const media = element as HTMLVideoElement
    media.currentTime = 1
  })
  await expect.poll(async () => page.evaluate(() =>
    window.__reeditproCustomerDeliveryMediaSourceHarness?.controller
      .getState().backwardSeekRecovery.status), {
    timeout: 15_000,
  }).toBe('recovered')

  const recoveryResult = await page.evaluate(async () => {
    const media = document.querySelector(
      '[data-testid="customer-delivery-media-source-video"]',
    ) as HTMLVideoElement | null
    const harness = window.__reeditproCustomerDeliveryMediaSourceHarness
    if (!media || !harness) return null
    const bufferedRanges = Array.from(
      { length: media.buffered.length },
      (_, index) => ({
        start: media.buffered.start(index),
        end: media.buffered.end(index),
      }),
    )
    media.playbackRate = 1
    await media.play()
    return {
      bufferedRanges,
      currentTime: media.currentTime,
      state: harness.controller.getState(),
    }
  })
  expect(recoveryResult).not.toBeNull()
  expect(recoveryResult?.bufferedRanges.some((range) =>
    range.start <= 1 && range.end >= 1)).toBe(true)
  expect(recoveryResult?.state.status).toBe('stream_complete')
  expect(recoveryResult?.state.fragmentIndexComplete).toBe(true)
  expect(recoveryResult?.state.fragmentIndexCount).toBeGreaterThan(30)
  expect(recoveryResult?.state.backwardSeekRecovery.recoveryCount).toBe(1)
  expect(recoveryResult?.state.backwardSeekRecovery.lastTargetTimeSeconds)
    .toBeCloseTo(1, 2)
  const recoveryRangeRequests = rangeRequests.slice(
    rangeRequestCountBeforeRecovery,
  )
  expect(recoveryRangeRequests.length).toBeGreaterThan(0)
  expect(recoveryRangeRequests.every((range) =>
    range.end - range.start + 1 <= 64 * 1024)).toBe(true)
  expect(recoveryRangeRequests[0]?.start)
    .toBe(recoveryResult?.state.backwardSeekRecovery.lastWindow?.byteStart)
  expect(recoveryRangeRequests.at(-1)?.end)
    .toBe(
      (recoveryResult?.state.backwardSeekRecovery.lastWindow
        ?.byteEndExclusive ?? 0) - 1,
    )
  expect(recoveryResult?.state.backwardSeekRecovery.recoveredRangeRequestCount)
    .toBe(recoveryRangeRequests.length)
  expect(recoveryResult?.state.rangeRequestCount)
    .toBe(initialRangeRequestCount + recoveryRangeRequests.length)
  await expect.poll(async () => video.evaluate((element) =>
    (element as HTMLVideoElement).currentTime), {
    timeout: 5_000,
  }).toBeGreaterThan(1.25)
  await video.evaluate((element) => (element as HTMLVideoElement).pause())
  expect(pageErrors).toEqual([])

  await page.evaluate(() => {
    window.__reeditproCustomerDeliveryMediaSourceHarness?.controller.dispose()
  })
})

function watchReceipt(sequence: 1 | 2) {
  const complete = sequence === 2
  const evidenceHash = String(sequence).repeat(64)
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-watch-v1',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'record_server_validated_private_customer_delivery_watch_checkpoint',
    disposition: 'recorded',
    identity: {
      workspaceId: 'workspace-media-source-browser',
      projectId: 'project-media-source-browser',
      editSessionId: 'edit-media-source-browser',
      approvedPlanSnapshotId: 'snapshot-media-source-browser',
      packageRecordId: 'delivery-package-media-source-browser',
    },
    authority: {
      reviewPacketHash: 'b'.repeat(64),
      masterSha256: fixtureSha256,
      masterByteSize: fixtureBytes.byteLength,
      masterFrameCount: 1_080,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      mimeType: 'video/mp4',
      videoObjectiveEvidenceHash: 'c'.repeat(64),
      audioObjectiveEvidenceHash: 'd'.repeat(64),
    },
    watch: {
      status: complete ? 'complete' : 'in_progress',
      watchEvidenceHash: evidenceHash,
      sequence,
      nextSequence: sequence + 1,
      previousWatchEvidenceHash:
        complete ? '1'.repeat(64) : null,
      expectedPreviousWatchEvidenceHash: evidenceHash,
      coveredFrameCount: complete ? 1_080 : 1,
      coveragePermille: complete ? 1_000 : 0,
      fullProgramPlaybackObserved: complete,
      acceptanceGateSatisfied: complete,
      serverElapsedMs: complete ? 18_500 : 0,
      minimumRequiredElapsedMs: 17_984,
      maximumPlaybackRatePermille: 2_000,
      browserReportedCompletionTrusted: false,
      privateLocalDurable: true,
      distributedDatabaseBacked: false,
      productionDurabilityProven: false,
      checkpoint: {
        method: 'POST',
        path:
          '/v1/edit-executions/professional-long-form/' +
          'customer-delivery-packages/' +
          'delivery-package-media-source-browser/quality-review/' +
          'watch-checkpoints',
        expectedReviewPacketHash: 'b'.repeat(64),
        expectedMasterSha256: fixtureSha256,
        authenticatedBearerRequired: true,
        idempotencyKeyRequired: true,
        browserReportedCompletionTrusted: false,
      },
    },
    boundaries: {
      rawReviewPacketReturned: false,
      rawDecisionAuthorityReturned: false,
      queueLeaseOrAttemptReturned: false,
      jobOrToolDetailsReturned: false,
      internalCostEvidenceReturned: false,
      filesystemOrStoragePathReturned: false,
      credentialReturned: false,
      providerCallStarted: false,
      additionalRenderStarted: false,
      publicArtifactCreated: false,
      publicDeliveryStarted: false,
      billingStarted: false,
      deploymentStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      databaseBacked: false,
      productionAuthority: false,
    },
    testOnly: true,
  }
}
