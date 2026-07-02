import type { EditLevel, EditingCategory } from '../types/reeditpro'

export type TimingPresetId =
  | 'clean_basic_timing'
  | 'pro_social_timing'
  | 'premium_story_timing'
  | 'documentary_measured_timing'
  | 'education_explainer_timing'
  | 'business_premium_timing'
  | 'lifestyle_natural_timing'
  | 'high_retention_timing'
  | 'cinematic_emotional_timing'
  | 'custom'

export type TimingPreset = {
  id: TimingPresetId
  label: string
  description: string
  bestUseCases: string[]
  pacingNotes: string[]
  captionSettings: Record<string, number | string | boolean>
  visualSettings: Record<string, number | string | boolean>
  transitionSettings: Record<string, number | string | boolean>
  sfxSettings: Record<string, number | string | boolean>
  beatSyncSettings: Record<string, number | string | boolean>
  avoidRules: string[]
  qaChecks: string[]
  tierFit: EditLevel[]
}

function preset(params: TimingPreset): TimingPreset {
  return params
}

export const timingPresets: TimingPreset[] = [
  preset({
    id: 'clean_basic_timing',
    label: 'Clean Basic timing',
    description: 'Professional, lower-compute timing with clean cuts and readable captions.',
    bestUseCases: ['simple edits', 'talking head', 'clean social clips'],
    pacingNotes: ['Speech clarity first.', 'Simple motivated cuts.', 'No chaotic cue density.'],
    captionSettings: { maxWordsPerCaption: 8, minCaptionDurationFrames: 45, animationInFrames: 4, animationOutFrames: 4 },
    visualSettings: { revealFrames: 8, holdFrames: 75, exitFrames: 6, visualReadTimePerWordFrames: 8 },
    transitionSettings: { transitionDurationFrames: 6, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 4, intensity: 'subtle', randomSfx: false },
    beatSyncSettings: { cutOnBeat: false, visualRevealOnBeat: false, cueSnapToleranceFrames: 4 },
    avoidRules: ['No random SFX.', 'No over-timing.', 'Do not cut important words.'],
    qaChecks: ['Captions readable.', 'Voice protected.', 'Simple transitions are motivated.'],
    tierFit: ['basic', 'pro', 'premium'],
  }),
  preset({
    id: 'pro_social_timing',
    label: 'Pro social timing',
    description: 'Tighter social timing with cue-based reveals and measured SoundSync.',
    bestUseCases: ['short-form', 'marketing', 'creator clips'],
    pacingNotes: ['Fast hook.', 'Visual reveals follow meaning.', 'Beat sync only when speech allows.'],
    captionSettings: { maxWordsPerCaption: 6, minCaptionDurationFrames: 42, animationInFrames: 5, animationOutFrames: 5 },
    visualSettings: { revealFrames: 6, holdFrames: 65, exitFrames: 5, visualReadTimePerWordFrames: 7 },
    transitionSettings: { transitionDurationFrames: 8, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 8, intensity: 'balanced', randomSfx: false },
    beatSyncSettings: { cutOnBeat: true, visualRevealOnBeat: true, cueSnapToleranceFrames: 5 },
    avoidRules: ['Do not sacrifice speech clarity for beats.', 'No default Veo route.'],
    qaChecks: ['Beat cuts are appropriate.', 'Visuals reveal on spoken meaning.'],
    tierFit: ['pro', 'premium'],
  }),
  preset({
    id: 'premium_story_timing',
    label: 'Premium story timing',
    description: 'Scene-level timing with stronger visual/SFX/music coordination.',
    bestUseCases: ['premium storytelling', 'brand films', 'complex visual edits'],
    pacingNotes: ['Protect emotional pauses.', 'Coordinate SFX and visuals at frame level.'],
    captionSettings: { maxWordsPerCaption: 7, minCaptionDurationFrames: 48, animationInFrames: 6, animationOutFrames: 6 },
    visualSettings: { revealFrames: 8, holdFrames: 90, exitFrames: 8, visualReadTimePerWordFrames: 9 },
    transitionSettings: { transitionDurationFrames: 10, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 10, intensity: 'balanced', randomSfx: false },
    beatSyncSettings: { cutOnBeat: true, visualRevealOnBeat: true, cueSnapToleranceFrames: 4 },
    avoidRules: ['Veo remains final fallback only.', 'Do not crowd emotional beats.'],
    qaChecks: ['Scene timing reviewed.', 'AI clip durations match plan.'],
    tierFit: ['premium'],
  }),
  preset({
    id: 'documentary_measured_timing',
    label: 'Documentary measured timing',
    description: 'Restrained evidence and case-study timing with safer holds.',
    bestUseCases: ['documentary', 'case study', 'evidence explainer'],
    pacingNotes: ['Hold evidence long enough.', 'Avoid sensational timing.'],
    captionSettings: { maxWordsPerCaption: 9, minCaptionDurationFrames: 54, animationInFrames: 4, animationOutFrames: 4 },
    visualSettings: { revealFrames: 10, holdFrames: 105, exitFrames: 8, visualReadTimePerWordFrames: 10 },
    transitionSettings: { transitionDurationFrames: 8, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 3, intensity: 'subtle', randomSfx: false },
    beatSyncSettings: { cutOnBeat: false, visualRevealOnBeat: false, cueSnapToleranceFrames: 4 },
    avoidRules: ['No overhyped timing.', 'No claim-implying SFX.'],
    qaChecks: ['Evidence cards readable.', 'Safe wording has time to land.'],
    tierFit: ['pro', 'premium'],
  }),
  preset({
    id: 'education_explainer_timing',
    label: 'Education explainer timing',
    description: 'Phrase-based reveals with labels held for comprehension.',
    bestUseCases: ['tutorials', 'education', 'framework explainers'],
    pacingNotes: ['Reveal visual as concept is spoken.', 'Labels hold long enough.'],
    captionSettings: { maxWordsPerCaption: 8, minCaptionDurationFrames: 48, animationInFrames: 5, animationOutFrames: 5 },
    visualSettings: { revealFrames: 8, holdFrames: 96, exitFrames: 6, visualReadTimePerWordFrames: 10 },
    transitionSettings: { transitionDurationFrames: 7, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 5, intensity: 'subtle', randomSfx: false },
    beatSyncSettings: { cutOnBeat: false, visualRevealOnBeat: true, cueSnapToleranceFrames: 6 },
    avoidRules: ['Do not hide labels too quickly.', 'No AI video for exact diagrams.'],
    qaChecks: ['Concept labels readable.', 'Visuals match speech timing.'],
    tierFit: ['pro', 'premium'],
  }),
  preset({
    id: 'business_premium_timing',
    label: 'Business premium timing',
    description: 'Clean problem/feature/benefit/CTA timing with premium restraint.',
    bestUseCases: ['business brand', 'product walkthroughs', 'ads'],
    pacingNotes: ['CTA concise.', 'Feature highlights land with speech.'],
    captionSettings: { maxWordsPerCaption: 7, minCaptionDurationFrames: 45, animationInFrames: 5, animationOutFrames: 5 },
    visualSettings: { revealFrames: 7, holdFrames: 82, exitFrames: 6, visualReadTimePerWordFrames: 8 },
    transitionSettings: { transitionDurationFrames: 8, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 6, intensity: 'balanced', randomSfx: false },
    beatSyncSettings: { cutOnBeat: true, visualRevealOnBeat: true, cueSnapToleranceFrames: 5 },
    avoidRules: ['No cluttered product timing.', 'Do not cover feature UI.'],
    qaChecks: ['Product highlights align.', 'CTA has clean ending.'],
    tierFit: ['pro', 'premium'],
  }),
  preset({
    id: 'lifestyle_natural_timing',
    label: 'Lifestyle natural timing',
    description: 'Human-paced timing with preserved pauses and light polish.',
    bestUseCases: ['lifestyle', 'vlogs', 'personal stories'],
    pacingNotes: ['Preserve natural breath.', 'Use light captions and simple transitions.'],
    captionSettings: { maxWordsPerCaption: 8, minCaptionDurationFrames: 48, animationInFrames: 4, animationOutFrames: 4 },
    visualSettings: { revealFrames: 8, holdFrames: 80, exitFrames: 6, visualReadTimePerWordFrames: 8 },
    transitionSettings: { transitionDurationFrames: 6, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 2, intensity: 'subtle', randomSfx: false },
    beatSyncSettings: { cutOnBeat: false, visualRevealOnBeat: false, cueSnapToleranceFrames: 5 },
    avoidRules: ['Do not over-time natural moments.', 'No random SFX.'],
    qaChecks: ['Pauses preserved.', 'Captions do not crowd emotion.'],
    tierFit: ['basic', 'pro', 'premium'],
  }),
  preset({
    id: 'high_retention_timing',
    label: 'High-retention timing',
    description: 'Faster cue density for social retention while protecting speech.',
    bestUseCases: ['viral clips', 'fast ads', 'short-form hooks'],
    pacingNotes: ['Short hook.', 'Frequent but meaningful cues.'],
    captionSettings: { maxWordsPerCaption: 5, minCaptionDurationFrames: 40, animationInFrames: 4, animationOutFrames: 4 },
    visualSettings: { revealFrames: 5, holdFrames: 58, exitFrames: 5, visualReadTimePerWordFrames: 7 },
    transitionSettings: { transitionDurationFrames: 6, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 10, intensity: 'balanced', randomSfx: false },
    beatSyncSettings: { cutOnBeat: true, visualRevealOnBeat: true, cueSnapToleranceFrames: 4 },
    avoidRules: ['Speech clarity still outranks retention.', 'No chaotic Basic timing.'],
    qaChecks: ['Hook is tight.', 'Cue density is justified.'],
    tierFit: ['pro', 'premium'],
  }),
  preset({
    id: 'cinematic_emotional_timing',
    label: 'Cinematic emotional timing',
    description: 'Longer holds and restrained cueing for emotional moments.',
    bestUseCases: ['premium stories', 'documentary endings', 'emotional brand films'],
    pacingNotes: ['Hold reactions.', 'Let silence and music breathe.'],
    captionSettings: { maxWordsPerCaption: 8, minCaptionDurationFrames: 54, animationInFrames: 6, animationOutFrames: 8 },
    visualSettings: { revealFrames: 12, holdFrames: 110, exitFrames: 10, visualReadTimePerWordFrames: 10 },
    transitionSettings: { transitionDurationFrames: 12, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 4, intensity: 'subtle', randomSfx: false },
    beatSyncSettings: { cutOnBeat: false, visualRevealOnBeat: true, cueSnapToleranceFrames: 5 },
    avoidRules: ['Do not rush emotional pauses.', 'No impact SFX over voice.'],
    qaChecks: ['Emotion has breathing room.', 'Music ducking protects voice.'],
    tierFit: ['premium'],
  }),
  preset({
    id: 'custom',
    label: 'Custom timing',
    description: 'User-directed timing plan mapped to ReeditPro rules.',
    bestUseCases: ['custom instructions'],
    pacingNotes: ['Follow explicit user instructions unless safety, tier, frame, or approval rules constrain them.'],
    captionSettings: { maxWordsPerCaption: 8, minCaptionDurationFrames: 45, animationInFrames: 5, animationOutFrames: 5 },
    visualSettings: { revealFrames: 8, holdFrames: 75, exitFrames: 6, visualReadTimePerWordFrames: 8 },
    transitionSettings: { transitionDurationFrames: 8, cutOnPhraseBoundary: true, avoidCuttingWords: true },
    sfxSettings: { maxSfxPerMinute: 5, intensity: 'subtle', randomSfx: false },
    beatSyncSettings: { cutOnBeat: false, visualRevealOnBeat: false, cueSnapToleranceFrames: 5 },
    avoidRules: ['No random timing.', 'Do not override approval gates.'],
    qaChecks: ['Custom timing is justified.', 'Speech clarity protected.'],
    tierFit: ['basic', 'pro', 'premium'],
  }),
]

