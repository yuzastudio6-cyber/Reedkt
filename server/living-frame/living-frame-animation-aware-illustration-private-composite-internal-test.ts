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
import {
  readPrivateFileIfExistsWithinRoot,
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
  createPrivateOfflineSharpStructuredExecutionRuntime,
} from '../tool-execution/node-runner-execution'
import {
  deriveCanonicalLivingFrameCompiledSampleDigestSha256,
} from './canonical-living-frame-motion'
import {
  executeLivingFrameAnimationAwareIllustrationPrivateAlphaInternalTest,
} from './living-frame-animation-aware-illustration-private-alpha-internal-test'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from './living-frame-environmental-particle-sequence-observation'

const WIDTH = 640
const HEIGHT = 360
const FPS = 30
const DURATION_FRAMES = 120
const SOURCE_TONE_HZ = 330
const SWORD_CUE_HZ = 1_200
const SWORD_CUE_START_FRAME = 38
const SWORD_CUE_END_FRAME_EXCLUSIVE = 68
const ALPHA_STORAGE_ROOT =
  '/tmp/reeditpro-living-frame-animation-aware-illustration-internal-test'
const OUTPUT_STORAGE_ROOT =
  '/tmp/reeditpro-living-frame-animation-aware-composite-internal-test'

export interface LivingFrameAnimationAwareIllustrationPrivateCompositeInternalTestReceipt {
  readonly schemaVersion:
    'living-frame-animation-aware-illustration-private-composite-internal-test-v2'
  readonly evidenceClass:
    'actual_private_internal_animation_aware_illustration_2_5d_composite'
  readonly source: {
    readonly sourceArtifactId:
      'lf.animation-aware-illustration.musashi.v1'
    readonly sourceAlphaSha256: string
    readonly preparedOverlaySha256: string
    readonly preparedOverlayDecodedRgbaSha256: string
    readonly preparedWidthPixels: 640
    readonly preparedHeightPixels: 360
    readonly illustrativeNotArchivalEvidence: true
  }
  readonly alphaQa: {
    readonly reportDigestSha256: string
    readonly findingCodes: readonly string[]
    readonly fixedBackgroundIds:
      readonly ['black', 'white', 'mid_gray', 'saturated_red']
    readonly destinationRasterMeasured: true
    readonly destinationCompositeMeanEdgeContrast: number
    readonly destinationCompositeLowContrastEdgeRatio: number
    readonly blockingFindingCodes: readonly string[]
  }
  readonly decomposition: {
    readonly profile:
      'fixture_specific_character_action_cutout_rig_v2'
    readonly baseComponentSha256: string
    readonly swordArmComponentSha256: string
    readonly hairComponentSha256: string
    readonly robeComponentSha256: string
    readonly swordArmSelectedPixelCount: number
    readonly swordArmReconstructedPixelCount: number
    readonly swordArmTransparentClearedPixelCount: number
    readonly hairSelectedPixelCount: number
    readonly robeSelectedPixelCount: number
    readonly swordArmPivot: readonly [390, 104]
    readonly hairPivot: readonly [444, 58]
    readonly robePivot: readonly [489, 119]
    readonly hiddenAreaReconstructionRequired: true
    readonly hiddenAreaReconstructionMethod:
      'fixture_specific_nearest_opaque_border_fill_v1'
    readonly articulatedComponentMotionRendered: true
    readonly articulatedSwordArmMotionRendered: true
    readonly fixtureSpecificInternalMasking: true
  }
  readonly scene: {
    readonly outputFrameId:
      'frame.landscape.640x360.internal-test'
    readonly outputFrameConfirmedForInternalTest: true
    readonly mode: 'living_still'
    readonly style:
      'modern_cinematic_anime_sumi_e_graphic_novel'
    readonly depthStyle: 'deep_multiplane_2_5d'
    readonly layerOrder:
      readonly [
        'ink_background',
        'character_base',
        'sword_arm',
        'hair',
        'robe',
        'slash_foreground',
      ]
    readonly selectiveMotion:
      readonly [
        'background_parallax',
        'character_anchor_drift',
        'sword_arm_pivot_strike',
        'hair_pivot_motion',
        'robe_pivot_motion',
        'slash_reveal_and_settle',
      ]
    readonly focusHandoffRendered: true
    readonly captionPlaneAboveLivingFrame: true
    readonly remotionFinalCanvasOwner: true
  }
  readonly runtime: {
    readonly actualRemotionEntrypointExecuted: true
    readonly actualFfmpegEntrypointExecuted: true
    readonly actualFfprobeEntrypointExecuted: true
    readonly outputSha256: string
    readonly outputByteLength: number
    readonly outputWidthPixels: 640
    readonly outputHeightPixels: 360
    readonly outputFrameCount: 120
    readonly outputFrameRate: '30/1'
    readonly persistedCreateOnly: true
    readonly persistedArtifactReopened: true
  }
  readonly renderedQa: {
    readonly distinctSampleFrameDigestCount: number
    readonly characterMotionPixelDelta: number
    readonly swordArmRegionPixelDelta: number
    readonly hairRegionPixelDelta: number
    readonly robeRegionPixelDelta: number
    readonly slashCuePixelDelta: number
    readonly captionProtectedPixelCount: number
    readonly sourceToneBefore: number
    readonly sourceToneDuring: number
    readonly swordCueBefore: number
    readonly swordCueDuring: number
    readonly narrationProtectedMixMeasured: true
    readonly reviewFrameIndexes: readonly [35, 58, 82]
    readonly reviewFrameSha256: readonly [string, string, string]
  }
  readonly privateArtifacts: {
    readonly outputObjectIdentityHash: string
    readonly reviewFrameObjectKeys: readonly [string, string, string]
    readonly publicUrlCreated: false
  }
  readonly authorityBoundary: {
    readonly privateInternalExecutionAuthority: true
    readonly canonicalDispatchAuthority: false
    readonly canonicalAssetManifestAuthority: false
    readonly customerBillingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productAuthority: false
    readonly productionAuthority: false
  }
  readonly openGates: readonly [
    'exact_comfyui_generated_output_requires_five_model_weights_and_gpu_execution',
    'canonical_selected_scene_asset_manifest_and_qa_reconciliation_required',
    'temporal_subject_mask_work_graph_discriminator_required_for_advanced_living_a_roll',
    'owner_private_review_decision_required_for_style_and_motion',
  ]
  readonly receiptDigestSha256: string
}

