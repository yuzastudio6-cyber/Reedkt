import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from '../../src/lib/approved-edit-execution-package-client'
import {
  buildCanonicalPlanningDraft,
  CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION,
  type CanonicalPlanDraft,
  type CanonicalPlanningDraft,
  type CanonicalWorkItemDraft,
} from '../../src/lib/canonical-planning-draft'
import { createGuidedEditPlan } from '../../src/lib/guided-edit-planner'
import type {
  CaptionVisualCueTimingPlan,
  EditPlan,
  MasterTimingPlan,
  PlannerInput,
  SoundSyncTransitionTimingPlan,
  SourceCleanupPlan,
} from '../../src/types/reeditpro'
import { createAudioPipelinePlan } from '../../src/lib/audio-pipeline-planner'
import { createColorPipelinePlan } from '../../src/lib/color-pipeline-planner'
import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import {
  PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS,
  PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import type {
  EditBriefMarkerRecord,
  EditBriefRecord,
} from './private-edit-brief-authority-store'
import {
  assertCanonicalSourceCleanupBindingMatchesEvidence,
  type CanonicalSourceCleanupVisualIntelligenceBinding,
} from './canonical-source-cleanup-visual-intelligence-binding'

const SOURCE_LED_FPS = 30 as const
const ASCII_CAPTION = /^[\x20-\x7e]+$/

interface CanonicalSourceLedSelectedRange {
  clipId: string
  decisionId: string
  sourceSequenceItemId: string
  fullDurationFrames: number
  selectedStartFrame: number
  selectedEndFrameExclusive: number
  timelineStartFrame: number
  timelineEndFrameExclusive: number
  reason: string
  confidenceBasisPoints: number
  meaningPreservationPassed: true
  evidenceIds: string[]
  instructionIds: string[]
}

interface CanonicalSourceLedRemovedRange {
  clipId: string
  decisionId: string
  sourceSequenceItemId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  reason: string
  confidenceBasisPoints: number
  evidenceIds: string[]
  instructionIds: string[]
}

export interface CanonicalSourceLedCleanupAuthorityInput {
  binding: unknown
  evidence: unknown
  expectedScope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    userInstructionDigestSha256: string
  }
}

export interface CanonicalSourceLedPlanCompilation {
  plannerInput: PlannerInput
  plan: EditPlan
  canonicalDraft: CanonicalPlanningDraft
  professionalLongFormPublication?: {
    canonicalPlan: CanonicalPlanDraft
    planningRequestIdSeed: string
    replacedCapacityBlockers: string[]
  }
  evidence: {
    sourceMetadataAuthority: 'server_reverified_finalized_upload_ffprobe'
    editDirectionAuthority: 'server_reverified_chat_preferences_and_optional_edit_brief'
    exactPreferenceAuthority: 'server_reverified_exact_edit_preferences'
    browserPlanAccepted: false
    browserTimingAccepted: false
    sourceRangePolicy:
      | 'preserve_every_verified_source_frame'
      | 'head_intelligence_verified_visual_intelligence_cleanup'
    sourceAnalysisEvidenceRef?: {
      id: string
      version: number
      contentHash: string
    }
    sourceCleanupBindingDigestSha256?: string
    sourceCount: number
    totalFrames: number
    fps: typeof SOURCE_LED_FPS
    captionCueCount: number
    publicationProfile:
      | 'bounded_private_composition'
      | 'professional_long_form_object_controller'
  }
}

/**
 * Compiles the first honest, deliberately bounded backend plan:
 *
 * - source order and full ranges come from finalized upload + FFprobe evidence;
 * - optional trims come only from the exact immutable Head Intelligence binding
 *   to complete transcript and whole-video Visual Intelligence evidence;
 * - user direction comes from verified named-edit Chat, exact preferences, and
 *   an optional persisted ready Edit Brief when the user created one;
 * - edit settings come from exact server-owned preferences;
 * - captions, when present, must be explicit confirmed Edit Brief markers;
 * - no browser/caller trim, generated media, music, SFX, b-roll, or
 *   unsupported content inference is invented.
 *
 * The caller cannot provide an EditPlan, MasterTimingPlan, estimate, work
 * graph, provider route, tool route, or renderer payload.
 */
