import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  deflateSync,
  inflateSync,
} from 'node:zlib'

import {
  LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_CLASS,
  LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_VERSION,
  type LivingFrameArticulatedPuppetPart,
  type LivingFrameArticulatedPuppetSheetReceipt,
  type LivingFrameArticulatedPuppetSheetReceiptDraft,
} from '../../src/types/living-frame-articulated-puppet-sheet-internal-test'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
const SOURCE_WIDTH = 1_536 as const
const SOURCE_HEIGHT = 1_024 as const
const SOURCE_BYTE_LENGTH = 1_960_401 as const
const SOURCE_SHA256 =
  '0a6d52335e32614d57a79ea4f93da81a3a325363aea319d21895cfcddde90b37' as const
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const CHARACTER_LAYOUT_SCALE = 0.52
const CHARACTER_LAYOUT_CENTER = 0.5

const SOURCE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../smoke/fixtures/assets/living-frame-airship-navigator-articulated-puppet-sheet-v1.png',
)

export const LIVING_FRAME_AIRSHIP_NAVIGATOR_ARTICULATED_PARTS =
  deepFreeze([
    part({
      order: 0,
      partId: 'airship.navigator.body',
      role: 'static_body',
      source: [35, 31, 471, 962],
      pivot: [260, 118],
      destination: [0.355, 0.225, 0.205, 0.72, 0],
      boneId: 'bone.navigator.root',
      hiddenJointOverlapArtworkPresent: true,
    }),
    part({
      order: 1,
      partId: 'airship.navigator.head',
      role: 'head',
      source: [510, 49, 285, 399],
      pivot: [616, 415],
      destination: [0.412, 0.024, 0.116, 0.29, 0.01],
      boneId: 'bone.navigator.head',
      hiddenJointOverlapArtworkPresent: true,
    }),
    part({
      order: 2,
      partId: 'airship.navigator.upper-arm',
      role: 'upper_arm',
      source: [902, 70, 208, 379],
      pivot: [953, 127],
      destination: [0.471, 0.272, 0.0895, 0.29, 0.02],
      boneId: 'bone.navigator.upper-arm',
      hiddenJointOverlapArtworkPresent: true,
    }),
    part({
      order: 3,
      partId: 'airship.navigator.forearm',
      role: 'forearm',
      source: [1_204, 124, 195, 332],
      pivot: [1_268, 177],
      destination: [0.494, 0.486, 0.083, 0.25, 0.03],
      boneId: 'bone.navigator.forearm',
      hiddenJointOverlapArtworkPresent: true,
    }),
    part({
      order: 4,
      partId: 'airship.navigator.hand',
      role: 'hand',
      source: [519, 574, 173, 324],
      pivot: [637, 620],
      destination: [0.485, 0.668, 0.072, 0.24, 0.04],
      boneId: 'bone.navigator.hand',
      hiddenJointOverlapArtworkPresent: true,
    }),
    part({
      order: 5,
      partId: 'airship.navigator.spyglass',
      role: 'prop',
      source: [744, 594, 240, 309],
      pivot: [859, 747],
      destination: [0.483, 0.656, 0.109, 0.25, 0.05],
      boneId: 'bone.navigator.prop',
      hiddenJointOverlapArtworkPresent: false,
    }),
    part({
      order: 6,
      partId: 'airship.navigator.hair-lock',
      role: 'hair_follow',
      source: [1_044, 541, 137, 383],
      pivot: [1_111, 572],
      destination: [0.401, 0.15, 0.032, 0.16, 0.02],
      boneId: 'bone.navigator.hair',
      hiddenJointOverlapArtworkPresent: false,
    }),
    part({
      order: 7,
      partId: 'airship.navigator.coat-flap',
      role: 'coat_follow',
      source: [1_228, 518, 238, 433],
      pivot: [1_303, 559],
      destination: [0.31, 0.45, 0.108, 0.35, -0.02],
      boneId: 'bone.navigator.coat',
      hiddenJointOverlapArtworkPresent: false,
    }),
  ] as const satisfies readonly LivingFrameArticulatedPuppetPart[])

