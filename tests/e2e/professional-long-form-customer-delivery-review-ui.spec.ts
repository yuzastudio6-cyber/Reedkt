import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

let fixtureRoot = ''
let fixtureBytes = Buffer.alloc(0)
let fixtureSha256 = ''
const frameCount = 240
const identity = {
  workspaceId: 'workspace-customer-delivery-review',
  projectId: 'project-customer-delivery-review',
  editSessionId: 'edit-customer-delivery-review',
  approvedPlanSnapshotId: 'snapshot-customer-delivery-review',
  packageRecordId: 'package-customer-delivery-review',
}
const reviewPacketHash = 'b'.repeat(64)

test.beforeAll(async () => {
  fixtureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-delivery-review-ui-'))
  const fixturePath = join(fixtureRoot, 'customer-delivery-review.mp4')
  execFileSync('/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=520:sample_rate=48000',
    '-t', '8', '-map', '0:v:0', '-map', '1:a:0',
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

test('mounts signed-in playback, keeps acceptance locked, and records an explicit revision', async ({
  page,
}) => {
  const pageErrors: string[] = []
  const watchRequests: Array<Record<string, unknown>> = []
  const decisionRequests: Array<{
    authorization?: string
    body: Record<string, unknown>
    idempotencyKey?: string
  }> = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review?**`,
    async (route) => {
      expect(route.request().headers().authorization).toBe(
        'Bearer customer-delivery-media-source-playwright-token',
      )
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            professionalLongFormCustomerDeliveryQualityReview:
              reviewFixture(),
          },
          warnings: [],
        }),
      })
    },
  )
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/media?**`,
    async (route) => {
      const request = route.request()
      const match = /^bytes=(\d+)-(\d+)$/u.exec(
        request.headers().range ?? '',
      )
      expect(match).not.toBeNull()
      const start = Number(match![1])
      const end = Number(match![2])
      expect(request.headers().authorization).toBe(
        'Bearer customer-delivery-media-source-playwright-token',
      )
      await route.fulfill({
        status: 206,
        headers: {
          'accept-ranges': 'bytes',
          'cache-control': 'private, no-store',
          'content-length': String(end - start + 1),
          'content-range':
            `bytes ${start}-${end}/${fixtureBytes.byteLength}`,
          'content-type': 'video/mp4',
          'x-reeditpro-artifact-sha256': fixtureSha256,
          'x-reeditpro-quality-review-packet-sha256': reviewPacketHash,
        },
        body: fixtureBytes.subarray(start, end + 1),
      })
    },
  )
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/watch-checkpoints`,
    async (route) => {
      const request = route.request()
      const body = request.postDataJSON() as Record<string, unknown>
      watchRequests.push(body)
      expect(request.headers().authorization).toBe(
        'Bearer customer-delivery-media-source-playwright-token',
      )
      expect(request.headers()['idempotency-key']).toMatch(
        /^professional-long-form-watch:[a-f0-9]{64}$/u,
      )
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          ok: true,
          data: {
            professionalLongFormCustomerDeliveryWatch: watchReceipt(),
          },
          warnings: [],
        }),
      })
    },
  )
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-decision`,
    async (route) => {
      const request = route.request()
      const body = request.postDataJSON() as Record<string, unknown>
      decisionRequests.push({
        authorization: request.headers().authorization,
        body,
        idempotencyKey: request.headers()['idempotency-key'],
      })
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          ok: true,
          data: {
            professionalLongFormCustomerDeliveryQualityDecision:
              revisionDecisionFixture(),
          },
          warnings: [],
        }),
      })
    },
  )

  await page.goto('/')
  await page.evaluate(({ byteSize, masterSha256 }) => {
    window.__reeditproCustomerDeliveryReviewFixture = {
      byteSize,
      frameCount: 240,
      masterSha256,
    }
  }, { byteSize: fixtureBytes.byteLength, masterSha256: fixtureSha256 })
  await page.evaluate(async () => {
    const harness = await import(
      '/tests/e2e/fixtures/mount-customer-delivery-review-browser-harness.ts'
    )
    harness.mountCustomerDeliveryReviewBrowserHarness()
  })

  const panel = page.getByTestId(
    'canonical-customer-delivery-quality-review',
  )
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('No public link')
  await expect(panel).not.toContainText(
    /queue|lease|attempt|provider|storage path|credential|billing/i,
  )

  await page
    .getByTestId('canonical-customer-delivery-load-review')
    .click()
  const video = page.getByTestId('canonical-customer-delivery-video')
  await expect(video).toBeVisible()
  await expect.poll(() => watchRequests.length).toBe(1)
  expect(watchRequests[0]).toMatchObject({
    sequence: 1,
    expectedPreviousWatchEvidenceHash: null,
    coveredIntervals: [{ startFrame: 0, endFrameExclusive: 1 }],
  })
  await expect(panel).toContainText('Authenticated playback is ready')
  await expect(
    page.getByRole('radio', { name: /Accept this exact delivery/i }),
  ).toBeDisabled()
  await expect(
    page.getByRole('radio', { name: /Request changes/i }),
  ).toBeEnabled()

  await page.getByRole('radio', { name: /Request changes/i }).check()
  await page.getByRole('checkbox', { name: 'Audio and video sync' }).check()
  const submit = page.getByTestId(
    'canonical-customer-delivery-submit-decision',
  )
  await expect(submit).toBeEnabled()
  await submit.click()

  await expect.poll(() => decisionRequests.length).toBe(1)
  expect(decisionRequests[0]?.authorization).toBe(
    'Bearer customer-delivery-media-source-playwright-token',
  )
  expect(decisionRequests[0]?.idempotencyKey).toMatch(
    /^professional-long-form-quality-decision:[a-f0-9]{64}$/u,
  )
  expect(decisionRequests[0]?.body).toMatchObject({
    decision: 'request_customer_delivery_revision',
    revisionReasonCodes: ['av_sync'],
    requiresFreshPlanEstimateAndApproval: true,
  })
  expect(JSON.stringify(decisionRequests[0]?.body)).not.toMatch(
    /bytes|path|url|credential|provider|queue|lease|attempt/i,
  )
  await expect(
    page.getByTestId('customer-delivery-review-browser-harness'),
  ).toHaveAttribute('data-refresh-count', '1')
  expect(pageErrors).toEqual([])
})

