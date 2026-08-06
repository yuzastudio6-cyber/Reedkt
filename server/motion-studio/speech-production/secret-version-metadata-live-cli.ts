import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechSecretVersionMetadataLiveOperator } from './secret-version-metadata-live-operator'

try {
  const result = await executeMotionStudioSpeechSecretVersionMetadataLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    secretVersionState: result.secretVersionState,
    metadataReadableByConfiguredAccount: result.metadataReadableByConfiguredAccount,
    secretPayloadReadVerified: result.secretPayloadReadVerified,
    providerCapabilityVerified: result.providerCapabilityVerified,
    googleCloudCommandCount: result.googleCloudCommandCount,
    secretPayloadReadCount: result.secretPayloadReadCount,
    providerRequestCount: result.providerRequestCount,
    automaticRetryCount: result.automaticRetryCount,
    automaticFallbackCount: result.automaticFallbackCount,
    evidenceDigest: result.evidenceDigest,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    rawCommandOutputPrinted: false,
    rawCommandErrorPrinted: false,
    secretPayloadReadAttempted: false,
    providerRequestAttempted: false,
    retryAttempted: false,
    fallbackAttempted: false,
  }))
  process.exitCode = 1
}
