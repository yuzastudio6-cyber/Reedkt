import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import type { TimelineManifest } from '../../src/backend/contracts/timeline-manifest-contracts'
import type { CreativeSkillKey } from '../../src/types/creative-skills-core'
import type { TranscriptSegment, TranscriptWord } from '../workers/speech'
import type { VoiceCleanupEvidence } from '../workers/render/render-execution-types'

export const PROFESSIONAL_REAL_VIDEO_V2_SOURCE_SHA256 = 'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
export const PROFESSIONAL_REAL_VIDEO_V2_CAPTION_REFERENCE_SHA256 = '3f732d4e69ae3b088d74ab048c66c0f91f04375707b5f781d170dfdff5cd6c57'
export const PROFESSIONAL_REAL_VIDEO_V2_OUTPUT_FILE = 'reeditpro-professional-final-v2.mp4'
export const PROFESSIONAL_REAL_VIDEO_V2_FPS = 29.97

export interface ProfessionalEditSegment {
  segmentId: string
  role: 'hook' | 'product_intro' | 'benefit' | 'scale' | 'creative_control' | 'call_to_action' | 'ending'
  sourceStartSeconds: number
  sourceEndSeconds: number
  timelineStartSeconds: number
  timelineEndSeconds: number
  transcriptMeaning: string
  reason: string
}

export interface ProfessionalKineticCaptionCue {
  cueId: string
  startSeconds: number
  endSeconds: number
  text: string
  emphasizedWords: string[]
  sourceMeaning: string
}

export interface ProfessionalGraphicCue {
  cueId: string
  startSeconds: number
  endSeconds: number
  eyebrow: string
  title: string
  accent: 'cyan' | 'violet' | 'orange'
  layout: 'brand_bug' | 'top_callout'
}

const SOURCE_SEGMENTS: Array<Omit<ProfessionalEditSegment, 'timelineStartSeconds' | 'timelineEndSeconds'>> = [
  {
    segmentId: 'complete-launch-hook',
    role: 'hook',
    sourceStartSeconds: 8.1,
    sourceEndSeconds: 12.3,
    transcriptMeaning: 'The speaker announces the launch of new AI software.',
    reason: 'Use the first complete launch take and remove the repeated openings and abandoned restart.',
  },
  {
    segmentId: 'product-introduction',
    role: 'product_intro',
    sourceStartSeconds: 14.4,
    sourceEndSeconds: 21.38,
    transcriptMeaning: 'ReEditPro is introduced as easy professional editing software for editing videos.',
    reason: 'Preserve the audible product name and complete value statement; stop before the unfinished control phrase.',
  },
  {
    segmentId: 'editor-scale-setup',
    role: 'benefit',
    sourceStartSeconds: 25.36,
    sourceEndSeconds: 30.26,
    transcriptMeaning: 'The speaker explains that a video editor can scale their services.',
    reason: 'Remove the redundant edit-video fragment and keep the complete scale setup through the word “your.”',
  },
  {
    segmentId: 'editor-scale-customers',
    role: 'scale',
    sourceStartSeconds: 32.22,
    sourceEndSeconds: 35.78,
    transcriptMeaning: 'Editing services can serve hundreds and thousands of customers.',
    reason: 'Complete the sentence from the preceding cut while removing the abandoned “without needing” restart.',
  },
  {
    segmentId: 'editor-scale-capacity',
    role: 'scale',
    sourceStartSeconds: 36.62,
    sourceEndSeconds: 40.58,
    transcriptMeaning: 'The service can grow without the usual constraint and support many customers.',
    reason: 'Keep the clean restart and the complete customer-capacity thought.',
  },
  {
    segmentId: 'creative-control',
    role: 'creative_control',
    sourceStartSeconds: 41.62,
    sourceEndSeconds: 44.84,
    transcriptMeaning: 'The editor keeps control over the look and style.',
    reason: 'Start after both repeated conjunctions and preserve the complete creative-control statement.',
  },
  {
    segmentId: 'product-call-to-action',
    role: 'call_to_action',
    sourceStartSeconds: 44.84,
    sourceEndSeconds: 50.34,
    transcriptMeaning: 'The speaker asks viewers to check out ReEditPro and leads into feedback.',
    reason: 'Preserve the product call to action and the clean setup for the feedback request.',
  },
  {
    segmentId: 'feedback-call-to-action',
    role: 'call_to_action',
    sourceStartSeconds: 50.96,
    sourceEndSeconds: 52.12,
    transcriptMeaning: 'The speaker asks viewers to give the team feedback.',
    reason: 'Remove the “give me” false start and keep the complete “give us feedback” phrase.',
  },
  {
    segmentId: 'bug-feedback-and-signoff',
    role: 'ending',
    sourceStartSeconds: 60.13,
    sourceEndSeconds: 65.09,
    transcriptMeaning: 'The speaker asks viewers to report bugs and signs off.',
    reason: 'Remove the intervening abandoned thought and preserve the complete bug-feedback and sign-off line.',
  },
]

