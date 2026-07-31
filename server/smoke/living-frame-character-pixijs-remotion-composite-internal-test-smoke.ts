import assert from 'node:assert/strict'
import {
  spawnSync,
} from 'node:child_process'
import {
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises'
import {
  join,
} from 'node:path'

import {
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_CLASS,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_STATE,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_VERSION,
} from '../../src/types/living-frame-character-pixijs-remotion-composite-internal-test'
import {
  consumeLivingFrameCharacterPixiJsRemotionPrivateVideoLease,
  executeLivingFrameCharacterPixiJsRemotionCompositeInternalTest,
} from '../living-frame/living-frame-character-pixijs-remotion-composite-internal-test'

const reviewRoot =
  '/tmp/reeditpro-living-frame-character-pixijs-remotion-composite-internal-test'
const execution =
  await executeLivingFrameCharacterPixiJsRemotionCompositeInternalTest()
const {
  report,
  privateVideoLease,
} = execution

assert.equal(
  report.contractVersion,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_VERSION,
)
assert.equal(
  report.resultClass,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_CLASS,
)
assert.equal(
  report.runtimeState,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_STATE,
)
assert.deepEqual(
  report.compositionIdentity,
  {
    widthPixels: 640,
    heightPixels: 360,
    fps: 30,
    startFrame: 0,
    endFrameExclusive: 120,
    finalFrameCount: 120,
    pixiJsFrameCount: 120,
    remotionChunkCount: 8,
    maximumOverlaysPerChunk: 15,
    everyFinalFrameUsesExactPixiJsPngBytes:
      true,
    captionPlaneAboveLivingFrame: true,
    remotionRemainsFinalCanvas: true,
  },
)
assert.equal(
  report.runtimeIdentity.pixiJsToolId,
  'pixijs',
)
assert.equal(
  report.runtimeIdentity.pixiJsOperationId,
  'tool.pixijs.render_pixi_scene.v1',
)
assert.equal(
  report.runtimeIdentity.remotionToolId,
  'remotion',
)
assert.equal(
  report.runtimeIdentity.remotionOperationId,
  'tool.remotion.render_approved_composition.v1',
)
assert.equal(
  report.runtimeIdentity.actualPixiJsApplicationInitExecuted,
  true,
)
assert.equal(
  report.runtimeIdentity.actualRemotionRenderCount,
  8,
)
assert.equal(
  report.runtimeIdentity.actualFfmpegPackagingExecuted,
  true,
)
assert.equal(
  report.runtimeIdentity.actualFfprobeQaExecuted,
  true,
)
assert.equal(
  report.renderedQa.codecName,
  'h264',
)
assert.equal(
  report.renderedQa.exactDimensionsPassed,
  true,
)
assert.equal(
  report.renderedQa.exactFrameRatePassed,
  true,
)
assert.equal(
  report.renderedQa.exactFrameCountPassed,
  true,
)
assert.equal(
  report.renderedQa.sourcePoseRestoredAtFinalFrame,
  true,
)
assert.equal(
  report.renderedQa.wholeCharacterMotionVisible,
  true,
)
assert.equal(
  report.renderedQa.noArticulatedBodyPartCutOrWarpRouteUsed,
  true,
)
assert.equal(
  report.renderedQa.captionVisibleAboveCharacter,
  true,
)
assert.equal(
  report.renderedQa.captionProtectedRegionStable,
  true,
)
assert.ok(
  report.renderedQa
    .maximumCaptionProtectedRegionMeanAbsoluteDifference <=
    1.5,
)
assert.ok(
  report.renderedQa.firstMiddleDifferentPixelCount >
    1_000,
)
assert.ok(
  report.renderedQa.firstFinalMeanAbsoluteDifference <=
    3,
)
assert.deepEqual(
  report.swordActionBoundary,
  {
    currentSwordArmCompositeRejected:
      true,
    requiredRoute:
      'comfyui_controlled_component_preparation',
    downstreamRouteAfterPreparation:
      'pixijs_rigid_cutout',
    independentPerFrameGenerationAllowed:
      false,
  },
)
assert.equal(
  report.persistedPrivateArtifact
    .createOnlyPersistenceUsed,
  true,
)
assert.equal(
  report.persistedPrivateArtifact
    .exactPrivateReadbackVerified,
  true,
)
assert.equal(
  report.persistedPrivateArtifact.rawBytesIncluded,
  false,
)
assert.equal(
  report.persistedPrivateArtifact.storagePathIncluded,
  false,
)

for (const [
  authority,
  value,
] of Object.entries(
  report.authorityBoundary,
)) {
  assert.equal(
    value,
    authority ===
      'privateInternalCompositeEvidenceAuthority',
  )
}
assert.equal(report.operationRegistered, false)
assert.equal(
  report.canonicalDispatchIntegrated,
  false,
)
assert.equal(
  report.canonicalAssetManifestMutated,
  false,
)
assert.equal(report.canonicalQaApproved, false)
assert.equal(
  report.privateReviewApproved,
  false,
)
assert.equal(report.actualCostCreated, false)
assert.equal(report.customerCharged, false)
assert.equal(report.publicDeliveryReady, false)
assert.equal(report.productionReady, false)

const output =
  consumeLivingFrameCharacterPixiJsRemotionPrivateVideoLease(
    privateVideoLease,
  )
assert.equal(output.widthPixels, 640)
assert.equal(output.heightPixels, 360)
assert.equal(output.fps, 30)
assert.equal(output.frameCount, 120)
assert.equal(
  output.outputSha256,
  privateVideoLease.outputSha256,
)
assert.equal(
  output.outputByteLength,
  output.mp4Bytes.byteLength,
)

await rm(reviewRoot, {
  recursive: true,
  force: true,
})
await mkdir(reviewRoot, {
  recursive: true,
})
const resultPath =
  join(reviewRoot, 'result.mp4')
await writeFile(
  resultPath,
  output.mp4Bytes,
  {
    flag: 'wx',
    mode: 0o600,
  },
)

for (
  const frame of
  report.renderedQa.reviewFrameIndexes
) {
  const reviewPath = join(
    reviewRoot,
    `frame-${String(frame).padStart(3, '0')}.png`,
  )
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      resultPath,
      '-vf',
      `select=eq(n\\,${frame})`,
      '-frames:v',
      '1',
      '-c:v',
      'png',
      '-threads',
      '1',
      '-y',
      reviewPath,
    ],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    },
  )
  assert.equal(
    result.status,
    0,
    String(result.stderr).slice(-300),
  )
}

