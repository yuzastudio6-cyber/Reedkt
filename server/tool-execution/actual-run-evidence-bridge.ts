import { createHash } from 'node:crypto'
import { basename, extname } from 'node:path'
import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import {
  readPrivateFileIfExistsWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import { PRODUCTION_TOOL_IDS } from '../tool-registry/production-tool-types'
import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'
import {
  promotePrivateWorkerOutputCreateOnly,
  type PrivateCanonicalWorkerSandbox,
} from '../workers/canonical-runtime/private-worker-sandbox'
import {
  ACTUAL_ARTIFACT_RUN_EVIDENCE_VERSION,
  ACTUAL_ARTIFACT_RUN_RECORD_VERSION,
  actualArtifactRunEvidenceSchema,
  collectActualRunEvidenceRequestSchema,
  persistedActualArtifactRunEvidenceSchema,
  serverVerifiedCompletedRunReceiptSchema,
  type ActualArtifactRunEvidence,
  type ActualRunIdentity,
  type CollectActualRunEvidenceRequest,
  type ServerVerifiedCompletedRunReceipt,
} from './actual-run-evidence-schemas'
import {
  sha256ArtifactQaValue,
  stableArtifactQaStringify,
} from '../services/private-artifact-qa-authority-store'

export interface ServerInjectedCompletedRunReceiptProvider {
  readonly providerKind: 'server_injected_completed_run_receipt_provider'
  loadCompletedRun(request: Readonly<CollectActualRunEvidenceRequest>): Promise<unknown>
}

export interface ServerInjectedSandboxOutputLocator {
  readonly locatorKind: 'server_injected_private_sandbox_output_locator'
  locateOutput(request: Readonly<CollectActualRunEvidenceRequest>): Promise<unknown>
}

export interface LocatedPrivateSandboxOutput {
  sandbox: PrivateCanonicalWorkerSandbox
  scratchRelativePath: string
}

export interface ActualRunEvidenceBridgeConfig {
  env: RuntimeEnv
  maximumArtifactBytes: number
  receiptProvider: ServerInjectedCompletedRunReceiptProvider
  outputLocator: ServerInjectedSandboxOutputLocator
}

export interface ActualRunEvidenceBridgeResult {
  evidence: ActualArtifactRunEvidence
  artifactAuthorityEnvelope: ActualArtifactRunEvidence['artifactAuthorityEnvelope']
  replayed: boolean
  testOnly: true
  warnings: string[]
}

const evidenceLocks = new Map<string, Promise<void>>()

export function clearActualRunEvidenceBridgeProcessStateForSmoke(): void {
  evidenceLocks.clear()
}

export function actualRunEvidenceIdentityHash(
  identity: ActualRunIdentity,
): string {
  return sha256ArtifactQaValue(identity)
}

export function actualRunPromotedArtifactRelativePath(
  identity: ActualRunIdentity,
): string {
  const identityHash = actualRunEvidenceIdentityHash(identity)
  return [
    'actual-run-evidence',
    'promoted',
    'private-v2',
    identityHash.slice(0, 2),
    `${identityHash}.artifact`,
  ].join('/')
}

export function actualRunEvidenceRecordRelativePath(
  identity: ActualRunIdentity,
): string {
  const identityHash = actualRunEvidenceIdentityHash(identity)
  return [
    'actual-run-evidence',
    'records',
    'private-v2',
    identityHash.slice(0, 2),
    `${identityHash}.json`,
  ].join('/')
}

/**
 * Verifies one already-completed private sandbox result and promotes its bytes.
 *
 * The request carries identities only. Runner claims and the sandbox locator
 * come from server-injected providers. The bridge never runs a tool, validates
 * a lease credential, mutates credits, renders, or authorizes downstream work.
 */
export function createActualRunEvidenceBridge(config: ActualRunEvidenceBridgeConfig) {
  assertBridgeConfig(config)
  return {
    async collect(input: CollectActualRunEvidenceRequest): Promise<ActualRunEvidenceBridgeResult> {
      const request = parseRequest(input)
      requirePrivateLocalRuntime(config.env)
      const identity = identityFrom(request)
      const identityHash = actualRunEvidenceIdentityHash(identity)

      return withProcessLock(evidenceLocks, identityHash, async () => {
        const existing = await readEvidenceRecordIfExists(config.env.localStorageRoot, identity)
        if (existing) {
          await verifyPersistedEvidenceAndPromotedBytes(config.env.localStorageRoot, existing, identity)
          return bridgeResult(existing, true)
        }

        const receipt = await loadAndVerifyReceipt(config.receiptProvider, request, identityHash)
        const located = await locateAndVerifySandboxOutput(
          config.outputLocator,
          request,
          receipt,
          config.env.localStorageRoot,
        )
        const promotedRelativePath = actualRunPromotedArtifactRelativePath(identity)
        let promoted: Awaited<ReturnType<typeof promotePrivateWorkerOutputCreateOnly>>
        try {
          promoted = await promotePrivateWorkerOutputCreateOnly({
            sandbox: located.sandbox,
            scratchRelativePath: located.scratchRelativePath,
            artifactRelativePath: promotedRelativePath,
            maximumBytes: config.maximumArtifactBytes,
          })
        } catch (error) {
          if (error instanceof ApiError && error.code === 'IDEMPOTENCY_CONFLICT') {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'Create-only actual-run artifact promotion collided with an existing output identity.',
              409,
              { reason: 'actual_run_promoted_object_collision' },
            )
          }
          if (isNodeErrorWithCode(error, 'ELOOP')) {
            throw new ApiError(
              'VALIDATION_FAILED',
              'Actual-run evidence bridge refused a symbolic-link artifact path.',
              409,
              { reason: 'actual_run_artifact_symlink_refused' },
            )
          }
          throw error
        }
        if (
          promoted.byteLength !== receipt.reportedOutput.byteLength ||
          promoted.checksumSha256 !== receipt.reportedOutput.sha256
        ) {
          throw new ApiError(
            'UPLOAD_SOURCE_MISMATCH',
            'Sandbox output bytes do not match the server-verified completed-run receipt.',
            409,
            {
              expectedByteLength: receipt.reportedOutput.byteLength,
              actualByteLength: promoted.byteLength,
            },
          )
        }

        const promotedBytes = await readPrivateFileIfExistsWithinRoot({
          rootPath: config.env.localStorageRoot,
          relativePath: promotedRelativePath,
        })
        if (!promotedBytes) {
          throw new ApiError('UPLOAD_NOT_FINALIZED', 'Promoted actual-run artifact was not found.', 409)
        }
        const detectedMime = detectSupportedMime(promotedBytes)
        const promotedSha256 = sha256ArtifactQaValueForBytes(promotedBytes)
        if (
          promotedBytes.byteLength !== receipt.reportedOutput.byteLength ||
          promotedSha256 !== receipt.reportedOutput.sha256 ||
          detectedMime !== receipt.reportedOutput.contentType
        ) {
          throw new ApiError(
            'UPLOAD_SOURCE_MISMATCH',
            'Re-read promoted artifact hash, size, or MIME does not match completed-run evidence.',
            409,
            {
              expectedByteLength: receipt.reportedOutput.byteLength,
              actualByteLength: promotedBytes.byteLength,
              expectedContentType: receipt.reportedOutput.contentType,
              actualContentType: detectedMime,
            },
          )
        }

        const evidence = buildEvidence({
          identity,
          identityHash,
          receipt,
          promotedSha256,
          promotedByteLength: promotedBytes.byteLength,
          detectedMime,
          sandboxIdentityHash: sha256ArtifactQaValue({
            schemaVersion: located.sandbox.schemaVersion,
            sandboxId: located.sandbox.sandboxId,
            privateInternalOnly: located.sandbox.privateInternalOnly,
          }),
        })
        await persistEvidenceRecord(config.env.localStorageRoot, evidence)
        await verifyPersistedEvidenceAndPromotedBytes(config.env.localStorageRoot, evidence, identity)
        return bridgeResult(evidence, false)
      })
    },

    async read(input: CollectActualRunEvidenceRequest): Promise<ActualRunEvidenceBridgeResult> {
      const request = parseRequest(input)
      requirePrivateLocalRuntime(config.env)
      const identity = identityFrom(request)
      const evidence = await readEvidenceRecordIfExists(config.env.localStorageRoot, identity)
      if (!evidence) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Actual-run evidence record was not found.', 404)
      }
      await verifyPersistedEvidenceAndPromotedBytes(config.env.localStorageRoot, evidence, identity)
      return bridgeResult(evidence, true)
    },
  }
}

