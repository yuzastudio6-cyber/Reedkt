import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import {
  createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository,
} from '../services/canonical-track-all-sam3_1-artifact-repository-release'
import {
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease,
} from '../services/canonical-track-all-sam3_1-artifact-repository-release-publisher'
import {
  CANONICAL_TRACK_ALL_SAM3_1_STORAGE_PROBE_PORT_VERSION,
  createCanonicalTrackAllSam31StorageQualificationRepository,
  qualifyCanonicalTrackAllSam31Storage,
  type CanonicalTrackAllSam31StorageProbePort,
  type CanonicalTrackAllSam31StorageRole,
} from '../services/canonical-track-all-sam3_1-storage-qualification-owner'
import {
  canonicalCaptionTrackAllRepositoryQualificationFixture as fixture,
} from './canonical-caption-track-all-support-service-smoke'

let checks = 0
const check = (condition: unknown) => {
  assert.ok(condition)
  checks += 1
}
const at = '2026-08-06T19:30:00.000Z'
const storageExpiresAt = '2026-08-13T19:00:00.000Z'
const releaseExpiresAt = '2026-08-12T19:00:00.000Z'
const objectPort = memoryObjectPort()
const storageQualificationRepository =
  createCanonicalTrackAllSam31StorageQualificationRepository({
    objectPort,
    prefix: 'private/smoke/track-all/storage-qualifications/v1',
  })
const releaseRepository =
  createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository({
    objectPort,
    prefix: 'private/smoke/track-all/artifact-releases/v1',
  })
const controlStorage = await qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'smoke-control-plane-storage-qualification',
  expiresAt: storageExpiresAt,
}, {
  probePort: probe('control_plane_state'),
  qualificationRepository: storageQualificationRepository,
})
const maskStorage = await qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'smoke-private-mask-storage-qualification',
  expiresAt: storageExpiresAt,
}, {
  probePort: probe('private_mask_artifacts'),
  qualificationRepository: storageQualificationRepository,
})
const request = {
  releaseId: 'smoke-track-all-sam3_1-artifact-repository-release',
  supportRequestRef: fixture.supportRequestRef,
  controlPlaneStateStorageQualificationRef: controlStorage.qualificationRef,
  privateMaskArtifactStorageQualificationRef: maskStorage.qualificationRef,
  qualifiedAt: at,
  expiresAt: releaseExpiresAt,
}
const dependencies = {
  taskContextRepository: fixture.taskContextRepository,
  taskStore: fixture.taskStore,
  runtimeResultStore: fixture.runtimeResultStore,
  taskQaRepository: fixture.taskQaRepository,
  captionSceneEvidenceRepository: fixture.captionSceneEvidenceRepository,
  captionTrackAllEvidenceRepository: fixture.captionTrackAllEvidenceRepository,
  storageQualificationReadPort: storageQualificationRepository,
  releaseRepository,
}

const first = await publishCanonicalTrackAllSam31ArtifactRepositoryRelease(
  request,
  dependencies,
)
check(first.disposition === 'created')
check(first.exactSixRepositoryChainRereadAndReplayVerified)
check(first.exactStorageQualificationsReread)
check(first.release.componentRepositoryVersions.taskContextRepository
  === fixture.taskContextRepository.schemaVersion)
check(first.release.componentRepositoryVersions.taskStore
  === fixture.taskStore.schemaVersion)
check(first.release.componentRepositoryVersions.runtimeResultStore
  === fixture.runtimeResultStore.schemaVersion)
check(first.release.componentRepositoryVersions.taskQaRepository
  === fixture.taskQaRepository.schemaVersion)
check(first.release.componentRepositoryVersions.captionSceneEvidenceRepository
  === fixture.captionSceneEvidenceRepository.schemaVersion)
check(first.release.componentRepositoryVersions.captionTrackAllEvidenceRepository
  === fixture.captionTrackAllEvidenceRepository.schemaVersion)
check(first.release.componentQualificationRefs.taskStore.id
  === fixture.task.taskId)
check(first.release.componentQualificationRefs.runtimeResultStore.id
  === fixture.result.resultAdmissionId)
check(first.release.componentQualificationRefs.taskQaRepository.id
  === fixture.authority.authorityId)
check(first.release.componentQualificationRefs.captionSceneEvidenceRepository.id
  === fixture.sceneEvidence.evidenceId)
check(first.release.componentQualificationRefs.captionTrackAllEvidenceRepository.id
  === fixture.record.recordId)
check(!first.gpuJobStarted && !first.providerOrModelExecuted
  && !first.customerCreditsMutated && !first.qaApprovalGranted
  && !first.publicDeliveryAuthorized && !first.productionAuthorityGranted)

const replay = await publishCanonicalTrackAllSam31ArtifactRepositoryRelease(
  request,
  dependencies,
)
check(replay.disposition === 'identical_replay')
check(replay.release.releaseHash === first.release.releaseHash)

