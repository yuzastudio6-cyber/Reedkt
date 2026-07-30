import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_CLASS,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_OPEN_GATES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_STATE,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_VERSION,
  type LivingFrameEnvironmentalParticleFrameObservation,
  type LivingFrameEnvironmentalParticleSequenceObservation,
  type LivingFrameEnvironmentalParticleSequenceObservationAuthority,
  type LivingFrameEnvironmentalParticleSequenceObservationDraft,
  type LivingFrameEnvironmentalParticleSequenceObservationIssue,
  type LivingFrameEnvironmentalParticleSequenceObservationIssueCode,
} from '../../src/types/living-frame-environmental-particle-sequence-observation'
import type {
  LivingFrameEnvironmentalParticleKernelCandidate,
} from '../../src/types/living-frame-environmental-particle-kernel'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_EFFECT_FAMILIES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS,
} from '../../src/types/living-frame-environmental-particle-kernel'
import {
  LIVING_FRAME_ALPHA_FINDING_CODES,
} from '../../src/types/living-frame-alpha-measurement'
import type {
  LivingFrameEnvironmentalParticleOperationMaterialization,
} from '../../src/types/living-frame-environmental-particle-operation-materialization'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  verifyLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from './living-frame-environmental-particle-kernel'
import {
  verifyLivingFrameEnvironmentalParticleOperationMaterialization,
} from './living-frame-environmental-particle-operation-materialization'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const PNG_SIGNATURE = '89504e470d0a1a0a'
const MAX_FRAME_COUNT = 600
const MAX_DIMENSION = 8_192
const MAX_PIXEL_COUNT = 16_777_216
const MAX_FRAME_PNG_BYTES = 64 * 1024 * 1024
const MAX_TOTAL_PNG_BYTES = 512 * 1024 * 1024

