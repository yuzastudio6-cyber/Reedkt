import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import {
  basename,
  join,
} from 'node:path'

import {
  buildLivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture,
} from '../living-frame/living-frame-airship-navigator-articulated-blender-private-fixture'
import {
  compileLivingFrameBlenderFixedTexturedAdapterInternalRequest,
  inspectLivingFrameBlenderOutputFiles,
  runLivingFrameBlenderFixedTexturedAdapterInternal,
} from '../living-frame/living-frame-blender-fixed-adapter-internal-test'
import {
  materializeLivingFrameAirshipNavigatorArticulatedPuppetSheetInternalTest,
  verifyLivingFrameArticulatedPuppetSheetReceipt,
} from '../living-frame/living-frame-airship-navigator-articulated-puppet-sheet-internal-test'
import {
  verifyLivingFrameCharacterAnimationRouteDecision,
} from '../living-frame/living-frame-character-animation-route'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from '../living-frame/living-frame-environmental-particle-sequence-observation'
import {
  consumeLivingFrameArticulatedPuppetPrivatePlaybackLease,
  executeLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTest,
} from '../living-frame/living-frame-blender-selected-scene-remotion-review-internal-test'

const PRIVATE_REVIEW_ROOT =
  '/tmp/reeditpro-living-frame-airship-navigator-articulated-private-review-v1'
const PRIVATE_DIAGNOSTIC_ROOT =
  '/tmp/reeditpro-living-frame-airship-navigator-articulated-private-diagnostic-v1'
const PRIVATE_PLAYBACK_ROOT =
  '/tmp/reeditpro-living-frame-airship-navigator-articulated-remotion-private-review-v1'

const sheet =
  materializeLivingFrameAirshipNavigatorArticulatedPuppetSheetInternalTest()
assert.equal(
  verifyLivingFrameArticulatedPuppetSheetReceipt(
    sheet.receipt,
  ),
  true,
)
assert.equal(
  verifyLivingFrameArticulatedPuppetSheetReceipt({
    ...sheet.receipt,
    expectedPartCount: 7,
  }),
  false,
)
assert.equal(
  sheet.receipt.expectedPartCount,
  8,
)
assert.equal(
  sheet.preparationEvidence
    .allEightReviewedPartsContainPixels,
  true,
)
assert.ok(
  sheet.preparationEvidence
    .preparedTransparentPixelCount
    > 400_000,
)
assert.ok(
  sheet.preparationEvidence
    .preparedOpaquePixelCount
    > 200_000,
)
assert.ok(
  sheet.preparationEvidence
    .preparedPartialAlphaPixelCount
    > 1_000,
)
assert.ok(
  sheet.preparationEvidence
    .greenSpillAdjustedPixelCount
    > 1_000,
)

const fixture =
  buildLivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture()
assert.equal(
  verifyLivingFrameCharacterAnimationRouteDecision(
    fixture.characterAnimationRouteDecision,
  ),
  true,
)
assert.equal(
  fixture.characterAnimationRouteDecision
    .decision.selectedRoute,
  'blender_articulated_2_5d',
)
assert.equal(
  fixture.characterAnimationRouteDecision
    .decision.blenderAdmissionAllowed,
  true,
)
assert.equal(
  fixture.reviewedTopology
    .genericWholeImageDeformationUsed,
  false,
)
assert.equal(
  fixture.mesh.vertices.length,
  32,
)
assert.equal(
  fixture.mesh.triangles.length,
  16,
)
assert.equal(
  fixture.mesh.weights.every(
    (weightSet) =>
      weightSet.length === 1
      && weightSet[0]?.weight === 1,
  ),
  true,
)

