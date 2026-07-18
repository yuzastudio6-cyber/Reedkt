import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  assertCanonicalApprovedEditExecutionPackageMatchesAuthority,
  assertCanonicalToolAuthorizationManifestMatchesAuthority,
  createCanonicalApprovedEditExecutionPackage,
  createCanonicalToolAuthorizationManifest,
  type CanonicalApprovedEditExecutionPackage,
  type CanonicalToolAuthorizationManifest,
} from '../edit-architecture/canonical-approved-edit-execution-package'
import { PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY } from '../edit-architecture/professional-long-form-approved-snapshot-bridge'
import type { ServiceContext } from '../types'
import {
  createApprovedEditExecutionPackageSchema,
  type CreateApprovedEditExecutionPackageBody,
} from '../validation/edit-execution-schemas'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import {
  type AuthorityExecutionPackageRecord,
  mutatePrivateEditAuthorityAggregate,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
} from './private-edit-authority-store'
import { nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export interface CreateCanonicalExecutionPackageInput extends CreateApprovedEditExecutionPackageBody {
  idempotencyKey: string
  requestPath?: string
}

interface CanonicalExecutionPackageResponse extends Record<string, unknown> {
  approvedEditExecutionPackage: CanonicalApprovedEditExecutionPackage
  toolCapabilityManifest: CanonicalToolAuthorizationManifest
  testOnly: true
}

export function createCanonicalEditExecutionPackageService(context: ServiceContext) {
  return {
    async createPackage(input: CreateCanonicalExecutionPackageInput) {
      const { idempotencyKey: rawIdempotencyKey, requestPath, ...requestBody } = input
      const parsed = createApprovedEditExecutionPackageSchema.safeParse(requestBody)
      if (!parsed.success) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical execution package request validation failed.', 400, parsed.error.flatten())
      }
      const body = parsed.data
      const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
        body.approvedPlanSnapshotId,
        access.workspaceId,
      )
      assertProfessionalLongFormPackageQueuePromotionReady(authority)
      if (authority.snapshot.snapshotHash !== body.expectedSnapshotHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Canonical approved snapshot hash changed or does not match the requested package.', 409, {
          approvedPlanSnapshotId: body.approvedPlanSnapshotId,
        })
      }
      const requestHash = sha256AuthorityValue({
        operation: 'create_execution_package',
        requestPath: requestPath ?? '/v1/edit-executions/packages',
        workspaceId: access.workspaceId,
        approvedPlanSnapshotId: body.approvedPlanSnapshotId,
        expectedSnapshotHash: body.expectedSnapshotHash,
        purpose: body.purpose,
        actorUserId: access.userId,
      })
      const timestamp = nowIso()
      const response = await mutatePrivateEditAuthorityAggregate({
        scope: authorityScope(context, access.userId, access.workspaceId),
        now: timestamp,
        mutation: async (aggregate) => {
          const replay = findReplay(aggregate.idempotencyRecords, idempotencyKey, requestHash)
          if (replay) {
            const replayPackageValue = replay.approvedEditExecutionPackage
            const replayPackageRecordId = replayPackageValue && typeof replayPackageValue === 'object'
              ? (replayPackageValue as unknown as Record<string, unknown>).packageRecordId
              : undefined
            const replayPackageRecord = aggregate.executionPackages.find((record) => record.id === replayPackageRecordId)
            if (!replayPackageRecord) {
              throw new ApiError('VALIDATION_FAILED', 'Canonical execution package replay lineage is incomplete.', 409)
            }
            const replayManifest = await loadToolCapabilityManifest(context, replayPackageRecord, authority)
            try {
              assertCanonicalToolAuthorizationManifestMatchesAuthority(replay.toolCapabilityManifest, authority)
              assertCanonicalApprovedEditExecutionPackageMatchesAuthority({
                value: replayPackageValue,
                authority,
                executionPackageRecord: replayPackageRecord,
                toolCapabilityManifest: replayManifest,
              })
            } catch {
              throw new ApiError('VALIDATION_FAILED', 'Canonical execution package replay operation authority is invalid.', 409)
            }
            return { result: replay, changed: false }
          }
          assertCurrentPackageAuthority({
            aggregate,
            authority,
            expectedSnapshotHash: body.expectedSnapshotHash,
          })

          const existingPackage = aggregate.executionPackages.find((record) => record.snapshotId === authority.snapshot.snapshotId)
          if (existingPackage) {
            const toolCapabilityManifest = await loadToolCapabilityManifest(context, existingPackage, authority)
            const currentAuthority = { ...authority, authorityRevision: aggregate.revision + 1 }
            const result = packageResponse(
              createCanonicalApprovedEditExecutionPackage({
                authority: currentAuthority,
                executionPackageRecord: existingPackage,
                toolCapabilityManifest,
              }),
              toolCapabilityManifest,
            )
            aggregate.idempotencyRecords.push({
              operation: 'create_execution_package',
              idempotencyKey,
              requestHash,
              responseId: existingPackage.id,
              secondaryResponseIds: [authority.snapshot.snapshotId, authority.snapshot.reservationId],
              response: result,
              completedAt: timestamp,
            })
            aggregate.auditEvents.push({
              id: `authority_audit_${randomUUID()}`,
              eventType: 'canonical_execution_package_reused',
              actorUserId: access.userId,
              projectId: authority.snapshot.projectId,
              editSessionId: authority.snapshot.editSessionId,
              planId: authority.snapshot.planId,
              snapshotId: authority.snapshot.snapshotId,
              createdAt: timestamp,
            })
            return { result, changed: true }
          }

          const toolCapabilityManifest = createCanonicalToolAuthorizationManifest(authority)
          const toolCapabilityManifestRef = await putPrivateAuthorityJsonBlob({
            localStorageRoot: context.env.localStorageRoot,
            value: toolCapabilityManifest as unknown as Record<string, unknown>,
            maxBytes: 512 * 1024,
          })
          const packageWithoutHash = {
            id: `authority_execution_package_${randomUUID()}`,
            source: 'canonical_edit_authority' as const,
            purpose: body.purpose,
            snapshotId: authority.snapshot.snapshotId,
            planId: authority.snapshot.planId,
            estimateId: authority.snapshot.estimateId,
            reservationId: authority.snapshot.reservationId,
            projectId: authority.snapshot.projectId,
            editSessionId: authority.snapshot.editSessionId,
            snapshotHash: authority.snapshot.snapshotHash,
            planHash: authority.snapshot.planHash,
            estimateHash: authority.snapshot.estimateHash,
            workGraphHash: authority.snapshot.workGraphHash,
            approvedAssetManifestHash: authority.snapshot.approvedAssetManifestHash,
            approvedSourceAssetManifestHash: authority.snapshot.approvedSourceAssetManifestHash,
            toolCapabilityManifestRef,
            createdByUserId: access.userId,
            createdAt: timestamp,
          }
          const executionPackageRecord: AuthorityExecutionPackageRecord = {
            ...packageWithoutHash,
            packageHash: sha256AuthorityValue(packageWithoutHash),
          }
          const currentAuthority = { ...authority, authorityRevision: aggregate.revision + 1 }
          const result = packageResponse(
            createCanonicalApprovedEditExecutionPackage({
              authority: currentAuthority,
              executionPackageRecord,
              toolCapabilityManifest,
            }),
            toolCapabilityManifest,
          )
          aggregate.executionPackages.push(executionPackageRecord)
          aggregate.idempotencyRecords.push({
            operation: 'create_execution_package',
            idempotencyKey,
            requestHash,
            responseId: executionPackageRecord.id,
            secondaryResponseIds: [authority.snapshot.snapshotId, authority.snapshot.reservationId],
            response: result,
            completedAt: timestamp,
          })
          aggregate.auditEvents.push({
            id: `authority_audit_${randomUUID()}`,
            eventType: 'canonical_execution_package_created',
            actorUserId: access.userId,
            projectId: authority.snapshot.projectId,
            editSessionId: authority.snapshot.editSessionId,
            planId: authority.snapshot.planId,
            snapshotId: authority.snapshot.snapshotId,
            createdAt: timestamp,
          })
          return { result, changed: true }
        },
      })
      return {
        ...response,
        toolExecutionAuthority: authority.toolExecutionAuthority,
        warnings: [
          'Canonical execution packaging is private single-host internal-test evidence only.',
          'No provider, worker, media, render, GCS, paid billing, wallet settlement, or external delivery side effect occurred.',
        ],
      }
    },

    async getPackage(packageRecordId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      const aggregate = await readPrivateEditAuthorityAggregate(authorityScope(context, access.userId, access.workspaceId))
      const executionPackageRecord = aggregate?.executionPackages.find((record) => record.id === packageRecordId)
      if (!aggregate || !executionPackageRecord) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical execution package was not found.', 404)
      }
      const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
        executionPackageRecord.snapshotId,
        access.workspaceId,
      )
      assertProfessionalLongFormPackageQueuePromotionReady(authority)
      assertCurrentPackageAuthority({
        aggregate,
        authority,
        expectedSnapshotHash: executionPackageRecord.snapshotHash,
      })
      const toolCapabilityManifest = await loadToolCapabilityManifest(context, executionPackageRecord, authority)
      return {
        ...packageResponse(
          createCanonicalApprovedEditExecutionPackage({
            authority,
            executionPackageRecord,
            toolCapabilityManifest,
          }),
          toolCapabilityManifest,
        ),
        toolExecutionAuthority: authority.toolExecutionAuthority,
        warnings: ['Canonical execution package read revalidated current tenant, snapshot, reservation, and content-addressed manifest authority.'],
      }
    },

    async findPackageBySnapshot(snapshotId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      const aggregate = await readPrivateEditAuthorityAggregate(
        authorityScope(context, access.userId, access.workspaceId),
      )
      const executionPackageRecord = aggregate?.executionPackages.find((record) =>
        record.snapshotId === snapshotId)
      if (!aggregate || !executionPackageRecord) return undefined
      const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
        executionPackageRecord.snapshotId,
        access.workspaceId,
      )
      assertProfessionalLongFormPackageQueuePromotionReady(authority)
      assertCurrentPackageAuthority({
        aggregate,
        authority,
        expectedSnapshotHash: executionPackageRecord.snapshotHash,
      })
      return {
        packageRecordId: executionPackageRecord.id,
        packageHash: executionPackageRecord.packageHash,
        snapshotId: executionPackageRecord.snapshotId,
        purpose: executionPackageRecord.purpose,
      }
    },
  }
}

