import type {
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
  MusicCueSheetRecord,
} from '../../../types/audio-music'
import { runMockLakeComoMusicQAFlow } from '../../../backend/orchestrators/mock-music-qa-orchestrator'
import {
  runMockLakeComoReferenceDNAFlow,
  runMockReferenceToMusicCueFlow,
} from '../../../backend/orchestrators/mock-reference-dna-orchestrator'

export type MusicContextView = {
  primarySceneType: string
  videoTopic: string
  settingSummary: string
  cultureContext: string
  musicNeeded: boolean
  cueCountDecision: string
  speechPresence: string
  dialogueHeavy: boolean
  montageDetected: boolean
  ambienceImportant: boolean
  userMusicInstructions: string
  avoidMusicInstructions: string
  confidence: number
}

export type MusicCreditEstimateView = {
  cueCount: number
  generatedCueCount: number
  planningCredits: number
  generationCredits: number
  qaMixCredits: number
  renderSupportCredits: number
  totalCredits: number
  availableCredits: number
}

export type MusicChatData = {
  context: MusicContextView
  cueSheet: MusicCueSheetRecord
  cueCards: MusicCueSheetItemRecord[]
  promptPlan: LyriaPromptPlanRecord
  promptCue: MusicCueSheetItemRecord
  qaPassResult: ReturnType<typeof runMockLakeComoMusicQAFlow>['scenarioResults'][number]
  qaFailResult: ReturnType<typeof runMockLakeComoMusicQAFlow>['scenarioResults'][number]
  creditEstimate: MusicCreditEstimateView
  progressSteps: string[]
}

export function formatMusicLabel(value?: string) {
  return value ? value.replaceAll('_', ' ') : 'not set'
}

function durationLabel(cue: MusicCueSheetItemRecord) {
  if (!cue.timeRange) return 'Style-timed'
  return `${Math.max(0, cue.timeRange.endSeconds - cue.timeRange.startSeconds)}s`
}

export function getCueDurationLabel(cue: MusicCueSheetItemRecord) {
  return durationLabel(cue)
}

export function createMusicChatUiData(): MusicChatData {
  const referenceFlow = runMockLakeComoReferenceDNAFlow()
  const cueFlow = runMockReferenceToMusicCueFlow(referenceFlow.referenceMusicDNA)
  const qaFlow = runMockLakeComoMusicQAFlow()
  const cueSheet = cueFlow.cueSheet
  const cueCards = cueSheet.items.slice(0, 5)
  const qaPassResult = qaFlow.scenarioResults.find((result) => result.qaReport.status === 'passed') ?? qaFlow.scenarioResults[0]
  const qaFailResult = qaFlow.scenarioResults.find((result) =>
    result.qaIssues.some((issue) => issue.category === 'lyrics_policy'),
  ) ?? qaFlow.scenarioResults[0]
  const generatedCueCount = cueCards.length
  const planningCredits = 2
  const generationCredits = generatedCueCount * 8
  const qaMixCredits = generatedCueCount * 2
  const renderSupportCredits = 2

  return {
    context: {
      primarySceneType: 'Lifestyle / vacation',
      videoTopic: 'Luxury travel story with dialogue, montage, food/social moments, and outro',
      settingSummary: 'European luxury / Lake Como-style travel context',
      cultureContext: 'Broad premium European lifestyle mood only; no copied songs or stereotypes',
      musicNeeded: true,
      cueCountDecision: `${generatedCueCount} cue multi-cue plan`,
      speechPresence: 'Dialogue appears in story sections',
      dialogueHeavy: true,
      montageDetected: true,
      ambienceImportant: true,
      userMusicInstructions: "Generate music that fits the Lake Como vibe, but don't copy the reference.",
      avoidMusicInstructions: 'No copied music, no lyrics under dialogue, no exact reference timing.',
      confidence: 92,
    },
    cueSheet,
    cueCards,
    promptPlan: cueFlow.lyriaPromptPlans[0],
    promptCue: cueSheet.items[0],
    qaPassResult,
    qaFailResult,
    creditEstimate: {
      cueCount: cueSheet.items.length,
      generatedCueCount,
      planningCredits,
      generationCredits,
      qaMixCredits,
      renderSupportCredits,
      totalCredits: planningCredits + generationCredits + qaMixCredits + renderSupportCredits,
      availableCredits: 100,
    },
    progressSteps: [
      'Reading music cue sheet',
      'Preparing Lyria Pro prompt',
      'Waiting for credit approval',
      'Generating music cue placeholder',
      'Analyzing generated track',
      'Checking lyrics and speech safety',
      'Building mix/ducking plan',
      'Preparing music for preview',
    ],
  }
}