const compiled =
  compileLivingFrameBlenderFixedTexturedAdapterInternalRequest({
    candidateRequest:
      fixture.candidateRequest,
    actionPlan:
      fixture.actionPlan,
    componentId:
      fixture.componentId,
    mesh: fixture.mesh,
    material: {
      baseColorRgba:
        [1, 1, 1, 1],
      roughness: 0.72,
    },
    texture: {
      artifactId:
        sheet.preparedAlphaAtlas.artifactId,
      pngBytes:
        sheet.preparedAlphaAtlas.pngBytes,
    },
    fps: 30,
    renderProfile: 'full',
  })

assert.equal(
  compiled.payload.mesh.vertices.length,
  32,
)
assert.equal(
  compiled.payload.mesh.triangles.length,
  16,
)
assert.equal(
  compiled.payload.bones.length,
  8,
)
assert.equal(
  compiled.payload.ik.chainLength,
  3,
)
assert.equal(
  compiled.payload.material.texture.sha256,
  sheet.preparedAlphaAtlas.sha256,
)
assert.equal(
  compiled.payload.material.texture.widthPixels,
  1_536,
)
assert.equal(
  compiled.payload.material.texture.heightPixels,
  1_024,
)
assert.equal(
  compiled.payload.animation
    .secondaryMotionEnabled,
  false,
)
assert.equal(
  compiled.envelope.payloadCanonicalJson.includes(
    sheet.preparedAlphaAtlas.pngBytes
      .toString('base64')
      .slice(0, 64),
  ),
  false,
)
for (const forbidden of [
  'sourcePath',
  'sourceUrl',
  'sourceBytes',
  'rawChat',
  'command',
  'environment',
  'finalCanvas',
] as const) {
  assert.equal(
    Object.hasOwn(
      compiled.payload,
      forbidden,
    ),
    false,
  )
}

const run =
  runLivingFrameBlenderFixedTexturedAdapterInternal(
    compiled,
  )
const remotionStorageRoot =
  mkdtempSync(
    join(
      tmpdir(),
      'reeditpro-lf-blender-remotion-review-',
    ),
  )
