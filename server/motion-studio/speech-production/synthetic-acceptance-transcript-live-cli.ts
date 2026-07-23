import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechSyntheticTranscriptLiveOperator } from './synthetic-acceptance-transcript-live-operator'

try {
  const result = await executeMotionStudioSpeechSyntheticTranscriptLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    sourceLiveResultDigest: result.sourceLiveResultDigest,
    sourceAudioSha256: result.sourceAudioSha256,
    sourceAudioByteLength: result.sourceAudioByteLength,
    sourceAudioDurationMilliseconds: result.sourceAudioDurationMilliseconds,
    modelId: result.modelId,
    languageCodeDetected: result.languageCodeDetected,
    languageProbability: result.languageProbability,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerRequestAttemptCount: result.providerRequestAttemptCount,
    providerRequestCompletedCount: result.providerRequestCompletedCount,
    providerTranscriptionCount: result.providerTranscriptionCount,
    transcriptDigest: result.transcriptDigest,
    normalizedTranscriptDigest: result.normalizedTranscriptDigest,
    transcriptCharacterCount: result.transcriptCharacterCount,
    transcriptWordCount: result.transcriptWordCount,
    timestampedWordCount: result.timestampedWordCount,
    wordErrorDistance: result.wordErrorDistance,
    wordErrorRate: result.wordErrorRate,
    requiredConceptCoverage: result.requiredConceptCoverage,
    exactNormalizedTextMatch: result.exactNormalizedTextMatch,
    semanticEvidenceReady: result.semanticEvidenceReady,
    publicListProviderCostMicros: result.publicListProviderCostMicros,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
    standardProviderRetentionAcceptedForSyntheticProof:
      result.standardProviderRetentionAcceptedForSyntheticProof,
    zeroRetentionClaimed: result.zeroRetentionClaimed,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    humanListeningReviewComplete: result.humanListeningReviewComplete,
    takeSelectionAllowed: result.takeSelectionAllowed,
    productReady: result.productReady,
    productionReady: result.productionReady,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    credentialPrinted: false,
    rawProviderResponsePrinted: false,
    transcriptPrinted: false,
    retryAttempted: false,
    fallbackAttempted: false,
    takeSelectionPerformed: false,
    productReadinessClaimed: false,
  }))
  process.exitCode = 1
}
