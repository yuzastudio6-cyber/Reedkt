import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition,
  canonicalProfessionalLongFormCustomerDeliveryPackageSchema,
  canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema,
  type CanonicalProfessionalLongFormCustomerDeliveryPackage,
  type CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest,
} from '../edit-architecture/professional-long-form-customer-delivery-package'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { CanonicalPrivatePackageWorkQueueAggregate } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  readPrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

const DISCOVERY_RECORD_VERSION =
  'private-professional-long-form-customer-delivery-discovery-v1' as const
const DISCOVERY_RECORD_SOURCE =
  'private_professional_long_form_customer_delivery_discovery_store' as const
const MAX_DISCOVERY_RECORD_BYTES = 16 * 1024

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().max(4 * 1024 * 1024)
const blobRef = z.object({ sha256, byteLength: positiveInteger }).strict()

const discoveryRecordSchema = z.object({
  recordVersion: z.literal(DISCOVERY_RECORD_VERSION),
  source: z.literal(DISCOVERY_RECORD_SOURCE),
  identity: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
  }).strict(),
  package: z.object({
    packageHash: sha256,
    packageRef: blobRef,
  }).strict(),
  placement: z.object({
    manifestHash: sha256,
    placementManifestRef: blobRef,
  }).strict(),
  queueDefinitionHash: sha256,
  publishedAt: z.string().datetime({ offset: true }),
  recordHash: sha256,
}).strict().superRefine((record, context) => {
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)) {
    context.addIssue({
      code: 'custom',
      message: 'Customer-delivery discovery record hash is invalid.',
    })
  }
})

export interface ProfessionalLongFormCustomerDeliveryDiscoveryScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
}

export type ProfessionalLongFormCustomerDeliveryDiscoveryRecord = z.infer<
  typeof discoveryRecordSchema
>

export interface CurrentProfessionalLongFormCustomerDeliveryDiscovery {
  record: ProfessionalLongFormCustomerDeliveryDiscoveryRecord
  package: CanonicalProfessionalLongFormCustomerDeliveryPackage
  packageRef: AuthorityJsonBlobRef
  placementManifest:
    CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  queueDefinition: ReturnType<
    typeof buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition
  >
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  queueScope: CanonicalPrivatePackageWorkQueueStoreScope
}

export async function publishPrivateProfessionalLongFormCustomerDeliveryDiscovery(
  input: {
    scope: ProfessionalLongFormCustomerDeliveryDiscoveryScope
    package: CanonicalProfessionalLongFormCustomerDeliveryPackage
    packageRef: AuthorityJsonBlobRef
    placementManifest:
      CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest
    placementManifestRef: AuthorityJsonBlobRef
    queueDefinition: ReturnType<
      typeof buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition
    >
    queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  },
): Promise<{
  record: ProfessionalLongFormCustomerDeliveryDiscoveryRecord
  created: boolean
}> {
  assertScope(input.scope)
  const deliveryPackage =
    canonicalProfessionalLongFormCustomerDeliveryPackageSchema.parse(
      input.package,
    )
  const placement =
    canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema.parse(
      input.placementManifest,
    )
  assertPublicationInput({ ...input, package: deliveryPackage, placement })

  const payload = {
    recordVersion: DISCOVERY_RECORD_VERSION,
    source: DISCOVERY_RECORD_SOURCE,
    identity: {
      ownerUserId: input.scope.ownerUserId,
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      approvedPlanSnapshotId: input.scope.approvedPlanSnapshotId,
      packageRecordId: deliveryPackage.identity.packageRecordId,
    },
    package: {
      packageHash: deliveryPackage.packageHash,
      packageRef: input.packageRef,
    },
    placement: {
      manifestHash: placement.manifestHash,
      placementManifestRef: input.placementManifestRef,
    },
    queueDefinitionHash: input.queueDefinition.definitionHash,
    publishedAt: deliveryPackage.preparedAt,
  }
  const record = discoveryRecordSchema.parse({
    ...payload,
    recordHash: sha256AuthorityValue(payload),
  })
  const content = `${stableAuthorityStringify(record)}\n`
  assertByteCeiling(content)
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: `${discoveryRecordPath(input.scope)}.publication.lock`,
    operation: async () => {
      const publication = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.scope.localStorageRoot,
        relativePath: discoveryRecordPath(input.scope),
        content: Buffer.from(content, 'utf8'),
      })
      const reopened =
        await readPrivateProfessionalLongFormCustomerDeliveryDiscovery(
          input.scope,
        )
      if (!reopened || reopened.record.recordHash !== record.recordHash) {
        throw invalidDiscovery(
          'Customer-delivery discovery record did not reopen with exact authority.',
        )
      }
      return { record: reopened.record, created: publication.created }
    },
  })
}

