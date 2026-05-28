import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildStaticDepthCompositionFrameManifest,
  buildStaticTextLayerFramePlan,
  buildTextBehindSubjectFrameReport,
  resolveTextBehindSubjectFrameArtifacts,
  resolveTextBehindSubjectFrameInputs,
  textBehindSubjectFrameConfig,
  validateTextBehindSubjectFrameEnv,
} from '../activation/text-behind-subject-frame'

const inputs = resolveTextBehindSubjectFrameInputs()
assert.equal(inputs.representativeFrame, textBehindSubjectFrameConfig.representativeFrameGcsUri, 'Phase 33E must lock to the approved Phase 33D frame.')
assert.equal(inputs.mask, textBehindSubjectFrameConfig.maskGcsUri, 'Phase 33E must lock to the approved Phase 33D mask.')
assert.equal(inputs.cutout, textBehindSubjectFrameConfig.cutoutGcsUri, 'Phase 33E must lock to the approved Phase 33D cutout.')

const textPlan = buildStaticTextLayerFramePlan()
assert.equal(textPlan.textContent, 'REEDITPRO', 'Text content must be fixed to REEDITPRO.')
assert.equal(textPlan.sanitizedText, 'REEDITPRO', 'Sanitized text must remain REEDITPRO.')
assert.equal(textPlan.behindSubject, true, 'Text layer must be planned behind the subject.')
assert.deepEqual(textPlan.layerOrder, ['background_frame', 'text_layer', 'foreground_cutout'], 'Layer order must place foreground cutout above text.')
assert.equal(textPlan.fontFile, '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'Phase 33E should use system DejaVu fallback.')

const manifest = buildStaticDepthCompositionFrameManifest('phase33e-smoke')
assert.equal(manifest.renderMode, 'single_frame_preview_only', 'Manifest must be single-frame preview only.')
assert.equal(manifest.renderEngineHandoff.ffmpegSingleFrame, true, 'Manifest must allow only FFmpeg single-frame composition.')
assert.equal(manifest.renderEngineHandoff.revideoUsed, false, 'Revideo must be false.')
assert.equal(manifest.renderEngineHandoff.finalRenderAllowed, false, 'Final render must be blocked.')
assert.equal(manifest.renderEngineHandoff.videoRenderAllowed, false, 'Video render must be blocked.')

const artifacts = resolveTextBehindSubjectFrameArtifacts('phase33e-smoke')
assert.ok(artifacts.preview.startsWith('gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase33e/phase33e-smoke/'), 'Preview must be under private previews Phase 33E prefix.')
assert.ok(artifacts.textLayerPlan.includes('/plans/text-layer-plan.json'), 'Text layer plan artifact must be declared.')
assert.ok(artifacts.depthCompositionManifest.includes('/manifests/depth-composition-manifest.json'), 'Depth manifest artifact must be declared.')
assert.ok(artifacts.qaReport.includes('/qa/text-behind-subject-frame-qa.json'), 'QA report artifact must be declared.')

assert.deepEqual(validateTextBehindSubjectFrameEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  text: 'REEDITPRO',
  frameGcsUri: textBehindSubjectFrameConfig.representativeFrameGcsUri,
  maskGcsUri: textBehindSubjectFrameConfig.maskGcsUri,
  cutoutGcsUri: textBehindSubjectFrameConfig.cutoutGcsUri,
}), [], 'Approved Phase 33E env must validate.')
assert.ok(validateTextBehindSubjectFrameEnv({ text: '<script>REEDITPRO</script>' }).some((blocker) => blocker.includes('REEDITPRO')), 'Arbitrary/unsafe text must be blocked.')

const report = buildTextBehindSubjectFrameReport()
assert.equal(report.productionReadyAllowed, false, 'Production must remain blocked.')
assert.equal(report.externalBetaAllowed, false, 'External beta must remain blocked.')
assert.equal(report.broadRealUserMediaAllowed, false, 'Broad real media must remain blocked.')
assert.equal(report.fullVideoTextBehindSubjectAllowed, false, 'Full-video text-behind-subject must remain blocked.')
assert.ok(report.commandPlans.some((plan) => plan.commandId === 'deploy-render-worker-phase33e'), 'Render worker deploy command plan must exist.')
assert.ok(report.commandPlans.every((plan) => plan.textOnlyByDefault), 'Command plans must be static/report-only by default.')

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:text-behind-subject:frame-preview'], 'package.json must include activation:text-behind-subject:frame-preview.')
assert.ok(packageJson.scripts['activation:text-behind-subject:frame-preview:report'], 'package.json must include activation:text-behind-subject:frame-preview:report.')
assert.ok(packageJson.scripts['smoke:activation-text-behind-subject-frame-preview'], 'package.json must include Phase 33E smoke.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase33d_inputs_locked',
    'fixed_reeditpro_text',
    'single_frame_preview_only',
    'private_artifact_prefixes',
    'no_revideo_or_final_render',
    'launch_gates_false',
    'package_scripts',
  ],
}))
