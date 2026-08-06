import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_LOCATOR_VERSION,
  canonicalPreapprovalRouteDataAssuranceBindingSchema,
  canonicalPreapprovalRouteDataAssuranceLocatorSchema,
  type CanonicalPreapprovalRouteDataAssuranceBinding,
  type CanonicalPreapprovalRouteDataAssuranceLocator,
  verifyCanonicalPreapprovalRouteDataAssuranceBinding,
} from './canonical-preapproval-route-data-assurance-contract'

const PACKAGE_ENVELOPE_VERSION =
  'private-canonical-preapproval-route-data-assurance-envelope-v1' as const
const LATEST_ENVELOPE_VERSION =
  'private-canonical-preapproval-route-data-assurance-latest-v1' as const
const RECORD_SOURCE =
  'private_canonical_preapproval_route_data_assurance_repository' as const
const MAX_PACKAGE_BYTES = 2 * 1024 * 1024
const MAX_POINTER_BYTES = 32 * 1024

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const packageEnvelopeSchema = z.object({
  recordVersion: z.literal(PACKAGE_ENVELOPE_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  package: canonicalPreapprovalRouteDataAssuranceBindingSchema,
  checksumSha256: digestSchema,
}).strict()

const latestEnvelopeSchema = z.object({
  recordVersion: z.literal(LATEST_ENVELOPE_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  packageDigestSha256: digestSchema,
  evidenceSnapshotId: safeIdentitySchema,
  evidenceRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  checksumSha256: digestSchema,
}).strict()

export interface CanonicalPreapprovalRouteDataAssuranceRepositoryScope {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
}

export interface CanonicalPreapprovalRouteDataAssurancePersistenceResult {
  readonly locator: CanonicalPreapprovalRouteDataAssuranceLocator
  readonly packageDigestSha256: string
  readonly disposition:
    | 'created'
    | 'idempotent_replay'
    | 'advanced_latest'
  readonly persistence: 'backend_local_private_content_addressed'
  readonly providerCallMade: false
  readonly credentialReadMade: false
  readonly customerCreditsMutated: false
  readonly remoteMutationMade: false
}

export class PrivateCanonicalPreapprovalRouteDataAssuranceRepository {
  readonly persistence =
    'backend_local_private_content_addressed' as const

  async save(input: {
    readonly scope:
      CanonicalPreapprovalRouteDataAssuranceRepositoryScope
    readonly package:
      CanonicalPreapprovalRouteDataAssuranceBinding
  }): Promise<CanonicalPreapprovalRouteDataAssurancePersistenceResult> {
    validateScope(input.scope)
    const binding =
      verifyCanonicalPreapprovalRouteDataAssuranceBinding(input.package)
    if (binding.workspaceId !== input.scope.workspaceId) {
      throw conflict(
        'canonical_preapproval_route_data_assurance_workspace_mismatch',
      )
    }
    const locator =
      deriveCanonicalPreapprovalRouteDataAssuranceLocator(binding)
    const paths = repositoryPaths(
      input.scope,
      locator.serverOwnedLocatorId,
    )
    return withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: paths.lockFile,
      operation: async () => {
        const envelopePayload = {
          recordVersion: PACKAGE_ENVELOPE_VERSION,
          source: RECORD_SOURCE,
          scopeHashSha256: scopeHash(input.scope),
          locatorId: locator.serverOwnedLocatorId,
          package: binding,
        }
        const envelope = packageEnvelopeSchema.parse({
          ...envelopePayload,
          checksumSha256: sha256AuthorityValue(envelopePayload),
        })
        const versionFile =
          `${paths.versionDirectory}/${binding.contractDigestSha256}.json`
        const versionBytes = Buffer.from(
          `${stableAuthorityStringify(envelope)}\n`,
          'utf8',
        )
        if (versionBytes.byteLength > MAX_PACKAGE_BYTES) {
          throw conflict(
            'canonical_preapproval_route_data_assurance_package_too_large',
          )
        }
        const currentPointer = await readLatestPointer(
          input.scope,
          locator,
        )
        if (
          currentPointer
          && (
            binding.evidenceRevision < currentPointer.evidenceRevision
            || (
              binding.evidenceRevision ===
                currentPointer.evidenceRevision
              && currentPointer.packageDigestSha256 !==
                binding.contractDigestSha256
            )
          )
        ) {
          throw conflict(
            'canonical_preapproval_route_data_assurance_historical_replay',
          )
        }
        const createResult = await writePrivateFileCreateOnlyWithinRoot({
          rootPath: input.scope.localStorageRoot,
          relativePath: versionFile,
          content: versionBytes,
        })
        const disposition =
          currentPointer?.packageDigestSha256 ===
            binding.contractDigestSha256
            ? 'idempotent_replay'
            : currentPointer
              ? 'advanced_latest'
              : createResult.created
                ? 'created'
                : 'idempotent_replay'
        const pointerPayload = {
          recordVersion: LATEST_ENVELOPE_VERSION,
          source: RECORD_SOURCE,
          scopeHashSha256: scopeHash(input.scope),
          locatorId: locator.serverOwnedLocatorId,
          packageDigestSha256: binding.contractDigestSha256,
          evidenceSnapshotId: binding.evidenceSnapshotId,
          evidenceRevision: binding.evidenceRevision,
        }
        const pointer = latestEnvelopeSchema.parse({
          ...pointerPayload,
          checksumSha256: sha256AuthorityValue(pointerPayload),
        })
        const pointerText = `${stableAuthorityStringify(pointer)}\n`
        if (Buffer.byteLength(pointerText, 'utf8') > MAX_POINTER_BYTES) {
          throw conflict(
            'canonical_preapproval_route_data_assurance_pointer_too_large',
          )
        }
        await writePrivateTextFileAtomicWithinRoot({
          rootPath: input.scope.localStorageRoot,
          relativePath: paths.latestFile,
          content: pointerText,
        })
        return {
          locator,
          packageDigestSha256: binding.contractDigestSha256,
          disposition,
          persistence: this.persistence,
          providerCallMade: false,
          credentialReadMade: false,
          customerCreditsMutated: false,
          remoteMutationMade: false,
        }
      },
    })
  }

  async readByServerOwnedLocator(input: {
    readonly scope:
      CanonicalPreapprovalRouteDataAssuranceRepositoryScope
    readonly locator: unknown
  }): Promise<CanonicalPreapprovalRouteDataAssuranceBinding> {
    validateScope(input.scope)
    const locator =
      canonicalPreapprovalRouteDataAssuranceLocatorSchema.parse(
        input.locator,
      )
    const paths = repositoryPaths(
      input.scope,
      locator.serverOwnedLocatorId,
    )
    return withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: paths.lockFile,
      operation: async () => {
        const pointer = await readLatestPointer(input.scope, locator)
        if (!pointer) throw notFound()
        const versionFile =
          `${paths.versionDirectory}/${pointer.packageDigestSha256}.json`
        const rawEnvelope =
          await readPrivateTextFileIfExistsWithinRoot({
            rootPath: input.scope.localStorageRoot,
            relativePath: versionFile,
          })
        if (
          !rawEnvelope
          || Buffer.byteLength(rawEnvelope, 'utf8') > MAX_PACKAGE_BYTES
        ) throw notFound()
        const envelope = parseJson(
          packageEnvelopeSchema,
          rawEnvelope,
          'canonical_preapproval_route_data_assurance_envelope_invalid',
        )
        const { checksumSha256, ...payload } = envelope
        if (
          envelope.scopeHashSha256 !== scopeHash(input.scope)
          || envelope.locatorId !== locator.serverOwnedLocatorId
          || envelope.package.contractDigestSha256 !==
            pointer.packageDigestSha256
          || envelope.package.evidenceSnapshotId !==
            pointer.evidenceSnapshotId
          || envelope.package.evidenceRevision !==
            pointer.evidenceRevision
          || checksumSha256 !== sha256AuthorityValue(payload)
        ) {
          throw conflict(
            'canonical_preapproval_route_data_assurance_envelope_invalid',
          )
        }
        const binding =
          verifyCanonicalPreapprovalRouteDataAssuranceBinding(
            envelope.package,
          )
        if (
          binding.workspaceId !== input.scope.workspaceId
          || deriveCanonicalPreapprovalRouteDataAssuranceLocator(binding)
            .serverOwnedLocatorId !== locator.serverOwnedLocatorId
        ) throw notFound()
        return binding
      },
    })
  }
}

