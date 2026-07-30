import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

import {
  createLivingFrameVisualContinuityFixtures,
} from '../../src/lib/living-frame/living-frame-visual-continuity-fixtures'
import type {
  LivingFrameEnvironmentalParticleKernelCandidate,
  LivingFrameEnvironmentalParticleProfileId,
} from '../../src/types/living-frame-environmental-particle-kernel'
import type {
  LivingFrameEnvironmentalParticleOperationMaterialization,
} from '../../src/types/living-frame-environmental-particle-operation-materialization'
import {
  createLivingFrameEnvironmentalParticleOperationMaterialization,
} from '../living-frame/living-frame-environmental-particle-operation-materialization'
import {
  compileLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from '../living-frame/living-frame-environmental-particle-kernel'
import {
  computeLivingFrameEnvironmentalParticlePrivateOutputPacketDigest,
  LivingFrameEnvironmentalParticleSequenceObservationError,
  observeLivingFrameEnvironmentalParticleSequence,
  verifyLivingFrameEnvironmentalParticleSequenceObservation,
  type LivingFrameEnvironmentalParticlePrivateOutputPacket,
  type LivingFrameEnvironmentalParticlePrivateOutputPacketDraft,
  type LivingFrameEnvironmentalParticlePrivateOutputReaderPort,
  type ObserveLivingFrameEnvironmentalParticleSequenceInput,
} from '../living-frame/living-frame-environmental-particle-sequence-observation'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const WIDTH = 3_840
const HEIGHT = 2_160
const START_FRAME = 20
const END_FRAME_EXCLUSIVE = 28
const OUTPUT_LOCATOR =
  'private.living-frame.particle-sequence.fixture-v1'
const CRC32_TABLE = createCrc32Table()

const fixtures =
  await createLivingFrameVisualContinuityFixtures()
const kernelInput = inputFor(
  'restrained_airborne_dust_settle_v1',
  'primary',
)
const kernel =
  await compileLivingFrameEnvironmentalParticleKernel(
    kernelInput,
  )
const materializationResult =
  await createLivingFrameEnvironmentalParticleOperationMaterialization({
    materializationCandidateId:
      'living-frame.environmental-particle-observation.primary',
    kernelCandidate: kernel,
    kernelInput,
  })
const materialization = materializationResult.receipt
const packet = buildPacket({
  kernel,
  materialization,
  outputLocator: OUTPUT_LOCATOR,
})
const observationInput = inputWith({
  packet,
  kernel,
  kernelInput,
  materialization,
})
const observation =
  await observeLivingFrameEnvironmentalParticleSequence(
    observationInput,
  )

assert.equal(
  verifyLivingFrameEnvironmentalParticleSequenceObservation(
    observation,
  ),
  true,
)
assert.equal(
  observation.sequenceIdentity.widthPixels,
  WIDTH,
)
assert.equal(
  observation.sequenceIdentity.heightPixels,
  HEIGHT,
)
assert.equal(
  observation.sequenceIdentity.frameImageCount,
  END_FRAME_EXCLUSIVE - START_FRAME,
)
assert.equal(
  observation.frameObservations[0]?.alphaCoverageRatio,
  0,
)
assert.equal(
  observation.frameObservations.at(-1)
    ?.alphaCoverageRatio,
  0,
)
assert.ok(
  observation.aggregateMeasurement.activeFrameCount >= 2,
)
assert.equal(
  observation.aggregateMeasurement
    .temporalVariationPresent,
  true,
)
assert.equal(
  observation.aggregateMeasurement
    .alphaCentroidMovementPresent,
  true,
)
assert.equal(
  observation.aggregateMeasurement
    .noLoopingClaimedFromPixels,
  false,
)
assert.equal(
  observation.evidenceDisposition.outputPacketSource,
  'controlled_non_promotable_fixture',
)
assert.equal(
  observation.evidenceDisposition
    .pixiJsEntrypointExecutionProven,
  false,
)
assert.equal(
  observation.evidenceDisposition
    .qualifiedRuntimeOutputProven,
  false,
)
assert.equal(observation.runtimeExecuted, false)
assert.equal(observation.artifactPersisted, false)
assert.equal(observation.qaApproved, false)
assert.equal(observation.actualCostCreated, false)
assert.equal(observation.customerCharged, false)
assert.equal(observation.productionReady, false)

const serializedObservation = JSON.stringify(observation)
for (const forbiddenValue of [
  'pngBytes',
  'rgbaBytes',
  'bytesBase64',
  '/Users/',
  'https://',
  'OPENAI_API_KEY',
  'stateTracks',
]) {
  assert.equal(
    serializedObservation.includes(forbiddenValue),
    false,
  )
}

let adversarialAssertions = 0

await expectIssue(
  {
    ...observationInput,
    reader: null,
  },
  'reader_invalid',
)
adversarialAssertions += 1

const leakingReader = {
  ...readerFor(packet),
  callerPath: '/private/output.png',
}
await expectIssue(
  {
    ...observationInput,
    reader: leakingReader,
  },
  'reader_invalid',
)
adversarialAssertions += 1

await expectIssue(
  {
    ...observationInput,
    callerPrompt: 'render something else',
  } as unknown as
    ObserveLivingFrameEnvironmentalParticleSequenceInput,
  'input_invalid',
)
adversarialAssertions += 1

await expectIssue(
  inputWith({
    packet: replacePacket(packet, {
      serverOwnedOutputLocatorId:
        'private.cross-work-item.locator',
    }),
    kernel,
    kernelInput,
    materialization,
  }),
  'source_lineage_mismatch',
)
adversarialAssertions += 1

const omittedFrames = packet.frames.slice(0, -1)
await expectIssue(
  inputWith({
    packet: replacePacket(packet, {
      frames: omittedFrames,
    }),
    kernel,
    kernelInput,
    materialization,
  }),
  'source_lineage_mismatch',
)
adversarialAssertions += 1

const squarePng = encodeRgbaPng(
  1_024,
  1_024,
  Buffer.alloc(1_024 * 1_024 * 4),
)
await expectIssue(
  inputWith({
    packet: replaceFrameBytes(packet, 0, squarePng),
    kernel,
    kernelInput,
    materialization,
  }),
  'png_dimension_invalid',
)
adversarialAssertions += 1

const rgbPng = encodeRgbPng(
  WIDTH,
  HEIGHT,
  Buffer.alloc(WIDTH * HEIGHT * 3),
)
await expectIssue(
  inputWith({
    packet: replaceFrameBytes(packet, 0, rgbPng),
    kernel,
    kernelInput,
    materialization,
  }),
  'png_alpha_invalid',
)
adversarialAssertions += 1

const activeFrameOrder =
  observation.frameObservations.find(
    (frame) => frame.expectedActiveParticleCount > 0,
  )!.order
const opaqueRgba =
  Buffer.alloc(WIDTH * HEIGHT * 4, 255)
await expectIssue(
  inputWith({
    packet: replaceFrameBytes(
      packet,
      activeFrameOrder,
      encodeRgbaPng(WIDTH, HEIGHT, opaqueRgba),
    ),
    kernel,
    kernelInput,
    materialization,
  }),
  'png_alpha_invalid',
)
adversarialAssertions += 1

const corruptPng =
  Buffer.from(packet.frames[activeFrameOrder]!.pngBytes)
corruptPng[corruptPng.byteLength - 5] =
  corruptPng[corruptPng.byteLength - 5]! ^ 0xff
await expectIssue(
  inputWith({
    packet: replaceFrameBytes(
      packet,
      activeFrameOrder,
      corruptPng,
    ),
    kernel,
    kernelInput,
    materialization,
  }),
  'png_structure_invalid',
)
adversarialAssertions += 1

await expectIssue(
  inputWith({
    packet: replacePacket(packet, {
      finalCanvasAuthority: true,
    } as unknown as
      Partial<LivingFrameEnvironmentalParticlePrivateOutputPacketDraft>),
    kernel,
    kernelInput,
    materialization,
  }),
  'source_lineage_mismatch',
)
adversarialAssertions += 1

await expectIssue(
  inputWith({
    packet: replacePacket(packet, {
      operationRegistered: true,
    } as unknown as
      Partial<LivingFrameEnvironmentalParticlePrivateOutputPacketDraft>),
    kernel,
    kernelInput,
    materialization,
  }),
  'source_lineage_mismatch',
)
adversarialAssertions += 1

const leakingPacket = {
  ...packet,
  rawPrompt: 'caller-controlled prompt',
}
await expectIssue(
  inputWith({
    packet: leakingPacket,
    kernel,
    kernelInput,
    materialization,
  }),
  'output_packet_invalid',
)
adversarialAssertions += 1

const alternateKernelInput = inputFor(
  'restrained_airborne_dust_settle_v1',
  'alternate',
)
const alternateKernel =
  await compileLivingFrameEnvironmentalParticleKernel(
    alternateKernelInput,
  )
const alternateMaterialization =
  (
    await createLivingFrameEnvironmentalParticleOperationMaterialization({
      materializationCandidateId:
        'living-frame.environmental-particle-observation.alternate',
      kernelCandidate: alternateKernel,
      kernelInput: alternateKernelInput,
    })
  ).receipt
await expectIssue(
  {
    ...observationInput,
    kernelCandidate: alternateKernel,
    kernelInput: alternateKernelInput,
    materialization: alternateMaterialization,
  },
  'source_lineage_mismatch',
)
adversarialAssertions += 1

const forgedObservation =
  structuredClone(observation) as unknown as {
    authorityBoundary: {
      productionAuthority: boolean
    }
    observationDigestSha256: string
  }
forgedObservation.authorityBoundary
  .productionAuthority = true
const {
  observationDigestSha256: _discardedDigest,
  ...forgedObservationDraft
} = forgedObservation
void _discardedDigest
forgedObservation.observationDigestSha256 =
  sha256AuthorityValue(forgedObservationDraft)
assert.equal(
  verifyLivingFrameEnvironmentalParticleSequenceObservation(
    forgedObservation,
  ),
  false,
)
adversarialAssertions += 1

const extendedObservationBase =
  structuredClone(observation)
const {
  observationDigestSha256: _oldExtendedDigest,
  ...extendedObservationWithoutDigest
} = extendedObservationBase
void _oldExtendedDigest
const extendedDraft = {
  ...extendedObservationWithoutDigest,
  rawBytes: 'forbidden',
}
const extendedObservation = {
  ...extendedDraft,
  observationDigestSha256:
    sha256AuthorityValue(extendedDraft),
}
assert.equal(
  verifyLivingFrameEnvironmentalParticleSequenceObservation(
    extendedObservation,
  ),
  false,
)
adversarialAssertions += 1

const nestedLeakBase =
  structuredClone(observation) as unknown as {
    frameObservations: Array<{
      nonTransparentBounds:
        Record<string, unknown> | null
    }>
    observationDigestSha256: string
  }
const nestedLeakFrame =
  nestedLeakBase.frameObservations.find(
    (frame) => frame.nonTransparentBounds !== null,
  )!
nestedLeakFrame.nonTransparentBounds!.rawPrompt =
  'forbidden'
const {
  observationDigestSha256: _nestedLeakDigest,
  ...nestedLeakDraft
} = nestedLeakBase
void _nestedLeakDigest
nestedLeakBase.observationDigestSha256 =
  sha256AuthorityValue(nestedLeakDraft)
assert.equal(
  verifyLivingFrameEnvironmentalParticleSequenceObservation(
    nestedLeakBase,
  ),
  false,
)
adversarialAssertions += 1

const serverSource = readFileSync(
  fileURLToPath(new URL(
    '../living-frame/living-frame-environmental-particle-sequence-observation.ts',
    import.meta.url,
  )),
  'utf8',
).toLowerCase()
for (const forbiddenSubjectTerm of [
  'helicopter',
  'musashi',
  'hormuz',
]) {
  assert.equal(
    serverSource.includes(forbiddenSubjectTerm),
    false,
  )
}
adversarialAssertions += 1

assert.equal(adversarialAssertions, 17)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    contractVersion: observation.contractVersion,
    evidenceSource:
      observation.evidenceDisposition.outputPacketSource,
    widthPixels:
      observation.sequenceIdentity.widthPixels,
    heightPixels:
      observation.sequenceIdentity.heightPixels,
    frameImageCount:
      observation.sequenceIdentity.frameImageCount,
    activeFrameCount:
      observation.aggregateMeasurement.activeFrameCount,
    uniqueFramePngDigestCount:
      observation.aggregateMeasurement
        .uniqueFramePngDigestCount,
    firstFrameFullyTransparent:
      observation.aggregateMeasurement
        .firstFrameFullyTransparent,
    lastFrameFullyTransparent:
      observation.aggregateMeasurement
        .lastFrameFullyTransparent,
    temporalVariationPresent:
      observation.aggregateMeasurement
        .temporalVariationPresent,
    alphaCentroidMovementPresent:
      observation.aggregateMeasurement
        .alphaCentroidMovementPresent,
    pixiJsEntrypointExecutionProven:
      observation.evidenceDisposition
        .pixiJsEntrypointExecutionProven,
    operationRegistered: observation.operationRegistered,
    runtimeExecuted: observation.runtimeExecuted,
    artifactPersisted: observation.artifactPersisted,
    qaApproved: observation.qaApproved,
    productionReady: observation.productionReady,
    adversarialAssertions,
  })}\n`,
)

function inputFor(
  profileId:
    LivingFrameEnvironmentalParticleProfileId,
  suffix: string,
): CompileLivingFrameEnvironmentalParticleKernelInput {
  const visualContinuityPack = fixtures.musashi
  const sceneDesignSheet =
    visualContinuityPack.sceneDesignSheets[0]!
  return {
    kernelCandidateId:
      `living-frame.environmental-particle-observation.${suffix}`,
    profileId,
    sceneDesignSheetId:
      sceneDesignSheet.sceneDesignSheetId,
    environmentSheetId:
      sceneDesignSheet.environmentSheetIds[0]!,
    visualContinuityPack,
    frameBinding: {
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      fps: 30,
      startFrame: START_FRAME,
      endFrameExclusive: END_FRAME_EXCLUSIVE,
      emitterRect: {
        x: 0.05,
        y: 0.52,
        width: 0.9,
        height: 0.42,
      },
      anchorPoint: { x: 0.5, y: 0.72 },
      confirmedOutputFrameDigestSha256:
        sha256AuthorityValue(
          `confirmed-output-frame-${suffix}`,
        ),
      masterTimingDigestSha256:
        sha256AuthorityValue(
          `master-timing-${suffix}`,
        ),
      serverSeedDigestSha256:
        sha256AuthorityValue(`server-seed-${suffix}`),
      confirmedOutputFrameRevalidationRequired: true,
      masterTimingRevalidationRequired: true,
    },
  }
}

function inputWith(input: {
  readonly packet: unknown
  readonly kernel:
    LivingFrameEnvironmentalParticleKernelCandidate
  readonly kernelInput:
    CompileLivingFrameEnvironmentalParticleKernelInput
  readonly materialization:
    LivingFrameEnvironmentalParticleOperationMaterialization
}): ObserveLivingFrameEnvironmentalParticleSequenceInput {
  return {
    observationId:
      'living-frame.particle-sequence-observation.fixture-v1',
    serverOwnedOutputLocatorId: OUTPUT_LOCATOR,
    materialization: input.materialization,
    kernelCandidate: input.kernel,
    kernelInput: input.kernelInput,
    reader: readerFor(input.packet),
  }
}

function readerFor(
  packet: unknown,
): LivingFrameEnvironmentalParticlePrivateOutputReaderPort {
  return {
    readerVersion:
      'living-frame-environmental-particle-private-output-reader-v1',
    readerClass:
      'process_bound_server_owned_particle_output_reader',
    processBound: true,
    callerOutputPacketAccepted: false,
    operationAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactAuthority: false,
    productionReady: false,
    async readCurrentByServerOwnedLocator(locatorId) {
      return locatorId === OUTPUT_LOCATOR ? packet : null
    },
  }
}

function buildPacket(input: {
  readonly kernel:
    LivingFrameEnvironmentalParticleKernelCandidate
  readonly materialization:
    LivingFrameEnvironmentalParticleOperationMaterialization
  readonly outputLocator: string
}): LivingFrameEnvironmentalParticlePrivateOutputPacket {
  const frames = Array.from(
    {
      length:
        input.kernel.exactFrameBinding.durationFrames,
    },
    (_, order) => {
      const absoluteFrame =
        input.kernel.exactFrameBinding.startFrame + order
      const rgba = rasterizeKernelFrame(
        input.kernel,
        absoluteFrame,
      )
      const pngBytes = encodeRgbaPng(
        input.kernel.exactFrameBinding.widthPixels,
        input.kernel.exactFrameBinding.heightPixels,
        rgba,
      )
      return {
        order,
        absoluteFrame,
        pngBytes,
        pngByteLength: pngBytes.byteLength,
        pngDigestSha256: sha256Bytes(pngBytes),
      }
    },
  )
  const draft:
    LivingFrameEnvironmentalParticlePrivateOutputPacketDraft = {
      packetVersion:
        'living-frame-environmental-particle-private-output-packet-v1',
      source: 'controlled_non_promotable_fixture',
      serverOwnedOutputLocatorId: input.outputLocator,
      materializationDigestSha256:
        input.materialization.materializationDigestSha256,
      privateRequestDigestSha256:
        input.materialization.requestReceipt
          .privateRequestDigestSha256,
      kernelCandidateDigestSha256:
        input.kernel.kernelCandidateDigestSha256,
      deterministicStateSequenceDigestSha256:
        input.kernel.deterministicStateSequence
          .sequenceDigestSha256,
      confirmedOutputFrameDigestSha256:
        input.kernel.sourceBindings
          .confirmedOutputFrameDigestSha256,
      masterTimingDigestSha256:
        input.kernel.sourceBindings
          .masterTimingDigestSha256,
      toolId: 'pixijs',
      operationId:
        'tool.pixijs.render_living_frame_environmental_particles.v1',
      widthPixels:
        input.kernel.exactFrameBinding.widthPixels,
      heightPixels:
        input.kernel.exactFrameBinding.heightPixels,
      fps: input.kernel.exactFrameBinding.fps,
      startFrame:
        input.kernel.exactFrameBinding.startFrame,
      endFrameExclusive:
        input.kernel.exactFrameBinding.endFrameExclusive,
      logicalBundleCount: 1,
      frameImageContentType: 'image/png',
      alphaMode: 'straight_alpha',
      frames,
      pixiJsEntrypointExecutionProven: false,
      qualifiedRuntimeOutputProven: false,
      operationRegistered: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      artifactAuthority: false,
      finalCanvasAuthority: false,
      costAuthority: false,
      billingAuthority: false,
      productionReady: false,
    }
  return withPacketDigest(draft)
}

function replacePacket(
  packet:
    LivingFrameEnvironmentalParticlePrivateOutputPacket,
  replacement:
    Partial<LivingFrameEnvironmentalParticlePrivateOutputPacketDraft>,
): LivingFrameEnvironmentalParticlePrivateOutputPacket {
  const {
    outputPacketDigestSha256: _oldDigest,
    ...draft
  } = packet
  void _oldDigest
  return withPacketDigest({
    ...draft,
    ...replacement,
  })
}

function replaceFrameBytes(
  packet:
    LivingFrameEnvironmentalParticlePrivateOutputPacket,
  order: number,
  pngBytes: Buffer,
): LivingFrameEnvironmentalParticlePrivateOutputPacket {
  const frames = packet.frames.map((frame) =>
    frame.order === order
      ? {
        ...frame,
        pngBytes,
        pngByteLength: pngBytes.byteLength,
        pngDigestSha256: sha256Bytes(pngBytes),
      }
      : frame)
  return replacePacket(packet, { frames })
}

function withPacketDigest(
  draft:
    LivingFrameEnvironmentalParticlePrivateOutputPacketDraft,
): LivingFrameEnvironmentalParticlePrivateOutputPacket {
  return {
    ...draft,
    outputPacketDigestSha256:
      computeLivingFrameEnvironmentalParticlePrivateOutputPacketDigest(
        draft,
      ),
  }
}

function rasterizeKernelFrame(
  kernel:
    LivingFrameEnvironmentalParticleKernelCandidate,
  absoluteFrame: number,
): Buffer {
  const width = kernel.exactFrameBinding.widthPixels
  const height = kernel.exactFrameBinding.heightPixels
  const rgba = Buffer.alloc(width * height * 4)
  const color = parseHexColor(
    kernel.typedProfile.appearance.colorHex,
  )
  for (
    const track of
      kernel.deterministicStateSequence.stateTracks
  ) {
    const state = track.frameStates.find(
      (candidate) =>
        candidate.frame === absoluteFrame,
    )
    if (!state || state.opacity <= 0) continue
    const centerX = Math.round(
      state.position.x * (width - 1),
    )
    const centerY = Math.round(
      state.position.y * (height - 1),
    )
    const radius = Math.max(
      2,
      Math.min(
        10,
        Math.round(
          state.radiusNormalized
          * Math.min(width, height),
        ),
      ),
    )
    const alpha = Math.max(
      1,
      Math.min(254, Math.round(state.opacity * 255)),
    )
    for (
      let y = Math.max(1, centerY - radius);
      y <= Math.min(height - 2, centerY + radius);
      y += 1
    ) {
      for (
        let x = Math.max(1, centerX - radius);
        x <= Math.min(width - 2, centerX + radius);
        x += 1
      ) {
        const offset = (y * width + x) * 4
        rgba[offset] = color[0]
        rgba[offset + 1] = color[1]
        rgba[offset + 2] = color[2]
        rgba[offset + 3] =
          Math.max(rgba[offset + 3]!, alpha)
      }
    }
  }
  return rgba
}

function parseHexColor(
  value: string,
): readonly [number, number, number] {
  assert.match(value, /^#[a-f0-9]{6}$/iu)
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}

function encodeRgbaPng(
  width: number,
  height: number,
  rgba: Buffer,
): Buffer {
  assert.equal(rgba.byteLength, width * height * 4)
  return encodePng(width, height, 6, rgba, 4)
}

function encodeRgbPng(
  width: number,
  height: number,
  rgb: Buffer,
): Buffer {
  assert.equal(rgb.byteLength, width * height * 3)
  return encodePng(width, height, 2, rgb, 3)
}

function encodePng(
  width: number,
  height: number,
  colorType: 2 | 6,
  pixels: Buffer,
  channels: 3 | 4,
): Buffer {
  const rowByteLength = width * channels
  const scanlines =
    Buffer.alloc((rowByteLength + 1) * height)
  for (let row = 0; row < height; row += 1) {
    const targetOffset = row * (rowByteLength + 1)
    scanlines[targetOffset] = 0
    pixels.copy(
      scanlines,
      targetOffset + 1,
      row * rowByteLength,
      (row + 1) * rowByteLength,
    )
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = colorType
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(
  type: string,
  data: Buffer,
): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const output = Buffer.alloc(12 + data.byteLength)
  output.writeUInt32BE(data.byteLength, 0)
  typeBytes.copy(output, 4)
  data.copy(output, 8)
  output.writeUInt32BE(
    crc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  )
  return output
}

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1
    }
    table[index] = value >>> 0
  }
  return table
}

function crc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value =
      CRC32_TABLE[(value ^ byte) & 0xff]!
      ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function expectIssue(
  input:
    ObserveLivingFrameEnvironmentalParticleSequenceInput,
  code: string,
): Promise<void> {
  await assert.rejects(
    observeLivingFrameEnvironmentalParticleSequence(input),
    (error: unknown) =>
      error instanceof
        LivingFrameEnvironmentalParticleSequenceObservationError
      && error.issues.some((issue) =>
        issue.code === code),
  )
}
