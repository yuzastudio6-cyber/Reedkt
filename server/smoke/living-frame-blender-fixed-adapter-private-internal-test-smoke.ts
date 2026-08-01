import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

import type {
  LivingFrameBlenderFixedAdapterRuntimeEvidence,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import {
  LIVING_FRAME_BLENDER_FIXED_ADAPTER_RUNTIME_EVIDENCE_VERSION,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameBlenderFixedAdapterInternalRequest,
  fixedBlenderAdapterSourceDigestSha256,
  inspectLivingFrameBlenderOutputFiles,
  runLivingFrameBlenderFixedAdapterInternal,
} from '../living-frame/living-frame-blender-fixed-adapter-internal-test'
import {
  buildLivingFrameBlenderFixedAdapterPrivateFixture,
} from '../living-frame/living-frame-blender-fixed-adapter-private-fixture'
import {
  compileLivingFrameRigActionPlan,
  verifyLivingFrameRigActionPlan,
} from '../living-frame/living-frame-rig-action'

const BLENDER =
  '/Volumes/Blender/Blender.app/Contents/MacOS/Blender'
const fixture = buildLivingFrameBlenderFixedAdapterPrivateFixture()
assert.equal(
  verifyLivingFrameRigActionPlan(
    fixture.actionPlan,
    fixture.candidateRequest.riggingPlan,
  ),
  true,
)

const previewRequest = compileLivingFrameBlenderFixedAdapterInternalRequest({
  ...fixture,
  componentId: 'component.primary',
  material: {
    baseColorRgba: [0.12, 0.42, 0.92, 1],
    roughness: 0.6,
  },
  fps: 30,
  renderProfile: 'blocking_preview',
})
const fullRequest = compileLivingFrameBlenderFixedAdapterInternalRequest({
  ...fixture,
  componentId: 'component.primary',
  material: {
    baseColorRgba: [0.12, 0.42, 0.92, 1],
    roughness: 0.6,
  },
  fps: 30,
  renderProfile: 'full',
})
assert.deepEqual(
  compileLivingFrameBlenderFixedAdapterInternalRequest({
    ...fixture,
    componentId: 'component.primary',
    material: {
      baseColorRgba: [0.12, 0.42, 0.92, 1],
      roughness: 0.6,
    },
    fps: 30,
    renderProfile: 'full',
  }),
  fullRequest,
)
assert.equal(fullRequest.payload.output.widthPixels, 1_920)
assert.equal(fullRequest.payload.output.heightPixels, 1_080)
assert.equal(fullRequest.payload.output.startFrame, 12)
assert.equal(fullRequest.payload.output.endFrameExclusive, 72)
assert.equal(fullRequest.payload.mesh.vertices.length, 256)
assert.equal(fullRequest.payload.mesh.triangles.length, 450)

const cold = measureBlenderStartup()
const warm = measureBlenderStartup()
assert.equal(cold.versionObserved, true)
assert.equal(warm.versionObserved, true)
assert.ok(cold.durationMs > 0)
assert.ok(warm.durationMs > 0)
assert.ok(cold.maximumResidentBytes > 0)

const previewRun = runLivingFrameBlenderFixedAdapterInternal(
  previewRequest,
)
let previewReplayRun:
  ReturnType<typeof runLivingFrameBlenderFixedAdapterInternal> | undefined
let fullRun:
  ReturnType<typeof runLivingFrameBlenderFixedAdapterInternal> | undefined
try {
  assert.equal(previewRun.result.frameCount, 10)
  assert.equal(previewRun.result.transparentRgbaProduced, true)
  assert.equal(previewRun.result.maskPassProduced, true)
  assert.equal(previewRun.result.depthPassProduced, true)
  assert.equal(previewRun.result.productionAuthority, false)
  assert.ok(previewRun.maximumResidentBytes > 0)
  previewReplayRun = runLivingFrameBlenderFixedAdapterInternal(
    previewRequest,
  )
  const previewOutputs = inspectLivingFrameBlenderOutputFiles(
    previewRun.outputRoot,
  )
  const replayOutputs = inspectLivingFrameBlenderOutputFiles(
    previewReplayRun.outputRoot,
  )
  assert.equal(
    decodedSequenceDigest(previewOutputs.rgbaFiles, 'rgba'),
    decodedSequenceDigest(replayOutputs.rgbaFiles, 'rgba'),
  )
  assert.equal(
    decodedSequenceDigest(previewOutputs.maskFiles, 'gray'),
    decodedSequenceDigest(replayOutputs.maskFiles, 'gray'),
  )
  fullRun = runLivingFrameBlenderFixedAdapterInternal(fullRequest)
  assert.ok(fullRun.maximumResidentBytes > 0)
  const outputs = inspectLivingFrameBlenderOutputFiles(fullRun.outputRoot)
  assert.equal(outputs.rgbaFiles.length, 60)
  assert.equal(outputs.maskFiles.length, 60)
  assert.equal(outputs.depthFiles.length, 60)

  const first = inspectRgba(outputs.rgbaFiles[0]!)
  const demonstration = inspectRgba(outputs.rgbaFiles[30]!)
  const final = inspectRgba(outputs.rgbaFiles.at(-1)!)
  assert.deepEqual(
    { width: first.width, height: first.height, channels: first.channels },
    { width: 1_920, height: 1_080, channels: 4 },
  )
  assert.ok(first.transparentPixels > 0)
  assert.ok(first.opaquePixels > 0)
  assert.notEqual(first.pixelDigestSha256, demonstration.pixelDigestSha256)
  assert.equal(first.pixelDigestSha256, final.pixelDigestSha256)
  const mask = probeImage(outputs.maskFiles[0]!)
  assert.equal(mask.width, 1_920)
  assert.equal(mask.height, 1_080)
  assert.match(mask.pixelFormat, /gray/u)
  const depthProbe = probeExr(outputs.depthFiles[0]!)
  assert.equal(depthProbe.width, 1_920)
  assert.equal(depthProbe.height, 1_080)
  assert.match(depthProbe.codecName, /exr/u)

  assert.throws(
    () => compileLivingFrameBlenderFixedAdapterInternalRequest({
      ...fixture,
      componentId: 'component.background',
      material: {
        baseColorRgba: [0.12, 0.42, 0.92, 1],
        roughness: 0.6,
      },
      fps: 30,
      renderProfile: 'full',
    }),
    /component selection is invalid/,
  )
  const missingWeights = {
    ...structuredClone(fixture.mesh),
    weights: fixture.mesh.weights.slice(0, -1),
  }
  assert.throws(
    () => compileLivingFrameBlenderFixedAdapterInternalRequest({
      ...fixture,
      componentId: 'component.primary',
      mesh: missingWeights,
      material: {
        baseColorRgba: [0.12, 0.42, 0.92, 1],
        roughness: 0.6,
      },
      fps: 30,
      renderProfile: 'full',
    }),
    /mesh artifact is invalid/,
  )
  assert.throws(
    () => compileLivingFrameRigActionPlan({
      riggingPlan: fixture.candidateRequest.riggingPlan,
      narrativeActionId: 'action.invalid-frame',
      narrativeActionSummary:
        'Attempt one invalid control action outside the approved timing range',
      finalPosePolicy: 'restore_initial',
      tracks: [{
        ...fixture.actionPlan.tracks[0]!,
        keyframes: fixture.actionPlan.tracks[0]!.keyframes.map(
          (keyframe, index) => index === 0
            ? { ...keyframe, frame: 11 }
            : keyframe,
        ),
      }],
    }),
    /frames are invalid/,
  )
  assert.throws(
    () => compileLivingFrameBlenderFixedAdapterInternalRequest({
      ...fixture,
      componentId: 'component.primary',
      material: {
        baseColorRgba: [0.12, 0.42, 0.92, 1],
        roughness: 0.6,
      },
      fps: 30,
      renderProfile: 'arbitrary_half_scale' as 'full',
    }),
    /Invalid option/,
  )

  const originalEnvelope = structuredClone(fullRequest.envelope)
  const parsed = JSON.parse(
    originalEnvelope.payloadCanonicalJson,
  ) as Record<string, unknown>
  parsed.command = 'arbitrary'
  const payloadCanonicalJson = JSON.stringify(parsed)
  const tampered = {
    ...fullRequest,
    envelope: {
      ...originalEnvelope,
      payloadCanonicalJson,
      payloadDigestSha256: createHash('sha256')
        .update(payloadCanonicalJson)
        .digest('hex'),
    },
  }
  assert.throws(
    () => runLivingFrameBlenderFixedAdapterInternal(tampered),
    /compiled request integrity is invalid/,
  )

  const evidenceDraft: Omit<
    LivingFrameBlenderFixedAdapterRuntimeEvidence,
    'evidenceDigestSha256'
  > = {
    evidenceVersion:
      LIVING_FRAME_BLENDER_FIXED_ADAPTER_RUNTIME_EVIDENCE_VERSION,
    scope: 'private_internal_native_host_qualification',
    blender: {
      version: '4.5.11 LTS',
      buildHash: '4db51e9d1e1e',
      platform: 'Darwin',
      architecture: 'arm64',
      packageSha256:
        '1fad76c7da9451c7d6db99f1a5ed3c0a1a461d0aa07bf2b639e2fb4804ca4f13',
      signedBy:
        'Developer ID Application: Stichting Blender Foundation (68UA947AUU)',
      notarized: true,
      autoExecutionDisabled: true,
      factoryStartupRequired: true,
    },
    adapterSourceDigestSha256:
      fixedBlenderAdapterSourceDigestSha256(),
    candidateRequestDigestSha256:
      fixture.candidateRequest.requestDigestSha256,
    riggingPlanDigestSha256:
      fixture.candidateRequest.riggingPlan.planDigestSha256,
    actionPlanDigestSha256: fixture.actionPlan.actionDigestSha256,
    payloadDigestSha256:
      fullRequest.payload.payloadDigestBindingSha256,
    coldStartDurationMs: cold.durationMs,
    coldStartMaximumResidentBytes: cold.maximumResidentBytes,
    warmStartDurationMs: warm.durationMs,
    previewMaximumResidentBytes: previewRun.maximumResidentBytes,
    fullRenderMaximumResidentBytes: fullRun.maximumResidentBytes,
    result: fullRun.result,
    qa: {
      exactFrameCount: true,
      exactCanvasDimensions: true,
      rgbaPixelFormatObserved: true,
      transparentAndOpaquePixelsObserved: true,
      maskPixelFormatObserved: true,
      depthPassObserved: true,
      firstAndDemonstrationFrameDiffer: true,
      finalFrameRestoresInitialPose: true,
      deterministicDecodedRgbaAndMaskPreviewReplay: true,
      outputContainsBackgroundPlate: false,
      outputClaimsFinalCanvas: false,
    },
    confinement: {
      fixedNoArgumentAdapter: true,
      factoryStartup: true,
      blenderAutoExecutionDisabled: true,
      rawChatAccepted: false,
      callerCodeAccepted: false,
      callerCommandAccepted: false,
      callerPathAccepted: false,
      callerEnvironmentAccepted: false,
      networkIsolationProven: false,
    },
    authorityBoundary: {
      privateInternalQualificationOnly: true,
      runtimeDispatchAuthority: false,
      assetPersistenceAuthority: false,
      assetManifestAuthority: false,
      costAuthority: false,
      billingAuthority: false,
      qaApprovalAuthority: false,
      finalCanvasAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
      remotionOwnsFinalCanvas: true,
    },
    runtimeOperationRegistered: false,
    dispatchAuthority: false,
    canonicalAssetPersistenceAuthority: false,
    canonicalCostAuthority: false,
    customerBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  const evidence: LivingFrameBlenderFixedAdapterRuntimeEvidence = {
    ...evidenceDraft,
    evidenceDigestSha256: sha256AuthorityValue(evidenceDraft),
  }
  console.log(JSON.stringify({
    smoke:
      'living_frame_blender_fixed_adapter_private_internal_test',
    status: 'passed_private_native_host_partial_qualification',
    evidence,
    preview: {
      widthPixels: previewRequest.payload.output.widthPixels,
      heightPixels: previewRequest.payload.output.heightPixels,
      frameCount: previewRun.result.frameCount,
      totalDurationMs: previewRun.totalDurationMs,
      renderDurationMs: previewRun.result.renderDurationMs,
      maximumResidentBytes: previewRun.maximumResidentBytes,
      outputBytes:
        previewRun.result.rgbaBytes
        + previewRun.result.maskBytes
        + previewRun.result.depthBytes,
      deterministicDecodedRgbaAndMaskReplayVerified: true,
      replayTotalDurationMs: previewReplayRun.totalDurationMs,
    },
    full: {
      widthPixels: fullRequest.payload.output.widthPixels,
      heightPixels: fullRequest.payload.output.heightPixels,
      frameCount: fullRun.result.frameCount,
      totalDurationMs: fullRun.totalDurationMs,
      rigCompileDurationMs: fullRun.result.rigCompileDurationMs,
      renderDurationMs: fullRun.result.renderDurationMs,
      maximumResidentBytes: fullRun.maximumResidentBytes,
      outputBytes:
        fullRun.result.rgbaBytes
        + fullRun.result.maskBytes
        + fullRun.result.depthBytes,
    },
    adversarialAssertions: 5,
    externalOperationRegistered: false,
    networkIsolationStillRequired: true,
    canonicalPersistenceQaCostAndReviewStillRequired: true,
    remotionOwnsFinalCanvas: true,
  }))
} finally {
  previewRun.cleanup()
  previewReplayRun?.cleanup()
  fullRun?.cleanup()
}

function measureBlenderStartup(): {
  readonly durationMs: number
  readonly maximumResidentBytes: number
  readonly versionObserved: boolean
} {
  const started = performance.now()
  const result = spawnSync('/usr/bin/time', [
    '-lp',
    BLENDER,
    '--background',
    '--factory-startup',
    '--disable-autoexec',
    '--version',
  ], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024,
    timeout: 30_000,
    env: {
      PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
    },
  })
  assert.equal(result.status, 0)
  const durationMs = Math.round(performance.now() - started)
  const residentMatch =
    result.stderr.match(/^\s*(\d+)\s+maximum resident set size$/mu)
  assert.ok(residentMatch)
  return {
    durationMs,
    maximumResidentBytes: Number(residentMatch[1]),
    versionObserved: result.stdout.includes('Blender 4.5.11 LTS'),
  }
}

function inspectRgba(path: string): {
  readonly width: number
  readonly height: number
  readonly channels: number
  readonly transparentPixels: number
  readonly opaquePixels: number
  readonly pixelDigestSha256: string
} {
  const metadata = probeImage(path)
  const decoded = spawnSync('ffmpeg', [
    '-v',
    'error',
    '-i',
    path,
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgba',
    'pipe:1',
  ], {
    encoding: 'buffer',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 15_000,
  })
  assert.equal(decoded.status, 0)
  const data = decoded.stdout
  assert.equal(data.length, metadata.width * metadata.height * 4)
  let transparentPixels = 0
  let opaquePixels = 0
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] === 0) transparentPixels += 1
    if (data[index] === 255) opaquePixels += 1
  }
  return {
    width: metadata.width,
    height: metadata.height,
    channels: 4,
    transparentPixels,
    opaquePixels,
    pixelDigestSha256: createHash('sha256').update(data).digest('hex'),
  }
}

