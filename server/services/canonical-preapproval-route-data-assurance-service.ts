import { z } from 'zod'

import {
  canonicalPreapprovalModelDataRequestClassificationSchema,
  canonicalPreapprovalModelRouteDataAssuranceSchema,
  canonicalPreapprovalProjectModelDataPolicySchema,
  canonicalPreapprovalRouteDataAssuranceLocatorSchema,
  createCanonicalPreapprovalRouteDataAssuranceBinding,
  type CanonicalPreapprovalModelDataRequestClassification,
  type CanonicalPreapprovalModelRouteDataAssurance,
  type CanonicalPreapprovalProjectModelDataPolicy,
  type CanonicalPreapprovalRouteDataAssuranceBinding,
  verifyCanonicalPreapprovalRouteDataAssuranceBinding,
} from '../model-data-assurance/canonical-preapproval-route-data-assurance-contract'
import {
  PrivateCanonicalPreapprovalRouteDataAssuranceRepository,
  type CanonicalPreapprovalRouteDataAssurancePersistenceResult,
  type CanonicalPreapprovalRouteDataAssuranceRepositoryScope,
} from '../model-data-assurance/private-canonical-preapproval-route-data-assurance-repository'
import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_SOURCE_LOCATOR_VERSION =
  'canonical-preapproval-route-data-assurance-source-locator-v1' as const
export const CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_VERSION =
  'canonical-preapproval-route-data-assurance-reader-v1' as const
export const CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_RESULT_VERSION =
  'canonical-preapproval-route-data-assurance-reader-result-v1' as const

const MAX_READER_RESULT_AGE_MS = 10 * 60 * 1_000
const MAX_READER_RESULT_FUTURE_SKEW_MS = 60 * 1_000

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })

export const canonicalPreapprovalRouteDataAssuranceSourceLocatorSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_SOURCE_LOCATOR_VERSION,
    ),
    serverOwnedLocatorId: safeIdentitySchema,
  }).strict()

const readerResultDraftSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_RESULT_VERSION,
  ),
  sourceAuthority: z.literal(
    'canonical_private_route_data_assurance_repository',
  ),
  evidenceClass: z.literal(
    'private_verified_preapproval_route_data_assurance_source',
  ),
  productionReady: z.literal(false),
  callerSuppliedPolicyAccepted: z.literal(false),
  serverOwnedLocatorId: safeIdentitySchema,
  evidenceSnapshotId: safeIdentitySchema,
  evidenceRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  evaluatedAt: isoDateSchema,
  identity: z.object({
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    requestDigestSha256: digestSchema,
  }).strict(),
  projectPolicy: canonicalPreapprovalProjectModelDataPolicySchema,
  requestClassification:
    canonicalPreapprovalModelDataRequestClassificationSchema,
  routeAssurances: z.array(
    canonicalPreapprovalModelRouteDataAssuranceSchema,
  ).length(3),
  routeAssuranceCount: z.literal(3),
}).strict()

const readerResultSchema = readerResultDraftSchema.extend({
  readerResultDigestSha256: digestSchema,
}).strict()

export type CanonicalPreapprovalRouteDataAssuranceReaderResult = z.infer<
  typeof readerResultSchema
>

export interface CanonicalPreapprovalRouteDataAssuranceReaderPort {
  readonly schemaVersion:
    typeof CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_VERSION
  readonly sourceAuthority:
    'canonical_private_route_data_assurance_repository'
  readonly evidenceClass:
    'process_bound_private_route_data_assurance_reader'
  readonly productionReady: false
  readonly callerSuppliedPolicyAccepted: false
  readCurrentByServerOwnedLocator(input: {
    readonly serverOwnedLocatorId: string
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly expectedRequestDigestSha256: string
  }): Promise<unknown>
}

export interface CanonicalPreapprovalRouteDataAssuranceContext {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly requestDigestSha256: string
}

const admittedReaders = new WeakSet<object>()

