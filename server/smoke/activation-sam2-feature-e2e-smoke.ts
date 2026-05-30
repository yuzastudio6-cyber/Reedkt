import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildSam2FeatureApprovedPlanSnapshot,
  buildSam2FeatureE2ECommandPlans,
  buildSam2FeatureE2EIamPlan,
  buildSam2FeatureE2EReport,
  buildSam2FeaturePreviewScope,
  sam2FeatureE2EConfig,
  validateSam2FeatureE2EExecutionEnv,
} from '../activation/sam2-feature-e2e'

const previewScope = buildSam2FeaturePreviewScope()
const sourceValidation = {
  selectedSource: sam2FeatureE2EConfig.approvedPreviewSource,
  sourceMode: 'approved_gcs_export' as const,
  approvedPreviewSource: sam2FeatureE2EConfig.approvedPreviewSource,
  approvedGcsSource: sam2FeatureE2EConfig.approvedGcsSource,
  localCandidatesChecked: [],
  durationSeconds: sam2FeatureE2EConfig.controlledPreviewDurationSeconds,
  width: 768,
  height: 432,
  hasAudio: true,
  privateSourceOnly: true as const,
  blockers: [],
  warnings: [],
}
const snapshot = buildSam2FeatureApprovedPlanSnapshot({
  runId: 'phase35f-smoke',
  sourceValidation,
  previewScope,
})

assert.equal(sam2FeatureE2EConfig.phase, '35F')
assert.equal(sam2FeatureE2EConfig.approvedPreviewSource, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(sam2FeatureE2EConfig.approvedGcsSource, 'gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov')
assert.ok(sam2FeatureE2EConfig.approvedLocalSourceCandidates.some((candidate) => candidate.includes('IMG_6005')))
assert.equal(sam2FeatureE2EConfig.approvedText, 'REEDITPRO')
assert.equal(sam2FeatureE2EConfig.previewWidth, 768)
assert.equal(sam2FeatureE2EConfig.previewHeight, 432)
assert.equal(sam2FeatureE2EConfig.preferredFps, 5)
assert.equal(sam2FeatureE2EConfig.maxFps, 8)
assert.equal(sam2FeatureE2EConfig.maxFrames, 125)
assert.equal(sam2FeatureE2EConfig.modelId, 'sam2.1_hiera_tiny')
assert.equal(sam2FeatureE2EConfig.checkpointSha256, '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69')
assert.equal(sam2FeatureE2EConfig.configSha256, 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d')
assert.equal(sam2FeatureE2EConfig.aggregateSha256, '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2')

assert.equal(previewScope.mode, 'full_controlled_clip_preview')
assert.equal(previewScope.width, 768)
assert.equal(previewScope.height, 432)
assert.equal(previewScope.fps, 5)
assert.equal(previewScope.frameCount <= sam2FeatureE2EConfig.maxFrames, true)
assert.equal(snapshot.approval.approvedPlanSnapshot, true)
assert.equal(snapshot.approval.rawPromptExecution, false)
assert.equal(snapshot.outputPrefixes.previews, 'gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35f/phase35f-smoke/')
assert.equal(snapshot.safety.productionReadyAllowed, false)
assert.equal(snapshot.safety.externalBetaAllowed, false)
assert.equal(snapshot.safety.broadRealUserMediaAllowed, false)

const env = validateSam2FeatureE2EExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: sam2FeatureE2EConfig.runtimeMode,
  selectedSource: sam2FeatureE2EConfig.approvedPreviewSource,
  modelGcsPath: sam2FeatureE2EConfig.modelGcsPath,
  checkpointSha256: sam2FeatureE2EConfig.checkpointSha256,
  configSha256: sam2FeatureE2EConfig.configSha256,
  aggregateSha256: sam2FeatureE2EConfig.aggregateSha256,
  text: 'REEDITPRO',
  previewWidth: 768,
  previewHeight: 432,
  fps: 5,
  frameCount: previewScope.frameCount,
  maxFrames: 125,
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  productionReady: 'false',
  externalBeta: 'false',
  paidProduction: 'false',
  broadRealMedia: 'false',
  fullVideoMaskEnabled: 'false',
  fullVideoTextBehindSubjectEnabled: 'false',
  finalExportEnabled: 'false',
  realEsrganEnabled: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateSam2FeatureE2EExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_SAM2_FEATURE_E2E=true')))
assert.ok(validateSam2FeatureE2EExecutionEnv({ selectedSource: 'gs://other/source.mp4' }).blockers.length > 0)
assert.ok(validateSam2FeatureE2EExecutionEnv({ frameCount: 126 }).blockers.length > 0)
assert.ok(validateSam2FeatureE2EExecutionEnv({ providerExecutionEnabled: 'true' }).blockers.length > 0)
assert.ok(validateSam2FeatureE2EExecutionEnv({ publicAccessEnabled: 'true' }).blockers.length > 0)
assert.ok(validateSam2FeatureE2EExecutionEnv({ realEsrganEnabled: 'true' }).blockers.length > 0)

const iamPlan = buildSam2FeatureE2EIamPlan()
assert.ok(iamPlan.length >= 8)
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((plan) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/i.test(plan.commandString)))

const commands = buildSam2FeatureE2ECommandPlans('phase35f-smoke')
assert.ok(commands.some((command) => command.commandId === 'execute-sam2-feature-e2e'))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.every((command) => !/allUsers|allAuthenticatedUsers|PROVIDER_EXECUTION_ENABLED=true|PUBLIC_ACCESS_ENABLED=true|REEDITPRO_PRODUCTION_READY=true|REEDITPRO_EXTERNAL_BETA_READY=true|REEDITPRO_BROAD_REAL_MEDIA_READY=true|revideo|film|slow.motion|REAL_ESRGAN_EXECUTION_ENABLED=true/i.test(command.commandString)))

const report = buildSam2FeatureE2EReport({ runId: 'phase35f-smoke' })
assert.equal(report.reportId, 'activation-phase-35f-sam2-feature-e2e-beta-readiness')
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.slowMotionAllowed, false)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:sam2-feature-e2e'], 'tsx server/cli/activation-sam2-feature-e2e.ts')
assert.equal(packageJson.scripts['activation:sam2-feature-e2e:report'], 'tsx server/cli/activation-sam2-feature-e2e-report.ts')
assert.equal(packageJson.scripts['activation:sam2-feature-e2e:iam-plan'], 'tsx server/cli/activation-sam2-feature-e2e-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-sam2-feature-e2e'], 'tsx server/smoke/activation-sam2-feature-e2e-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_source_locks',
    'plan_snapshot_required',
    'bounded_preview_scope',
    'phase35b_sam2_checksums',
    'private_artifact_prefixes',
    'confirmation_gate',
    'blocked_provider_public_revideo_film_slowmotion_realesrgan_beta_production',
    'package_scripts',
  ],
}))