export function compileCanonicalSourceLedPlan(input: {
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  editBrief?: EditBriefRecord
  confirmedCaptionMarkers: EditBriefMarkerRecord[]
  sourceCleanupAuthority?: CanonicalSourceLedCleanupAuthorityInput
}): CanonicalSourceLedPlanCompilation {
  assertBoundedSourceLedInput(input)
  const base = createGuidedEditPlan(input.plannerInput)
  const fullSourceFrames = input.sourceMediaAssets.map((asset) =>
    Math.round(asset.sourceMetadata!.durationSeconds! * SOURCE_LED_FPS))
  const cleanupAuthority = input.sourceCleanupAuthority
    ? resolveAnalyzedSourceCleanupAuthority({
        authority: input.sourceCleanupAuthority,
        plannerInput: input.plannerInput,
        sourceMediaAssets: input.sourceMediaAssets,
        fullSourceFrames,
      })
    : undefined
  const selectedRanges = cleanupAuthority?.selectedRanges ??
    buildPreservingSelectedRanges({
      plannerInput: input.plannerInput,
      sourceMediaAssets: input.sourceMediaAssets,
      fullSourceFrames,
    })
  const totalFrames = selectedRanges.reduce(
    (sum, range) => sum +
      (range.selectedEndFrameExclusive - range.selectedStartFrame),
    0,
  )
  const sourceCleanupPlan = cleanupAuthority
    ? buildAnalyzedCleanupPlan({
        template: base.sourceCleanupPlan!,
        plannerInput: input.plannerInput,
        selectedRanges,
        removedRanges: cleanupAuthority.removedRanges,
        binding: cleanupAuthority.binding,
      })
    : buildPreservingCleanupPlan(
        base.sourceCleanupPlan!,
        input.plannerInput,
        fullSourceFrames,
      )
  const captions = buildConfirmedCaptionCues(
    input.confirmedCaptionMarkers,
    totalFrames,
  )
  const masterTimingPlan = buildSourceLedMasterTimingPlan({
    template: base.masterTimingPlan!,
    plannerInput: input.plannerInput,
    selectedRanges,
    captions,
    analysisBound: Boolean(cleanupAuthority),
  })
  const captionVisualCueTimingPlan = buildSourceLedCaptionTimingPlan({
    template: base.captionVisualCueTimingPlan!,
    plannerInput: input.plannerInput,
    masterTimingPlan,
  })
  const soundSyncTransitionTimingPlan = buildSourceLedSoundSyncPlan({
    template: base.soundSyncTransitionTimingPlan!,
    masterTimingPlan,
  })
  const timingValidationPlan = structuredClone(base.timingValidationPlan!)
  timingValidationPlan.summary = cleanupAuthority
    ? 'Server-derived frame timing applies only the exact Head Intelligence selections from complete transcript and whole-video Visual Intelligence evidence.'
    : 'Server-derived frame timing preserves every verified source frame and uses only confirmed Edit Brief captions.'
  timingValidationPlan.qaChecks = cleanupAuthority
    ? [
        'Verify every selected source boundary, removed range, embedded edit instruction, and contiguous MasterTiming projection against the exact immutable cleanup binding.',
      ]
    : [
        'Verify contiguous source coverage, explicit caption timing, and speech-safe hard-cut boundaries before approval.',
      ]
  timingValidationPlan.limitations = cleanupAuthority
    ? [
        'The current executable canonical plan accepts exactly one retained range per source; a source with multiple retained ranges remains fail-closed pending the versioned multi-range execution profile.',
      ]
    : [
        'Content-aware trims remain disabled until transcript and visual-analysis worker evidence exists.',
      ]
  timingValidationPlan.notes = []
  // The active internal workflow has no user-facing Edit Level. Keep the
  // legacy planner field at its full-capability value, but compile source
  // audio/color through the strongest profile whose exact worker recipes are
  // currently admitted. This prevents an unavailable OpenColorIO/OpenCV path
  // from being implied while preserving the professional voice/color pass.
  const professionalEditingDirective =
    input.plannerInput.professionalEditingDirective ??
    base.professionalEditingDirective
  if (!professionalEditingDirective) {
    throw new Error(
      'Canonical source-led planning requires one compiled professional editing directive.',
    )
  }
  const professionalSourceBaselineInput: PlannerInput = {
    ...input.plannerInput,
    editLevel: 'pro',
    customInstructions: [
      'Use only the verified uploaded source footage.',
      'Use source-only professional voice cleanup with no music, SFX, beat sync, or generated audio.',
      'Apply only the bounded clean natural FFmpeg source color recipe; do not infer targeted face, person, or skin-isolation processing.',
    ].join('\n'),
    userInstructionHistory: [],
    professionalEditingDirective: {
      ...professionalEditingDirective,
      colorGradeStyle: 'clean_natural',
    },
    clips: input.plannerInput.clips.map((clip) => ({
      ...clip,
      fileName: `verified-source-${clip.uploadedOrder}.mp4`,
      detectedType: 'verified_uploaded_video',
      notes: undefined,
      sourceRole: undefined,
      previewLabel: undefined,
      thumbnailHint: undefined,
    })),
  }
  const audioPipelinePlan = createAudioPipelinePlan({
    input: professionalSourceBaselineInput,
    segmentEditPlans: [],
    visualAssetPlan: [],
  })
  const colorPipelinePlan = createColorPipelinePlan({
    input: professionalSourceBaselineInput,
    visualAssetPlan: [],
  })
  const professionalExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: totalFrames / SOURCE_LED_FPS,
    outputFps: SOURCE_LED_FPS,
    approvedAspectRatio: input.plannerInput.aspectRatio === 'let_ai_decide'
      ? undefined
      : input.plannerInput.aspectRatio,
  })
  const previousProfessionalExportCredits =
    base.creditEstimate.professionalExportCoverage
      ?.maximumInternalToolCostCredits ?? 0
  const creditEstimate = {
    ...base.creditEstimate,
    total: base.creditEstimate.total - previousProfessionalExportCredits +
      professionalExportCoverage.maximumInternalToolCostCredits,
    breakdown: base.creditEstimate.breakdown.map((item) =>
      item.label === '4K UHD render and export ceiling'
        ? {
            ...item,
            credits:
              professionalExportCoverage.maximumInternalToolCostCredits,
          }
        : item),
    professionalExportCoverage,
  }

  const plan: EditPlan = {
    ...base,
    goalSummary: input.editBrief?.fields.goal ?? base.goalSummary,
    sourceCleanupPlan,
    trimReviewPlan: {
      ...base.trimReviewPlan!,
      summary: cleanupAuthority
        ? 'Every proposed cut comes from Head Intelligence after complete transcript and whole-video Visual Intelligence review, with exact evidence and embedded-instruction lineage.'
        : 'All verified source frames are preserved because no transcript or visual-analysis evidence authorized a content-aware cut.',
      userFacingReviewSummary: cleanupAuthority
        ? [
            'The plan removes only the exact evidence-backed ranges and keeps the complete approved explanation in source order.',
          ]
        : [
            'This first backend plan keeps every uploaded source frame in confirmed order.',
          ],
      qaChecks: cleanupAuthority
        ? [
            'Reread the exact source-analysis evidence and cleanup binding before approval or execution.',
            'Reject any stale source, checksum, instruction, range, output frame, or MasterTiming lineage.',
          ]
        : [
            'Any later content-aware trim requires fresh analysis evidence and a new plan version.',
          ],
      limitations: cleanupAuthority
        ? [
            'This compiler version accepts exactly one retained range per source; multiple retained ranges require a later versioned execution profile.',
          ]
        : [
            'No transcript, retake, silence, or semantic-cut inference was used.',
          ],
    },
    videoUnderstandingReport: undefined,
    adaptiveEditStrategy: undefined,
    adaptiveEditStrategyPlan: undefined,
    signatureRoutes: [{
      timeRange: 'full_edit',
      system: 'none',
      reason: cleanupAuthority
        ? 'The bounded source-led route executes only Head Intelligence selections bound to verified whole-video Visual Intelligence and transcript evidence.'
        : 'The bounded source-led route preserves verified uploads and explicit captions without generated visual systems.',
      creditImpact: 'none',
    }],
    masterTimingPlan,
    captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan,
    timingValidationPlan,
    visualAssetPlan: [],
    dataVizPlan: undefined,
    mapAnimationPlan: undefined,
    browserCapturePlan: undefined,
    providerPromptPlans: [],
    providerPromptGuidance: [],
    audioPipelinePlan,
    colorPipelinePlan,
    segmentEditPlans: [],
    soundSyncDirection: cleanupAuthority
      ? 'Apply the approved source-bound professional voice recipe only across the exact selected MasterTiming ranges. Do not add music, SFX, beat sync, or ducking.'
      : 'Apply the approved source-bound professional voice recipe. Do not add music, SFX, beat sync, ducking, or inferred transcript edits.',
    captionDirection:
      'Render only the exact confirmed Edit Brief caption markers; never infer transcript text.',
    creditEstimate,
    compiledIntent: cleanupAuthority && base.compiledIntent
      ? {
          ...base.compiledIntent,
          compilerNotes: [
            ...base.compiledIntent.compilerNotes,
            `Canonical source analysis evidence ${cleanupAuthority.binding.sourceAnalysisEvidenceRef.id}@${cleanupAuthority.binding.sourceAnalysisEvidenceRef.version} (${cleanupAuthority.binding.sourceAnalysisEvidenceRef.contentHash}) was reread before compiling source ranges.`,
            `Canonical source cleanup binding digest: sha256:${cleanupAuthority.binding.bindingDigestSha256}.`,
          ],
          qaImplications: [
            ...base.compiledIntent.qaImplications,
            'Approval and execution must reject any source range that is not exactly bound to the immutable source-analysis and cleanup evidence.',
          ],
        }
      : base.compiledIntent,
  }
  const canonical = buildCanonicalPlanningDraft({
    plan,
    plannerInput: {
      ...input.plannerInput,
      sourceCleanupPlan,
      masterTimingPlan,
      captionVisualCueTimingPlan,
      soundSyncTransitionTimingPlan,
      timingValidationPlan,
    },
    sourceMediaAssets: input.sourceMediaAssets,
  })
  if (!canonical.ok) {
    throw new Error(
      `Server-owned source-led plan compilation failed: ${canonical.errors.join(' | ')}`,
    )
  }
  const professionalLongFormPublication =
    canonical.draft.publication
      ? undefined
      : buildProfessionalLongFormPublicationCandidate({
          draft: canonical.draft,
          sourceCount: input.sourceMediaAssets.length,
          totalFrames,
          fps: SOURCE_LED_FPS,
        })
  if (!canonical.draft.publication && !professionalLongFormPublication) {
    throw new Error(
      `Server-owned source-led plan is not publishable: ${canonical.draft.publicationBlockers.join(' | ')}`,
    )
  }
  return {
    plannerInput: {
      ...input.plannerInput,
      sourceCleanupPlan,
      masterTimingPlan,
      captionVisualCueTimingPlan,
      soundSyncTransitionTimingPlan,
      timingValidationPlan,
    },
    plan,
    canonicalDraft: canonical.draft,
    ...(professionalLongFormPublication
      ? { professionalLongFormPublication }
      : {}),
    evidence: {
      sourceMetadataAuthority: 'server_reverified_finalized_upload_ffprobe',
      editDirectionAuthority:
        'server_reverified_chat_preferences_and_optional_edit_brief',
      exactPreferenceAuthority: 'server_reverified_exact_edit_preferences',
      browserPlanAccepted: false,
      browserTimingAccepted: false,
      sourceRangePolicy: cleanupAuthority
        ? 'head_intelligence_verified_visual_intelligence_cleanup'
        : 'preserve_every_verified_source_frame',
      ...(cleanupAuthority
        ? {
            sourceAnalysisEvidenceRef: {
              ...cleanupAuthority.binding.sourceAnalysisEvidenceRef,
            },
            sourceCleanupBindingDigestSha256:
              cleanupAuthority.binding.bindingDigestSha256,
          }
        : {}),
      sourceCount: input.sourceMediaAssets.length,
      totalFrames,
      fps: SOURCE_LED_FPS,
      captionCueCount: captions.length,
      publicationProfile: professionalLongFormPublication
        ? 'professional_long_form_object_controller'
        : 'bounded_private_composition',
    },
  }
}

