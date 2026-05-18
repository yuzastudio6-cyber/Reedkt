import type {
  AdaptiveEditStrategyPlan,
  PlannerInput,
  RetakeGroupPlan,
  RetakeSelectionPlan,
  RetakeSelectionPlanItem,
  SegmentEditPlan,
  SourceCleanupPlan,
  TrimDecisionItem,
  TrimReviewPlan,
  VideoUnderstandingReport,
} from '../types/reeditpro'
import {
  chooseRetakeSelectionStrategy,
  inferRetakeGroupsFromSources,
  scoreRetakeCandidateMock,
  selectBestRetakeCandidateMock,
} from './retake-selection-policy'
import { createMeaningPreservationValidationPlan } from './meaning-preservation-validator'

type CreateTrimReviewPlanParams = {
  input: PlannerInput
  sourceCleanupPlan?: SourceCleanupPlan
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  segmentEditPlans?: SegmentEditPlan[]
}

function mergeRetakeGroups(sourceGroups: RetakeGroupPlan[], inferredGroups: RetakeGroupPlan[]) {
  const byClipSet = new Map<string, RetakeGroupPlan>()

  for (const group of [...sourceGroups, ...inferredGroups]) {
    const key = [...group.clipIds].sort().join('|')
    if (!byClipSet.has(key)) {
      byClipSet.set(key, group)
    }
  }

  return Array.from(byClipSet.values())
}

function createRetakeSelectionPlan(params: {
  input: PlannerInput
  sourceCleanupPlan?: SourceCleanupPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}): RetakeSelectionPlan {
  const sourceGroups = params.sourceCleanupPlan?.retakeGroups ?? []
  const inferredGroups = inferRetakeGroupsFromSources({
    input: params.input,
    sourceCleanupPlan: params.sourceCleanupPlan,
    videoUnderstandingReport: params.videoUnderstandingReport,
  })
  const groups = mergeRetakeGroups(sourceGroups, inferredGroups)
  const items = groups.map<RetakeSelectionPlanItem>((group, index) => {
    const strategy = chooseRetakeSelectionStrategy({
      group,
      input: params.input,
      sourceCleanupPlan: params.sourceCleanupPlan,
    })
    const candidates = group.clipIds
      .map((clipId) => params.sourceCleanupPlan?.decisions.find((decision) => decision.clipId === clipId))
      .filter((decision): decision is TrimDecisionItem => Boolean(decision))
      .map((decision) => scoreRetakeCandidateMock({
        decision,
        input: params.input,
        videoUnderstandingReport: params.videoUnderstandingReport,
      }))
    const selection = selectBestRetakeCandidateMock({
      candidates,
      group,
      input: params.input,
      strategy,
    })

    return {
      id: `retake-selection-${index + 1}`,
      label: group.label || `Retake group ${index + 1}`,
      strategy,
      candidates,
      selectedCandidateId: selection.selectedCandidateId,
      alternateCandidateIds: selection.alternateCandidateIds,
      confidence: selection.confidence,
      userReviewRequired: selection.userReviewRequired,
      selectedUse: selection.selectedUse,
      reason: selection.reason,
      fallbackDecision: selection.userReviewRequired
        ? 'Ask the user which take to use before final approval.'
        : 'Use selected candidate and keep alternates only as planned support.',
      qaChecks: [
        'Retake selection has a reason and confidence.',
        'Low-confidence selections require user review.',
        'No real transcript, semantic, audio, visual, or media comparison has run.',
        ...group.qaChecks,
      ],
    }
  })

  return {
    id: `retake-selection-${params.input.editingCategory}-${params.input.editLevel}`,
    active: groups.length > 0,
    summary: groups.length
      ? `${items.length} retake group(s) reviewed with mock metadata-based selection.`
      : 'No retake groups were inferred from mock metadata.',
    items,
    selectedCandidateCount: items.filter((item) => Boolean(item.selectedCandidateId)).length,
    userReviewRequiredCount: items.filter((item) => item.userReviewRequired).length,
    globalRules: [
      'Do not delete alternate takes blindly.',
      'User-marked important candidates win unless safety or meaning review says otherwise.',
      'Proof, tutorial, product, and documentary context should be preserved when uncertain.',
      'Later take is only a fallback signal.',
    ],
    limitations: [
      'Mock-only retake selection.',
      'No real transcript comparison has run.',
      'No real semantic comparison has run.',
      'No real audio/video/media quality analysis has run.',
    ],
    notes: [
      params.sourceCleanupPlan
        ? `SourceCleanupPlan ${params.sourceCleanupPlan.id} supplied candidate trim decisions.`
        : 'SourceCleanupPlan was missing; no retake candidates can be selected.',
    ],
  }
}

