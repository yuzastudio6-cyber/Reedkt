import { createHash } from 'node:crypto'
import {
  lstatSync,
  realpathSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import {
  basename,
  dirname,
  resolve,
} from 'node:path'
import type { Readable } from 'node:stream'

import type {
  LivingFrameBlenderFixedAdapterOutputFileCommitment,
  LivingFrameBlenderFixedAdapterOutputLease,
  LivingFrameBlenderFixedAdapterResult,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import {
  LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS,
  LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE,
  LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
  LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_OPEN_GATES,
  type LivingFrameBlenderRigPrivatePersistedArtifactSetLease,
  type LivingFrameBlenderRigPrivatePersistenceExecution,
  type LivingFrameBlenderRigPrivatePersistenceReport,
  type LivingFrameBlenderRigPrivatePersistenceReportDraft,
} from '../../src/types/living-frame-blender-rig-private-persistence-internal-test'
import type {
  LivingFrameBlenderSelectedSceneAdmission,
} from '../../src/types/living-frame-blender-selected-scene-admission'
import {
  createPrivateReadStreamWithinRoot,
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  consumeLivingFrameBlenderFixedAdapterOutputLease,
} from './living-frame-blender-fixed-adapter-internal-test'
import {
  verifyLivingFrameBlenderSelectedSceneAdmission,
  type InspectLivingFrameBlenderSelectedSceneAdmissionInput,
} from './living-frame-blender-selected-scene-admission'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAXIMUM_FILE_BYTES = 64 * 1024 * 1024
const MAXIMUM_MANIFEST_BYTES = 512 * 1024

interface PrivatePersistedArtifactSetBinding {
  readonly localStorageRoot: string
  readonly persistenceReportDigestSha256: string
  readonly privateArtifactSetIdentityHash: string
  readonly manifestDigestSha256: string
  readonly files: readonly {
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
    readonly relativePath: string
  }[]
}

const privatePersistedArtifactSetByLease =
  new WeakMap<
    LivingFrameBlenderRigPrivatePersistedArtifactSetLease,
    PrivatePersistedArtifactSetBinding
  >()

export interface ExecuteLivingFrameBlenderRigPrivatePersistenceInternalTestInput {
  readonly qualificationId: string
  readonly localStorageRoot: string
  readonly admission:
    LivingFrameBlenderSelectedSceneAdmission
  readonly admissionInput:
    InspectLivingFrameBlenderSelectedSceneAdmissionInput
  readonly adapterRun: {
    readonly result:
      LivingFrameBlenderFixedAdapterResult
    readonly totalDurationMs: number
    readonly maximumResidentBytes: number
    readonly outputLease:
      LivingFrameBlenderFixedAdapterOutputLease
  }
}

export interface LivingFrameBlenderRigPrivatePersistedArtifactSet {
  readonly persistenceReportDigestSha256: string
  readonly privateArtifactSetIdentityHash: string
  readonly manifestDigestSha256: string
  readonly files: readonly {
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
    readonly openStream: () => Promise<Readable>
  }[]
}

export async function executeLivingFrameBlenderRigPrivatePersistenceInternalTest(
  input:
    ExecuteLivingFrameBlenderRigPrivatePersistenceInternalTestInput,
): Promise<LivingFrameBlenderRigPrivatePersistenceReport> {
  const execution =
    await executePersistence(input)
  return execution.report
}

export async function executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease(
  input:
    ExecuteLivingFrameBlenderRigPrivatePersistenceInternalTestInput,
): Promise<LivingFrameBlenderRigPrivatePersistenceExecution> {
  const execution =
    await executePersistence(input)
  return {
    report: execution.report,
    persistedArtifactSetLease:
      createPersistedArtifactSetLease(
        input.localStorageRoot,
        execution.report,
      ),
  }
}

export async function consumeLivingFrameBlenderRigPrivatePersistedArtifactSetLease(
  lease:
    LivingFrameBlenderRigPrivatePersistedArtifactSetLease,
): Promise<LivingFrameBlenderRigPrivatePersistedArtifactSet> {
  const binding =
    privatePersistedArtifactSetByLease.get(lease)
  if (
    binding == null
    || lease.leaseClass !==
      'process_bound_single_use_living_frame_blender_persisted_artifact_set_lease_v1'
    || lease.callerSerializable !== false
    || lease.assetManifestAuthority !== false
    || lease.qaApprovalAuthority !== false
    || lease.privateReviewAuthority !== false
    || lease.billingAuthority !== false
    || lease.publicDeliveryAuthority !== false
    || lease.productionAuthority !== false
    || lease.persistenceReportDigestSha256 !==
      binding.persistenceReportDigestSha256
    || lease.privateArtifactSetIdentityHash !==
      binding.privateArtifactSetIdentityHash
    || lease.manifestDigestSha256 !==
      binding.manifestDigestSha256
    || stableAuthorityStringify(lease.files)
      !== stableAuthorityStringify(
        binding.files.map((file) =>
          file.commitment),
      )
  ) {
    throw new Error(
      'Living Frame Blender persisted artifact-set lease is invalid, unknown, or already consumed.',
    )
  }
  privatePersistedArtifactSetByLease.delete(lease)
  for (const file of binding.files) {
    await assertPersistedFile(
      binding.localStorageRoot,
      file.relativePath,
      file.commitment,
    )
  }
  const manifest =
    await readPrivateFileIfExistsWithinRoot({
      rootPath: binding.localStorageRoot,
      relativePath: manifestRelativePath(
        binding.privateArtifactSetIdentityHash,
      ),
    })
  if (
    manifest == null
    || createHash('sha256')
      .update(manifest)
      .digest('hex') !==
      binding.manifestDigestSha256
  ) {
    throw new Error(
      'Living Frame Blender persisted artifact-set manifest failed exact lease readback.',
    )
  }
  const openedFiles = new Set<string>()
  return Object.freeze({
    persistenceReportDigestSha256:
      binding.persistenceReportDigestSha256,
    privateArtifactSetIdentityHash:
      binding.privateArtifactSetIdentityHash,
    manifestDigestSha256:
      binding.manifestDigestSha256,
    files: binding.files.map((file) => ({
      commitment: file.commitment,
      openStream: async () => {
        const key =
          `${file.commitment.pass}:${file.commitment.fileName}`
        if (openedFiles.has(key)) {
          throw new Error(
            'Living Frame Blender persisted artifact stream is already consumed.',
          )
        }
        openedFiles.add(key)
        await assertPersistedFile(
          binding.localStorageRoot,
          file.relativePath,
          file.commitment,
        )
        return createPrivateReadStreamWithinRoot({
          rootPath: binding.localStorageRoot,
          relativePath: file.relativePath,
        })
      },
    })),
  })
}

async function executePersistence(
  input:
    ExecuteLivingFrameBlenderRigPrivatePersistenceInternalTestInput,
): Promise<{
  readonly report:
    LivingFrameBlenderRigPrivatePersistenceReport
}> {
  assertInput(input)
  if (
    !await verifyLivingFrameBlenderSelectedSceneAdmission(
      input.admission,
      input.admissionInput,
    )
  ) {
    throw new Error(
      'Living Frame Blender admission is invalid for private persistence.',
    )
  }
  const admission = input.admission
  const lease = input.adapterRun.outputLease
  if (
    lease.candidateRequestDigestSha256 !==
      admission.sourceBindings
        .adapterCandidateRequestDigestSha256
    || lease.riggingPlanDigestSha256 !==
      admission.sourceBindings
        .riggingPlanDigestSha256
    || lease.actionPlanDigestSha256 !==
      admission.sourceBindings
        .actionPlanDigestSha256
    || input.adapterRun.result
      .candidateRequestDigestSha256 !==
      lease.candidateRequestDigestSha256
    || input.adapterRun.result
      .riggingPlanDigestSha256 !==
      lease.riggingPlanDigestSha256
    || input.adapterRun.result
      .actionPlanDigestSha256 !==
      lease.actionPlanDigestSha256
  ) {
    throw new Error(
      'Living Frame Blender output lease lineage does not match the selected-scene admission.',
    )
  }
  const output =
    consumeLivingFrameBlenderFixedAdapterOutputLease(
      lease,
    )
  try {
    assertExactSelectedSceneOutput(
      admission,
      output.files.map((file) =>
        file.commitment),
      output.result.frameCount,
    )
    const privateArtifactSetIdentityHash =
      sha256AuthorityValue({
        contractVersion:
          LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
        canonicalScope: admission.canonicalScope,
        admissionDigestSha256:
          admission.admissionDigestSha256,
        plannedWorkItemDigestSha256:
          admission.sourceBindings
            .plannedWorkItemDigestSha256,
        artifactSetDigestSha256:
          output.artifactSetDigestSha256,
      })
    const persistedFiles: {
      readonly commitment:
        LivingFrameBlenderFixedAdapterOutputFileCommitment
      readonly relativePath: string
    }[] = []
    for (const file of output.files) {
      const relativePath =
        artifactRelativePath(
          privateArtifactSetIdentityHash,
          file.commitment,
        )
      const written =
        await writePrivateStreamCreateOnlyWithinRoot({
          rootPath: input.localStorageRoot,
          relativePath,
          stream: file.openStream(),
          maximumBytes: MAXIMUM_FILE_BYTES,
        })
      if (
        written.byteLength !==
          file.commitment.byteLength
        || written.checksumSha256 !==
          file.commitment.sha256
      ) {
        throw new Error(
          'Living Frame Blender artifact changed during create-only persistence.',
        )
      }
      await assertPersistedFile(
        input.localStorageRoot,
        relativePath,
        file.commitment,
      )
      persistedFiles.push({
        commitment: file.commitment,
        relativePath,
      })
    }
    const manifest = {
      manifestVersion:
        'living-frame-blender-rig-private-artifact-set-manifest-v1',
      privateArtifactSetIdentityHash,
      admissionDigestSha256:
        admission.admissionDigestSha256,
      selectedSceneBindingDigestSha256:
        admission.sourceBindings
          .selectedSceneBindingDigestSha256,
      approvedSnapshotDigestSha256:
        admission.sourceBindings
          .approvedSnapshotDigestSha256,
      plannedWorkItemDigestSha256:
        admission.sourceBindings
          .plannedWorkItemDigestSha256,
      artifactSetDigestSha256:
        output.artifactSetDigestSha256,
      files: persistedFiles.map((file) =>
        file.commitment),
      remotionRemainsFinalCanvas: true,
      canonicalAssetManifestAuthority: false,
      canonicalQaApprovalAuthority: false,
      privateReviewAuthority: false,
      actualCostAuthority: false,
      productionAuthority: false,
    } as const
    const manifestBytes = Buffer.from(
      stableAuthorityStringify(manifest),
      'utf8',
    )
    if (
      manifestBytes.byteLength <= 0
      || manifestBytes.byteLength >
        MAXIMUM_MANIFEST_BYTES
    ) {
      throw new Error(
        'Living Frame Blender private artifact-set manifest is invalid.',
      )
    }
    const manifestDigestSha256 =
      createHash('sha256')
        .update(manifestBytes)
        .digest('hex')
    const manifestPath =
      manifestRelativePath(
        privateArtifactSetIdentityHash,
      )
    const manifestWrite =
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: manifestPath,
        content: manifestBytes,
      })
    if (!manifestWrite.created) {
      throw new Error(
        'Living Frame Blender private artifact-set manifest was replayed unexpectedly.',
      )
    }
    const manifestReadback =
      await readPrivateFileIfExistsWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: manifestPath,
      })
    if (
      manifestReadback == null
      || manifestReadback.byteLength !==
        manifestBytes.byteLength
      || createHash('sha256')
        .update(manifestReadback)
        .digest('hex') !==
        manifestDigestSha256
      || !manifestReadback.equals(manifestBytes)
    ) {
      throw new Error(
        'Living Frame Blender private artifact-set manifest changed during readback.',
      )
    }
    const result = input.adapterRun.result
    const draft:
      LivingFrameBlenderRigPrivatePersistenceReportDraft = {
        contractVersion:
          LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
        resultClass:
          LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS,
        runtimeState:
          LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE,
        qualificationId: input.qualificationId,
        canonicalScope: {
          ...admission.canonicalScope,
        },
        sourceBindings: {
          admissionDigestSha256:
            admission.admissionDigestSha256,
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
          adapterCandidateRequestDigestSha256:
            admission.sourceBindings
              .adapterCandidateRequestDigestSha256,
          riggingPlanDigestSha256:
            admission.sourceBindings
              .riggingPlanDigestSha256,
          actionPlanDigestSha256:
            admission.sourceBindings
              .actionPlanDigestSha256,
          adapterResultDigestSha256:
            output.resultDigestSha256,
          adapterPayloadDigestSha256:
            result.payloadDigestSha256,
          artifactSetDigestSha256:
            output.artifactSetDigestSha256,
        },
        persistedArtifactSet: {
          persistenceOwner:
            'living_frame_blender_rig_private_internal_create_only_persistence',
          storageProfile:
            'canonical_private_local_create_only_files_v1',
          privateArtifactSetIdentityHash,
          manifestDigestSha256,
          manifestByteLength:
            manifestBytes.byteLength,
          fileCount: persistedFiles.length,
          rgbaFileCount:
            countPass(persistedFiles, 'rgba'),
          maskFileCount:
            countPass(persistedFiles, 'mask'),
          depthFileCount:
            countPass(persistedFiles, 'depth'),
          totalArtifactByteLength:
            persistedFiles.reduce(
              (sum, file) =>
                sum
                + file.commitment.byteLength,
              0,
            ),
          files: persistedFiles.map((file) =>
            file.commitment),
          createOnlyPersistenceUsed: true,
          everyFileCreatedExactlyOnce: true,
          exactReadbackVerified: true,
          pngAndExrSignaturesVerified: true,
          rawBytesIncluded: false,
          storagePathsIncluded: false,
        },
        resourceObservation: {
          executionClass:
            'private_internal_native_host_blender_qualification',
          totalDurationMs:
            input.adapterRun.totalDurationMs,
          rigCompileDurationMs:
            result.rigCompileDurationMs,
          renderDurationMs:
            result.renderDurationMs,
          maximumResidentBytes:
            input.adapterRun
              .maximumResidentBytes,
          outputByteLength:
            persistedFiles.reduce(
              (sum, file) =>
                sum
                + file.commitment.byteLength,
              0,
            ),
          actualRuntimeObserved: true,
          canonicalResourceReceiptCreated: false,
          canonicalActualCostCreated: false,
          serviceFeeIncluded: false,
        },
        authorityBoundary: {
          privateInternalPersistenceEvidenceAuthority:
            true,
          selectedSceneAuthority: false,
          approvedSnapshotAuthority: false,
          timingAuthority: false,
          workGraphAuthority: false,
          dispatchAuthority: false,
          canonicalArtifactPersistenceAuthority:
            false,
          assetManifestAuthority: false,
          qaApprovalAuthority: false,
          privateReviewAuthority: false,
          costAuthority: false,
          billingAuthority: false,
          finalCanvasAuthority: false,
          publicDeliveryAuthority: false,
          productionAuthority: false,
        },
        openGateCodes:
          LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_OPEN_GATES,
        admissionRevalidated: true,
        outputLeaseConsumedExactlyOnce: true,
        privateInternalArtifactSetPersisted: true,
        canonicalAssetManifestMutated: false,
        canonicalQaApproved: false,
        privateReviewApproved: false,
        actualCostCreated: false,
        customerCharged: false,
        remotionRemainsFinalCanvas: true,
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
    return { report }
  } finally {
    output.cleanup()
  }
}