export async function executeLivingFrameAnimationAwareIllustrationPrivateCompositeInternalTest():
Promise<LivingFrameAnimationAwareIllustrationPrivateCompositeInternalTestReceipt> {
  if (arguments.length !== 0) {
    throw new Error(
      'Animation-aware illustration composite internal test accepts no caller input.',
    )
  }
  const alphaReceipt =
    await executeLivingFrameAnimationAwareIllustrationPrivateAlphaInternalTest()
  const alphaPng =
    await readPrivateFileIfExistsWithinRoot({
      rootPath: ALPHA_STORAGE_ROOT,
      relativePath: alphaReceipt.privateArtifacts.alphaObjectKey,
    })
  if (
    !alphaPng
    || sha256Bytes(alphaPng)
      !== alphaReceipt.decontamination.cleanedAlphaPngSha256
    || alphaPng.byteLength
      !== alphaReceipt.decontamination.cleanedAlphaPngByteLength
  ) {
    throw new Error(
      'Private animation-aware illustration alpha artifact changed.',
    )
  }

  const fixtureRoot = await mkdtemp(join(
    tmpdir(),
    'reeditpro-lf-musashi-composite-',
  ))
  const sourceAlphaPath = join(fixtureRoot, 'source-alpha.png')
  const characterPath = join(fixtureRoot, 'character-overlay.png')
  const characterBasePath = join(
    fixtureRoot,
    'character-base-overlay.png',
  )
  const swordArmPath = join(
    fixtureRoot,
    'sword-arm-overlay.png',
  )
  const hairPath = join(fixtureRoot, 'hair-overlay.png')
  const robePath = join(fixtureRoot, 'robe-overlay.png')
  const inkBackgroundPath = join(
    fixtureRoot,
    'ink-background-overlay.png',
  )
  const slashPath = join(fixtureRoot, 'slash-overlay.png')
  const captionPath = join(fixtureRoot, 'caption-overlay.png')
  const sourcePath = join(fixtureRoot, 'source.mp4')
  const swordCuePath = join(fixtureRoot, 'sword-cue.wav')
  const renderedPath = join(fixtureRoot, 'rendered.mp4')

  try {
    await writeFile(sourceAlphaPath, alphaPng, {
      flag: 'wx',
      mode: 0o600,
    })
    scaleCharacterToLandscape(sourceAlphaPath, characterPath)
    const decomposition = await decomposeCharacter({
      sourcePath: characterPath,
      basePath: characterBasePath,
      swordArmPath,
      hairPath,
      robePath,
    })
    makeTransparentOverlay(inkBackgroundPath, [
      'drawbox=x=356:y=22:w=10:h=300:color=0x7F1D1D@0.28:t=fill:replace=1',
      'drawbox=x=382:y=10:w=36:h=330:color=0x991B1B@0.20:t=fill:replace=1',
      'drawbox=x=438:y=28:w=84:h=292:color=0xB91C1C@0.17:t=fill:replace=1',
      'drawbox=x=548:y=44:w=12:h=250:color=0xF59E0B@0.22:t=fill:replace=1',
    ])
    await makeSlash(slashPath)
    await makeCaption(captionPath)
    makeSource(sourcePath)
    makeSwordCue(swordCuePath)

    const characterPng = await readFile(characterPath)
    const character =
      decodeLivingFrameEnvironmentalParticleRgbaPng(
        characterPng,
      )
    if (
      character.width !== WIDTH
      || character.height !== HEIGHT
    ) {
      throw new Error(
        'Prepared animation-aware illustration overlay changed dimensions.',
      )
    }
    const destinationRgb = extractRgbFrame(
      sourcePath,
      52,
    )
    const characterDigest = sha256Bytes(characterPng)
    const alphaReport = measureLivingFrameAlphaArtifact({
      artifactId:
        'lf.animation-aware-illustration.musashi.prepared-overlay.v1',
      artifactDigestSha256: characterDigest,
      frameIndex: 52,
      width: WIDTH,
      height: HEIGHT,
      rgbaBytes: character.rgba,
      alphaMode: 'straight_alpha',
      alphaExpectation: 'alpha_required',
      destinationRgbBytes: destinationRgb,
    })
    const destinationComposite =
      alphaReport.composites.find((candidate) =>
        candidate.backgroundId === 'destination_raster')
    const blockingFindingCodes =
      alphaReport.findingCodes.filter((code) =>
        code !== 'alpha_channel_variation_present')
    if (
      !verifyLivingFrameAlphaMeasurementReportDigest(alphaReport)
      || !destinationComposite
      || destinationComposite.meanEdgeContrast == null
      || destinationComposite.lowContrastEdgeRatio == null
      || blockingFindingCodes.length !== 0
      || alphaReport.composites
        .map((candidate) => candidate.backgroundId)
        .join('|')
        !== 'black|white|mid_gray|saturated_red|destination_raster'
    ) {
      throw new Error(
        `Prepared animation-aware illustration failed destination alpha QA: ${blockingFindingCodes.join(',')}.`,
      )
    }

    const source = await fileCommitment(sourcePath)
    const caption = await fileCommitment(captionPath)
    const swordCue = await fileCommitment(swordCuePath)
    const overlayEntries = await Promise.all([
      overlayCommitment(
        'lf-musashi-ink-background',
        inkBackgroundPath,
      ),
      overlayCommitment(
        'lf-musashi-character-base',
        characterBasePath,
      ),
      overlayCommitment(
        'lf-musashi-sword-arm',
        swordArmPath,
      ),
      overlayCommitment(
        'lf-musashi-hair',
        hairPath,
      ),
      overlayCommitment(
        'lf-musashi-robe',
        robePath,
      ),
      overlayCommitment(
        'lf-musashi-slash-foreground',
        slashPath,
      ),
    ])
    const layers = [
      layer({
        sceneId: 'lf-musashi-living-still-scene',
        layerId: 'lf-musashi-10-ink-background',
        componentOutputKey: 'lf-musashi-ink-background',
        manifestOutputKey:
          'lf-musashi-ink-background-manifest',
        motionSpec: motionSpec({
          componentId: 'lf-musashi-ink-background',
          visualVerb: 'reveal',
          depthBand: 'background',
          parallaxFactor: -0.28,
          tracks: [
            track(
              'ink-camera-drift',
              0,
              'virtual_camera',
              'position_x_normalized',
              'camera',
              [
                [0, -0.02, 'ease_in_out_cubic'],
                [119, 0.05, 'hold'],
              ],
            ),
            track(
              'ink-light',
              1,
              'layer',
              'light_intensity',
              'ambient',
              [
                [0, 0.72, 'ease_in_out_cubic'],
                [60, 1.04, 'settle_out'],
                [119, 0.86, 'hold'],
              ],
            ),
          ],
        }),
      }),
      layer({
        sceneId: 'lf-musashi-living-still-scene',
        layerId: 'lf-musashi-20-character-base',
        componentOutputKey:
          'lf-musashi-character-base',
        manifestOutputKey:
          'lf-musashi-character-base-manifest',
        motionSpec: motionSpec({
          componentId: 'lf-musashi-character-base',
          visualVerb: 'reveal',
          depthBand: 'subject_plane',
          parallaxFactor: 0.1,
          attentionEventIds: [
            'lf-musashi-focus-handoff',
            'lf-musashi-attention-restoration',
          ],
          tracks: [
            track(
              'character-opacity',
              0,
              'layer',
              'opacity',
              'primary',
              [
                [0, 0.08, 'ease_out_quad'],
                [16, 1, 'settle_out'],
                [106, 1, 'ease_in_out_cubic'],
                [119, 0.82, 'hold'],
              ],
            ),
            track(
              'character-drift',
              1,
              'layer',
              'position_x_normalized',
              'secondary',
              [
                [0, 0.06, 'ease_out_quad'],
                [52, 0, 'settle_out'],
                [119, -0.025, 'hold'],
              ],
            ),
            track(
              'source-focus-handoff',
              2,
              'source',
              'blur_pixels',
              'secondary',
              [
                [0, 0, 'ease_in_out_cubic'],
                [34, 3.5, 'settle_out'],
                [82, 3.5, 'ease_in_out_cubic'],
                [114, 0, 'hold'],
                [119, 0, 'hold'],
              ],
            ),
            track(
              'source-deemphasis',
              3,
              'source',
              'light_intensity',
              'secondary',
              [
                [0, 1, 'ease_in_out_cubic'],
                [34, 0.72, 'settle_out'],
                [82, 0.72, 'ease_in_out_cubic'],
                [114, 1, 'hold'],
                [119, 1, 'hold'],
              ],
            ),
          ],
        }),
      }),
      layer({
        sceneId: 'lf-musashi-living-still-scene',
        layerId: 'lf-musashi-23-sword-arm',
        componentOutputKey: 'lf-musashi-sword-arm',
        manifestOutputKey:
          'lf-musashi-sword-arm-manifest',
        motionSpec: motionSpec({
          componentId: 'lf-musashi-sword-arm',
          visualVerb: 'transform',
          depthBand: 'in_front_of_subject',
          parallaxFactor: 0.11,
          tracks: [
            track(
              'sword-arm-opacity',
              0,
              'layer',
              'opacity',
              'primary',
              [
                [0, 0.08, 'ease_out_quad'],
                [16, 1, 'settle_out'],
                [106, 1, 'ease_in_out_cubic'],
                [119, 0.82, 'hold'],
              ],
            ),
            track(
              'sword-arm-pivot-x',
              1,
              'layer',
              'position_x_normalized',
              'secondary',
              [
                [0, 0.169375, 'ease_out_quad'],
                [52, 0.109375, 'settle_out'],
                [119, 0.084375, 'hold'],
              ],
            ),
            track(
              'sword-arm-pivot-y',
              2,
              'layer',
              'position_y_normalized',
              'secondary',
              [
                [0, -0.211111, 'hold'],
                [119, -0.211111, 'hold'],
              ],
            ),
            track(
              'sword-arm-strike',
              3,
              'layer',
              'rotation_degrees',
              'primary',
              [
                [0, 0, 'hold'],
                [30, 0, 'ease_in_out_cubic'],
                [37, 15, 'mechanical_accelerate'],
                [52, -28, 'settle_out'],
                [64, -20, 'settle_out'],
                [82, -6, 'ease_in_out_cubic'],
                [119, 0.4, 'hold'],
              ],
            ),
          ],
        }),
      }),
      layer({
        sceneId: 'lf-musashi-living-still-scene',
        layerId: 'lf-musashi-25-hair',
        componentOutputKey: 'lf-musashi-hair',
        manifestOutputKey:
          'lf-musashi-hair-manifest',
        motionSpec: motionSpec({
          componentId: 'lf-musashi-hair',
          visualVerb: 'transform',
          depthBand: 'in_front_of_subject',
          parallaxFactor: 0.1,
          tracks: [
            track(
              'hair-opacity',
              0,
              'layer',
              'opacity',
              'secondary',
              [
                [0, 0.08, 'ease_out_quad'],
                [16, 1, 'settle_out'],
                [106, 1, 'ease_in_out_cubic'],
                [119, 0.82, 'hold'],
              ],
            ),
            track(
              'hair-pivot-x',
              1,
              'layer',
              'position_x_normalized',
              'secondary',
              [
                [0, 0.25375, 'ease_out_quad'],
                [52, 0.19375, 'settle_out'],
                [119, 0.16875, 'hold'],
              ],
            ),
            track(
              'hair-pivot-y',
              2,
              'layer',
              'position_y_normalized',
              'secondary',
              [
                [0, -0.338889, 'ease_in_out_cubic'],
                [42, -0.347, 'settle_out'],
                [78, -0.333, 'ease_in_out_cubic'],
                [119, -0.338889, 'hold'],
              ],
            ),
            track(
              'hair-rotation',
              3,
              'layer',
              'rotation_degrees',
              'secondary',
              [
                [0, 0, 'ease_in_out_cubic'],
                [42, 3, 'settle_out'],
                [78, -1.5, 'ease_in_out_cubic'],
                [119, 0.3, 'hold'],
              ],
            ),
          ],
        }),
      }),
      layer({
        sceneId: 'lf-musashi-living-still-scene',
        layerId: 'lf-musashi-27-robe',
        componentOutputKey: 'lf-musashi-robe',
        manifestOutputKey:
          'lf-musashi-robe-manifest',
        motionSpec: motionSpec({
          componentId: 'lf-musashi-robe',
          visualVerb: 'transform',
          depthBand: 'in_front_of_subject',
          parallaxFactor: 0.12,
          tracks: [
            track(
              'robe-opacity',
              0,
              'layer',
              'opacity',
              'secondary',
              [
                [0, 0.08, 'ease_out_quad'],
                [16, 1, 'settle_out'],
                [106, 1, 'ease_in_out_cubic'],
                [119, 0.82, 'hold'],
              ],
            ),
            track(
              'robe-pivot-x',
              1,
              'layer',
              'position_x_normalized',
              'secondary',
              [
                [0, 0.324063, 'ease_out_quad'],
                [52, 0.264063, 'settle_out'],
                [119, 0.239063, 'hold'],
              ],
            ),
            track(
              'robe-pivot-y',
              2,
              'layer',
              'position_y_normalized',
              'secondary',
              [
                [0, -0.169444, 'ease_in_out_cubic'],
                [40, -0.164, 'settle_out'],
                [82, -0.177, 'ease_in_out_cubic'],
                [119, -0.169444, 'hold'],
              ],
            ),
            track(
              'robe-rotation',
              3,
              'layer',
              'rotation_degrees',
              'secondary',
              [
                [0, 0, 'ease_in_out_cubic'],
                [40, -2.2, 'settle_out'],
                [82, 2.1, 'ease_in_out_cubic'],
                [119, 0, 'hold'],
              ],
            ),
          ],
        }),
      }),
      layer({
        sceneId: 'lf-musashi-living-still-scene',
        layerId: 'lf-musashi-30-slash-foreground',
        componentOutputKey:
          'lf-musashi-slash-foreground',
        manifestOutputKey:
          'lf-musashi-slash-foreground-manifest',
        motionSpec: motionSpec({
          componentId:
            'lf-musashi-slash-foreground',
          visualVerb: 'reveal',
          depthBand: 'foreground',
          parallaxFactor: 0.38,
          tracks: [
            track(
              'slash-opacity',
              0,
              'layer',
              'opacity',
              'primary',
              [
                [0, 0, 'hold'],
                [37, 0, 'ease_out_quad'],
                [46, 1, 'settle_out'],
                [61, 0.74, 'ease_in_out_cubic'],
                [76, 0, 'hold'],
                [119, 0, 'hold'],
              ],
            ),
            track(
              'slash-scale',
              1,
              'layer',
              'scale_uniform',
              'primary',
              [
                [0, 0.68, 'hold'],
                [37, 0.68, 'ease_out_quad'],
                [52, 1.04, 'settle_out'],
                [76, 1.09, 'hold'],
                [119, 1.09, 'hold'],
              ],
            ),
            track(
              'slash-rotation',
              2,
              'layer',
              'rotation_degrees',
              'secondary',
              [
                [0, -1, 'hold'],
                [37, -1, 'mechanical_accelerate'],
                [52, -4, 'settle_out'],
                [119, -4, 'hold'],
              ],
            ),
          ],
        }),
      }),
    ] as const

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
          panelBackground: '#11131A',
          audioPolicy: 'preserve_source',
          supplementalAudioPolicy:
            'approved_edit_brief_audio_tracks_v1',
          supplementalAudioTracks: [{
            outputKey: 'lf-musashi-sword-cue',
            attachmentId: 'lf-musashi-sword-cue-asset',
            markerId: 'lf-musashi-slash-hit',
            markerType: 'sfx',
            startFrame: SWORD_CUE_START_FRAME,
            endFrameExclusive:
              SWORD_CUE_END_FRAME_EXCLUSIVE,
            fillPolicy: 'trim_without_loop',
            mixProfileId:
              'narration_protected_uploaded_sfx_v1',
          }],
          captionOverlayPolicy:
            'approved_full_frame_rgba',
          livingFrameOverlayPolicy:
            'approved_rgba_over_source_below_captions_v1',
          livingFrameOverlayLayers: layers.map(
            (candidate) => candidate.planning,
          ),
        },
        source: {
          inputId: 'lf-musashi-source',
          mimeType: 'video/mp4',
          ...source,
        },
        captionOverlay: {
          inputId: 'lf-musashi-caption',
          mimeType: 'image/png',
          ...caption,
        },
        livingFrameOverlays: overlayEntries.map(
          (candidate) => ({
            inputId: candidate.inputId,
            outputKey: candidate.outputKey,
            mimeType: 'image/png' as const,
            ...candidate.commitment,
          }),
        ),
        supplementalAudioTracks: [{
          inputId: 'lf-musashi-sword-cue-input',
          outputKey: 'lf-musashi-sword-cue',
          attachmentId: 'lf-musashi-sword-cue-asset',
          markerId: 'lf-musashi-slash-hit',
          markerType: 'sfx',
          startFrame: SWORD_CUE_START_FRAME,
          endFrameExclusive:
            SWORD_CUE_END_FRAME_EXCLUSIVE,
          fillPolicy: 'trim_without_loop',
          mixProfileId:
            'narration_protected_uploaded_sfx_v1',
          mimeType: 'audio/wav',
          ...swordCue,
        }],
      })
    const inputs: OfflineRemotionServerInjectedInput[] = [
      privateFileInput(
        'lf-musashi-source',
        'video/mp4',
        sourcePath,
        source,
      ),
      ...overlayEntries.map((entry) =>
        privateFileInput(
          entry.inputId,
          'image/png',
          entry.path,
          entry.commitment,
        )),
      privateFileInput(
        'lf-musashi-caption',
        'image/png',
        captionPath,
        caption,
      ),
      privateFileInput(
        'lf-musashi-sword-cue-input',
        'audio/wav',
        swordCuePath,
        swordCue,
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
              `lf-musashi-private-composite-v1\n${output.expectedSha256}`,
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
            || reopened.byteLength
              !== output.expectedByteLength
          ) {
            throw new Error(
              'Private Musashi composite artifact changed after persistence.',
            )
          }
          const stream = await reopened.openStream()
          const chunks: Buffer[] = []
          for await (const chunk of stream) {
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
        'attention',
        semantic.approvedLivingFrameCameraOrSourceAttentionApplied,
      ],
      [
        'caption_plane',
        semantic.approvedLivingFrameOverlayBelowCaptionsApplied,
      ],
      [
        'supplemental_audio_timeline',
        semantic.approvedSupplementalAudioTimelineApplied,
      ],
      [
        'speech_safe_mix',
        semantic.approvedSupplementalAudioSpeechSafeMixApplied,
      ],
    ].filter(([, value]) => value !== true)
      .map(([name]) => name)
    if (failedSemanticExpectations.length > 0) {
      throw new Error(
        `Private Musashi composite Remotion evidence is incomplete: ${failedSemanticExpectations.join(',')}.`,
      )
    }

    const probe = probeRenderedVideo(renderedPath)
    if (
      probe.width !== WIDTH
      || probe.height !== HEIGHT
      || probe.frameCount !== DURATION_FRAMES
      || probe.frameRate !== `${FPS}/1`
    ) {
      throw new Error(
        'Private Musashi composite media profile changed.',
      )
    }
    const sampleNumbers = [0, 20, 45, 58, 92, 119] as const
    const frames = extractRawFrames(
      renderedPath,
      sampleNumbers,
    )
    const frameDigests = frames.map(sha256Bytes)
    const distinctSampleFrameDigestCount =
      new Set(frameDigests).size
    const characterMotionPixelDelta =
      pixelDifferenceCount(frames[1]!, frames[4]!, 18)
    const swordArmRegionPixelDelta =
      pixelDifferenceCount(frames[2]!, frames[3]!, 12, {
        xStart: 360,
        xEndExclusive: 620,
        yStart: 35,
        yEndExclusive: 175,
      })
    const hairRegionPixelDelta =
      pixelDifferenceCount(frames[1]!, frames[4]!, 12, {
        xStart: 390,
        xEndExclusive: 520,
        yStart: 0,
        yEndExclusive: 110,
      })
    const robeRegionPixelDelta =
      pixelDifferenceCount(frames[1]!, frames[4]!, 12, {
        xStart: 465,
        xEndExclusive: 565,
        yStart: 88,
        yEndExclusive: 190,
      })
    const slashCuePixelDelta =
      pixelDifferenceCount(frames[1]!, frames[3]!, 42, {
        xStart: 210,
        xEndExclusive: 630,
        yStart: 72,
        yEndExclusive: 210,
      })
    const captionProtectedPixelCount =
      lightPixelCount(frames[3]!, {
        xStart: 20,
        xEndExclusive: 325,
        yStart: 280,
        yEndExclusive: 352,
      })
    if (
      distinctSampleFrameDigestCount < 5
      || characterMotionPixelDelta < 8_000
      || swordArmRegionPixelDelta < 1_000
      || hairRegionPixelDelta < 400
      || robeRegionPixelDelta < 400
      || slashCuePixelDelta < 2_500
      || captionProtectedPixelCount < 800
    ) {
      throw new Error(
        `Private Musashi rendered-frame QA failed: distinct=${distinctSampleFrameDigestCount}, characterDelta=${characterMotionPixelDelta}, swordArmDelta=${swordArmRegionPixelDelta}, hairDelta=${hairRegionPixelDelta}, robeDelta=${robeRegionPixelDelta}, slashDelta=${slashCuePixelDelta}, caption=${captionProtectedPixelCount}.`,
      )
    }

    const decodedAudio =
      extractMonoPcm(renderedPath, 48_000)
    const beforeCueWindow = pcmWindow(
      decodedAudio,
      48_000,
      0.5,
      0.75,
    )
    const duringCueWindow = pcmWindow(
      decodedAudio,
      48_000,
      1.5,
      1.75,
    )
    const sourceToneBefore = toneMagnitude(
      beforeCueWindow,
      SOURCE_TONE_HZ,
      48_000,
    )
    const sourceToneDuring = toneMagnitude(
      duringCueWindow,
      SOURCE_TONE_HZ,
      48_000,
    )
    const swordCueBefore = toneMagnitude(
      beforeCueWindow,
      SWORD_CUE_HZ,
      48_000,
    )
    const swordCueDuring = toneMagnitude(
      duringCueWindow,
      SWORD_CUE_HZ,
      48_000,
    )
    if (
      swordCueDuring <= swordCueBefore * 8
      || sourceToneDuring <= swordCueDuring * 2.5
      || sourceToneDuring <= sourceToneBefore * 0.65
    ) {
      throw new Error(
        `Private Musashi narration-protected sound QA failed: sourceBefore=${sourceToneBefore}, sourceDuring=${sourceToneDuring}, cueBefore=${swordCueBefore}, cueDuring=${swordCueDuring}.`,
      )
    }

    const reviewFrameIndexes = [35, 58, 82] as const
    const reviewFramePngs = reviewFrameIndexes.map((frame) =>
      extractPngFrame(renderedPath, frame))
    const reviewFrameSha256 = reviewFramePngs.map(
      sha256Bytes,
    ) as [string, string, string]
    const reviewFrameObjectKeys =
      reviewFramePngs.map((_, index) => {
        const digest = reviewFrameSha256[index]!
        return `review-frames/${digest.slice(0, 2)}/${digest}.png`
      }) as [string, string, string]
    for (let index = 0; index < reviewFramePngs.length; index += 1) {
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: OUTPUT_STORAGE_ROOT,
        relativePath: reviewFrameObjectKeys[index]!,
        content: reviewFramePngs[index]!,
      })
    }

    const draft:
      Omit<
        LivingFrameAnimationAwareIllustrationPrivateCompositeInternalTestReceipt,
        'receiptDigestSha256'
      > = {
      schemaVersion:
        'living-frame-animation-aware-illustration-private-composite-internal-test-v2',
      evidenceClass:
        'actual_private_internal_animation_aware_illustration_2_5d_composite',
      source: {
        sourceArtifactId:
          'lf.animation-aware-illustration.musashi.v1',
        sourceAlphaSha256:
          alphaReceipt.decontamination.cleanedAlphaPngSha256,
        preparedOverlaySha256: characterDigest,
        preparedOverlayDecodedRgbaSha256:
          sha256Bytes(character.rgba),
        preparedWidthPixels: WIDTH,
        preparedHeightPixels: HEIGHT,
        illustrativeNotArchivalEvidence: true,
      },
      alphaQa: {
        reportDigestSha256: alphaReport.reportDigestSha256,
        findingCodes: [...alphaReport.findingCodes],
        fixedBackgroundIds: [
          'black',
          'white',
          'mid_gray',
          'saturated_red',
        ],
        destinationRasterMeasured: true,
        destinationCompositeMeanEdgeContrast:
          destinationComposite.meanEdgeContrast,
        destinationCompositeLowContrastEdgeRatio:
          destinationComposite.lowContrastEdgeRatio,
        blockingFindingCodes,
      },
      decomposition: {
        profile:
          'fixture_specific_character_action_cutout_rig_v2',
        baseComponentSha256:
          decomposition.baseComponentSha256,
        swordArmComponentSha256:
          decomposition.swordArmComponentSha256,
        hairComponentSha256:
          decomposition.hairComponentSha256,
        robeComponentSha256:
          decomposition.robeComponentSha256,
        swordArmSelectedPixelCount:
          decomposition.swordArmSelectedPixelCount,
        swordArmReconstructedPixelCount:
          decomposition.swordArmReconstructedPixelCount,
        swordArmTransparentClearedPixelCount:
          decomposition.swordArmTransparentClearedPixelCount,
        hairSelectedPixelCount:
          decomposition.hairSelectedPixelCount,
        robeSelectedPixelCount:
          decomposition.robeSelectedPixelCount,
        swordArmPivot: [390, 104],
        hairPivot: [444, 58],
        robePivot: [489, 119],
        hiddenAreaReconstructionRequired: true,
        hiddenAreaReconstructionMethod:
          'fixture_specific_nearest_opaque_border_fill_v1',
        articulatedComponentMotionRendered: true,
        articulatedSwordArmMotionRendered: true,
        fixtureSpecificInternalMasking: true,
      },
      scene: {
        outputFrameId:
          'frame.landscape.640x360.internal-test',
        outputFrameConfirmedForInternalTest: true,
        mode: 'living_still',
        style:
          'modern_cinematic_anime_sumi_e_graphic_novel',
        depthStyle: 'deep_multiplane_2_5d',
        layerOrder: [
          'ink_background',
          'character_base',
          'sword_arm',
          'hair',
          'robe',
          'slash_foreground',
        ],
        selectiveMotion: [
          'background_parallax',
          'character_anchor_drift',
          'sword_arm_pivot_strike',
          'hair_pivot_motion',
          'robe_pivot_motion',
          'slash_reveal_and_settle',
        ],
        focusHandoffRendered: true,
        captionPlaneAboveLivingFrame: true,
        remotionFinalCanvasOwner: true,
      },
      runtime: {
        actualRemotionEntrypointExecuted: true,
        actualFfmpegEntrypointExecuted: true,
        actualFfprobeEntrypointExecuted: true,
        outputSha256: result.artifact.sha256,
        outputByteLength: result.artifact.byteLength,
        outputWidthPixels: WIDTH,
        outputHeightPixels: HEIGHT,
        outputFrameCount: DURATION_FRAMES,
        outputFrameRate: '30/1',
        persistedCreateOnly: true,
        persistedArtifactReopened: true,
      },
      renderedQa: {
        distinctSampleFrameDigestCount,
        characterMotionPixelDelta,
        swordArmRegionPixelDelta,
        hairRegionPixelDelta,
        robeRegionPixelDelta,
        slashCuePixelDelta,
        captionProtectedPixelCount,
        sourceToneBefore,
        sourceToneDuring,
        swordCueBefore,
        swordCueDuring,
        narrationProtectedMixMeasured: true,
        reviewFrameIndexes,
        reviewFrameSha256,
      },
      privateArtifacts: {
        outputObjectIdentityHash,
        reviewFrameObjectKeys,
        publicUrlCreated: false,
      },
      authorityBoundary: {
        privateInternalExecutionAuthority: true,
        canonicalDispatchAuthority: false,
        canonicalAssetManifestAuthority: false,
        customerBillingAuthority: false,
        publicDeliveryAuthority: false,
        productAuthority: false,
        productionAuthority: false,
      },
      openGates: [
        'exact_comfyui_generated_output_requires_five_model_weights_and_gpu_execution',
        'canonical_selected_scene_asset_manifest_and_qa_reconciliation_required',
        'temporal_subject_mask_work_graph_discriminator_required_for_advanced_living_a_roll',
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

function motionSpec(input: {
  readonly componentId: string
  readonly visualVerb:
    CanonicalLivingFrameMotionSpecDraft['visualVerb']
  readonly depthBand:
    CanonicalLivingFrameMotionSpecDraft['depthBand']
  readonly parallaxFactor: number
  readonly tracks:
    CanonicalLivingFrameMotionSpecDraft['tracks']
  readonly attentionEventIds?: readonly string[]
  readonly semanticScaleRequestIds?: readonly string[]
}): CanonicalLivingFrameMotionSpec {
  const tracks = input.tracks.map((candidate) => ({
    ...candidate,
    compiledSampleCount: DURATION_FRAMES,
    compiledSampleDigestSha256:
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes: candidate.keyframes,
        sceneFrameCount: DURATION_FRAMES,
      }),
  }))
  const draft: CanonicalLivingFrameMotionSpecDraft = {
    schemaVersion:
      'canonical-living-frame-motion-spec-v2',
    motionProfileId:
      'approved_visual_interval_scalar_keyframe_choreography_v2',
    sceneId: 'lf-musashi-living-still-scene',
    componentId: input.componentId,
    sceneStartFrame: 0,
    sceneEndFrameExclusive: DURATION_FRAMES,
    visualVerb: input.visualVerb,
    importance: 'hero',
    depthStyle: 'deep_multiplane',
    depthBand: input.depthBand,
    parallaxFactor: input.parallaxFactor,
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        sha256Text('lf-musashi-selected-scene'),
      timingBindingDigestSha256:
        sha256Text(
          `lf-musashi-master-timing\n0\n${DURATION_FRAMES}\n${FPS}`,
        ),
      deterministicMotionBundleDigestSha256:
        sha256Text(
          `lf-musashi-motion\n${input.componentId}`,
        ),
    },
    attentionEventIds:
      input.attentionEventIds ?? [],
    semanticScaleRequestIds:
      input.semanticScaleRequestIds ?? [],
    tracks,
    metrics: {
      layerTrackCount: tracks.filter((candidate) =>
        candidate.target === 'layer').length,
      cameraTrackCount: tracks.filter((candidate) =>
        candidate.target === 'virtual_camera').length,
      sourceTrackCount: tracks.filter((candidate) =>
        candidate.target === 'source').length,
      keyframeCount: tracks.reduce(
        (total, candidate) =>
          total + candidate.keyframes.length,
        0,
      ),
      compiledSampleCount:
        tracks.length * DURATION_FRAMES,
    },
    authorityBoundary: {
      serverDerivedFromSelectedSceneAndMasterTiming: true,
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
    trackId: `lf.musashi.${suffix}`,
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
    compiledSampleCount: DURATION_FRAMES,
    compiledSampleDigestSha256: '0'.repeat(64),
  }
}

