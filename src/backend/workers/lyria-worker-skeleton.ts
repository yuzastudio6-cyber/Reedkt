import type {
  GeneratedAssetRecord,
  GeneratedMusicTrackRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
} from '../../types'
import { analyzeGeneratedMusicTrack } from '../services/music-track-analysis-service'
import { createMusicQAReport } from '../services/music-qa-service'
import { createMusicMixPlan } from '../services/music-mix-planning-service'
import { evaluateMusicLibraryCandidate } from '../services/music-library-candidate-service'
import {
  buildLyriaGenerateMusicRequest,
  buildLyriaGenerateMusicRequestFromPromptPlan,
  generateLyriaMusic,
} from '../providers/lyria'
import { createMockId, nowIso } from '../mock/mock-database'
import type {
  LyriaWorkerContext,
  LyriaWorkerInput,
  LyriaWorkerLoadedRecords,
  LyriaWorkerMockRecordBundle,
  LyriaWorkerOutput,
  LyriaWorkerRunResult,
  MockLyriaProviderResponse,
} from './lyria-worker-contracts'
import {
  createLyriaWorkerBlockedEvent,
  createLyriaWorkerCompletedEvent,
  createLyriaWorkerFailedEvent,
  createLyriaWorkerProgressEvent,
  createLyriaWorkerStartedEvent,
} from './lyria-worker-events'
import {
  createMockAudioDuration,
  createMockAudioStoragePath,
  createMockMusicWaveformSummary,
} from './lyria-worker-mock-runtime'
import { validateLyriaGenerationGate } from './lyria-worker-validation'

export function prepareLyriaWorkerContext(
  overrides: Partial<LyriaWorkerContext> = {},
): LyriaWorkerContext {
  return {
    provider: 'Lyria Pro',
    modelName: 'lyria-3-pro-preview',
    runtime: 'mock',
    region: 'us-central1',
    secretReferenceName: 'GOOGLE_SECRET_LYRIA_API_KEY_NAME',
    outputBucket: 'mock-reeditpro-audio-output',
    outputPathPrefix: 'generated-audio',
    ...overrides,
  }
}

export function loadLyriaWorkerMockRecords(
  input: LyriaWorkerInput,
  records: LyriaWorkerMockRecordBundle,
): LyriaWorkerLoadedRecords | undefined {
  if (
    !records.promptPlan ||
    !records.musicCue ||
    !records.generationRequest ||
    !records.creditReservation
  ) {
    return undefined
  }

  return {
    ...records,
    promptPlan: records.promptPlan,
    musicCue: records.musicCue,
    generationRequest: records.generationRequest,
    creditReservation: records.creditReservation,
    job: records.job ?? {
      id: input.jobId,
      jobBatchId: input.jobBatchId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      creditReservationId: input.creditReservationId,
      jobType: 'soundsync_generation',
      status: 'queued',
      priority: 'normal',
      workerTarget: 'soundsync_worker',
      runtimeType: 'cloud_run_job',
      jobName: 'Mock Lyria Pro generation job',
      jobDescription: 'Future Cloud Run worker placeholder. No real Lyria call is made.',
      dependsOnAll: true,
      inputPayload: { mockOnly: true },
      outputPayload: {},
      errorPayload: {},
      failureCategory: 'none',
      attemptCount: 0,
      maxAttempts: 1,
      progressPercent: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    },
  }
}

function trackTitleForCue(cue: MusicCueSheetItemRecord) {
  if (cue.sectionType === 'dialogue') return 'Mock Lyria dialogue bed'
  if (cue.sectionType === 'movement' || cue.sectionType === 'montage') return 'Mock Lyria movement montage cue'
  if (cue.sectionType === 'outro') return 'Mock Lyria outro resolve'
  return `Mock Lyria ${cue.label}`
}

function vocalHintForPrompt(promptPlan: LyriaPromptPlanRecord): GeneratedMusicTrackRecord['vocalHint'] {
  if (promptPlan.vocalPolicy === 'lyrics_allowed_no_speech') return 'vocal_texture'
  if (promptPlan.vocalPolicy === 'light_vocal_texture') return 'vocal_texture'
  return 'none'
}

