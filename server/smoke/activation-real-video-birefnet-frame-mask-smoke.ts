import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBiRefNetFrameCommandPlans,
  buildFrameExtractionCommandPlans,
  buildRealVideoMaskReport,
  realVideoMaskConfig,
  validateRealVideoMaskEnv,
} from '../activation/real-video-mask'
import type { RealVideoBiRefNetFrameMaskReport, RealVideoFrameExtractionReport } from '../activation/real-video-mask'

const runId = 'phase33d-smoke'
const frameReport: RealVideoFrameExtractionReport = {
  ok: true,
  runId,
  sourcePhase32RunId: realVideoMaskConfig.phase32RunId,
  sourceGcsUri: realVideoMaskConfig.sourceGcsUri,
  inputProbe: { durationSeconds: 15.467, videoCodec: 'h264', width: 3840, height: 2160, hasAudio: true },
  selectedTimestampSeconds: 7.7335,
  selectionReason: 'Selected the 50 percent duration midpoint from ffprobe metadata.',
  representativeFrame: {
    id: 'frame',
    kind: 'image/png',
    bucket: realVideoMaskConfig.generatedAssetsBucket,
    object: `activation-real-video/phase33d/${runId}/representative-frame/frame.png`,
    gcsUri: `gs://${realVideoMaskConfig.generatedAssetsBucket}/activation-real-video/phase33d/${runId}/representative-frame/frame.png`,
  },
  artifacts: [],
  uploadedReport: {
    bucket: realVideoMaskConfig.qaBucket,
    object: `activation-real-video/phase33d/${runId}/reports/frame-extraction-report.json`,
    gcsUri: `gs://${realVideoMaskConfig.qaBucket}/activation-real-video/phase33d/${runId}/reports/frame-extraction-report.json`,
  },
  safety: {
    approvedPhase32InputOnly: true,
    exactlyOneFrameExtracted: true,
    secondSourceVideoUsed: false,
    publicAccessEnabled: false,
    sourceOverwritten: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    revideoUsed: false,
  },
  blockers: [],
  warnings: [],
}

const maskReport: RealVideoBiRefNetFrameMaskReport = {
  ok: true,
  runId,
  sourcePhase32RunId: realVideoMaskConfig.phase32RunId,
  projectId: 'reeditpro',
  jobName: realVideoMaskConfig.birefnetJobName,
  gpu: { requested: true, type: 'nvidia-l4', count: 1, cudaAvailable: true, deviceName: 'NVIDIA L4' },
  model: {
    manifestId: realVideoMaskConfig.modelManifestId,
    name: realVideoMaskConfig.modelName,
    revision: realVideoMaskConfig.modelRevision,
    gcsPath: realVideoMaskConfig.modelGcsPath,
    runtimePath: realVideoMaskConfig.modelRuntimePath,
    aggregateSha256: realVideoMaskConfig.modelAggregateSha256,
    copiedFiles: ['BiRefNet_config.py', 'birefnet.py', 'handler.py', 'model.safetensors', 'file_checksums_sha256.txt', 'model_tree_manifest.json'],
  },
  customCodeScan: {
    customCodeFiles: ['BiRefNet_config.py', 'birefnet.py', 'handler.py'],
    executedAllowlist: ['BiRefNet_config.py', 'birefnet.py'],
    neverImportedFiles: ['handler.py'],
    blockedPatterns: ['network calls in executed files'],
    warnings: ['handler.py was not imported.'],
    blockers: [],
  },
  representativeFrame: { gcsUri: frameReport.representativeFrame.gcsUri, width: 3840, height: 2160 },
  mask: {
    status: 'completed',
    width: 3840,
    height: 2160,
    nonZeroRatio: 0.25,
    meanAlpha: 0.32,
    maskUri: `gs://${realVideoMaskConfig.generatedAssetsBucket}/activation-real-video/phase33d/${runId}/mask/mask.png`,
    cutoutUri: `gs://${realVideoMaskConfig.generatedAssetsBucket}/activation-real-video/phase33d/${runId}/cutout/cutout.png`,
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'mask_edge_quality', status: 'passed', summary: 'Mask has foreground/background separation.' },
      { gateId: 'mask_subject_coverage', status: 'passed', summary: 'Mask is non-empty and not full-frame.' },
      { gateId: 'render_asset_integrity', status: 'passed', summary: 'Mask and cutout dimensions match frame.' },
      { gateId: 'mask_temporal_stability', status: 'not_applicable', summary: 'One frame only.' },
      { gateId: 'text_behind_subject_block', status: 'not_applicable', summary: 'Text-behind-subject was not executed.' },
    ],
    blockers: [],
    warnings: ['Temporal stability is not applicable.'],
  },
  artifacts: [],
  safety: {
    approvedPhase32InputOnly: true,
    representativeFrameOnly: true,
    fullVideoMaskExecuted: false,
    secondSourceVideoUsed: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    sam2Used: false,
    textBehindSubjectExecuted: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    rtxPro6000Used: false,
    revideoUsed: false,
  },
  uploadedReport: {
    bucket: realVideoMaskConfig.qaBucket,
    object: `activation-real-video/phase33d/${runId}/reports/phase33d-report.json`,
    gcsUri: `gs://${realVideoMaskConfig.qaBucket}/activation-real-video/phase33d/${runId}/reports/phase33d-report.json`,
  },
  blockers: [],
  warnings: ['handler.py was not imported.'],
}

assert.deepEqual(validateRealVideoMaskEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  sourceGcsUri: realVideoMaskConfig.sourceGcsUri,
  modelManifestId: realVideoMaskConfig.modelManifestId,
  modelGcsPath: realVideoMaskConfig.modelGcsPath,
  modelRevision: realVideoMaskConfig.modelRevision,
  modelChecksum: realVideoMaskConfig.modelAggregateSha256,
}), [])
assert.ok(validateRealVideoMaskEnv({ sourceGcsUri: 'gs://other/video.mp4' }).length > 0, 'unapproved source must be blocked.')
assert.ok(validateRealVideoMaskEnv({ modelManifestId: 'sam2_hiera_tiny_evaluated_only' }).length > 0, 'SAM2 must be blocked.')

const commandText = [...buildFrameExtractionCommandPlans(runId), ...buildBiRefNetFrameCommandPlans(runId)].map((command) => command.commandString).join('\n')
assert.match(commandText, /representative_frame_extract/)
assert.match(commandText, /phase33d_real_video_frame/)
assert.match(commandText, /nvidia-l4/)
assert.doesNotMatch(commandText, /allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|storage\.objectUser|sam2|huggingface-cli|snapshot_download|revideo/i)

const report = buildRealVideoMaskReport({ frameExtractionReport: frameReport, birefnetFrameMaskReport: maskReport })
assert.equal(report.status, 'ready')
assert.equal(report.phase33EReadiness.readyForTextBehindSubjectPlanning, true)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.textBehindSubjectAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-real-video-birefnet-frame-mask'])
assert.ok(packageJson.scripts['activation:real-video:birefnet-frame-mask'])
assert.ok(packageJson.scripts['activation:real-video:birefnet-frame-mask:report'])

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_phase32_source_only',
    'one_frame_only',
    'birefnet_only',
    'sam2_blocked',
    'model_checksum_revision_locked',
    'no_runtime_model_downloads',
    'mask_cutout_qa_gates',
    'launch_gates_false',
    'package_scripts',
  ],
}))
