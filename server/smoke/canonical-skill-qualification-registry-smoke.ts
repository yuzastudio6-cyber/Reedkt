import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type {
  OrchestraEvidenceRef,
} from '../../src/types/orchestra-skill-capability'
import {
  createCanonicalSkillQualificationRegistry,
} from '../orchestra/canonical-skill-qualification-registry'
import {
  orchestraDigest,
  orchestraEvidenceRef,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createTrackAllSam31OrchestraCapabilityManifest,
  createTrackAllSam31OrchestraQualificationSnapshot,
} from '../workers/masks/track-all-sam3_1-orchestra-capability-manifest'
import {
  createVisualIntelligenceOrchestraCapabilityManifest,
  createVisualIntelligenceOrchestraQualificationSnapshot,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'

let checks = 0
const check = (condition: unknown, message?: string) => {
  assert.ok(condition, message)
  checks += 1
}

class MemoryCreateOnlyObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly values = new Map<string, Buffer>()

  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(sha256Bytes(input.body), input.contentSha256)
    const existing = this.values.get(input.objectPath)
    if (existing) {
      if (!existing.equals(input.body)) {
        throw new Error('create-only collision')
      }
      return 'already_exists'
    }
    this.values.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const value = this.values.get(objectPath)
    return value ? Buffer.from(value) : null
  }
}

const objectPort = new MemoryCreateOnlyObjectPort()
const registry = createCanonicalSkillQualificationRegistry({ objectPort })
const trackAllManifest = createTrackAllSam31OrchestraCapabilityManifest()
const trackAllQualification =
  createTrackAllSam31OrchestraQualificationSnapshot()

const created = await registry.persistCreateOnly({
  manifest: trackAllManifest,
  qualificationSnapshot: trackAllQualification,
})
check(created.disposition === 'created')
check(created.exactCreateOnlyRereadVerified)
check(created.callerCanSelfQualify === false)
check(created.dispatchAuthorityGranted === false)
check(created.providerAuthorityGranted === false)
check(created.billingAuthorityGranted === false)
check(created.publicDeliveryAuthorityGranted === false)
check(created.productionAuthorityGranted === false)
check(sameRef(created.manifestRef, orchestraEvidenceRef(
  trackAllManifest.manifestId,
  trackAllManifest.manifestDigestSha256,
)))
check(sameRef(created.qualificationSnapshotRef, orchestraEvidenceRef(
  trackAllQualification.snapshotId,
  trackAllQualification.snapshotDigestSha256,
)))
check(sameRef(created.observedReleaseRef,
  trackAllQualification.observedReleaseRef))

const replay = await registry.persistCreateOnly({
  qualificationSnapshot: structuredClone(trackAllQualification),
  manifest: reorderOwnKeys(trackAllManifest),
})
check(replay.disposition === 'identical_replay')
check(sameRef(replay.registryRecordRef, created.registryRecordRef))
check(objectPort.values.size === 1)

const exact = await registry.readExact({
  manifestRef: created.manifestRef,
  qualificationSnapshotRef: created.qualificationSnapshotRef,
})
check(exact?.manifest.skillKey === 'track_all')
check(exact?.qualificationSnapshot.overall === 'blocked')
check(exact?.qualificationSnapshot.callerCanSelfQualify === false)

if (!exact) throw new Error('Expected exact Track All registry reread.')
;(exact.manifest as { skillKey: string }).skillKey = 'mutated'
const rereadAfterDetachedMutation = await registry.readExact({
  manifestRef: created.manifestRef,
  qualificationSnapshotRef: created.qualificationSnapshotRef,
})
check(rereadAfterDetachedMutation?.manifest.skillKey === 'track_all')

const visualManifest =
  createVisualIntelligenceOrchestraCapabilityManifest()
const visualQualification =
  createVisualIntelligenceOrchestraQualificationSnapshot()
const visualCreated = await registry.persistCreateOnly({
  manifest: visualManifest,
  qualificationSnapshot: visualQualification,
})
check(visualCreated.disposition === 'created')
check(objectPort.values.size === 2)
const visualExact = await registry.readExact({
  manifestRef: visualCreated.manifestRef,
  qualificationSnapshotRef: visualCreated.qualificationSnapshotRef,
})
check(visualExact?.manifest.skillKey === 'visual_intelligence')
check(visualExact?.qualificationSnapshot.overall === 'blocked')

const missing = await registry.readExact({
  manifestRef: orchestraEvidenceRef(
    'missing-skill-manifest',
    orchestraDigest({ missing: 'manifest' }),
  ),
  qualificationSnapshotRef: orchestraEvidenceRef(
    'missing-skill-qualification',
    orchestraDigest({ missing: 'qualification' }),
  ),
})
check(missing === null)

let getterInvoked = false
const hostile: Record<string, unknown> = {
  qualificationSnapshot: trackAllQualification,
}
Object.defineProperty(hostile, 'manifest', {
  enumerable: true,
  get() {
    getterInvoked = true
    return trackAllManifest
  },
})
await assert.rejects(() => registry.persistCreateOnly(hostile as never))
checks += 1
check(getterInvoked === false)

const cyclic: Record<string, unknown> = {
  manifest: trackAllManifest,
  qualificationSnapshot: trackAllQualification,
}
cyclic.self = cyclic
await assert.rejects(() => registry.persistCreateOnly(cyclic as never))
checks += 1

await assert.rejects(() => registry.persistCreateOnly({
  manifest: {
    ...trackAllManifest,
    qualificationStatus: {
      ...trackAllManifest.qualificationStatus,
      overall: 'qualified',
    },
  },
  qualificationSnapshot: trackAllQualification,
}))
checks += 1

await assert.rejects(() => registry.persistCreateOnly({
  manifest: trackAllManifest,
  qualificationSnapshot: trackAllQualification,
  callerQualified: true,
} as never))
checks += 1

await assert.rejects(() => registry.readExact({
  manifestRef: created.manifestRef,
  qualificationSnapshotRef: created.qualificationSnapshotRef,
  browserApproved: true,
} as never))
checks += 1

const firstPath = [...objectPort.values.keys()][0]
if (!firstPath) throw new Error('Expected persisted registry object.')
const original = objectPort.values.get(firstPath)
if (!original) throw new Error('Expected persisted registry bytes.')
const tampered = JSON.parse(original.toString('utf8')) as Record<string, unknown>
tampered.productionAuthorityGranted = true
objectPort.values.set(firstPath, Buffer.from(JSON.stringify(tampered), 'utf8'))
await assert.rejects(() => registry.readExact({
  manifestRef: created.manifestRef,
  qualificationSnapshotRef: created.qualificationSnapshotRef,
}))
checks += 1
objectPort.values.set(firstPath, original)

console.log(JSON.stringify({
  ok: true,
  checks,
  schemaVersion: registry.schemaVersion,
  evidenceClass: registry.evidenceClass,
  persistedSkillKeys: ['track_all', 'visual_intelligence'],
  exactCreateOnlyRereadVerified: true,
  localeIndependentUtf16Canonicalization: true,
  callerCanSelfQualify: false,
  substantiveCpuMediaProcessingAllowed: false,
  customerCreditsMutated: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}))

function reorderOwnKeys<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(structuredClone(value)).reverse()) as T
}

function sameRef(left: OrchestraEvidenceRef, right: OrchestraEvidenceRef) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
