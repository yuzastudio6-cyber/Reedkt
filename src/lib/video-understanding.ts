import { createAdaptiveEditStrategy } from './adaptive-edit-strategy'
import type {
  AudioQualityIssue,
  AudioUnderstandingReport,
  ClipAnalysisRole,
  ClipSource,
  ClipSourceRole,
  ClipUnderstandingItem,
  CompiledEditingIntent,
  EditingCategory,
  PlannerInput,
  SignatureSystem,
  SpeakerVisualLayoutMode,
  ToolStrategyHint,
  VideoUnderstandingConfidence,
  VideoUnderstandingReport,
  VisualQualityIssue,
  VisualSupportOpportunity,
  VisualSupportOpportunityType,
  VisualUnderstandingReport,
  TranscriptMeaningReport,
} from '../types/reeditpro'

type CreateMockVideoUnderstandingReportParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
}

type OpportunitySeed = {
  type: VisualSupportOpportunityType
  label: string
  reason: string
  priority?: 'low' | 'medium' | 'high'
  clipId?: string
}

const CONTACT_OBJECT_PATTERN =
  /\b(pole|chair|table|phone|laptop|microphone|mic|product|steering wheel|bag|tool|counter|desk|bike|door frame|doorway|podium|railing)\b/i

function normalizeText(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function addUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item]
}

function roleFromSourceRole(role?: ClipSourceRole): ClipAnalysisRole | undefined {
  if (!role) return undefined

  if (
    role === 'main_story' ||
    role === 'hook_candidate' ||
    role === 'context' ||
    role === 'proof' ||
    role === 'b_roll' ||
    role === 'speaker' ||
    role === 'product' ||
    role === 'transition' ||
    role === 'ending' ||
    role === 'optional' ||
    role === 'unknown'
  ) {
    return role
  }

  return undefined
}

function inferClipRole(
  clip: ClipSource,
  input: PlannerInput,
  combinedText: string,
): ClipAnalysisRole {
  if (clip.isOptional) return 'optional'

  const sourceRole = roleFromSourceRole(clip.sourceRole)
  if (sourceRole && sourceRole !== 'unknown') return sourceRole

  const text = normalizeText([clip.fileName, clip.detectedType, clip.notes, combinedText])

  if (/\b(screen|dashboard|app|website|browser|saas|page|recording)\b/.test(text)) {
    return 'screen_recording'
  }

  if (/\b(speaker|talking|interview|founder|creator|teacher|host|podcast)\b/.test(text)) {
    return 'speaker'
  }

  if (/\bhook\b/.test(text)) return 'hook_candidate'
  if (/\b(product|demo|feature|phone|laptop|tool)\b/.test(text)) return 'product'
  if (/\b(proof|evidence|document|claim|receipt|money|timeline|case)\b/.test(text)) return 'proof'
  if (/\b(ending|cta|outro|recap|close)\b/.test(text)) return 'ending'

  if (/\b(kitchen|exterior|room|walkthrough|travel|location|route|street|neighborhood|city|house|map)\b/.test(text)) {
    return input.editingCategory === 'lifestyle' || input.workflowType === 'real_estate_property_tour'
      ? 'location'
      : 'b_roll'
  }

  if (clip.uploadedOrder === 1) return 'main_story'
  return 'context'
}

function confidenceForClip(clip: ClipSource, role: ClipAnalysisRole): VideoUnderstandingConfidence {
  if (clip.isImportant || (clip.sourceRole && clip.sourceRole !== 'unknown')) return 'high'
  if (role === 'unknown') return 'low'
  return 'medium'
}

function transcriptSummaryForCategory(category: EditingCategory, customInstructions: string): string {
  const instructionContext = customInstructions
    ? ` The user's instructions emphasize: ${customInstructions}`
    : ''

  switch (category) {
    case 'storytelling':
      return `Mock transcript meaning: story setup, trigger, reaction, and consequence are the likely spine.${instructionContext}`
    case 'education_explainer':
      return `Mock transcript meaning: concept, steps, explanation, example, and takeaway should drive the edit.${instructionContext}`
    case 'business_brand':
      return `Mock transcript meaning: problem, product or feature, benefit, proof, and CTA are the likely structure.${instructionContext}`
    case 'documentary_case_study':
      return `Mock transcript meaning: case setup, people or organizations, timeline, evidence, claim context, and outcome need careful treatment.${instructionContext}`
    case 'lifestyle':
      return `Mock transcript meaning: natural moment, atmosphere, personal rhythm, and simple story should stay central.${instructionContext}`
    default:
      return `Mock transcript meaning follows the user's selected workflow and instructions.${instructionContext}`
  }
}