await assert.rejects(() =>
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease({
    ...request,
    supportRequestRef: {
      ...request.supportRequestRef,
      id: 'missing-support-request',
    },
  }, dependencies))
checks += 1
await assert.rejects(() =>
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease({
    ...request,
    controlPlaneStateStorageQualificationRef: maskStorage.qualificationRef,
    privateMaskArtifactStorageQualificationRef: controlStorage.qualificationRef,
  }, dependencies))
checks += 1
await assert.rejects(() =>
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease({
    ...request,
    expiresAt: '2026-08-14T19:00:00.000Z',
  }, dependencies))
checks += 1
await assert.rejects(() =>
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease({
    ...request,
    callerRepositoryQualified: true,
  } as never, dependencies))
checks += 1
await assert.rejects(() =>
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease(request, {
    ...dependencies,
    taskStore: {
      ...fixture.taskStore,
      async rereadTask() { return null },
    },
  }))
checks += 1
await assert.rejects(() =>
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease(request, {
    ...dependencies,
    taskStore: {
      ...fixture.taskStore,
      async persistTaskCreateOnly() { return 'created' as const },
    },
  }))
checks += 1
await assert.rejects(() =>
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease(request, {
    ...dependencies,
    captionSceneEvidenceRepository: {
      ...fixture.captionSceneEvidenceRepository,
      async rereadByRef() {
        return {
          ...fixture.sceneEvidence,
          evidenceDigestSha256: '0'.repeat(64),
        }
      },
    },
  }))
checks += 1

const cliSource = readFileSync(new URL(
  '../cli/publish-track-all-sam3_1-artifact-repository-release.ts',
  import.meta.url,
), 'utf8')
const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url),
  'utf8',
)) as { scripts?: Record<string, string> }
check(cliSource.includes('createCanonicalSam31GpuTaskContextRepository'))
check(cliSource.includes('createCanonicalSam31GpuTaskStoreFromObjectPort'))
check(cliSource.includes(
  'createCanonicalSam31GpuRuntimeResultStoreFromObjectPort',
))
check(cliSource.includes('createCanonicalTrackAllSam31TaskQaRepository'))
check(cliSource.includes(
  'createCanonicalTrackAllSam31CaptionSceneEvidenceRepository',
))
check(cliSource.includes('createCanonicalCaptionTrackAllEvidenceRepository'))
check(!/callerRepositoryQualified\s*:\s*true|gpuJobStarted\s*:\s*true/u
  .test(cliSource))
check(packageJson.scripts?.[
  'publish:track-all-sam3_1-artifact-repository-release'
] === 'tsx server/cli/publish-track-all-sam3_1-artifact-repository-release.ts')

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-artifact-repository-release-publisher',
  checks,
  exactSixRepositoryCanonicalChainReread: true,
  exactIdenticalReplayAcrossSixRepositories: true,
  exactLiveStorageQualificationRereadRequired: true,
  crossedStaleMissingAndTamperedEvidenceRejected: true,
  callerRepositoryQualificationRejected: true,
  gpuJobStarted: false,
  providerOrModelExecuted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function probe(
  role: CanonicalTrackAllSam31StorageRole,
): CanonicalTrackAllSam31StorageProbePort {
  const objects = new Map<string, Buffer>()
  const bucketName = role === 'control_plane_state'
    ? 'reeditpro-production-reeditpro-control-plane-state'
    : 'reeditpro-production-reeditpro-masks'
  return {
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_STORAGE_PROBE_PORT_VERSION,
    projectId: 'reeditpro',
    role,
    bucketName,
    async readSecurityObservation() {
      return {
        projectId: 'reeditpro',
        bucketName,
        location: 'us-central1',
        uniformBucketLevelAccessEnabled: true,
        publicAccessPrevention: 'enforced',
        publicIamPrincipalCount: 0,
        browserOrCallerPolicyAccepted: false,
        observedAt: '2026-08-06T19:00:00.000Z',
      }
    },
    async createOnly(input) {
      assert.equal(hashBytes(input.body), input.contentSha256)
      const existing = objects.get(input.objectPath)
      if (!existing) {
        objects.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      }
      if (existing.equals(input.body)) return 'identical_replay'
      throw new Error('storage conflict')
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function memoryObjectPort() {
  const objects = new Map<string, Buffer>()
  return {
    async createOnly(input: {
      readonly objectPath: string
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      assert.equal(hashBytes(input.body), input.contentSha256)
      const existing = objects.get(input.objectPath)
      if (!existing) {
        objects.set(input.objectPath, Buffer.from(input.body))
        return 'created' as const
      }
      if (existing.equals(input.body)) return 'already_exists' as const
      throw new Error('create-only conflict')
    },
    async readExact(objectPath: string) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
