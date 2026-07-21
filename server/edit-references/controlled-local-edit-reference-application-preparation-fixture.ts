import { createHash } from 'node:crypto'
import type { PreferenceApplicationRecord, PreferenceApplicationTargetContextSnapshot } from '../../src/types/edit-reference'
import type {
  EditReferenceProductionPreparedApplicationAuthority,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import type {
  EditReferenceApplicationPreparationReceipt,
} from '../../src/types/edit-reference-production-application-preparation-api'
import {
  EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import { ApiError } from '../errors/api-error'
import {
  createEditReferenceApplicationPreparationReceipt,
} from './edit-reference-production-application-preparation-boundary'
import { createEditReferenceTargetApplication } from './edit-reference-target-adaptation'
import { PrivateEditReferenceRepository } from './private-edit-reference-repository'
import { PrivateTargetVideoUnderstandingRepository } from './private-target-video-understanding-repository'
import {
  EDIT_REFERENCE_APPLICATION_PREPARATION_RUNTIME_PORT_VERSION,
  type EditReferenceApplicationPreparationRuntimePort,
} from '../services/edit-reference-application-preparation-runtime-port'
import { EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION } from './edit-reference-production-persistence-contract'

interface CommittedPreparation {
  readonly requestDigestSha256: string
  readonly receipt: Awaited<ReturnType<EditReferenceApplicationPreparationRuntimePort['prepare']>>
}

export interface ControlledLocalEditReferenceApplicationPreparationFixture {
  readonly port: EditReferenceApplicationPreparationRuntimePort
  readApplicationAuthority(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly applicationId: string
  }): EditReferenceProductionPreparedApplicationAuthority | null
  markLifecycle(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly applicationId: string
    readonly mutation: 'apply' | 'replace' | 'remove'
    readonly previousApplicationId: string | null
  }): void
}

/**
 * Process-local contract fixture for mounted browser proof only. It re-reads
 * the existing private study package, but deliberately cannot become a hosted
 * or production persistence implementation.
 */
