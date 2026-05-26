import type { CaptionStylePreset, CaptionStylePresetId } from './caption-worker-types'

export const captionStylePresets: CaptionStylePreset[] = [
  preset('clean_subtitle', 'Inter, Arial, sans-serif', 'medium responsive subtitle', 1.18, 2, 'bottom_safe', 'subtle translucent box', 'soft outline', 'soft shadow', ['general', 'basic', 'pro']),
  preset('small_premium_subtitle', 'Inter, Arial, sans-serif', 'small premium subtitle', 1.2, 2, 'bottom_safe', 'none', 'thin outline', 'soft shadow', ['premium', 'documentary']),
  preset('bold_social_captions', 'Inter, Arial, sans-serif', 'large social caption', 1.1, 2, 'middle_safe', 'high contrast pill', 'medium outline', 'strong shadow', ['shorts', 'reels', 'tiktok']),
  preset('keyword_emphasis_captions', 'Inter, Arial, sans-serif', 'social caption with emphasis spans', 1.1, 2, 'middle_safe', 'contrast box', 'medium outline', 'shadow', ['pro', 'premium']),
  preset('karaoke_word_by_word', 'Inter, Arial, sans-serif', 'word-level highlight timing', 1.08, 1, 'bottom_safe', 'none', 'medium outline', 'shadow', ['premium', 'music']),
  preset('sentence_block_captions', 'Inter, Arial, sans-serif', 'sentence subtitle block', 1.22, 2, 'bottom_safe', 'subtle box', 'thin outline', 'soft shadow', ['education', 'documentary']),
  preset('documentary_lower_third', 'Georgia, Times New Roman, serif', 'restrained lower-third subtitle', 1.25, 2, 'lower_third', 'minimal translucent band', 'thin outline', 'minimal shadow', ['documentary', 'case_study']),
  preset('education_label_captions', 'Inter, Arial, sans-serif', 'education label caption', 1.18, 2, 'side_panel', 'solid readable panel', 'none', 'none', ['education', 'training']),
  preset('minimal_accessibility_captions', 'Arial, sans-serif', 'accessibility-first subtitle', 1.25, 2, 'bottom_safe', 'high contrast box', 'clear outline', 'none', ['accessibility', 'general']),
]

export function getCaptionStylePreset(presetId: CaptionStylePresetId = 'clean_subtitle'): CaptionStylePreset {
  const fallback = captionStylePresets[0]
  if (!fallback) throw new Error('Caption style presets are not configured.')
  return captionStylePresets.find((presetItem) => presetItem.presetId === presetId) ?? fallback
}

function preset(
  presetId: CaptionStylePresetId,
  fontFamilyFallback: string,
  fontSizePolicy: string,
  lineHeight: number,
  maxLines: number,
  positionPolicy: CaptionStylePreset['positionPolicy'],
  backgroundPolicy: string,
  outlinePolicy: string,
  shadowPolicy: string,
  platformSuitability: string[],
): CaptionStylePreset {
  return {
    presetId,
    fontFamilyFallback,
    fontSizePolicy,
    lineHeight,
    maxLines,
    positionPolicy,
    backgroundPolicy,
    outlinePolicy,
    shadowPolicy,
    platformSuitability,
    qaNotes: [
      'No font files are bundled by Milestone 7.',
      'Caption style is controlled metadata, not arbitrary user CSS or ASS overrides.',
    ],
  }
}
