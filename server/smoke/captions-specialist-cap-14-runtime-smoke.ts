import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import {
  activatePrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import {
  CAP_14_FULL_MOTION_REMOTION_REQUEST_FIXTURE,
  CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
  CAP_14_REDUCED_MOTION_REMOTION_REQUEST_FIXTURE,
  CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
} from './captions-specialist-cap-14-smoke'

const prepared = await prepareOfflineRemotionDockerRuntime()
const runtime = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(runtime.image.imageId, prepared.imageId)
assert.equal(runtime.image.sourceTreeSha256,
  prepared.sourceTreeSha256)

const full = await runtime.execute(CAP_14_FULL_MOTION_REMOTION_REQUEST_FIXTURE)
const reduced = await runtime.execute(CAP_14_REDUCED_MOTION_REMOTION_REQUEST_FIXTURE)

for (const [label, result, spec] of [
  ['full', full, CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE],
  ['reduced', reduced, CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE],
] as const) {
  assert.equal(result.artifact.mimeType, 'video/mp4')
  assert.equal(result.artifact.width, spec.reviewFrame.width)
  assert.equal(result.artifact.height, spec.reviewFrame.height)
  assert.equal(result.artifact.fps, spec.fps)
  assert.equal(result.artifact.durationFrames, spec.durationFrames)
  assert.equal(result.frameArtifacts.length, spec.goldenFrameNumbers.length)
  assert.deepEqual(result.frameArtifacts.map((artifact) => artifact.frame),
    spec.goldenFrameNumbers)
  assert.equal(
    result.evidence.semanticEvidence.captionCreativeSceneGroupCompositionExecuted,
    true,
  )
  assert.equal(result.evidence.semanticEvidence.exactStoryTimingResolutionDigestConsumed,
    true)
  assert.equal(result.evidence.semanticEvidence.stableAccessibleCaptionAboveVisualLayersPreserved,
    true)
  assert.equal(result.evidence.semanticEvidence.trackAllRuntimeEvidenceNotClaimed, true)
  assert.equal(result.readiness.privateInternalOnly, true)
  assert.equal(result.readiness.productReady, false)
  assert.equal(result.readiness.productionReady, false)
  assert.ok(result.evidence.resourceObservation.finish.cpuUsageNanoseconds
    > result.evidence.resourceObservation.start.cpuUsageNanoseconds,
  `${label} render must contain measured CPU execution evidence.`)
}

const outputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-caption-cap14-inspection-'))
await writeFile(join(outputRoot, 'caption-scene-group-full.mp4'), full.artifact.bytes)
await writeFile(join(outputRoot, 'caption-scene-group-reduced.mp4'), reduced.artifact.bytes)
for (const [variant, result] of [['full', full], ['reduced', reduced]] as const) {
  for (const artifact of result.frameArtifacts) {
    await writeFile(
      join(outputRoot, `${variant}-frame-${String(artifact.frame).padStart(3, '0')}.png`),
      artifact.bytes,
    )
  }
}

console.log(JSON.stringify({
  status: 'actual_private_remotion_render_completed_pending_direct_raster_inspection',
  milestone: 'CAP-14',
  outputRoot,
  imageId: prepared.imageId,
  sourceTreeSha256: prepared.sourceTreeSha256,
  packageVersion: full.evidence.packageVersion,
  full: {
    artifactSha256: full.artifact.sha256,
    byteLength: full.artifact.byteLength,
    frameArtifactDigests: full.frameArtifacts.map(({ frame, sha256 }) => ({ frame, sha256 })),
  },
  reduced: {
    artifactSha256: reduced.artifact.sha256,
    byteLength: reduced.artifact.byteLength,
    frameArtifactDigests: reduced.frameArtifacts.map(({ frame, sha256 }) => ({ frame, sha256 })),
  },
  directRasterInspectionCompleted: false,
  trackAllRuntimeEvidenceClaimed: false,
  finalCustomerCanvasClaimed: false,
  productionAuthorityPromoted: false,
}, null, 2))
