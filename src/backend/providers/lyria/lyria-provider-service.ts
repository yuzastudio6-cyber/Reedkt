import type {
  GeneratedAssetRecord,
  GeneratedMusicTrackRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
} from '../../../types'
import { analyzeGeneratedMusicTrack } from '../../services/music-track-analysis-service'
import { createMusicMixPlan } from '../../services/music-mix-planning-service'
import { createMusicQAReport } from '../../services/music-qa-service'
import { createMockId, nowIso } from '../../mock/mock-database'
import { generateLyriaMusic } from './lyria-client-adapter'
import type {
  LyriaGenerateMusicRequest,
  LyriaGenerateMusicResponse,
  LyriaProviderGenerationPlan,
  LyriaProviderMockGenerationResult,
  LyriaSafetyGateInput,
} from './lyria-provider-contracts'
import { buildLyriaGenerateMusicRequestFromPromptPlan } from './lyria-request-builder'
import { createLyriaResponseSummary } from './lyria-response-parser'
import { assertLyriaGenerationAllowed } from './lyria-safety-gates'

function durationFromResponse(response: LyriaGenerateMusicResponse, request: LyriaGenerateMusicRequest) {
  const metadataDuration = typeof request.metadata?.durationSeconds === 'number'
    ? request.metadata.durationSeconds
    : undefined
  return request.durationSeconds ?? metadataDuration ?? (response.model === 'lyria-3-clip-preview' ? 30 : 60)
}

function vocalHint(promptPlan: LyriaPromptPlanRecord): GeneratedMusicTrackRecord['vocalHint'] {
  if (promptPlan.vocalPolicy === 'lyrics_allowed_no_speech') return 'vocal_texture'
  if (promptPlan.vocalPolicy === 'light_vocal_texture') return 'vocal_texture'
  return 'none'
}

export function createLyriaProviderGenerationPlan(input: LyriaSafetyGateInput & {
  promptPlan: LyriaPromptPlanRecord
  musicCue: MusicCueSheetItemRecord
}): LyriaProviderGenerationPlan {
  const safetyGate = assertLyriaGenerationAllowed(input)
  const request = buildLyriaGenerateMusicRequestFromPromptPlan({
    promptPlan: input.promptPlan,
    musicCue: input.musicCue,
  })

  return {
    id: createMockId('lyria-provider-plan'),
    request,
    promptPlan: input.promptPlan,
    musicCue: input.musicCue,
    generationRequest: input.generationRequest,
    creditReservation: input.creditReservation,
    safetyGate,
    warnings: safetyGate.warnings,
  }
}

export function convertLyriaResponseToGeneratedMusicTrack(input: {
  response: LyriaGenerateMusicResponse
  request: LyriaGenerateMusicRequest
  promptPlan: LyriaPromptPlanRecord
  musicCue: MusicCueSheetItemRecord
  projectId?: string
  override?: Partial<GeneratedMusicTrackRecord>
}): GeneratedMusicTrackRecord {
  const hasSpeechInScene =
    input.musicCue.sectionType === 'dialogue' ||
    input.musicCue.speechSafety === 'speech_first' ||
    input.musicCue.speechSafety === 'duck_under_voice' ||
    input.musicCue.speechSafety === 'no_music_under_key_dialogue'

  return {
    id: createMockId('generated-music-track'),
    projectId: input.projectId,
    cueSheetItemId: input.musicCue.id,
    promptPlanId: input.promptPlan.id,
    referenceDnaId: input.promptPlan.referenceDnaId,
    title: `Mock Lyria ${input.musicCue.label}`,
    cueRole: input.musicCue.cueRole,
    sectionType: input.musicCue.sectionType,
    durationSeconds: durationFromResponse(input.response, input.request),
    provenance: 'mock_generated',
    reuseStatus: 'project_only',
    vocalHint: vocalHint(input.promptPlan),
    lyricLanguageHint: input.promptPlan.vocalPolicy === 'lyrics_allowed_no_speech' ? 'texture_only' : undefined,
    energyHint: input.musicCue.energyLevel,
    moodHint: input.musicCue.mood,
    genreHints: input.musicCue.genreHints,
    instrumentHints: input.musicCue.genreHints.map((genre) => genre.replaceAll('_', ' ')),
    bassIntensity: hasSpeechInScene ? 'low' : 'medium',
    artifactHint: 'none',
    loopHint: input.musicCue.sectionType === 'outro' ? 'not_loopable' : 'clean',
    endingHint: input.musicCue.sectionType === 'outro' ? 'fade_needed' : 'clean_resolve',
    hasSpeechInScene,
    userInstructionTags: [
      'lyria_provider_adapter',
      'style_dna_only',
      ...(input.musicCue.ambienceNotes.some((note) => /ambience|natural/i.test(note)) ? ['preserve_ambience'] : []),
    ],
    createdAt: nowIso(),
    ...input.override,
  }
}

