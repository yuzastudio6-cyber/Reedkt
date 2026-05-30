import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildRealVideoSam2CommandPlans,
  buildRealVideoSam2IamPlan,
  buildRealVideoSam2PromptPlan,
  buildRealVideoSam2SegmentPlan,
  buildRealVideoSam2TemporalMaskReport,
  realVideoSam2TemporalMaskConfig,
  validateRealVideoSam2TemporalMaskExecutionEnv,
} from '../activation/real-video-sam2-temporal-mask'
import type { RealVideoSam2TemporalMaskExecutionReport } from '../activation/real-video-sam2-temporal-mask'

const sampleExecution: RealVideoSam2TemporalMaskExecutionReport = {
  ok: true,
  runId: 'phase35d-smoke',
  projectId: 'reeditpro',
  jobName: realVideoSam2TemporalMaskConfig.runtimeJobName,
  image: {
    image: realVideoSam2TemporalMaskConfig.runtimeTargetImage,
    digest: 'sha256:' + 'b'.repeat(64),
  },
  source: {
    inputVideoGcsUri: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,
    anchorFrameGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri,
    anchorMaskGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri,
    anchorCutoutGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri,
    sourceDurationSeconds: 15.467,
  },
  segment: {
    startSeconds: 6.9,
    endSeconds: 8.9,
    durationSeconds: 2,
    frameCount: 10,
    width: 768,
    height: 432,
    fps: 5,
    frameUris: Array.from({ length: 10 }, (_, index) => `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-smoke/segment/frames/frame-${String(index + 1).padStart(3, '0')}.png`),
    manifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-smoke/segment/segment-manifest.json',
  },
  prompt: {
    source: 'phase33d_mask_bbox',
    type: 'box',
    promptFrameIndex: 4,
    anchorMaskDimensions: { width: 2160, height: 3840 },
    frameDimensions: { width: 768, height: 432 },
    sourceBoundingBox: [824, 1664, 1336, 2176],
    scaledBoundingBox: [293, 187, 475, 245],
    metadataUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-smoke/prompt/prompt-metadata.json',
  },
  gpu: {
    requested: true,
    type: 'nvidia-l4',
    count: 1,
    cudaAvailable: true,
    deviceName: 'NVIDIA L4',
  },
  model: {
    family: 'SAM2 / Segment Anything Model 2',
    modelId: 'sam2.1_hiera_tiny',
    checkpointFileName: 'sam2.1_hiera_tiny.pt',
    configFileName: 'sam2.1_hiera_t.yaml',
    gcsPath: realVideoSam2TemporalMaskConfig.modelGcsPath,
    runtimePath: realVideoSam2TemporalMaskConfig.modelRuntimePath,
    checkpointSha256: realVideoSam2TemporalMaskConfig.checkpointSha256,
    configSha256: realVideoSam2TemporalMaskConfig.configSha256,
    aggregateSha256: realVideoSam2TemporalMaskConfig.aggregateSha256,
    copiedFiles: ['sam2.1_hiera_tiny.pt', 'sam2.1_hiera_t.yaml', 'file_checksums_sha256.txt', 'model_tree_manifest.json', 'source_evidence.json'],
  },
  masks: {
    status: 'completed',
    frameCount: 10,
    maskUris: Array.from({ length: 10 }, (_, index) => `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-smoke/masks/frame-${String(index).padStart(3, '0')}-mask.png`),
    overlayUris: Array.from({ length: 10 }, (_, index) => `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-smoke/overlays/frame-${String(index).padStart(3, '0')}-overlay.png`),
    perFrame: Array.from({ length: 10 }, (_, index) => ({
      frameIndex: index,
      nonZeroRatio: 0.2,
      centroidX: 300 + index * 8,
      centroidY: 220,
    })),
    metadataUri: 'gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-smoke/metadata/mask-sequence-metadata.json',
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'source_integrity', status: 'passed', summary: 'Approved source only.' },
      { gateId: 'segment_bounds', status: 'passed', summary: 'Bounded segment.' },
      { gateId: 'model_artifacts', status: 'passed', summary: 'Checksums verified.' },
      { gateId: 'prompt_integrity', status: 'passed', summary: 'Prompt derived from Phase 33D mask.' },
      { gateId: 'runtime_integrity', status: 'passed', summary: 'CUDA/L4 confirmed.' },
      { gateId: 'mask_artifacts', status: 'passed', summary: 'Masks exist.' },
      { gateId: 'temporal_consistency', status: 'warning', summary: 'Human review remains required.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Private prefixes only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'Blocked features remained blocked.' },
    ],
    blockers: [],
    warnings: ['Human visual review remains required.'],
  },
  artifacts: [],
  safety: {
    approvedPhase32VideoOnly: true,
    approvedPhase33DAnchorOnly: true,
    arbitraryRealUserMediaUsed: false,
    fullVideoMaskExecuted: false,
    fullVideoTextBehindSubjectExecuted: false,
    textBehindSubjectVideoExecuted: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    revideoUsed: false,
    filmUsed: false,
    slowMotionExecuted: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    rtxPro6000Used: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  },
  uploadedReport: {
    bucket: realVideoSam2TemporalMaskConfig.qaBucket,
    object: 'activation-real-video/phase35d/phase35d-smoke/reports/phase35d-report.json',
    gcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35d/phase35d-smoke/reports/phase35d-report.json',
  },
  warnings: ['Human visual review remains required.'],
}