async function loadAndVerifyReceipt(
  provider: ServerInjectedCompletedRunReceiptProvider,
  request: CollectActualRunEvidenceRequest,
  identityHash: string,
): Promise<ServerVerifiedCompletedRunReceipt> {
  if (provider.providerKind !== 'server_injected_completed_run_receipt_provider') {
    throw new ApiError('TOOL_NOT_READY', 'Completed-run receipt provider is not server-verified.', 503)
  }
  const raw = await provider.loadCompletedRun(deepFreeze(structuredClone(request)))
  const parsed = serverVerifiedCompletedRunReceiptSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Server-injected completed-run receipt is invalid.',
      409,
      parsed.error.flatten(),
    )
  }
  const receipt = parsed.data
  const identity = identityFrom(request)
  const expectedOutputCommitment = outputCommitmentHash(receipt)
  if (
    stableArtifactQaStringify(receipt.identity) !== stableArtifactQaStringify(identity) ||
    receipt.identityHash !== identityHash ||
    receipt.reportedOutput.outputCommitmentHash !== expectedOutputCommitment
  ) {
    throw new ApiError(
      'APPROVED_SNAPSHOT_REQUIRED',
      'Completed-run receipt tenant, snapshot, job, work-item, lease, attempt, sandbox, output, or tool lineage is invalid.',
      409,
    )
  }
  if (!PRODUCTION_TOOL_IDS.includes(receipt.identity.toolId as (typeof PRODUCTION_TOOL_IDS)[number])) {
    throw new ApiError('TOOL_NOT_READY', 'Completed-run receipt references an unregistered tool ID.', 409)
  }
  assertNoSecretLikeContent(receipt, 'Completed-run receipt')
  return receipt
}

