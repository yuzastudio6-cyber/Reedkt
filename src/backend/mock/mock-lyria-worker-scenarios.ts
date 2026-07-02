import type {
  CreditReservationRecord,
  GenerationRequestRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
  MusicQAStatus,
} from '../../types'
import type {
  LyriaWorkerInput,
  LyriaWorkerMockRecordBundle,
  LyriaWorkerOutput,
} from '../workers/lyria-worker-contracts'
import { mockMusicQAScenarios } from './mock-music-qa-scenarios'

const createdAt = '2026-05-17T00:00:00.000Z'
const workspaceId = 'mock-workspace-reeditpro'
const projectId = 'mock-lyria-worker-project'
const editPlanId = 'mock-approved-edit-plan'

export interface MockLyriaWorkerScenario {
  id: string
  label: string
  workerInput: LyriaWorkerInput
  records: LyriaWorkerMockRecordBundle
  promptPlanSummary: string
  musicCueSummary: string
  creditState: 'reserved' | 'missing' | 'not_reserved'
  expectedWorkerResult: LyriaWorkerOutput['status']
  expectedQAResult: MusicQAStatus | 'not_run'
  expectedNextStep:
    | 'use_in_preview'
    | 'reserve_credits'
    | 'fix_prompt'
    | 'regenerate'
    | 'terms_review'
}

function cueByScenarioId(id: string) {
  const scenario = mockMusicQAScenarios.find((item) => item.id === id)

  if (!scenario) {
    throw new Error(`Missing mock music QA scenario: ${id}`)
  }

  return scenario.cue
}

function workerInput(id: string, cue: MusicCueSheetItemRecord): LyriaWorkerInput {
  return {
    jobId: `${id}-job`,
    jobBatchId: `${id}-batch`,
    workspaceId,
    projectId,
    editPlanId,
    musicCueId: cue.id,
    musicCueSheetId: cue.cueSheetId,
    lyriaPromptPlanId: `${id}-prompt-plan`,
    generationRequestId: `${id}-generation-request`,
    creditReservationId: `${id}-credit-reservation`,
    requestedByUserId: 'mock-user',
    mockOnly: true,
  }
}

function promptPlan(
  id: string,
  cue: MusicCueSheetItemRecord,
  overrides: Partial<LyriaPromptPlanRecord> = {},
): LyriaPromptPlanRecord {
  return {
    id: `${id}-prompt-plan`,
    cueSheetItemId: cue.id,
    referenceDnaId: 'mock-lake-como-reference-dna',
    promptTitle: `Mock Lyria Pro prompt for ${cue.label}`,
    prompt: `Create original ${cue.mood.replaceAll('_', ' ')} music for ${cue.label}. Use style DNA only; do not copy reference music.`,
    negativePrompt: 'Do not copy any existing song, artist, melody, lyrics, track title, exact cue timing, or copyrighted sound effect.',
    styleDnaOnly: true,
    blockedReferenceContent: [
      'track names',
      'melodies',
      'lyrics',
      'artist names',
      'exact cue timing',
      'copyrighted SFX',
    ],
    adaptationRules: cue.adaptationNotes,
    speechSafety: cue.speechSafety,
    vocalPolicy: cue.vocalPolicy,
    createdAt,
    ...overrides,
  }
}

function generationRequest(
  id: string,
  cue: MusicCueSheetItemRecord,
  overrides: Partial<GenerationRequestRecord> = {},
): GenerationRequestRecord {
  return {
    id: `${id}-generation-request`,
    workspaceId,
    projectId,
    editPlanId,
    creditEstimateId: `${id}-credit-estimate`,
    creditReservationId: `${id}-credit-reservation`,
    requestType: 'music_asset',
    providerType: 'google_cloud_worker',
    modelName: 'lyria-3-pro-preview',
    signatureSystem: 'none',
    generationType: 'music_asset',
    inputAssetIds: [],
    outputAssetType: 'generated_audio',
    transparentBackgroundRequired: false,
    wordLevelTimingRequired: false,
    durationSeconds: cue.timeRange
      ? cue.timeRange.endSeconds - cue.timeRange.startSeconds
      : 60,
    resolution: 'audio-only',
    prompt: `Mock Lyria generation request for ${cue.label}.`,
    negativePrompt: 'No copied music, melodies, lyrics, artists, or exact reference timing.',
    styleConstraints: {
      styleDnaOnly: true,
      noRealProviderCall: true,
    },
    timingConstraints: {
      exactReferenceTimingCopied: false,
      approximateCueRoleOnly: true,
    },
    outputRequirements: {
      assetType: 'music',
      format: 'wav',
      projectAsset: true,
      qaRequiredBeforeUse: true,
    },
    status: 'queued',
    qualityLevel: 'preview',
    creditEstimate: 18,
    estimatedCredits: 18,
    failureCategory: 'none',
    idempotencyKey: `${id}-lyria-worker-mock`,
    workerNotes: [
      'Mock Lyria worker request only.',
      'Future Google Cloud worker must enforce credit reservation before generation.',
    ],
    providerRequestSummary: {
      provider: 'Lyria Pro',
      model: 'lyria-3-pro-preview',
      runtime: 'future Google Cloud worker',
    },
    requestPayload: {
      mockOnly: true,
      cueId: cue.id,
      promptPlanId: `${id}-prompt-plan`,
    },
    queuedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
    ...overrides,
  }
}