test('requires every quality attestation before accepting durable whole-program review', async ({
  page,
}) => {
  const pageErrors: string[] = []
  const watchRequests: Array<Record<string, unknown>> = []
  const decisionRequests: Array<{
    authorization?: string
    body: Record<string, unknown>
    idempotencyKey?: string
  }> = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review?**`,
    async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            professionalLongFormCustomerDeliveryQualityReview:
              completedReviewFixture(),
          },
          warnings: [],
        }),
      })
    },
  )
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/media?**`,
    fulfillPrivateMediaRange,
  )
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/watch-checkpoints`,
    async (route) => {
      watchRequests.push(
        route.request().postDataJSON() as Record<string, unknown>,
      )
      await route.fulfill({ status: 409, body: '' })
    },
  )
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-decision`,
    async (route) => {
      const request = route.request()
      decisionRequests.push({
        authorization: request.headers().authorization,
        body: request.postDataJSON() as Record<string, unknown>,
        idempotencyKey: request.headers()['idempotency-key'],
      })
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          ok: true,
          data: {
            professionalLongFormCustomerDeliveryQualityDecision:
              acceptanceDecisionFixture(),
          },
          warnings: [],
        }),
      })
    },
  )

  await mountReviewHarness(page)
  await page
    .getByTestId('canonical-customer-delivery-load-review')
    .click()

  const accept = page.getByRole(
    'radio',
    { name: /Accept this exact delivery/i },
  )
  await expect(accept).toBeEnabled()
  await accept.check()
  const submit = page.getByTestId(
    'canonical-customer-delivery-submit-decision',
  )
  await expect(submit).toBeDisabled()

  await page.getByRole(
    'checkbox',
    { name: /reviewed the exact video quality/i },
  ).check()
  await page.getByRole(
    'checkbox',
    { name: /reviewed audio quality and audio\/video sync/i },
  ).check()
  await page.getByRole(
    'checkbox',
    { name: /accept the known quality-review items/i },
  ).check()
  await page.getByRole(
    'checkbox',
    { name: /satisfies the approved editing intent/i },
  ).check()
  await page.getByRole(
    'checkbox',
    { name: /accepting the private master/i },
  ).check()
  await expect(submit).toBeDisabled()
  await page.getByRole(
    'radio',
    { name: /reviewed speech intelligibility throughout/i },
  ).check()
  await expect(submit).toBeEnabled()
  await submit.click()

  await expect.poll(() => decisionRequests.length).toBe(1)
  expect(watchRequests).toEqual([])
  expect(decisionRequests[0]?.authorization).toBe(
    'Bearer customer-delivery-media-source-playwright-token',
  )
  expect(decisionRequests[0]?.idempotencyKey).toMatch(
    /^professional-long-form-quality-decision:[a-f0-9]{64}$/u,
  )
  expect(decisionRequests[0]?.body).toMatchObject({
    decision: 'accept_exact_private_customer_delivery',
    expectedWatchEvidenceHash: '9'.repeat(64),
    attestation: {
      entirePrivateMasterPlaybackReviewed: true,
      exactVideoQualityAccepted: true,
      exactAudioQualityAndSyncAccepted: true,
      knownQaReviewItemsAccepted: true,
      approvedIntentSatisfied: true,
      speechIntelligibilityDisposition:
        'manual_full_program_speech_review_accepted',
      noPublicDeliveryRequested: true,
    },
  })
  await expect(
    page.getByTestId('customer-delivery-review-browser-harness'),
  ).toHaveAttribute('data-refresh-count', '1')
  expect(pageErrors).toEqual([])
})

