import type { RuntimeEnv } from '../config/env'
import type { EditReferenceRepositoryScope } from '../edit-references/edit-reference-repository'
import type { EditReferenceLongFormSemanticWindowCheckpoint } from '../edit-references/edit-reference-long-form-semantic-window-checkpoint'
import type { EditReferenceLongFormSemanticWindowPlan } from '../edit-references/edit-reference-long-form-semantic-window-contract'
import type {
  EditReferenceLongFormStudyControlAction,
  EditReferenceLongFormStudyPlan,
  EditReferenceLongFormStudyRunRecord,
} from '../edit-references/edit-reference-long-form-study-contract'
import {
  type EditReferenceLongFormStudyScheduleResult,
  type EditReferenceLongFormStudyScheduler,
  scheduleEditReferenceLongFormStudy,
} from '../edit-references/edit-reference-long-form-study-scheduler'
import type { EditReferenceLongFormStudyWorkOutput } from '../edit-references/edit-reference-long-form-study-work-output'
import type {
  EditReferenceLongFormSourcePurpose,
  EditReferenceLongFormStorageObject,
} from '../edit-references/edit-reference-long-form-source-inspector'
import type { EditReferenceSemanticSpecialistId } from '../edit-references/edit-reference-semantic-study-contract'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import {
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS,
} from '../edit-references/edit-reference-production-readiness'
import {
  PrivateEditReferenceLongFormStudyRepository,
  type EditReferenceLongFormStudyControlCommandReceipt,
} from '../edit-references/private-edit-reference-long-form-study-repository'
import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION =
  'edit-reference-production-long-form-runtime-port-v1' as const
export const EDIT_REFERENCE_LONG_FORM_RUNTIME_PORT_FACTORY_VERSION =
  'edit-reference-long-form-runtime-port-factory-v1' as const

export type EditReferenceLongFormRuntimeEvidenceClass =
  | 'backend_local_private_only'
  | 'canonical_contract_fixture_unreleased'
  | 'canonical_backend_verified_runtime'
  | 'blocked_missing_canonical_runtime'

export type EditReferenceLongFormRuntimeSourceAuthority =
  | 'backend_local_private_segmented'
  | 'canonical_v3_loopback_postgres_pre_plan_study'
  | 'canonical_edit_reference_production_repository'
  | 'unavailable'

interface EditReferenceLongFormStudyCommonSourceBinding {
  readonly sourceAssetId: string
  readonly sourceStorageObjectRecordId: string
  readonly sourceMediaAssetId: string
  readonly sourceStorageObjectId: string
  readonly sourceStorageGeneration: string
  readonly sourceStorageEtag: string
}

export type EditReferenceLongFormStudySourceBinding =
  | (EditReferenceLongFormStudyCommonSourceBinding & {
      readonly sourceAuthority: 'preference_asset'
    })
  | (EditReferenceLongFormStudyCommonSourceBinding & {
      readonly sourceAuthority: 'target_source_media'
      readonly targetProjectId: string
      readonly targetEditSessionId: string
      readonly targetEditBriefId: string
      readonly targetEditBriefRevision: number
      readonly targetEditBriefDigestSha256: string
    })

export interface EditReferenceLongFormStudyRuntimePort {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION
  readonly persistenceContractVersion: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  readonly authorityClass: 'pre_plan_edit_reference_long_form_study'
  readonly sourceAuthority: EditReferenceLongFormRuntimeSourceAuthority
  readonly evidenceClass: EditReferenceLongFormRuntimeEvidenceClass
  readonly productionAuthority: boolean
  readonly approvedEditAuthorityFabricated: false
  readonly approvedEditPlanSnapshotRequired: false
  readonly approvedEditCreditReservationRequired: false
  readonly browserClaimAllowed: false
  readonly browserSessionRequiredForCompletion: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly canonicalWorkerSpineRequired: true
  readonly createsSecondProductionQueueOrRepository: false
  readonly databaseTransactionAdapterVerified: boolean
  readonly multiReplicaLeaseRecoveryVerified: boolean
  readonly authenticatedWorkerDispatchVerified: boolean
  readonly livePrivateObjectReadVerified: boolean

