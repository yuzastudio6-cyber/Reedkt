import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildSegmentCandidates,
  buildSmartCutPlan,
  buildSmartCutQAResults,
  evaluateMeaningPreservation,
  evaluateSceneCutSafety,
  evaluateSpeechCutBoundary,
  getPacingProfile,
  isMidWordCut,
  planFillerCuts,
  planRepeatedTakeSelection,
  planSilenceDeadspace,
  resolvePacingProfile,
  runSmartCutFoundation,
  scoreSegmentCandidates,
} from '../workers/smart-cut'
import type { SmartCutPlan } from '../workers/smart-cut'
import {
  buildHyperframeTimelineBridge,
  buildOpenTimelineIOStyleManifest,
  buildReeditproTimelineManifest,
  buildRemotionCompositionManifest,
  buildTimelineArtifact,
  buildTimelineQAResults,
  runTimelineFoundation,
  serializeOpenTimelineIOStyleManifest,
} from '../workers/timeline'
import type { TranscriptSegment, TranscriptWord } from '../workers/speech'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function expectRejects(fn: () => unknown | Promise<unknown>, message: string): Promise<void> {
  let rejected = false
  try {
    await fn()
  } catch {
    rejected = true
  }
  check(rejected, message)
}

const transcriptSegments = buildMockTranscript()
const words = transcriptSegments.flatMap((segment) => segment.words)
const fillerSegments = [{ startSeconds: 2.1, endSeconds: 2.32, label: 'um', confidence: 0.92 }]
const repeatedTakeCandidates = [{
  candidateId: 'repeat-review-line',
  ranges: [
    { startSeconds: 2, endSeconds: 3.7 },
    { startSeconds: 4.1, endSeconds: 5.7 },
  ],
  reason: 'Mock repeated take for deterministic smoke.',
  confidence: 0.88,
}]
const silenceSegments = [
  { startSeconds: 1.8, endSeconds: 2.1, confidence: 0.85 },
  { startSeconds: 5.8, endSeconds: 7.4, confidence: 0.91 },
]

const candidates = buildSegmentCandidates({
  mode: 'dry_run',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  mediaDurationSeconds: 9,
  transcriptSegments,
  wordTimestamps: words,
  fillerSegments,
  repeatedTakeCandidates,
  silenceSegments,
})
check(candidates.some((candidate) => candidate.candidateType === 'transcript'), 'Segment candidate builder must create transcript-based candidates.')

const fallbackCandidates = buildSegmentCandidates({
  mode: 'dry_run',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  mediaDurationSeconds: 10,
})
check(fallbackCandidates.length === 1 && fallbackCandidates[0]?.candidateType === 'fallback', 'Segment candidate builder must create fallback media-duration segment when transcript is missing.')

const profile = resolvePacingProfile({ profileId: 'talking_head_tight', aggressiveness: 'balanced' })
const scoresA = scoreSegmentCandidates(candidates, profile)
const scoresB = scoreSegmentCandidates(candidates, profile)
check(JSON.stringify(scoresA) === JSON.stringify(scoresB), 'Segment score engine must produce deterministic scores.')

const silencePlan = planSilenceDeadspace({ silenceSegments, pacingProfile: profile })
check(silencePlan.rejectedCandidates.some((candidate) => candidate.reason.includes('Short natural pause')), 'Silence planner must preserve short natural pauses.')
check(silencePlan.removeSegments.some((segment) => segment.startSeconds === 5.8), 'Silence planner must propose long silence removal.')

const fillerPlan = planFillerCuts({ fillerSegments, wordTimestamps: words })
check(fillerPlan.removeSegments.length === 1, 'Filler planner must propose only safe filler removals.')

const repeatedPlan = planRepeatedTakeSelection({ repeatedTakeCandidates, transcriptSegments, fillerSegments })
check(repeatedPlan.keepSegments.length === 1, 'Repeated-take planner must keep at least one version.')
check(repeatedPlan.removeSegments.length === 1, 'Repeated-take planner may reject lower-ranked versions only.')

check(isMidWordCut(2.22, words), 'Speech cut boundary policy must detect mid-word cuts.')
const boundary = evaluateSpeechCutBoundary({ boundaryId: 'boundary-smoke', timeSeconds: 2.22, words })
check(boundary.risks.includes('mid_word'), 'Speech cut boundary policy must reject mid-word cuts.')
check(boundary.adjustedTimeSeconds !== 2.22 && boundary.paddingAfterSeconds > 0, 'Speech cut boundary policy must add safe padding/adjustment.')