const AUTHORITY_BOUNDARY:
  LivingFrameEnvironmentalParticleSequenceObservationAuthority =
  deepFreeze({
    privateSequenceMeasurementAuthority: true,
    runtimeOutputAuthority: false,
    particleKernelAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    motionBudgetAuthority: false,
    operationRegistryAuthority: false,
    toolRegistryAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    artifactAuthority: false,
    assetManifestAuthority: false,
    rendererAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameEnvironmentalParticlePrivateFramePacket {
  readonly order: number
  readonly absoluteFrame: number
  readonly pngBytes: Buffer
  readonly pngByteLength: number
  readonly pngDigestSha256: string
}

export interface LivingFrameEnvironmentalParticlePrivateOutputPacketDraft {
  readonly packetVersion:
    'living-frame-environmental-particle-private-output-packet-v1'
  readonly source:
    'controlled_non_promotable_fixture'
  readonly serverOwnedOutputLocatorId: string
  readonly materializationDigestSha256: string
  readonly privateRequestDigestSha256: string
  readonly kernelCandidateDigestSha256: string
  readonly deterministicStateSequenceDigestSha256: string
  readonly confirmedOutputFrameDigestSha256: string
  readonly masterTimingDigestSha256: string
  readonly toolId: 'pixijs'
  readonly operationId:
    'tool.pixijs.render_living_frame_environmental_particles.v1'
  readonly widthPixels: number
  readonly heightPixels: number
  readonly fps: number
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly logicalBundleCount: 1
  readonly frameImageContentType: 'image/png'
  readonly alphaMode: 'straight_alpha'
  readonly frames:
    readonly LivingFrameEnvironmentalParticlePrivateFramePacket[]
  readonly pixiJsEntrypointExecutionProven: false
  readonly qualifiedRuntimeOutputProven: false
  readonly operationRegistered: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly finalCanvasAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticlePrivateOutputPacket
  extends LivingFrameEnvironmentalParticlePrivateOutputPacketDraft {
  readonly outputPacketDigestSha256: string
}

export interface LivingFrameEnvironmentalParticlePrivateOutputReaderPort {
  readonly readerVersion:
    'living-frame-environmental-particle-private-output-reader-v1'
  readonly readerClass:
    'process_bound_server_owned_particle_output_reader'
  readonly processBound: true
  readonly callerOutputPacketAccepted: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    serverOwnedOutputLocatorId: string,
  ): Promise<unknown>
}

export interface ObserveLivingFrameEnvironmentalParticleSequenceInput {
  readonly observationId: string
  readonly serverOwnedOutputLocatorId: string
  readonly materialization:
    LivingFrameEnvironmentalParticleOperationMaterialization
  readonly kernelCandidate:
    LivingFrameEnvironmentalParticleKernelCandidate
  readonly kernelInput:
    CompileLivingFrameEnvironmentalParticleKernelInput
  readonly reader:
    LivingFrameEnvironmentalParticlePrivateOutputReaderPort | null
}

export class LivingFrameEnvironmentalParticleSequenceObservationError
  extends Error {
  readonly issues:
    readonly LivingFrameEnvironmentalParticleSequenceObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameEnvironmentalParticleSequenceObservationIssue[],
  ) {
    super(
      'Living Frame environmental-particle sequence observation failed.',
    )
    this.name =
      'LivingFrameEnvironmentalParticleSequenceObservationError'
    this.issues = issues
  }
}

export async function observeLivingFrameEnvironmentalParticleSequence(
  input:
    ObserveLivingFrameEnvironmentalParticleSequenceInput,
): Promise<LivingFrameEnvironmentalParticleSequenceObservation> {
  assertInput(input)
  if (
    !verifyLivingFrameEnvironmentalParticleOperationMaterialization(
      input.materialization,
    )
  ) {
    throw invalid(
      'materialization_invalid',
      '$.materialization',
    )
  }
  if (
    !await verifyLivingFrameEnvironmentalParticleKernel(
      input.kernelCandidate,
      input.kernelInput,
    )
  ) {
    throw invalid(
      'kernel_candidate_invalid',
      '$.kernelCandidate',
    )
  }
  assertSourceLineage(input)
  const outputPacketValue =
    await input.reader!.readCurrentByServerOwnedLocator(
      input.serverOwnedOutputLocatorId,
    )
  const outputPacket =
    validatePrivateOutputPacket(
      outputPacketValue,
      input,
    )
  const frameObservations:
    LivingFrameEnvironmentalParticleFrameObservation[] = []
  let totalPngBytes = 0
  for (const frame of outputPacket.frames) {
    totalPngBytes += frame.pngByteLength
    if (totalPngBytes > MAX_TOTAL_PNG_BYTES) {
      throw invalid(
        'frame_set_invalid',
        '$.outputPacket.frames',
      )
    }
    frameObservations.push(
      measureFrame(input, frame),
    )
  }
  const aggregate =
    compileAggregate(frameObservations)
  const draft:
    LivingFrameEnvironmentalParticleSequenceObservationDraft = {
      contractVersion:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_VERSION,
      resultClass:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_CLASS,
      observationState:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_STATE,
      observationId: input.observationId,
      serverOwnedOutputLocatorId:
        input.serverOwnedOutputLocatorId,
      sourceBindings: {
        materializationDigestSha256:
          input.materialization
            .materializationDigestSha256,
        privateRequestDigestSha256:
          input.materialization.requestReceipt
            .privateRequestDigestSha256,
        kernelCandidateDigestSha256:
          input.kernelCandidate
            .kernelCandidateDigestSha256,
        deterministicStateSequenceDigestSha256:
          input.kernelCandidate
            .deterministicStateSequence
            .sequenceDigestSha256,
        confirmedOutputFrameDigestSha256:
          input.kernelCandidate.sourceBindings
            .confirmedOutputFrameDigestSha256,
        masterTimingDigestSha256:
          input.kernelCandidate.sourceBindings
            .masterTimingDigestSha256,
        outputPacketDigestSha256:
          outputPacket.outputPacketDigestSha256,
      },
      sequenceIdentity: {
        toolId: 'pixijs',
        candidateOperationId:
          'tool.pixijs.render_living_frame_environmental_particles.v1',
        profileId:
          input.kernelCandidate.typedProfile.profileId,
        effectFamily:
          input.kernelCandidate.typedProfile.effectFamily,
        widthPixels: outputPacket.widthPixels,
        heightPixels: outputPacket.heightPixels,
        fps: outputPacket.fps,
        startFrame: outputPacket.startFrame,
        endFrameExclusive:
          outputPacket.endFrameExclusive,
        durationFrames:
          outputPacket.endFrameExclusive
          - outputPacket.startFrame,
        frameImageCount: outputPacket.frames.length,
        logicalBundleCount: 1,
        frameImageContentType: 'image/png',
        alphaMode: 'straight_alpha',
      },
      frameObservations,
      aggregateMeasurement: aggregate,
      evidenceDisposition: {
        outputPacketSource:
          'controlled_non_promotable_fixture',
        privateBytesMeasuredInProcess: true,
        byteFreeReceipt: true,
        pixiJsEntrypointExecutionProven: false,
        qualifiedRuntimeOutputProven: false,
        artifactPersisted: false,
        createOnlyPersistenceProven: false,
        canonicalQaApproved: false,
        privateReviewApproved: false,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      openGateCodes:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_OPEN_GATES,
      selectedSceneBound: false,
      canonicalTimingBound: false,
      operationRegistered: false,
      dispatched: false,
      runtimeExecuted: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      rendererMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsRawPixelsOrPngBytes: false,
      containsPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      productionReady: false,
    }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    observationDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameEnvironmentalParticleSequenceObservation(
  value: unknown,
): value is LivingFrameEnvironmentalParticleSequenceObservation {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_VERSION
      || value.resultClass !==
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_CLASS
      || value.observationState !==
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_STATE
      || typeof value.observationDigestSha256 !== 'string'
      || !SHA256.test(value.observationDigestSha256)
    ) return false
    const {
      observationDigestSha256,
      ...draft
    } = value
    assertDraft(
      draft as unknown as
        LivingFrameEnvironmentalParticleSequenceObservationDraft,
    )
    return observationDigestSha256 ===
      sha256AuthorityValue(draft)
  } catch {
    return false
  }
}

export function computeLivingFrameEnvironmentalParticlePrivateOutputPacketDigest(
  packet:
    | LivingFrameEnvironmentalParticlePrivateOutputPacketDraft
    | LivingFrameEnvironmentalParticlePrivateOutputPacket,
): string {
  const {
    outputPacketDigestSha256: ignoredDigest,
    ...packetWithoutDigest
  } = packet as
    LivingFrameEnvironmentalParticlePrivateOutputPacket
  void ignoredDigest
  return sha256AuthorityValue({
    ...packetWithoutDigest,
    frames: packet.frames.map((frame) => ({
      order: frame.order,
      absoluteFrame: frame.absoluteFrame,
      pngByteLength: frame.pngByteLength,
      pngDigestSha256: frame.pngDigestSha256,
    })),
  })
}

function assertInput(
  input:
    ObserveLivingFrameEnvironmentalParticleSequenceInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'observationId',
      'serverOwnedOutputLocatorId',
      'materialization',
      'kernelCandidate',
      'kernelInput',
      'reader',
    ])
    || typeof input.observationId !== 'string'
    || !SAFE_ID.test(input.observationId)
    || typeof input.serverOwnedOutputLocatorId !==
      'string'
    || !SAFE_ID.test(
      input.serverOwnedOutputLocatorId,
    )
    || !isRecord(input.materialization)
    || !isRecord(input.kernelCandidate)
    || !isRecord(input.kernelInput)
  ) {
    throw invalid('input_invalid', '$')
  }
  assertReader(input.reader)
}

