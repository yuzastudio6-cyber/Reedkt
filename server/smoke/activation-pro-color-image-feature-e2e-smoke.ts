import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildProColorImageFeatureE2ECommandPlans,
  buildProColorImageFeatureE2EIamPlan,
  buildProColorImageFeatureE2EReport,
  buildProColorImageFeaturePlanSnapshot,
  buildProColorImageFeatureSamplePlan,
  buildProColorImageFeatureSourceSummary,
  proColorImageFeatureE2EConfig,
  validateProColorImageFeatureE2EExecutionEnv,
} from '../activation/pro-color-image-feature-e2e'
import type { ProColorImageFeatureE2EExecutionReport } from '../activation/pro-color-image-feature-e2e'

const sampleExecution: ProColorImageFeatureE2EExecutionReport = {
  ok: true,
  phase: '40D',
  runId: 'phase40d-smoke',
  projectId: 'reeditpro',
  jobName: proColorImageFeatureE2EConfig.runtimeJobName,
  runtimeMode: 'pro_color_image_feature_e2e',
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
    inputVideoGcsUri: proColorImageFeatureE2EConfig.approvedInputVideoGcsUri,
    durationSeconds: 15.467,
    videoStreamPresent: true,
    audioStreamPresent: true,
    sourceRunId: proColorImageFeatureE2EConfig.sourceRunId,
  },
  phase40CEvidence: {
    runId: proColorImageFeatureE2EConfig.phase40CRunId,
    reportUri: proColorImageFeatureE2EConfig.phase40CReportUri,
    ok: true,
  },
  sample: {
    timestampsSeconds: [0.5, 7.7335, 14.5],
    frameCount: 3,
    width: 768,
    height: 432,
    frameUris: [
      'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40d/phase40d-smoke/frames/input/frame-000.png',
    ],
  },
  planSnapshot: {
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    gcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40d/phase40d-smoke/plan/approved-plan-snapshot.json',
  },
  reviewArtifacts: {
    contactSheetUri: 'gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-smoke/contact-sheet/pro-color-image-feature-contact-sheet.png',
    reviewManifestUri: 'gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-smoke/review/private-review-manifest.json',
  },
  tools: [
    { toolId: 'ffprobe', status: 'passed', version: 'ffprobe 5.x', operation: 'validated source', artifacts: [], metrics: { durationSeconds: 15.467 }, blockers: [], warnings: [] },
    { toolId: 'ffmpeg', status: 'passed', version: 'ffmpeg 5.x', operation: 'extracted frames', artifacts: [], metrics: { frameCount: 3, width: 768, height: 432 }, blockers: [], warnings: [] },
    { toolId: 'openimageio', status: 'passed', version: '3.0.18.1', operation: 'feature read/write', artifacts: [], metrics: { imagesRead: 3 }, blockers: [], warnings: [] },
    { toolId: 'opencolorio', status: 'passed', version: '2.4.2', operation: 'feature raw identity transform', artifacts: [], metrics: { maxAbsDiff: 0 }, blockers: [], warnings: [] },
    { toolId: 'kornia', status: 'passed', version: '0.8.1', operation: 'CPU metrics', artifacts: [], metrics: { torchVersion: '2.7.1+cpu', cudaAvailable: false }, blockers: [], warnings: [] },
  ],
  artifacts: [],
  qa: {
    status: 'passed',
    gates: [
      { gateId: 'source_integrity', passed: true, severity: 'mandatory', summary: 'Source validated.' },
      { gateId: 'phase40c_evidence', passed: true, severity: 'mandatory', summary: 'Phase 40C evidence valid.' },
      { gateId: 'plan_snapshot_integrity', passed: true, severity: 'mandatory', summary: 'Snapshot present.' },
      { gateId: 'sample_bounds', passed: true, severity: 'mandatory', summary: 'Bounds respected.' },
      { gateId: 'openimageio_feature', passed: true, severity: 'mandatory', summary: 'OIIO passed.' },
      { gateId: 'opencolorio_feature', passed: true, severity: 'mandatory', summary: 'OCIO passed.' },
      { gateId: 'kornia_feature', passed: true, severity: 'mandatory', summary: 'Kornia passed.' },
      { gateId: 'review_artifacts', passed: true, severity: 'mandatory', summary: 'Private review artifacts present.' },
      { gateId: 'artifact_privacy', passed: true, severity: 'mandatory', summary: 'Private prefixes.' },
      { gateId: 'feature_readiness_evidence', passed: true, severity: 'mandatory', summary: 'Internal readiness evidence recorded.' },
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
  featureReadiness: {
    readyForInternalProColorImageFeatureTesting: true,
    reason: 'Phase 40D sample passed.',
  },
  phase45AReadiness: {
    readyForLibassCaptionBurnInValidation: true,
    reason: 'Phase 40D sample passed.',
  },
  blockers: [],
  warnings: [],
}

assert.equal(proColorImageFeatureE2EConfig.phase, '40D')
assert.equal(proColorImageFeatureE2EConfig.track, 'A visual/video')
assert.equal(proColorImageFeatureE2EConfig.runtimeMode, 'pro_color_image_feature_e2e')
assert.equal(proColorImageFeatureE2EConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(proColorImageFeatureE2EConfig.phase40CRunId, 'phase40c-20260531T11504')
assert.equal(proColorImageFeatureE2EConfig.runtimeTargetImage, 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-feature-e2e-001')
assert.equal(proColorImageFeatureE2EConfig.computeMode, 'cpu')
assert.equal(proColorImageFeatureE2EConfig.openColorIOVersion, '2.4.2')
assert.equal(proColorImageFeatureE2EConfig.openImageIOVersion, '3.0.18.1')
assert.equal(proColorImageFeatureE2EConfig.torchVersion, '2.7.1+cpu')
assert.equal(proColorImageFeatureE2EConfig.korniaVersion, '0.8.1')

const source = buildProColorImageFeatureSourceSummary()
assert.equal(source.inputVideoGcsUri, proColorImageFeatureE2EConfig.approvedInputVideoGcsUri)
assert.equal(source.phase40CRunId, proColorImageFeatureE2EConfig.phase40CRunId)
assert.equal(source.arbitraryMediaAllowed, false)
assert.equal(source.fullVideoProcessingAllowed, false)

const samplePlan = buildProColorImageFeatureSamplePlan()
assert.equal(samplePlan.frameCount, 3)
assert.equal(samplePlan.maxFrameCount, 5)
assert.equal(samplePlan.frameWidth, 768)
assert.equal(samplePlan.frameHeight, 432)
assert.equal(samplePlan.fullVideoExtractionAllowed, false)
assert.equal(samplePlan.full4KProcessingAllowed, false)

const snapshot = buildProColorImageFeaturePlanSnapshot('phase40d-smoke')
assert.equal(snapshot.phase, '40D')
assert.equal(snapshot.approvedPlanSnapshot, true)
assert.equal(snapshot.rawPromptExecution, false)
assert.equal(snapshot.safety.providerAllowed, false)
assert.equal(snapshot.safety.revideoAllowed, false)
assert.equal(snapshot.safety.finalDeliveryAllowed, false)
assert.equal(snapshot.safety.fullVideoProcessingAllowed, false)

const env = validateProColorImageFeatureE2EExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'pro_color_image_feature_e2e',
  inputVideoGcsUri: proColorImageFeatureE2EConfig.approvedInputVideoGcsUri,
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
assert.ok(validateProColorImageFeatureE2EExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_FEATURE_E2E=true')))
assert.ok(validateProColorImageFeatureE2EExecutionEnv({ inputVideoGcsUri: 'gs://other/video.mp4' }).blockers.length > 0)
assert.ok(validateProColorImageFeatureE2EExecutionEnv({ frameCount: 6 }).blockers.length > 0)
assert.ok(validateProColorImageFeatureE2EExecutionEnv({ frameWidth: 769 }).blockers.length > 0)
assert.ok(validateProColorImageFeatureE2EExecutionEnv({ finalDeliveryEnabled: 'true' }).blockers.length > 0)

const iamPlan = buildProColorImageFeatureE2EIamPlan()
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectViewer'))
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectCreator'))
for (const binding of iamPlan) {
  assert.match(binding.conditionExpression, /activation-/)
  assert.doesNotMatch(binding.commandString, /allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/)
}

const commandPlans = buildProColorImageFeatureE2ECommandPlans()
assert.ok(commandPlans.some((plan) => plan.commandId === 'build-push-image'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'deploy-job'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'execute-job'))
for (const plan of commandPlans) {
  assert.equal(plan.textOnlyByDefault, true)
  const text = plan.commandString.toLowerCase()
  assert.doesNotMatch(text, /allusers|allauthenticatedusers|provider_execution_enabled=true|revideo_enabled=true|full_video_processing_enabled=true|final_delivery_enabled=true|production_ready=true/)
}

const report = buildProColorImageFeatureE2EReport({ executionReport: sampleExecution })
assert.equal(report.status, 'ready')
assert.equal(report.proColorImageFeatureE2ECompleted, true)
assert.equal(report.featureReadiness.readyForInternalProColorImageFeatureTesting, true)
assert.equal(report.phase45AReadiness.readyForLibassCaptionBurnInValidation, true)
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
  'phase40c_evidence',
  'plan_snapshot_integrity',
  'sample_bounds',
  'openimageio_feature',
  'opencolorio_feature',
  'kornia_feature',
  'review_artifacts',
  'artifact_privacy',
  'feature_readiness_evidence',
  'blocked_features',
] as const) {
  assert.ok(report.executionReport?.qa.gates.some((gate) => gate.gateId === gateId), `${gateId} QA gate must exist.`)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:pro-color-image-feature-e2e'], 'tsx server/cli/activation-pro-color-image-feature-e2e.ts')
assert.equal(packageJson.scripts['activation:pro-color-image-feature-e2e:report'], 'tsx server/cli/activation-pro-color-image-feature-e2e-report.ts')
assert.equal(packageJson.scripts['activation:pro-color-image-feature-e2e:iam-plan'], 'tsx server/cli/activation-pro-color-image-feature-e2e-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-pro-color-image-feature-e2e'], 'tsx server/smoke/activation-pro-color-image-feature-e2e-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_source_lock',
    'phase40c_evidence_reference',
    'bounded_feature_plan',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gates',
    'blocked_features',
    'package_scripts',
  ],
}))