function roleOpportunityTypes(role: ClipAnalysisRole): VisualSupportOpportunityType[] {
  switch (role) {
    case 'screen_recording':
      return ['screen_capture', 'picture_in_picture']
    case 'product':
      return ['graphic_explainer', 'real_motion']
    case 'proof':
      return ['fact_card', 'evidence_board']
    case 'location':
      return ['map_animation', 'b_roll_cutaway']
    case 'b_roll':
      return ['b_roll_cutaway']
    case 'hook_candidate':
      return ['caption_only', 'stroke_motion']
    case 'speaker':
      return ['caption_only', 'lower_panel_visual']
    case 'ending':
      return ['caption_only']
    default:
      return ['caption_only']
  }
}

function visualSummaryForRole(role: ClipAnalysisRole): string {
  switch (role) {
    case 'speaker':
    case 'hook_candidate':
      return 'Speaker-first footage likely needs face-safe captions and restrained supporting visuals.'
    case 'screen_recording':
      return 'Screen or app footage likely needs readable interface framing and highlight zones.'
    case 'product':
      return 'Product footage likely needs object-safe framing and concise feature callouts.'
    case 'proof':
      return 'Proof footage likely needs neutral labels, source context, and claim-safe visual treatment.'
    case 'location':
      return 'Location footage likely benefits from map, route, or environment context when useful.'
    case 'b_roll':
      return 'B-roll can support spoken points if it is meaning-matched rather than random.'
    default:
      return 'Mock visual read is based on filename, clip notes, role, and project instructions only.'
  }
}

function audioSummaryForRole(role: ClipAnalysisRole): string {
  if (role === 'speaker' || role === 'hook_candidate' || role === 'main_story') {
    return 'Voice clarity and pacing cleanup are likely important for this clip.'
  }

  if (role === 'b_roll' || role === 'location') {
    return 'Natural sound may be useful, but voiceover and music ducking should stay controlled.'
  }

  return 'Professional cleanup and loudness matching should be planned before approval.'
}

function visualQualityIssuesForText(text: string): VisualQualityIssue[] {
  let issues: VisualQualityIssue[] = []

  if (/\b(low light|dark|underexposed)\b/i.test(text)) issues = addUnique(issues, 'low_light')
  if (/\b(overexposed|too bright|blown out)\b/i.test(text)) issues = addUnique(issues, 'overexposed')
  if (/\b(shaky|handheld)\b/i.test(text)) issues = addUnique(issues, 'shaky')
  if (/\b(blurry|soft focus)\b/i.test(text)) issues = addUnique(issues, 'blurry')
  if (/\b(busy background|clutter)\b/i.test(text)) issues = addUnique(issues, 'busy_background')
  if (/\b(face low|face too low)\b/i.test(text)) issues = addUnique(issues, 'face_too_low')
  if (/\b(face high|face too high)\b/i.test(text)) issues = addUnique(issues, 'face_too_high')
  if (/\b(product obscured|covered product)\b/i.test(text)) issues = addUnique(issues, 'product_obscured')
  if (/\b(caption|subtitle|safe zone)\b/i.test(text)) issues = addUnique(issues, 'caption_safe_zone_risk')

  return issues.length > 0 ? issues : ['none']
}