function layer(input: {
  readonly sceneId: string
  readonly layerId: string
  readonly componentOutputKey: string
  readonly manifestOutputKey: string
  readonly motionSpec: CanonicalLivingFrameMotionSpec
}) {
  return {
    planning: {
      sceneId: input.sceneId,
      layerId: input.layerId,
      manifestOutputKey: input.manifestOutputKey,
      componentOutputKey: input.componentOutputKey,
      startFrame: 0,
      endFrameExclusive: DURATION_FRAMES,
      fit: 'fill' as const,
      opacity: 1 as const,
      motionSpec: input.motionSpec,
    },
  }
}

async function overlayCommitment(
  outputKey: string,
  path: string,
) {
  return {
    inputId: `lf-musashi-${outputKey}`,
    outputKey,
    path,
    commitment: await fileCommitment(path),
  }
}

function scaleCharacterToLandscape(
  sourcePath: string,
  outputPath: string,
): void {
  runFfmpeg([
    '-i',
    sourcePath,
    '-vf',
    'format=rgba,scale=360:360:flags=lanczos,pad=640:360:280:0:color=black@0',
    '-frames:v',
    '1',
    '-c:v',
    'png',
    outputPath,
  ])
}

async function decomposeCharacter(input: {
  readonly sourcePath: string
  readonly basePath: string
  readonly swordArmPath: string
  readonly hairPath: string
  readonly robePath: string
}): Promise<{
  readonly baseComponentSha256: string
  readonly swordArmComponentSha256: string
  readonly hairComponentSha256: string
  readonly robeComponentSha256: string
  readonly swordArmSelectedPixelCount: number
  readonly swordArmReconstructedPixelCount: number
  readonly swordArmTransparentClearedPixelCount: number
  readonly hairSelectedPixelCount: number
  readonly robeSelectedPixelCount: number
}> {
  const sourcePng = await readFile(input.sourcePath)
  const source =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      sourcePng,
    )
  if (
    source.width !== WIDTH
    || source.height !== HEIGHT
    || source.rgba.byteLength !== WIDTH * HEIGHT * 4
  ) {
    throw new Error(
      'Fixture-specific character decomposition source changed.',
    )
  }

  const hairPolygon = [
    [426, 18],
    [481, 16],
    [491, 54],
    [468, 75],
    [445, 64],
    [439, 52],
    [423, 45],
  ] as const
  const robePolygon = [
    [484, 105],
    [514, 103],
    [544, 120],
    [539, 150],
    [517, 143],
    [496, 134],
    [480, 120],
  ] as const
  const swordArmPolygon = [
    [379, 92],
    [389, 83],
    [405, 77],
    [423, 82],
    [438, 87],
    [441, 98],
    [422, 108],
    [409, 117],
    [392, 119],
    [380, 108],
  ] as const
  const swordBladePolygon = [
    [432, 79],
    [584, 42],
    [592, 55],
    [438, 106],
  ] as const
  const swordArmPivot = [390, 104] as const
  const hairPivot = [444, 58] as const
  const robePivot = [489, 119] as const
  const baseRgba = Buffer.from(source.rgba)
  const swordArmRgba =
    Buffer.alloc(source.rgba.byteLength)
  const hairRgba = Buffer.alloc(source.rgba.byteLength)
  const robeRgba = Buffer.alloc(source.rgba.byteLength)
  let swordArmSelectedPixelCount = 0
  let swordArmReconstructedPixelCount = 0
  let swordArmTransparentClearedPixelCount = 0
  let hairSelectedPixelCount = 0
  let robeSelectedPixelCount = 0

  const isInsideComponentMask = (
    x: number,
    y: number,
  ): boolean =>
    pointInPolygon(x + 0.5, y + 0.5, hairPolygon)
    || pointInPolygon(x + 0.5, y + 0.5, robePolygon)
    || pointInPolygon(
      x + 0.5,
      y + 0.5,
      swordArmPolygon,
    )
    || pointInPolygon(
      x + 0.5,
      y + 0.5,
      swordBladePolygon,
    )

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const sourceOffset = (y * WIDTH + x) * 4
      if (source.rgba[sourceOffset + 3] === 0) {
        continue
      }
      const inHair = pointInPolygon(
        x + 0.5,
        y + 0.5,
        hairPolygon,
      )
      const inRobe = pointInPolygon(
        x + 0.5,
        y + 0.5,
        robePolygon,
      )
      const inSwordArm =
        pointInPolygon(
          x + 0.5,
          y + 0.5,
          swordArmPolygon,
        )
        || pointInPolygon(
          x + 0.5,
          y + 0.5,
          swordBladePolygon,
        )
      if (
        Number(inHair)
        + Number(inRobe)
        + Number(inSwordArm)
        > 1
      ) {
        throw new Error(
          'Fixture-specific character component masks overlap.',
        )
      }
      if (inSwordArm) {
        copyPivotCenteredPixel({
          source: source.rgba,
          sourceOffset,
          destination: swordArmRgba,
          sourceX: x,
          sourceY: y,
          pivot: swordArmPivot,
        })
        swordArmSelectedPixelCount += 1
        if (x >= 435) {
          clearRgbaPixel(baseRgba, sourceOffset)
          swordArmTransparentClearedPixelCount += 1
          continue
        }
        const replacementOffset =
          findNearestOpaqueOutsideFixtureMasks({
            source: source.rgba,
            sourceX: x,
            sourceY: y,
            maximumRadiusPixels: 18,
            isExcluded: isInsideComponentMask,
          })
        if (replacementOffset == null) {
          clearRgbaPixel(baseRgba, sourceOffset)
          swordArmTransparentClearedPixelCount += 1
        } else {
          baseRgba.set(
            source.rgba.subarray(
              replacementOffset,
              replacementOffset + 4,
            ),
            sourceOffset,
          )
          swordArmReconstructedPixelCount += 1
        }
      } else if (inHair) {
        copyPivotCenteredPixel({
          source: source.rgba,
          sourceOffset,
          destination: hairRgba,
          sourceX: x,
          sourceY: y,
          pivot: hairPivot,
        })
        clearRgbaPixel(baseRgba, sourceOffset)
        hairSelectedPixelCount += 1
      } else if (inRobe) {
        copyPivotCenteredPixel({
          source: source.rgba,
          sourceOffset,
          destination: robeRgba,
          sourceX: x,
          sourceY: y,
          pivot: robePivot,
        })
        clearRgbaPixel(baseRgba, sourceOffset)
        robeSelectedPixelCount += 1
      }
    }
  }
  if (
    swordArmSelectedPixelCount < 3_000
    || swordArmReconstructedPixelCount < 1_000
    || swordArmTransparentClearedPixelCount < 1_000
    || hairSelectedPixelCount < 350
    || robeSelectedPixelCount < 350
  ) {
    throw new Error(
      `Fixture-specific character decomposition selected too little artwork: swordArm=${swordArmSelectedPixelCount}, reconstructed=${swordArmReconstructedPixelCount}, transparent=${swordArmTransparentClearedPixelCount}, hair=${hairSelectedPixelCount}, robe=${robeSelectedPixelCount}.`,
    )
  }

  encodeRgbaPng(baseRgba, input.basePath)
  encodeRgbaPng(swordArmRgba, input.swordArmPath)
  encodeRgbaPng(hairRgba, input.hairPath)
  encodeRgbaPng(robeRgba, input.robePath)
  const [
    basePng,
    swordArmPng,
    hairPng,
    robePng,
  ] = await Promise.all([
    readFile(input.basePath),
    readFile(input.swordArmPath),
    readFile(input.hairPath),
    readFile(input.robePath),
  ])
  for (const [name, png] of [
    ['base', basePng],
    ['sword-arm', swordArmPng],
    ['hair', hairPng],
    ['robe', robePng],
  ] as const) {
    const decoded =
      decodeLivingFrameEnvironmentalParticleRgbaPng(png)
    if (
      decoded.width !== WIDTH
      || decoded.height !== HEIGHT
      || decoded.rgba.byteLength !== WIDTH * HEIGHT * 4
    ) {
      throw new Error(
        `Fixture-specific ${name} component failed PNG revalidation.`,
      )
    }
  }
  return {
    baseComponentSha256: sha256Bytes(basePng),
    swordArmComponentSha256:
      sha256Bytes(swordArmPng),
    hairComponentSha256: sha256Bytes(hairPng),
    robeComponentSha256: sha256Bytes(robePng),
    swordArmSelectedPixelCount,
    swordArmReconstructedPixelCount,
    swordArmTransparentClearedPixelCount,
    hairSelectedPixelCount,
    robeSelectedPixelCount,
  }
}

