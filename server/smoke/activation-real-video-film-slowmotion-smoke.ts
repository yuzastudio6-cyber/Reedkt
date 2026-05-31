import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildRealVideoFilmCommandPlans,
  buildRealVideoFilmIamPlan,
  buildRealVideoFilmPlanSnapshot,
  buildRealVideoFilmSegmentPlan,
  buildRealVideoFilmSlowmotionReport,
  realVideoFilmSlowmotionConfig,
  validateRealVideoFilmSlowmotionExecutionEnv,
} from '../activation/real-video-film-slowmotion'
import type { RealVideoFilmSlowmotionExecutionReport } from '../activation/real-video-film-slowmotion'

const sampleExecution: RealVideoFilmSlowmotionExecutionReport = {
  ok: true,
  runId: 'phase38d-smoke',
  projectId: 'reeditpro',
  jobName: realVideoFilmSlowmotionConfig.runtimeJobName,
  image: {
    image: realVideoFilmSlowmotionConfig.runtimeTargetImage,
    digest: 'sha256:' + 'a'.repeat(64),
  },
  compute: {
    mode: 'cpu',
    cpu: 4,
    memory: '8Gi',
    gpuRequested: false,
  },
  source: {
    inputVideoGcsUri: realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri,
    durationSeconds: 15.467,
    hasAudio: true,
    width: 1920,
    height: 1080,
  },
  planSnapshot: {
    gcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-smoke/plan/approved-plan-snapshot.json',
    rawPromptExecution: false,
    validated: true,
  },
  segment: {
    startSeconds: 6.9835,
    endSeconds: 8.4835,
    durationSeconds: 1.5,
    sourceFrameFps: 6,
    sourceFrameCount: 9,
    width: 512,
    height: 288,
    sourceFrameUris: Array.from({ length: 9 }, (_, index) => `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-smoke/segment/frames/frame-${String(index).padStart(3, '0')}.png`),
    manifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-smoke/segment/segment-manifest.json',
  },
  model: {
    artifactId: 'film_net_style_saved_model',
    gcsPath: realVideoFilmSlowmotionConfig.artifactGcsPath,
    runtimePath: realVideoFilmSlowmotionConfig.artifactRuntimePath,
    kerasMetadataSha256: realVideoFilmSlowmotionConfig.kerasMetadataSha256,
    savedModelSha256: realVideoFilmSlowmotionConfig.savedModelSha256,
    variablesDataSha256: realVideoFilmSlowmotionConfig.variablesDataSha256,
    variablesIndexSha256: realVideoFilmSlowmotionConfig.variablesIndexSha256,
    aggregateSha256: realVideoFilmSlowmotionConfig.aggregateSha256,
    copiedFiles: [
      'film_net/Style/saved_model/keras_metadata.pb',
      'film_net/Style/saved_model/saved_model.pb',
      'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
      'film_net/Style/saved_model/variables/variables.index',
    ],
  },
  interpolation: {
    status: 'completed',
    interpolatedFrameCount: 8,
    outputFrameCount: 17,
    interpolatedFrameUris: Array.from({ length: 8 }, (_, index) => `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-smoke/interpolated/interpolated-frame-${String(index).padStart(3, '0')}.png`),
    previewFrameUris: Array.from({ length: 17 }, (_, index) => `gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-smoke/preview-frames/frame-${String(index).padStart(3, '0')}.png`),
    metrics: {
      meanMidpointDiffFromPreviousSource: 0.04,
      meanMidpointDiffFromNextSource: 0.04,
      meanOutputStddev: 0.2,
    },
  },
  preview: {
    previewFrameCount: 17,
    previewMp4Status: 'completed',
    previewMp4Uri: 'gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-smoke/preview/film-slowmotion-preview.mp4',
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'source_integrity', status: 'passed', summary: 'Approved source only.' },
      { gateId: 'plan_snapshot_integrity', status: 'passed', summary: 'Snapshot validated.' },
      { gateId: 'segment_bounds', status: 'passed', summary: 'Segment bounded.' },
      { gateId: 'model_artifacts', status: 'passed', summary: 'Checksums matched.' },
      { gateId: 'runtime_integrity', status: 'passed', summary: 'FILM ran.' },
      { gateId: 'interpolated_artifacts', status: 'passed', summary: 'Frames emitted.' },
      { gateId: 'motion_sanity', status: 'passed', summary: 'Motion sanity passed.' },
      { gateId: 'preview_artifacts', status: 'passed', summary: 'Preview artifacts emitted.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Private prefixes only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'Blocked features remained blocked.' },
    ],
    blockers: [],
    warnings: ['Human visual review is still required.'],
  },
  artifacts: [],
  safety: {
    realVideoShortSegmentOnly: true,
    approvedSourceOnly: true,
    providerExecuted: false,
    modelDownloadedExternally: false,
    fullVideoInterpolationExecuted: false,
    audioStretchExecuted: false,
    finalDeliveryCreated: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  },
  uploadedReport: {
    bucket: realVideoFilmSlowmotionConfig.qaBucket,
    object: 'activation-film-runtime/phase38d/phase38d-smoke/reports/phase38d-report.json',
    gcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38d/phase38d-smoke/reports/phase38d-report.json',
  },
  warnings: ['Human visual review is still required.'],
}

