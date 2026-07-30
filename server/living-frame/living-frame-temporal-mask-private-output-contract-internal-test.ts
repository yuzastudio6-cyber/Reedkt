import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdtemp,
  readFile,
  rm,
  stat,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  measureLivingFrameTemporalMaskSequence,
  verifyLivingFrameTemporalMaskMeasurementReportDigest,
} from './living-frame-temporal-mask-measurement'

const WIDTH = 160
const HEIGHT = 90
const FPS = 24
const FRAME_COUNT = 48
const FRAME_BYTE_LENGTH = WIDTH * HEIGHT
const STORAGE_ROOT =
  '/tmp/reeditpro-living-frame-temporal-mask-output-contract-internal-test'

export interface LivingFrameTemporalMaskPrivateOutputContractInternalTestReceipt {
  readonly schemaVersion:
    'living-frame-temporal-mask-private-output-contract-internal-test-v1'
  readonly evidenceClass:
    'actual_private_internal_ground_truth_temporal_mask_output_contract'
  readonly source: {
    readonly profile:
      'deterministic_synthetic_speaker_and_contact_object_v1'
    readonly groundTruthNotModelInference: true
    readonly sam2InferenceClaimed: false
    readonly subjectCount: 1
    readonly contactObjectIncluded: true
    readonly widthPixels: 160
    readonly heightPixels: 90
    readonly frameCount: 48
    readonly fpsNumerator: 24
    readonly fpsDenominator: 1
  }
  readonly encodedArtifact: {
    readonly artifactKind: 'mask_sequence'
    readonly contentType: 'video/x-matroska'
    readonly encodingProfile:
      'gray8_ffv1_matroska_mask_sequence_v1'
    readonly codecName: 'ffv1'
    readonly pixelFormat: 'gray'
    readonly widthPixels: 160
    readonly heightPixels: 90
    readonly frameCount: 48
    readonly frameRate: '24/1'
    readonly byteLength: number
    readonly sha256: string
    readonly actualFfmpegEntrypointExecuted: true
    readonly actualFfprobeEntrypointExecuted: true
    readonly losslessFrameReplayVerified: true
  }
  readonly temporalMeasurement: {
    readonly reportDigestSha256: string
    readonly frameSetDigestSha256: string
    readonly findingCodes: readonly []
    readonly pairCount: 47
    readonly minimumBinaryIntersectionOverUnion: number
    readonly maximumNormalizedCentroidShift: number
    readonly maximumBoundaryDisagreementRatio: number
    readonly rawMaskBytesReturned: false
  }
  readonly privateArtifacts: {
    readonly maskSequenceObjectKey: string
    readonly reviewFrameObjectKeys:
      readonly [string, string, string]
    readonly persistedCreateOnly: true
    readonly persistedArtifactReopened: true
    readonly publicUrlCreated: false
  }
  readonly authorityBoundary: {
    readonly privateInternalExecutionAuthority: true
    readonly sam2InferenceAuthority: false
    readonly canonicalWorkGraphAuthority: false
    readonly canonicalAssetManifestAuthority: false
    readonly qaApprovalAuthority: false
    readonly customerBillingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly remainingInternalGate:
    'approved_sam2_checkpoint_and_canonical_temporal_work_discriminator_required'
  readonly receiptDigestSha256: string
}

export async function executeLivingFrameTemporalMaskPrivateOutputContractInternalTest():
Promise<LivingFrameTemporalMaskPrivateOutputContractInternalTestReceipt> {
  if (arguments.length !== 0) {
    throw new Error(
      'Temporal-mask output-contract internal test accepts no caller input.',
    )
  }
  const fixtureRoot = await mkdtemp(join(
    tmpdir(),
    'reeditpro-lf-temporal-mask-output-',
  ))
  const encodedPath = join(fixtureRoot, 'mask-sequence.mkv')
  try {
    const expectedFrames = Array.from(
      { length: FRAME_COUNT },
      (_, frameIndex) => createGroundTruthMask(frameIndex),
    )
    encodeGrayFfv1MaskSequence(
      Buffer.concat(
        expectedFrames.map((frame) => Buffer.from(frame)),
      ),
      encodedPath,
    )
    const encodedBytes = await readFile(encodedPath)
    const encodedStat = await stat(encodedPath)
    if (encodedBytes.byteLength !== encodedStat.size) {
      throw new Error(
        'Temporal-mask output artifact changed during private inspection.',
      )
    }
    const probe = probeGrayFfv1MaskSequence(encodedPath)
    const decoded = decodeGrayMaskSequence(encodedPath)
    if (decoded.byteLength !== FRAME_COUNT * FRAME_BYTE_LENGTH) {
      throw new Error(
        'Temporal-mask decoded output length changed.',
      )
    }
    const decodedFrames = Array.from(
      { length: FRAME_COUNT },
      (_, frameIndex) =>
        new Uint8Array(
          decoded.subarray(
            frameIndex * FRAME_BYTE_LENGTH,
            (frameIndex + 1) * FRAME_BYTE_LENGTH,
          ),
        ),
    )
    for (let frameIndex = 0; frameIndex < FRAME_COUNT; frameIndex += 1) {
      if (
        sha256Bytes(decodedFrames[frameIndex]!)
        !== sha256Bytes(expectedFrames[frameIndex]!)
      ) {
        throw new Error(
          `Temporal-mask FFV1 replay changed frame ${frameIndex}.`,
        )
      }
    }

    const encodedSha256 = sha256Bytes(encodedBytes)
    const measurement =
      measureLivingFrameTemporalMaskSequence({
        sequenceId:
          'living-frame.temporal.private-output-contract',
        width: WIDTH,
        height: HEIGHT,
        frames: decodedFrames.map((alphaBytes, frameIndex) => ({
          frameIndex,
          artifactId:
            `living-frame.temporal.private-output.frame.${frameIndex}`,
          artifactDigestSha256: sha256Bytes(alphaBytes),
          alphaBytes,
        })),
      })
    if (
      !verifyLivingFrameTemporalMaskMeasurementReportDigest(
        measurement,
      )
      || measurement.findingCodes.length !== 0
      || measurement.aggregate.pairCount !== FRAME_COUNT - 1
      || measurement.aggregate.minimumBinaryIntersectionOverUnion == null
      || measurement.aggregate.maximumNormalizedCentroidShift == null
      || measurement.aggregate.maximumBoundaryDisagreementRatio == null
    ) {
      throw new Error(
        `Temporal-mask output failed measurement: ${measurement.findingCodes.join(',')}.`,
      )
    }

    const maskSequenceObjectKey =
      `mask-sequences/${encodedSha256.slice(0, 2)}/${encodedSha256}.mkv`
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: maskSequenceObjectKey,
      content: encodedBytes,
    })
    const reopened =
      await readPrivateFileIfExistsWithinRoot({
        rootPath: STORAGE_ROOT,
        relativePath: maskSequenceObjectKey,
      })
    if (
      !reopened
      || reopened.byteLength !== encodedBytes.byteLength
      || sha256Bytes(reopened) !== encodedSha256
    ) {
      throw new Error(
        'Temporal-mask output changed after create-only persistence.',
      )
    }

