import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import type { RenderManifest } from '../../src/backend/contracts/render-manifest-contracts'
import type { TimelineManifest } from '../../src/backend/contracts/timeline-manifest-contracts'
import type { AutonomousEditPlanDraft } from '../../src/types'
import { runFinalRenderExecutionPipeline } from '../workers/final-render'
import { renderApprovedGraphicsMotionOverlays } from '../workers/graphics-motion'
import { buildWorkerIdempotencyKey, type ProductionWorkerJobPayload } from '../workers/production'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-autonomous-graphics-motion-'))
const sourcePath = path.join(root, 'source.mp4')
const outputDirectory = path.join(root, 'private-review')

try {
  execFileSync(process.env.FFMPEG_BIN?.trim() || 'ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi',
    '-i', 'color=c=0x27324a:s=320x568:r=30:d=3',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', sourcePath,
  ], { stdio: 'pipe' })

  const plan = buildPlan()
  const timelineManifest = buildTimelineManifest()
  const captionSpec = plan.segments[0]?.operations.find((operation) => operation.executionSpec?.kind === 'caption')?.executionSpec
  assert.equal(captionSpec?.kind, 'caption')
  const overlays = await renderApprovedGraphicsMotionOverlays({
    plan,
    timelineManifest,
    captionSegments: [{
      captionId: 'caption-1', startSeconds: 0.2, endSeconds: 2.7,
      text: 'Make every visual decision earn its place.', lines: ['Make every visual decision', 'earn its place.'],
      words: [
        word('Make', 0.2, 0.48), word('every', 0.48, 0.78), word('visual', 0.78, 1.12),
        word('decision', 1.12, 1.55), word('earn', 1.62, 1.9), word('its', 1.9, 2.05), word('place.', 2.05, 2.45),
      ],
      styleHints: { presetId: 'keyword_emphasis_captions', placement: 'bottom_safe', emphasisWords: ['visual'] },
    }],
    outputDirectory,
    canvas: { width: 540, height: 960 },
    captionSpec,
  })
  assert.equal(overlays.status, 'completed', JSON.stringify(overlays.qaFindings))
  assert.equal(overlays.overlays.some((overlay) => overlay.overlayKind === 'graphic'), true)
  assert.equal(overlays.overlays.some((overlay) => overlay.overlayKind === 'caption'), true)
  assert.equal(overlays.qaFindings.some((finding) => finding.status === 'failed'), false)
  for (const overlay of overlays.overlays) {
    assert.equal(existsSync(overlay.localPath), true)
    assert.ok((await stat(overlay.localPath)).size > 700, `${overlay.overlayId} should contain rendered pixels.`)
  }

  const approvedSnapshotId = 'snapshot-graphics-motion-smoke'
  const creditReservationId = 'reservation-graphics-motion-smoke'
  const toolExecutionPlanId = 'tool-plan-graphics-motion-smoke'
  const workerPayload: ProductionWorkerJobPayload = {
    jobId: 'job-graphics-motion-smoke', workspaceId: plan.workspaceId, projectId: plan.projectId,
    mediaAssetId: 'media-graphics-motion-smoke', approvedSnapshotId, editPlanId: plan.planId,
    toolExecutionPlanId, workerType: 'render_worker', executionMode: 'mock_safe', idempotencyKey: 'pending',
    attempt: 1, maxAttempts: 1, requestedToolIds: ['ffmpeg'], requestedRecipeIds: ['motion_graphics_recipe', 'final_export_recipe'],
    storageReferenceIds: ['source-graphics-motion-smoke'], creditReservationId, renderMode: 'final_export',
    requiredQualityGateTypes: ['render_asset_integrity'], createdAt: new Date().toISOString(),
    metadata: { privateArtifactsOnly: true, approvedAutonomousPlan: true, publicDeliveryAllowed: false },
  }
  workerPayload.idempotencyKey = buildWorkerIdempotencyKey(workerPayload)
  const upstreamGate = passedGate(toolExecutionPlanId)
  const renderManifest = buildRenderManifest(timelineManifest, approvedSnapshotId, upstreamGate)
  const result = await runFinalRenderExecutionPipeline({
    mode: 'local_dev', workspaceId: plan.workspaceId, projectId: plan.projectId,
    mediaAssetId: 'media-graphics-motion-smoke', approvedSnapshotId, creditReservationId,
    toolExecutionPlanId, idempotencyKey: workerPayload.idempotencyKey, workerPayload,
    timelineManifestId: timelineManifest.id, timelineManifest, renderManifestId: renderManifest.id, renderManifest,
    sourceVideoArtifactIds: ['source-graphics-motion-smoke'], qaGateResultIds: [upstreamGate.id],
    upstreamQaResults: [upstreamGate], requiredUpstreamQaGateTypes: ['render_asset_integrity'],
    sourceLocalPaths: [sourcePath], visualOverlayInputs: overlays.overlays,
    outputDirectory, outputFileName: 'autonomous-graphics-motion-review.mp4',
    renderEngine: 'ffmpeg', renderMode: 'final_export', canvas: renderManifest.canvas,
    fps: 30, durationSeconds: timelineManifest.durationSeconds, exportSettings: renderManifest.exportSettings,
    enableLocalDevRender: true, enableRemotionLocalRender: false, enableCaptionBurnIn: false,
    enableVisualOverlays: true, sourceAudioRequired: false, ffmpegBin: process.env.FFMPEG_BIN ?? 'ffmpeg',
    ffprobeBin: process.env.FFPROBE_BIN ?? 'ffprobe',
    localDevRenderProfile: { visualFinish: 'clean_natural', audioFinish: 'none', subtlePunchIns: false },
    timeoutMs: 120_000,
  })
  assert.equal(result.status, 'completed', result.warnings.join(' '))
  assert.equal(result.finalDeliveryAllowed, true)
  assert.equal(result.outputProbe?.width, 540)
  assert.equal(result.outputProbe?.height, 960)
  assert.ok(result.outputLocalPath && existsSync(result.outputLocalPath))
  assert.ok(result.commandPlans.some((command) => command.args.join(' ').includes('overlay=')))
  assert.ok(result.commandPlans.some((command) => command.args.join(' ').includes('fade=t=in')))

  console.log(JSON.stringify({
    ok: true,
    decision: 'autonomous_graphics_motion_private_render_passed',
    overlayCount: overlays.overlays.length,
    graphicOverlayCount: overlays.overlays.filter((overlay) => overlay.overlayKind === 'graphic').length,
    captionOverlayCount: overlays.overlays.filter((overlay) => overlay.overlayKind === 'caption').length,
    outputPath: result.outputLocalPath,
    outputProbe: result.outputProbe,
    privateInternalReviewOnly: true,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function buildPlan(): AutonomousEditPlanDraft {
  return {
    version: 'autonomous-edit-plan-v1', planId: 'plan-graphics-motion-smoke',
    workspaceId: 'workspace-graphics-motion-smoke', projectId: 'project-graphics-motion-smoke', editSessionId: 'edit-graphics-motion-smoke',
    status: 'ready_for_approval', title: 'Source-backed motion review', summary: 'A restrained source-backed motion review.',
    userIntentSummary: 'Use clear viral-style captions and one motivated supporting card.',
    storyStrategy: 'Open on the source, support the central idea, and resolve cleanly.',
    sourceOrderPolicy: 'preserve_unless_evidence_supports_change',
    outputFrame: { aspectRatio: '9:16', platformTarget: 'instagram_reel', width: 540, height: 960, confirmed: true },
    segments: [{
      id: 'segment-all', role: 'main_body', sourceStartSeconds: 0, sourceEndSeconds: 3,
      objective: 'Support the single source-backed idea.', narrativeReason: 'The complete fixture represents one visual beat.',
      transcriptEvidence: ['transcript-1'], visualEvidence: ['visual-report'],
      operations: [{
        operationId: 'caption.style', instruction: 'Use bold phrase captions with active-word emphasis.',
        rationale: 'The requested social treatment needs readable emphasis without a large caption card.',
        skillKeys: ['caption_design', 'caption_keyword_emphasis'], sourceEvidenceRefs: ['transcript-1', 'visual-report'],
        requiredQaChecks: ['caption_readability', 'caption_safe_zone'],
        executionSpec: {
          kind: 'caption', placement: 'bottom_safe', typography: 'clean_bold', textCase: 'sentence',
          emphasis: 'keyword_color_and_scale', animation: 'word_pop', accentColor: '#ffd84d',
          maxWordsPerCue: 7, maxLines: 2, emphasisTerms: ['visual', 'decision'],
        },
      }, {
        operationId: 'graphics.compose', instruction: 'Show one supporting source-backed evidence card.',
        rationale: 'The central claim benefits from one concise visual reinforcement.',
        skillKeys: ['framework_diagram_design'], sourceEvidenceRefs: ['transcript-1', 'visual-report'],
        requiredQaChecks: ['graphic_readability', 'source_truth'],
        executionSpec: {
          kind: 'graphic', graphicId: 'evidence-card', graphicType: 'evidence_card', title: 'Every visual earns its place',
          bodyLines: ['Source-backed', 'Timed to meaning'], sourceLabel: 'Approved edit direction',
          placement: 'top_right', visualStyle: 'clean_panel', accentColor: '#62e6ff',
          startOffsetSeconds: 0.35, endOffsetSeconds: 2.55,
          motion: { enter: 'fade_up', exit: 'fade_down', enterDurationSeconds: 0.24, exitDurationSeconds: 0.2 },
          contentEvidenceRefs: ['transcript-1', 'visual-report'],
        },
      }],
      captionDirection: 'Bold white phrase captions with a warm active-word accent and no oversized background card.',
      visualDirection: 'One compact card in verified upper-right negative space.', audioDirection: 'Preserve silence.',
      transitionDirection: 'Use only restrained overlay entrance and exit motion.',
      requiredQaChecks: ['caption_readability', 'graphic_readability', 'source_truth'],
    }],
    skillSelections: [{ skillKey: 'caption_keyword_emphasis', reason: 'Readable active-word emphasis was requested.', required: true, segmentIds: ['segment-all'], operationIds: ['caption.style'] },
      { skillKey: 'framework_diagram_design', reason: 'One evidence card supports the central idea.', required: true, segmentIds: ['segment-all'], operationIds: ['graphics.compose'] }],
    globalQaChecks: ['source_truth', 'caption_readability', 'graphic_readability'], clarificationQuestions: [], blockers: [],
    sourceEvidence: {
      evidenceVersion: 'autonomous-edit-source-evidence-v1', sourceStorageObjectRecordId: 'source-graphics-motion-smoke',
      probe: { durationSeconds: 3, width: 320, height: 568, frameRate: 30, videoStreamCount: 1, audioStreamCount: 0 },
      transcript: { status: 'not_required', segmentCount: 0, wordCount: 0 },
      audio: { status: 'not_required', clippingDetected: false, noiseCondition: 'not_measured', silenceRanges: [], analysisMethods: [], blockers: [] },
      visualRhythm: { status: 'completed', detectedCutTimesSeconds: [], detectedCutCount: 0, averageShotDurationSeconds: 3, pacingClass: 'quick', threshold: 0.32, analysisMethods: ['ffmpeg_scene_change_measurement'], blockers: [] },
      color: { status: 'completed', sampledFrameCount: 2, averageLuma: 118, exposureCondition: 'balanced', contrastCondition: 'balanced', analysisMethods: ['ffmpeg_signalstats_measurement'], blockers: [] },
      visualUnderstanding: { status: 'completed', sampledFrameCount: 2, summary: 'Stable source with upper-right negative space.', visibleSubjects: ['center subject'], visibleObjects: [], screenTextRegions: [], compositionRisks: [], brollOpportunities: [], captionObservations: [], styleObservations: ['clean source frame'], frameEvidence: [], evidenceArtifactIds: ['visual-report'] },
      privateArtifactIds: ['visual-report'], blockers: [],
    },
    runtime: { plannerSource: 'qwen_live', providerCallMade: true, qwenCallMade: true, mediaAnalysisRun: true, transcriptionRun: false, visualUnderstandingRun: true, deterministicCreativeFallbackUsed: false, rawPromptStored: false, workerExecutionStarted: false, renderStarted: false, creditReservedOrSpent: false },
    approvalRequired: true, approved: false, createdAt: new Date().toISOString(), warnings: [],
  }
}

function buildTimelineManifest(): TimelineManifest {
  return {
    id: 'timeline-graphics-motion-smoke', workspaceId: 'workspace-graphics-motion-smoke', projectId: 'project-graphics-motion-smoke',
    editPlanId: 'plan-graphics-motion-smoke', approvedSnapshotId: 'snapshot-graphics-motion-smoke', mediaAssetId: 'media-graphics-motion-smoke',
    version: 'timeline-manifest-v1', timelineFormat: 'reeditpro_timeline', durationSeconds: 3,
    clips: [{ id: 'clip-1', sourceMediaAssetId: 'media-graphics-motion-smoke', sourceRange: { startSeconds: 0, endSeconds: 3 }, timelineRange: { startSeconds: 0, endSeconds: 3 }, trackId: 'video-1', metadata: {} }],
    audioLayers: [], captionLayers: [], overlayLayers: [], maskLayers: [], colorOperations: [],
    renderNotes: ['Private source-backed overlay smoke.'], sourceReferences: [{ storageBucketPurpose: 'source_media', storageObjectPath: 'private/source.mp4', sourceOfTruth: true }],
    createdAt: new Date().toISOString(),
  }
}

function buildRenderManifest(timeline: TimelineManifest, approvedSnapshotId: string, gate: QualityGateResult): RenderManifest {
  const now = new Date().toISOString()
  return {
    id: 'render-graphics-motion-smoke', workspaceId: timeline.workspaceId, projectId: timeline.projectId,
    editPlanId: timeline.editPlanId, approvedSnapshotId, timelineManifestId: timeline.id,
    renderEngine: 'ffmpeg', renderMode: 'final_export', canvas: { width: 540, height: 960, aspectRatio: '9:16', backgroundColor: '#000000' },
    fps: 30, durationSeconds: 3, layers: [], assets: timeline.sourceReferences, captions: [],
    audio: { sourceArtifactIds: [], mixSettings: { noAudio: true } }, color: { operations: [], outputColorSpace: 'bt709' },
    exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', crf: 22, pixelFormat: 'yuv420p' },
    requiredQualityGateIds: [gate.id], status: 'ready', createdAt: now, updatedAt: now,
  }
}

function passedGate(toolExecutionPlanId: string): QualityGateResult {
  return {
    id: 'gate-graphics-motion-integrity', workspaceId: 'workspace-graphics-motion-smoke', projectId: 'project-graphics-motion-smoke',
    mediaAssetId: 'media-graphics-motion-smoke', toolExecutionPlanId, recipeId: 'motion_graphics_recipe',
    gateType: 'render_asset_integrity', status: 'passed', score: 1, threshold: 0.9, required: true,
    blocking: false, checkedAt: new Date().toISOString(), checkedByWorkerType: 'qa_worker', inputArtifactIds: [], outputArtifactIds: [],
    issues: [], recommendations: [], fallbackRequired: false, blocksPreview: false, blocksFinalExport: false, humanReviewRequired: false,
  }
}

function word(value: string, startSeconds: number, endSeconds: number) {
  return { word: value, startSeconds, endSeconds, segmentId: 'transcript-1', confidence: 0.99 }
}
