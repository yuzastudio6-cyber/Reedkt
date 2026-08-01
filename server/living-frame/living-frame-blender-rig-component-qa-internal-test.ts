import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import {
  dirname,
  join,
  resolve,
} from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_CLASS,
  LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_STATE,
  LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_VERSION,
  type LivingFrameBlenderRigComponentQaInternalTestExecution,
  type LivingFrameBlenderRigComponentQaInternalTestReport,
  type LivingFrameBlenderRigComponentQaInternalTestReportDraft,
  type LivingFrameBlenderRigComponentQaSample,
  type LivingFrameBlenderRigPrivateRemotionSequenceLease,
} from '../../src/types/living-frame-blender-rig-component-qa-internal-test'
import type {
  LivingFrameBlenderFixedAdapterOutputFileCommitment,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import type {
  LivingFrameBlenderRigPrivatePersistedArtifactSetLease,
  LivingFrameBlenderRigPrivatePersistenceReport,
} from '../../src/types/living-frame-blender-rig-private-persistence-internal-test'
import type {
  LivingFrameBlenderSelectedSceneAdmission,
} from '../../src/types/living-frame-blender-selected-scene-admission'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  consumeLivingFrameBlenderRigPrivatePersistedArtifactSetLease,
} from './living-frame-blender-rig-private-persistence-internal-test'
import {
  verifyLivingFrameBlenderSelectedSceneAdmission,
  type InspectLivingFrameBlenderSelectedSceneAdmissionInput,
} from './living-frame-blender-selected-scene-admission'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const WIDTH = 1_920 as const
const HEIGHT = 1_080 as const
const FPS = 30 as const
const START_FRAME = 12 as const
const END_FRAME_EXCLUSIVE = 72 as const
const SAMPLE_FRAMES = [12, 42, 71] as const
const MAXIMUM_FILE_BYTES = 64 * 1024 * 1024
const MAXIMUM_RAW_FRAME_BYTES =
  WIDTH * HEIGHT * 4 + 1024 * 1024
const MAXIMUM_ALPHA_MASK_QUANTIZATION_PIXEL_COUNT =
  Math.ceil(WIDTH * HEIGHT * 0.0001)
const EXPECTED_BLENDER_EXECUTABLE =
  '/Volumes/Blender/Blender.app/Contents/MacOS/Blender'
const EXR_QA_SOURCE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'runtime/living-frame-blender-exr-qa.py',
)

interface PrivateRgbaFrame {
  readonly commitment:
    LivingFrameBlenderFixedAdapterOutputFileCommitment
  readonly bytes: Buffer
}

interface PrivateRemotionSequenceBinding {
  readonly componentQaReportDigestSha256: string
  readonly persistenceReportDigestSha256: string
  readonly admissionDigestSha256: string
  readonly privateArtifactSetIdentityHash: string
  readonly selectedSceneBindingDigestSha256: string
  readonly currentMasterTimingDigestSha256: string
  readonly confirmedOutputFrameDigestSha256: string
  readonly artifactSetDigestSha256: string
  readonly frames: readonly PrivateRgbaFrame[]
}

const privateRemotionSequenceByLease =
  new WeakMap<
    LivingFrameBlenderRigPrivateRemotionSequenceLease,
    PrivateRemotionSequenceBinding
  >()

export interface ExecuteLivingFrameBlenderRigComponentQaInternalTestInput {
  readonly qualificationId: string
  readonly admission:
    LivingFrameBlenderSelectedSceneAdmission
  readonly admissionInput:
    InspectLivingFrameBlenderSelectedSceneAdmissionInput
  readonly persistenceReport:
    LivingFrameBlenderRigPrivatePersistenceReport
  readonly persistedArtifactSetLease:
    LivingFrameBlenderRigPrivatePersistedArtifactSetLease
}

export interface LivingFrameBlenderRigPrivateRemotionSequence {
  readonly componentQaReportDigestSha256: string
  readonly persistenceReportDigestSha256: string
  readonly admissionDigestSha256: string
  readonly privateArtifactSetIdentityHash: string
  readonly selectedSceneBindingDigestSha256: string
  readonly currentMasterTimingDigestSha256: string
  readonly confirmedOutputFrameDigestSha256: string
  readonly artifactSetDigestSha256: string
  readonly widthPixels: 1920
  readonly heightPixels: 1080
  readonly fps: 30
  readonly startFrame: 12
  readonly endFrameExclusive: 72
  readonly rgbaFrames: readonly PrivateRgbaFrame[]
}