export function deriveCanonicalPreapprovalRouteDataAssuranceLocator(
  binding: Pick<
    CanonicalPreapprovalRouteDataAssuranceBinding,
    | 'workspaceId'
    | 'projectId'
    | 'editSessionId'
    | 'requestDigestSha256'
  >,
): CanonicalPreapprovalRouteDataAssuranceLocator {
  return canonicalPreapprovalRouteDataAssuranceLocatorSchema.parse({
    schemaVersion:
      CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_LOCATOR_VERSION,
    serverOwnedLocatorId: `route-data-${sha256AuthorityValue({
      workspaceId: binding.workspaceId,
      projectId: binding.projectId,
      editSessionId: binding.editSessionId,
      requestDigestSha256: binding.requestDigestSha256,
    })}`,
  })
}

async function readLatestPointer(
  scope: CanonicalPreapprovalRouteDataAssuranceRepositoryScope,
  locator: CanonicalPreapprovalRouteDataAssuranceLocator,
) {
  const paths = repositoryPaths(scope, locator.serverOwnedLocatorId)
  const raw = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.latestFile,
  })
  if (!raw) return undefined
  if (Buffer.byteLength(raw, 'utf8') > MAX_POINTER_BYTES) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_pointer_invalid',
    )
  }
  const pointer = parseJson(
    latestEnvelopeSchema,
    raw,
    'canonical_preapproval_route_data_assurance_pointer_invalid',
  )
  const { checksumSha256, ...payload } = pointer
  if (
    pointer.scopeHashSha256 !== scopeHash(scope)
    || pointer.locatorId !== locator.serverOwnedLocatorId
    || checksumSha256 !== sha256AuthorityValue(payload)
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_pointer_invalid',
    )
  }
  return pointer
}