function assertProfessionalLongFormPackageQueuePromotionReady(
  authority: Awaited<
    ReturnType<
      ReturnType<typeof createEditPlanningAuthorityService>['loadApprovedExecutionAuthority']
    >
  >,
): void {
  if (!authority.snapshot.componentRefs[PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY]) {
    return
  }
  throw new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'Professional long-form snapshots require the server-derived specialized child package and cannot enter the ordinary execution-package path.',
    409,
    {
      requiredGate:
        'canonical_professional_long_form_specialized_child_package_only',
      approvedPlanSnapshotId: authority.snapshot.snapshotId,
      approvedPlanSnapshotHash: authority.snapshot.snapshotHash,
    },
  )
}

function assertCurrentPackageAuthority(input: {
  aggregate: NonNullable<Awaited<ReturnType<typeof readPrivateEditAuthorityAggregate>>>
  authority: Awaited<ReturnType<ReturnType<typeof createEditPlanningAuthorityService>['loadApprovedExecutionAuthority']>>
  expectedSnapshotHash: string
}): void {
  const { aggregate, authority } = input
  const snapshot = aggregate.snapshots.find((record) => record.snapshotId === authority.snapshot.snapshotId)
  const plan = aggregate.plans.find((record) => record.id === authority.snapshot.planId)
  const estimate = aggregate.estimates.find((record) => record.id === authority.snapshot.estimateId)
  const reservation = aggregate.reservations.find((record) => record.id === authority.snapshot.reservationId)
  const approval = aggregate.approvals.find((record) => record.id === authority.snapshot.approvalId)
  const approvedWorkItemIds = aggregate.approvedWorkItems
    .filter((record) => record.snapshotId === authority.snapshot.snapshotId)
    .map((record) => record.id)
    .sort()
  const jobWorkItemIds = aggregate.jobs
    .filter((record) => record.snapshotId === authority.snapshot.snapshotId)
    .map((record) => record.approvedWorkItemId)
    .sort()
  if (
    !snapshot || !plan || !estimate || !reservation || !approval ||
    snapshot.snapshotHash !== input.expectedSnapshotHash ||
    plan.status !== 'approved' ||
    estimate.status !== 'approved' ||
    snapshot.approvedAssetManifestHash !== authority.assetManifest.manifestHash ||
    snapshot.approvedSourceAssetManifestHash !== authority.sourceAssetManifest.manifestHash ||
    reservation.snapshotId !== snapshot.snapshotId ||
    reservation.planId !== plan.id ||
    reservation.estimateId !== estimate.id ||
    approval.snapshotId !== snapshot.snapshotId ||
    approval.reservationId !== reservation.id ||
    !['reserved', 'partially_spent'].includes(reservation.status) ||
    reservation.reservedCredits - reservation.spentCredits - reservation.releasedCredits - reservation.refundedCredits <= 0 ||
    Date.parse(reservation.expiresAt) <= Date.now() ||
    !sameStrings(approvedWorkItemIds, snapshot.approvedWorkItemIds.slice().sort()) ||
    !sameStrings(jobWorkItemIds, snapshot.approvedWorkItemIds.slice().sort())
  ) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical execution package authority changed or is no longer executable.', 409)
  }
}