assert.equal(realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri, 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png')
assert.equal(realVideoSam2TemporalMaskConfig.segmentStartSeconds, 6.9)
assert.equal(realVideoSam2TemporalMaskConfig.segmentEndSeconds, 8.9)
assert.equal(realVideoSam2TemporalMaskConfig.maxSegmentDurationSeconds, 2)
assert.equal(realVideoSam2TemporalMaskConfig.preferredFrameCount, 10)
assert.equal(realVideoSam2TemporalMaskConfig.maxFrames, 12)
assert.equal(realVideoSam2TemporalMaskConfig.frameWidth, 768)
assert.equal(realVideoSam2TemporalMaskConfig.frameHeight, 432)
assert.equal(realVideoSam2TemporalMaskConfig.checkpointSha256, '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69')
assert.equal(realVideoSam2TemporalMaskConfig.configSha256, 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d')
assert.equal(realVideoSam2TemporalMaskConfig.gpuType, 'nvidia-l4')

const env = validateRealVideoSam2TemporalMaskExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'real_video_temporal_mask_sample',
  inputVideoGcsUri: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,
  anchorFrameGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri,
  anchorMaskGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri,
  anchorCutoutGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri,
  modelGcsPath: realVideoSam2TemporalMaskConfig.modelGcsPath,
  checkpointSha256: realVideoSam2TemporalMaskConfig.checkpointSha256,
  configSha256: realVideoSam2TemporalMaskConfig.configSha256,
  aggregateSha256: realVideoSam2TemporalMaskConfig.aggregateSha256,
  segmentStartSeconds: 6.9,
  segmentEndSeconds: 8.9,
  segmentDurationSeconds: 2,
  frameCount: 10,
  gpuType: 'nvidia-l4',
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  productionReady: 'false',
  externalBeta: 'false',
  broadRealMedia: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateRealVideoSam2TemporalMaskExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK=true')))
assert.ok(validateRealVideoSam2TemporalMaskExecutionEnv({ inputVideoGcsUri: 'gs://other/video.mp4' }).blockers.length > 0)
assert.ok(validateRealVideoSam2TemporalMaskExecutionEnv({ segmentDurationSeconds: 2.1 }).blockers.length > 0)
assert.ok(validateRealVideoSam2TemporalMaskExecutionEnv({ frameCount: 13 }).blockers.length > 0)
assert.ok(validateRealVideoSam2TemporalMaskExecutionEnv({ gpuType: 'nvidia-rtx-pro-6000' }).blockers.length > 0)

const segmentPlan = buildRealVideoSam2SegmentPlan()
assert.equal(segmentPlan.durationSeconds, 2)
assert.equal(segmentPlan.frameCount, 10)
assert.equal(segmentPlan.extractionMode, 'bounded_short_segment_only')

const promptPlan = buildRealVideoSam2PromptPlan()
assert.equal(promptPlan.promptSource, 'phase33d_mask_bbox')
assert.equal(promptPlan.promptFrameIndex, 4)

const iamPlan = buildRealVideoSam2IamPlan()
assert.equal(iamPlan.length, 7)
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((plan) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/i.test(plan.commandString)))

const commands = buildRealVideoSam2CommandPlans({ imageDigest: 'sha256:' + 'b'.repeat(64), runId: 'phase35d-smoke' })
assert.ok(commands.some((command) => command.commandId === 'build-push-image'))
assert.ok(commands.some((command) => command.commandId === 'deploy-job'))
assert.ok(commands.some((command) => command.commandId === 'execute-job'))
assert.ok(commands.some((command) => command.commandString.includes('--gpu-type=nvidia-l4')))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.every((command) => !/allUsers|allAuthenticatedUsers|rtx.pro.6000|PROVIDER_EXECUTION_ENABLED=true|FULL_VIDEO_MASK_ENABLED=true|TEXT_BEHIND_SUBJECT_VIDEO_ENABLED=true|REEDITPRO_PRODUCTION_READY=true/i.test(command.commandString)))

const report = buildRealVideoSam2TemporalMaskReport({ executionReport: sampleExecution, imageDigest: 'sha256:' + 'b'.repeat(64), runId: 'phase35d-smoke' })
assert.equal(report.status, 'ready')
assert.equal(report.realVideoTemporalTrackingCompleted, true)
assert.equal(report.phase35EReadiness.readyForControlledSegmentTextBehindSubjectPreview, true)
assert.equal(report.realVideoShortSegmentAllowed, true)
assert.equal(report.arbitraryRealUserMediaAllowed, false)
assert.equal(report.fullVideoMaskAllowed, false)
assert.equal(report.fullVideoTextBehindSubjectAllowed, false)
assert.equal(report.textBehindSubjectVideoAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.deepEqual(report.executionReport?.qa.gates.map((gate) => gate.gateId), [
  'source_integrity',
  'segment_bounds',
  'model_artifacts',
  'prompt_integrity',
  'runtime_integrity',
  'mask_artifacts',
  'temporal_consistency',
  'artifact_privacy',
  'blocked_features',
])

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:real-video:sam2-temporal-mask'], 'tsx server/cli/activation-real-video-sam2-temporal-mask.ts')
assert.equal(packageJson.scripts['activation:real-video:sam2-temporal-mask:report'], 'tsx server/cli/activation-real-video-sam2-temporal-mask-report.ts')
assert.equal(packageJson.scripts['activation:real-video:sam2-temporal-mask:iam-plan'], 'tsx server/cli/activation-real-video-sam2-temporal-mask-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-real-video-sam2-temporal-mask'], 'tsx server/smoke/activation-real-video-sam2-temporal-mask-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_source_uri_locks',
    'bounded_segment_limits',
    'phase35b_model_checksums',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gates',
    'phase35e_readiness',
    'blocked_full_video_provider_revideo_film_slow_motion',
    'package_scripts',
  ],
}))
