import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { createReeditProApiApp } from '../../server/app'
import { loadRuntimeEnv } from '../../server/config/env'
import { ApiError } from '../../server/errors/api-error'
import {
  createEditReferenceCanonicalV3LocalExactEditApplyRuntimePort,
  EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
  type EditReferenceExactEditApplyRuntimePort,
} from '../../server/services/edit-reference-exact-edit-apply-runtime-port'
import {
  PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION,
  type PlanningExactEditPreferenceAuthorityPort,
  type PlanningExactEditPreferenceAuthorityResolution,
} from '../../server/services/planning-exact-edit-preference-authority-port'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
  type EditReferenceProductionExactEditApplyApiReceipt,
  type EditReferenceProductionExactEditPreferenceValues,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import {
  CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION,
  CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION,
  type CanonicalExactEditPlanningAuthorityRead,
} from '../../src/types/canonical-exact-edit-planning-authority'
import {
  createControlledLocalEditReferenceApplicationPreparationFixture,
} from '../../server/edit-references/controlled-local-edit-reference-application-preparation-fixture'
import {
  createEditReferenceProductionOutputFrameAuthority,
} from '../../server/edit-references/edit-reference-production-output-frame-authority'
import {
  createEditReferenceLocalSupabaseDomainCapability,
  createEditReferenceLocalSupabaseDomainRepository,
} from '../../server/edit-references/edit-reference-local-supabase-domain-repository'
import {
  createEditReferenceLocalSupabaseDomainHttpRpcClient,
} from '../../server/edit-references/edit-reference-local-supabase-domain-http-rpc-client'
import {
  createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort,
  type EditReferenceDomainRepositoryRuntimePort,
} from '../../server/services/edit-reference-domain-repository-runtime-port'
import {
  createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory,
} from '../../server/services/edit-reference-canonical-v3-local-long-form-runtime-port-factory'
import type {
  EditReferenceLongFormStudyRuntimePortFactory,
} from '../../server/services/edit-reference-production-long-form-runtime-port'
import {
  createEditReferenceSignedInPrivateMediaRuntimePort,
} from '../../server/services/edit-reference-signed-in-private-media-runtime-port'
import {
  createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory,
} from '../../server/services/edit-reference-canonical-v3-local-exact-edit-brief-runtime-port-factory'
import type {
  EditReferenceExactEditBriefRuntimePortFactory,
} from '../../server/services/edit-reference-exact-edit-brief-runtime-port'
import {
  createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory,
} from '../../server/services/edit-reference-canonical-v3-local-target-understanding-package-runtime-port-factory'
import {
  createEditReferenceLocalSupabaseApplicationPreparationPort,
} from '../../server/edit-references/edit-reference-local-supabase-application-preparation-port'
import type {
  EditReferenceTargetUnderstandingPackageRuntimePortFactory,
} from '../../server/services/edit-reference-target-understanding-package-runtime-port'
import {
  createPrivateLocalMotionStudioCommandRepository,
  createPrivateLocalMotionStudioCommandRepositoryRuntimePort,
} from '../../server/motion-studio/commands'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileAtomicWithinRoot,
} from '../../server/security/private-local-persistence'
import {
  readLatestPrivateCanonicalPlanningHandoff,
} from '../../server/services/private-canonical-planning-handoff-store'
import { createInternalEditStateService } from '../../server/services/internal-edit-state-service'
import type { ServiceContext } from '../../server/types'
import {
  exactEditPreferenceValuesSchema,
} from '../../server/validation/exact-edit-preference-schemas'

type ConfirmedAspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | '4:3'

const LOCAL_PRIVATE_EXECUTION_INTERNAL_SERVICE_TOKEN =
  'reeditpro-local-private-break-test-worker-lease-authority-v1'
const LOCAL_EXACT_EDIT_STATE_RECORD_VERSION =
  'reeditpro-local-break-test-exact-edit-state-v1' as const

type ExactEditState = {
  values: EditReferenceProductionExactEditPreferenceValues
  recordRevision: number
  preferenceRevision: number
  planningInputRevision: number
  sourcePreparation: {
    status: 'not_ready' | 'requires_repreparation' | 'ready'
    sourceCandidateHashSha256: string | null
    evidenceHashSha256: string | null
    confirmedAt: string | null
  }
  confirmedAspectRatio: ConfirmedAspectRatio | null
  currentApplicationId: string | null
}

