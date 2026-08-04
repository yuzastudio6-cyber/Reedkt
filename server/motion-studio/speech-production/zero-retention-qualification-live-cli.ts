import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechZeroRetentionQualificationLiveOperator } from './zero-retention-qualification-live-operator'

try {
  const result = await executeMotionStudioSpeechZeroRetentionQualificationLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    evidenceDigest: result.evidenceDigest,
    zeroRetentionRequestAccepted: result.zeroRetentionRequestAccepted,
    zeroRetentionHistoryAbsenceVerified: result.zeroRetentionHistoryAbsenceVerified,
    zeroRetentionEntitlementVerified: result.zeroRetentionEntitlementVerified,
    exactQualificationRequestFundedWithoutPurchase:
      result.exactQualificationRequestFundedWithoutPurchase,
    productionQuotaSufficiencyVerified: result.productionQuotaSufficiencyVerified,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerHttpRequestCount: result.providerHttpRequestCount,
    providerGenerationSubmissionCount: result.providerGenerationSubmissionCount,
    providerGenerationCompletedCount: result.providerGenerationCompletedCount,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    publicListProviderCostMicros: result.publicListProviderCostMicros,
    maximumInternalProductionCostMicros: result.maximumInternalProductionCostMicros,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
    finalTakeSelectionAllowed: result.finalTakeSelectionAllowed,
    timelineMutationAllowed: result.timelineMutationAllowed,
    customerBillingPerformed: result.customerBillingPerformed,
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
    retryAttempted: false,
    fallbackAttempted: false,
    productReadinessClaimed: false,
  }))
  process.exitCode = 1
}
