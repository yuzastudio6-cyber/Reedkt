import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildRealVideoProColorImageCommandPlans,
  buildRealVideoProColorImageIamPlan,
  buildRealVideoProColorImageReport,
  buildRealVideoProColorPlanSnapshot,
  buildRealVideoProColorSamplePlan,
  buildRealVideoProColorSourceSummary,
  realVideoProColorImageConfig,
  validateRealVideoProColorImageExecutionEnv,
} from '../activation/real-video-pro-color-image'
import type { RealVideoProColorImageExecutionReport } from '../activation/real-video-pro-color-image'

const sampleExecution: RealVideoProColorImageExecutionReport = {
  ok: true,
  phase: '40C',
  runId: 'phase40c-smoke',
  projectId: 'reeditpro',
  jobName: realVideoProColorImageConfig.runtimeJobName,
  runtimeMode: 'real_video_sample',
  compute: {
    mode: 'cpu',
    cpu: 4,
    memory: '8Gi',
    gpuRequested: false,
  },
  runtimeDiagnostics: {
    pythonVersion: '3.11.x',
    pythonExecutable: '/usr/bin/python3',
    numpyVersion: '1.26.4',
    pillowVersion: '10.4.0',
  },
  source: {
    inputVideoGcsUri: realVideoProColorImageConfig.approvedInputVideoGcsUri,
    durationSeconds: 15.467,
    videoStreamPresent: true,
    audioStreamPresent: true,
    sourceRunId: realVideoProColorImageConfig.sourceRunId,
  },
  sample: {
    timestampsSeconds: [0.5, 7.7335, 14.5],
    frameCount: 3,
    width: 768,
    height: 432,
    frameUris: [
      'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40c/phase40c-smoke/frames/input/frame-000.png',
    ],
  },
  planSnapshot: {
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    gcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40c/phase40c-smoke/plan/approved-plan-snapshot.json',
  },
  tools: [
    { toolId: 'ffprobe', status: 'passed', version: 'ffprobe 5.x', operation: 'validated source', artifacts: [], metrics: { durationSeconds: 15.467 }, blockers: [], warnings: [] },
    { toolId: 'ffmpeg', status: 'passed', version: 'ffmpeg 5.x', operation: 'extracted frames', artifacts: [], metrics: { frameCount: 3, width: 768, height: 432 }, blockers: [], warnings: [] },
    { toolId: 'openimageio', status: 'passed', version: '3.0.18.1', operation: 'real-frame read/write', artifacts: [], metrics: { imagesRead: 3 }, blockers: [], warnings: [] },
    { toolId: 'opencolorio', status: 'passed', version: '2.4.2', operation: 'raw identity transform', artifacts: [], metrics: { maxAbsDiff: 0 }, blockers: [], warnings: [] },
    { toolId: 'kornia', status: 'passed', version: '0.8.1', operation: 'CPU metrics', artifacts: [], metrics: { torchVersion: '2.7.1+cpu', cudaAvailable: false }, blockers: [], warnings: [] },
  ],
  artifacts: [],
  qa: {
    status: 'passed',
    gates: [
      { gateId: 'source_integrity', passed: true, severity: 'mandatory', summary: 'Source validated.' },
      { gateId: 'phase40b_evidence', passed: true, severity: 'mandatory', summary: 'Phase 40B evidence valid.' },
      { gateId: 'plan_snapshot_integrity', passed: true, severity: 'mandatory', summary: 'Snapshot present.' },
      { gateId: 'sample_bounds', passed: true, severity: 'mandatory', summary: 'Bounds respected.' },
      { gateId: 'openimageio_real_frame', passed: true, severity: 'mandatory', summary: 'OIIO passed.' },
      { gateId: 'opencolorio_real_frame', passed: true, severity: 'mandatory', summary: 'OCIO passed.' },
      { gateId: 'kornia_real_frame', passed: true, severity: 'mandatory', summary: 'Kornia passed.' },
      { gateId: 'artifact_privacy', passed: true, severity: 'mandatory', summary: 'Private prefixes.' },
      { gateId: 'blocked_features', passed: true, severity: 'mandatory', summary: 'Blocked features stayed blocked.' },
    ],
    blockers: [],
    warnings: [],
  },
  safety: {
    approvedSourceOnly: true,
    arbitraryMediaUsed: false,
    fullVideoProcessed: false,
    full4KFramesProcessed: false,
    finalDeliveryCreated: false,
    providerExecuted: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  },
  phase40DReadiness: {
    readyForProColorImagePrivateFeatureE2EReadinessGate: true,
    reason: 'Phase 40C sample passed.',
  },
  blockers: [],
  warnings: [],
}