const defaultValues: EditReferenceProductionExactEditPreferenceValues = {
  editLevel: 'pro',
  workflowType: 'custom_let_ai_decide',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'custom',
}
const states = new Map<string, ExactEditState>()
const committedByIdempotencyHash = new Map<string, {
  requestDigestSha256: string
  receipt: EditReferenceProductionExactEditApplyApiReceipt
}>()
const applicationPreparation =
  createControlledLocalEditReferenceApplicationPreparationFixture()

const planningPort: PlanningExactEditPreferenceAuthorityPort = Object.freeze({
  async readExactPreferenceState(scope) {
    const state = await getOrCreateStateForScope(scope)
    return planningResolution(scope, state)
  },

  async recordVerifiedPlanningEvidence({ scope, request }) {
    if (
      request.schemaVersion
        !== CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION
      || request.actorUserId !== scope.ownerUserId
      || request.workspaceId !== scope.workspaceId
      || request.projectId !== scope.projectId
      || request.editSessionId !== scope.editSessionId
    ) throw new ApiError('IDEMPOTENCY_CONFLICT', 'Planning evidence scope changed.', 409)
    const key = stateKey(scope.workspaceId, scope.projectId, scope.editSessionId)
    const state = await getOrCreateStateForScope(scope)
    if (
      state.preferenceRevision !== request.expectedPreferenceRevision
      || state.planningInputRevision !== request.expectedPlanningInputRevision
      || sha256(state.values) !== request.expectedPreferenceFingerprintSha256
      || request.expectedBaselinePreferenceSnapshotId !== baselineSnapshotId(key)
    ) throw new ApiError('IDEMPOTENCY_CONFLICT', 'Planning authority changed.', 409)
    if (
      !state.confirmedAspectRatio
      || request.confirmedAspectRatio !== state.confirmedAspectRatio
    ) {
      throw new ApiError('PLAN_NOT_APPROVED', 'Confirm the exact output frame.', 409)
    }
    const exactReplay = state.sourcePreparation.status === 'ready'
      && state.sourcePreparation.sourceCandidateHashSha256
        === request.sourceCandidateHashSha256
      && state.sourcePreparation.evidenceHashSha256
        === request.sourcePreparationEvidenceHashSha256
    let nextState = state
    if (!exactReplay) {
      nextState = {
        ...state,
        recordRevision: state.recordRevision + 1,
        sourcePreparation: {
          status: 'ready',
          sourceCandidateHashSha256: request.sourceCandidateHashSha256,
          evidenceHashSha256: request.sourcePreparationEvidenceHashSha256,
          confirmedAt: new Date().toISOString(),
        },
      }
      await persistExactEditState(scope, nextState)
    }
    return planningResolution(scope, nextState)
  },
})

