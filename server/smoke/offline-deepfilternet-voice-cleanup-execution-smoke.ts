import assert from 'node:assert/strict'

import {
  activatePrivateOfflineDeepFilterNetVoiceCleanupRuntime,
  buildOfflineDeepFilterNetVoiceCleanupApprovedRequest,
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY,
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS,
  prepareOfflineDeepFilterNetVoiceCleanupDockerRuntime,
  readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority,
} from '../tool-execution/deepfilternet-voice-cleanup-execution'

async function main() {
  const image = await prepareOfflineDeepFilterNetVoiceCleanupDockerRuntime()
  assert.equal(image.labels['com.reeditpro.deepfilternet.version'], '0.5.6')
  assert.equal(image.labels['com.reeditpro.model.checkpoint.sha256'], OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY.checkpointSha256)
  const runtime = await activatePrivateOfflineDeepFilterNetVoiceCleanupRuntime()
  const request = buildOfflineDeepFilterNetVoiceCleanupApprovedRequest({
    toolId: 'deepfilternet',
    operationId: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS.deepfilternet,
    planningPayload: { attenuationLimitDb: 12, cleanupProfileId: 'approved_gentle_voice_cleanup_v1', preserveNaturalVoice: true, postFilterEnabled: false },
  })
  const first = await runtime.execute(request)
  const second = await runtime.execute(request)
  assert.equal(first.artifact.sha256, 'a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7')
  assert.equal(first.artifact.byteLength, 384_214)
  assert.equal(first.artifact.sha256, second.artifact.sha256)
  assert.equal(first.artifact.byteLength, second.artifact.byteLength)
  assert.equal(first.artifact.mimeType, 'audio/wav')
  assert.equal(first.evidence.modelCheckpointSha256, OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY.checkpointSha256)
  assert.equal(first.evidence.semanticEvidence.actualPackageEntrypointExecuted, true)
  assert.equal(first.evidence.semanticEvidence.finiteOutputVerified, true)
  assert.equal(first.evidence.semanticEvidence.sampleCountPreserved, true)
  assert.equal(first.evidence.semanticEvidence.sampleCount, 192_085)
  assert.equal(first.evidence.semanticEvidence.inputSnrDb, 3.217773)
  assert.equal(first.evidence.semanticEvidence.outputSnrDb, 8.214627)
  assert(Number(first.evidence.semanticEvidence.outputSnrDb) > Number(first.evidence.semanticEvidence.inputSnrDb))
  assert.equal(first.evidence.semanticEvidence.meanAbsoluteDelta, 0.032997789)
  assert.equal(first.evidence.semanticEvidence.callerMediaAllowed, false)
  assert.equal(first.evidence.semanticEvidence.callerModelAllowed, false)
  assert.equal(first.evidence.semanticEvidence.runtimeModelDownloadAllowed, false)
  assert.equal(first.evidence.confinement.networkMode, 'none')
  assert.equal(first.evidence.confinement.readOnlyRootFilesystem, true)
  assert.equal(first.evidence.confinement.callerBindsPresent, false)
  assert.equal(first.readiness.productReady, false)
  const authority = await readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority()
  assert(authority)
  assert.equal(authority.image.imageIdentityHash, runtime.image.imageIdentityHash)
  assert.equal(authority.readiness.privateInternalExecutionReady, true)
  assert.equal(authority.readiness.productReady, false)
  await assert.rejects(() => runtime.execute({ ...request, payload: { ...request.payload, attenuationLimitDb: 24 } }))
  console.log(JSON.stringify({
    ok: true,
    toolId: 'deepfilternet',
    operationId: request.operationId,
    artifactSha256: first.artifact.sha256,
    artifactByteLength: first.artifact.byteLength,
    modelCheckpointSha256: first.evidence.modelCheckpointSha256,
    imageIdentityHash: image.imageIdentityHash,
    inputSnrDb: first.evidence.semanticEvidence.inputSnrDb,
    outputSnrDb: first.evidence.semanticEvidence.outputSnrDb,
    meanAbsoluteDelta: first.evidence.semanticEvidence.meanAbsoluteDelta,
    evidence: 'deepfilternet_0_5_6_deepfilternet3_exact_wav_confined_runtime_verified',
    productReady: false,
    externalBetaReady: false,
    productionReady: false,
  }))
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
