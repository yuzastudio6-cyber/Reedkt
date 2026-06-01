import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  OCR_RUNTIME_BLOCKED_SCOPES,
  OCR_RUNTIME_EXPECTED_ARTIFACTS,
  buildOcrGeneratedFixtureManifest,
  buildOcrRuntimeCommandPlans,
  buildOcrRuntimeIamPlan,
  buildOcrRuntimePlan,
  buildOcrRuntimeReport,
  getApprovedOcrRuntimeEvidence,
  getPhase37COcrRuntimeAssets,
  ocrGeneratedFixtureSpecs,
  ocrRuntimeConfig,
  phase37COcrRuntimeArtifactPrefix,
  validateOcrRuntimeExecutionEnv,
  validateOcrRuntimeStaticPlan,
} from '../activation/ocr-runtime'

assert.equal(ocrRuntimeConfig.phase, '37C')
assert.equal(ocrRuntimeConfig.projectId, 'reeditpro')
assert.equal(ocrRuntimeConfig.region, 'us-central1')
assert.equal(ocrRuntimeConfig.env, 'staging')
assert.equal(ocrRuntimeConfig.runtimeMode, 'generated_ui_text_frame')
assert.equal(ocrRuntimeConfig.cpuOnly, true)
assert.equal(ocrRuntimeConfig.modelFamily, 'PP-OCRv5')
assert.equal(ocrRuntimeConfig.assetVersion, 'paddle3.0.0-mobile-safe-zone-v1')
assert.equal(ocrRuntimeConfig.modelGcsPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/')
assert.equal(ocrRuntimeConfig.qaBucket, 'reeditpro-staging-reeditpro-qa-artifacts')
assert.equal(ocrRuntimeConfig.detectionArchiveSha256, '50446e5d01ac2a73d5319c89513281f6578414c888c602f9af13f93feefffc58')
assert.equal(ocrRuntimeConfig.recognitionArchiveSha256, '566b9512b34e34a9f0db54d87b51fa5a0b9ed2cf1ab7e49728cc0b8b5a64f414')
assert.equal(ocrRuntimeConfig.dictionarySha256, 'd1979e9f794c464c0d2e0b70a7fe14dd978e9dc644c0e71f14158cdf8342af1b')
assert.equal(ocrRuntimeConfig.aggregateSha256, '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b')

const assets = getPhase37COcrRuntimeAssets()
assert.deepEqual(assets.map((asset) => asset.relativePath).sort(), [
  'det/PP-OCRv5_mobile_det_infer.tar',
  'dict/ppocrv5_dict.txt',
  'rec/PP-OCRv5_mobile_rec_infer.tar',
].sort())
assert.ok(assets.every((asset) => asset.gcsUri.startsWith(ocrRuntimeConfig.modelGcsPath)))
assert.ok(assets.every((asset) => asset.expectedSha256.length === 64))

const fixtureManifest = buildOcrGeneratedFixtureManifest('2026-05-30T00:00:00.000Z')
assert.equal(fixtureManifest.generatedOnly, true)
assert.equal(fixtureManifest.fixtureCount, 6)
assert.deepEqual(ocrGeneratedFixtureSpecs.map((fixture) => fixture.fixtureId), [
  'basic-ui-text',
  'caption-safe-zone-conflict',
  'multi-region-ui',
  'low-contrast-warning',
  'small-text-warning',
  'rotated-text-blocked-or-warning',
])
assert.equal(ocrGeneratedFixtureSpecs.filter((fixture) => fixture.riskCategory === 'required_pass').length, 3)
assert.equal(ocrGeneratedFixtureSpecs.find((fixture) => fixture.fixtureId === 'rotated-text-blocked-or-warning')?.riskCategory, 'orientation_deferred')

const staticPlan = validateOcrRuntimeStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'generated_ui_text_frame',
  modelGcsPath: ocrRuntimeConfig.modelGcsPath,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateOcrRuntimeStaticPlan({ modelGcsPath: 'gs://wrong/path/' }).blockers.length > 0)

