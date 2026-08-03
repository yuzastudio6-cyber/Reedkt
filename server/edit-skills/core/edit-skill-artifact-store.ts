import type { z } from 'zod'

import { canonicalSkillJson, hashSkillValue } from './skill-capability-manifest-hash'

export interface EditSkillArtifactReference {
  artifactType: string
  sha256: string
  byteLength: number
  ownerUserId: string
  workspaceId: string
  projectId: string
}

export interface EditSkillArtifactStore {
  putJson(input: {
    artifactType: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    value: unknown
  }): Promise<EditSkillArtifactReference>
  readJson(input: {
    reference: EditSkillArtifactReference
    ownerUserId: string
    workspaceId: string
    projectId: string
  }): Promise<unknown>
}

export class EditSkillArtifactSchemaRegistry {
  readonly #schemas = new Map<string, z.ZodType>()

  register(artifactType: string, schema: z.ZodType): void {
    if (this.#schemas.has(artifactType)) throw new Error(`Duplicate skill artifact schema ${artifactType}.`)
    this.#schemas.set(artifactType, schema)
  }

  has(artifactType: string): boolean { return this.#schemas.has(artifactType) }

  parse(artifactType: string, value: unknown): unknown {
    const schema = this.#schemas.get(artifactType)
    if (!schema) throw new Error(`Unknown skill artifact type ${artifactType}.`)
    return schema.parse(value)
  }
}

interface InMemoryArtifactRecord {
  reference: EditSkillArtifactReference
  value: unknown
}

export class InMemoryCreateOnlyEditSkillArtifactStore implements EditSkillArtifactStore {
  readonly #schemas: EditSkillArtifactSchemaRegistry
  readonly #records = new Map<string, InMemoryArtifactRecord>()

  constructor(schemas: EditSkillArtifactSchemaRegistry) {
    this.#schemas = schemas
  }

  async putJson(input: {
    artifactType: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    value: unknown
  }): Promise<EditSkillArtifactReference> {
    const value = this.#schemas.parse(input.artifactType, input.value)
    const serialized = canonicalSkillJson(value)
    const reference: EditSkillArtifactReference = {
      artifactType: input.artifactType,
      sha256: hashSkillValue(value),
      byteLength: Buffer.byteLength(serialized, 'utf8'),
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
    }
    const key = canonicalSkillJson(reference)
    const existing = this.#records.get(key)
    if (existing && canonicalSkillJson(existing.value) !== serialized) {
      throw new Error('Content-addressed skill artifact collision.')
    }
    this.#records.set(key, { reference, value })
    return reference
  }

  async readJson(input: {
    reference: EditSkillArtifactReference
    ownerUserId: string
    workspaceId: string
    projectId: string
  }): Promise<unknown> {
    if (
      input.reference.ownerUserId !== input.ownerUserId ||
      input.reference.workspaceId !== input.workspaceId ||
      input.reference.projectId !== input.projectId
    ) throw new Error('Cross-tenant skill artifact substitution rejected.')
    const record = this.#records.get(canonicalSkillJson(input.reference))
    if (!record) throw new Error('Skill artifact was not found.')
    if (
      hashSkillValue(record.value) !== input.reference.sha256 ||
      Buffer.byteLength(canonicalSkillJson(record.value), 'utf8') !== input.reference.byteLength
    ) throw new Error('Skill artifact integrity verification failed.')
    return this.#schemas.parse(input.reference.artifactType, record.value)
  }
}

