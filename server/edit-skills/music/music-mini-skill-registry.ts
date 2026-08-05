import type { SkillQualificationStatus } from '../core/edit-skill-ids'
import { getMusicToolRouteManifest, MUSIC_TOOL_ROUTE_MANIFESTS } from '../../music/music-tool-routes'

export interface MusicMiniSkillManifest {
  miniSkillKey: string
  version: '3.0.0'
  supportedOperations: string[]
  requiredInputs: string[]
  optionalInputs: string[]
  acceptedArtifactTypes: string[]
  producedArtifactTypes: string[]
  toolRouteRefs: Array<{ routeKey: string; routeVersion: string; routeHash: string }>
  fallbackRouteRefs: Array<{ routeKey: string; routeVersion: string; routeHash: string }>
  lowerCostRouteRefs: Array<{ routeKey: string; routeVersion: string; routeHash: string }>
  attemptPolicyKey: string
  qualification: SkillQualificationStatus
  evidenceLevel: 'planning' | 'fixture' | 'internal_execution' | 'blocked'
  qaKeys: string[]
  invalidationRules: string[]
  limitations: string[]
  implementationStatus: MusicMiniSkillImplementationStatus
  implementationEvidence: MusicMiniSkillImplementationEvidence[]
}

export type MusicMiniSkillImplementationStatus = 'implemented' | 'planning_only' | 'fixture_only' | 'blocked'

export interface MusicMiniSkillImplementationEvidence {
  modulePath: string
  functionOrService: string
  executionBoundary: 'pre_route_admission' | 'route_step' | 'composite_service'
  routeIdentities: string[]
  operationIdentities: string[]
  receiptTypes: string[]
  modeStatus: {
    planning: SkillQualificationStatus
    fixtureExecution: SkillQualificationStatus
    privateInternalExecution: SkillQualificationStatus
    productionExecution: SkillQualificationStatus
  }
}

const MINI_SKILLS = [
  ['scope_guard', 'Scope Guard'], ['context_loader', 'Context Loader'],
  ['evidence_confidence_manager', 'Evidence Confidence Manager'],
  ['video_music_context_study', 'Video Music Context Study'],
  ['music_need_director', 'Music Need Director'], ['silence_director', 'Silence Director'],
  ['narrative_function_director', 'Narrative Function Director'],
  ['emotional_arc_director', 'Emotional Arc Director'],
  ['single_multi_cue_director', 'Single Multi Cue Director'],
  ['cue_density_guard', 'Cue Density and Over-Scoring Guard'],
  ['cue_sheet_planner', 'Music Cue-Sheet Planner'], ['motif_theme_director', 'Motif and Theme Director'],
  ['soundtrack_continuity_director', 'Soundtrack Continuity Director'],
  ['existing_music_study', 'Existing Music Study'], ['user_music_intake', 'User Music Intake'],
  ['rights_provenance_guard', 'Music Rights and Provenance Guard'],
  ['reference_music_study', 'Reference Music Study'], ['reference_music_dna', 'Reference Music DNA'],
  ['style_arrangement_director', 'Style and Arrangement Director'],
  ['vocal_lyric_policy', 'Vocal and Lyric Policy'], ['language_culture_policy', 'Language and Culture Policy'],
  ['acquisition_director', 'Music Acquisition Director'], ['project_music_matcher', 'Project Music Matcher'],
  ['workspace_music_matcher', 'Workspace Music Matcher'], ['internal_library_matcher', 'Internal Music Library Matcher'],
  ['composition_brief_director', 'Composition Brief Director'], ['provider_prompt_compiler', 'Provider Prompt Compiler'],
  ['provider_attempt_manager', 'Provider Attempt Manager'], ['candidate_processing_director', 'Candidate Processing Director'],
  ['candidate_selection_director', 'Candidate Selection Director'], ['music_sync', 'MusicSync'],
  ['arrangement_editor', 'Music Arrangement Editor'], ['sound_support_coordinator', 'Music-to-Sound Support Coordinator'],
  ['mix_intent_director', 'Music Mix-Intent Director'], ['qa_coordinator', 'Music QA Coordinator'],
  ['continuity_qa', 'Soundtrack Continuity QA'], ['revision_director', 'Music Revision Director'],
  ['regeneration_director', 'Music Regeneration Director'], ['asset_usage_manager', 'Music Asset and Usage Manager'],
  ['library_promotion_manager', 'Music Library Promotion Manager'], ['final_handoff_builder', 'Final Music Handoff Builder'],
] as const