export interface LivingFrameAirshipNavigatorArticulatedPuppetSheetInternalTest {
  readonly receipt:
    LivingFrameArticulatedPuppetSheetReceipt
  readonly preparedAlphaAtlas: {
    readonly artifactId:
      'lf.airship-navigator.articulated-puppet-alpha-atlas.v1'
    readonly contentType: 'image/png'
    readonly widthPixels: typeof SOURCE_WIDTH
    readonly heightPixels: typeof SOURCE_HEIGHT
    readonly byteLength: number
    readonly sha256: string
    readonly alphaMode: 'straight'
    readonly colorSpace: 'srgb'
    readonly pngBytes: Buffer
  }
  readonly preparationEvidence: {
    readonly sourceOpaquePixelCount: number
    readonly preparedTransparentPixelCount: number
    readonly preparedPartialAlphaPixelCount: number
    readonly preparedOpaquePixelCount: number
    readonly greenSpillAdjustedPixelCount: number
    readonly partNonTransparentPixelCounts:
      readonly number[]
    readonly allEightReviewedPartsContainPixels: true
  }
}

export function materializeLivingFrameAirshipNavigatorArticulatedPuppetSheetInternalTest():
LivingFrameAirshipNavigatorArticulatedPuppetSheetInternalTest {
  if (arguments.length !== 0) {
    throw new Error(
      'Airship navigator articulated sheet materializer accepts no caller input.',
    )
  }
  const sourceBytes = readFileSync(SOURCE_PATH)
  if (
    sourceBytes.byteLength !== SOURCE_BYTE_LENGTH
    || digestBytes(sourceBytes) !== SOURCE_SHA256
  ) {
    throw new Error(
      'Airship navigator articulated source bytes changed.',
    )
  }
  const decoded =
    decodeExactRgbPngToRgba(
      sourceBytes,
    )
  if (
    decoded.width !== SOURCE_WIDTH
    || decoded.height !== SOURCE_HEIGHT
    || decoded.rgba.byteLength
      !== SOURCE_WIDTH * SOURCE_HEIGHT * 4
  ) {
    throw new Error(
      'Airship navigator articulated source geometry changed.',
    )
  }
  const prepared =
    prepareStraightAlphaAtlas(decoded.rgba)
  const alphaBytes = encodeRgbaPng(
    SOURCE_WIDTH,
    SOURCE_HEIGHT,
    prepared.rgba,
  )
  const partNonTransparentPixelCounts =
    LIVING_FRAME_AIRSHIP_NAVIGATOR_ARTICULATED_PARTS
      .map((item) =>
        countNonTransparentPixels(
          prepared.rgba,
          item.sourceRectPixels,
        ))
  if (
    partNonTransparentPixelCounts.length !== 8
    || partNonTransparentPixelCounts.some(
      (count) => count < 1_000,
    )
  ) {
    throw new Error(
      'Airship navigator articulated part regions are incomplete.',
    )
  }
  const draft =
    buildReceiptDraft()
  const receipt = deepFreeze({
    ...draft,
    receiptDigestSha256:
      sha256AuthorityValue(draft),
  })
  return {
    receipt,
    preparedAlphaAtlas: {
      artifactId:
        'lf.airship-navigator.articulated-puppet-alpha-atlas.v1',
      contentType: 'image/png',
      widthPixels: SOURCE_WIDTH,
      heightPixels: SOURCE_HEIGHT,
      byteLength: alphaBytes.byteLength,
      sha256: digestBytes(alphaBytes),
      alphaMode: 'straight',
      colorSpace: 'srgb',
      pngBytes: alphaBytes,
    },
    preparationEvidence: {
      sourceOpaquePixelCount:
        prepared.sourceOpaquePixelCount,
      preparedTransparentPixelCount:
        prepared.transparentPixelCount,
      preparedPartialAlphaPixelCount:
        prepared.partialAlphaPixelCount,
      preparedOpaquePixelCount:
        prepared.opaquePixelCount,
      greenSpillAdjustedPixelCount:
        prepared.greenSpillAdjustedPixelCount,
      partNonTransparentPixelCounts,
      allEightReviewedPartsContainPixels:
        true,
    },
  }
}

export function verifyLivingFrameArticulatedPuppetSheetReceipt(
  value: unknown,
): value is LivingFrameArticulatedPuppetSheetReceipt {
  if (
    !isRecord(value)
    || value.contractVersion
      !== LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_VERSION
    || value.receiptClass
      !== LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_CLASS
    || typeof value.receiptDigestSha256
      !== 'string'
    || !SHA256.test(
      value.receiptDigestSha256,
    )
  ) return false
  const {
    receiptDigestSha256,
    ...draft
  } = value
  const expectedDraft =
    buildReceiptDraft()
  return receiptDigestSha256
      === sha256AuthorityValue(draft)
    && stableAuthorityStringify(
      value,
    ) === stableAuthorityStringify({
      ...expectedDraft,
      receiptDigestSha256:
        sha256AuthorityValue(
          expectedDraft,
        ),
    })
}

