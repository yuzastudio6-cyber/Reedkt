import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechZeroRetentionHistoryDiagnosticLiveOperator } from './zero-retention-history-diagnostic-live-operator'

try {
  const result = await executeMotionStudioSpeechZeroRetentionHistoryDiagnosticLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    targetExt008ResultSha256: result.targetExt008ResultSha256,
    evidenceDigest: result.evidenceDigest,
    classification: result.classification,
    exactRequestDigestMatchCount: result.exactRequestDigestMatchCount,
    exactTextDigestMatchCount: result.exactTextDigestMatchCount,
    historyAbsenceVerified: result.historyAbsenceVerified,
    zeroRetentionEntitlementVerified: result.zeroRetentionEntitlementVerified,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerHttpRequestCount: result.providerHttpRequestCount,
    providerGenerationCount: result.providerGenerationCount,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
    productReady: result.productReady,
    productionReady: result.productionReady,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    credentialPrinted: false,
    providerVoiceIdPrinted: false,
    rawProviderResponsePrinted: false,
    rawHistoryPrinted: false,
    providerGenerationAttempted: false,
    retryAttempted: false,
    fallbackAttempted: false,
    productReadinessClaimed: false,
  }))
  process.exitCode = 1
}
