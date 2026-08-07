import { createHash } from 'node:crypto'

import {
  canonicalSkillJson,
  hashSkillValue,
} from '../edit-skills/core/skill-capability-manifest-hash'
import type {
  EditSkillArtifactReference,
  EditSkillArtifactSchemaRegistry,
  EditSkillArtifactStore,
} from '../edit-skills/core/edit-skill-artifact-store'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

export const CANONICAL_PRIVATE_EDIT_SKILL_ARTIFACT_STORE_VERSION =
  'canonical-private-edit-skill-artifact-store-v1' as const
export const CANONICAL_PRIVATE_EDIT_SKILL_ARTIFACT_RECORD_VERSION =
  'canonical-private-edit-skill-artifact-record-v1' as const

const DEFAULT_PREFIX = 'private/edit-skills/artifacts/v1'
const SAFE_PREFIX = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,900}$/u

interface PersistedArtifactRecord {
  schemaVersion: typeof CANONICAL_PRIVATE_EDIT_SKILL_ARTIFACT_RECORD_VERSION
  reference: EditSkillArtifactReference
  value: unknown
}

/**
 * Provider-neutral, create-only durable store for public edit-skill artifacts.
 * The injected object port owns persistence; this adapter owns strict artifact
 * schema validation, tenant scope, content addressing, and exact reread.
 */
export function createCanonicalPrivateEditSkillArtifactStore(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  schemas: EditSkillArtifactSchemaRegistry
  prefix?: string
}): EditSkillArtifactStore {
  if (!input.objectPort || !input.schemas) {
    throw new Error('Canonical edit-skill artifact persistence is unavailable.')
  }
  const prefix = parsePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    storageClass: 'durable' as const,
    async putJson(value: {
      artifactType: string
      ownerUserId: string
      workspaceId: string
      projectId: string
      value: unknown
    }) {
      const parsedValue = input.schemas.parse(
        value.artifactType,
        value.value,
      )
      assertArtifactScope(parsedValue, value)
      const serializedValue = canonicalSkillJson(parsedValue)
      const reference: EditSkillArtifactReference = {
        artifactType: value.artifactType,
        sha256: hashSkillValue(parsedValue),
        byteLength: Buffer.byteLength(serializedValue, 'utf8'),
        ownerUserId: value.ownerUserId,
        workspaceId: value.workspaceId,
        projectId: value.projectId,
      }
      const record: PersistedArtifactRecord = {
        schemaVersion: CANONICAL_PRIVATE_EDIT_SKILL_ARTIFACT_RECORD_VERSION,
        reference,
        value: parsedValue,
      }
      const body = Buffer.from(canonicalSkillJson(record), 'utf8')
      await input.objectPort.createOnly({
        objectPath: artifactPath(prefix, reference),
        body,
        contentSha256: sha256(body),
      })
      const reread = await readExact({
        objectPort: input.objectPort,
        schemas: input.schemas,
        prefix,
        reference,
      })
      if (canonicalSkillJson(reread) !== canonicalSkillJson(parsedValue)) {
        throw new Error('Canonical edit-skill artifact changed after persistence.')
      }
      return structuredClone(reference)
    },
    async readJson(value: {
      reference: EditSkillArtifactReference
      ownerUserId: string
      workspaceId: string
      projectId: string
    }) {
      if (
        value.reference.ownerUserId !== value.ownerUserId ||
        value.reference.workspaceId !== value.workspaceId ||
        value.reference.projectId !== value.projectId
      ) {
        throw new Error(
          'Canonical edit-skill artifact rejected cross-tenant reread.',
        )
      }
      return readExact({
        objectPort: input.objectPort,
        schemas: input.schemas,
        prefix,
        reference: value.reference,
      })
    },
  })
}

async function readExact(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  schemas: EditSkillArtifactSchemaRegistry
  prefix: string
  reference: EditSkillArtifactReference
}): Promise<unknown> {
  const body = await input.objectPort.readExact(
    artifactPath(input.prefix, input.reference),
  )
  if (!body) throw new Error('Canonical edit-skill artifact was not found.')
  let raw: unknown
  try {
    raw = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('Canonical edit-skill artifact record is malformed.')
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Canonical edit-skill artifact record is malformed.')
  }
  const record = raw as Partial<PersistedArtifactRecord>
  if (
    record.schemaVersion !==
      CANONICAL_PRIVATE_EDIT_SKILL_ARTIFACT_RECORD_VERSION ||
    canonicalSkillJson(record.reference) !==
      canonicalSkillJson(input.reference)
  ) {
    throw new Error('Canonical edit-skill artifact reference is stale.')
  }
  const value = input.schemas.parse(
    input.reference.artifactType,
    record.value,
  )
  const serialized = canonicalSkillJson(value)
  if (
    hashSkillValue(value) !== input.reference.sha256 ||
    Buffer.byteLength(serialized, 'utf8') !== input.reference.byteLength
  ) {
    throw new Error('Canonical edit-skill artifact integrity is invalid.')
  }
  assertArtifactScope(value, input.reference)
  return structuredClone(value)
}

function assertArtifactScope(
  value: unknown,
  expected: {
    ownerUserId: string
    workspaceId: string
    projectId: string
  },
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const scoped = value as Record<string, unknown>
  const declared = [
    scoped.ownerUserId,
    scoped.workspaceId,
    scoped.projectId,
  ]
  if (declared.some((entry) => entry !== undefined) && (
    scoped.ownerUserId !== expected.ownerUserId ||
    scoped.workspaceId !== expected.workspaceId ||
    scoped.projectId !== expected.projectId
  )) {
    throw new Error(
      'Canonical edit-skill artifact content crossed tenant scope.',
    )
  }
}

function artifactPath(
  prefix: string,
  reference: EditSkillArtifactReference,
): string {
  const identity = hashSkillValue({
    artifactType: reference.artifactType,
    ownerUserId: reference.ownerUserId,
    workspaceId: reference.workspaceId,
    projectId: reference.projectId,
    sha256: reference.sha256,
    byteLength: reference.byteLength,
  })
  return `${prefix}/${identity.slice(0, 2)}/${identity}.json`
}

function parsePrefix(value: string): string {
  if (
    !SAFE_PREFIX.test(value) ||
    value.includes('..') ||
    value.includes('//') ||
    value.endsWith('/')
  ) {
    throw new Error('Canonical edit-skill artifact prefix is invalid.')
  }
  return value
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