assert.equal(realVideoProColorImageConfig.phase, '40C')
assert.equal(realVideoProColorImageConfig.track, 'A visual/video')
assert.equal(realVideoProColorImageConfig.runtimeMode, 'real_video_sample')
assert.equal(realVideoProColorImageConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(realVideoProColorImageConfig.phase40BRunId, 'phase40b-20260531T10390')
assert.equal(realVideoProColorImageConfig.runtimeTargetImage, 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-real-video-001')
assert.equal(realVideoProColorImageConfig.computeMode, 'cpu')
assert.equal(realVideoProColorImageConfig.openColorIOVersion, '2.4.2')
assert.equal(realVideoProColorImageConfig.openImageIOVersion, '3.0.18.1')
assert.equal(realVideoProColorImageConfig.torchVersion, '2.7.1+cpu')
assert.equal(realVideoProColorImageConfig.korniaVersion, '0.8.1')

const source = buildRealVideoProColorSourceSummary()
assert.equal(source.inputVideoGcsUri, realVideoProColorImageConfig.approvedInputVideoGcsUri)
assert.equal(source.arbitraryMediaAllowed, false)
assert.equal(source.fullVideoProcessingAllowed, false)

const samplePlan = buildRealVideoProColorSamplePlan()
assert.equal(samplePlan.frameCount, 3)
assert.equal(samplePlan.maxFrameCount, 5)
assert.equal(samplePlan.frameWidth, 768)
assert.equal(samplePlan.frameHeight, 432)
assert.equal(samplePlan.fullVideoExtractionAllowed, false)
assert.equal(samplePlan.full4KProcessingAllowed, false)

const snapshot = buildRealVideoProColorPlanSnapshot('phase40c-smoke')
assert.equal(snapshot.approvedPlanSnapshot, true)
assert.equal(snapshot.rawPromptExecution, false)
assert.equal(snapshot.safety.providerAllowed, false)
assert.equal(snapshot.safety.revideoAllowed, false)
assert.equal(snapshot.safety.finalDeliveryAllowed, false)
assert.equal(snapshot.safety.fullVideoProcessingAllowed, false)

const env = validateRealVideoProColorImageExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'real_video_sample',
  inputVideoGcsUri: realVideoProColorImageConfig.approvedInputVideoGcsUri,
  frameCount: 3,
  frameWidth: 768,
  frameHeight: 432,
  providerExecutionEnabled: 'false',
  revideoEnabled: 'false',
  publicAccessEnabled: 'false',
  fullVideoProcessingEnabled: 'false',
  finalDeliveryEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateRealVideoProColorImageExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE=true')))
assert.ok(validateRealVideoProColorImageExecutionEnv({ inputVideoGcsUri: 'gs://other/video.mp4' }).blockers.length > 0)
assert.ok(validateRealVideoProColorImageExecutionEnv({ frameCount: 6 }).blockers.length > 0)
assert.ok(validateRealVideoProColorImageExecutionEnv({ frameWidth: 769 }).blockers.length > 0)
assert.ok(validateRealVideoProColorImageExecutionEnv({ finalDeliveryEnabled: 'true' }).blockers.length > 0)

const iamPlan = buildRealVideoProColorImageIamPlan()
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectViewer'))
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectCreator'))
for (const binding of iamPlan) {
  assert.match(binding.conditionExpression, /activation-|model-weights|phase32/)
  assert.doesNotMatch(binding.commandString, /allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/)
}

const commandPlans = buildRealVideoProColorImageCommandPlans()
assert.ok(commandPlans.some((plan) => plan.commandId === 'build-push-image'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'deploy-job'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'execute-job'))
for (const plan of commandPlans) {
  assert.equal(plan.textOnlyByDefault, true)
  const text = plan.commandString.toLowerCase()
  assert.doesNotMatch(text, /allusers|allauthenticatedusers|provider_execution_enabled=true|revideo_enabled=true|full_video_processing_enabled=true|final_delivery_enabled=true|production_ready=true/)
}

const report = buildRealVideoProColorImageReport({ executionReport: sampleExecution })
assert.equal(report.status, 'ready')
assert.equal(report.realVideoProColorSampleCompleted, true)
assert.equal(report.phase40DReadiness.readyForProColorImagePrivateFeatureE2EReadinessGate, true)
assert.equal(report.fullVideoProcessingAllowed, false)
assert.equal(report.full4KProcessingAllowed, false)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

for (const gateId of [
  'source_integrity',
  'phase40b_evidence',
  'plan_snapshot_integrity',
  'sample_bounds',
  'openimageio_real_frame',
  'opencolorio_real_frame',
  'kornia_real_frame',
  'artifact_privacy',
  'blocked_features',
] as const) {
  assert.ok(report.executionReport?.qa.gates.some((gate) => gate.gateId === gateId), `${gateId} QA gate must exist.`)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:real-video:pro-color-image'], 'tsx server/cli/activation-real-video-pro-color-image.ts')
assert.equal(packageJson.scripts['activation:real-video:pro-color-image:report'], 'tsx server/cli/activation-real-video-pro-color-image-report.ts')
assert.equal(packageJson.scripts['activation:real-video:pro-color-image:iam-plan'], 'tsx server/cli/activation-real-video-pro-color-image-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-real-video-pro-color-image'], 'tsx server/smoke/activation-real-video-pro-color-image-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_source_lock',
    'phase40b_evidence_reference',
    'bounded_sample_plan',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gates',
    'blocked_features',
    'package_scripts',
  ],
}))
