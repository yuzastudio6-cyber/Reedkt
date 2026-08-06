import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { z } from 'zod'
import { QWEN_VISUAL_UNDERSTANDING_RETIREMENT } from
  '../services/qwen-visual-understanding-provider'
import {
  EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION,
  createBlockedEditReferenceVisualLanguageStudyResult,
  hashEditReferenceVisualLanguageStudyRequest,
  validateEditReferenceVisualLanguageStudyRequest,
  validateEditReferenceVisualLanguageStudyResult,
  type EditReferenceAnalyzedVisualLanguageStudyResult,
  type EditReferenceVisualFrameEvidence,
  type EditReferenceVisualLanguageFinding,
  type EditReferenceVisualLanguageFindingCategory,
  type EditReferenceVisualLanguageStudyAdapter,
  type EditReferenceVisualLanguageStudyRequest,
  type EditReferenceVisualLanguageStudyResult,
} from './edit-reference-visual-language-study-contract'
import type { EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt } from './edit-reference-reviewed-local-qwen25vl-mlx-runtime'
import type { EditReferenceResolvedPrivateFrame } from './edit-reference-qwen-visual-language-adapter'

const execFileAsync = promisify(execFile)
const DEFAULT_RUNNER_SCRIPT_PATH = fileURLToPath(new URL('./runtime/qwen25vl-mlx-classify-frames.py', import.meta.url))
const OUTPUT_SCHEMA_VERSION = 'reeditpro-reviewed-local-qwen25vl-mlx-visual-v1' as const
const ADAPTER_ID = 'reeditpro_reviewed_local_qwen25vl_mlx_visual' as const
const MODEL_ROUTING_POLICY_VERSION = 'model-routing-policy-v1' as const
const MAX_FRAME_BYTES = 2 * 1024 * 1024
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const

const classificationsSchema = z.object({
  compositionHierarchy: z.enum([
    'single_focal_point', 'balanced_multi_region', 'layered_depth', 'asymmetric_focus', 'full_frame_field',
  ]),
  framingShotScale: z.enum(['wide_context', 'medium_subject', 'close_detail', 'mixed_scales', 'graphic_canvas']),
  subjectPlacement: z.enum(['centered', 'rule_of_thirds', 'edge_anchored', 'distributed', 'no_clear_subject']),
  cameraBehavior: z.enum(['stable', 'reframed_between_samples', 'dynamic_change', 'uncertain_from_samples']),
  sceneRhythm: z.enum(['stable_hold', 'measured_changes', 'frequent_changes', 'uncertain_from_samples']),
  visualDensity: z.enum(['low', 'medium', 'high']),
  brollPattern: z.enum(['primary_subject_dominant', 'support_visual_dominant', 'alternating', 'uncertain']),
  transitionLanguage: z.enum(['hard_visual_change', 'continuous_visual_flow', 'mixed_or_varied', 'uncertain_from_samples']),
  visibleTextOverlay: z.enum(['none', 'restrained', 'prominent', 'uncertain']),
  graphicOverlayLanguage: z.enum(['none', 'restrained', 'prominent', 'uncertain']),
  tonalCharacter: z.enum(['predominantly_dark', 'predominantly_light', 'balanced_or_mixed']),
  contrastCharacter: z.enum(['low', 'medium', 'high']),
  lightingCharacter: z.enum(['soft', 'directional', 'flat', 'mixed_or_uncertain']),
  visualStorytelling: z.enum(['speaker_led', 'demonstration', 'montage', 'atmospheric', 'graphic_led', 'mixed']),
  confidence: z.number().min(0.01).max(1),
}).strict()