function findNearestOpaqueOutsideFixtureMasks(input: {
  readonly source: Uint8Array
  readonly sourceX: number
  readonly sourceY: number
  readonly maximumRadiusPixels: number
  readonly isExcluded: (x: number, y: number) => boolean
}): number | undefined {
  let selectedOffset: number | undefined
  let selectedDistanceSquared = Number.POSITIVE_INFINITY
  for (
    let radius = 1;
    radius <= input.maximumRadiusPixels;
    radius += 1
  ) {
    let foundAtRadius = false
    const yStart = Math.max(0, input.sourceY - radius)
    const yEnd = Math.min(
      HEIGHT - 1,
      input.sourceY + radius,
    )
    const xStart = Math.max(0, input.sourceX - radius)
    const xEnd = Math.min(
      WIDTH - 1,
      input.sourceX + radius,
    )
    for (let candidateY = yStart; candidateY <= yEnd; candidateY += 1) {
      for (let candidateX = xStart; candidateX <= xEnd; candidateX += 1) {
        if (
          Math.max(
            Math.abs(candidateX - input.sourceX),
            Math.abs(candidateY - input.sourceY),
          ) !== radius
          || input.isExcluded(candidateX, candidateY)
        ) {
          continue
        }
        const candidateOffset =
          (candidateY * WIDTH + candidateX) * 4
        if (input.source[candidateOffset + 3] === 0) {
          continue
        }
        const distanceSquared =
          (candidateX - input.sourceX) ** 2
          + (candidateY - input.sourceY) ** 2
        if (distanceSquared < selectedDistanceSquared) {
          selectedDistanceSquared = distanceSquared
          selectedOffset = candidateOffset
          foundAtRadius = true
        }
      }
    }
    if (foundAtRadius) {
      break
    }
  }
  return selectedOffset
}

