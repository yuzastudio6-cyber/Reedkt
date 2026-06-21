import type {
  UnmergedOwnerDuplicateRiskFinding,
  UnmergedOwnerEvidenceCollectionSummary,
  UnmergedOwnerEvidenceDuplicateRisk,
  UnmergedOwnerEvidenceItem,
  UnmergedOwnerEvidenceLane,
  UnmergedOwnerEvidencePrInput,
  UnmergedOwnerEvidenceRecommendedAction,
  UnmergedOwnerEvidenceSourceTruthStatus,
  UnmergedOwnerEvidenceType,
} from './unmerged-owner-evidence-types'

const knownToolPatterns = [
  ['mediainfo', /\bmedia\s*info\b|\bmediainfo\b/i],
  ['exiftool', /\bexif\s*tool\b|\bexiftool\b/i],
  ['tesseract', /\btesseract\b/i],
  ['imagemagick', /\bimage\s*magick\b|\bimagemagick\b|\bmagick\b/i],
  ['graphicsmagick', /\bgraphics\s*magick\b|\bgraphicsmagick\b|\bgm\b/i],
  ['ffmpeg', /\bffmpeg\b/i],
  ['ffprobe', /\bffprobe\b/i],
  ['remotion', /\bremotion\b/i],
  ['sharp', /\bsharp\b|\blibvips\b/i],
  ['playwright', /\bplaywright\b/i],
  ['paddleocr', /\bpaddle\s*ocr\b|\bpaddleocr\b/i],
  ['opencv', /\bopen\s*cv\b|\bopencv\b/i],
  ['birefnet', /\bbirefnet\b/i],
  ['sam2', /\bsam2\b|\bsegment anything\b/i],
  ['real_esrgan', /\breal[-_ ]?esrgan\b/i],
  ['film', /\bfilm\b|\bslow[-_ ]?motion\b/i],
  ['audioflux', /\baudioflux\b/i],
  ['demucs', /\bdemucs\b/i],
  ['rnnoise', /\brnnoise\b/i],
  ['rubber_band', /\brubber[-_ ]?band\b/i],
  ['signalsmith_stretch', /\bsignalsmith\b/i],
  ['whisper_cpp', /\bwhisper[-_ ]?cpp\b/i],
  ['faster_whisper', /\bfaster[-_ ]?whisper\b/i],
  ['three_js', /\bthree(?:\.js|_js)?\b/i],
  ['babylon_js', /\bbabylon(?:\.js|_js)?\b/i],
  ['konva', /\bkonva\b/i],
  ['pixijs', /\bpixi(?:\.js|js)?\b/i],
  ['d3', /\bd3\b/i],
  ['echarts', /\becharts\b/i],
  ['vega_lite', /\bvega[-_ ]?lite\b/i],
  ['maplibre', /\bmaplibre\b/i],
  ['turf', /\bturf\b/i],
  ['cesium_js', /\bcesium\b/i],
  ['deck_gl', /\bdeck(?:\.gl|_gl)?\b/i],
] as const

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function normalizeState(state: string | undefined): string {
  return (state ?? 'unknown').toLowerCase()
}

function labelText(pr: UnmergedOwnerEvidencePrInput): string {
  return (pr.labels ?? [])
    .map((label) => typeof label === 'string' ? label : label.name ?? '')
    .filter(Boolean)
    .join(' ')
}

function pathsFromPr(pr: UnmergedOwnerEvidencePrInput): string[] {
  const explicitPaths = [...(pr.affectedPaths ?? [])]
  const filePaths = (pr.files ?? [])
    .map((file) => typeof file === 'string' ? file : file.path ?? file.filename ?? '')
    .filter(Boolean)

  return uniqueSorted([...explicitPaths, ...filePaths])
}

function prSearchText(pr: UnmergedOwnerEvidencePrInput): string {
  return [
    pr.title,
    pr.prTitle,
    pr.headRefName,
    pr.headBranch,
    pr.baseRefName,
    pr.baseBranch,
    pr.body,
    labelText(pr),
    ...pathsFromPr(pr),
  ].filter(Boolean).join(' ')
}

