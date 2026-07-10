import assert from 'node:assert/strict'
import {
  createQwenAutonomousEditPlannerPrompt,
  runQwenAutonomousEditPlanner,
} from '../../src/backend/qwen-runtime/qwen-autonomous-edit-planner-service'
import type {
  AutonomousEditPlanCandidate,
  AutonomousEditSourceEvidence,
  CreateAutonomousEditPlanRequest,
} from '../../src/types'

const request: CreateAutonomousEditPlanRequest = {
  workspaceId: 'workspace-autonomous-smoke',
  prompt: 'Create a concise professional vertical edit. Preserve the complete product explanation and use evidence-led captions and graphics.',
  source: {
    storageObjectRecordId: 'storage-autonomous-smoke',
    mediaAssetId: 'media-autonomous-smoke',
    bucketName: 'private-source-media',
    objectPath: 'workspaces/workspace-autonomous-smoke/projects/project-autonomous-smoke/source.mp4',
    fileName: 'source.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 1024,
    checksumSha256: 'a'.repeat(64),
  },
  outputFrame: {
    aspectRatio: '9:16',
    platformTarget: 'instagram_reel',
    width: 1080,
    height: 1920,
    confirmed: true,
  },
  editBrief: {
    briefId: 'brief-autonomous-smoke',
    revisionNumber: 2,
    briefFingerprint: 'brief-fingerprint-smoke',
    summary: 'Keep the speaker credible and make the product idea easy to understand.',
  },
  preferences: {
    pacing: 'tight but natural',
    captionStyle: 'clear hierarchy with selective emphasis',
  },
  analysisMode: 'local_internal',
}

const sourceEvidence: AutonomousEditSourceEvidence = {
  evidenceVersion: 'autonomous-edit-source-evidence-v1',
  sourceStorageObjectRecordId: request.source.storageObjectRecordId,
  sourceChecksumSha256: request.source.checksumSha256,
  probe: {
    durationSeconds: 20,
    width: 1080,
    height: 1920,
    frameRate: 30,
    videoStreamCount: 1,
    audioStreamCount: 1,
  },
  transcript: {
    status: 'completed',
    language: 'en',
    confidence: 0.96,
    segmentCount: 2,
    wordCount: 13,
    transcriptArtifactId: 'artifact-transcript-smoke',
    wordTimestampArtifactId: 'artifact-words-smoke',
  },
  audio: {
    status: 'completed', integratedLufs: -20.4, truePeakDb: -2.1, peakDb: -2.1, rmsDb: -23.2,
    noiseFloorDb: -48, clippingDetected: false, noiseCondition: 'moderate', silenceRanges: [],
    analysisMethods: ['ffmpeg_loudnorm_measurement', 'ffmpeg_astats_measurement'], blockers: [],
  },
  visualRhythm: {
    status: 'completed', detectedCutTimesSeconds: [8], detectedCutCount: 1,
    averageShotDurationSeconds: 10, pacingClass: 'slow', threshold: 0.32,
    analysisMethods: ['ffmpeg_scene_change_measurement'], blockers: [],
  },
  color: {
    status: 'completed', sampledFrameCount: 10, averageLuma: 118, minimumLuma: 14, maximumLuma: 238,
    averageSaturation: 42, exposureCondition: 'balanced', contrastCondition: 'balanced',
    analysisMethods: ['ffmpeg_signalstats_measurement'], blockers: [],
  },
  visualUnderstanding: {
    status: 'completed',
    sampledFrameCount: 4,
    summary: 'One centered speaker demonstrates a software product. Empty upper-right space can hold a concise callout.',
    visibleSubjects: ['centered speaker'],
    visibleObjects: ['laptop', 'software interface'],
    screenTextRegions: ['lower-center product label'],
    compositionRisks: ['captions must not cover the product label'],
    brollOpportunities: ['software workflow callout when the speaker describes customer feedback'],
    captionObservations: [],
    styleObservations: ['clean centered talking-head composition'],
    frameEvidence: [{ frameId: 'frame-1', timeSeconds: 0, summary: 'Centered speaker with clear upper-right space.', safeZones: ['upper right'], uncertainty: [] }],
    evidenceArtifactIds: ['frame-1', 'frame-2', 'visual-report'],
  },
  privateArtifactIds: ['artifact-transcript-smoke', 'artifact-words-smoke', 'visual-report'],
  blockers: [],
}