try {
  const outputs =
    inspectLivingFrameBlenderOutputFiles(
      run.outputRoot,
    )
  assert.equal(
    outputs.rgbaFiles.length,
    60,
  )
  assert.equal(
    outputs.maskFiles.length,
    60,
  )
  assert.equal(
    outputs.depthFiles.length,
    60,
  )
  const rgbaFrames =
    outputs.rgbaFiles.map(
      (path, order) => {
        const bytes =
          readFileSync(path)
        const frame =
          12 + order
        return {
          commitment: {
            pass:
              'rgba' as const,
            frame,
            fileName:
              basename(path),
            contentType:
              'image/png' as const,
            byteLength:
              bytes.byteLength,
            sha256:
              createHash('sha256')
                .update(bytes)
                .digest('hex'),
          },
          bytes,
        }
      },
    )
  const firstBytes =
    readFileSync(
      outputs.rgbaFiles[0]!,
    )
  const demonstrationBytes =
    readFileSync(
      outputs.rgbaFiles[30]!,
    )
  const finalBytes =
    readFileSync(
      outputs.rgbaFiles[59]!,
    )
  const first =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      firstBytes,
    )
  const demonstration =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      demonstrationBytes,
    )
  const final =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      finalBytes,
    )
  assert.equal(first.width, 1_920)
  assert.equal(first.height, 1_080)
  const firstStats =
    rgbaStats(first.rgba)
  const demonstrationStats =
    rgbaStats(
      demonstration.rgba,
    )
  const finalStats =
    rgbaStats(final.rgba)
  const demonstrationDelta =
    pixelDifferenceCount(
      first.rgba,
      demonstration.rgba,
      12,
    )
  const finalReturnDelta =
    pixelDifferenceCount(
      first.rgba,
      final.rgba,
      2,
    )
  const protectedFaceDelta =
    regionDifferenceCount({
      first: first.rgba,
      second:
        demonstration.rgba,
      width: first.width,
      height: first.height,
      region:
        fixture.reviewedTopology
          .protectedFaceRectNormalized,
      threshold: 8,
    })
  const firstConnectivity =
    alphaConnectivity(
      first.rgba,
      first.width,
      first.height,
    )
  const demonstrationConnectivity =
    alphaConnectivity(
      demonstration.rgba,
      demonstration.width,
      demonstration.height,
    )
  const firstBounds =
    alphaBounds(
      first.rgba,
      first.width,
      first.height,
    )
  const demonstrationBounds =
    alphaBounds(
      demonstration.rgba,
      demonstration.width,
      demonstration.height,
    )
  persistPrivateDiagnosticFrame(
    'initial',
    firstBytes,
  )
  persistPrivateDiagnosticFrame(
    'demonstration',
    demonstrationBytes,
  )
  persistPrivateDiagnosticFrame(
    'restored',
    finalBytes,
  )
  console.error(JSON.stringify({
    diagnostic:
      'living_frame_airship_navigator_articulated_blender_private_internal_test',
    firstStats,
    demonstrationStats,
    finalStats,
    demonstrationDelta,
    finalReturnDelta,
    protectedFaceDelta,
    firstConnectivity,
    demonstrationConnectivity,
    firstBounds,
    demonstrationBounds,
  }))
  assert.ok(
    firstStats.nonTransparentPixels
      > 100_000,
  )
  assert.ok(
    firstStats.distinctOpaqueColorBuckets
      > 64,
  )
  assert.ok(
    demonstrationDelta
      > 40_000,
  )
  assert.ok(
    finalReturnDelta < 2_500,
  )
  assert.ok(
    Math.abs(
      firstStats.nonTransparentPixels
      - demonstrationStats
        .nonTransparentPixels,
    ) / firstStats.nonTransparentPixels
      < 0.08,
  )
  assert.ok(
    Math.abs(
      firstStats.nonTransparentPixels
      - finalStats
        .nonTransparentPixels,
    ) < 1_500,
  )
  assert.ok(
    protectedFaceDelta < 50,
  )
  assertFrameMargins(
    firstBounds,
    first.width,
    first.height,
  )
  assertFrameMargins(
    demonstrationBounds,
    demonstration.width,
    demonstration.height,
  )
  assert.ok(
    firstConnectivity
      .largestComponentPixelCount
      / firstStats.nonTransparentPixels
      > 0.72,
  )
  assert.ok(
    demonstrationConnectivity
      .largestComponentPixelCount
      / demonstrationStats
        .nonTransparentPixels
      > 0.68,
  )
  assert.ok(
    demonstrationStats
      .greenDominantOpaquePixelCount
      / demonstrationStats
        .nonTransparentPixels
      < 0.002,
  )
  assert.equal(
    run.result
      .transparentRgbaProduced,
    true,
  )
  assert.equal(
    run.result.maskPassProduced,
    true,
  )
  assert.equal(
    run.result.depthPassProduced,
    true,
  )
  assert.equal(
    run.result
      .remotionOwnsFinalCanvas,
    true,
  )
  assert.equal(
    run.result
      .runtimeDispatchAuthority,
    false,
  )
  assert.equal(
    run.result
      .assetPersistenceAuthority,
    false,
  )
  assert.equal(
    run.result.qaApprovalAuthority,
    false,
  )
  assert.equal(
    run.result.billingAuthority,
    false,
  )
  assert.equal(
    run.result.publicDeliveryAuthority,
    false,
  )
  assert.equal(
    run.result.productionAuthority,
    false,
  )
  const privateReviewFrames = [
    persistPrivateReviewFrame(
      'prepared-atlas',
      sheet.preparedAlphaAtlas
        .pngBytes,
    ),
    persistPrivateReviewFrame(
      'initial',
      firstBytes,
    ),
    persistPrivateReviewFrame(
      'demonstration',
      demonstrationBytes,
    ),
    persistPrivateReviewFrame(
      'restored',
      finalBytes,
    ),
  ] as const
  await assert.rejects(
    () =>
      executeLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTest({
        qualificationId:
          'qualification.airship-navigator.forged-rgba-frame-v1',
        localStorageRoot:
          remotionStorageRoot,
        sheetReceipt:
          sheet.receipt,
        preparedAlphaAtlas: {
          artifactId:
            sheet.preparedAlphaAtlas
              .artifactId,
          contentType: 'image/png',
          widthPixels: 1_536,
          heightPixels: 1_024,
          byteLength:
            sheet.preparedAlphaAtlas
              .byteLength,
          sha256:
            sheet.preparedAlphaAtlas
              .sha256,
        },
        fixture,
        compiledRequest:
          compiled,
        blenderResult:
          run.result,
        rgbaFrames: [
          {
            ...rgbaFrames[0]!,
            commitment: {
              ...rgbaFrames[0]!
                .commitment,
              sha256:
                '0'.repeat(64),
            },
          },
          ...rgbaFrames.slice(1),
        ],
      }),
    /RGBA sequence commitments are invalid/,
  )
  await assert.rejects(
    () =>
      executeLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTest({
        qualificationId:
          'qualification.airship-navigator.square-substitution-v1',
        localStorageRoot:
          remotionStorageRoot,
        sheetReceipt:
          sheet.receipt,
        preparedAlphaAtlas: {
          artifactId:
            sheet.preparedAlphaAtlas
              .artifactId,
          contentType: 'image/png',
          widthPixels: 1_536,
          heightPixels: 1_024,
          byteLength:
            sheet.preparedAlphaAtlas
              .byteLength,
          sha256:
            sheet.preparedAlphaAtlas
              .sha256,
        },
        fixture,
        compiledRequest: {
          ...compiled,
          payload: {
            ...compiled.payload,
            output: {
              ...compiled.payload
                .output,
              widthPixels: 1_024,
              heightPixels: 1_024,
            },
          },
        },
        blenderResult:
          run.result,
        rgbaFrames,
      }),
    /lineage is invalid/,
  )
  await assert.rejects(
    () =>
      executeLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTest({
        qualificationId:
          'qualification.airship-navigator.final-canvas-claim-v1',
        localStorageRoot:
          remotionStorageRoot,
        sheetReceipt:
          sheet.receipt,
        preparedAlphaAtlas: {
          artifactId:
            sheet.preparedAlphaAtlas
              .artifactId,
          contentType: 'image/png',
          widthPixels: 1_536,
          heightPixels: 1_024,
          byteLength:
            sheet.preparedAlphaAtlas
              .byteLength,
          sha256:
            sheet.preparedAlphaAtlas
              .sha256,
        },
        fixture,
        compiledRequest:
          compiled,
        blenderResult: {
          ...run.result,
          remotionOwnsFinalCanvas:
            false,
        } as unknown as typeof run.result,
        rgbaFrames,
      }),
    /lineage is invalid/,
  )
  const remotionReview =
    await executeLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTest({
      qualificationId:
        'qualification.airship-navigator.articulated-remotion-review-v1',
      localStorageRoot:
        remotionStorageRoot,
      sheetReceipt:
        sheet.receipt,
      preparedAlphaAtlas: {
        artifactId:
          sheet.preparedAlphaAtlas
            .artifactId,
        contentType:
          sheet.preparedAlphaAtlas
            .contentType,
        widthPixels:
          sheet.preparedAlphaAtlas
            .widthPixels,
        heightPixels:
          sheet.preparedAlphaAtlas
            .heightPixels,
        byteLength:
          sheet.preparedAlphaAtlas
            .byteLength,
        sha256:
          sheet.preparedAlphaAtlas
            .sha256,
      },
      fixture,
      compiledRequest:
        compiled,
      blenderResult:
        run.result,
      rgbaFrames,
    })
  const playback =
    consumeLivingFrameArticulatedPuppetPrivatePlaybackLease(
      remotionReview
        .privatePlaybackLease,
    )
  const privatePlayback =
    persistPrivateReviewVideo(
      playback.bytes,
      playback.sha256,
    )
  assert.equal(
    playback.byteLength,
    remotionReview.report
      .persistedPrivateReviewArtifact
      .byteLength,
  )
  assert.equal(
    playback.sha256,
    remotionReview.report
      .persistedPrivateReviewArtifact
      .sha256,
  )
  assert.equal(
    remotionReview.report
      .renderedVisualQa
      .primaryMotionVisible,
    true,
  )
  assert.equal(
    remotionReview.report
      .renderedVisualQa
      .requiredReturnToInitialPoseVisible,
    true,
  )
  assert.equal(
    remotionReview.report
      .renderedVisualQa
      .automatedCompositionMetricsPassed,
    true,
  )
  assert.equal(
    remotionReview.report
      .renderedVisualQa
      .headVisualReviewPerformed,
    true,
  )
  assert.equal(
    remotionReview.report
      .renderedVisualQa
      .professionalVisualAcceptancePassed,
    false,
  )
  assert.equal(
    remotionReview.report
      .renderedVisualQa
      .visualReviewDisposition,
    'rejected',
  )
  assert.deepEqual(
    remotionReview.report
      .renderedVisualQa
      .rejectionReasonCodes,
    [
      'visible_joint_socket_artwork',
      'articulated_limb_reads_as_disconnected_segments',
      'limb_extension_exceeds_believable_anatomy',
      'hand_prop_attachment_is_unclear',
      'detached_coat_flap_reads_as_floating',
    ],
  )
  assert.equal(
    remotionReview.report
      .privateInternalTechnicalExecutionPassed,
    true,
  )
  assert.equal(
    remotionReview.report
      .privateInternalReviewEvidencePassed,
    false,
  )
  assert.equal(
    remotionReview.report
      .compositionIdentity
      .remotionRemainsFinalCanvas,
    true,
  )
  assert.equal(
    remotionReview.report
      .canonicalQaApproved,
    false,
  )
  assert.equal(
    remotionReview.report
      .productionReady,
    false,
  )
  assert.throws(
    () =>
      consumeLivingFrameArticulatedPuppetPrivatePlaybackLease(
        remotionReview
          .privatePlaybackLease,
      ),
    /invalid, unknown, or already consumed/,
  )

  console.log(JSON.stringify({
    smoke:
      'living_frame_airship_navigator_articulated_blender_private_internal_test',
    status:
      'technical_pass_professional_visual_rejected',
    sourceSheetSha256:
      sheet.receipt
        .sourceArtifact.sha256,
    preparedAlphaAtlasSha256:
      sheet.preparedAlphaAtlas.sha256,
    reviewedPartCount:
      sheet.receipt.expectedPartCount,
    disconnectedMeshIslandCount:
      fixture.reviewedTopology
        .disconnectedMeshIslandCount,
    rigidWeightedVertexCount:
      fixture.reviewedTopology
        .rigidWeightedVertexCount,
    articulatedBoneCount:
      compiled.payload.bones.length,
    armIkChainLength:
      compiled.payload.ik.chainLength,
    firstNonTransparentPixels:
      firstStats.nonTransparentPixels,
    demonstrationMotionPixelDelta:
      demonstrationDelta,
    protectedFacePixelDelta:
      protectedFaceDelta,
    finalReturnPixelDelta:
      finalReturnDelta,
    firstLargestConnectedShare:
      firstConnectivity
        .largestComponentPixelCount
        / firstStats
          .nonTransparentPixels,
    demonstrationLargestConnectedShare:
      demonstrationConnectivity
        .largestComponentPixelCount
        / demonstrationStats
          .nonTransparentPixels,
    actualBlenderEntrypointExecuted:
      true,
    privateInternalReviewFramesPersisted:
      true,
    privateReviewFrames,
    remotionReviewReportDigestSha256:
      remotionReview.report
        .reportDigestSha256,
    remotionPrivatePlayback:
      privatePlayback,
    actualRemotionRenderCount:
      remotionReview.report
        .runtimeIdentity
        .actualRemotionRenderCount,
    remotionReviewAdversarialAssertions:
      4,
    remotionReviewFrame:
      `${remotionReview.report.compositionIdentity.internalReviewWidthPixels}x${remotionReview.report.compositionIdentity.internalReviewHeightPixels}`,
    remotionReviewFrameCount:
      remotionReview.report
        .persistedMediaQa
        .readFrameCount,
    automatedCompositionMetricsPassed:
      remotionReview.report
        .renderedVisualQa
        .automatedCompositionMetricsPassed,
    professionalVisualAcceptancePassed:
      remotionReview.report
        .renderedVisualQa
        .professionalVisualAcceptancePassed,
    visualReviewDisposition:
      remotionReview.report
        .renderedVisualQa
        .visualReviewDisposition,
    visualRejectionReasonCodes:
      remotionReview.report
        .renderedVisualQa
        .rejectionReasonCodes,
    genericWholeImageDeformationUsed:
      false,
    controlledGenerationUsed:
      false,
    remotionOwnsFinalCanvas:
      true,
    operationRegistered: false,
    dispatchGranted: false,
    assetPersistenceAuthority:
      false,
    canonicalQaApproved: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }))
} finally {
  rmSync(
    remotionStorageRoot,
    {
      recursive: true,
      force: true,
    },
  )
  run.cleanup()
}