export function createGeneratedMusicTrackFromWorker(input: {
  workerInput: LyriaWorkerInput
  cue: MusicCueSheetItemRecord
  promptPlan: LyriaPromptPlanRecord
  providerResponse: MockLyriaProviderResponse
  referenceDnaId?: string
  override?: Partial<GeneratedMusicTrackRecord>
}): GeneratedMusicTrackRecord {
  const { cue, promptPlan, providerResponse, workerInput } = input
  const hasSpeechInScene =
    cue.sectionType === 'dialogue' ||
    cue.speechSafety === 'speech_first' ||
    cue.speechSafety === 'duck_under_voice' ||
    cue.speechSafety === 'no_music_under_key_dialogue'

  return {
    id: createMockId('generated-music-track'),
    projectId: workerInput.projectId,
    cueSheetItemId: cue.id,
    promptPlanId: promptPlan.id,
    referenceDnaId: input.referenceDnaId ?? promptPlan.referenceDnaId,
    title: trackTitleForCue(cue),
    cueRole: cue.cueRole,
    sectionType: cue.sectionType,
    durationSeconds: providerResponse.durationSeconds,
    provenance: 'mock_generated',
    reuseStatus: 'project_only',
    vocalHint: vocalHintForPrompt(promptPlan),
    lyricLanguageHint: promptPlan.vocalPolicy === 'lyrics_allowed_no_speech' ? 'texture_only' : undefined,
    energyHint: cue.energyLevel,
    moodHint: cue.mood,
    genreHints: cue.genreHints,
    instrumentHints: cue.genreHints.map((genre) => genre.replaceAll('_', ' ')),
    bassIntensity: hasSpeechInScene ? 'low' : 'medium',
    artifactHint: 'none',
    loopHint: cue.sectionType === 'outro' ? 'not_loopable' : 'clean',
    endingHint: cue.sectionType === 'outro' ? 'fade_needed' : 'clean_resolve',
    hasSpeechInScene,
    userInstructionTags: [
      'lyria_worker_mock',
      'style_dna_only',
      ...(cue.ambienceNotes.some((note) => /ambience|natural/i.test(note)) ? ['preserve_ambience'] : []),
    ],
    createdAt: nowIso(),
    ...input.override,
  }
}

export function createGeneratedAssetFromWorker(input: {
  workerInput: LyriaWorkerInput
  providerResponse: MockLyriaProviderResponse
  generatedMusicTrack: GeneratedMusicTrackRecord
}): GeneratedAssetRecord {
  const { generatedMusicTrack, providerResponse, workerInput } = input

  return {
    id: createMockId('generated-asset'),
    workspaceId: workerInput.workspaceId,
    projectId: workerInput.projectId,
    generationRequestId: workerInput.generationRequestId,
    jobId: workerInput.jobId,
    assetType: 'music',
    assetStatus: 'ready',
    assetFormat: 'wav',
    qualityLevel: 'preview',
    signatureSystem: 'none',
    status: 'ready',
    fileName: `${generatedMusicTrack.id}.wav`,
    displayName: generatedMusicTrack.title,
    storageProvider: 'local_mock',
    storagePath: providerResponse.mockStoragePath,
    publicUrl: providerResponse.mockStoragePath,
    durationSeconds: providerResponse.durationSeconds,
    transparentBackground: false,
    wordLevelTiming: false,
    usableForRender: true,
    qualityNotes: [
      'Mock generated music asset; no real audio file exists.',
      'Must pass Music QA and mix planning before preview use.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      provider: providerResponse.provider,
      model: providerResponse.model,
    },
  }
}

export function createWorkerMusicTrackAnalysis(track: GeneratedMusicTrackRecord) {
  return analyzeGeneratedMusicTrack({ track })
}

export function createWorkerMusicQA(input: {
  track: GeneratedMusicTrackRecord
  analysis: ReturnType<typeof createWorkerMusicTrackAnalysis>
  cue: MusicCueSheetItemRecord
  referenceMusicDNA?: LyriaWorkerLoadedRecords['referenceMusicDNA']
}) {
  return createMusicQAReport({
    track: input.track,
    analysis: input.analysis,
    cue: input.cue,
    referenceMusicDNA: input.referenceMusicDNA,
    userInstructions: 'Use reference style DNA only; do not copy music.',
  })
}

