import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import {
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import {
  activatePrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import { buildCap14RealSourceFixture } from './captions-specialist-cap-14-real-source-smoke'

const ORIGINAL_SOURCE_SHA256 =
  'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
const originalSourcePath = resolve(
  process.env.REEDITPRO_CAPTION_REAL_SOURCE_ORIGINAL_PATH?.trim()
    || join(homedir(), 'Documents/test video/internal testing.MP4'),
)
const sourceProxyPath = resolve(
  process.env.REEDITPRO_CAPTION_REAL_SOURCE_PROXY_PATH?.trim()
    || join(
      homedir(), '.codex/private_caption_evidence/real-source-design-2026-08-05-v1',
      'source-proxy-8.080-12.300-360x640-30.mp4',
    ),
)
const requestedOutputRoot =
  process.env.REEDITPRO_CAPTION_REAL_SOURCE_OUTPUT_ROOT?.trim() || null
const outputBase = join(
  homedir(), '.codex/private_caption_evidence/real-source-design-2026-08-05-v1',
  'remotion-real-source-v2',
)

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
      `Private Caption evidence at ${path} cannot be overwritten by different bytes.`,
    )
  }
}

const originalSourceBytes = await readFile(originalSourcePath)
assert.equal(
  createHash('sha256').update(originalSourceBytes).digest('hex'),
  ORIGINAL_SOURCE_SHA256,
  'Real-source Caption proof must use the exact reviewed uploaded fixture.',
)
const sourceProxyBytes = await readFile(sourceProxyPath)
const fixture = buildCap14RealSourceFixture(sourceProxyBytes)

const prepared = await prepareOfflineRemotionDockerRuntime()
const runtime = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(runtime.image.imageId, prepared.imageId)
assert.equal(runtime.image.sourceTreeSha256, prepared.sourceTreeSha256)
const outputRoot = resolve(requestedOutputRoot || join(
  outputBase,
  `accepted-${fixture.fullSpec.reviewSpecDigestSha256.slice(0, 16)}-${
    fixture.reducedSpec.reviewSpecDigestSha256.slice(0, 16)}`,
))

const full = await runtime.execute(fixture.fullRequest)
const reduced = await runtime.execute(fixture.reducedRequest)

for (const [label, result, spec] of [
  ['full', full, fixture.fullSpec],
  ['reduced', reduced, fixture.reducedSpec],
] as const) {
  assert.equal(result.artifact.mimeType, 'video/mp4')
  assert.equal(result.artifact.width, 360)
  assert.equal(result.artifact.height, 640)
  assert.equal(result.artifact.fps, 30)
  assert.equal(result.artifact.durationFrames, 127)
  assert.deepEqual(
    result.frameArtifacts.map((artifact) => artifact.frame),
    spec.inspectionFrameNumbers,
  )
  assert.equal(
    result.evidence.semanticEvidence.captionRealSourceSceneGroupCompositionExecuted,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.approvedCaptionPrivateReviewProxyBytesVerified,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.fixtureSpecificHumanReviewedWordingConsumed,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.phraseLevelOnlyWithoutWordLockedMotionPreserved,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.canonicalTranscriptQualificationNotClaimed,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.safeTopPlaneFaceAndGestureAvoidanceApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.sourceAudioPreservationRequested,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.trackAllRuntimeEvidenceNotClaimed,
    true,
  )
  assert.equal(result.readiness.privateInternalOnly, true)
  assert.equal(result.readiness.productReady, false)
  assert.equal(result.readiness.productionReady, false)
  assert.ok(
    result.evidence.resourceObservation.finish.cpuUsageNanoseconds
      > result.evidence.resourceObservation.start.cpuUsageNanoseconds,
    `${label} real-source render must contain measured CPU execution evidence.`,
  )
}

await mkdir(outputRoot, { recursive: true, mode: 0o700 })
await writeCreateOnlyOrExactReplay(
  join(outputRoot, 'caption-real-source-full.mp4'),
  full.artifact.bytes,
)
await writeCreateOnlyOrExactReplay(
  join(outputRoot, 'caption-real-source-reduced.mp4'),
  reduced.artifact.bytes,
)
await writeCreateOnlyOrExactReplay(
  join(outputRoot, 'caption-real-source-full-spec.json'),
  Buffer.from(`${JSON.stringify(fixture.fullSpec, null, 2)}\n`),
)
await writeCreateOnlyOrExactReplay(
  join(outputRoot, 'caption-real-source-reduced-spec.json'),
  Buffer.from(`${JSON.stringify(fixture.reducedSpec, null, 2)}\n`),
)
for (const [variant, result] of [['full', full], ['reduced', reduced]] as const) {
  for (const artifact of result.frameArtifacts) {
    await writeCreateOnlyOrExactReplay(
      join(
        outputRoot,
        `${variant}-frame-${String(artifact.frame).padStart(3, '0')}.png`,
      ),
      artifact.bytes,
    )
  }
}

console.log(JSON.stringify({
  status: 'actual_private_real_source_remotion_render_completed_pending_direct_raster_inspection',
  milestone: 'CAP-14 real-source correction',
  outputRoot,
  sourceProxyPath,
  originalSourceSha256: ORIGINAL_SOURCE_SHA256,
  sourceProxySha256: fixture.fullSpec.sourceEvidence.privateReviewProxySha256,
  imageId: prepared.imageId,
  sourceTreeSha256: prepared.sourceTreeSha256,
  full: {
    artifactSha256: full.artifact.sha256,
    byteLength: full.artifact.byteLength,
    frameArtifacts: full.frameArtifacts.map(({ frame, sha256 }) => ({ frame, sha256 })),
  },
  reduced: {
    artifactSha256: reduced.artifact.sha256,
    byteLength: reduced.artifact.byteLength,
    frameArtifacts: reduced.frameArtifacts.map(({ frame, sha256 }) => ({ frame, sha256 })),
  },
  directRasterInspectionCompleted: false,
  canonicalTranscriptQualificationClaimed: false,
  trackAllRuntimeEvidenceClaimed: false,
  finalCustomerCanvasClaimed: false,
  productionAuthorityPromoted: false,
}, null, 2))
