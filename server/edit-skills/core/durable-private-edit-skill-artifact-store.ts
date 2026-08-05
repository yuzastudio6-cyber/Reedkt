import { Buffer } from 'node:buffer'

import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  canonicalSkillJson,
  hashSkillValue,
} from './skill-capability-manifest-hash'
import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from './edit-skill-artifact-store'
import { EditSkillArtifactSchemaRegistry } from './edit-skill-artifact-store'

const MAXIMUM_EDIT_SKILL_JSON_BYTES = 64 * 1024 * 1024

/**
 * Create-only private filesystem adapter for canonical server execution.
 * The caller supplies a server-owned root; artifact identities never become
 * caller-selected paths and every read revalidates scope, bytes, hash, and schema.
 */
export class DurablePrivateEditSkillArtifactStore implements EditSkillArtifactStore {
  readonly storageClass = 'durable' as const
  readonly #rootPath: string
  readonly #schemas: EditSkillArtifactSchemaRegistry

  constructor(input: {
    rootPath: string
    schemas: EditSkillArtifactSchemaRegistry
  }) {
    if (!input.rootPath.trim()) {
      throw new Error('Durable edit-skill storage requires a server-owned private root.')
    }
    this.#rootPath = input.rootPath
    this.#schemas = input.schemas
  }

  async putJson(input: {
    artifactType: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    value: unknown
  }): Promise<EditSkillArtifactReference> {
    const value = this.#schemas.parse(input.artifactType, input.value)
    assertValueScope(value, input)
    const serialized = canonicalSkillJson(value)
    const bytes = Buffer.from(serialized, 'utf8')
    if (bytes.byteLength <= 1 || bytes.byteLength > MAXIMUM_EDIT_SKILL_JSON_BYTES) {
      throw new Error('Edit-skill artifact exceeds its bounded private JSON contract.')
    }
    const reference: EditSkillArtifactReference = {
      artifactType: input.artifactType,
      sha256: hashSkillValue(value),
      byteLength: bytes.byteLength,
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
    }
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: this.#rootPath,
      relativePath: relativePath(reference),
      content: bytes,
    })
    const readBack = await this.readJson({ reference, ...scope(reference) })
    if (canonicalSkillJson(readBack) !== serialized) {
      throw new Error('Durable edit-skill artifact changed during create-only persistence.')
    }
    return Object.freeze(reference)
  }

  async readJson(input: {
    reference: EditSkillArtifactReference
    ownerUserId: string
    workspaceId: string
    projectId: string
  }): Promise<unknown> {
    assertReferenceScope(input.reference, input)
    const bytes = await readPrivateFileIfExistsWithinRoot({
      rootPath: this.#rootPath,
      relativePath: relativePath(input.reference),
    })
    if (!bytes) throw new Error('Durable edit-skill artifact was not found.')
    if (bytes.byteLength !== input.reference.byteLength ||
      bytes.byteLength <= 1 || bytes.byteLength > MAXIMUM_EDIT_SKILL_JSON_BYTES) {
      throw new Error('Durable edit-skill artifact byte authority is stale.')
    }
    let document: unknown
    try {
      document = JSON.parse(bytes.toString('utf8'))
    } catch {
      throw new Error('Durable edit-skill artifact is not canonical JSON.')
    }
    const value = this.#schemas.parse(input.reference.artifactType, document)
    assertValueScope(value, input.reference)
    if (
      canonicalSkillJson(value) !== bytes.toString('utf8') ||
      hashSkillValue(value) !== input.reference.sha256
    ) throw new Error('Durable edit-skill artifact integrity verification failed.')
    return value
  }
}

function relativePath(reference: EditSkillArtifactReference): string {
  const identity = hashSkillValue({
    schemaVersion: 'durable_private_edit_skill_artifact_identity_v1',
    reference,
  })
  return [
    'edit-skill-artifacts',
    'private-v1',
    identity.slice(0, 2),
    `${identity}.json`,
  ].join('/')
}

function scope(input: Pick<EditSkillArtifactReference,
  'ownerUserId' | 'workspaceId' | 'projectId'>) {
  return {
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
  }
}

function assertReferenceScope(
  reference: EditSkillArtifactReference,
  expected: Pick<EditSkillArtifactReference, 'ownerUserId' | 'workspaceId' | 'projectId'>,
): void {
  if (
    reference.ownerUserId !== expected.ownerUserId ||
    reference.workspaceId !== expected.workspaceId ||
    reference.projectId !== expected.projectId
  ) throw new Error('Cross-tenant durable edit-skill artifact substitution rejected.')
}

function assertValueScope(
  value: unknown,
  expected: Pick<EditSkillArtifactReference, 'ownerUserId' | 'workspaceId' | 'projectId'>,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const record = value as Readonly<Record<string, unknown>>
  if (
    [record.ownerUserId, record.workspaceId, record.projectId]
      .some((entry) => entry !== undefined) &&
    (
      record.ownerUserId !== expected.ownerUserId ||
      record.workspaceId !== expected.workspaceId ||
      record.projectId !== expected.projectId
    )
  ) throw new Error('Cross-tenant durable edit-skill artifact content rejected.')
}