export function createWorkerMusicMixPlan(input: {
  track: GeneratedMusicTrackRecord
  analysis: ReturnType<typeof createWorkerMusicTrackAnalysis>
  qaReport: ReturnType<typeof createWorkerMusicQA>
  cue: MusicCueSheetItemRecord
}) {
  return createMusicMixPlan({
    track: input.track,
    analysis: input.analysis,
    qaReport: input.qaReport,
    cue: input.cue,
  })
}

export function createMockLyriaGenerationResult(input: {
  workerInput: LyriaWorkerInput
  context: LyriaWorkerContext
  cue: MusicCueSheetItemRecord
  promptPlan?: LyriaPromptPlanRecord
}) {
  const request = input.promptPlan
    ? buildLyriaGenerateMusicRequestFromPromptPlan({
        promptPlan: input.promptPlan,
        musicCue: input.cue,
        model: input.context.modelName,
        outputMimeType: 'audio/wav',
      })
    : buildLyriaGenerateMusicRequest({
        prompt: `Create original music for ${input.cue.label}. Use style DNA only and do not copy reference music.`,
        durationSeconds: createMockAudioDuration(input.cue),
        model: input.context.modelName,
        outputMimeType: 'audio/wav',
      })
  const result = generateLyriaMusic(request, { mode: 'mock' })
  const response = result.response

  return {
    provider: 'Lyria Pro' as const,
    model: 'lyria-3-pro-preview' as const,
    mockAudioBytes: null,
    mockStoragePath: createMockAudioStoragePath(input.workerInput.projectId, input.workerInput.musicCueId),
    durationSeconds: request.durationSeconds ?? createMockAudioDuration(input.cue),
    format: 'wav' as const,
    generatedAt: response?.generatedAt ?? nowIso(),
    mockOnly: true as const,
    waveformSummary: [
      ...createMockMusicWaveformSummary(input.cue),
      ...(response?.textParts.slice(0, 1) ?? []),
    ],
  } satisfies MockLyriaProviderResponse
}

function blockedOrFailedOutput(input: {
  workerInput: LyriaWorkerInput
  status: LyriaWorkerOutput['status']
  message: string
  warnings: string[]
}): LyriaWorkerOutput {
  return {
    generationRequestId: input.workerInput.generationRequestId,
    generatedMusicTrackId: '',
    generatedAssetId: '',
    status: input.status,
    message: input.message,
    warnings: input.warnings,
  }
}

