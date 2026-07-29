import assert from 'node:assert/strict'

import {
  createLivingFrameComfyUiDependencyLockEvidence,
  createLivingFrameComfyUiDependencyLockObservationReader,
  LivingFrameComfyUiDependencyLockEvidenceError,
  verifyLivingFrameComfyUiDependencyLockEvidence,
  type LivingFrameComfyUiDependencyLockObservationReader,
} from '../living-frame/living-frame-comfyui-dependency-lock-evidence'
import {
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION,
} from '../living-frame/living-frame-comfyui-dependency-lock-manifest'

const CONTROLLED_CASE_COUNT = 1
const ADVERSARIAL_CASE_COUNT = 20

async function main(): Promise<void> {
  const reader = controlledReader()
  const evidence =
    await createLivingFrameComfyUiDependencyLockEvidence({
      evidenceId: 'lf-comfyui-dependency-lock-controlled-001',
      observationReader: reader,
    })

  assert.equal(evidence.wheelLock.wheelArtifactCount, 35)
  assert.equal(
    evidence.wheelLock.wheelArtifactTotalByteLength,
    486_459_097,
  )
  assert.equal(evidence.sourceLock.sourceArchiveCount, 3)
  assert.equal(
    evidence.controlledRuntimeProbe.objectInfoNodeClassCount,
    920,
  )
  assert.equal(
    evidence.controlledRuntimeProbe
      .deterministicPromptProbeCount,
    5,
  )
  assert.equal(evidence.offlineRebuildObserved, true)
  assert.equal(evidence.productionReady, false)
  assert.equal(
    evidence.authorityBoundary.gpuExecutionAuthority,
    false,
  )
  assert.equal(
    evidence.authorityBoundary.runtimeAuthority,
    false,
  )
  assert.equal(
    evidence.authorityBoundary.productionAuthority,
    false,
  )
  assert.match(evidence.evidenceDigestSha256, /^[a-f0-9]{64}$/u)

  const verified =
    verifyLivingFrameComfyUiDependencyLockEvidence(evidence)
  assert.equal(verified.ok, true)

  await expectRejected(
    () =>
      createLivingFrameComfyUiDependencyLockEvidence({
        evidenceId: 'lf-forged-reader',
        observationReader:
          forgedReader(),
      }),
    'reader_invalid',
  )

  await expectRejected(
    () =>
      createLivingFrameComfyUiDependencyLockEvidence({
        evidenceId: 'lf-reused-reader',
        observationReader: reader,
      }),
    'reader_reused',
  )

  await expectRejected(
    () =>
      createLivingFrameComfyUiDependencyLockEvidence({
        evidenceId: 'lf-reader-failed',
        observationReader:
          createLivingFrameComfyUiDependencyLockObservationReader({
            readControlledDependencyLockObservation:
              async () => {
                throw new Error('controlled failure')
              },
          }),
      }),
    'reader_failed',
  )

  await expectPacketRejected(
    null,
    'observation_invalid',
  )

  await expectTamper(
    (packet) => {
      packet.baseImage.controlledBaseImageDigestSha256 =
        '0'.repeat(64)
    },
    'base_image_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.wheelLock.wheelArtifactCount = 34
    },
    'wheel_count_mismatch',
  )

  await expectTamper(
    (packet) => {
      ;[
        packet.wheelLock.artifacts[0],
        packet.wheelLock.artifacts[1],
      ] = [
        packet.wheelLock.artifacts[1],
        packet.wheelLock.artifacts[0],
      ]
    },
    'wheel_order_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.wheelLock.artifacts[0].sha256 =
        '1'.repeat(64)
    },
    'wheel_artifact_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.wheelLock.wheelManifestDigestSha256 =
        '2'.repeat(64)
    },
    'wheel_manifest_digest_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.wheelLock.wheelArtifactTotalByteLength -= 1
    },
    'wheel_total_byte_length_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.sourceLock.sourceArchiveCount = 2
    },
    'source_archive_count_mismatch',
  )

  await expectTamper(
    (packet) => {
      ;[
        packet.sourceLock.archives[0],
        packet.sourceLock.archives[1],
      ] = [
        packet.sourceLock.archives[1],
        packet.sourceLock.archives[0],
      ]
    },
    'source_archive_order_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.sourceLock.archives[2].archiveSha256 =
        '3'.repeat(64)
    },
    'source_archive_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.controlledOfflineBuild.imageBuiltScannedOrSigned =
        true
    },
    'offline_build_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.controlledRuntimeProbe.objectInfoNodeClassCount =
        919
    },
    'node_schema_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.controlledRuntimeProbe
        .deterministicPromptProbeCount = 4
    },
    'prompt_probe_count_mismatch',
  )

  await expectTamper(
    (packet) => {
      ;[
        packet.controlledRuntimeProbe
          .deterministicPromptProbes[0],
        packet.controlledRuntimeProbe
          .deterministicPromptProbes[1],
      ] = [
        packet.controlledRuntimeProbe
          .deterministicPromptProbes[1],
        packet.controlledRuntimeProbe
          .deterministicPromptProbes[0],
      ]
    },
    'prompt_probe_order_mismatch',
  )

  await expectTamper(
    (packet) => {
      packet.controlledRuntimeProbe
        .deterministicPromptProbes[4]
        .outputRgbaPixelSha256 = '4'.repeat(64)
    },
    'prompt_probe_mismatch',
  )

  await expectTamper(
    (packet) => {
      ;(packet as Record<string, unknown>).url =
        'https://example.invalid/forbidden'
    },
    'observation_invalid',
  )

  const forgedPromotion =
    structuredClone(evidence) as DeepMutable<typeof evidence>
  forgedPromotion.productionReady = true
  forgedPromotion.authorityBoundary.runtimeAuthority = true
  forgedPromotion.authorityBoundary.productionAuthority = true
  forgedPromotion.controlledRuntimeProbe.gpuExecutionObserved =
    true
  forgedPromotion.evidenceDigestSha256 =
    evidence.evidenceDigestSha256
  const forgedResult =
    verifyLivingFrameComfyUiDependencyLockEvidence(
      forgedPromotion,
    )
  assert.equal(forgedResult.ok, false)
  if (forgedResult.ok) {
    throw new Error('forged promotion unexpectedly verified')
  }
  assert.equal(
    forgedResult.issues[0]?.code,
    'digest_mismatch',
  )

  console.log(
    `living-frame comfyui dependency-lock evidence smoke: ${CONTROLLED_CASE_COUNT} controlled + ${ADVERSARIAL_CASE_COUNT} adversarial cases passed`,
  )
}