export async function executeLivingFrameBlenderRigComponentQaInternalTest(
  input:
    ExecuteLivingFrameBlenderRigComponentQaInternalTestInput,
): Promise<LivingFrameBlenderRigComponentQaInternalTestExecution> {
  assertInput(input)
  if (
    !await verifyLivingFrameBlenderSelectedSceneAdmission(
      input.admission,
      input.admissionInput,
    )
  ) {
    throw new Error(
      'Living Frame Blender component QA admission is invalid.',
    )
  }
  assertPersistenceReport(
    input.persistenceReport,
    input.admission,
  )
  const persisted =
    await consumeLivingFrameBlenderRigPrivatePersistedArtifactSetLease(
      input.persistedArtifactSetLease,
    )
  if (
    persisted.persistenceReportDigestSha256 !==
      input.persistenceReport.reportDigestSha256
    || persisted.privateArtifactSetIdentityHash !==
      input.persistenceReport.persistedArtifactSet
        .privateArtifactSetIdentityHash
    || persisted.manifestDigestSha256 !==
      input.persistenceReport.persistedArtifactSet
        .manifestDigestSha256
    || stableAuthorityStringify(
      persisted.files.map((file) =>
        file.commitment),
    ) !== stableAuthorityStringify(
      input.persistenceReport.persistedArtifactSet
        .files,
    )
  ) {
    throw new Error(
      'Living Frame Blender persisted artifact set lineage is invalid for component QA.',
    )
  }

  const bytesByKey =
    new Map<string, Buffer>()
  for (const file of persisted.files) {
    const bytes = await readExactStream(
      await file.openStream(),
      file.commitment,
    )
    assertFileSignatureAndDimensions(
      file.commitment,
      bytes,
    )
    bytesByKey.set(
      fileKey(
        file.commitment.pass,
        file.commitment.frame,
      ),
      bytes,
    )
  }
  assertExactFrameSets(
    input.admission,
    persisted.files.map((file) =>
      file.commitment),
  )
  assertArtifactSetDigest(
    input.persistenceReport,
    persisted.files.map((file) =>
      file.commitment),
  )

  const decoded = SAMPLE_FRAMES.map(
    (frame) =>
      decodeSample(bytesByKey, frame),
  )
  const depthQa =
    inspectDepthSamplesWithBlender(
      bytesByKey,
    )
  const samples:
    LivingFrameBlenderRigComponentQaSample[] =
      decoded.map((decodedSample, index) => ({
        ...decodedSample.sample,
        ...depthQa.samples[index]!,
      }))
  const first = decoded[0]!
  const middle = decoded[1]!
  const final = decoded[2]!
  const middlePoseDifferentPixelCount =
    differentRgbaPixelCount(
      first.rgba,
      middle.rgba,
    )
  const centroidDisplacementPixels =
    Math.hypot(
      (
        middle.sample
          .alphaCentroidXNormalized
        - first.sample
          .alphaCentroidXNormalized
      ) * WIDTH,
      (
        middle.sample
          .alphaCentroidYNormalized
        - first.sample
          .alphaCentroidYNormalized
      ) * HEIGHT,
    )
  if (
    !first.rgba.equals(final.rgba)
    || !first.mask.equals(final.mask)
    || middlePoseDifferentPixelCount < 1_000
    || centroidDisplacementPixels < 3
  ) {
    throw new Error(
      'Living Frame Blender rig motion or required pose restoration failed component QA.',
    )
  }

  const persistence =
    input.persistenceReport
  const admission = input.admission
  const draft:
    LivingFrameBlenderRigComponentQaInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_STATE,
      qualificationId:
        input.qualificationId,
      canonicalScope: {
        ...admission.canonicalScope,
      },
      sourceBindings: {
        admissionDigestSha256:
          admission.admissionDigestSha256,
        persistenceReportDigestSha256:
          persistence.reportDigestSha256,
        privateArtifactSetIdentityHash:
          persistence.persistedArtifactSet
            .privateArtifactSetIdentityHash,
        manifestDigestSha256:
          persistence.persistedArtifactSet
            .manifestDigestSha256,
        selectedSceneBindingDigestSha256:
          admission.sourceBindings
            .selectedSceneBindingDigestSha256,
        approvedSnapshotDigestSha256:
          admission.sourceBindings
            .approvedSnapshotDigestSha256,
        plannedWorkItemDigestSha256:
          admission.sourceBindings
            .plannedWorkItemDigestSha256,
        currentMasterTimingDigestSha256:
          admission.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameDigestSha256:
          admission.sourceBindings
            .confirmedOutputFrameDigestSha256,
        riggingPlanDigestSha256:
          admission.sourceBindings
            .riggingPlanDigestSha256,
        actionPlanDigestSha256:
          admission.sourceBindings
            .actionPlanDigestSha256,
        artifactSetDigestSha256:
          persistence.sourceBindings
            .artifactSetDigestSha256,
      },
      exactSequenceIdentity: {
        sourceWidthPixels: WIDTH,
        sourceHeightPixels: HEIGHT,
        sourceAspectRatio: '16:9',
        fps: FPS,
        startFrame: START_FRAME,
        endFrameExclusive:
          END_FRAME_EXCLUSIVE,
        durationFrames: 60,
        fileCount: 180,
        rgbaFileCount: 60,
        maskFileCount: 60,
        depthFileCount: 60,
        exactPassFrameSetsVerified: true,
        confirmedFrameAndMasterTimingPreserved:
          true,
      },
      artifactIntegrityQa: {
        persistedArtifactSetLeaseConsumedExactlyOnce:
          true,
        everyFileStreamConsumedExactlyOnce:
          true,
        everyByteLengthRevalidated: true,
        everySha256Revalidated: true,
        everyPngOrExrSignatureRevalidated:
          true,
        everyPngIhdrDimensionRevalidated:
          true,
        allRgbaPngsHaveRgbaColorType:
          true,
        allMaskPngsHaveGrayColorType:
          true,
        rawBytesExcludedFromReport: true,
        storagePathsExcludedFromReport:
          true,
      },
      decodedSampleQa: {
        decoderToolId: 'ffmpeg',
        decoderOperation:
          'private_internal_fixed_image_pipe_decode_v1',
        actualRuntimeExecuted: true,
        sampleFrames: SAMPLE_FRAMES,
        samples,
        everySampleHasTransparentAndOpaquePixels:
          true,
        maximumAllowedQuantizationDifferentPixelCount:
          MAXIMUM_ALPHA_MASK_QUANTIZATION_PIXEL_COUNT,
        everySampleMaskBinarySupportExactlyMatchesRgbaAlpha:
          true,
        everySampleMaskMatchesRgbaAlphaWithinOneCodeValue:
          true,
        everySampleHasFinitePositiveSubjectDepth:
          true,
        firstAndFinalDecodedRgbaExactMatch:
          true,
        firstAndFinalDecodedMaskExactMatch:
          true,
        middlePoseDifferentPixelCount,
        middlePoseDifferenceVerified: true,
        primaryMotionCentroidDisplacementPixels:
          roundMeasurement(
            centroidDisplacementPixels,
          ),
        readablePrimaryMotionVerified: true,
        requiredReturnToInitialPoseVerified:
          true,
      },
      exrQa: {
        decoderToolId: 'blender',
        decoderOperation:
          'private_internal_fixed_openexr_depth_qa_v1',
        blenderVersion:
          '4.5.11 LTS',
        fixedQaAdapterDigestSha256:
          depthQa.fixedQaAdapterDigestSha256,
        actualRuntimeExecuted: true,
        sampledCodecName: 'exr',
        sampledWidthPixels: WIDTH,
        sampledHeightPixels: HEIGHT,
        sampledDepthPixelFormat:
          'openexr_32_bit_bw_loaded_as_float',
        sampleCount: 3,
        allDepthSignaturesAndCommitmentsRevalidated:
          true,
        decodedSubjectDepthFiniteAndPositive:
          true,
      },
      rigSemanticsQa: {
        rigMode:
          'armature_2_5d_character',
        narrativeVisualVerb: 'reach',
        primaryControlId: 'control.ik',
        articulatedMotionObserved: true,
        restorationExpectation:
          'required_return_to_initial',
        restorationObserved: true,
        alphaMaskDepthOutputsRemainSeparate:
          true,
        blenderDidNotCreateFinalCanvas:
          true,
        remotionRemainsFinalCanvas: true,
      },
      authorityBoundary: {
        privateInternalComponentQaEvidenceAuthority:
          true,
        selectedSceneAuthority: false,
        approvedSnapshotAuthority: false,
        timingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        artifactPersistenceAuthority:
          false,
        assetManifestAuthority: false,
        canonicalQaApprovalAuthority:
          false,
        privateReviewApprovalAuthority:
          false,
        renderAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_OPEN_GATES,
      admissionRevalidated: true,
      persistenceReportRevalidated: true,
      privateInternalComponentQaPassed:
        true,
      privateRemotionReviewLeaseIssued:
        true,
      canonicalAssetManifestMutated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsArtifactBytesPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  const report = deepFreeze({
    ...draft,
    reportDigestSha256:
      sha256AuthorityValue(draft),
  })
  const rgbaFrames =
    persisted.files
      .filter((file) =>
        file.commitment.pass === 'rgba')
      .sort(
        (left, right) =>
          left.commitment.frame
          - right.commitment.frame,
      )
      .map((file) => ({
        commitment: file.commitment,
        bytes: Buffer.from(
          requiredBytes(
            bytesByKey,
            'rgba',
            file.commitment.frame,
          ),
        ),
      }))
  return {
    report,
    privateRemotionSequenceLease:
      createPrivateRemotionSequenceLease(
        report,
        persistence,
        admission,
        rgbaFrames,
      ),
  }
}

export function consumeLivingFrameBlenderRigPrivateRemotionSequenceLease(
  lease:
    LivingFrameBlenderRigPrivateRemotionSequenceLease,
): LivingFrameBlenderRigPrivateRemotionSequence {
  const binding =
    privateRemotionSequenceByLease.get(lease)
  if (
    binding == null
    || lease.leaseClass !==
      'process_bound_single_use_living_frame_blender_private_remotion_sequence_lease_v1'
    || lease.callerSerializable !== false
    || lease.renderAuthority !== false
    || lease.artifactAuthority !== false
    || lease.assetManifestAuthority !== false
    || lease.canonicalQaApprovalAuthority !==
      false
    || lease.privateReviewApprovalAuthority !==
      false
    || lease.billingAuthority !== false
    || lease.publicDeliveryAuthority !==
      false
    || lease.productionAuthority !== false
    || lease.componentQaReportDigestSha256 !==
      binding.componentQaReportDigestSha256
    || lease.persistenceReportDigestSha256 !==
      binding.persistenceReportDigestSha256
    || lease.admissionDigestSha256 !==
      binding.admissionDigestSha256
    || lease.privateArtifactSetIdentityHash !==
      binding.privateArtifactSetIdentityHash
    || lease.selectedSceneBindingDigestSha256 !==
      binding.selectedSceneBindingDigestSha256
    || lease.currentMasterTimingDigestSha256 !==
      binding.currentMasterTimingDigestSha256
    || lease.confirmedOutputFrameDigestSha256 !==
      binding.confirmedOutputFrameDigestSha256
    || lease.artifactSetDigestSha256 !==
      binding.artifactSetDigestSha256
    || stableAuthorityStringify(
      lease.rgbaFrames,
    ) !== stableAuthorityStringify(
      binding.frames.map((frame) =>
        frame.commitment),
    )
  ) {
    throw new Error(
      'Living Frame Blender private Remotion sequence lease is invalid, unknown, or already consumed.',
    )
  }
  privateRemotionSequenceByLease.delete(lease)
  return Object.freeze({
    componentQaReportDigestSha256:
      binding.componentQaReportDigestSha256,
    persistenceReportDigestSha256:
      binding.persistenceReportDigestSha256,
    admissionDigestSha256:
      binding.admissionDigestSha256,
    privateArtifactSetIdentityHash:
      binding.privateArtifactSetIdentityHash,
    selectedSceneBindingDigestSha256:
      binding.selectedSceneBindingDigestSha256,
    currentMasterTimingDigestSha256:
      binding.currentMasterTimingDigestSha256,
    confirmedOutputFrameDigestSha256:
      binding.confirmedOutputFrameDigestSha256,
    artifactSetDigestSha256:
      binding.artifactSetDigestSha256,
    widthPixels: WIDTH,
    heightPixels: HEIGHT,
    fps: FPS,
    startFrame: START_FRAME,
    endFrameExclusive:
      END_FRAME_EXCLUSIVE,
    rgbaFrames: binding.frames.map(
      (frame) => ({
        commitment: frame.commitment,
        bytes: Buffer.from(frame.bytes),
      }),
    ),
  })
}

function createPrivateRemotionSequenceLease(
  report:
    LivingFrameBlenderRigComponentQaInternalTestReport,
  persistence:
    LivingFrameBlenderRigPrivatePersistenceReport,
  admission:
    LivingFrameBlenderSelectedSceneAdmission,
  frames: readonly PrivateRgbaFrame[],
): LivingFrameBlenderRigPrivateRemotionSequenceLease {
  if (
    frames.length !== 60
    || frames.some(
      (frame, order) =>
        frame.commitment.pass !== 'rgba'
        || frame.commitment.frame !==
          START_FRAME + order
        || createHash('sha256')
          .update(frame.bytes)
          .digest('hex') !==
          frame.commitment.sha256,
    )
  ) {
    throw new Error(
      'Living Frame Blender private Remotion sequence changed before lease creation.',
    )
  }
  const lease = deepFreeze({
    leaseClass:
      'process_bound_single_use_living_frame_blender_private_remotion_sequence_lease_v1' as const,
    leaseId:
      `lf-blender-remotion-sequence.${sha256AuthorityValue({
        componentQaReportDigestSha256:
          report.reportDigestSha256,
        privateArtifactSetIdentityHash:
          persistence.persistedArtifactSet
            .privateArtifactSetIdentityHash,
      }).slice(0, 40)}`,
    componentQaReportDigestSha256:
      report.reportDigestSha256,
    persistenceReportDigestSha256:
      persistence.reportDigestSha256,
    admissionDigestSha256:
      admission.admissionDigestSha256,
    privateArtifactSetIdentityHash:
      persistence.persistedArtifactSet
        .privateArtifactSetIdentityHash,
    selectedSceneBindingDigestSha256:
      admission.sourceBindings
        .selectedSceneBindingDigestSha256,
    currentMasterTimingDigestSha256:
      admission.sourceBindings
        .currentMasterTimingDigestSha256,
    confirmedOutputFrameDigestSha256:
      admission.sourceBindings
        .confirmedOutputFrameDigestSha256,
    artifactSetDigestSha256:
      persistence.sourceBindings
        .artifactSetDigestSha256,
    widthPixels: WIDTH,
    heightPixels: HEIGHT,
    fps: FPS,
    startFrame: START_FRAME,
    endFrameExclusive:
      END_FRAME_EXCLUSIVE,
    rgbaFrames: frames.map((frame) =>
      frame.commitment),
    callerSerializable: false as const,
    renderAuthority: false as const,
    artifactAuthority: false as const,
    assetManifestAuthority: false as const,
    canonicalQaApprovalAuthority:
      false as const,
    privateReviewApprovalAuthority:
      false as const,
    billingAuthority: false as const,
    publicDeliveryAuthority:
      false as const,
    productionAuthority: false as const,
  })
  privateRemotionSequenceByLease.set(
    lease,
    Object.freeze({
      componentQaReportDigestSha256:
        report.reportDigestSha256,
      persistenceReportDigestSha256:
        persistence.reportDigestSha256,
      admissionDigestSha256:
        admission.admissionDigestSha256,
      privateArtifactSetIdentityHash:
        persistence.persistedArtifactSet
          .privateArtifactSetIdentityHash,
      selectedSceneBindingDigestSha256:
        admission.sourceBindings
          .selectedSceneBindingDigestSha256,
      currentMasterTimingDigestSha256:
        admission.sourceBindings
          .currentMasterTimingDigestSha256,
      confirmedOutputFrameDigestSha256:
        admission.sourceBindings
          .confirmedOutputFrameDigestSha256,
      artifactSetDigestSha256:
        persistence.sourceBindings
          .artifactSetDigestSha256,
      frames: frames.map((frame) => ({
        commitment: frame.commitment,
        bytes: Buffer.from(frame.bytes),
      })),
    }),
  )
  return lease
}

function assertInput(
  input:
    ExecuteLivingFrameBlenderRigComponentQaInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'qualificationId',
      'admission',
      'admissionInput',
      'persistenceReport',
      'persistedArtifactSetLease',
    ].sort().join('|')
    || typeof input.qualificationId !==
      'string'
    || !SAFE_ID.test(input.qualificationId)
    || !isRecord(input.admission)
    || !isRecord(input.admissionInput)
    || !isRecord(input.persistenceReport)
    || !isRecord(
      input.persistedArtifactSetLease,
    )
  ) {
    throw new Error(
      'Living Frame Blender component QA input is invalid.',
    )
  }
}

