/**
 * Compatibility import boundary. The canonical manifest authority lives in
 * server/edit-skills/sound and is registered only through the shared kernel.
 */
export {
  SOUND_ACCEPTED_ARTIFACT_TYPES,
  SOUND_MANIFEST_CONTRACT_VERSION,
  SOUND_PRODUCED_ARTIFACT_TYPES,
  SOUND_SKILL_KEY,
  SOUND_SKILL_VERSION,
  SOUND_SUPPORTED_JOB_TYPES,
  SOUND_UNSUPPORTED_JOB_TYPES,
  soundSkillCapabilityManifest,
  type SoundSupportedJobType,
} from '../edit-skills/sound/sound-capability-manifest'
export {
  soundMiniSkillManifests,
  validateSoundMiniSkillRouteReferences,
  type SoundMiniSkillManifest,
} from '../edit-skills/sound/sound-mini-skill-registry'

import { soundSkillCapabilityManifest } from '../edit-skills/sound/sound-capability-manifest'

/** @deprecated Registration belongs to registerSoundSkill(shared kernel). */
export function registerCanonicalSoundSkill() {
  return soundSkillCapabilityManifest
}