const candidate: AutonomousEditPlanCandidate = {
  status: 'ready_for_approval',
  title: 'Clear product story',
  summary: 'A concise vertical edit that preserves the complete explanation and adds evidence-led captions and callouts.',
  userIntentSummary: 'Make the source clear, polished, readable, and suitable for a professional social review.',
  storyStrategy: 'Open on the product problem, preserve the explanation, reinforce the customer-feedback point, and end on the request for feedback.',
  segments: [{
    id: 'segment-opening-problem',
    role: 'hook',
    sourceStartSeconds: 0,
    sourceEndSeconds: 8,
    objective: 'Establish the product problem without changing the speaker\'s meaning.',
    narrativeReason: 'The opening sentence contains the clearest audience-facing problem statement.',
    transcriptEvidence: ['transcript-segment-1: Customers need a faster way to share feedback.'],
    visualEvidence: ['visual-report: centered speaker with safe upper-right callout space'],
    operations: [{
      operationId: 'timeline.smart_cut',
      instruction: 'Remove only verified dead air around complete phrases.',
      rationale: 'Tightens the hook while preserving the complete claim.',
      skillKeys: ['pacing_cleanup'],
      sourceEvidenceRefs: ['transcript-segment-1', 'visual-report'],
      requiredQaChecks: ['meaning_preservation', 'cut_smoothness'],
    }, {
      operationId: 'caption.style',
      instruction: 'Use two-line face-safe captions with selective emphasis on customer feedback.',
      rationale: 'The prompt requests readable social captions and the visual report identifies a lower-center collision risk.',
      skillKeys: ['caption_keyword_emphasis'],
      sourceEvidenceRefs: ['transcript-segment-1', 'visual-report'],
      requiredQaChecks: ['caption_timing', 'caption_readability', 'caption_safe_zone'],
      executionSpec: {
        kind: 'caption', placement: 'auto_face_safe', typography: 'clean_bold', textCase: 'sentence',
        emphasis: 'keyword_color_and_scale', animation: 'keyword_pop', accentColor: '#62e6ff',
        maxWordsPerCue: 6, maxLines: 2, emphasisTerms: ['customer feedback'],
      },
    }],
    captionDirection: 'Two-line captions below the speaker, shifted above the lower-center product label; emphasize only the phrase customer feedback.',
    visualDirection: 'Add one concise upper-right callout that restates the product problem; no decorative motion or invented statistics.',
    audioDirection: 'Preserve natural speech and normalize loudness; do not add SFX over the opening claim.',
    transitionDirection: 'Use a direct phrase-safe cut into the explanation.',
    requiredQaChecks: ['meaning_preservation', 'caption_timing', 'caption_readability', 'caption_safe_zone'],
  }, {
    id: 'segment-product-proof',
    role: 'proof',
    sourceStartSeconds: 8,
    sourceEndSeconds: 20,
    objective: 'Explain the workflow and finish on the speaker\'s feedback request.',
    narrativeReason: 'The remaining source supplies the explanation and closing action without needing invented footage.',
    transcriptEvidence: ['transcript-segment-2: The workflow helps teams turn feedback into action.'],
    visualEvidence: ['visual-report: software interface and laptop visible'],
    operations: [{
      operationId: 'graphics.compose',
      instruction: 'Build a compact three-step workflow card from the spoken sequence only.',
      rationale: 'The explanation contains an ordered process that benefits from a visual summary.',
      skillKeys: ['framework_diagram_design'],
      sourceEvidenceRefs: ['transcript-segment-2', 'visual-report'],
      requiredQaChecks: ['source_truth', 'graphic_readability', 'caption_safe_zone'],
      executionSpec: {
        kind: 'graphic', graphicId: 'workflow-card', graphicType: 'process_steps', title: 'Feedback into action',
        bodyLines: ['Capture feedback', 'Prioritize the signal', 'Turn it into action'], sourceLabel: 'Spoken workflow',
        placement: 'top_right', visualStyle: 'clean_panel', accentColor: '#62e6ff',
        startOffsetSeconds: 0.4, endOffsetSeconds: 8.8,
        motion: { enter: 'fade_up', exit: 'fade', enterDurationSeconds: 0.3, exitDurationSeconds: 0.25 },
        contentEvidenceRefs: ['transcript-segment-2', 'visual-report'],
      },
    }, {
      operationId: 'qa.validate',
      instruction: 'Verify the final request for feedback remains complete and unaltered.',
      rationale: 'The closing request is necessary to preserve the source intent.',
      skillKeys: ['source_safety_qa'],
      sourceEvidenceRefs: ['transcript-segment-2'],
      requiredQaChecks: ['meaning_preservation', 'final_delivery'],
    }],
    captionDirection: 'Continue the same hierarchy and emphasize only action words supported by the transcript.',
    visualDirection: 'Reveal the three-step workflow card as each step is spoken, then clear it before the final feedback request.',
    audioDirection: 'Keep speech primary with a subtle bed only if it does not reduce intelligibility.',
    transitionDirection: 'Use a restrained card reveal tied to spoken step boundaries.',
    requiredQaChecks: ['source_truth', 'graphic_readability', 'meaning_preservation', 'final_delivery'],
  }],
  skillSelections: [{
    skillKey: 'pacing_cleanup',
    reason: 'The source contains complete speech phrases that can be tightened without changing meaning.',
    required: true,
    segmentIds: ['segment-opening-problem'],
    operationIds: ['timeline.smart_cut'],
  }, {
    skillKey: 'caption_keyword_emphasis',
    reason: 'Readable social captions are explicitly requested and supported by word timing.',
    required: true,
    segmentIds: ['segment-opening-problem', 'segment-product-proof'],
    operationIds: ['caption.style'],
  }, {
    skillKey: 'framework_diagram_design',
    reason: 'The transcript contains an ordered process and the visual evidence identifies safe callout space.',
    required: true,
    segmentIds: ['segment-product-proof'],
    operationIds: ['graphics.compose'],
  }],
  globalQaChecks: ['meaning_preservation', 'caption_timing', 'caption_readability', 'caption_safe_zone', 'source_truth', 'final_delivery'],
  clarificationQuestions: [],
  blockers: [],
}