function assertPersistenceReport(
  report:
    LivingFrameBlenderRigPrivatePersistenceReport,
  admission:
    LivingFrameBlenderSelectedSceneAdmission,
): void {
  const {
    reportDigestSha256,
    ...draft
  } = report
  if (
    !SHA256.test(reportDigestSha256)
    || reportDigestSha256 !==
      sha256AuthorityValue(draft)
    || !sameScope(
      report.canonicalScope,
      admission.canonicalScope,
    )
    || report.sourceBindings
      .admissionDigestSha256 !==
      admission.admissionDigestSha256
    || report.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      admission.sourceBindings
        .selectedSceneBindingDigestSha256
    || report.sourceBindings
      .approvedSnapshotDigestSha256 !==
      admission.sourceBindings
        .approvedSnapshotDigestSha256
    || report.sourceBindings
      .plannedWorkItemDigestSha256 !==
      admission.sourceBindings
        .plannedWorkItemDigestSha256
    || report.sourceBindings
      .currentMasterTimingDigestSha256 !==
      admission.sourceBindings
        .currentMasterTimingDigestSha256
    || report.sourceBindings
      .confirmedOutputFrameDigestSha256 !==
      admission.sourceBindings
        .confirmedOutputFrameDigestSha256
    || report.sourceBindings
      .riggingPlanDigestSha256 !==
      admission.sourceBindings
        .riggingPlanDigestSha256
    || report.sourceBindings
      .actionPlanDigestSha256 !==
      admission.sourceBindings
        .actionPlanDigestSha256
    || report.persistedArtifactSet.fileCount !==
      180
    || report.persistedArtifactSet.rgbaFileCount !==
      60
    || report.persistedArtifactSet.maskFileCount !==
      60
    || report.persistedArtifactSet.depthFileCount !==
      60
    || !report.privateInternalArtifactSetPersisted
    || report.canonicalAssetManifestMutated
    || report.canonicalQaApproved
    || report.privateReviewApproved
    || report.actualCostCreated
    || report.customerCharged
    || !report.remotionRemainsFinalCanvas
    || report.publicDeliveryReady
    || report.productionReady
  ) {
    throw new Error(
      'Living Frame Blender persistence report is invalid for component QA.',
    )
  }
}