export async function readPrivateProfessionalLongFormCustomerDeliveryDiscovery(
  scope: ProfessionalLongFormCustomerDeliveryDiscoveryScope,
): Promise<CurrentProfessionalLongFormCustomerDeliveryDiscovery | undefined> {
  assertScope(scope)
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: discoveryRecordPath(scope),
  })
  if (!content) return undefined
  assertByteCeiling(content, true)

  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidDiscovery(
      'Customer-delivery discovery record is not valid JSON.',
    )
  }
  const parsed = discoveryRecordSchema.safeParse(value)
  if (!parsed.success) {
    throw invalidDiscovery(
      'Customer-delivery discovery record integrity is invalid.',
    )
  }
  const record = parsed.data
  if (
    stableAuthorityStringify(record.identity) !==
      stableAuthorityStringify({
        ownerUserId: scope.ownerUserId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        editSessionId: scope.editSessionId,
        approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
        packageRecordId: record.identity.packageRecordId,
      })
  ) {
    throw invalidDiscovery(
      'Customer-delivery discovery record is outside the exact edit scope.',
    )
  }

  const packageValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: scope.localStorageRoot,
    ref: record.package.packageRef,
  })
  const deliveryPackage =
    canonicalProfessionalLongFormCustomerDeliveryPackageSchema.safeParse(
      packageValue,
    )
  if (
    !deliveryPackage.success ||
    deliveryPackage.data.packageHash !== record.package.packageHash ||
    deliveryPackage.data.identity.ownerUserId !== scope.ownerUserId ||
    deliveryPackage.data.identity.workspaceId !== scope.workspaceId ||
    deliveryPackage.data.identity.projectId !== scope.projectId ||
    deliveryPackage.data.identity.editSessionId !== scope.editSessionId ||
    deliveryPackage.data.identity.approvedPlanSnapshotId !==
      scope.approvedPlanSnapshotId ||
    deliveryPackage.data.identity.packageRecordId !==
      record.identity.packageRecordId
  ) {
    throw invalidDiscovery(
      'Customer-delivery discovery package lost exact snapshot lineage.',
    )
  }
  assertBlobRef(record.package.packageRef, deliveryPackage.data)

  const placementValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: scope.localStorageRoot,
    ref: record.placement.placementManifestRef,
  })
  const placement =
    canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema
      .safeParse(placementValue)
  if (
    !placement.success ||
    placement.data.manifestHash !== record.placement.manifestHash ||
    placement.data.identity.packageRecordId !==
      record.identity.packageRecordId ||
    placement.data.identity.packageHash !== record.package.packageHash ||
    placement.data.identity.workspaceId !== scope.workspaceId ||
    placement.data.identity.projectId !== scope.projectId ||
    placement.data.identity.editSessionId !== scope.editSessionId ||
    placement.data.identity.approvedPlanSnapshotId !==
      scope.approvedPlanSnapshotId
  ) {
    throw invalidDiscovery(
      'Customer-delivery discovery placement lost exact package lineage.',
    )
  }
  assertBlobRef(record.placement.placementManifestRef, placement.data)

  const queueDefinition =
    buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition({
      package: deliveryPackage.data,
      packageRef: record.package.packageRef,
      placementManifest: placement.data,
      placementManifestRef: record.placement.placementManifestRef,
    })
  if (queueDefinition.definitionHash !== record.queueDefinitionHash) {
    throw invalidDiscovery(
      'Customer-delivery discovery queue definition changed.',
    )
  }
  const queueScope: CanonicalPrivatePackageWorkQueueStoreScope = {
    ...scope,
    packageRecordId: record.identity.packageRecordId,
  }
  const queueAggregate = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
  })
  if (
    !queueAggregate ||
    queueAggregate.definitionHash !== record.queueDefinitionHash ||
    queueAggregate.identity.packageRecordId !==
      record.identity.packageRecordId ||
    queueAggregate.identity.approvedPlanSnapshotId !==
      scope.approvedPlanSnapshotId
  ) {
    throw invalidDiscovery(
      'Customer-delivery discovery queue is missing or inconsistent.',
    )
  }
  return {
    record,
    package: deliveryPackage.data,
    packageRef: record.package.packageRef,
    placementManifest: placement.data,
    placementManifestRef: record.placement.placementManifestRef,
    queueDefinition,
    queueAggregate,
    queueScope,
  }
}