function buildReceiptDraft():
LivingFrameArticulatedPuppetSheetReceiptDraft {
  return {
    contractVersion:
      LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_VERSION,
    receiptClass:
      LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_CLASS,
    sourceArtifact: {
      artifactId:
        'lf.airship-navigator.articulated-puppet-sheet.v1',
      contentType: 'image/png',
      widthPixels: SOURCE_WIDTH,
      heightPixels: SOURCE_HEIGHT,
      byteLength: SOURCE_BYTE_LENGTH,
      sha256: SOURCE_SHA256,
      generationProvenance:
        'openai_imagegen_generated_private_fixture',
      generatedIllustration: true,
      illustrativeNotArchivalEvidence:
        true,
      fictionalCharacter: true,
    },
    decompositionProfile:
      'fixture_specific_reviewed_eight_part_chroma_atlas_v1',
    topology:
      'separated_articulated_limb_parts',
    expectedPartCount: 8,
    parts:
      structuredClone(
        LIVING_FRAME_AIRSHIP_NAVIGATOR_ARTICULATED_PARTS,
      ),
    alphaPreparation: {
      profile:
        'green_chroma_to_straight_alpha_with_edge_decontamination_v1',
      sourceBackgroundRgb:
        [0, 255, 0],
      straightAlphaRequired: true,
      edgeDecontaminationRequired:
        true,
      sourceBytesMayReachRigAdapter:
        false,
      preparedAlphaAtlasOnly: true,
    },
    professionalReadiness: {
      completeBodyAnchorPresent: true,
      headAndNeckSocketSeparated: true,
      upperArmSeparated: true,
      forearmSeparated: true,
      handSeparated: true,
      propSeparated: true,
      exactJointPivotsReviewed: true,
      hiddenJointArtworkReconstructed:
        true,
      protectedFaceMotionPathRequiresRenderedQa:
        true,
      attachmentContinuityRequiresRenderedQa:
        true,
      genericWholeImageDeformationForbidden:
        true,
      controlledGenerationCreatesAnchorPosesNotEveryFrame:
        true,
    },
    authorityBoundary: {
      privateInternalFixtureEvidenceOnly:
        true,
      selectedSceneAuthority: false,
      approvedSnapshotAuthority: false,
      masterTimingAuthority: false,
      workGraphAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      assetPersistenceAuthority: false,
      assetManifestAuthority: false,
      qaApprovalAuthority: false,
      costAuthority: false,
      billingAuthority: false,
      finalCanvasAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
      remotionOwnsFinalCanvas: true,
    },
    containsRawChatPathUrlCredentialCommandEnvironmentOrMediaBytes:
      false,
  }
}