export function getTimingPreset(id: TimingPresetId) {
  return timingPresets.find((preset) => preset.id === id) ?? timingPresets[0]
}

export function getDefaultTimingPresetForCategory(params: {
  editingCategory: EditingCategory
  editLevel: EditLevel
  highRetention?: boolean
}): TimingPreset {
  if (params.highRetention && params.editLevel !== 'basic') return getTimingPreset('high_retention_timing')
  if (params.editingCategory === 'documentary_case_study') return getTimingPreset('documentary_measured_timing')
  if (params.editingCategory === 'education_explainer') return getTimingPreset('education_explainer_timing')
  if (params.editingCategory === 'business_brand') return getTimingPreset('business_premium_timing')
  if (params.editingCategory === 'lifestyle') return getTimingPreset('lifestyle_natural_timing')
  if (params.editLevel === 'premium') return getTimingPreset('premium_story_timing')
  if (params.editLevel === 'pro') return getTimingPreset('pro_social_timing')

  return getTimingPreset('clean_basic_timing')
}

export function getCaptionTimingSettings(presetId: TimingPresetId) {
  return getTimingPreset(presetId).captionSettings
}

export function getVisualTimingSettings(presetId: TimingPresetId) {
  return getTimingPreset(presetId).visualSettings
}

export function getTransitionTimingSettings(presetId: TimingPresetId) {
  return getTimingPreset(presetId).transitionSettings
}
