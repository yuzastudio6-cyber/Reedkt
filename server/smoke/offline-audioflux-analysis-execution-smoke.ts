import assert from 'node:assert/strict'

import { activatePrivateOfflineAudioFluxAnalysisRuntime, buildOfflineAudioFluxAnalysisApprovedRequest, OFFLINE_AUDIOFLUX_ANALYSIS_OPERATIONS, prepareOfflineAudioFluxAnalysisDockerRuntime, readPersistedOfflineAudioFluxAnalysisRuntimeAuthority } from '../tool-execution/audioflux-analysis-execution'

async function main() {
  const image = await prepareOfflineAudioFluxAnalysisDockerRuntime()
  assert.equal(image.labels['com.reeditpro.audioflux.version'], '0.1.9')
  assert.equal(image.labels['com.reeditpro.audioflux.source.sha256'], '538c2b5ff718c88b8c457b10f4b8fc03796680e43daf4afc2e95d717d01d281b')
  const runtime = await activatePrivateOfflineAudioFluxAnalysisRuntime()
  const request = buildOfflineAudioFluxAnalysisApprovedRequest({ toolId: 'audioflux', operationId: OFFLINE_AUDIOFLUX_ANALYSIS_OPERATIONS.audioflux, planningPayload: { sampleRate: 16_000, channelMode: 'mono', analysisProfileId: 'approved_server_owned_beat_energy_fixture_v1', confidenceThreshold: 0.75 } })
  const first = await runtime.execute(request); const second = await runtime.execute(request)
  assert.equal(first.artifact.sha256, 'fdb4d5c1da7758a99b78be8f430900fef77b55b88ce6d4e5d3526d31495df51b')
  assert.equal(first.artifact.sha256, second.artifact.sha256); assert.equal(first.artifact.byteLength, 608)
  assert.equal(first.evidence.semanticEvidence.actualPackageEntrypointExecuted, true); assert.equal(first.evidence.semanticEvidence.bftExecuted, true); assert.equal(first.evidence.semanticEvidence.spectralFluxExecuted, true); assert.equal(first.evidence.semanticEvidence.spectralEnergyExecuted, true); assert.equal(first.evidence.semanticEvidence.temporalEnergyExecuted, true)
  assert.equal(first.evidence.confinement.networkMode, 'none'); assert.equal(first.evidence.confinement.readOnlyRootFilesystem, true); assert.equal(first.evidence.confinement.callerBindsPresent, false); assert.equal(first.readiness.productReady, false)
  const authority = await readPersistedOfflineAudioFluxAnalysisRuntimeAuthority(); assert(authority); assert.equal(authority.image.imageIdentityHash, runtime.image.imageIdentityHash); assert.equal(authority.readiness.privateInternalExecutionReady, true); assert.equal(authority.readiness.productReady, false)
  await assert.rejects(() => runtime.execute({ ...request, payload: { ...request.payload, confidenceThreshold: 0.74 } }))
  console.log(JSON.stringify({ ok: true, toolId: 'audioflux', operationId: request.operationId, artifactSha256: first.artifact.sha256, artifactByteLength: first.artifact.byteLength, imageIdentityHash: image.imageIdentityHash, evidence: 'audioflux_source_build_exact_json_confined_runtime_verified', productReady: false, externalBetaReady: false, productionReady: false }))
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
