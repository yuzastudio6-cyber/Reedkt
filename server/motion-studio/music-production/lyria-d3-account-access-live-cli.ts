import { ApiError } from '../../errors/api-error'
import { executeMotionStudioLyriaD3AccountAccessLiveOperator } from './lyria-d3-account-access-live-operator'

try {
  const result = await executeMotionStudioLyriaD3AccountAccessLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    evidenceClass: result.evidenceClass,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    sourcePreflightDigest: result.sourcePreflightDigest,
    sourceExternalReadinessDigest: result.sourceExternalReadinessDigest,
    sourcePrivateIngestLineageDigest: result.sourcePrivateIngestLineageDigest,
    preflightEvidenceDigest: result.preflightEvidenceDigest,
    providerAccountAccessVerified: result.providerAccountAccessVerified,
    providerFundsOrQuotaVerified: result.providerFundsOrQuotaVerified,
    providerAccountAccessAndFundsGateResolved:
      result.providerAccountAccessAndFundsGateResolved,
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
    fundsOrQuotaClaimed: false,
    combinedGateResolved: false,
    retryAttempted: false,
    fallbackAttempted: false,
  }))
  process.exitCode = 1
}