test('streams the recovered accepted master to one user-chosen transactional file', async ({
  page,
}) => {
  const pageErrors: string[] = []
  const rangeRequests: Array<{
    authorization?: string
    end: number
    expectedMasterSha256: string | null
    expectedQualityDecisionHash: string | null
    start: number
  }> = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await installMockPrivateDownloadFilePicker(page, 'write')

  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/private-download/file?**`,
    async (route) => {
      const request = route.request()
      const match = /^bytes=(\d+)-(\d+)$/u.exec(
        request.headers().range ?? '',
      )
      expect(match).not.toBeNull()
      const start = Number(match![1])
      const end = Number(match![2])
      const requestUrl = new URL(request.url())
      rangeRequests.push({
        authorization: request.headers().authorization,
        end,
        expectedMasterSha256:
          requestUrl.searchParams.get('expectedMasterSha256'),
        expectedQualityDecisionHash:
          requestUrl.searchParams.get('expectedQualityDecisionHash'),
        start,
      })
      await route.fulfill({
        status: 206,
        headers: {
          'accept-ranges': 'bytes',
          'cache-control': 'private, no-store',
          'content-length': String(end - start + 1),
          'content-range':
            `bytes ${start}-${end}/${fixtureBytes.byteLength}`,
          'content-type': 'video/mp4',
          'x-reeditpro-artifact-sha256': fixtureSha256,
          'x-reeditpro-quality-decision-sha256': 'a'.repeat(64),
          'x-reeditpro-private-download-delivery-id':
            'private-download-customer-delivery-review',
        },
        body: fixtureBytes.subarray(start, end + 1),
      })
    },
  )

  await mountReviewHarness(page, 'accepted')
  const panel = page.getByTestId(
    'canonical-customer-delivery-customer-delivery-accepted',
  )
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Authenticated private download ready')
  await expect(panel).toContainText('never assembles the whole master')
  await expect(panel).toContainText('Public delivery remains off')

  const save = page.getByTestId(
    'canonical-customer-delivery-save-private-master',
  )
  await expect(save).toBeEnabled()
  await save.click()
  await expect(panel).toContainText(
    'The exact accepted private master was saved to the file you chose.',
  )

  expect(rangeRequests).toHaveLength(1)
  expect(rangeRequests[0]).toEqual({
    authorization:
      'Bearer customer-delivery-media-source-playwright-token',
    start: 0,
    end: fixtureBytes.byteLength - 1,
    expectedQualityDecisionHash: 'a'.repeat(64),
    expectedMasterSha256: fixtureSha256,
  })
  const sink = await page.evaluate(() => {
    const value = (
      window as unknown as {
        __reeditproPrivateDownloadSink: {
          aborted: boolean
          chunks: number[][]
          closed: boolean
          options: {
            suggestedName?: string
          }
        }
      }
    ).__reeditproPrivateDownloadSink
    return value
  })
  expect(sink.aborted).toBe(false)
  expect(sink.closed).toBe(true)
  expect(sink.options.suggestedName).toBe(
    'ReEditPro-edit-customer-delivery-review-master.mp4',
  )
  expect(Buffer.concat(sink.chunks.map((chunk) => Buffer.from(chunk)))).toEqual(
    fixtureBytes,
  )
  expect(pageErrors).toEqual([])
})

test('keeps a large accepted master bounded to one authenticated range at a time', async ({
  page,
}) => {
  const largeByteSize = 8 * 1024 * 1024 + 257
  const largeMasterSha256 = '7'.repeat(64)
  const ranges: Array<{ start: number; end: number }> = []
  await installMockPrivateDownloadFilePicker(page, 'count')
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/private-download/file?**`,
    async (route) => {
      const request = route.request()
      const match = /^bytes=(\d+)-(\d+)$/u.exec(
        request.headers().range ?? '',
      )
      expect(match).not.toBeNull()
      const start = Number(match![1])
      const end = Number(match![2])
      ranges.push({ start, end })
      await route.fulfill({
        status: 206,
        headers: {
          'accept-ranges': 'bytes',
          'cache-control': 'private, no-store',
          'content-length': String(end - start + 1),
          'content-range': `bytes ${start}-${end}/${largeByteSize}`,
          'content-type': 'video/mp4',
          'x-reeditpro-artifact-sha256': largeMasterSha256,
          'x-reeditpro-quality-decision-sha256': 'a'.repeat(64),
          'x-reeditpro-private-download-delivery-id':
            'private-download-large-customer-delivery-review',
        },
        body: Buffer.alloc(end - start + 1, ranges.length),
      })
    },
  )

  await mountReviewHarness(page, 'accepted', {
    byteSize: largeByteSize,
    masterSha256: largeMasterSha256,
  })
  await page
    .getByTestId('canonical-customer-delivery-save-private-master')
    .click()
  const panel = page.getByTestId(
    'canonical-customer-delivery-customer-delivery-accepted',
  )
  await expect(panel).toContainText('verified across 2 authenticated ranges')
  expect(ranges).toEqual([
    { start: 0, end: 8 * 1024 * 1024 - 1 },
    { start: 8 * 1024 * 1024, end: largeByteSize - 1 },
  ])
  const sink = await readPrivateDownloadSink(page)
  expect(sink.writeByteLengths).toEqual([8 * 1024 * 1024, 257])
  expect(sink.closed).toBe(true)
  expect(sink.aborted).toBe(false)
})

