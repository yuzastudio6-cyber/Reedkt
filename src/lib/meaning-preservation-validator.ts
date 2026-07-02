import type {
  AdaptiveEditStrategyPlan,
  MeaningPreservationCategory,
  MeaningPreservationCheck,
  MeaningPreservationStatus,
  MeaningPreservationValidationPlan,
  PlannerInput,
  RetakeSelectionPlan,
  SegmentEditPlan,
  SourceCleanupPlan,
  TrimDecisionItem,
  VideoUnderstandingReport,
} from '../types/reeditpro'

type CreateMeaningPreservationValidationPlanParams = {
  input: PlannerInput
  sourceCleanupPlan?: SourceCleanupPlan
  retakeSelectionPlan?: RetakeSelectionPlan
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  segmentEditPlans?: SegmentEditPlan[]
}

function check(params: {
  id: string
  category: MeaningPreservationCategory
  label: string
  status: MeaningPreservationStatus
  severity: MeaningPreservationCheck['severity']
  relatedTrimDecisionItemIds?: string[]
  relatedRetakeSelectionItemIds?: string[]
  relatedClipIds?: string[]
  message: string
  recommendation: string
  userReviewRequired?: boolean
}): MeaningPreservationCheck {
  return {
    id: params.id,
    category: params.category,
    label: params.label,
    status: params.status,
    severity: params.severity,
    relatedTrimDecisionItemIds: params.relatedTrimDecisionItemIds ?? [],
    relatedRetakeSelectionItemIds: params.relatedRetakeSelectionItemIds ?? [],
    relatedClipIds: params.relatedClipIds ?? [],
    message: params.message,
    recommendation: params.recommendation,
    userReviewRequired: Boolean(params.userReviewRequired),
  }
}

function decisionIsCut(decision: TrimDecisionItem) {
  return decision.decision === 'cut' || decision.finalUse === 'removed'
}

function decisionText(input: PlannerInput, decision: TrimDecisionItem, videoUnderstandingReport?: VideoUnderstandingReport) {
  const clip = input.clips.find((item) => item.id === decision.clipId)
  const understanding = videoUnderstandingReport?.clips.find((item) => item.clipId === decision.clipId)

  return `${clip?.fileName ?? ''} ${clip?.notes ?? ''} ${clip?.sourceRole ?? ''} ${clip?.detectedType ?? ''} ${understanding?.transcriptSummary ?? ''} ${understanding?.visualSummary ?? ''}`.toLowerCase()
}

function riskyCutChecks(params: {
  input: PlannerInput
  sourceCleanupPlan: SourceCleanupPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}) {
  return params.sourceCleanupPlan.decisions.flatMap((decision) => {
    const text = decisionText(params.input, decision, params.videoUnderstandingReport)
    const clip = params.input.clips.find((item) => item.id === decision.clipId)
    const checks: MeaningPreservationCheck[] = []
    const cut = decisionIsCut(decision)
    const review = decision.userReviewRequired

    if (cut && clip?.isImportant) {
      checks.push(check({
        id: `meaning-important-${decision.id}`,
        category: 'user_marked_important',
        label: 'User-marked important clip',
        status: review ? 'warning' : 'blocking',
        severity: review ? 'warning' : 'blocking',
        relatedTrimDecisionItemIds: [decision.id],
        relatedClipIds: [decision.clipId],
        message: 'A user-marked important clip is proposed for removal.',
        recommendation: 'Preserve it or require explicit user review before approval.',
        userReviewRequired: true,
      }))
    }

    if (cut && (decision.keepReasons.includes('proof_or_evidence') || decision.finalUse === 'proof' || /proof|evidence|source|claim/.test(text))) {
      checks.push(check({
        id: `meaning-evidence-${decision.id}`,
        category: 'evidence_context',
        label: 'Evidence context',
        status: review ? 'warning' : 'blocking',
        severity: review ? 'warning' : 'blocking',
        relatedTrimDecisionItemIds: [decision.id],
        relatedClipIds: [decision.clipId],
        message: 'Proof/evidence context may be shortened or removed.',
        recommendation: 'Preserve the range or ask the user to approve a safe cut.',
        userReviewRequired: true,
      }))
    }

    if (cut && (decision.keepReasons.includes('tutorial_step_required') || /tutorial|step|walkthrough|how to/.test(text))) {
      checks.push(check({
        id: `meaning-tutorial-${decision.id}`,
        category: 'tutorial_completeness',
        label: 'Tutorial step completeness',
        status: review ? 'warning' : 'blocking',
        severity: review ? 'warning' : 'blocking',
        relatedTrimDecisionItemIds: [decision.id],
        relatedClipIds: [decision.clipId],
        message: 'A required tutorial/process step may be removed.',
        recommendation: 'Keep required steps unless the user confirms a shorter version.',
        userReviewRequired: true,
      }))
    }

    if (cut && (decision.keepReasons.includes('product_demo_required') || /product|feature|screen|dashboard|demo/.test(text))) {
      checks.push(check({
        id: `meaning-product-${decision.id}`,
        category: 'product_demo_continuity',
        label: 'Product/demo continuity',
        status: review ? 'warning' : 'blocking',
        severity: review ? 'warning' : 'blocking',
        relatedTrimDecisionItemIds: [decision.id],
        relatedClipIds: [decision.clipId],
        message: 'A product/demo continuity step may be removed.',
        recommendation: 'Keep the action sequence complete or mark it for user review.',
        userReviewRequired: true,
      }))
    }

    if (decision.cutReasons.includes('privacy_sensitive')) {
      checks.push(check({
        id: `meaning-privacy-${decision.id}`,
        category: 'privacy_sensitive',
        label: 'Privacy-sensitive moment',
        status: 'warning',
        severity: 'warning',
        relatedTrimDecisionItemIds: [decision.id],
        relatedClipIds: [decision.clipId],
        message: 'A privacy-sensitive cleanup reason is present.',
        recommendation: 'Ask the user to confirm how this range should be handled before approval.',
        userReviewRequired: true,
      }))
    }

    return checks
  })
}