function decodeExactRgbPngToRgba(
  bytes: Buffer,
): {
  readonly width: number
  readonly height: number
  readonly rgba: Buffer
} {
  if (
    bytes.byteLength !== SOURCE_BYTE_LENGTH
    || bytes.subarray(0, 8).toString('hex')
      !== '89504e470d0a1a0a'
  ) {
    throw new Error(
      'Airship navigator source PNG structure is invalid.',
    )
  }
  let offset = 8
  let width = 0
  let height = 0
  let sawIhdr = false
  let sawIend = false
  const idat: Buffer[] = []
  while (offset + 12 <= bytes.byteLength) {
    const length =
      bytes.readUInt32BE(offset)
    const end =
      offset + 12 + length
    if (
      length > SOURCE_BYTE_LENGTH
      || end > bytes.byteLength
    ) {
      throw new Error(
        'Airship navigator source PNG chunk is invalid.',
      )
    }
    const type =
      bytes.toString(
        'ascii',
        offset + 4,
        offset + 8,
      )
    const data =
      bytes.subarray(
        offset + 8,
        offset + 8 + length,
      )
    const expectedCrc =
      bytes.readUInt32BE(
        offset + 8 + length,
      )
    if (
      pngCrc32(
        bytes.subarray(
          offset + 4,
          offset + 8 + length,
        ),
      ) !== expectedCrc
    ) {
      throw new Error(
        'Airship navigator source PNG CRC is invalid.',
      )
    }
    if (type === 'IHDR') {
      if (
        sawIhdr
        || offset !== 8
        || length !== 13
      ) {
        throw new Error(
          'Airship navigator source PNG header is invalid.',
        )
      }
      sawIhdr = true
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (
        width !== SOURCE_WIDTH
        || height !== SOURCE_HEIGHT
        || data[8] !== 8
        || data[9] !== 2
        || data[10] !== 0
        || data[11] !== 0
        || data[12] !== 0
      ) {
        throw new Error(
          'Airship navigator source PNG must remain exact non-interlaced 8-bit RGB.',
        )
      }
    } else if (type === 'IDAT') {
      if (!sawIhdr || sawIend) {
        throw new Error(
          'Airship navigator source PNG data order is invalid.',
        )
      }
      idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      if (
        !sawIhdr
        || sawIend
        || length !== 0
      ) {
        throw new Error(
          'Airship navigator source PNG end marker is invalid.',
        )
      }
      sawIend = true
      offset = end
      break
    } else if (
      type.length !== 4
      || (
        type.charCodeAt(0) >= 65
        && type.charCodeAt(0) <= 90
      )
    ) {
      throw new Error(
        'Airship navigator source PNG contains an unsupported critical chunk.',
      )
    }
    offset = end
  }
  if (
    !sawIhdr
    || !sawIend
    || idat.length < 1
    || offset !== bytes.byteLength
  ) {
    throw new Error(
      'Airship navigator source PNG is incomplete.',
    )
  }
  const bytesPerPixel = 3
  const rowByteLength =
    width * bytesPerPixel
  const expectedInflatedLength =
    (rowByteLength + 1) * height
  let inflated: Buffer
  try {
    inflated = inflateSync(
      Buffer.concat(idat),
      {
        maxOutputLength:
          expectedInflatedLength,
      },
    )
  } catch {
    throw new Error(
      'Airship navigator source PNG data could not be decoded.',
    )
  }
  if (
    inflated.byteLength
      !== expectedInflatedLength
  ) {
    throw new Error(
      'Airship navigator source PNG decoded length changed.',
    )
  }
  const rgb =
    Buffer.alloc(rowByteLength * height)
  let sourceOffset = 0
  for (let row = 0; row < height; row += 1) {
    const filterType =
      inflated[sourceOffset]
    sourceOffset += 1
    if (
      filterType == null
      || filterType > 4
    ) {
      throw new Error(
        'Airship navigator source PNG filter is invalid.',
      )
    }
    const rowOffset =
      row * rowByteLength
    for (
      let column = 0;
      column < rowByteLength;
      column += 1
    ) {
      const raw =
        inflated[sourceOffset + column]
      if (raw == null) {
        throw new Error(
          'Airship navigator source PNG row is incomplete.',
        )
      }
      const left =
        column >= bytesPerPixel
          ? rgb[
            rowOffset
              + column
              - bytesPerPixel
          ] ?? 0
          : 0
      const up =
        row > 0
          ? rgb[
            rowOffset
              + column
              - rowByteLength
          ] ?? 0
          : 0
      const upperLeft =
        row > 0
        && column >= bytesPerPixel
          ? rgb[
            rowOffset
              + column
              - rowByteLength
              - bytesPerPixel
          ] ?? 0
          : 0
      rgb[rowOffset + column] = (
        raw
        + unfilterPngByte(
          filterType,
          left,
          up,
          upperLeft,
        )
      ) & 0xff
    }
    sourceOffset += rowByteLength
  }
  const rgba =
    Buffer.alloc(width * height * 4)
  for (
    let source = 0, target = 0;
    source < rgb.byteLength;
    source += 3, target += 4
  ) {
    rgba[target] = rgb[source]!
    rgba[target + 1] = rgb[source + 1]!
    rgba[target + 2] = rgb[source + 2]!
    rgba[target + 3] = 255
  }
  return {
    width,
    height,
    rgba,
  }
}