const runtimePort: EditReferenceExactEditApplyRuntimePort = Object.freeze({
  schemaVersion: EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
  persistenceContractVersion: 'edit-reference-production-persistence-contract-v6',
  authorityClass: 'canonical_exact_edit_preferences_and_reference_apply',
  runtimeClass: 'controlled_local_contract',
  evidenceClass: 'isolated_local_rls_proof_unreleased',
  sourceAuthority: 'canonical_v3_local_supabase_rls',
  canonicalAuthorityReadRpcVerified: true,
  canonicalAtomicApplyRpcVerified: true,
  twoUserTwoWorkspaceRlsVerified: true,
  authenticatedActorForwardedServerSide: true,
  noLegacyPreferenceOrApplicationFallback: true,
  browserMutationAuthorityAccepted: false,
  providerOrWorkerExecutionStarted: false,
  customerPriceCalculated: false,
  customerCreditsMutated: false,
  serviceFeeIncluded: false,
  sameReleaseReadinessEvidenceVerified: false,
  productionAuthority: false,

  async readAuthority({ scope }) {
    const key = stateKey(scope.workspaceId, scope.projectId, scope.editSessionId)
    const state = await getOrCreateStateForScope(scope)
    const readAt = new Date().toISOString()
    const selectedApplicationAuthority = scope.selectedApplicationId
      ? applicationPreparation.readApplicationAuthority({
          workspaceId: scope.workspaceId,
          projectId: scope.projectId,
          editSessionId: scope.editSessionId,
          applicationId: scope.selectedApplicationId,
        })
      : null
    if (scope.selectedApplicationId && !selectedApplicationAuthority) {
      throw new ApiError(
        'VERSION_CONFLICT',
        'The selected prepared application is no longer available.',
        409,
      )
    }
    return {
      schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
      sourceAuthority: 'canonical_exact_edit_preference_repository',
      runtimeSource: 'verified_live',
      authorityReadReceiptId: `atomic-ui-read-${sha256(`${key}\n${readAt}`).slice(0, 40)}`,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      recordRevision: state.recordRevision,
      preferenceRevision: state.preferenceRevision,
      planningInputRevision: state.planningInputRevision,
      preferenceFingerprintSha256: sha256(state.values),
      values: structuredClone(state.values),
      lifecyclePhase: 'planning',
      locked: false,
      currentApplicationState: state.currentApplicationId ? 'connected' : 'not_selected',
      currentApplicationId: state.currentApplicationId,
      outputFrameAuthority: state.confirmedAspectRatio
        ? createEditReferenceProductionOutputFrameAuthority({
            repositoryAuthority: 'supabase_rls_transactional',
            workspaceId: scope.workspaceId,
            projectId: scope.projectId,
            editSessionId: scope.editSessionId,
            exactEditPreferenceRecordRevision: state.recordRevision,
            planningInputRevision: state.planningInputRevision,
            confirmationId: `atomic-ui-frame-${sha256(key).slice(0, 40)}`,
            aspectRatio: state.confirmedAspectRatio,
            confirmedAt: '2026-07-21T00:00:00.000Z',
          })
        : null,
      selectedApplicationAuthority,
      readAt,
      browserMutationAuthorityGranted: false,
      productionReleaseReadinessEvaluatedSeparately: true,
    }
  },

  async apply({ request }) {
    const existing = committedByIdempotencyHash.get(request.idempotencyKeyHashSha256)
    if (existing) {
      if (existing.requestDigestSha256 !== request.requestDigestSha256) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'This Apply key is already bound to another exact-edit operation.',
          409,
        )
      }
      return structuredClone(existing.receipt)
    }

    const state = await getOrCreateStateForScope({
      ownerUserId: request.actorUserId,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editSessionId: request.editSessionId,
    })
    if (
      !state
      || state.recordRevision !== request.expectedPreferenceRecordRevision
      || state.preferenceRevision !== request.expectedPreferenceRevision
      || state.planningInputRevision !== request.expectedPlanningInputRevision
      || sha256(state.values) !== request.expectedPreferenceFingerprintSha256
    ) {
      throw new ApiError('VERSION_CONFLICT', 'The exact-edit preference authority changed.', 409)
    }

    const committedAt = new Date().toISOString()
    const nextState: ExactEditState = {
      values: { ...state.values, ...request.preferencePatch },
      recordRevision: state.recordRevision + 1,
      preferenceRevision: state.preferenceRevision
        + (request.changedPreferenceFields.length > 0 ? 1 : 0),
      planningInputRevision: state.planningInputRevision + 1,
      sourcePreparation: request.sourcePreparationDisposition
          === 'requires_repreparation'
        ? {
            status: 'requires_repreparation',
            sourceCandidateHashSha256: null,
            evidenceHashSha256: null,
            confirmedAt: null,
          }
        : state.sourcePreparation,
      confirmedAspectRatio: request.outputFrameDisposition === 'requires_reconfirmation'
        ? null
        : state.confirmedAspectRatio,
      currentApplicationId: request.referenceLifecycleRequest?.mutation === 'remove'
        ? null
        : request.referenceLifecycleRequest?.applicationId ?? state.currentApplicationId,
    }
    const receiptWithoutDigest = {
      schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
      sourceAuthority: 'canonical_exact_edit_apply_rpc' as const,
      canonicalReceiptValidatedServerSide: true as const,
      transactionId: `atomic-ui-transaction-${request.requestDigestSha256.slice(0, 40)}`,
      changedPreferenceFields: request.changedPreferenceFields,
      referenceMutation: request.referenceLifecycleRequest?.mutation ?? null,
      committedPreferenceRecordRevision: nextState.recordRevision,
      committedPreferenceRevision: nextState.preferenceRevision,
      committedPlanningInputRevision: nextState.planningInputRevision,
      sourcePreparationDisposition: request.sourcePreparationDisposition,
      outputFrameDisposition: request.outputFrameDisposition,
      freshPlanAndEstimateRequired: true as const,
      approvedSnapshotPreserved: true as const,
      historicalPrivatePreviewPreserved: true as const,
      committedAt,
      productionReleaseReadinessEvaluatedSeparately: true as const,
      customerPriceCalculated: false as const,
      customerCreditsMutated: false as const,
      serviceFeeIncluded: false as const,
      providerOrWorkerExecutionStarted: false as const,
    }
    const receipt: EditReferenceProductionExactEditApplyApiReceipt = {
      ...receiptWithoutDigest,
      transactionReceiptDigestSha256: sha256(receiptWithoutDigest),
    }
    await persistExactEditState({
      ownerUserId: request.actorUserId,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editSessionId: request.editSessionId,
    }, nextState)
    if (request.referenceLifecycleRequest) {
      applicationPreparation.markLifecycle({
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        editSessionId: request.editSessionId,
        applicationId: request.referenceLifecycleRequest.applicationId,
        mutation: request.referenceLifecycleRequest.mutation,
        previousApplicationId: request.referenceLifecycleRequest.expectedCurrentApplicationId,
      })
    }
    committedByIdempotencyHash.set(request.idempotencyKeyHashSha256, {
      requestDigestSha256: request.requestDigestSha256,
      receipt,
    })
    return structuredClone(receipt)
  },
})

