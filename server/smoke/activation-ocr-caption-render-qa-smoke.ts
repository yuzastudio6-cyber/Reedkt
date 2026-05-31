import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES,
  OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS,
  buildOcrCaptionRenderQaCandidateZoneReport,
  buildOcrCaptionRenderQaCaptionConstraintManifest,
  buildOcrCaptionRenderQaCommandPlans,
  buildOcrCaptionRenderQaGeneratedFixtures,
  buildOcrCaptionRenderQaIamPlan,
  buildOcrCaptionRenderQaNormalizationReport,
  buildOcrCaptionRenderQaPlan,
  buildOcrCaptionRenderQaReport,
  getApprovedOcrCaptionRenderQaEvidence,
  ocrCaptionRenderQaConfig,
  phase37EOcrCaptionRenderQaArtifactPrefix,
  validateOcrCaptionRenderQaEnv,
} from '../activation/ocr-caption-render-qa'
import { getApprovedControlledRealVideoOcrExecutionEvidence } from '../activation/controlled-real-video-ocr-safe-zone'
import { getApprovedOcrRuntimeEvidence } from '../activation/ocr-runtime'

assert.equal(ocrCaptionRenderQaConfig.phase, '37E')
assert.equal(ocrCaptionRenderQaConfig.projectId, 'reeditpro')
assert.equal(ocrCaptionRenderQaConfig.region, 'us-central1')
assert.equal(ocrCaptionRenderQaConfig.env, 'staging')
assert.equal(ocrCaptionRenderQaConfig.padding, 0.025)
assert.equal(ocrCaptionRenderQaConfig.warningOverlapRatio, 0.1)
assert.equal(ocrCaptionRenderQaConfig.blockingOverlapRatio, 0.2)
assert.equal(OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS.length, 10)
assert.ok(OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS.includes('phase_37e_caption_overlap_qa_report.json'))
assert.ok(OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS.includes('phase_37e_render_qa_compatibility_manifest.json'))
assert.ok(OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES.includes('OCR runtime execution'))
assert.ok(OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES.includes('Track A execution/runtime code'))
assert.equal(phase37EOcrCaptionRenderQaArtifactPrefix('phase37e-20260531T010203'), 'activation/phase37e/ocr-caption-render-qa/phase37e-20260531T010203')
assert.throws(() => phase37EOcrCaptionRenderQaArtifactPrefix('phase37e/unsafe'))

const phase37C = getApprovedOcrRuntimeEvidence()
assert.equal(phase37C.status, 'verified')
assert.equal(phase37C.phase37DReadiness.readyForControlledRealVideoOcrSafeZone, true)
const phase37D = getApprovedControlledRealVideoOcrExecutionEvidence()
assert.equal(phase37D.status, 'passed')
assert.equal(phase37D.phase37EReadiness.readyForControlledCaptionRenderQaPlanning, true)

