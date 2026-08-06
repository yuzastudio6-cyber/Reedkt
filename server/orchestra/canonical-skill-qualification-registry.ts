import { createHash } from 'node:crypto'

import type {
  OrchestraEvidenceRef,
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-capability'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  orchestraDigest,
  orchestraEvidenceRef,
  parseSkillCapabilityManifest,
  parseSkillQualificationSnapshot,
} from './orchestra-skill-capability-contract'

export const CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION =
  'canonical-skill-qualification-registry-v1' as const
export const CANONICAL_SKILL_QUALIFICATION_REGISTRY_RECORD_VERSION =
  'canonical-skill-qualification-registry-record-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/canonical-skill-qualification-registry'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const SAFE_PREFIX = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,510}[A-Za-z0-9]$/u
const DIGEST = /^sha256:[a-f0-9]{64}$/u
const RECORD_KEYS = [
  'schemaVersion', 'source', 'qualificationOwner',
  'manifestRef', 'qualificationSnapshotRef', 'observedReleaseRef',
  'manifest', 'qualificationSnapshot',
  'exactCanonicalManifestAndQualificationPersisted',
  'callerCanSelfQualify', 'dispatchAuthorityGranted',
  'providerAuthorityGranted', 'billingAuthorityGranted',
  'publicDeliveryAuthorityGranted', 'productionAuthorityGranted',
  'recordDigestSha256',
] as const

export interface CanonicalSkillQualificationRegistryRecord {
  readonly schemaVersion:
    typeof CANONICAL_SKILL_QUALIFICATION_REGISTRY_RECORD_VERSION
  readonly source: 'canonical_server_skill_qualification_registry'
  readonly qualificationOwner: 'canonical_skill_qualification_registry'
  readonly manifestRef: OrchestraEvidenceRef
  readonly qualificationSnapshotRef: OrchestraEvidenceRef
  readonly observedReleaseRef: OrchestraEvidenceRef
  readonly manifest: SkillCapabilityManifest
  readonly qualificationSnapshot: SkillQualificationSnapshot
  readonly exactCanonicalManifestAndQualificationPersisted: true
  readonly callerCanSelfQualify: false
  readonly dispatchAuthorityGranted: false
  readonly providerAuthorityGranted: false
  readonly billingAuthorityGranted: false
  readonly publicDeliveryAuthorityGranted: false
  readonly productionAuthorityGranted: false
  readonly recordDigestSha256: string
}

export interface CanonicalSkillQualificationRegistryReadPort {
  readonly schemaVersion: typeof CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  readExact(input: {
    readonly manifestRef: OrchestraEvidenceRef
    readonly qualificationSnapshotRef: OrchestraEvidenceRef
  }): Promise<Readonly<{
    manifest: SkillCapabilityManifest
    qualificationSnapshot: SkillQualificationSnapshot
  }> | null>
}

export interface CanonicalSkillQualificationRegistry
  extends CanonicalSkillQualificationRegistryReadPort {
  persistCreateOnly(input: {
    readonly manifest: unknown
    readonly qualificationSnapshot: unknown
  }): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    manifestRef: OrchestraEvidenceRef
    qualificationSnapshotRef: OrchestraEvidenceRef
    observedReleaseRef: OrchestraEvidenceRef
    registryRecordRef: OrchestraEvidenceRef
    exactCreateOnlyRereadVerified: true
    callerCanSelfQualify: false
    dispatchAuthorityGranted: false
    providerAuthorityGranted: false
    billingAuthorityGranted: false
    publicDeliveryAuthorityGranted: false
    productionAuthorityGranted: false
  }>>
  rereadRecord(input: {
    readonly manifestRef: OrchestraEvidenceRef
    readonly qualificationSnapshotRef: OrchestraEvidenceRef
  }): Promise<CanonicalSkillQualificationRegistryRecord | null>
}

