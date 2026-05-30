import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildSegmentTextBehindSubjectPreviewCommandPlans,
  buildSegmentTextBehindSubjectPreviewCompositionPlan,
  buildSegmentTextBehindSubjectPreviewIamPlan,
  buildSegmentTextBehindSubjectPreviewReport,
  segmentTextBehindSubjectPreviewConfig,
  validateSegmentTextBehindSubjectPreviewExecutionEnv,
} from '../activation/segment-text-behind-subject-preview'
import type { SegmentTextBehindSubjectPreviewExecutionReport } from '../activation/segment-text-behind-subject-preview'

const sampleFrameUris = Array.from({ length: 10 }, (_, index) => `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-smoke/segment/frames/frame-${String(index + 1).padStart(3, '0')}.png`)
const sampleMaskUris = Array.from({ length: 10 }, (_, index) => `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-smoke/masks/frame-${String(index).padStart(3, '0')}-mask.png`)
const samplePreviewUris = Array.from({ length: 10 }, (_, index) => `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35e/phase35e-smoke/preview-frames/frame-${String(index).padStart(3, '0')}-preview.png`)

const sampleExecution: SegmentTextBehindSubjectPreviewExecutionReport = {
  ok: true,
  runId: 'phase35e-smoke',
  projectId: 'reeditpro',
  source: {
    phase35DRunId: 'phase35d-20260530T004442',
    inputVideoGcsUri: segmentTextBehindSubjectPreviewConfig.approvedInputVideoGcsUri,
    generatedAssetsPrefix: segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix,
    masksPrefix: segmentTextBehindSubjectPreviewConfig.masksInputPrefix,
    qaReportUri: `${segmentTextBehindSubjectPreviewConfig.qaInputPrefix}reports/phase35d-report.json`,
  },
  segment: {
    startSeconds: 6.9,
    endSeconds: 8.9,
    durationSeconds: 2,
    frameCount: 10,
    width: 768,
    height: 432,
    fps: 5,
    frameUris: sampleFrameUris,
    maskUris: sampleMaskUris,
    segmentManifestUri: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}segment/segment-manifest.json`,
    maskMetadataUri: `${segmentTextBehindSubjectPreviewConfig.masksInputPrefix}metadata/mask-sequence-metadata.json`,
    promptMetadataUri: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}prompt/prompt-metadata.json`,
  },
  textLayerPlan: buildSegmentTextBehindSubjectPreviewCompositionPlan(),
  composition: {
    method: 'native_node_png_alpha_composite',
    previewFrameUris: samplePreviewUris,
    previewClipGenerated: false,
    compositionManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/phase35e-smoke/composition/composition-manifest.json',
    sourceFrameMaskMapUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/phase35e-smoke/metadata/source-frame-mask-map.json',
    textStyleUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/phase35e-smoke/metadata/text-style.json',
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'source_integrity', status: 'passed', summary: 'Approved Phase 35D source only.' },
      { gateId: 'segment_bounds', status: 'passed', summary: 'Bounded segment.' },
      { gateId: 'mask_integrity', status: 'passed', summary: 'Masks matched frames.' },
      { gateId: 'composition_artifacts', status: 'passed', summary: 'Preview frames exist.' },
      { gateId: 'behind_subject_effect', status: 'warning', summary: 'Human review remains required.' },
      { gateId: 'temporal_preview_consistency', status: 'warning', summary: 'Human review remains required.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Private prefixes only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'Blocked features remained blocked.' },
    ],
    blockers: [],
    warnings: ['Human visual review remains required.'],
  },
  artifacts: [],
  safety: {
    approvedPhase35DRunOnly: true,
    approvedFrameMaskManifestsOnly: true,
    arbitraryRealUserMediaUsed: false,
    fullVideoMaskExecuted: false,
    fullVideoTextBehindSubjectExecuted: false,
    finalExportCreated: false,
    providerExecuted: false,
    modelDownloaded: false,
    realEsrganUsed: false,
    revideoUsed: false,
    filmUsed: false,
    slowMotionExecuted: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  },
  uploadedReport: {
    bucket: segmentTextBehindSubjectPreviewConfig.qaBucket,
    object: 'activation-real-video/phase35e/phase35e-smoke/reports/phase35e-report.json',
    gcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35e/phase35e-smoke/reports/phase35e-report.json',
  },
  blockers: [],
  warnings: ['Human visual review remains required.'],
}

assert.equal(segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId, 'phase35d-20260530T004442')
assert.equal(segmentTextBehindSubjectPreviewConfig.approvedSegmentDurationSeconds, 2)
assert.equal(segmentTextBehindSubjectPreviewConfig.approvedFrameCount, 10)
assert.equal(segmentTextBehindSubjectPreviewConfig.approvedFrameWidth, 768)
assert.equal(segmentTextBehindSubjectPreviewConfig.approvedFrameHeight, 432)
assert.equal(segmentTextBehindSubjectPreviewConfig.approvedText, 'REEDITPRO')
assert.equal(segmentTextBehindSubjectPreviewConfig.outputPreviewPrefix, 'gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35e/')
assert.equal(segmentTextBehindSubjectPreviewConfig.fullVideoTextBehindSubjectAllowed, false)
assert.equal(segmentTextBehindSubjectPreviewConfig.fullVideoMaskAllowed, false)
assert.equal(segmentTextBehindSubjectPreviewConfig.finalExportAllowed, false)
assert.equal(segmentTextBehindSubjectPreviewConfig.providerAllowed, false)
assert.equal(segmentTextBehindSubjectPreviewConfig.revideoAllowed, false)
assert.equal(segmentTextBehindSubjectPreviewConfig.filmAllowed, false)
assert.equal(segmentTextBehindSubjectPreviewConfig.slowMotionAllowed, false)