function pointInPolygon(
  x: number,
  y: number,
  polygon: ReadonlyArray<readonly [number, number]>,
): boolean {
  let inside = false
  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current, current += 1
  ) {
    const [currentX, currentY] = polygon[current]!
    const [previousX, previousY] = polygon[previous]!
    const crossesScanline =
      (currentY > y) !== (previousY > y)
    if (
      crossesScanline
      && x < (
        (previousX - currentX)
        * (y - currentY)
        / (previousY - currentY)
        + currentX
      )
    ) {
      inside = !inside
    }
  }
  return inside
}

function copyPivotCenteredPixel(input: {
  readonly source: Uint8Array
  readonly sourceOffset: number
  readonly destination: Buffer
  readonly sourceX: number
  readonly sourceY: number
  readonly pivot: readonly [number, number]
}): void {
  const destinationX =
    input.sourceX - input.pivot[0] + WIDTH / 2
  const destinationY =
    input.sourceY - input.pivot[1] + HEIGHT / 2
  if (
    destinationX < 0
    || destinationX >= WIDTH
    || destinationY < 0
    || destinationY >= HEIGHT
  ) {
    throw new Error(
      'Fixture-specific pivot-centered component left its canvas.',
    )
  }
  const destinationOffset =
    (destinationY * WIDTH + destinationX) * 4
  input.destination.set(
    input.source.subarray(
      input.sourceOffset,
      input.sourceOffset + 4,
    ),
    destinationOffset,
  )
}