const sceneSafety = evaluateSceneCutSafety({ cutTimeSeconds: 3, sceneBoundaries: [] })
check(sceneSafety.warnings.some((warning) => warning.includes('Scene data is missing')), 'Scene cut safety policy must warn when scene data is missing.')

const meaningFindings = evaluateMeaningPreservation({
  candidates,
  proposedRemovals: [{
    decisionId: 'remove-hook-risk',
    candidateId: candidates[0]?.candidateId ?? 'missing',
    startSeconds: 0.2,
    endSeconds: 1,
    score: 0.5,
    confidence: 0.8,
    reason: 'Test removal near hook.',
    risks: ['meaning_loss'],
  }],
  pacingProfile: profile,
})
check(meaningFindings.some((finding) => finding.code === 'possible_context_loss'), 'Meaning preservation policy must flag possible context loss.')

const natural = getPacingProfile('natural_clean')
const socialFast = getPacingProfile('social_fast')
check(socialFast.maxSilenceSeconds < natural.maxSilenceSeconds, 'Pacing policy must change thresholds by profile.')

const plan = buildSmartCutPlan({
  mode: 'dry_run',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  mediaDurationSeconds: 9,
  transcriptSegments,
  wordTimestamps: words,
  fillerSegments,
  repeatedTakeCandidates,
  silenceSegments,
  aggressiveness: 'balanced',
  pacingProfileId: 'talking_head_tight',
})
check(plan.keepSegments.length > 0, 'Smart cut plan builder must create keep segments.')
check(plan.removeSegments.length > 0, 'Smart cut plan builder must create remove segments.')
check(plan.protectedSegments.length > 0, 'Smart cut plan builder must create protected segments.')

const overlapPlan: SmartCutPlan = {
  ...plan,
  removeSegments: [{
    decisionId: 'remove-overlap',
    candidateId: plan.keepSegments[0]?.candidateId ?? 'missing',
    startSeconds: plan.keepSegments[0]?.startSeconds ?? 0,
    endSeconds: plan.keepSegments[0]?.endSeconds ?? 1,
    score: 0.8,
    confidence: 0.8,
    reason: 'Forced overlap smoke.',
    risks: ['audio_pop_risk'],
  }],
}
check(buildSmartCutQAResults({
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  plan: overlapPlan,
}).issues.some((issue) => issue.includes('overlaps')), 'Smart cut QA must catch overlapping segments.')

const negativePlan: SmartCutPlan = {
  ...plan,
  keepSegments: [{ ...(plan.keepSegments[0] as SmartCutPlan['keepSegments'][number]), startSeconds: -1 }],
}
check(buildSmartCutQAResults({
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  plan: negativePlan,
}).issues.some((issue) => issue.includes('negative')), 'Smart cut QA must catch negative timestamps.')

const protectedPlan: SmartCutPlan = {
  ...plan,
  protectedSegments: [plan.keepSegments[0] as SmartCutPlan['protectedSegments'][number]],
  removeSegments: [{
    decisionId: 'remove-protected',
    candidateId: plan.keepSegments[0]?.candidateId ?? 'missing',
    startSeconds: plan.keepSegments[0]?.startSeconds ?? 0,
    endSeconds: plan.keepSegments[0]?.endSeconds ?? 1,
    score: 0.8,
    confidence: 0.8,
    reason: 'Forced protected overlap smoke.',
    risks: ['meaning_loss'],
  }],
}
check(buildSmartCutQAResults({
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  plan: protectedPlan,
}).issues.some((issue) => issue.includes('protected')), 'Smart cut QA must ensure protected segments are not removed.')

const timelineManifest = buildReeditproTimelineManifest({
  mode: 'dry_run',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  editPlanId: 'edit-plan-smart-cut-smoke',
  approvedSnapshotId: 'approved-snapshot-smart-cut-smoke',
  smartCutPlan: plan,
  captionArtifactIds: ['caption-artifact-smoke'],
})
check(timelineManifest.clips.length === plan.keepSegments.length, 'Timeline builder must map keep segments to timeline clips.')

const otio = buildOpenTimelineIOStyleManifest({ timelineManifest, mediaReferencePath: 'reeditpro://source-media-smoke', fps: 30 })
check(serializeOpenTimelineIOStyleManifest(otio).includes('Timeline.1'), 'OpenTimelineIO manifest builder must create JSON-style manifest without package import.')