function buildProfessionalLongFormPublicationCandidate(input: {
  draft: CanonicalPlanningDraft
  sourceCount: number
  totalFrames: number
  fps: typeof SOURCE_LED_FPS
}): CanonicalSourceLedPlanCompilation['professionalLongFormPublication'] {
  const durationSeconds = input.totalFrames / input.fps
  if (
    input.sourceCount < 2 ||
    durationSeconds < PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS ||
    durationSeconds > PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS ||
    !input.draft.estimate ||
    input.draft.publicationBlockers.length === 0 ||
    !input.draft.publicationBlockers.every(
      isProfessionalLongFormCapacityBlocker,
    )
  ) {
    return undefined
  }

  const sourceSequenceItemIds = input.draft.components.sourceSequence.map(
    (source) => source.sourceSequenceItemId,
  )
  const sourceCleanupDecisionIds =
    input.draft.components.sourceCleanupPlan.decisions.map(
      (decision) => decision.decisionId,
    )
  return {
    canonicalPlan: {
      schemaVersion: CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION,
      components: structuredClone(input.draft.components),
      estimate: structuredClone(input.draft.estimate),
      workItems: [
        professionalLongFormAuthorityPreflight({
          workItemKey: 'long-form-snapshot-preflight',
          workItemType: 'validate_approved_snapshot',
          operation: 'validate_long_form_snapshot_seed_manifest',
          outputKey: 'long-form-snapshot-preflight-evidence',
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
        }),
        professionalLongFormAuthorityPreflight({
          workItemKey: 'long-form-source-authority-preflight',
          workItemType: 'custom',
          operation: 'validate_long_form_source_range_authority',
          outputKey: 'long-form-source-authority-preflight-evidence',
          sourceSequenceItemIds,
          sourceCleanupDecisionIds,
        }),
        professionalLongFormAuthorityPreflight({
          workItemKey: 'long-form-estimate-frame-preflight',
          workItemType: 'custom',
          operation: 'validate_long_form_4k_estimate_and_frame_authority',
          outputKey: 'long-form-estimate-frame-preflight-evidence',
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
        }),
      ],
    },
    planningRequestIdSeed: input.draft.planningRequestIdSeed,
    replacedCapacityBlockers: [...input.draft.publicationBlockers],
  }
}

function isProfessionalLongFormCapacityBlocker(blocker: string): boolean {
  return blocker ===
      'The first private long-form profile supports at most 1,920 approved frames; a larger profile requires source-slice and distributed merge evidence.' ||
    /^The approved range for source [1-8] exceeds the current 240-frame source-operation ceiling and requires chunk render, QA, and merge evidence\.$/u
      .test(blocker)
}

function professionalLongFormAuthorityPreflight(input: {
  workItemKey: string
  workItemType: 'validate_approved_snapshot' | 'custom'
  operation: string
  outputKey: string
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
}): CanonicalWorkItemDraft {
  return {
    workItemKey: input.workItemKey,
    workItemType: input.workItemType,
    workerClass: 'authority_worker',
    executionInput: {
      operation: input.operation,
      executionAuthorized: false,
    },
    sourceSequenceItemIds: input.sourceSequenceItemIds,
    sourceCleanupDecisionIds: input.sourceCleanupDecisionIds,
    expectedOutputs: [{
      outputKey: input.outputKey,
      artifactType: 'authority_validation_evidence',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [],
      timingIds: [],
      rendererLayerIds: [],
    }],
    dependencyKeys: [],
    approvedToolIds: [],
    providerExecutionMode: 'none',
    fallbackPolicy: {
      policy: 'block_before_long_form_child_derivation',
      automaticFallbackAuthorized: false,
    },
    maxAttempts: 1,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 0,
    required: true,
  }
}

