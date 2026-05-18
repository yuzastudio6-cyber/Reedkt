import type {
  PlannerInput,
  RetakeCandidatePlan,
  RetakeCandidateQuality,
  RetakeGroupPlan,
  RetakeSelectionConfidence,
  RetakeSelectionPlanItem,
  RetakeSelectionStrategy,
  SourceCleanupPlan,
  TrimDecisionItem,
  TrimDecisionType,
  VideoUnderstandingReport,
} from '../types/reeditpro'

export const retakeSelectionStrategies: Record<RetakeSelectionStrategy, {
  label: string
  description: string
}> = {
  latest_good_take: {
    label: 'Latest good take',
    description: 'Choose the later take when no stronger metadata signal exists.',
  },
  clearest_explanation: {
    label: 'Clearest explanation',
    description: 'Prefer the candidate that appears most complete or explanatory.',
  },
  strongest_emotion: {
    label: 'Strongest emotion',
    description: 'Prefer the candidate that supports the story or emotional beat.',
  },
  best_audio_visual_quality: {
    label: 'Best audio/visual quality',
    description: 'Prefer metadata that suggests cleaner framing, sound, or usability.',
  },
  user_marked_important: {
    label: 'User marked important',
    description: 'Preserve the candidate explicitly marked important.',
  },
  preserve_multiple_for_broll: {
    label: 'Preserve multiple for b-roll',
    description: 'Use alternates as support footage rather than deleting blindly.',
  },
  preserve_multiple_for_context: {
    label: 'Preserve multiple for context',
    description: 'Keep alternates when proof, tutorial, or claim context might matter.',
  },
  ask_user_review: {
    label: 'Ask user review',
    description: 'Require user review because mock metadata cannot confidently choose.',
  },
  custom: {
    label: 'Custom',
    description: 'Follow explicit user instruction.',
  },
}

function clipText(input: PlannerInput, clipId: string, videoUnderstandingReport?: VideoUnderstandingReport) {
  const clip = input.clips.find((item) => item.id === clipId)
  const understanding = videoUnderstandingReport?.clips.find((item) => item.clipId === clipId)

  return `${clip?.fileName ?? ''} ${clip?.notes ?? ''} ${clip?.detectedType ?? ''} ${clip?.sourceRole ?? ''} ${understanding?.transcriptSummary ?? ''} ${understanding?.visualSummary ?? ''}`.toLowerCase()
}

function hasRetakeLanguage(text: string) {
  return /\b(take|retry|again|version|alt|attempt|redo|final)\b|take\d|v\d/i.test(text)
}

function retakeBaseLabel(text: string) {
  return text
    .toLowerCase()
    .replace(/\b(take|retry|again|version|alt|attempt|redo|final|v)\s*\d*\b/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 42)
}

function inferredTakeNumber(text: string) {
  const match = text.match(/\b(?:take|v|version|attempt)\s*(\d+)\b|(?:take|v)(\d+)/i)
  const value = match?.[1] ?? match?.[2]

  return value ? Number(value) : undefined
}

function sourceDecisionForClip(sourceCleanupPlan: SourceCleanupPlan | undefined, clipId: string) {
  return sourceCleanupPlan?.decisions.find((decision) => decision.clipId === clipId)
}

export function inferRetakeGroupsFromSources(params: {
  input: PlannerInput
  sourceCleanupPlan?: SourceCleanupPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}): RetakeGroupPlan[] {
  const grouped = new Map<string, TrimDecisionItem[]>()

  params.input.clips.forEach((clip) => {
    const text = clipText(params.input, clip.id, params.videoUnderstandingReport)
    const decision = sourceDecisionForClip(params.sourceCleanupPlan, clip.id)

    if (!decision || !hasRetakeLanguage(text)) {
      return
    }

    const key = retakeBaseLabel(text) || `retake-${clip.sourceRole ?? 'unknown'}`
    grouped.set(key, [...(grouped.get(key) ?? []), decision])
  })

  return Array.from(grouped.entries())
    .filter(([, decisions]) => decisions.length > 1)
    .map(([label, decisions], index) => {
      const selected = selectBestDecisionMock(params.input, decisions)
      const alternates = decisions.filter((decision) => decision.id !== selected.id)

      return {
        id: `retake-inferred-${index + 1}`,
        clipIds: decisions.map((decision) => decision.clipId),
        label: label || `Retake group ${index + 1}`,
        selectedClipId: selected.clipId,
        selectedDecisionItemId: selected.id,
        alternateDecisionItemIds: alternates.map((decision) => decision.id),
        reason: 'Mock retake group inferred from filename, notes, uploaded order, role, or flags.',
        userReviewRequired: alternates.length > 1,
        qaChecks: [
          'Retake group is metadata-inferred only.',
          'No real transcript, semantic, visual, or audio comparison has run.',
          'User review is required if confidence is low or context could change meaning.',
        ],
      }
    })
}

