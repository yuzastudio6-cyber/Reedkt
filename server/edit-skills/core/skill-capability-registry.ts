import type { SkillAssignment } from './skill-assignment-types'
import { assertSkillManifestHash, skillManifestReference } from './skill-capability-manifest-hash'
import type { SkillCapabilityManifest, SkillManifestReference } from './skill-capability-manifest-types'
import type { SkillPlanEnvelope } from './skill-plan-envelope'
import type { SkillResultEnvelope } from './skill-result-envelope'

export interface EditSkillInvocationContext {
  assignment: SkillAssignment
  manifest: Readonly<SkillCapabilityManifest>
}

export interface EditSkillHandler {
  plan(context: EditSkillInvocationContext): Promise<SkillPlanEnvelope>
  execute?(context: EditSkillInvocationContext, plan: SkillPlanEnvelope): Promise<SkillResultEnvelope>
}

function versionKey(manifest: Pick<SkillCapabilityManifest, 'skillKey' | 'skillVersion'>): string {
  return `${manifest.skillKey}@${manifest.skillVersion}`
}

export class SkillCapabilityRegistry {
  readonly #manifests = new Map<string, Readonly<SkillCapabilityManifest>>()
  readonly #handlers = new Map<string, EditSkillHandler>()

  registerManifest(manifest: SkillCapabilityManifest): void {
    const validated = assertSkillManifestHash(manifest)
    const key = versionKey(validated)
    if (this.#manifests.has(key)) throw new Error(`Duplicate skill manifest ${key}.`)
    this.#manifests.set(key, validated)
  }

  registerHandler(input: {
    skillKey: SkillCapabilityManifest['skillKey']
    skillVersion: string
    handler: EditSkillHandler
  }): void {
    const key = `${input.skillKey}@${input.skillVersion}`
    if (this.#handlers.has(key)) throw new Error(`Duplicate skill handler ${key}.`)
    this.#handlers.set(key, input.handler)
  }

  listManifests(): readonly Readonly<SkillCapabilityManifest>[] {
    return [...this.#manifests.values()]
  }

  resolveManifest(ref: SkillManifestReference): Readonly<SkillCapabilityManifest> {
    const manifest = this.#manifests.get(`${ref.skillKey}@${ref.skillVersion}`)
    if (!manifest || manifest.contractVersion !== ref.contractVersion || manifest.manifestHash !== ref.manifestHash) {
      throw new Error('Exact skill manifest reference is unavailable or stale.')
    }
    return manifest
  }

  resolveLatest(skillKey: SkillCapabilityManifest['skillKey']): Readonly<SkillCapabilityManifest> {
    const matches = [...this.#manifests.values()].filter((manifest) => manifest.skillKey === skillKey)
    if (matches.length !== 1) {
      throw new Error(`Skill ${skillKey} needs an explicit manifest reference; ${matches.length} versions are registered.`)
    }
    return matches[0]
  }

  resolveHandler(ref: SkillManifestReference): EditSkillHandler {
    this.resolveManifest(ref)
    const handler = this.#handlers.get(`${ref.skillKey}@${ref.skillVersion}`)
    if (!handler) throw new Error(`Registered runtime skill ${ref.skillKey}@${ref.skillVersion} has no handler.`)
    return handler
  }

  assertRuntimeBindings(): void {
    for (const manifest of this.#manifests.values()) {
      if (!this.#handlers.has(versionKey(manifest))) {
        throw new Error(`Registered runtime skill ${versionKey(manifest)} has no handler.`)
      }
    }
    for (const key of this.#handlers.keys()) {
      if (!this.#manifests.has(key)) throw new Error(`Skill handler ${key} has no manifest.`)
    }
  }

  referenceFor(skillKey: SkillCapabilityManifest['skillKey']): SkillManifestReference {
    return skillManifestReference(this.resolveLatest(skillKey))
  }
}

