import assert from 'node:assert/strict'
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
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  deriveCanonicalLivingFrameCompiledSampleDigestSha256,
} from '../living-frame/canonical-living-frame-motion'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  activatePrivateOfflineRemotionRenderRuntime,
  buildOfflineRemotionFinalCompositionStreamingRequest,
  prepareOfflineRemotionDockerRuntime,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'
import {
  exportLivingFrameInternalReviewFile,
} from './living-frame-internal-review-export'

const width = 640
const height = 360
const fps = 30
const sceneFrameCount = 30
const durationFrames = sceneFrameCount * 8

const sceneRanges = {
  livingARoll: range(0),
  livingStill: range(1),
  livingArchive: range(2),
  livingDiagram: range(3),
  hybridExpansion: range(4),
  deliberateNonUse: range(5),
  staticCardFallback: range(6),
  safeSpaceFallback: range(7),
} as const

const fixtureRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-living-frame-five-mode-fixture-'),
)
const storageRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-living-frame-five-mode-storage-'),
)
const sourcePath = join(fixtureRoot, 'source.mp4')
const captionPath = join(fixtureRoot, 'caption.png')
const mechanicalSfxPath = join(
  fixtureRoot,
  'living-still-mechanical-sfx.wav',
)
const renderedPath = join(fixtureRoot, 'five-mode-private-render.mp4')

const fixturePaths = {
  aRollVisual: join(fixtureRoot, 'a-roll-visual.png'),
  aRollSubjectContact: join(
    fixtureRoot,
    'a-roll-subject-contact-cutout.png',
  ),
  stillBody: join(fixtureRoot, 'still-body.png'),
  stillRotor: join(fixtureRoot, 'still-rotor.png'),
  archiveFar: join(fixtureRoot, 'archive-far.png'),
  archiveNear: join(fixtureRoot, 'archive-near.png'),
  diagram: join(fixtureRoot, 'diagram.png'),
  hybrid: join(fixtureRoot, 'hybrid.png'),
  staticFallback: join(fixtureRoot, 'static-fallback.png'),
  safeSpaceFallback: join(
    fixtureRoot,
    'safe-space-fallback.png',
  ),
} as const

const colorMatchers = {
  cyan(red: number, green: number, blue: number) {
    return red < 90 && green > 150 && blue > 160
  },
  yellow(red: number, green: number, blue: number) {
    return (
      red > 190 &&
      green > 175 &&
      blue > 45 &&
      blue < 155
    )
  },
  red(red: number, green: number, blue: number) {
    return red > 180 && green < 135 && blue < 135
  },
  green(red: number, green: number, blue: number) {
    return red < 140 && green > 155 && blue < 180
  },
  purple(red: number, green: number, blue: number) {
    return red > 90 && red < 190 &&
      green > 55 && green < 150 &&
      blue > 160
  },
  white(red: number, green: number, blue: number) {
    return red > 225 && green > 225 && blue > 225
  },
  gray(red: number, green: number, blue: number) {
    return (
      red > 165 &&
      red < 235 &&
      green > 175 &&
      green < 240 &&
      blue > 185 &&
      blue < 245
    )
  },
  orange(red: number, green: number, blue: number) {
    return (
      red > 155 &&
      green > 75 &&
      green < 190 &&
      blue < 80
    )
  },
} as const