function clearRgbaPixel(
  rgba: Buffer,
  offset: number,
): void {
  rgba[offset] = 0
  rgba[offset + 1] = 0
  rgba[offset + 2] = 0
  rgba[offset + 3] = 0
}

function encodeRgbaPng(
  rgba: Uint8Array,
  outputPath: string,
): void {
  if (rgba.byteLength !== WIDTH * HEIGHT * 4) {
    throw new Error(
      'Fixture-specific component RGBA length changed.',
    )
  }
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgba',
    '-s',
    `${WIDTH}x${HEIGHT}`,
    '-i',
    'pipe:0',
    '-frames:v',
    '1',
    '-c:v',
    'png',
    '-threads',
    '1',
    '-y',
    outputPath,
  ], {
    input: Buffer.from(rgba),
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Fixture-specific component PNG encoding failed: ${result.stderr}`,
    )
  }
}

function makeSource(path: string): void {
  runFfmpeg([
    '-f',
    'lavfi',
    '-i',
    `color=c=0x11131A:size=${WIDTH}x${HEIGHT}:rate=${FPS}:duration=${DURATION_FRAMES / FPS}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${SOURCE_TONE_HZ}:sample_rate=48000:duration=${DURATION_FRAMES / FPS}`,
    '-vf',
    [
      'drawgrid=width=32:height=32:thickness=1:color=0x64748B@0.12',
      'drawbox=x=350:y=0:w=290:h=360:color=0x2B1217@0.42:t=fill',
      'drawbox=x=0:y=280:w=640:h=80:color=0x090B10@0.62:t=fill',
    ].join(','),
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

function makeSwordCue(path: string): void {
  runFfmpeg([
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${SWORD_CUE_HZ}:sample_rate=48000:duration=1`,
    '-af',
    'volume=0.11,afade=t=out:st=0.16:d=0.84',
    '-ac',
    '2',
    '-c:a',
    'pcm_s16le',
    path,
  ])
}