export function createCanonicalSkillQualificationRegistry(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSkillQualificationRegistry {
  assertDependencies(input)
  const prefix = requirePrefix(input.prefix ?? DEFAULT_PREFIX)
  const registry: CanonicalSkillQualificationRegistry = Object.freeze({
    schemaVersion: CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION,
    evidenceClass: 'private_create_only_exact_reread' as const,

    async persistCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'skill_qualification_publication')
      assertExactRecord(untrusted, ['manifest', 'qualificationSnapshot'])
      const qualificationSnapshot = parseSkillQualificationSnapshot(
        untrusted.qualificationSnapshot,
      )
      const manifest = parseSkillCapabilityManifest({
        value: untrusted.manifest,
        qualificationSnapshot,
      })
      const record = createRecord({ manifest, qualificationSnapshot })
      const body = serialize(record)
      const objectPath = recordPath(
        prefix,
        record.manifestRef,
        record.qualificationSnapshotRef,
      )
      const disposition = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: sha256Bytes(body),
      })
      const reread = await registry.rereadRecord({
        manifestRef: record.manifestRef,
        qualificationSnapshotRef: record.qualificationSnapshotRef,
      })
      if (!reread || reread.recordDigestSha256 !==
        record.recordDigestSha256) {
        throw conflict('skill_qualification_registry_exact_reread_failed')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        manifestRef: cloneRef(record.manifestRef),
        qualificationSnapshotRef:
          cloneRef(record.qualificationSnapshotRef),
        observedReleaseRef: cloneRef(record.observedReleaseRef),
        registryRecordRef: orchestraEvidenceRef(
          `${manifest.skillKey}-qualification-registry-record`,
          record.recordDigestSha256,
        ),
        exactCreateOnlyRereadVerified: true as const,
        callerCanSelfQualify: false as const,
        dispatchAuthorityGranted: false as const,
        providerAuthorityGranted: false as const,
        billingAuthorityGranted: false as const,
        publicDeliveryAuthorityGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },

    async readExact(untrusted) {
      const record = await registry.rereadRecord(untrusted)
      return record ? Object.freeze({
        manifest: structuredClone(record.manifest),
        qualificationSnapshot:
          structuredClone(record.qualificationSnapshot),
      }) : null
    },

    async rereadRecord(untrusted) {
      assertPlainSerializedData(untrusted, 'skill_qualification_read')
      assertExactRecord(
        untrusted,
        ['manifestRef', 'qualificationSnapshotRef'],
      )
      const manifestRef = requireRef(untrusted.manifestRef)
      const qualificationSnapshotRef = requireRef(
        untrusted.qualificationSnapshotRef,
      )
      const body = await input.objectPort.readExact(recordPath(
        prefix,
        manifestRef,
        qualificationSnapshotRef,
      ))
      if (!body) return null
      const record = parseRecord(parseBody(body))
      if (
        !sameRef(record.manifestRef, manifestRef)
        || !sameRef(
          record.qualificationSnapshotRef,
          qualificationSnapshotRef,
        )
        || body.toString('utf8') !== canonicalJson(record)
      ) throw conflict('skill_qualification_registry_record_changed')
      return record
    },
  })
  return registry
}

