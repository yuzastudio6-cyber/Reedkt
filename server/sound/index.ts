/**
 * Compatibility-facing Sound barrel. Execution callers receive only the
 * canonical service/contracts; provider, route-executor, worker, FFmpeg, and
 * proxy primitives remain Sound-internal direct modules.
 */
export * from '../edit-skills/sound'
export {
  CANONICAL_SOUND_REQUEST_SCHEMA_VERSION,
  CANONICAL_SOUND_RESULT_SCHEMA_VERSION,
  canonicalSoundRequestSchema,
  canonicalSoundResultSchema,
  parseCanonicalSoundRequest,
  parseCanonicalSoundResult,
  type CanonicalSoundCue,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type SoundArtifactRef,
  type SoundFrameRange,
} from './sound-contracts'
export {
  LEGACY_SOUND_COMPATIBILITY_ADAPTER_VERSION,
  adaptLegacySoundInputToCanonicalSeed,
  type CanonicalSoundRequestSeed,
} from './legacy-sound-compatibility-adapter'
