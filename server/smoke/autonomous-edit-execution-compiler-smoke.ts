import assert from 'node:assert/strict'
import type { AutonomousEditPlanDraft } from '../../src/types'
import { compileAutonomousEditExecution } from '../services/autonomous-edit-execution-compiler'
import type { ApprovedLocalEditPlanRecord } from '../services/project-edit-plan-service'

const plan: AutonomousEditPlanDraft = {
  version: 'autonomous-edit-plan-v1',
  planId: 'plan-execution-smoke',
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  editSessionId: 'edit-smoke',
  status: 'ready_for_approval',
  title: 'Evidence-backed edit',
  summary: 'Keep the two strongest complete source ideas and present them clearly.',
  userIntentSummary: 'Create a concise vertical edit with emphasized captions.',
  storyStrategy: 'Open on the strongest statement and finish on its supporting explanation.',
  sourceOrderPolicy: 'preserve_unless_evidence_supports_change',
  outputFrame: { aspectRatio: '9:16', platformTarget: 'instagram_reel', width: 540, height: 960, confirmed: true },
  segments: [{
    id: 'opening',
    role: 'hook',
    sourceStartSeconds: 2,
    sourceEndSeconds: 5,
    objective: 'Open on the complete promise.',
    narrativeReason: 'This is the first complete high-information phrase.',
    transcriptEvidence: ['transcript-opening'],
    visualEvidence: ['frame-opening'],
    operations: [{
      operationId: 'timeline.trim',
      instruction: 'Use the complete phrase from two to five seconds.',
      rationale: 'Removes only leading setup.',
      skillKeys: ['clean_cuts'],
      sourceEvidenceRefs: ['transcript-opening', 'frame-opening'],
      requiredQaChecks: ['meaning_preserved'],
    }, {
      operationId: 'caption.style',
      instruction: 'Use compact phrase captions with one evidence-supported keyword emphasized.',
      rationale: 'Improves comprehension without covering the presenter.',
      skillKeys: ['caption_design', 'caption_keyword_emphasis'],
      sourceEvidenceRefs: ['transcript-opening', 'frame-opening'],
      requiredQaChecks: ['caption_readability', 'caption_safe_zone'],
      executionSpec: {
        kind: 'caption', placement: 'middle_safe', typography: 'clean_bold', textCase: 'sentence',
        emphasis: 'keyword_color_and_scale', animation: 'keyword_pop', accentColor: '#62e6ff',
        maxWordsPerCue: 5, maxLines: 2, emphasisTerms: ['faster'],
      },
    }],
    captionDirection: 'Bold social phrase captions with keyword emphasis in the middle safe zone.',
    visualDirection: 'Keep the presenter primary.',
    audioDirection: 'Preserve the natural voice.',
    transitionDirection: 'Direct cut.',
    requiredQaChecks: ['meaning_preserved'],
  }, {
    id: 'support',
    role: 'proof',
    sourceStartSeconds: 7,
    sourceEndSeconds: 10,
    objective: 'Finish on the supporting explanation.',
    narrativeReason: 'The second phrase explains the opening claim.',
    transcriptEvidence: ['transcript-support'],
    visualEvidence: ['frame-support'],
    operations: [{
      operationId: 'timeline.smart_cut',
      instruction: 'Continue with the complete supporting phrase.',
      rationale: 'Preserves the explanation while omitting the unrelated pause.',
      skillKeys: ['pacing_cleanup'],
      sourceEvidenceRefs: ['transcript-support', 'frame-support'],
      requiredQaChecks: ['meaning_preserved'],
    }, {
      operationId: 'render.compose',
      instruction: 'Compose a private vertical review from the approved layers.',
      rationale: 'Produces the review artifact in the confirmed frame.',
      skillKeys: ['render_manifest_planning'],
      sourceEvidenceRefs: ['frame-support'],
      requiredQaChecks: ['render_timeline_integrity'],
    }, {
      operationId: 'qa.validate',
      instruction: 'Validate intent, meaning, captions, audio, frame, and private artifact policy.',
      rationale: 'Blocks delivery when the result departs from the approved edit.',
      skillKeys: ['professional_edit_qa'],
      sourceEvidenceRefs: ['transcript-support', 'frame-support'],
      requiredQaChecks: ['user_intent_satisfied', 'private_artifact_only'],
    }],
    captionDirection: 'Continue the same emphasized caption system.',
    visualDirection: 'Keep the presenter primary and the frame uncluttered.',
    audioDirection: 'Preserve speech clarity.',
    transitionDirection: 'End cleanly without a decorative transition.',
    requiredQaChecks: ['meaning_preserved', 'final_delivery'],
  }],
  skillSelections: [{
    skillKey: 'clean_cuts', reason: 'Leading setup is outside the complete statement.', required: true,
    segmentIds: ['opening'], operationIds: ['timeline.trim'],
  }, {
    skillKey: 'caption_keyword_emphasis', reason: 'The user requested emphasized social captions.', required: true,
    segmentIds: ['opening', 'support'], operationIds: ['caption.style'],
  }, {
    skillKey: 'render_manifest_planning', reason: 'The approved edit needs a private review composition.', required: true,
    segmentIds: ['support'], operationIds: ['render.compose'],
  }, {
    skillKey: 'professional_edit_qa', reason: 'Final output must match the approved plan.', required: true,
    segmentIds: ['support'], operationIds: ['qa.validate'],
  }],
  globalQaChecks: ['user_intent_satisfied', 'source_meaning_preserved'],
  clarificationQuestions: [],
  blockers: [],
  sourceEvidence: {
    evidenceVersion: 'autonomous-edit-source-evidence-v1',
    sourceStorageObjectRecordId: 'storage-smoke',
    sourceChecksumSha256: 'b'.repeat(64),
    probe: { durationSeconds: 12, width: 1080, height: 1920, frameRate: 30, videoStreamCount: 1, audioStreamCount: 1 },
    transcript: { status: 'completed', language: 'en', segmentCount: 2, wordCount: 5, transcriptArtifactId: 'transcript-smoke', wordTimestampArtifactId: 'words-smoke' },
    audio: { status: 'completed', integratedLufs: -18, truePeakDb: -2, clippingDetected: false, noiseCondition: 'low', silenceRanges: [], analysisMethods: ['ffmpeg_loudnorm_measurement'], blockers: [] },
    visualRhythm: { status: 'completed', detectedCutTimesSeconds: [4.8], detectedCutCount: 1, averageShotDurationSeconds: 6, pacingClass: 'measured', threshold: 0.32, analysisMethods: ['ffmpeg_scene_change_measurement'], blockers: [] },
    color: { status: 'completed', sampledFrameCount: 6, averageLuma: 124, exposureCondition: 'balanced', contrastCondition: 'balanced', analysisMethods: ['ffmpeg_signalstats_measurement'], blockers: [] },
    visualUnderstanding: {
      status: 'completed', sampledFrameCount: 2, summary: 'Presenter in a vertical frame.',
      visibleSubjects: ['presenter'], visibleObjects: [], screenTextRegions: [], compositionRisks: [], brollOpportunities: [],
      captionObservations: [], styleObservations: ['clean vertical source'],
      frameEvidence: [],
      evidenceArtifactIds: ['frame-opening', 'frame-support'],
    },
    privateArtifactIds: ['transcript-smoke', 'words-smoke', 'frame-opening', 'frame-support'],
    blockers: [],
  },
  runtime: {
    plannerSource: 'qwen_live', providerCallMade: true, qwenCallMade: true, mediaAnalysisRun: true,
    transcriptionRun: true, visualUnderstandingRun: true, deterministicCreativeFallbackUsed: false,
    rawPromptStored: false, workerExecutionStarted: false, renderStarted: false, creditReservedOrSpent: false,
  },
  approvalRequired: true,
  approved: false,
  createdAt: '2026-07-09T19:00:00.000Z',
  warnings: [],
}