async function loadToolCapabilityManifest(
  context: ServiceContext,
  executionPackageRecord: AuthorityExecutionPackageRecord,
  authority: Awaited<ReturnType<ReturnType<typeof createEditPlanningAuthorityService>['loadApprovedExecutionAuthority']>>,
): Promise<CanonicalToolAuthorizationManifest> {
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: context.env.localStorageRoot,
    ref: executionPackageRecord.toolCapabilityManifestRef,
  })
  try {
    return assertCanonicalToolAuthorizationManifestMatchesAuthority(value, authority)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Canonical tool capability manifest integrity or lineage is invalid.', 409)
  }
}

function packageResponse(
  approvedEditExecutionPackage: CanonicalApprovedEditExecutionPackage,
  toolCapabilityManifest: CanonicalToolAuthorizationManifest,
): CanonicalExecutionPackageResponse {
  return {
    approvedEditExecutionPackage,
    toolCapabilityManifest,
    testOnly: true,
  }
}

function findReplay(
  records: Array<{ operation: string; idempotencyKey: string; requestHash: string; response: Record<string, unknown> }>,
  idempotencyKey: string,
  requestHash: string,
): CanonicalExecutionPackageResponse | undefined {
  const record = records.find((candidate) =>
    candidate.operation === 'create_execution_package' && candidate.idempotencyKey === idempotencyKey)
  if (!record) return undefined
  if (record.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different canonical execution package request.', 409)
  }
  return record.response as unknown as CanonicalExecutionPackageResponse
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (!normalized) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for canonical execution packaging.', 400)
  if (normalized.length > 240 || Array.from(normalized).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })) {
    throw new ApiError('VALIDATION_FAILED', 'Idempotency-Key is invalid.', 400)
  }
  return normalized
}

function authorityScope(context: ServiceContext, ownerUserId: string, workspaceId: string) {
  return { localStorageRoot: context.env.localStorageRoot, ownerUserId, workspaceId }
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