function assertBoundedSourceLedInput(input: {
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  editBrief?: EditBriefRecord
  confirmedCaptionMarkers: EditBriefMarkerRecord[]
  sourceCleanupAuthority?: CanonicalSourceLedCleanupAuthorityInput
}): void {
  if (
    input.sourceMediaAssets.length < 1 ||
    input.sourceMediaAssets.length > 8 ||
    input.sourceMediaAssets.length !== input.plannerInput.clips.length
  ) {
    throw new Error('The bounded source-led planner requires one to eight exact source videos.')
  }
  if (
    !input.plannerInput.aspectRatioConfirmed ||
    input.plannerInput.aspectRatio === 'let_ai_decide' ||
    !input.plannerInput.sourceOrderConfirmed ||
    !input.plannerInput.cleanupPreferenceConfirmed
  ) {
    throw new Error('The output frame, source order, and conservative cleanup policy must be confirmed.')
  }
  if (
    !['no_extra_visuals', 'keep_visuals_minimal'].includes(
      input.plannerInput.visualPreference,
    )
  ) {
    throw new Error(
      'Generated or explanatory visual requests require the later server visual-planning route.',
    )
  }
  if (input.editBrief && input.editBrief.fields.status !== 'ready') {
    throw new Error('The server-owned Edit Brief must be ready before planning.')
  }
  if (
    input.editBrief?.fields.musicPreference &&
    !['none', 'ai_decides'].includes(input.editBrief.fields.musicPreference)
  ) {
    throw new Error('Requested music requires a separately admitted audio-planning route.')
  }
  if (
    input.editBrief?.fields.captionPreference === 'none' &&
    input.confirmedCaptionMarkers.length > 0
  ) {
    throw new Error(
      'A caption-free Edit Brief cannot also contain confirmed caption markers.',
    )
  }
  input.sourceMediaAssets.forEach((asset, index) => {
    const metadata = asset.sourceMetadata
    if (
      asset.uploadedOrder !== index + 1 ||
      asset.uploadedClipId !== input.plannerInput.clips[index]?.id ||
      typeof asset.sourceSequenceItemId !== 'string' ||
      asset.sourceSequenceItemId.length === 0 ||
      asset.privateArtifact !== true ||
      asset.publicUrl !== null ||
      asset.signedUrl !== null ||
      asset.mimeType.toLowerCase() !== 'video/mp4' ||
      metadata?.probeStatus !== 'probed' ||
      metadata.hasVideo !== true ||
      !Number.isFinite(metadata.durationSeconds) ||
      (metadata.durationSeconds ?? 0) <= 0
    ) {
      throw new Error(
        `Source ${index + 1} is missing finalized private MP4 and FFprobe authority.`,
      )
    }
    const frames = Math.round(metadata.durationSeconds! * SOURCE_LED_FPS)
    if (frames < 24) {
      throw new Error(`Source ${index + 1} is shorter than the 24-frame composition floor.`)
    }
  })
}

function resolveAnalyzedSourceCleanupAuthority(input: {
  authority: CanonicalSourceLedCleanupAuthorityInput
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  fullSourceFrames: number[]
}): {
  binding: CanonicalSourceCleanupVisualIntelligenceBinding
  selectedRanges: CanonicalSourceLedSelectedRange[]
  removedRanges: CanonicalSourceLedRemovedRange[]
} {
  const binding = assertCanonicalSourceCleanupBindingMatchesEvidence({
    binding: input.authority.binding,
    evidence: input.authority.evidence,
  })
  const expectedScope = input.authority.expectedScope
  if (
    binding.scope.workspaceId !== expectedScope.workspaceId ||
    binding.scope.projectId !== expectedScope.projectId ||
    binding.scope.editSessionId !== expectedScope.editSessionId ||
    binding.scope.userInstructionDigestSha256 !==
      expectedScope.userInstructionDigestSha256
  ) {
    throw new Error(
      'Canonical source cleanup authority is stale for the requested workspace, project, edit session, or instruction set.',
    )
  }
  if (
    binding.sources.length !== input.sourceMediaAssets.length ||
    binding.sources.length !== input.plannerInput.clips.length
  ) {
    throw new Error(
      'Canonical source cleanup authority must cover every finalized source exactly once.',
    )
  }

  const selectedRanges: CanonicalSourceLedSelectedRange[] = []
  const removedRanges: CanonicalSourceLedRemovedRange[] = []
  let expectedTimelineCursor = 0
  binding.sources.forEach((source, sourceIndex) => {
    const asset = input.sourceMediaAssets[sourceIndex]!
    const clip = input.plannerInput.clips[sourceIndex]!
    const fullDurationFrames = input.fullSourceFrames[sourceIndex]!
    if (
      source.uploadedOrder !== sourceIndex + 1 ||
      asset.uploadedOrder !== source.uploadedOrder ||
      clip.uploadedOrder !== source.uploadedOrder ||
      asset.uploadedClipId !== clip.id ||
      asset.sourceSequenceItemId !== source.sourceSequenceItemId ||
      asset.mediaAssetId !== source.mediaAssetId ||
      asset.checksumSha256 !== source.checksumSha256
    ) {
      throw new Error(
        `Canonical source cleanup authority lost exact source identity at uploaded source ${sourceIndex + 1}.`,
      )
    }
    const mappedFullDurationFrames = source.decisionPartition.reduce(
      (sum, decision) => sum + decision.masterDurationFrames,
      0,
    )
    if (mappedFullDurationFrames !== fullDurationFrames) {
      throw new Error(
        `Canonical source cleanup authority does not match FFprobe duration for uploaded source ${sourceIndex + 1}.`,
      )
    }
    const selectedDecisions = source.decisionPartition.filter(
      (decision) => decision.action === 'keep',
    )
    if (selectedDecisions.length !== 1) {
      throw new Error(
        `Canonical source cleanup currently requires exactly one retained range for uploaded source ${sourceIndex + 1}; multi-range execution remains fail-closed.`,
      )
    }
    let sourceMasterCursor = 0
    source.decisionPartition.forEach((decision) => {
      const sourceStartFrame = sourceMasterCursor
      const sourceEndFrameExclusive =
        sourceStartFrame + decision.masterDurationFrames
      sourceMasterCursor = sourceEndFrameExclusive
      if (decision.action === 'keep') {
        if (
          decision.timelineStartFrame !== expectedTimelineCursor ||
          decision.timelineEndFrameExclusive !==
            expectedTimelineCursor + decision.masterDurationFrames
        ) {
          throw new Error(
            'Canonical source cleanup authority is not contiguous in MasterTiming order.',
          )
        }
        selectedRanges.push({
          clipId: clip.id,
          decisionId: decision.decisionId,
          sourceSequenceItemId: source.sourceSequenceItemId,
          fullDurationFrames,
          selectedStartFrame: sourceStartFrame,
          selectedEndFrameExclusive: sourceEndFrameExclusive,
          timelineStartFrame: decision.timelineStartFrame,
          timelineEndFrameExclusive: decision.timelineEndFrameExclusive,
          reason: decision.reason,
          confidenceBasisPoints: decision.confidenceBasisPoints,
          meaningPreservationPassed: true,
          evidenceIds: [...decision.evidenceIds],
          instructionIds: [...decision.instructionIds],
        })
        expectedTimelineCursor = decision.timelineEndFrameExclusive
      } else {
        removedRanges.push({
          clipId: clip.id,
          decisionId: decision.decisionId,
          sourceSequenceItemId: source.sourceSequenceItemId,
          sourceStartFrame,
          sourceEndFrameExclusive,
          reason: decision.reason,
          confidenceBasisPoints: decision.confidenceBasisPoints,
          evidenceIds: [...decision.evidenceIds],
          instructionIds: [...decision.instructionIds],
        })
      }
    })
    if (sourceMasterCursor !== fullDurationFrames) {
      throw new Error(
        `Canonical source cleanup authority does not completely partition uploaded source ${sourceIndex + 1}.`,
      )
    }
  })
  if (
    selectedRanges.length !== binding.sources.length ||
    expectedTimelineCursor !== binding.totals.selectedMasterTimelineFrames
  ) {
    throw new Error(
      'Canonical source cleanup authority totals do not match the executable selected ranges.',
    )
  }
  return { binding, selectedRanges, removedRanges }
}

