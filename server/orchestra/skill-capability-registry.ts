import type {
  SkillCapabilityEntry,
  SkillCapabilityManifest,
  SkillJobDescriptor,
} from '../../src/types/skill-capability-manifest'
import {
  calculateSkillCapabilityManifestHash,
  skillCapabilityManifestSchema,
} from './skill-capability-manifest'

export class SkillCapabilityRegistry {
  readonly #bySkill = new Map<string, Readonly<SkillCapabilityManifest>[]>()

  register(manifest: Readonly<SkillCapabilityManifest>): void {
    const parsed = skillCapabilityManifestSchema.parse(manifest)
    if (calculateSkillCapabilityManifestHash(parsed) !== parsed.manifestHash) {
      throw new Error(`Manifest ${parsed.manifestId} hash is invalid.`)
    }
    if (!Object.isFrozen(manifest)) {
      throw new Error(`Manifest ${parsed.manifestId} must be published immutable data.`)
    }
    const versions = this.#bySkill.get(parsed.skillKey) ?? []
    const sameVersion = versions.find((item) => item.skillVersion === parsed.skillVersion)
    if (sameVersion) {
      if (sameVersion.manifestHash !== parsed.manifestHash) {
        throw new Error(
          `Published manifest ${parsed.skillKey}@${parsed.skillVersion} is immutable.`,
        )
      }
      return
    }
    this.#bySkill.set(parsed.skillKey, [...versions, manifest])
  }

  get(skillKey: string, version?: string): Readonly<SkillCapabilityManifest> | undefined {
    const versions = this.#bySkill.get(skillKey) ?? []
    if (version) return versions.find((item) => item.skillVersion === version)
    return versions.at(-1)
  }

  list(): Readonly<SkillCapabilityManifest>[] {
    return Array.from(this.#bySkill.values()).flat()
  }

  findEligibleByJob(job: SkillJobDescriptor): Array<{
    manifest: Readonly<SkillCapabilityManifest>
    capability: Readonly<SkillCapabilityEntry>
  }> {
    return this.list().flatMap((manifest) => {
      const capability = manifest.capabilityEntries.find(
        (entry) => entry.supportedJobType === job.jobType,
      )
      return capability ? [{ manifest, capability }] : []
    })
  }
}

export const canonicalSkillCapabilityRegistry = new SkillCapabilityRegistry()

export function getSkillCapabilityManifest(
  skillKey: string,
  version?: string,
): Readonly<SkillCapabilityManifest> | undefined {
  return canonicalSkillCapabilityRegistry.get(skillKey, version)
}

export function findEligibleSkills(job: SkillJobDescriptor) {
  return canonicalSkillCapabilityRegistry.findEligibleByJob(job)
}

export function resolveSkillCapabilityEntry(
  skillKey: string,
  jobType: string,
  version?: string,
): Readonly<SkillCapabilityEntry> | undefined {
  return getSkillCapabilityManifest(skillKey, version)?.capabilityEntries.find(
    (entry) => entry.supportedJobType === jobType || entry.capabilityKey === jobType,
  )
}
