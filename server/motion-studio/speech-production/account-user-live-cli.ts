import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechAccountUserLiveOperator } from './account-user-live-operator'

try {
  const result = await executeMotionStudioSpeechAccountUserLiveOperator({
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
    evidenceDigest: result.evidenceDigest,
    accountQuotaVerified: result.accountQuotaVerified,
    accountFundedWithoutPurchase: result.accountFundedWithoutPurchase,
    expectedSpokenTextCharacterCount: result.expectedSpokenTextCharacterCount,
    zeroRetentionEntitlementVerified: result.zeroRetentionEntitlementVerified,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerRequestCount: result.providerRequestCount,
    addressConnectionAttemptCount: result.addressConnectionAttemptCount,
    providerGenerationCount: result.providerGenerationCount,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    purchaseCount: result.purchaseCount,
    accountMutationCount: result.accountMutationCount,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    secretValuePrinted: false,
    rawProviderResponsePrinted: false,
    accountIdentityPrinted: false,
    apiKeyFieldsPrinted: false,
    rawResolvedAddressPrinted: false,
    retryAttempted: false,
    fallbackAttempted: false,
    providerGenerationAttempted: false,
  }))
  process.exitCode = 1
}