function persistPrivateReviewFrame(
  label:
    | 'prepared-atlas'
    | 'initial'
    | 'demonstration'
    | 'restored',
  bytes: Buffer,
): {
  readonly label:
    | 'prepared-atlas'
    | 'initial'
    | 'demonstration'
    | 'restored'
  readonly fileName: string
  readonly byteLength: number
  readonly sha256: string
} {
  const sha256 =
    createHash('sha256')
      .update(bytes)
      .digest('hex')
  const fileName =
    `${label}-${sha256}.png`
  mkdirSync(
    PRIVATE_REVIEW_ROOT,
    {
      recursive: true,
      mode: 0o700,
    },
  )
  chmodSync(
    PRIVATE_REVIEW_ROOT,
    0o700,
  )
  const outputPath =
    join(
      PRIVATE_REVIEW_ROOT,
      fileName,
    )
  if (existsSync(outputPath)) {
    const existing =
      readFileSync(outputPath)
    if (
      existing.byteLength
        !== bytes.byteLength
      || createHash('sha256')
        .update(existing)
        .digest('hex')
        !== sha256
    ) {
      throw new Error(
        'Airship navigator private review frame changed.',
      )
    }
  } else {
    writeFileSync(
      outputPath,
      bytes,
      {
        flag: 'wx',
        mode: 0o600,
      },
    )
  }
  return {
    label,
    fileName,
    byteLength:
      bytes.byteLength,
    sha256,
  }
}

