import {
  LEGACY_SOUND_MUSIC_AUDIO_CANONICAL_SOUND_SKILL_KEY,
  LEGACY_SOUND_MUSIC_AUDIO_PRODUCTION_OWNER,
  LEGACY_SOUND_MUSIC_AUDIO_STATUS,
} from '../../src/backend/contracts/sound-music-audio-contracts'
import { mockSoundMusicAudioScenarios } from '../../src/backend/mock/mock-sound-music-audio-scenarios'
import { adaptLegacySoundInputToCanonicalSeed } from '../sound/legacy-sound-compatibility-adapter'
import { SOUND_TOOL_ROUTE_MANIFESTS } from '../sound/sound-tool-routes'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

check(!LEGACY_SOUND_MUSIC_AUDIO_PRODUCTION_OWNER, 'Legacy combined planner must not own production Sound.')
check(
  LEGACY_SOUND_MUSIC_AUDIO_STATUS === 'deprecated_compatibility_fixture_only',
  'Legacy combined planner must be visibly deprecated and fixture-only.',
)
check(LEGACY_SOUND_MUSIC_AUDIO_CANONICAL_SOUND_SKILL_KEY === 'sound', 'Legacy migration target must be canonical Sound.')

const legacy = mockSoundMusicAudioScenarios.find((scenario) => scenario.id === 'music-mood-layer')
check(Boolean(legacy), 'Legacy migration fixture is missing.')
if (!legacy) throw new Error('Legacy migration fixture is missing.')

const seed = adaptLegacySoundInputToCanonicalSeed(legacy.input)
check(seed.skillKey === 'sound', 'Compatibility adapter must target canonical Sound.')
check(seed.status === 'canonical_context_resolution_required', 'Adapter must not invent executable authority.')
check(seed.musicHandoff.required, 'Legacy Music intent must become a separate Music handoff.')
check(seed.musicHandoff.targetSkillKey === 'music', 'Music handoff must target the Music skill.')
check(!JSON.stringify(seed).includes('lyria_mock'), 'Legacy Music provider IDs must not enter canonical Sound.')
check(!JSON.stringify(seed).includes('mirelo_sfx_v1_5'), 'Mirelo 1.5 must not enter canonical Sound.')

const mireloRoute = SOUND_TOOL_ROUTE_MANIFESTS.find((route) =>
  route.routeKey === 'sound.route.generate.video_sfx.mirelo.v1')
check(Boolean(mireloRoute), 'Canonical Mirelo route is missing.')
check(
  Boolean(mireloRoute?.orderedOrGraphSteps.some((step) =>
    step.toolKey === 'mirelo_sfx' && step.toolVersionConstraint === '1.6')),
  'Canonical Mirelo route must bind Mirelo SFX 1.6.',
)

const retiredOrchestraPath = join(process.cwd(), 'server', 'orchestra')
await access(retiredOrchestraPath).then(async () => {
  check((await readdir(retiredOrchestraPath)).length === 0,
    'The retired Sound-created generic Orchestra façade still contains active production files.')
}, (error: NodeJS.ErrnoException) => {
  check(error.code === 'ENOENT', `Unexpected Orchestra path error: ${error.message}`)
})

const activeRoots = [join(process.cwd(), 'server', 'sound'), join(process.cwd(), 'server', 'edit-skills', 'sound')]
const activeFiles = (await Promise.all(activeRoots.map(async (root) =>
  (await readdir(root)).filter((name) => name.endsWith('.ts')).map((name) => join(root, name))))).flat()
for (const file of activeFiles) {
  const source = await readFile(file, 'utf8')
  check(!source.includes('inspectSoundAssignmentTools'), `${file} retains the retired Sound Head façade.`)
  check(!source.includes("from '../orchestra"), `${file} imports the retired generic Sound Orchestra path.`)
  check(!source.includes('mockSoundMusicAudioScenarios'), `${file} uses legacy scenario fixtures in production reasoning.`)
  if (!file.endsWith('legacy-sound-compatibility-adapter.ts')) {
    check(!source.includes('SOUND_MUSIC_AUDIO'), `${file} exposes the legacy combined Sound/Music owner.`)
  }
}

const compatibilitySource = await readFile(
  join(process.cwd(), 'server', 'sound', 'legacy-sound-compatibility-adapter.ts'), 'utf8',
)
for (const executionBypass of [
  'MireloSfxProviderAdapter', 'runSoundLocalAudioExecution', 'CanonicalSoundRouteExecutor',
  'prepareBoundedPrivateVisualProxy', 'createSoundWorkerOperationPackage',
]) {
  check(!compatibilitySource.includes(executionBypass),
    `Legacy compatibility boundary can reach execution primitive ${executionBypass}.`)
}
check(compatibilitySource.includes('planning data only'), 'Legacy adapter must state its planning-only boundary.')
check(compatibilitySource.includes("targetSkillKey: 'music'"), 'Legacy Music intent must remain an explicit future Music handoff.')
const soundBarrelSource = await readFile(join(process.cwd(), 'server', 'sound', 'index.ts'), 'utf8')
for (const internalBypass of [
  'mirelo-sfx-provider', 'sound-local-audio-processor', 'sound-tool-views',
  'sound-bounded-visual-proxy', 'sound-route-executor',
]) {
  check(!soundBarrelSource.includes(internalBypass),
    `Compatibility-facing Sound barrel exposes internal bypass ${internalBypass}.`)
}

console.log(JSON.stringify({
  status: 'ok', retiredGenericOrchestraFacade: true, activeFilesScanned: activeFiles.length,
  compatibilityBoundary: 'planning_only', musicHandoff: 'future_music_skill',
}, null, 2))
import { access, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