type MiniImplementation = {
  status: MusicMiniSkillImplementationStatus
  modulePath: string
  functionOrService: string
  evidenceLevel: MusicMiniSkillManifest['evidenceLevel']
  executionBoundary: MusicMiniSkillImplementationEvidence['executionBoundary']
}

const planning = (functionOrService: string, modulePath = 'server/music/music-supervision.ts'): MiniImplementation => ({
  status: 'planning_only', modulePath, functionOrService, evidenceLevel: 'planning', executionBoundary: 'composite_service',
})
const implemented = (functionOrService: string, modulePath: string): MiniImplementation => ({
  status: 'implemented', modulePath, functionOrService, evidenceLevel: 'internal_execution', executionBoundary: 'route_step',
})
const fixture = (functionOrService: string, modulePath: string): MiniImplementation => ({
  status: 'fixture_only', modulePath, functionOrService, evidenceLevel: 'fixture', executionBoundary: 'route_step',
})

const MINI_SKILL_IMPLEMENTATIONS: Record<(typeof MINI_SKILLS)[number][0], MiniImplementation> = {
  scope_guard: { ...implemented('evaluateMusicScopeGuard', 'server/music/music-scope-guard.ts'),
    executionBoundary: 'pre_route_admission' },
  context_loader: { ...implemented('resolveCanonicalMusicContext', 'server/music/music-context.ts'),
    executionBoundary: 'pre_route_admission' },
  evidence_confidence_manager: planning('studyMusicContext'),
  video_music_context_study: planning('studyMusicContext'),
  music_need_director: planning('decideMusicNeed'),
  silence_director: planning('decideMusicNeed'),
  narrative_function_director: planning('buildMusicNarrativeArc'),
  emotional_arc_director: planning('buildMusicNarrativeArc'),
  single_multi_cue_director: planning('buildMusicSoundtrackSegmentationPlan'),
  cue_density_guard: planning('buildMusicCueSheet'),
  cue_sheet_planner: planning('buildMusicCueSheet'),
  motif_theme_director: planning('buildMusicNarrativeArc'),
  soundtrack_continuity_director: planning('buildMusicNarrativeArc'),
  existing_music_study: implemented('analyzePrivateMusicArtifact', 'server/music/music-analysis.ts'),
  user_music_intake: implemented('selectProfessionalMusicAsset', 'server/music/music-asset-matcher.ts'),
  rights_provenance_guard: implemented('selectProfessionalMusicAsset', 'server/music/music-asset-matcher.ts'),
  reference_music_study: implemented('analyzePrivateMusicArtifact', 'server/music/music-analysis.ts'),
  reference_music_dna: implemented('analyzePrivateMusicArtifact', 'server/music/music-analysis.ts'),
  style_arrangement_director: planning('buildMusicNarrativeArc'),
  vocal_lyric_policy: planning('buildMusicCueSheet'),
  language_culture_policy: planning('buildMusicCueSheet'),
  acquisition_director: planning('decideCueRoutes'),
  project_music_matcher: implemented('selectProfessionalMusicAsset', 'server/music/music-asset-matcher.ts'),
  workspace_music_matcher: implemented('selectProfessionalMusicAsset', 'server/music/music-asset-matcher.ts'),
  internal_library_matcher: implemented('selectProfessionalMusicAsset', 'server/music/music-asset-matcher.ts'),
  composition_brief_director: planning('createMusicCompositionBrief', 'server/music/lyria-provider.ts'),
  provider_prompt_compiler: fixture('compileLyria3InteractionRequest', 'server/music/lyria-provider.ts'),
  provider_attempt_manager: fixture('CanonicalLyria3ProviderAdapter.execute', 'server/music/lyria-provider.ts'),
  candidate_processing_director: implemented('analyzePrivateMusicArtifact', 'server/music/music-analysis.ts'),
  candidate_selection_director: implemented('selectMusicCandidate', 'server/music/music-analysis.ts'),
  music_sync: implemented('compileMusicSync', 'server/music/music-sync.ts'),
  arrangement_editor: implemented('compileMusicSync', 'server/music/music-sync.ts'),
  sound_support_coordinator: implemented('CanonicalSoundV4MusicSupportAdapter.execute', 'server/music/music-sound-support-port.ts'),
  mix_intent_director: implemented('createMusicSoundSupportRequest', 'server/music/music-sound-support-port.ts'),
  qa_coordinator: implemented('runCanonicalMusicQa', 'server/music/music-qa.ts'),
  continuity_qa: implemented('analyzeMusicContinuity', 'server/music/music-qa.ts'),
  revision_director: implemented('StandaloneCanonicalMusicSkillService.executeRevision',
    'server/edit-skills/music/canonical-music-skill-service.ts'),
  regeneration_director: planning('StandaloneCanonicalMusicSkillService.planRevision',
    'server/edit-skills/music/canonical-music-skill-service.ts'),
  asset_usage_manager: implemented('createMusicFinalHandoff', 'server/music/music-contracts.ts'),
  library_promotion_manager: planning('createMusicFinalHandoff', 'server/music/music-contracts.ts'),
  final_handoff_builder: implemented('createMusicFinalHandoff', 'server/music/music-contracts.ts'),
}

