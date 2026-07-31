import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import {
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  exportLivingFrameInternalReviewFile,
  exportLivingFrameInternalReviewStream,
  LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV,
} from './living-frame-internal-review-export'

const previousRoot =
  process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV]
const fixtureRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-lf-review-export-fixture-'),
)
const reviewRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-lf-active-review-v1-'),
)
const sourcePath = join(fixtureRoot, 'source.mp4')
const sourceBytes = Buffer.from(
  'bounded-living-frame-private-review-copy-v1',
  'utf8',
)
const sourceSha256 = createHash('sha256')
  .update(sourceBytes)
  .digest('hex')
let adversarialChecks = 0

try {
  await writeFile(sourcePath, sourceBytes, {
    flag: 'wx',
    mode: 0o600,
  })
  delete process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV]
  assert.equal(
    await exportLivingFrameInternalReviewFile({
      runId: 'no_export_without_runner_root',
      fileName: 'absent.mp4',
      sourcePath,
    }),
    null,
  )

  process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV] =
    reviewRoot
  const copied = await exportLivingFrameInternalReviewFile({
    runId: 'file_copy',
    fileName: 'review.mp4',
    sourcePath,
    expectedByteLength: sourceBytes.byteLength,
    expectedSha256: sourceSha256,
  })
  assert.ok(copied)
  assert.equal(copied.byteLength, sourceBytes.byteLength)
  assert.equal(copied.sha256, sourceSha256)
  assert.equal(copied.canonicalArtifactCreated, false)
  assert.equal(copied.qaApprovalGranted, false)
  assert.equal(copied.privateReviewApproved, false)
  assert.equal(copied.productionReady, false)
  assert.deepEqual(
    await readFile(join(reviewRoot, 'file_copy', 'review.mp4')),
    sourceBytes,
  )

  const streamed = await exportLivingFrameInternalReviewStream({
    runId: 'stream_copy',
    fileName: 'review.mp4',
    stream: Readable.from([sourceBytes]),
    expectedByteLength: sourceBytes.byteLength,
    expectedSha256: sourceSha256,
  })
  assert.ok(streamed)
  assert.equal(streamed.sha256, sourceSha256)

  await reject(async () =>
    exportLivingFrameInternalReviewFile({
      runId: 'file_copy',
      fileName: 'review.mp4',
      sourcePath,
    }))

  process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV] =
    fixtureRoot
  await reject(async () =>
    exportLivingFrameInternalReviewFile({
      runId: 'outside_fixed_prefix',
      fileName: 'review.mp4',
      sourcePath,
    }))

  process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV] =
    'relative-review-root'
  await reject(async () =>
    exportLivingFrameInternalReviewFile({
      runId: 'relative_root',
      fileName: 'review.mp4',
      sourcePath,
    }))

  process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV] =
    reviewRoot
  await reject(async () =>
    exportLivingFrameInternalReviewFile({
      runId: '../escape',
      fileName: 'review.mp4',
      sourcePath,
    }))
  await reject(async () =>
    exportLivingFrameInternalReviewFile({
      runId: 'unsafe_file',
      fileName: '../review.mp4',
      sourcePath,
    }))
  await reject(async () =>
    exportLivingFrameInternalReviewFile({
      runId: 'digest_mismatch',
      fileName: 'review.mp4',
      sourcePath,
      expectedSha256: 'f'.repeat(64),
    }))

  const symlinkRoot = join(
    tmpdir(),
    `reeditpro-lf-active-review-v1-symlink-${process.pid}`,
  )
  await symlink(reviewRoot, symlinkRoot)
  process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV] =
    symlinkRoot
  await reject(async () =>
    exportLivingFrameInternalReviewFile({
      runId: 'symlink_root',
      fileName: 'review.mp4',
      sourcePath,
    }))
  await rm(symlinkRoot, { force: true })

  assert.equal(adversarialChecks, 7)
  process.stdout.write(`${JSON.stringify({
    smoke: 'living_frame_internal_review_export',
    status: 'passed_source_only',
    positiveCases: 3,
    adversarialChecks,
    createOnlyCopyVerified: true,
    exactDigestAndByteLengthVerified: true,
    fixedTemporaryConfinementVerified: true,
    canonicalArtifactCreated: false,
    qaApprovalGranted: false,
    privateReviewApproved: false,
    productionReady: false,
  })}\n`)
} finally {
  if (previousRoot == null) {
    delete process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV]
  } else {
    process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV] =
      previousRoot
  }
  await rm(fixtureRoot, { recursive: true, force: true })
  await rm(reviewRoot, { recursive: true, force: true })
}

async function reject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  adversarialChecks += 1
}
