import type {
  ReferenceMusicDNARecord,
} from '../../types/audio-music'
import {
  getDefaultMockMusicQAScenario,
  mockMusicQAScenarios,
  type MockMusicQAScenario,
} from '../mock/mock-music-qa-scenarios'
import { evaluateMusicLibraryCandidate } from '../services/music-library-candidate-service'
import { createMusicMixPlan } from '../services/music-mix-planning-service'
import { createMusicQAReport } from '../services/music-qa-service'
import { decideIfMusicShouldRegenerate } from '../services/music-regeneration-decision-service'
import { analyzeGeneratedMusicTrack } from '../services/music-track-analysis-service'
import {
  runMockLakeComoReferenceDNAFlow,
  runMockReferenceToMusicCueFlow,
} from './mock-reference-dna-orchestrator'

function nextStepForFlow(params: {
  shouldRegenerate: boolean
  recommendedAction: string
}) {
  if (params.shouldRegenerate) return 'regenerate' as const
  if (params.recommendedAction === 'ask_user') return 'ask_user' as const
  return 'use_in_preview' as const
}

function referenceForScenario(scenario: MockMusicQAScenario, referenceMusicDNA?: ReferenceMusicDNARecord) {
  if (referenceMusicDNA) return referenceMusicDNA
  if (!scenario.useLakeComoReference) return undefined
  return runMockLakeComoReferenceDNAFlow().referenceMusicDNA
}

export function runMockMusicQAFlow(
  scenario: MockMusicQAScenario = getDefaultMockMusicQAScenario(),
  referenceMusicDNA?: ReferenceMusicDNARecord,
) {
  const referenceDNA = referenceForScenario(scenario, referenceMusicDNA)
  const track = referenceDNA
    ? {
        ...scenario.mockGeneratedTrack,
        referenceDnaId: referenceDNA.id,
      }
    : scenario.mockGeneratedTrack
  const referenceCueFlow = referenceDNA ? runMockReferenceToMusicCueFlow(referenceDNA) : undefined
  const trackAnalysis = analyzeGeneratedMusicTrack({ track })
  const qaReport = createMusicQAReport({
    track,
    analysis: trackAnalysis,
    cue: scenario.cue,
    referenceMusicDNA: referenceDNA,
    userInstructions: scenario.userInstructions,
  })
  const mixPlan = createMusicMixPlan({
    track,
    analysis: trackAnalysis,
    qaReport,
    cue: scenario.cue,
  })
  const regenerationDecision = decideIfMusicShouldRegenerate({
    qaReport,
    analysis: trackAnalysis,
    mixPlan,
    projectId: track.projectId,
    editPlanId: 'mock-music-qa-edit-plan',
  })
  const libraryCandidate = evaluateMusicLibraryCandidate({
    track,
    analysis: trackAnalysis,
    qaReport,
  })

  return {
    scenario,
    referenceCueFlow,
    trackAnalysis,
    qaReport,
    qaIssues: qaReport.issues,
    mixPlan,
    regenerationDecision,
    libraryCandidate,
    nextStep: nextStepForFlow({
      shouldRegenerate: regenerationDecision.shouldRegenerate,
      recommendedAction: qaReport.recommendedAction,
    }),
  }
}

export function runMockLakeComoMusicQAFlow() {
  const lakeScenarioIds = new Set([
    'dialogue-bed-no-vocals-pass',
    'lake-como-montage-vocal-texture-pass',
    'dialogue-bed-with-lyrics-fail',
    'food-social-too-loud-over-ambience',
    'outro-abrupt-ending-adjust',
  ])
  const referenceFlow = runMockLakeComoReferenceDNAFlow()
  const scenarioResults = mockMusicQAScenarios
    .filter((scenario) => lakeScenarioIds.has(scenario.id))
    .map((scenario) => runMockMusicQAFlow(scenario, referenceFlow.referenceMusicDNA))
  const failedCount = scenarioResults.filter((result) => result.qaReport.status === 'failed').length

  return {
    referenceFlow,
    scenarioResults,
    summary: `${scenarioResults.length} Lake Como QA cases checked; ${failedCount} require regeneration before preview.`,
    nextStep: failedCount > 0 ? 'regenerate' as const : 'use_in_preview' as const,
  }
}

export function runMockMusicMixPlanningFlow(
  scenario: MockMusicQAScenario = getDefaultMockMusicQAScenario(),
) {
  const flow = runMockMusicQAFlow(scenario)

  return {
    trackAnalysis: flow.trackAnalysis,
    qaReport: flow.qaReport,
    mixPlan: flow.mixPlan,
    nextStep: flow.mixPlan.status === 'needs_regeneration' ? 'regenerate' as const : 'use_in_preview' as const,
  }
}

export function runMockMusicRegenerationDecisionFlow(
  scenario: MockMusicQAScenario = mockMusicQAScenarios[1],
) {
  const flow = runMockMusicQAFlow(scenario)

  return {
    qaReport: flow.qaReport,
    regenerationDecision: flow.regenerationDecision,
    nextStep: flow.regenerationDecision.shouldRegenerate ? 'regenerate' as const : 'use_in_preview' as const,
  }
}