function relevantRoutes(key: string): typeof MUSIC_TOOL_ROUTE_MANIFESTS {
  const terms: Record<string, string[]> = {
    scope_guard: ['decide.need'], context_loader: ['study.video_context'], evidence_confidence_manager: ['study.video_context'],
    video_music_context_study: ['study.video_context'], music_need_director: ['decide.need', 'no_music', 'ambience_only'],
    silence_director: ['decide.silence', 'no_music'], narrative_function_director: ['narrative_arc'],
    emotional_arc_director: ['narrative_arc'], single_multi_cue_director: ['cue_sheet'], cue_density_guard: ['cue_sheet'],
    cue_sheet_planner: ['cue_sheet'], motif_theme_director: ['plan.motif'], soundtrack_continuity_director: ['full_video'],
    existing_music_study: ['study.existing'], user_music_intake: ['study.user_upload'], rights_provenance_guard: ['study.user_upload'],
    reference_music_study: ['study.reference'], reference_music_dna: ['study.reference'], style_arrangement_director: ['narrative_arc'],
    vocal_lyric_policy: ['cue_sheet'], language_culture_policy: ['cue_sheet'], acquisition_director: ['acquire.'],
    project_music_matcher: ['project_library'], workspace_music_matcher: ['workspace_library'], internal_library_matcher: ['internal_library'],
    composition_brief_director: ['generate.original'], provider_prompt_compiler: ['generate.original'],
    provider_attempt_manager: ['lyria'], candidate_processing_director: ['analyze.candidate'],
    candidate_selection_director: ['select.candidate'], music_sync: ['sync.picture'], arrangement_editor: ['editorial.fit'],
    sound_support_coordinator: ['sound_processing'], mix_intent_director: ['sound_processing'], qa_coordinator: ['qa.cue'],
    continuity_qa: ['qa.continuity'], revision_director: ['revise.localized'], regeneration_director: ['revise.localized'],
    asset_usage_manager: ['handoff.final'], library_promotion_manager: ['promote.library'], final_handoff_builder: ['handoff.final'],
  }
  const needles = terms[key] ?? []
  return MUSIC_TOOL_ROUTE_MANIFESTS.filter((route) => needles.some((term) => route.routeKey.includes(term)))
}

function ref(route: (typeof MUSIC_TOOL_ROUTE_MANIFESTS)[number]): { routeKey: string; routeVersion: string; routeHash: string } {
  return { routeKey: route.routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash }
}

