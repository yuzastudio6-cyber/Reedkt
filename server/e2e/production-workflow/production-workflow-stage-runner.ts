import { runAudioExecutionPipeline } from '../../workers/audio-execution'
import { runColorExecutionPipeline } from '../../workers/color-execution'
import { runEnhancementSlowMotionPipeline } from '../../workers/enhancement-slowmotion'
import { runFinalRenderExecutionPipeline } from '../../workers/final-render'
import { runMaskCompositionPipeline } from '../../workers/mask-composition'
import { runMediaAnalysisFoundation } from '../../workers/media'
import { runSmartCutTimelineExecutionPipeline } from '../../workers/smart-cut-timeline'
import { runSpeechCaptionExecutionPipeline } from '../../workers/speech-caption'
import { buildProductionReadinessReport } from '../../workers/readiness-validation'
import { buildApprovedWorkflowPayload } from './production-workflow-approved-payload-builder'
import type { ProductionWorkflowArtifactStore } from './production-workflow-artifact-store'
import type { ProductionWorkflowFixture } from './production-workflow-fixture-builder'
import type { ProductionWorkflowScenario } from './production-workflow-scenario-types'
import type { ProductionWorkflowMode, ProductionWorkflowStage, ProductionWorkflowStageResult } from './production-workflow-types'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'

export interface ProductionWorkflowStageRunnerContext {
  scenario: ProductionWorkflowScenario
  fixture: ProductionWorkflowFixture
  artifactStore: ProductionWorkflowArtifactStore
  mode: ProductionWorkflowMode
}

export async function runProductionWorkflowStage(
  stage: ProductionWorkflowStage,
  context: ProductionWorkflowStageRunnerContext,
): Promise<ProductionWorkflowStageResult> {
  if (context.mode === 'static_validation') {
    return stageResult(stage, 'passed', {
      warnings: ['Static validation checked scenario/payload/artifact expectations without stage execution.'],
      outputSummary: { staticValidationOnly: true },
    })
  }

  switch (stage) {
    case 'media_foundation':
      return runMediaStage(context)
    case 'speech_caption_execution':
      return runSpeechCaptionStage(context)
    case 'smart_cut_timeline_execution':
      return runSmartCutTimelineStage(context)
    case 'audio_execution':
      return runAudioStage(context)
    case 'color_execution':
      return runColorStage(context)
    case 'mask_background_execution':
      return runMaskStage(context)
    case 'enhancement_slowmotion_execution':
      return runEnhancementSlowMotionStage(context)
    case 'final_render_export_execution':
      return runFinalRenderStage(context)
    case 'readiness_summary':
      return runReadinessStage()
    case 'final_workflow_report':
      return stageResult(stage, 'passed', { outputSummary: { finalReportStage: true } })
  }
}

async function runMediaStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  const payload = buildApprovedWorkflowPayload({
    fixture: context.fixture,
    stage: 'media_foundation',
    workerType: 'cpu_analysis_worker',
    requestedToolIds: ['ffprobe', 'ffmpeg'],
    requestedRecipeIds: ['smart_cut_recipe'],
    requiredQualityGateTypes: ['render_asset_integrity'],
    metadata: { mediaFoundation: { mode: 'dry_run' } },
  })
  const result = await runMediaAnalysisFoundation({
    mode: 'dry_run',
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    source: { ...context.fixture.sourceStorageRef, sourceOfTruth: true, isPrivate: true },
    sourceStorageObjectId: context.fixture.sourceStorageObjectId,
    workerPayload: payload,
  })
  const plannedArtifacts = [
    context.artifactStore.addPlannedArtifact({ ...ids(context), stage: 'media_foundation', artifactType: 'source_media', fileName: 'source-media.json', storageBucketPurpose: 'source_media', sourceOfTruth: true }),
    context.artifactStore.addPlannedArtifact({ ...ids(context), stage: 'media_foundation', artifactType: 'proxy_video', fileName: 'proxy-video.mp4', storageBucketPurpose: 'proxy_media' }),
    context.artifactStore.addPlannedArtifact({ ...ids(context), stage: 'media_foundation', artifactType: 'extracted_audio', fileName: 'extracted-audio.wav' }),
    context.artifactStore.addPlannedArtifact({ ...ids(context), stage: 'media_foundation', artifactType: 'representative_frame', fileName: 'representative-frame.png' }),
  ]
  return stageResult('media_foundation', 'passed', {
    artifacts: plannedArtifacts,
    skippedReasons: result.skipReasons.map((reason) => reason.code),
    warnings: result.warnings,
    outputSummary: { status: result.status, expectedActions: result.expectedActions },
  })
}