function createPersistedArtifactSetLease(
  localStorageRoot: string,
  report:
    LivingFrameBlenderRigPrivatePersistenceReport,
): LivingFrameBlenderRigPrivatePersistedArtifactSetLease {
  const lease = deepFreeze({
    leaseClass:
      'process_bound_single_use_living_frame_blender_persisted_artifact_set_lease_v1' as const,
    leaseId:
      `lf-blender-persisted.${sha256AuthorityValue({
        reportDigestSha256:
          report.reportDigestSha256,
        privateArtifactSetIdentityHash:
          report.persistedArtifactSet
            .privateArtifactSetIdentityHash,
      }).slice(0, 40)}`,
    persistenceReportDigestSha256:
      report.reportDigestSha256,
    privateArtifactSetIdentityHash:
      report.persistedArtifactSet
        .privateArtifactSetIdentityHash,
    manifestDigestSha256:
      report.persistedArtifactSet
        .manifestDigestSha256,
    fileCount:
      report.persistedArtifactSet.fileCount,
    totalArtifactByteLength:
      report.persistedArtifactSet
        .totalArtifactByteLength,
    files: report.persistedArtifactSet.files,
    callerSerializable: false as const,
    assetManifestAuthority: false as const,
    qaApprovalAuthority: false as const,
    privateReviewAuthority: false as const,
    billingAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  })
  privatePersistedArtifactSetByLease.set(
    lease,
    Object.freeze({
      localStorageRoot,
      persistenceReportDigestSha256:
        report.reportDigestSha256,
      privateArtifactSetIdentityHash:
        report.persistedArtifactSet
          .privateArtifactSetIdentityHash,
      manifestDigestSha256:
        report.persistedArtifactSet
          .manifestDigestSha256,
      files: report.persistedArtifactSet.files.map(
        (commitment) => ({
          commitment,
          relativePath:
            artifactRelativePath(
              report.persistedArtifactSet
                .privateArtifactSetIdentityHash,
              commitment,
            ),
        }),
      ),
    }),
  )
  return lease
}