    const reviewFrameIndexes = [0, 24, 47] as const
    const reviewFramePngs = reviewFrameIndexes.map((frameIndex) =>
      encodeGrayReviewPng(decodedFrames[frameIndex]!))
    const reviewFrameObjectKeys =
      reviewFramePngs.map((png) => {
        const digest = sha256Bytes(png)
        return `review-frames/${digest.slice(0, 2)}/${digest}.png`
      }) as [string, string, string]
    for (let index = 0; index < reviewFramePngs.length; index += 1) {
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: STORAGE_ROOT,
        relativePath: reviewFrameObjectKeys[index]!,
        content: reviewFramePngs[index]!,
      })
    }

    const draft:
      Omit<
        LivingFrameTemporalMaskPrivateOutputContractInternalTestReceipt,
        'receiptDigestSha256'
      > = {
      schemaVersion:
        'living-frame-temporal-mask-private-output-contract-internal-test-v1',
      evidenceClass:
        'actual_private_internal_ground_truth_temporal_mask_output_contract',
      source: {
        profile:
          'deterministic_synthetic_speaker_and_contact_object_v1',
        groundTruthNotModelInference: true,
        sam2InferenceClaimed: false,
        subjectCount: 1,
        contactObjectIncluded: true,
        widthPixels: WIDTH,
        heightPixels: HEIGHT,
        frameCount: FRAME_COUNT,
        fpsNumerator: FPS,
        fpsDenominator: 1,
      },
      encodedArtifact: {
        artifactKind: 'mask_sequence',
        contentType: 'video/x-matroska',
        encodingProfile:
          'gray8_ffv1_matroska_mask_sequence_v1',
        codecName: probe.codecName,
        pixelFormat: probe.pixelFormat,
        widthPixels: probe.width,
        heightPixels: probe.height,
        frameCount: probe.frameCount,
        frameRate: probe.frameRate,
        byteLength: encodedBytes.byteLength,
        sha256: encodedSha256,
        actualFfmpegEntrypointExecuted: true,
        actualFfprobeEntrypointExecuted: true,
        losslessFrameReplayVerified: true,
      },
      temporalMeasurement: {
        reportDigestSha256:
          measurement.reportDigestSha256,
        frameSetDigestSha256:
          measurement.sequenceIdentity.frameSetDigestSha256,
        findingCodes: [],
        pairCount: measurement.aggregate.pairCount as 47,
        minimumBinaryIntersectionOverUnion:
          measurement.aggregate.minimumBinaryIntersectionOverUnion,
        maximumNormalizedCentroidShift:
          measurement.aggregate.maximumNormalizedCentroidShift,
        maximumBoundaryDisagreementRatio:
          measurement.aggregate.maximumBoundaryDisagreementRatio,
        rawMaskBytesReturned: false,
      },
      privateArtifacts: {
        maskSequenceObjectKey,
        reviewFrameObjectKeys,
        persistedCreateOnly: true,
        persistedArtifactReopened: true,
        publicUrlCreated: false,
      },
      authorityBoundary: {
        privateInternalExecutionAuthority: true,
        sam2InferenceAuthority: false,
        canonicalWorkGraphAuthority: false,
        canonicalAssetManifestAuthority: false,
        qaApprovalAuthority: false,
        customerBillingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      remainingInternalGate:
        'approved_sam2_checkpoint_and_canonical_temporal_work_discriminator_required',
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

function createGroundTruthMask(
  frameIndex: number,
): Uint8Array {
  const mask = new Uint8Array(FRAME_BYTE_LENGTH)
  const shiftX = Math.floor(frameIndex / 12)
  const headCenterX = 96 + shiftX
  const headCenterY = 22
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const inHead =
        ((x - headCenterX) / 9) ** 2
        + ((y - headCenterY) / 10) ** 2 <= 1
      const torsoLeft = 78 + shiftX
        + Math.max(0, Math.floor((y - 35) / 22))
      const torsoRight = 116 + shiftX
        - Math.max(0, Math.floor((y - 35) / 28))
      const inTorso =
        y >= 32
        && y <= 82
        && x >= torsoLeft
        && x <= torsoRight
      const inArm =
        y >= 43
        && y <= 55
        && x >= 108 + shiftX
        && x <= 128 + shiftX
      const inContactObject =
        y >= 47
        && y <= 50
        && x >= 125 + shiftX
        && x <= 149 + shiftX
      if (
        inHead
        || inTorso
        || inArm
        || inContactObject
      ) {
        mask[y * WIDTH + x] = 255
      }
    }
  }
  return mask
}