async function readExactStream(
  stream: NodeJS.ReadableStream,
  commitment:
    LivingFrameBlenderFixedAdapterOutputFileCommitment,
): Promise<Buffer> {
  const chunks: Buffer[] = []
  let byteLength = 0
  const digest = createHash('sha256')
  for await (const chunk of stream) {
    const bytes =
      typeof chunk === 'string'
        ? Buffer.from(chunk)
        : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (
      byteLength >
        commitment.byteLength
      || byteLength >
        MAXIMUM_FILE_BYTES
    ) {
      throw new Error(
        'Living Frame Blender component QA stream exceeded its exact commitment.',
      )
    }
    digest.update(bytes)
    chunks.push(bytes)
  }
  if (
    byteLength !== commitment.byteLength
    || digest.digest('hex') !==
      commitment.sha256
  ) {
    throw new Error(
      'Living Frame Blender component QA stream failed exact revalidation.',
    )
  }
  return Buffer.concat(chunks, byteLength)
}

function assertFileSignatureAndDimensions(
  commitment:
    LivingFrameBlenderFixedAdapterOutputFileCommitment,
  bytes: Buffer,
): void {
  if (commitment.contentType === 'image/x-exr') {
    if (
      commitment.pass !== 'depth'
      || !bytes.subarray(0, 4).equals(
        Buffer.from([0x76, 0x2f, 0x31, 0x01]),
      )
    ) {
      throw new Error(
        'Living Frame Blender depth artifact signature is invalid.',
      )
    }
    return
  }
  if (
    !bytes.subarray(0, 8).equals(
      Buffer.from([
        137, 80, 78, 71,
        13, 10, 26, 10,
      ]),
    )
    || bytes.toString(
      'ascii',
      12,
      16,
    ) !== 'IHDR'
    || bytes.readUInt32BE(16) !== WIDTH
    || bytes.readUInt32BE(20) !== HEIGHT
    || bytes[24] !== 8
    || (
      commitment.pass === 'rgba'
      && bytes[25] !== 6
    )
    || (
      commitment.pass === 'mask'
      && bytes[25] !== 0
    )
  ) {
    throw new Error(
      'Living Frame Blender PNG signature, dimensions, or color type is invalid.',
    )
  }
}