type DeepMutable<T> =
  T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends readonly (infer Item)[]
          ? DeepMutable<Item>[]
          : T extends object
            ? {
                -readonly [Key in keyof T]:
                  DeepMutable<T[Key]>
              }
            : T

type MutableObservation =
  DeepMutable<
    typeof
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
  >

function mutableObservation(): MutableObservation {
  return structuredClone(
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION,
  ) as MutableObservation
}

function controlledReader():
  LivingFrameComfyUiDependencyLockObservationReader {
  return createLivingFrameComfyUiDependencyLockObservationReader({
    readControlledDependencyLockObservation:
      async () => mutableObservation(),
  })
}

function forgedReader():
  LivingFrameComfyUiDependencyLockObservationReader {
  return {
    readerClass:
      'process_bound_server_owned_living_frame_comfyui_dependency_lock_observation_reader_v1',
    callerJsonAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
    callerBytesAccepted: false,
    buildAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
    readControlledDependencyLockObservation:
      async () => mutableObservation(),
  }
}

async function expectPacketRejected(
  packet: unknown,
  expectedCode: string,
): Promise<void> {
  await expectRejected(
    () =>
      createLivingFrameComfyUiDependencyLockEvidence({
        evidenceId: `lf-rejected-${expectedCode}`,
        observationReader:
          createLivingFrameComfyUiDependencyLockObservationReader({
            readControlledDependencyLockObservation:
              async () => packet,
          }),
      }),
    expectedCode,
  )
}

async function expectTamper(
  mutate: (packet: MutableObservation) => void,
  expectedCode: string,
): Promise<void> {
  const packet = mutableObservation()
  mutate(packet)
  await expectPacketRejected(packet, expectedCode)
}

async function expectRejected(
  callback: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  let rejected = false
  try {
    await callback()
  } catch (error) {
    rejected = true
    assert.ok(
      error instanceof
        LivingFrameComfyUiDependencyLockEvidenceError,
    )
    assert.equal(error.issues[0]?.code, expectedCode)
  }
  assert.equal(rejected, true)
}

void main()