const envAllowed = validateOcrCaptionRenderQaEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  executeConfirmation: 'true',
  privateArtifactReadConfirmation: 'true',
  privateArtifactUploadConfirmation: 'true',
  ocrRuntimeExecuteConfirmation: 'false',
  controlledRealVideoOcrExecuteConfirmation: 'false',
  controlledRealVideoFrameExtractionConfirmation: 'false',
  arbitraryMediaEnabled: 'false',
  publicOutputEnabled: 'false',
  signedUrlSourceOfTruthEnabled: 'false',
  trackAExecutionEnabled: 'false',
  productionReady: 'false',
  internalBetaReady: 'false',
  externalBetaReady: 'false',
  requireExecutionConfirmations: true,
})
assert.equal(envAllowed.allowed, true)
assert.ok(validateOcrCaptionRenderQaEnv({ inputArtifactUri: 'https://example.test/report.json' }).blockers.some((blocker) => blocker.includes('private gs://')))
assert.ok(validateOcrCaptionRenderQaEnv({ inputArtifactUri: `${phase37D.artifactPrefix}phase_37d_caption_collision_report.json?X-Goog-Signature=abc` }).blockers.some((blocker) => blocker.includes('Signed URL')))
assert.ok(validateOcrCaptionRenderQaEnv({ ocrRuntimeExecuteConfirmation: 'true' }).blockers.some((blocker) => blocker.includes('OCR runtime')))
assert.ok(validateOcrCaptionRenderQaEnv({ trackAExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Track A')))

const plan = buildOcrCaptionRenderQaPlan('2026-05-31T00:00:00.000Z')
assert.equal(plan.phase, '37E')
assert.equal(plan.safety.ocrRuntimeExecuted, false)
assert.equal(plan.safety.frameExtractionPerformed, false)
assert.equal(plan.safety.renderExecuted, false)
assert.equal(plan.safety.trackAImported, false)
assert.equal(plan.candidateZones.length, 3)

const fixtures = buildOcrCaptionRenderQaGeneratedFixtures()
assert.equal(fixtures.length, 3)
const normalizationReport = buildOcrCaptionRenderQaNormalizationReport({
  runId: 'phase37e-smoke',
  fixtures,
})
assert.equal(normalizationReport.invalidRegionCount, 0)
const constraintManifest = buildOcrCaptionRenderQaCaptionConstraintManifest('phase37e-smoke')
assert.equal(constraintManifest.candidateZones.length, 3)
const candidateReport = buildOcrCaptionRenderQaCandidateZoneReport({
  runId: 'phase37e-smoke',
  normalizationReport,
})
assert.equal(candidateReport.evaluations.find((evaluation) => evaluation.fixtureId === 'generated-lower-third-conflict')?.lowerThirdCollisionFrames, 1)
assert.equal(candidateReport.evaluations.find((evaluation) => evaluation.fixtureId === 'generated-no-conflict')?.status, 'passed')
assert.equal(candidateReport.evaluations.find((evaluation) => evaluation.fixtureId === 'generated-multi-region-crowded')?.status, 'manual_review')

const report = await buildOcrCaptionRenderQaReport({ createdAt: '2026-05-31T00:00:00.000Z' })
assert.equal(report.phase, '37E')
assert.equal(report.safety.metadataOnly, true)
assert.equal(report.safety.ocrRuntimeExecuted, false)
assert.equal(report.safety.frameExtractionPerformed, false)
assert.equal(report.safety.renderExecuted, false)
assert.equal(report.safety.trackATouched, false)
assert.equal(report.safety.betaAllowed, false)
assert.equal(report.safety.productionAllowed, false)
assert.equal(report.normalizationReport.controlledTextRedacted, true)
assert.equal(report.overlapQaReport.blockedGuardFixturesPassed.length, 6)

const iamPlan = buildOcrCaptionRenderQaIamPlan('2026-05-31T00:00:00.000Z')
assert.equal(iamPlan.iamMutationAllowed, false)
const commandPlans = buildOcrCaptionRenderQaCommandPlans()
assert.equal(commandPlans.scripts.execute, 'npm run activation:ocr-caption-render-qa -- --execute --keep-temp')

const evidence = getApprovedOcrCaptionRenderQaEvidence()
assert.equal(evidence.phase, '37E')
assert.ok(['not_started', 'passed', 'blocked'].includes(evidence.status))
assert.equal(evidence.phase37CRunId, 'phase37c-20260530T230413')
assert.equal(evidence.phase37DRunId, 'phase37d-20260531T002046')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:ocr-caption-render-qa:plan'], 'tsx server/cli/activation-ocr-caption-render-qa-plan.ts')
assert.equal(packageJson.scripts['activation:ocr-caption-render-qa'], 'tsx server/cli/activation-ocr-caption-render-qa.ts')
assert.equal(packageJson.scripts['activation:ocr-caption-render-qa:report'], 'tsx server/cli/activation-ocr-caption-render-qa-report.ts')
assert.equal(packageJson.scripts['activation:ocr-caption-render-qa:iam-plan'], 'tsx server/cli/activation-ocr-caption-render-qa-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-ocr-caption-render-qa'], 'tsx server/smoke/activation-ocr-caption-render-qa-smoke.ts')

assert.equal(existsSync(new URL('../activation/ocr-caption-render-qa/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/ocr-caption-render-qa/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"].*workers\/(?:render|final-render|captions)/.test(moduleSource), false)
assert.equal(/from\s+['"]\.\.\/(?:real-video-mask|real-video-sam2-temporal-mask|segment-text-behind-subject-preview|real-video-enhancement-sample|sam2-runtime|mask-runtime|text-behind-subject-frame|enhancement-runtime)['"]/.test(moduleSource), false)
assert.equal(/docker\s+(?:build|push)|gcloud\s+run\s+deploy|gcloud\s+run\s+jobs\s+execute/.test(moduleSource), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase37e_policy',
    'phase37c_phase37d_evidence',
    'metadata_only_collision_fixtures',
    'blocked_guard_fixtures',
    'private_json_artifact_policy',
    'render_handoff_without_track_a',
    'beta_production_blocked',
  ],
  status: evidence.status,
}))