function assertReader(
  reader:
    LivingFrameEnvironmentalParticlePrivateOutputReaderPort | null,
): asserts reader is
  LivingFrameEnvironmentalParticlePrivateOutputReaderPort {
  if (
    !reader
    || !isRecord(reader)
    || !hasExactKeys(reader, [
      'readerVersion',
      'readerClass',
      'processBound',
      'callerOutputPacketAccepted',
      'operationAuthority',
      'dispatchAuthority',
      'runtimeAuthority',
      'artifactAuthority',
      'productionReady',
      'readCurrentByServerOwnedLocator',
    ])
    || reader.readerVersion !==
      'living-frame-environmental-particle-private-output-reader-v1'
    || reader.readerClass !==
      'process_bound_server_owned_particle_output_reader'
    || reader.processBound !== true
    || reader.callerOutputPacketAccepted !== false
    || reader.operationAuthority !== false
    || reader.dispatchAuthority !== false
    || reader.runtimeAuthority !== false
    || reader.artifactAuthority !== false
    || reader.productionReady !== false
    || typeof reader.readCurrentByServerOwnedLocator !==
      'function'
  ) {
    throw invalid('reader_invalid', '$.reader')
  }
}

function assertSourceLineage(
  input:
    ObserveLivingFrameEnvironmentalParticleSequenceInput,
): void {
  const materialization = input.materialization
  const kernel = input.kernelCandidate
  if (
    materialization.sourceBindings
      .kernelCandidateDigestSha256 !==
      kernel.kernelCandidateDigestSha256
    || materialization.sourceBindings
      .deterministicStateSequenceDigestSha256 !==
      kernel.deterministicStateSequence
        .sequenceDigestSha256
    || materialization.sourceBindings
      .confirmedOutputFrameDigestSha256 !==
      kernel.sourceBindings
        .confirmedOutputFrameDigestSha256
    || materialization.sourceBindings
      .masterTimingDigestSha256 !==
      kernel.sourceBindings.masterTimingDigestSha256
    || materialization.renderEnvelope.widthPixels !==
      kernel.exactFrameBinding.widthPixels
    || materialization.renderEnvelope.heightPixels !==
      kernel.exactFrameBinding.heightPixels
    || materialization.renderEnvelope.startFrame !==
      kernel.exactFrameBinding.startFrame
    || materialization.renderEnvelope
      .endFrameExclusive !==
      kernel.exactFrameBinding.endFrameExclusive
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.materialization',
    )
  }
}

function validatePrivateOutputPacket(
  value: unknown,
  input:
    ObserveLivingFrameEnvironmentalParticleSequenceInput,
): LivingFrameEnvironmentalParticlePrivateOutputPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetVersion',
      'source',
      'serverOwnedOutputLocatorId',
      'materializationDigestSha256',
      'privateRequestDigestSha256',
      'kernelCandidateDigestSha256',
      'deterministicStateSequenceDigestSha256',
      'confirmedOutputFrameDigestSha256',
      'masterTimingDigestSha256',
      'toolId',
      'operationId',
      'widthPixels',
      'heightPixels',
      'fps',
      'startFrame',
      'endFrameExclusive',
      'logicalBundleCount',
      'frameImageContentType',
      'alphaMode',
      'frames',
      'pixiJsEntrypointExecutionProven',
      'qualifiedRuntimeOutputProven',
      'operationRegistered',
      'dispatchAuthority',
      'runtimeAuthority',
      'artifactAuthority',
      'finalCanvasAuthority',
      'costAuthority',
      'billingAuthority',
      'productionReady',
      'outputPacketDigestSha256',
    ])
  ) {
    throw invalid(
      'output_packet_invalid',
      '$.outputPacket',
    )
  }
  const packet =
    value as unknown as
      LivingFrameEnvironmentalParticlePrivateOutputPacket
  const materialization = input.materialization
  const kernel = input.kernelCandidate
  const duration =
    kernel.exactFrameBinding.durationFrames
  if (
    packet.packetVersion !==
      'living-frame-environmental-particle-private-output-packet-v1'
    || packet.source !==
      'controlled_non_promotable_fixture'
    || packet.serverOwnedOutputLocatorId !==
      input.serverOwnedOutputLocatorId
    || packet.materializationDigestSha256 !==
      materialization.materializationDigestSha256
    || packet.privateRequestDigestSha256 !==
      materialization.requestReceipt
        .privateRequestDigestSha256
    || packet.kernelCandidateDigestSha256 !==
      kernel.kernelCandidateDigestSha256
    || packet.deterministicStateSequenceDigestSha256 !==
      kernel.deterministicStateSequence
        .sequenceDigestSha256
    || packet.confirmedOutputFrameDigestSha256 !==
      kernel.sourceBindings
        .confirmedOutputFrameDigestSha256
    || packet.masterTimingDigestSha256 !==
      kernel.sourceBindings.masterTimingDigestSha256
    || packet.toolId !== 'pixijs'
    || packet.operationId !==
      'tool.pixijs.render_living_frame_environmental_particles.v1'
    || packet.widthPixels !==
      kernel.exactFrameBinding.widthPixels
    || packet.heightPixels !==
      kernel.exactFrameBinding.heightPixels
    || packet.fps !== kernel.exactFrameBinding.fps
    || packet.startFrame !==
      kernel.exactFrameBinding.startFrame
    || packet.endFrameExclusive !==
      kernel.exactFrameBinding.endFrameExclusive
    || packet.logicalBundleCount !== 1
    || packet.frameImageContentType !== 'image/png'
    || packet.alphaMode !== 'straight_alpha'
    || !Array.isArray(packet.frames)
    || packet.frames.length !== duration
    || packet.frames.length < 2
    || packet.frames.length > MAX_FRAME_COUNT
    || packet.pixiJsEntrypointExecutionProven
    || packet.qualifiedRuntimeOutputProven
    || packet.operationRegistered
    || packet.dispatchAuthority
    || packet.runtimeAuthority
    || packet.artifactAuthority
    || packet.finalCanvasAuthority
    || packet.costAuthority
    || packet.billingAuthority
    || packet.productionReady
    || typeof packet.outputPacketDigestSha256 !==
      'string'
    || !SHA256.test(packet.outputPacketDigestSha256)
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.outputPacket',
    )
  }
  for (
    const [
      order,
      frame,
    ] of packet.frames.entries()
  ) {
    if (
      !isRecord(frame)
      || !hasExactKeys(frame, [
        'order',
        'absoluteFrame',
        'pngBytes',
        'pngByteLength',
        'pngDigestSha256',
      ])
      || frame.order !== order
      || frame.absoluteFrame !==
        packet.startFrame + order
      || !Buffer.isBuffer(frame.pngBytes)
      || frame.pngBytes.byteLength < 45
      || frame.pngBytes.byteLength >
        MAX_FRAME_PNG_BYTES
      || frame.pngByteLength !==
        frame.pngBytes.byteLength
      || typeof frame.pngDigestSha256 !== 'string'
      || !SHA256.test(frame.pngDigestSha256)
      || frame.pngDigestSha256 !==
        digestBytes(frame.pngBytes)
    ) {
      throw invalid(
        'frame_set_invalid',
        `$.outputPacket.frames.${order}`,
      )
    }
  }
  if (
    computeLivingFrameEnvironmentalParticlePrivateOutputPacketDigest(
      packet,
    ) !== packet.outputPacketDigestSha256
  ) {
    throw invalid(
      'png_digest_invalid',
      '$.outputPacket.outputPacketDigestSha256',
    )
  }
  return packet
}