function buildPreservingSelectedRanges(input: {
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  fullSourceFrames: number[]
}): CanonicalSourceLedSelectedRange[] {
  let timelineCursor = 0
  return input.plannerInput.clips.map((clip, index) => {
    const fullDurationFrames = input.fullSourceFrames[index]!
    const timelineStartFrame = timelineCursor
    timelineCursor += fullDurationFrames
    return {
      clipId: clip.id,
      decisionId: `server-preserve-${index + 1}`,
      sourceSequenceItemId:
        input.sourceMediaAssets[index]!.sourceSequenceItemId!,
      fullDurationFrames,
      selectedStartFrame: 0,
      selectedEndFrameExclusive: fullDurationFrames,
      timelineStartFrame,
      timelineEndFrameExclusive: timelineCursor,
      reason:
        'Preserve the complete FFprobe-verified source range; no semantic trim authority exists yet.',
      confidenceBasisPoints: 10_000,
      meaningPreservationPassed: true,
      evidenceIds: [],
      instructionIds: [],
    }
  })
}

function buildAnalyzedCleanupPlan(input: {
  template: SourceCleanupPlan
  plannerInput: PlannerInput
  selectedRanges: CanonicalSourceLedSelectedRange[]
  removedRanges: CanonicalSourceLedRemovedRange[]
  binding: CanonicalSourceCleanupVisualIntelligenceBinding
}): SourceCleanupPlan {
  const decisions = input.selectedRanges.map((range) => {
    const selectedDurationFrames =
      range.selectedEndFrameExclusive - range.selectedStartFrame
    const action = selectedDurationFrames === range.fullDurationFrames
      ? 'preserve' as const
      : 'tighten' as const
    return {
      id: range.decisionId,
      clipId: range.clipId,
      sourceRange: {
        ...frameRange(0, range.fullDurationFrames),
        clipId: range.clipId,
        notes: ['Complete FFprobe-verified source range in the 30fps execution domain.'],
      },
      selectedRange: frameRange(
        range.selectedStartFrame,
        range.selectedEndFrameExclusive,
      ),
      timelineRange: frameRange(
        range.timelineStartFrame,
        range.timelineEndFrameExclusive,
      ),
      decision: action,
      finalUse: 'main_timeline' as const,
      riskLevel: cleanupRisk(range.confidenceBasisPoints),
      reason: range.reason,
      keepReasons: ['custom' as const],
      cutReasons: [],
      userReviewRequired: false,
      affectedMeaningRisk: false,
      linkedTimingCueIds: [],
      meaningPreservationCheckIds: [
        `source-analysis:${input.binding.sourceAnalysisEvidenceRef.id}`,
        `cleanup-binding:sha256:${input.binding.bindingDigestSha256}`,
      ],
      qaChecks: [
        'The selected range must match the exact immutable cleanup binding.',
        'The retained range must preserve the approved source meaning.',
      ],
      notes: [
        `Evidence IDs: ${range.evidenceIds.join(', ')}`,
        `Embedded instruction IDs: ${range.instructionIds.join(', ') || 'none'}`,
      ],
    }
  })
  const cutRanges = input.removedRanges.map((range) => ({
    id: range.decisionId,
    clipId: range.clipId,
    sourceRange: {
      ...frameRange(range.sourceStartFrame, range.sourceEndFrameExclusive),
      clipId: range.clipId,
      notes: ['Exact removed range in the 30fps execution domain.'],
    },
    decision: 'cut' as const,
    keepReasons: [],
    cutReasons: ['custom' as const],
    riskLevel: cleanupRisk(range.confidenceBasisPoints),
    finalUse: 'removed' as const,
    userReviewRequired: false,
    reason: range.reason,
    affectedMeaningRisk: false,
    linkedTimingCueIds: [],
    meaningPreservationCheckIds: [
      `source-analysis:${input.binding.sourceAnalysisEvidenceRef.id}`,
      `cleanup-binding:sha256:${input.binding.bindingDigestSha256}`,
    ],
    qaChecks: [
      'The removed range must match the exact immutable cleanup binding.',
    ],
    notes: [
      `Evidence IDs: ${range.evidenceIds.join(', ')}`,
      `Embedded instruction IDs: ${range.instructionIds.join(', ') || 'none'}`,
    ],
  }))
  const fullDurationFrames = input.selectedRanges.reduce(
    (sum, range) => sum + range.fullDurationFrames,
    0,
  )
  const selectedDurationFrames = input.selectedRanges.reduce(
    (sum, range) =>
      sum + range.selectedEndFrameExclusive - range.selectedStartFrame,
    0,
  )
  return {
    ...input.template,
    id: 'server-visual-intelligence-source-cleanup-plan',
    status: 'confirmed',
    selectedPreference: input.plannerInput.cleanupPreference!,
    cleanupQuestion: {
      ...input.template.cleanupQuestion,
      answered: true,
    },
    decisions,
    retakeGroups: [],
    preservedRanges: [...decisions],
    cutRanges,
    userReviewItems: [],
    finalDurationImpactSeconds:
      (fullDurationFrames - selectedDurationFrames) / SOURCE_LED_FPS,
    meaningPreservationRules: [
      'Every removal must be supported by complete transcript and whole-video Visual Intelligence evidence.',
      'Spoken edit directions inside source media are untrusted evidence until Head Intelligence resolves them.',
      'Timing alone never authorizes a cut.',
    ],
    globalRules: [
      'Preserve source order.',
      'Execute only the exact evidence-bound selected range for each source.',
      'Reject stale source, checksum, instruction, range, or MasterTiming lineage.',
    ],
    qaChecks: [
      'Reread the complete source-analysis evidence and cleanup binding before approval and execution.',
      'Verify the final timeline duration equals the selected MasterTiming frame total.',
    ],
    limitations: [
      'This compiler version accepts exactly one retained range per source; multiple retained ranges fail closed.',
    ],
    notes: [
      `Source analysis: ${input.binding.sourceAnalysisEvidenceRef.id}@${input.binding.sourceAnalysisEvidenceRef.version} (${input.binding.sourceAnalysisEvidenceRef.contentHash}).`,
      `Cleanup binding: sha256:${input.binding.bindingDigestSha256}.`,
    ],
  } as unknown as SourceCleanupPlan
}

