import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  readPrivateFileIfExistsWithinRoot,
} from '../security/private-local-persistence'
import {
  executeLivingFrameAnimationAwareIllustrationPrivateAlphaInternalTest,
} from './living-frame-animation-aware-illustration-private-alpha-internal-test'
import {
  decomposeLivingFrameMusashiCharacterPrivateFixture,
  makeLivingFrameMusashiCaptionPrivateFixture,
  scaleLivingFrameMusashiCharacterToLandscapePrivateFixture,
} from './living-frame-animation-aware-illustration-private-composite-internal-test'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from './living-frame-environmental-particle-sequence-observation'

const ALPHA_STORAGE_ROOT =
  '/tmp/reeditpro-living-frame-animation-aware-illustration-internal-test'
const WIDTH = 640 as const
const HEIGHT = 360 as const

export interface LivingFrameMusashiBlenderTexturePrivateFixture {
  readonly sourceArtifactId:
    'lf.animation-aware-illustration.musashi.v1'
  readonly sourceAlphaSha256: string
  readonly baseComponent: {
    readonly artifactId:
      'lf.animation-aware-illustration.musashi.base.v1'
    readonly contentType: 'image/png'
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly byteLength: number
    readonly sha256: string
    readonly pngBytes: Buffer
  }
  readonly basePlateComponent: {
    readonly artifactId:
      'lf.animation-aware-illustration.musashi.base-plate.v1'
    readonly contentType: 'image/png'
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly byteLength: number
    readonly sha256: string
    readonly pngBytes: Buffer
  }
  readonly captionComponent: {
    readonly artifactId:
      'lf.animation-aware-illustration.musashi.caption.v1'
    readonly contentType: 'image/png'
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly byteLength: number
    readonly sha256: string
    readonly pngBytes: Buffer
  }
  readonly swordArmComponent: {
    readonly artifactId:
      'lf.animation-aware-illustration.musashi.sword-arm.v1'
    readonly contentType: 'image/png'
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly byteLength: number
    readonly sha256: string
    readonly pngBytes: Buffer
  }
  readonly decomposition: {
    readonly profile:
      'fixture_specific_character_action_cutout_rig_v2'
    readonly swordArmSelectedPixelCount: number
    readonly swordArmReconstructedPixelCount: number
    readonly swordArmTransparentClearedPixelCount: number
    readonly swordArmPivot:
      readonly [390, 104]
    readonly hiddenAreaReconstructionRequired: true
    readonly illustrativeNotArchivalEvidence: true
  }
  readonly authorityBoundary: {
    readonly privateInternalFixtureAuthority: true
    readonly approvedSnapshotAuthority: false
    readonly workGraphAuthority: false
    readonly assetPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly cleanup: () => Promise<void>
}

export async function materializeLivingFrameMusashiBlenderTexturePrivateFixture():
Promise<LivingFrameMusashiBlenderTexturePrivateFixture> {
  if (arguments.length !== 0) {
    throw new Error(
      'Musashi Blender texture private fixture accepts no caller input.',
    )
  }
  const alphaReceipt =
    await executeLivingFrameAnimationAwareIllustrationPrivateAlphaInternalTest()
  const alphaPng =
    await readPrivateFileIfExistsWithinRoot({
      rootPath: ALPHA_STORAGE_ROOT,
      relativePath:
        alphaReceipt.privateArtifacts.alphaObjectKey,
    })
  if (
    alphaPng == null
    || sha256(alphaPng)
      !== alphaReceipt.decontamination
        .cleanedAlphaPngSha256
  ) {
    throw new Error(
      'Musashi Blender texture source alpha changed.',
    )
  }
  const fixtureRoot =
    await mkdtemp(join(
      tmpdir(),
      'reeditpro-lf-musashi-blender-texture-',
    ))
  const sourceAlphaPath =
    join(fixtureRoot, 'source-alpha.png')
  const landscapePath =
    join(fixtureRoot, 'landscape.png')
  const basePath =
    join(fixtureRoot, 'base.png')
  const swordArmPath =
    join(fixtureRoot, 'sword-arm.png')
  const hairPath =
    join(fixtureRoot, 'hair.png')
  const robePath =
    join(fixtureRoot, 'robe.png')
  const basePlatePath =
    join(fixtureRoot, 'base-plate.png')
  const captionPath =
    join(fixtureRoot, 'caption.png')
  try {
    await writeFile(
      sourceAlphaPath,
      alphaPng,
      { flag: 'wx', mode: 0o600 },
    )
    scaleLivingFrameMusashiCharacterToLandscapePrivateFixture(
      sourceAlphaPath,
      landscapePath,
    )
    const decomposition =
      await decomposeLivingFrameMusashiCharacterPrivateFixture({
        sourcePath: landscapePath,
        basePath,
        swordArmPath,
        hairPath,
        robePath,
      })
    createMusashiBasePlate({
      basePath,
      hairPath,
      robePath,
      outputPath: basePlatePath,
    })
    await makeLivingFrameMusashiCaptionPrivateFixture(
      captionPath,
    )
    const [
      basePng,
      swordArmPng,
      basePlatePng,
      captionPng,
    ] =
      await Promise.all([
        readFile(basePath),
        readFile(swordArmPath),
        readFile(basePlatePath),
        readFile(captionPath),
      ])
    assertRgbaPng(basePng, 'base')
    assertRgbaPng(
      swordArmPng,
      'sword arm',
    )
    assertRgbaPng(
      basePlatePng,
      'base plate',
    )
    assertRgbaPng(
      captionPng,
      'caption',
    )
    if (
      sha256(basePng)
        !== decomposition.baseComponentSha256
      || sha256(swordArmPng)
        !== decomposition.swordArmComponentSha256
    ) {
      throw new Error(
        'Musashi Blender texture decomposition commitment changed.',
      )
    }
    let cleaned = false
    return {
      sourceArtifactId:
        'lf.animation-aware-illustration.musashi.v1',
      sourceAlphaSha256:
        alphaReceipt.decontamination
          .cleanedAlphaPngSha256,
      baseComponent: {
        artifactId:
          'lf.animation-aware-illustration.musashi.base.v1',
        contentType: 'image/png',
        widthPixels: WIDTH,
        heightPixels: HEIGHT,
        byteLength: basePng.byteLength,
        sha256: sha256(basePng),
        pngBytes: basePng,
      },
      basePlateComponent: {
        artifactId:
          'lf.animation-aware-illustration.musashi.base-plate.v1',
        contentType: 'image/png',
        widthPixels: WIDTH,
        heightPixels: HEIGHT,
        byteLength:
          basePlatePng.byteLength,
        sha256: sha256(basePlatePng),
        pngBytes: basePlatePng,
      },
      captionComponent: {
        artifactId:
          'lf.animation-aware-illustration.musashi.caption.v1',
        contentType: 'image/png',
        widthPixels: WIDTH,
        heightPixels: HEIGHT,
        byteLength:
          captionPng.byteLength,
        sha256: sha256(captionPng),
        pngBytes: captionPng,
      },
      swordArmComponent: {
        artifactId:
          'lf.animation-aware-illustration.musashi.sword-arm.v1',
        contentType: 'image/png',
        widthPixels: WIDTH,
        heightPixels: HEIGHT,
        byteLength:
          swordArmPng.byteLength,
        sha256: sha256(swordArmPng),
        pngBytes: swordArmPng,
      },
      decomposition: {
        profile:
          'fixture_specific_character_action_cutout_rig_v2',
        swordArmSelectedPixelCount:
          decomposition
            .swordArmSelectedPixelCount,
        swordArmReconstructedPixelCount:
          decomposition
            .swordArmReconstructedPixelCount,
        swordArmTransparentClearedPixelCount:
          decomposition
            .swordArmTransparentClearedPixelCount,
        swordArmPivot: [390, 104],
        hiddenAreaReconstructionRequired:
          true,
        illustrativeNotArchivalEvidence:
          true,
      },
      authorityBoundary: {
        privateInternalFixtureAuthority:
          true,
        approvedSnapshotAuthority: false,
        workGraphAuthority: false,
        assetPersistenceAuthority: false,
        assetManifestAuthority: false,
        qaApprovalAuthority: false,
        privateReviewAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      async cleanup() {
        if (cleaned) return
        cleaned = true
        await rm(
          fixtureRoot,
          {
            recursive: true,
            force: true,
          },
        )
      },
    }
  } catch (error) {
    await rm(
      fixtureRoot,
      {
        recursive: true,
        force: true,
      },
    )
    throw error
  }
}

function createMusashiBasePlate(input: {
  readonly basePath: string
  readonly hairPath: string
  readonly robePath: string
  readonly outputPath: string
}): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x11131A:size=${WIDTH}x${HEIGHT}:duration=1`,
    '-i',
    input.basePath,
    '-i',
    input.hairPath,
    '-i',
    input.robePath,
    '-filter_complex',
    [
      '[0:v]drawgrid=width=32:height=32:thickness=1:color=0x64748B@0.12,',
      'drawbox=x=350:y=0:w=290:h=360:color=0x2B1217@0.42:t=fill,',
      'drawbox=x=0:y=280:w=640:h=80:color=0x090B10@0.62:t=fill,',
      'format=rgba[background];',
      '[background][1:v]overlay=0:0:format=auto[base];',
      '[base][2:v]overlay=124:-122:format=auto[hair];',
      '[hair][3:v]overlay=169:-61:format=auto[composite]',
    ].join(''),
    '-map',
    '[composite]',
    '-frames:v',
    '1',
    '-c:v',
    'png',
    '-threads',
    '1',
    '-y',
    input.outputPath,
  ], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Musashi Blender base-plate preparation failed: ${result.stderr}`,
    )
  }
}

function assertRgbaPng(
  png: Buffer,
  label: string,
): void {
  const decoded =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      png,
    )
  if (
    decoded.width !== WIDTH
    || decoded.height !== HEIGHT
    || decoded.rgba.byteLength
      !== WIDTH * HEIGHT * 4
  ) {
    throw new Error(
      `Musashi Blender ${label} texture failed RGBA revalidation.`,
    )
  }
}

function sha256(bytes: Buffer): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}