function creditReservation(
  id: string,
  status: CreditReservationRecord['status'] = 'reserved',
): CreditReservationRecord {
  return {
    id: `${id}-credit-reservation`,
    creditWalletId: `${id}-credit-wallet`,
    workspaceId,
    projectId,
    creditEstimateId: `${id}-credit-estimate`,
    creditApprovalId: `${id}-credit-approval`,
    editPlanId,
    status,
    reservedCredits: status === 'reserved' ? 18 : 0,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: 'Mock music generation credit reservation.',
    idempotencyKey: `${id}-reservation`,
    reservedAt: status === 'reserved' ? createdAt : undefined,
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function recordsFor(
  id: string,
  cue: MusicCueSheetItemRecord,
  options: {
    includePrompt?: boolean
    includeReservation?: boolean
    reservationStatus?: CreditReservationRecord['status']
    promptOverrides?: Partial<LyriaPromptPlanRecord>
    requestOverrides?: Partial<GenerationRequestRecord>
    generatedTrackOverride?: LyriaWorkerMockRecordBundle['generatedTrackOverride']
  } = {},
): LyriaWorkerMockRecordBundle {
  return {
    promptPlan: options.includePrompt === false
      ? undefined
      : promptPlan(id, cue, options.promptOverrides),
    musicCue: cue,
    generationRequest: generationRequest(id, cue, options.requestOverrides),
    creditReservation: options.includeReservation === false
      ? undefined
      : creditReservation(id, options.reservationStatus),
    generatedTrackOverride: options.generatedTrackOverride,
  }
}

function scenario(input: Omit<MockLyriaWorkerScenario, 'workerInput'> & {
  cue: MusicCueSheetItemRecord
}): MockLyriaWorkerScenario {
  return {
    ...input,
    workerInput: workerInput(input.id, input.cue),
  }
}

const dialogueCue = cueByScenarioId('dialogue-bed-no-vocals-pass')
const dialogueLyricsCue = cueByScenarioId('dialogue-bed-with-lyrics-fail')
const montageCue = cueByScenarioId('lake-como-montage-vocal-texture-pass')
const outroCue = cueByScenarioId('outro-abrupt-ending-adjust')
const libraryCue = cueByScenarioId('library-candidate-terms-review')

export const mockLyriaWorkerScenarios: MockLyriaWorkerScenario[] = [
  scenario({
    id: 'dialogue-bed-approved-generated',
    label: 'Dialogue bed approved and generated mock successfully',
    cue: dialogueCue,
    records: recordsFor('dialogue-bed-approved-generated', dialogueCue),
    promptPlanSummary: 'Instrumental-only Lyria prompt for a voice-first dialogue bed.',
    musicCueSummary: 'Dialogue bed, low energy, duck-under-voice policy.',
    creditState: 'reserved',
    expectedWorkerResult: 'mock_generated',
    expectedQAResult: 'passed',
    expectedNextStep: 'use_in_preview',
  }),
  scenario({
    id: 'montage-vocals-allowed-no-speech',
    label: 'Montage cue with vocals allowed in no-speech section',
    cue: montageCue,
    records: recordsFor('montage-vocals-allowed-no-speech', montageCue),
    promptPlanSummary: 'Light vocal texture allowed only in no-speech movement montage.',
    musicCueSummary: 'Lake Como movement montage, medium-high energy, no dialogue.',
    creditState: 'reserved',
    expectedWorkerResult: 'mock_generated',
    expectedQAResult: 'passed',
    expectedNextStep: 'use_in_preview',
  }),
  scenario({
    id: 'credits-missing-worker-blocked',
    label: 'Credits missing, worker blocked',
    cue: dialogueCue,
    records: recordsFor('credits-missing-worker-blocked', dialogueCue, {
      includeReservation: false,
    }),
    promptPlanSummary: 'Prompt exists, but credits are not reserved.',
    musicCueSummary: 'Dialogue bed cannot generate without reserved credits.',
    creditState: 'missing',
    expectedWorkerResult: 'blocked',
    expectedQAResult: 'not_run',
    expectedNextStep: 'reserve_credits',
  }),
  scenario({
    id: 'prompt-missing-worker-failed',
    label: 'Prompt missing, worker failed',
    cue: dialogueCue,
    records: recordsFor('prompt-missing-worker-failed', dialogueCue, {
      includePrompt: false,
    }),
    promptPlanSummary: 'Prompt plan is absent.',
    musicCueSummary: 'Cue exists, but worker cannot run without prompt plan.',
    creditState: 'reserved',
    expectedWorkerResult: 'failed',
    expectedQAResult: 'not_run',
    expectedNextStep: 'fix_prompt',
  }),
  scenario({
    id: 'prompt-lyrics-under-speech-blocked',
    label: 'Lyria prompt has lyrics under speech, validation warning/block',
    cue: dialogueLyricsCue,
    records: recordsFor('prompt-lyrics-under-speech-blocked', dialogueLyricsCue, {
      promptOverrides: {
        vocalPolicy: 'lyrics_allowed_no_speech',
      },
    }),
    promptPlanSummary: 'Prompt incorrectly allows lyrics for a speech-safe cue.',
    musicCueSummary: 'Dialogue cue requires instrumental or voice-first music.',
    creditState: 'reserved',
    expectedWorkerResult: 'blocked',
    expectedQAResult: 'not_run',
    expectedNextStep: 'fix_prompt',
  }),
  scenario({
    id: 'generated-track-qa-unwanted-vocals',
    label: 'Generated track QA fails due to unwanted vocals',
    cue: dialogueLyricsCue,
    records: recordsFor('generated-track-qa-unwanted-vocals', dialogueLyricsCue, {
      promptOverrides: {
        vocalPolicy: 'instrumental_only',
      },
      generatedTrackOverride: {
        title: 'Mock generated dialogue cue with unwanted lyrics',
        vocalHint: 'lyrics',
        lyricLanguageHint: 'english',
        hasSpeechInScene: true,
      },
    }),
    promptPlanSummary: 'Prompt asks for instrumental, but generated mock output contains lyrics.',
    musicCueSummary: 'Dialogue cue should fail QA if vocals appear.',
    creditState: 'reserved',
    expectedWorkerResult: 'failed',
    expectedQAResult: 'failed',
    expectedNextStep: 'regenerate',
  }),
  scenario({
    id: 'generated-project-asset-success',
    label: 'Generated track passes QA and becomes project asset',
    cue: outroCue,
    records: recordsFor('generated-project-asset-success', outroCue),
    promptPlanSummary: 'Outro resolve prompt with clean fade-ready ending.',
    musicCueSummary: 'Project-only generated music asset for outro preview.',
    creditState: 'reserved',
    expectedWorkerResult: 'mock_generated',
    expectedQAResult: 'warning',
    expectedNextStep: 'use_in_preview',
  }),
  scenario({
    id: 'library-candidate-terms-review',
    label: 'Generated track becomes library candidate after QA/terms review required',
    cue: libraryCue,
    records: recordsFor('library-candidate-terms-review', libraryCue, {
      generatedTrackOverride: {
        reuseStatus: 'terms_review_required',
        provenance: 'mock_generated',
        title: 'Mock reusable polished instrumental bed',
      },
    }),
    promptPlanSummary: 'Broad reusable instrumental prompt with no copied reference material.',
    musicCueSummary: 'High-quality brand bed can be reviewed for future library reuse.',
    creditState: 'reserved',
    expectedWorkerResult: 'mock_generated',
    expectedQAResult: 'passed',
    expectedNextStep: 'terms_review',
  }),
]

export function getMockLyriaWorkerScenarioById(id: string) {
  return mockLyriaWorkerScenarios.find((item) => item.id === id)
}

export function getDefaultMockLyriaWorkerScenario() {
  return mockLyriaWorkerScenarios[0]
}

export function getLakeComoLyriaWorkerScenarios() {
  return mockLyriaWorkerScenarios.filter((item) =>
    ['dialogue-bed-approved-generated', 'montage-vocals-allowed-no-speech', 'generated-project-asset-success'].includes(item.id),
  )
}