export function createCanonicalPreapprovalRouteDataAssuranceReader(
  readCurrentByServerOwnedLocator:
    CanonicalPreapprovalRouteDataAssuranceReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): CanonicalPreapprovalRouteDataAssuranceReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw blocked(
      'canonical_preapproval_route_data_assurance_reader_capability_required',
    )
  }
  const reader = Object.freeze({
    schemaVersion:
      CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_VERSION,
    sourceAuthority:
      'canonical_private_route_data_assurance_repository' as const,
    evidenceClass:
      'process_bound_private_route_data_assurance_reader' as const,
    productionReady: false as const,
    callerSuppliedPolicyAccepted: false as const,
    readCurrentByServerOwnedLocator:
      readCurrentByServerOwnedLocator.bind(undefined),
  })
  admittedReaders.add(reader)
  return reader
}

export function createCanonicalPreapprovalRouteDataAssuranceReaderResult(
  input: {
    readonly serverOwnedLocatorId: string
    readonly evidenceSnapshotId: string
    readonly evidenceRevision: number
    readonly evaluatedAt: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly requestDigestSha256: string
    readonly projectPolicy:
      CanonicalPreapprovalProjectModelDataPolicy
    readonly requestClassification:
      CanonicalPreapprovalModelDataRequestClassification
    readonly routeAssurances:
      readonly CanonicalPreapprovalModelRouteDataAssurance[]
  },
): CanonicalPreapprovalRouteDataAssuranceReaderResult {
  const draft = readerResultDraftSchema.parse({
    schemaVersion:
      CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_RESULT_VERSION,
    sourceAuthority:
      'canonical_private_route_data_assurance_repository',
    evidenceClass:
      'private_verified_preapproval_route_data_assurance_source',
    productionReady: false,
    callerSuppliedPolicyAccepted: false,
    serverOwnedLocatorId: input.serverOwnedLocatorId,
    evidenceSnapshotId: input.evidenceSnapshotId,
    evidenceRevision: input.evidenceRevision,
    evaluatedAt: input.evaluatedAt,
    identity: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      requestDigestSha256: input.requestDigestSha256,
    },
    projectPolicy: input.projectPolicy,
    requestClassification: input.requestClassification,
    routeAssurances: input.routeAssurances,
    routeAssuranceCount: 3,
  })
  return readerResultSchema.parse({
    ...draft,
    readerResultDigestSha256: sha256AuthorityValue(draft),
  })
}

export async function persistCanonicalPreapprovalRouteDataAssurance(
  input: {
    readonly repositoryScope:
      CanonicalPreapprovalRouteDataAssuranceRepositoryScope
    readonly canonicalContext:
      CanonicalPreapprovalRouteDataAssuranceContext
    readonly sourceAssuranceLocator: unknown
    readonly reader:
      | CanonicalPreapprovalRouteDataAssuranceReaderPort
      | null
      | undefined
    readonly repository?:
      PrivateCanonicalPreapprovalRouteDataAssuranceRepository
  },
): Promise<CanonicalPreapprovalRouteDataAssurancePersistenceResult> {
  assertCanonicalContext(input.canonicalContext)
  if (
    input.repositoryScope.workspaceId !==
      input.canonicalContext.workspaceId
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_repository_scope_mismatch',
    )
  }
  const sourceLocator =
    canonicalPreapprovalRouteDataAssuranceSourceLocatorSchema.safeParse(
      input.sourceAssuranceLocator,
    )
  if (!sourceLocator.success) {
    throw validation(
      'canonical_preapproval_route_data_assurance_source_locator_invalid',
    )
  }
  const readerResult = await readCurrentSourceAssurance({
    reader: input.reader,
    serverOwnedLocatorId:
      sourceLocator.data.serverOwnedLocatorId,
    canonicalContext: input.canonicalContext,
  })
  const binding =
    createCanonicalPreapprovalRouteDataAssuranceBinding({
      evidenceSnapshotId: readerResult.evidenceSnapshotId,
      evidenceRevision: readerResult.evidenceRevision,
      evaluatedAt: readerResult.evaluatedAt,
      projectPolicy: readerResult.projectPolicy,
      requestClassification: readerResult.requestClassification,
      routeAssurances: readerResult.routeAssurances,
    })
  assertBindingMatchesCurrentContext({
    binding,
    canonicalContext: input.canonicalContext,
  })
  const repository = input.repository
    ?? new PrivateCanonicalPreapprovalRouteDataAssuranceRepository()
  const persisted = await repository.save({
    scope: input.repositoryScope,
    package: binding,
  })
  const reread = await repository.readByServerOwnedLocator({
    scope: input.repositoryScope,
    locator: persisted.locator,
  })
  if (
    reread.contractDigestSha256 !== binding.contractDigestSha256
    || sha256AuthorityValue(reread) !== sha256AuthorityValue(binding)
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_readback_mismatch',
    )
  }
  return persisted
}