export function convertLyriaResponseToGeneratedAsset(input: {
  response: LyriaGenerateMusicResponse
  request: LyriaGenerateMusicRequest
  generatedMusicTrack: GeneratedMusicTrackRecord
  projectId: string
  workspaceId?: string
  generationRequestId?: string
  jobId?: string
}): GeneratedAssetRecord {
  const format = input.request.outputMimeType === 'audio/mp3' || input.request.outputMimeType === 'audio/mpeg'
    ? 'mp3'
    : 'wav'
  const storagePath = `mock://generated-audio/${input.projectId}/${input.generatedMusicTrack.id}.${format}`

  return {
    id: createMockId('generated-asset'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    generationRequestId: input.generationRequestId,
    jobId: input.jobId,
    assetType: 'music',
    assetStatus: 'ready',
    assetFormat: format,
    qualityLevel: 'preview',
    signatureSystem: 'none',
    status: 'ready',
    fileName: `${input.generatedMusicTrack.id}.${format}`,
    displayName: input.generatedMusicTrack.title,
    storageProvider: 'local_mock',
    storagePath,
    publicUrl: storagePath,
    durationSeconds: input.generatedMusicTrack.durationSeconds,
    transparentBackground: false,
    wordLevelTiming: false,
    usableForRender: true,
    qualityNotes: [
      'Provider adapter output is mock-only; no real audio file exists.',
      'Generated music must pass Music QA before render/export use.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      provider: input.response.provider,
      model: input.response.model,
      responseSummary: createLyriaResponseSummary(input.response),
    },
  }
}

export function createLyriaProviderEventSummary(response: LyriaGenerateMusicResponse) {
  return `Lyria provider adapter returned ${createLyriaResponseSummary(response)}.`
}

export function runLyriaProviderGenerationMock(input: LyriaSafetyGateInput & {
  promptPlan: LyriaPromptPlanRecord
  musicCue: MusicCueSheetItemRecord
  projectId: string
  workspaceId?: string
  generatedTrackOverride?: Partial<GeneratedMusicTrackRecord>
}): LyriaProviderMockGenerationResult {
  const plan = createLyriaProviderGenerationPlan(input)

  if (!plan.safetyGate.ok) {
    return {
      providerResult: {
        ok: false,
        error: {
          code: plan.safetyGate.code ?? 'LYRIA_SAFETY_GATE_FAILED',
          message: plan.safetyGate.message,
        },
        warnings: plan.safetyGate.warnings,
      },
      warnings: plan.safetyGate.warnings,
    }
  }

  const providerResult = generateLyriaMusic(plan.request, { mode: input.mode ?? 'mock' })

  if (!providerResult.ok || !providerResult.response) {
    return {
      providerResult,
      warnings: providerResult.warnings ?? [],
    }
  }

  const generatedMusicTrack = convertLyriaResponseToGeneratedMusicTrack({
    response: providerResult.response,
    request: plan.request,
    promptPlan: input.promptPlan,
    musicCue: input.musicCue,
    projectId: input.projectId,
    override: input.generatedTrackOverride,
  })
  const generatedAsset = convertLyriaResponseToGeneratedAsset({
    response: providerResult.response,
    request: plan.request,
    generatedMusicTrack,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    generationRequestId: input.generationRequest?.id,
  })
  const trackAnalysis = analyzeGeneratedMusicTrack({ track: generatedMusicTrack })
  const qaReport = createMusicQAReport({
    track: generatedMusicTrack,
    analysis: trackAnalysis,
    cue: input.musicCue,
    userInstructions: 'Use reference style DNA only; do not copy music.',
  })
  const mixPlan = createMusicMixPlan({
    track: generatedMusicTrack,
    analysis: trackAnalysis,
    qaReport,
    cue: input.musicCue,
  })

  return {
    providerResult,
    generatedMusicTrack,
    generatedAsset,
    trackAnalysis,
    qaReport,
    mixPlan,
    warnings: providerResult.warnings ?? [],
  }
}