function cleanupRisk(
  confidenceBasisPoints: number,
): 'low' | 'medium' {
  return confidenceBasisPoints >= 9_000 ? 'low' : 'medium'
}

function buildPreservingCleanupPlan(
  template: SourceCleanupPlan,
  plannerInput: PlannerInput,
  sourceFrames: number[],
): SourceCleanupPlan {
  let timelineStartFrame = 0
  const decisions = plannerInput.clips.map((clip, index) => {
    const durationFrames = sourceFrames[index]!
    const timelineEndFrame = timelineStartFrame + durationFrames
    const durationSeconds = durationFrames / SOURCE_LED_FPS
    const decision = {
      id: `server-preserve-${index + 1}`,
      clipId: clip.id,
      sourceRange: {
        clipId: clip.id,
        startSeconds: 0,
        endSeconds: durationSeconds,
        durationSeconds,
        startFrame: 0,
        endFrame: durationFrames,
        durationFrames,
        fps: SOURCE_LED_FPS,
        notes: ['Exact complete source range from server-reverified FFprobe metadata.'],
      },
      selectedRange: {
        startSeconds: 0,
        endSeconds: durationSeconds,
        durationSeconds,
        startFrame: 0,
        endFrame: durationFrames,
        durationFrames,
        fps: SOURCE_LED_FPS,
      },
      timelineRange: {
        startSeconds: timelineStartFrame / SOURCE_LED_FPS,
        endSeconds: timelineEndFrame / SOURCE_LED_FPS,
        durationSeconds,
        startFrame: timelineStartFrame,
        endFrame: timelineEndFrame,
        durationFrames,
        fps: SOURCE_LED_FPS,
      },
      decision: 'preserve' as const,
      finalUse: 'main_timeline' as const,
      riskLevel: 'low' as const,
      reason:
        'Preserve the complete FFprobe-verified source range; no semantic trim authority exists yet.',
      keepReasons: ['source_context_required' as const],
      cutReasons: [],
      userReviewRequired: false,
      affectedMeaningRisk: false,
      linkedTimingCueIds: [],
      qaChecks: ['The selected range must preserve the complete verified source.'],
      notes: ['Server-derived conservative source range.'],
    }
    timelineStartFrame = timelineEndFrame
    return decision
  })
  return {
    ...template,
    id: 'server-source-led-cleanup-plan',
    status: 'confirmed',
    selectedPreference: plannerInput.cleanupPreference!,
    cleanupQuestion: {
      ...template.cleanupQuestion,
      answered: true,
    },
    decisions,
    preservedRanges: [...decisions],
    cutRanges: [],
    userReviewItems: [],
    finalDurationImpactSeconds: 0,
    limitations: [
      'Content-aware cleanup remains blocked until transcript and visual-analysis evidence exists.',
    ],
    notes: ['The exact verified source bytes remain non-destructively preserved.'],
  } as unknown as SourceCleanupPlan
}

function buildConfirmedCaptionCues(
  markers: EditBriefMarkerRecord[],
  totalFrames: number,
): Array<{
  id: string
  caption: string
  startFrame: number
  endFrame: number
}> {
  const captions = [...markers]
    .filter((marker) => marker.status === 'confirmed' && marker.markerType === 'caption')
    .sort((left, right) =>
      (left.startFrame ?? Math.round(left.startSeconds * SOURCE_LED_FPS)) -
      (right.startFrame ?? Math.round(right.startSeconds * SOURCE_LED_FPS)))
    .map((marker, index) => {
      const startFrame =
        marker.startFrame ?? Math.round(marker.startSeconds * SOURCE_LED_FPS)
      const endFrame = marker.endFrame ??
        Math.round((marker.endSeconds ?? marker.startSeconds) * SOURCE_LED_FPS)
      const caption = marker.note.trim()
      const frameAuthoritative =
        marker.timingStatus === 'frame_authoritative' &&
        marker.frameRate === SOURCE_LED_FPS
      const confirmedSecondsAwaitingServerFrameProjection =
        marker.timingStatus === 'display_seconds_only' &&
        marker.frameRate === undefined &&
        marker.startFrame === undefined &&
        marker.endFrame === undefined
      if (
        marker.timeKind !== 'range' ||
        marker.endSeconds === undefined ||
        (!frameAuthoritative && !confirmedSecondsAwaitingServerFrameProjection) ||
        !Number.isInteger(startFrame) ||
        !Number.isInteger(endFrame) ||
        startFrame < 0 ||
        endFrame <= startFrame ||
        endFrame > totalFrames ||
        caption.length < 1 ||
        caption.length > 120 ||
        !ASCII_CAPTION.test(caption) ||
        /[{}\\[\]]/.test(caption)
      ) {
        throw new Error(`Confirmed caption marker ${index + 1} is not execution-safe.`)
      }
      return {
        id: `server-caption-${index + 1}`,
        caption,
        startFrame,
        endFrame,
      }
    })
  if (captions.length > 7) {
    throw new Error('The bounded source-led route supports at most seven exact caption markers.')
  }
  let previousEnd = 0
  captions.forEach((caption, index) => {
    if (caption.startFrame < previousEnd) {
      throw new Error(`Confirmed caption marker ${index + 1} overlaps the previous marker.`)
    }
    previousEnd = caption.endFrame
  })
  if (
    captions.length === 1 &&
    (captions[0]!.startFrame !== 0 || captions[0]!.endFrame !== totalFrames)
  ) {
    throw new Error('A single confirmed caption must cover the exact approved edit duration.')
  }
  return captions
}

