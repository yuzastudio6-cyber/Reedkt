import type {
  AudioIntensity,
  AudioOperationId,
  BeatSyncStrategy,
  EditLevel,
  EditingCategory,
  MusicPolicy,
  SfxPolicy,
  SoundStyleId,
} from '../types/reeditpro'

type SoundStylePreset = {
  id: SoundStyleId
  label: string
  description: string
  bestUseCases: string[]
  defaultForCategories: EditingCategory[]
  defaultForEditLevels: EditLevel[]
  voiceOperations: AudioOperationId[]
  musicPolicy: MusicPolicy
  sfxPolicy: SfxPolicy
  beatSyncStrategy: BeatSyncStrategy
  avoidRules: string[]
  qaChecks: string[]
  audioIntensityDefault: AudioIntensity
}

function preset(params: SoundStylePreset): SoundStylePreset {
  return params
}

export const soundStylePresets: SoundStylePreset[] = [
  preset({
    id: 'clean_voice_only',
    label: 'Clean voice only',
    description: 'Voice-first cleanup, loudness, and timing with little or no music/SFX.',
    bestUseCases: ['Basic edits', 'Education', 'Training', 'Serious talk', 'No-music requests'],
    defaultForCategories: ['education_explainer'],
    defaultForEditLevels: ['basic'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'silence_cleanup', 'eq_cleanup'],
    musicPolicy: 'none',
    sfxPolicy: 'none',
    beatSyncStrategy: 'none',
    avoidRules: ['No overpowering music.', 'No random SFX.', 'Do not remove meaningful pauses.'],
    qaChecks: ['Voice remains clear.', 'Loudness stays consistent.', 'No random SFX.'],
    audioIntensityDefault: 'clean',
  }),
  preset({
    id: 'subtle_premium_bed',
    label: 'Subtle premium bed',
    description: 'Soft music bed with careful ducking and restrained SoundSync cues.',
    bestUseCases: ['Premium creator edits', 'Business explainers', 'Lifestyle with polish'],
    defaultForCategories: ['business_brand', 'lifestyle'],
    defaultForEditLevels: ['pro'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'music_ducking', 'eq_cleanup'],
    musicPolicy: 'optional_subtle',
    sfxPolicy: 'minimal',
    beatSyncStrategy: 'light',
    avoidRules: ['Music must stay under voice.', 'No dense SFX bed.'],
    qaChecks: ['Ducking planned under speech.', 'Music supports the tone without distraction.'],
    audioIntensityDefault: 'subtle',
  }),
  preset({
    id: 'energetic_social',
    label: 'Energetic social',
    description: 'Rhythmic social audio with beat-aware cuts and tasteful impact moments.',
    bestUseCases: ['Short-form social', 'Energetic creator clips', 'Fast hooks'],
    defaultForCategories: ['lifestyle'],
    defaultForEditLevels: ['pro'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'music_ducking', 'beat_detection'],
    musicPolicy: 'energetic',
    sfxPolicy: 'beat_synced',
    beatSyncStrategy: 'visual_reveal_on_beats',
    avoidRules: ['Do not use high-impact sound if the user asks for natural pacing.', 'Do not bury speech.'],
    qaChecks: ['Beat sync supports the edit.', 'SFX density remains justified.'],
    audioIntensityDefault: 'energetic',
  }),
  preset({
    id: 'cinematic_emotional',
    label: 'Cinematic emotional',
    description: 'Emotional music, protected pauses, and restrained cue timing for story beats.',
    bestUseCases: ['Storytelling', 'Emotional reveals', 'Cinematic edits'],
    defaultForCategories: ['storytelling'],
    defaultForEditLevels: ['premium'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'music_ducking', 'mood_energy_analysis'],
    musicPolicy: 'cinematic',
    sfxPolicy: 'support_key_moments',
    beatSyncStrategy: 'light',
    avoidRules: ['Preserve emotional pauses.', 'Avoid over-hyping quiet moments.'],
    qaChecks: ['Pauses remain intentional.', 'Music supports emotion without overpowering voice.'],
    audioIntensityDefault: 'cinematic',
  }),
  preset({
    id: 'documentary_serious',
    label: 'Documentary serious',
    description: 'Restrained, voice-first serious audio for evidence and case-study edits.',
    bestUseCases: ['Documentary', 'Case study', 'Scam/fraud', 'Investigations'],
    defaultForCategories: ['documentary_case_study'],
    defaultForEditLevels: ['pro', 'premium'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'noise_reduction', 'music_ducking'],
    musicPolicy: 'documentary_bed',
    sfxPolicy: 'minimal',
    beatSyncStrategy: 'light',
    avoidRules: ['Avoid sensational sound.', 'Do not imply allegations are proven facts with impact hits.'],
    qaChecks: ['Tone stays serious.', 'SFX remain evidence/reveal specific.'],
    audioIntensityDefault: 'subtle',
  }),
  preset({
    id: 'corporate_clean',
    label: 'Corporate clean',
    description: 'Clear voice, polished low-profile music, and restrained transition timing.',
    bestUseCases: ['SaaS', 'Business', 'Training', 'Internal content'],
    defaultForCategories: ['business_brand', 'education_explainer'],
    defaultForEditLevels: ['pro'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'eq_cleanup', 'compression'],
    musicPolicy: 'optional_subtle',
    sfxPolicy: 'minimal',
    beatSyncStrategy: 'light',
    avoidRules: ['Avoid viral sound design.', 'Keep product narration readable.'],
    qaChecks: ['Voice clarity leads.', 'Music stays professional and restrained.'],
    audioIntensityDefault: 'balanced',
  }),
  preset({
    id: 'lifestyle_warm',
    label: 'Lifestyle warm',
    description: 'Warm, human, natural SoundSync with light music and minimal cues.',
    bestUseCases: ['Lifestyle', 'Travel', 'Food', 'Family', 'Creator edits'],
    defaultForCategories: ['lifestyle'],
    defaultForEditLevels: ['basic', 'pro'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'silence_cleanup'],
    musicPolicy: 'optional_subtle',
    sfxPolicy: 'minimal',
    beatSyncStrategy: 'light',
    avoidRules: ['Do not over-edit natural moments.', 'Avoid childish SFX.'],
    qaChecks: ['Natural pacing remains intact.', 'Music does not crowd speech.'],
    audioIntensityDefault: 'subtle',
  }),
  preset({
    id: 'luxury_soft',
    label: 'Luxury soft',
    description: 'Soft premium bed, smooth fades, and elegant low-density cue timing.',
    bestUseCases: ['Luxury real estate', 'Premium product', 'Brand films'],
    defaultForCategories: ['business_brand'],
    defaultForEditLevels: ['premium'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'music_ducking', 'mood_energy_analysis'],
    musicPolicy: 'luxury_soft',
    sfxPolicy: 'minimal',
    beatSyncStrategy: 'light',
    avoidRules: ['Avoid harsh impacts.', 'Keep luxury pacing smooth.'],
    qaChecks: ['Music bed feels premium.', 'Transitions stay soft and controlled.'],
    audioIntensityDefault: 'subtle',
  }),
  preset({
    id: 'high_retention_impact',
    label: 'High-retention impact',
    description: 'Impactful cue timing for hooks and reveals when the user wants high energy.',
    bestUseCases: ['High-retention hooks', 'Launch clips', 'Social ads'],
    defaultForCategories: ['business_brand'],
    defaultForEditLevels: ['premium'],
    voiceOperations: ['voice_leveling', 'loudness_normalization', 'beat_detection', 'onset_detection'],
    musicPolicy: 'energetic',
    sfxPolicy: 'high_impact',
    beatSyncStrategy: 'full_soundsync',
    avoidRules: ['Do not use if user asks for calm or natural.', 'Voice must still lead.'],
    qaChecks: ['Impact cues are justified.', 'SFX density remains under control.'],
    audioIntensityDefault: 'high_impact',
  }),
  preset({
    id: 'custom',
    label: 'Custom',
    description: 'User-defined audio style mapped to known professional settings.',
    bestUseCases: ['User-specific sound direction'],
    defaultForCategories: [],
    defaultForEditLevels: [],
    voiceOperations: ['voice_leveling', 'loudness_normalization'],
    musicPolicy: 'custom',
    sfxPolicy: 'custom',
    beatSyncStrategy: 'light',
    avoidRules: ['Honor explicit user avoid rules.', 'Do not invent random sound design.'],
    qaChecks: ['Custom audio direction matches user intent.'],
    audioIntensityDefault: 'balanced',
  }),
]

