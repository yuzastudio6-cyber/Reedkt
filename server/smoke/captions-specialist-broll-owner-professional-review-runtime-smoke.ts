import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import type { BrollCaptionOwnerReadResult } from
  '../../src/types/caption-broll-owner-read-adapter'
import { parseBrollCaptionOwnerReadResult } from
  '../captions-specialist/caption-broll-owner-read-adapter'
import {
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import {
  activatePrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import type {
  OfflineRemotionRenderResult,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-types'
import {
  buildCaptionBrollOwnerProfessionalReviewFixture,
} from './captions-specialist-broll-owner-professional-review-smoke'

const OWNER_RESULT_FILE_SHA256 =
  '10ba456bf5ed9ceff23aaf33356ee5b3cf5e9431f6fb65717655a60316de4e32'
const OWNER_RESULT_DIGEST_SHA256 =
  '4c816bcd9b940f0bb8aa0b0a05b5dbf96aafc414b4b50e185872f1e9ba19fe88'
const SELECTED_NORMALIZED_SHA256 =
  '7ae4d2cc3dcb9123539575264c39bbdf90e6043b43eac101e787c0b710cb1765'
const REMOTION_PROXY_SHA256 =
  '8f09cc84c0d9442b2dd6a0a12c7fe378d4e1693c91f87c712a67d4affd317851'
const SELECTED_NORMALIZED_BYTE_LENGTH = 1_110_011
const REMOTION_PROXY_BYTE_LENGTH = 210_852
const DURATION_FRAMES = 72

const evidenceRoot = resolve(
  process.env.REEDITPRO_CAPTION_BROLL_OWNER_EVIDENCE_ROOT?.trim()
    || join(
      homedir(),
      '.codex/private_caption_evidence/broll-owner-real-source-2026-08-06-v1',
    ),
)
const ownerResultPath = resolve(
  process.env.REEDITPRO_CAPTION_BROLL_OWNER_RESULT_PATH?.trim()
    || join(
      evidenceRoot,
      'private/internal/caption-broll-evidence/v1/owner-results',
      '81d3f3ebc4ea2971a60abbde7aec705817b4705c6039d9fd98e7b6e80a4c483d.json',
    ),
)
const selectedNormalizedPath = resolve(
  process.env.REEDITPRO_CAPTION_BROLL_SELECTED_NORMALIZED_PATH?.trim()
    || join(
      evidenceRoot,
      'canonical-media-binary-results/private-v1/35',
      '352e0e4d71475db039d71d4939f8391f229061aefb9fc07a006f572adf7a21de.nut',
    ),
)
const remotionProxyPath = resolve(
  process.env.REEDITPRO_CAPTION_BROLL_REMOTION_PROXY_PATH?.trim()
    || join(
      evidenceRoot,
      'canonical-media-binary-results/private-v1/95',
      '951962745d55e146f22c7413bd71ae0af536f4ee727c7229b44a4f66077aeaf3.mkv',
    ),
)
const requestedOutputRoot =
  process.env.REEDITPRO_CAPTION_BROLL_PROFESSIONAL_REVIEW_ROOT?.trim() || null
const outputBase = join(
  homedir(),
  '.codex/private_caption_evidence',
  'broll-owner-professional-caption-2026-08-06-v1',
)

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function writeCreateOnlyOrExactReplay(
  path: string,
  bytes: Buffer,
): Promise<void> {
  try {
    await writeFile(path, bytes, { mode: 0o600, flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    assert.deepEqual(
      await readFile(path),
      bytes,
      `Private Caption evidence at ${path} cannot be replaced.`,
    )
  }
}

const ownerResultBytes = await readFile(ownerResultPath)
assert.equal(
  sha256(ownerResultBytes),
  OWNER_RESULT_FILE_SHA256,
  'The professional proof must reread the exact persisted owner-result bytes.',
)
const ownerResult = parseBrollCaptionOwnerReadResult(
  JSON.parse(ownerResultBytes.toString('utf8')) as BrollCaptionOwnerReadResult,
)
assert.equal(ownerResult.resultDigestSha256, OWNER_RESULT_DIGEST_SHA256)
assert.equal(ownerResult.canonicalScope.authorizedFrameRange.fps, 24)
assert.equal(ownerResult.canonicalScope.authorizedFrameRange.startFrameInclusive,
  120)
assert.equal(ownerResult.canonicalScope.authorizedFrameRange.endFrameExclusive,
  192)

const selectedNormalizedBytes = await readFile(selectedNormalizedPath)
assert.equal(selectedNormalizedBytes.byteLength,
  SELECTED_NORMALIZED_BYTE_LENGTH)
assert.equal(sha256(selectedNormalizedBytes), SELECTED_NORMALIZED_SHA256)
const remotionProxyBytes = await readFile(remotionProxyPath)
assert.equal(remotionProxyBytes.byteLength, REMOTION_PROXY_BYTE_LENGTH)
assert.equal(sha256(remotionProxyBytes), REMOTION_PROXY_SHA256)
assert.deepEqual(
  [...remotionProxyBytes.subarray(0, 4)],
  [0x1a, 0x45, 0xdf, 0xa3],
  'The owner-approved proxy must retain the Matroska signature.',
)

const fixture = buildCaptionBrollOwnerProfessionalReviewFixture({
  ownerResult,
  selectedNormalizedArtifactRef: {
    id: 'broll.selected-normalized.352e0e4d71475db0',
    version: 'b_roll_selected_normalized_media_v1',
    contentHash: SELECTED_NORMALIZED_SHA256,
  },
  selectedNormalizedArtifactByteLength: selectedNormalizedBytes.byteLength,
  selectedNormalizedArtifactFrameCount: DURATION_FRAMES,
  selectedNormalizedArtifactFps: 24,
  remotionProxyRef: {
    id: 'broll.remotion-proxy.951962745d55e146',
    version: 'b_roll_remotion_preview_proxy_matroska_v1',
    contentHash: REMOTION_PROXY_SHA256,
  },
  remotionProxyBytes,
})
const outputRoot = resolve(requestedOutputRoot || join(
  outputBase,
  `rendered-${fixture.fullSpec.reviewSpecDigestSha256.slice(0, 12)}-${
    fixture.reducedSpec.reviewSpecDigestSha256.slice(0, 12)}`,
))

const prepared = await prepareOfflineRemotionDockerRuntime()
const runtime = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(runtime.image.imageId, prepared.imageId)
assert.equal(runtime.image.sourceTreeSha256, prepared.sourceTreeSha256)

const executions = [
  {
    label: 'broll-owner-full',
    spec: fixture.fullSpec,
    request: fixture.fullRequest,
  },
  {
    label: 'broll-owner-reduced',
    spec: fixture.reducedSpec,
    request: fixture.reducedRequest,
  },
] as const

const completed: Array<{
  label: string
  spec: typeof executions[number]['spec']
  result: OfflineRemotionRenderResult
}> = []
for (const execution of executions) {
  const result = await runtime.execute(execution.request)
  const semantic = result.evidence.semanticEvidence
  assert.equal(result.artifact.mimeType, 'video/mp4')
  assert.equal(result.artifact.width, 640)
  assert.equal(result.artifact.height, 360)
  assert.equal(result.artifact.fps, 24)
  assert.equal(result.artifact.durationFrames, DURATION_FRAMES)
  assert.deepEqual(
    result.frameArtifacts.map((artifact) => artifact.frame),
    execution.spec.inspectionFrameNumbers,
  )
  for (const evidenceName of [
    'captionRealSourceSceneGroupCompositionExecuted',
    'approvedCaptionPrivateReviewProxyBytesVerified',
    'fixtureSpecificHumanReviewedWordingConsumed',
    'phraseLevelOnlyWithoutWordLockedMotionPreserved',
    'canonicalTranscriptQualificationNotClaimed',
    'exactSceneGroupDigestConsumed',
    'exactMotionLockDigestConsumed',
    'exactStoryTimingResolutionDigestConsumed',
    'confirmedOutputFrameAndReviewProxyRatioPreserved',
    'boundedMultiTrackLayerOrderPreserved',
    'stableAccessibleCaptionAboveVisualLayersPreserved',
    'brollOwnerSelectedMediaLineageConsumed',
    'brollOwnerLayoutOccupancyLineageConsumed',
    'brollOwnerCropTimingLineageConsumed',
    'brollOwnerVisibleTextEvidenceLineageConsumed',
    'exactBrollMasterTimelineRangeConsumed',
    'approvedBrollNormalizedPreviewProxyBytesVerified',
    'brollSourceSelectionRemainedExternalToCaption',
    'brollCropAndTimingRemainedExternalToCaption',
    'brollFullFrameCutawayCompositionApplied',
    'brollLowerSafeCaptionBandApplied',
    'realSourcePixelsRequiredForProfessionalAppearancePreserved',
    'syntheticEngineeringFixtureProfessionalAppearanceRejected',
    'sourceAudioAbsenceFromOwnerNormalizationPreserved',
    'requestedMotionVariantApplied',
    'sourceAudioPreservationNotRequested',
    'trackAllRuntimeEvidenceNotClaimed',
    'frameGoldenArtifactsProduced',
  ]) {
    assert.equal(
      semantic[evidenceName],
      true,
      `${execution.label} lacks ${evidenceName}.`,
    )
  }
  assert.equal(result.readiness.privateInternalOnly, true)
  assert.equal(result.readiness.productReady, false)
  assert.equal(result.readiness.productionReady, false)
  assert.ok(
    result.evidence.resourceObservation.finish.cpuUsageNanoseconds
      > result.evidence.resourceObservation.start.cpuUsageNanoseconds,
    `${execution.label} must contain measured CPU execution evidence.`,
  )
  completed.push({ label: execution.label, spec: execution.spec, result })
}

await mkdir(outputRoot, { recursive: true, mode: 0o700 })
for (const execution of completed) {
  await writeCreateOnlyOrExactReplay(
    join(outputRoot, `${execution.label}.mp4`),
    execution.result.artifact.bytes,
  )
  await writeCreateOnlyOrExactReplay(
    join(outputRoot, `${execution.label}-spec.json`),
    Buffer.from(`${JSON.stringify(execution.spec, null, 2)}\n`),
  )
  for (const artifact of execution.result.frameArtifacts) {
    await writeCreateOnlyOrExactReplay(
      join(outputRoot,
        `${execution.label}-frame-${String(artifact.frame).padStart(3, '0')}.png`),
      artifact.bytes,
    )
  }
}

console.log(JSON.stringify({
  status:
    'actual_private_broll_owner_professional_caption_render_completed_pending_direct_raster_inspection',
  outputRoot,
  ownerResultDigestSha256: ownerResult.resultDigestSha256,
  selectedNormalizedSha256: SELECTED_NORMALIZED_SHA256,
  remotionProxySha256: REMOTION_PROXY_SHA256,
  imageId: prepared.imageId,
  sourceTreeSha256: prepared.sourceTreeSha256,
  outputs: completed.map(({ label, spec, result }) => ({
    label,
    reducedMotion: spec.reducedMotion,
    confirmedOutputFrame: '1920x1080@24',
    reviewFrame: '640x360@24',
    masterTimelineRange: [
      spec.masterTimelineStartFrame,
      spec.masterTimelineEndFrameExclusive,
    ],
    artifactSha256: result.artifact.sha256,
    byteLength: result.artifact.byteLength,
    frameArtifacts: result.frameArtifacts.map(({ frame, sha256: frameSha }) =>
      ({ frame, sha256: frameSha })),
  })),
  exactOwnerResultRereadVerified: true,
  realSourcePixelsRendered: true,
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
  directRasterInspectionCompleted: false,
  canonicalTranscriptQualificationClaimed: false,
  trackAllRuntimeEvidenceClaimed: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