async function locateAndVerifySandboxOutput(
  locator: ServerInjectedSandboxOutputLocator,
  request: CollectActualRunEvidenceRequest,
  receipt: ServerVerifiedCompletedRunReceipt,
  localStorageRoot: string,
): Promise<LocatedPrivateSandboxOutput> {
  if (locator.locatorKind !== 'server_injected_private_sandbox_output_locator') {
    throw new ApiError('TOOL_NOT_READY', 'Sandbox output locator is not server-verified.', 503)
  }
  const raw = await locator.locateOutput(deepFreeze(structuredClone(request)))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ApiError('VALIDATION_FAILED', 'Sandbox output locator returned an invalid record.', 409)
  }
  const keys = Object.keys(raw).sort()
  if (stableArtifactQaStringify(keys) !== stableArtifactQaStringify(['sandbox', 'scratchRelativePath'])) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Sandbox output locator returned caller-controlled or unsupported fields.',
      409,
    )
  }
  const candidate = raw as Partial<LocatedPrivateSandboxOutput>
  if (
    !candidate.sandbox ||
    typeof candidate.scratchRelativePath !== 'string' ||
    candidate.sandbox.sandboxId !== request.sandboxId ||
    candidate.sandbox.localStorageRoot !== localStorageRoot ||
    receipt.identity.sandboxId !== candidate.sandbox.sandboxId
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Sandbox output locator identity is invalid.', 409)
  }
  const scratchRelativePath = candidate.scratchRelativePath
  const expectedPrefix = `${candidate.sandbox.relativeDirectory}/outputs/`
  const fileName = basename(scratchRelativePath)
  const stem = fileName.slice(0, fileName.length - extname(fileName).length)
  if (
    scratchRelativePath.includes('://') ||
    scratchRelativePath.includes('..') ||
    !scratchRelativePath.startsWith(expectedPrefix) ||
    stem !== request.outputId
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Sandbox output locator escaped the expected output identity.', 409)
  }
  return { sandbox: candidate.sandbox, scratchRelativePath }
}