test('aborts the chosen file when authenticated download integrity changes', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await installMockPrivateDownloadFilePicker(page, 'write')
  await page.route(
    `**/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/private-download/file?**`,
    async (route) => {
      await route.fulfill({
        status: 206,
        headers: {
          'accept-ranges': 'bytes',
          'cache-control': 'private, no-store',
          'content-length': String(fixtureBytes.byteLength),
          'content-range':
            `bytes 0-${fixtureBytes.byteLength - 1}/${fixtureBytes.byteLength}`,
          'content-type': 'video/mp4',
          'x-reeditpro-artifact-sha256': '0'.repeat(64),
          'x-reeditpro-quality-decision-sha256': 'a'.repeat(64),
          'x-reeditpro-private-download-delivery-id':
            'private-download-customer-delivery-review',
        },
        body: fixtureBytes,
      })
    },
  )

  await mountReviewHarness(page, 'accepted')
  await page
    .getByTestId('canonical-customer-delivery-save-private-master')
    .click()
  const panel = page.getByTestId(
    'canonical-customer-delivery-customer-delivery-accepted',
  )
  await expect(panel).toContainText(
    'failed its scope, range, privacy, or integrity-header checks',
  )
  const sink = await readPrivateDownloadSink(page)
  expect(sink.aborted).toBe(true)
  expect(sink.closed).toBe(false)
  expect(sink.chunks).toEqual([])
  expect(pageErrors).toEqual([])
})

test('leaves the destination untouched when the user cancels file selection', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await installMockPrivateDownloadFilePicker(page, 'cancel')

  await mountReviewHarness(page, 'accepted')
  await page
    .getByTestId('canonical-customer-delivery-save-private-master')
    .click()
  const panel = page.getByTestId(
    'canonical-customer-delivery-customer-delivery-accepted',
  )
  await expect(panel).toContainText('No file was changed.')
  const sink = await readPrivateDownloadSink(page)
  expect(sink.aborted).toBe(false)
  expect(sink.closed).toBe(false)
  expect(sink.chunks).toEqual([])
  expect(pageErrors).toEqual([])
})

