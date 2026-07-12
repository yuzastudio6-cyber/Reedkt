import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateReviewDecisionResponseSchema,
  recordCanonicalPrivateReviewDecisionSchema,
  type CanonicalPrivateReviewDecisionResponse,
  type RecordCanonicalPrivateReviewDecisionBody,
} from '../validation/canonical-private-review-decision-schemas'
import { findApprovedSnapshotSecretLikePaths } from './approved-snapshot-validation'
import { createCanonicalPrivateReviewAssemblyService } from './canonical-private-review-assembly-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const STORAGE_PREFIX = 'private-internal/canonical-private-review-decisions/v1'
const decisionLocks = new Map<string, Promise<void>>()

export type RecordCanonicalPrivateReviewDecisionInput = RecordCanonicalPrivateReviewDecisionBody & {
  reviewAssemblyId: string
  idempotencyKey: string
}

interface PersistedDecisionResponse {
  schemaVersion: 'canonical-private-review-decision-idempotency-v1'
  requestHash: string
  response: CanonicalPrivateReviewDecisionResponse
}

export function createCanonicalPrivateReviewDecisionService(context: ServiceContext) {
  return {
    async record(
      input: RecordCanonicalPrivateReviewDecisionInput,
    ): Promise<CanonicalPrivateReviewDecisionResponse> {
      const { reviewAssemblyId, idempotencyKey: rawIdempotencyKey, ...requestBody } = input
      const parsed = recordCanonicalPrivateReviewDecisionSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(reviewAssemblyId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private-review decision request validation failed.',
          400,
          parsed.success ? { reviewAssemblyId: ['Invalid private-review assembly identity.'] } : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) throw blocked('Private-review decision actor is outside this workspace.')

      if (body.decision === 'request_revision') {
        const secretLikePaths = findApprovedSnapshotSecretLikePaths(body.revisionIntent)
        if (secretLikePaths.length > 0) {
          throw new ApiError(
            'VALIDATION_FAILED',
            'Canonical revision intent contains secret-like fields or values.',
            400,
            { secretLikePaths },
          )
        }
      }

      const assembly = await createCanonicalPrivateReviewAssemblyService(context).getCompleted({
        packageRecordId: body.packageRecordId,
        workspaceId: access.workspaceId,
      })
      if (
        assembly.identity.reviewAssemblyId !== reviewAssemblyId ||
        assembly.identity.workspaceId !== access.workspaceId ||
        assembly.identity.packageRecordId !== body.packageRecordId ||
        assembly.manifest.manifestSha256 !== body.expectedManifestSha256 ||
        assembly.finalArtifact.sha256 !== body.expectedFinalArtifactSha256 ||
        assembly.readiness.privateReviewReady !== true
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Private-review decision expectation does not match the completed canonical assembly.',
          409,
          { requiredGate: 'exact_completed_private_review_assembly' },
        )
      }

      const approvedAuthority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
        assembly.identity.approvedPlanSnapshotId,
        access.workspaceId,
      )
      const snapshot = approvedAuthority.snapshot
      if (
        snapshot.workspaceId !== access.workspaceId ||
        snapshot.projectId !== assembly.identity.projectId ||
        snapshot.editSessionId !== assembly.identity.editSessionId ||
        snapshot.snapshotId !== assembly.identity.approvedPlanSnapshotId
      ) throw blocked('Private-review decision snapshot lineage is not exact.')

      const requestHash = sha256AuthorityValue({
        operation: 'record_canonical_private_review_decision',
        actorUserId,
        workspaceId: access.workspaceId,
        reviewAssemblyId,
        body,
      })
      const scopeHash = sha256(`${actorUserId}\u0000${access.workspaceId}`).slice(0, 32)
      const assemblyHash = sha256(`${scopeHash}\u0000${reviewAssemblyId}`)
      const keyHash = sha256(`${assemblyHash}\u0000${idempotencyKey}`)
      const responsePath = `${STORAGE_PREFIX}/${scopeHash}/requests/${keyHash}.json`
      const completionPath = `${STORAGE_PREFIX}/${scopeHash}/assemblies/${assemblyHash}.json`
      const manifestPath = `${STORAGE_PREFIX}/${scopeHash}/manifests/${assemblyHash}.json`

      return withDecisionLock(responsePath, async () => {
        const requestReplay = await readPersistedDecision(context, responsePath, requestHash)
        if (requestReplay) {
          await verifyPersistedDecisionManifest(context, manifestPath, requestReplay)
          return markReplay(requestReplay)
        }
        return withDecisionLock(completionPath, async () => {
          const completionReplay = await readPersistedDecision(context, completionPath, requestHash)
          if (completionReplay) {
            await verifyPersistedDecisionManifest(context, manifestPath, completionReplay)
            await persistDecision(context, responsePath, requestHash, completionReplay)
            return markReplay(completionReplay)
          }

          const decidedAt = new Date().toISOString()
          const reviewDecisionId = `private_review_decision_${assemblyHash.slice(0, 40)}`
          const revisionIntentHash = body.decision === 'request_revision'
            ? sha256AuthorityValue(body.revisionIntent)
            : undefined
          const revisionRequestId = revisionIntentHash
            ? `canonical_revision_${sha256(`${reviewAssemblyId}\u0000${revisionIntentHash}`).slice(0, 40)}`
            : undefined
          const identity = {
            workspaceId: access.workspaceId,
            projectId: assembly.identity.projectId,
            editSessionId: assembly.identity.editSessionId,
            packageRecordId: body.packageRecordId,
            approvedPlanSnapshotId: snapshot.snapshotId,
            reviewAssemblyId,
            reviewDecisionId,
          }
          const authority = {
            approvedPlanId: snapshot.planId,
            approvedPlanVersion: snapshot.planVersion,
            approvedSnapshotHash: snapshot.snapshotHash,
            approvedPlanHash: snapshot.planHash,
            approvedEstimateHash: snapshot.estimateHash,
            reviewManifestSha256: assembly.manifest.manifestSha256,
            finalArtifactSha256: assembly.finalArtifact.sha256,
            immutableApprovedSnapshotPreserved: true as const,
            immutableReviewManifestPreserved: true as const,
          }
          const revisionHandoff = body.decision === 'request_revision'
            ? {
                revisionRequestId: revisionRequestId!,
                priorApprovedPlanId: snapshot.planId,
                priorApprovedPlanVersion: snapshot.planVersion,
                minimumNextPlanVersion: snapshot.planVersion + 1,
                revisionIntentHash: revisionIntentHash!,
                requiresReplanning: true as const,
                requiresFreshEstimateAndApproval: true as const,
                replacementPlanPublished: false as const,
                revisionExecutionStarted: false as const,
              }
            : null
          const decisionManifestWithoutHash = {
            schemaVersion: 'canonical-private-review-decision-manifest-v1' as const,
            manifestId: reviewDecisionId,
            identity,
            decision: body.decision,
            authority,
            revisionIntent: body.decision === 'request_revision' ? body.revisionIntent : null,
            revisionHandoff,
            decidedAt,
            privateInternalOnly: true as const,
            publicDeliveryAuthorized: false as const,
            replacementPlanPublicationAuthorized: false as const,
            revisionExecutionAuthorized: false as const,
          }
          const decisionManifestSha256 = sha256AuthorityValue(decisionManifestWithoutHash)
          await writePrivateFileCreateOnlyWithinRoot({
            rootPath: context.env.localStorageRoot,
            relativePath: manifestPath,
            content: Buffer.from(`${stableAuthorityStringify({
              ...decisionManifestWithoutHash,
              manifestSha256: decisionManifestSha256,
            })}\n`, 'utf8'),
          })

          const isRevision = body.decision === 'request_revision'
          const responseWithoutHash = {
            schemaVersion: 'canonical-private-review-decision-response-v1' as const,
            source: 'canonical_private_review_decision_service' as const,
            purpose: body.purpose,
            identity,
            decision: body.decision,
            status: isRevision
              ? 'canonical_revision_requested' as const
              : 'private_internal_review_accepted' as const,
            authority,
            revisionHandoff,
            manifest: {
              schemaVersion: 'canonical-private-review-decision-manifest-v1' as const,
              manifestId: reviewDecisionId,
              manifestSha256: decisionManifestSha256,
              privateCreateOnlyPersistence: true as const,
              credentialFree: true as const,
            },
            replay: { idempotentReplay: false, sameDecisionOnly: true as const },
            readiness: {
              privateReviewDecisionRecorded: true as const,
              revisionRequested: isRevision,
              publicExportReady: false as const,
              productReady: false as const,
              externalBetaReady: false as const,
              productionReady: false as const,
              nextRequiredGate: isRevision
                ? 'canonical_revision_plan_compilation_and_fresh_approval' as const
                : 'private_internal_acceptance_recorded_public_delivery_blocked' as const,
            },
            permissions: deniedPermissions(),
            decidedAt,
            testOnly: true as const,
          }
          const response = canonicalPrivateReviewDecisionResponseSchema.parse({
            ...responseWithoutHash,
            responseHash: sha256AuthorityValue(responseWithoutHash),
          })
          await persistDecision(context, completionPath, requestHash, response)
          await persistDecision(context, responsePath, requestHash, response)
          return response
        })
      })
    },
  }
}