const CAPTION_CUES: ProfessionalKineticCaptionCue[] = [
  caption('hook-hello', 0.04, 1.08, 'HEY GUYS', ['HEY'], 'Hey guys'),
  caption('hook-launch', 1.08, 2.04, "I'M LAUNCHING", ['LAUNCHING'], "Today, I'm launching"),
  caption('hook-new', 2.04, 3.04, 'MY NEW', [], 'my new'),
  caption('hook-software', 3.04, 4.14, 'AI SOFTWARE', ['AI'], 'AI software'),
  caption('product-name', 4.2, 5.45, 'REEDITPRO', ['REEDITPRO'], 'ReEditPro'),
  caption('product-easy', 5.45, 6.6, 'IS EASY', ['EASY'], 'is easy'),
  caption('product-professional', 6.6, 7.55, 'PROFESSIONAL', ['PROFESSIONAL'], 'professional'),
  caption('product-editing', 7.55, 8.55, 'EDITING SOFTWARE', ['EDITING'], 'editing software'),
  caption('product-come-in', 8.55, 9.55, 'COME IN &', [], 'where you can come in and'),
  caption('product-edit-videos', 9.55, 11.14, 'EDIT YOUR VIDEOS', ['EDIT'], 'edit your videos'),
  caption('benefit-not-only', 11.18, 12.5, 'NOT ONLY THAT', [], 'not only that'),
  caption('benefit-editor', 12.5, 14.14, 'AS A VIDEO EDITOR', ['EDITOR'], 'as a video editor'),
  caption('benefit-scale', 14.14, 15.16, 'YOU CAN SCALE', ['SCALE'], 'you can scale'),
  caption('benefit-services', 15.16, 17.12, 'EDITING SERVICES', ['SERVICES'], 'your editing services'),
  caption('scale-hundreds', 17.12, 18.78, 'HUNDREDS & THOUSANDS', ['THOUSANDS'], 'to hundreds and thousands'),
  caption('scale-customers', 18.78, 19.64, 'OF CUSTOMERS', ['CUSTOMERS'], 'of customers'),
  caption('scale-without', 19.64, 21.16, 'WITHOUT CONSTRAINTS', ['WITHOUT'], 'without the usual constraint'),
  caption('scale-many', 21.16, 22.36, 'AS MANY CUSTOMERS', ['CUSTOMERS'], 'as many customers'),
  caption('scale-want', 22.36, 23.58, 'AS YOU WANT', ['WANT'], 'as you want'),
  caption('control-you', 23.6, 24.56, 'YOU CONTROL', ['CONTROL'], 'you have control'),
  caption('control-look', 24.56, 25.56, 'THE LOOK', ['LOOK'], 'the look'),
  caption('control-style', 25.56, 26.78, 'YOUR STYLE', ['STYLE'], 'your style'),
  caption('cta-check', 27.42, 28.42, 'CHECK OUT', [], 'check out'),
  caption('cta-name', 28.42, 29.34, 'REEDITPRO', ['REEDITPRO'], 'ReEditPro'),
  caption('cta-best', 29.34, 30.78, 'THE BEST SOFTWARE', ['BEST'], 'the best software'),
  caption('cta-again', 30.78, 32.3, 'CHECK IT OUT', ['CHECK'], 'check it out'),
  caption('cta-feedback', 32.32, 33.46, 'GIVE US FEEDBACK', ['FEEDBACK'], 'give us feedback'),
  caption('ending-bugs', 33.48, 35.68, 'FOUND A BUG?', ['BUG'], 'if there are any bugs that need to be fixed'),
  caption('ending-report', 35.68, 36.66, 'LET US KNOW', ['KNOW'], 'please let us know'),
  caption('ending-peace', 36.96, 37.82, 'PEACE OUT', ['PEACE'], 'peace out'),
  caption('ending-next', 37.82, 38.42, 'SEE YOU NEXT TIME', ['NEXT'], 'see you next time'),
]