function buildSourceLedMasterTimingPlan(input: {
  template: MasterTimingPlan
  plannerInput: PlannerInput
  selectedRanges: CanonicalSourceLedSelectedRange[]
  captions: Array<{ id: string; caption: string; startFrame: number; endFrame: number }>
  analysisBound: boolean
}): MasterTimingPlan {
  const sourceTimingItems = input.selectedRanges.map((range, index) => {
    const clip = input.plannerInput.clips[index]!
    const item = {
      id: `server-source-timing-${index + 1}`,
      clipId: clip.id,
      uploadedOrder: index + 1,
      sourceRange: frameRange(0, range.fullDurationFrames),
      selectedRange: frameRange(
        range.selectedStartFrame,
        range.selectedEndFrameExclusive,
      ),
      trimDecisionItemId: range.decisionId,
      role: 'main_story' as const,
      reason: range.reason,
      trimNotes: input.analysisBound
        ? [
            'Execute only this Head Intelligence selection from the immutable source-cleanup binding.',
          ]
        : ['No content-aware trimming is authorized.'],
      qaChecks: input.analysisBound
        ? [
            'The selected source range and decision ID must match the exact cleanup binding.',
          ]
        : [
            'The selected range must equal the FFprobe-derived source duration.',
          ],
    }
    return item
  })
  const finalTimelineSegments = input.selectedRanges.map((range, index) => {
    return {
      id: `server-segment-${index + 1}`,
      segmentId: `server-segment-${index + 1}`,
      label: `Verified source ${index + 1}`,
      role: index === 0 ? 'hook' as const : 'proof' as const,
      finalRange: frameRange(
        range.timelineStartFrame,
        range.timelineEndFrameExclusive,
      ),
      sourceTimingItemIds: [sourceTimingItems[index]!.id],
      timingCues: [],
      pacingNotes: input.analysisBound
        ? ['Use only the verified semantic selection without moving its boundaries.']
        : ['Preserve the source duration without unsupported semantic cuts.'],
      qaChecks: ['Verify contiguous integer-frame coverage.'],
    }
  })
  const transitionTimingItems = finalTimelineSegments.slice(0, -1).map(
    (segment, index) => {
      const boundaryFrame = segment.finalRange.endFrame
      return {
        id: `server-hard-cut-${index + 1}`,
        transitionType: 'hard_cut' as const,
        timeRange: frameRange(boundaryFrame, boundaryFrame),
        fromSegmentId: segment.segmentId,
        toSegmentId: finalTimelineSegments[index + 1]!.segmentId,
        refinedTransitionTimingItemId: `server-refined-hard-cut-${index + 1}`,
        beatAligned: false,
        phraseBoundaryAligned: true,
        reason: 'Use an exact speech-safe hard cut at the verified source boundary.',
        qaChecks: ['The hard cut must remain on the exact source boundary.'],
      }
    },
  )
  const captionTimingItems = input.captions.map((caption) => ({
    id: caption.id,
    captionText: caption.caption,
    timeRange: frameRange(caption.startFrame, caption.endFrame),
    animationInFrames: 0,
    holdFrames: caption.endFrame - caption.startFrame,
    animationOutFrames: 0,
    readabilityScore: 'high' as const,
    qaChecks: ['Use only the exact user-confirmed caption text and frame range.'],
  }))
  const visualTimingItems = input.captions.map((caption) => ({
    id: `server-caption-visual-${caption.id}`,
    label: `Confirmed caption ${caption.id}`,
    visualType: 'caption_only' as const,
    timeRange: frameRange(caption.startFrame, caption.endFrame),
    revealFrames: 0,
    holdFrames: caption.endFrame - caption.startFrame,
    exitFrames: 0,
    readTimeFrames: caption.endFrame - caption.startFrame,
    reason: 'Represent one explicit Edit Brief caption marker.',
    qaChecks: ['Do not infer or rewrite caption content.'],
  }))
  const sourceTotalFrames = input.selectedRanges.reduce(
    (sum, range) => sum + range.fullDurationFrames,
    0,
  )
  const totalFrames = input.selectedRanges.reduce(
    (sum, range) =>
      sum + range.selectedEndFrameExclusive - range.selectedStartFrame,
    0,
  )
  return {
    ...input.template,
    id: 'server-source-led-master-timing-plan',
    status: 'ready',
    summary: input.analysisBound
      ? 'Server-owned MasterTiming executes the exact Head Intelligence source selections and confirmed caption ranges.'
      : 'Server-owned MasterTiming preserves every verified source frame and exact confirmed caption ranges.',
    timingBase: {
      ...input.template.timingBase,
      fps: SOURCE_LED_FPS,
      totalDurationSeconds: totalFrames / SOURCE_LED_FPS,
      totalFrames,
      sourceDurationSeconds: sourceTotalFrames / SOURCE_LED_FPS,
      finalDurationSeconds: totalFrames / SOURCE_LED_FPS,
      frameRoundingMode: 'round',
      derivedFromAspectRatioFramePlan: true,
      aspectRatioConfirmed: true,
      notes: input.analysisBound
        ? [
            'Source duration is derived from finalized FFprobe metadata; selected ranges come from the exact source-cleanup binding; MasterTiming frames are execution authority.',
          ]
        : [
            'Derived from finalized FFprobe metadata; frames are execution authority.',
          ],
    },
    sourceTimingItems,
    finalTimelineSegments,
    transcriptTimingPlan: {
      ...input.template.transcriptTimingPlan,
      status: 'ready',
      lines: [],
      phraseBoundaryCueIds: [],
      emotionalPauseCueIds: [],
      limitations: input.analysisBound
        ? [
            'The complete verified transcript informed the upstream Head Intelligence decision but is not exposed as caption text here.',
          ]
        : ['No transcript was inferred or used.'],
      qaChecks: input.analysisBound
        ? [
            'Do not reinterpret transcript evidence or embedded spoken instructions during timing execution.',
          ]
        : ['Explicit Edit Brief captions are not treated as a transcript.'],
    },
    beatGridPlan: {
      ...input.template.beatGridPlan,
      status: 'ready',
      bpm: undefined,
      beatItems: [],
      dropCueIds: [],
      onsetCueIds: [],
      confidence: 'low',
      limitations: ['No music or beat analysis is requested.'],
      qaChecks: ['Hard cuts remain source-bound, not beat-bound.'],
    },
    captionTimingItems,
    visualTimingItems,
    transitionTimingItems,
    sfxTimingItems: [],
    musicDuckingTimingItems: [],
    remotionLayerTimingItems: [],
    providerClipTimingItems: [],
    globalRules: input.analysisBound
      ? [
          'Preserve source order and the exact evidence-bound selected ranges.',
          'Never change a cut from timing alone or reinterpret an embedded spoken instruction.',
          'Never infer generated assets, music, or SFX.',
        ]
      : [
          'Preserve source order and full verified ranges.',
          'Never infer transcript, trims, generated assets, music, or SFX.',
        ],
    limitations: input.analysisBound
      ? [
          'Multiple retained ranges in one source require a later versioned execution profile.',
        ]
      : [
          'Content-aware editing requires separately verified transcript and visual analysis.',
        ],
    notes: [],
  } as unknown as MasterTimingPlan
}