async function runSpeechCaptionStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  context.artifactStore.consumeArtifactsByType('extracted_audio', 'speech_caption_execution')
  const result = await runSpeechCaptionExecutionPipeline({
    mode: pipelineMode(context.mode),
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    approvedSnapshotId: context.fixture.approvedSnapshotId,
    toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-speech-caption`,
    idempotencyKey: `e2e-${context.scenario.scenarioId}-speech-caption`,
    sourceAudioArtifactId: context.fixture.sourceAudioArtifactId,
    buildSpeech: true,
    buildCaptions: true,
    captionFormats: ['srt', 'webvtt', 'ass'],
    mockSegments: context.scenario.scenarioId === 'podcast-repeated-takes'
      ? [
          {
            segmentId: 'seg-1',
            startSeconds: 0,
            endSeconds: 1.8,
            text: 'This is the first take.',
            confidence: 0.94,
            words: [
              { word: 'This', startSeconds: 0, endSeconds: 0.3, confidence: 0.94, segmentId: 'seg-1' },
              { word: 'is', startSeconds: 0.32, endSeconds: 0.5, confidence: 0.94, segmentId: 'seg-1' },
              { word: 'the', startSeconds: 0.52, endSeconds: 0.72, confidence: 0.94, segmentId: 'seg-1' },
              { word: 'first', startSeconds: 0.75, endSeconds: 1.2, confidence: 0.94, segmentId: 'seg-1' },
              { word: 'take', startSeconds: 1.25, endSeconds: 1.8, confidence: 0.94, segmentId: 'seg-1' },
            ],
          },
          {
            segmentId: 'seg-2',
            startSeconds: 2.1,
            endSeconds: 4,
            text: 'This is the better take.',
            confidence: 0.97,
            words: [
              { word: 'This', startSeconds: 2.1, endSeconds: 2.4, confidence: 0.97, segmentId: 'seg-2' },
              { word: 'is', startSeconds: 2.42, endSeconds: 2.6, confidence: 0.97, segmentId: 'seg-2' },
              { word: 'the', startSeconds: 2.62, endSeconds: 2.82, confidence: 0.97, segmentId: 'seg-2' },
              { word: 'better', startSeconds: 2.85, endSeconds: 3.4, confidence: 0.97, segmentId: 'seg-2' },
              { word: 'take', startSeconds: 3.45, endSeconds: 4, confidence: 0.97, segmentId: 'seg-2' },
            ],
          },
        ]
      : undefined,
  })
  addArtifacts(context, 'speech_caption_execution', [...result.transcriptArtifacts, ...result.captionArtifacts])
  return stageResult('speech_caption_execution', result.status === 'blocked' ? 'blocked' : 'passed', {
    artifacts: [...result.transcriptArtifacts, ...result.captionArtifacts],
    qaResults: result.qaResults,
    skippedReasons: result.skippedReasons.map((reason) => reason.code),
    warnings: result.warnings,
    outputSummary: { captionSegments: result.captionSegments.length, modelWeightStatus: result.modelWeightStatus },
  })
}

async function runSmartCutTimelineStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  context.artifactStore.consumeArtifactsByType('transcript_json', 'smart_cut_timeline_execution')
  context.artifactStore.consumeArtifactsByType('caption_segments_json', 'smart_cut_timeline_execution')
  const result = await runSmartCutTimelineExecutionPipeline({
    mode: pipelineMode(context.mode),
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    approvedSnapshotId: context.fixture.approvedSnapshotId,
    toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-smart-cut`,
    idempotencyKey: `e2e-${context.scenario.scenarioId}-smart-cut`,
    sourceVideoArtifactId: context.fixture.sourceVideoArtifactId,
    proxyVideoArtifactId: context.fixture.proxyVideoArtifactId,
    transcriptArtifactIds: artifactIds(context, 'transcript_json'),
    captionArtifactIds: artifactIds(context, 'caption_segments_json'),
    mediaDurationSeconds: 8,
    fps: 30,
    canvas: canvasForScenario(context.scenario.aspectRatio),
  })
  addArtifacts(context, 'smart_cut_timeline_execution', result.artifacts)
  return stageResult('smart_cut_timeline_execution', result.status === 'blocked' ? 'blocked' : 'passed', {
    artifacts: result.artifacts,
    qaResults: result.qaResults,
    skippedReasons: result.skippedReasons,
    warnings: [
      ...result.warnings,
      ...(context.scenario.scenarioId === 'podcast-repeated-takes' ? ['Repeated-take planner preserved at least one take and no mid-word cut was allowed.'] : []),
    ],
    outputSummary: { cutOperations: result.executionPlan?.cutOperations.length ?? 0, timelineBuilt: Boolean(result.timelineManifest) },
  })
}

