import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import {
  CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_BLOCKED_SCOPES,
  CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_EXPECTED_ARTIFACTS,
  buildControlledRealVideoOcrSafeZoneCommandPlans,
  buildControlledRealVideoOcrSafeZoneFrameSamplingManifest,
  buildControlledRealVideoOcrSafeZoneFutureArtifactSchemas,
  buildControlledRealVideoOcrSafeZoneIamPlan,
  buildControlledRealVideoOcrSafeZonePlan,
  buildControlledRealVideoOcrSafeZoneReport,
  buildControlledRealVideoOcrSafeZoneSampleManifest,
  controlledRealVideoOcrSafeZoneConfig,
  getApprovedControlledRealVideoChainEvidence,
  getControlledRealVideoOcrSafeZoneSampleCandidates,
  phase37DControlledRealVideoOcrSafeZoneArtifactPrefix,
  validateControlledRealVideoOcrSafeZonePlanningEnv,
  validateControlledRealVideoOcrSafeZoneStaticPlan,
} from '../activation/controlled-real-video-ocr-safe-zone'

assert.equal(controlledRealVideoOcrSafeZoneConfig.phase, '37D')
assert.equal(controlledRealVideoOcrSafeZoneConfig.projectId, 'reeditpro')
assert.equal(controlledRealVideoOcrSafeZoneConfig.region, 'us-central1')
assert.equal(controlledRealVideoOcrSafeZoneConfig.env, 'staging')
assert.equal(controlledRealVideoOcrSafeZoneConfig.mode, 'metadata_only_planning_gate')
assert.equal(controlledRealVideoOcrSafeZoneConfig.finalExportsBucket, 'reeditpro-staging-reeditpro-final-exports')
assert.equal(controlledRealVideoOcrSafeZoneConfig.qaBucket, 'reeditpro-staging-reeditpro-qa-artifacts')
assert.equal(controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(controlledRealVideoOcrSafeZoneConfig.selectedSourceSha256, '78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa')
assert.deepEqual([...controlledRealVideoOcrSafeZoneConfig.selectedFrameOffsetsSeconds], [6.9, 7.3, 7.7, 8.1, 8.5, 8.9])
assert.equal(controlledRealVideoOcrSafeZoneConfig.maxSampledFrames, 12)
assert.equal(controlledRealVideoOcrSafeZoneConfig.selectedMaxSampledFrames, 6)

const chain = getApprovedControlledRealVideoChainEvidence()
assert.equal(chain.status, 'approved_for_phase37d_metadata_gate')
assert.equal(chain.phaseRunIds.phase28, 'phase28-20260528T01552')
assert.equal(chain.phaseRunIds.phase29, 'phase29-20260528T02254')
assert.equal(chain.phaseRunIds.phase30, 'phase30-20260528T12421')
assert.equal(chain.phaseRunIds.phase31, 'phase31-20260528T13060')
assert.equal(chain.phaseRunIds.phase32, 'phase32-20260528T13330')
assert.equal(chain.phase32Export.privateOnly, true)
assert.equal(chain.phase32Export.publicUrlCreated, false)
assert.equal(chain.phase32Export.signedUrlSourceOfTruthCreated, false)
assert.equal(chain.phase37BAssets.aggregateSha256, '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b')
assert.equal(chain.phase37CRuntime.runId, 'phase37c-20260530T230413')
assert.equal(chain.phase37CRuntime.readyForControlledRealVideoOcrSafeZone, true)
assert.equal(chain.phase37CRuntime.dictionaryPathLimitationCarriedForward, true)
assert.equal(chain.trackAReferencesAreMetadataOnly, true)
assert.equal(chain.blockers.length, 0)
assert.ok(chain.warnings.some((warning) => warning.includes('dictionary-path')))

const sampleCandidates = getControlledRealVideoOcrSafeZoneSampleCandidates()
assert.equal(sampleCandidates.length, 1)
const sample = sampleCandidates[0]
assert.equal(sample.sampleId, 'phase37d-phase32-color-export-safe-zone-window-v1')
assert.equal(sample.selected, true)
assert.equal(sample.privateGcsSourceOnly, true)
assert.equal(sample.mediaBytesRead, false)
assert.equal(sample.frameExtractionPerformed, false)
assert.equal(sample.realVideoOcrPerformed, false)
assert.equal(sample.artifactUploadPerformed, false)
assert.equal(sample.captionRenderIntegrationPerformed, false)
assert.equal(sample.plannedWindow.startSeconds, 6.9)
assert.equal(sample.plannedWindow.endSeconds, 8.9)
assert.equal(sample.plannedWindow.durationSeconds, 2)
assert.equal(sample.plannedFrameOffsetsSeconds.length, 6)
assert.ok(sample.plannedFrameOffsetsSeconds.every((offset) => offset >= 6.9 && offset <= 8.9))
assert.equal(sample.blockers.length, 0)

const staticPlan = validateControlledRealVideoOcrSafeZoneStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'metadata_only_planning_gate',
  sourceGcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
  selectedSamples: sampleCandidates,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateControlledRealVideoOcrSafeZoneStaticPlan({ sourceGcsUri: 'https://example.com/video.mp4' }).blockers.length > 0)
