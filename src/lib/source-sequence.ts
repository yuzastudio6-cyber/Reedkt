import type {
  ClipSource,
  ClipSourceRole,
  SourceSequenceMode,
  SourceSequenceReviewState,
} from '../types/reeditpro'

export type SourceSequenceMoveDirection = 'left' | 'right' | 'up' | 'down'

export const clipSourceRoleOptions: ClipSourceRole[] = [
  'main_story',
  'hook_candidate',
  'context',
  'proof',
  'b_roll',
  'speaker',
  'product',
  'transition',
  'ending',
  'optional',
  'unknown',
]

export const sourceSequenceModeOptions: SourceSequenceMode[] = [
  'single_complete_video',
  'multi_clip_story_order',
  'unordered_clips_needs_ai_help',
  'b_roll_plus_main_clip',
  'mixed_assets',
]

function normalizeClipOrder(clips: ClipSource[]) {
  return clips.map((clip, index) => ({
    ...clip,
    uploadedOrder: index + 1,
  }))
}

export function inferClipSourceRole(clip: ClipSource): ClipSourceRole {
  const text = `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''}`.toLowerCase()

  if (clip.isOptional) {
    return 'optional'
  }

  if (/b.?roll|detail|cutaway|insert|support/.test(text)) {
    return 'b_roll'
  }

  if (/hook|opening|intro/.test(text) || clip.uploadedOrder === 1) {
    return 'hook_candidate'
  }

  if (/proof|evidence|case|money|timeline/.test(text)) {
    return 'proof'
  }

  if (/speaker|talking|narration|founder|creator|teacher/.test(text)) {
    return 'speaker'
  }

  if (/product|dashboard|feature|screen/.test(text)) {
    return 'product'
  }

  if (/ending|cta|recap|outcome|close/.test(text)) {
    return 'ending'
  }

  return clip.isImportant ? 'main_story' : 'context'
}

export function reorderClipsByMove(
  clips: ClipSource[],
  clipId: string,
  direction: SourceSequenceMoveDirection,
) {
  const index = clips.findIndex((clip) => clip.id === clipId)
  const offset = direction === 'left' || direction === 'up' ? -1 : 1
  const targetIndex = index + offset

  if (index < 0 || targetIndex < 0 || targetIndex >= clips.length) {
    return normalizeClipOrder(clips)
  }

  const next = [...clips]
  const movingClip = next[index]
  next[index] = next[targetIndex]
  next[targetIndex] = movingClip

  return normalizeClipOrder(next)
}

export function inferSourceSequenceMode(
  clips: ClipSource[],
  customInstructions = '',
): SourceSequenceMode {
  if (clips.length === 0) {
    return 'mixed_assets'
  }

  if (clips.length === 1) {
    return 'single_complete_video'
  }

  if (/not in order|out of order|you decide|pick best|choose best|ai decide|find best/i.test(customInstructions)) {
    return 'unordered_clips_needs_ai_help'
  }

  const supportingClips = clips.filter((clip) => {
    const text = `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''} ${clip.sourceRole ?? ''}`
    const inferredRole = clip.sourceRole ?? inferClipSourceRole(clip)
    return clip.isOptional ||
      inferredRole === 'b_roll' ||
      inferredRole === 'proof' ||
      inferredRole === 'product' ||
      /b.?roll|detail|proof|cutaway|support|insert|product|screen|dashboard/i.test(text)
  })

  if (supportingClips.length >= Math.ceil(clips.length / 2)) {
    return 'b_roll_plus_main_clip'
  }

  return 'multi_clip_story_order'
}

export function getClipRoleLabel(role: ClipSourceRole = 'unknown') {
  const labels: Record<ClipSourceRole, string> = {
    b_roll: 'B-roll',
    context: 'Context',
    ending: 'Ending',
    hook_candidate: 'Hook candidate',
    main_story: 'Main story',
    optional: 'Optional',
    product: 'Product',
    proof: 'Proof',
    speaker: 'Speaker',
    transition: 'Transition',
    unknown: 'Unknown',
  }

  return labels[role]
}

export function getSourceSequenceModeLabel(mode: SourceSequenceMode) {
  const labels: Record<SourceSequenceMode, string> = {
    b_roll_plus_main_clip: 'Main clip + b-roll',
    mixed_assets: 'Mixed assets',
    multi_clip_story_order: 'Multi-clip story order',
    single_complete_video: 'Single complete video',
    unordered_clips_needs_ai_help: 'Unordered clips / AI help',
  }

  return labels[mode]
}

export function getSourceSequenceModeHelper(mode: SourceSequenceMode) {
  const helpers: Record<SourceSequenceMode, string> = {
    b_roll_plus_main_clip: 'Use main clips as source story context and optional/support clips as b-roll or proof.',
    mixed_assets: 'Review each asset role so ReeditPro understands source meaning before planning.',
    multi_clip_story_order: 'Use uploaded order as the intended story/source sequence.',
    single_complete_video: 'Use this one file as the complete source video.',
    unordered_clips_needs_ai_help: 'Keep uploaded order as context while allowing ReeditPro to suggest a final structure in the plan.',
  }

  return helpers[mode]
}

export function createSourceSequenceReviewState(params: {
  clips: ClipSource[]
  mode?: SourceSequenceMode
  confirmed?: boolean
  customInstructions?: string
  userGuidance?: string
  aiNotes?: string[]
}): SourceSequenceReviewState {
  const mode = params.mode ?? inferSourceSequenceMode(params.clips, params.customInstructions)
  const confirmed = params.confirmed ?? false

  return {
    mode,
    confirmed,
    userGuidance: params.userGuidance,
    aiNotes: [
      summarizeSourceSequence(params.clips),
      getSourceSequenceModeHelper(mode),
      confirmed
        ? 'Source order is confirmed and can be used as story/source context.'
        : 'Source order is not confirmed yet; this plan should be treated as draft context.',
      ...(params.aiNotes ?? []),
    ],
  }
}

export function summarizeSourceSequence(clips: ClipSource[]) {
  if (clips.length === 0) {
    return 'No clips are attached yet.'
  }

  if (clips.length === 1) {
    return `One source video attached: ${clips[0].fileName}.`
  }

  const importantCount = clips.filter((clip) => clip.isImportant).length
  const optionalCount = clips.filter((clip) => clip.isOptional || clip.sourceRole === 'optional').length

  return `${clips.length} clips in source order, with ${importantCount} important and ${optionalCount} optional/support clip${optionalCount === 1 ? '' : 's'} marked.`
}

export function getSourceOrderWarnings(clips: ClipSource[], confirmed = false) {
  const warnings: string[] = []

  if (clips.length === 0) {
    return ['No clips attached yet. Add a source video or mock clips before planning.']
  }

  if (clips.length === 1) {
    warnings.push('Single video attached; no reorder is needed.')
  }

  if (!confirmed) {
    warnings.push('Source order is not confirmed yet.')
  }

  if (clips.some((clip) => clip.isOptional || clip.sourceRole === 'optional')) {
    warnings.push('Optional clips are marked; ReeditPro should treat them as support/b-roll unless the plan says otherwise.')
  }

  if (clips.some((clip) => clip.isImportant && clip.uploadedOrder > Math.ceil(clips.length * 0.65))) {
    warnings.push('An important clip appears late in the source sequence; ReeditPro may recommend using it earlier only inside the plan.')
  }

  if (clips.length > 1 && clips.filter((clip) => (clip.sourceRole ?? inferClipSourceRole(clip)) === 'unknown').length > 1) {
    warnings.push('Several clips have unknown roles; role labels can make the plan more accurate.')
  }

  return warnings
}