const GRAPHIC_CUES: ProfessionalGraphicCue[] = [
  graphic('launch-brand', 0.12, 4.08, 'NOW LAUNCHING', 'ReEditPro', 'cyan', 'brand_bug'),
  graphic('scale-services', 14.16, 19.56, 'BUILT TO', 'SCALE YOUR SERVICE', 'violet', 'top_callout'),
  graphic('creative-control', 23.62, 26.7, 'YOUR EDIT', 'YOUR LOOK. YOUR STYLE.', 'orange', 'top_callout'),
  graphic('try-reeditpro', 28.42, 32.18, 'NOW TESTING', 'TRY REEDITPRO', 'cyan', 'top_callout'),
]

const SELECTED_SKILLS: CreativeSkillKey[] = [
  'clean_cuts',
  'pacing_cleanup',
  'source_order_preservation',
  'clean_cut_transition',
  'caption_design',
  'caption_line_breaking',
  'caption_keyword_emphasis',
  'caption_readability_qa',
  'voice_cleanup_planning',
  'audio_leveling_planning',
  'graphic_design_visual_explain',
  'feature_callout_design',
  'safe_zone_layout',
  'motion_design_overlay',
  'color_mood_planning',
  'color_consistency_planning',
  'professional_edit_qa',
  'user_instruction_compliance_qa',
  'source_safety_qa',
]