  create(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly plan: EditReferenceLongFormStudyPlan
    readonly run: EditReferenceLongFormStudyRunRecord
    readonly sourceBinding?: EditReferenceLongFormStudySourceBinding
  }): Promise<{
    readonly plan: EditReferenceLongFormStudyPlan
    readonly run: EditReferenceLongFormStudyRunRecord
    readonly disposition: 'created' | 'idempotent_replay' | 'recovered_partial_create'
  }>

  read(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
  }): Promise<{
    readonly plan: EditReferenceLongFormStudyPlan
    readonly run: EditReferenceLongFormStudyRunRecord
  } | undefined>

  applyControlCommand(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly expectedRunRevision: number
    readonly action: EditReferenceLongFormStudyControlAction
    readonly idempotencyKey: string
    readonly now: string
  }): Promise<{
    readonly plan: EditReferenceLongFormStudyPlan
    readonly run: EditReferenceLongFormStudyRunRecord
    readonly receipt: EditReferenceLongFormStudyControlCommandReceipt
    readonly disposition: 'applied' | 'idempotent_replay'
  }>

  readWorkOutput(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly workItemId: string
  }): Promise<EditReferenceLongFormStudyWorkOutput | undefined>

  readSemanticWindowCheckpoint(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly workItemId: string
    readonly semanticWindowId: string
    readonly specialistId: EditReferenceSemanticSpecialistId
    readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  }): Promise<EditReferenceLongFormSemanticWindowCheckpoint | undefined>

  schedule(input: {
    readonly env: RuntimeEnv
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly storageObject: EditReferenceLongFormStorageObject
    readonly requiredObjectPurpose?: EditReferenceLongFormSourcePurpose
  }): EditReferenceLongFormStudyScheduleResult
}

export interface EditReferenceLongFormStudyAuthenticatedRequestAuthority {
  readonly ownerUserId: string
  readonly authenticatedAccessToken: string
  readonly isMockUser: false
}

export interface EditReferenceLongFormStudyRuntimePortFactory {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_RUNTIME_PORT_FACTORY_VERSION
  readonly authorityClass: 'pre_plan_edit_reference_long_form_study'
  readonly sourceAuthority:
    | 'canonical_v3_loopback_postgres_pre_plan_study'
    | 'canonical_edit_reference_production_repository'
  readonly evidenceClass:
    | 'canonical_contract_fixture_unreleased'
    | 'canonical_backend_verified_runtime'
  readonly requestScopedAuthenticatedUserAuthority: true
  readonly authenticatedActorDerivedServerSide: true
  readonly browserSuppliedAuthorityAccepted: false
  readonly serviceRoleCredentialAccepted: false
  readonly authenticatedAccessTokenPersistedOrProjected: false
  readonly runtimePortReuseAcrossRequestsAllowed: false
  readonly productionAuthority: boolean
  createForAuthenticatedRequest(input: {
    readonly env: RuntimeEnv
    readonly authority: EditReferenceLongFormStudyAuthenticatedRequestAuthority
  }): EditReferenceLongFormStudyRuntimePort
}

export function createEditReferenceLongFormStudyRuntimePortFactory(input: {
  readonly sourceAuthority: EditReferenceLongFormStudyRuntimePortFactory['sourceAuthority']
  readonly evidenceClass: EditReferenceLongFormStudyRuntimePortFactory['evidenceClass']
  readonly productionAuthority: boolean
  readonly createForAuthenticatedRequest:
    EditReferenceLongFormStudyRuntimePortFactory['createForAuthenticatedRequest']
}): EditReferenceLongFormStudyRuntimePortFactory {
  const factory: EditReferenceLongFormStudyRuntimePortFactory = Object.freeze({
    schemaVersion: EDIT_REFERENCE_LONG_FORM_RUNTIME_PORT_FACTORY_VERSION,
    authorityClass: 'pre_plan_edit_reference_long_form_study' as const,
    sourceAuthority: input.sourceAuthority,
    evidenceClass: input.evidenceClass,
    requestScopedAuthenticatedUserAuthority: true as const,
    authenticatedActorDerivedServerSide: true as const,
    browserSuppliedAuthorityAccepted: false as const,
    serviceRoleCredentialAccepted: false as const,
    authenticatedAccessTokenPersistedOrProjected: false as const,
    runtimePortReuseAcrossRequestsAllowed: false as const,
    productionAuthority: input.productionAuthority,
    createForAuthenticatedRequest: input.createForAuthenticatedRequest,
  })
  assertRuntimePortFactoryShape(factory)
  runtimePortFactoryBrands.add(factory)
  return factory
}

export interface ResolveEditReferenceLongFormStudyRuntimePortInput {
  readonly env: RuntimeEnv
  readonly runtimePort?: EditReferenceLongFormStudyRuntimePort
  readonly runtimePortFactory?: EditReferenceLongFormStudyRuntimePortFactory
  readonly authenticatedRequest?: {
    readonly userId: string
    readonly accessToken?: string
    readonly isMockUser: boolean
  }
  readonly localRepository?: PrivateEditReferenceLongFormStudyRepository
  readonly localScheduler?: EditReferenceLongFormStudyScheduler
}