export function classifyOwnerLaneFromPr(pr: UnmergedOwnerEvidencePrInput): UnmergedOwnerEvidenceLane {
  const text = prSearchText(pr)

  if (/tool[-_ ]?calling|capability card|safe command|fixture|adapter contract/i.test(text)) {
    return 'tool_calling'
  }
  if (/supabase|sql|migration|runtime table|rls|postgres/i.test(text)) {
    return 'supabase_runtime_tables'
  }
  if (/worker runtime|worker route|worker router|production worker|worker orchestration/i.test(text)) {
    return 'worker_runtime'
  }
  if (/sound|music|audio|sfx|soundsync|speech/i.test(text)) {
    return 'sound_music_audio_sfx_soundsync'
  }
  if (/track\s*b|media oss|mediainfo|exiftool|tesseract|imagemagick|graphicsmagick|ocr/i.test(text)) {
    return 'track_b_media_oss'
  }
  if (/track\s*a|render|export|native|container|docker|remotion|ffmpeg|ffprobe/i.test(text)) {
    return 'track_a_render_export_native_container'
  }
  if (/ai graphics|static|motion|chart|model|gpu|opencv|sam2|birefnet|paddleocr|real[-_ ]?esrgan|transparent background/i.test(text)) {
    return 'ai_graphics_static_motion_chart_model_tools'
  }
  if (/web|capture|browser|playwright|screenshot/i.test(text)) {
    return 'web_capture'
  }
  if (/map|geo|geospatial|maplibre|turf|cesium|deck\.gl|deck_gl/i.test(text)) {
    return 'map_geospatial'
  }

  return 'unknown'
}

export function extractAffectedToolsFromPr(pr: UnmergedOwnerEvidencePrInput): string[] {
  const text = prSearchText(pr)
  return uniqueSorted(
    knownToolPatterns
      .filter(([, pattern]) => pattern.test(text))
      .map(([toolId]) => toolId),
  )
}

function sourceTruthStatusForPr(pr: UnmergedOwnerEvidencePrInput): UnmergedOwnerEvidenceSourceTruthStatus {
  const state = normalizeState(pr.prState ?? pr.state)
  if (state === 'open') return 'open_pr_candidate_evidence'
  if (state === 'merged') return 'merged_source_of_truth'
  if (state === 'closed') return 'rejected_or_closed_not_source'
  return 'unknown'
}

function evidenceTypeForPr(pr: UnmergedOwnerEvidencePrInput): UnmergedOwnerEvidenceType {
  const text = prSearchText(pr)
  if (/blocker|fix|resolution|unblock/i.test(text)) return 'blocker_resolution_candidate'
  if (/qa|review|approval|validation/i.test(text)) return 'qa_review_candidate'
  if (/adapter/i.test(text)) return 'adapter_candidate'
  if (/study|capability card|capability-card|card/i.test(text)) return 'capability_card_candidate'
  if (/docker|container|requirements|package proof/i.test(text)) return 'docker_requirements_candidate'
  if (/runtime|execution|probe|readiness|worker/i.test(text)) return 'runtime_proof_candidate'
  if (/install|proof|available|dependency/i.test(text)) return 'install_proof_candidate'
  if (/owner registry|owner lane|ownership|registry/i.test(text)) return 'owner_registry_candidate'
  if (/duplicate|overlap|conflict/i.test(text)) return 'duplicate_risk_candidate'
  return 'capability_card_candidate'
}

function duplicateRiskForPr(
  pr: UnmergedOwnerEvidencePrInput,
  ownerLane: UnmergedOwnerEvidenceLane,
  evidenceType: UnmergedOwnerEvidenceType,
  affectedTools: readonly string[],
  affectedPaths: readonly string[],
): UnmergedOwnerEvidenceDuplicateRisk {
  const sourceTruthStatus = sourceTruthStatusForPr(pr)
  if (sourceTruthStatus !== 'open_pr_candidate_evidence') return 'none'

  const text = prSearchText(pr)
  const touchesImplementationSurface = affectedPaths.some((path) => (
    path.startsWith('server/tool-registry/') ||
    path.startsWith('server/tool-calling/') ||
    path.startsWith('server/workers/') ||
    path.startsWith('database/') ||
    path.startsWith('docker/') ||
    path.startsWith('docs/tool-calling/studies/')
  ))

  if (
    evidenceType === 'runtime_proof_candidate' ||
    evidenceType === 'install_proof_candidate' ||
    evidenceType === 'docker_requirements_candidate' ||
    /execution|runtime|probe|install|proof|docker|requirements/i.test(text)
  ) {
    return 'wait_for_owner_merge'
  }
  if (touchesImplementationSurface && (affectedTools.length > 0 || ownerLane !== 'unknown')) {
    return 'likely_duplicate'
  }
  if (ownerLane !== 'unknown' || affectedTools.length > 0) return 'possible_duplicate'

  return 'none'
}

export function recommendActionForUnmergedEvidence(
  item: Pick<UnmergedOwnerEvidenceItem, 'sourceTruthStatus' | 'duplicateRisk' | 'evidenceType' | 'draft'>,
): UnmergedOwnerEvidenceRecommendedAction {
  if (item.sourceTruthStatus === 'merged_source_of_truth') return 'reconcile_after_merge'
  if (item.sourceTruthStatus === 'rejected_or_closed_not_source') return 'reference_only'
  if (item.duplicateRisk === 'wait_for_owner_merge') return 'wait_for_merge'
  if (item.duplicateRisk === 'likely_duplicate') return 'do_not_duplicate'
  if (item.duplicateRisk === 'possible_duplicate') return item.draft ? 'reference_only' : 'reconcile_after_merge'
  if (item.evidenceType === 'qa_review_candidate') return 'reference_only'
  return 'safe_to_continue'
}

