import type {
  ColorGradeStyleId,
  ColorIntensity,
  ColorOperationId,
  EditLevel,
  EditingCategory,
  MoodStyle,
  ProfessionalEditingDirective,
} from '../types/reeditpro'

type ColorGradePreset = {
  id: ColorGradeStyleId
  label: string
  description: string
  bestUseCases: string[]
  defaultForCategories: EditingCategory[]
  defaultForEditLevels: EditLevel[]
  correctionOperations: ColorOperationId[]
  lookOperations: ColorOperationId[]
  generatedAssetRules: string[]
  avoidRules: string[]
  qaChecks: string[]
  intensityDefault: ColorIntensity
}

const baselineCorrection: ColorOperationId[] = [
  'exposure_correction',
  'white_balance',
  'contrast_curve',
  'skin_tone_protection',
  'shot_matching',
]

const basicGeneratedAssetRules = [
  'Generated assets must match the chosen grade and source footage.',
  'AI video panels must use the planned matching panel background.',
  'Avoid lighting/style drift between source footage and generated assets.',
]

export const colorGradePresets: ColorGradePreset[] = [
  {
    id: 'clean_natural',
    label: 'Clean natural',
    description: 'Professional baseline correction with natural contrast and protected skin tones.',
    bestUseCases: ['Basic clean edits', 'talking head', 'education', 'simple creator edits'],
    defaultForCategories: ['lifestyle', 'education_explainer'],
    defaultForEditLevels: ['basic'],
    correctionOperations: [...baselineCorrection, 'highlight_recovery', 'saturation'],
    lookOperations: [],
    generatedAssetRules: basicGeneratedAssetRules,
    avoidRules: ['No ugly LUTs.', 'No crushed blacks.', 'No over-sharpening.', 'No washed-out output.'],
    qaChecks: ['Exposure looks clean.', 'White balance is natural.', 'Skin tones stay believable.'],
    intensityDefault: 'subtle',
  },
  {
    id: 'premium_clean',
    label: 'Premium clean',
    description: 'Polished contrast, refined highlights, and clean source/generated asset matching.',
    bestUseCases: ['Pro creator', 'brand videos', 'business/product', 'premium testimonials'],
    defaultForCategories: ['business_brand', 'storytelling'],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'highlight_recovery', 'clarity'],
    lookOperations: ['look_transform', 'generated_asset_match', 'panel_background_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Cards/keyframes should feel polished but restrained.'],
    avoidRules: ['Avoid crushed shadows.', 'Avoid shiny overprocessed contrast.'],
    qaChecks: ['Premium look remains restrained.', 'Generated assets match the project grade.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'warm_lifestyle',
    label: 'Warm lifestyle',
    description: 'Warm human grade with gentle contrast and natural skin protection.',
    bestUseCases: ['Lifestyle', 'family', 'travel', 'food', 'beauty'],
    defaultForCategories: ['lifestyle'],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'temperature', 'vibrance'],
    lookOperations: ['look_transform', 'generated_asset_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Stroke/Real Motion panels should keep the warm human palette.'],
    avoidRules: ['Avoid orange skin.', 'Avoid oversaturated food/travel colors.'],
    qaChecks: ['Warmth is gentle.', 'Skin tones remain natural.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'cinematic_contrast',
    label: 'Cinematic contrast',
    description: 'Deeper contrast and shadow shaping for emotional story beats while preserving faces.',
    bestUseCases: ['Storytelling', 'dramatic reveals', 'emotional stories'],
    defaultForCategories: ['storytelling'],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'highlight_recovery', 'shadow_control'],
    lookOperations: ['look_transform', 'ai_video_asset_match', 'panel_background_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'AI video clips should not drift into random lighting or mood.'],
    avoidRules: ['Avoid hiding facial expression.', 'Avoid muddy blacks.'],
    qaChecks: ['Faces stay readable.', 'Contrast supports emotion without losing detail.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'documentary_neutral',
    label: 'Documentary neutral',
    description: 'Neutral evidence-safe grade that avoids sensational color treatment.',
    bestUseCases: ['Documentary', 'case study', 'scam/fraud explanation', 'evidence timeline'],
    defaultForCategories: ['documentary_case_study'],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'saturation', 'highlight_recovery'],
    lookOperations: ['look_transform', 'generated_asset_match', 'panel_background_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Evidence cards and AI assets must stay neutral and source-aware.'],
    avoidRules: ['Avoid sensational contrast.', 'Avoid guilt-implying color treatment.', 'Avoid playful palettes.'],
    qaChecks: ['Tone stays factual.', 'Allegations are not stylized as proven facts.'],
    intensityDefault: 'subtle',
  },
  {
    id: 'luxury_real_estate',
    label: 'Luxury real estate',
    description: 'Bright, spacious, premium correction for property or place-focused edits.',
    bestUseCases: ['Real estate', 'luxury spaces', 'hospitality', 'premium product spaces'],
    defaultForCategories: ['business_brand', 'lifestyle'],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'highlight_recovery', 'white_point', 'temperature'],
    lookOperations: ['look_transform', 'generated_asset_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Maps/cards should match bright premium space tone.'],
    avoidRules: ['Avoid blown windows.', 'Avoid dirty whites.', 'Avoid heavy vignette.'],
    qaChecks: ['Interior/exterior shots match.', 'Highlights stay controlled.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'corporate_neutral',
    label: 'Corporate neutral',
    description: 'Restrained business-safe grade with accurate whites and product colors.',
    bestUseCases: ['SaaS', 'training', 'internal content', 'business/product'],
    defaultForCategories: ['business_brand', 'education_explainer'],
    defaultForEditLevels: ['pro'],
    correctionOperations: [...baselineCorrection, 'white_point', 'saturation'],
    lookOperations: ['generated_asset_match', 'panel_background_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Screen/product assets should preserve brand/product color accuracy.'],
    avoidRules: ['Avoid trendy filters.', 'Avoid inaccurate brand colors.'],
    qaChecks: ['Product color stays accurate.', 'Whites stay clean.'],
    intensityDefault: 'subtle',
  },
  {
    id: 'bright_social',
    label: 'Bright social',
    description: 'Clear social brightness with controlled vibrance and no clipping.',
    bestUseCases: ['Short-form creator content', 'energetic social clips'],
    defaultForCategories: ['lifestyle', 'storytelling'],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'vibrance', 'clarity', 'highlight_recovery'],
    lookOperations: ['generated_asset_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Generated panels should remain bright without neon drift.'],
    avoidRules: ['Avoid neon saturation.', 'Avoid blown highlights.'],
    qaChecks: ['Highlights are safe.', 'Captions remain readable.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'moody_dramatic',
    label: 'Moody dramatic',
    description: 'Serious darker grade for conflict or suspense with face readability protected.',
    bestUseCases: ['Suspense', 'serious story', 'conflict'],
    defaultForCategories: ['storytelling'],
    defaultForEditLevels: ['premium'],
    correctionOperations: [...baselineCorrection, 'shadow_control', 'black_point', 'highlight_recovery'],
    lookOperations: ['look_transform', 'ai_video_asset_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'AI clips should preserve readable faces and controlled shadows.'],
    avoidRules: ['Avoid muddy faces.', 'Avoid horror styling unless requested.'],
    qaChecks: ['Viewer can still read the scene.', 'Darkness is intentional.'],
    intensityDefault: 'strong',
  },
  {
    id: 'film_emulation_light',
    label: 'Film emulation light',
    description: 'Subtle filmic tone without heavy grain or vintage cliche.',
    bestUseCases: ['Premium story', 'cinematic lifestyle', 'soft branded film'],
    defaultForCategories: ['storytelling', 'lifestyle'],
    defaultForEditLevels: ['premium'],
    correctionOperations: [...baselineCorrection, 'highlight_recovery'],
    lookOperations: ['lut_application', 'look_transform', 'generated_asset_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Generated images/keyframes should match the subtle film tone.'],
    avoidRules: ['Avoid heavy vintage LUTs.', 'Avoid aggressive grain.'],
    qaChecks: ['Film feel remains subtle.', 'Shot matching survives LUT planning.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'muted_editorial',
    label: 'Muted editorial',
    description: 'Soft restrained editorial palette for serious or refined work.',
    bestUseCases: ['Editorial', 'documentary', 'fashion/brand', 'serious reflective content'],
    defaultForCategories: ['documentary_case_study', 'lifestyle'],
    defaultForEditLevels: ['premium'],
    correctionOperations: [...baselineCorrection, 'saturation', 'contrast_curve'],
    lookOperations: ['look_transform', 'generated_asset_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Generated assets should avoid loud color pops.'],
    avoidRules: ['Avoid lifeless skin.', 'Avoid reducing product clarity.'],
    qaChecks: ['Muted look remains appealing.', 'Faces retain life.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'high_key_clean',
    label: 'High-key clean',
    description: 'Bright airy clean grade with protected highlights.',
    bestUseCases: ['Beauty', 'education', 'clean lifestyle', 'product'],
    defaultForCategories: ['education_explainer', 'business_brand'],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'white_point', 'highlight_recovery'],
    lookOperations: ['generated_asset_match', 'panel_background_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Cards and panels should match bright clean whites.'],
    avoidRules: ['Avoid blown highlights.', 'Avoid sterile skin.'],
    qaChecks: ['Whites stay clean.', 'Highlights retain detail.'],
    intensityDefault: 'balanced',
  },
  {
    id: 'monochrome',
    label: 'Monochrome',
    description: 'Black-and-white or single-tone styling for intentional sections.',
    bestUseCases: ['Flashbacks', 'memory', 'serious emphasis', 'custom stylized sections'],
    defaultForCategories: [],
    defaultForEditLevels: ['premium'],
    correctionOperations: [...baselineCorrection, 'black_point', 'white_point'],
    lookOperations: ['look_transform', 'generated_asset_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Generated monochrome assets should preserve luminance hierarchy.'],
    avoidRules: ['Avoid monochrome unless requested or clearly justified.'],
    qaChecks: ['Monochrome supports intent.', 'Luminance hierarchy remains clear.'],
    intensityDefault: 'stylized',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'User-defined look mapped to safe professional correction and custom directive notes.',
    bestUseCases: ['User requested custom looks', 'brand-specific references'],
    defaultForCategories: [],
    defaultForEditLevels: ['pro', 'premium'],
    correctionOperations: [...baselineCorrection, 'highlight_recovery'],
    lookOperations: ['look_transform', 'generated_asset_match', 'panel_background_match'],
    generatedAssetRules: [...basicGeneratedAssetRules, 'Custom look must still preserve source footage and panel consistency.'],
    avoidRules: ['Avoid random unstructured color presets.', 'Avoid violating documentary/fact tone.'],
    qaChecks: ['Custom look maps back to user intent.', 'Professional baseline remains intact.'],
    intensityDefault: 'balanced',
  },
]

export function getColorGradePreset(style: ColorGradeStyleId) {
  return colorGradePresets.find((preset) => preset.id === style) ?? colorGradePresets[0]
}

export function getDefaultColorGradeForCategory(params: {
  editingCategory: EditingCategory
  editLevel: EditLevel
  moodStyle?: MoodStyle
  professionalDirective?: ProfessionalEditingDirective
  customInstructions?: string
}): ColorGradeStyleId {
  const { customInstructions = '', editLevel, editingCategory, moodStyle, professionalDirective } = params
  const text = `${customInstructions} ${moodStyle ?? ''}`.toLowerCase()

  if (professionalDirective?.colorGradeStyle && professionalDirective.colorGradeStyle !== 'custom') {
    return professionalDirective.colorGradeStyle
  }

  if (text.includes('black and white') || text.includes('monochrome')) return 'monochrome'
  if (text.includes('warm') || text.includes('cozy')) return editLevel === 'basic' ? 'clean_natural' : 'warm_lifestyle'
  if (text.includes('documentary') || text.includes('neutral') || text.includes('case')) return 'documentary_neutral'
  if (text.includes('cinematic') || text.includes('emotional')) return editLevel === 'basic' ? 'clean_natural' : 'cinematic_contrast'
  if (text.includes('luxury') || text.includes('real estate') || text.includes('property')) return editLevel === 'basic' ? 'clean_natural' : 'luxury_real_estate'
  if (text.includes('corporate') || text.includes('business') || text.includes('saas')) return editLevel === 'basic' ? 'clean_natural' : 'corporate_neutral'

  if (editingCategory === 'documentary_case_study') return 'documentary_neutral'
  if (editingCategory === 'business_brand') return editLevel === 'basic' ? 'clean_natural' : 'premium_clean'
  if (editingCategory === 'education_explainer') return editLevel === 'premium' ? 'corporate_neutral' : 'clean_natural'
  if (editingCategory === 'storytelling') return editLevel === 'basic' ? 'clean_natural' : 'cinematic_contrast'
  if (editingCategory === 'lifestyle') return editLevel === 'basic' ? 'clean_natural' : 'warm_lifestyle'

  return 'clean_natural'
}

export function getColorOperationsForGrade(style: ColorGradeStyleId, editLevel: EditLevel) {
  const preset = getColorGradePreset(style)
  const correctionOperations = editLevel === 'basic'
    ? Array.from(new Set([...baselineCorrection, ...preset.correctionOperations])).filter((operation) => operation !== 'lut_application')
    : Array.from(new Set([...baselineCorrection, ...preset.correctionOperations]))
  const lookOperations = editLevel === 'basic'
    ? []
    : preset.lookOperations

  return {
    correctionOperations,
    lookOperations,
  }
}

export function getColorPresetForEditLevel(editLevel: EditLevel, style: ColorGradeStyleId) {
  if (editLevel === 'basic') {
    return getColorGradePreset(style === 'documentary_neutral' ? 'documentary_neutral' : 'clean_natural')
  }

  return getColorGradePreset(style)
}