function measureFrame(
  input:
    ObserveLivingFrameEnvironmentalParticleSequenceInput,
  frame:
    LivingFrameEnvironmentalParticlePrivateFramePacket,
): LivingFrameEnvironmentalParticleFrameObservation {
  if (
    frame.pngDigestSha256 !== digestBytes(frame.pngBytes)
  ) {
    throw invalid(
      'png_digest_invalid',
      `$.outputPacket.frames.${frame.order}`,
    )
  }
  const decoded =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      frame.pngBytes,
    )
  const kernel = input.kernelCandidate
  if (
    decoded.width !==
      kernel.exactFrameBinding.widthPixels
    || decoded.height !==
      kernel.exactFrameBinding.heightPixels
  ) {
    throw invalid(
      'png_dimension_invalid',
      `$.outputPacket.frames.${frame.order}`,
    )
  }
  const alphaReport =
    measureLivingFrameAlphaArtifact({
      artifactId:
        `lfparticleframe.${sha256AuthorityValue({
          observationId: input.observationId,
          frame: frame.absoluteFrame,
        }).slice(0, 32)}`,
      artifactDigestSha256:
        frame.pngDigestSha256,
      frameIndex: frame.absoluteFrame,
      width: decoded.width,
      height: decoded.height,
      rgbaBytes: decoded.rgba,
      alphaMode: 'straight_alpha',
      alphaExpectation: 'alpha_required',
    })
  if (
    !verifyLivingFrameAlphaMeasurementReportDigest(
      alphaReport,
    )
  ) {
    throw invalid(
      'alpha_measurement_invalid',
      `$.outputPacket.frames.${frame.order}`,
    )
  }
  const expectedActiveParticleCount =
    countExpectedActiveParticles(
      kernel,
      frame.absoluteFrame,
    )
  const fullyTransparentFrameExpected =
    expectedActiveParticleCount === 0
  const fullyTransparentFrameObserved =
    alphaReport.distribution.transparentPixelCount ===
      alphaReport.distribution.pixelCount
  const frameExpectationMatched =
    fullyTransparentFrameExpected
      ? fullyTransparentFrameObserved
      : alphaReport.distribution.alphaCoverageRatio > 0
        && alphaReport.distribution.transparentPixelCount > 0
  if (!frameExpectationMatched) {
    throw invalid(
      'png_alpha_invalid',
      `$.outputPacket.frames.${frame.order}`,
    )
  }
  return {
    order: frame.order,
    absoluteFrame: frame.absoluteFrame,
    framePngDigestSha256: frame.pngDigestSha256,
    framePngByteLength: frame.pngByteLength,
    decodedRgbaDigestSha256:
      digestBytes(decoded.rgba),
    alphaMeasurementReportDigestSha256:
      alphaReport.reportDigestSha256,
    alphaFindingCodes: alphaReport.findingCodes,
    transparentPixelCount:
      alphaReport.distribution.transparentPixelCount,
    semiTransparentPixelCount:
      alphaReport.distribution
        .semiTransparentPixelCount,
    opaquePixelCount:
      alphaReport.distribution.opaquePixelCount,
    alphaCoverageRatio:
      alphaReport.distribution.alphaCoverageRatio,
    borderTransparentRatio:
      alphaReport.distribution.borderTransparentRatio,
    nonTransparentBounds:
      alphaReport.distribution.nonTransparentBounds,
    alphaWeightedCentroid:
      measureLivingFrameEnvironmentalParticleAlphaWeightedCentroid(
        decoded.rgba,
        decoded.width,
        decoded.height,
      ),
    expectedActiveParticleCount,
    fullyTransparentFrameExpected,
    frameExpectationMatched: true,
  }
}

function countExpectedActiveParticles(
  kernel:
    LivingFrameEnvironmentalParticleKernelCandidate,
  absoluteFrame: number,
): number {
  return kernel.deterministicStateSequence.stateTracks
    .filter((track) =>
      track.frameStates.some((state) =>
        state.frame === absoluteFrame
        && state.opacity > 0))
    .length
}