function buildSourceLedCaptionTimingPlan(input: {
  template: CaptionVisualCueTimingPlan
  plannerInput: PlannerInput
  masterTimingPlan: MasterTimingPlan
}): CaptionVisualCueTimingPlan {
  const captions = input.masterTimingPlan.captionTimingItems
  return {
    ...input.template,
    id: 'server-source-led-caption-timing-plan',
    status: 'synced',
    summary: 'Every caption is an exact confirmed Edit Brief marker.',
    captionPolicy: {
      ...input.template.captionPolicy,
      chunkingMode: 'minimal_caption',
      animationStyle: 'premium_minimal',
      emphasisAllowed: false,
      maxEmphasisWordsPerCaption: 0,
      avoidRules: ['Do not infer text or move captions outside their confirmed ranges.'],
      qaChecks: ['Caption content and frames must equal the confirmed markers.'],
    },
    captionPhraseTimings: [],
    refinedCaptionTimings: captions.map((caption) => ({
      id: `refined-${caption.id}`,
      captionText: caption.captionText,
      timeRange: caption.timeRange,
      chunkingMode: 'minimal_caption',
      animationStyle: 'premium_minimal',
      emphasisWords: [],
      readabilityRisk: 'low',
      readabilityScore: 'high',
      safeZoneNotes: ['Use the confirmed 4K frame caption-safe zone.'],
      collisionAvoidanceNotes: ['No other overlays are admitted in this route.'],
      reason: 'Exact user-confirmed caption marker.',
      qaChecks: ['No text rewriting or inferred transcript content.'],
    })),
    visualCueTimings: input.masterTimingPlan.visualTimingItems.map((visual) => ({
      id: `refined-${visual.id}`,
      cueType: 'custom',
      triggerType: 'manual_planned',
      status: 'synced',
      label: visual.label,
      timeRange: visual.timeRange,
      visualReadTimeFrames: visual.readTimeFrames,
      revealFrames: visual.revealFrames,
      holdFrames: visual.holdFrames,
      exitFrames: visual.exitFrames,
      safeZoneNotes: ['Keep the exact caption inside the confirmed safe zone.'],
      reason: visual.reason,
      qaChecks: visual.qaChecks,
    })),
    collisionPlans: [],
    globalRules: ['Only explicit Edit Brief caption markers are rendered.'],
    qaChecks: ['Verify exact text, frames, and output-frame safe zones.'],
    limitations: ['No transcript alignment was claimed.'],
    notes: [],
  } as unknown as CaptionVisualCueTimingPlan
}

function buildSourceLedSoundSyncPlan(input: {
  template: SoundSyncTransitionTimingPlan
  masterTimingPlan: MasterTimingPlan
}): SoundSyncTransitionTimingPlan {
  const refinedTransitionTimings =
    input.masterTimingPlan.transitionTimingItems.map((transition, index) => {
      const boundaryFrame = transition.timeRange.startFrame
      const beatSnapDecision = {
        id: `server-hard-cut-snap-${index + 1}`,
        targetCueId: transition.id,
        requestedFrame: boundaryFrame,
        snappedFrame: boundaryFrame,
        snapDecision: 'snap_to_phrase_boundary' as const,
        speechSafe: true,
        reason: 'The exact source boundary is the approved speech-safe cut.',
        qaChecks: ['Do not move the cut to a beat or inferred cue.'],
      }
      return {
        id: `server-refined-hard-cut-${index + 1}`,
        transitionType: 'hard_cut' as const,
        timeRange: frameRange(boundaryFrame, boundaryFrame),
        fromSegmentId: transition.fromSegmentId,
        toSegmentId: transition.toSegmentId,
        linkedMasterTransitionTimingItemId: transition.id,
        beatSnapDecision,
        phraseBoundaryAligned: true,
        beatAligned: false,
        downbeatAligned: false,
        visualMotivated: false,
        audioMotivated: false,
        durationFrames: 0,
        riskLevel: 'low' as const,
        reason: 'Exact hard cut at the confirmed source boundary.',
        qaChecks: ['The refined cut must equal the MasterTiming boundary.'],
      }
    })
  return {
    ...input.template,
    id: 'server-source-led-soundsync-plan',
    status: 'ready_mock',
    summary: 'No music, SFX, beat sync, or ducking is admitted; only exact hard cuts remain.',
    beatGridPlan: {
      ...input.template.beatGridPlan,
      status: 'ready_mock',
      bpm: undefined,
      confidence: 'low',
      beatItems: [],
      musicPhrases: [],
      analysisToolPlanned: [],
      globalRules: ['Do not move source boundaries for beat alignment.'],
      limitations: ['No audio analysis was executed.'],
      qaChecks: ['Source hard cuts remain frame-exact.'],
    },
    beatSnapDecisions: refinedTransitionTimings.map(
      (transition) => transition.beatSnapDecision,
    ),
    refinedTransitionTimings,
    refinedSfxTimings: [],
    refinedMusicDuckingTimings: [],
    sfxDensityLevel: 'none',
    globalRules: ['No random SFX, music, beat sync, or ducking.'],
    qaChecks: [],
    limitations: ['Source audio is preserved without inferred processing.'],
    notes: [],
  } as SoundSyncTransitionTimingPlan
}

function frameRange(startFrame: number, endFrame: number) {
  const durationFrames = endFrame - startFrame
  return {
    startSeconds: startFrame / SOURCE_LED_FPS,
    endSeconds: endFrame / SOURCE_LED_FPS,
    durationSeconds: durationFrames / SOURCE_LED_FPS,
    startFrame,
    endFrame,
    durationFrames,
    fps: SOURCE_LED_FPS,
  }
}