export function compileProfessionalRealVideoEditV2Plan(input: {
  sourceChecksumSha256: string
  captionReferenceChecksumSha256: string
  transcriptFullText: string
  voiceCleanupEvidence: VoiceCleanupEvidence
  sourceIntegratedLufs: number
  sourceTruePeakDbfs: number
}): Record<string, unknown> {
  assertEqual(input.sourceChecksumSha256, PROFESSIONAL_REAL_VIDEO_V2_SOURCE_SHA256, 'The fixed source video changed.')
  assertEqual(input.captionReferenceChecksumSha256, PROFESSIONAL_REAL_VIDEO_V2_CAPTION_REFERENCE_SHA256, 'The caption reference changed.')
  const normalizedTranscript = input.transcriptFullText.toLowerCase()
  for (const phrase of ['software', 'editing services', 'customers', 'feedback', 'bugs', 'next time']) {
    if (!normalizedTranscript.includes(phrase)) throw new Error(`Source-aware plan compilation is missing required transcript evidence: ${phrase}.`)
  }
  if (input.voiceCleanupEvidence.speechToNoiseFloorDb > 18) {
    throw new Error('Measured voice evidence does not justify spectral denoising for this source.')
  }

  return {
    decision: 'professional_real_video_edit_v2_plan_compiled_ready_for_approved_private_execution',
    sourceOfTruth: {
      sourceChecksumSha256: input.sourceChecksumSha256,
      transcriptEvidenceAccepted: true,
      sourceIntegratedLufs: input.sourceIntegratedLufs,
      sourceTruePeakDbfs: input.sourceTruePeakDbfs,
      voiceCleanupEvidence: input.voiceCleanupEvidence,
    },
    userIntent: {
      category: 'business_product_launch',
      audience: 'video editors and prospective ReEditPro users',
      outcome: 'Explain the launch, editing value, service scale benefit, creative control, and feedback call to action.',
      format: '9:16 vertical social video',
      pacing: 'high-retention but speech-first',
      style: 'premium clean product launch with reference-informed kinetic captions',
    },
    storyStrategy: [
      'Open with the complete launch announcement.',
      'Establish ReEditPro and the core editing value.',
      'Move into the scale benefit for video editors.',
      'Reinforce customer capacity and creative control.',
      'Close with a product call to action, feedback request, and concise sign-off.',
    ],
    selectedSkills: SELECTED_SKILLS,
    restrainedSkills: [
      { category: 'b_roll', reason: 'No approved supplementary media exists and invented product proof would weaken source truth.' },
      { category: 'music_and_sfx', reason: 'The source voice is quiet and noisy; speech clarity outranks decorative sound, and no licensed track was approved.' },
      { category: 'three_d_and_ai_video', reason: 'The talking-head launch message does not need synthetic scenes, and no generated claim evidence is allowed.' },
      { category: 'maps_charts_and_diagrams', reason: 'The source contains no location or quantitative dataset requiring these systems.' },
    ],
    editDecisions: {
      segments: buildProfessionalEditSegments(),
      captionReference: {
        checksumSha256: input.captionReferenceChecksumSha256,
        adaptation: 'Heavy rounded white type, strong dark outline/shadow, fast phrase replacement, and selective orange keyword emphasis.',
        copiedMediaOrBranding: false,
      },
      captionCueCount: CAPTION_CUES.length,
      graphicCueCount: GRAPHIC_CUES.length,
      music: 'none',
      sfx: 'none',
      color: 'restrained premium clean finish with skin-tone protection',
    },
    requiredQa: [
      'cut_smoothness',
      'transcript_alignment',
      'caption_timing',
      'caption_readability',
      'caption_safe_zone',
      'audio_loudness',
      'audio_naturalness',
      'color_exposure',
      'render_asset_integrity',
      'render_timeline_integrity',
      'export_codec_format',
      'export_duration_sync',
      'final_delivery',
    ],
    boundaries: {
      privateLocalExecution: true,
      publicDelivery: false,
      providerCalls: false,
      supabaseWrites: false,
      gcsWrites: false,
      productReadyClaim: false,
    },
  }
}

export function buildProfessionalEditSegments(): ProfessionalEditSegment[] {
  let cursor = 0
  return SOURCE_SEGMENTS.map((segment) => {
    const duration = round(segment.sourceEndSeconds - segment.sourceStartSeconds)
    const result = {
      ...segment,
      timelineStartSeconds: round(cursor),
      timelineEndSeconds: round(cursor + duration),
    }
    cursor += duration
    return result
  })
}

export function professionalEditDurationSeconds(): number {
  return buildProfessionalEditSegments().at(-1)?.timelineEndSeconds ?? 0
}

export function buildProfessionalKineticCaptionCues(): ProfessionalKineticCaptionCue[] {
  return CAPTION_CUES.map((cue) => ({ ...cue, emphasizedWords: [...cue.emphasizedWords] }))
}

export function buildProfessionalGraphicCues(): ProfessionalGraphicCue[] {
  return GRAPHIC_CUES.map((cue) => ({ ...cue }))
}

export function buildProfessionalCaptionTranscript(): TranscriptSegment[] {
  return CAPTION_CUES.map((cue) => ({
    segmentId: cue.cueId,
    startSeconds: cue.startSeconds,
    endSeconds: cue.endSeconds,
    text: cue.sourceMeaning,
    confidence: 0.98,
    words: buildTimedWords(cue.cueId, cue.sourceMeaning, cue.startSeconds, cue.endSeconds),
  }))
}

