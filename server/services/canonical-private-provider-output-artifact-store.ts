import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalProviderWorkAuthorizationV2Schema,
  type CanonicalProviderWorkAuthorizationV2,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  validateCanonicalStorytellingSpeechNormalizationPayload,
} from '../edit-architecture/canonical-storytelling-speech-normalization-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
  type CanonicalProviderAttemptConsumerReceipt,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'
import type {
  OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload,
} from '../tool-execution/media-binary-execution/offline-media-binary-protocol'

export const CANONICAL_PRIVATE_PROVIDER_OUTPUT_ARTIFACT_BRIDGE_VERSION =
  'canonical-private-provider-output-artifact-bridge-v1' as const

export interface CanonicalPrivateProviderOutputArtifactBridgeRecord {
  schemaVersion: typeof CANONICAL_PRIVATE_PROVIDER_OUTPUT_ARTIFACT_BRIDGE_VERSION
  source: 'canonical_private_provider_receipt_and_candidate_readback'
  ownerUserId: string
  workspaceId: string
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorizationV2
  receipt: CanonicalProviderAttemptConsumerReceipt
  normalizationAuthority:
    OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload
  outputOrdinal: 0 | 1
  outputId: string
  outputRole:
    | 'provider_storytelling_speech_audio_mp3'
    | 'provider_storytelling_speech_alignment_json'
  outputContentSha256: string
  outputByteLength: number
  outputPrivateObjectIdentityHash: string
  outputReadbackEvidenceHash: string
  createdAt: string
  recordHash: string
}

export async function persistCanonicalPrivateProviderOutputArtifactBridgeRecord(
  input: Omit<CanonicalPrivateProviderOutputArtifactBridgeRecord,
    'schemaVersion' | 'source' | 'recordHash'> & { localStorageRoot: string },
): Promise<CanonicalPrivateProviderOutputArtifactBridgeRecord> {
  const { localStorageRoot, ...recordInput } = input
  const normalizationAuthority =
    validateCanonicalStorytellingSpeechNormalizationPayload(
      input.normalizationAuthority,
    )
  const authorization = canonicalProviderWorkAuthorizationV2Schema.parse(
    input.authorization,
  )
  const queueDefinition = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(
    input.queueDefinition,
  )
  const receipt = canonicalProviderAttemptConsumerReceiptSchema.parse(input.receipt)
  assertPackage(input.executionPackage)
  assertBindings({
    ...recordInput, authorization, queueDefinition, receipt, normalizationAuthority,
  })
  const withoutHash = {
    schemaVersion: CANONICAL_PRIVATE_PROVIDER_OUTPUT_ARTIFACT_BRIDGE_VERSION,
    source: 'canonical_private_provider_receipt_and_candidate_readback' as const,
    ...recordInput,
    authorization,
    queueDefinition,
    receipt,
    normalizationAuthority,
  }
  const record = { ...withoutHash, recordHash: sha256AuthorityValue(withoutHash) }
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (bytes.byteLength > 2 * 1024 * 1024) {
    throw invalid('Provider-output artifact bridge record exceeds its fixed bound.')
  }
  const written = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: bridgeRoot({ localStorageRoot }),
    relativePath: bridgeRelativePath(record.recordHash),
    content: bytes,
  })
  if (!written.created) {
    const existing = await readPrivateFileIfExistsWithinRoot({
      rootPath: bridgeRoot({ localStorageRoot }),
      relativePath: bridgeRelativePath(record.recordHash),
    })
    if (!existing || !existing.equals(bytes)) {
      throw invalid('Provider-output artifact bridge create-only replay changed.')
    }
  }
  return record
}

