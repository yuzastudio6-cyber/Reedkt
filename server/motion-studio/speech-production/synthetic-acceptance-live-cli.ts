import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechSyntheticAcceptanceLiveOperator } from './synthetic-acceptance-live-operator'

try {
  const result = await executeMotionStudioSpeechSyntheticAcceptanceLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    syntheticTextDigest: result.syntheticTextDigest,
    syntheticTextCharacterCount: result.syntheticTextCharacterCount,
    modelId: result.modelId,
    outputFormat: result.outputFormat,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerRequestAttemptCount: result.providerRequestAttemptCount,
    providerRequestCompletedCount: result.providerRequestCompletedCount,
    providerGenerationCount: result.providerGenerationCount,
    providerCharacterCostCredits: result.providerCharacterCostCredits,
    publicListProviderCostMicros: result.publicListProviderCostMicros,
    audioSha256: result.audioSha256,
    audioByteLength: result.audioByteLength,
    alignmentDigest: result.alignmentDigest,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
    standardProviderRetentionAcceptedForSyntheticProof:
      result.standardProviderRetentionAcceptedForSyntheticProof,
    zeroRetentionClaimed: result.zeroRetentionClaimed,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    productReady: result.productReady,
    productionReady: result.productionReady,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    secretValuePrinted: false,
    providerVoiceIdPrinted: false,
    rawProviderResponsePrinted: false,
    retryAttempted: false,
    fallbackAttempted: false,
    productReadinessClaimed: false,
  }))
  process.exitCode = 1
}