function decodeSample(
  bytesByKey: ReadonlyMap<string, Buffer>,
  frame: (typeof SAMPLE_FRAMES)[number],
): {
  readonly rgba: Buffer
  readonly mask: Buffer
  readonly sample: Omit<
    LivingFrameBlenderRigComponentQaSample,
    | 'finiteSubjectDepthPixelCount'
    | 'minimumFiniteSubjectDepth'
    | 'maximumFiniteSubjectDepth'
  >
} {
  const rgba = decodeImage(
    requiredBytes(
      bytesByKey,
      'rgba',
      frame,
    ),
    'png',
    'rgba',
    WIDTH * HEIGHT * 4,
  )
  const mask = decodeImage(
    requiredBytes(
      bytesByKey,
      'mask',
      frame,
    ),
    'png',
    'gray',
    WIDTH * HEIGHT,
  )
  let nonZeroAlpha = 0
  let zeroAlpha = 0
  let alphaMaskDifferent = 0
  let alphaWeight = 0
  let weightedX = 0
  let weightedY = 0
  let maskNonZero = 0
  let binarySupportDifferent = 0
  let maximumAbsoluteDifference = 0
  let absoluteDifferenceTotal = 0
  for (
    let pixel = 0;
    pixel < WIDTH * HEIGHT;
    pixel += 1
  ) {
    const alpha = rgba[pixel * 4 + 3]!
    const maskValue = mask[pixel]!
    if (alpha !== maskValue) {
      alphaMaskDifferent += 1
    }
    const absoluteDifference =
      Math.abs(alpha - maskValue)
    maximumAbsoluteDifference =
      Math.max(
        maximumAbsoluteDifference,
        absoluteDifference,
      )
    absoluteDifferenceTotal +=
      absoluteDifference
    if (
      (alpha > 0)
      !== (maskValue > 0)
    ) {
      binarySupportDifferent += 1
    }
    if (alpha > 0) {
      nonZeroAlpha += 1
      alphaWeight += alpha
      weightedX +=
        (pixel % WIDTH) * alpha
      weightedY +=
        Math.floor(pixel / WIDTH) * alpha
    } else {
      zeroAlpha += 1
    }
    if (maskValue > 0) {
      maskNonZero += 1
    }
  }
  if (
    nonZeroAlpha < 1_000
    || zeroAlpha < 1_000
    || alphaMaskDifferent >
      MAXIMUM_ALPHA_MASK_QUANTIZATION_PIXEL_COUNT
    || binarySupportDifferent !== 0
    || maximumAbsoluteDifference > 1
    || absoluteDifferenceTotal /
      (WIDTH * HEIGHT) > 0.0001
    || maskNonZero !== nonZeroAlpha
    || alphaWeight <= 0
  ) {
    throw new Error(
      'Living Frame Blender decoded alpha or mask sample failed QA.',
    )
  }
  return {
    rgba,
    mask,
    sample: {
      frame,
      rgbaNonZeroAlphaPixelCount:
        nonZeroAlpha,
      rgbaZeroAlphaPixelCount:
        zeroAlpha,
      alphaCentroidXNormalized:
        roundMeasurement(
          weightedX /
          alphaWeight /
          WIDTH,
        ),
      alphaCentroidYNormalized:
        roundMeasurement(
          weightedY /
          alphaWeight /
          HEIGHT,
        ),
      maskNonZeroPixelCount:
        maskNonZero,
      alphaMaskDifferentPixelCount:
        alphaMaskDifferent,
      alphaMaskBinarySupportDifferentPixelCount:
        0,
      alphaMaskMaximumAbsoluteDifferenceCodeValues:
        maximumAbsoluteDifference,
      alphaMaskMeanAbsoluteDifferenceCodeValues:
        roundMeasurement(
          absoluteDifferenceTotal /
          (WIDTH * HEIGHT),
        ),
    },
  }
}

