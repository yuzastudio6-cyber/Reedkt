import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from '../edit-skills/core/edit-skill-artifact-store'
import { canonicalSkillJson, hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'
import type { SkillJobRuntimeBindingDefinition } from '../edit-skills/core/edit-skill-runtime-binding'

export class DurableRuntimeInputFixtureStore implements EditSkillArtifactStore {
  readonly storageClass = 'durable' as const
  readonly #records = new Map<string, unknown>()

  async putJson(input: {
    artifactType: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    value: unknown
  }): Promise<EditSkillArtifactReference> {
    const reference = {
      artifactType: input.artifactType,
      sha256: hashSkillValue(input.value),
      byteLength: Buffer.byteLength(canonicalSkillJson(input.value), 'utf8'),
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
    }
    this.#records.set(canonicalSkillJson(reference), input.value)
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
    ) throw new Error('Cross-tenant runtime input fixture rejected.')
    const value = this.#records.get(canonicalSkillJson(input.reference))
    if (value === undefined) throw new Error('Runtime input fixture was not found.')
    return value
  }
}

export async function seedExactRuntimeInputs(input: {
  store: EditSkillArtifactStore
  binding: SkillJobRuntimeBindingDefinition
  scope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
  }
  workItemHash: string
}): Promise<readonly EditSkillArtifactReference[]> {
  return Promise.all(input.binding.inputArtifactTypes.map((artifactType, index) =>
    input.store.putJson({
      artifactType,
      ...input.scope,
      value: {
        schemaVersion: 'edit_skill_runtime_input_fixture_v1',
        artifactType,
        roleIndex: index,
        workItemHash: input.workItemHash,
        fixtureOnly: true,
      },
    })))
}
