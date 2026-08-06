import { ApiError } from '../../errors/api-error'
import { reconcileMotionStudioSpeechSyntheticAcceptance } from './synthetic-acceptance-reconciliation'

try {
  const result = await reconcileMotionStudioSpeechSyntheticAcceptance({
    repositoryRoot: process.cwd(),
    reconciledAt: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    trackedResultDigest: result.trackedResultDigest,
    evidenceDigest: result.evidenceDigest,
    sourceSha256: result.source.sha256,
    normalizedAudioSha256: result.normalizedArtifact.sha256,
    normalizedAudioByteLength: result.normalizedArtifact.byteLength,
    normalizedDurationMilliseconds: result.normalizedArtifact.durationMilliseconds,
    sampleRateHertz: result.normalizedArtifact.sampleRateHertz,
    channelCount: result.normalizedArtifact.channelCount,
    rmsDbfs: result.objectiveAudioQa.rmsDbfs,
    samplePeakDbfs: result.objectiveAudioQa.samplePeakDbfs,
    passedGateCount: result.qa.results.filter((gate) => gate.result === 'passed').length,
    notEvaluatedGateCount: result.qa.results.filter((gate) => gate.result === 'not_evaluated').length,
    privateSyntheticTechnicalAcceptanceReady:
      result.qa.privateSyntheticTechnicalAcceptanceReady,
    takeSelectionEligible: result.qa.takeSelectionEligible,
    productionReadinessEligible: result.qa.productionReadinessEligible,
    externalNetworkRequestCount: 0,
    credentialReadCount: 0,
    providerRequestCount: 0,
    customerBillingPerformed: result.cost.customerBillingPerformed,
    timelineMutationPerformed: result.selection.timelineMutationPerformed,
    productReady: result.readiness.productReady,
    productionReady: result.readiness.productionReady,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'private_synthetic_reconciliation_blocked',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    externalNetworkRequestCount: 0,
    credentialReadCount: 0,
    providerRequestCount: 0,
    rawPrivateEvidencePrinted: false,
    productReadinessClaimed: false,
  }))
  process.exitCode = 1
}
