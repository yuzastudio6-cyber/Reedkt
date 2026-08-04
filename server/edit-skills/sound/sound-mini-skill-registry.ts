import type { SkillQualificationStatus } from '../core/edit-skill-ids'
import type { SkillExactRouteReference } from '../core/skill-capability-manifest-types'
import { getSoundToolRouteManifest } from '../../sound/sound-tool-route-manifest'
import { registerCanonicalSoundToolRoutes } from '../../sound/sound-tool-routes'

export interface SoundMiniSkillManifest {
  miniSkillKey: string
  miniSkillVersion: '3.0.0'
  qualificationStatus: SkillQualificationStatus
  evidenceLevel: 'planning' | 'fixture' | 'internal_execution'
  supportedOperations: readonly string[]
  routeRefs: readonly SkillExactRouteReference[]
  fallbackRouteRefs: readonly SkillExactRouteReference[]
  lowerCostRouteRefs: readonly SkillExactRouteReference[]
  producedArtifactTypes: readonly string[]
  knownLimitations: readonly string[]
}

const NO_SOUND = 'sound.route.no_sound.v1'

type SoundMiniSkillSeed = Omit<SoundMiniSkillManifest,
  'miniSkillVersion' | 'routeRefs' | 'fallbackRouteRefs' | 'lowerCostRouteRefs'> & {
    routeRefs: readonly string[]
    fallbackRouteRefs: readonly string[]
    lowerCostRouteRefs: readonly string[]
  }

registerCanonicalSoundToolRoutes()

function exactRouteRef(routeKey: string): SkillExactRouteReference {
  const route = getSoundToolRouteManifest(routeKey)
  if (!route) throw new Error(`Sound mini-skill references unknown route ${routeKey}.`)
  return Object.freeze({ routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash })
}

function mini(input: SoundMiniSkillSeed): Readonly<SoundMiniSkillManifest> {
  return Object.freeze({
    ...input,
    miniSkillVersion: '3.0.0',
    routeRefs: input.routeRefs.map(exactRouteRef),
    fallbackRouteRefs: input.fallbackRouteRefs.map(exactRouteRef),
    lowerCostRouteRefs: input.lowerCostRouteRefs.map(exactRouteRef),
  })
}

