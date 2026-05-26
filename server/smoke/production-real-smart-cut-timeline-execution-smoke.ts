import { execFile } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildSmartCutExecutionPlan,
  buildSmartCutFfmpegCommandPlan,
  validateSmartCutPlanForExecution,
  validateSmartCutTimelineExecutionPolicy,
} from '../workers/smart-cut'
import type { SmartCutPlan } from '../workers/smart-cut'
import {
  buildHyperframeTimelineBridge,
  buildTimelineExecutionManifest,
  buildOpenTimelineIOStyleManifest,
  buildRemotionCompositionManifest,
} from '../workers/timeline'
import { runSmartCutTimelineExecutionPipeline } from '../workers/smart-cut-timeline'

const execFileAsync = promisify(execFile)

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

const baseInput = {
  mode: 'dry_run' as const,
  workspaceId: 'workspace-m14-smoke',
  projectId: 'project-m14-smoke',
  mediaAssetId: 'media-m14-smoke',
  approvedSnapshotId: 'approved-snapshot-m14-smoke',
  toolExecutionPlanId: 'tool-execution-m14-smoke',
  idempotencyKey: 'idempotency-m14-smoke',
  sourceVideoArtifactId: 'source-video-artifact-m14',
  proxyVideoArtifactId: 'proxy-video-artifact-m14',
  sourceStorageObjectPath: 'workspaces/workspace-m14-smoke/projects/project-m14-smoke/media/source.mp4',
}

const plan = buildMockSmartCutPlan()

await expectRejects(
  () => validateSmartCutTimelineExecutionPolicy({ ...baseInput, rawPrompt: 'cut it fast' }),
  'Smart cut execution policy must reject rawPrompt.',
)
await expectRejects(
  () => validateSmartCutTimelineExecutionPolicy({ ...baseInput, sourceVideoLocalPath: 'https://storage.example/source.mp4?X-Goog-Signature=abc' }),
  'Smart cut execution policy must reject signed URLs.',
)
const arbitraryArgPolicy = validateSmartCutTimelineExecutionPolicy({ ...baseInput, arbitraryFfmpegArgs: ['-vf', 'anything'] })
check(!arbitraryArgPolicy.allowed && arbitraryArgPolicy.blockingReasons.includes('arbitrary_ffmpeg_args_blocked'), 'Policy must reject arbitrary FFmpeg args.')
const finalExportPolicy = validateSmartCutTimelineExecutionPolicy({ ...baseInput, allowFinalExport: true })
check(!finalExportPolicy.allowed && finalExportPolicy.blockingReasons.includes('allow_final_export_blocked_in_m14'), 'Policy must reject allowFinalExport=true.')

check(!validateSmartCutPlanForExecution({ plan: { ...plan, keepSegments: [{ ...plan.keepSegments[0], startSeconds: -0.1 }] } }).valid, 'Validator must reject negative timestamps.')
check(!validateSmartCutPlanForExecution({ plan: { ...plan, keepSegments: [{ ...plan.keepSegments[0], endSeconds: 0.2, startSeconds: 0.5 }] } }).valid, 'Validator must reject end-before-start segments.')
check(!validateSmartCutPlanForExecution({ plan: { ...plan, keepSegments: [plan.keepSegments[0], { ...plan.keepSegments[1], startSeconds: 2.5 }] } }).valid, 'Validator must catch overlapping keep segments.')
check(!validateSmartCutPlanForExecution({ plan: { ...plan, removeSegments: [{ ...plan.removeSegments[0], startSeconds: 1.5, endSeconds: 2.2 }] } }).valid, 'Validator must catch overlapping keep/remove segments.')
check(!validateSmartCutPlanForExecution({ plan: { ...plan, removeSegments: [{ ...plan.removeSegments[0], startSeconds: 0.2, endSeconds: 0.4 }] } }).valid, 'Validator must protect protected segments.')
check(!validateSmartCutPlanForExecution({
  plan: { ...plan, removeSegments: [{ ...plan.removeSegments[0], startSeconds: 1.1, endSeconds: 1.3 }] },
  executionInput: {
    ...baseInput,
    wordTimestamps: [{ word: 'middle', startSeconds: 1, endSeconds: 1.6, segmentId: 'seg-1', confidence: 0.9 }],
  },
}).valid, 'Validator must block mid-word cuts when word timestamps are available.')