assert.equal(realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(realVideoFilmSlowmotionConfig.artifactGcsPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/')
assert.equal(realVideoFilmSlowmotionConfig.aggregateSha256, '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b')
assert.equal(realVideoFilmSlowmotionConfig.segmentDurationSeconds <= 1.5, true)
assert.equal(realVideoFilmSlowmotionConfig.sourceFrameCount <= 12, true)
assert.equal(realVideoFilmSlowmotionConfig.outputFrameCount <= 24, true)
assert.equal(realVideoFilmSlowmotionConfig.frameWidth, 512)
assert.equal(realVideoFilmSlowmotionConfig.frameHeight, 288)
assert.equal(realVideoFilmSlowmotionConfig.computeMode, 'cpu')

const env = validateRealVideoFilmSlowmotionExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'real_video_slowmotion_sample',
  inputVideoGcsUri: realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri,
  artifactGcsPath: realVideoFilmSlowmotionConfig.artifactGcsPath,
  kerasMetadataSha256: realVideoFilmSlowmotionConfig.kerasMetadataSha256,
  savedModelSha256: realVideoFilmSlowmotionConfig.savedModelSha256,
  variablesDataSha256: realVideoFilmSlowmotionConfig.variablesDataSha256,
  variablesIndexSha256: realVideoFilmSlowmotionConfig.variablesIndexSha256,
  aggregateSha256: realVideoFilmSlowmotionConfig.aggregateSha256,
  segmentStartSeconds: realVideoFilmSlowmotionConfig.segmentStartSeconds,
  segmentEndSeconds: realVideoFilmSlowmotionConfig.segmentEndSeconds,
  segmentDurationSeconds: realVideoFilmSlowmotionConfig.segmentDurationSeconds,
  sourceFrameCount: realVideoFilmSlowmotionConfig.sourceFrameCount,
  outputFrameCount: realVideoFilmSlowmotionConfig.outputFrameCount,
  frameWidth: realVideoFilmSlowmotionConfig.frameWidth,
  frameHeight: realVideoFilmSlowmotionConfig.frameHeight,
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  revideoEnabled: 'false',
  audioStretchEnabled: 'false',
  fullVideoInterpolationEnabled: 'false',
  finalDeliveryEnabled: 'false',
  productionReady: 'false',
  externalBeta: 'false',
  broadRealMedia: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateRealVideoFilmSlowmotionExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION=true')))
assert.ok(validateRealVideoFilmSlowmotionExecutionEnv({ inputVideoGcsUri: 'gs://other/video.mp4' }).blockers.length > 0)
assert.ok(validateRealVideoFilmSlowmotionExecutionEnv({ fullVideoInterpolationEnabled: 'true' }).blockers.length > 0)

const segmentPlan = buildRealVideoFilmSegmentPlan()
assert.equal(segmentPlan.durationSeconds, 1.5)
assert.equal(segmentPlan.sourceFrameCount, 9)
assert.equal(segmentPlan.outputFrameCount, 17)

const snapshot = buildRealVideoFilmPlanSnapshot('phase38d-smoke')
assert.equal(snapshot.rawPromptExecution, false)
assert.equal(snapshot.blockedFeatures.finalDeliveryAllowed, false)
assert.equal(snapshot.blockedFeatures.audioStretchAllowed, false)
assert.equal(snapshot.artifactPrefixes.previews.startsWith('gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-smoke/'), true)

const iamPlan = buildRealVideoFilmIamPlan()
assert.equal(iamPlan.length, 7)
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((plan) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/i.test(plan.commandString)))

const commands = buildRealVideoFilmCommandPlans({ imageDigest: 'sha256:' + 'a'.repeat(64), runId: 'phase38d-smoke' })
assert.ok(commands.some((command) => command.commandId === 'build-push-image'))
assert.ok(commands.some((command) => command.commandId === 'deploy-job'))
assert.ok(commands.some((command) => command.commandId === 'execute-job'))
assert.ok(commands.some((command) => command.commandString.includes('--cpu=4')))
assert.ok(commands.some((command) => command.commandString.includes('--memory=8Gi')))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.every((command) => !/allUsers|allAuthenticatedUsers|--gpu|PROVIDER_EXECUTION_ENABLED=true|FULL_VIDEO_INTERPOLATION_ENABLED=true|FINAL_DELIVERY_ENABLED=true|AUDIO_STRETCH_ENABLED=true|REVIDEO_ENABLED=true|REEDITPRO_PRODUCTION_READY=true/i.test(command.commandString)))

