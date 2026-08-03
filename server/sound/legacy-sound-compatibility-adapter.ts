import type {
  SoundAgentPlannerInput,
  SoundAgentRequestedOutputMode,
} from '../../src/types/audio-music'
import type { SoundRequestedOperation } from './sound-contracts'

export const LEGACY_SOUND_COMPATIBILITY_ADAPTER_VERSION = '1.0.0' as const

export interface CanonicalSoundRequestSeed {
  adapterVersion: typeof LEGACY_SOUND_COMPATIBILITY_ADAPTER_VERSION
  status: 'canonical_context_resolution_required'
  skillKey: 'sound'
  requestedCapabilityKey: string
  requestedJobType: string
  requestedOperations: SoundRequestedOperation[]
  requestedOutcome: string
  projectIdentity: {
    workspaceId: string
    projectId: string
    editPlanId: string
    approvedPlanSnapshotId?: string
  }
  requestedMode: 'planning' | 'fixture'
  soundPreferences: {
    enableSoundDesign: boolean
    preserveNaturalSound: boolean
    preserveEmotionalSilence: boolean
    avoidLoudSoundUnderSpeech: boolean
    preferredPerspective: 'natural' | 'restrained'
  }
  musicHandoff: {
    required: boolean
    targetSkillKey: 'music'
    reason?: string
  }
  requiredCanonicalContext: string[]
  compatibilityNotices: string[]
}

function requestedMode(mode: SoundAgentRequestedOutputMode): 'planning' | 'fixture' {
  return mode === 'mock_preview_only' ? 'fixture' : 'planning'
}

/**
 * Converts an old combined Sound/Music planning input into a bounded seed for
 * the canonical Sound request builder. It deliberately does not manufacture
 * artifact hashes, scope authority, approvals, reservations, or Music work.
 */
export function adaptLegacySoundInputToCanonicalSeed(
  input: SoundAgentPlannerInput,
): CanonicalSoundRequestSeed {
  const needsDialogueCleanup = input.existingAudioContext.cleanupNeeded || input.existingAudioContext.noisyDialogue
  const wantsAmbience = input.userSoundPreferences.enableAmbience
  const wantsEffects = input.userSoundPreferences.enableSfx
  const wantsMusic = input.userSoundPreferences.enableMusic
  const requestedOperations: SoundRequestedOperation[] = [
    'design',
    ...(needsDialogueCleanup ? ['clean_dialogue', 'reduce_noise'] as const : []),
    ...(wantsAmbience ? ['generate_ambience'] as const : []),
    ...(wantsEffects ? ['generate_foley', 'sync'] as const : []),
    'mix',
    'qa',
    'handoff',
  ]

  return {
    adapterVersion: LEGACY_SOUND_COMPATIBILITY_ADAPTER_VERSION,
    status: 'canonical_context_resolution_required',
    skillKey: 'sound',
    requestedCapabilityKey: 'sound.design_scene_sound',
    requestedJobType: 'design_scene_sound',
    requestedOperations: [...new Set(requestedOperations)],
    requestedOutcome: 'Migrate the legacy sound intent into a canonical, bounded Sound plan without executing tools.',
    projectIdentity: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    },
    requestedMode: requestedMode(input.requestedOutputMode),
    soundPreferences: {
      enableSoundDesign: wantsEffects || wantsAmbience || needsDialogueCleanup,
      preserveNaturalSound: input.existingAudioContext.hasOriginalAudio,
      preserveEmotionalSilence: true,
      avoidLoudSoundUnderSpeech: input.userSoundPreferences.avoidLoudSfxUnderSpeech,
      preferredPerspective: input.userSoundPreferences.preferSubtleSound ? 'restrained' : 'natural',
    },
    musicHandoff: {
      required: wantsMusic,
      targetSkillKey: 'music',
      reason: wantsMusic
        ? 'Legacy Music intent must be assigned to the separate Music top-level skill.'
        : undefined,
    },
    requiredCanonicalContext: [
      'sound_manifest_binding',
      'exact_scope_authority',
      'source_artifact_versions_and_hashes',
      'timeline_manifest_and_hash',
      'approved_visual_dependencies_when_applicable',
      'execution_authority_and_credit_reservation_when_applicable',
    ],
    compatibilityNotices: [
      'This adapter produces planning data only and never executes a tool or provider.',
      'The Head of Orchestra must resolve and admit the canonical Sound capability and tool route.',
      'Music ownership is removed from the legacy combined workstream.',
      'No legacy provider, tool, runtime, or pricing identifier is carried into the canonical request.',
    ],
  }
}