function unfilterPngByte(
  filterType: number,
  left: number,
  up: number,
  upperLeft: number,
): number {
  if (filterType === 0) return 0
  if (filterType === 1) return left
  if (filterType === 2) return up
  if (filterType === 3) {
    return Math.floor(
      (left + up) / 2,
    )
  }
  const estimate =
    left + up - upperLeft
  const leftDistance =
    Math.abs(estimate - left)
  const upDistance =
    Math.abs(estimate - up)
  const upperLeftDistance =
    Math.abs(
      estimate - upperLeft,
    )
  if (
    leftDistance <= upDistance
    && leftDistance <=
      upperLeftDistance
  ) return left
  if (
    upDistance <= upperLeftDistance
  ) return up
  return upperLeft
}

function part(input: {
  readonly order: number
  readonly partId: string
  readonly role:
    LivingFrameArticulatedPuppetPart['role']
  readonly source:
    readonly [number, number, number, number]
  readonly pivot:
    readonly [number, number]
  readonly destination:
    readonly [number, number, number, number, number]
  readonly boneId: string
  readonly hiddenJointOverlapArtworkPresent:
    boolean
}): LivingFrameArticulatedPuppetPart {
  const [x, y, width, height] =
    input.source
  const [pivotX, pivotY] =
    input.pivot
  const [
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
    depth,
  ] = input.destination
  const scaledDestination = {
    x: scaleLayoutCoordinate(
      destinationX,
    ),
    y: scaleLayoutCoordinate(
      destinationY,
    ),
    width:
      roundNormalized(
        destinationWidth
        * CHARACTER_LAYOUT_SCALE,
      ),
    height:
      roundNormalized(
        destinationHeight
        * CHARACTER_LAYOUT_SCALE,
      ),
  }
  if (
    input.order < 0
    || !SAFE_ID.test(input.partId)
    || !SAFE_ID.test(input.boneId)
    || x < 0
    || y < 0
    || width < 1
    || height < 1
    || x + width > SOURCE_WIDTH
    || y + height > SOURCE_HEIGHT
    || pivotX < x
    || pivotX >= x + width
    || pivotY < y
    || pivotY >= y + height
    || scaledDestination.x < 0
    || scaledDestination.y < 0
    || scaledDestination.width <= 0
    || scaledDestination.height <= 0
    || scaledDestination.x
      + scaledDestination.width > 1
    || scaledDestination.y
      + scaledDestination.height > 1
    || depth < -1
    || depth > 1
  ) {
    throw new Error(
      'Airship navigator articulated part definition is invalid.',
    )
  }
  return {
    order: input.order,
    partId: input.partId,
    role: input.role,
    sourceRectPixels: {
      x,
      y,
      width,
      height,
    },
    sourcePivotPixels: {
      x: pivotX,
      y: pivotY,
    },
    destinationRectNormalized: {
      x: scaledDestination.x,
      y: scaledDestination.y,
      width:
        scaledDestination.width,
      height:
        scaledDestination.height,
      depth,
    },
    assignedBoneId: input.boneId,
    rigidWeight: 1,
    isolatedOnUniformChroma: true,
    hiddenJointOverlapArtworkPresent:
      input.hiddenJointOverlapArtworkPresent,
    manualRegionAndPivotReviewCompleted:
      true,
  }
}

function scaleLayoutCoordinate(
  value: number,
): number {
  return roundNormalized(
    CHARACTER_LAYOUT_CENTER
      + (
        value
        - CHARACTER_LAYOUT_CENTER
      ) * CHARACTER_LAYOUT_SCALE,
  )
}

function roundNormalized(
  value: number,
): number {
  return Math.round(
    value * 1_000_000,
  ) / 1_000_000
}

