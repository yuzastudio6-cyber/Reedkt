import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalTrackAllSam31StorageQualification,
  CANONICAL_TRACK_ALL_SAM3_1_STORAGE_PROBE_PORT_VERSION,
  createCanonicalTrackAllSam31StorageQualificationRepository,
  qualifyCanonicalTrackAllSam31Storage,
  type CanonicalTrackAllSam31StorageProbePort,
  type CanonicalTrackAllSam31StorageRole,
} from '../services/canonical-track-all-sam3_1-storage-qualification-owner'

let checks = 0
const check = (value: unknown) => {
  assert.ok(value)
  checks += 1
}

const repositoryObjects = new Map<string, Buffer>()
const objectPort = createObjectPort(repositoryObjects)
const qualificationRepository =
  createCanonicalTrackAllSam31StorageQualificationRepository({ objectPort })
const at = '2026-08-06T19:00:00.000Z'
const expiresAt = '2026-08-13T19:00:00.000Z'

const control = await qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'track-all-control-plane-storage-qualification-20260806',
  expiresAt,
}, {
  probePort: createProbePort('control_plane_state'),
  qualificationRepository,
})
check(control.disposition === 'created')
check(control.qualification.role === 'control_plane_state')
check(control.qualification.bucketName
  === 'reeditpro-production-reeditpro-control-plane-state')
check(control.qualification.securityObservation
  .uniformBucketLevelAccessEnabled)
check(control.qualification.securityObservation.publicAccessPrevention
  === 'enforced')
check(control.qualification.exactIdenticalReplayObserved)
check(control.qualification.conflictingReplayRejected)
check(control.qualification.exactReadAfterWriteObserved)
check(control.qualification.detachedSecondRereadObserved)
check(control.qualification.unrelatedQualificationPrefixReturnedNoObject)
check(control.exactPersistedRereadVerified)
check(!control.gpuJobStarted && !control.customerCreditsMutated
  && !control.productionAuthorityGranted)

const replay = await qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'track-all-control-plane-storage-qualification-20260806',
  expiresAt,
}, {
  probePort: createProbePort('control_plane_state'),
  qualificationRepository,
})
check(replay.disposition === 'identical_replay')
check(replay.qualification.qualificationHash
  === control.qualification.qualificationHash)

const masks = await qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'track-all-mask-storage-qualification-20260806',
  expiresAt,
}, {
  probePort: createProbePort('private_mask_artifacts'),
  qualificationRepository,
})
check(masks.qualification.role === 'private_mask_artifacts')
check(masks.qualification.bucketName
  === 'reeditpro-production-reeditpro-masks')
check(masks.qualification.qualificationHash
  !== control.qualification.qualificationHash)

assert.throws(() => assertCanonicalTrackAllSam31StorageQualification(
  control.qualification,
  expiresAt,
))
checks += 1
assert.throws(() => assertCanonicalTrackAllSam31StorageQualification({
  ...control.qualification,
  productionAuthorityGranted: true,
}))
checks += 1
assert.throws(() => assertCanonicalTrackAllSam31StorageQualification({
  ...control.qualification,
  qualificationHash: '0'.repeat(64),
}))
checks += 1

await assert.rejects(() => qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'crossed-bucket',
  expiresAt,
}, {
  probePort: {
    ...createProbePort('control_plane_state'),
    bucketName: 'reeditpro-production-reeditpro-masks',
  },
  qualificationRepository,
}))
checks += 1
await assert.rejects(() => qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'public-access-accepted',
  expiresAt,
}, {
  probePort: createProbePort('control_plane_state', {
    publicAccessPrevention: 'inherited',
  }),
  qualificationRepository,
}))
checks += 1
await assert.rejects(() => qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'conflict-not-rejected',
  expiresAt,
}, {
  probePort: createProbePort('control_plane_state', {
    acceptConflict: true,
  }),
  qualificationRepository,
}))
checks += 1
await assert.rejects(() => qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'partial-reread',
  expiresAt,
}, {
  probePort: createProbePort('control_plane_state', {
    eraseReread: true,
  }),
  qualificationRepository,
}))
checks += 1
await assert.rejects(() => qualifyCanonicalTrackAllSam31Storage({
  qualificationId: 'caller-field',
  expiresAt,
  callerQualified: true,
} as never, {
  probePort: createProbePort('control_plane_state'),
  qualificationRepository,
}))
checks += 1

const accessor: Record<string, unknown> = {
  qualificationId: 'accessor-input',
  expiresAt,
}
Object.defineProperty(accessor, 'qualifiedAt', {
  enumerable: true,
  get() {
    throw new Error('getter must not execute')
  },
})
await assert.rejects(() => qualifyCanonicalTrackAllSam31Storage(
  accessor as never,
  {
    probePort: createProbePort('control_plane_state'),
    qualificationRepository,
  },
))
checks += 1

const cliSource = readFileSync(new URL(
  '../cli/qualify-track-all-sam3_1-private-storage.ts',
  import.meta.url,
), 'utf8')
const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url),
  'utf8',
)) as { scripts?: Record<string, string> }
check(cliSource.includes('createCanonicalGcsTrackAllSam31StorageProbePort'))
check(cliSource.includes("'control_plane_state'"))
check(cliSource.includes("'private_mask_artifacts'"))
check(!/customerCreditsMutated\s*:\s*true|gpuJobStarted\s*:\s*true/u
  .test(cliSource))
check(packageJson.scripts?.['qualify:track-all-sam3_1-private-storage']
  === 'tsx server/cli/qualify-track-all-sam3_1-private-storage.ts')

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-storage-qualification-owner',
  checks,
  controlPlaneAndMaskBucketsQualifiedSeparately: true,
  createOnlyReplayConflictRereadAndIsolationProven: true,
  uniformAccessAndPublicAccessPreventionRequired: true,
  callerBucketPolicyOrQualificationRejected: true,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function createProbePort(
  role: CanonicalTrackAllSam31StorageRole,
  behavior: {
    readonly publicAccessPrevention?: 'enforced' | 'inherited'
    readonly acceptConflict?: boolean
    readonly eraseReread?: boolean
  } = {},
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
        publicAccessPrevention:
          behavior.publicAccessPrevention ?? 'enforced',
        publicIamPrincipalCount: 0,
        browserOrCallerPolicyAccepted: false,
        observedAt: at,
      } as never
    },
    async createOnly({ objectPath, body, contentSha256 }) {
      assert.equal(hash(body), contentSha256)
      const existing = objects.get(objectPath)
      if (!existing) {
        objects.set(objectPath, Buffer.from(body))
        return 'created'
      }
      if (existing.equals(body)) return 'identical_replay'
      if (behavior.acceptConflict) return 'identical_replay'
      throw new Error('create-only conflict')
    },
    async readExact(objectPath) {
      if (behavior.eraseReread) return null
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function createObjectPort(objects: Map<string, Buffer>) {
  return {
    async createOnly(input: {
      readonly objectPath: string
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      assert.equal(hash(input.body), input.contentSha256)
      const existing = objects.get(input.objectPath)
      if (!existing) {
        objects.set(input.objectPath, Buffer.from(input.body))
        return 'created' as const
      }
      if (existing.equals(input.body)) return 'already_exists' as const
      throw new Error('repository create-only conflict')
    },
    async readExact(objectPath: string) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
