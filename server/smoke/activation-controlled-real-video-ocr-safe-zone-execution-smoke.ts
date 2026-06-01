import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  CONTROLLED_REAL_VIDEO_OCR_EXECUTION_BLOCKED_SCOPES,
  CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS,
  buildControlledRealVideoCaptionCandidateZones,
  buildControlledRealVideoOcrExecutionEvidenceReport,
  buildControlledRealVideoOcrExecutionPlan,
  controlledRealVideoOcrExecutionConfig,
  getApprovedControlledRealVideoOcrExecutionEvidence,
  phase37DControlledRealVideoOcrExecutionArtifactPrefix,
  validateControlledRealVideoOcrExecutionEnv,
} from '../activation/controlled-real-video-ocr-safe-zone'

assert.equal(controlledRealVideoOcrExecutionConfig.phase, '37D')
assert.equal(controlledRealVideoOcrExecutionConfig.projectId, 'reeditpro')
assert.equal(controlledRealVideoOcrExecutionConfig.region, 'us-central1')
assert.equal(controlledRealVideoOcrExecutionConfig.env, 'staging')
assert.equal(controlledRealVideoOcrExecutionConfig.mode, 'controlled_real_video_safe_zone_execution')
assert.equal(controlledRealVideoOcrExecutionConfig.expectedFrameCount, 6)
assert.equal(controlledRealVideoOcrExecutionConfig.sourceObjectSizeBytes, 94522751)
assert.equal(controlledRealVideoOcrExecutionConfig.sourceContentType, 'video/mp4')

assert.equal(CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS.length, 10)
assert.ok(CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS.includes('phase_37d_frame_extraction_manifest.json'))
assert.ok(CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS.includes('phase_37d_caption_collision_report.json'))
assert.ok(CONTROLLED_REAL_VIDEO_OCR_EXECUTION_BLOCKED_SCOPES.includes('Phase 37E caption/render QA integration'))
assert.ok(CONTROLLED_REAL_VIDEO_OCR_EXECUTION_BLOCKED_SCOPES.includes('Track A execution code'))
assert.equal(phase37DControlledRealVideoOcrExecutionArtifactPrefix('phase37d-20260530T120000'), 'activation/phase37d/controlled-real-video-ocr-safe-zone/phase37d-20260530T120000')
assert.throws(() => phase37DControlledRealVideoOcrExecutionArtifactPrefix('phase37d/unsafe'))