const approvedLocalPlan: ApprovedLocalEditPlanRecord = {
  id: 'approved-plan-record-smoke', editPlanId: plan.planId, creditEstimateId: 'estimate-smoke',
  workspaceId: plan.workspaceId, projectId: plan.projectId, editSessionId: plan.editSessionId,
  approvedByUserId: 'user-smoke', approvedAt: '2026-07-09T19:01:00.000Z', status: 'approved',
  approvedLocalPlan: {
    approved: true,
    creditEstimate: { lowCredits: 4, expectedCredits: 6, highCredits: 9, creditConversion: '1 credit = $0.10', serviceFeeIncluded: false },
    planId: plan.planId,
    steps: plan.segments.map((segment) => ({ label: segment.id, summary: segment.objective })),
    operationManifest: {
      version: 'project-edit-operation-manifest-v2', sourceFileName: 'source.mp4', sourceDurationSeconds: 12,
      sourceAspectRatio: '9:16', outputFrame: { ...plan.outputFrame, source: 'edit_session_metadata' },
      professionalBaseline: 'clean_professional', sourceOrderPolicy: 'preserve_source_order_until_user_approves_reorder',
      mediaIntelligenceStatus: 'analyzed_private_source_evidence', sourceEvidenceVersion: 'autonomous-edit-source-evidence-v1',
      sourceEvidenceArtifactIds: plan.sourceEvidence.privateArtifactIds, operations: [], requiredQaChecks: plan.globalQaChecks,
      workerExecutionReady: false, productReady: false, warnings: [],
    },
    planningEvidence: {
      attemptId: 'attempt-smoke', autonomousPlanVersion: 'autonomous-edit-plan-v1', sourceEvidenceVersion: 'autonomous-edit-source-evidence-v1',
      plannerSource: 'qwen_live', providerCallMade: true, qwenCallMade: true, mediaAnalysisRun: true, transcriptionRun: true,
      visualUnderstandingRun: true, deterministicCreativeFallbackUsed: false, rawPromptStored: false,
      privateArtifactIds: plan.sourceEvidence.privateArtifactIds, createdAt: plan.createdAt,
    },
    autonomousPlanSnapshot: plan,
    directionSource: 'chat_prompt',
    skillPlan: {
      version: 'project-edit-skill-plan-v1', directionSource: 'chat_prompt', directionSummary: plan.userIntentSummary,
      activities: [], selectedSkillKeys: plan.skillSelections.map((selection) => selection.skillKey), blockedSkillKeys: [],
      planningOnly: true, exposesInternalToolNames: false, productReady: false, warnings: [],
    },
    briefLineage: { briefId: 'prompt-smoke', revisionNumber: 1, briefFingerprint: 'fingerprint-smoke' },
    summary: plan.summary, title: plan.title,
  },
  briefLineage: { briefId: 'prompt-smoke', revisionNumber: 1, briefFingerprint: 'fingerprint-smoke' },
  source: {
    storageObjectRecordId: 'storage-smoke', mediaAssetId: 'asset-smoke', bucketName: 'source-media',
    objectPath: 'workspace/project/source.mp4', fileName: 'source.mp4', mimeType: 'video/mp4', sizeBytes: 4096,
    checksumSha256: 'b'.repeat(64),
  },
  backendLocalPlanStored: true, readbackVerified: true, providerCallMade: false, workerJobCreated: false,
  renderJobCreated: false, creditReservedOrSpent: false, supabaseWriteMade: false, gcsWriteMade: false,
  productReady: false, mockOnly: true, warnings: [],
}