const env = validateSegmentTextBehindSubjectPreviewExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  phase35DRunId: 'phase35d-20260530T004442',
  text: 'REEDITPRO',
  segmentDurationSeconds: 2,
  frameCount: 10,
  generatedAssetsInputPrefix: segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix,
  masksInputPrefix: segmentTextBehindSubjectPreviewConfig.masksInputPrefix,
  qaInputPrefix: segmentTextBehindSubjectPreviewConfig.qaInputPrefix,
  outputPreviewPrefix: segmentTextBehindSubjectPreviewConfig.outputPreviewPrefix,
  outputGeneratedAssetsPrefix: segmentTextBehindSubjectPreviewConfig.outputGeneratedAssetsPrefix,
  outputQaPrefix: segmentTextBehindSubjectPreviewConfig.outputQaPrefix,
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  productionReady: 'false',
  externalBeta: 'false',
  broadRealMedia: 'false',
  fullVideoTextBehindSubjectEnabled: 'false',
  fullVideoMaskEnabled: 'false',
  finalExportEnabled: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateSegmentTextBehindSubjectPreviewExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_SEGMENT_TEXT_BEHIND_SUBJECT_PREVIEW=true')))
assert.ok(validateSegmentTextBehindSubjectPreviewExecutionEnv({ phase35DRunId: 'phase35d-wrong' }).blockers.length > 0)
assert.ok(validateSegmentTextBehindSubjectPreviewExecutionEnv({ text: 'other text' }).blockers.length > 0)
assert.ok(validateSegmentTextBehindSubjectPreviewExecutionEnv({ frameCount: 11 }).blockers.length > 0)
assert.ok(validateSegmentTextBehindSubjectPreviewExecutionEnv({ fullVideoTextBehindSubjectEnabled: 'true' }).blockers.length > 0)

const compositionPlan = buildSegmentTextBehindSubjectPreviewCompositionPlan()
assert.equal(compositionPlan.renderer, 'native_node_png_compositor')
assert.equal(compositionPlan.previewClipStrategy, 'not_generated_no_local_ffmpeg_required')
assert.equal(compositionPlan.behindSubject, true)
assert.deepEqual(compositionPlan.layerOrder, ['source_frame', 'text_layer', 'subject_from_phase35d_mask'])

const iamPlan = buildSegmentTextBehindSubjectPreviewIamPlan()
assert.ok(iamPlan.length >= 6)
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((plan) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/i.test(plan.commandString)))

const commands = buildSegmentTextBehindSubjectPreviewCommandPlans('phase35e-smoke')
assert.ok(commands.some((command) => command.commandId === 'execute-local-segment-preview'))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.every((command) => !/allUsers|allAuthenticatedUsers|PROVIDER_EXECUTION_ENABLED=true|FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED=true|FULL_VIDEO_MASK_ENABLED=true|FINAL_EXPORT_ENABLED=true|REEDITPRO_PRODUCTION_READY=true|revideo|film|slow.motion/i.test(command.commandString)))

const report = buildSegmentTextBehindSubjectPreviewReport({ executionReport: sampleExecution, runId: 'phase35e-smoke' })
assert.equal(report.status, 'ready')
assert.equal(report.segmentTextBehindSubjectPreviewCompleted, true)
assert.equal(report.phase36AReadiness.readyForAudioAiApprovalWorkflow, true)
assert.equal(report.segmentTextBehindSubjectAllowed, true)
assert.equal(report.fullVideoTextBehindSubjectAllowed, false)
assert.equal(report.fullVideoMaskAllowed, false)
assert.equal(report.finalExportAllowed, false)
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
  'mask_integrity',
  'composition_artifacts',
  'behind_subject_effect',
  'temporal_preview_consistency',
  'artifact_privacy',
  'blocked_features',
])

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:segment-text-behind-subject-preview'], 'tsx server/cli/activation-segment-text-behind-subject-preview.ts')
assert.equal(packageJson.scripts['activation:segment-text-behind-subject-preview:report'], 'tsx server/cli/activation-segment-text-behind-subject-preview-report.ts')
assert.equal(packageJson.scripts['activation:segment-text-behind-subject-preview:iam-plan'], 'tsx server/cli/activation-segment-text-behind-subject-preview-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-segment-text-behind-subject-preview'], 'tsx server/smoke/activation-segment-text-behind-subject-preview-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase35d_source_locked',
    'bounded_segment_limits',
    'fixed_reeditpro_text',
    'private_artifact_prefixes',
    'qa_gates',
    'phase36a_readiness',
    'blocked_full_video_final_export_provider_revideo_film_slow_motion',
    'package_scripts',
  ],
}))