function compileAggregate(
  observations:
    readonly LivingFrameEnvironmentalParticleFrameObservation[],
): LivingFrameEnvironmentalParticleSequenceObservationDraft['aggregateMeasurement'] {
  const first = observations[0]
  const last = observations.at(-1)
  const active =
    observations.filter((frame) =>
      frame.expectedActiveParticleCount > 0)
  const centroids =
    active.map((frame) => frame.alphaWeightedCentroid)
      .filter((centroid) =>
        centroid.xNormalized != null
        && centroid.yNormalized != null)
  const alphaCentroidMovementPresent =
    centroids.some((centroid, order) => {
      const previous = centroids[order - 1]
      return previous != null
        && (
          Math.abs(
            centroid.xNormalized!
            - previous.xNormalized!,
          ) > 0.000001
          || Math.abs(
            centroid.yNormalized!
            - previous.yNormalized!,
          ) > 0.000001
        )
    })
  const uniqueFramePngDigestCount =
    new Set(observations.map((frame) =>
      frame.framePngDigestSha256)).size
  if (
    !first
    || !last
    || !first.fullyTransparentFrameExpected
    || first.alphaCoverageRatio !== 0
    || !last.fullyTransparentFrameExpected
    || last.alphaCoverageRatio !== 0
    || active.length < 2
    || uniqueFramePngDigestCount < 2
    || !alphaCentroidMovementPresent
    || observations.some((frame) =>
      !frame.frameExpectationMatched)
  ) {
    throw invalid(
      'temporal_measurement_invalid',
      '$.frameObservations',
    )
  }
  return {
    exactFrameSetMeasured: true,
    everyPngDecodedFromBytes: true,
    everyFrameExactDimension: true,
    everyFrameRgbaColorType: true,
    everyFrameAlphaMeasured: true,
    everyFrameExpectationMatched: true,
    firstFrameFullyTransparent: true,
    lastFrameFullyTransparent: true,
    activeFrameCount: active.length,
    fullyTransparentFrameCount:
      observations.length - active.length,
    uniqueFramePngDigestCount,
    temporalVariationPresent: true,
    alphaCentroidMovementPresent: true,
    maximumAlphaCoverageRatio:
      Math.max(...observations.map((frame) =>
        frame.alphaCoverageRatio)),
    minimumBorderTransparentRatio:
      Math.min(...observations.map((frame) =>
        frame.borderTransparentRatio)),
    noLoopingClaimedFromPixels: false,
  }
}

export function measureLivingFrameEnvironmentalParticleAlphaWeightedCentroid(
  rgba: Uint8Array,
  width: number,
  height: number,
): {
  readonly xNormalized: number | null
  readonly yNormalized: number | null
} {
  let totalAlpha = 0
  let weightedX = 0
  let weightedY = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha =
        rgba[(y * width + x) * 4 + 3]!
      totalAlpha += alpha
      weightedX += x * alpha
      weightedY += y * alpha
    }
  }
  if (totalAlpha === 0) {
    return {
      xNormalized: null,
      yNormalized: null,
    }
  }
  return {
    xNormalized:
      round(weightedX / totalAlpha / width),
    yNormalized:
      round(weightedY / totalAlpha / height),
  }
}

export function decodeLivingFrameEnvironmentalParticleRgbaPng(
  bytes: Buffer,
): {
  readonly width: number
  readonly height: number
  readonly rgba: Buffer
} {
  if (
    bytes.byteLength < 45
    || bytes.byteLength > MAX_FRAME_PNG_BYTES
    || bytes.subarray(0, 8).toString('hex') !==
      PNG_SIGNATURE
  ) {
    throw invalid(
      'png_structure_invalid',
      '$.outputPacket.frames.pngBytes',
    )
  }
  let offset = 8
  let width = 0
  let height = 0
  let sawIhdr = false
  let sawIend = false
  const idat: Buffer[] = []
  while (offset + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(offset)
    if (
      length > MAX_FRAME_PNG_BYTES
      || offset + 12 + length > bytes.byteLength
    ) {
      throw invalid(
        'png_structure_invalid',
        '$.outputPacket.frames.pngBytes',
      )
    }
    const type =
      bytes.toString('ascii', offset + 4, offset + 8)
    const data =
      bytes.subarray(offset + 8, offset + 8 + length)
    const expectedCrc =
      bytes.readUInt32BE(offset + 8 + length)
    if (
      pngCrc32(
        bytes.subarray(
          offset + 4,
          offset + 8 + length,
        ),
      ) !== expectedCrc
    ) {
      throw invalid(
        'png_structure_invalid',
        '$.outputPacket.frames.pngBytes',
      )
    }
    if (type === 'IHDR') {
      if (sawIhdr || length !== 13 || offset !== 8) {
        throw invalid(
          'png_structure_invalid',
          '$.outputPacket.frames.pngBytes',
        )
      }
      sawIhdr = true
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (
        width < 1
        || height < 1
        || width > MAX_DIMENSION
        || height > MAX_DIMENSION
        || width * height > MAX_PIXEL_COUNT
      ) {
        throw invalid(
          'png_dimension_invalid',
          '$.outputPacket.frames.pngBytes',
        )
      }
      if (
        data[8] !== 8
        || data[9] !== 6
        || data[10] !== 0
        || data[11] !== 0
        || data[12] !== 0
      ) {
        throw invalid(
          'png_alpha_invalid',
          '$.outputPacket.frames.pngBytes',
        )
      }
    } else if (type === 'IDAT') {
      if (!sawIhdr || sawIend) {
        throw invalid(
          'png_structure_invalid',
          '$.outputPacket.frames.pngBytes',
        )
      }
      idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      if (!sawIhdr || sawIend || length !== 0) {
        throw invalid(
          'png_structure_invalid',
          '$.outputPacket.frames.pngBytes',
        )
      }
      sawIend = true
      offset += 12
      break
    } else if (isCriticalPngChunk(type)) {
      throw invalid(
        'png_structure_invalid',
        '$.outputPacket.frames.pngBytes',
      )
    }
    offset += 12 + length
  }
  if (
    !sawIhdr
    || !sawIend
    || idat.length === 0
    || offset !== bytes.byteLength
  ) {
    throw invalid(
      'png_structure_invalid',
      '$.outputPacket.frames.pngBytes',
    )
  }
  const bytesPerPixel = 4
  const rowByteLength = width * bytesPerPixel
  const expectedInflatedLength =
    (rowByteLength + 1) * height
  let inflated: Buffer
  try {
    inflated = inflateSync(Buffer.concat(idat), {
      maxOutputLength: expectedInflatedLength,
    })
  } catch {
    throw invalid(
      'png_structure_invalid',
      '$.outputPacket.frames.pngBytes',
    )
  }
  if (
    inflated.byteLength !== expectedInflatedLength
  ) {
    throw invalid(
      'png_structure_invalid',
      '$.outputPacket.frames.pngBytes',
    )
  }
  const rgba = Buffer.alloc(rowByteLength * height)
  let sourceOffset = 0
  for (let row = 0; row < height; row += 1) {
    const filterType = inflated[sourceOffset]
    sourceOffset += 1
    if (filterType == null || filterType > 4) {
      throw invalid(
        'png_structure_invalid',
        '$.outputPacket.frames.pngBytes',
      )
    }
    const rowOffset = row * rowByteLength
    for (
      let column = 0;
      column < rowByteLength;
      column += 1
    ) {
      const raw = inflated[sourceOffset + column]
      if (raw == null) {
        throw invalid(
          'png_structure_invalid',
          '$.outputPacket.frames.pngBytes',
        )
      }
      const left = column >= bytesPerPixel
        ? rgba[rowOffset + column - bytesPerPixel] ?? 0
        : 0
      const up = row > 0
        ? rgba[
          rowOffset + column - rowByteLength
        ] ?? 0
        : 0
      const upperLeft =
        row > 0 && column >= bytesPerPixel
          ? rgba[
            rowOffset
            + column
            - rowByteLength
            - bytesPerPixel
          ] ?? 0
          : 0
      rgba[rowOffset + column] = (
        raw + unfilterPngByte(
          filterType,
          left,
          up,
          upperLeft,
        )
      ) & 0xff
    }
    sourceOffset += rowByteLength
  }
  return { width, height, rgba }
}