function decodeImage(
  bytes: Buffer,
  codec: 'png',
  pixelFormat:
    'rgba' | 'gray',
  expectedByteLength: number,
): Buffer {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'image2pipe',
      '-vcodec',
      codec,
      '-i',
      'pipe:0',
      '-frames:v',
      '1',
      '-f',
      'rawvideo',
      '-pix_fmt',
      pixelFormat,
      '-threads',
      '1',
      'pipe:1',
    ],
    {
      input: bytes,
      encoding: null,
      maxBuffer:
        Math.max(
          expectedByteLength +
            1024 * 1024,
          MAXIMUM_RAW_FRAME_BYTES,
        ),
    },
  )
  if (
    result.status !== 0
    || result.stdout.byteLength !==
      expectedByteLength
  ) {
    throw new Error(
      'Living Frame Blender fixed PNG image-pipe decode failed.',
    )
  }
  return Buffer.from(result.stdout)
}

function inspectDepthSamplesWithBlender(
  bytesByKey: ReadonlyMap<string, Buffer>,
): {
  readonly fixedQaAdapterDigestSha256: string
  readonly samples: readonly [
    {
      readonly frame: 12
      readonly finiteSubjectDepthPixelCount: number
      readonly minimumFiniteSubjectDepth: number
      readonly maximumFiniteSubjectDepth: number
    },
    {
      readonly frame: 42
      readonly finiteSubjectDepthPixelCount: number
      readonly minimumFiniteSubjectDepth: number
      readonly maximumFiniteSubjectDepth: number
    },
    {
      readonly frame: 71
      readonly finiteSubjectDepthPixelCount: number
      readonly minimumFiniteSubjectDepth: number
      readonly maximumFiniteSubjectDepth: number
    },
  ]
} {
  const executable =
    verifyFixedRegularFile(
      EXPECTED_BLENDER_EXECUTABLE,
      512 * 1024 * 1024,
    )
  const adapter =
    verifyFixedRegularFile(
      EXR_QA_SOURCE,
      128 * 1024,
    )
  const adapterDigest =
    createHash('sha256')
      .update(readFileSync(adapter))
      .digest('hex')
  const jobRoot =
    mkdtempSync(
      join(
        tmpdir(),
        'reeditpro-lf-blender-exr-qa-',
      ),
    )
  try {
    chmodSync(jobRoot, 0o700)
    const requestRoot =
      join(
        jobRoot,
        '.reeditpro-lf-exr-qa',
      )
    const depthRoot =
      join(requestRoot, 'depth')
    const maskRoot =
      join(requestRoot, 'mask')
    const noHomeRoot =
      join(jobRoot, 'no-home')
    const tempRoot =
      join(jobRoot, 'tmp')
    for (const directory of [
      requestRoot,
      depthRoot,
      maskRoot,
      noHomeRoot,
      tempRoot,
    ]) {
      mkdirSync(directory, {
        mode: 0o700,
      })
    }
    for (const frame of SAMPLE_FRAMES) {
      const label =
        String(frame).padStart(4, '0')
      writeFileSync(
        join(
          depthRoot,
          `frame_${label}.exr`,
        ),
        requiredBytes(
          bytesByKey,
          'depth',
          frame,
        ),
        {
          flag: 'wx',
          mode: 0o600,
        },
      )
      writeFileSync(
        join(
          maskRoot,
          `frame_${label}.png`,
        ),
        requiredBytes(
          bytesByKey,
          'mask',
          frame,
        ),
        {
          flag: 'wx',
          mode: 0o600,
        },
      )
    }

    const result = spawnSync(
      '/usr/bin/time',
      [
        '-lp',
        executable,
        '--background',
        '--factory-startup',
        '--disable-autoexec',
        '--python-exit-code',
        '87',
        '--python',
        adapter,
      ],
      {
        cwd: jobRoot,
        env: {
          PATH:
            '/usr/bin:/bin:/usr/sbin:/sbin',
          HOME: noHomeRoot,
          TMPDIR: tempRoot,
        },
        encoding: 'utf8',
        maxBuffer: 2 * 1024 * 1024,
        timeout: 120_000,
        killSignal: 'SIGKILL',
      },
    )
    if (
      result.error != null
      || result.signal != null
      || result.status !== 0
    ) {
      throw new Error(
        'Living Frame Blender fixed OpenEXR QA runtime failed.',
      )
    }
    const resultPath =
      join(requestRoot, 'result.json')
    const resultDetails =
      lstatSync(resultPath)
    if (
      !resultDetails.isFile()
      || resultDetails.isSymbolicLink()
      || resultDetails.size <= 0
      || resultDetails.size > 128 * 1024
      || dirname(
        realpathSync(resultPath),
      ) !== realpathSync(requestRoot)
    ) {
      throw new Error(
        'Living Frame Blender fixed OpenEXR QA result is invalid.',
      )
    }
    const parsed: unknown =
      JSON.parse(
        readFileSync(
          resultPath,
          'utf8',
        ),
      )
    return {
      fixedQaAdapterDigestSha256:
        adapterDigest,
      samples:
        parseBlenderDepthQaResult(parsed),
    }
  } finally {
    rmSync(jobRoot, {
      recursive: true,
      force: true,
    })
  }
}