function persistPrivateDiagnosticFrame(
  label:
    | 'initial'
    | 'demonstration'
    | 'restored',
  bytes: Buffer,
): void {
  const sha256 =
    createHash('sha256')
      .update(bytes)
      .digest('hex')
  mkdirSync(
    PRIVATE_DIAGNOSTIC_ROOT,
    {
      recursive: true,
      mode: 0o700,
    },
  )
  chmodSync(
    PRIVATE_DIAGNOSTIC_ROOT,
    0o700,
  )
  const outputPath =
    join(
      PRIVATE_DIAGNOSTIC_ROOT,
      `${label}-${sha256}.png`,
    )
  if (existsSync(outputPath)) {
    const existing =
      readFileSync(outputPath)
    if (
      existing.byteLength
        !== bytes.byteLength
      || createHash('sha256')
        .update(existing)
        .digest('hex')
        !== sha256
    ) {
      throw new Error(
        'Airship navigator private diagnostic frame changed.',
      )
    }
    return
  }
  writeFileSync(
    outputPath,
    bytes,
    {
      flag: 'wx',
      mode: 0o600,
    },
  )
}

function persistPrivateReviewVideo(
  bytes: Buffer,
  expectedSha256: string,
): {
  readonly absolutePath: string
  readonly byteLength: number
  readonly sha256: string
} {
  const sha256 =
    createHash('sha256')
      .update(bytes)
      .digest('hex')
  assert.equal(
    sha256,
    expectedSha256,
  )
  mkdirSync(
    PRIVATE_PLAYBACK_ROOT,
    {
      recursive: true,
      mode: 0o700,
    },
  )
  chmodSync(
    PRIVATE_PLAYBACK_ROOT,
    0o700,
  )
  const absolutePath =
    join(
      PRIVATE_PLAYBACK_ROOT,
      `airship-navigator-${sha256}.mp4`,
    )
  if (existsSync(absolutePath)) {
    const existing =
      readFileSync(absolutePath)
    assert.equal(
      existing.byteLength,
      bytes.byteLength,
    )
    assert.equal(
      createHash('sha256')
        .update(existing)
        .digest('hex'),
      sha256,
    )
  } else {
    writeFileSync(
      absolutePath,
      bytes,
      {
        flag: 'wx',
        mode: 0o600,
      },
    )
  }
  return {
    absolutePath,
    byteLength:
      bytes.byteLength,
    sha256,
  }
}