function reviewFixture() {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-review-v2',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'present_exact_private_customer_delivery_for_authenticated_review',
    status: 'quality_review_required_private_download_blocked',
    identity,
    authority: authorityFixture(),
    reviewItems: reviewItems(),
    reviewMedia: reviewMediaDescriptor(),
    watch: initialWatchState(),
    decision: null,
    privateDownload: null,
    readiness: readiness(false, false),
    commercialBoundary: commercialBoundary(),
    boundaries: boundaries(),
    persistence: persistence(),
    testOnly: true,
  }
}

function completedReviewFixture() {
  return {
    ...reviewFixture(),
    watch: completedWatchState(),
    readiness: {
      ...readiness(false, false),
      durableWholeProgramWatchEvidenceReady: true,
    },
  }
}

function watchReceipt() {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-watch-v1',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'record_server_validated_private_customer_delivery_watch_checkpoint',
    disposition: 'recorded',
    identity,
    authority: authorityFixture(),
    watch: {
      ...initialWatchState(),
      status: 'in_progress',
      watchEvidenceHash: '1'.repeat(64),
      sequence: 1,
      nextSequence: 2,
      expectedPreviousWatchEvidenceHash: '1'.repeat(64),
      coveredFrameCount: 1,
      coveragePermille: 4,
    },
    boundaries: boundaries(),
    persistence: persistence(),
    testOnly: true,
  }
}

function revisionDecisionFixture() {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-decision-v2',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'record_exact_authenticated_private_customer_delivery_quality_decision',
    disposition: 'recorded',
    status: 'revision_requested_private_download_closed',
    identity,
    authority: authorityFixture(),
    reviewItems: reviewItems(),
    reviewMedia: reviewMediaDescriptor(),
    watch: watchReceipt().watch,
    decision: {
      value: 'request_customer_delivery_revision',
      decisionHash: '2'.repeat(64),
      decidedAt: '2026-07-27T18:00:00.000Z',
      revisionReasonCodes: ['av_sync'],
      privateDownloadReconciliationAuthorized: false,
      revisionRequired: true,
      requiresFreshPlanEstimateAndApproval: true,
      watchEvidenceHash: null,
    },
    privateDownload: null,
    readiness: {
      ...readiness(true, true),
      authenticatedQualityDecisionRecorded: true,
      revisionRequiresFreshPlanEstimateAndApproval: true,
    },
    commercialBoundary: commercialBoundary(),
    boundaries: boundaries(),
    persistence: persistence(),
    testOnly: true,
  }
}

function acceptanceDecisionFixture() {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-decision-v2',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'record_exact_authenticated_private_customer_delivery_quality_decision',
    disposition: 'recorded',
    status: 'quality_accepted_private_download_reconciled',
    identity,
    authority: authorityFixture(),
    reviewItems: reviewItems(),
    reviewMedia: reviewMediaDescriptor(),
    watch: completedWatchState(),
    decision: {
      value: 'accept_exact_private_customer_delivery',
      decisionHash: 'a'.repeat(64),
      decidedAt: '2026-07-27T18:00:00.000Z',
      revisionReasonCodes: [],
      privateDownloadReconciliationAuthorized: true,
      revisionRequired: false,
      requiresFreshPlanEstimateAndApproval: false,
      watchEvidenceHash: '9'.repeat(64),
    },
    privateDownload: {
      method: 'GET',
      path:
        '/v1/edit-executions/professional-long-form/' +
        `customer-delivery-packages/${identity.packageRecordId}/` +
        'private-download/file',
      expectedQualityDecisionHash: 'a'.repeat(64),
      expectedMasterSha256: fixtureSha256,
      byteSize: fixtureBytes.byteLength,
      mimeType: 'video/mp4',
      authenticatedBearerRequired: true,
      byteRangesSupported: true,
      publicOrSignedUrlCreated: false,
      cachePolicy: 'private_no_store',
    },
    readiness: {
      ...readiness(true, false),
      durableWholeProgramWatchEvidenceReady: true,
      authenticatedPrivateDownloadReady: true,
    },
    commercialBoundary: commercialBoundary(),
    boundaries: boundaries(),
    persistence: persistence(),
    testOnly: true,
  }
}

function authorityFixture() {
  return {
    reviewPacketHash,
    masterSha256: fixtureSha256,
    masterByteSize: fixtureBytes.byteLength,
    masterFrameCount: frameCount,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
    mimeType: 'video/mp4',
    videoObjectiveEvidenceHash: 'c'.repeat(64),
    audioObjectiveEvidenceHash: 'd'.repeat(64),
  }
}

