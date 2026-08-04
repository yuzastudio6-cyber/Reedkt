import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_CONSUMER_VERSION,
  createCanonicalModelArtifactReadOnlyMountConsumer,
  createCanonicalModelArtifactReadOnlyMountLease,
  createCanonicalModelArtifactRepository,
  createCanonicalModelArtifactRepositoryRootAuthority,
  createCanonicalModelArtifactSourceReader,
  ingestCanonicalModelArtifact,
  consumeCanonicalModelArtifactReadOnlyMountLease,
  verifyCanonicalModelArtifact,
  type CanonicalModelArtifactDescriptor,
  type CanonicalModelArtifactReadOnlyMountConsumerPort,
  type CanonicalModelArtifactReadOnlyMountLease,
  type CanonicalModelArtifactRepositoryPort,
  type CanonicalModelArtifactSourceReaderPort,
} from '../model-artifacts'

const MODEL_BYTES = Buffer.from(
  'controlled-gpu-model-artifact-fixture-v1',
  'utf8',
)
const MODEL_SHA256 = sha256(MODEL_BYTES)
const INITIAL_NOW_MS = Date.parse('2026-07-27T12:00:00.000Z')

const temporaryRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-model-artifact-repository-'),
)
const canonicalRoot = await realpath(temporaryRoot)
let repositoryNowMs = INITIAL_NOW_MS
let leaseNowMs = INITIAL_NOW_MS