async function makeCaption(path: string): Promise<void> {
  await renderSvgOverlay(
    path,
    [
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
      '<rect x="24" y="282" width="306" height="62" rx="3" fill="#090B10" fill-opacity="0.86"/>',
      '<rect x="24" y="282" width="5" height="62" fill="#F97316"/>',
      '<text x="42" y="312" font-family="DejaVu Sans, sans-serif" font-size="20" font-weight="700" fill="#FFF7ED">A SINGLE DECISIVE STRIKE</text>',
      '<text x="42" y="332" font-family="DejaVu Sans, sans-serif" font-size="11" fill="#CBD5E1">Illustrative sequence · Miyamoto Musashi</text>',
      '</svg>',
    ].join(''),
  )
}

async function makeSlash(path: string): Promise<void> {
  await renderSvgOverlay(
    path,
    [
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
      '<path d="M444 108 Q530 61 635 42" fill="none" stroke="#FFF7ED" stroke-opacity="0.94" stroke-width="6" stroke-linecap="round"/>',
      '<path d="M450 116 Q535 71 630 55" fill="none" stroke="#F97316" stroke-opacity="0.86" stroke-width="3" stroke-linecap="round"/>',
      '<rect x="535" y="70" width="9" height="9" rx="2" fill="#FED7AA" fill-opacity="0.90" transform="rotate(18 539 74)"/>',
      '<rect x="578" y="92" width="6" height="6" rx="1" fill="#FB923C" fill-opacity="0.82" transform="rotate(31 581 95)"/>',
      '</svg>',
    ].join(''),
  )
}