function initialWatchState() {
  return {
    status: 'not_started',
    watchEvidenceHash: null,
    sequence: 0,
    nextSequence: 1,
    previousWatchEvidenceHash: null,
    expectedPreviousWatchEvidenceHash: null,
    coveredFrameCount: 0,
    coveragePermille: 0,
    fullProgramPlaybackObserved: false,
    acceptanceGateSatisfied: false,
    serverElapsedMs: 0,
    minimumRequiredElapsedMs: 3_984,
    maximumPlaybackRatePermille: 2_000,
    browserReportedCompletionTrusted: false,
    privateLocalDurable: true,
    distributedDatabaseBacked: false,
    productionDurabilityProven: false,
    checkpoint: {
      method: 'POST',
      path:
        '/v1/edit-executions/professional-long-form/' +
        `customer-delivery-packages/${identity.packageRecordId}/` +
        'quality-review/watch-checkpoints',
      expectedReviewPacketHash: reviewPacketHash,
      expectedMasterSha256: fixtureSha256,
      authenticatedBearerRequired: true,
      idempotencyKeyRequired: true,
      browserReportedCompletionTrusted: false,
    },
  }
}

function completedWatchState() {
  return {
    ...initialWatchState(),
    status: 'complete',
    watchEvidenceHash: '9'.repeat(64),
    sequence: 1,
    nextSequence: 2,
    expectedPreviousWatchEvidenceHash: '9'.repeat(64),
    coveredFrameCount: frameCount,
    coveragePermille: 1_000,
    fullProgramPlaybackObserved: true,
    acceptanceGateSatisfied: true,
    serverElapsedMs: 4_250,
  }
}

function reviewItems() {
  return [
    {
      itemId: 'customer-delivery-video-review',
      category: 'decoded_video_integrity',
      automatedOutcome: 'needs_user_review',
      userDecisionRequired: true,
      automaticAcceptanceAllowed: false,
      safeSummaryCode: 'full_video_decode_requires_human_acceptance',
      evidenceHash: 'e'.repeat(64),
    },
    {
      itemId: 'customer-delivery-audio-review',
      category: 'decoded_audio_quality_sync',
      automatedOutcome: 'needs_user_review',
      userDecisionRequired: true,
      automaticAcceptanceAllowed: false,
      safeSummaryCode: 'full_audio_quality_sync_requires_human_acceptance',
      evidenceHash: 'f'.repeat(64),
    },
    {
      itemId: 'customer-delivery-speech-review',
      category: 'speech_intelligibility_attestation',
      automatedOutcome: 'not_automatically_analyzed',
      userDecisionRequired: true,
      automaticAcceptanceAllowed: false,
      safeSummaryCode:
        'speech_intelligibility_requires_manual_or_not_applicable_attestation',
      evidenceHash: '0'.repeat(64),
    },
  ]
}

function reviewMediaDescriptor() {
  return {
    method: 'GET',
    path:
      '/v1/edit-executions/professional-long-form/' +
      `customer-delivery-packages/${identity.packageRecordId}/` +
      'quality-review/media',
    expectedReviewPacketHash: reviewPacketHash,
    expectedMasterSha256: fixtureSha256,
    byteSize: fixtureBytes.byteLength,
    mimeType: 'video/mp4',
    authenticatedBearerRequired: true,
    byteRangesSupported: true,
    publicOrSignedUrlCreated: false,
    cachePolicy: 'private_no_store',
  }
}

function readiness(
  decisionRecorded: boolean,
  revisionRequired: boolean,
) {
  return {
    exactDecodedVideoQaReopened: true,
    exactDecodedAudioQaReopened: true,
    qualityReviewMediaReady: true,
    entireProgramPlaybackRequiredBeforeAcceptance: true,
    durableWholeProgramWatchEvidenceReady: false,
    actualSpeechIntelligibilityAnalysisPerformed: false,
    authenticatedQualityDecisionRecorded: decisionRecorded,
    revisionRequiresFreshPlanEstimateAndApproval: revisionRequired,
    authenticatedPrivateDownloadReady: false,
    publicDeliveryAuthorized: false,
    productReady: false,
    productionReady: false,
  }
}

