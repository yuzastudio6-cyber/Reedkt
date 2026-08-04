import type { CanonicalMusicUiProjection } from '../../../src/types/canonical-music-ui'
import type {
  CanonicalMusicPlanResult,
  MusicEstimateResult,
  MusicQaResult,
} from './canonical-music-skill-service'
import type {
  CanonicalMusicSkillResult,
  MusicArtifactEnvelope,
  MusicQaFinding,
  MusicRouteBinding,
} from '../../music/music-contracts'
import type {
  MusicContextStudyPayload,
  MusicCueSheetPayload,
  MusicNarrativeArcPayload,
  MusicNeedDecisionPayload,
} from '../../music/music-supervision'

function artifactPayload<T>(
  artifacts: MusicArtifactEnvelope[],
  artifactType: string,
): T | undefined {
  return artifacts.find((artifact) => artifact.artifactType === artifactType)?.payload as T | undefined
}

function executionEvidence(result: CanonicalMusicSkillResult): CanonicalMusicUiProjection['executionEvidence'] {
  if (result.status === 'planned') return 'planned'
  if (result.unitReceipts.length === 0) return 'none'
  if (result.qualificationStatusUsed === 'production_qualified') return 'production'
  if (result.qualificationStatusUsed === 'internal_qualified') return 'private_internal'
  return 'fixture'
}

function currentState(result: CanonicalMusicSkillResult): CanonicalMusicUiProjection['progress']['currentState'] {
  if (result.status === 'planned') return 'planned'
  if (result.status === 'blocked' || result.status === 'partial' || result.status === 'stale') return 'blocked'
  if (['completed', 'no_music', 'ambience_only', 'needs_review'].includes(result.status)) return 'complete'
  return result.unitReceipts.length > 0 ? 'in_progress' : 'not_started'
}

function safeQa(input: {
  result: CanonicalMusicSkillResult
  qa?: MusicQaResult
}): CanonicalMusicUiProjection['qa'] {
  const qaPayload = artifactPayload<{ findings?: MusicQaFinding[]; status?: string }>(
    input.result.artifacts,
    'music_qa_report_v1',
  )
  const categories = (qaPayload?.findings ?? []).map((finding) => ({
    key: finding.qaClass,
    status: finding.status,
    summary: finding.summary,
  }))
  const status = input.qa?.status ?? (
    qaPayload?.status === 'blocking' ? 'blocking'
      : qaPayload?.status === 'needs_review' ? 'needs_review'
        : qaPayload?.status === 'pass' ? 'pass' : 'not_run'
  )
  return {
    status,
    categories,
    reviewItems: [...new Set(input.result.reviewRequiredItems)].slice(0, 50),
  }
}