async function assertPersistedFile(
  localStorageRoot: string,
  relativePath: string,
  commitment:
    LivingFrameBlenderFixedAdapterOutputFileCommitment,
): Promise<void> {
  const bytes =
    await readPrivateFileIfExistsWithinRoot({
      rootPath: localStorageRoot,
      relativePath,
    })
  if (
    bytes == null
    || bytes.byteLength !== commitment.byteLength
    || createHash('sha256')
      .update(bytes)
      .digest('hex') !== commitment.sha256
    || !hasExpectedSignature(
      bytes,
      commitment.contentType,
    )
  ) {
    throw new Error(
      'Living Frame Blender persisted artifact failed exact readback.',
    )
  }
}

function hasExpectedSignature(
  bytes: Buffer,
  contentType: 'image/png' | 'image/x-exr',
): boolean {
  if (contentType === 'image/png') {
    return bytes.subarray(0, 8).equals(
      Buffer.from([
        137, 80, 78, 71,
        13, 10, 26, 10,
      ]),
    )
  }
  return bytes.subarray(0, 4).equals(
    Buffer.from([0x76, 0x2f, 0x31, 0x01]),
  )
}

function artifactRelativePath(
  identity: string,
  commitment:
    LivingFrameBlenderFixedAdapterOutputFileCommitment,
): string {
  if (
    !SHA256.test(identity)
    || !/^frame_\d+\.(?:png|exr)$/u.test(
      commitment.fileName,
    )
  ) {
    throw new Error(
      'Living Frame Blender private artifact path binding is invalid.',
    )
  }
  return [
    'living-frame-blender-rig',
    'private-internal-v1',
    identity.slice(0, 2),
    identity,
    commitment.pass,
    commitment.fileName,
  ].join('/')
}

