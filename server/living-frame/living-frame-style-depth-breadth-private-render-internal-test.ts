import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionSpecDraft,
} from '../../src/types/living-frame-canonical-motion'
import type {
  LivingFrameDepthBand,
  LivingFrameVisualVerb,
} from '../../src/types/living-frame'
import {
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  activatePrivateOfflineRemotionRenderRuntime,
  buildOfflineRemotionFinalCompositionStreamingRequest,
  prepareOfflineRemotionDockerRuntime,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'
import {
  deriveCanonicalLivingFrameCompiledSampleDigestSha256,
} from './canonical-living-frame-motion'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from './living-frame-environmental-particle-sequence-observation'

const WIDTH = 640
const HEIGHT = 360
const FPS = 30
const SCENE_FRAME_COUNT = 60
const DURATION_FRAMES = 120
const OUTPUT_STORAGE_ROOT =
  '/tmp/reeditpro-living-frame-style-depth-breadth-private-test'
const FIXTURE_ASSET_ROOT =
  'server/smoke/fixtures/assets'

const FLAT_RANGE = {
  startFrame: 0,
  endFrameExclusive: SCENE_FRAME_COUNT,
} as const
const SHALLOW_RANGE = {
  startFrame: SCENE_FRAME_COUNT,
  endFrameExclusive: DURATION_FRAMES,
} as const

const ASTRONOMER_FIXTURE = {
  pngFileName:
    'living-frame-astronomer-flat-editorial-alpha-v1.png',
  metadataFileName:
    'living-frame-astronomer-flat-editorial-alpha-v1.json',
  artifactId:
    'lf.style-depth.astronomer-flat-editorial.v1',
  expectedSha256:
    'b87db6ca3fb2300f361a2e44adae44821507e25a5cdd3832ad37f49d5871c340',
  expectedByteLength: 1_342_199,
  expectedWidth: 1_024,
  expectedHeight: 1_536,
} as const

const LOCOMOTIVE_FIXTURE = {
  pngFileName:
    'living-frame-locomotive-paper-collage-alpha-v1.png',
  metadataFileName:
    'living-frame-locomotive-paper-collage-alpha-v1.json',
  artifactId:
    'lf.style-depth.locomotive-paper-collage.v1',
  expectedSha256:
    'f8b7c75bd4bec69161af22f113cf09aac3de98231f3457eb40d4c0ee83331ac3',
  expectedByteLength: 1_504_845,
  expectedWidth: 1_536,
  expectedHeight: 1_024,
} as const

export interface LivingFrameStyleDepthBreadthPrivateRenderInternalTestReceipt {
  readonly schemaVersion:
    'living-frame-style-depth-breadth-private-render-internal-test-v1'
  readonly evidenceClass:
    'actual_private_internal_style_adaptive_flat_and_shallow_2_5d_render'
  readonly generatedFixtureEvidence: {
    readonly generationChannel:
      'codex_image_gen_builtin'
    readonly alphaPreparation:
      'skill_chroma_key_soft_matte_and_despill'
    readonly fixtures: readonly [{
      readonly artifactId:
        'lf.style-depth.astronomer-flat-editorial.v1'
      readonly assetTreatment:
        'flat_editorial_cutout'
      readonly sourceSha256: string
      readonly sourceWidthPixels: 1_024
      readonly sourceHeightPixels: 1_536
      readonly transparentCorners: true
      readonly illustrativeNotEvidence: true
    }, {
      readonly artifactId:
        'lf.style-depth.locomotive-paper-collage.v1'
      readonly assetTreatment: 'paper_collage'
      readonly sourceSha256: string
      readonly sourceWidthPixels: 1_536
      readonly sourceHeightPixels: 1_024
      readonly transparentCorners: true
      readonly illustrativeNotEvidence: true
    }]
  }
  readonly scenes: readonly [{
    readonly sceneId:
      'lf-style-depth-flat-editorial-scene'
    readonly mode: 'living_still'
    readonly assetTreatment:
      'flat_editorial_cutout'
    readonly depthStyle: 'flat'
    readonly spatialParallaxAllowed: false
    readonly permittedMotion:
      readonly ['opacity_reveal', 'restrained_scale_settle', 'editorial_line_build']
    readonly renderedCharacterCentroidDriftPixels: number
    readonly flatAnchorCentroidDriftPixels: number
  }, {
    readonly sceneId:
      'lf-style-depth-paper-collage-scene'
    readonly mode: 'living_still'
    readonly assetTreatment: 'paper_collage'
    readonly depthStyle: 'shallow_2_5d'
    readonly spatialParallaxAllowed: true
    readonly permittedMotion:
      readonly ['restrained_far_plane_drift', 'subject_anchor_drift', 'paper_smoke_rise', 'restrained_foreground_drift']
    readonly farPlaneDisplacementPixels: number
    readonly foregroundDisplacementPixels: number
    readonly smokeVerticalDisplacementPixels: number
  }]
  readonly adaptiveDepthQa: {
    readonly flatSceneDidNotReceiveParallax: true
    readonly shallowSceneDifferentialParallaxMeasured: true
    readonly shallowForegroundMovedMoreThanFarPlane: true
    readonly generatedFixtureBytesDecodedAndMeasured: true
    readonly captionPlaneObservedAboveBothStyles: true
    readonly distinctSampleFrameDigestCount: number
  }
  readonly runtime: {
    readonly actualRemotionEntrypointExecuted: true
    readonly actualFfmpegEntrypointExecuted: true
    readonly actualFfprobeEntrypointExecuted: true
    readonly outputSha256: string
    readonly outputByteLength: number
    readonly outputWidthPixels: 640
    readonly outputHeightPixels: 360
    readonly outputFrameRate: '30/1'
    readonly outputFrameCount: 120
    readonly persistedCreateOnly: true
    readonly persistedArtifactReopened: true
  }
  readonly privateArtifacts: {
    readonly outputObjectIdentityHash: string
    readonly reviewFrameIndexes:
      readonly [32, 68, 112]
    readonly reviewFrameObjectKeys:
      readonly [string, string, string]
    readonly reviewFrameSha256:
      readonly [string, string, string]
    readonly publicUrlCreated: false
  }
  readonly authorityBoundary: {
    readonly privateInternalExecutionAuthority: true
    readonly fixtureGenerationIsNotCanonicalProviderEvidence: true
    readonly canonicalPlanningAuthority: false
    readonly canonicalAssetManifestAuthority: false
    readonly canonicalDispatchAuthority: false
    readonly customerBillingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productAuthority: false
    readonly productionAuthority: false
  }
  readonly openGates: readonly [
    'deep_multiplane_runtime_evidence_remains_owned_by_existing_musashi_fixture',
    'exact_comfyui_generated_output_requires_five_model_weights_and_gpu_execution',
    'canonical_selected_scene_asset_manifest_and_qa_reconciliation_required',
    'owner_private_review_decision_required_for_style_and_motion',
  ]
  readonly receiptDigestSha256: string
}

interface FixtureMetadata {
  readonly schemaVersion:
    'living-frame-style-depth-fixture-provenance-v1'
  readonly artifactId: string
  readonly generationChannel: 'codex_image_gen_builtin'
  readonly depictionStatus: string
  readonly normalizedFixture: {
    readonly fileName: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly contentSha256: string
    readonly byteLength: number
    readonly rgbaPng: true
    readonly transparentCorners: true
    readonly subjectCoverage: number
    readonly normalization: string
  }
}

interface LoadedFixture {
  readonly artifactId: string
  readonly path: string
  readonly bytes: Buffer
  readonly sha256: string
  readonly byteLength: number
  readonly width: number
  readonly height: number
}

interface RenderLayer {
  readonly inputId: string
  readonly outputKey: string
  readonly path: string
  readonly commitment: {
    readonly byteLength: number
    readonly sha256: string
  }
  readonly planning: {
    readonly sceneId: string
    readonly layerId: string
    readonly manifestOutputKey: string
    readonly componentOutputKey: string
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly fit: 'fill'
    readonly opacity: 1
    readonly motionSpec: CanonicalLivingFrameMotionSpec
  }
}

export async function executeLivingFrameStyleDepthBreadthPrivateRenderInternalTest():
Promise<LivingFrameStyleDepthBreadthPrivateRenderInternalTestReceipt> {
  if (arguments.length !== 0) {
    throw new Error(
      'Style-depth breadth private render accepts no caller input.',
    )
  }
  const fixtureRoot = await mkdtemp(join(
    tmpdir(),
    'reeditpro-lf-style-depth-breadth-',
  ))
  const sourcePath = join(fixtureRoot, 'source.mp4')
  const captionPath = join(fixtureRoot, 'caption.png')
  const flatBackgroundPath = join(
    fixtureRoot,
    'flat-background.png',
  )
  const flatCharacterPath = join(
    fixtureRoot,
    'flat-character.png',
  )
  const flatEditorialLinesPath = join(
    fixtureRoot,
    'flat-editorial-lines.png',
  )
  const shallowFarPath = join(
    fixtureRoot,
    'shallow-far.png',
  )
  const shallowLocomotivePath = join(
    fixtureRoot,
    'shallow-locomotive.png',
  )
  const shallowSmokePath = join(
    fixtureRoot,
    'shallow-smoke.png',
  )
  const shallowForegroundPath = join(
    fixtureRoot,
    'shallow-foreground.png',
  )
  const renderedPath = join(fixtureRoot, 'rendered.mp4')

  try {
    const astronomer = await loadFixture(ASTRONOMER_FIXTURE)
    const locomotive = await loadFixture(LOCOMOTIVE_FIXTURE)

    makeSource(sourcePath)
    makeCaption(captionPath)
    makeTransparentOverlay(flatBackgroundPath, [
      'drawbox=x=0:y=0:w=640:h=360:color=0xF0DFC0@1:t=fill:replace=1',
      'drawbox=x=382:y=54:w=184:h=212:color=0x172D43@1:t=fill:replace=1',
      'drawbox=x=410:y=80:w=128:h=12:color=0xD09A42@1:t=fill:replace=1',
      'drawbox=x=410:y=118:w=86:h=8:color=0xD09A42@1:t=fill:replace=1',
      'drawbox=x=410:y=152:w=112:h=8:color=0xD09A42@1:t=fill:replace=1',
    ])
    prepareAlphaFixtureOverlay({
      sourcePath: astronomer.path,
      destinationPath: flatCharacterPath,
      scaleFilter: 'scale=-1:330:flags=lanczos',
      padX: 70,
      padY: 15,
    })
    makeTransparentOverlay(flatEditorialLinesPath, [
      'drawbox=x=397:y=203:w=154:h=6:color=0xC4512F@1:t=fill:replace=1',
      'drawbox=x=397:y=225:w=118:h=6:color=0xC4512F@1:t=fill:replace=1',
      'drawbox=x=397:y=247:w=138:h=6:color=0xC4512F@1:t=fill:replace=1',
    ])

    makeTransparentOverlay(shallowFarPath, [
      'drawbox=x=0:y=0:w=640:h=360:color=0xDECBA4@1:t=fill:replace=1',
      'drawbox=x=55:y=58:w=112:h=126:color=0xC89A45@1:t=fill:replace=1',
      'drawbox=x=190:y=82:w=86:h=102:color=0xB87B4D@1:t=fill:replace=1',
      'drawbox=x=302:y=48:w=132:h=136:color=0xC89A45@1:t=fill:replace=1',
      'drawbox=x=466:y=76:w=92:h=108:color=0xB87B4D@1:t=fill:replace=1',
    ])
    prepareAlphaFixtureOverlay({
      sourcePath: locomotive.path,
      destinationPath: shallowLocomotivePath,
      scaleFilter: 'scale=520:-1:flags=lanczos',
      padX: 60,
      padY: 6,
    })
    makeTransparentOverlay(shallowSmokePath, [
      'drawbox=x=150:y=92:w=42:h=34:color=0x72B5C8@1:t=fill:replace=1',
      'drawbox=x=178:y=66:w=54:h=42:color=0x72B5C8@0.96:t=fill:replace=1',
      'drawbox=x=216:y=38:w=66:h=48:color=0x72B5C8@0.9:t=fill:replace=1',
    ])
    makeTransparentOverlay(shallowForegroundPath, [
      'drawbox=x=0:y=306:w=640:h=54:color=0x783C2B@1:t=fill:replace=1',
      'drawbox=x=432:y=278:w=188:h=28:color=0xA95237@1:t=fill:replace=1',
    ])

    const sourceCommitment = await fileCommitment(sourcePath)
    const captionCommitment = await fileCommitment(captionPath)
    const layers = await Promise.all([
      buildLayer({
        path: flatBackgroundPath,
        sceneId: 'lf-style-depth-flat-editorial-scene',
        layerId: 'flat-10-background',
        componentId: 'flat-editorial-background',
        timeRange: FLAT_RANGE,
        visualVerb: 'reveal',
        depthStyle: 'flat',
        depthBand: 'background',
        parallaxFactor: 0,
        tracks: [
          track(
            'flat-background-opacity',
            0,
            'layer',
            'opacity',
            'ambient',
            [[0, 1, 'hold'], [59, 1, 'hold']],
          ),
        ],
      }),
      buildLayer({
        path: flatCharacterPath,
        sceneId: 'lf-style-depth-flat-editorial-scene',
        layerId: 'flat-20-character',
        componentId: 'flat-editorial-character',
        timeRange: FLAT_RANGE,
        visualVerb: 'reveal',
        depthStyle: 'flat',
        depthBand: 'subject_plane',
        parallaxFactor: 0,
        tracks: [
          track(
            'flat-character-opacity',
            0,
            'layer',
            'opacity',
            'primary',
            [
              [0, 0.05, 'ease_out_quad'],
              [12, 1, 'settle_out'],
              [59, 1, 'hold'],
            ],
          ),
          track(
            'flat-character-scale',
            1,
            'layer',
            'scale_uniform',
            'secondary',
            [
              [0, 0.985, 'ease_out_quad'],
              [18, 1, 'settle_out'],
              [59, 1, 'hold'],
            ],
          ),
        ],
      }),
      buildLayer({
        path: flatEditorialLinesPath,
        sceneId: 'lf-style-depth-flat-editorial-scene',
        layerId: 'flat-30-editorial-lines',
        componentId: 'flat-editorial-lines',
        timeRange: FLAT_RANGE,
        visualVerb: 'reveal',
        depthStyle: 'flat',
        depthBand: 'in_front_of_subject',
        parallaxFactor: 0,
        tracks: [
          track(
            'flat-lines-opacity',
            0,
            'layer',
            'opacity',
            'secondary',
            [
              [0, 0, 'hold'],
              [16, 0, 'ease_out_quad'],
              [31, 1, 'settle_out'],
              [59, 1, 'hold'],
            ],
          ),
          track(
            'flat-lines-scale',
            1,
            'layer',
            'scale_uniform',
            'secondary',
            [
              [0, 0.86, 'hold'],
              [16, 0.86, 'ease_out_quad'],
              [31, 1, 'settle_out'],
              [59, 1, 'hold'],
            ],
          ),
        ],
      }),
      buildLayer({
        path: shallowFarPath,
        sceneId: 'lf-style-depth-paper-collage-scene',
        layerId: 'shallow-10-far',
        componentId: 'paper-collage-far',
        timeRange: SHALLOW_RANGE,
        visualVerb: 'reveal',
        depthStyle: 'shallow_2_5d',
        depthBand: 'background',
        parallaxFactor: -0.08,
        tracks: [
          track(
            'shallow-far-drift',
            0,
            'layer',
            'position_x_normalized',
            'ambient',
            [
              [0, -0.025, 'ease_in_out_cubic'],
              [59, 0.025, 'hold'],
            ],
          ),
          track(
            'shallow-camera-drift',
            1,
            'virtual_camera',
            'position_x_normalized',
            'camera',
            [
              [0, -0.008, 'ease_in_out_cubic'],
              [59, 0.008, 'hold'],
            ],
          ),
        ],
      }),
      buildLayer({
        path: shallowLocomotivePath,
        sceneId: 'lf-style-depth-paper-collage-scene',
        layerId: 'shallow-20-locomotive',
        componentId: 'paper-collage-locomotive',
        timeRange: SHALLOW_RANGE,
        visualVerb: 'transform',
        depthStyle: 'shallow_2_5d',
        depthBand: 'subject_plane',
        parallaxFactor: 0.04,
        tracks: [
          track(
            'shallow-locomotive-opacity',
            0,
            'layer',
            'opacity',
            'primary',
            [
              [0, 0.08, 'ease_out_quad'],
              [12, 1, 'settle_out'],
              [59, 1, 'hold'],
            ],
          ),
          track(
            'shallow-locomotive-drift',
            1,
            'layer',
            'position_x_normalized',
            'secondary',
            [
              [0, 0.012, 'ease_in_out_cubic'],
              [59, -0.012, 'hold'],
            ],
          ),
        ],
      }),
      buildLayer({
        path: shallowSmokePath,
        sceneId: 'lf-style-depth-paper-collage-scene',
        layerId: 'shallow-25-smoke',
        componentId: 'paper-collage-smoke',
        timeRange: SHALLOW_RANGE,
        visualVerb: 'transform',
        depthStyle: 'shallow_2_5d',
        depthBand: 'in_front_of_subject',
        parallaxFactor: 0.12,
        tracks: [
          track(
            'shallow-smoke-opacity',
            0,
            'layer',
            'opacity',
            'secondary',
            [
              [0, 0, 'ease_out_quad'],
              [10, 1, 'settle_out'],
              [44, 0.85, 'ease_in_out_cubic'],
              [59, 0.2, 'hold'],
            ],
          ),
          track(
            'shallow-smoke-rise',
            1,
            'layer',
            'position_y_normalized',
            'secondary',
            [
              [0, 0.07, 'ease_out_quad'],
              [59, -0.07, 'hold'],
            ],
          ),
          track(
            'shallow-smoke-drift',
            2,
            'layer',
            'position_x_normalized',
            'ambient',
            [
              [0, -0.01, 'ease_in_out_cubic'],
              [59, 0.035, 'hold'],
            ],
          ),
        ],
      }),
      buildLayer({
        path: shallowForegroundPath,
        sceneId: 'lf-style-depth-paper-collage-scene',
        layerId: 'shallow-30-foreground',
        componentId: 'paper-collage-foreground',
        timeRange: SHALLOW_RANGE,
        visualVerb: 'transform',
        depthStyle: 'shallow_2_5d',
        depthBand: 'foreground',
        parallaxFactor: 0.18,
        tracks: [
          track(
            'shallow-foreground-drift',
            0,
            'layer',
            'position_x_normalized',
            'secondary',
            [
              [0, 0.06, 'ease_in_out_cubic'],
              [59, -0.06, 'hold'],
            ],
          ),
        ],
      }),
    ])

    await prepareOfflineRemotionDockerRuntime()
    const runtime =
      await activatePrivateOfflineRemotionRenderRuntime()
    const request =
      buildOfflineRemotionFinalCompositionStreamingRequest({
        planningPayload: {
          compositionProfileId:
            'approved_source_caption_final_v1',
          width: WIDTH,
          height: HEIGHT,
          fps: FPS,
          durationFrames: DURATION_FRAMES,
          sourceStartFrame: 0,
          sourceEndFrameExclusive: DURATION_FRAMES,
          sourceFit: 'contain',
          panelBackground: '#141821',
          audioPolicy: 'preserve_source',
          captionOverlayPolicy:
            'approved_full_frame_rgba',
          livingFrameOverlayPolicy:
            'approved_rgba_over_source_below_captions_v1',
          livingFrameOverlayLayers:
            layers.map((candidate) =>
              candidate.planning),
        },
        source: {
          inputId: 'lf-style-depth-source',
          mimeType: 'video/mp4',
          ...sourceCommitment,
        },
        captionOverlay: {
          inputId: 'lf-style-depth-caption',
          mimeType: 'image/png',
          ...captionCommitment,
        },
        livingFrameOverlays:
          layers.map((candidate) => ({
            inputId: candidate.inputId,
            outputKey: candidate.outputKey,
            mimeType: 'image/png' as const,
            ...candidate.commitment,
          })),
      })
    const inputs: OfflineRemotionServerInjectedInput[] = [
      privateFileInput(
        'lf-style-depth-source',
        'video/mp4',
        sourcePath,
        sourceCommitment,
      ),
      ...layers.map((candidate) =>
        privateFileInput(
          candidate.inputId,
          'image/png',
          candidate.path,
          candidate.commitment,
        )),
      privateFileInput(
        'lf-style-depth-caption',
        'image/png',
        captionPath,
        captionCommitment,
      ),
    ]

    let outputObjectIdentityHash = ''
    const result = await runtime.executeServerInjected(
      request,
      inputs,
      {
        maximumBytes:
          OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
        async persist(output) {
          outputObjectIdentityHash = createHash('sha256')
            .update(
              `living-frame-style-depth-breadth-v1\n${output.expectedSha256}`,
            )
            .digest('hex')
          const persisted =
            await persistCanonicalPrivateRemotionArtifactStream({
              localStorageRoot: OUTPUT_STORAGE_ROOT,
              privateObjectIdentityHash:
                outputObjectIdentityHash,
              stream: output.stream,
              expectedByteLength:
                output.expectedByteLength,
              expectedSha256:
                output.expectedSha256,
            })
          const reopened =
            await inspectCanonicalPrivateRemotionArtifact({
              localStorageRoot: OUTPUT_STORAGE_ROOT,
              privateObjectIdentityHash:
                outputObjectIdentityHash,
            })
          if (
            !reopened
            || reopened.sha256 !== output.expectedSha256
            || reopened.byteLength !==
              output.expectedByteLength
          ) {
            throw new Error(
              'Style-depth private artifact changed after persistence.',
            )
          }
          const chunks: Buffer[] = []
          for await (const chunk of
            await reopened.openStream()) {
            chunks.push(
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk),
            )
          }
          await writeFile(
            renderedPath,
            Buffer.concat(chunks),
            { flag: 'wx', mode: 0o600 },
          )
          return persisted
        },
      },
    )

    const semantic = result.evidence.semanticEvidence
    const failedSemanticExpectations = [
      [
        'actual_remotion_package',
        result.evidence.packageName
          === 'remotion+@remotion/renderer'
          && result.evidence.packageVersion === '4.0.487'
          && result.evidence.containerExitCode === 0,
      ],
      [
        'deterministic_motion',
        semantic.approvedLivingFrameDeterministicMotionApplied,
      ],
      [
        'adaptive_depth',
        semantic.approvedLivingFrameAdaptiveDepthStyleApplied,
      ],
      [
        'camera_or_source_attention',
        semantic.approvedLivingFrameCameraOrSourceAttentionApplied,
      ],
      [
        'caption_plane',
        semantic.approvedLivingFrameOverlayBelowCaptionsApplied,
      ],
    ].filter(([, passed]) => passed !== true)
      .map(([name]) => name)
    if (failedSemanticExpectations.length > 0) {
      throw new Error(
        `Style-depth private Remotion evidence is incomplete: ${failedSemanticExpectations.join(',')}.`,
      )
    }

    const probe = probeRenderedVideo(renderedPath)
    if (
      probe.width !== WIDTH
      || probe.height !== HEIGHT
      || probe.frameRate !== `${FPS}/1`
      || probe.frameCount !== DURATION_FRAMES
    ) {
      throw new Error(
        'Style-depth private output media profile changed.',
      )
    }
    const sampleFrameNumbers =
      [0, 18, 32, 55, 60, 68, 92, 112, 119] as const
    const sampleFrames =
      extractFrames(renderedPath, sampleFrameNumbers)
    const frameByNumber = new Map<number, Buffer>(
      sampleFrameNumbers.map((frameNumber, index) =>
        [frameNumber, sampleFrames[index]!] as const),
    )
    const frame = (frameNumber: number): Buffer => {
      const value = frameByNumber.get(frameNumber)
      if (!value) {
        throw new Error(
          `Style-depth sample frame ${frameNumber} is missing.`,
        )
      }
      return value
    }
    const distinctSampleFrameDigestCount =
      new Set(sampleFrames.map(sha256Bytes)).size

    const flatCharacterEarly = colorStats(
      frame(32),
      colorMatchers.flatRust,
      {
        xStart: 50,
        xEndExclusive: 370,
        yStart: 0,
        yEndExclusive: 330,
      },
    )
    const flatCharacterLate = colorStats(
      frame(55),
      colorMatchers.flatRust,
      {
        xStart: 50,
        xEndExclusive: 370,
        yStart: 0,
        yEndExclusive: 330,
      },
    )
    const renderedCharacterCentroidDriftPixels =
      distance(
        flatCharacterEarly.centroidX,
        flatCharacterEarly.centroidY,
        flatCharacterLate.centroidX,
        flatCharacterLate.centroidY,
      )
    const flatAnchorEarly = colorStats(
      frame(32),
      colorMatchers.flatOchre,
      {
        xStart: 370,
        xEndExclusive: 570,
        yStart: 40,
        yEndExclusive: 270,
      },
    )
    const flatAnchorLate = colorStats(
      frame(55),
      colorMatchers.flatOchre,
      {
        xStart: 370,
        xEndExclusive: 570,
        yStart: 40,
        yEndExclusive: 270,
      },
    )
    const flatAnchorCentroidDriftPixels =
      distance(
        flatAnchorEarly.centroidX,
        flatAnchorEarly.centroidY,
        flatAnchorLate.centroidX,
        flatAnchorLate.centroidY,
      )
    if (
      flatCharacterEarly.count < 1_000
      || flatCharacterLate.count < 1_000
      || flatAnchorEarly.count < 1_000
      || flatAnchorLate.count < 1_000
      || renderedCharacterCentroidDriftPixels > 2
      || flatAnchorCentroidDriftPixels > 2
    ) {
      throw new Error(
        `Flat editorial spatial-stability QA failed: character=${JSON.stringify(flatCharacterEarly)}/${JSON.stringify(flatCharacterLate)}, anchor=${JSON.stringify(flatAnchorEarly)}/${JSON.stringify(flatAnchorLate)}, drift=${renderedCharacterCentroidDriftPixels}/${flatAnchorCentroidDriftPixels}.`,
      )
    }

    const farEarly = colorStats(
      frame(68),
      colorMatchers.shallowOchre,
      {
        xStart: 0,
        xEndExclusive: 640,
        yStart: 30,
        yEndExclusive: 190,
      },
    )
    const farLate = colorStats(
      frame(112),
      colorMatchers.shallowOchre,
      {
        xStart: 0,
        xEndExclusive: 640,
        yStart: 30,
        yEndExclusive: 190,
      },
    )
    const foregroundEarly = colorStats(
      frame(68),
      colorMatchers.shallowRust,
      {
        xStart: 0,
        xEndExclusive: 640,
        yStart: 270,
        yEndExclusive: 360,
      },
    )
    const foregroundLate = colorStats(
      frame(112),
      colorMatchers.shallowRust,
      {
        xStart: 0,
        xEndExclusive: 640,
        yStart: 270,
        yEndExclusive: 360,
      },
    )
    const smokeEarly = colorStats(
      frame(68),
      colorMatchers.smoke,
      {
        xStart: 80,
        xEndExclusive: 360,
        yStart: 0,
        yEndExclusive: 190,
      },
    )
    const smokeLate = colorStats(
      frame(92),
      colorMatchers.smoke,
      {
        xStart: 80,
        xEndExclusive: 360,
        yStart: 0,
        yEndExclusive: 190,
      },
    )
    const farPlaneDisplacementPixels =
      Math.abs(
        farLate.centroidX - farEarly.centroidX,
      )
    const foregroundDisplacementPixels =
      Math.abs(
        foregroundLate.centroidX
          - foregroundEarly.centroidX,
      )
    const smokeVerticalDisplacementPixels =
      Math.abs(
        smokeLate.centroidY - smokeEarly.centroidY,
      )
    if (
      farEarly.count < 2_000
      || farLate.count < 2_000
      || foregroundEarly.count < 4_000
      || foregroundLate.count < 4_000
      || smokeEarly.count < 150
      || smokeLate.count < 150
      || farPlaneDisplacementPixels < 12
      || foregroundDisplacementPixels
        < farPlaneDisplacementPixels + 20
      || smokeVerticalDisplacementPixels < 18
    ) {
      throw new Error(
        `Shallow paper-collage depth QA failed: far=${JSON.stringify(farEarly)}/${JSON.stringify(farLate)}, foreground=${JSON.stringify(foregroundEarly)}/${JSON.stringify(foregroundLate)}, smoke=${JSON.stringify(smokeEarly)}/${JSON.stringify(smokeLate)}, displacement=${farPlaneDisplacementPixels}/${foregroundDisplacementPixels}/${smokeVerticalDisplacementPixels}.`,
      )
    }

    for (const frameNumber of [32, 68, 112]) {
      const caption = colorStats(
        frame(frameNumber),
        colorMatchers.caption,
        {
          xStart: 20,
          xEndExclusive: 620,
          yStart: 300,
          yEndExclusive: 352,
        },
      )
      if (caption.count < 9_000) {
        throw new Error(
          `Caption plane was not preserved at frame ${frameNumber}: ${JSON.stringify(caption)}.`,
        )
      }
    }
    if (distinctSampleFrameDigestCount < 7) {
      throw new Error(
        `Style-depth rendered samples lack temporal variation: ${distinctSampleFrameDigestCount}.`,
      )
    }

    const renderedBytes = await readFile(renderedPath)
    if (
      sha256Bytes(renderedBytes)
        !== result.artifact.sha256
      || renderedBytes.byteLength
        !== result.artifact.byteLength
    ) {
      throw new Error(
        'Style-depth rendered output changed after reopen.',
      )
    }
    const reviewFrameIndexes = [32, 68, 112] as const
    const reviewPngs =
      reviewFrameIndexes.map((frameNumber) =>
        extractPngFrame(renderedPath, frameNumber))
    const reviewFrameSha256 = reviewPngs.map(
      sha256Bytes,
    ) as [string, string, string]
    const reviewFrameObjectKeys =
      reviewFrameSha256.map((digest) =>
        `review-frames/${digest.slice(0, 2)}/${digest}.png`,
      ) as [string, string, string]
    for (let index = 0; index < reviewPngs.length; index += 1) {
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: OUTPUT_STORAGE_ROOT,
        relativePath:
          reviewFrameObjectKeys[index]!,
        content: reviewPngs[index]!,
      })
    }

    const draft:
      Omit<
        LivingFrameStyleDepthBreadthPrivateRenderInternalTestReceipt,
        'receiptDigestSha256'
      > = {
        schemaVersion:
          'living-frame-style-depth-breadth-private-render-internal-test-v1',
        evidenceClass:
          'actual_private_internal_style_adaptive_flat_and_shallow_2_5d_render',
        generatedFixtureEvidence: {
          generationChannel:
            'codex_image_gen_builtin',
          alphaPreparation:
            'skill_chroma_key_soft_matte_and_despill',
          fixtures: [{
            artifactId:
              'lf.style-depth.astronomer-flat-editorial.v1',
            assetTreatment:
              'flat_editorial_cutout',
            sourceSha256: astronomer.sha256,
            sourceWidthPixels: 1_024,
            sourceHeightPixels: 1_536,
            transparentCorners: true,
            illustrativeNotEvidence: true,
          }, {
            artifactId:
              'lf.style-depth.locomotive-paper-collage.v1',
            assetTreatment: 'paper_collage',
            sourceSha256: locomotive.sha256,
            sourceWidthPixels: 1_536,
            sourceHeightPixels: 1_024,
            transparentCorners: true,
            illustrativeNotEvidence: true,
          }],
        },
        scenes: [{
          sceneId:
            'lf-style-depth-flat-editorial-scene',
          mode: 'living_still',
          assetTreatment:
            'flat_editorial_cutout',
          depthStyle: 'flat',
          spatialParallaxAllowed: false,
          permittedMotion: [
            'opacity_reveal',
            'restrained_scale_settle',
            'editorial_line_build',
          ],
          renderedCharacterCentroidDriftPixels,
          flatAnchorCentroidDriftPixels,
        }, {
          sceneId:
            'lf-style-depth-paper-collage-scene',
          mode: 'living_still',
          assetTreatment: 'paper_collage',
          depthStyle: 'shallow_2_5d',
          spatialParallaxAllowed: true,
          permittedMotion: [
            'restrained_far_plane_drift',
            'subject_anchor_drift',
            'paper_smoke_rise',
            'restrained_foreground_drift',
          ],
          farPlaneDisplacementPixels,
          foregroundDisplacementPixels,
          smokeVerticalDisplacementPixels,
        }],
        adaptiveDepthQa: {
          flatSceneDidNotReceiveParallax: true,
          shallowSceneDifferentialParallaxMeasured:
            true,
          shallowForegroundMovedMoreThanFarPlane:
            true,
          generatedFixtureBytesDecodedAndMeasured:
            true,
          captionPlaneObservedAboveBothStyles: true,
          distinctSampleFrameDigestCount,
        },
        runtime: {
          actualRemotionEntrypointExecuted: true,
          actualFfmpegEntrypointExecuted: true,
          actualFfprobeEntrypointExecuted: true,
          outputSha256: result.artifact.sha256,
          outputByteLength:
            result.artifact.byteLength,
          outputWidthPixels: WIDTH,
          outputHeightPixels: HEIGHT,
          outputFrameRate: '30/1',
          outputFrameCount: DURATION_FRAMES,
          persistedCreateOnly: true,
          persistedArtifactReopened: true,
        },
        privateArtifacts: {
          outputObjectIdentityHash,
          reviewFrameIndexes,
          reviewFrameObjectKeys,
          reviewFrameSha256,
          publicUrlCreated: false,
        },
        authorityBoundary: {
          privateInternalExecutionAuthority: true,
          fixtureGenerationIsNotCanonicalProviderEvidence:
            true,
          canonicalPlanningAuthority: false,
          canonicalAssetManifestAuthority: false,
          canonicalDispatchAuthority: false,
          customerBillingAuthority: false,
          publicDeliveryAuthority: false,
          productAuthority: false,
          productionAuthority: false,
        },
        openGates: [
          'deep_multiplane_runtime_evidence_remains_owned_by_existing_musashi_fixture',
          'exact_comfyui_generated_output_requires_five_model_weights_and_gpu_execution',
          'canonical_selected_scene_asset_manifest_and_qa_reconciliation_required',
          'owner_private_review_decision_required_for_style_and_motion',
        ],
      }
    return {
      ...draft,
      receiptDigestSha256:
        sha256AuthorityValue(draft),
    }
  } finally {
    await rm(fixtureRoot, {
      recursive: true,
      force: true,
    })
  }
}