const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT
    ?? resolve('test-results/current-edit-preferences-atomic-storage'),
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
  // This explicit non-production fixture derives opaque local worker leases.
  // It is never accepted as deployed service identity or provider authority.
  REEDITPRO_INTERNAL_SERVICE_TOKEN:
    LOCAL_PRIVATE_EXECUTION_INTERNAL_SERVICE_TOKEN,
})
const editReferenceDomainRepositoryRuntimePort =
  createOptionalCanonicalV3LocalDomainRepositoryRuntimePort()
const editReferenceLongFormStudyRuntimePortFactory =
  createOptionalCanonicalV3LocalLongFormRuntimePortFactory()
const editReferenceSignedInPrivateMediaRuntimePort =
  editReferenceDomainRepositoryRuntimePort
  && editReferenceLongFormStudyRuntimePortFactory
    ? createEditReferenceSignedInPrivateMediaRuntimePort({
        endpointOrigin: process.env.REEDITPRO_CANONICAL_V3_API_URL ?? '',
      })
    : undefined
const editReferenceExactEditBriefRuntimePortFactory =
  createOptionalCanonicalV3LocalExactEditBriefRuntimePortFactory()
const editReferenceTargetUnderstandingPackageRuntimePortFactory =
  createOptionalCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory()
const editReferenceExactEditApplyRuntimePort =
  createOptionalCanonicalV3LocalExactEditApplyRuntimePort() ?? runtimePort
const editReferenceApplicationPreparationRuntimePort =
  createOptionalCanonicalV3LocalApplicationPreparationRuntimePort({
    targetFactory: editReferenceTargetUnderstandingPackageRuntimePortFactory,
  }) ?? applicationPreparation.port
const motionStudioCommandRepositoryRuntimePort =
  createPrivateLocalMotionStudioCommandRepositoryRuntimePort(
    createPrivateLocalMotionStudioCommandRepository,
  )
const server = createReeditProApiApp(env, {
  editReferenceExactEditApplyRuntimePort,
  editReferenceApplicationPreparationRuntimePort,
  planningExactEditPreferenceAuthorityPort: planningPort,
  motionStudioCommandRepositoryRuntimePort,
  ...(editReferenceDomainRepositoryRuntimePort
    ? { editReferenceDomainRepositoryRuntimePort }
    : {}),
  ...(editReferenceLongFormStudyRuntimePortFactory
    ? { editReferenceLongFormStudyRuntimePortFactory }
    : {}),
  ...(editReferenceSignedInPrivateMediaRuntimePort
    ? { editReferenceSignedInPrivateMediaRuntimePort }
    : {}),
  ...(editReferenceExactEditBriefRuntimePortFactory
    ? { editReferenceExactEditBriefRuntimePortFactory }
    : {}),
  ...(editReferenceTargetUnderstandingPackageRuntimePortFactory
    ? { editReferenceTargetUnderstandingPackageRuntimePortFactory }
    : {}),
}).listen(env.apiPort, '127.0.0.1', () => {
  console.log(JSON.stringify({ event: 'atomic_preferences_test_api_listening', port: env.apiPort }))
})

let closing = false
function close(signal: NodeJS.Signals) {
  if (closing) return
  closing = true
  server.close((error) => {
    if (error) process.exitCode = 1
  })
  console.log(JSON.stringify({ event: 'atomic_preferences_test_api_closing', signal }))
}
process.once('SIGINT', () => close('SIGINT'))
process.once('SIGTERM', () => close('SIGTERM'))

function createOptionalCanonicalV3LocalDomainRepositoryRuntimePort():
  EditReferenceDomainRepositoryRuntimePort | undefined {
  const endpointOrigin = process.env.REEDITPRO_CANONICAL_V3_API_URL?.trim()
  const serviceRoleKey = process.env.REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY?.trim()
  if (!endpointOrigin && !serviceRoleKey) return undefined
  if (!endpointOrigin || !serviceRoleKey) {
    throw new Error('The canonical V3 browser proof requires both local RPC variables.')
  }
  const client = createEditReferenceLocalSupabaseDomainHttpRpcClient({
    endpointOrigin,
    serviceRoleKey,
  })
  const capability = createEditReferenceLocalSupabaseDomainCapability({
    client,
    endpointOrigin,
  })
  const repository = createEditReferenceLocalSupabaseDomainRepository({
    client,
    capability,
  })
  return createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort({ repository })
}