function prepareStraightAlphaAtlas(
  source: Uint8Array,
): {
  readonly rgba: Uint8Array
  readonly sourceOpaquePixelCount: number
  readonly transparentPixelCount: number
  readonly partialAlphaPixelCount: number
  readonly opaquePixelCount: number
  readonly greenSpillAdjustedPixelCount: number
} {
  const rgba = Uint8Array.from(source)
  let sourceOpaquePixelCount = 0
  let transparentPixelCount = 0
  let partialAlphaPixelCount = 0
  let opaquePixelCount = 0
  let greenSpillAdjustedPixelCount = 0
  for (
    let offset = 0;
    offset < rgba.byteLength;
    offset += 4
  ) {
    const red = rgba[offset]!
    const green = rgba[offset + 1]!
    const blue = rgba[offset + 2]!
    const sourceAlpha = rgba[offset + 3]!
    if (sourceAlpha > 0) {
      sourceOpaquePixelCount += 1
    }
    const nonGreenMaximum =
      Math.max(red, blue)
    const greenExcess =
      green - nonGreenMaximum
    const dominance =
      clamp01((greenExcess - 24) / 116)
    const brightness =
      clamp01((green - 82) / 150)
    const chromaStrength =
      dominance * brightness
    const alpha =
      Math.round(
        sourceAlpha
        * (1 - chromaStrength),
      )
    rgba[offset + 3] = alpha
    if (alpha === 0) {
      rgba[offset] = 0
      rgba[offset + 1] = 0
      rgba[offset + 2] = 0
      transparentPixelCount += 1
      continue
    }
    if (alpha < 255) {
      partialAlphaPixelCount += 1
      const neutralGreen =
        Math.round(
          (red + blue) / 2 + 18,
        )
      if (green > neutralGreen) {
        rgba[offset + 1] =
          Math.min(green, neutralGreen)
        greenSpillAdjustedPixelCount += 1
      }
    } else {
      opaquePixelCount += 1
    }
  }
  return {
    rgba,
    sourceOpaquePixelCount,
    transparentPixelCount,
    partialAlphaPixelCount,
    opaquePixelCount,
    greenSpillAdjustedPixelCount,
  }
}

function countNonTransparentPixels(
  rgba: Uint8Array,
  rect:
    LivingFrameArticulatedPuppetPart['sourceRectPixels'],
): number {
  let count = 0
  for (
    let y = rect.y;
    y < rect.y + rect.height;
    y += 1
  ) {
    for (
      let x = rect.x;
      x < rect.x + rect.width;
      x += 1
    ) {
      const alpha =
        rgba[(y * SOURCE_WIDTH + x) * 4 + 3]!
      if (alpha >= 8) count += 1
    }
  }
  return count
}

function encodeRgbaPng(
  width: number,
  height: number,
  rgba: Uint8Array,
): Buffer {
  if (
    width < 1
    || height < 1
    || rgba.byteLength !== width * height * 4
  ) {
    throw new Error(
      'Airship navigator RGBA PNG input is invalid.',
    )
  }
  const scanlines = Buffer.alloc(
    height * (width * 4 + 1),
  )
  for (let row = 0; row < height; row += 1) {
    const target =
      row * (width * 4 + 1)
    scanlines[target] = 0
    Buffer.from(
      rgba.buffer,
      rgba.byteOffset
        + row * width * 4,
      width * 4,
    ).copy(scanlines, target + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from(
      '89504e470d0a1a0a',
      'hex',
    ),
    pngChunk('IHDR', ihdr),
    pngChunk(
      'IDAT',
      deflateSync(
        scanlines,
        { level: 9 },
      ),
    ),
    pngChunk(
      'IEND',
      Buffer.alloc(0),
    ),
  ])
}

function pngChunk(
  type: 'IHDR' | 'IDAT' | 'IEND',
  data: Buffer,
): Buffer {
  const typeBytes =
    Buffer.from(type, 'ascii')
  const chunk =
    Buffer.alloc(
      data.byteLength + 12,
    )
  chunk.writeUInt32BE(
    data.byteLength,
    0,
  )
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(
    pngCrc32(
      Buffer.concat([
        typeBytes,
        data,
      ]),
    ),
    data.byteLength + 8,
  )
  return chunk
}

const PNG_CRC32_TABLE =
  Uint32Array.from(
    { length: 256 },
    (_, index) => {
      let value = index
      for (
        let bit = 0;
        bit < 8;
        bit += 1
      ) {
        value = (value & 1) === 1
          ? 0xedb88320
            ^ (value >>> 1)
          : value >>> 1
      }
      return value >>> 0
    },
  )

function pngCrc32(
  bytes: Buffer,
): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value =
      PNG_CRC32_TABLE[
        (value ^ byte) & 0xff
      ]!
      ^ (value >>> 8)
  }
  return (
    value ^ 0xffffffff
  ) >>> 0
}

function clamp01(
  value: number,
): number {
  return Math.min(
    1,
    Math.max(0, value),
  )
}

function digestBytes(
  value: Uint8Array,
): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(
  value: T,
): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const nested of Object.values(
      value as Record<string, unknown>,
    )
  ) {
    deepFreeze(nested)
  }
  return value
}
