import type {
  AdaptiveEditStrategyPlan,
  AudioOperationId,
  AudioOperationPlan,
  AudioPipelinePlan,
  AudioPipelineStage,
  AudioPipelineStatus,
  AudioPipelineToolId,
  AudioQualityIssue,
  BeatSyncPlan,
  BeatSyncStrategy,
  ClipAudioPlan,
  CompiledEditingIntent,
  MusicBedPlan,
  MusicPolicy,
  PlannerInput,
  ProfessionalEditingDirective,
  RendererCompositionPlan,
  SegmentEditPlan,
  SfxIntensity,
  SfxPlan,
  SfxPolicy,
  SoundStyleId,
  SoundSyncCue,
  SoundSyncCueType,
  ToolStrategyPlan,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import {
  getAudioOperationsForStyle,
  getDefaultSoundStyleForCategory,
  getSoundStylePreset,
} from './audio-presets'

type CreateAudioPipelinePlanParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  segmentEditPlans?: SegmentEditPlan[]
  visualAssetPlan?: VisualAssetPlanItem[]
  rendererCompositionPlan?: RendererCompositionPlan
  toolStrategyPlan?: ToolStrategyPlan
}

const operationLabels: Record<AudioOperationId, string> = {
  ambient_bed: 'Ambient bed',
  beat_detection: 'Beat detection',
  bpm_detection: 'BPM detection',
  breath_reduction: 'Breath reduction',
  caption_timing_alignment: 'Caption timing alignment',
  compression: 'Compression',
  de_essing: 'De-essing',
  eq_cleanup: 'EQ cleanup',
  filler_pause_cleanup: 'Filler pause cleanup',
  loudness_normalization: 'Loudness normalization',
  mood_energy_analysis: 'Mood/energy analysis',
  music_bed: 'Music bed',
  music_ducking: 'Music ducking',
  noise_reduction: 'Noise reduction',
  onset_detection: 'Onset detection',
  pitch_adjustment: 'Pitch adjustment',
  qa_clipping_check: 'QA clipping check',
  qa_loudness_check: 'QA loudness check',
  qa_music_over_voice_check: 'QA music over voice check',
  qa_sfx_density_check: 'QA SFX density check',
  riser: 'Riser',
  sfx_hit: 'SFX hit',
  silence_cleanup: 'Silence cleanup',
  tempo_adjustment: 'Tempo adjustment',
  transition_sound: 'Transition sound',
  true_peak_limit: 'True peak limit',
  visual_reveal_timing: 'Visual reveal timing',
  voice_leveling: 'Voice leveling',
  whoosh: 'Whoosh',
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function assetLabel(asset: VisualAssetPlanItem) {
  return asset.beatLabel || asset.storyPurpose || asset.id
}

function assetText(asset: VisualAssetPlanItem) {
  return `${assetLabel(asset)} ${asset.storyPurpose} ${asset.reason}`.toLowerCase()
}

function chooseSoundStyle(params: CreateAudioPipelinePlanParams): SoundStyleId {
  const text = params.input.customInstructions.toLowerCase()

  if (includesAny(text, ['voice only', 'no music', 'clean audio', 'just voice'])) return 'clean_voice_only'
  if (includesAny(text, ['documentary', 'case study', 'scam', 'fraud', 'investigation'])) return 'documentary_serious'
  if (includesAny(text, ['cinematic music', 'cinematic audio', 'emotional music', 'dramatic music'])) return 'cinematic_emotional'
  if (includesAny(text, ['upbeat', 'energetic', 'high retention', 'viral sound'])) {
    return params.input.editLevel === 'basic' ? 'subtle_premium_bed' : 'energetic_social'
  }

  return params.professionalDirective?.soundStyle ??
    params.compiledIntent?.professionalEditingDirective.soundStyle ??
    getDefaultSoundStyleForCategory({
      customInstructions: params.input.customInstructions,
      editLevel: params.input.editLevel,
      editingCategory: params.input.editingCategory,
    })
}

function audioInstructions(input: PlannerInput) {
  const text = input.customInstructions.toLowerCase()

  return {
    highRetention: includesAny(text, ['high retention', 'viral', 'fast paced', 'impact']),
    noMusic: includesAny(text, ['no music', 'voice only', 'just voice']),
    noSfx: includesAny(text, ['no sfx', 'no sound effects', 'no whoosh', 'no whooshes']),
    preservePauses: includesAny(text, ['preserve pauses', 'emotional pause', 'natural pauses', 'not too fast']),
    subtle: includesAny(text, ['subtle', 'not too much', 'minimal', 'natural']),
    wantsSfx: includesAny(text, ['sound effects', 'sfx', 'whoosh', 'impact hit', 'transition sound']),
  }
}

function issueSet(report?: VideoUnderstandingReport) {
  return new Set<AudioQualityIssue>([
    ...(report?.audioUnderstanding.audioIssues ?? []),
    ...(report?.clips.flatMap((clip) => clip.audioQualityIssues) ?? []),
  ])
}

function chooseMusicPlan(input: PlannerInput, soundStyle: SoundStyleId): MusicBedPlan {
  const preset = getSoundStylePreset(soundStyle)
  const instructions = audioInstructions(input)
  const policy: MusicPolicy = instructions.noMusic || soundStyle === 'clean_voice_only'
    ? 'none'
    : input.editLevel === 'basic'
      ? (soundStyle === 'lifestyle_warm' || soundStyle === 'subtle_premium_bed' ? 'optional_subtle' : 'none')
      : preset.musicPolicy
  const duckingEnabled = policy !== 'none'

  return {
    id: `music-bed-${input.editingCategory}-${input.editLevel}`,
    policy,
    soundStyle,
    energy: preset.audioIntensityDefault,
    duckingEnabled,
    duckingStrength: duckingEnabled ? (input.editLevel === 'premium' ? 'medium' : 'light') : 'none',
    introAllowed: policy !== 'none' && !instructions.noMusic,
    outroAllowed: policy !== 'none' && !instructions.noMusic,
    fadeInSeconds: input.editLevel === 'premium' ? 1.2 : 0.8,
    fadeOutSeconds: input.editLevel === 'premium' ? 1.4 : 0.9,
    reason: policy === 'none'
      ? 'Voice-first or no-music direction keeps the edit clean and understandable.'
      : 'Music bed is planned only where it supports pacing and emotion, with voice-first ducking.',
    avoidRules: [
      'Music must not overpower voice.',
      'Do not use music as a substitute for clear editing.',
      ...(instructions.noMusic ? ['User requested no music.'] : []),
    ],
    qaChecks: [
      'Music stays under speech.',
      'Ducking is planned wherever music overlaps voice.',
      'Music policy matches explicit user instructions.',
    ],
  }
}

function chooseSfxPlan(input: PlannerInput, soundStyle: SoundStyleId, visualAssetPlan: VisualAssetPlanItem[] = []): SfxPlan {
  const preset = getSoundStylePreset(soundStyle)
  const instructions = audioInstructions(input)
  const hasMap = visualAssetPlan.some((asset) => assetText(asset).includes('map'))
  const hasChart = visualAssetPlan.some((asset) => /chart|diagram|money|count/i.test(assetText(asset)))
  const policy: SfxPolicy = instructions.noSfx || soundStyle === 'clean_voice_only'
    ? 'none'
    : input.editLevel === 'basic'
      ? 'minimal'
      : instructions.wantsSfx
        ? 'support_key_moments'
        : preset.sfxPolicy
  const intensity: SfxIntensity = policy === 'none'
    ? 'none'
    : input.editLevel === 'basic' || instructions.subtle
      ? 'subtle'
      : policy === 'high_impact'
        ? 'strong'
        : 'balanced'

  return {
    id: `sfx-${input.editingCategory}-${input.editLevel}`,
    policy,
    intensity,
    allowedSfxTypes: policy === 'none'
      ? []
      : unique([
          'transition support',
          'card reveal',
          ...(hasMap ? ['map pin drop'] : []),
          ...(hasChart ? ['count-up tick'] : []),
          ...(policy === 'high_impact' ? ['hook impact'] : []),
        ]),
    maxSfxPerMinute: policy === 'none' ? 0 : input.editLevel === 'basic' ? 2 : input.editLevel === 'pro' ? 5 : 8,
    cues: policy === 'none'
      ? []
      : ['Only on justified reveal, transition, map/chart, or emotional beat moments.'],
    avoidRules: [
      'No random SFX.',
      'SFX must not overpower voice.',
      'Avoid childish/cartoon SFX unless requested.',
      ...(instructions.noSfx ? ['User requested no SFX.'] : []),
    ],
    qaChecks: [
      'Every SFX cue has a reason.',
      'SFX density stays within tier and user intent.',
      'No random whooshes or impacts.',
    ],
  }
}

function beatSyncStrategy(input: PlannerInput, soundStyle: SoundStyleId): BeatSyncStrategy {
  const instructions = audioInstructions(input)

  if (input.editLevel === 'basic') return instructions.highRetention ? 'light' : 'none'
  if (input.editLevel === 'premium' && (instructions.highRetention || soundStyle === 'high_retention_impact')) return 'full_soundsync'
  if (input.editLevel === 'premium') return 'visual_reveal_on_beats'
  if (instructions.highRetention || soundStyle === 'energetic_social') return 'caption_emphasis_on_beats'
  return 'light'
}

function stagesForPlan(input: PlannerInput, musicPlan: MusicBedPlan, sfxPlan: SfxPlan, beatStrategy: BeatSyncStrategy): AudioPipelineStage[] {
  const stages: AudioPipelineStage[] = ['source_audio_analysis', 'voice_cleanup', 'loudness_normalization', 'silence_cleanup']

  if (input.editLevel !== 'basic') {
    if (musicPlan.policy !== 'none') stages.push('music_bed_planning', 'ducking')
    if (sfxPlan.policy !== 'none') stages.push('sfx_planning')
    stages.push('sound_sync_cues')
  }

  if (input.editLevel === 'premium' || beatStrategy === 'full_soundsync') {
    stages.push('beat_sync', 'output_audio_transform')
  }

  stages.push('qa_check')
  return unique(stages)
}

function toolForOperation(operation: AudioOperationId): AudioPipelineToolId {
  if (operation === 'bpm_detection' || operation === 'beat_detection' || operation === 'onset_detection' || operation === 'mood_energy_analysis') return 'audioflux'
  if (operation === 'tempo_adjustment' || operation === 'pitch_adjustment') return 'signalsmith_stretch'
  if (operation === 'caption_timing_alignment' || operation === 'visual_reveal_timing') return 'remotion_timing_preview'
  if (operation.startsWith('qa_')) return 'planning_only'
  return 'ffmpeg'
}

function statusForTool(toolId: AudioPipelineToolId): AudioPipelineStatus {
  return toolId === 'planning_only' || toolId === 'remotion_timing_preview' ? 'planned' : 'future_worker'
}

function operationSettings(operation: AudioOperationId, input: PlannerInput, musicPlan: MusicBedPlan, sfxPlan: SfxPlan, beatStrategy: BeatSyncStrategy) {
  const common = {
    planningOnly: true,
    requiresApproval: true,
  }

  switch (operation) {
    case 'voice_leveling':
      return { ...common, voiceCleanupEnabled: true, voiceLeveling: true, targetVoiceLoudness: input.editLevel === 'basic' ? -16 : -14 }
    case 'loudness_normalization':
      return { ...common, loudnessTarget: input.editLevel === 'basic' ? -16 : -14, truePeakTarget: -1, normalizationMode: 'voice_first' }
    case 'noise_reduction':
      return { ...common, noiseReduction: true, noiseReductionStrength: input.editLevel === 'premium' ? 'medium' : 'light' }
    case 'de_essing':
      return { ...common, deEssing: true, speechPriority: true }
    case 'eq_cleanup':
      return { ...common, eqCleanup: true, compression: input.editLevel !== 'basic' }
    case 'compression':
      return { ...common, compression: true, speechPriority: true }
    case 'silence_cleanup':
      return { ...common, silenceCleanup: true, preserveEmotionalPauses: true }
    case 'breath_reduction':
    case 'filler_pause_cleanup':
      return { ...common, breathReduction: operation === 'breath_reduction', fillerPauseHandling: operation === 'filler_pause_cleanup' ? 'clean_without_removing_emotion' : 'natural' }
    case 'music_bed':
      return { ...common, musicPolicy: musicPlan.policy, musicStyle: musicPlan.soundStyle, musicEnergy: musicPlan.energy, musicVolume: 'voice_safe' }
    case 'music_ducking':
      return { ...common, duckingEnabled: musicPlan.duckingEnabled, duckingStrength: musicPlan.duckingStrength, duckingAttack: 0.18, duckingRelease: 0.7 }
    case 'sfx_hit':
    case 'transition_sound':
    case 'whoosh':
    case 'riser':
      return { ...common, sfxPolicy: sfxPlan.policy, sfxIntensity: sfxPlan.intensity, avoidRandomSfx: true, maxSfxPerMinute: sfxPlan.maxSfxPerMinute }
    case 'bpm_detection':
    case 'beat_detection':
    case 'onset_detection':
      return { ...common, bpmDetection: true, beatGridEnabled: beatStrategy !== 'none', onsetDetection: operation !== 'bpm_detection' }
    case 'caption_timing_alignment':
    case 'visual_reveal_timing':
      return { ...common, cutOnBeat: beatStrategy !== 'none', visualRevealOnBeat: true, captionEmphasisOnBeat: operation === 'caption_timing_alignment' }
    case 'qa_music_over_voice_check':
      return { ...common, musicMustNotOverpowerVoice: true, speechPriority: true }
    case 'qa_sfx_density_check':
      return { ...common, avoidRandomSfx: true, maxSfxPerMinute: sfxPlan.maxSfxPerMinute }
    default:
      return common
  }
}

function createOperation(params: {
  id: string
  operation: AudioOperationId
  input: PlannerInput
  musicPlan: MusicBedPlan
  sfxPlan: SfxPlan
  beatStrategy: BeatSyncStrategy
  reason: string
}): AudioOperationPlan {
  const toolId = toolForOperation(params.operation)

  return {
    id: params.id,
    operation: params.operation,
    label: operationLabels[params.operation],
    toolId,
    settings: operationSettings(params.operation, params.input, params.musicPlan, params.sfxPlan, params.beatStrategy),
    reason: params.reason,
    status: statusForTool(toolId),
    qaChecks: [
      `${operationLabels[params.operation]} matches user intent and tier.`,
      'Planning-only; no real audio processing runs in frontend.',
    ],
    workerNotes: [
      toolId === 'signalsmith_stretch'
        ? 'Signalsmith Stretch is the launch stretch/pitch candidate for future approved workers and needs quality benchmarks before production use.'
        : toolId === 'audioflux'
          ? 'AudioFlux is the launch audio analysis candidate for future approved SoundSync workers and needs accuracy benchmarks before production use.'
        : `${label(toolId)} is planned only for a future approved worker path.`,
      'Do not execute audio tools before plan and credit approval.',
    ],
  }
}

function projectOperations(params: {
  input: PlannerInput
  musicPlan: MusicBedPlan
  sfxPlan: SfxPlan
  beatStrategy: BeatSyncStrategy
  issues: Set<AudioQualityIssue>
  soundStyle: SoundStyleId
}) {
  const presetOps = getAudioOperationsForStyle(params.soundStyle, params.input.editLevel)
  const operations = new Set<AudioOperationId>([
    'voice_leveling',
    'loudness_normalization',
    'true_peak_limit',
    'silence_cleanup',
    'qa_loudness_check',
    ...presetOps,
  ])

  if (params.issues.has('background_noise') || params.issues.has('echo')) operations.add('noise_reduction')
  if (params.issues.has('many_fillers')) operations.add('filler_pause_cleanup')
  if (params.issues.has('long_silence')) operations.add('silence_cleanup')
  if (params.issues.has('clipping')) operations.add('qa_clipping_check')
  if (params.musicPlan.policy !== 'none') {
    operations.add('music_bed')
    operations.add('music_ducking')
    operations.add('qa_music_over_voice_check')
  }
  if (params.sfxPlan.policy !== 'none') {
    operations.add(params.sfxPlan.policy === 'support_transitions' ? 'transition_sound' : 'sfx_hit')
    operations.add('qa_sfx_density_check')
  }
  if (params.beatStrategy !== 'none') {
    operations.add('bpm_detection')
    operations.add('onset_detection')
    operations.add('visual_reveal_timing')
    operations.add('caption_timing_alignment')
  }

  return Array.from(operations).map((operation, index) =>
    createOperation({
      beatStrategy: params.beatStrategy,
      id: `audio-project-${index + 1}-${operation}`,
      input: params.input,
      musicPlan: params.musicPlan,
      operation,
      reason: `${operationLabels[operation]} supports professional ${label(params.soundStyle)} audio planning.`,
      sfxPlan: params.sfxPlan,
    }),
  )
}

function clipIssues(clipId: string, report?: VideoUnderstandingReport): AudioQualityIssue[] {
  const clip = report?.clips.find((item) => item.clipId === clipId)
  return clip?.audioQualityIssues.filter((issue) => issue !== 'none') ?? report?.audioUnderstanding.audioIssues.filter((issue) => issue !== 'none') ?? []
}

function voiceClarityFromIssues(issues: AudioQualityIssue[], report?: VideoUnderstandingReport): ClipAudioPlan['voiceClarity'] {
  if (issues.includes('clipping') || issues.includes('too_quiet')) return 'poor'
  if (issues.includes('background_noise') || issues.includes('echo') || issues.includes('uneven_loudness')) return 'fair'
  return report?.audioUnderstanding.voiceClarity ?? 'good'
}

function clipPlans(params: {
  input: PlannerInput
  report?: VideoUnderstandingReport
  musicPlan: MusicBedPlan
  sfxPlan: SfxPlan
  beatStrategy: BeatSyncStrategy
}): ClipAudioPlan[] {
  return params.input.clips.map((clip, clipIndex) => {
    const issues = clipIssues(clip.id, params.report)
    const cleanupOps: AudioOperationId[] = unique([
      'voice_leveling',
      'silence_cleanup',
      ...(issues.includes('background_noise') || issues.includes('echo') ? ['noise_reduction' as const, 'eq_cleanup' as const] : []),
      ...(issues.includes('many_fillers') ? ['filler_pause_cleanup' as const] : []),
    ])
    const loudnessOps: AudioOperationId[] = unique([
      'loudness_normalization',
      'true_peak_limit',
      ...(issues.includes('clipping') ? ['qa_clipping_check' as const] : []),
    ])

    return {
      id: `clip-audio-${clip.id}`,
      clipId: clip.id,
      clipLabel: clip.fileName,
      voiceClarity: voiceClarityFromIssues(issues, params.report),
      audioIssues: issues.length ? issues : ['none'],
      cleanupOperations: cleanupOps.map((operation, index) =>
        createOperation({
          beatStrategy: params.beatStrategy,
          id: `audio-clip-${clipIndex + 1}-cleanup-${index + 1}-${operation}`,
          input: params.input,
          musicPlan: params.musicPlan,
          operation,
          reason: `${clip.fileName} needs clean, understandable source audio.`,
          sfxPlan: params.sfxPlan,
        }),
      ),
      loudnessOperations: loudnessOps.map((operation, index) =>
        createOperation({
          beatStrategy: params.beatStrategy,
          id: `audio-clip-${clipIndex + 1}-loudness-${index + 1}-${operation}`,
          input: params.input,
          musicPlan: params.musicPlan,
          operation,
          reason: `${clip.fileName} should match project loudness and true peak planning.`,
          sfxPlan: params.sfxPlan,
        }),
      ),
      musicAndDuckingNotes: [
        params.musicPlan.policy === 'none' ? 'No music bed planned for this clip.' : `Music policy ${label(params.musicPlan.policy)} with ${params.musicPlan.duckingStrength} ducking.`,
      ],
      sfxNotes: [
        params.sfxPlan.policy === 'none' ? 'No SFX planned unless the user later requests it.' : 'SFX only on justified reveals, transitions, or story beats.',
      ],
      qaChecks: [
        'Voice stays clear and intelligible.',
        'Clip loudness matches project audio plan.',
        'No random SFX or overpowering music.',
      ],
    }
  })
}

function cueTypeForAsset(asset: VisualAssetPlanItem): SoundSyncCueType {
  const text = assetText(asset)
  if (text.includes('map')) return 'map_pin_drop'
  if (text.includes('money') || text.includes('count') || text.includes('chart')) return 'count_up'
  if (asset.assetType === 'fact_card' || asset.assetType === 'name_card' || asset.assetType === 'timeline_card') return 'card_reveal'
  return 'visual_reveal'
}

function createSoundSyncCues(params: {
  input: PlannerInput
  soundStyle: SoundStyleId
  beatStrategy: BeatSyncStrategy
  sfxPlan: SfxPlan
  segmentEditPlans?: SegmentEditPlan[]
  visualAssetPlan?: VisualAssetPlanItem[]
}): SoundSyncCue[] {
  if (params.input.editLevel === 'basic' && params.beatStrategy === 'none' && params.sfxPlan.policy === 'none') {
    return []
  }

  const segmentCues = (params.segmentEditPlans ?? []).slice(0, params.input.editLevel === 'premium' ? 4 : 2).map((segment, index): SoundSyncCue => ({
    id: `soundsync-segment-${index + 1}`,
    cueType: segment.role === 'emotional_beat' ? 'emotional_pause' : index === 0 ? 'cut' : 'caption_emphasis',
    timeSeconds: segment.finalTimeRange.startSeconds + Math.min(1.5, Math.max(0.4, (segment.finalTimeRange.endSeconds - segment.finalTimeRange.startSeconds) / 3)),
    linkedSegmentId: segment.id,
    intensity: params.sfxPlan.intensity === 'strong' ? 'balanced' : params.sfxPlan.intensity,
    soundStyle: params.soundStyle,
    reason: segment.role === 'emotional_beat'
      ? 'Preserve emotional pause while keeping timing intentional.'
      : 'Align caption/cut timing with the segment story beat.',
    qaChecks: ['Cue supports story timing.', 'Cue does not overpower voice.'],
  }))
  const assetCues = (params.visualAssetPlan ?? []).slice(0, params.input.editLevel === 'premium' ? 4 : 2).map((asset, index): SoundSyncCue => ({
    id: `soundsync-asset-${index + 1}`,
    cueType: cueTypeForAsset(asset),
    timeSeconds: 2.5 + index * 3,
    linkedVisualAssetId: asset.id,
    intensity: params.sfxPlan.intensity,
    soundStyle: params.soundStyle,
    reason: `SoundSync cue supports ${assetLabel(asset)} reveal timing without using random SFX.`,
    qaChecks: ['Cue is justified by a visual reveal.', 'Voice remains clear.'],
  }))

  return [...segmentCues, ...assetCues].slice(0, params.input.editLevel === 'premium' ? 8 : 4)
}

function beatSyncPlan(params: {
  input: PlannerInput
  beatStrategy: BeatSyncStrategy
  cues: SoundSyncCue[]
}): BeatSyncPlan {
  return {
    id: `beat-sync-${params.input.editingCategory}-${params.input.editLevel}`,
    strategy: params.beatStrategy,
    bpmDetectionPlanned: params.beatStrategy !== 'none' && params.input.editLevel !== 'basic',
    onsetDetectionPlanned: params.beatStrategy === 'full_soundsync' || params.input.editLevel === 'premium',
    cutOnBeat: params.beatStrategy === 'cut_on_major_beats' || params.beatStrategy === 'full_soundsync',
    visualRevealOnBeat: params.beatStrategy === 'visual_reveal_on_beats' || params.beatStrategy === 'full_soundsync',
    captionEmphasisOnBeat: params.beatStrategy === 'caption_emphasis_on_beats' || params.beatStrategy === 'full_soundsync',
    emotionalPauseProtection: true,
    cues: params.cues,
    notes: [
      params.beatStrategy === 'none' ? 'No beat grid needed for this plan.' : `SoundSync strategy: ${label(params.beatStrategy)}.`,
      'Beat/onset detection is planning-only; no audio analysis runs in the frontend.',
    ],
  }
}

function toolsPlanned(params: {
  input: PlannerInput
  beatStrategy: BeatSyncStrategy
  operations: AudioOperationPlan[]
}) {
  return unique([
    'planning_only',
    'ffmpeg',
    'remotion_timing_preview',
    params.beatStrategy !== 'none' && params.input.editLevel !== 'basic' ? 'audioflux' : undefined,
    params.input.editLevel === 'premium' && params.beatStrategy === 'full_soundsync' ? 'librosa' : undefined,
    params.operations.some((operation) => operation.operation === 'tempo_adjustment' || operation.operation === 'pitch_adjustment') ? 'signalsmith_stretch' : undefined,
    /transcript|timing|caption/i.test(params.input.customInstructions) ? 'whisper_cpp' : undefined,
  ].filter(Boolean) as AudioPipelineToolId[])
}

export function createAudioPipelinePlan(params: CreateAudioPipelinePlanParams): AudioPipelinePlan {
  const soundStyle = chooseSoundStyle(params)
  const preset = getSoundStylePreset(soundStyle)
  const musicBedPlan = chooseMusicPlan(params.input, soundStyle)
  const sfxPlan = chooseSfxPlan(params.input, soundStyle, params.visualAssetPlan)
  const strategy = beatSyncStrategy(params.input, soundStyle)
  const issues = issueSet(params.videoUnderstandingReport)
  const cues = createSoundSyncCues({
    beatStrategy: strategy,
    input: params.input,
    segmentEditPlans: params.segmentEditPlans,
    sfxPlan,
    soundStyle,
    visualAssetPlan: params.visualAssetPlan,
  })
  const projectOps = projectOperations({
    beatStrategy: strategy,
    input: params.input,
    issues,
    musicPlan: musicBedPlan,
    sfxPlan,
    soundStyle,
  })
  const clipAudioPlans = clipPlans({
    beatStrategy: strategy,
    input: params.input,
    musicPlan: musicBedPlan,
    report: params.videoUnderstandingReport,
    sfxPlan,
  })
  const beatPlan = beatSyncPlan({ beatStrategy: strategy, cues, input: params.input })
  const tools = toolsPlanned({ beatStrategy: strategy, input: params.input, operations: projectOps })

  return {
    id: `audio-pipeline-${params.input.editingCategory}-${params.input.editLevel}`,
    summary: `${preset.label} audio pipeline planned with ${clipAudioPlans.length} clip plan${clipAudioPlans.length === 1 ? '' : 's'}, ${cues.length} SoundSync cue${cues.length === 1 ? '' : 's'}, and no real audio processing in this frontend mock.`,
    soundStyle,
    audioIntensity: preset.audioIntensityDefault,
    stages: stagesForPlan(params.input, musicBedPlan, sfxPlan, strategy),
    toolsPlanned: tools,
    projectOperations: projectOps,
    clipPlans: clipAudioPlans,
    musicBedPlan,
    sfxPlan,
    beatSyncPlan: beatPlan,
    soundSyncCues: cues,
    tierNotes: [
      params.input.editLevel === 'basic'
        ? 'Basic includes professional voice cleanup and loudness planning, minimal music/SFX, no random SFX, and no Veo.'
        : params.input.editLevel === 'pro'
          ? 'Pro adds tasteful SoundSync timing, ducking, and SFX where useful; no Veo.'
          : 'Premium adds deeper beat/mood/SFX planning and stronger QA; Veo remains AI-video final fallback only, not audio.',
      'Audio planning does not enable provider generation or bypass approval.',
    ],
    qaChecks: [
      'Voice is clear and consistently leveled.',
      'Music does not overpower voice.',
      'SFX are justified by story, transition, reveal, or emotion.',
      'SoundSync cues support captions, cuts, visuals, and transitions.',
      'No real audio processing or analysis runs in this frontend mock.',
    ],
    limitations: [
      'Mock-only audio pipeline plan; no real audio analysis has run.',
      'No FFmpeg, AudioFlux, Signalsmith Stretch, Essentia, librosa, Rubber Band, whisper.cpp, transcription, beat detection, music generation, SFX generation, rendering, or export is executed.',
      'Future workers must use approved plan snapshots after user approval and credit reservation.',
      ...(tools.includes('signalsmith_stretch') ? ['Signalsmith Stretch is a worker-only launch candidate and needs audio quality benchmarks before production use.'] : []),
      'Essentia and Rubber Band are not selected for launch defaults; they remain future evaluation only if referenced later.',
    ],
    status: 'planned',
  }
}