let adversarialAssertions = 0
assert.throws(() =>
  consumeLivingFrameCharacterPixiJsRemotionPrivateVideoLease(
    privateVideoLease,
  ))
adversarialAssertions += 1
await assert.rejects(
  (
    executeLivingFrameCharacterPixiJsRemotionCompositeInternalTest as unknown as
      (input: unknown) => Promise<unknown>
  )({
    callerFrames: ['forged'],
  }),
)
adversarialAssertions += 1

const serializedReport =
  JSON.stringify(report)
for (const forbidden of [
  'mp4Bytes',
  'pngBytes',
  'bytesBase64',
  'data:image/',
  'http://',
  'https://',
  '/Users/',
  '/Volumes/',
  'OPENAI_API_KEY',
]) {
  assert.equal(
    serializedReport.includes(forbidden),
    false,
  )
}

console.log(JSON.stringify({
  contractVersion:
    report.contractVersion,
  resultClass: report.resultClass,
  runtimeState: report.runtimeState,
  pixiJsToolId:
    report.runtimeIdentity.pixiJsToolId,
  remotionToolId:
    report.runtimeIdentity.remotionToolId,
  remotionRenderCount:
    report.runtimeIdentity.actualRemotionRenderCount,
  finalFrameCount:
    report.compositionIdentity.finalFrameCount,
  firstMiddleDifferentPixelCount:
    report.renderedQa
      .firstMiddleDifferentPixelCount,
  firstFinalMeanAbsoluteDifference:
    report.renderedQa
      .firstFinalMeanAbsoluteDifference,
  maximumCaptionProtectedRegionMeanAbsoluteDifference:
    report.renderedQa
      .maximumCaptionProtectedRegionMeanAbsoluteDifference,
  reviewFramePngDigestsSha256:
    report.renderedQa
      .reviewFramePngDigestsSha256,
  outputSha256:
    report.persistedPrivateArtifact.sha256,
  outputByteLength:
    report.persistedPrivateArtifact.byteLength,
  swordActionRoute:
    report.swordActionBoundary.requiredRoute,
  independentPerFrameGenerationAllowed:
    report.swordActionBoundary
      .independentPerFrameGenerationAllowed,
  adversarialAssertions,
  operationRegistered:
    report.operationRegistered,
  canonicalDispatchIntegrated:
    report.canonicalDispatchIntegrated,
  canonicalAssetManifestMutated:
    report.canonicalAssetManifestMutated,
  canonicalQaApproved:
    report.canonicalQaApproved,
  privateReviewApproved:
    report.privateReviewApproved,
  actualCostCreated:
    report.actualCostCreated,
  customerCharged:
    report.customerCharged,
  publicDeliveryReady:
    report.publicDeliveryReady,
  productionReady:
    report.productionReady,
  reviewRoot,
  resultPath,
}))