const plan = buildControlledRealVideoOcrExecutionPlan('2026-05-30T00:00:00.000Z')
assert.equal(plan.phase, '37D')
assert.equal(plan.executionScope, 'one_approved_private_sample')
assert.equal(plan.sample.sampleId, 'phase37d-phase32-color-export-safe-zone-window-v1')
assert.equal(plan.sample.controlledChainId, 'controlled-real-video-chain-phase28-through-phase32-v1')
assert.equal(plan.sample.sourceGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.deepEqual(plan.sample.frameOffsetsSeconds, [6.9, 7.3, 7.7, 8.1, 8.5, 8.9])
assert.equal(plan.frameExtraction.engine, 'opencv')
assert.equal(plan.frameExtraction.ffmpegRequired, false)
assert.equal(plan.ocrRuntime.cpuOnly, true)
assert.equal(plan.ocrRuntime.networkAndModelDownloadGuardRequired, true)
assert.equal(plan.artifactPolicy.privateJsonOnly, true)
assert.equal(plan.artifactPolicy.rawFramesUploaded, false)
assert.equal(plan.artifactPolicy.overlaysUploaded, false)

const zones = buildControlledRealVideoCaptionCandidateZones()
assert.equal(zones.length, 3)
assert.equal(zones[0].zoneId, 'vertical_lower_caption_safe_zone')
assert.equal(zones[0].candidatePriority, 1)

const allowedEnv = validateControlledRealVideoOcrExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  sourceGcsUri: plan.sample.sourceGcsUri,
  ocrExecuteConfirmation: 'true',
  frameExtractionConfirmation: 'true',
  artifactUploadConfirmation: 'true',
  privateGcsReadConfirmation: 'true',
  runtimeExecuteConfirmation: 'true',
  arbitraryMediaEnabled: 'false',
  broadRealMediaReady: 'false',
  providerExecutionEnabled: 'false',
  publicOutputEnabled: 'false',
  signedUrlSourceOfTruthEnabled: 'false',
  trackAExecutionEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
})
assert.equal(allowedEnv.allowed, true)
assert.ok(validateControlledRealVideoOcrExecutionEnv({ sourceGcsUri: 'gs://other-bucket/video.mp4' }).blockers.some((blocker) => blocker.includes('Only the Phase 37D')))
assert.ok(validateControlledRealVideoOcrExecutionEnv({ ocrExecuteConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('OCR_EXECUTE')))
assert.ok(validateControlledRealVideoOcrExecutionEnv({ frameExtractionConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('FRAME_EXTRACTION')))
assert.ok(validateControlledRealVideoOcrExecutionEnv({ artifactUploadConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('ARTIFACT_UPLOAD')))
assert.ok(validateControlledRealVideoOcrExecutionEnv({ trackAExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Track A')))

const evidence = getApprovedControlledRealVideoOcrExecutionEvidence()
assert.equal(evidence.phase, '37D')
assert.ok(['not_started', 'passed', 'blocked'].includes(evidence.status))
assert.equal(evidence.sampleId, plan.sample.sampleId)
assert.deepEqual(evidence.frameOffsetsSeconds, plan.sample.frameOffsetsSeconds)
assert.equal(evidence.modelAggregateSha256, '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b')
assert.equal(evidence.phase37EReadiness.readyForControlledCaptionRenderQaPlanning, evidence.status === 'passed')
assert.equal(evidence.blockers.includes('phase37d_controlled_real_video_ocr_execution_not_run'), evidence.status === 'not_started')

const report = buildControlledRealVideoOcrExecutionEvidenceReport('2026-05-30T00:00:00.000Z')
assert.equal(report.reportId, 'activation-phase-37d-controlled-real-video-ocr-safe-zone-execution')
assert.equal(report.executionEvidence.sampleId, plan.sample.sampleId)
assert.equal(report.safety.rawFramesCommitted, false)
assert.equal(report.safety.rawFramesUploaded, false)
assert.equal(report.safety.overlaysUploaded, false)
assert.equal(report.safety.modelFilesCommitted, false)
assert.equal(report.safety.videoCommitted, false)
assert.equal(report.safety.credentialsCommitted, false)
assert.equal(report.safety.trackATouched, false)
assert.equal(report.safety.betaAllowed, false)
assert.equal(report.safety.productionAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:controlled-real-video-ocr-safe-zone:execute'], 'tsx server/cli/activation-controlled-real-video-ocr-safe-zone-execute.ts')
assert.equal(packageJson.scripts['activation:controlled-real-video-ocr-safe-zone:execution-report'], 'tsx server/cli/activation-controlled-real-video-ocr-safe-zone-execution-report.ts')
assert.equal(packageJson.scripts['smoke:activation-controlled-real-video-ocr-safe-zone-execution'], 'tsx server/smoke/activation-controlled-real-video-ocr-safe-zone-execution-smoke.ts')

assert.equal(existsSync(new URL('../workers/ocr-runtime/run-controlled-real-video-ocr-safe-zone.py', import.meta.url)), true)
const moduleDir = new URL('../activation/controlled-real-video-ocr-safe-zone/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"]\.\.\/(?:real-video-mask|real-video-sam2-temporal-mask|segment-text-behind-subject-preview|real-video-enhancement-sample|sam2-runtime|mask-runtime|text-behind-subject-frame|enhancement-runtime)['"]/.test(moduleSource), false)
assert.equal(/docker\s+(?:build|push)|gcloud\s+run\s+deploy|gcloud\s+run\s+jobs\s+execute/.test(moduleSource), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase37d_execution_policy',
    'single_approved_private_sample',
    'opencv_frame_extraction_plan',
    'cpu_paddleocr_local_model_guard',
    'private_json_artifact_policy',
    'safe_committed_evidence_shape',
    'phase37e_beta_production_track_a_blocked',
  ],
  status: evidence.status,
}))
