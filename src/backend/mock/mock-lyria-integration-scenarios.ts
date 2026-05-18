import type {
  CreditReservationRecord,
  GenerationRequestRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
} from '../../types'
import type {
  LyriaIntegrationMode,
  LyriaOutputMimeType,
} from '../providers/lyria'
import { mockLyriaWorkerScenarios } from './mock-lyria-worker-scenarios'

export interface MockLyriaIntegrationScenario {
  id: string
  label: string
  mode: LyriaIntegrationMode
  promptPlan?: LyriaPromptPlanRecord
  musicCue?: MusicCueSheetItemRecord
  generationRequest?: GenerationRequestRecord
  creditReservation?: CreditReservationRecord
  outputMimeType?: LyriaOutputMimeType
  rawResponseOverride?: unknown
  expectedResult: 'success' | 'blocked' | 'disabled'
  expectedWarning?: string
}

function workerScenario(id: string) {
  const scenario = mockLyriaWorkerScenarios.find((item) => item.id === id)

  if (!scenario) {
    throw new Error(`Missing Lyria worker scenario: ${id}`)
  }

  return scenario.records
}

function scenarioFromWorker(input: {
  id: string
  label: string
  workerScenarioId: string
  mode?: LyriaIntegrationMode
  outputMimeType?: LyriaOutputMimeType
  expectedResult?: MockLyriaIntegrationScenario['expectedResult']
  expectedWarning?: string
  promptOverride?: Partial<LyriaPromptPlanRecord>
  includeReservation?: boolean
  rawResponseOverride?: unknown
}): MockLyriaIntegrationScenario {
  const records = workerScenario(input.workerScenarioId)
  return {
    id: input.id,
    label: input.label,
    mode: input.mode ?? 'mock',
    promptPlan: records.promptPlan
      ? { ...records.promptPlan, ...input.promptOverride }
      : undefined,
    musicCue: records.musicCue,
    generationRequest: records.generationRequest,
    creditReservation: input.includeReservation === false ? undefined : records.creditReservation,
    outputMimeType: input.outputMimeType,
    rawResponseOverride: input.rawResponseOverride,
    expectedResult: input.expectedResult ?? 'success',
    expectedWarning: input.expectedWarning,
  }
}

export const mockLyriaIntegrationScenarios: MockLyriaIntegrationScenario[] = [
  scenarioFromWorker({
    id: 'mock-successful-dialogue-bed',
    label: 'Mock successful dialogue bed',
    workerScenarioId: 'dialogue-bed-approved-generated',
  }),
  scenarioFromWorker({
    id: 'mock-successful-montage-cue',
    label: 'Mock successful montage cue',
    workerScenarioId: 'montage-vocals-allowed-no-speech',
  }),
  scenarioFromWorker({
    id: 'disabled-mode',
    label: 'Disabled mode',
    workerScenarioId: 'dialogue-bed-approved-generated',
    mode: 'disabled',
    expectedResult: 'disabled',
    expectedWarning: 'Lyria integration disabled.',
  }),
  scenarioFromWorker({
    id: 'real-mode-blocked-without-credentials',
    label: 'Real mode blocked without credentials',
    workerScenarioId: 'dialogue-bed-approved-generated',
    mode: 'real',
    expectedResult: 'blocked',
    expectedWarning: 'Real mode blocked because runtime/secrets are missing or real transport is not implemented.',
  }),
  scenarioFromWorker({
    id: 'prompt-validation-fail-lyrics-under-speech',
    label: 'Prompt validation fail for lyrics under speech',
    workerScenarioId: 'dialogue-bed-approved-generated',
    promptOverride: {
      vocalPolicy: 'lyrics_allowed_no_speech',
    },
    expectedResult: 'blocked',
    expectedWarning: 'Lyrics are not allowed for speech-safe cues.',
  }),
  scenarioFromWorker({
    id: 'missing-credit-reservation',
    label: 'Missing credit reservation',
    workerScenarioId: 'dialogue-bed-approved-generated',
    includeReservation: false,
    expectedResult: 'blocked',
    expectedWarning: 'Credit reservation is required.',
  }),
  scenarioFromWorker({
    id: 'reference-copy-risk-blocked',
    label: 'Reference copy risk blocked',
    workerScenarioId: 'dialogue-bed-approved-generated',
    promptOverride: {
      prompt: 'Use the same song and same melody from the reference video.',
    },
    expectedResult: 'blocked',
    expectedWarning: 'Reference copy risk should be blocked.',
  }),
  scenarioFromWorker({
    id: 'lake-como-multi-cue-mock-generation',
    label: 'Lake Como multi-cue mock generation',
    workerScenarioId: 'montage-vocals-allowed-no-speech',
  }),
  scenarioFromWorker({
    id: 'wav-output-requested',
    label: 'WAV output requested',
    workerScenarioId: 'dialogue-bed-approved-generated',
    outputMimeType: 'audio/wav',
  }),
  scenarioFromWorker({
    id: 'parser-text-before-audio',
    label: 'Parser handles text before audio',
    workerScenarioId: 'dialogue-bed-approved-generated',
    rawResponseOverride: {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Structure first, audio second.' },
              { inlineData: { mimeType: 'audio/wav', data: null } },
            ],
          },
        },
      ],
    },
  }),
  scenarioFromWorker({
    id: 'parser-audio-before-text',
    label: 'Parser handles audio before text',
    workerScenarioId: 'dialogue-bed-approved-generated',
    rawResponseOverride: {
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { mimeType: 'audio/wav', data: null } },
              { text: 'Audio first, structure second.' },
            ],
          },
        },
      ],
    },
  }),
  scenarioFromWorker({
    id: 'parser-no-audio-returned',
    label: 'Parser handles no audio returned',
    workerScenarioId: 'dialogue-bed-approved-generated',
    rawResponseOverride: {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Only text returned.' },
            ],
          },
        },
      ],
    },
    expectedResult: 'success',
    expectedWarning: 'No audio part should produce parser warnings.',
  }),
]

export function getMockLyriaIntegrationScenarioById(id: string) {
  return mockLyriaIntegrationScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockLyriaIntegrationScenario() {
  return mockLyriaIntegrationScenarios[0]
}