function createOptionalCanonicalV3LocalLongFormRuntimePortFactory():
  EditReferenceLongFormStudyRuntimePortFactory | undefined {
  const endpointOrigin = process.env.REEDITPRO_CANONICAL_V3_API_URL?.trim()
  const anonKey = process.env.REEDITPRO_CANONICAL_V3_ANON_KEY?.trim()
  const localInternalSigningSecret =
    process.env.REEDITPRO_CANONICAL_V3_LOCAL_PRE_PLAN_SIGNING_SECRET?.trim()
  if (!endpointOrigin && !anonKey && !localInternalSigningSecret) return undefined
  if (!endpointOrigin || !anonKey || !localInternalSigningSecret) {
    throw new Error(
      'The canonical V3 mounted study proof requires loopback URL, anon key, and local signing secret.',
    )
  }
  return createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret,
  })
}

function createOptionalCanonicalV3LocalExactEditBriefRuntimePortFactory():
  EditReferenceExactEditBriefRuntimePortFactory | undefined {
  const endpointOrigin = process.env.REEDITPRO_CANONICAL_V3_API_URL?.trim()
  const anonKey = process.env.REEDITPRO_CANONICAL_V3_ANON_KEY?.trim()
  const localInternalSigningSecret =
    process.env.REEDITPRO_CANONICAL_V3_LOCAL_PRE_PLAN_SIGNING_SECRET?.trim()
  if (!endpointOrigin && !anonKey && !localInternalSigningSecret) return undefined
  if (!endpointOrigin || !anonKey || !localInternalSigningSecret) {
    throw new Error(
      'The canonical V3 exact Edit Brief proof requires loopback URL, anon key, and local signing secret.',
    )
  }
  return createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret,
  })
}

function createOptionalCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory():
  EditReferenceTargetUnderstandingPackageRuntimePortFactory | undefined {
  const endpointOrigin = process.env.REEDITPRO_CANONICAL_V3_API_URL?.trim()
  const anonKey = process.env.REEDITPRO_CANONICAL_V3_ANON_KEY?.trim()
  const localInternalSigningSecret =
    process.env.REEDITPRO_CANONICAL_V3_LOCAL_PRE_PLAN_SIGNING_SECRET?.trim()
  if (!endpointOrigin && !anonKey && !localInternalSigningSecret) return undefined
  if (!endpointOrigin || !anonKey || !localInternalSigningSecret) {
    throw new Error(
      'The canonical V3 target-understanding package proof requires loopback URL, anon key, and local signing secret.',
    )
  }
  return createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret,
  })
}

function createOptionalCanonicalV3LocalExactEditApplyRuntimePort():
  EditReferenceExactEditApplyRuntimePort | undefined {
  const endpointOrigin = process.env.REEDITPRO_CANONICAL_V3_API_URL?.trim()
  const anonKey = process.env.REEDITPRO_CANONICAL_V3_ANON_KEY?.trim()
  if (!endpointOrigin && !anonKey) return undefined
  if (!endpointOrigin || !anonKey) {
    throw new Error(
      'The canonical V3 exact-edit Apply proof requires loopback URL and anon key.',
    )
  }
  return createEditReferenceCanonicalV3LocalExactEditApplyRuntimePort({
    endpointOrigin,
    anonKey,
  })
}