function parseBlenderDepthQaResult(
  value: unknown,
): readonly [
  {
    readonly frame: 12
    readonly finiteSubjectDepthPixelCount: number
    readonly minimumFiniteSubjectDepth: number
    readonly maximumFiniteSubjectDepth: number
  },
  {
    readonly frame: 42
    readonly finiteSubjectDepthPixelCount: number
    readonly minimumFiniteSubjectDepth: number
    readonly maximumFiniteSubjectDepth: number
  },
  {
    readonly frame: 71
    readonly finiteSubjectDepthPixelCount: number
    readonly minimumFiniteSubjectDepth: number
    readonly maximumFiniteSubjectDepth: number
  },
] {
  if (
    !isRecord(value)
    || Object.keys(value)
      .sort()
      .join('|') !== [
        'version',
        'blenderVersion',
        'widthPixels',
        'heightPixels',
        'sampleFrames',
        'samples',
        'openExrLoadedByBlender',
        'finitePositiveSubjectDepthVerified',
      ].sort().join('|')
    || value.version !==
      'living-frame-blender-fixed-exr-qa-v1'
    || value.blenderVersion !==
      '4.5.11 LTS'
    || value.widthPixels !== WIDTH
    || value.heightPixels !== HEIGHT
    || stableAuthorityStringify(
      value.sampleFrames,
    ) !== stableAuthorityStringify(
      SAMPLE_FRAMES,
    )
    || value.openExrLoadedByBlender !==
      true
    || value
      .finitePositiveSubjectDepthVerified !==
      true
    || !Array.isArray(value.samples)
    || value.samples.length !== 3
  ) {
    throw new Error(
      'Living Frame Blender fixed OpenEXR QA result contract changed.',
    )
  }
  const parsed = value.samples.map(
    (sample, index) => {
      const frame = SAMPLE_FRAMES[index]!
      if (
        !isRecord(sample)
        || Object.keys(sample)
          .sort()
          .join('|') !== [
            'frame',
            'finiteSubjectDepthPixelCount',
            'minimumFiniteSubjectDepth',
            'maximumFiniteSubjectDepth',
          ].sort().join('|')
        || sample.frame !== frame
        || !Number.isInteger(
          sample
            .finiteSubjectDepthPixelCount,
        )
        || Number(
          sample
            .finiteSubjectDepthPixelCount,
        ) < 1_000
        || !isFinitePositiveNumber(
          sample
            .minimumFiniteSubjectDepth,
        )
        || !isFinitePositiveNumber(
          sample
            .maximumFiniteSubjectDepth,
        )
        || Number(
          sample
            .maximumFiniteSubjectDepth,
        ) < Number(
          sample
            .minimumFiniteSubjectDepth,
        )
      ) {
        throw new Error(
          'Living Frame Blender fixed OpenEXR QA sample contract changed.',
        )
      }
      return {
        frame,
        finiteSubjectDepthPixelCount:
          Number(
            sample
              .finiteSubjectDepthPixelCount,
          ),
        minimumFiniteSubjectDepth:
          roundMeasurement(
            Number(
              sample
                .minimumFiniteSubjectDepth,
            ),
          ),
        maximumFiniteSubjectDepth:
          roundMeasurement(
            Number(
              sample
                .maximumFiniteSubjectDepth,
            ),
          ),
      }
    },
  )
  return [
    {
      ...parsed[0]!,
      frame: 12,
    },
    {
      ...parsed[1]!,
      frame: 42,
    },
    {
      ...parsed[2]!,
      frame: 71,
    },
  ]
}