function retakeChecks(retakeSelectionPlan?: RetakeSelectionPlan) {
  if (!retakeSelectionPlan) {
    return []
  }

  return retakeSelectionPlan.items
    .filter((item) => item.confidence === 'low' || item.userReviewRequired)
    .map((item) => check({
      id: `meaning-retake-${item.id}`,
      category: 'retake_ambiguity',
      label: 'Retake ambiguity',
      status: item.userReviewRequired ? 'warning' : 'passed',
      severity: item.userReviewRequired ? 'warning' : 'info',
      relatedRetakeSelectionItemIds: [item.id],
      relatedClipIds: item.candidates.map((candidate) => candidate.clipId),
      message: `Retake selection confidence is ${item.confidence}.`,
      recommendation: 'Ask the user to review candidate takes if the selection affects meaning, proof, or continuity.',
      userReviewRequired: item.userReviewRequired,
    }))
}

function overallStatus(checks: MeaningPreservationCheck[]): MeaningPreservationStatus {
  if (checks.some((item) => item.status === 'blocking')) return 'blocking'
  if (checks.some((item) => item.status === 'failed')) return 'failed'
  if (checks.some((item) => item.status === 'warning')) return 'warning'
  return 'passed'
}

export function createMeaningPreservationValidationPlan(
  params: CreateMeaningPreservationValidationPlanParams,
): MeaningPreservationValidationPlan {
  const sourceCleanupPlan = params.sourceCleanupPlan ?? params.input.sourceCleanupPlan

  if (!sourceCleanupPlan) {
    const missing = check({
      id: 'meaning-source-cleanup-missing',
      category: 'custom',
      label: 'Source cleanup required',
      status: 'blocking',
      severity: 'blocking',
      message: 'Meaning preservation cannot run without SourceCleanupPlan.',
      recommendation: 'Create source cleanup decisions before trim review.',
      userReviewRequired: true,
    })

    return {
      id: 'meaning-preservation-missing-source-cleanup',
      status: 'blocking',
      summary: 'Meaning preservation is blocked because SourceCleanupPlan is missing.',
      checks: [missing],
      blockingReasons: [missing.message],
      userReviewRequired: true,
      userReviewItems: [missing],
      globalRules: ['Source cleanup decisions are required before meaning validation.'],
      qaChecks: ['Meaning preservation blocked until source cleanup exists.'],
      limitations: ['Mock-only validation; no real semantic/transcript/media analysis has run.'],
      notes: ['Create SourceCleanupPlan before TrimReviewPlan.'],
    }
  }

  const checks: MeaningPreservationCheck[] = [
    check({
      id: 'meaning-source-order',
      category: 'source_order',
      label: 'Source order confirmation',
      status: params.input.sourceOrderConfirmed ? 'passed' : 'blocking',
      severity: params.input.sourceOrderConfirmed ? 'info' : 'blocking',
      message: params.input.sourceOrderConfirmed
        ? 'Source order is confirmed for trim review.'
        : 'Source order is not confirmed; trim review cannot be approval-ready.',
      recommendation: 'Confirm source order before approving trim decisions.',
      userReviewRequired: !params.input.sourceOrderConfirmed,
    }),
    check({
      id: 'meaning-cleanup-confirmed',
      category: 'custom',
      label: 'Cleanup preference confirmed',
      status: sourceCleanupPlan.status === 'confirmed' ? 'passed' : 'blocking',
      severity: sourceCleanupPlan.status === 'confirmed' ? 'info' : 'blocking',
      message: sourceCleanupPlan.status === 'confirmed'
        ? 'Cleanup preference is confirmed.'
        : 'Cleanup preference is not confirmed, so trim review remains locked.',
      recommendation: 'Confirm cleanup preference before final trim review approval.',
      userReviewRequired: sourceCleanupPlan.status !== 'confirmed',
    }),
    ...riskyCutChecks({
      input: params.input,
      sourceCleanupPlan,
      videoUnderstandingReport: params.videoUnderstandingReport,
    }),
    ...retakeChecks(params.retakeSelectionPlan),
  ]

  const preference = sourceCleanupPlan.selectedPreference ?? sourceCleanupPlan.recommendedPreference.recommendedPreference
  const documentaryAggressive = params.input.editingCategory === 'documentary_case_study' && (preference === 'aggressive_cleanup' || preference === 'tight_retention_cleanup')

  if (documentaryAggressive) {
    checks.push(check({
      id: 'meaning-documentary-aggressive-cleanup',
      category: 'documentary_safety',
      label: 'Documentary cleanup restraint',
      status: 'warning',
      severity: 'warning',
      message: 'Aggressive cleanup in documentary/case-study content can distort claim context.',
      recommendation: 'Use documentary faithful cleanup or require review for risky cuts.',
      userReviewRequired: true,
    }))
  }

  if (preference === 'preserve_natural' && sourceCleanupPlan.cutRanges.length > 1) {
    checks.push(check({
      id: 'meaning-naturalness-preserved',
      category: 'emotional_pause',
      label: 'Naturalness preservation',
      status: 'warning',
      severity: 'warning',
      relatedTrimDecisionItemIds: sourceCleanupPlan.cutRanges.map((decision) => decision.id),
      relatedClipIds: sourceCleanupPlan.cutRanges.map((decision) => decision.clipId),
      message: 'Preserve-natural cleanup has multiple cut ranges.',
      recommendation: 'Review whether natural pauses or behind-the-scenes authenticity should remain.',
      userReviewRequired: true,
    }))
  }

  if (preference === 'tutorial_complete' && sourceCleanupPlan.cutRanges.length > 0) {
    checks.push(check({
      id: 'meaning-tutorial-complete-cuts',
      category: 'tutorial_completeness',
      label: 'Tutorial complete cleanup',
      status: 'warning',
      severity: 'warning',
      relatedTrimDecisionItemIds: sourceCleanupPlan.cutRanges.map((decision) => decision.id),
      relatedClipIds: sourceCleanupPlan.cutRanges.map((decision) => decision.clipId),
      message: 'Tutorial-complete cleanup includes cut ranges.',
      recommendation: 'Confirm no required process steps are being removed.',
      userReviewRequired: true,
    }))
  }

  const status = overallStatus(checks)
  const blockingReasons = checks.filter((item) => item.status === 'blocking').map((item) => item.message)
  const userReviewItems = checks.filter((item) => item.userReviewRequired)

  return {
    id: `meaning-preservation-${params.input.editingCategory}-${params.input.editLevel}`,
    status,
    summary:
      status === 'passed'
        ? 'Meaning preservation checks pass for mock trim review.'
        : `${checks.filter((item) => item.status !== 'passed').length} meaning preservation issue(s) need review before approval.`,
    checks,
    blockingReasons,
    userReviewRequired: userReviewItems.length > 0,
    userReviewItems,
    globalRules: [
      'Preserve meaning over pacing.',
      'Do not cut proof, evidence, tutorial, product, or important context without review.',
      'Documentary/case-study claim context must stay neutral and safe.',
      'Retake selection must not remove the only clear explanation.',
    ],
    qaChecks: [
      'Important clips preserved or reviewed.',
      'Proof/evidence context preserved or reviewed.',
      'Tutorial/product continuity preserved or reviewed.',
      'Retake ambiguity surfaced when confidence is low.',
      'No real semantic/media analysis is implied.',
    ],
    limitations: [
      'Mock-only meaning preservation validation.',
      'No real semantic analysis has run.',
      'No real transcript comparison has run.',
      'No real audio/video/media analysis has run.',
      'Future transcript/media workers are required for production-grade meaning validation.',
    ],
    notes: [
      params.adaptiveEditStrategyPlan
        ? 'Adaptive strategy context was available for mock validation.'
        : 'Adaptive strategy context was not required for mock validation.',
      params.segmentEditPlans?.length
        ? `${params.segmentEditPlans.length} segment plan(s) can receive meaning preservation check IDs.`
        : 'Segment plans can link to meaning preservation checks downstream.',
    ],
  }
}