async function loadFixture(
  fixture:
    typeof ASTRONOMER_FIXTURE
    | typeof LOCOMOTIVE_FIXTURE,
): Promise<LoadedFixture> {
  const path = join(
    process.cwd(),
    FIXTURE_ASSET_ROOT,
    fixture.pngFileName,
  )
  const metadataPath = join(
    process.cwd(),
    FIXTURE_ASSET_ROOT,
    fixture.metadataFileName,
  )
  const [bytes, metadataBytes] = await Promise.all([
    readFile(path),
    readFile(metadataPath),
  ])
  const metadata = JSON.parse(
    metadataBytes.toString('utf8'),
  ) as FixtureMetadata
  const digest = sha256Bytes(bytes)
  const decoded =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      bytes,
    )
  const corners = [
    3,
    (decoded.width - 1) * 4 + 3,
    (decoded.height - 1)
      * decoded.width * 4 + 3,
    (decoded.height * decoded.width - 1) * 4 + 3,
  ].map((offset) => decoded.rgba[offset])
  if (
    metadata.schemaVersion
      !== 'living-frame-style-depth-fixture-provenance-v1'
    || metadata.artifactId !== fixture.artifactId
    || metadata.generationChannel
      !== 'codex_image_gen_builtin'
    || metadata.normalizedFixture.fileName
      !== fixture.pngFileName
    || metadata.normalizedFixture.contentSha256
      !== fixture.expectedSha256
    || metadata.normalizedFixture.byteLength
      !== fixture.expectedByteLength
    || metadata.normalizedFixture.widthPixels
      !== fixture.expectedWidth
    || metadata.normalizedFixture.heightPixels
      !== fixture.expectedHeight
    || !metadata.normalizedFixture.rgbaPng
    || !metadata.normalizedFixture.transparentCorners
    || digest !== fixture.expectedSha256
    || bytes.byteLength !== fixture.expectedByteLength
    || decoded.width !== fixture.expectedWidth
    || decoded.height !== fixture.expectedHeight
    || corners.some((alpha) => alpha !== 0)
  ) {
    throw new Error(
      `Style-depth fixture ${fixture.artifactId} failed provenance or alpha validation.`,
    )
  }
  return {
    artifactId: fixture.artifactId,
    path,
    bytes,
    sha256: digest,
    byteLength: bytes.byteLength,
    width: decoded.width,
    height: decoded.height,
  }
}

