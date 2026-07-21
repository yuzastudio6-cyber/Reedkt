import type { PersistedArtifactResult } from
  '../validation/private-artifact-qa-authority-schemas'
import { ApiError } from '../errors/api-error'
import {
  projectCanonicalPrivateProviderAttemptConsumerReceiptV2,
} from './canonical-private-provider-attempt-consumer-receipt-service'
import {
  readCanonicalPrivateProviderOutputArtifactBridgeRecord,
} from './canonical-private-provider-output-artifact-store'
import {
  readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2,
} from './private-canonical-provider-candidate-store'
import {
  readPrivateCanonicalProviderDispatchAggregate,
} from './private-canonical-provider-dispatch-store'
import type {
  CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'

export interface VerifiedCanonicalPrivateProviderOutputArtifact {
  bytes: Buffer
  role:
    | 'provider_storytelling_speech_audio_mp3'
    | 'provider_storytelling_speech_alignment_json'
  contentType: 'audio/mpeg' | 'application/json'
  sha256: string
  byteLength: number
  privateObjectIdentityHash: string
  executionAttemptId: string
  runnerClass: 'canonical_private_provider_attempt_receipt_v2'
  providerQueueClaimId: string
  providerQueueClaimHash: string
  providerQueueDeliveryAttempt: number
  providerReceiptHash: string
  providerOutputSetDigest: string
  providerCandidateReadbackEvidenceHash: string
  productionId: string
  productionAuthorityHash: string
  preparedScriptSegmentId: string
  sceneId: string
  voiceBibleVersionId: string
  voiceBibleContentDigest: string
  spokenTextDigest: string
  timingAuthorityDigest: string
  startFrame: number
  endFrameExclusive: number
  frameRate: 24 | 30
  sourceAuthorityDigest: string
}

export async function verifyCanonicalPrivateProviderOutputArtifact(input: {
  localStorageRoot: string
  ownerUserId: string
  artifact: PersistedArtifactResult
}): Promise<VerifiedCanonicalPrivateProviderOutputArtifact> {
  const run = input.artifact.actualRunEvidence
  if (
    run.state !== 'actual_provider_attempt_receipt_verified_v1' ||
    !run.actualRunVerified || run.exitCode !== 0 || run.toolIds.length !== 0 ||
    run.runnerClass !== 'canonical_private_provider_attempt_receipt_v2'
  ) throw invalid('Artifact does not carry exact provider-attempt run evidence.')
  const bridge = await readCanonicalPrivateProviderOutputArtifactBridgeRecord({
    localStorageRoot: input.localStorageRoot,
    ownerUserId: input.ownerUserId,
    workspaceId: input.artifact.identity.workspaceId,
    recordHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (!bridge) throw invalid('Provider-output bridge record is missing.')
  const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot: input.localStorageRoot,
    ownerUserId: bridge.ownerUserId,
    workspaceId: bridge.authorization.workspaceId,
    projectId: bridge.authorization.projectId,
    editSessionId: bridge.authorization.editSessionId,
    packageRecordId: bridge.authorization.packageRecordId,
    approvedPlanSnapshotId: bridge.authorization.approvedPlanSnapshotId,
  }
  const currentReceipt =
    await projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope,
      executionPackage: bridge.executionPackage,
      queueDefinition: bridge.queueDefinition,
      authorization: bridge.authorization,
      projectedAt: bridge.receipt.projectedAt,
    })
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({ scope })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.grantId === currentReceipt.dispatch.grantId)
  const attempt = entry?.attempt
  const terminal = entry?.terminalHistory.find((candidate) =>
    candidate.terminalHash === currentReceipt.dispatch.terminalHash)
  if (
    currentReceipt.receiptHash !== bridge.receipt.receiptHash ||
    !entry || !attempt || !terminal ||
    terminal.schemaVersion !== 'canonical-private-provider-dispatch-terminal-v2' ||
    terminal.privateOutputs.length !== 2
  ) throw invalid('Provider-output source receipt changed after artifact admission.')
  const processing =
    await readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2({
      localStorageRoot: input.localStorageRoot,
      authorization: bridge.authorization,
      dispatchAttempt: attempt,
      outputs: [terminal.privateOutputs[0]!, terminal.privateOutputs[1]!],
      outputSetDigest: terminal.outputSetDigest,
    })
  const selected = processing[bridge.outputOrdinal]
  if (
    !selected || selected.readback.output.outputId !== bridge.outputId ||
    selected.readback.output.role !== bridge.outputRole ||
    selected.readback.output.contentSha256 !== bridge.outputContentSha256 ||
    selected.readback.output.byteLength !== bridge.outputByteLength ||
    selected.readback.output.privateObjectIdentityHash !==
      bridge.outputPrivateObjectIdentityHash ||
    selected.readback.sourceReadbackEvidenceHash !==
      bridge.outputReadbackEvidenceHash ||
    input.artifact.content.sha256 !== bridge.outputContentSha256 ||
    input.artifact.content.byteLength !== bridge.outputByteLength ||
    input.artifact.content.contentType !== selected.readback.output.mimeType ||
    input.artifact.storageIdentity.opaqueObjectIdentityHash !== bridge.recordHash ||
    run.executionAttemptId !== currentReceipt.dispatch.dispatchAttemptId ||
    run.runnerEvidenceHash !== currentReceipt.receiptHash ||
    run.providerOperationId !== currentReceipt.provider.operationId ||
    run.providerRoute !== currentReceipt.provider.providerRouteId ||
    run.providerOutputRole !== bridge.outputRole ||
    run.providerAuthorizationHash !== bridge.authorization.authorityHash ||
    run.providerTerminalHash !== currentReceipt.dispatch.terminalHash ||
    run.providerOutputSetDigest !== currentReceipt.outputSet.outputSetDigest ||
    run.providerReceiptHash !== currentReceipt.receiptHash ||
    run.providerQueueClaimId !== currentReceipt.queue.claimId ||
    run.providerQueueClaimHash !== currentReceipt.queue.claimHash ||
    run.providerCandidateReadbackEvidenceHash !==
      bridge.outputReadbackEvidenceHash ||
    run.providerCandidatePrivateObjectIdentityHash !==
      bridge.outputPrivateObjectIdentityHash ||
    run.productionAuthorityHash !==
      bridge.normalizationAuthority.productionAuthorityHash ||
    run.sourceAuthorityDigest !==
      bridge.normalizationAuthority.sourceAuthorityDigest ||
    run.dispatchGrantId !== currentReceipt.dispatch.grantId
  ) throw invalid('Provider-output artifact no longer matches its exact receipt and bytes.')
  return {
    bytes: selected.bytes,
    role: bridge.outputRole,
    contentType: selected.readback.output.mimeType,
    sha256: bridge.outputContentSha256,
    byteLength: bridge.outputByteLength,
    privateObjectIdentityHash: bridge.outputPrivateObjectIdentityHash,
    executionAttemptId: currentReceipt.dispatch.dispatchAttemptId,
    runnerClass: 'canonical_private_provider_attempt_receipt_v2',
    providerQueueClaimId: currentReceipt.queue.claimId,
    providerQueueClaimHash: currentReceipt.queue.claimHash,
    providerQueueDeliveryAttempt: currentReceipt.queue.deliveryAttempt,
    providerReceiptHash: currentReceipt.receiptHash,
    providerOutputSetDigest: currentReceipt.outputSet.outputSetDigest,
    providerCandidateReadbackEvidenceHash:
      bridge.outputReadbackEvidenceHash,
    productionId: bridge.normalizationAuthority.productionId,
    productionAuthorityHash:
      bridge.normalizationAuthority.productionAuthorityHash,
    preparedScriptSegmentId:
      bridge.normalizationAuthority.preparedScriptSegmentId,
    sceneId: bridge.normalizationAuthority.sceneId,
    voiceBibleVersionId:
      bridge.normalizationAuthority.voiceBibleVersionId,
    voiceBibleContentDigest:
      bridge.normalizationAuthority.voiceBibleContentDigest,
    spokenTextDigest: bridge.normalizationAuthority.spokenTextDigest,
    timingAuthorityDigest:
      bridge.normalizationAuthority.timingAuthorityDigest,
    startFrame: bridge.normalizationAuthority.startFrame,
    endFrameExclusive: bridge.normalizationAuthority.endFrameExclusive,
    frameRate: bridge.normalizationAuthority.frameRate,
    sourceAuthorityDigest:
      bridge.normalizationAuthority.sourceAuthorityDigest,
  }
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_provider_output_artifact_verification',
  })
}