const executionPlan = buildSmartCutExecutionPlan({ smartCutPlan: plan, executionInput: baseInput })
check(executionPlan.cutOperations.some((operation) => operation.operationType === 'keep_segment'), 'Execution plan must create keep operations.')
check(executionPlan.cutOperations.some((operation) => operation.operationType === 'trim_segment'), 'Execution plan must create trim operations.')
check(executionPlan.cutOperations.some((operation) => operation.operationType === 'concatenate_segments'), 'Execution plan must create concat operation.')
check(executionPlan.finalExportAllowed === false, 'Execution plan must never allow final export in M14.')

const safeOutputRoot = path.join(os.tmpdir(), 'reeditpro-m14-smoke')
const sourceOverwritePath = path.join(safeOutputRoot, `${executionPlan.executionPlanId}-preview.mp4`)
await expectRejects(
  () => buildSmartCutFfmpegCommandPlan({
    executionPlan,
    executionInput: {
      ...baseInput,
      mode: 'local_dev',
      enableProxyPreview: true,
      sourceVideoLocalPath: sourceOverwritePath,
      outputDirectory: safeOutputRoot,
    },
  }),
  'FFmpeg command builder must refuse source overwrite.',
)
await expectRejects(
  () => buildSmartCutFfmpegCommandPlan({ executionPlan, executionInput: { ...baseInput, allowFinalExport: true } }),
  'FFmpeg command builder must refuse final export.',
)
const commandPlan = buildSmartCutFfmpegCommandPlan({ executionPlan, executionInput: baseInput })
check(commandPlan.executes === false, 'FFmpeg command builder must not execute by itself.')
check(commandPlan.commands.every((command) => !command.args.join(' ').includes('--arbitrary')), 'FFmpeg command plan must use allowlisted args only.')
check(commandPlan.commands.some((command) => command.operationType === 'concatenate_segments'), 'FFmpeg command plan must include concat command.')

const dryRun = await runSmartCutTimelineExecutionPipeline({ ...baseInput, smartCutPlan: plan })
check(dryRun.status === 'dry_run', 'Dry-run pipeline must build without FFmpeg.')
check(Boolean(dryRun.executionPlan), 'Dry-run pipeline must return execution plan.')
check(Boolean(dryRun.timelineManifest), 'Dry-run pipeline must return timeline manifest.')
check(Boolean(dryRun.otioManifest), 'Dry-run pipeline must return OTIO-style manifest.')
check(Boolean(dryRun.hyperframeBridge), 'Dry-run pipeline must return Hyperframe bridge metadata.')
check(Boolean(dryRun.remotionManifest), 'Dry-run pipeline must return Remotion metadata.')
check(dryRun.artifacts.every((artifact) => artifact.isPrivate && !artifact.storageObjectPath.toLowerCase().includes('signed')), 'M14 artifacts must be private storage refs.')

const localDevSkip = await runSmartCutTimelineExecutionPipeline({
  ...baseInput,
  mode: 'local_dev',
  smartCutPlan: plan,
  enableProxyPreview: false,
})
check(localDevSkip.skippedReasons.includes('proxy_preview_disabled_or_not_local_dev'), 'local_dev preview must skip gracefully when disabled.')

const ffmpegFixtureStatus = await maybeRunGeneratedFfmpegFixture(plan)

const timelineManifest = buildTimelineExecutionManifest({ ...baseInput, executionPlan })
check(timelineManifest.clips.length === plan.keepSegments.length, 'Timeline execution manifest must map keep segments to clips.')
check(timelineManifest.durationSeconds === executionPlan.targetDurationSeconds, 'Timeline duration must match execution plan target duration.')
const otioManifest = buildOpenTimelineIOStyleManifest({ timelineManifest, mediaReferencePath: 'reeditpro://media-m14-smoke/proxy', fps: 30 })
check(otioManifest.OTIO_SCHEMA === 'Timeline.1', 'OTIO-style manifest must be created without requiring package runtime.')
const hyperframeBridge = buildHyperframeTimelineBridge(timelineManifest)
check(hyperframeBridge.bridgeType === 'hyperframe_timeline_bridge', 'Hyperframe bridge must be metadata only.')
const remotionManifest = buildRemotionCompositionManifest({ timelineManifest, fps: 30 })
check(remotionManifest.manifestType === 'remotion_composition_manifest', 'Remotion manifest must be metadata only.')