const executionEnv = validateOcrRuntimeExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  privateGcsReadConfirmation: 'true',
  runtimeExecuteConfirmation: 'true',
  artifactUploadConfirmation: 'true',
  runtimeMode: 'generated_ui_text_frame',
  modelGcsPath: ocrRuntimeConfig.modelGcsPath,
  aggregateSha256: ocrRuntimeConfig.aggregateSha256,
  generatedFixturesOnly: 'true',
  realMediaInputEnabled: 'false',
  providerExecutionEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
  publicOutputEnabled: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateOcrRuntimeExecutionEnv({ runtimeExecuteConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true')))
assert.ok(validateOcrRuntimeExecutionEnv({ privateGcsReadConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ=true')))
assert.ok(validateOcrRuntimeExecutionEnv({ artifactUploadConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true')))
assert.ok(validateOcrRuntimeExecutionEnv({ productionReady: 'true' }).blockers.some((blocker) => blocker.includes('Production-ready')))
assert.ok(validateOcrRuntimeExecutionEnv({ externalBetaReady: 'true' }).blockers.some((blocker) => blocker.includes('External beta')))
assert.ok(validateOcrRuntimeExecutionEnv({ publicOutputEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Public output')))

const commands = buildOcrRuntimeCommandPlans({ runId: 'phase37c-20260530T120000' })
assert.ok(commands.some((command) => command.commandId === 'ocr_runtime_preflight'))
assert.ok(commands.some((command) => command.phase === 'model-copy'))
assert.ok(commands.some((command) => command.phase === 'execute'))
assert.ok(commands.some((command) => command.phase === 'upload'))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.filter((command) => command.phase === 'model-copy').every((command) => command.confirmationEnvVar === 'REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ'))
assert.ok(commands.find((command) => command.phase === 'execute')?.confirmationEnvVar === 'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE')
assert.ok(commands.find((command) => command.phase === 'upload')?.confirmationEnvVar === 'REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD')
assert.ok(commands.every((command) => !/allUsers|allAuthenticatedUsers|signed-url|gcloud\s+run|deploy|docker\s+push|--push|gpu/i.test(command.commandString)))

const iamPlan = buildOcrRuntimeIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((plan) => plan.required === false))
assert.ok(iamPlan.every((plan) => plan.commandString.includes('gcloud storage buckets add-iam-policy-binding')))

const plan = buildOcrRuntimePlan('2026-05-30T00:00:00.000Z')
assert.equal(plan.phase, '37C')
assert.equal(plan.fixtureIds.length, 6)
assert.equal(plan.doesNotDo.realMediaOcr, false)
assert.equal(plan.doesNotDo.production, false)

assert.equal(phase37COcrRuntimeArtifactPrefix('phase37c-20260530T120000'), 'activation/phase37c/generated-ocr-runtime/phase37c-20260530T120000')
assert.throws(() => phase37COcrRuntimeArtifactPrefix('../unsafe'))
assert.ok(OCR_RUNTIME_BLOCKED_SCOPES.includes('Track A work'))
assert.equal(OCR_RUNTIME_EXPECTED_ARTIFACTS.length, 9)

const evidence = getApprovedOcrRuntimeEvidence()
assert.equal(evidence.phase, '37C')
assert.equal(evidence.status, 'verified')
assert.equal(evidence.runId, 'phase37c-20260530T230413')
assert.equal(evidence.blockers.length, 0)
assert.equal(evidence.phase37DReadiness.readyForControlledRealVideoOcrSafeZone, true)

const report = buildOcrRuntimeReport({ createdAt: '2026-05-30T00:00:00.000Z' })
assert.equal(report.status, 'verified')
assert.equal(report.ocrRuntimeVerified, true)
assert.equal(report.generatedFixturesOnly, true)
assert.equal(report.realMediaOcrAllowed, false)
assert.equal(report.realVideoOcrAllowed, false)
assert.equal(report.captionRenderIntegrationAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.publicOutputAllowed, false)
assert.equal(report.signedUrlSourceOfTruthAllowed, false)
assert.equal(report.cloudRunDeployAllowed, false)
assert.equal(report.gpuJobAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.internalBetaAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.trackAAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:ocr-runtime:plan'], 'tsx server/cli/activation-ocr-runtime-plan.ts')
assert.equal(packageJson.scripts['activation:ocr-runtime'], 'tsx server/cli/activation-ocr-runtime.ts')
assert.equal(packageJson.scripts['activation:ocr-runtime:report'], 'tsx server/cli/activation-ocr-runtime-report.ts')
assert.equal(packageJson.scripts['activation:ocr-runtime:iam-plan'], 'tsx server/cli/activation-ocr-runtime-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-ocr-runtime'], 'tsx server/smoke/activation-ocr-runtime-smoke.ts')
assert.equal(packageJson.scripts['build:staging-ocr-runtime-worker'], 'tsx server/cli/activation-ocr-runtime.ts --docker-build-plan')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase37b_verified_ppocrv5_assets_only',
    'generated_fixture_registry',
    'runtime_confirmations_required',
    'textline_orientation_deferred',
    'iam_plan_text_only',
    'command_plan_no_deploy_push_gpu',
    'blocked_real_media_beta_production_track_a',
    'package_scripts',
  ],
  status: report.status,
}))