const qualifiedProductionRuntimePorts = new WeakSet<EditReferenceLongFormStudyRuntimePort>()
const runtimePortFactoryBrands = new WeakSet<object>()
const resolvedRequestScopedRuntimePorts = new WeakSet<object>()

export function resolveEditReferenceLongFormStudyRuntimePort(
  input: ResolveEditReferenceLongFormStudyRuntimePortInput,
): EditReferenceLongFormStudyRuntimePort {
  if (input.runtimePort && input.runtimePortFactory) {
    throw invalidRuntimeConfiguration('multiple_long_form_runtime_authorities_configured')
  }
  if (
    (input.runtimePort || input.runtimePortFactory)
    && (input.localRepository || input.localScheduler)
  ) {
    throw invalidRuntimeConfiguration('runtime_port_and_local_legacy_adapters_mixed')
  }

  const runtimePort = input.runtimePortFactory
    ? resolveRequestScopedRuntimePort(input)
    : input.runtimePort

  if (isExplicitBackendLocalRuntime(input.env)) {
    if (!runtimePort) {
      return createBackendLocalEditReferenceLongFormStudyRuntimePort({
        repository: input.localRepository,
        scheduler: input.localScheduler,
      })
    }
    assertRuntimePortShape(runtimePort)
    const localPrivateAuthority =
      runtimePort.sourceAuthority === 'backend_local_private_segmented'
      && runtimePort.evidenceClass === 'backend_local_private_only'
      && !runtimePort.databaseTransactionAdapterVerified
    const canonicalV3LocalAuthority =
      runtimePort.sourceAuthority === 'canonical_v3_loopback_postgres_pre_plan_study'
      && runtimePort.evidenceClass === 'canonical_contract_fixture_unreleased'
      && runtimePort.databaseTransactionAdapterVerified
    if (
      (!localPrivateAuthority && !canonicalV3LocalAuthority)
      || runtimePort.productionAuthority
      || runtimePort.multiReplicaLeaseRecoveryVerified
      || runtimePort.authenticatedWorkerDispatchVerified
      || runtimePort.livePrivateObjectReadVerified
    ) throw invalidRuntimeConfiguration('local_runtime_port_authority_invalid')
    return runtimePort
  }

  if (input.localRepository || input.localScheduler) {
    throw invalidRuntimeConfiguration('hosted_runtime_cannot_mount_local_long_form_adapters')
  }
  if (!runtimePort) return createBlockedProductionRuntimePort()

  assertRuntimePortShape(runtimePort)
  assertQualifiedProductionRuntimePort(runtimePort)
  return runtimePort
}

function resolveRequestScopedRuntimePort(
  input: ResolveEditReferenceLongFormStudyRuntimePortInput,
): EditReferenceLongFormStudyRuntimePort {
  const factory = input.runtimePortFactory
  if (!factory) throw invalidRuntimeConfiguration('request_scoped_factory_missing')
  assertEditReferenceLongFormStudyRuntimePortFactory(factory)
  const authenticatedRequest = input.authenticatedRequest
  if (
    !authenticatedRequest
    || authenticatedRequest.isMockUser
    || !isBoundedJwt(authenticatedRequest.accessToken)
    || !authenticatedRequest.userId.trim()
  ) {
    throw invalidRuntimeConfiguration(
      'request_scoped_authenticated_user_authority_required',
    )
  }
  const localRuntime = isExplicitBackendLocalRuntime(input.env)
  if (
    (localRuntime
      && factory.sourceAuthority !== 'canonical_v3_loopback_postgres_pre_plan_study')
    || (!localRuntime
      && factory.sourceAuthority !== 'canonical_edit_reference_production_repository')
  ) {
    throw invalidRuntimeConfiguration(
      'request_scoped_factory_runtime_class_mismatch',
    )
  }
  const runtimePort = factory.createForAuthenticatedRequest({
    env: input.env,
    authority: Object.freeze({
      ownerUserId: authenticatedRequest.userId,
      authenticatedAccessToken: authenticatedRequest.accessToken,
      isMockUser: false as const,
    }),
  })
  assertRuntimePortShape(runtimePort)
  if (
    runtimePort.sourceAuthority !== factory.sourceAuthority
    || runtimePort.evidenceClass !== factory.evidenceClass
    || runtimePort.productionAuthority !== factory.productionAuthority
  ) {
    throw invalidRuntimeConfiguration(
      'request_scoped_runtime_port_factory_result_changed_authority',
    )
  }
  if (resolvedRequestScopedRuntimePorts.has(runtimePort)) {
    throw invalidRuntimeConfiguration(
      'request_scoped_runtime_port_reused_across_requests',
    )
  }
  resolvedRequestScopedRuntimePorts.add(runtimePort)
  return runtimePort
}