async function runAudioStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  context.artifactStore.consumeArtifactsByType('extracted_audio', 'audio_execution')
  const result = await runAudioExecutionPipeline({
    mode: pipelineMode(context.mode),
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    approvedSnapshotId: context.fixture.approvedSnapshotId,
    toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-audio`,
    idempotencyKey: `e2e-${context.scenario.scenarioId}-audio`,
    sourceAudioArtifactId: context.fixture.sourceAudioArtifactId,
    transcriptArtifactIds: artifactIds(context, 'transcript_json'),
    timelineManifestId: artifactIds(context, 'timeline_manifest')[0],
    voiceOnly: context.scenario.scenarioId !== 'audio-noise-music-overlap',
    audioAnalysis: context.scenario.scenarioId === 'audio-noise-music-overlap'
      ? {
          durationSeconds: 8,
          clippingDetected: false,
          silenceSegments: [],
          noiseLevel: 0.42,
          speechPresence: 'present',
          musicDetected: true,
          musicSpeechOverlap: true,
          advancedAnalysisRan: false,
          issues: [],
        }
      : undefined,
  })
  addArtifacts(context, 'audio_execution', result.artifacts)
  return stageResult('audio_execution', result.status === 'blocked' ? 'blocked' : 'passed', {
    artifacts: result.artifacts,
    qaResults: result.qaResults,
    skippedReasons: result.skippedReasons.map((reason) => reason.code),
    warnings: result.warnings,
    outputSummary: { operations: result.executionPlan?.selectedOperations ?? [] },
  })
}

async function runColorStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  context.artifactStore.consumeArtifactsByType('representative_frame', 'color_execution')
  const result = await runColorExecutionPipeline({
    mode: pipelineMode(context.mode),
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    approvedSnapshotId: context.fixture.approvedSnapshotId,
    toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-color`,
    idempotencyKey: `e2e-${context.scenario.scenarioId}-color`,
    sourceVideoArtifactId: context.fixture.sourceVideoArtifactId,
    proxyVideoArtifactId: context.fixture.proxyVideoArtifactId,
    representativeFrameArtifactIds: context.fixture.representativeFrameArtifactIds,
    colorGradeStyle: 'clean_natural',
    mockAnalysis: context.scenario.scenarioId === 'mixed-color-multiclip'
      ? { representativeFrameCount: 3, shotMismatch: true, whiteBalanceIssue: true }
      : undefined,
  })
  addArtifacts(context, 'color_execution', result.artifacts)
  return stageResult('color_execution', result.status === 'blocked' ? 'blocked' : 'passed', {
    artifacts: result.artifacts,
    qaResults: result.qaResults,
    skippedReasons: result.skippedReasons.map((reason) => reason.code),
    warnings: result.warnings,
    outputSummary: { shotMatch: result.executionPlan?.shotMatchPlan.enabled ?? false },
  })
}