export function createTrimReviewPlan(params: CreateTrimReviewPlanParams): TrimReviewPlan {
  const sourceCleanupPlan = params.sourceCleanupPlan ?? params.input.sourceCleanupPlan
  const retakeSelectionPlan = createRetakeSelectionPlan({
    input: params.input,
    sourceCleanupPlan,
    videoUnderstandingReport: params.videoUnderstandingReport,
  })
  const meaningPreservationValidationPlan = createMeaningPreservationValidationPlan({
    adaptiveEditStrategyPlan: params.adaptiveEditStrategyPlan,
    input: params.input,
    retakeSelectionPlan,
    segmentEditPlans: params.segmentEditPlans,
    sourceCleanupPlan,
    videoUnderstandingReport: params.videoUnderstandingReport,
  })
  const riskyUserReview = meaningPreservationValidationPlan.userReviewItems.some((item) => item.severity === 'blocking' || item.status === 'blocking')
  const lowConfidenceReview = retakeSelectionPlan.items.some((item) => item.userReviewRequired && item.confidence === 'low')
  const approvalBlockReasons = [
    ...(sourceCleanupPlan?.status === 'confirmed' ? [] : ['Cleanup preference must be confirmed before trim review approval.']),
    ...meaningPreservationValidationPlan.blockingReasons,
    ...(lowConfidenceReview ? ['Low-confidence retake selection requires user review before approval.'] : []),
    ...(riskyUserReview ? ['Risky meaning preservation item requires user review before approval.'] : []),
  ]
  const approvalBlocked =
    approvalBlockReasons.length > 0 ||
    meaningPreservationValidationPlan.status === 'blocking' ||
    meaningPreservationValidationPlan.status === 'failed' ||
    riskyUserReview ||
    lowConfidenceReview
  const nextUserQuestions = [
    ...retakeSelectionPlan.items
      .filter((item) => item.userReviewRequired)
      .map((item) => `Which take should I use for ${item.label}?`),
    ...meaningPreservationValidationPlan.userReviewItems
      .filter((item) => item.category === 'evidence_context' || item.category === 'documentary_safety')
      .map((item) => `Can I cut or shorten this proof/context safely? ${item.relatedClipIds.join(', ')}`),
    ...(sourceCleanupPlan?.selectedPreference === 'aggressive_cleanup' && meaningPreservationValidationPlan.userReviewRequired
      ? ['Do you want a tighter version, or should I preserve a more natural/context-safe version?']
      : []),
  ]

  return {
    id: `trim-review-${params.input.editingCategory}-${params.input.editLevel}`,
    summary: approvalBlocked
      ? 'Trim review found items that need user review before approval.'
      : 'Trim review is mock-reviewable with retake and meaning preservation checks.',
    retakeSelectionPlan,
    meaningPreservationValidationPlan,
    approvalBlocked,
    approvalBlockReasons: Array.from(new Set(approvalBlockReasons)),
    userFacingReviewSummary: [
      retakeSelectionPlan.summary,
      meaningPreservationValidationPlan.summary,
      approvalBlocked
        ? 'Approval is locked until risky trim review items are resolved.'
        : 'Retake selection and meaning preservation are reviewable in this mock plan.',
    ],
    nextUserQuestions: Array.from(new Set(nextUserQuestions)),
    qaChecks: [
      'Retake selections include reasons and confidence.',
      'Meaning preservation validation exists before approval.',
      'Risky cuts require review or block approval.',
      'No real transcript/media comparison is implied.',
    ],
    limitations: [
      'Mock-only trim review.',
      'No real transcript comparison has run.',
      'No real semantic analysis has run.',
      'No real media analysis has run.',
      'No FFmpeg, VapourSynth, AudioFlux, Signalsmith Stretch, Remotion rendering, provider call, backend, or worker execution has run.',
    ],
  }
}
