import type { EditSkillPlugin } from './edit-skill-plugin'
import { assertSkillManifestHash } from './skill-capability-manifest-hash'
import type { SkillCapabilityManifest, SkillManifestReference } from './skill-capability-manifest-types'

function versionKey(input: Pick<SkillCapabilityManifest, 'skillKey' | 'skillVersion'>): string {
  return `${input.skillKey}@${input.skillVersion}`
}

export class EditSkillPluginRegistry {
  readonly #plugins = new Map<string, EditSkillPlugin>()

  register(plugin: EditSkillPlugin): void {
    const manifest = assertSkillManifestHash(plugin.manifest)
    const key = versionKey(manifest)
    if (this.#plugins.has(key)) throw new Error(`Duplicate public edit-skill plugin ${key}.`)
    this.#plugins.set(key, plugin)
  }

  resolve(ref: SkillManifestReference): EditSkillPlugin {
    const plugin = this.#plugins.get(`${ref.skillKey}@${ref.skillVersion}`)
    if (
      !plugin ||
      plugin.manifest.contractVersion !== ref.contractVersion ||
      plugin.manifest.manifestHash !== ref.manifestHash
    ) throw new Error('Exact public edit-skill plugin reference is unavailable or stale.')
    return plugin
  }

  list(): readonly EditSkillPlugin[] {
    return [...this.#plugins.values()]
  }

  assertManifestBindings(manifests: readonly Readonly<SkillCapabilityManifest>[]): void {
    const manifestKeys = new Set(manifests.map(versionKey))
    for (const manifest of manifests) {
      if (!this.#plugins.has(versionKey(manifest))) {
        throw new Error(`Capability manifest ${versionKey(manifest)} has no public plugin.`)
      }
    }
    for (const key of this.#plugins.keys()) {
      if (!manifestKeys.has(key)) throw new Error(`Public edit-skill plugin ${key} has no manifest.`)
    }
  }
}
