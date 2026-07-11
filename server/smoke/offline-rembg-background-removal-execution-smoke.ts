import assert from 'node:assert/strict'

import { activatePrivateOfflineRembgBackgroundRemovalRuntime, buildOfflineRembgBackgroundRemovalApprovedRequest, OFFLINE_REMBG_BACKGROUND_REMOVAL_MODEL_IDENTITY, OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS, prepareOfflineRembgBackgroundRemovalDockerRuntime, readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority } from '../tool-execution/rembg-background-removal-execution'

async function main() {
  const image = await prepareOfflineRembgBackgroundRemovalDockerRuntime()
  assert.equal(image.labels['com.reeditpro.rembg.version'], '2.0.76')
  assert.equal(image.labels['com.reeditpro.model.sha256'], OFFLINE_REMBG_BACKGROUND_REMOVAL_MODEL_IDENTITY.sha256)
  const runtime = await activatePrivateOfflineRembgBackgroundRemovalRuntime()
  const request = buildOfflineRembgBackgroundRemovalApprovedRequest({ toolId: 'rembg', operationId: OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS.rembg, planningPayload: { confidenceThreshold: 0.5, alphaMatteMode: 'straight', edgeRefinementProfileId: 'approved_u2netp_default_v1', maximumSubjects: 1 } })
  const first = await runtime.execute(request); const second = await runtime.execute(request)
  assert.equal(first.artifact.sha256, '668366803056dc51a75cafc5ad2be9363146fa22a1ed5cba481815944759fd45')
  assert.equal(first.artifact.sha256, second.artifact.sha256); assert.equal(first.artifact.byteLength, 3231); assert.equal(first.artifact.mimeType, 'image/png')
  assert.equal(first.evidence.modelSha256, OFFLINE_REMBG_BACKGROUND_REMOVAL_MODEL_IDENTITY.sha256); assert.equal(first.evidence.semanticEvidence.actualPackageEntrypointExecuted, true); assert.equal(first.evidence.semanticEvidence.foregroundSeparationVerified, true); assert.equal(first.evidence.semanticEvidence.callerModelAllowed, false); assert.equal(first.evidence.semanticEvidence.runtimeModelDownloadAllowed, false)
  assert.equal(first.evidence.confinement.networkMode, 'none'); assert.equal(first.evidence.confinement.readOnlyRootFilesystem, true); assert.equal(first.evidence.confinement.callerBindsPresent, false); assert.equal(first.readiness.productReady, false)
  const authority = await readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority(); assert(authority); assert.equal(authority.image.imageIdentityHash, runtime.image.imageIdentityHash); assert.equal(authority.readiness.privateInternalExecutionReady, true); assert.equal(authority.readiness.productReady, false)
  await assert.rejects(() => runtime.execute({ ...request, payload: { ...request.payload, maximumSubjects: 2 } }))
  console.log(JSON.stringify({ ok: true, toolId: 'rembg', operationId: request.operationId, artifactSha256: first.artifact.sha256, artifactByteLength: first.artifact.byteLength, modelSha256: first.evidence.modelSha256, imageIdentityHash: image.imageIdentityHash, evidence: 'rembg_u2netp_exact_png_confined_runtime_verified', productReady: false, externalBetaReady: false, productionReady: false }))
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