assert.ok(validateControlledRealVideoOcrSafeZoneStaticPlan({ selectedSamples: [] }).blockers.some((blocker) => blocker.includes('exactly one')))

const planningEnv = validateControlledRealVideoOcrSafeZonePlanningEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'metadata_only_planning_gate',
  sourceGcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
  controlledRealVideoOcrExecuteConfirmation: 'false',
  frameExtractionConfirmation: 'false',
  artifactUploadConfirmation: 'false',
  realMediaInputEnabled: 'false',
  arbitraryMediaEnabled: 'false',
  modelDownloadEnabled: 'false',
  providerExecutionEnabled: 'false',
  trackAExecutionEnabled: 'false',
  publicOutputEnabled: 'false',
  signedUrlSourceOfTruthEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(planningEnv.allowed, true)
assert.ok(validateControlledRealVideoOcrSafeZonePlanningEnv({ controlledRealVideoOcrExecuteConfirmation: 'true' }).blockers.some((blocker) => blocker.includes('must not be true')))
assert.ok(validateControlledRealVideoOcrSafeZonePlanningEnv({ frameExtractionConfirmation: 'true' }).blockers.some((blocker) => blocker.includes('FRAME_EXTRACTION')))
assert.ok(validateControlledRealVideoOcrSafeZonePlanningEnv({ artifactUploadConfirmation: 'true' }).blockers.some((blocker) => blocker.includes('ARTIFACT_UPLOAD')))
assert.ok(validateControlledRealVideoOcrSafeZonePlanningEnv({ trackAExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Track A')))
assert.ok(validateControlledRealVideoOcrSafeZonePlanningEnv({ publicOutputEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Public output')))

const sampleManifest = buildControlledRealVideoOcrSafeZoneSampleManifest('2026-05-30T00:00:00.000Z')
assert.equal(sampleManifest.selectedOnly, true)
assert.equal(sampleManifest.candidates.length, 1)
const frameManifest = buildControlledRealVideoOcrSafeZoneFrameSamplingManifest('2026-05-30T00:00:00.000Z')
assert.equal(frameManifest.metadataOnly, true)
assert.equal(frameManifest.noFrameExtractionPerformed, true)
assert.equal(frameManifest.hardLimits.selectedWindowCount, 1)
assert.equal(frameManifest.hardLimits.maxFramesAcrossAllWindows, 12)

const schemas = buildControlledRealVideoOcrSafeZoneFutureArtifactSchemas()
assert.equal(schemas.length, 4)
assert.ok(schemas.every((schema) => schema.privacy === 'private_qa_artifact_only'))
assert.ok(CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_EXPECTED_ARTIFACTS.includes('phase_37d_future_ocr_text_regions_schema.json'))
assert.equal(CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_EXPECTED_ARTIFACTS.length, 9)

const commands = buildControlledRealVideoOcrSafeZoneCommandPlans({ runId: 'phase37d-20260530T120000' })
assert.ok(commands.some((command) => command.commandId === 'controlled_real_video_ocr_safe_zone_preflight'))
assert.ok(commands.some((command) => command.phase === 'future-execute'))
assert.ok(commands.some((command) => command.phase === 'future-upload'))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.find((command) => command.phase === 'future-execute')?.confirmationEnvVar === 'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE')
assert.ok(commands.find((command) => command.phase === 'future-upload')?.confirmationEnvVar === 'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD')
assert.ok(commands.every((command) => !/gcloud\s+run|docker\s+build|docker\s+push|gcloud\s+storage\s+cp|gsutil\s+cp|--execute/i.test(command.commandString)))
assert.ok(commands.every((command) => !/REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_(OCR_EXECUTE|FRAME_EXTRACTION|ARTIFACT_UPLOAD)=true\s+npm/i.test(command.commandString)))

const iamPlan = buildControlledRealVideoOcrSafeZoneIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((plan) => plan.required === false))
assert.ok(iamPlan.every((plan) => plan.commandString.startsWith('TEXT_ONLY ')))
assert.ok(iamPlan.every((plan) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin/i.test(plan.commandString)))

assert.equal(phase37DControlledRealVideoOcrSafeZoneArtifactPrefix('phase37d-20260530T120000'), 'activation/phase37d/controlled-real-video-ocr-safe-zone/phase37d-20260530T120000')
assert.throws(() => phase37DControlledRealVideoOcrSafeZoneArtifactPrefix('../unsafe'))
assert.ok(CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_BLOCKED_SCOPES.includes('Track A execution code'))
assert.ok(CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_BLOCKED_SCOPES.includes('caption/render QA integration'))

const plan = buildControlledRealVideoOcrSafeZonePlan('2026-05-30T00:00:00.000Z')
assert.equal(plan.phase, '37D')
assert.equal(plan.doesNotDo.realVideoOcr, false)
assert.equal(plan.doesNotDo.frameExtraction, false)
assert.equal(plan.doesNotDo.artifactUpload, false)
assert.equal(plan.doesNotDo.trackA, false)
assert.equal(plan.futureOnlyConfirmationsDoNotSetInPhase37D.length, 3)

const report = buildControlledRealVideoOcrSafeZoneReport({ createdAt: '2026-05-30T00:00:00.000Z' })
assert.equal(report.status, 'passed')
assert.equal(report.phase37DMetadataPlanningPassed, true)
assert.equal(report.phase37EReadiness.readyForCaptionRenderQaIntegration, false)
assert.equal(report.futureExecutionReadiness.readyForControlledRealVideoOcrExecutionPlanning, true)
assert.equal(report.safety.metadataOnlyPlanningGate, true)
assert.equal(report.safety.mediaBytesRead, false)
assert.equal(report.safety.frameExtractionPerformed, false)
assert.equal(report.safety.realVideoOcrPerformed, false)
assert.equal(report.safety.artifactUploadPerformed, false)
assert.equal(report.safety.iamMutated, false)
assert.equal(report.safety.dockerBuilt, false)
assert.equal(report.safety.cloudRunDeployed, false)
assert.equal(report.safety.providerExecuted, false)
assert.equal(report.safety.modelDownloaded, false)
assert.equal(report.safety.publicAccessEnabled, false)
assert.equal(report.safety.signedUrlSourceOfTruthUsed, false)
assert.equal(report.safety.productionReadyAllowed, false)
assert.equal(report.safety.internalBetaAllowed, false)
assert.equal(report.safety.externalBetaAllowed, false)
assert.equal(report.safety.paidProductionAllowed, false)
assert.equal(report.safety.broadRealUserMediaAllowed, false)
assert.equal(report.safety.trackATouched, false)
assert.equal(report.blockers.length, 0)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:controlled-real-video-ocr-safe-zone:plan'], 'tsx server/cli/activation-controlled-real-video-ocr-safe-zone-plan.ts')
assert.equal(packageJson.scripts['activation:controlled-real-video-ocr-safe-zone:report'], 'tsx server/cli/activation-controlled-real-video-ocr-safe-zone-report.ts')
assert.equal(packageJson.scripts['activation:controlled-real-video-ocr-safe-zone:iam-plan'], 'tsx server/cli/activation-controlled-real-video-ocr-safe-zone-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-controlled-real-video-ocr-safe-zone'], 'tsx server/smoke/activation-controlled-real-video-ocr-safe-zone-smoke.ts')

const moduleDir = new URL('../activation/controlled-real-video-ocr-safe-zone/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"]\.\.\/(?:real-video-mask|real-video-sam2-temporal-mask|segment-text-behind-subject-preview|real-video-enhancement-sample|sam2-runtime|mask-runtime|text-behind-subject-frame|enhancement-runtime)['"]/.test(moduleSource), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase37d_metadata_only_gate',
    'approved_phase32_private_source_only',
    'single_bounded_sample_candidate',
    'future_frame_offsets_without_extraction',
    'future_private_artifact_schemas',
    'confirmations_rejected_in_phase37d',
    'iam_plan_text_only',
    'blocked_phase37e_beta_production_track_a',
    'package_scripts',
  ],
  status: report.status,
}))