export function createControlledLocalEditReferenceApplicationPreparationFixture(): ControlledLocalEditReferenceApplicationPreparationFixture {
  const referenceRepository = new PrivateEditReferenceRepository()
  const targetRepository = new PrivateTargetVideoUnderstandingRepository()
  const committed = new Map<string, CommittedPreparation>()
  const applications = new Map<string, PreferenceApplicationRecord>()
  const referenceRevisionsByApplicationId = new Map<string, number>()

  const port: EditReferenceApplicationPreparationRuntimePort = Object.freeze({
    schemaVersion: EDIT_REFERENCE_APPLICATION_PREPARATION_RUNTIME_PORT_VERSION,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    authorityClass: 'canonical_preference_application_preparation' as const,
    runtimeClass: 'controlled_local_contract' as const,
    evidenceClass: 'isolated_local_contract_unreleased' as const,
    sourceAuthority: 'controlled_local_reference_study_repository' as const,
    tenantIsolationVerified: false,
    canonicalReferenceDnaQaAndTargetStudyReadVerified: true,
    durableIdempotentPreparationVerified: false,
    canonicalPreparedApplicationWriteVerified: false,
    browserApplicationRecordAccepted: false as const,
    noLegacyApplicationMutationFallback: true as const,
    applicationLifecycleMutationMade: false as const,
    providerOrWorkerExecutionStarted: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    sameReleaseReadinessEvidenceVerified: false,
    productionAuthority: false,

    async prepare(
      input: Parameters<EditReferenceApplicationPreparationRuntimePort['prepare']>[0],
    ) {
      const prior = committed.get(input.idempotencyKeyHashSha256)
      if (prior) {
        if (prior.requestDigestSha256 !== input.preparationRequestDigestSha256) {
          throw conflict('controlled_application_preparation_idempotency_conflict')
        }
        return replayedPreparationReceipt(prior.receipt)
      }
      const scope = {
        localStorageRoot: input.actor.localStorageRoot,
        ownerUserId: input.actor.actorUserId,
        workspaceId: input.intent.workspaceId,
      }
      const aggregate = await referenceRepository.read(scope)
      if (!aggregate) throw conflict('controlled_application_preparation_reference_scope_missing')
      const reference = aggregate.references.find((candidate) => candidate.id === input.intent.editReferenceId)
      const study = aggregate.studies.find((candidate) => (
        candidate.id === input.intent.studySessionId
        && candidate.editReferenceId === input.intent.editReferenceId
      ))
      const dnaVersion = aggregate.dnaVersions.find((candidate) => (
        candidate.id === input.intent.dnaVersionId
        && candidate.studySessionId === input.intent.studySessionId
        && candidate.editReferenceId === input.intent.editReferenceId
      ))
      const qaResult = dnaVersion?.qaResultId
        ? aggregate.dnaQaResults.find((candidate) => candidate.id === dnaVersion.qaResultId)
        : undefined
      if (
        !reference
        || !study
        || !dnaVersion
        || !qaResult
        || reference.revision !== input.intent.expectedReferenceRevision
        || dnaVersion.contentDigest !== input.intent.expectedDNAContentDigestSha256
      ) throw conflict('controlled_application_preparation_reference_dna_or_qa_changed')

      const target = await targetRepository.readLatest({
        scope,
        binding: {
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          editReferenceId: reference.id,
          studySessionId: study.id,
          storageObjectRecordId:
            input.intent.targetUnderstandingSourceStorageObjectRecordId,
          editBriefDigestSha256:
            input.intent.targetUnderstandingEditBriefDigestSha256,
        },
      })
      if (
        !target
        || target.packageId !== input.intent.targetUnderstandingPackageId
        || target.packageDigestSha256
          !== input.intent.targetUnderstandingPackageDigestSha256
        || target.source.mediaAssetId
          !== input.intent.targetUnderstandingSourceMediaAssetId
        || target.status !== 'ready'
        || target.readyForPreferenceApplication !== true
      ) throw conflict('controlled_application_preparation_target_study_changed')

      const exactApplications = [...applications.values()].filter((candidate) => (
        candidate.workspaceId === input.intent.workspaceId
        && candidate.projectId === input.projectId
        && candidate.editSessionId === input.editSessionId
      ))
      for (const candidate of exactApplications) {
        if (candidate.status === 'prepared' && candidate.targetIntegrationStatus === 'not_connected') {
          candidate.status = 'replaced'
          candidate.targetIntegrationStatus = 'invalidated'
          candidate.updatedAt = target.updatedAt
        }
      }
      const application = createEditReferenceTargetApplication({
        reference,
        study,
        dnaVersion,
        qaResult,
        targetContext: targetContextFromPackage(target),
        targetUnderstanding: target,
        applicationSource: input.intent.applicationSource,
        existingApplications: exactApplications,
        now: target.updatedAt,
      })
      if (application.runtimeSource !== 'verified_live') {
        throw conflict('controlled_application_preparation_target_runtime_not_verified_live')
      }
      applications.set(application.id, application)
      referenceRevisionsByApplicationId.set(application.id, reference.revision)
      const authority = applicationAuthority(application, reference.revision, target.updatedAt)
      const receipt = createEditReferenceApplicationPreparationReceipt({
        runtimeSource: 'controlled_local',
        transactionId: `controlled-application-preparation-${input.preparationRequestDigestSha256.slice(0, 48)}`,
        preparationRequestDigestSha256: input.preparationRequestDigestSha256,
        applicationAuthority: authority,
        editReferenceName: reference.name,
        replayed: false,
        preparedAt: target.updatedAt,
        authenticatedScopeReboundServerSide: true,
        canonicalReferenceDnaQaAndTargetStudyReRead: true,
        applicationConnectedToEdit: false,
        planOrEstimateInvalidated: false,
        approvedSnapshotMutated: false,
        customerPriceCalculated: false,
        customerCreditsMutated: false,
        serviceFeeIncluded: false,
        providerOrWorkerExecutionStarted: false,
      })
      committed.set(input.idempotencyKeyHashSha256, {
        requestDigestSha256: input.preparationRequestDigestSha256,
        receipt,
      })
      return structuredClone(receipt)
    },
  })

  return Object.freeze({
    port,
    readApplicationAuthority(
      input: Parameters<ControlledLocalEditReferenceApplicationPreparationFixture['readApplicationAuthority']>[0],
    ) {
      const application = applications.get(input.applicationId)
      if (
        !application
        || application.workspaceId !== input.workspaceId
        || application.projectId !== input.projectId
        || application.editSessionId !== input.editSessionId
      ) return null
      const expectedReferenceRevision = referenceRevisionsByApplicationId.get(application.id)
      if (!expectedReferenceRevision) {
        throw conflict('controlled_application_reference_revision_missing')
      }
      return applicationAuthority(application, expectedReferenceRevision, application.updatedAt)
    },
    markLifecycle(
      input: Parameters<ControlledLocalEditReferenceApplicationPreparationFixture['markLifecycle']>[0],
    ) {
      const application = applications.get(input.applicationId)
      if (!application) throw conflict('controlled_application_lifecycle_application_missing')
      if (input.mutation === 'remove') {
        application.status = 'cleared'
        application.targetIntegrationStatus = 'invalidated'
        application.clearedAt = new Date().toISOString()
      } else {
        application.status = 'prepared'
        application.targetIntegrationStatus = 'connected'
        application.connectedAt = new Date().toISOString()
      }
      if (input.mutation === 'replace' && input.previousApplicationId) {
        const previous = applications.get(input.previousApplicationId)
        if (previous) {
          previous.status = 'replaced'
          previous.targetIntegrationStatus = 'invalidated'
          previous.replacedByApplicationId = application.id
        }
      }
    },
  })
}