function deniedPermissions() {
  return {
    providerCall: false as const,
    publicArtifact: false as const,
    publicDelivery: false as const,
    productionRender: false as const,
    furtherRender: false as const,
    revisionExecution: false as const,
    replacementPlanPublication: false as const,
    customerPriceMutation: false as const,
    customerCreditMutation: false as const,
    walletMutation: false as const,
    reservationMutation: false as const,
    settlement: false as const,
    billing: false as const,
    deployment: false as const,
  }
}

async function readPersistedDecision(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateReviewDecisionResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) } catch {
    throw blocked('Persisted private-review decision is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw blocked('Persisted private-review decision has an invalid shape.')
  }
  const record = parsed as Partial<PersistedDecisionResponse>
  if (
    record.schemaVersion !== 'canonical-private-review-decision-idempotency-v1' ||
    record.requestHash !== requestHash
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'A different canonical decision already exists for this private-review assembly.',
      409,
    )
  }
  const response = canonicalPrivateReviewDecisionResponseSchema.safeParse(record.response)
  if (!response.success) throw blocked('Persisted private-review decision failed validation.')
  const { responseHash, ...withoutHash } = response.data
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw blocked('Persisted private-review decision checksum is invalid.')
  }
  return response.data
}

async function persistDecision(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
  response: CanonicalPrivateReviewDecisionResponse,
): Promise<void> {
  const record: PersistedDecisionResponse = {
    schemaVersion: 'canonical-private-review-decision-idempotency-v1',
    requestHash,
    response,
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
    content: Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8'),
  })
}