function buildEvidence(input: {
  identity: ActualRunIdentity
  identityHash: string
  receipt: ServerVerifiedCompletedRunReceipt
  promotedSha256: string
  promotedByteLength: number
  detectedMime: ServerVerifiedCompletedRunReceipt['reportedOutput']['contentType']
  sandboxIdentityHash: string
}): ActualArtifactRunEvidence {
  const privateObjectIdentityHash = sha256ArtifactQaValue({
    identityHash: input.identityHash,
    contentSha256: input.promotedSha256,
    storageClass: 'private_actual_run_promoted_v2',
  })
  const runCore = actualRunCore({
    identity: input.identity,
    identityHash: input.identityHash,
    receipt: input.receipt,
    artifact: {
      artifactVersion: input.receipt.artifactVersion,
      attemptKind: input.receipt.attemptKind,
      ...(input.receipt.replacesArtifactId
        ? { replacesArtifactId: input.receipt.replacesArtifactId }
        : {}),
      sha256: input.promotedSha256,
      byteLength: input.promotedByteLength,
      contentType: input.detectedMime,
      privateObjectIdentityHash,
    },
    sandboxIdentityHash: input.sandboxIdentityHash,
  })
  const runEvidenceHash = sha256ArtifactQaValue(runCore)
  const artifactAuthorityEnvelope = {
    schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
    evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
    evidenceClass: 'private_internal_test_attested' as const,
    artifactVersion: input.receipt.artifactVersion,
    attemptKind: input.receipt.attemptKind,
    ...(input.receipt.replacesArtifactId
      ? { replacesArtifactId: input.receipt.replacesArtifactId }
      : {}),
    content: {
      sha256: input.promotedSha256,
      byteLength: input.promotedByteLength,
      contentType: input.detectedMime,
    },
    storageIdentity: {
      storageKind: 'private_local_test' as const,
      opaqueObjectIdentityHash: privateObjectIdentityHash,
    },
    placeholder: { isPlaceholder: false, scope: 'none' as const },
    actualRunEvidence: {
      state: 'actual_run_evidence_placeholder' as const,
      executionAttemptId: input.identity.attemptId,
      runnerClass: input.receipt.runner.runnerClass,
      runnerEvidenceHash: runEvidenceHash,
      startedAt: input.receipt.timing.startedAt,
      finishedAt: input.receipt.timing.finishedAt,
      exitCode: input.receipt.timing.exitCode,
      toolIds: [input.identity.toolId],
      actualRunVerified: false as const,
    },
    completedAt: input.receipt.timing.finishedAt,
  }
  const createdAt = new Date().toISOString()
  const withoutHash = {
    schemaVersion: ACTUAL_ARTIFACT_RUN_EVIDENCE_VERSION,
    source: 'private_actual_artifact_run_evidence_bridge' as const,
    identity: input.identity,
    identityHash: input.identityHash,
    runEvidenceHash,
    lease: {
      leaseId: input.identity.leaseId,
      leaseAuthorityHash: input.receipt.leaseAuthorityHash,
      workerIdentity: input.receipt.workerIdentity,
      attemptNumber: input.receipt.attemptNumber,
      verifiedByLeaseAuthority: false as const,
    },
    artifact: {
      artifactVersion: input.receipt.artifactVersion,
      attemptKind: input.receipt.attemptKind,
      ...(input.receipt.replacesArtifactId
        ? { replacesArtifactId: input.receipt.replacesArtifactId }
        : {}),
      sha256: input.promotedSha256,
      byteLength: input.promotedByteLength,
      contentType: input.detectedMime,
      privateObjectIdentityHash,
      sourceBytesMatchedReceipt: true as const,
      createOnlyPromotionCommitted: true as const,
      promotedBytesReRead: true as const,
      promotedHashSizeMimeVerified: true as const,
      placeholder: false as const,
    },
    runner: { ...input.receipt.runner },
    timing: { ...input.receipt.timing },
    resources: { ...input.receipt.resources },
    cost: { ...input.receipt.cost },
    effects: { ...input.receipt.effects },
    sandbox: {
      sandboxId: input.identity.sandboxId,
      outputId: input.identity.outputId,
      sandboxIdentityHash: input.sandboxIdentityHash,
      outputCommitmentHash: input.receipt.reportedOutput.outputCommitmentHash,
      locatorPersisted: false as const,
    },
    verification: {
      sourceReadNoFollow: true as const,
      privateCreateOnlyPromotion: true as const,
      promotedReadNoFollow: true as const,
      reportedAndActualHashMatch: true as const,
      reportedAndActualSizeMatch: true as const,
      detectedAndExpectedMimeMatch: true as const,
      receiptContainsNoPlaceholder: true as const,
    },
    artifactAuthorityEnvelope,
    bridgeState: {
      privateLocalOnly: true as const,
      actualArtifactBytesVerified: true as const,
      actualRunnerReceiptVerified: true as const,
      existingArtifactAuthorityIntegrationState: 'compatible_non_authorizing_placeholder_bridge' as const,
      leaseAuthorityIntegrated: false as const,
      productionPersistenceIntegrated: false as const,
    },
    executionPermissions: {
      workerDispatch: false as const,
      toolExecution: false as const,
      providerCall: false as const,
      render: false as const,
      creditSpend: false as const,
      delivery: false as const,
    },
    createdAt,
  }
  const parsed = actualArtifactRunEvidenceSchema.safeParse({
    ...withoutHash,
    evidenceHash: sha256ArtifactQaValue(withoutHash),
  })
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Server-derived actual artifact-run evidence is invalid.',
      409,
      parsed.error.flatten(),
    )
  }
  assertNoSecretLikeContent(parsed.data, 'Actual artifact-run evidence')
  return parsed.data
}