function replayedPreparationReceipt(
  receipt: EditReferenceApplicationPreparationReceipt,
): EditReferenceApplicationPreparationReceipt {
  return createEditReferenceApplicationPreparationReceipt({
    runtimeSource: receipt.runtimeSource,
    transactionId: receipt.transactionId,
    preparationRequestDigestSha256: receipt.preparationRequestDigestSha256,
    applicationAuthority: receipt.applicationAuthority,
    editReferenceName: receipt.editReferenceName,
    replayed: true,
    preparedAt: receipt.preparedAt,
    authenticatedScopeReboundServerSide: true,
    canonicalReferenceDnaQaAndTargetStudyReRead: true,
    applicationConnectedToEdit: false,
    planOrEstimateInvalidated: false,
    approvedSnapshotMutated: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    providerOrWorkerExecutionStarted: false,
  })
}

function targetContextFromPackage(
  target: Awaited<ReturnType<PrivateTargetVideoUnderstandingRepository['readLatest']>> & {},
): PreferenceApplicationTargetContextSnapshot {
  if (!target) throw conflict('controlled_application_preparation_target_missing')
  const declared = target.declaredContext
  return {
    projectId: target.projectId,
    editSessionId: target.editSessionId,
    projectName: declared.projectName,
    editName: declared.editName,
    sourceMode: target.audioState.sourceMode,
    contentType: declared.contentType,
    sourceSummary: target.sourceSummary,
    currentUserInstruction: declared.currentUserInstruction,
    selectedEditLevel: declared.selectedEditLevel,
    aspectRatio: declared.aspectRatio,
    outputFrameConfirmed: true,
    platformTarget: declared.platformTarget,
    storyRole: declared.storyRole,
    budgetPreference: declared.budgetPreference,
    directives: structuredClone(declared.directives),
    approvedConstraints: [...declared.approvedConstraints],
  }
}

function applicationAuthority(
  application: PreferenceApplicationRecord,
  expectedReferenceRevision: number,
  readAt: string,
): EditReferenceProductionPreparedApplicationAuthority {
  if (!application.targetUnderstanding) throw conflict('controlled_application_target_binding_missing')
  return {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION,
    sourceAuthority: 'canonical_preference_application_repository',
    runtimeSource: 'verified_live',
    authorityReadReceiptId: `controlled-application-read-${sha256([
      application.id,
      application.contentDigest,
      readAt,
    ].join('\n')).slice(0, 48)}`,
    workspaceId: application.workspaceId,
    projectId: application.projectId,
    editSessionId: application.editSessionId,
    editReferenceId: application.editReferenceId,
    studySessionId: application.studySessionId,
    dnaVersionId: application.dnaVersionId,
    dnaQaResultId: application.dnaQaResultId,
    applicationId: application.id,
    applicationVersionNumber: application.version,
    applicationContentDigestSha256: application.contentDigest,
    applicationContextHashSha256: application.targetContextDigest,
    targetUnderstandingPackageDigestSha256:
      application.targetUnderstanding.packageDigestSha256,
    expectedReferenceRevision,
    status: 'prepared',
    connectionState: application.targetIntegrationStatus === 'connected'
      ? 'connected'
      : 'not_connected',
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'VERSION_CONFLICT',
    'The exact Edit Reference preparation authority changed. Refresh before retrying.',
    409,
    { reason, productionReady: false },
  )
}