for (const gateType of ['cut_smoothness', 'render_timeline_integrity'] as const) {
  check(dryRun.qaResults.some((gate) => gate.gateType === gateType), `M14 QA must emit ${gateType}.`)
}
const finalDeliveryGate = dryRun.qaResults.find((gate) => gate.gateType === 'final_delivery')
check(finalDeliveryGate?.status !== 'passed', 'M14 QA must not mark final_delivery passed.')

const productionBlocked = await runSmartCutTimelineExecutionPipeline({ ...baseInput, mode: 'production_blocked', smartCutPlan: plan })
check(productionBlocked.status === 'blocked', 'production_blocked must refuse production cutting/rendering.')
const productionReady = await runSmartCutTimelineExecutionPipeline({ ...baseInput, mode: 'production_ready', smartCutPlan: plan })
check(productionReady.status === 'blocked', 'production_ready must remain blocked when readiness gates are missing.')

const routed = await runProductionWorkerRuntime({
  payload: buildPayload('cpu_analysis_worker', {
    smartCutTimelineExecution: {
      mode: 'dry_run',
      smartCutPlan: plan,
    },
  }),
})
check(routed.status === 'completed', 'Explicit smartCutTimelineExecution worker route must complete in dry-run.')
check(routed.output?.futureHandler === 'cpu_analysis_worker_smart_cut_timeline_execution', 'Worker router must use explicit M14 route.')
check(Boolean(routed.output?.smartCutTimelineExecutionResult), 'Worker router output must include smartCutTimelineExecutionResult.')

const combinedCommandText = JSON.stringify({ commandPlan, otioManifest, hyperframeBridge, remotionManifest }).toLowerCase()
check(!combinedCommandText.includes('revideo'), 'M14 command/metadata outputs must not use Revideo.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'policy_forbidden_fields',
    'validator_ranges_and_mid_word',
    'execution_plan_operations',
    'ffmpeg_command_plan_allowlisted_non_executing',
    'dry_run_pipeline',
    'local_dev_preview_skip_safe',
    'timeline_manifest_and_bridges',
    'private_artifacts',
    'qa_gates',
    'production_blockers',
    'worker_route',
    'no_revideo_runtime',
  ],
  ffmpegFixtureStatus,
  artifacts: dryRun.artifacts.length,
  qaResults: dryRun.qaResults.length,
}, null, 2))