const report = buildRealVideoFilmSlowmotionReport({ executionReport: sampleExecution, imageDigest: 'sha256:' + 'a'.repeat(64), runId: 'phase38d-smoke' })
assert.equal(report.status, 'ready')
assert.equal(report.realVideoSlowmotionSampleCompleted, true)
assert.equal(report.phase38EReadiness.readyForFilmPrivateFeatureE2EReadinessGate, true)
assert.equal(report.realVideoShortSegmentAllowed, true)
assert.equal(report.fullVideoInterpolationAllowed, false)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.audioStretchAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.trackBToolsAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

const gateIds = new Set(report.executionReport?.qa.gates.map((gate) => gate.gateId))
for (const gate of ['source_integrity', 'plan_snapshot_integrity', 'segment_bounds', 'model_artifacts', 'runtime_integrity', 'interpolated_artifacts', 'motion_sanity', 'preview_artifacts', 'artifact_privacy', 'blocked_features'] as const) {
  assert.equal(gateIds.has(gate), true)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:real-video:film-slowmotion'], 'tsx server/cli/activation-real-video-film-slowmotion.ts')
assert.equal(packageJson.scripts['activation:real-video:film-slowmotion:report'], 'tsx server/cli/activation-real-video-film-slowmotion-report.ts')
assert.equal(packageJson.scripts['activation:real-video:film-slowmotion:iam-plan'], 'tsx server/cli/activation-real-video-film-slowmotion-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-real-video-film-slowmotion'], 'tsx server/smoke/activation-real-video-film-slowmotion-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase38d_source_uri_locked',
    'segment_bounds_locked',
    'film_model_checksums_locked',
    'confirmation_required',
    'private_artifact_prefixes',
    'qa_gates_present',
    'blocked_feature_gates_false',
    'package_scripts_present',
  ],
}, null, 2))