function assertPublicationInput(input: {
  scope: ProfessionalLongFormCustomerDeliveryDiscoveryScope
  package: CanonicalProfessionalLongFormCustomerDeliveryPackage
  packageRef: AuthorityJsonBlobRef
  placement: CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  queueDefinition: ReturnType<
    typeof buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition
  >
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}): void {
  const identityMatches =
    input.package.identity.ownerUserId === input.scope.ownerUserId &&
    input.package.identity.workspaceId === input.scope.workspaceId &&
    input.package.identity.projectId === input.scope.projectId &&
    input.package.identity.editSessionId === input.scope.editSessionId &&
    input.package.identity.approvedPlanSnapshotId ===
      input.scope.approvedPlanSnapshotId
  const queueMatches =
    input.queueDefinition.identity.packageRecordId ===
      input.package.identity.packageRecordId &&
    input.queueDefinition.identity.approvedPlanSnapshotId ===
      input.scope.approvedPlanSnapshotId &&
    input.queueAggregate.definitionHash ===
      input.queueDefinition.definitionHash &&
    input.queueAggregate.identity.packageRecordId ===
      input.package.identity.packageRecordId &&
    input.queueAggregate.identity.approvedPlanSnapshotId ===
      input.scope.approvedPlanSnapshotId
  if (!identityMatches || !queueMatches) {
    throw invalidDiscovery(
      'Customer-delivery discovery publication scope is inconsistent.',
    )
  }
  assertBlobRef(input.packageRef, input.package)
  assertBlobRef(input.placementManifestRef, input.placement)
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  const serialized = stableAuthorityStringify(value)
  if (
    ref.sha256 !== sha256AuthorityValue(value) ||
    ref.byteLength !== Buffer.byteLength(serialized, 'utf8')
  ) {
    throw invalidDiscovery(
      'Customer-delivery discovery content-addressed reference is invalid.',
    )
  }
}

function assertScope(
  scope: ProfessionalLongFormCustomerDeliveryDiscoveryScope,
): void {
  if (
    !scope.localStorageRoot.trim() ||
    !safeIdentity(scope.ownerUserId) ||
    !safeIdentity(scope.workspaceId) ||
    !safeIdentity(scope.projectId) ||
    !safeIdentity(scope.editSessionId) ||
    !safeIdentity(scope.approvedPlanSnapshotId)
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Customer-delivery discovery scope is invalid.',
      400,
    )
  }
}

function discoveryRecordPath(
  scope: ProfessionalLongFormCustomerDeliveryDiscoveryScope,
): string {
  const tenantHash = digest(
    `${scope.ownerUserId}\u0000${scope.workspaceId}`,
  ).slice(0, 32)
  const exactEditSnapshotHash = digest([
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
    scope.approvedPlanSnapshotId,
  ].join('\u0000'))
  return (
    'private-internal/professional-long-form-customer-delivery-discovery/' +
    `v1/${tenantHash}/${exactEditSnapshotHash}.json`
  )
}

function assertByteCeiling(content: string, persisted = false): void {
  const byteLength = Buffer.byteLength(content, 'utf8')
  if (byteLength <= MAX_DISCOVERY_RECORD_BYTES) return
  if (persisted) {
    throw invalidDiscovery(
      'Persisted customer-delivery discovery record exceeds its byte ceiling.',
    )
  }
  throw new ApiError(
    'IDEMPOTENCY_CAPACITY_EXCEEDED',
    'Customer-delivery discovery record exceeds its byte ceiling.',
    503,
    { byteLength, maximumBytes: MAX_DISCOVERY_RECORD_BYTES },
  )
}

function invalidDiscovery(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value) &&
    !value.includes('..')
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