async function persistEvidenceRecord(
  localStorageRoot: string,
  evidence: ActualArtifactRunEvidence,
): Promise<void> {
  const recordWithoutChecksum = {
    recordVersion: ACTUAL_ARTIFACT_RUN_RECORD_VERSION,
    source: 'private_actual_artifact_run_evidence_store' as const,
    evidence,
  }
  const record = {
    ...recordWithoutChecksum,
    checksumSha256: sha256ArtifactQaValue(recordWithoutChecksum),
  }
  const result = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunEvidenceRecordRelativePath(evidence.identity),
    content: Buffer.from(`${JSON.stringify(record)}\n`, 'utf8'),
  })
  if (!result.created) {
    const existing = await readEvidenceRecordIfExists(localStorageRoot, evidence.identity)
    if (!existing || existing.evidenceHash !== evidence.evidenceHash) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'Actual-run evidence record identity collided.', 409)
    }
  }
}

async function readEvidenceRecordIfExists(
  localStorageRoot: string,
  identity: ActualRunIdentity,
): Promise<ActualArtifactRunEvidence | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunEvidenceRecordRelativePath(identity),
  })
  if (!content) return undefined
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Actual-run evidence record is not valid JSON.', 409)
  }
  const parsed = persistedActualArtifactRunEvidenceSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Actual-run evidence record shape is invalid.',
      409,
      parsed.error.flatten(),
    )
  }
  const recordWithoutChecksum = {
    recordVersion: parsed.data.recordVersion,
    source: parsed.data.source,
    evidence: parsed.data.evidence,
  }
  if (parsed.data.checksumSha256 !== sha256ArtifactQaValue(recordWithoutChecksum)) {
    throw new ApiError('VALIDATION_FAILED', 'Actual-run evidence record checksum is invalid.', 409)
  }
  assertEvidenceIntegrity(parsed.data.evidence, identity)
  return parsed.data.evidence
}

async function verifyPersistedEvidenceAndPromotedBytes(
  localStorageRoot: string,
  evidence: ActualArtifactRunEvidence,
  expectedIdentity: ActualRunIdentity,
): Promise<void> {
  assertEvidenceIntegrity(evidence, expectedIdentity)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunPromotedArtifactRelativePath(expectedIdentity),
  })
  if (!bytes) throw new ApiError('UPLOAD_NOT_FINALIZED', 'Promoted actual-run artifact is missing.', 409)
  if (
    bytes.byteLength !== evidence.artifact.byteLength ||
    sha256ArtifactQaValueForBytes(bytes) !== evidence.artifact.sha256 ||
    detectSupportedMime(bytes) !== evidence.artifact.contentType
  ) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Promoted actual-run artifact integrity is invalid.', 409)
  }
}