async function renderSvgOverlay(
  path: string,
  svgText: string,
): Promise<void> {
  const svg = Buffer.from(svgText, 'utf8')
  const runtime =
    await createPrivateOfflineSharpStructuredExecutionRuntime()
  const result = await runtime.execute({
    toolId: 'sharp',
    operationId:
      'tool.sharp.prepare_approved_image_asset.v1',
    payload: {
      imageRecipeId: 'approved_overlay_asset_v1',
      outputFormat: 'png',
      outputWidth: WIDTH,
      outputHeight: HEIGHT,
      preserveMetadata: false,
      allowUpscale: false,
      sourceMimeType: 'image/svg+xml',
      sourceByteLength: svg.byteLength,
      sourceSha256: sha256Bytes(svg),
      sourceBytesBase64: svg.toString('base64'),
    },
  })
  if (
    result.evidence.packageName !== 'sharp'
    || result.evidence.packageVersion !== '0.35.3'
    || result.evidence.semanticEvidence
      .actualSharpOperationCompleted !== true
    || result.evidence.semanticEvidence.outputWidth !== WIDTH
    || result.evidence.semanticEvidence.outputHeight !== HEIGHT
  ) {
    throw new Error(
      'Private Musashi caption overlay preparation failed.',
    )
  }
  await writeFile(
    path,
    result.imageArtifact.bytes,
    { flag: 'wx', mode: 0o600 },
  )
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
      `Private Musashi FFmpeg preparation failed: ${result.stderr}`,
    )
  }
}

function extractRgbFrame(
  path: string,
  frameNumber: number,
): Uint8Array {
  return extractRawFrames(path, [frameNumber])[0]!
}

function extractRawFrames(
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
      WIDTH * HEIGHT * 3 *
      (frameNumbers.length + 1),
  })
  if (result.status !== 0) {
    throw new Error(
      `Private Musashi frame extraction failed: ${Buffer.from(result.stderr).toString('utf8')}`,
    )
  }
  const bytes = Buffer.from(result.stdout)
  const frameBytes = WIDTH * HEIGHT * 3
  if (bytes.byteLength !== frameBytes * frameNumbers.length) {
    throw new Error(
      'Private Musashi extracted frame byte length changed.',
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
      `Private Musashi review frame extraction failed: ${Buffer.from(result.stderr).toString('utf8')}`,
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
      'Private Musashi review frame PNG is invalid.',
    )
  }
  return bytes
}

function probeRenderedVideo(path: string) {
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
      `Private Musashi FFprobe failed: ${result.stderr}`,
    )
  }
  const parsed = JSON.parse(result.stdout) as {
    streams?: Array<{
      width?: number
      height?: number
      r_frame_rate?: string
      nb_frames?: string
    }>
  }
  const stream = parsed.streams?.[0]
  if (!stream) {
    throw new Error('Private Musashi output video stream is missing.')
  }
  return {
    width: stream.width,
    height: stream.height,
    frameRate: stream.r_frame_rate,
    frameCount: Number(stream.nb_frames),
  }
}

function extractMonoPcm(
  path: string,
  sampleRate: number,
): Buffer {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    path,
    '-vn',
    '-ac',
    '1',
    '-ar',
    String(sampleRate),
    '-f',
    's16le',
    'pipe:1',
  ], {
    encoding: null,
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Private Musashi audio extraction failed: ${Buffer.from(result.stderr).toString('utf8')}`,
    )
  }
  return Buffer.from(result.stdout)
}

function toneMagnitude(
  pcmS16le: Buffer,
  frequency: number,
  sampleRate: number,
): number {
  const sampleCount = pcmS16le.byteLength / 2
  const normalizedFrequency =
    (2 * Math.PI * frequency) / sampleRate
  let real = 0
  let imaginary = 0
  for (let index = 0; index < sampleCount; index += 1) {
    const sample =
      pcmS16le.readInt16LE(index * 2) / 32768
    real += sample * Math.cos(
      normalizedFrequency * index,
    )
    imaginary -= sample * Math.sin(
      normalizedFrequency * index,
    )
  }
  return Math.sqrt(real * real + imaginary * imaginary)
    / sampleCount
}

function pcmWindow(
  pcmS16le: Buffer,
  sampleRate: number,
  startSeconds: number,
  endSeconds: number,
): Buffer {
  const startSample = Math.round(startSeconds * sampleRate)
  const endSample = Math.round(endSeconds * sampleRate)
  if (
    startSample < 0
    || endSample <= startSample
    || endSample * 2 > pcmS16le.byteLength
  ) {
    throw new Error(
      'Private Musashi PCM review window is invalid.',
    )
  }
  return pcmS16le.subarray(
    startSample * 2,
    endSample * 2,
  )
}

function pixelDifferenceCount(
  left: Buffer,
  right: Buffer,
  threshold: number,
  region: {
    readonly xStart: number
    readonly xEndExclusive: number
    readonly yStart: number
    readonly yEndExclusive: number
  } = {
    xStart: 0,
    xEndExclusive: WIDTH,
    yStart: 0,
    yEndExclusive: HEIGHT,
  },
): number {
  let count = 0
  for (let y = region.yStart; y < region.yEndExclusive; y += 1) {
    for (let x = region.xStart; x < region.xEndExclusive; x += 1) {
      const offset = (y * WIDTH + x) * 3
      const distance =
        Math.abs(left[offset]! - right[offset]!)
        + Math.abs(left[offset + 1]! - right[offset + 1]!)
        + Math.abs(left[offset + 2]! - right[offset + 2]!)
      if (distance >= threshold) count += 1
    }
  }
  return count
}

function lightPixelCount(
  frame: Buffer,
  region: {
    readonly xStart: number
    readonly xEndExclusive: number
    readonly yStart: number
    readonly yEndExclusive: number
  },
): number {
  let count = 0
  for (let y = region.yStart; y < region.yEndExclusive; y += 1) {
    for (let x = region.xStart; x < region.xEndExclusive; x += 1) {
      const offset = (y * WIDTH + x) * 3
      if (
        frame[offset]! > 185
        && frame[offset + 1]! > 175
        && frame[offset + 2]! > 165
      ) count += 1
    }
  }
  return count
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
      'Private Musashi file commitment changed during read.',
    )
  }
  return {
    byteLength,
    sha256: checksum.digest('hex'),
  }
}

function privateFileInput(
  inputId: string,
  mimeType:
    | 'video/mp4'
    | 'image/png'
    | 'audio/wav',
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

function sha256Text(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}