const runnerOutputSchema = z.object({
  schemaVersion: z.literal(OUTPUT_SCHEMA_VERSION),
  framesAnalyzed: z.number().int().min(2).max(8),
  classifications: classificationsSchema,
  semanticVisualModelExecuted: z.literal(true),
  rawModelOutputPersisted: z.literal(false),
  rawFramesPersisted: z.literal(false),
  exactVisibleTextRetained: z.literal(false),
  identityAnalysisPerformed: z.literal(false),
  externalUrlFetched: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

type Classifications = z.infer<typeof classificationsSchema>

export interface CreateEditReferenceReviewedLocalQwen25VlMlxAdapterInput {
  readonly runtime: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt
  readonly pythonCommand: string
  readonly modelPath: string
  readonly privateFrameRoot: string
  readonly resolvePrivateFrame: (
    sample: EditReferenceVisualFrameEvidence,
  ) => Promise<EditReferenceResolvedPrivateFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedPrivateFrame[],
  ) => Promise<void>
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
  readonly now?: () => string
}

/**
 * Executes the exact reviewed MLX model against bounded ephemeral JPEGs. The
 * adapter persists only deterministic summaries derived from enum-validated
 * classifications; paths, pixels, prompts, raw model output, visible wording,
 * and identity guesses never enter the study result.
 */
export function createEditReferenceReviewedLocalQwen25VlMlxAdapter(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxAdapterInput,
): EditReferenceVisualLanguageStudyAdapter {
  if (!QWEN_VISUAL_UNDERSTANDING_RETIREMENT.freshExecutionAllowed) {
    throw new Error(
      'reviewed_local_qwen25vl_mlx_retired_use_visual_intelligence',
    )
  }
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  const timeoutMs = Math.min(45 * 60 * 1_000, Math.max(30_000, input.timeoutMs ?? 20 * 60 * 1_000))
  return {
    adapterId: ADAPTER_ID,
    adapterVersion: input.runtime.adapterVersion,
    async analyze(request): Promise<EditReferenceVisualLanguageStudyResult> {
      validateReviewedLocalRequest(request)
      const startedAt = now(input)
      const resolvedFrames: EditReferenceResolvedPrivateFrame[] = []
      let boundedPrivateFramesRead = false
      let modelCallMade = false
      let output: z.infer<typeof runnerOutputSchema> | undefined
      let failureMessage: string | undefined
      try {
        await validateRuntimePath(input.pythonCommand, 'Reviewed local Qwen Python command', false, true)
        await validateRuntimePath(input.modelPath, 'Reviewed local Qwen model', true)
        await validateRuntimePath(runnerScriptPath, 'Reviewed local Qwen frame runner')
        await resolveExactPrivateFrames(input, request, resolvedFrames)
        boundedPrivateFramesRead = true
        output = await executeClassification({
          pythonCommand: input.pythonCommand,
          runnerScriptPath,
          modelPath: input.modelPath,
          framePaths: resolvedFrames.map((frame) => frame.localFilePath),
          timeoutMs,
        })
        modelCallMade = output.semanticVisualModelExecuted
        if (output.framesAnalyzed !== request.frameSamples.length) {
          throw new Error('Reviewed local Qwen output does not cover the exact bounded frame set.')
        }
      } catch {
        failureMessage = 'The reviewed local Qwen visual runtime failed closed without retaining raw model output or private frame paths.'
      }

      let temporaryFramesCleaned = false
      try {
        await input.cleanupPrivateFrames(resolvedFrames)
        await assertFramesMissing(resolvedFrames)
        temporaryFramesCleaned = true
      } catch {
        failureMessage = 'The reviewed local Qwen visual runtime could not prove ephemeral frame cleanup.'
      }

      if (!output || failureMessage || !temporaryFramesCleaned) {
        return createBlockedEditReferenceVisualLanguageStudyResult({
          request,
          blockerCode: temporaryFramesCleaned ? 'runtime_response_invalid' : 'ephemeral_cleanup_failed',
          blockerMessage: failureMessage ?? 'The reviewed local Qwen visual runtime did not return valid bounded evidence.',
          retryAvailable: true,
          retryReason: 'Retry the private local visual study after validating the exact runtime, model, and ephemeral frame workspace.',
          execution: {
            boundedPrivateFramesRead,
            providerCallMade: false,
            modelCallMade,
            workerJobCreated: false,
            temporaryFramesCleaned,
          },
        })
      }

      const completedAt = now(input)
      const runnerDigestSha256 = await hashFile(runnerScriptPath)
      const result = buildAnalyzedResult({
        request,
        runtime: input.runtime,
        classifications: output.classifications,
        runnerDigestSha256,
        startedAt,
        completedAt,
      })
      validateEditReferenceVisualLanguageStudyResult(request, result)
      return result
    },
  }
}

function validateReviewedLocalRequest(request: EditReferenceVisualLanguageStudyRequest): void {
  validateEditReferenceVisualLanguageStudyRequest(request)
  if (
    request.executionScope !== 'controlled_test'
    || request.approvedUsageEstimateId !== null
    || request.internalCostBudgetId !== null
    || request.immutableRateCardSnapshotId !== null
    || request.maximumAuthorizedInternalCostMicros !== null
    || !request.boundedPrivateFrameInputAllowed
    || request.rawFullMediaInputAllowed
    || request.externalUrlFetchAllowed
  ) throw new Error('Reviewed local Qwen request exceeds its exact frame, cost, or privacy authority.')
}

async function resolveExactPrivateFrames(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxAdapterInput,
  request: EditReferenceVisualLanguageStudyRequest,
  resolved: EditReferenceResolvedPrivateFrame[],
): Promise<void> {
  const configuredRoot = path.resolve(input.privateFrameRoot)
  const rootStat = await lstat(configuredRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('Ephemeral Qwen frame root is invalid.')
  const root = await realpath(configuredRoot)
  for (const sample of request.frameSamples) {
    const frame = await input.resolvePrivateFrame(sample)
    if (frame.privateFrameArtifactId !== sample.privateFrameArtifactId) throw new Error('Qwen frame identity mismatch.')
    const configuredPath = path.resolve(frame.localFilePath)
    const frameStat = await lstat(configuredPath)
    if (!frameStat.isFile() || frameStat.isSymbolicLink() || frameStat.size < 1 || frameStat.size > MAX_FRAME_BYTES) {
      throw new Error('Qwen private frame is outside its reviewed file bound.')
    }
    const localFilePath = await realpath(configuredPath)
    const relative = path.relative(root, localFilePath)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Qwen frame escaped its private root.')
    if (resolved.some((candidate) => candidate.localFilePath === localFilePath)) throw new Error('Qwen frame paths must be unique.')
    if (await hashFile(localFilePath) !== sample.frameChecksumSha256) throw new Error('Qwen frame checksum mismatch.')
    resolved.push({ privateFrameArtifactId: sample.privateFrameArtifactId, localFilePath })
  }
}

async function executeClassification(input: {
  readonly pythonCommand: string
  readonly runnerScriptPath: string
  readonly modelPath: string
  readonly framePaths: readonly string[]
  readonly timeoutMs: number
}): Promise<z.infer<typeof runnerOutputSchema>> {
  try {
    const result = await execFileAsync(input.pythonCommand, [
      input.runnerScriptPath,
      input.modelPath,
      ...input.framePaths,
    ], {
      timeout: input.timeoutMs,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
      env: offlineEnvironment(),
    })
    const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean)
    const jsonLine = [...lines].reverse().find((line) => line.trim().startsWith('{'))
    if (!jsonLine) throw new Error('Reviewed local Qwen runner omitted its reduced JSON output.')
    return runnerOutputSchema.parse(JSON.parse(jsonLine) as unknown)
  } catch {
    throw new Error('Reviewed local Qwen frame classification failed or returned invalid output.')
  }
}

function buildAnalyzedResult(input: {
  readonly request: EditReferenceVisualLanguageStudyRequest
  readonly runtime: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt
  readonly classifications: Classifications
  readonly runnerDigestSha256: string
  readonly startedAt: string
  readonly completedAt: string
}): EditReferenceAnalyzedVisualLanguageStudyResult {
  const findings = buildFindings(input.request, input.classifications)
  const allCategories = new Set<EditReferenceVisualLanguageFindingCategory>([
    'composition_hierarchy', 'framing_and_shot_scale', 'subject_placement', 'camera_behavior',
    'scene_rhythm', 'visual_density', 'broll_pattern', 'transition_language',
    'caption_visible_text_and_overlay', 'graphic_overlay_language',
    'color_contrast_and_lighting', 'visual_storytelling',
  ])
  for (const finding of findings) allCategories.delete(finding.category)
  const missingEvidenceKinds = [...allCategories]
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  return {
    schemaVersion: EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceVisualLanguageStudyRequest(input.request),
    status: 'analyzed',
    runtimeSource: 'verified_local',
    workspaceId: input.request.workspaceId,
    editReferenceId: input.request.editReferenceId,
    studySessionId: input.request.studySessionId,
    orchestrationId: input.request.orchestrationId,
    privateMediaArtifactId: input.request.privateMediaArtifactId,
    mediaChecksumSha256: input.request.mediaChecksumSha256,
    evidenceManifestDigestSha256: input.request.evidenceManifestDigestSha256,
    frameManifestDigestSha256: input.request.frameManifestDigestSha256,
    consumedFrameEvidenceIds: input.request.frameSamples.map((sample) => sample.frameEvidenceId),
    evidence: copyEvidence(input.request),
    findings,
    coverage: {
      evidenceItemCount: input.request.frameSamples.length + evidenceIds(input.request).length,
      representativeFrameCount: input.request.frameSamples.filter((sample) => sample.role === 'representative').length,
      keyframeCount: input.request.frameSamples.filter((sample) => sample.role === 'keyframe').length,
      visibleTextEvidenceMode: input.request.visibleTextEvidenceMode,
      realPersonOrClaimContextPresent: input.request.realPersonOrClaimContextPresent,
      partial: missingEvidenceKinds.length > 0,
      missingEvidenceKinds,
    },
    summary: {
      findingCount: findings.length,
      transferablePrincipleCount: findings.filter((finding) => finding.transferability === 'transferable_principle').length,
      contextOnlyCount: findings.filter((finding) => finding.transferability === 'context_only').length,
      nonTransferableCount: findings.filter((finding) => finding.transferability === 'non_transferable').length,
      averageConfidence,
    },
    execution: {
      boundedPrivateFramesRead: true,
      semanticVisualModelExecuted: true,
      fullMediaRead: false,
      rawFramesPersisted: false,
      externalUrlFetched: false,
      providerCallMade: false,
      modelCallMade: true,
      workerJobCreated: false,
      temporaryFramesCleaned: true,
      remoteMutationMade: false,
    },
    model: {
      adapterId: ADAPTER_ID,
      adapterVersion: input.runtime.adapterVersion,
      providerId: null,
      modelId: input.runtime.modelId,
      modelRevision: input.runtime.modelRevision,
      modelAggregateSha256: input.runtime.modelAggregateSha256,
      modelRoutingPolicyVersion: MODEL_ROUTING_POLICY_VERSION,
      visualInstructionDigestSha256: sha256(`${OUTPUT_SCHEMA_VERSION}:${input.runnerDigestSha256}`),
    },
    provenance: {
      executionId: `qwen25vl-mlx-${sha256(`${input.request.orchestrationId}:${input.runtime.runtimeId}`).slice(0, 24)}`,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    },
    usage: {
      mode: 'controlled_test_unmetered',
      approvedUsageEstimateId: null,
      internalCostBudgetId: null,
      immutableRateCardSnapshotId: null,
      maximumAuthorizedInternalCostMicros: null,
      meteredInternalCostMicros: '0',
      usageEventIds: [],
      internalCostRecordIds: [],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    privacy: {
      rawFullMediaPersisted: false,
      rawFramesPersisted: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      temporaryFramesCleaned: true,
    },
    copySafety: {
      exactReferenceLayoutRetained: false,
      exactFrameCompositionCopyInstructionCreated: false,
      exactVisibleTextRetained: false,
      exactTransitionOrCameraPathCopyInstructionCreated: false,
      creatorIdentityTransferInstructionCreated: false,
      copyrightedAssetTransferInstructionCreated: false,
    },
    factSafety: {
      evidenceRequired: input.request.realPersonOrClaimContextPresent,
      evidenceIds: [...input.request.evidence.factSafetyEvidenceIds],
      unverifiedClaimPresentedAsFact: false,
      misleadingRealPersonDepictionInstructionCreated: false,
      guiltImplyingVisualInstructionCreated: false,
    },
    transferBoundary: {
      technicalChangePointsTreatedAsSemanticScenes: false,
      technicalSignalsTreatedAsCreativeMeaning: false,
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      targetEvidenceRequired: true,
      userApprovalRequired: true,
      exactLayoutOrCameraPathTransferAllowed: false,
      visualIdentityTransferAllowed: false,
      visibleTextTransferAllowed: false,
    },
  }
}

function buildFindings(
  request: EditReferenceVisualLanguageStudyRequest,
  value: Classifications,
): EditReferenceVisualLanguageFinding[] {
  const definitions: Array<{
    readonly category: EditReferenceVisualLanguageFindingCategory
    readonly summary: string
    readonly uncertain: boolean
  }> = [
    { category: 'composition_hierarchy', summary: compositionSummary(value.compositionHierarchy), uncertain: false },
    { category: 'framing_and_shot_scale', summary: framingSummary(value.framingShotScale), uncertain: false },
    { category: 'subject_placement', summary: placementSummary(value.subjectPlacement), uncertain: false },
    { category: 'camera_behavior', summary: cameraSummary(value.cameraBehavior), uncertain: value.cameraBehavior === 'uncertain_from_samples' },
    { category: 'scene_rhythm', summary: rhythmSummary(value.sceneRhythm), uncertain: value.sceneRhythm === 'uncertain_from_samples' },
    { category: 'visual_density', summary: densitySummary(value.visualDensity), uncertain: false },
    { category: 'broll_pattern', summary: brollSummary(value.brollPattern), uncertain: value.brollPattern === 'uncertain' },
    { category: 'transition_language', summary: transitionSummary(value.transitionLanguage), uncertain: value.transitionLanguage === 'uncertain_from_samples' },
    { category: 'graphic_overlay_language', summary: graphicOverlaySummary(value.graphicOverlayLanguage), uncertain: value.graphicOverlayLanguage === 'uncertain' },
    {
      category: 'color_contrast_and_lighting',
      summary: colorLightingSummary(value.tonalCharacter, value.contrastCharacter, value.lightingCharacter),
      uncertain: value.lightingCharacter === 'mixed_or_uncertain',
    },
    { category: 'visual_storytelling', summary: storytellingSummary(value.visualStorytelling), uncertain: false },
  ]
  if (request.visibleTextEvidenceMode !== 'not_requested') {
    definitions.splice(8, 0, {
      category: 'caption_visible_text_and_overlay',
      summary: visibleTextSummary(value.visibleTextOverlay),
      uncertain: value.visibleTextOverlay === 'uncertain',
    })
  }
  const allFrameEvidenceIds = request.frameSamples.map((sample) => sample.frameEvidenceId)
  return definitions.map((definition, index) => {
    const caption = definition.category === 'caption_visible_text_and_overlay'
    const supportingEvidence = categoryEvidenceIds(request, definition.category)
    return {
      findingId: `visual-${String(index + 1).padStart(2, '0')}-${definition.category}`,
      category: definition.category,
      summary: definition.summary,
      evidenceIds: unique([...allFrameEvidenceIds, ...supportingEvidence]),
      confidence: value.confidence,
      transferability: caption ? 'context_only' : 'transferable_principle',
      targetAdaptationRequired: true,
      requiresUserReview: caption || definition.uncertain,
      identityRelated: false,
      factSafetyStatus: 'not_applicable',
      visibleTextInterpretation: caption ? request.visibleTextEvidenceMode as 'geometry_only' | 'ocr_backed' : 'not_applicable',
      exactReferenceLayoutRetained: false,
      exactFrameCompositionInstructionCreated: false,
      exactVisibleTextRetained: false,
      exactTransitionOrCameraPathInstructionCreated: false,
      identityTransferInstructionCreated: false,
      copyrightedAssetTransferInstructionCreated: false,
    }
  })
}

function categoryEvidenceIds(
  request: EditReferenceVisualLanguageStudyRequest,
  category: EditReferenceVisualLanguageFindingCategory,
): readonly string[] {
  switch (category) {
    case 'caption_visible_text_and_overlay':
      return request.visibleTextEvidenceMode === 'ocr_backed'
        ? request.evidence.ocrEvidenceIds
        : request.evidence.captionGeometryEvidenceIds
    case 'color_contrast_and_lighting': return request.evidence.technicalColorEvidenceIds
    case 'camera_behavior':
    case 'scene_rhythm':
    case 'transition_language': return request.evidence.technicalChangePointEvidenceIds
    case 'visual_density': return request.evidence.technicalSourceConditionEvidenceIds
    case 'broll_pattern':
    case 'visual_storytelling': return [...request.evidence.mediaStructureEvidenceIds, ...request.evidence.studyChatGoalEvidenceIds]
    default: return request.evidence.mediaStructureEvidenceIds
  }
}

function compositionSummary(value: Classifications['compositionHierarchy']): string {
  return ({
    single_focal_point: 'The sampled frames use one clear focal region with supporting space kept secondary.',
    balanced_multi_region: 'The sampled frames balance several purposeful regions without losing the main hierarchy.',
    layered_depth: 'The sampled frames organize foreground, middle, and background elements as a layered hierarchy.',
    asymmetric_focus: 'The sampled frames use an intentionally off-center focal region balanced by quieter space.',
    full_frame_field: 'The sampled frames distribute attention across the full frame rather than one isolated focal block.',
  })[value]
}

function framingSummary(value: Classifications['framingShotScale']): string {
  return ({
    wide_context: 'The sample set favors wider contextual framing that establishes the surrounding visual field.',
    medium_subject: 'The sample set favors medium framing that keeps a primary subject readable with context.',
    close_detail: 'The sample set favors close detail framing that concentrates attention on a narrow visual area.',
    mixed_scales: 'The sample set varies shot scale to alternate context, subject, and detail emphasis.',
    graphic_canvas: 'The sample set behaves primarily as a designed graphic canvas rather than conventional camera framing.',
  })[value]
}

function placementSummary(value: Classifications['subjectPlacement']): string {
  return ({
    centered: 'Primary visual weight is generally centered in the sampled frames.',
    rule_of_thirds: 'Primary visual weight generally sits away from center with deliberate balancing space.',
    edge_anchored: 'Primary visual weight is anchored near an edge while the remaining frame supports context or graphics.',
    distributed: 'Visual weight is distributed across several regions rather than one persistent subject position.',
    no_clear_subject: 'The samples function without one consistently dominant subject position.',
  })[value]
}

function cameraSummary(value: Classifications['cameraBehavior']): string {
  return ({
    stable: 'The ordered samples suggest a mostly stable camera or composition.',
    reframed_between_samples: 'The ordered samples suggest purposeful reframing between visual beats.',
    dynamic_change: 'The ordered samples suggest substantial camera or composition change across beats.',
    uncertain_from_samples: 'The sparse ordered samples do not safely establish a recurring camera behavior.',
  })[value]
}

function rhythmSummary(value: Classifications['sceneRhythm']): string {
  return ({
    stable_hold: 'The sampled sequence suggests longer visual holds with limited compositional change.',
    measured_changes: 'The sampled sequence suggests measured visual changes between distinct beats.',
    frequent_changes: 'The sampled sequence suggests frequent visual changes and a denser beat rhythm.',
    uncertain_from_samples: 'The sparse sample set does not safely establish the full scene-change rhythm.',
  })[value]
}

function densitySummary(value: Classifications['visualDensity']): string {
  return ({
    low: 'The sampled frames keep visual density low with substantial quiet space.',
    medium: 'The sampled frames use moderate visual density with a readable hierarchy.',
    high: 'The sampled frames carry high visual density and require careful hierarchy preservation.',
  })[value]
}

function brollSummary(value: Classifications['brollPattern']): string {
  return ({
    primary_subject_dominant: 'The samples keep the primary subject or focal content dominant over supporting imagery.',
    support_visual_dominant: 'The samples rely strongly on supporting visuals to carry the explanation or story beat.',
    alternating: 'The samples alternate primary focal content with supporting visual material.',
    uncertain: 'The sample set does not safely establish a recurring primary-versus-supporting visual pattern.',
  })[value]
}

function transitionSummary(value: Classifications['transitionLanguage']): string {
  return ({
    hard_visual_change: 'The ordered samples suggest clear visual changes between beats rather than continuous overlap.',
    continuous_visual_flow: 'The ordered samples suggest continuity of visual structure across adjacent beats.',
    mixed_or_varied: 'The ordered samples suggest varied continuity and change patterns across the sequence.',
    uncertain_from_samples: 'The sparse samples do not safely establish a repeatable transition language or timing.',
  })[value]
}

function visibleTextSummary(value: Classifications['visibleTextOverlay']): string {
  return ({
    none: 'Approved text evidence and the sampled frames do not show a recurring visible-text overlay pattern.',
    restrained: 'Visible-text geometry appears restrained and secondary to the main image hierarchy.',
    prominent: 'Visible-text geometry is a prominent part of the frame hierarchy and needs target-specific adaptation.',
    uncertain: 'The approved text evidence and sparse samples do not safely establish a recurring text-overlay pattern.',
  })[value]
}

function graphicOverlaySummary(value: Classifications['graphicOverlayLanguage']): string {
  return ({
    none: 'The sampled frames rely primarily on the underlying image without a recurring graphic overlay layer.',
    restrained: 'Graphic overlays appear restrained and support the main visual hierarchy.',
    prominent: 'Graphic overlays are a prominent storytelling layer in the sampled frames.',
    uncertain: 'The sample set does not safely establish a recurring graphic-overlay language.',
  })[value]
}

function colorLightingSummary(
  tone: Classifications['tonalCharacter'],
  contrast: Classifications['contrastCharacter'],
  lighting: Classifications['lightingCharacter'],
): string {
  const toneText = ({
    predominantly_dark: 'a predominantly dark tonal field',
    predominantly_light: 'a predominantly light tonal field',
    balanced_or_mixed: 'a balanced or varied tonal field',
  })[tone]
  const lightingText = ({
    soft: 'soft lighting',
    directional: 'directional lighting',
    flat: 'even or flat lighting',
    mixed_or_uncertain: 'mixed or sample-limited lighting evidence',
  })[lighting]
  return `The sampled frames combine ${toneText}, ${contrast} contrast, and ${lightingText}.`
}

function storytellingSummary(value: Classifications['visualStorytelling']): string {
  return ({
    speaker_led: 'The sampled visual structure is primarily led by a speaker or central subject.',
    demonstration: 'The sampled visual structure is primarily organized around showing a process or result.',
    montage: 'The sampled visual structure develops meaning through a sequence of varied supporting images.',
    atmospheric: 'The sampled visual structure prioritizes mood, setting, and visual atmosphere.',
    graphic_led: 'The sampled visual structure is primarily carried by designed graphic composition.',
    mixed: 'The sampled visual structure combines subject, supporting imagery, and graphic explanation.',
  })[value]
}

async function validateRuntimePath(
  value: string,
  label: string,
  directory = false,
  allowExecutableAlias = false,
): Promise<void> {
  if (!path.isAbsolute(value) || /https?:\/\//i.test(value)) throw new Error(`${label} must be one absolute local path.`)
  if (!path.resolve(value).startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error(`${label} must remain on the authorized external SD volume.`)
  }
  const resolved = await realpath(value)
  if (!allowExecutableAlias && resolved !== path.resolve(value)) throw new Error(`${label} must not use an aliased path.`)
  const info = await lstat(value)
  const targetInfo = await lstat(resolved)
  if (
    (!allowExecutableAlias && info.isSymbolicLink())
    || (directory ? !info.isDirectory() : !targetInfo.isFile())
  ) throw new Error(`${label} is invalid.`)
}

async function assertFramesMissing(frames: readonly EditReferenceResolvedPrivateFrame[]): Promise<void> {
  for (const frame of frames) {
    try {
      await stat(frame.localFilePath)
      throw new Error('Reviewed local Qwen frame cleanup is incomplete.')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
}

async function hashFile(file: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

function copyEvidence(request: EditReferenceVisualLanguageStudyRequest) {
  return {
    mediaStructureEvidenceIds: [...request.evidence.mediaStructureEvidenceIds],
    technicalChangePointEvidenceIds: [...request.evidence.technicalChangePointEvidenceIds],
    technicalSourceConditionEvidenceIds: [...request.evidence.technicalSourceConditionEvidenceIds],
    technicalColorEvidenceIds: [...request.evidence.technicalColorEvidenceIds],
    captionGeometryEvidenceIds: [...request.evidence.captionGeometryEvidenceIds],
    ocrEvidenceIds: [...request.evidence.ocrEvidenceIds],
    studyChatGoalEvidenceIds: [...request.evidence.studyChatGoalEvidenceIds],
    factSafetyEvidenceIds: [...request.evidence.factSafetyEvidenceIds],
  }
}

function evidenceIds(request: EditReferenceVisualLanguageStudyRequest): string[] {
  return [
    ...request.evidence.mediaStructureEvidenceIds,
    ...request.evidence.technicalChangePointEvidenceIds,
    ...request.evidence.technicalSourceConditionEvidenceIds,
    ...request.evidence.technicalColorEvidenceIds,
    ...request.evidence.captionGeometryEvidenceIds,
    ...request.evidence.ocrEvidenceIds,
    ...request.evidence.studyChatGoalEvidenceIds,
    ...request.evidence.factSafetyEvidenceIds,
  ]
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function now(input: CreateEditReferenceReviewedLocalQwen25VlMlxAdapterInput): string {
  return input.now?.() ?? new Date().toISOString()
}

function offlineEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HF_HUB_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    TRANSFORMERS_OFFLINE: '1',
    TOKENIZERS_PARALLELISM: 'false',
  }
}