function assertEvidenceIntegrity(
  evidence: ActualArtifactRunEvidence,
  expectedIdentity: ActualRunIdentity,
): void {
  const parsed = actualArtifactRunEvidenceSchema.safeParse(evidence)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Actual-run evidence validation failed.', 409, parsed.error.flatten())
  }
  const { evidenceHash, ...withoutHash } = parsed.data
  const envelope = parsed.data.artifactAuthorityEnvelope
  const expectedPrivateObjectIdentityHash = sha256ArtifactQaValue({
    identityHash: parsed.data.identityHash,
    contentSha256: parsed.data.artifact.sha256,
    storageClass: 'private_actual_run_promoted_v2',
  })
  const expectedOutputCommitmentHash = sha256ArtifactQaValue({
    identityHash: parsed.data.identityHash,
    sandboxId: parsed.data.identity.sandboxId,
    outputId: parsed.data.identity.outputId,
    sha256: parsed.data.artifact.sha256,
    byteLength: parsed.data.artifact.byteLength,
    contentType: parsed.data.artifact.contentType,
    placeholder: false,
  })
  if (
    stableArtifactQaStringify(parsed.data.identity) !== stableArtifactQaStringify(expectedIdentity) ||
    parsed.data.identityHash !== actualRunEvidenceIdentityHash(expectedIdentity) ||
    evidenceHash !== sha256ArtifactQaValue(withoutHash) ||
    parsed.data.runEvidenceHash !== runEvidenceHashFromEvidence(parsed.data) ||
    parsed.data.artifact.privateObjectIdentityHash !== expectedPrivateObjectIdentityHash ||
    parsed.data.sandbox.outputCommitmentHash !== expectedOutputCommitmentHash ||
    envelope.content.sha256 !== parsed.data.artifact.sha256 ||
    envelope.content.byteLength !== parsed.data.artifact.byteLength ||
    envelope.content.contentType !== parsed.data.artifact.contentType ||
    envelope.storageIdentity.opaqueObjectIdentityHash !== parsed.data.artifact.privateObjectIdentityHash ||
    envelope.actualRunEvidence.runnerEvidenceHash !== parsed.data.runEvidenceHash ||
    envelope.actualRunEvidence.actualRunVerified !== false ||
    envelope.placeholder.isPlaceholder !== false
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Actual-run evidence hashes or authority envelope lineage are invalid.', 409)
  }
  assertNoSecretLikeContent(parsed.data, 'Actual artifact-run evidence')
}

function runEvidenceHashFromEvidence(evidence: ActualArtifactRunEvidence): string {
  return sha256ArtifactQaValue({
    identity: evidence.identity,
    identityHash: evidence.identityHash,
    lease: {
      leaseId: evidence.lease.leaseId,
      leaseAuthorityHash: evidence.lease.leaseAuthorityHash,
      workerIdentity: evidence.lease.workerIdentity,
      attemptNumber: evidence.lease.attemptNumber,
    },
    artifact: {
      artifactVersion: evidence.artifact.artifactVersion,
      attemptKind: evidence.artifact.attemptKind,
      ...(evidence.artifact.replacesArtifactId
        ? { replacesArtifactId: evidence.artifact.replacesArtifactId }
        : {}),
      sha256: evidence.artifact.sha256,
      byteLength: evidence.artifact.byteLength,
      contentType: evidence.artifact.contentType,
      privateObjectIdentityHash: evidence.artifact.privateObjectIdentityHash,
    },
    runner: evidence.runner,
    timing: evidence.timing,
    resources: evidence.resources,
    cost: evidence.cost,
    effects: evidence.effects,
    sandbox: {
      sandboxId: evidence.sandbox.sandboxId,
      outputId: evidence.sandbox.outputId,
      sandboxIdentityHash: evidence.sandbox.sandboxIdentityHash,
      outputCommitmentHash: evidence.sandbox.outputCommitmentHash,
    },
  })
}

function actualRunCore(input: {
  identity: ActualRunIdentity
  identityHash: string
  receipt: ServerVerifiedCompletedRunReceipt
  artifact: {
    artifactVersion: number
    attemptKind: ServerVerifiedCompletedRunReceipt['attemptKind']
    replacesArtifactId?: string
    sha256: string
    byteLength: number
    contentType: ServerVerifiedCompletedRunReceipt['reportedOutput']['contentType']
    privateObjectIdentityHash: string
  }
  sandboxIdentityHash: string
}) {
  return {
    identity: input.identity,
    identityHash: input.identityHash,
    lease: {
      leaseId: input.identity.leaseId,
      leaseAuthorityHash: input.receipt.leaseAuthorityHash,
      workerIdentity: input.receipt.workerIdentity,
      attemptNumber: input.receipt.attemptNumber,
    },
    artifact: input.artifact,
    runner: input.receipt.runner,
    timing: input.receipt.timing,
    resources: input.receipt.resources,
    cost: input.receipt.cost,
    effects: input.receipt.effects,
    sandbox: {
      sandboxId: input.identity.sandboxId,
      outputId: input.identity.outputId,
      sandboxIdentityHash: input.sandboxIdentityHash,
      outputCommitmentHash: input.receipt.reportedOutput.outputCommitmentHash,
    },
  }
}