const hyperframe = buildHyperframeTimelineBridge(timelineManifest)
check(hyperframe.bridgeType === 'hyperframe_timeline_bridge' && hyperframe.clips.length > 0, 'Hyperframe bridge must create future preview timeline object without frontend runtime.')

const remotion = buildRemotionCompositionManifest({ timelineManifest, fps: 30, captionArtifactIds: ['caption-artifact-smoke'] })
check(remotion.manifestType === 'remotion_composition_manifest' && remotion.durationInFrames > 0, 'Remotion bridge must create composition metadata without rendering.')

const timelineArtifact = await buildTimelineArtifact({
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  artifactType: 'timeline_manifest',
  fileName: 'timeline-smoke.json',
  payload: timelineManifest,
  mode: 'dry_run',
})
check(timelineArtifact.artifact.isPrivate && timelineArtifact.artifact.sourceOfTruth, 'Timeline artifact builder must create private source-of-truth refs.')

const timelineQa = buildTimelineQAResults({
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  timelineManifest,
})
check(timelineQa.some((gate) => gate.gateType === 'render_timeline_integrity'), 'Timeline QA must emit render_timeline_integrity gate.')

const smartCutDryRun = await runSmartCutFoundation({
  mode: 'dry_run',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  mediaDurationSeconds: 9,
  transcriptSegments,
  wordTimestamps: words,
  fillerSegments,
  repeatedTakeCandidates,
  silenceSegments,
})
check(smartCutDryRun.status === 'dry_run' && Boolean(smartCutDryRun.smartCutPlan), 'Smart cut dry-run runner must work without FFmpeg/OpenTimelineIO.')

const timelineDryRun = await runTimelineFoundation({
  mode: 'dry_run',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  editPlanId: 'edit-plan-smart-cut-smoke',
  approvedSnapshotId: 'approved-snapshot-smart-cut-smoke',
  smartCutPlan: plan,
})
check(timelineDryRun.status === 'dry_run' && Boolean(timelineDryRun.timelineManifest), 'Timeline dry-run runner must work without runtime packages.')

const smartCutBlocked = await runSmartCutFoundation({
  mode: 'production_blocked',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
})
check(smartCutBlocked.status === 'blocked', 'Smart cut production-blocked mode must refuse real cutting.')

const timelineBlocked = await runTimelineFoundation({
  mode: 'production_blocked',
  workspaceId: 'workspace-smart-cut-smoke',
  projectId: 'project-smart-cut-smoke',
  mediaAssetId: 'media-smart-cut-smoke',
  editPlanId: 'edit-plan-smart-cut-smoke',
  approvedSnapshotId: 'approved-snapshot-smart-cut-smoke',
  smartCutPlan: plan,
})
check(timelineBlocked.status === 'blocked', 'Timeline production-blocked mode must refuse render/export.')

await expectRejects(
  () => runSmartCutFoundation({
    mode: 'dry_run',
    workspaceId: 'workspace-smart-cut-smoke',
    projectId: 'project-smart-cut-smoke',
    mediaAssetId: 'media-smart-cut-smoke',
    workerPayload: buildPayload('cpu_analysis_worker', { rawPrompt: 'cut it from chat' }),
  }),
  'Smart cut runner must reject raw prompt payloads.',
)

await expectRejects(
  () => runTimelineFoundation({
    mode: 'dry_run',
    workspaceId: 'workspace-smart-cut-smoke',
    projectId: 'project-smart-cut-smoke',
    mediaAssetId: 'media-smart-cut-smoke',
    editPlanId: 'edit-plan-smart-cut-smoke',
    approvedSnapshotId: 'approved-snapshot-smart-cut-smoke',
    smartCutPlan: plan,
    workerPayload: buildPayload('render_worker', undefined, ['https://storage.googleapis.com/timeline?X-Goog-Signature=abc'], ['remotion']),
  }),
  'Timeline runner must reject signed URL payloads.',
)

const smartCutRouted = await runProductionWorkerRuntime({
  payload: buildPayload('cpu_analysis_worker', {
    smartCutFoundation: {
      mode: 'dry_run',
      mediaDurationSeconds: 9,
      intent: ['remove_dead_space', 'preserve_story'],
      pacingProfileId: 'talking_head_tight',
    },
  }, ['workspaces/workspace-smart-cut-smoke/projects/project-smart-cut-smoke/analysis/media-analysis.json'], ['opentimelineio']),
})
check(smartCutRouted.status === 'completed', 'Explicit smartCutFoundation route should complete in dry-run.')
check(smartCutRouted.output?.futureHandler === 'cpu_analysis_worker_smart_cut_foundation', 'Smart cut route must be explicit.')