function rgbaStats(
  rgba: Uint8Array,
): {
  readonly nonTransparentPixels:
    number
  readonly distinctOpaqueColorBuckets:
    number
  readonly greenDominantOpaquePixelCount:
    number
} {
  let nonTransparentPixels = 0
  let greenDominantOpaquePixelCount = 0
  const buckets = new Set<number>()
  for (
    let offset = 0;
    offset < rgba.length;
    offset += 4
  ) {
    const alpha =
      rgba[offset + 3]!
    if (alpha < 8) continue
    nonTransparentPixels += 1
    const red = rgba[offset]!
    const green = rgba[offset + 1]!
    const blue = rgba[offset + 2]!
    if (
      alpha > 200
      && green > red + 35
      && green > blue + 35
    ) {
      greenDominantOpaquePixelCount += 1
    }
    if (alpha > 200) {
      buckets.add(
        (red >> 4) << 8
        | (green >> 4) << 4
        | (blue >> 4),
      )
    }
  }
  return {
    nonTransparentPixels,
    distinctOpaqueColorBuckets:
      buckets.size,
    greenDominantOpaquePixelCount,
  }
}

function alphaBounds(
  rgba: Uint8Array,
  width: number,
  height: number,
): {
  readonly minimumX: number
  readonly minimumY: number
  readonly maximumX: number
  readonly maximumY: number
} {
  let minimumX = width
  let minimumY = height
  let maximumX = -1
  let maximumY = -1
  for (
    let y = 0;
    y < height;
    y += 1
  ) {
    for (
      let x = 0;
      x < width;
      x += 1
    ) {
      if (
        rgba[
          (y * width + x) * 4 + 3
        ]! < 8
      ) continue
      minimumX = Math.min(
        minimumX,
        x,
      )
      minimumY = Math.min(
        minimumY,
        y,
      )
      maximumX = Math.max(
        maximumX,
        x,
      )
      maximumY = Math.max(
        maximumY,
        y,
      )
    }
  }
  if (
    maximumX < minimumX
    || maximumY < minimumY
  ) {
    throw new Error(
      'Airship navigator rendered alpha bounds are empty.',
    )
  }
  return {
    minimumX,
    minimumY,
    maximumX,
    maximumY,
  }
}