function selectBestDecisionMock(input: PlannerInput, decisions: TrimDecisionItem[]) {
  return [...decisions].sort((a, b) => {
    const clipA = input.clips.find((clip) => clip.id === a.clipId)
    const clipB = input.clips.find((clip) => clip.id === b.clipId)
    if (clipA?.isImportant && !clipB?.isImportant) return -1
    if (!clipA?.isImportant && clipB?.isImportant) return 1
    if (a.finalUse === 'proof' && b.finalUse !== 'proof') return -1
    if (a.finalUse !== 'proof' && b.finalUse === 'proof') return 1
    return (clipB?.uploadedOrder ?? 0) - (clipA?.uploadedOrder ?? 0)
  })[0]
}

export function chooseRetakeSelectionStrategy(params: {
  input: PlannerInput
  group: RetakeGroupPlan
  sourceCleanupPlan?: SourceCleanupPlan
}): RetakeSelectionStrategy {
  const decisions = params.group.clipIds
    .map((clipId) => sourceDecisionForClip(params.sourceCleanupPlan, clipId))
    .filter((decision): decision is TrimDecisionItem => Boolean(decision))
  const text = params.group.clipIds.map((clipId) => clipText(params.input, clipId)).join(' ')

  if (decisions.some((decision) => params.input.clips.find((clip) => clip.id === decision.clipId)?.isImportant)) return 'user_marked_important'
  if (decisions.some((decision) => decision.finalUse === 'proof' || decision.keepReasons.includes('proof_or_evidence'))) return 'preserve_multiple_for_context'
  if (decisions.some((decision) => decision.keepReasons.includes('tutorial_step_required') || decision.keepReasons.includes('product_demo_required'))) return 'clearest_explanation'
  if (params.input.editingCategory === 'storytelling' || /emotion|reaction|story|hook/.test(text)) return 'strongest_emotion'
  if (/bad audio|bad visual|shaky|blurry|clean|clear/.test(text)) return 'best_audio_visual_quality'
  if (params.group.userReviewRequired) return 'ask_user_review'

  return 'latest_good_take'
}