async function buildLayer(input: {
  readonly path: string
  readonly sceneId: string
  readonly layerId: string
  readonly componentId: string
  readonly timeRange: {
    readonly startFrame: number
    readonly endFrameExclusive: number
  }
  readonly visualVerb: LivingFrameVisualVerb
  readonly depthStyle:
    CanonicalLivingFrameMotionSpecDraft['depthStyle']
  readonly depthBand: LivingFrameDepthBand
  readonly parallaxFactor: number
  readonly tracks:
    CanonicalLivingFrameMotionSpecDraft['tracks']
}): Promise<RenderLayer> {
  const outputKey =
    `lf-style-depth-${input.componentId}`
  const inputId = `${outputKey}-input`
  return {
    inputId,
    outputKey,
    path: input.path,
    commitment: await fileCommitment(input.path),
    planning: {
      sceneId: input.sceneId,
      layerId: input.layerId,
      manifestOutputKey: `${outputKey}-manifest`,
      componentOutputKey: outputKey,
      startFrame: input.timeRange.startFrame,
      endFrameExclusive:
        input.timeRange.endFrameExclusive,
      fit: 'fill',
      opacity: 1,
      motionSpec: motionSpec(input),
    },
  }
}

function motionSpec(input: {
  readonly sceneId: string
  readonly componentId: string
  readonly timeRange: {
    readonly startFrame: number
    readonly endFrameExclusive: number
  }
  readonly visualVerb: LivingFrameVisualVerb
  readonly depthStyle:
    CanonicalLivingFrameMotionSpecDraft['depthStyle']
  readonly depthBand: LivingFrameDepthBand
  readonly parallaxFactor: number
  readonly tracks:
    CanonicalLivingFrameMotionSpecDraft['tracks']
}): CanonicalLivingFrameMotionSpec {
  const frameCount =
    input.timeRange.endFrameExclusive
    - input.timeRange.startFrame
  const tracks = input.tracks.map((candidate) => ({
    ...candidate,
    compiledSampleCount: frameCount,
    compiledSampleDigestSha256:
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes: candidate.keyframes,
        sceneFrameCount: frameCount,
      }),
  }))
  const draft: CanonicalLivingFrameMotionSpecDraft = {
    schemaVersion:
      'canonical-living-frame-motion-spec-v2',
    motionProfileId:
      'approved_visual_interval_scalar_keyframe_choreography_v2',
    sceneId: input.sceneId,
    componentId: input.componentId,
    sceneStartFrame:
      input.timeRange.startFrame,
    sceneEndFrameExclusive:
      input.timeRange.endFrameExclusive,
    visualVerb: input.visualVerb,
    importance: 'hero',
    depthStyle: input.depthStyle,
    depthBand: input.depthBand,
    parallaxFactor: input.parallaxFactor,
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        sha256Text(
          `style-depth-selected-scene\n${input.sceneId}`,
        ),
      timingBindingDigestSha256:
        sha256Text([
          input.sceneId,
          input.timeRange.startFrame,
          input.timeRange.endFrameExclusive,
          FPS,
        ].join('\n')),
      deterministicMotionBundleDigestSha256:
        sha256Text(
          `style-depth-motion\n${input.sceneId}\n${input.componentId}`,
        ),
    },
    attentionEventIds: [],
    semanticScaleRequestIds: [],
    tracks,
    metrics: {
      layerTrackCount:
        tracks.filter((candidate) =>
          candidate.target === 'layer').length,
      cameraTrackCount:
        tracks.filter((candidate) =>
          candidate.target === 'virtual_camera').length,
      sourceTrackCount:
        tracks.filter((candidate) =>
          candidate.target === 'source').length,
      keyframeCount:
        tracks.reduce((total, candidate) =>
          total + candidate.keyframes.length, 0),
      compiledSampleCount:
        tracks.length * frameCount,
    },
    authorityBoundary: {
      serverDerivedFromSelectedSceneAndMasterTiming:
        true,
      exactFrameAuthority: false,
      masterTimingMutationAuthority: false,
      soundSyncAuthority: false,
      approvalAuthority: false,
      workGraphAuthority: false,
      rendererCodeAuthority: false,
      providerAuthority: false,
      queueAuthority: false,
      productionAuthority: false,
    },
    exactFramesRemainOwnedByMasterTiming: true,
    captionsRemainAboveLivingFrame: true,
    containsExecutableOrOperationalPayload: false,
    subjectSpecificRouting: false,
  }
  return {
    ...draft,
    motionSpecDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function track(
  suffix: string,
  order: number,
  target:
    CanonicalLivingFrameMotionSpecDraft['tracks'][number]['target'],
  property:
    CanonicalLivingFrameMotionSpecDraft['tracks'][number]['property'],
  role:
    CanonicalLivingFrameMotionSpecDraft['tracks'][number]['role'],
  keyframes: ReadonlyArray<readonly [
    number,
    number,
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['keyframes'][number]['easingToNext'],
  ]>,
): CanonicalLivingFrameMotionSpecDraft['tracks'][number] {
  return {
    trackId: `lf.style-depth.${suffix}`,
    order,
    target,
    property,
    role,
    keyframes: keyframes.map(([
      frameOffset,
      value,
      easingToNext,
    ]) => ({
      frameOffset,
      value,
      easingToNext,
    })),
    compiledSampleCount: SCENE_FRAME_COUNT,
    compiledSampleDigestSha256: '0'.repeat(64),
  }
}

function makeSource(path: string): void {
  runFfmpeg([
    '-f',
    'lavfi',
    '-i',
    `color=c=0x151923:size=${WIDTH}x${HEIGHT}:rate=${FPS}:duration=${DURATION_FRAMES / FPS}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=330:sample_rate=48000:duration=${DURATION_FRAMES / FPS}`,
    '-vf',
    'drawgrid=width=24:height=24:thickness=1:color=0x334155@0.38',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-shortest',
    path,
  ])
}

function makeCaption(path: string): void {
  makeTransparentOverlay(path, [
    'drawbox=x=24:y=307:w=592:h=38:color=0xEF2BC2@1:t=fill:replace=1',
    'drawbox=x=42:y=319:w=228:h=8:color=0xFFF5FC@1:t=fill:replace=1',
  ])
}

function prepareAlphaFixtureOverlay(input: {
  readonly sourcePath: string
  readonly destinationPath: string
  readonly scaleFilter: string
  readonly padX: number
  readonly padY: number
}): void {
  runFfmpeg([
    '-i',
    input.sourcePath,
    '-vf',
    [
      'format=rgba',
      input.scaleFilter,
      `pad=${WIDTH}:${HEIGHT}:${input.padX}:${input.padY}:color=black@0`,
    ].join(','),
    '-frames:v',
    '1',
    '-c:v',
    'png',
    input.destinationPath,
  ])
}

function makeTransparentOverlay(
  path: string,
  filters: readonly string[],
): void {
  runFfmpeg([
    '-f',
    'lavfi',
    '-i',
    `color=c=black@0:size=${WIDTH}x${HEIGHT}:duration=1`,
    '-vf',
    [
      'format=rgba',
      'colorchannelmixer=aa=0',
      ...filters,
    ].join(','),
    '-frames:v',
    '1',
    '-c:v',
    'png',
    path,
  ])
}

function runFfmpeg(args: readonly string[]): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    ...args,
    '-threads',
    '1',
    '-y',
  ], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Style-depth FFmpeg operation failed: ${result.stderr}`,
    )
  }
}

function probeRenderedVideo(path: string): {
  readonly width?: number
  readonly height?: number
  readonly frameRate?: string
  readonly frameCount: number
} {
  const result = spawnSync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,r_frame_rate,nb_frames',
    '-of',
    'json',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Style-depth FFprobe failed: ${result.stderr}`,
    )
  }
  const parsed = JSON.parse(result.stdout) as {
    readonly streams?: ReadonlyArray<{
      readonly width?: number
      readonly height?: number
      readonly r_frame_rate?: string
      readonly nb_frames?: string
    }>
  }
  const stream = parsed.streams?.[0]
  if (!stream) {
    throw new Error(
      'Style-depth output video stream is missing.',
    )
  }
  return {
    width: stream.width,
    height: stream.height,
    frameRate: stream.r_frame_rate,
    frameCount: Number(stream.nb_frames),
  }
}