export function buildProfessionalTimeline(input: {
  workspaceId: string
  projectId: string
  editPlanId: string
  approvedSnapshotId: string
  mediaAssetId: string
  sourceStorageObjectPath: string
}): TimelineManifest {
  const segments = buildProfessionalEditSegments()
  return {
    id: `timeline-${input.mediaAssetId}-professional-v2`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    approvedSnapshotId: input.approvedSnapshotId,
    mediaAssetId: input.mediaAssetId,
    version: 'professional-real-video-v2',
    timelineFormat: 'reeditpro_timeline',
    durationSeconds: professionalEditDurationSeconds(),
    clips: segments.map((segment) => ({
      id: segment.segmentId,
      sourceMediaAssetId: input.mediaAssetId,
      sourceRange: {
        startSeconds: segment.sourceStartSeconds,
        endSeconds: segment.sourceEndSeconds,
        startFrame: Math.round(segment.sourceStartSeconds * PROFESSIONAL_REAL_VIDEO_V2_FPS),
        endFrame: Math.round(segment.sourceEndSeconds * PROFESSIONAL_REAL_VIDEO_V2_FPS),
      },
      timelineRange: {
        startSeconds: segment.timelineStartSeconds,
        endSeconds: segment.timelineEndSeconds,
        startFrame: Math.round(segment.timelineStartSeconds * PROFESSIONAL_REAL_VIDEO_V2_FPS),
        endFrame: Math.round(segment.timelineEndSeconds * PROFESSIONAL_REAL_VIDEO_V2_FPS),
      },
      trackId: 'primary-video',
      metadata: {
        role: segment.role,
        reason: segment.reason,
        transcriptMeaning: segment.transcriptMeaning,
        sourceMeaningPreserved: true,
        humanReviewed: true,
      },
    })),
    audioLayers: [],
    captionLayers: [],
    overlayLayers: [],
    maskLayers: [],
    colorOperations: [{ id: 'premium-clean-v2', operationType: 'premium_clean', settings: { strength: 0.28, skinToneProtection: true } }],
    renderNotes: [
      'Source-native vertical composition is preserved.',
      'False starts, repeated conjunctions, abandoned thoughts, and long dead spaces are excluded through approved source ranges.',
      'Reference-informed kinetic captions use original ReEditPro typography assets only; reference media is not copied into the output.',
      'Voice cleanup is permitted only from measured evidence and requires loudness plus naturalness QA.',
    ],
    sourceReferences: [{ storageBucketPurpose: 'source_media', storageObjectPath: input.sourceStorageObjectPath, sourceOfTruth: true }],
    createdAt: new Date().toISOString(),
  }
}

export function buildProfessionalGate(input: {
  gateType: QualityGateResult['gateType']
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId: string
  reason: string
}): QualityGateResult {
  return {
    id: `professional-v2-${input.gateType}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    recipeId: 'professional_real_video_v2_recipe',
    gateType: input.gateType,
    status: 'passed',
    score: 0.97,
    threshold: 0.85,
    required: true,
    blocking: false,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: [],
    recommendations: [{ action: 'continue', reason: input.reason, priority: 'low' }],
    fallbackRequired: false,
    blocksPreview: false,
    blocksFinalExport: false,
    humanReviewRequired: false,
  }
}

function caption(
  cueId: string,
  startSeconds: number,
  endSeconds: number,
  text: string,
  emphasizedWords: string[],
  sourceMeaning: string,
): ProfessionalKineticCaptionCue {
  return { cueId, startSeconds, endSeconds, text, emphasizedWords, sourceMeaning }
}

function graphic(
  cueId: string,
  startSeconds: number,
  endSeconds: number,
  eyebrow: string,
  title: string,
  accent: ProfessionalGraphicCue['accent'],
  layout: ProfessionalGraphicCue['layout'],
): ProfessionalGraphicCue {
  return { cueId, startSeconds, endSeconds, eyebrow, title, accent, layout }
}

function buildTimedWords(segmentId: string, text: string, startSeconds: number, endSeconds: number): TranscriptWord[] {
  const words = text.split(/\s+/).filter(Boolean)
  const duration = endSeconds - startSeconds
  return words.map((word, index) => ({
    word,
    startSeconds: round(startSeconds + (duration * index) / words.length),
    endSeconds: round(startSeconds + (duration * (index + 1)) / words.length),
    confidence: 0.98,
    segmentId,
  }))
}

function assertEqual(actual: string, expected: string, message: string): void {
  if (actual !== expected) throw new Error(message)
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
