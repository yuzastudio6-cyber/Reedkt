import { ApiError } from '../../errors/api-error'
import { executeMotionStudioSpeechVoiceCatalogLiveOperator } from './voice-catalog-live-operator'

try {
  const result = await executeMotionStudioSpeechVoiceCatalogLiveOperator({
    repositoryRoot: process.cwd(),
    now: new Date().toISOString(),
  })
  console.log(JSON.stringify({
    ok: true,
    state: result.state,
    authorizationId: result.authorizationId,
    authorityPacketDigest: result.authorityPacketDigest,
    catalogEvidenceDigest: result.catalogEvidenceDigest,
    candidateCount: result.candidateCount,
    credentialPayloadReadCount: result.credentialPayloadReadCount,
    providerRequestCount: result.providerRequestCount,
    previewDownloadCount: result.previewDownloadCount,
    automaticVoiceSelectionCount: result.automaticVoiceSelectionCount,
    voiceBindingCreationCount: result.voiceBindingCreationCount,
    accountPreflightCount: result.accountPreflightCount,
    providerGenerationCount: result.providerGenerationCount,
    privateEvidenceRelativePath: result.privateEvidenceRelativePath,
  }))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    state: 'blocked_or_consumed_terminal',
    code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
    secretValuePrinted: false,
    retryAttempted: false,
    fallbackAttempted: false,
  }))
  process.exitCode = 1
}