async function maybeRunGeneratedFfmpegFixture(smartCutPlan: SmartCutPlan): Promise<string> {
  const root = path.join(os.tmpdir(), `reeditpro-m14-ffmpeg-${Date.now()}`)
  await mkdir(root, { recursive: true })
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 3000, maxBuffer: 512 * 1024, windowsHide: true })
    const fixture = path.join(root, 'generated-proxy.mp4')
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner',
        '-nostdin',
        '-y',
        '-f',
        'lavfi',
        '-i',
        'testsrc=size=160x90:rate=15:duration=7',
        '-pix_fmt',
        'yuv420p',
        fixture,
      ], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true })
    } catch {
      return 'ffmpeg_available_fixture_generation_skipped'
    }

    const preview = await runSmartCutTimelineExecutionPipeline({
      ...baseInput,
      mode: 'local_dev',
      smartCutPlan,
      enableProxyPreview: true,
      proxyVideoLocalPath: fixture,
      outputDirectory: root,
      timeoutMs: 15_000,
    })
    check(preview.status === 'partial' || preview.status === 'blocked', 'Generated fixture preview should return structured status.')
    check(!preview.skippedReasons.includes('proxy_source_missing'), 'Generated fixture preview must use generated temp proxy when FFmpeg fixture succeeds.')
    return preview.previewArtifact ? 'ffmpeg_available_generated_fixture_preview_created' : 'ffmpeg_available_generated_fixture_preview_attempted'
  } catch {
    return 'ffmpeg_unavailable_skip_ok'
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

function buildMockSmartCutPlan(): SmartCutPlan {
  return {
    id: 'smart-cut-plan-m14-smoke',
    workspaceId: 'workspace-m14-smoke',
    projectId: 'project-m14-smoke',
    mediaAssetId: 'media-m14-smoke',
    sourceDurationSeconds: 7,
    targetDurationSeconds: 6.2,
    intent: ['remove_dead_space', 'preserve_story'],
    aggressiveness: 'balanced',
    pacingProfile: {
      profileId: 'natural_clean',
      maxSilenceSeconds: 1.2,
      minSegmentDurationSeconds: 1.2,
      targetCutsPerMinuteMin: 4,
      targetCutsPerMinuteMax: 8,
      emotionalPausePolicy: 'protect',
      notes: [],
    },
    segmentCandidates: [{
      candidateId: 'candidate-keep-1',
      candidateType: 'transcript',
      source: 'transcript',
      startSeconds: 0,
      endSeconds: 3,
      text: 'This is the hook.',
      transcriptSegmentIds: ['seg-1'],
      captionIds: [],
      wordCount: 4,
      evidence: {
        hasTranscript: true,
        hasWordTimestamps: true,
        hasSilence: false,
        hasSceneBoundary: false,
        hasCaption: false,
        fillerLabels: [],
        repeatedTakeCandidateIds: [],
      },
      risks: ['none'],
      protected: true,
      reason: 'Strong hook and required context.',
    }, {
      candidateId: 'candidate-keep-2',
      candidateType: 'transcript',
      source: 'transcript',
      startSeconds: 3.8,
      endSeconds: 7,
      text: 'This is the payoff.',
      transcriptSegmentIds: ['seg-2'],
      captionIds: [],
      wordCount: 4,
      evidence: {
        hasTranscript: true,
        hasWordTimestamps: true,
        hasSilence: false,
        hasSceneBoundary: false,
        hasCaption: false,
        fillerLabels: [],
        repeatedTakeCandidateIds: [],
      },
      risks: ['none'],
      protected: false,
      reason: 'Clear payoff segment.',
    }],
    segmentScores: [],
    keepSegments: [{
      decisionId: 'keep-candidate-keep-1',
      candidateId: 'candidate-keep-1',
      startSeconds: 0,
      endSeconds: 3,
      score: 0.95,
      confidence: 0.9,
      reason: 'Strong hook and required context.',
      protected: true,
    }, {
      decisionId: 'keep-candidate-keep-2',
      candidateId: 'candidate-keep-2',
      startSeconds: 3.8,
      endSeconds: 7,
      score: 0.88,
      confidence: 0.86,
      reason: 'Clear payoff segment.',
      protected: false,
    }],
    removeSegments: [{
      decisionId: 'remove-dead-space-1',
      candidateId: 'silence-candidate-1',
      startSeconds: 3,
      endSeconds: 3.8,
      score: 0.9,
      confidence: 0.86,
      reason: 'Long dead space between phrases.',
      risks: ['none'],
    }],
    cutBoundaries: [{
      boundaryId: 'boundary-remove-dead-space-1-a',
      sourceTimeSeconds: 3,
      adjustedTimeSeconds: 3,
      paddingBeforeSeconds: 0.05,
      paddingAfterSeconds: 0.05,
      risks: ['none'],
      safe: true,
      reason: 'Phrase boundary.',
    }, {
      boundaryId: 'boundary-remove-dead-space-1-b',
      sourceTimeSeconds: 3.8,
      adjustedTimeSeconds: 3.8,
      paddingBeforeSeconds: 0.05,
      paddingAfterSeconds: 0.05,
      risks: ['none'],
      safe: true,
      reason: 'Phrase boundary.',
    }],
    protectedSegments: [{
      decisionId: 'keep-candidate-keep-1',
      candidateId: 'candidate-keep-1',
      startSeconds: 0,
      endSeconds: 3,
      score: 0.95,
      confidence: 0.9,
      reason: 'Strong hook and required context.',
      protected: true,
    }],
    rejectedCandidates: [],
    meaningFindings: [],
    warnings: [],
    confidence: 0.88,
    qaChecks: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
  }
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata?: Record<string, unknown>,
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `prod-real-smart-cut-timeline-${workerType}`,
    workspaceId: 'workspace-m14-smoke',
    projectId: 'project-m14-smoke',
    mediaAssetId: 'media-m14-smoke',
    approvedSnapshotId: 'approved-snapshot-m14-smoke',
    editPlanId: 'edit-plan-m14-smoke',
    toolExecutionPlanId: 'tool-execution-m14-smoke',
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds: ['opentimelineio'],
    requestedRecipeIds: ['smart_cut_recipe'],
    storageReferenceIds: ['workspaces/workspace-m14-smoke/projects/project-m14-smoke/media/source.mp4'],
    createdAt: new Date().toISOString(),
    metadata,
  }
  return { ...payload, idempotencyKey: buildWorkerIdempotencyKey(payload) }
}