function audioQualityIssuesForText(text: string): AudioQualityIssue[] {
  let issues: AudioQualityIssue[] = []

  if (/\b(noise|background noise|hiss)\b/i.test(text)) issues = addUnique(issues, 'background_noise')
  if (/\b(uneven loudness|volume changes|loudness)\b/i.test(text)) issues = addUnique(issues, 'uneven_loudness')
  if (/\b(too quiet|quiet voice)\b/i.test(text)) issues = addUnique(issues, 'too_quiet')
  if (/\b(clipping|distorted)\b/i.test(text)) issues = addUnique(issues, 'clipping')
  if (/\b(echo|reverb)\b/i.test(text)) issues = addUnique(issues, 'echo')
  if (/\b(music over voice|music too loud)\b/i.test(text)) issues = addUnique(issues, 'music_over_voice')
  if (/\b(silence|dead space)\b/i.test(text)) issues = addUnique(issues, 'long_silence')
  if (/\b(filler|um|uh)\b/i.test(text)) issues = addUnique(issues, 'many_fillers')

  return issues.length > 0 ? issues : ['none']
}

function signatureForOpportunity(type: VisualSupportOpportunityType): SignatureSystem {
  switch (type) {
    case 'stroke_motion':
      return 'stroke_motion'
    case 'real_motion':
      return 'real_motion'
    case 'caption_only':
    case 'b_roll_cutaway':
    case 'no_extra_visual':
      return 'none'
    default:
      return 'graphic_design'
  }
}

function layoutForOpportunity(type: VisualSupportOpportunityType): SpeakerVisualLayoutMode | undefined {
  switch (type) {
    case 'map_animation':
      return 'full_map_takeover'
    case 'screen_capture':
      return 'screen_capture_with_speaker_pip'
    case 'evidence_board':
      return 'full_evidence_board'
    case 'chart_or_diagram':
    case 'graphic_explainer':
      return 'full_graphic_explainer'
    case 'timeline_card':
    case 'fact_card':
    case 'name_card':
    case 'full_visual_takeover':
      return 'voiceover_visual_takeover'
    case 'lower_panel_visual':
      return 'lower_visual_panel'
    case 'picture_in_picture':
      return 'picture_in_picture_speaker'
    case 'b_roll_cutaway':
      return 'b_roll_cutaway'
    case 'stroke_motion':
      return 'full_stroke_motion_scene'
    case 'caption_only':
    case 'no_extra_visual':
      return 'full_speaker'
    default:
      return undefined
  }
}

function toolHintsForOpportunity(type: VisualSupportOpportunityType, input: PlannerInput): ToolStrategyHint[] {
  switch (type) {
    case 'map_animation':
      return ['map_tool', 'remotion_layout']
    case 'screen_capture':
      return ['browser_capture_tool', 'remotion_layout']
    case 'chart_or_diagram':
    case 'graphic_explainer':
      return ['chart_tool', 'gpt_image_asset', 'remotion_layout']
    case 'evidence_board':
    case 'timeline_card':
    case 'fact_card':
    case 'name_card':
      return ['gpt_image_asset', 'remotion_layout']
    case 'stroke_motion':
    case 'real_motion':
      return input.editLevel === 'basic'
        ? ['gpt_image_asset', 'remotion_layout']
        : ['gpt_image_asset', 'wan_animation', 'hailuo_fallback']
    case 'caption_only':
    case 'no_extra_visual':
      return ['remotion_layout']
    default:
      return ['remotion_layout']
  }
}

function creditImpactForOpportunity(
  type: VisualSupportOpportunityType,
  input: PlannerInput,
): VisualSupportOpportunity['creditImpact'] {
  if (type === 'caption_only' || type === 'no_extra_visual') return 'none'
  if (type === 'b_roll_cutaway' || type === 'still_card' || type === 'lower_panel_visual') return 'low'
  if (input.editLevel === 'basic') return 'low'
  if (type === 'real_motion') return input.editLevel === 'premium' ? 'premium' : 'high'
  if (type === 'stroke_motion' || type === 'map_animation' || type === 'screen_capture') return 'medium'
  return input.editLevel === 'premium' ? 'high' : 'medium'
}