function manifestRelativePath(
  identity: string,
): string {
  if (!SHA256.test(identity)) {
    throw new Error(
      'Living Frame Blender private manifest identity is invalid.',
    )
  }
  return [
    'living-frame-blender-rig',
    'private-internal-v1',
    identity.slice(0, 2),
    identity,
    'manifest.json',
  ].join('/')
}

function countPass(
  files: readonly {
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
  }[],
  pass: 'rgba' | 'mask' | 'depth',
): number {
  return files.filter((file) =>
    file.commitment.pass === pass).length
}

function assertExactSelectedSceneOutput(
  admission: LivingFrameBlenderSelectedSceneAdmission,
  files:
    readonly LivingFrameBlenderFixedAdapterOutputFileCommitment[],
  frameCount: number,
): void {
  const {
    startFrame,
    endFrameExclusive,
    durationFrames,
  } = admission.exactFrameBinding
  if (
    frameCount !== durationFrames
    || files.length !== durationFrames * 3
  ) {
    throw new Error(
      'Living Frame Blender persisted output is not the exact admitted full component sequence.',
    )
  }
  for (const pass of [
    'rgba',
    'mask',
    'depth',
  ] as const) {
    const passFrames = files
      .filter((file) => file.pass === pass)
      .map((file) => file.frame)
      .sort((left, right) => left - right)
    if (
      passFrames.length !== durationFrames
      || passFrames.some(
        (frame, index) =>
          frame !== startFrame + index,
      )
      || passFrames.at(-1) !==
        endFrameExclusive - 1
    ) {
      throw new Error(
        'Living Frame Blender persisted output frame set does not match the admitted MasterTiming visual range.',
      )
    }
  }
}