function notesForItem(
  sourceTruthStatus: UnmergedOwnerEvidenceSourceTruthStatus,
  duplicateRisk: UnmergedOwnerEvidenceDuplicateRisk,
  draft: boolean,
): string[] {
  const notes: string[] = []
  if (sourceTruthStatus === 'open_pr_candidate_evidence') {
    notes.push('Open PR evidence is candidate-only and must not be treated as final source of truth.')
  }
  if (draft) {
    notes.push('Draft PR evidence is candidate-only and should wait for owner readiness before runtime decisions.')
  }
  if (duplicateRisk === 'wait_for_owner_merge') {
    notes.push('Owner work appears to cover install, runtime, Docker, or proof surfaces; do not duplicate before merge/reconciliation.')
  } else if (duplicateRisk === 'likely_duplicate') {
    notes.push('PR touches implementation surfaces relevant to future tool-calling milestones; reconcile before implementing overlapping work.')
  }
  return notes
}

export function collectUnmergedOwnerEvidence(
  prs: readonly UnmergedOwnerEvidencePrInput[],
): UnmergedOwnerEvidenceItem[] {
  return prs.map((pr) => {
    const prNumber = pr.prNumber ?? pr.number ?? 0
    const prTitle = pr.prTitle ?? pr.title ?? 'Untitled PR'
    const prState = normalizeState(pr.prState ?? pr.state)
    const draft = pr.draft ?? pr.isDraft ?? false
    const mergeable = pr.mergeable ?? null
    const baseBranch = pr.baseBranch ?? pr.baseRefName ?? 'unknown'
    const headBranch = pr.headBranch ?? pr.headRefName ?? 'unknown'
    const ownerLane = classifyOwnerLaneFromPr(pr)
    const affectedTools = extractAffectedToolsFromPr(pr)
    const affectedPaths = pathsFromPr(pr)
    const evidenceType = evidenceTypeForPr(pr)
    const sourceTruthStatus = sourceTruthStatusForPr(pr)
    const duplicateRisk = duplicateRiskForPr(pr, ownerLane, evidenceType, affectedTools, affectedPaths)
    const itemWithoutRecommendation = {
      prNumber,
      prTitle,
      prState,
      draft,
      mergeable,
      baseBranch,
      headBranch,
      ownerLane,
      affectedTools,
      affectedPaths,
      evidenceType,
      sourceTruthStatus,
      duplicateRisk,
      recommendedAction: 'safe_to_continue' as const,
      notes: [] as string[],
    }
    const recommendedAction = recommendActionForUnmergedEvidence(itemWithoutRecommendation)

    return {
      ...itemWithoutRecommendation,
      recommendedAction,
      notes: notesForItem(sourceTruthStatus, duplicateRisk, draft),
    }
  })
}

export function detectUnmergedDuplicateRisks(
  evidenceItems: readonly UnmergedOwnerEvidenceItem[],
): UnmergedOwnerDuplicateRiskFinding[] {
  return evidenceItems
    .filter((item) => item.duplicateRisk !== 'none')
    .map((item) => ({
      prNumber: item.prNumber,
      prTitle: item.prTitle,
      ownerLane: item.ownerLane,
      affectedTools: item.affectedTools,
      duplicateRisk: item.duplicateRisk,
      recommendedAction: item.recommendedAction,
      reason: item.notes.join(' ') || 'Open owner PR overlaps with a future tool-calling milestone surface.',
    }))
}

export function summarizeUnmergedOwnerEvidence(
  evidenceItems: readonly UnmergedOwnerEvidenceItem[],
): UnmergedOwnerEvidenceCollectionSummary {
  const duplicateRiskFindings = detectUnmergedDuplicateRisks(evidenceItems)

  return {
    evidenceItems,
    duplicateRiskFindings,
    openPrEvidenceCount: evidenceItems.filter((item) => item.sourceTruthStatus === 'open_pr_candidate_evidence').length,
    mergedRecentEvidenceCount: evidenceItems.filter((item) => item.sourceTruthStatus === 'merged_source_of_truth').length,
    duplicateRiskCount: duplicateRiskFindings.length,
    waitForMergeCount: evidenceItems.filter((item) => item.recommendedAction === 'wait_for_merge').length,
    ownerLanesRepresented: uniqueSorted(evidenceItems.map((item) => item.ownerLane)) as UnmergedOwnerEvidenceLane[],
    recommendedActions: uniqueSorted(evidenceItems.map((item) => item.recommendedAction)) as UnmergedOwnerEvidenceRecommendedAction[],
  }
}