function createOpportunity(
  seed: OpportunitySeed,
  input: PlannerInput,
  index: number,
): VisualSupportOpportunity {
  const type = seed.type

  return {
    id: `video-opportunity-${index + 1}`,
    clipId: seed.clipId,
    opportunityType: type,
    label: seed.label,
    reason: seed.reason,
    suggestedSignatureSystem: signatureForOpportunity(type),
    suggestedLayoutMode: layoutForOpportunity(type),
    suggestedToolHints: toolHintsForOpportunity(type, input),
    creditImpact: creditImpactForOpportunity(type, input),
    priority: seed.priority ?? 'medium',
    qaChecks: [
      'Use this opportunity only if it supports the spoken meaning.',
      'Keep captions, faces, products, and important labels readable.',
      'Respect edit level, approval, and provider routing rules.',
    ],
  }
}

function addOpportunitySeed(seeds: OpportunitySeed[], seed: OpportunitySeed): OpportunitySeed[] {
  const exists = seeds.some((item) => item.type === seed.type && item.clipId === seed.clipId)
  return exists ? seeds : [...seeds, seed]
}

function opportunitySeedsFromText(input: PlannerInput, text: string, clips: ClipSource[]): OpportunitySeed[] {
  let seeds: OpportunitySeed[] = []

  if (/\b(no extra visual|no visuals|minimal visual|keep visuals minimal|simple captions|caption only)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: input.visualPreference === 'no_extra_visuals' ? 'no_extra_visual' : 'caption_only',
      label: 'Speaker-first restraint',
      reason: 'The user request suggests the video should stay clean instead of adding heavy visuals.',
      priority: 'high',
    })
  }

  if (/\b(money|account|accounts|flow|scam|fraud|trail|payment|funds|fake)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: 'chart_or_diagram',
      label: 'Money or flow diagram',
      reason: 'The spoken point likely needs a structured visual to explain relationships or movement.',
      priority: 'high',
    })
    seeds = addOpportunitySeed(seeds, {
      type: 'timeline_card',
      label: 'Timeline support',
      reason: 'The report expects sequence clarity around claims, steps, or events.',
      priority: 'medium',
    })
  }

  if (/\b(evidence|document|source|claim|case|investigation|allegation)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: 'evidence_board',
      label: 'Evidence context',
      reason: 'Documentary or claim-heavy material needs neutral source and timeline context.',
      priority: 'high',
    })
  }

  if (/\b(name|person|people|founder|victim|client|customer|suspect|company)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: 'name_card',
      label: 'Name and role card',
      reason: 'Named or role-based people should be introduced clearly without over-visualizing claims.',
      priority: 'medium',
    })
  }

  if (/\b(map|route|city|location|travel|country|neighborhood|real estate|distance|geography|behind the person|map behind)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: 'map_animation',
      label: 'Location or route map',
      reason: 'Geography is part of the viewer understanding, so a map can clarify the beat.',
      priority: 'high',
    })
  }

  if (/\b(website|app|dashboard|saas|browser|article|page|screen recording|screen capture)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: 'screen_capture',
      label: 'Screen capture focus',
      reason: 'The project references a web, app, dashboard, or article moment that needs visual clarity.',
      priority: 'high',
    })
  }

  if (/\b(emotional|reaction|personal story|trust|authentic|pregnant|surprise|confession|heartfelt)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: 'stroke_motion',
      label: 'Emotional story visualization',
      reason: 'The spoken beat appears emotional, so speaker-first or restrained Stroke Motion may help.',
      priority: 'medium',
    })
  }

  if (/\b(product|feature|demo|benefit|offer|launch|showcase)\b/i.test(text)) {
    seeds = addOpportunitySeed(seeds, {
      type: 'graphic_explainer',
      label: 'Product or feature explainer',
      reason: 'Product details benefit from concise callouts or structured feature framing.',
      priority: 'medium',
    })
  }

  clips.forEach((clip) => {
    const clipText = normalizeText([clip.fileName, clip.detectedType, clip.notes])
    if (/\b(b-roll|b roll|cutaway|environment|exterior|room|kitchen)\b/i.test(clipText)) {
      seeds = addOpportunitySeed(seeds, {
        type: 'b_roll_cutaway',
        clipId: clip.id,
        label: `B-roll from ${clip.fileName}`,
        reason: 'Uploaded support footage can clarify the spoken point without generating a new visual.',
        priority: 'medium',
      })
    }
  })

  if (input.visualPreference === 'no_extra_visuals') {
    seeds = addOpportunitySeed(seeds, {
      type: 'no_extra_visual',
      label: 'No extra visual request',
      reason: 'The selected visual preference says to avoid extra visuals.',
      priority: 'high',
    })
  } else if (input.visualPreference === 'keep_visuals_minimal') {
    seeds = addOpportunitySeed(seeds, {
      type: 'caption_only',
      label: 'Minimal visual support',
      reason: 'The selected visual preference favors clean captions and simple support only.',
      priority: 'high',
    })
  }

  if (seeds.length === 0) {
    seeds = addOpportunitySeed(seeds, {
      type: input.editLevel === 'basic' ? 'caption_only' : 'still_card',
      label: 'Clean support visual',
      reason: 'The mock report did not find a stronger specific visual need, so keep the edit restrained.',
      priority: 'low',
    })
  }

  return seeds.slice(0, 8)
}

