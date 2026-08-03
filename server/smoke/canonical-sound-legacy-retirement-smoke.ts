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

console.log('Canonical Sound legacy retirement smoke passed.')
