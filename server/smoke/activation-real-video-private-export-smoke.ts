import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildPhase30QaSummary,
  buildRealVideoPrivateExportRenderPlan,
  realVideoPrivateExportConfig,
  resolvePhase30ApprovedArtifactUris,
  validateRealVideoPrivateExportEnv,
  validateRealVideoPrivateExportRuntimeReport,
} from '../activation/real-video-private-export'

const uris = resolvePhase30ApprovedArtifactUris()
const plan = buildRealVideoPrivateExportRenderPlan({ runId: 'phase30-smoke' })
assert.equal(realVideoPrivateExportConfig.phase28RunId, 'phase28-20260528T01552')
assert.equal(realVideoPrivateExportConfig.phase29RunId, 'phase29-20260528T02254')
assert.equal(uris.source, realVideoPrivateExportConfig.sourceGcsUri)
assert.equal(plan.captionHandling.mode, 'sidecar_only')
assert.equal(plan.safety.privateExportOnly, true)
assert.equal(plan.safety.publicDeliveryAllowed, false)
assert.equal(plan.safety.gpuAllowed, false)
assert.equal(plan.safety.providerExecutionAllowed, false)
assert.equal(plan.safety.modelDownloadAllowed, false)
assert.ok(plan.keepSegments.length > 0)
assert.equal(plan.keepSegments.some((segment) => segment.startSeconds < 0 || segment.endSeconds <= segment.startSeconds), false)
assert.equal(plan.output.gcsUri.startsWith(`gs://${realVideoPrivateExportConfig.finalExportsBucket}/activation-real-video/phase30/`), true)
assert.equal(validateRealVideoPrivateExportEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
}).length, 0)
assert.ok(validateRealVideoPrivateExportEnv({
  projectId: 'wrong',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
}).length > 0)

const qa = buildPhase30QaSummary({
  finalExportExists: true,
  timelineDurationSeconds: 15.443,
  finalExportDurationSeconds: 15.44,
  hasAudio: true,
  videoCodec: 'h264',
  audioCodec: 'aac',
  captionHandling: 'sidecar_only',
})
assert.notEqual(qa.status, 'blocked')
assert.ok(qa.gates.some((gate) => gate.gateType === 'final_delivery' && gate.status === 'passed'))
assert.ok(qa.gates.some((gate) => gate.gateType === 'caption_timing' && gate.status === 'warning'))
assert.ok(validateRealVideoPrivateExportRuntimeReport().length > 0)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(Boolean(packageJson.scripts['activation:real-video:private-export']), true)
assert.equal(Boolean(packageJson.scripts['activation:real-video:private-export:report']), true)
assert.equal(Boolean(packageJson.scripts['smoke:activation-real-video-private-export']), true)
assert.equal(Boolean(packageJson.scripts['build:staging-real-video-export-worker']), true)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase28_phase29_scope_locked',
    'private_output_prefix',
    'sidecar_only_caption_policy',
    'env_guard',
    'qa_final_delivery_private_export',
    'scripts_present',
    'gpu_provider_model_download_blocked',
  ],
  captionHandling: plan.captionHandling.mode,
  qaStatus: qa.status,
}, null, 2))