function encodeGrayFfv1MaskSequence(
  frames: Buffer,
  outputPath: string,
): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'gray',
    '-s',
    `${WIDTH}x${HEIGHT}`,
    '-r',
    String(FPS),
    '-i',
    'pipe:0',
    '-frames:v',
    String(FRAME_COUNT),
    '-an',
    '-c:v',
    'ffv1',
    '-level',
    '3',
    '-g',
    '1',
    '-pix_fmt',
    'gray',
    '-f',
    'matroska',
    '-threads',
    '1',
    '-y',
    outputPath,
  ], {
    input: frames,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Temporal-mask FFV1 encoding failed: ${result.stderr}`,
    )
  }
}

function probeGrayFfv1MaskSequence(path: string): {
  readonly codecName: 'ffv1'
  readonly pixelFormat: 'gray'
  readonly width: 160
  readonly height: 90
  readonly frameCount: 48
  readonly frameRate: '24/1'
} {
  const result = spawnSync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-count_frames',
    '-show_entries',
    'stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames',
    '-of',
    'json',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `Temporal-mask FFprobe failed: ${result.stderr}`,
    )
  }
  const parsed = JSON.parse(result.stdout) as {
    streams?: Array<{
      codec_name?: string
      pix_fmt?: string
      width?: number
      height?: number
      r_frame_rate?: string
      nb_read_frames?: string
    }>
  }
  const stream = parsed.streams?.[0]
  if (
    stream?.codec_name !== 'ffv1'
    || stream.pix_fmt !== 'gray'
    || stream.width !== WIDTH
    || stream.height !== HEIGHT
    || stream.r_frame_rate !== `${FPS}/1`
    || Number(stream.nb_read_frames) !== FRAME_COUNT
  ) {
    throw new Error(
      'Temporal-mask FFV1 media profile changed.',
    )
  }
  return {
    codecName: 'ffv1',
    pixelFormat: 'gray',
    width: WIDTH,
    height: HEIGHT,
    frameCount: FRAME_COUNT,
    frameRate: '24/1',
  }
}

function decodeGrayMaskSequence(path: string): Buffer {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    path,
    '-map',
    '0:v:0',
    '-frames:v',
    String(FRAME_COUNT),
    '-f',
    'rawvideo',
    '-pix_fmt',
    'gray',
    'pipe:1',
  ], {
    encoding: null,
    maxBuffer:
      FRAME_COUNT * FRAME_BYTE_LENGTH + 1024 * 1024,
  })
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout)) {
    throw new Error(
      'Temporal-mask FFV1 decoding failed.',
    )
  }
  return result.stdout
}

function encodeGrayReviewPng(
  grayBytes: Uint8Array,
): Buffer {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'gray',
    '-s',
    `${WIDTH}x${HEIGHT}`,
    '-i',
    'pipe:0',
    '-frames:v',
    '1',
    '-c:v',
    'png',
    '-f',
    'image2pipe',
    'pipe:1',
  ], {
    input: Buffer.from(grayBytes),
    encoding: null,
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout)) {
    throw new Error(
      'Temporal-mask private review frame encoding failed.',
    )
  }
  return result.stdout
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}
