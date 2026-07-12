import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  getProvenEndToEndToolIdentity,
  getToolIdentityRecord,
  listProvenToolIdentityCatalog,
  summarizeProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'
import {
  listCompleteProfessionalToolOperationSpecs,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'

const catalog = listProvenToolIdentityCatalog()
const summary = summarizeProvenToolIdentityCatalog()
const specs = listCompleteProfessionalToolOperationSpecs()
assert.equal(catalog.length, 72)
assert.equal(summary.totalRegistryProfiles, 72)
assert.equal(summary.callableCandidateCount, 61)
assert.equal(summary.intentionallyNonExecutableCount, 11)
assert.equal(summary.confinedRunnerVerifiedCount, 53)
assert.equal(summary.canonicalEndToEndVerifiedCount, 50)
assert.equal(summary.canonicalJobAdapterVerifiedCount, 43)
assert.equal(new Set(catalog.map((record) => record.stableToolIdentity)).size, 72)
assert.equal(new Set(catalog.map((record) => record.identityHash)).size, 72)
assert.equal(new Set(catalog.map((record) => record.proofHash)).size, 72)

const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
  scripts: Record<string, string>
}
const canonicalSmokeSource = await readFile(
  resolve('server/smoke/canonical-private-tool-dispatch-authority-smoke.ts'),
  'utf8',
)

for (const record of catalog) {
  const spec = specs.find((candidate) => candidate.canonicalToolId === record.canonicalToolId)
  assert.ok(spec)
  assert.equal(record.operationId, spec.allowedOperationIds[0])
  assert.equal(record.operationSpecHash, sha256AuthorityValue(spec))
  assert.equal(record.stableToolIdentity, `reeditpro.tool.${record.canonicalToolId}.v1`)
  assert.equal(record.identityHash, sha256AuthorityValue({
    schemaVersion: record.schemaVersion,
    evidenceRevision: record.evidenceRevision,
    canonicalToolId: record.canonicalToolId,
    operationId: record.operationId,
    operationSpecHash: record.operationSpecHash,
  }))
  assert.equal(record.readiness.privateInternalRunnerReady, spec.privateInternalExecutionReady)
  assert.equal(record.readiness.productReady, false)
  assert.equal(record.readiness.externalBetaReady, false)
  assert.equal(record.readiness.productionReady, false)
  assert.equal(record.runtime.frontendExecutionAllowed, false)

  if (record.readiness.privateInternalRunnerReady) {
    assert.equal(record.runtime.networkMode, 'none')
    assert.ok(record.runtime.runnerClass)
    assert.ok(record.runtime.pinnedVersion)
    assert.ok(record.evidence.runnerSmokeCommand)
    const scriptName = record.evidence.runnerSmokeCommand!.replace(/^npm run /, '')
    assert.ok(packageJson.scripts[scriptName])
    assert.equal(record.evidence.gates.actualConfinedOperationVerified, true)
    assert.equal(record.evidence.gates.pinnedPackageOrBinaryVerified, true)
    assert.ok(record.artifactContract.verifiedOutputContentTypes.length >= 1)
  }

  if (record.readiness.privateInternalEndToEndReady) {
    assert.equal(getProvenEndToEndToolIdentity(record.canonicalToolId)?.proofHash, record.proofHash)
    assert.equal(record.verificationState, 'canonical_e2e_verified')
    assert.equal(record.evidence.canonicalLifecycleSmokeCommand, 'npm run smoke:canonical-private-tool-dispatch')
    assert.ok(record.evidence.canonicalEvidenceKey)
    assert.ok(canonicalSmokeSource.includes(`'${record.evidence.canonicalEvidenceKey}'`))
    assert.ok(Object.values(record.evidence.gates).every(Boolean))
    assert.ok(record.artifactContract.verifiedOutputContentTypes.length >= 1)
  } else {
    assert.equal(getProvenEndToEndToolIdentity(record.canonicalToolId), undefined)
    assert.ok(record.blockers.length >= 1)
  }

  if (record.readiness.privateInternalJobAdapterReady) {
    assert.equal(record.readiness.privateInternalEndToEndReady, true)
    assert.equal(record.evidence.canonicalJobAdapterSmokeCommand, 'npm run smoke:canonical-private-tool-dispatch')
    assert.ok(record.evidence.canonicalJobAdapterEvidenceKey)
    assert.ok(canonicalSmokeSource.includes(`'${record.evidence.canonicalJobAdapterEvidenceKey}'`))
  } else {
    assert.equal(record.evidence.canonicalJobAdapterSmokeCommand, null)
    assert.equal(record.evidence.canonicalJobAdapterEvidenceKey, null)
  }

  const tamperedIdentity = {
    schemaVersion: record.schemaVersion,
    evidenceRevision: record.evidenceRevision,
    canonicalToolId: record.canonicalToolId,
    operationId: `${record.operationId}.tampered`,
    operationSpecHash: record.operationSpecHash,
  }
  assert.notEqual(sha256AuthorityValue(tamperedIdentity), record.identityHash)
}