const privateEvidence = {
  transcriptText: 'Customers need a faster way to share feedback. The workflow helps teams turn feedback into action.',
  transcriptSegments: [
    { id: 'transcript-segment-1', startSeconds: 0, endSeconds: 8, text: 'Customers need a faster way to share feedback.' },
    { id: 'transcript-segment-2', startSeconds: 8, endSeconds: 20, text: 'The workflow helps teams turn feedback into action.' },
  ],
  visualSummary: sourceEvidence.visualUnderstanding.summary,
  visibleSubjects: sourceEvidence.visualUnderstanding.visibleSubjects,
  visibleObjects: sourceEvidence.visualUnderstanding.visibleObjects,
  screenTextRegions: sourceEvidence.visualUnderstanding.screenTextRegions,
  compositionRisks: sourceEvidence.visualUnderstanding.compositionRisks,
  brollOpportunities: sourceEvidence.visualUnderstanding.brollOpportunities,
  captionObservations: sourceEvidence.visualUnderstanding.captionObservations,
  styleObservations: sourceEvidence.visualUnderstanding.styleObservations,
  frameEvidence: sourceEvidence.visualUnderstanding.frameEvidence,
  referenceDna: {
    summary: 'Fast readable social captions with restrained graphic callouts.', pacingTraits: ['phrase-safe cuts'],
    captionTraits: ['selective word emphasis'], visualTraits: ['clean evidence cards'], audioTraits: ['speech first'],
    doNotCopy: ['Do not copy exact layouts or animation timing.'], sourceStorageObjectRecordId: 'reference-storage-smoke',
    evidenceArtifactIds: ['reference-frame-smoke'], derivedBy: 'qwen_live_with_deterministic_measurements' as const,
  },
}