function transcriptReport(input: PlannerInput, opportunityTypes: VisualSupportOpportunityType[]): TranscriptMeaningReport {
  const text = normalizeText([input.customInstructions, input.projectName, input.workflowType])
  const hookLines = /\b(hook|opening|first seconds|grab)\b/i.test(text)
    ? ['Mock hook candidate from user instructions: open with the strongest direct line.']
    : ['Mock hook candidate: use the clearest first-person or problem statement if present.']

  return {
    summary: transcriptSummaryForCategory(input.editingCategory, input.customInstructions),
    keyPhrases: [
      input.projectName,
      input.editingCategory.replaceAll('_', ' '),
      input.moodStyle.replaceAll('_', ' '),
    ].filter(Boolean),
    hookLines,
    emotionalLines: /\b(emotional|reaction|personal|trust|authentic|heartfelt|surprise)\b/i.test(text)
      ? ['Mock emotional line cue: keep the speaker visible where the human reaction carries trust.']
      : [],
    explanationLines: opportunityTypes.some((type) =>
      ['chart_or_diagram', 'graphic_explainer', 'screen_capture'].includes(type),
    )
      ? ['Mock explanation cue: give the visual enough room where exact explanation matters.']
      : [],
    proofOrClaimLines: opportunityTypes.some((type) =>
      ['evidence_board', 'fact_card', 'timeline_card'].includes(type),
    )
      ? ['Mock proof cue: keep claims neutral and distinguish evidence from allegation.']
      : [],
    ctaLines: /\b(cta|call to action|subscribe|book|buy|sign up|outro)\b/i.test(text)
      ? ['Mock CTA cue: close with a clean direct action.']
      : [],
    unclearLines: input.sourceOrderConfirmed ? [] : ['Source order is not confirmed, so story intent remains draft.'],
    visualSupportNeeded: opportunityTypes,
    captionDensityRecommendation:
      input.targetPlatform === 'tiktok_reels_shorts' || input.editingCategory === 'education_explainer'
        ? 'high'
        : input.editLevel === 'basic'
          ? 'medium'
          : 'medium',
    notes: [
      'Transcript meaning is inferred from settings and instructions only.',
      'Future transcript workers should replace these mock lines before execution.',
    ],
  }
}

