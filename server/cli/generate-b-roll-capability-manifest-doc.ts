import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { generateSkillManifestProjection } from '../edit-skills/core/skill-manifest-projection'
import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'

const outputPath = resolve('docs/edit-skills/manifests/b-roll-capability-manifest.generated.json')
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, generateSkillManifestProjection(BROLL_CAPABILITY_MANIFEST), {
  encoding: 'utf8',
  mode: 0o644,
})
console.log(JSON.stringify({ status: 'ok', outputPath, manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash }, null, 2))