export const soundMiniSkillManifests = Object.freeze(Object.fromEntries([
  mini({ miniSkillKey: 'sound_scope_guard', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['validate_request', 'validate_authority', 'validate_ranges', 'prevent_cycles'], routeRefs: [], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_caller_receipt_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'source_sound_study', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['decode', 'loudness', 'silence', 'transients'], routeRefs: ['sound.route.study.source_audio.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_study_report_v2'], knownLimitations: ['Acoustic classification is evidence-limited and is not a learned perceptual judgment.'] }),
  mini({ miniSkillKey: 'visual_action_study', qualificationStatus: 'planning_qualified', evidenceLevel: 'planning', supportedOperations: ['consume_structured_visual_events'], routeRefs: ['sound.route.study.visual_events.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['visual_sound_event_study_v2'], knownLimitations: ['Consumes structured visual evidence; it does not independently infer material realism from pixels.'] }),
  mini({ miniSkillKey: 'reference_sound_study', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['analyze_reference'], routeRefs: ['sound.route.study.reference_sound.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['reference_sound_dna_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'sound_dna', qualificationStatus: 'planning_qualified', evidenceLevel: 'planning', supportedOperations: ['derive_sound_dna'], routeRefs: ['sound.route.study.reference_sound.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['reference_sound_dna_v2'], knownLimitations: ['Creative interpretation remains planning evidence.'] }),
  mini({ miniSkillKey: 'sound_design_director', qualificationStatus: 'planning_qualified', evidenceLevel: 'planning', supportedOperations: ['preserve', 'repair', 'search', 'extract', 'generate', 'layer', 'choose_no_sound', 'control_density'], routeRefs: ['sound.route.design.plan.v1'], fallbackRouteRefs: [NO_SOUND], lowerCostRouteRefs: [NO_SOUND], producedArtifactTypes: ['sound_design_plan_v2', 'sound_cue_manifest_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'internal_library_acquisition', qualificationStatus: 'planning_qualified', evidenceLevel: 'planning', supportedOperations: ['search_authorized_index', 'rank', 'validate_provenance'], routeRefs: ['sound.route.acquire.internal_library.v1'], fallbackRouteRefs: [NO_SOUND], lowerCostRouteRefs: [NO_SOUND], producedArtifactTypes: ['sound_cue_manifest_v2', 'sound_provenance_report_v2'], knownLimitations: ['The durable private library index is not activated.'] }),
  mini({ miniSkillKey: 'project_source_extraction', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['extract', 'repair'], routeRefs: ['sound.route.acquire.project_source.v1'], fallbackRouteRefs: [NO_SOUND], lowerCostRouteRefs: [NO_SOUND], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'video_conditioned_sfx', qualificationStatus: 'planning_qualified', evidenceLevel: 'fixture', supportedOperations: ['generate_video_conditioned_sfx'], routeRefs: ['sound.route.generate.video_sfx.mirelo.v1'], fallbackRouteRefs: [NO_SOUND], lowerCostRouteRefs: [NO_SOUND], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: ['Mirelo execution is fixture-qualified; live activation lacks external evidence.'] }),
  mini({ miniSkillKey: 'text_conditioned_sfx', qualificationStatus: 'planning_qualified', evidenceLevel: 'fixture', supportedOperations: ['generate_text_conditioned_sfx'], routeRefs: ['sound.route.generate.text_sfx.v1'], fallbackRouteRefs: [NO_SOUND], lowerCostRouteRefs: [NO_SOUND], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: ['Mirelo execution is fixture-qualified; live activation lacks external evidence.'] }),
  mini({ miniSkillKey: 'foley', qualificationStatus: 'planning_qualified', evidenceLevel: 'fixture', supportedOperations: ['generate_foley'], routeRefs: ['sound.route.generate.video_sfx.mirelo.v1'], fallbackRouteRefs: [NO_SOUND], lowerCostRouteRefs: [NO_SOUND], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: ['Material realism remains needs-review after technical output QA.'] }),
  mini({ miniSkillKey: 'ambience', qualificationStatus: 'planning_qualified', evidenceLevel: 'fixture', supportedOperations: ['loop', 'extend', 'room_tone'], routeRefs: ['sound.route.ambience.generate_or_extend.v1'], fallbackRouteRefs: [NO_SOUND], lowerCostRouteRefs: [NO_SOUND], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: ['Generated ambience remains Mirelo fixture evidence; deterministic loop processing is separately internal-execution-qualified. Room identity is driven by supplied evidence, not learned acoustic-scene inference.'] }),
  mini({ miniSkillKey: 'audio_repair', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['gentle_cleanup'], routeRefs: ['sound.route.repair.dialogue_gentle.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: ['Advanced restoration remains outside the qualified profile.'] }),
  mini({ miniSkillKey: 'dialogue_cleanup', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['gentle_dialogue_cleanup', 'speech_safe_qa'], routeRefs: ['sound.route.repair.dialogue_gentle.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'audio_editing', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['trim', 'fade', 'gain', 'normalize', 'resample', 'channel_convert', 'loop'], routeRefs: ['sound.route.edit.deterministic.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'audio_retiming', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['time_stretch', 'pitch_shift', 'exact_length_fit'], routeRefs: ['sound.route.retime.pitch_preserved.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_audio_artifact_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'sound_sync', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['transient_detection', 'hit_alignment', 'frame_sync', 'tail_policy'], routeRefs: ['sound.route.sync.visual_event.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_cue_manifest_v2'], knownLimitations: [] }),
  mini({ miniSkillKey: 'sound_mix', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['gain_automation', 'ducking', 'eq_profile', 'limiting', 'panning', 'stem_render'], routeRefs: ['sound.route.mix.scene.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_audio_artifact_v2', 'sound_mix_automation_manifest_v2'], knownLimitations: ['Advanced room matching remains planning-only.'] }),
  mini({ miniSkillKey: 'sound_qa', qualificationStatus: 'internal_execution_qualified', evidenceLevel: 'internal_execution', supportedOperations: ['technical_qa', 'sync_qa', 'mix_metrics', 'continuity_qa', 'provenance_qa', 'integration_qa'], routeRefs: ['sound.route.qa.final_sound.v1'], fallbackRouteRefs: [], lowerCostRouteRefs: [], producedArtifactTypes: ['sound_qa_report_v2', 'sound_final_composition_handoff_v2'], knownLimitations: ['Perceptual naturalness and material realism remain needs-review without qualified evaluator evidence.'] }),
].map((value) => [value.miniSkillKey, value]))) as Readonly<Record<string, Readonly<SoundMiniSkillManifest>>>

export function validateSoundMiniSkillRouteReferences(): void {
  for (const manifest of Object.values(soundMiniSkillManifests)) {
    for (const routeRef of [...manifest.routeRefs, ...manifest.fallbackRouteRefs, ...manifest.lowerCostRouteRefs]) {
      const route = getSoundToolRouteManifest(routeRef.routeKey, routeRef.routeVersion)
      if (!route || route.routeHash !== routeRef.routeHash) {
        throw new Error(`Sound mini-skill ${manifest.miniSkillKey} references unknown or stale route ${routeRef.routeKey}.`)
      }
    }
  }
}