function assertDraft(
  draft:
    LivingFrameEnvironmentalParticleSequenceObservationDraft,
): void {
  if (
    !isExactRecord(draft, [
      'contractVersion',
      'resultClass',
      'observationState',
      'observationId',
      'serverOwnedOutputLocatorId',
      'sourceBindings',
      'sequenceIdentity',
      'frameObservations',
      'aggregateMeasurement',
      'evidenceDisposition',
      'authorityBoundary',
      'openGateCodes',
      'selectedSceneBound',
      'canonicalTimingBound',
      'operationRegistered',
      'dispatched',
      'runtimeExecuted',
      'artifactPersisted',
      'assetManifestMutated',
      'rendererMutated',
      'qaApproved',
      'privateReviewApproved',
      'actualCostCreated',
      'customerCharged',
      'containsRawPixelsOrPngBytes',
      'containsPathsUrlsCredentialsCommandsOrEnvironment',
      'productionReady',
    ])
    || draft.contractVersion !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_VERSION
    || draft.resultClass !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_CLASS
    || draft.observationState !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_STATE
    || !SAFE_ID.test(draft.observationId)
    || !SAFE_ID.test(draft.serverOwnedOutputLocatorId)
    || !isExactRecord(draft.sourceBindings, [
      'materializationDigestSha256',
      'privateRequestDigestSha256',
      'kernelCandidateDigestSha256',
      'deterministicStateSequenceDigestSha256',
      'confirmedOutputFrameDigestSha256',
      'masterTimingDigestSha256',
      'outputPacketDigestSha256',
    ])
    || Object.values(draft.sourceBindings)
      .some((value) =>
        typeof value !== 'string'
        || !SHA256.test(value))
    || !isExactRecord(draft.sequenceIdentity, [
      'toolId',
      'candidateOperationId',
      'profileId',
      'effectFamily',
      'widthPixels',
      'heightPixels',
      'fps',
      'startFrame',
      'endFrameExclusive',
      'durationFrames',
      'frameImageCount',
      'logicalBundleCount',
      'frameImageContentType',
      'alphaMode',
    ])
    || draft.sequenceIdentity.toolId !== 'pixijs'
    || draft.sequenceIdentity.candidateOperationId !==
      'tool.pixijs.render_living_frame_environmental_particles.v1'
    || !LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS
      .some((profileId) =>
        profileId === draft.sequenceIdentity.profileId)
    || !LIVING_FRAME_ENVIRONMENTAL_PARTICLE_EFFECT_FAMILIES
      .some((effectFamily) =>
        effectFamily ===
          draft.sequenceIdentity.effectFamily)
    || !Number.isInteger(
      draft.sequenceIdentity.widthPixels,
    )
    || !Number.isInteger(
      draft.sequenceIdentity.heightPixels,
    )
    || !Number.isInteger(draft.sequenceIdentity.fps)
    || !Number.isInteger(
      draft.sequenceIdentity.startFrame,
    )
    || !Number.isInteger(
      draft.sequenceIdentity.endFrameExclusive,
    )
    || !Number.isInteger(
      draft.sequenceIdentity.durationFrames,
    )
    || !Number.isInteger(
      draft.sequenceIdentity.frameImageCount,
    )
    || draft.sequenceIdentity.widthPixels < 1
    || draft.sequenceIdentity.heightPixels < 1
    || draft.sequenceIdentity.widthPixels > MAX_DIMENSION
    || draft.sequenceIdentity.heightPixels > MAX_DIMENSION
    || draft.sequenceIdentity.widthPixels
      * draft.sequenceIdentity.heightPixels >
      MAX_PIXEL_COUNT
    || draft.sequenceIdentity.fps < 1
    || draft.sequenceIdentity.durationFrames !==
      draft.sequenceIdentity.endFrameExclusive
      - draft.sequenceIdentity.startFrame
    || draft.sequenceIdentity.frameImageCount !==
      draft.sequenceIdentity.durationFrames
    || draft.sequenceIdentity.frameImageCount < 2
    || draft.sequenceIdentity.frameImageCount >
      MAX_FRAME_COUNT
    || draft.sequenceIdentity.logicalBundleCount !== 1
    || draft.sequenceIdentity.frameImageContentType !==
      'image/png'
    || draft.sequenceIdentity.alphaMode !==
      'straight_alpha'
    || !Array.isArray(draft.frameObservations)
    || !isExactRecord(draft.aggregateMeasurement, [
      'exactFrameSetMeasured',
      'everyPngDecodedFromBytes',
      'everyFrameExactDimension',
      'everyFrameRgbaColorType',
      'everyFrameAlphaMeasured',
      'everyFrameExpectationMatched',
      'firstFrameFullyTransparent',
      'lastFrameFullyTransparent',
      'activeFrameCount',
      'fullyTransparentFrameCount',
      'uniqueFramePngDigestCount',
      'temporalVariationPresent',
      'alphaCentroidMovementPresent',
      'maximumAlphaCoverageRatio',
      'minimumBorderTransparentRatio',
      'noLoopingClaimedFromPixels',
    ])
    || !isExactRecord(draft.evidenceDisposition, [
      'outputPacketSource',
      'privateBytesMeasuredInProcess',
      'byteFreeReceipt',
      'pixiJsEntrypointExecutionProven',
      'qualifiedRuntimeOutputProven',
      'artifactPersisted',
      'createOnlyPersistenceProven',
      'canonicalQaApproved',
      'privateReviewApproved',
    ])
    || !isExactRecord(draft.authorityBoundary, [
      'privateSequenceMeasurementAuthority',
      'runtimeOutputAuthority',
      'particleKernelAuthority',
      'selectedSceneAuthority',
      'timingAuthority',
      'motionBudgetAuthority',
      'operationRegistryAuthority',
      'toolRegistryAuthority',
      'workGraphAuthority',
      'queueAuthority',
      'dispatchAuthority',
      'artifactAuthority',
      'assetManifestAuthority',
      'rendererAuthority',
      'qaApprovalAuthority',
      'privateReviewAuthority',
      'costAuthority',
      'billingAuthority',
      'productionAuthority',
    ])
  ) {
    throw invalid('input_invalid', '$')
  }
  const {
    privateSequenceMeasurementAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  if (
    privateSequenceMeasurementAuthority !== true
    || Object.values(delegatedAuthorities)
      .some((value) => value !== false)
    || stableAuthorityStringify(draft.openGateCodes) !==
      stableAuthorityStringify(
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_OPEN_GATES,
      )
    || draft.frameObservations.length !==
      draft.sequenceIdentity.frameImageCount
    || draft.frameObservations.some((frame, order) =>
      !isExactRecord(frame, [
        'order',
        'absoluteFrame',
        'framePngDigestSha256',
        'framePngByteLength',
        'decodedRgbaDigestSha256',
        'alphaMeasurementReportDigestSha256',
        'alphaFindingCodes',
        'transparentPixelCount',
        'semiTransparentPixelCount',
        'opaquePixelCount',
        'alphaCoverageRatio',
        'borderTransparentRatio',
        'nonTransparentBounds',
        'alphaWeightedCentroid',
        'expectedActiveParticleCount',
        'fullyTransparentFrameExpected',
        'frameExpectationMatched',
      ])
      || frame.order !== order
      || frame.absoluteFrame !==
        draft.sequenceIdentity.startFrame + order
      || !SHA256.test(frame.framePngDigestSha256)
      || !SHA256.test(frame.decodedRgbaDigestSha256)
      || !SHA256.test(
        frame.alphaMeasurementReportDigestSha256,
      )
      || !Number.isInteger(frame.framePngByteLength)
      || frame.framePngByteLength < 45
      || frame.framePngByteLength >
        MAX_FRAME_PNG_BYTES
      || !Array.isArray(frame.alphaFindingCodes)
      || frame.alphaFindingCodes.some(
        (findingCode: unknown) =>
        !LIVING_FRAME_ALPHA_FINDING_CODES
          .some((allowed) => allowed === findingCode),
      )
      || new Set(frame.alphaFindingCodes).size !==
        frame.alphaFindingCodes.length
      || !Number.isInteger(frame.transparentPixelCount)
      || frame.transparentPixelCount < 0
      || !Number.isInteger(
        frame.semiTransparentPixelCount,
      )
      || frame.semiTransparentPixelCount < 0
      || !Number.isInteger(frame.opaquePixelCount)
      || frame.opaquePixelCount < 0
      || frame.transparentPixelCount
        + frame.semiTransparentPixelCount
        + frame.opaquePixelCount !==
        draft.sequenceIdentity.widthPixels
        * draft.sequenceIdentity.heightPixels
      || !isUnitInterval(frame.alphaCoverageRatio)
      || !isUnitInterval(frame.borderTransparentRatio)
      || !isAlphaBounds(
        frame.nonTransparentBounds,
        draft.sequenceIdentity.widthPixels,
        draft.sequenceIdentity.heightPixels,
      )
      || !isExactRecord(frame.alphaWeightedCentroid, [
        'xNormalized',
        'yNormalized',
      ])
      || !isNullableUnitInterval(
        frame.alphaWeightedCentroid.xNormalized,
      )
      || !isNullableUnitInterval(
        frame.alphaWeightedCentroid.yNormalized,
      )
      || !Number.isInteger(
        frame.expectedActiveParticleCount,
      )
      || frame.expectedActiveParticleCount < 0
      || typeof frame.fullyTransparentFrameExpected !==
        'boolean'
      || frame.fullyTransparentFrameExpected !==
        (frame.expectedActiveParticleCount === 0)
      || (
        frame.fullyTransparentFrameExpected
        && (
          frame.alphaCoverageRatio !== 0
          || frame.alphaWeightedCentroid.xNormalized !==
            null
          || frame.alphaWeightedCentroid.yNormalized !==
            null
        )
      )
      || (
        !frame.fullyTransparentFrameExpected
        && (
          frame.alphaCoverageRatio <= 0
          || frame.alphaCoverageRatio >= 1
          || frame.alphaWeightedCentroid.xNormalized ===
            null
          || frame.alphaWeightedCentroid.yNormalized ===
            null
        )
      )
      || !frame.frameExpectationMatched)
    || !Number.isInteger(
      draft.aggregateMeasurement.activeFrameCount,
    )
    || !Number.isInteger(
      draft.aggregateMeasurement
        .fullyTransparentFrameCount,
    )
    || !Number.isInteger(
      draft.aggregateMeasurement.uniqueFramePngDigestCount,
    )
    || !isUnitInterval(
      draft.aggregateMeasurement.maximumAlphaCoverageRatio,
    )
    || !isUnitInterval(
      draft.aggregateMeasurement
        .minimumBorderTransparentRatio,
    )
    || stableAuthorityStringify(
      compileAggregate(draft.frameObservations),
    ) !== stableAuthorityStringify(
      draft.aggregateMeasurement,
    )
    || !draft.aggregateMeasurement.exactFrameSetMeasured
    || !draft.aggregateMeasurement
      .everyPngDecodedFromBytes
    || !draft.aggregateMeasurement
      .everyFrameExactDimension
    || !draft.aggregateMeasurement
      .everyFrameRgbaColorType
    || !draft.aggregateMeasurement
      .everyFrameAlphaMeasured
    || !draft.aggregateMeasurement
      .everyFrameExpectationMatched
    || !draft.aggregateMeasurement
      .firstFrameFullyTransparent
    || !draft.aggregateMeasurement
      .lastFrameFullyTransparent
    || !draft.aggregateMeasurement
      .temporalVariationPresent
    || !draft.aggregateMeasurement
      .alphaCentroidMovementPresent
    || draft.aggregateMeasurement
      .noLoopingClaimedFromPixels
    || draft.evidenceDisposition.outputPacketSource !==
      'controlled_non_promotable_fixture'
    || !draft.evidenceDisposition
      .privateBytesMeasuredInProcess
    || !draft.evidenceDisposition.byteFreeReceipt
    || draft.evidenceDisposition
      .pixiJsEntrypointExecutionProven
    || draft.evidenceDisposition
      .qualifiedRuntimeOutputProven
    || draft.evidenceDisposition.artifactPersisted
    || draft.evidenceDisposition
      .createOnlyPersistenceProven
    || draft.evidenceDisposition
      .canonicalQaApproved
    || draft.evidenceDisposition
      .privateReviewApproved
    || draft.selectedSceneBound
    || draft.canonicalTimingBound
    || draft.operationRegistered
    || draft.dispatched
    || draft.runtimeExecuted
    || draft.artifactPersisted
    || draft.assetManifestMutated
    || draft.rendererMutated
    || draft.qaApproved
    || draft.privateReviewApproved
    || draft.actualCostCreated
    || draft.customerCharged
    || draft.containsRawPixelsOrPngBytes
    || draft
      .containsPathsUrlsCredentialsCommandsOrEnvironment
    || draft.productionReady
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
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
    return Math.floor((left + up) / 2)
  }
  return paethPredictor(left, up, upperLeft)
}

function paethPredictor(
  left: number,
  up: number,
  upperLeft: number,
): number {
  const estimate = left + up - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upperLeftDistance =
    Math.abs(estimate - upperLeft)
  if (
    leftDistance <= upDistance
    && leftDistance <= upperLeftDistance
  ) return left
  if (upDistance <= upperLeftDistance) return up
  return upperLeft
}

function isCriticalPngChunk(type: string): boolean {
  return type.length !== 4
    || (
      type.charCodeAt(0) >= 65
      && type.charCodeAt(0) <= 90
    )
}

const PNG_CRC32_TABLE = (() => {
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
})()

function pngCrc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value =
      PNG_CRC32_TABLE[(value ^ byte) & 0xff]!
      ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function digestBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
}