function createOptionalCanonicalV3LocalApplicationPreparationRuntimePort(input: {
  readonly targetFactory:
    EditReferenceTargetUnderstandingPackageRuntimePortFactory | undefined
}): ReturnType<typeof createEditReferenceLocalSupabaseApplicationPreparationPort> | undefined {
  const endpointOrigin = process.env.REEDITPRO_CANONICAL_V3_API_URL?.trim()
  const anonKey = process.env.REEDITPRO_CANONICAL_V3_ANON_KEY?.trim()
  const serviceRoleKey = process.env.REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY?.trim()
  const localInternalSigningSecret =
    process.env.REEDITPRO_CANONICAL_V3_LOCAL_PRE_PLAN_SIGNING_SECRET?.trim()
  if (!endpointOrigin && !anonKey && !serviceRoleKey && !localInternalSigningSecret) {
    return undefined
  }
  if (
    !endpointOrigin
    || !anonKey
    || !serviceRoleKey
    || !localInternalSigningSecret
    || !input.targetFactory
  ) {
    throw new Error(
      'The canonical V3 application-preparation proof requires the complete local authority bundle.',
    )
  }
  const client = createEditReferenceLocalSupabaseDomainHttpRpcClient({
    endpointOrigin,
    serviceRoleKey,
  })
  const capability = createEditReferenceLocalSupabaseDomainCapability({
    client,
    endpointOrigin,
  })
  const referenceRepository = createEditReferenceLocalSupabaseDomainRepository({
    client,
    capability,
  })
  return createEditReferenceLocalSupabaseApplicationPreparationPort({
    endpointOrigin,
    serviceRoleKey,
    env,
    referenceRepository,
    targetUnderstandingPackageRuntimePortFactory: input.targetFactory,
  })
}

function stateKey(workspaceId: string, projectId: string, editSessionId: string): string {
  return `${workspaceId}\n${projectId}\n${editSessionId}`
}

function createDefaultExactEditState(): ExactEditState {
  return {
    values: structuredClone(defaultValues),
    recordRevision: 0,
    preferenceRevision: 0,
    planningInputRevision: 0,
    sourcePreparation: {
      status: 'not_ready',
      sourceCandidateHashSha256: null,
      evidenceHashSha256: null,
      confirmedAt: null,
    },
    confirmedAspectRatio: null,
    currentApplicationId: null,
  }
}

async function getOrCreateStateForScope(scope: {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}): Promise<ExactEditState> {
  const key = stateKey(scope.workspaceId, scope.projectId, scope.editSessionId)
  let current = states.get(key)
  if (!current) {
    current = await readPersistedExactEditState(scope)
      ?? await restoreExactEditStateFromLatestPlanningHandoff(scope)
      ?? createDefaultExactEditState()
    states.set(key, current)
  }
  const durableFrame = await readDurableLocalConfirmedFrame(scope)
  if (durableFrame === undefined || durableFrame === current.confirmedAspectRatio) {
    return current
  }
  const synchronized: ExactEditState = {
    ...current,
    recordRevision: current.recordRevision + 1,
    confirmedAspectRatio: durableFrame,
  }
  await persistExactEditState(scope, synchronized)
  return synchronized
}

async function restoreExactEditStateFromLatestPlanningHandoff(scope: {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}): Promise<ExactEditState | undefined> {
  const handoff = await readLatestPrivateCanonicalPlanningHandoff({
    localStorageRoot: env.localStorageRoot,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })
  if (!handoff) return undefined
  const exact = handoff.resolvedPlanningInputAuthority.exactEditPreference
  const application =
    handoff.resolvedPlanningInputAuthority.preferenceApplication
  const restored: ExactEditState = {
    values: exactEditPreferenceValuesSchema.parse(exact.values),
    recordRevision: exact.recordRevision,
    preferenceRevision: exact.preferenceRevision,
    planningInputRevision: exact.planningInputRevision,
    sourcePreparation: {
      status: 'ready',
      sourceCandidateHashSha256: exact.sourceCandidateHash,
      evidenceHashSha256: exact.sourcePreparationEvidenceHash,
      confirmedAt: '2026-07-21T00:00:00.000Z',
    },
    confirmedAspectRatio: exact.confirmedAspectRatio,
    currentApplicationId:
      application.status === 'applied' ? application.applicationId : null,
  }
  await persistExactEditState(scope, restored)
  return restored
}

async function readPersistedExactEditState(scope: {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}): Promise<ExactEditState | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: env.localStorageRoot,
    relativePath: exactEditStateRelativePath(scope),
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalidPersistedExactEditState()
  }
  const envelope = asRecord(value)
  const identity = asRecord(envelope?.identity)
  const state = parsePersistedExactEditState(envelope?.state)
  const withoutChecksum = {
    recordVersion: envelope?.recordVersion,
    source: envelope?.source,
    identity,
    state,
  }
  if (
    envelope?.recordVersion !== LOCAL_EXACT_EDIT_STATE_RECORD_VERSION
    || envelope.source !== 'reeditpro_local_break_test_exact_edit_state'
    || identity?.ownerUserId !== scope.ownerUserId
    || identity.workspaceId !== scope.workspaceId
    || identity.projectId !== scope.projectId
    || identity.editSessionId !== scope.editSessionId
    || !state
    || envelope.checksumSha256 !== sha256(withoutChecksum)
  ) {
    throw invalidPersistedExactEditState()
  }
  states.set(
    stateKey(scope.workspaceId, scope.projectId, scope.editSessionId),
    state,
  )
  return state
}