function decodedSequenceDigest(
  files: readonly string[],
  pixelFormat: 'gray' | 'rgba',
): string {
  const aggregate = createHash('sha256')
  for (const [index, path] of files.entries()) {
    const decoded = spawnSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      path,
      '-f',
      'rawvideo',
      '-pix_fmt',
      pixelFormat,
      'pipe:1',
    ], {
      encoding: 'buffer',
      maxBuffer: 16 * 1024 * 1024,
      timeout: 15_000,
    })
    assert.equal(decoded.status, 0)
    assert.ok(decoded.stdout.length > 0)
    aggregate.update(String(index))
    aggregate.update(createHash('sha256').update(decoded.stdout).digest())
  }
  return aggregate.digest('hex')
}

function probeImage(path: string): {
  readonly width: number
  readonly height: number
  readonly codecName: string
  readonly pixelFormat: string
} {
  const result = spawnSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'stream=codec_name,pix_fmt,width,height',
    '-of',
    'json',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024,
    timeout: 10_000,
  })
  assert.equal(result.status, 0)
  const stream = (
    JSON.parse(result.stdout) as {
      streams?: {
        codec_name?: string
        pix_fmt?: string
        width?: number
        height?: number
      }[]
    }
  ).streams?.[0]
  assert.ok(stream)
  return {
    width: stream.width ?? 0,
    height: stream.height ?? 0,
    codecName: stream.codec_name ?? '',
    pixelFormat: stream.pix_fmt ?? '',
  }
}

function probeExr(path: string): {
  readonly width: number
  readonly height: number
  readonly codecName: 'exr'
} {
  const result = spawnSync('/usr/bin/file', [path], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024,
    timeout: 10_000,
  })
  assert.equal(result.status, 0)
  const dimensions = result.stdout.match(
    /dataWindow: \(0 0\)-\((\d+) (\d+)\)/u,
  )
  assert.ok(dimensions)
  return {
    width: Number(dimensions[1]) + 1,
    height: Number(dimensions[2]) + 1,
    codecName: 'exr',
  }
}