export function runLyriaWorkerSkeleton(input: {
  workerInput: LyriaWorkerInput
  context?: Partial<LyriaWorkerContext>
  records: LyriaWorkerMockRecordBundle
}): LyriaWorkerRunResult {
  const context = prepareLyriaWorkerContext(input.context)
  const events = [createLyriaWorkerStartedEvent(input.workerInput)]
  const gate = validateLyriaGenerationGate(input.workerInput, input.records)

  if (!gate.ok) {
    const status: LyriaWorkerOutput['status'] =
      gate.failure.code === 'CREDITS_NOT_RESERVED' ||
      gate.failure.code === 'MISSING_CREDIT_RESERVATION' ||
      gate.failure.code === 'PROMPT_VALIDATION_FAILED'
        ? 'blocked'
        : 'failed'
    const event = status === 'blocked'
      ? createLyriaWorkerBlockedEvent(input.workerInput, gate.failure)
      : createLyriaWorkerFailedEvent(input.workerInput, gate.failure)

    return {
      output: blockedOrFailedOutput({
        workerInput: input.workerInput,
        status,
        message: gate.failure.message,
        warnings: gate.warnings,
      }),
      events: [...events, event],
      failure: gate.failure,
    }
  }

  const records = loadLyriaWorkerMockRecords(input.workerInput, input.records)

  if (!records) {
    const failure = {
      code: 'UNKNOWN_ERROR' as const,
      message: 'Generation not allowed: worker mock records could not be loaded.',
    }

    return {
      output: blockedOrFailedOutput({
        workerInput: input.workerInput,
        status: 'failed',
        message: failure.message,
        warnings: gate.warnings,
      }),
      events: [...events, createLyriaWorkerFailedEvent(input.workerInput, failure)],
      failure,
    }
  }

  events.push(
    createLyriaWorkerProgressEvent(input.workerInput, 'Loading Lyria prompt plan.', 15),
    createLyriaWorkerProgressEvent(input.workerInput, 'Checking credit reservation.', 25),
    createLyriaWorkerProgressEvent(input.workerInput, 'Preparing mock Lyria request.', 35, {
      provider: context.provider,
      model: context.modelName,
    }),
  )

  const providerResponse = createMockLyriaGenerationResult({
    workerInput: input.workerInput,
    context,
    cue: records.musicCue,
    promptPlan: records.promptPlan,
  })

  events.push(
    createLyriaWorkerProgressEvent(input.workerInput, 'Simulating Lyria Pro generation.', 50),
  )

  const generatedMusicTrack = createGeneratedMusicTrackFromWorker({
    workerInput: input.workerInput,
    cue: records.musicCue,
    promptPlan: records.promptPlan,
    providerResponse,
    referenceDnaId: records.referenceMusicDNA?.id,
    override: records.generatedTrackOverride,
  })
  const generatedAsset = createGeneratedAssetFromWorker({
    workerInput: input.workerInput,
    providerResponse,
    generatedMusicTrack,
  })

  events.push(
    createLyriaWorkerProgressEvent(input.workerInput, 'Creating generated music track and project asset.', 65),
  )

  const trackAnalysis = createWorkerMusicTrackAnalysis(generatedMusicTrack)
  const qaReport = createWorkerMusicQA({
    track: generatedMusicTrack,
    analysis: trackAnalysis,
    cue: records.musicCue,
    referenceMusicDNA: records.referenceMusicDNA,
  })
  const mixPlan = createWorkerMusicMixPlan({
    track: generatedMusicTrack,
    analysis: trackAnalysis,
    qaReport,
    cue: records.musicCue,
  })
  const libraryCandidate = evaluateMusicLibraryCandidate({
    track: generatedMusicTrack,
    analysis: trackAnalysis,
    qaReport,
  })

  events.push(
    createLyriaWorkerProgressEvent(input.workerInput, 'Running music QA.', 80),
    createLyriaWorkerProgressEvent(input.workerInput, 'Preparing mix plan.', 92),
  )

  if (qaReport.status === 'failed') {
    const failure = {
      code: 'UNKNOWN_ERROR' as const,
      message: 'Mock Lyria generation completed, but Music QA failed before preview use.',
      details: { recommendedAction: qaReport.recommendedAction },
    }

    return {
      output: {
        generationRequestId: input.workerInput.generationRequestId,
        generatedMusicTrackId: generatedMusicTrack.id,
        generatedAssetId: generatedAsset.id,
        musicTrackAnalysisId: trackAnalysis.id,
        musicQAReportId: qaReport.id,
        musicMixPlanId: mixPlan.id,
        status: 'failed',
        message: failure.message,
        warnings: [...gate.warnings, ...trackAnalysis.warnings, qaReport.summary],
      },
      events: [...events, createLyriaWorkerFailedEvent(input.workerInput, failure)],
      generatedMusicTrack,
      generatedAsset,
      trackAnalysis,
      qaReport,
      mixPlan,
      libraryCandidate,
      providerResponse,
      failure,
    }
  }

  return {
    output: {
      generationRequestId: input.workerInput.generationRequestId,
      generatedMusicTrackId: generatedMusicTrack.id,
      generatedAssetId: generatedAsset.id,
      musicTrackAnalysisId: trackAnalysis.id,
      musicQAReportId: qaReport.id,
      musicMixPlanId: mixPlan.id,
      status: 'mock_generated',
      message: 'Mock Lyria Pro worker created a project music asset and completed QA/mix planning.',
      warnings: [...gate.warnings, ...trackAnalysis.warnings],
    },
    events: [...events, createLyriaWorkerCompletedEvent(input.workerInput)],
    generatedMusicTrack,
    generatedAsset,
    trackAnalysis,
    qaReport,
    mixPlan,
    libraryCandidate,
    providerResponse,
  }
}