export function assertEditReferenceLongFormStudyRuntimePortFactory(
  factory: EditReferenceLongFormStudyRuntimePortFactory,
): void {
  assertRuntimePortFactoryShape(factory)
  if (!runtimePortFactoryBrands.has(factory)) {
    throw invalidRuntimeConfiguration(
      'long_form_runtime_port_factory_not_process_branded',
    )
  }
}

function assertRuntimePortFactoryShape(
  factory: EditReferenceLongFormStudyRuntimePortFactory,
): void {
  const localFactory =
    factory.sourceAuthority === 'canonical_v3_loopback_postgres_pre_plan_study'
    && factory.evidenceClass === 'canonical_contract_fixture_unreleased'
    && factory.productionAuthority === false
  const productionFactory =
    factory.sourceAuthority === 'canonical_edit_reference_production_repository'
    && factory.evidenceClass === 'canonical_backend_verified_runtime'
    && factory.productionAuthority === true
  if (
    factory.schemaVersion !== EDIT_REFERENCE_LONG_FORM_RUNTIME_PORT_FACTORY_VERSION
    || factory.authorityClass !== 'pre_plan_edit_reference_long_form_study'
    || factory.requestScopedAuthenticatedUserAuthority !== true
    || factory.authenticatedActorDerivedServerSide !== true
    || factory.browserSuppliedAuthorityAccepted !== false
    || factory.serviceRoleCredentialAccepted !== false
    || factory.authenticatedAccessTokenPersistedOrProjected !== false
    || factory.runtimePortReuseAcrossRequestsAllowed !== false
    || typeof factory.createForAuthenticatedRequest !== 'function'
    || (!localFactory && !productionFactory)
  ) {
    throw invalidRuntimeConfiguration('long_form_runtime_port_factory_shape_invalid')
  }
}

function isBoundedJwt(value: string | undefined): value is string {
  return typeof value === 'string'
    && value.length >= 20
    && value.length <= 16_384
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/u.test(value)
}

export function createBackendLocalEditReferenceLongFormStudyRuntimePort(input: {
  readonly repository?: PrivateEditReferenceLongFormStudyRepository
  readonly scheduler?: EditReferenceLongFormStudyScheduler
} = {}): EditReferenceLongFormStudyRuntimePort {
  const repository = input.repository ?? new PrivateEditReferenceLongFormStudyRepository()
  const scheduler = input.scheduler ?? scheduleEditReferenceLongFormStudy
  const port: EditReferenceLongFormStudyRuntimePort = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    authorityClass: 'pre_plan_edit_reference_long_form_study',
    sourceAuthority: 'backend_local_private_segmented',
    evidenceClass: 'backend_local_private_only',
    productionAuthority: false,
    approvedEditAuthorityFabricated: false,
    approvedEditPlanSnapshotRequired: false,
    approvedEditCreditReservationRequired: false,
    browserClaimAllowed: false,
    browserSessionRequiredForCompletion: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    canonicalWorkerSpineRequired: true,
    createsSecondProductionQueueOrRepository: false,
    databaseTransactionAdapterVerified: false,
    multiReplicaLeaseRecoveryVerified: false,
    authenticatedWorkerDispatchVerified: false,
    livePrivateObjectReadVerified: false,
    async create(createInput) {
      const result = await repository.create(createInput)
      return {
        plan: result.plan,
        run: result.run,
        disposition: result.disposition,
      }
    },
    read: (readInput) => repository.read(readInput),
    async applyControlCommand(controlInput) {
      const result = await repository.applyControlCommand(controlInput)
      return {
        plan: result.plan,
        run: result.run,
        receipt: result.receipt,
        disposition: result.disposition,
      }
    },
    readWorkOutput: (readInput) => repository.readWorkOutput(readInput),
    readSemanticWindowCheckpoint: (readInput) => (
      repository.readSemanticWindowCheckpoint(readInput)
    ),
    schedule(scheduleInput) {
      return scheduler({ ...scheduleInput, repository })
    },
  }
  assertRuntimePortShape(port)
  return Object.freeze(port)
}

export function assertEditReferenceLongFormRuntimePortIsNotProduction(
  port: EditReferenceLongFormStudyRuntimePort,
): void {
  assertRuntimePortShape(port)
  if (
    port.productionAuthority
    || port.evidenceClass === 'canonical_backend_verified_runtime'
    || qualifiedProductionRuntimePorts.has(port)
  ) {
    throw invalidRuntimeConfiguration('runtime_port_unexpectedly_has_production_authority')
  }
}