try {
  const rootAuthority =
    await createCanonicalModelArtifactRepositoryRootAuthority({
      rootPath: temporaryRoot,
    })
  assert.equal(rootAuthority.callerPathAccepted, false)
  assert.equal(rootAuthority.remoteStorageAuthority, false)
  assert.equal(rootAuthority.distributedLockAuthority, false)
  assert.equal(rootAuthority.hostileSameUidProtectionProven, false)
  assert.equal(rootAuthority.productionReady, false)
  assert.equal(JSON.stringify(rootAuthority).includes(temporaryRoot), false)
  assert.equal(JSON.stringify(rootAuthority).includes(canonicalRoot), false)

  const repository = createCanonicalModelArtifactRepository({
    rootAuthority,
    now: () => new Date(repositoryNowMs++),
  })
  const descriptor = createGpuDescriptor()
  let sourceOpenCount = 0
  const reader = createCanonicalModelArtifactSourceReader({
    descriptor,
    openServerOwnedByteStream: async () => {
      sourceOpenCount += 1
      return Readable.from([
        MODEL_BYTES.subarray(0, 7),
        MODEL_BYTES.subarray(7),
      ])
    },
  })

  await expectRejects(
    () => ingestCanonicalModelArtifact({
      repository: {
        ...repository,
      } as CanonicalModelArtifactRepositoryPort,
      sourceReader: reader,
    }),
    'forged repository capability',
    'model_artifact_repository_capability_invalid',
  )
  await expectRejects(
    () => ingestCanonicalModelArtifact({
      repository,
      sourceReader: {
        ...reader,
      } as CanonicalModelArtifactSourceReaderPort,
    }),
    'forged source-reader capability',
    'model_artifact_source_reader_capability_invalid',
  )
  assert.equal(sourceOpenCount, 0)

  assert.throws(
    () => createCanonicalModelArtifactSourceReader({
      descriptor: {
        ...descriptor,
        artifactId: '../escape',
      },
      openServerOwnedByteStream: async () => Readable.from([MODEL_BYTES]),
    }),
    /invalid/u,
    'traversal identity should fail closed',
  )
  assert.throws(
    () => createCanonicalModelArtifactSourceReader({
      descriptor: {
        ...descriptor,
        consumerScopes: [
          'sam2.private-inference',
          'comfyui.private-inference',
        ],
      },
      openServerOwnedByteStream: async () => Readable.from([MODEL_BYTES]),
    }),
    /invalid/u,
    'non-canonical consumer order should fail closed',
  )
  assert.throws(
    () => createCanonicalModelArtifactSourceReader({
      descriptor: {
        ...descriptor,
        executionPolicy: {
          ...descriptor.executionPolicy,
          requiredExecutionTarget: 'private_controlled_cpu',
        },
      } as CanonicalModelArtifactDescriptor,
      openServerOwnedByteStream: async () => Readable.from([MODEL_BYTES]),
    }),
    /invalid/u,
    'GPU artifact CPU placement should fail closed',
  )
  assert.throws(
    () => createCanonicalModelArtifactSourceReader({
      descriptor: {
        ...descriptor,
        licensePolicy: {
          ...descriptor.licensePolicy,
          paidProductionUseApproved: true,
        },
      },
      openServerOwnedByteStream: async () => Readable.from([MODEL_BYTES]),
    }),
    /invalid/u,
    'forged paid-production approval should fail closed',
  )
  assert.throws(
    () => createCanonicalModelArtifactSourceReader({
      descriptor: {
        ...descriptor,
        forgedRuntimeAuthority: true,
      } as CanonicalModelArtifactDescriptor,
      openServerOwnedByteStream: async () => Readable.from([MODEL_BYTES]),
    }),
    /invalid/u,
    'unknown descriptor keys should fail closed',
  )

  const wrongBytesDescriptor = createGpuDescriptor({
    artifactId: 'controlled-wrong-bytes',
    revision: 'revision-wrong-bytes',
  })
  const wrongBytesReader = createCanonicalModelArtifactSourceReader({
    descriptor: wrongBytesDescriptor,
    openServerOwnedByteStream: async () => Readable.from([
      Buffer.alloc(MODEL_BYTES.length, 0x61),
    ]),
  })
  await expectRejects(
    () => ingestCanonicalModelArtifact({
      repository,
      sourceReader: wrongBytesReader,
    }),
    'wrong source checksum',
    'model_artifact_source_integrity_mismatch',
  )
  assert.deepEqual(
    await readdir(join(canonicalRoot, 'staging')),
    [],
    'failed ingest must remove staging bytes',
  )
  await expectRejects(
    () => ingestCanonicalModelArtifact({
      repository,
      sourceReader: wrongBytesReader,
    }),
    'single-use source reader',
    'model_artifact_source_reader_already_consumed',
  )

  const created = await ingestCanonicalModelArtifact({
    repository,
    sourceReader: reader,
  })
  assert.equal(created.disposition, 'created')
  assert.equal(created.sourceStreamOpened, true)
  assert.equal(created.contentObjectCreated, true)
  assert.equal(created.manifestCreated, true)
  assert.equal(created.verifiedContentSha256, MODEL_SHA256)
  assert.equal(created.verifiedByteLength, MODEL_BYTES.length)
  assert.equal(created.callerBytesAccepted, false)
  assert.equal(created.callerPathAccepted, false)
  assert.equal(created.callerUrlAccepted, false)
  assert.equal(created.providerCallMade, false)
  assert.equal(created.remoteMutationMade, false)
  assert.equal(created.customerCreditsMutated, false)
  assert.equal(created.productionReady, false)
  assert.equal(sourceOpenCount, 1)
  assert.equal(JSON.stringify(created).includes(canonicalRoot), false)

  const objectPath = join(
    canonicalRoot,
    'objects',
    MODEL_SHA256.slice(0, 2),
    `${MODEL_SHA256}.bin`,
  )
  const recordDigest = created.locator.artifactRecordId.slice(
    'model-artifact-'.length,
  )
  const manifestPath = join(
    canonicalRoot,
    'manifests',
    recordDigest.slice(0, 2),
    `${recordDigest}.json`,
  )
  const objectStat = await lstat(objectPath)
  assert.equal(objectStat.isFile(), true)
  assert.equal(objectStat.isSymbolicLink(), false)
  assert.equal(objectStat.nlink, 1)
  assert.equal(objectStat.mode & 0o777, 0o400)
  assert.deepEqual(await readFile(objectPath), MODEL_BYTES)

  const verified = await verifyCanonicalModelArtifact({
    repository,
    locator: created.locator,
  })
  assert.equal(verified.verifiedContentSha256, MODEL_SHA256)
  assert.equal(verified.verifiedByteLength, MODEL_BYTES.length)
  assert.equal(verified.hostPathIncluded, false)
  assert.equal(verified.bytesIncluded, false)
  assert.equal(verified.manifest.authorityBoundary.repositoryIntegrityAuthority, true)
  assert.equal(verified.manifest.authorityBoundary.modelInferenceAuthority, false)
  assert.equal(verified.manifest.authorityBoundary.runtimeAuthority, false)
  assert.equal(verified.manifest.authorityBoundary.productionReady, false)
  assert.equal(
    verified.manifest.descriptor.executionPolicy.requiredExecutionTarget,
    'google_cloud_run_gpu',
  )
  assert.equal(
    verified.manifest.descriptor.executionPolicy.cpuFallbackAllowed,
    false,
  )

  let replayOpened = false
  const replay = await ingestCanonicalModelArtifact({
    repository,
    sourceReader: createCanonicalModelArtifactSourceReader({
      descriptor,
      openServerOwnedByteStream: async () => {
        replayOpened = true
        throw new Error('idempotent replay must not reopen source bytes')
      },
    }),
  })
  assert.equal(replay.disposition, 'idempotent_replay')
  assert.equal(replay.sourceStreamOpened, false)
  assert.equal(replayOpened, false)
  assert.deepEqual(replay.locator, created.locator)

  const aliasDescriptor = createGpuDescriptor({
    artifactId: 'controlled-gpu-model-alias',
    revision: 'revision-alias-v1',
  })
  let aliasSourceOpened = false
  const alias = await ingestCanonicalModelArtifact({
    repository,
    sourceReader: createCanonicalModelArtifactSourceReader({
      descriptor: aliasDescriptor,
      openServerOwnedByteStream: async () => {
        aliasSourceOpened = true
        return Readable.from([MODEL_BYTES])
      },
    }),
  })
  assert.equal(alias.disposition, 'reused_verified_content_object')
  assert.equal(alias.sourceStreamOpened, false)
  assert.equal(alias.contentObjectCreated, false)
  assert.equal(alias.manifestCreated, true)
  assert.equal(aliasSourceOpened, false)
  assert.notEqual(alias.locator.artifactRecordId, created.locator.artifactRecordId)
  assert.equal(
    (await readdir(join(canonicalRoot, 'objects', MODEL_SHA256.slice(0, 2))))
      .filter((entry) => entry.endsWith('.bin')).length,
    1,
    'identical bytes should retain one content object',
  )

  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: {
        ...created.locator,
        manifestDigestSha256: sha256('forged-manifest-digest'),
      },
    }),
    'forged locator digest',
    'model_artifact_locator_manifest_mismatch',
  )
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: {
        ...created.locator,
        hostPath: objectPath,
      } as typeof created.locator,
    }),
    'caller host path in locator',
    'model_artifact_locator_invalid',
  )

  await chmod(objectPath, 0o600)
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: created.locator,
    }),
    'writable object mode',
    'model_artifact_object_not_immutable_regular_file',
  )
  await chmod(objectPath, 0o400)

  const hardLinkPath = `${objectPath}.hardlink`
  await link(objectPath, hardLinkPath)
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: created.locator,
    }),
    'hard-linked object',
    'model_artifact_object_not_immutable_regular_file',
  )
  await rm(hardLinkPath)

  const objectBackupPath = `${objectPath}.backup`
  await rename(objectPath, objectBackupPath)
  await symlink(objectBackupPath, objectPath)
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: created.locator,
    }),
    'symbolic-link object',
    'model_artifact_object_not_immutable_regular_file',
  )
  await rm(objectPath)
  await rename(objectBackupPath, objectPath)

  await chmod(objectPath, 0o600)
  await writeFile(
    objectPath,
    Buffer.alloc(MODEL_BYTES.length, 0x62),
  )
  await chmod(objectPath, 0o400)
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: created.locator,
    }),
    'tampered object bytes',
    'model_artifact_object_integrity_invalid',
  )
  await chmod(objectPath, 0o600)
  await writeFile(objectPath, MODEL_BYTES)
  await chmod(objectPath, 0o400)
  await verifyCanonicalModelArtifact({
    repository,
    locator: created.locator,
  })

  const manifestBytes = await readFile(manifestPath)
  const manifestHardLinkPath = `${manifestPath}.hardlink`
  await link(manifestPath, manifestHardLinkPath)
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: created.locator,
    }),
    'hard-linked manifest',
    'model_artifact_manifest_file_invalid',
  )
  await rm(manifestHardLinkPath)
  const manifestRecord = JSON.parse(manifestBytes.toString('utf8')) as
    Record<string, unknown>
  await writeFile(manifestPath, JSON.stringify({
    ...manifestRecord,
    forgedAuthority: true,
  }))
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: created.locator,
    }),
    'unknown manifest field',
    'model_artifact_manifest_schema_invalid',
  )
  await writeFile(manifestPath, manifestBytes)
  await verifyCanonicalModelArtifact({
    repository,
    locator: created.locator,
  })

  const misplacedObjectPath = `${objectPath}.missing`
  await rename(objectPath, misplacedObjectPath)
  await expectRejects(
    () => verifyCanonicalModelArtifact({
      repository,
      locator: created.locator,
    }),
    'manifest without object',
    'model_artifact_content_object_not_found',
  )
  await rename(misplacedObjectPath, objectPath)

  await expectRejects(
    () => createCanonicalModelArtifactReadOnlyMountLease({
      repository,
      locator: created.locator,
      leaseId: 'gpu-lease-wrong-target',
      consumerScope: 'comfyui.private-inference',
      executionTarget: 'private_controlled_cpu',
      now: () => new Date(leaseNowMs),
    }),
    'GPU artifact CPU mount target',
    'model_artifact_execution_target_mismatch',
  )
  await expectRejects(
    () => createCanonicalModelArtifactReadOnlyMountLease({
      repository,
      locator: created.locator,
      leaseId: 'gpu-lease-wrong-tenant',
      consumerScope: 'unadmitted.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      now: () => new Date(leaseNowMs),
    }),
    'unadmitted consumer scope',
    'model_artifact_consumer_scope_not_admitted',
  )

  const lease = await createCanonicalModelArtifactReadOnlyMountLease({
    repository,
    locator: created.locator,
    leaseId: 'gpu-lease-controlled-1',
    consumerScope: 'comfyui.private-inference',
    executionTarget: 'google_cloud_run_gpu',
    leaseDurationMs: 30_000,
    now: () => new Date(leaseNowMs),
  })
  assert.equal(lease.readOnly, true)
  assert.equal(lease.executionTarget, 'google_cloud_run_gpu')
  assert.equal(lease.cpuFallbackAllowed, false)
  assert.equal(lease.runtimeDownloadAllowed, false)
  assert.equal(lease.networkFetchAllowed, false)
  assert.equal(lease.hostPathIncluded, false)
  assert.equal(lease.mountAliasIncluded, false)
  assert.equal(lease.modelInferenceAuthority, false)
  assert.equal(lease.productionReady, false)
  assert.equal(
    JSON.stringify(lease).includes('gpu-lease-controlled-1'),
    false,
  )
  assert.equal(JSON.stringify(lease).includes(canonicalRoot), false)

  const forgedConsumer = {
    consumerVersion:
      CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_CONSUMER_VERSION,
    consumerClass:
      'process_bound_private_read_only_model_artifact_consumer',
    consumerScope: 'comfyui.private-inference',
    executionTarget: 'google_cloud_run_gpu',
    callerPathAccepted: false,
    callerBytesAccepted: false,
    callerUrlAccepted: false,
    modelExecutionAuthorized: false,
    productionReady: false,
    consumeReadOnlyModelArtifact: async () => undefined,
  } as CanonicalModelArtifactReadOnlyMountConsumerPort
  await expectRejects(
    () => consumeCanonicalModelArtifactReadOnlyMountLease({
      lease,
      consumer: forgedConsumer,
    }),
    'forged mount consumer',
    'model_artifact_mount_consumer_capability_invalid',
  )
  const wrongConsumer =
    createCanonicalModelArtifactReadOnlyMountConsumer({
      consumerScope: 'sam2.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      consumeReadOnlyModelArtifact: async () => undefined,
    })
  await expectRejects(
    () => consumeCanonicalModelArtifactReadOnlyMountLease({
      lease,
      consumer: wrongConsumer,
    }),
    'cross-consumer lease use',
    'model_artifact_mount_consumer_mismatch',
  )

  let consumerCallCount = 0
  const consumer =
    createCanonicalModelArtifactReadOnlyMountConsumer({
      consumerScope: 'comfyui.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      consumeReadOnlyModelArtifact: async (mountInput) => {
        consumerCallCount += 1
        assert.equal(mountInput.sourceAbsolutePath, objectPath)
        assert.match(
          mountInput.serverDerivedMountAlias,
          /^\/opt\/reeditpro\/model-artifacts\/model-artifact-[a-f0-9]{64}\/artifact\.onnx$/u,
        )
        assert.equal(mountInput.expectedContentSha256, MODEL_SHA256)
        assert.equal(mountInput.expectedByteLength, MODEL_BYTES.length)
        assert.equal(mountInput.executionTarget, 'google_cloud_run_gpu')
        assert.equal(mountInput.accelerator, 'cuda')
        assert.equal(mountInput.readOnly, true)
        assert.equal(mountInput.cpuFallbackAllowed, false)
        assert.equal(mountInput.runtimeDownloadAllowed, false)
        assert.equal(mountInput.networkFetchAllowed, false)
        assert.equal((await lstat(mountInput.sourceAbsolutePath)).mode & 0o777, 0o400)
        assert.deepEqual(
          await readFile(mountInput.sourceAbsolutePath),
          MODEL_BYTES,
        )
      },
    })
  const consumption =
    await consumeCanonicalModelArtifactReadOnlyMountLease({
      lease,
      consumer,
    })
  assert.equal(consumerCallCount, 1)
  assert.equal(consumption.objectVerifiedBeforeConsumer, true)
  assert.equal(consumption.objectVerifiedAfterConsumer, true)
  assert.equal(consumption.readOnlySourcePresented, true)
  assert.equal(consumption.hostPathIncluded, false)
  assert.equal(consumption.mountAliasIncluded, false)
  assert.equal(consumption.modelInferenceExecuted, false)
  assert.equal(consumption.providerCallMade, false)
  assert.equal(consumption.remoteMutationMade, false)
  assert.equal(consumption.customerCreditsMutated, false)
  assert.equal(consumption.productionReady, false)
  assert.equal(JSON.stringify(consumption).includes(canonicalRoot), false)
  await expectRejects(
    () => consumeCanonicalModelArtifactReadOnlyMountLease({
      lease,
      consumer,
    }),
    'single-use lease replay',
    'model_artifact_mount_lease_already_consumed',
  )

  const forgedLease = {
    ...lease,
  } as CanonicalModelArtifactReadOnlyMountLease
  await expectRejects(
    () => consumeCanonicalModelArtifactReadOnlyMountLease({
      lease: forgedLease,
      consumer,
    }),
    'forged mount lease',
    'model_artifact_mount_lease_capability_invalid',
  )

  const expiringLease =
    await createCanonicalModelArtifactReadOnlyMountLease({
      repository,
      locator: created.locator,
      leaseId: 'gpu-lease-expiring',
      consumerScope: 'comfyui.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      leaseDurationMs: 5,
      now: () => new Date(leaseNowMs),
    })
  leaseNowMs += 5
  await expectRejects(
    () => consumeCanonicalModelArtifactReadOnlyMountLease({
      lease: expiringLease,
      consumer,
    }),
    'expired mount lease',
    'model_artifact_mount_lease_expired',
  )

  leaseNowMs += 1
  const mutatingLease =
    await createCanonicalModelArtifactReadOnlyMountLease({
      repository,
      locator: created.locator,
      leaseId: 'gpu-lease-mutation',
      consumerScope: 'comfyui.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      leaseDurationMs: 30_000,
      now: () => new Date(leaseNowMs),
    })
  const mutatingConsumer =
    createCanonicalModelArtifactReadOnlyMountConsumer({
      consumerScope: 'comfyui.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      consumeReadOnlyModelArtifact: async (mountInput) => {
        await chmod(mountInput.sourceAbsolutePath, 0o600)
      },
    })
  await expectRejects(
    () => consumeCanonicalModelArtifactReadOnlyMountLease({
      lease: mutatingLease,
      consumer: mutatingConsumer,
    }),
    'consumer mutates immutable object',
    'model_artifact_object_not_immutable_regular_file',
  )
  await chmod(objectPath, 0o400)
  await verifyCanonicalModelArtifact({
    repository,
    locator: created.locator,
  })

  const symlinkContainer = join(
    temporaryRoot,
    'root-symlink-container',
  )
  const symlinkTarget = join(
    temporaryRoot,
    'root-symlink-target',
  )
  await mkdir(symlinkTarget, { mode: 0o700 })
  await symlink(symlinkTarget, symlinkContainer)
  await expectRejects(
    () => createCanonicalModelArtifactRepositoryRootAuthority({
      rootPath: symlinkContainer,
    }),
    'symbolic-link repository root',
    'model_artifact_repository_root_not_regular',
  )

  console.log(JSON.stringify({
    ok: true,
    smoke: 'canonical-model-artifact-repository',
    controlledArtifacts: 2,
    contentObjects: 1,
    fullChecksumOnEveryRead: true,
    readOnlyGpuMountConsumptions: 1,
    adversarialAssertions: 27,
    executionPlacement: 'google_cloud_run_gpu',
    cpuFallbackAllowed: false,
    providerCallMade: false,
    remoteMutationMade: false,
    customerCreditsMutated: false,
    modelInferenceExecuted: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}

function createGpuDescriptor(
  overrides: Partial<CanonicalModelArtifactDescriptor> = {},
): CanonicalModelArtifactDescriptor {
  return {
    descriptorVersion:
      CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
    artifactId: 'controlled-gpu-model-fixture',
    revision: 'revision-controlled-v1',
    artifactFormat: 'onnx',
    artifactRole: 'identity-continuity-embedding',
    modelFamily: 'auraface',
    byteLength: MODEL_BYTES.length,
    contentSha256: MODEL_SHA256,
    consumerScopes: [
      'auraface.private-continuity',
      'comfyui.private-inference',
      'sam2.private-inference',
    ],
    repositoryAdmission: 'controlled_internal_test',
    sourceObservationDigestSha256:
      sha256('controlled-source-observation'),
    reviewEvidenceDigestSha256:
      sha256('controlled-review-evidence'),
    securityReviewDigestSha256:
      sha256('controlled-security-review'),
    licensePolicy: {
      modelArtifactLicense: 'apache-2.0-observed-not-approved',
      commercialUseStatus: 'needs_review',
      reviewStatus: 'evaluation_only',
      redistributionAllowed: false,
      requiresAttribution: false,
      paidProductionUseApproved: false,
      sourceLicenseDocumentSha256:
        sha256('controlled-license-document'),
      modelCardDocumentSha256:
        sha256('controlled-model-card-document'),
    },
    executionPolicy: {
      executionClass: 'gpu_required',
      requiredExecutionTarget: 'google_cloud_run_gpu',
      accelerator: 'cuda',
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
    ...overrides,
  }
}

async function expectRejects(
  operation: () => Promise<unknown>,
  label: string,
  expectedReason: string,
): Promise<void> {
  try {
    await operation()
    assert.fail(`${label} should have failed closed`)
  } catch (error) {
    assert.match(
      JSON.stringify(error),
      new RegExp(expectedReason, 'u'),
      `${label} rejected for the wrong reason`,
    )
  }
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}