export async function readCurrentCanonicalPreapprovalRouteDataAssurance(
  input: {
    readonly repositoryScope:
      CanonicalPreapprovalRouteDataAssuranceRepositoryScope
    readonly canonicalContext:
      CanonicalPreapprovalRouteDataAssuranceContext
    readonly locator: unknown
    readonly repository?:
      PrivateCanonicalPreapprovalRouteDataAssuranceRepository
  },
): Promise<CanonicalPreapprovalRouteDataAssuranceBinding> {
  assertCanonicalContext(input.canonicalContext)
  const locator =
    canonicalPreapprovalRouteDataAssuranceLocatorSchema.safeParse(
      input.locator,
    )
  if (!locator.success) {
    throw validation(
      'canonical_preapproval_route_data_assurance_locator_invalid',
    )
  }
  const repository = input.repository
    ?? new PrivateCanonicalPreapprovalRouteDataAssuranceRepository()
  const first = verifyCanonicalPreapprovalRouteDataAssuranceBinding(
    await repository.readByServerOwnedLocator({
      scope: input.repositoryScope,
      locator: locator.data,
    }),
  )
  assertBindingMatchesCurrentContext({
    binding: first,
    canonicalContext: input.canonicalContext,
  })
  const second = verifyCanonicalPreapprovalRouteDataAssuranceBinding(
    await repository.readByServerOwnedLocator({
      scope: input.repositoryScope,
      locator: locator.data,
    }),
  )
  assertBindingMatchesCurrentContext({
    binding: second,
    canonicalContext: input.canonicalContext,
  })
  if (sha256AuthorityValue(first) !== sha256AuthorityValue(second)) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_reread_race',
    )
  }
  return first
}

async function readCurrentSourceAssurance(input: {
  reader:
    | CanonicalPreapprovalRouteDataAssuranceReaderPort
    | null
    | undefined
  serverOwnedLocatorId: string
  canonicalContext: CanonicalPreapprovalRouteDataAssuranceContext
}): Promise<CanonicalPreapprovalRouteDataAssuranceReaderResult> {
  assertReader(input.reader)
  const request = Object.freeze({
    serverOwnedLocatorId: input.serverOwnedLocatorId,
    expectedScope: Object.freeze({
      workspaceId: input.canonicalContext.workspaceId,
      projectId: input.canonicalContext.projectId,
      editSessionId: input.canonicalContext.editSessionId,
    }),
    expectedRequestDigestSha256:
      input.canonicalContext.requestDigestSha256,
  })
  const first = parseReaderResult(
    await input.reader.readCurrentByServerOwnedLocator(request),
  )
  assertReaderResult({ result: first, request })
  const second = parseReaderResult(
    await input.reader.readCurrentByServerOwnedLocator(request),
  )
  assertReaderResult({ result: second, request })
  if (sha256AuthorityValue(first) !== sha256AuthorityValue(second)) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_source_reread_race',
    )
  }
  return first
}