const timelineRouted = await runProductionWorkerRuntime({
  payload: buildPayload('render_worker', {
    timelineFoundation: {
      mode: 'dry_run',
      mediaDurationSeconds: 9,
      sourceStorageObjectPath: 'workspaces/workspace-smart-cut-smoke/projects/project-smart-cut-smoke/source/source.mp4',
      captionArtifactIds: ['caption-artifact-smoke'],
    },
  }, ['workspaces/workspace-smart-cut-smoke/projects/project-smart-cut-smoke/timeline/timeline.json'], ['remotion']),
})
check(timelineRouted.status === 'completed', 'Explicit timelineFoundation route should complete in dry-run.')
check(timelineRouted.output?.futureHandler === 'render_worker_timeline_foundation', 'Timeline route must be explicit.')

const combined = JSON.stringify({ smartCutDryRun, timelineDryRun, smartCutRouted, timelineRouted }).toLowerCase()
check(!combined.includes('revideo'), 'Smart cut/timeline foundation must not use Revideo.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'transcript_candidates',
    'missing_transcript_fallback',
    'deterministic_scores',
    'short_pause_preserved',
    'long_silence_removal',
    'safe_filler_removal',
    'repeated_take_keeper',
    'mid_word_cut_rejected',
    'safe_padding_added',
    'scene_missing_warning',
    'meaning_context_warning',
    'pacing_thresholds',
    'smart_cut_plan',
    'smart_cut_qa_overlap_negative_protected',
    'timeline_manifest_clips',
    'otio_style_manifest',
    'hyperframe_bridge',
    'remotion_manifest',
    'private_timeline_artifacts',
    'timeline_qa',
    'dry_run_runners',
    'production_blocked',
    'raw_prompt_signed_url_rejected',
    'explicit_worker_routes',
    'no_revideo',
  ],
}))

function buildMockTranscript(): TranscriptSegment[] {
  return [
    segment('segment-hook', 0, 1.8, ['Here', 'is', 'the', 'important', 'setup', 'for', 'this', 'story.'], 0.95),
    segment('segment-filler', 2.1, 2.32, ['um'], 0.9),
    segment('segment-repeat-a', 2.4, 3.7, ['This', 'take', 'is', 'ready', 'for', 'review.'], 0.76),
    segment('segment-repeat-b', 4.1, 5.7, ['This', 'take', 'is', 'ready', 'for', 'review.'], 0.94),
  ]
}

function segment(segmentId: string, start: number, end: number, tokens: string[], confidence: number): TranscriptSegment {
  return {
    segmentId,
    startSeconds: start,
    endSeconds: end,
    text: tokens.join(' '),
    confidence,
    words: makeWords(segmentId, start, end, tokens),
  }
}

function makeWords(segmentId: string, start: number, end: number, tokens: string[]): TranscriptWord[] {
  const duration = end - start
  return tokens.map((word, index) => ({
    word,
    startSeconds: Number((start + (duration / tokens.length) * index).toFixed(3)),
    endSeconds: Number((start + (duration / tokens.length) * (index + 1)).toFixed(3)),
    confidence: 0.9,
    segmentId,
  }))
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata?: Record<string, unknown>,
  storageReferenceIds = ['workspaces/workspace-smart-cut-smoke/projects/project-smart-cut-smoke/source/source.mp4'],
  requestedToolIds: ProductionWorkerJobPayload['requestedToolIds'] = ['opentimelineio'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `prod-smart-cut-${workerType}`,
    workspaceId: 'workspace-smart-cut-smoke',
    projectId: 'project-smart-cut-smoke',
    mediaAssetId: 'media-smart-cut-smoke',
    approvedSnapshotId: 'approved-snapshot-smart-cut-smoke',
    editPlanId: 'edit-plan-smart-cut-smoke',
    toolExecutionPlanId: 'tool-execution-smart-cut-smoke',
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds,
    requestedRecipeIds: workerType === 'render_worker' ? ['motion_graphics_recipe'] : ['smart_cut_recipe'],
    storageReferenceIds,
    createdAt: new Date().toISOString(),
    metadata,
  }
  return { ...payload, idempotencyKey: buildWorkerIdempotencyKey(payload) }
}
