import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechAccountPreflightLiveOperator } from './account-preflight-live-operator'

try {
  const result = await executeMotionStudioSpeechAccountPreflightLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    decisionDigest: result.decisionDigest,
    catalogEvidenceDigest: result.catalogEvidenceDigest,
    preflightEvidenceDigest: result.preflightEvidenceDigest,
    accountFundedWithoutPurchase: result.accountFundedWithoutPurchase,
    modelAccessVerified: result.modelAccessVerified,
    verifiedProviderCatalogVoice: result.verifiedProviderCatalogVoice,
    zeroRetentionEntitlementVerified: result.zeroRetentionEntitlementVerified,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerRequestCount: result.providerRequestCount,
    providerGenerationCount: result.providerGenerationCount,
    purchaseCount: result.purchaseCount,
    accountMutationCount: result.accountMutationCount,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    secretValuePrinted: false,
    providerVoiceIdPrinted: false,
    retryAttempted: false,
    fallbackAttempted: false,
  }))
  process.exitCode = 1
}