export function getSoundStylePreset(style: SoundStyleId) {
  return soundStylePresets.find((presetItem) => presetItem.id === style) ?? soundStylePresets[0]
}

export function getDefaultSoundStyleForCategory(params: {
  editingCategory: EditingCategory
  editLevel: EditLevel
  customInstructions?: string
}): SoundStyleId {
  const text = params.customInstructions?.toLowerCase() ?? ''

  if (/\b(no music|voice only|clean audio|just voice)\b/.test(text)) return 'clean_voice_only'
  if (/\b(documentary|case study|scam|fraud|investigation)\b/.test(text)) return 'documentary_serious'
  if (/\b(cinematic|emotional|sad|dramatic)\b/.test(text)) return 'cinematic_emotional'
  if (/\b(upbeat|energetic|high retention|viral)\b/.test(text)) return params.editLevel === 'basic' ? 'subtle_premium_bed' : 'energetic_social'
  if (/\b(luxury|real estate|premium property)\b/.test(text)) return params.editLevel === 'premium' ? 'luxury_soft' : 'subtle_premium_bed'

  if (params.editLevel === 'basic') {
    if (params.editingCategory === 'lifestyle') return 'lifestyle_warm'
    return 'clean_voice_only'
  }

  switch (params.editingCategory) {
    case 'storytelling':
      return params.editLevel === 'premium' ? 'cinematic_emotional' : 'subtle_premium_bed'
    case 'lifestyle':
      return 'lifestyle_warm'
    case 'business_brand':
      return params.editLevel === 'premium' ? 'subtle_premium_bed' : 'corporate_clean'
    case 'education_explainer':
      return params.editLevel === 'premium' ? 'corporate_clean' : 'clean_voice_only'
    case 'documentary_case_study':
      return 'documentary_serious'
    default:
      return 'clean_voice_only'
  }
}

export function getAudioOperationsForStyle(style: SoundStyleId, editLevel: EditLevel): AudioOperationId[] {
  const presetItem = getSoundStylePreset(style)
  const operations = new Set<AudioOperationId>([
    'voice_leveling',
    'loudness_normalization',
    'qa_loudness_check',
    ...presetItem.voiceOperations,
  ])

  if (editLevel !== 'basic') {
    operations.add('music_ducking')
    operations.add('caption_timing_alignment')
  }

  if (editLevel === 'premium') {
    operations.add('bpm_detection')
    operations.add('onset_detection')
    operations.add('mood_energy_analysis')
  }

  return Array.from(operations)
}

export function getAudioPresetForEditLevel(editLevel: EditLevel, style: SoundStyleId) {
  if (editLevel === 'basic' && style !== 'lifestyle_warm') {
    return getSoundStylePreset('clean_voice_only')
  }

  return getSoundStylePreset(style)
}