async function persistExactEditState(
  scope: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  },
  state: ExactEditState,
): Promise<void> {
  const parsedState = parsePersistedExactEditState(state)
  if (!parsedState) throw invalidPersistedExactEditState()
  const withoutChecksum = {
    recordVersion: LOCAL_EXACT_EDIT_STATE_RECORD_VERSION,
    source: 'reeditpro_local_break_test_exact_edit_state' as const,
    identity: {
      ownerUserId: scope.ownerUserId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
    },
    state: parsedState,
  }
  await writePrivateFileAtomicWithinRoot({
    rootPath: env.localStorageRoot,
    relativePath: exactEditStateRelativePath(scope),
    content: Buffer.from(`${stableJson({
      ...withoutChecksum,
      checksumSha256: sha256(withoutChecksum),
    })}\n`, 'utf8'),
  })
  states.set(
    stateKey(scope.workspaceId, scope.projectId, scope.editSessionId),
    parsedState,
  )
}

function exactEditStateRelativePath(scope: {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}): string {
  return `private-internal/e2e-exact-edit-authority/v1/${sha256({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })}.json`
}

function parsePersistedExactEditState(value: unknown): ExactEditState | null {
  const record = asRecord(value)
  const values = exactEditPreferenceValuesSchema.safeParse(record?.values)
  const sourcePreparation = asRecord(record?.sourcePreparation)
  const sourceStatus = sourcePreparation?.status
  const confirmedAspectRatio = record?.confirmedAspectRatio
  const currentApplicationId = record?.currentApplicationId
  if (
    !record
    || !values.success
    || !isNonnegativeInteger(record.recordRevision)
    || !isNonnegativeInteger(record.preferenceRevision)
    || !isNonnegativeInteger(record.planningInputRevision)
    || !['not_ready', 'requires_repreparation', 'ready'].includes(
      String(sourceStatus),
    )
    || !validOptionalSha256(sourcePreparation?.sourceCandidateHashSha256)
    || !validOptionalSha256(sourcePreparation?.evidenceHashSha256)
    || !validOptionalTimestamp(sourcePreparation?.confirmedAt)
    || !(
      confirmedAspectRatio === null
      || isConfirmedAspectRatio(confirmedAspectRatio)
    )
    || !(
      currentApplicationId === null
      || (
        typeof currentApplicationId === 'string'
        && currentApplicationId.length > 0
        && currentApplicationId.length <= 200
      )
    )
    || (
      sourceStatus === 'ready'
      && (
        sourcePreparation?.evidenceHashSha256 === null
        || sourcePreparation?.confirmedAt === null
      )
    )
    || (
      sourceStatus !== 'ready'
      && (
        sourcePreparation?.sourceCandidateHashSha256 !== null
        || sourcePreparation?.evidenceHashSha256 !== null
        || sourcePreparation?.confirmedAt !== null
      )
    )
  ) return null
  return {
    values: values.data,
    recordRevision: Number(record.recordRevision),
    preferenceRevision: Number(record.preferenceRevision),
    planningInputRevision: Number(record.planningInputRevision),
    sourcePreparation: {
      status: sourceStatus as ExactEditState['sourcePreparation']['status'],
      sourceCandidateHashSha256:
        sourcePreparation?.sourceCandidateHashSha256 as string | null,
      evidenceHashSha256:
        sourcePreparation?.evidenceHashSha256 as string | null,
      confirmedAt: sourcePreparation?.confirmedAt as string | null,
    },
    confirmedAspectRatio:
      confirmedAspectRatio as ConfirmedAspectRatio | null,
    currentApplicationId: currentApplicationId as string | null,
  }
}

function invalidPersistedExactEditState(): ApiError {
  return new ApiError(
    'INTEGRITY_CHECK_FAILED',
    'The local exact-edit authority could not be verified after restart.',
    409,
  )
}

function isNonnegativeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function validOptionalSha256(value: unknown): boolean {
  return value === null
    || (typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value))
}

function validOptionalTimestamp(value: unknown): boolean {
  return value === null
    || (
      typeof value === 'string'
      && Number.isFinite(Date.parse(value))
    )
}