function visualReport(
  input: PlannerInput,
  text: string,
  clips: ClipUnderstandingItem[],
): VisualUnderstandingReport {
  const contactObjects = CONTACT_OBJECT_PATTERN.test(text)
    ? ['Planned contact object cue found in instructions; future worker should confirm before masking.']
    : []

  const hasDepthCue = /\b(behind me|behind the person|behind subject|in the scene|in depth|foreground|object in front|map behind|card behind|pole)\b/i.test(
    text,
  )

  const colorIssues = Array.from(
    new Set(clips.flatMap((clip) => clip.visualQualityIssues)),
  ).filter((issue) => issue !== 'none')

  return {
    sceneTypeSummary:
      clips.length > 0
        ? `Mock scene read across ${clips.length} clip${clips.length === 1 ? '' : 's'} based on filenames, clip notes, source roles, and project settings.`
        : 'No clips are attached, so visual understanding is limited to user instructions and settings.',
    speakerFraming:
      input.aspectRatio === '9:16'
        ? 'Expect vertical speaker framing; protect face and caption safe zones.'
        : 'Expect room for speaker plus visual zones when the segment needs both.',
    faceSafeZoneNotes: [
      'Keep captions away from the face and mouth when the speaker carries trust or emotion.',
      'Do not cover the face with maps, cards, or callouts.',
    ],
    productSafeZoneNotes: [
      'If a product or screen is the hero object, reserve readable space around it.',
    ],
    emptySpaceOpportunities: [
      input.aspectRatio === '9:16'
        ? 'Use lower panel space when the speaker should stay primary.'
        : 'Use side or corner zones for visuals when the speaker remains important.',
    ],
    foregroundOpportunities: hasDepthCue
      ? ['Foreground-aware overlay requested; future worker must verify subject/object boundaries.']
      : [],
    contactObjectOpportunities: contactObjects,
    depthCompositionOpportunities: hasDepthCue
      ? ['Depth-aware map/card placement may improve the illusion if risk stays manageable.']
      : [],
    brollQualityNotes: clips.some((clip) => clip.detectedRole === 'b_roll' || clip.detectedRole === 'location')
      ? ['Uploaded b-roll/location footage should be used when it meaningfully supports the line.']
      : [],
    colorLightingIssues: colorIssues.length > 0 ? colorIssues : ['none'],
    notes: [
      'No real scene, object, face, or mask analysis has been run.',
      'Visual understanding is deterministic mock planning only.',
    ],
  }
}

function audioReport(input: PlannerInput, text: string): AudioUnderstandingReport {
  const issues = audioQualityIssuesForText(text)
  const speakerHeavy =
    input.editingCategory === 'storytelling' ||
    input.editingCategory === 'education_explainer' ||
    input.workflowType === 'talking_head_personal_brand' ||
    input.workflowType === 'podcast_clip'

  return {
    voiceClarity: speakerHeavy ? 'good' : 'fair',
    musicPresent: /\b(music|song|beat|soundtrack)\b/i.test(text),
    noiseLevel: issues.includes('background_noise') ? 'high' : 'low',
    loudnessConsistency: issues.includes('uneven_loudness') ? 'fair' : 'good',
    cleanupNeeded: true,
    soundSyncOpportunities: [
      'Use SoundSync to align captions, cuts, music ducking, and key visual beats.',
      input.editLevel === 'basic'
        ? 'Keep audio work professional but lower-compute.'
        : 'Use tighter audio/visual timing where it improves retention.',
    ],
    audioIssues: issues,
    notes: [
      'Audio understanding is mock-only and does not inspect waveform, transcript, or loudness.',
      'Future workers should replace this with real voice, silence, music, and noise analysis.',
    ],
  }
}

function clipUnderstanding(
  input: PlannerInput,
  combinedText: string,
): ClipUnderstandingItem[] {
  return input.clips.map((clip) => {
    const clipText = normalizeText([clip.fileName, clip.detectedType, clip.notes, input.customInstructions])
    const role = inferClipRole(clip, input, combinedText)
    const opportunities = roleOpportunityTypes(role)
    const visualIssues = visualQualityIssuesForText(clipText)
    const audioIssues = audioQualityIssuesForText(clipText)

    return {
      clipId: clip.id,
      uploadedOrder: clip.uploadedOrder,
      fileName: clip.fileName,
      duration: clip.duration,
      detectedRole: role,
      roleConfidence: confidenceForClip(clip, role),
      transcriptSummary: `Mock transcript cue for ${clip.fileName}: use metadata and user instructions until real transcript analysis exists.`,
      visualSummary: visualSummaryForRole(role),
      audioSummary: audioSummaryForRole(role),
      strongMoments: clip.isImportant
        ? ['User marked this clip important; preserve its strongest meaning in the edit plan.']
        : role === 'hook_candidate'
          ? ['Possible hook moment based on clip role or filename.']
          : [],
      weakMoments: clip.isOptional
        ? ['Optional clip; use only if it improves clarity or pacing.']
        : [],
      hookCandidates: role === 'hook_candidate' || clip.uploadedOrder === 1
        ? ['Potential opening line or visual hook from this source order position.']
        : [],
      brollOpportunities:
        role === 'b_roll' || role === 'location'
          ? ['Use as meaning-matched b-roll instead of random stock-like footage.']
          : [],
      visualSupportOpportunities: opportunities,
      toolStrategyHints: Array.from(
        new Set(opportunities.flatMap((type) => toolHintsForOpportunity(type, input))),
      ),
      visualQualityIssues: visualIssues,
      audioQualityIssues: audioIssues,
      safeZoneNotes: [
        'Reserve caption safe zones before placing cards, labels, or speaker PIP.',
      ],
      faceOrSpeakerNotes:
        role === 'speaker' || role === 'hook_candidate'
          ? ['Speaker face may carry trust or emotion; keep it visible when the line is human.']
          : [],
      productOrObjectNotes:
        role === 'product' || role === 'screen_recording'
          ? ['Protect product/interface readability and avoid covering key labels.']
          : [],
      foregroundDepthNotes: CONTACT_OBJECT_PATTERN.test(clipText)
        ? ['Planned contact-object cue from metadata; future worker must detect/confirm before masking.']
        : [],
      aiNotes: [
        'Mock-only clip understanding; no real media analysis was run.',
      ],
    }
  })
}

