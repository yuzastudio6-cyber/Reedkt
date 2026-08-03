import type { SkillCapabilityManifest } from './skill-capability-manifest-types'
import { assertSkillManifestHash, canonicalSkillJson } from './skill-capability-manifest-hash'

export function generateSkillManifestProjection(
  manifest: SkillCapabilityManifest,
): string {
  const validated = assertSkillManifestHash(manifest)
  return `${JSON.stringify(JSON.parse(canonicalSkillJson(validated)), null, 2)}\n`
}