const transcriptSegments = [{
  segmentId: 'source-opening', startSeconds: 2.1, endSeconds: 4.8, text: 'Build videos much faster.',
  words: [
    word('Build', 2.1, 2.5, 'source-opening'), word('videos', 2.5, 3.0, 'source-opening'),
    word('much', 3.1, 3.5, 'source-opening'), word('faster.', 3.6, 4.2, 'source-opening'),
  ],
}, {
  segmentId: 'source-support', startSeconds: 7.2, endSeconds: 9.6, text: 'Keep creative control.',
  words: [word('Keep', 7.2, 7.6, 'source-support'), word('creative', 7.7, 8.4, 'source-support'), word('control.', 8.5, 9.2, 'source-support')],
}]

const compiled = compileAutonomousEditExecution({
  approvedLocalPlan,
  approvedSnapshotId: 'snapshot-smoke',
  creditApprovalId: 'credit-approval-smoke',
  creditReservationId: 'credit-reservation-smoke',
  transcriptSegments,
  sourceStorageObjectPath: approvedLocalPlan.source.objectPath,
  fps: 30,
})

assert.equal(compiled.timelineManifest.durationSeconds, 6)
assert.equal(compiled.timelineManifest.clips.length, 2)
assert.equal(compiled.timelineTranscriptSegments[0]?.startSeconds, 0.1)
assert.equal(compiled.timelineTranscriptSegments[1]?.startSeconds, 3.2)
assert.equal(compiled.timelineTranscriptSegments.map((segment) => segment.text).join(' '), 'Build videos much faster. Keep creative control.')
assert.equal(compiled.captionDirection.stylePresetId, 'keyword_emphasis_captions')
assert.equal(compiled.editingAgentExecutionPlan.runMode, 'bounded_private_execution')
assert.equal(compiled.toolRoutes.every((route) => route.toolSteps.every((step) => Boolean(step.toolId))), true)
assert.equal(JSON.stringify(compiled.approvedSnapshotPayload).includes('"rawPrompt":'), false)
assert.equal(JSON.stringify(compiled).includes('internal-testing.MP4'), false)

console.log(JSON.stringify({
  ok: true,
  decision: 'autonomous_edit_execution_compiler_passed',
  timelineDurationSeconds: compiled.timelineManifest.durationSeconds,
  timelineCaptionSegmentCount: compiled.timelineTranscriptSegments.length,
  workItemCount: compiled.editingAgentExecutionPlan.workItems.length,
  toolRouteCount: compiled.toolRoutes.length,
}, null, 2))

function word(text: string, startSeconds: number, endSeconds: number, segmentId: string) {
  return { word: text, startSeconds, endSeconds, segmentId, confidence: 0.98 }
}