export function createMockVideoUnderstandingReport({
  input,
  compiledIntent,
}: CreateMockVideoUnderstandingReportParams): VideoUnderstandingReport {
  const combinedText = normalizeText([
    input.projectName,
    input.workflowType,
    input.editingCategory,
    input.moodStyle,
    input.visualPreference,
    input.customInstructions,
    compiledIntent?.goalSummary,
    ...input.clips.flatMap((clip) => [clip.fileName, clip.detectedType, clip.notes, clip.sourceRole]),
  ])

  const clips = clipUnderstanding(input, combinedText)
  const seeds = opportunitySeedsFromText(input, combinedText, input.clips)
  const opportunities = seeds.map((seed, index) => createOpportunity(seed, input, index))
  const opportunityTypes = Array.from(new Set(opportunities.map((opportunity) => opportunity.opportunityType)))
  const transcriptMeaning = transcriptReport(input, opportunityTypes)
  const visualUnderstanding = visualReport(input, combinedText, clips)
  const audioUnderstanding = audioReport(input, combinedText)
  const suggestedStrategy = createAdaptiveEditStrategy({
    input,
    opportunities,
    compiledIntent,
  })
  const sourceOrderConfirmed = Boolean(input.sourceOrderConfirmed)
  const confidence: VideoUnderstandingConfidence =
    input.clips.length === 0 ? 'low' : sourceOrderConfirmed ? 'high' : 'medium'

  return {
    id: 'video-understanding-report-v1',
    sourceSequenceMode: input.sourceSequenceMode,
    sourceOrderConfirmed,
    overallSummary:
      input.clips.length > 0
        ? `Mock video understanding found ${input.clips.length} source clip${input.clips.length === 1 ? '' : 's'} and ${opportunities.length} visual support opportunity${opportunities.length === 1 ? '' : 'ies'} for a ${input.editingCategory.replaceAll('_', ' ')} edit.`
        : 'Mock video understanding is limited because no clips are attached yet.',
    clips,
    transcriptMeaning,
    visualUnderstanding,
    audioUnderstanding,
    visualSupportOpportunities: opportunities,
    suggestedStrategy,
    confidence,
    limitations: [
      'Mock-only report; no real media analysis has been run.',
      'Future workers should replace mock analysis with transcript, visual, and audio analysis.',
    ],
    qaConcerns: [
      sourceOrderConfirmed
        ? 'Source order is confirmed for planning.'
        : 'Source order is not confirmed; approval should stay blocked or warned until resolved.',
      'Verify visual opportunities are used only where they support the beat.',
      'Verify safe-zone notes are reflected in captions, layout, and prompt plans.',
    ],
    notes: [
      'Video understanding is advisory and must not override explicit user instructions.',
      'This report is deterministic frontend mock planning only.',
    ],
  }
}