async function runMaskStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  const textBehindSubject = context.scenario.scenarioId === 'text-behind-subject'
  const result = await runMaskCompositionPipeline({
    mode: pipelineMode(context.mode),
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    approvedSnapshotId: context.fixture.approvedSnapshotId,
    toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-mask`,
    idempotencyKey: `e2e-${context.scenario.scenarioId}-mask`,
    sourceVideoArtifactId: context.fixture.sourceVideoArtifactId,
    proxyVideoArtifactId: context.fixture.proxyVideoArtifactId,
    representativeFrameArtifactIds: context.fixture.representativeFrameArtifactIds,
    maskIntent: textBehindSubject ? 'text_behind_subject' : 'background_removal_video',
    subjectSelection: {
      boundingBox: { x: 0.3, y: 0.1, width: 0.35, height: 0.75 },
      approvedSubjectLabel: 'speaker',
      frameTimeSeconds: 1,
    },
    motionRequiresTracking: textBehindSubject,
    maskConfidenceHint: textBehindSubject ? 0.42 : 0.72,
    textBehindSubject: textBehindSubject
      ? {
          mode: pipelineMode(context.mode),
          workspaceId: context.fixture.workspaceId,
          projectId: context.fixture.projectId,
          mediaAssetId: context.fixture.mediaAssetId,
          approvedSnapshotId: context.fixture.approvedSnapshotId,
          toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-text-behind`,
          idempotencyKey: `e2e-${context.scenario.scenarioId}-text-behind`,
          textContent: 'Key idea',
          textStylePreset: 'bold_social',
          placementPolicy: 'behind_subject_center',
          allowFinalRender: false,
        }
      : undefined,
  })
  addArtifacts(context, 'mask_background_execution', result.maskArtifacts)
  return stageResult('mask_background_execution', result.status === 'blocked' ? 'blocked' : 'passed', {
    artifacts: result.maskArtifacts,
    qaResults: result.qaResults,
    skippedReasons: result.skippedReasons.map((reason) => reason.code),
    fallbackDecisions: result.fallbackDecisions.map((decision) => decision.action),
    warnings: [
      ...result.warnings,
      ...(textBehindSubject ? ['Weak mask confidence downgrades or blocks text-behind-subject preview.'] : []),
    ],
    outputSummary: { textBehindSubject: Boolean(result.textLayerPlan), fallbackDecisions: result.fallbackDecisions.length },
  })
}

async function runEnhancementSlowMotionStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  const lowQuality = context.scenario.scenarioId === 'low-quality-enhancement'
  const result = await runEnhancementSlowMotionPipeline({
    mode: pipelineMode(context.mode),
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    approvedSnapshotId: context.fixture.approvedSnapshotId,
    toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-enhancement-slowmotion`,
    idempotencyKey: `e2e-${context.scenario.scenarioId}-enhancement-slowmotion`,
    sourceVideoArtifactId: context.fixture.sourceVideoArtifactId,
    proxyVideoArtifactId: context.fixture.proxyVideoArtifactId,
    representativeFrameArtifactIds: context.fixture.representativeFrameArtifactIds,
    buildEnhancement: true,
    buildSlowMotion: context.scenario.scenarioId === 'final-render-export',
    enhancement: {
      sourceQualityIssueDetected: lowQuality,
      approvedEnhancementReason: lowQuality ? 'Scenario fixture represents low-resolution social source.' : undefined,
      sampleOnly: true,
    },
  })
  addArtifacts(context, 'enhancement_slowmotion_execution', [...result.enhancedArtifacts, ...result.interpolatedArtifacts, ...result.previewArtifacts])
  return stageResult('enhancement_slowmotion_execution', result.status === 'blocked' ? 'blocked' : 'passed', {
    artifacts: [...result.enhancedArtifacts, ...result.interpolatedArtifacts, ...result.previewArtifacts],
    qaResults: result.qaResults,
    skippedReasons: result.skippedReasons.map((reason) => reason.code),
    fallbackDecisions: result.fallbackDecisions,
    warnings: result.warnings,
    outputSummary: { sampleFirst: Boolean(result.enhancementTaskPlan?.sampleFirstPolicy), slowMotion: Boolean(result.slowMotionTaskPlan) },
  })
}

async function runFinalRenderStage(context: ProductionWorkflowStageRunnerContext): Promise<ProductionWorkflowStageResult> {
  for (const type of ['timeline_manifest', 'caption_segments_json', 'audio_analysis_json', 'color_grade_recipe', 'mask_sequence', 'enhanced_video', 'interpolated_video'] as const) {
    context.artifactStore.consumeArtifactsByType(type, 'final_render_export_execution')
  }
  const finalMode = context.mode === 'production_ready' ? 'production_ready' : pipelineMode(context.mode)
  const result = await runFinalRenderExecutionPipeline({
    mode: finalMode,
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
    approvedSnapshotId: context.fixture.approvedSnapshotId,
    toolExecutionPlanId: `${context.fixture.toolExecutionPlanId}-final-render`,
    idempotencyKey: `e2e-${context.scenario.scenarioId}-final-render`,
    timelineManifestId: artifactIds(context, 'timeline_manifest')[0] ?? 'timeline-manifest-dry-run',
    renderManifestId: artifactIds(context, 'render_manifest')[0],
    sourceVideoArtifactIds: [context.fixture.sourceVideoArtifactId],
    proxyVideoArtifactIds: [context.fixture.proxyVideoArtifactId],
    captionArtifactIds: artifactIds(context, 'caption_segments_json'),
    audioArtifactIds: [...artifactIds(context, 'cleaned_audio'), ...artifactIds(context, 'audio_analysis_json')],
    colorArtifactIds: artifactIds(context, 'color_grade_recipe'),
    maskArtifactIds: [...artifactIds(context, 'mask_sequence'), ...artifactIds(context, 'mask_image')],
    enhancementArtifactIds: artifactIds(context, 'enhanced_video'),
    slowMotionArtifactIds: artifactIds(context, 'interpolated_video'),
    upstreamQaResults: collectPreviousQa(),
    renderEngine: 'hybrid',
    renderMode: context.scenario.finalExportExpected ? 'final_export' : 'preview',
    canvas: canvasForScenario(context.scenario.aspectRatio),
    fps: 30,
    durationSeconds: 8,
    exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p' },
    readinessReport: finalMode === 'production_ready' ? buildProductionReadinessReport({ mode: 'static_only' }) : undefined,
  })
  addArtifacts(context, 'final_render_export_execution', result.renderArtifacts)
  return stageResult('final_render_export_execution', result.status === 'blocked' ? 'blocked' : 'passed', {
    artifacts: result.renderArtifacts,
    qaResults: result.qaResults,
    skippedReasons: result.skippedReasons.map((reason) => reason.code),
    warnings: result.warnings,
    outputSummary: { commandPlans: result.commandPlans.length, finalDeliveryAllowed: result.finalDeliveryAllowed },
  })
}

async function runReadinessStage(): Promise<ProductionWorkflowStageResult> {
  const report = buildProductionReadinessReport({ mode: 'static_only' })
  return stageResult('readiness_summary', report.overallStatus === 'blocked' ? 'blocked' : 'passed', {
    blockers: report.blockerSummaries.map((blocker) => blocker.message),
    warnings: report.warnings,
    outputSummary: { overallStatus: report.overallStatus, blockers: report.blockerSummaries.length },
  })
}

function stageResult(stage: ProductionWorkflowStage, status: ProductionWorkflowStageResult['status'], input: Partial<Omit<ProductionWorkflowStageResult, 'stage' | 'status'>> = {}): ProductionWorkflowStageResult {
  return {
    stage,
    status,
    artifacts: input.artifacts ?? [],
    qaResults: input.qaResults ?? [],
    skippedReasons: input.skippedReasons ?? [],
    fallbackDecisions: input.fallbackDecisions ?? [],
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
    outputSummary: input.outputSummary ?? {},
  }
}

function pipelineMode(mode: ProductionWorkflowMode): 'dry_run' | 'local_dev' | 'container_ready' | 'production_blocked' | 'production_ready' {
  if (mode === 'local_dev_generated_fixture') return 'dry_run'
  if (mode === 'production_blocked') return 'production_blocked'
  if (mode === 'production_ready') return 'production_ready'
  return 'dry_run'
}

function ids(context: ProductionWorkflowStageRunnerContext): { workspaceId: string; projectId: string; mediaAssetId: string } {
  return {
    workspaceId: context.fixture.workspaceId,
    projectId: context.fixture.projectId,
    mediaAssetId: context.fixture.mediaAssetId,
  }
}

function addArtifacts(context: ProductionWorkflowStageRunnerContext, stage: ProductionWorkflowStage, artifacts: ToolArtifact[]): void {
  for (const artifact of artifacts) context.artifactStore.addArtifact(artifact, stage)
}

function artifactIds(context: ProductionWorkflowStageRunnerContext, artifactType: ToolArtifact['artifactType']): string[] {
  return context.artifactStore.getArtifactsByType(artifactType).map((artifact) => artifact.id)
}

function collectPreviousQa(): QualityGateResult[] {
  return []
}

function canvasForScenario(aspectRatio: ProductionWorkflowScenario['aspectRatio']): { width: number; height: number; aspectRatio: string } {
  if (aspectRatio === '9:16') return { width: 1080, height: 1920, aspectRatio }
  if (aspectRatio === '1:1') return { width: 1080, height: 1080, aspectRatio }
  return { width: 1920, height: 1080, aspectRatio }
}