function isNullableUnitInterval(
  value: unknown,
): value is number | null {
  return value === null || isUnitInterval(value)
}

function isAlphaBounds(
  value: unknown,
  frameWidth: number,
  frameHeight: number,
): boolean {
  if (value === null) return true
  if (
    !isExactRecord(value, [
      'x',
      'y',
      'width',
      'height',
      'touchesTop',
      'touchesRight',
      'touchesBottom',
      'touchesLeft',
    ])
  ) return false
  const bounds = value as {
    readonly x: unknown
    readonly y: unknown
    readonly width: unknown
    readonly height: unknown
    readonly touchesTop: unknown
    readonly touchesRight: unknown
    readonly touchesBottom: unknown
    readonly touchesLeft: unknown
  }
  return Number.isInteger(bounds.x)
    && Number.isInteger(bounds.y)
    && Number.isInteger(bounds.width)
    && Number.isInteger(bounds.height)
    && (bounds.x as number) >= 0
    && (bounds.y as number) >= 0
    && (bounds.width as number) >= 1
    && (bounds.height as number) >= 1
    && (bounds.x as number)
      + (bounds.width as number) <= frameWidth
    && (bounds.y as number)
      + (bounds.height as number) <= frameHeight
    && bounds.touchesTop ===
      ((bounds.y as number) === 0)
    && bounds.touchesRight ===
      (
        (bounds.x as number)
        + (bounds.width as number) === frameWidth
      )
    && bounds.touchesBottom ===
      (
        (bounds.y as number)
        + (bounds.height as number) === frameHeight
      )
    && bounds.touchesLeft ===
      ((bounds.x as number) === 0)
}

function isExactRecord(
  value: unknown,
  keys: readonly string[],
): boolean {
  return isRecord(value) && hasExactKeys(value, keys)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|') ===
    [...keys].sort().join('|')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function invalid(
  code:
    LivingFrameEnvironmentalParticleSequenceObservationIssueCode,
  path: string,
): LivingFrameEnvironmentalParticleSequenceObservationError {
  return new LivingFrameEnvironmentalParticleSequenceObservationError([
    { code, path },
  ])
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
  }
  return value
}