function createRecord(input: {
  manifest: SkillCapabilityManifest
  qualificationSnapshot: SkillQualificationSnapshot
}): CanonicalSkillQualificationRegistryRecord {
  const manifestRef = orchestraEvidenceRef(
    input.manifest.manifestId,
    input.manifest.manifestDigestSha256,
  )
  const qualificationSnapshotRef = orchestraEvidenceRef(
    input.qualificationSnapshot.snapshotId,
    input.qualificationSnapshot.snapshotDigestSha256,
  )
  const withoutDigest = {
    schemaVersion: CANONICAL_SKILL_QUALIFICATION_REGISTRY_RECORD_VERSION,
    source: 'canonical_server_skill_qualification_registry' as const,
    qualificationOwner: 'canonical_skill_qualification_registry' as const,
    manifestRef,
    qualificationSnapshotRef,
    observedReleaseRef: cloneRef(input.qualificationSnapshot.observedReleaseRef),
    manifest: structuredClone(input.manifest),
    qualificationSnapshot: structuredClone(input.qualificationSnapshot),
    exactCanonicalManifestAndQualificationPersisted: true as const,
    callerCanSelfQualify: false as const,
    dispatchAuthorityGranted: false as const,
    providerAuthorityGranted: false as const,
    billingAuthorityGranted: false as const,
    publicDeliveryAuthorityGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseRecord({
    ...withoutDigest,
    recordDigestSha256: orchestraDigest(withoutDigest),
  })
}

function parseRecord(value: unknown): CanonicalSkillQualificationRegistryRecord {
  assertPlainSerializedData(value, 'skill_qualification_registry_record')
  assertExactRecord(value, RECORD_KEYS)
  const record = value as CanonicalSkillQualificationRegistryRecord
  const qualificationSnapshot = parseSkillQualificationSnapshot(
    record.qualificationSnapshot,
  )
  const manifest = parseSkillCapabilityManifest({
    value: record.manifest,
    qualificationSnapshot,
  })
  const withoutDigest = { ...record } as Record<string, unknown>
  Reflect.deleteProperty(withoutDigest, 'recordDigestSha256')
  const exactManifestRef = orchestraEvidenceRef(
    manifest.manifestId,
    manifest.manifestDigestSha256,
  )
  const exactQualificationRef = orchestraEvidenceRef(
    qualificationSnapshot.snapshotId,
    qualificationSnapshot.snapshotDigestSha256,
  )
  if (
    record.schemaVersion !==
      CANONICAL_SKILL_QUALIFICATION_REGISTRY_RECORD_VERSION
    || record.source !== 'canonical_server_skill_qualification_registry'
    || record.qualificationOwner !== 'canonical_skill_qualification_registry'
    || !sameRef(record.manifestRef, exactManifestRef)
    || !sameRef(record.qualificationSnapshotRef, exactQualificationRef)
    || !sameRef(
      record.observedReleaseRef,
      qualificationSnapshot.observedReleaseRef,
    )
    || !record.exactCanonicalManifestAndQualificationPersisted
    || record.callerCanSelfQualify
    || record.dispatchAuthorityGranted
    || record.providerAuthorityGranted
    || record.billingAuthorityGranted
    || record.publicDeliveryAuthorityGranted
    || record.productionAuthorityGranted
    || !DIGEST.test(record.recordDigestSha256)
    || record.recordDigestSha256 !== orchestraDigest(withoutDigest)
  ) throw conflict('skill_qualification_registry_record_invalid')
  return Object.freeze({
    ...record,
    manifest: structuredClone(manifest),
    qualificationSnapshot: structuredClone(qualificationSnapshot),
    manifestRef: cloneRef(record.manifestRef),
    qualificationSnapshotRef: cloneRef(record.qualificationSnapshotRef),
    observedReleaseRef: cloneRef(record.observedReleaseRef),
  })
}

function recordPath(
  prefix: string,
  manifestRef: OrchestraEvidenceRef,
  qualificationSnapshotRef: OrchestraEvidenceRef,
): string {
  return `${prefix}/records/${sha256Canonical({
    manifestRef,
    qualificationSnapshotRef,
  })}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(canonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('skill_qualification_registry_record_oversized')
  }
  return body
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort(compareUtf16)
  return `{${keys.map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Canonical(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function parseBody(body: Buffer): unknown {
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('skill_qualification_registry_record_bytes_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('skill_qualification_registry_record_json_invalid')
  }
}

function requireRef(value: unknown): OrchestraEvidenceRef {
  assertPlainSerializedData(value, 'skill_qualification_registry_ref')
  assertExactRecord(value, ['id', 'version', 'contentHash'])
  const ref = value as OrchestraEvidenceRef
  if (
    typeof ref.id !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(ref.id)
    || !Number.isSafeInteger(ref.version)
    || ref.version < 1
    || typeof ref.contentHash !== 'string'
    || !DIGEST.test(ref.contentHash)
  ) throw conflict('skill_qualification_registry_ref_invalid')
  return cloneRef(ref)
}

function assertExactRecord(value: unknown, keys: readonly string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('skill_qualification_registry_record_not_plain')
  }
  const prototype = Object.getPrototypeOf(value)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const ownKeys = Reflect.ownKeys(value)
  if (
    (prototype !== Object.prototype && prototype !== null)
    || ownKeys.some((key) => typeof key !== 'string')
    || ownKeys.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some(
      (descriptor) => 'get' in descriptor || 'set' in descriptor,
    )
  ) throw conflict('skill_qualification_registry_record_not_closed')
}

function requirePrefix(value: string): string {
  if (!SAFE_PREFIX.test(value) || value.includes('..')
    || value.includes('//') || value.endsWith('/')) {
    throw conflict('skill_qualification_registry_prefix_invalid')
  }
  return value
}

function sameRef(left: OrchestraEvidenceRef, right: OrchestraEvidenceRef) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function cloneRef(value: OrchestraEvidenceRef): OrchestraEvidenceRef {
  return Object.freeze({
    id: value.id,
    version: value.version,
    contentHash: value.contentHash,
  })
}

function assertDependencies(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  prefix?: string
}): void {
  if (
    !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw conflict('skill_qualification_registry_object_port_invalid')
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The canonical skill qualification registry record is invalid.',
    409,
    { requiredGate },
  )
}