function createBlockedProductionRuntimePort(): EditReferenceLongFormStudyRuntimePort {
  const blocked = (): never => {
    const gate = EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.find((candidate) => (
      candidate.id === 'durable_long_form_study'
    ))
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Hosted Edit Reference study is unavailable until the canonical durable long-form runtime is verified.',
      503,
      {
        reason: 'canonical_production_long_form_runtime_missing',
        requiredGate: 'durable_long_form_study',
        requiredAssertions: gate?.assertions ?? [],
        persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
        localFallbackAllowed: false,
        productionReady: false,
      },
    )
  }
  const port: EditReferenceLongFormStudyRuntimePort = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    authorityClass: 'pre_plan_edit_reference_long_form_study',
    sourceAuthority: 'unavailable',
    evidenceClass: 'blocked_missing_canonical_runtime',
    productionAuthority: false,
    approvedEditAuthorityFabricated: false,
    approvedEditPlanSnapshotRequired: false,
    approvedEditCreditReservationRequired: false,
    browserClaimAllowed: false,
    browserSessionRequiredForCompletion: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    canonicalWorkerSpineRequired: true,
    createsSecondProductionQueueOrRepository: false,
    databaseTransactionAdapterVerified: false,
    multiReplicaLeaseRecoveryVerified: false,
    authenticatedWorkerDispatchVerified: false,
    livePrivateObjectReadVerified: false,
    async create() { return blocked() },
    async read() { return blocked() },
    async applyControlCommand() { return blocked() },
    async readWorkOutput() { return blocked() },
    async readSemanticWindowCheckpoint() { return blocked() },
    schedule() { return blocked() },
  }
  assertRuntimePortShape(port)
  return Object.freeze(port)
}

function assertQualifiedProductionRuntimePort(
  port: EditReferenceLongFormStudyRuntimePort,
): void {
  if (
    port.sourceAuthority !== 'canonical_edit_reference_production_repository'
    || port.evidenceClass !== 'canonical_backend_verified_runtime'
    || !port.productionAuthority
    || !port.databaseTransactionAdapterVerified
    || !port.multiReplicaLeaseRecoveryVerified
    || !port.authenticatedWorkerDispatchVerified
    || !port.livePrivateObjectReadVerified
    || !qualifiedProductionRuntimePorts.has(port)
  ) throw invalidRuntimeConfiguration('canonical_production_long_form_runtime_not_qualified')
}

function assertRuntimePortShape(port: EditReferenceLongFormStudyRuntimePort): void {
  if (
    port.schemaVersion !== EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION
    || port.persistenceContractVersion !== EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
    || port.authorityClass !== 'pre_plan_edit_reference_long_form_study'
    || typeof port.productionAuthority !== 'boolean'
    || port.approvedEditAuthorityFabricated !== false
    || port.approvedEditPlanSnapshotRequired !== false
    || port.approvedEditCreditReservationRequired !== false
    || port.browserClaimAllowed !== false
    || port.browserSessionRequiredForCompletion !== false
    || port.customerPriceCalculated !== false
    || port.customerCreditsMutated !== false
    || port.serviceFeeIncluded !== false
    || port.canonicalWorkerSpineRequired !== true
    || port.createsSecondProductionQueueOrRepository !== false
    || typeof port.databaseTransactionAdapterVerified !== 'boolean'
    || typeof port.multiReplicaLeaseRecoveryVerified !== 'boolean'
    || typeof port.authenticatedWorkerDispatchVerified !== 'boolean'
    || typeof port.livePrivateObjectReadVerified !== 'boolean'
    || typeof port.create !== 'function'
    || typeof port.read !== 'function'
    || typeof port.applyControlCommand !== 'function'
    || typeof port.readWorkOutput !== 'function'
    || typeof port.readSemanticWindowCheckpoint !== 'function'
    || typeof port.schedule !== 'function'
  ) throw invalidRuntimeConfiguration('long_form_runtime_port_shape_invalid')
}

function isExplicitBackendLocalRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv !== 'production'
    && (env.mode === 'local' || env.mode === 'mock')
    && env.storageMode === 'local'
    && (env.workerRuntimeMode === 'local' || env.workerRuntimeMode === 'mock')
}

function invalidRuntimeConfiguration(reason: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'The Edit Reference long-form runtime authority is unavailable or unsafe.',
    503,
    {
      reason,
      requiredGate: 'durable_long_form_study',
      productionReady: false,
    },
  )
}
