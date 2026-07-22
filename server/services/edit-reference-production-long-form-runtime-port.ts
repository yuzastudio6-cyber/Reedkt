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

export interface EditReferenceLongFormStudySourceBinding {
  readonly sourceAuthority: 'preference_asset' | 'target_source_media'
  readonly sourceAssetId: string
  readonly sourceStorageObjectId: string
  readonly sourceStorageGeneration: string
  readonly sourceStorageEtag: string
}

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

export interface ResolveEditReferenceLongFormStudyRuntimePortInput {
  readonly env: RuntimeEnv
  readonly runtimePort?: EditReferenceLongFormStudyRuntimePort
  readonly localRepository?: PrivateEditReferenceLongFormStudyRepository
  readonly localScheduler?: EditReferenceLongFormStudyScheduler
}

const qualifiedProductionRuntimePorts = new WeakSet<EditReferenceLongFormStudyRuntimePort>()

export function resolveEditReferenceLongFormStudyRuntimePort(
  input: ResolveEditReferenceLongFormStudyRuntimePortInput,
): EditReferenceLongFormStudyRuntimePort {
  if (input.runtimePort && (input.localRepository || input.localScheduler)) {
    throw invalidRuntimeConfiguration('runtime_port_and_local_legacy_adapters_mixed')
  }

  if (isExplicitBackendLocalRuntime(input.env)) {
    if (!input.runtimePort) {
      return createBackendLocalEditReferenceLongFormStudyRuntimePort({
        repository: input.localRepository,
        scheduler: input.localScheduler,
      })
    }
    assertRuntimePortShape(input.runtimePort)
    const localPrivateAuthority =
      input.runtimePort.sourceAuthority === 'backend_local_private_segmented'
      && input.runtimePort.evidenceClass === 'backend_local_private_only'
      && !input.runtimePort.databaseTransactionAdapterVerified
    const canonicalV3LocalAuthority =
      input.runtimePort.sourceAuthority === 'canonical_v3_loopback_postgres_pre_plan_study'
      && input.runtimePort.evidenceClass === 'canonical_contract_fixture_unreleased'
      && input.runtimePort.databaseTransactionAdapterVerified
    if (
      (!localPrivateAuthority && !canonicalV3LocalAuthority)
      || input.runtimePort.productionAuthority
      || input.runtimePort.multiReplicaLeaseRecoveryVerified
      || input.runtimePort.authenticatedWorkerDispatchVerified
      || input.runtimePort.livePrivateObjectReadVerified
    ) throw invalidRuntimeConfiguration('local_runtime_port_authority_invalid')
    return input.runtimePort
  }

  if (input.localRepository || input.localScheduler) {
    throw invalidRuntimeConfiguration('hosted_runtime_cannot_mount_local_long_form_adapters')
  }
  if (!input.runtimePort) return createBlockedProductionRuntimePort()

  assertRuntimePortShape(input.runtimePort)
  assertQualifiedProductionRuntimePort(input.runtimePort)
  return input.runtimePort
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