function verifyFixedRegularFile(
  expectedPath: string,
  maximumBytes: number,
): string {
  const details =
    lstatSync(expectedPath)
  const resolved =
    realpathSync(expectedPath)
  if (
    !details.isFile()
    || details.isSymbolicLink()
    || details.size <= 0
    || details.size > maximumBytes
    || resolved !== expectedPath
  ) {
    throw new Error(
      'Living Frame Blender fixed OpenEXR QA dependency is invalid.',
    )
  }
  return resolved
}

function isFinitePositiveNumber(
  value: unknown,
): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value > 0
}

function differentRgbaPixelCount(
  left: Buffer,
  right: Buffer,
): number {
  let count = 0
  for (
    let offset = 0;
    offset < left.byteLength;
    offset += 4
  ) {
    if (
      left[offset] !== right[offset]
      || left[offset + 1] !==
        right[offset + 1]
      || left[offset + 2] !==
        right[offset + 2]
      || left[offset + 3] !==
        right[offset + 3]
    ) count += 1
  }
  return count
}

function assertExactFrameSets(
  admission:
    LivingFrameBlenderSelectedSceneAdmission,
  commitments:
    readonly LivingFrameBlenderFixedAdapterOutputFileCommitment[],
): void {
  if (
    admission.exactFrameBinding.widthPixels !==
      WIDTH
    || admission.exactFrameBinding.heightPixels !==
      HEIGHT
    || admission.exactFrameBinding.fps !== FPS
    || admission.exactFrameBinding.startFrame !==
      START_FRAME
    || admission.exactFrameBinding
      .endFrameExclusive !==
      END_FRAME_EXCLUSIVE
    || admission.exactFrameBinding
      .durationFrames !== 60
    || commitments.length !== 180
  ) {
    throw new Error(
      'Living Frame Blender component QA frame authority changed.',
    )
  }
  for (const pass of [
    'rgba',
    'mask',
    'depth',
  ] as const) {
    const frames = commitments
      .filter((file) =>
        file.pass === pass)
      .map((file) => file.frame)
      .sort((left, right) =>
        left - right)
    if (
      frames.length !== 60
      || frames.some(
        (frame, order) =>
          frame !==
            START_FRAME + order,
      )
    ) {
      throw new Error(
        'Living Frame Blender component QA found a non-contiguous pass frame set.',
      )
    }
  }
}

function assertArtifactSetDigest(
  report:
    LivingFrameBlenderRigPrivatePersistenceReport,
  commitments:
    readonly LivingFrameBlenderFixedAdapterOutputFileCommitment[],
): void {
  const digest = sha256AuthorityValue({
    contract:
      'living_frame_blender_output_artifact_set_v1',
    resultDigestSha256:
      report.sourceBindings
        .adapterResultDigestSha256,
    files: commitments,
  })
  if (
    digest !==
      report.sourceBindings
        .artifactSetDigestSha256
  ) {
    throw new Error(
      'Living Frame Blender artifact-set digest failed component QA.',
    )
  }
}

function requiredBytes(
  values: ReadonlyMap<string, Buffer>,
  pass: 'rgba' | 'mask' | 'depth',
  frame: number,
): Buffer {
  const value =
    values.get(fileKey(pass, frame))
  if (value == null) {
    throw new Error(
      'Living Frame Blender component QA sample is missing.',
    )
  }
  return value
}

function fileKey(
  pass: 'rgba' | 'mask' | 'depth',
  frame: number,
): string {
  return `${pass}:${frame}`
}

function sameScope(
  left: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  },
  right: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  },
): boolean {
  return stableAuthorityStringify(left)
    === stableAuthorityStringify(right)
}

function roundMeasurement(
  value: number,
): number {
  return Number(value.toFixed(6))
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
    || Buffer.isBuffer(value)
  ) return value
  Object.freeze(value)
  for (const nested of Object.values(
    value as Record<string, unknown>,
  )) deepFreeze(nested)
  return value
}