function assertFrameMargins(
  bounds:
    ReturnType<
      typeof alphaBounds
    >,
  width: number,
  height: number,
): void {
  const minimumMargin = 48
  assert.ok(
    bounds.minimumX
      >= minimumMargin,
  )
  assert.ok(
    bounds.minimumY
      >= minimumMargin,
  )
  assert.ok(
    bounds.maximumX
      <= width - minimumMargin - 1,
  )
  assert.ok(
    bounds.maximumY
      <= height - minimumMargin - 1,
  )
}

function pixelDifferenceCount(
  first: Uint8Array,
  second: Uint8Array,
  threshold: number,
): number {
  assert.equal(
    first.length,
    second.length,
  )
  let count = 0
  for (
    let offset = 0;
    offset < first.length;
    offset += 4
  ) {
    const difference =
      Math.abs(
        first[offset]!
        - second[offset]!,
      )
      + Math.abs(
        first[offset + 1]!
        - second[offset + 1]!,
      )
      + Math.abs(
        first[offset + 2]!
        - second[offset + 2]!,
      )
      + Math.abs(
        first[offset + 3]!
        - second[offset + 3]!,
      )
    if (difference > threshold) {
      count += 1
    }
  }
  return count
}

function regionDifferenceCount(input: {
  readonly first: Uint8Array
  readonly second: Uint8Array
  readonly width: number
  readonly height: number
  readonly region: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
  readonly threshold: number
}): number {
  const x0 =
    Math.floor(
      input.region.x
      * input.width,
    )
  const y0 =
    Math.floor(
      input.region.y
      * input.height,
    )
  const x1 =
    Math.ceil(
      (
        input.region.x
        + input.region.width
      ) * input.width,
    )
  const y1 =
    Math.ceil(
      (
        input.region.y
        + input.region.height
      ) * input.height,
    )
  let count = 0
  for (let y = y0; y < y1; y += 1) {
    for (
      let x = x0;
      x < x1;
      x += 1
    ) {
      const offset =
        (y * input.width + x)
        * 4
      let difference = 0
      for (
        let channel = 0;
        channel < 4;
        channel += 1
      ) {
        difference += Math.abs(
          input.first[
            offset + channel
          ]!
          - input.second[
            offset + channel
          ]!,
        )
      }
      if (
        difference > input.threshold
      ) count += 1
    }
  }
  return count
}