export const MUSIC_MINI_SKILL_MANIFESTS: readonly MusicMiniSkillManifest[] = Object.freeze(
  MINI_SKILLS.map(([key, displayName]): MusicMiniSkillManifest => {
    const implementation = MINI_SKILL_IMPLEMENTATIONS[key]
    const executionBoundary = key === 'revision_director'
      ? 'composite_service' as const : implementation.executionBoundary
    const routes = relevantRoutes(key)
    const primary = routes.filter((route) => route.routeRole !== 'no_music' && route.routeRole !== 'lower_cost').map(ref)
    const fallback = routes.filter((route) => route.routeRole === 'no_music').map(ref)
    const lower = routes.filter((route) => route.routeRole === 'lower_cost').map(ref)
    const qualification: SkillQualificationStatus = implementation.status === 'implemented'
      ? 'internal_execution_qualified' : 'planning_qualified'
    return {
      miniSkillKey: `music.mini.${key}`,
      version: '3.0.0',
      supportedOperations: [key],
      requiredInputs: ['music_assignment_v2', 'approved_timeline_manifest'],
      optionalInputs: ['approved_private_music_audio', 'structured_story_evidence', 'speech_evidence'],
      acceptedArtifactTypes: ['music_assignment_v2', 'approved_private_music_audio'],
      producedArtifactTypes: routes.flatMap((route) => route.producedArtifactTypes),
      toolRouteRefs: primary.length > 0 ? primary : routes.map(ref),
      fallbackRouteRefs: fallback,
      lowerCostRouteRefs: lower,
      attemptPolicyKey: implementation.status === 'fixture_only'
        ? 'music.attempt.provider_reconciled.v2' : 'music.attempt.local_idempotent.v2',
      qualification,
      evidenceLevel: implementation.evidenceLevel,
      qaKeys: ['music.qa.planning.authority.v2', 'music.qa.integration.authority.v2'],
      invalidationRules: ['timeline_changed', 'source_changed', 'rights_changed'],
      limitations: displayName.includes('Culture') || displayName.includes('Emotional')
        ? ['Subjective output remains confidence-scored and review-aware.'] : [],
      implementationStatus: implementation.status,
      implementationEvidence: [{
        modulePath: implementation.modulePath,
        functionOrService: implementation.functionOrService,
        executionBoundary,
        routeIdentities: routes.map((route) => `${route.routeKey}@${route.routeVersion}#${route.routeHash}`),
        operationIdentities: executionBoundary === 'route_step'
          ? routes.flatMap((route) => route.steps.map((step) =>
            `${step.toolKey}@${step.toolVersion}/${step.operationKey}@${step.operationVersion}`))
          : [`music.internal/${implementation.functionOrService}@3.0.0`],
        receiptTypes: key === 'scope_guard' ? ['music_scope_guard_result_v3']
          : key === 'context_loader' ? ['music_context_package_v2']
            : key === 'revision_director' ? ['music_revision_receipt_v2']
              : implementation.status === 'implemented' ? ['music_route_step_receipt_v3']
          : implementation.status === 'fixture_only' ? ['music_provider_attempt_receipt_v3'] : ['music_planning_artifact_v3'],
        modeStatus: {
          planning: 'planning_qualified',
          fixtureExecution: implementation.status === 'implemented'
            ? 'internal_execution_qualified' : 'planning_qualified',
          privateInternalExecution: implementation.status === 'implemented'
            ? 'internal_execution_qualified' : 'blocked',
          productionExecution: 'blocked',
        },
      }],
    }
  }),
)

export function validateMusicMiniSkillRegistry(): void {
  if (new Set(MUSIC_MINI_SKILL_MANIFESTS.map((item) => item.miniSkillKey)).size !== MUSIC_MINI_SKILL_MANIFESTS.length) {
    throw new Error('Duplicate Music mini-skill key.')
  }
  for (const mini of MUSIC_MINI_SKILL_MANIFESTS) {
    if (mini.implementationEvidence.length === 0) {
      throw new Error(`Music mini-skill ${mini.miniSkillKey} lacks implementation evidence.`)
    }
    for (const evidence of mini.implementationEvidence) {
      if (evidence.functionOrService === mini.miniSkillKey.replace('music.mini.', '')) {
        throw new Error(`Music mini-skill ${mini.miniSkillKey} cites a label instead of an implementation symbol.`)
      }
      if (mini.implementationStatus === 'implemented' &&
        evidence.modeStatus.privateInternalExecution !== 'internal_execution_qualified') {
        throw new Error(`Implemented Music mini-skill ${mini.miniSkillKey} lacks private execution evidence.`)
      }
      if (mini.implementationStatus !== 'implemented' &&
        evidence.modeStatus.privateInternalExecution !== 'blocked') {
        throw new Error(`Non-executable Music mini-skill ${mini.miniSkillKey} overclaims private execution.`)
      }
      if (evidence.modeStatus.productionExecution !== 'blocked') {
        throw new Error(`Music mini-skill ${mini.miniSkillKey} cannot claim production execution.`)
      }
    }
    if (mini.toolRouteRefs.length === 0) throw new Error(`Music mini-skill ${mini.miniSkillKey} has no exact route.`)
    for (const routeRef of [...mini.toolRouteRefs, ...mini.fallbackRouteRefs, ...mini.lowerCostRouteRefs]) {
      const route = getMusicToolRouteManifest(routeRef.routeKey, routeRef.routeVersion)
      if (!route || route.routeHash !== routeRef.routeHash) {
        throw new Error(`Music mini-skill ${mini.miniSkillKey} references an unknown route.`)
      }
    }
  }
}