function assertInput(
  input:
    ExecuteLivingFrameBlenderRigPrivatePersistenceInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'qualificationId',
      'localStorageRoot',
      'admission',
      'admissionInput',
      'adapterRun',
    ].sort().join('|')
    || !SAFE_ID.test(input.qualificationId)
    || typeof input.localStorageRoot !==
      'string'
    || input.localStorageRoot.length < 1
    || !isRecord(input.admission)
    || !isRecord(input.admissionInput)
    || !isRecord(input.adapterRun)
    || !isRecord(input.adapterRun.result)
    || !isRecord(input.adapterRun.outputLease)
    || !Number.isSafeInteger(
      input.adapterRun.totalDurationMs,
    )
    || input.adapterRun.totalDurationMs <= 0
    || !Number.isSafeInteger(
      input.adapterRun.maximumResidentBytes,
    )
    || input.adapterRun.maximumResidentBytes <= 0
  ) {
    throw new Error(
      'Living Frame Blender private persistence input is invalid.',
    )
  }
  assertPrivateInternalStorageRoot(
    input.localStorageRoot,
  )
}

function assertPrivateInternalStorageRoot(
  storageRoot: string,
): void {
  const expectedParent = realpathSync(tmpdir())
  const resolved = resolve(storageRoot)
  const stat = lstatSync(resolved)
  const realStorageRoot = realpathSync(resolved)
  if (
    !stat.isDirectory()
    || stat.isSymbolicLink()
    || dirname(realStorageRoot) !== expectedParent
    || !basename(realStorageRoot).startsWith(
      'reeditpro-lf-blender-persistence-',
    )
  ) {
    throw new Error(
      'Living Frame Blender private persistence root is not an owned bounded internal-test directory.',
    )
  }
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
  ) return value
  Object.freeze(value)
  for (const nested of Object.values(
    value as Record<string, unknown>,
  )) deepFreeze(nested)
  return value
}