async function readDurableLocalConfirmedFrame(scope: {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}): Promise<ConfirmedAspectRatio | null | undefined> {
  const context: ServiceContext = {
    env,
    clients: { admin: null, public: null },
    requestId: `atomic-ui-frame-read-${sha256(stateKey(
      scope.workspaceId,
      scope.projectId,
      scope.editSessionId,
    )).slice(0, 40)}`,
    auth: {
      userId: scope.ownerUserId,
      isMockUser: true,
    },
  }
  try {
    const result = await createInternalEditStateService(context)
      .getInternalEditState(
        scope.workspaceId,
        scope.projectId,
        scope.editSessionId,
      )
    const handoff = asRecord(result.internalEditState.handoff)
    const setup = asRecord(handoff?.setup)
    if (!setup || setup.aspectRatioConfirmed !== true) return null
    return isConfirmedAspectRatio(setup.aspectRatio)
      ? setup.aspectRatio
      : null
  } catch (error) {
    if (
      error instanceof ApiError
      && ['PROJECT_NOT_FOUND', 'AUTH_REQUIRED', 'ACCESS_DENIED'].includes(error.code)
    ) return undefined
    throw error
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function isConfirmedAspectRatio(value: unknown): value is ConfirmedAspectRatio {
  return ['9:16', '16:9', '1:1', '4:5', '4:3'].includes(String(value))
}

function baselineSnapshotId(key: string): string {
  return `atomic-ui-baseline-${sha256(key).slice(0, 40)}`
}

function planningResolution(
  scope: Parameters<PlanningExactEditPreferenceAuthorityPort['readExactPreferenceState']>[0],
  state: ExactEditState,
): PlanningExactEditPreferenceAuthorityResolution {
  const key = stateKey(scope.workspaceId, scope.projectId, scope.editSessionId)
  const readAt = new Date().toISOString()
  const authority: CanonicalExactEditPlanningAuthorityRead = {
    schemaVersion: CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION,
    sourceAuthority: 'canonical_exact_edit_preference_repository',
    runtimeSource: 'verified_live',
    authorityReadReceiptId: `atomic-ui-planning-read-${sha256(`${key}\n${readAt}`).slice(0, 40)}`,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    recordRevision: state.recordRevision,
    preferenceRevision: state.preferenceRevision,
    planningInputRevision: state.planningInputRevision,
    preferenceFingerprintSha256: sha256(state.values),
    values: structuredClone(state.values),
    baseline: {
      preferenceSnapshotId: baselineSnapshotId(key),
      values: structuredClone(defaultValues),
      preferenceFingerprintSha256: sha256(defaultValues),
      capturedAt: '2026-07-21T00:00:00.000Z',
      persistenceSource: 'authenticated_private_internal_backend',
      provenance: 'saved_edit_preferences',
    },
    sourcePreparation: state.sourcePreparation.status === 'ready'
      ? {
          status: 'ready',
          sourceCandidateHashSha256:
            state.sourcePreparation.sourceCandidateHashSha256,
          evidenceHashSha256: state.sourcePreparation.evidenceHashSha256!,
          confirmedAt: state.sourcePreparation.confirmedAt!,
        }
      : {
          status: state.sourcePreparation.status,
          sourceCandidateHashSha256: null,
          evidenceHashSha256: null,
          confirmedAt: null,
        },
    frameConfirmation: state.confirmedAspectRatio
      ? {
          status: 'confirmed',
          confirmationId: `atomic-ui-frame-${sha256(key).slice(0, 40)}`,
          aspectRatio: state.confirmedAspectRatio,
          confirmedAt: '2026-07-21T00:00:00.000Z',
          authorityDigestSha256: sha256({
            key,
            aspectRatio: state.confirmedAspectRatio,
          }),
        }
      : {
          status: 'not_confirmed',
          confirmationId: null,
          aspectRatio: null,
          confirmedAt: null,
          authorityDigestSha256: null,
        },
    lifecyclePhase: 'planning',
    locked: false,
    currentApplicationState: state.currentApplicationId
      ? 'connected'
      : 'not_selected',
    currentApplicationId: state.currentApplicationId,
    readAt,
    browserMutationAuthorityGranted: false,
    productionReleaseReadinessEvaluatedSeparately: true,
  }
  const unsigned = {
    schemaVersion: PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION,
    sourceAuthority: 'canonical_exact_edit_preference_repository' as const,
    evidenceClass: 'canonical_contract_fixture_unreleased' as const,
    tenantIsolationVerified: true,
    rlsPolicyVersion: 'canonical-v3-local-rls-v1',
    noLegacyExactPreferenceStoreRead: true,
    noFallbackAfterAuthorityRead: true as const,
    browserMutationAuthorityAccepted: false as const,
    productionAuthority: false,
    authority,
  }
  return {
    ...unsigned,
    authorityReceiptHash: sha256(unsigned),
  }
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) throw new Error('non_canonical_value')
  return serialized
}
