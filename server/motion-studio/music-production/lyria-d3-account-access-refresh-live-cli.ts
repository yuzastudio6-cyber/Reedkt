import { ApiError } from '../../errors/api-error'
import { executeMotionStudioLyriaD3AccountAccessRefreshLiveOperator } from './lyria-d3-account-access-refresh-live-operator'

try {
  const result = await executeMotionStudioLyriaD3AccountAccessRefreshLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    evidenceClass: result.evidenceClass,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    previousAuthorizationId: result.previousAuthorizationId,
    previousResultDigest: result.previousResultDigest,
    historyPreserved: result.historyPreserved,
    sourcePreflightDigest: result.sourcePreflightDigest,
    sourceExternalReadinessDigest: result.sourceExternalReadinessDigest,
    sourcePrivateIngestLineageDigest: result.sourcePrivateIngestLineageDigest,
    evidenceDigest: result.evidenceDigest,
    providerAccountAccessVerified: result.providerAccountAccessVerified,
    exactModelResourceVisible: result.exactModelResourceVisible,
    providerFundsOrQuotaVerified: result.providerFundsOrQuotaVerified,
    providerAccountAccessAndFundsGateResolved:
      result.providerAccountAccessAndFundsGateResolved,
    providerGenerationEligibilityVerified: result.providerGenerationEligibilityVerified,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerRequestCount: result.providerRequestCount,
    providerGenerationCount: result.providerGenerationCount,
    purchaseCount: result.purchaseCount,
    accountMutationCount: result.accountMutationCount,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    internalProductionCostMicros: result.internalProductionCostMicros,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    secretValuePrinted: false,
    rawProviderResponsePrinted: false,
    previousHistoryOverwritten: false,
    fundsOrQuotaClaimed: false,
    combinedGateResolved: false,
    retryAttempted: false,
    fallbackAttempted: false,
  }))
  process.exitCode = 1
}