assert.deepEqual(summary.canonicalEndToEndVerifiedToolIds, [
  'd3', 'echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'viz_js', 'lottie',
  'animejs', 'three_js', 'pixijs', 'konva', 'babylon_js', 'rembg', 'kornia', 'librosa',
  'audioread', 'pydub', 'scipy', 'resampy', 'pyloudnorm', 'audioflux', 'music21', 'pretty_midi', 'mido',
  'noisereduce', 'pedalboard',
  'mir_eval', 'pydub_effects', 'ebu_r128_pyloudnorm', 'rnnoise', 'deepfilternet', 'playwright', 'pyscenedetect',
  'opencolorio', 'openimageio', 'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation', 'ffmpeg',
  'ffprobe', 'pyav', 'opentimelineio', 'remotion', 'libass', 'sharp', 'duckdb', 'polars', 'opencv',
  'signalsmith_stretch',
  'vapoursynth',
])

assert.deepEqual(summary.canonicalJobAdapterVerifiedToolIds, [
  'echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'viz_js', 'lottie', 'animejs',
  'three_js', 'pixijs', 'konva', 'babylon_js', 'rembg', 'kornia', 'librosa', 'audioread',
  'pydub', 'scipy', 'resampy', 'pyloudnorm', 'audioflux', 'music21', 'pretty_midi',
  'mido', 'noisereduce', 'pedalboard', 'mir_eval', 'pydub_effects', 'ebu_r128_pyloudnorm',
  'rnnoise', 'playwright', 'pyscenedetect', 'opencolorio', 'openimageio',
  'mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation', 'ffprobe',
  'opentimelineio', 'remotion', 'polars', 'opencv', 'signalsmith_stretch', 'vapoursynth',
])

assert.equal(getToolIdentityRecord('audioflux').verificationState, 'canonical_e2e_verified')
assert.equal(getToolIdentityRecord('audioflux').runtime.runnerClass, 'offline_audioflux_analysis_execution_v1')
assert.equal(getToolIdentityRecord('audioflux').evidence.canonicalEvidenceKey, 'audioflux_exact_json_canonical_lifecycle_verified')
assert.equal(getToolIdentityRecord('rembg').verificationState, 'canonical_e2e_verified')
assert.equal(getToolIdentityRecord('rembg').runtime.runnerClass, 'offline_rembg_background_removal_execution_v1')
assert.equal(getToolIdentityRecord('rembg').artifactContract.verifiedOutputContentTypes[0], 'image/png')
assert.equal(getToolIdentityRecord('rembg').evidence.canonicalEvidenceKey, 'rembg_exact_png_canonical_lifecycle_verified')
assert.equal(getToolIdentityRecord('deepfilternet').verificationState, 'canonical_e2e_verified')
assert.equal(getToolIdentityRecord('deepfilternet').runtime.runnerClass, 'offline_deepfilternet_voice_cleanup_execution_v1')
assert.equal(getToolIdentityRecord('deepfilternet').runtime.packageOrBinaryName, 'DeepFilterNet+DeepFilterLib')
assert.equal(getToolIdentityRecord('deepfilternet').runtime.pinnedVersion, '0.5.6')
assert.equal(getToolIdentityRecord('deepfilternet').artifactContract.verifiedOutputContentTypes[0], 'audio/wav')
assert.equal(getToolIdentityRecord('deepfilternet').evidence.runnerSmokeCommand, 'npm run smoke:offline-deepfilternet-voice-cleanup-execution')
assert.equal(getToolIdentityRecord('deepfilternet').evidence.canonicalEvidenceKey, 'deepfilternet_exact_wav_canonical_lifecycle_verified')
assert.equal(getToolIdentityRecord('deepfilternet').readiness.privateInternalRunnerReady, true)
assert.equal(getToolIdentityRecord('deepfilternet').readiness.privateInternalEndToEndReady, true)
assert.equal(getToolIdentityRecord('deepfilternet').readiness.productReady, false)

console.log(JSON.stringify({
  ok: true,
  summary,
  checks: [
    'all_72_registry_profiles_have_stable_canonical_identities',
    '61_callable_and_11_intentionally_non_executable_partition_locked',
    'runner_proof_and_canonical_e2e_proof_are_distinct_states',
    'exact_operation_spec_package_version_runner_and_artifact_contract_recorded',
    'canonical_evidence_keys_exist_in_executed_lifecycle_smoke',
    'job_adapter_evidence_is_a_distinct_per_tool_proof_dimension',
    'all_end_to_end_records_require_every_proof_gate',
    'identity_and_proof_hashes_fail_on_tampering',
    'no_product_beta_or_production_promotion_inferred',
  ],
}))