function outputCommitmentHash(receipt: ServerVerifiedCompletedRunReceipt): string {
  return sha256ArtifactQaValue({
    identityHash: receipt.identityHash,
    sandboxId: receipt.identity.sandboxId,
    outputId: receipt.identity.outputId,
    sha256: receipt.reportedOutput.sha256,
    byteLength: receipt.reportedOutput.byteLength,
    contentType: receipt.reportedOutput.contentType,
    placeholder: receipt.reportedOutput.placeholder,
  })
}

function detectSupportedMime(bytes: Buffer): ServerVerifiedCompletedRunReceipt['reportedOutput']['contentType'] {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  const utf8Text = bytes.toString('utf8').trim()
  if (
    /^(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/i.test(utf8Text) &&
    !/(?:<script\b|<foreignObject\b|<!DOCTYPE\b|<!ENTITY\b|\son[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|data:|javascript:|file:))/i.test(utf8Text)
  ) {
    return 'image/svg+xml'
  }
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'video/mp4'
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return 'audio/wav'
  }
  try {
    const value = JSON.parse(utf8Text) as unknown
    if (value !== undefined) return 'application/json'
  } catch {
    // Continue to the fail-closed unsupported MIME result.
  }
  throw new ApiError('VALIDATION_FAILED', 'Sandbox output MIME is unsupported or does not match its bytes.', 409)
}

function assertBridgeConfig(config: ActualRunEvidenceBridgeConfig): void {
  if (
    !Number.isSafeInteger(config.maximumArtifactBytes) ||
    config.maximumArtifactBytes <= 0 ||
    config.maximumArtifactBytes > 512 * 1024 * 1024
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Actual-run artifact byte ceiling is invalid.', 400)
  }
  if (
    config.receiptProvider.providerKind !== 'server_injected_completed_run_receipt_provider' ||
    config.outputLocator.locatorKind !== 'server_injected_private_sandbox_output_locator'
  ) {
    throw new ApiError('TOOL_NOT_READY', 'Actual-run evidence bridge requires server-injected providers.', 503)
  }
}

function parseRequest(input: unknown): CollectActualRunEvidenceRequest {
  const parsed = collectActualRunEvidenceRequestSchema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Actual-run evidence request accepts identity only; paths, URLs, secrets, metrics, and result claims are forbidden.',
      400,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function identityFrom(input: CollectActualRunEvidenceRequest): ActualRunIdentity {
  return {
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    snapshotId: input.snapshotId,
    jobId: input.jobId,
    approvedWorkItemId: input.approvedWorkItemId,
    expectedAssetId: input.expectedAssetId,
    toolId: input.toolId,
    operationId: input.operationId,
    leaseId: input.leaseId,
    attemptId: input.attemptId,
    sandboxId: input.sandboxId,
    outputId: input.outputId,
  }
}

function requirePrivateLocalRuntime(env: RuntimeEnv): void {
  if (isExplicitLocalInternalTestRuntime(env) && env.storageMode === 'local') return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Actual artifact-run evidence collection is restricted to private local internal testing.',
    503,
    {
      requiredGates: [
        'canonical_lease_verification_integration',
        'production_generation_bound_object_storage',
        'distributed_evidence_persistence',
        'artifact_qa_authority_actual_run_schema_v2',
      ],
    },
  )
}

function assertNoSecretLikeContent(value: unknown, label: string): void {
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(value)
  if (secretLikePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `${label} contains secret-like fields or values.`,
      409,
      { secretLikePaths },
    )
  }
}

function bridgeResult(
  evidence: ActualArtifactRunEvidence,
  replayed: boolean,
): ActualRunEvidenceBridgeResult {
  return {
    evidence,
    artifactAuthorityEnvelope: evidence.artifactAuthorityEnvelope,
    replayed,
    testOnly: true,
    warnings: [
      'Sandbox output bytes and the server-injected runner receipt were verified for private local testing.',
      'The existing artifact authority envelope remains explicitly non-authorizing until lease and actual-run v2 integration.',
      'No tool, provider, renderer, delivery, wallet, or settlement operation was performed by this bridge.',
    ],
  }
}

function sha256ArtifactQaValueForBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

async function withProcessLock<T>(
  locks: Map<string, Promise<void>>,
  key: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  const tail = previous.then(() => gate)
  locks.set(key, tail)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (locks.get(key) === tail) locks.delete(key)
  }
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}