export function scoreRetakeCandidateMock(params: {
  input: PlannerInput
  decision: TrimDecisionItem
  videoUnderstandingReport?: VideoUnderstandingReport
}): RetakeCandidatePlan {
  const clip = params.input.clips.find((item) => item.id === params.decision.clipId)
  const text = clipText(params.input, params.decision.clipId, params.videoUnderstandingReport)
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (clip?.isImportant) strengths.push('User marked important.')
  if (params.decision.keepReasons.includes('clear_explanation')) strengths.push('Marked as clear explanation in cleanup decision.')
  if (params.decision.keepReasons.includes('proof_or_evidence')) strengths.push('Carries proof/evidence context.')
  if (params.decision.keepReasons.includes('tutorial_step_required')) strengths.push('Supports required tutorial completeness.')
  if (params.decision.keepReasons.includes('product_demo_required')) strengths.push('Supports product/demo continuity.')
  if (/final|clean|best|good|clear/.test(text)) strengths.push('Filename or notes suggest this is a stronger take.')
  if (/emotion|reaction|authentic|natural/.test(text)) strengths.push('Notes suggest an emotional or authentic moment.')
  if (clip?.isOptional) weaknesses.push('User marked optional.')
  if (params.decision.cutReasons.length) weaknesses.push(`Cleanup cut risk: ${params.decision.cutReasons.join(', ')}.`)
  if (/bad audio|noisy|muffled/.test(text)) weaknesses.push('Metadata suggests audio quality risk.')
  if (/bad visual|shaky|blurry|dark/.test(text)) weaknesses.push('Metadata suggests visual quality risk.')

  const quality: RetakeCandidateQuality =
    clip?.isImportant || /final|best|clear|clean/.test(text)
      ? 'best_mock'
      : weaknesses.length > strengths.length + 1
        ? 'weak'
        : strengths.length > weaknesses.length
          ? 'good'
          : strengths.length
            ? 'acceptable'
            : 'unknown'
  const suggestedUse: TrimDecisionType =
    params.decision.finalUse === 'removed'
      ? 'cut'
      : params.decision.finalUse === 'broll'
        ? 'move_to_broll'
        : params.decision.finalUse === 'proof'
          ? 'use_as_proof'
          : params.decision.finalUse === 'alt_take'
            ? 'use_as_alt_take'
            : params.decision.decision

  return {
    id: `retake-candidate-${params.decision.id}`,
    clipId: params.decision.clipId,
    sourceRange: params.decision.sourceRange,
    candidateLabel: clip?.previewLabel ?? clip?.fileName ?? params.decision.clipId,
    inferredTakeNumber: inferredTakeNumber(`${clip?.fileName ?? ''} ${clip?.notes ?? ''}`),
    quality,
    strengths: strengths.length ? strengths : ['Usable mock candidate based on current source cleanup plan.'],
    weaknesses: weaknesses.length ? weaknesses : ['No real media comparison has run.'],
    userMarkedImportant: Boolean(clip?.isImportant),
    userMarkedOptional: Boolean(clip?.isOptional),
    suggestedUse,
    reason: 'Candidate quality is mock-scored from metadata, flags, notes, and cleanup decision only.',
    qaChecks: [
      'Candidate score must not be treated as real transcript/media comparison.',
      'Retake choice should preserve meaning, proof, and required tutorial/product continuity.',
    ],
  }
}

export function selectBestRetakeCandidateMock(params: {
  input: PlannerInput
  group: RetakeGroupPlan
  candidates: RetakeCandidatePlan[]
  strategy: RetakeSelectionStrategy
}): {
  selectedCandidateId?: string
  alternateCandidateIds: string[]
  confidence: RetakeSelectionConfidence
  userReviewRequired: boolean
  selectedUse: RetakeSelectionPlanItem['selectedUse']
  reason: string
} {
  const sorted = [...params.candidates].sort((a, b) => {
    if (a.userMarkedImportant && !b.userMarkedImportant) return -1
    if (!a.userMarkedImportant && b.userMarkedImportant) return 1
    const qualityScore = (candidate: RetakeCandidatePlan) =>
      candidate.quality === 'best_mock' ? 4 : candidate.quality === 'good' ? 3 : candidate.quality === 'acceptable' ? 2 : candidate.quality === 'unknown' ? 1 : 0
    const byQuality = qualityScore(b) - qualityScore(a)
    if (byQuality !== 0) return byQuality
    return (b.inferredTakeNumber ?? 0) - (a.inferredTakeNumber ?? 0)
  })
  const selected = sorted[0]
  const alternateCandidateIds = sorted.slice(1).map((candidate) => candidate.id)
  const confidence: RetakeSelectionConfidence =
    params.strategy === 'ask_user_review'
      ? 'low'
      : selected?.quality === 'best_mock' || selected?.userMarkedImportant
        ? 'high'
        : selected?.quality === 'good'
          ? 'medium'
          : 'low'
  const userReviewRequired =
    confidence === 'low' ||
    params.strategy === 'ask_user_review' ||
    params.group.userReviewRequired ||
    params.candidates.some((candidate) => candidate.suggestedUse === 'use_as_proof' && candidate.id !== selected?.id)

  return {
    selectedCandidateId: selected?.id,
    alternateCandidateIds,
    confidence,
    userReviewRequired,
    selectedUse: userReviewRequired ? 'user_review' : selected?.suggestedUse === 'move_to_broll' ? 'broll' : selected?.suggestedUse === 'use_as_proof' ? 'proof' : 'main_timeline',
    reason: selected
      ? `${retakeSelectionStrategies[params.strategy].label}: ${selected.candidateLabel} is the strongest mock candidate based on metadata.`
      : 'No candidate could be selected from mock metadata.',
  }
}