try {
  makeSource(sourcePath)
  makeCaption(captionPath)
  makeMechanicalSfx(mechanicalSfxPath)
  makeTransparentOverlay(
    fixturePaths.aRollVisual,
    [
      'drawbox=x=40:y=158:w=560:h=22:color=0x00E5FF@1:t=fill:replace=1',
      'drawbox=x=430:y=82:w=150:h=24:color=0x00E5FF@1:t=fill:replace=1',
      'drawbox=x=430:y=124:w=110:h=24:color=0x00E5FF@1:t=fill:replace=1',
      'drawbox=x=430:y=166:w=132:h=24:color=0x00E5FF@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.aRollSubjectContact,
    [
      'drawbox=x=68:y=42:w=164:h=252:color=0xF59E0B@1:t=fill:replace=1',
      'drawgrid=x=68:y=42:w=164:h=252:width=12:height=12:thickness=2:color=0x7C2D12@0.8',
      'drawbox=x=244:y=76:w=20:h=218:color=0xCBD5E1@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.stillBody,
    [
      'drawbox=x=250:y=140:w=140:h=92:color=0x3584E4@1:t=fill:replace=1',
      'drawbox=x=278:y=118:w=84:h=26:color=0x3584E4@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.stillRotor,
    [
      'drawbox=x=205:y=103:w=230:h=14:color=0xFFE066@1:t=fill:replace=1',
      'drawbox=x=313:y=96:w=14:h=28:color=0xFFE066@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.archiveFar,
    [
      'drawbox=x=105:y=82:w=150:h=190:color=0xFFD166@1:t=fill:replace=1',
      'drawbox=x=124:y=105:w=112:h=12:color=0x171A24@1:t=fill:replace=1',
      'drawbox=x=124:y=137:w=92:h=9:color=0x171A24@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.archiveNear,
    [
      'drawbox=x=405:y=116:w=142:h=166:color=0xFF6B6B@1:t=fill:replace=1',
      'drawbox=x=425:y=142:w=102:h=11:color=0x171A24@1:t=fill:replace=1',
      'drawbox=x=425:y=174:w=82:h=9:color=0x171A24@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.diagram,
    [
      'drawbox=x=112:y=159:w=416:h=12:color=0x57E389@1:t=fill:replace=1',
      'drawbox=x=96:y=132:w=64:h=64:color=0x57E389@1:t=fill:replace=1',
      'drawbox=x=480:y=132:w=64:h=64:color=0x57E389@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.hybrid,
    [
      'drawbox=x=0:y=0:w=640:h=360:color=0x8B5CF6@0.94:t=fill:replace=1',
      'drawbox=x=70:y=64:w=500:h=18:color=0xF5F3FF@0.92:t=fill:replace=1',
      'drawbox=x=70:y=112:w=360:h=14:color=0xF5F3FF@0.92:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.staticFallback,
    [
      'drawbox=x=170:y=78:w=300:h=190:color=0xF8FAFC@1:t=fill:replace=1',
      'drawbox=x=202:y=118:w=236:h=16:color=0x334155@1:t=fill:replace=1',
      'drawbox=x=202:y=158:w=184:h=12:color=0x64748B@1:t=fill:replace=1',
      'drawbox=x=202:y=192:w=214:h=12:color=0x64748B@1:t=fill:replace=1',
    ],
  )
  makeTransparentOverlay(
    fixturePaths.safeSpaceFallback,
    [
      'drawbox=x=430:y=82:w=150:h=24:color=0x00E5FF@1:t=fill:replace=1',
      'drawbox=x=430:y=124:w=110:h=24:color=0x00E5FF@1:t=fill:replace=1',
      'drawbox=x=430:y=166:w=132:h=24:color=0x00E5FF@1:t=fill:replace=1',
    ],
  )

  const source = await fileCommitment(sourcePath)
  const caption = await fileCommitment(captionPath)
  const mechanicalSfx =
    await fileCommitment(mechanicalSfxPath)
  const fixtureCommitments = await Promise.all(
    Object.entries(fixturePaths).map(async ([key, path]) => ({
      key,
      path,
      commitment: await fileCommitment(path),
    })),
  )
  const commitmentByKey = new Map(
    fixtureCommitments.map((fixture) => [
      fixture.key,
      fixture,
    ]),
  )

  const layers = [
    layer({
      sceneId: 'living-frame-mode-living-a-roll',
      layerId: 'lf-mode-00-a-roll-safe-space',
      componentOutputKey: 'lf-mode-a-roll-visual',
      manifestOutputKey: 'lf-mode-a-roll-manifest',
      fixtureKey: 'aRollVisual',
      timeRange: sceneRanges.livingARoll,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-living-a-roll',
        componentId: 'lf-mode-a-roll-visual',
        timeRange: sceneRanges.livingARoll,
        visualVerb: 'converge',
        depthStyle: 'shallow_2_5d',
        depthBand: 'behind_subject',
        parallaxFactor: 0.12,
        tracks: [
          track('a-roll-enter', 0, 'layer', 'position_x_normalized', 'primary', [
            [0, 0.2, 'ease_out_quad'],
            [14, 0, 'settle_out'],
            [29, 0, 'hold'],
          ]),
          track('a-roll-focus', 1, 'source', 'blur_pixels', 'secondary', [
            [0, 0, 'ease_in_out_cubic'],
            [14, 6, 'settle_out'],
            [29, 0, 'hold'],
          ]),
          track('a-roll-light', 2, 'source', 'light_intensity', 'secondary', [
            [0, 1, 'ease_in_out_cubic'],
            [14, 0.74, 'settle_out'],
            [29, 1, 'hold'],
          ]),
        ],
        attentionEventIds: ['attention-a-roll-focus-handoff'],
      }),
    }),
    layer({
      sceneId: 'living-frame-mode-living-a-roll',
      layerId:
        'lf-mode-05-a-roll-subject-contact-cutout',
      componentOutputKey:
        'lf-mode-a-roll-subject-contact-cutout',
      manifestOutputKey:
        'lf-mode-a-roll-subject-contact-manifest',
      fixtureKey: 'aRollSubjectContact',
      timeRange: sceneRanges.livingARoll,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-living-a-roll',
        componentId:
          'lf-mode-a-roll-subject-contact-cutout',
        timeRange: sceneRanges.livingARoll,
        visualVerb: 'hold',
        depthStyle: 'shallow_2_5d',
        depthBand: 'foreground',
        parallaxFactor: 0,
        tracks: [
          track(
            'a-roll-subject-focus',
            0,
            'layer',
            'blur_pixels',
            'secondary',
            [
              [0, 0, 'ease_in_out_cubic'],
              [14, 6, 'settle_out'],
              [29, 0, 'hold'],
            ],
          ),
          track(
            'a-roll-subject-light',
            1,
            'layer',
            'light_intensity',
            'secondary',
            [
              [0, 1, 'ease_in_out_cubic'],
              [14, 0.74, 'settle_out'],
              [29, 1, 'hold'],
            ],
          ),
        ],
        attentionEventIds: [
          'attention-a-roll-focus-handoff',
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-mode-living-still',
      layerId: 'lf-mode-10-still-body',
      componentOutputKey: 'lf-mode-still-body',
      manifestOutputKey: 'lf-mode-still-body-manifest',
      fixtureKey: 'stillBody',
      timeRange: sceneRanges.livingStill,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-living-still',
        componentId: 'lf-mode-still-body',
        timeRange: sceneRanges.livingStill,
        visualVerb: 'hold',
        depthStyle: 'shallow_2_5d',
        depthBand: 'subject_plane',
        parallaxFactor: 0.08,
        tracks: [
          track('still-body-drift', 0, 'layer', 'position_y_normalized', 'ambient', [
            [0, 0.01, 'ease_in_out_cubic'],
            [14, -0.01, 'settle_out'],
            [29, 0.01, 'hold'],
          ]),
          track('still-camera', 1, 'virtual_camera', 'scale_uniform', 'camera', [
            [0, 1, 'ease_in_out_cubic'],
            [14, 1.035, 'settle_out'],
            [29, 1, 'hold'],
          ]),
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-mode-living-still',
      layerId: 'lf-mode-20-still-rotor',
      componentOutputKey: 'lf-mode-still-rotor',
      manifestOutputKey: 'lf-mode-still-rotor-manifest',
      fixtureKey: 'stillRotor',
      timeRange: sceneRanges.livingStill,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-living-still',
        componentId: 'lf-mode-still-rotor',
        timeRange: sceneRanges.livingStill,
        visualVerb: 'rotate',
        depthStyle: 'shallow_2_5d',
        depthBand: 'in_front_of_subject',
        parallaxFactor: 0.12,
        tracks: [
          track('still-rotor-rotation', 0, 'layer', 'rotation_degrees', 'primary', [
            [0, 0, 'mechanical_accelerate'],
            [29, 90, 'hold'],
          ]),
          track('still-rotor-shadow', 1, 'layer', 'shadow_opacity', 'secondary', [
            [0, 0.08, 'ease_in_out_cubic'],
            [14, 0.24, 'settle_out'],
            [29, 0.12, 'hold'],
          ]),
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-mode-living-archive',
      layerId: 'lf-mode-30-archive-far',
      componentOutputKey: 'lf-mode-archive-far',
      manifestOutputKey: 'lf-mode-archive-far-manifest',
      fixtureKey: 'archiveFar',
      timeRange: sceneRanges.livingArchive,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-living-archive',
        componentId: 'lf-mode-archive-far',
        timeRange: sceneRanges.livingArchive,
        visualVerb: 'reveal',
        depthStyle: 'deep_multiplane',
        depthBand: 'background',
        parallaxFactor: -0.4,
        tracks: [
          track('archive-far-camera', 0, 'virtual_camera', 'position_x_normalized', 'camera', [
            [0, 0, 'ease_in_out_cubic'],
            [29, 0.1, 'hold'],
          ]),
          track('archive-far-shadow', 1, 'layer', 'shadow_opacity', 'secondary', [
            [0, 0.08, 'hold'],
            [29, 0.08, 'hold'],
          ]),
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-mode-living-archive',
      layerId: 'lf-mode-40-archive-near',
      componentOutputKey: 'lf-mode-archive-near',
      manifestOutputKey: 'lf-mode-archive-near-manifest',
      fixtureKey: 'archiveNear',
      timeRange: sceneRanges.livingArchive,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-living-archive',
        componentId: 'lf-mode-archive-near',
        timeRange: sceneRanges.livingArchive,
        visualVerb: 'reveal',
        depthStyle: 'deep_multiplane',
        depthBand: 'foreground',
        parallaxFactor: 0.5,
        tracks: [
          track('archive-near-camera', 0, 'virtual_camera', 'position_x_normalized', 'camera', [
            [0, 0, 'ease_in_out_cubic'],
            [29, 0.1, 'hold'],
          ]),
          track('archive-near-shadow', 1, 'layer', 'shadow_opacity', 'secondary', [
            [0, 0.12, 'hold'],
            [29, 0.2, 'hold'],
          ]),
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-mode-living-diagram',
      layerId: 'lf-mode-50-diagram',
      componentOutputKey: 'lf-mode-diagram',
      manifestOutputKey: 'lf-mode-diagram-manifest',
      fixtureKey: 'diagram',
      timeRange: sceneRanges.livingDiagram,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-living-diagram',
        componentId: 'lf-mode-diagram',
        timeRange: sceneRanges.livingDiagram,
        visualVerb: 'connect',
        depthStyle: 'flat',
        depthBand: 'in_front_of_subject',
        parallaxFactor: 0,
        tracks: [
          track('diagram-reveal', 0, 'layer', 'opacity', 'primary', [
            [0, 0.06, 'ease_out_quad'],
            [18, 1, 'settle_out'],
            [29, 1, 'hold'],
          ]),
          track('diagram-enter', 1, 'layer', 'position_x_normalized', 'secondary', [
            [0, -0.1, 'ease_out_quad'],
            [18, 0, 'settle_out'],
            [29, 0, 'hold'],
          ]),
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-mode-hybrid-expansion',
      layerId: 'lf-mode-60-hybrid',
      componentOutputKey: 'lf-mode-hybrid',
      manifestOutputKey: 'lf-mode-hybrid-manifest',
      fixtureKey: 'hybrid',
      timeRange: sceneRanges.hybridExpansion,
      motionSpec: motionSpec({
        sceneId: 'living-frame-mode-hybrid-expansion',
        componentId: 'lf-mode-hybrid',
        timeRange: sceneRanges.hybridExpansion,
        visualVerb: 'expand',
        depthStyle: 'shallow_2_5d',
        depthBand: 'foreground',
        parallaxFactor: 0.18,
        tracks: [
          track('hybrid-expand-return', 0, 'layer', 'scale_uniform', 'primary', [
            [0, 0.42, 'ease_in_out_cubic'],
            [14, 1.6, 'settle_out'],
            [29, 0.42, 'hold'],
          ]),
          track('hybrid-focus', 1, 'source', 'blur_pixels', 'secondary', [
            [0, 0, 'ease_in_out_cubic'],
            [14, 6, 'settle_out'],
            [29, 0, 'hold'],
          ]),
          track('hybrid-source-light', 2, 'source', 'light_intensity', 'secondary', [
            [0, 1, 'ease_in_out_cubic'],
            [14, 0.65, 'settle_out'],
            [29, 1, 'hold'],
          ]),
        ],
        attentionEventIds: [
          'attention-hybrid-expand',
          'attention-hybrid-restore',
        ],
        semanticScaleRequestIds: [
          'semantic-scale-hybrid-expansion',
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-fallback-static-card',
      layerId: 'lf-mode-70-static-card-fallback',
      componentOutputKey:
        'lf-mode-static-card-fallback',
      manifestOutputKey:
        'lf-mode-static-card-fallback-manifest',
      fixtureKey: 'staticFallback',
      timeRange: sceneRanges.staticCardFallback,
      motionSpec: motionSpec({
        sceneId:
          'living-frame-fallback-static-card',
        componentId:
          'lf-mode-static-card-fallback',
        timeRange: sceneRanges.staticCardFallback,
        visualVerb: 'hold',
        depthStyle: 'flat',
        depthBand: 'in_front_of_subject',
        parallaxFactor: 0,
        tracks: [
          track(
            'static-card-hold',
            0,
            'layer',
            'opacity',
            'primary',
            [
              [0, 1, 'hold'],
              [29, 1, 'hold'],
            ],
          ),
        ],
      }),
    }),
    layer({
      sceneId: 'living-frame-fallback-safe-space',
      layerId: 'lf-mode-80-safe-space-fallback',
      componentOutputKey:
        'lf-mode-safe-space-fallback',
      manifestOutputKey:
        'lf-mode-safe-space-fallback-manifest',
      fixtureKey: 'safeSpaceFallback',
      timeRange: sceneRanges.safeSpaceFallback,
      motionSpec: motionSpec({
        sceneId:
          'living-frame-fallback-safe-space',
        componentId:
          'lf-mode-safe-space-fallback',
        timeRange: sceneRanges.safeSpaceFallback,
        visualVerb: 'reveal',
        depthStyle: 'flat',
        depthBand: 'in_front_of_subject',
        parallaxFactor: 0,
        tracks: [
          track(
            'safe-space-fallback-enter',
            0,
            'layer',
            'position_x_normalized',
            'primary',
            [
              [0, 0.12, 'ease_out_quad'],
              [14, 0, 'settle_out'],
              [29, 0, 'hold'],
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
        width,
        height,
        fps,
        durationFrames,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: durationFrames,
        sourceFit: 'contain',
        panelBackground: '#111827',
        audioPolicy: 'preserve_source',
        supplementalAudioPolicy:
          'approved_edit_brief_audio_tracks_v1',
        supplementalAudioTracks: [{
          outputKey:
            'lf-five-mode-mechanical-sfx',
          attachmentId:
            'lf-five-mode-mechanical-sfx-asset',
          markerId:
            'lf-five-mode-living-still-motion-hit',
          markerType: 'sfx',
          startFrame:
            sceneRanges.livingStill.startFrame,
          endFrameExclusive:
            sceneRanges.livingStill.endFrameExclusive,
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
        inputId: 'approved-five-mode-source',
        mimeType: 'video/mp4',
        ...source,
      },
      captionOverlay: {
        inputId: 'approved-five-mode-caption',
        mimeType: 'image/png',
        ...caption,
      },
      livingFrameOverlays: layers.map(
        (candidate) => {
          const fixture = commitmentByKey.get(
            candidate.fixtureKey,
          )
          assert.ok(fixture)
          return {
            inputId:
              `approved-${candidate.fixtureKey}`,
            outputKey:
              candidate.planning.componentOutputKey,
            mimeType: 'image/png' as const,
            ...fixture.commitment,
          }
        },
      ),
      supplementalAudioTracks: [{
        inputId:
          'approved-living-still-mechanical-sfx',
        outputKey:
          'lf-five-mode-mechanical-sfx',
        attachmentId:
          'lf-five-mode-mechanical-sfx-asset',
        markerId:
          'lf-five-mode-living-still-motion-hit',
        markerType: 'sfx',
        startFrame:
          sceneRanges.livingStill.startFrame,
        endFrameExclusive:
          sceneRanges.livingStill.endFrameExclusive,
        fillPolicy: 'trim_without_loop',
        mixProfileId:
          'narration_protected_uploaded_sfx_v1',
        mimeType: 'audio/wav',
        ...mechanicalSfx,
      }],
    })

  const inputs: OfflineRemotionServerInjectedInput[] = [
    privateFileInput(
      'approved-five-mode-source',
      'video/mp4',
      sourcePath,
      source,
    ),
    ...layers.map((candidate) => {
      const fixture = commitmentByKey.get(
        candidate.fixtureKey,
      )
      assert.ok(fixture)
      return privateFileInput(
        `approved-${candidate.fixtureKey}`,
        'image/png',
        fixture.path,
        fixture.commitment,
      )
    }),
    privateFileInput(
      'approved-five-mode-caption',
      'image/png',
      captionPath,
      caption,
    ),
    privateFileInput(
      'approved-living-still-mechanical-sfx',
      'audio/wav',
      mechanicalSfxPath,
      mechanicalSfx,
    ),
  ]

  const result = await runtime.executeServerInjected(
    request,
    inputs,
    {
      maximumBytes:
        OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
      async persist(output) {
        const privateObjectIdentityHash =
          createHash('sha256')
            .update(
              `living-frame-five-mode-private-render\n${output.expectedSha256}`,
            )
            .digest('hex')
        const persisted =
          await persistCanonicalPrivateRemotionArtifactStream({
            localStorageRoot: storageRoot,
            privateObjectIdentityHash,
            stream: output.stream,
            expectedByteLength:
              output.expectedByteLength,
            expectedSha256:
              output.expectedSha256,
          })
        const reopened =
          await inspectCanonicalPrivateRemotionArtifact({
            localStorageRoot: storageRoot,
            privateObjectIdentityHash,
          })
        assert.ok(reopened)
        const chunks: Buffer[] = []
        const reopenedStream =
          await reopened.openStream()
        for await (const chunk of reopenedStream) {
          chunks.push(
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(chunk),
          )
        }
        await writeFile(
          renderedPath,
          Buffer.concat(chunks),
        )
        return persisted
      },
    },
  )

  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameDeterministicMotionApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameAdaptiveDepthStyleApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameCameraOrSourceAttentionApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameOverlayBelowCaptionsApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedSupplementalAudioInputStreamedWithoutWholeBuffer,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedSupplementalAudioTimelineApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedSupplementalAudioSpeechSafeMixApplied,
    true,
  )

  const sampledFrameNumbers = [
    0, 14, 29,
    30, 59,
    60, 89,
    90, 108, 119,
    120, 134, 149,
    165,
    195,
    225,
  ] as const
  const sampledFrames = extractFrames(
    renderedPath,
    sampledFrameNumbers,
  )
  const frameByNumber = new Map<number, Buffer>(
    sampledFrameNumbers.map((frame, index) => [
      frame,
      sampledFrames[index]!,
    ]),
  )
  const frame = (frameNumber: number): Buffer => {
    const value = frameByNumber.get(frameNumber)
    assert.ok(value)
    return value
  }

  const aRollEarly =
    colorStats(frame(0), colorMatchers.cyan)
  const aRollLate =
    colorStats(frame(29), colorMatchers.cyan)
  assert.ok(aRollEarly.count > 900)
  assert.ok(
    aRollLate.count > aRollEarly.count * 1.15,
    `Expected settled A-roll visual to reveal more cyan pixels; early=${JSON.stringify(aRollEarly)}, late=${JSON.stringify(aRollLate)}.`,
  )
  assert.ok(
    aRollEarly.centroidX - aRollLate.centroidX >
      width * 0.08,
  )
  const aRollEarlyEdgeEnergy =
    sourceEdgeEnergy(frame(0))
  const aRollFocusEdgeEnergy =
    sourceEdgeEnergy(frame(14))
  const aRollRestoredEdgeEnergy =
    sourceEdgeEnergy(frame(29))
  assert.ok(
    aRollFocusEdgeEnergy <
      aRollEarlyEdgeEnergy * 0.72,
  )
  assert.ok(
    aRollRestoredEdgeEnergy >
      aRollFocusEdgeEnergy * 1.25,
  )
  const aRollOcclusionFrame = frame(29)
  const routeBeforeSubject = colorCountInRegion(
    aRollOcclusionFrame,
    colorMatchers.cyan,
    {
      xStart: 40,
      xEndExclusive: 68,
      yStart: 158,
      yEndExclusive: 180,
    },
  )
  const routeAfterContact = colorCountInRegion(
    aRollOcclusionFrame,
    colorMatchers.cyan,
    {
      xStart: 264,
      xEndExclusive: 600,
      yStart: 158,
      yEndExclusive: 180,
    },
  )
  const routeInsideSubject = colorCountInRegion(
    aRollOcclusionFrame,
    colorMatchers.cyan,
    {
      xStart: 68,
      xEndExclusive: 232,
      yStart: 158,
      yEndExclusive: 180,
    },
  )
  const routeInsideContact = colorCountInRegion(
    aRollOcclusionFrame,
    colorMatchers.cyan,
    {
      xStart: 244,
      xEndExclusive: 264,
      yStart: 158,
      yEndExclusive: 180,
    },
  )
  const preservedSubjectPixels = colorCountInRegion(
    aRollOcclusionFrame,
    colorMatchers.orange,
    {
      xStart: 68,
      xEndExclusive: 232,
      yStart: 158,
      yEndExclusive: 180,
    },
  )
  const preservedContactPixels = colorCountInRegion(
    aRollOcclusionFrame,
    colorMatchers.gray,
    {
      xStart: 244,
      xEndExclusive: 264,
      yStart: 158,
      yEndExclusive: 180,
    },
  )
  assert.ok(routeBeforeSubject > 350)
  assert.ok(routeAfterContact > 4_500)
  assert.ok(routeInsideSubject < 25)
  assert.ok(routeInsideContact < 10)
  assert.ok(preservedSubjectPixels > 2_000)
  assert.ok(preservedContactPixels > 300)

  const rotorEarly =
    colorStats(
      frame(30),
      colorMatchers.yellow,
      { xStart: 250, xEndExclusive: 390 },
    )
  const rotorLate =
    colorStats(
      frame(59),
      colorMatchers.yellow,
      { xStart: 250, xEndExclusive: 390 },
    )
  assert.ok(
    rotorEarly.width > rotorEarly.height * 4,
    `Expected horizontal early rotor, received ${JSON.stringify(rotorEarly)}.`,
  )
  assert.ok(
    rotorLate.height > rotorLate.width * 4,
    `Expected vertical late rotor, received ${JSON.stringify(rotorLate)}.`,
  )

  const archiveFarEarly =
    colorStats(frame(60), colorMatchers.yellow)
  const archiveFarLate =
    colorStats(frame(89), colorMatchers.yellow)
  const archiveNearEarly =
    colorStats(frame(60), colorMatchers.red)
  const archiveNearLate =
    colorStats(frame(89), colorMatchers.red)
  const archiveFarDisplacement =
    archiveFarEarly.centroidX -
    archiveFarLate.centroidX
  const archiveNearDisplacement =
    archiveNearEarly.centroidX -
    archiveNearLate.centroidX
  assert.ok(archiveFarDisplacement > width * 0.04)
  assert.ok(
    archiveNearDisplacement >
      archiveFarDisplacement + width * 0.06,
  )

  const diagramEarlyCount =
    colorStats(frame(90), colorMatchers.green).count
  const diagramLateCount =
    colorStats(frame(119), colorMatchers.green).count
  assert.ok(diagramEarlyCount < 200)
  assert.ok(diagramLateCount > 8_000)

  const hybridEarlyCount =
    colorStats(frame(120), colorMatchers.purple).count
  const hybridExpandedCount =
    colorStats(frame(134), colorMatchers.purple).count
  const hybridReturnedCount =
    colorStats(frame(149), colorMatchers.purple).count
  assert.ok(
    hybridExpandedCount > hybridEarlyCount * 4,
  )
  assert.ok(
    hybridReturnedCount <
      hybridExpandedCount * 0.35,
  )
  assert.ok(
    Math.abs(
      hybridReturnedCount - hybridEarlyCount,
    ) < hybridEarlyCount * 0.2,
  )

  assertCaptionAboveLivingFrame(frame(29))
  assertCaptionAboveLivingFrame(frame(59))
  assertCaptionAboveLivingFrame(frame(89))
  assertCaptionAboveLivingFrame(frame(119))
  assertCaptionAboveLivingFrame(frame(134))
  assertCaptionAboveLivingFrame(frame(165))
  assertCaptionAboveLivingFrame(frame(225))

  const nonUseFrame = frame(165)
  assert.ok(
    colorStats(nonUseFrame, colorMatchers.cyan).count <
      25,
  )
  assert.ok(
    colorStats(nonUseFrame, colorMatchers.green).count <
      25,
  )
  assert.ok(
    colorStats(nonUseFrame, colorMatchers.purple).count <
      25,
  )

  const staticFallbackWhite =
    colorStats(frame(195), colorMatchers.white).count
  assert.ok(staticFallbackWhite > 45_000)
  assertCaptionAboveLivingFrame(frame(195))

  const safeSpaceCyan = colorCountInRegion(
    frame(225),
    colorMatchers.cyan,
    {
      xStart: 420,
      xEndExclusive: 590,
      yStart: 70,
      yEndExclusive: 205,
    },
  )
  const safeSpaceSubjectCollision =
    colorCountInRegion(
      frame(225),
      colorMatchers.cyan,
      {
        xStart: 68,
        xEndExclusive: 264,
        yStart: 42,
        yEndExclusive: 294,
      },
    )
  assert.ok(safeSpaceCyan > 5_000)
  assert.ok(safeSpaceSubjectCollision < 25)

  const probe = probeRenderedVideo(renderedPath)
  assert.equal(probe.width, width)
  assert.equal(probe.height, height)
  assert.equal(probe.frameCount, durationFrames)
  assert.equal(probe.frameRate, `${fps}/1`)

  const decodedAudio = extractMonoPcm(
    renderedPath,
    48_000,
  )
  const samplesPerSecond = 48_000
  const sourceToneBefore = toneMagnitude(
    decodedAudio.subarray(
      0,
      samplesPerSecond * 2,
    ),
    330,
    samplesPerSecond,
  )
  const sourceToneDuring = toneMagnitude(
    decodedAudio.subarray(
      samplesPerSecond * 2,
      samplesPerSecond * 4,
    ),
    330,
    samplesPerSecond,
  )
  const sfxToneBefore = toneMagnitude(
    decodedAudio.subarray(
      0,
      samplesPerSecond * 2,
    ),
    880,
    samplesPerSecond,
  )
  const sfxToneDuring = toneMagnitude(
    decodedAudio.subarray(
      samplesPerSecond * 2,
      samplesPerSecond * 4,
    ),
    880,
    samplesPerSecond,
  )
  assert.ok(
    sfxToneDuring > sfxToneBefore * 8,
    `Expected the 880Hz mechanical cue only during Living Still; before=${sfxToneBefore}, during=${sfxToneDuring}.`,
  )
  assert.ok(
    sourceToneDuring > sfxToneDuring * 3,
    `Expected the 330Hz narration-proxy tone to remain dominant; source=${sourceToneDuring}, sfx=${sfxToneDuring}.`,
  )
  assert.ok(
    sourceToneDuring > sourceToneBefore * 0.65,
    `Expected the narration-proxy tone to remain protected; before=${sourceToneBefore}, during=${sourceToneDuring}.`,
  )

  const rendered = await readFile(renderedPath)
  assert.equal(
    createHash('sha256').update(rendered).digest('hex'),
    result.artifact.sha256,
  )
  const reviewExport =
    await exportLivingFrameInternalReviewFile({
      runId: 'five_mode_private_render',
      fileName: 'five-mode-private-render.mp4',
      sourcePath: renderedPath,
      expectedByteLength: result.artifact.byteLength,
      expectedSha256: result.artifact.sha256,
    })

  process.stdout.write(`${JSON.stringify({
    smoke:
      'living_frame_five_mode_private_render',
    status: 'passed',
    privateInternalOnly: true,
    modesRendered: [
      'living_a_roll',
      'living_still',
      'living_archive',
      'living_diagram',
      'hybrid_expansion',
    ],
    deliberateNonUseRendered: true,
    fallbackTreatmentsRendered: [
      'safe_space_overlay',
      'static_card',
      'no_extra_visual',
    ],
    livingARoll: {
      lowRiskSubjectAndContactOcclusionExercised:
        true,
      focusHandoffRenderedAndMeasured: true,
      attentionRestorationRenderedAndMeasured: true,
      graphicObservedBehindSubjectAndContactObject:
        true,
      captionsObservedAboveForegroundCutout: true,
      temporalMaskInferenceClaimed: false,
    },
    livingStill: {
      selectiveMechanicalMotionRenderedAndMeasured: true,
      staticAnchorPreserved: true,
    },
    livingArchive: {
      deepMultiplaneParallaxRenderedAndMeasured: true,
      farDisplacement: archiveFarDisplacement,
      nearDisplacement: archiveNearDisplacement,
    },
    livingDiagram: {
      deterministicGraphicRevealRenderedAndMeasured: true,
      exactVisualRouteUsed: true,
    },
    hybridExpansion: {
      expansionRenderedAndMeasured: true,
      restorationRenderedAndMeasured: true,
    },
    nonUse: {
      emotionalDeliveryProtectionRangeRendered: true,
      noLivingFrameOverlayObserved: true,
    },
    staticFallback: {
      staticCardRenderedWithoutUnsupportedMotion: true,
      captionPlanePreserved: true,
    },
    safeSpaceFallback: {
      negativeSpaceVisualRenderedAndMeasured: true,
      subjectAndContactRegionsProtected: true,
      captionPlanePreserved: true,
    },
    soundChoreography: {
      exactMechanicalCueRangeApplied: true,
      sourceNarrationProxyTonePreserved: true,
      narrationProtectedMixMeasured: true,
      sfxAbsentBeforeCueAndPresentDuringCue: true,
      sourceToneBefore,
      sourceToneDuring,
      sfxToneBefore,
      sfxToneDuring,
    },
    captionPlaneObservedAboveEveryMode: true,
    persistedPrivateArtifactReopenedAndVerified: true,
    reviewExports:
      reviewExport == null ? [] : [reviewExport],
    actualRemotionRuntimeExecuted: true,
    actualFfprobeRuntimeExecuted: true,
    output: probe,
    customerBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })}\n`)
} finally {
  await rm(fixtureRoot, {
    recursive: true,
    force: true,
  })
  await rm(storageRoot, {
    recursive: true,
    force: true,
  })
}

function range(index: number): {
  startFrame: number
  endFrameExclusive: number
} {
  return {
    startFrame: index * sceneFrameCount,
    endFrameExclusive:
      (index + 1) * sceneFrameCount,
  }
}

function layer(input: {
  sceneId: string
  layerId: string
  componentOutputKey: string
  manifestOutputKey: string
  fixtureKey: keyof typeof fixturePaths
  timeRange: {
    startFrame: number
    endFrameExclusive: number
  }
  motionSpec: CanonicalLivingFrameMotionSpec
}): {
  fixtureKey: keyof typeof fixturePaths
  planning: {
    sceneId: string
    layerId: string
    manifestOutputKey: string
    componentOutputKey: string
    startFrame: number
    endFrameExclusive: number
    fit: 'fill'
    opacity: 1
    motionSpec: CanonicalLivingFrameMotionSpec
  }
} {
  return {
    fixtureKey: input.fixtureKey,
    planning: {
      sceneId: input.sceneId,
      layerId: input.layerId,
      manifestOutputKey: input.manifestOutputKey,
      componentOutputKey: input.componentOutputKey,
      startFrame: input.timeRange.startFrame,
      endFrameExclusive:
        input.timeRange.endFrameExclusive,
      fit: 'fill',
      opacity: 1,
      motionSpec: input.motionSpec,
    },
  }
}

function motionSpec(input: {
  sceneId: string
  componentId: string
  timeRange: {
    startFrame: number
    endFrameExclusive: number
  }
  visualVerb: LivingFrameVisualVerb
  depthStyle:
    CanonicalLivingFrameMotionSpecDraft['depthStyle']
  depthBand: LivingFrameDepthBand
  parallaxFactor: number
  tracks:
    CanonicalLivingFrameMotionSpecDraft['tracks']
  attentionEventIds?: readonly string[]
  semanticScaleRequestIds?: readonly string[]
}): CanonicalLivingFrameMotionSpec {
  const frameCount =
    input.timeRange.endFrameExclusive -
    input.timeRange.startFrame
  const tracks = input.tracks.map((candidate) => ({
    ...candidate,
    compiledSampleCount: frameCount,
    compiledSampleDigestSha256:
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes: candidate.keyframes,
        sceneFrameCount: frameCount,
      }),
  }))
  const draft:
    CanonicalLivingFrameMotionSpecDraft = {
      schemaVersion:
        'canonical-living-frame-motion-spec-v3',
      motionProfileId:
        'component_role_activation_selective_visual_interval_choreography_v3',
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
          createHash('sha256')
            .update(`selected-scene\n${input.sceneId}`)
            .digest('hex'),
        timingBindingDigestSha256:
          createHash('sha256')
            .update([
              input.sceneId,
              input.timeRange.startFrame,
              input.timeRange.endFrameExclusive,
              fps,
            ].join('\n'))
            .digest('hex'),
        deterministicMotionBundleDigestSha256:
          createHash('sha256')
            .update(
              `motion-bundle\n${input.sceneId}\n${input.componentId}`,
            )
            .digest('hex'),
      },
      attentionEventIds:
        input.attentionEventIds ?? [],
      semanticScaleRequestIds:
        input.semanticScaleRequestIds ?? [],
      tracks,
      metrics: {
        layerTrackCount: tracks.filter(
          (candidate) =>
            candidate.target === 'layer',
        ).length,
        cameraTrackCount: tracks.filter(
          (candidate) =>
            candidate.target === 'virtual_camera',
        ).length,
        sourceTrackCount: tracks.filter(
          (candidate) =>
            candidate.target === 'source',
        ).length,
        keyframeCount: tracks.reduce(
          (total, candidate) =>
            total + candidate.keyframes.length,
          0,
        ),
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
  trackId: string,
  order: number,
  target:
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['target'],
  property:
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['property'],
  role:
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['role'],
  keyframes: ReadonlyArray<readonly [
    number,
    number,
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['keyframes'][number]['easingToNext'],
  ]>,
): CanonicalLivingFrameMotionSpecDraft[
  'tracks'
][number] {
  const resolvedKeyframes = keyframes.map(([
    frameOffset,
    value,
    easingToNext,
  ]) => ({
    frameOffset,
    value,
    easingToNext,
  }))
  return {
    trackId: `lf.five-mode.${trackId}`,
    order,
    target,
    property,
    role,
    keyframes: resolvedKeyframes,
    compiledSampleCount: sceneFrameCount,
    compiledSampleDigestSha256: '0'.repeat(64),
  }
}

function makeSource(path: string): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x202938:size=${width}x${height}:rate=${fps}:duration=${durationFrames / fps}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=330:sample_rate=48000:duration=${durationFrames / fps}`,
    '-vf',
    [
      'drawgrid=width=16:height=16:thickness=2:color=0x64748B@0.9',
      'drawbox=x=68:y=42:w=164:h=252:color=0xF59E0B@1:t=fill',
      'drawgrid=x=68:y=42:w=164:h=252:width=12:height=12:thickness=2:color=0x7C2D12@0.8',
      'drawbox=x=244:y=76:w=20:h=218:color=0xCBD5E1@1:t=fill',
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
    '-threads',
    '1',
    '-y',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
}

function makeMechanicalSfx(path: string): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=880:sample_rate=48000:duration=1',
    '-af',
    'volume=0.2',
    '-ac',
    '2',
    '-c:a',
    'pcm_s16le',
    '-threads',
    '1',
    '-y',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
}

function makeCaption(path: string): void {
  makeTransparentOverlay(path, [
    'drawbox=x=220:y=302:w=200:h=34:color=0xFF00D4@1:t=fill:replace=1',
  ])
}

function makeTransparentOverlay(
  path: string,
  filters: readonly string[],
): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=black@0:size=${width}x${height}:duration=1`,
    '-vf',
    [
      'format=rgba',
      'colorchannelmixer=aa=0',
      ...filters,
    ].join(','),
    '-frames:v',
    '1',
    '-threads',
    '1',
    '-y',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
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
      width * height * 3 *
      (frameNumbers.length + 1),
  })
  assert.equal(
    result.status,
    0,
    result.stderr?.toString('utf8'),
  )
  const bytes = Buffer.from(result.stdout)
  const frameBytes = width * height * 3
  assert.equal(
    bytes.byteLength,
    frameBytes * frameNumbers.length,
  )
  return frameNumbers.map((_, index) =>
    bytes.subarray(
      index * frameBytes,
      (index + 1) * frameBytes,
    ))
}

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
    readonly yStart?: number
    readonly yEndExclusive?: number
  } = {
    xStart: 0,
    xEndExclusive: width,
  },
): {
  count: number
  centroidX: number
  centroidY: number
  width: number
  height: number
} {
  let count = 0
  let xTotal = 0
  let yTotal = 0
  let minX = width
  let maxX = -1
  let minY = height
  let maxY = -1
  const yStart = region.yStart ?? 0
  const yEndExclusive =
    region.yEndExclusive ?? height
  for (let y = yStart; y < yEndExclusive; y += 1) {
    for (
      let x = region.xStart;
      x < region.xEndExclusive;
      x += 1
    ) {
      const offset = (y * width + x) * 3
      if (!matches(
        frame[offset]!,
        frame[offset + 1]!,
        frame[offset + 2]!,
      )) continue
      count += 1
      xTotal += x
      yTotal += y
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  return {
    count,
    centroidX: count === 0 ? 0 : xTotal / count,
    centroidY: count === 0 ? 0 : yTotal / count,
    width: count === 0 ? 0 : maxX - minX + 1,
    height: count === 0 ? 0 : maxY - minY + 1,
  }
}

function colorCountInRegion(
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
): number {
  return colorStats(frame, matches, region).count
}

function sourceEdgeEnergy(frame: Buffer): number {
  let energy = 0
  for (let y = 48; y < 286; y += 1) {
    for (let x = 76; x < 224; x += 1) {
      const offset = (y * width + x) * 3
      const nextOffset = offset + 3
      energy += Math.abs(
        frame[offset]! - frame[nextOffset]!,
      )
      energy += Math.abs(
        frame[offset + 1]! -
        frame[nextOffset + 1]!,
      )
      energy += Math.abs(
        frame[offset + 2]! -
        frame[nextOffset + 2]!,
      )
    }
  }
  return energy
}

function assertCaptionAboveLivingFrame(
  frame: Buffer,
): void {
  let magentaPixels = 0
  for (let y = 302; y < 336; y += 1) {
    for (let x = 220; x < 420; x += 1) {
      const offset = (y * width + x) * 3
      const red = frame[offset]!
      const green = frame[offset + 1]!
      const blue = frame[offset + 2]!
      if (
        red > 160 &&
        green < 110 &&
        blue > 130
      ) magentaPixels += 1
    }
  }
  assert.ok(
    magentaPixels > 5_000,
    `Expected caption plane above Living Frame; observed ${magentaPixels} magenta pixels.`,
  )
}

function probeRenderedVideo(path: string): {
  width: number
  height: number
  frameRate: string
  frameCount: number
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
  assert.equal(result.status, 0, result.stderr)
  const parsed = JSON.parse(result.stdout) as {
    streams?: Array<{
      width?: number
      height?: number
      r_frame_rate?: string
      nb_frames?: string
    }>
  }
  const stream = parsed.streams?.[0]
  assert.ok(stream)
  return {
    width: stream.width!,
    height: stream.height!,
    frameRate: stream.r_frame_rate!,
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
  assert.equal(
    result.status,
    0,
    Buffer.isBuffer(result.stderr)
      ? result.stderr.toString('utf8')
      : String(result.stderr),
  )
  assert.ok(Buffer.isBuffer(result.stdout))
  return result.stdout
}

function toneMagnitude(
  pcmS16le: Buffer,
  frequency: number,
  sampleRate: number,
): number {
  assert.equal(pcmS16le.byteLength % 2, 0)
  const sampleCount = pcmS16le.byteLength / 2
  assert.ok(sampleCount > 0)
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
  return (
    Math.sqrt(real * real + imaginary * imaginary) /
    sampleCount
  )
}

async function fileCommitment(path: string): Promise<{
  byteLength: number
  sha256: string
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
  assert.equal(byteLength, fileStat.size)
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
    byteLength: number
    sha256: string
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