function parseReaderResult(
  value: unknown,
): CanonicalPreapprovalRouteDataAssuranceReaderResult {
  const parsed = readerResultSchema.safeParse(value)
  if (!parsed.success) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_reader_result_invalid',
    )
  }
  const { readerResultDigestSha256, ...draft } = parsed.data
  if (
    readerResultDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.data.routeAssuranceCount !==
      parsed.data.routeAssurances.length
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_reader_digest_invalid',
    )
  }
  return parsed.data
}

function assertReaderResult(input: {
  result: CanonicalPreapprovalRouteDataAssuranceReaderResult
  request: {
    readonly serverOwnedLocatorId: string
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly expectedRequestDigestSha256: string
  }
}): void {
  if (
    input.result.serverOwnedLocatorId !==
      input.request.serverOwnedLocatorId
    || input.result.identity.workspaceId !==
      input.request.expectedScope.workspaceId
    || input.result.identity.projectId !==
      input.request.expectedScope.projectId
    || input.result.identity.editSessionId !==
      input.request.expectedScope.editSessionId
    || input.result.identity.requestDigestSha256 !==
      input.request.expectedRequestDigestSha256
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_reader_scope_stale',
    )
  }
  const evaluatedAt = Date.parse(input.result.evaluatedAt)
  const now = Date.now()
  if (
    evaluatedAt < now - MAX_READER_RESULT_AGE_MS
    || evaluatedAt > now + MAX_READER_RESULT_FUTURE_SKEW_MS
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_reader_result_stale',
    )
  }
}

function assertReader(
  reader:
    | CanonicalPreapprovalRouteDataAssuranceReaderPort
    | null
    | undefined,
): asserts reader is CanonicalPreapprovalRouteDataAssuranceReaderPort {
  if (
    !reader
    || !admittedReaders.has(reader)
    || reader.schemaVersion !==
      CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_VERSION
    || reader.sourceAuthority !==
      'canonical_private_route_data_assurance_repository'
    || reader.evidenceClass !==
      'process_bound_private_route_data_assurance_reader'
    || reader.productionReady !== false
    || reader.callerSuppliedPolicyAccepted !== false
    || typeof reader.readCurrentByServerOwnedLocator !== 'function'
  ) {
    throw blocked(
      'canonical_preapproval_route_data_assurance_reader_required',
    )
  }
}

function assertBindingMatchesCurrentContext(input: {
  binding: CanonicalPreapprovalRouteDataAssuranceBinding
  canonicalContext: CanonicalPreapprovalRouteDataAssuranceContext
}): void {
  if (
    input.binding.workspaceId !== input.canonicalContext.workspaceId
    || input.binding.projectId !== input.canonicalContext.projectId
    || input.binding.editSessionId !==
      input.canonicalContext.editSessionId
    || input.binding.requestDigestSha256 !==
      input.canonicalContext.requestDigestSha256
  ) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_context_stale',
    )
  }
  if (Date.now() >= Date.parse(input.binding.validUntil)) {
    throw conflict(
      'canonical_preapproval_route_data_assurance_binding_expired',
    )
  }
}

function assertCanonicalContext(
  input: CanonicalPreapprovalRouteDataAssuranceContext,
): void {
  if (
    !safeIdentitySchema.safeParse(input.workspaceId).success
    || !safeIdentitySchema.safeParse(input.projectId).success
    || !safeIdentitySchema.safeParse(input.editSessionId).success
    || !digestSchema.safeParse(input.requestDigestSha256).success
  ) {
    throw validation(
      'canonical_preapproval_route_data_assurance_context_invalid',
    )
  }
}

function validation(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical preapproval route-data assurance input is invalid.',
    400,
    { reason },
  )
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical preapproval route-data assurance is stale or inconsistent.',
    409,
    { reason },
  )
}

function blocked(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical preapproval route-data assurance is not ready.',
    503,
    { reason },
  )
}