function extractFrames(
  path: string,
  frameNumbers: readonly number[],
): Buffer[] {
  const selector = frameNumbers
    .map((frameNumber) =>
      `eq(n\\,${frameNumber})`)
    .join('+')
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    path,
    '-vf',
    `select=${selector}`,
    '-fps_mode',
    'vfr',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgb24',
    'pipe:1',
  ], {
    encoding: null,
    maxBuffer:
      WIDTH * HEIGHT * 3
      * (frameNumbers.length + 1),
  })
  if (result.status !== 0) {
    throw new Error(
      `Style-depth frame extraction failed: ${Buffer.from(result.stderr).toString('utf8')}`,
    )
  }
  const bytes = Buffer.from(result.stdout)
  const frameBytes = WIDTH * HEIGHT * 3
  if (
    bytes.byteLength
      !== frameBytes * frameNumbers.length
  ) {
    throw new Error(
      'Style-depth extracted-frame byte length changed.',
    )
  }
  return frameNumbers.map((_, index) =>
    bytes.subarray(
      index * frameBytes,
      (index + 1) * frameBytes,
    ))
}

function extractPngFrame(
  path: string,
  frameNumber: number,
): Buffer {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    path,
    '-vf',
    `select=eq(n\\,${frameNumber})`,
    '-frames:v',
    '1',
    '-c:v',
    'png',
    '-f',
    'image2pipe',
    'pipe:1',
  ], {
    encoding: null,
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Style-depth review-frame extraction failed: ${Buffer.from(result.stderr).toString('utf8')}`,
    )
  }
  const bytes = Buffer.from(result.stdout)
  if (
    bytes.byteLength < 1_024
    || !bytes.subarray(0, 8).equals(
      Buffer.from('89504e470d0a1a0a', 'hex'),
    )
  ) {
    throw new Error(
      'Style-depth review frame PNG is invalid.',
    )
  }
  return bytes
}

const colorMatchers = {
  flatRust(
    red: number,
    green: number,
    blue: number,
  ): boolean {
    return (
      red > 120
      && red < 225
      && green > 45
      && green < 145
      && blue < 115
    )
  },
  flatOchre(
    red: number,
    green: number,
    blue: number,
  ): boolean {
    return (
      red > 150
      && green > 105
      && green < 190
      && blue < 100
    )
  },
  shallowOchre(
    red: number,
    green: number,
    blue: number,
  ): boolean {
    return (
      red > 155
      && green > 100
      && green < 190
      && blue < 115
    )
  },
  shallowRust(
    red: number,
    green: number,
    blue: number,
  ): boolean {
    return (
      red > 100
      && red < 210
      && green > 35
      && green < 120
      && blue < 100
    )
  },
  smoke(
    red: number,
    green: number,
    blue: number,
  ): boolean {
    return (
      red > 75
      && red < 170
      && green > 130
      && green < 210
      && blue > 155
      && blue < 230
      && blue > red + 35
    )
  },
  caption(
    red: number,
    green: number,
    blue: number,
  ): boolean {
    return (
      red > 185
      && green < 90
      && blue > 130
    )
  },
} as const

function colorStats(
  frame: Buffer,
  matches: (
    red: number,
    green: number,
    blue: number,
  ) => boolean,
  region: {
    readonly xStart: number
    readonly xEndExclusive: number
    readonly yStart: number
    readonly yEndExclusive: number
  },
): {
  readonly count: number
  readonly centroidX: number
  readonly centroidY: number
} {
  let count = 0
  let xTotal = 0
  let yTotal = 0
  for (
    let y = region.yStart;
    y < region.yEndExclusive;
    y += 1
  ) {
    for (
      let x = region.xStart;
      x < region.xEndExclusive;
      x += 1
    ) {
      const offset = (y * WIDTH + x) * 3
      if (!matches(
        frame[offset]!,
        frame[offset + 1]!,
        frame[offset + 2]!,
      )) continue
      count += 1
      xTotal += x
      yTotal += y
    }
  }
  return {
    count,
    centroidX: count === 0 ? 0 : xTotal / count,
    centroidY: count === 0 ? 0 : yTotal / count,
  }
}

function distance(
  leftX: number,
  leftY: number,
  rightX: number,
  rightY: number,
): number {
  return Math.sqrt(
    (rightX - leftX) ** 2
    + (rightY - leftY) ** 2,
  )
}

async function fileCommitment(path: string): Promise<{
  readonly byteLength: number
  readonly sha256: string
}> {
  const fileStat = await stat(path)
  const checksum = createHash('sha256')
  let byteLength = 0
  for await (const chunk of createReadStream(path)) {
    const bytes = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk)
    byteLength += bytes.byteLength
    checksum.update(bytes)
  }
  if (byteLength !== fileStat.size) {
    throw new Error(
      'Style-depth file changed during commitment.',
    )
  }
  return {
    byteLength,
    sha256: checksum.digest('hex'),
  }
}

function privateFileInput(
  inputId: string,
  mimeType: 'video/mp4' | 'image/png',
  path: string,
  commitment: {
    readonly byteLength: number
    readonly sha256: string
  },
): OfflineRemotionServerInjectedInput {
  return {
    inputMode: 'private_verified_stream_v1',
    inputId,
    mimeType,
    ...commitment,
    async openStream() {
      return createReadStream(path)
    },
  }
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