function assertBrowserSafe(value: unknown): void {
  const serialized = JSON.stringify(value)
  const forbidden = [
    /storageObjectId/iu,
    /privateOutputScopeId/iu,
    /providerPayload/iu,
    /authorization/iu,
    /api[_-]?key/iu,
    /bearer\s/iu,
    /(?:^|["'])\/(?:Users|Volumes|private|tmp)\//u,
    /[?&](?:token|signature|credential)=/iu,
  ]
  if (forbidden.some((pattern) => pattern.test(serialized))) {
    throw new Error('Canonical Music UI projection contains a private or privileged field.')
  }
}

export function projectCanonicalMusicResultForUi(input: {
  result: CanonicalMusicSkillResult
  plan?: CanonicalMusicPlanResult
  estimate?: MusicEstimateResult
  qa?: MusicQaResult
}): CanonicalMusicUiProjection {
  const { result } = input
  const context = input.plan?.context.payload ?? artifactPayload<MusicContextStudyPayload>(result.artifacts, 'music_context_study_v1')
  const need = input.plan?.need.payload ?? artifactPayload<MusicNeedDecisionPayload>(result.artifacts, 'music_need_decision_v1')
  const arc = input.plan?.arc.payload ?? artifactPayload<MusicNarrativeArcPayload>(result.artifacts, 'music_narrative_arc_v1')
  const cueSheet = input.plan?.cueSheet.payload ?? artifactPayload<MusicCueSheetPayload>(result.artifacts, 'music_cue_sheet_v1')
  const routeBindings = artifactPayload<MusicRouteBinding[]>(result.artifacts, 'music_acquisition_plan_v1') ??
    input.plan?.routeBindings ?? []
  const completedUnits = result.unitReceipts.filter((receipt) => receipt.status === 'completed').length
  const totalUnits = input.plan?.executionGraph.units.length ?? result.unitReceipts.length
  const attemptCount = result.providerAttemptRefs.length
  const providerLive = result.unitReceipts.some((receipt) => receipt.runtimeEvidence.includes('live_provider_transport'))
  const selectedCueIds = new Set(result.artifacts.filter((artifact) =>
    artifact.artifactType === 'music_candidate_selection_decision_v1' && artifact.cueId).map((artifact) => artifact.cueId))
  const unitByCue = new Map(result.unitReceipts.filter((receipt) => receipt.cueId)
    .map((receipt) => [receipt.cueId!, receipt]))
  const routeByCue = new Map(routeBindings.map((binding) => [binding.cueId, binding]))
  const projection: CanonicalMusicUiProjection = {
    schemaVersion: 'canonical-music-ui-projection-v1',
    requestId: result.requestId,
    skillVersion: result.musicSkillVersion,
    manifestHash: result.musicManifestHash,
    status: result.status,
    qualificationStatus: result.qualificationStatusUsed,
    executionEvidence: executionEvidence(result),
    context: {
      storyPurpose: context?.storyPurpose ?? 'Canonical Music context is not available yet.',
      speechEvidence: context?.speechEvidence.evidenceLevel ?? 'missing',
      naturalAmbience: context?.naturalAmbienceValue ?? 'unknown',
      evidenceSummary: context
        ? `${context.measuredEvidenceRefs.length} measured, ${context.structuredEvidenceRefs.length} structured, ${context.userDeclaredEvidenceRefs.length} user-declared`
        : 'No canonical context artifact',
      reviewRequired: Boolean(context?.reviewRequiredFindings.length),
    },
    musicNeed: {
      decision: need?.decision ?? 'pending',
      reason: need?.narrativeReason ?? 'Waiting for a canonical Music need decision.',
      confidencePercent: Math.round((need?.confidence ?? 0) * 100),
      generationWasAutomaticBecauseNoUpload: false,
    },
    soundtrack: {
      cueFamilyStrategy: arc?.cueFamilyStrategy ?? 'pending',
      cueCount: cueSheet?.cues.length ?? 0,
      cueDensityPerMinute: cueSheet?.cueDensityPerMinute ?? 0,
      overScoringWarnings: cueSheet?.overScoringWarnings ?? [],
      intentionalSilenceRangeCount: cueSheet?.intentionalSilenceRanges.length ?? 0,
    },
    cues: (cueSheet?.cues ?? []).map((cue) => {
      const unit = unitByCue.get(cue.cueId)
      const route = routeByCue.get(cue.cueId)
      return {
        cueId: cue.cueId,
        startFrame: cue.exactRange.startFrame,
        endFrameExclusive: cue.exactRange.endFrameExclusive,
        narrativeFunction: cue.narrativeFunction,
        cueRole: cue.cueRole,
        motifRole: cue.motifRole,
        acquisitionDecision: route?.acquisitionDecision ?? cue.acquisitionPreference,
        ...(route ? { routeKey: route.routeKey } : {}),
        status: unit?.status ?? 'planned',
        selectedAssetCount: selectedCueIds.has(cue.cueId) ? 1 : 0,
        reviewRequired: result.reviewRequiredItems.some((item) => item.includes(cue.cueId)),
      }
    }),
    ...(input.estimate ? {
      estimate: {
        minimumCredits: input.estimate.minimumCredits,
        expectedCredits: input.estimate.expectedCredits,
        maximumCredits: input.estimate.maximumCredits,
        approvalRequired: input.estimate.approvalRequired,
        reservationRequired: input.estimate.reservationRequired,
        lowerCostAlternatives: input.estimate.lowerCostAlternatives,
      },
    } : {}),
    progress: {
      completedUnits,
      totalUnits,
      currentState: currentState(result),
      evidenceLabel: result.unitReceipts.length > 0
        ? `${completedUnits} of ${totalUnits} canonical execution units have receipts.`
        : 'No execution receipt exists; this surface does not simulate progress.',
    },
    qa: safeQa({ result, ...(input.qa ? { qa: input.qa } : {}) }),
    handoff: {
      ready: Boolean(result.finalCompositionHandoff),
      selectedAssetCount: result.selectedMusicAssetRefs.length,
      processedAssetCount: result.processedMusicAssetRefs.length,
      musicStemCount: result.musicStemAssetRefs.length,
      intentionalNoMusic: result.finalCompositionHandoff?.intentionalNoMusic ?? result.status === 'no_music',
      ambienceOnly: result.finalCompositionHandoff?.ambienceOnly ?? result.status === 'ambience_only',
      finalMuxRenderExportOutsideMusic: true,
    },
    provider: {
      profile: 'google.lyria3.interactions.global.v1beta1',
      attemptCount,
      evidence: attemptCount === 0 ? 'none' : providerLive ? 'live' : 'fixture',
      liveActivation: providerLive ? 'active' : 'blocked_pending_external_evidence',
    },
    revisionOptions: [
      'keep_music', 'use_sound_adjustment', 'select_another_section', 'select_another_candidate',
      'change_cue_boundary', 'change_mix_intent', 'lower_energy', 'remove_vocals',
      'generate_variation', 'regenerate_cue', 'replace_with_library_music', 'use_ambience_only',
      'use_no_music', 'ask_for_review',
    ],
    readOnlyProjection: true,
  }
  assertBrowserSafe(projection)
  return Object.freeze(structuredClone(projection))
}