function alphaConnectivity(
  rgba: Uint8Array,
  width: number,
  height: number,
): {
  readonly componentCount: number
  readonly largestComponentPixelCount:
    number
} {
  const visited =
    new Uint8Array(width * height)
  let componentCount = 0
  let largestComponentPixelCount = 0
  const queue =
    new Int32Array(width * height)
  for (
    let pixel = 0;
    pixel < visited.length;
    pixel += 1
  ) {
    if (
      visited[pixel]
      || rgba[pixel * 4 + 3]! < 24
    ) continue
    componentCount += 1
    let head = 0
    let tail = 0
    let size = 0
    queue[tail] = pixel
    tail += 1
    visited[pixel] = 1
    while (head < tail) {
      const current =
        queue[head]!
      head += 1
      size += 1
      const x =
        current % width
      const y =
        Math.floor(
          current / width,
        )
      if (x > 0) {
        tail = enqueue(
          current - 1,
          tail,
        )
      }
      if (x + 1 < width) {
        tail = enqueue(
          current + 1,
          tail,
        )
      }
      if (y > 0) {
        tail = enqueue(
          current - width,
          tail,
        )
      }
      if (y + 1 < height) {
        tail = enqueue(
          current + width,
          tail,
        )
      }
    }
    largestComponentPixelCount =
      Math.max(
        largestComponentPixelCount,
        size,
      )
  }
  return {
    componentCount,
    largestComponentPixelCount,
  }

  function enqueue(
    pixel: number,
    tail: number,
  ): number {
    if (
      visited[pixel]
      || rgba[pixel * 4 + 3]! < 24
    ) return tail
    visited[pixel] = 1
    queue[tail] = pixel
    return tail + 1
  }
}
