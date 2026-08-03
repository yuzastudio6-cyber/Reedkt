import { createHash } from 'node:crypto'

import { skillCapabilityManifestCoreSchema } from './skill-capability-manifest-schema'
import type {
  SkillCapabilityManifest,
  SkillCapabilityManifestCore,
  SkillManifestReference,
} from './skill-capability-manifest-types'

type CanonicalJson = null | boolean | number | string | CanonicalJson[] | {
  [key: string]: CanonicalJson
}

function canonicalize(value: unknown, ancestors: Set<object>): CanonicalJson {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Canonical skill JSON rejects non-finite numbers.')
    return Object.is(value, -0) ? 0 : value
  }
  if (
    value === undefined || typeof value === 'function' || typeof value === 'symbol' ||
    typeof value === 'bigint'
  ) throw new Error(`Canonical skill JSON rejects ${typeof value} values.`)
  if (!value || typeof value !== 'object') throw new Error('Canonical skill JSON received an unsupported value.')
  if (ancestors.has(value)) throw new Error('Canonical skill JSON rejects cyclic values.')

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.keys(value).length !== value.length) {
        throw new Error('Canonical skill JSON rejects sparse or decorated arrays.')
      }
      return value.map((item) => canonicalize(item, ancestors))
    }
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new Error('Canonical skill JSON accepts plain objects only.')
    }
    const result: Record<string, CanonicalJson> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      result[key] = canonicalize((value as Record<string, unknown>)[key], ancestors)
    }
    return result
  } finally {
    ancestors.delete(value)
  }
}

export function canonicalSkillJson(value: unknown): string {
  return JSON.stringify(canonicalize(value, new Set()))
}

export function hashSkillValue(value: unknown): string {
  return createHash('sha256').update(canonicalSkillJson(value)).digest('hex')
}

export function deepFreezeSkillValue<T>(value: T, seen = new Set<object>()): Readonly<T> {
  if (!value || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreezeSkillValue(nested, seen)
  }
  return Object.freeze(value)
}

export function createSkillCapabilityManifest(
  input: SkillCapabilityManifestCore,
): Readonly<SkillCapabilityManifest> {
  const core = skillCapabilityManifestCoreSchema.parse(input)
  const manifest = {
    ...core,
    manifestHash: hashSkillValue(core),
  } satisfies SkillCapabilityManifest
  return deepFreezeSkillValue(manifest)
}

export function skillManifestReference(
  manifest: SkillCapabilityManifest,
): SkillManifestReference {
  return {
    schemaVersion: 'edit-skill-manifest-reference-v1',
    skillKey: manifest.skillKey,
    skillVersion: manifest.skillVersion,
    contractVersion: manifest.contractVersion,
    manifestHash: manifest.manifestHash,
  }
}

export function assertSkillManifestHash(
  manifest: SkillCapabilityManifest,
): Readonly<SkillCapabilityManifest> {
  const { manifestHash, ...core } = manifest
  if (hashSkillValue(core) !== manifestHash) {
    throw new Error(`Skill manifest ${manifest.skillKey}@${manifest.skillVersion} hash is stale or forged.`)
  }
  return deepFreezeSkillValue(manifest)
}