function repositoryPaths(
  scope: CanonicalPreapprovalRouteDataAssuranceRepositoryScope,
  locatorId: string,
) {
  const base = [
    'canonical-preapproval-route-data-assurance',
    'scopes',
    scopeHash(scope),
    'locators',
    sha256AuthorityValue(locatorId),
  ].join('/')
  return {
    versionDirectory: `${base}/versions`,
    latestFile: `${base}/latest.json`,
    lockFile: `${base}/repository.lock`,
  }
}

function scopeHash(
  scope: CanonicalPreapprovalRouteDataAssuranceRepositoryScope,
): string {
  return sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
  })
}

function validateScope(
  scope: CanonicalPreapprovalRouteDataAssuranceRepositoryScope,
): void {
  if (
    !scope.localStorageRoot.trim()
    || !safeIdentitySchema.safeParse(scope.ownerUserId).success
    || !safeIdentitySchema.safeParse(scope.workspaceId).success
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_scope_invalid',
    )
  }
}

function parseJson<T extends z.ZodTypeAny>(
  schema: T,
  value: string,
  reason: string,
): z.infer<T> {
  try {
    return schema.parse(JSON.parse(value))
  } catch {
    throw conflict(reason)
  }
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical preapproval route-data assurance is stale or invalid.',
    409,
    { reason },
  )
}

function notFound(): ApiError {
  return new ApiError(
    'STORAGE_OBJECT_NOT_FOUND',
    'Canonical preapproval route-data assurance was not found.',
    404,
  )
}