export async function readCanonicalPrivateProviderOutputArtifactBridgeRecord(
  input: {
    localStorageRoot: string
    ownerUserId: string
    workspaceId: string
    recordHash: string
  },
): Promise<CanonicalPrivateProviderOutputArtifactBridgeRecord | undefined> {
  if (!/^[a-f0-9]{64}$/u.test(input.recordHash)) throw invalid('Bridge record hash is invalid.')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: bridgeRoot(input),
    relativePath: bridgeRelativePath(input.recordHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength > 2 * 1024 * 1024) throw invalid('Bridge record is oversized.')
  let raw: unknown
  try { raw = JSON.parse(bytes.toString('utf8')) } catch {
    throw invalid('Bridge record is not valid JSON.')
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalid('Bridge record is invalid.')
  }
  const value = raw as Record<string, unknown>
  const authorization = canonicalProviderWorkAuthorizationV2Schema.parse(value.authorization)
  const queueDefinition = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(
    value.queueDefinition,
  )
  const receipt = canonicalProviderAttemptConsumerReceiptSchema.parse(value.receipt)
  const normalizationAuthority =
    validateCanonicalStorytellingSpeechNormalizationPayload(
      value.normalizationAuthority,
    )
  const executionPackage = value.executionPackage as CanonicalApprovedEditExecutionPackage
  assertPackage(executionPackage)
  const record = {
    ...value,
    authorization,
    queueDefinition,
    receipt,
    normalizationAuthority,
    executionPackage,
  } as unknown as CanonicalPrivateProviderOutputArtifactBridgeRecord
  const { recordHash, ...withoutHash } = record
  if (
    record.schemaVersion !==
      CANONICAL_PRIVATE_PROVIDER_OUTPUT_ARTIFACT_BRIDGE_VERSION ||
    record.source !== 'canonical_private_provider_receipt_and_candidate_readback' ||
    record.ownerUserId !== input.ownerUserId ||
    record.workspaceId !== input.workspaceId ||
    recordHash !== input.recordHash ||
    recordHash !== sha256AuthorityValue(withoutHash)
  ) throw invalid('Provider-output artifact bridge integrity changed.')
  assertBindings(record)
  return record
}

function assertBindings(input: Omit<
  CanonicalPrivateProviderOutputArtifactBridgeRecord,
  'schemaVersion' | 'source' | 'recordHash'
> | CanonicalPrivateProviderOutputArtifactBridgeRecord): void {
  const output = input.receipt.privateOutputs[input.outputOrdinal]
  if (
    input.ownerUserId !== input.authorization.ownerUserId ||
    input.workspaceId !== input.authorization.workspaceId ||
    input.executionPackage.workspaceId !== input.workspaceId ||
    input.executionPackage.packageRecordId !== input.authorization.packageRecordId ||
    input.executionPackage.packageHash !== input.authorization.packageHash ||
    input.queueDefinition.definitionHash !== input.authorization.queueDefinitionHash ||
    input.receipt.identity.authorizationHash !== input.authorization.authorityHash ||
    input.receipt.provider.operationId !== input.normalizationAuthority.sourceProviderOperationId ||
    input.receipt.evidenceClass !== 'private_injected_nonprovider_test' ||
    input.receipt.promotionClass !== 'non_promotable_private_injected' ||
    input.receipt.boundaries.canonicalBackendVerifiedRuntime ||
    input.receipt.boundaries.promotionAuthorized ||
    input.receipt.boundaries.productionReady ||
    !output || output.outputId !== input.outputId ||
    output.role !== input.outputRole ||
    output.contentSha256 !== input.outputContentSha256 ||
    output.byteLength !== input.outputByteLength ||
    output.privateObjectIdentityHash !== input.outputPrivateObjectIdentityHash ||
    !/^[a-f0-9]{64}$/u.test(input.outputReadbackEvidenceHash) ||
    (input.outputOrdinal === 0) !==
      (input.outputRole === 'provider_storytelling_speech_audio_mp3') ||
    input.normalizationAuthority.sourceAuthorityDigest !==
      input.authorization.sourceRequestDigest
  ) throw invalid('Provider-output artifact bridge lost exact source authority.')
}

function assertPackage(value: CanonicalApprovedEditExecutionPackage): void {
  if (
    !value || typeof value !== 'object' ||
    value.schemaVersion !== 'canonical-approved-edit-execution-package-v5' ||
    !/^[a-f0-9]{64}$/u.test(value.packageHash)
  ) throw invalid('Execution package hash is invalid.')
}

function bridgeRoot(input: { localStorageRoot?: string }): string {
  if (!input.localStorageRoot) throw invalid('Provider-output bridge storage root is missing.')
  return input.localStorageRoot
}

function bridgeRelativePath(recordHash: string): string {
  return `private-internal/provider-output-artifact-bridges/v1/${recordHash.slice(0, 2)}/${recordHash}.json`
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_provider_output_artifact_bridge',
  })
}