const env = {
  REEDITPRO_QWEN_RUNTIME_MODE: 'beta_enabled',
  QWEN_REASONING_API_KEY: 'autonomous-planner-smoke-credential',
  QWEN_REASONING_BASE_URL: 'https://planner.invalid',
  QWEN_REASONING_MODEL_ID: 'qwen-autonomous-smoke',
  QWEN_REASONING_TRANSPORT_PROFILE: 'openai_chat_completions',
}

let fetchCalls = 0
const validFetch: typeof fetch = async (_input, init) => {
  fetchCalls += 1
  assert.equal(init?.method, 'POST')
  assert.match(String(new Headers(init?.headers).get('authorization')), /^Bearer /)
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(candidate) } }],
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}

const prompt = createQwenAutonomousEditPlannerPrompt({ request, sourceEvidence, privateEvidence })
assert.match(prompt.systemPrompt, /Do not use a generic template/)
assert.match(prompt.userPrompt, /customer feedback/i)
assert.doesNotMatch(prompt.userPrompt, /private-source-media\/workspaces/)

const valid = await runQwenAutonomousEditPlanner({
  request,
  sourceEvidence,
  privateEvidence,
  env,
  fetchImpl: validFetch,
})
assert.equal(valid.status, 'completed')
assert.equal(valid.candidate?.status, 'ready_for_approval')
assert.equal(valid.providerCallMade, true)
assert.equal(valid.deterministicCreativeFallbackUsed, false)
assert.equal(fetchCalls, 1)

const blockedEvidence = await runQwenAutonomousEditPlanner({
  request,
  sourceEvidence: {
    ...sourceEvidence,
    visualUnderstanding: {
      ...sourceEvidence.visualUnderstanding,
      status: 'blocked',
    },
    blockers: ['structured_visual_understanding_route_not_connected'],
  },
  privateEvidence,
  env,
  fetchImpl: validFetch,
})
assert.equal(blockedEvidence.status, 'blocked_evidence')
assert.equal(blockedEvidence.providerCallMade, false)
assert.equal(fetchCalls, 1, 'Missing evidence must block before a Qwen provider call.')

const invalidRangeFetch: typeof fetch = async () => new Response(JSON.stringify({
  choices: [{ message: { content: JSON.stringify({
    ...candidate,
    segments: [{ ...candidate.segments[0], sourceEndSeconds: 99 }],
    skillSelections: [{
      ...candidate.skillSelections[0],
      segmentIds: ['segment-opening-problem'],
    }],
  }) } }],
}), { status: 200, headers: { 'content-type': 'application/json' } })
const invalidRange = await runQwenAutonomousEditPlanner({
  request,
  sourceEvidence,
  privateEvidence,
  env,
  fetchImpl: invalidRangeFetch,
})
assert.equal(invalidRange.status, 'invalid_plan')
assert.ok(invalidRange.errors.some((error) => /exceeds probed source duration/.test(error)))

const unsafeCopyFetch: typeof fetch = async () => new Response(JSON.stringify({
  choices: [{ message: { content: JSON.stringify({
    ...candidate,
    summary: 'Copy exactly the reference creator layout.',
  }) } }],
}), { status: 200, headers: { 'content-type': 'application/json' } })
const unsafeCopy = await runQwenAutonomousEditPlanner({
  request,
  sourceEvidence,
  privateEvidence,
  env,
  fetchImpl: unsafeCopyFetch,
})
assert.equal(unsafeCopy.status, 'invalid_plan')
assert.ok(unsafeCopy.errors.some((error) => /exact-copy/.test(error)))

console.log(JSON.stringify({
  ok: true,
  decision: 'autonomous_edit_planner_contract_passed',
  checks: {
    evidenceBackedPlanAccepted: true,
    missingVisualEvidenceBlockedBeforeProvider: true,
    sourceRangeViolationRejected: true,
    unsafeReferenceCopyRejected: true,
    deterministicCreativeFallbackUsed: false,
  },
}, null, 2))