async function verifyPersistedDecisionManifest(
  context: ServiceContext,
  relativePath: string,
  response: CanonicalPrivateReviewDecisionResponse,
): Promise<void> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) throw blocked('Private-review decision manifest is missing during replay.')
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) } catch {
    throw blocked('Private-review decision manifest is not valid JSON during replay.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw blocked('Private-review decision manifest has an invalid shape during replay.')
  }
  const record = parsed as Record<string, unknown>
  const { manifestSha256, ...withoutHash } = record
  if (
    manifestSha256 !== response.manifest.manifestSha256 ||
    record.manifestId !== response.manifest.manifestId ||
    manifestSha256 !== sha256AuthorityValue(withoutHash)
  ) throw blocked('Private-review decision manifest integrity failed during replay.')
}

function markReplay(
  response: CanonicalPrivateReviewDecisionResponse,
): CanonicalPrivateReviewDecisionResponse {
  const { responseHash, ...withoutHash } = response
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw blocked('Private-review decision replay checksum is invalid.')
  }
  const replayWithoutHash = {
    ...withoutHash,
    replay: { idempotentReplay: true, sameDecisionOnly: true as const },
  }
  return canonicalPrivateReviewDecisionResponseSchema.parse({
    ...replayWithoutHash,
    responseHash: sha256AuthorityValue(replayWithoutHash),
  })
}

async function withDecisionLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = decisionLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  const tail = previous.catch(() => undefined).then(() => current)
  decisionLocks.set(key, tail)
  await previous.catch(() => undefined)
  try { return await operation() } finally {
    release()
    if (decisionLocks.get(key) === tail) decisionLocks.delete(key)
  }
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (
    !normalized || normalized.length < 8 || normalized.length > 240 ||
    Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key is required.', 400)
  }
  return normalized
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function blocked(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_review_user_decision_or_revision',
  })
}
