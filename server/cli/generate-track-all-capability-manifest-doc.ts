import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { generateSkillManifestProjection } from '../edit-skills/core/skill-manifest-projection'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'

const outputPath = resolve('docs/edit-skills/manifests/track-all-capability-manifest.generated.json')
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, generateSkillManifestProjection(TRACK_ALL_CAPABILITY_MANIFEST), { encoding: 'utf8', mode: 0o644 })
console.log(JSON.stringify({ status: 'ok', outputPath, manifestHash: TRACK_ALL_CAPABILITY_MANIFEST.manifestHash }, null, 2))