function commercialBoundary() {
  return {
    approvedFourKEstimateAndReservationReused: true,
    customerDeliveryCoveredByOriginalApprovedEstimate: true,
    secondExportEstimateCreated: false,
    secondExportChargeCreated: false,
    exportTimeEstimatePromptAllowed: false,
    exportTimeCreditPromptAllowed: false,
    customerPriceAuthorityIncluded: false,
    customerCreditAuthorityIncluded: false,
    serviceFeeAuthorityIncluded: false,
    customerCreditsMutated: false,
    walletMutationAuthorized: false,
    settlementAuthorized: false,
    billingAuthorized: false,
  }
}

function boundaries() {
  return {
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
  }
}

function persistence() {
  return {
    privateLocal: true,
    tenantScoped: true,
    distributed: false,
    databaseBacked: false,
    productionAuthority: false,
  }
}

async function mountReviewHarness(
  page: import('@playwright/test').Page,
  stage: 'accepted' | 'review' = 'review',
  descriptor: {
    byteSize: number
    masterSha256: string
  } = {
    byteSize: fixtureBytes.byteLength,
    masterSha256: fixtureSha256,
  },
) {
  await page.goto('/')
  await page.evaluate(({ byteSize, masterSha256, stage: fixtureStage }) => {
    window.__reeditproCustomerDeliveryReviewFixture = {
      byteSize,
      frameCount: 240,
      masterSha256,
      stage: fixtureStage,
    }
  }, {
    byteSize: descriptor.byteSize,
    masterSha256: descriptor.masterSha256,
    stage,
  })
  await page.evaluate(async () => {
    const harness = await import(
      '/tests/e2e/fixtures/mount-customer-delivery-review-browser-harness.ts'
    )
    harness.mountCustomerDeliveryReviewBrowserHarness()
  })
}

async function fulfillPrivateMediaRange(
  route: import('@playwright/test').Route,
) {
  const request = route.request()
  const match = /^bytes=(\d+)-(\d+)$/u.exec(request.headers().range ?? '')
  expect(match).not.toBeNull()
  const start = Number(match![1])
  const end = Number(match![2])
  await route.fulfill({
    status: 206,
    headers: {
      'accept-ranges': 'bytes',
      'cache-control': 'private, no-store',
      'content-length': String(end - start + 1),
      'content-range': `bytes ${start}-${end}/${fixtureBytes.byteLength}`,
      'content-type': 'video/mp4',
      'x-reeditpro-artifact-sha256': fixtureSha256,
      'x-reeditpro-quality-review-packet-sha256': reviewPacketHash,
    },
    body: fixtureBytes.subarray(start, end + 1),
  })
}

type PrivateDownloadSink = {
  aborted: boolean
  chunks: number[][]
  closed: boolean
  options: {
    suggestedName?: string
  } | null
  writeByteLengths: number[]
}

async function installMockPrivateDownloadFilePicker(
  page: import('@playwright/test').Page,
  mode: 'cancel' | 'count' | 'write',
) {
  await page.addInitScript(({ pickerMode }) => {
    const state = {
      aborted: false,
      chunks: [] as number[][],
      closed: false,
      options: null as Record<string, unknown> | null,
      writeByteLengths: [] as number[],
    }
    Object.defineProperty(window, '__reeditproPrivateDownloadSink', {
      configurable: true,
      value: state,
    })
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: async (options: Record<string, unknown>) => {
        state.options = options
        if (pickerMode === 'cancel') {
          throw new DOMException('File selection cancelled.', 'AbortError')
        }
        return {
          createWritable: async ({
            keepExistingData,
          }: {
            keepExistingData: boolean
          }) => {
            if (keepExistingData) {
              throw new Error('Private download must replace transactionally.')
            }
            return {
              write: async (bytes: Uint8Array) => {
                state.writeByteLengths.push(bytes.byteLength)
                if (pickerMode === 'write') {
                  state.chunks.push(Array.from(bytes))
                }
              },
              close: async () => {
                state.closed = true
              },
              abort: async () => {
                state.aborted = true
              },
            }
          },
        }
      },
    })
  }, { pickerMode: mode })
}

function readPrivateDownloadSink(
  page: import('@playwright/test').Page,
): Promise<PrivateDownloadSink> {
  return page.evaluate(() => (
    window as unknown as {
      __reeditproPrivateDownloadSink: PrivateDownloadSink
    }
  ).__reeditproPrivateDownloadSink)
}
