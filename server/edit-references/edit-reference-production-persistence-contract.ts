import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES,
  editReferenceStudyChatProductionPersistenceContract,
  validateEditReferenceStudyChatProductionPersistenceContract,
  type EditReferenceStudyChatProductionPersistenceContract,
} from './edit-reference-study-chat-production-persistence-contract'

export const EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION =
  'edit-reference-production-persistence-contract-v6' as const

export const EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC_NAME =
  'mutate_edit_reference_application_lifecycle_v3' as const

export const EDIT_REFERENCE_LONG_FORM_STUDY_TABLES = [
  'preference_long_form_study_plans',
  'preference_long_form_study_runs',
  'preference_long_form_study_work_items',
  'preference_long_form_study_attempts',
  'preference_long_form_study_checkpoints',
  'preference_long_form_study_work_outputs',
] as const

export const EDIT_REFERENCE_REQUIRED_PRODUCTION_TABLES = [
  'edit_references',
  'preference_study_sessions',
  'preference_study_messages',
  ...EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES,
  'preference_evidence',
  'preference_assets',
  ...EDIT_REFERENCE_LONG_FORM_STUDY_TABLES,
  'preference_skill_runs',
  'preference_dna_versions',
  'preference_dna_qa_results',
  'preference_applications',
  'preference_usage_events',
  'preference_audit_segments',
] as const

export const EDIT_REFERENCE_SUPPORTING_PRODUCTION_TABLES = [
  'preference_application_plan_invalidations',
  'edit_reference_idempotency_receipts',
] as const

export type EditReferenceRequiredProductionTable =
  typeof EDIT_REFERENCE_REQUIRED_PRODUCTION_TABLES[number]

export type EditReferenceSupportingProductionTable =
  typeof EDIT_REFERENCE_SUPPORTING_PRODUCTION_TABLES[number]

export type EditReferenceProductionTableName =
  | EditReferenceRequiredProductionTable
  | EditReferenceSupportingProductionTable

export interface EditReferenceCompositeForeignKeyContract {
  readonly columns: readonly string[]
  readonly referencesTable: string
  readonly referencesColumns: readonly string[]
  readonly onDelete: 'restrict' | 'cascade'
}

export interface EditReferenceProductionTableContract {
  readonly name: EditReferenceProductionTableName
  readonly purpose: string
  readonly requiredColumns: readonly string[]
  readonly compositeForeignKeys: readonly EditReferenceCompositeForeignKeyContract[]
  readonly rlsEnabled: true
  readonly rlsForced: true
  readonly authenticatedWorkspaceMemberRead: boolean
  readonly directAuthenticatedInsertAllowed: false
  readonly directAuthenticatedUpdateAllowed: false
  readonly directAuthenticatedDeleteAllowed: false
  readonly serviceTransactionWritesOnly: true
  readonly immutableAfterCommit: boolean
  readonly appendOnly: boolean
  readonly privateStorageIdentityRequired: boolean
  readonly retentionClass:
    | 'workspace_content'
    | 'immutable_approval_history'
    | 'private_media_metadata'
    | 'append_only_audit'
    | 'bounded_idempotency'
}

export interface EditReferenceApplicationLifecycleTransactionContract {
  readonly rpcName: typeof EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC_NAME
  readonly supportedMutations: readonly ['apply', 'replace', 'remove']
  readonly authorization: {
    readonly authenticatedUserRequired: true
    readonly workspaceEditorOrOwnerRequired: true
    readonly serviceRoleBrowserUseAllowed: false
    readonly workspaceProjectCompositeBindingRequired: true
    readonly projectEditSessionCompositeBindingRequired: true
    readonly applyOrReplaceApprovedPreferenceDnaRequired: true
    readonly applyOrReplaceTargetVideoUnderstandingRequired: true
    readonly applyOrReplaceOutputFrameConfirmedRequired: true
    readonly applyOrReplaceOutputFrameConfirmationDigestRequired: true
    readonly exactEditFrameAuthorityTransactionallyReReadRequired: true
    readonly callerSuppliedFrameAuthorityTrusted: false
    readonly currentPlanLineageReadRequired: true
  }
  readonly compareAndSwap: {
    readonly expectedReferenceRevisionRequired: true
    readonly applicationContentDigestRequired: true
    readonly applicationContextHashRequired: true
    readonly currentApplicationExpectationRequired: true
    readonly exactEditPlanningInputRevisionRequired: true
  }
  readonly idempotency: {
    readonly keyHashRequired: true
    readonly canonicalRequestHashRequired: true
    readonly inProgressConflictRequired: true
    readonly changedRequestConflictRequired: true
    readonly durableResponseDigestRequired: true
    readonly mutationAndReceiptShareTransaction: true
  }
  readonly planningInvalidation: {
    readonly firstApplyInvalidatesExistingDraftPlanAndEstimate: true
    readonly replacementInvalidatesExistingDraftPlanAndEstimate: true
    readonly removalInvalidatesExistingDraftPlanAndEstimate: true
    readonly approvedPlanSnapshotPreserved: true
    readonly activeExecutionAuthorizationRevoked: true
    readonly freshPlanAndEstimateRequiredAfterMutation: true
  }
  readonly atomicEffects: readonly string[]
  readonly preservedEvidence: readonly string[]
  readonly forbiddenEffects: readonly string[]
}

export interface EditReferenceExecutionAuthorityReadContract {
  readonly name: 'assert_preference_application_plan_current_v1'
  readonly requiredBeforeStages: readonly string[]
  readonly validates: readonly string[]
  readonly staleResult: {
    readonly planLifecycleStatus: 'stale'
    readonly executionAuthorizationRevoked: true
    readonly approvedSnapshotPreserved: true
    readonly historicalPrivatePreviewPreserved: true
  }
}

export interface EditReferenceLongFormStudyPersistenceContract {
  readonly authorityClass: 'pre_plan_edit_reference_long_form_study'
  readonly approvedEditPlanSnapshotRequired: false
  readonly approvedEditCreditReservationRequired: false
  readonly approvedEditAuthorityFabricated: false
  readonly paidStudyUsageApprovalRequiredBeforeExecution: true
  readonly operations: readonly [
    'enqueue',
    'claim',
    'heartbeat_and_checkpoint',
    'complete',
    'fail',
    'pause',
    'resume',
    'cancel',
    'recover_expired_lease',
  ]
  readonly identity: {
    readonly authenticatedUserRequired: true
    readonly workspaceMembershipRequired: true
    readonly exactReferenceStudySourceBindingRequired: true
    readonly immutablePlanDigestRequired: true
    readonly immutableSourceChecksumRequired: true
    readonly callerSelectedWorkerOrAttemptAllowed: false
  }
  readonly transaction: {
    readonly serializableClaimRequired: true
    readonly oneActiveLeasePerWorkItem: true
    readonly leaseCredentialDigestOnly: true
    readonly monotonicCheckpointRequired: true
    readonly checkpointAndHeartbeatShareTransaction: true
    readonly terminalOutcomeAndUsageShareTransaction: true
    readonly idempotentResponseAssociationRequired: true
    readonly lostResponseReplayRequired: true
    readonly expiredLeaseRecoveryRequired: true
    readonly completedOutputImmutable: true
  }
  readonly execution: {
    readonly browserClaimAllowed: false
    readonly browserSessionRequiredForCompletion: false
    readonly boundedWorkItemTimeoutRequired: true
    readonly fixedWholeStudyTimeoutAllowed: false
    readonly restartResumeRequired: true
    readonly independentReadyWorkMayContinue: true
    readonly requiredDependencyFailureBlocksAffectedWorkOnly: true
  }
  readonly cost: {
    readonly immutableRateCardSnapshotRequired: true
    readonly maximumAuthorizedInternalCostRequired: true
    readonly attemptLevelProviderAndInfrastructureUsageRequired: true
    readonly failedAttemptCostRetained: true
    readonly cancellationReleasesUnusedInternalBudget: true
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly persistence: {
    readonly plansImmutable: true
    readonly runsCompareAndSwapVersioned: true
    readonly workItemsServerDerived: true
    readonly attemptsAppendOnly: true
    readonly checkpointsAppendOnly: true
    readonly outputsImmutable: true
    readonly rawMediaBytesPersistedInDatabase: false
    readonly signedUrlsPersisted: false
    readonly providerCredentialsPersisted: false
  }
  readonly runtimeActivation: {
    readonly databaseTransactionAdapterVerified: false
    readonly multiReplicaLeaseRecoveryVerified: false
    readonly authenticatedWorkerDispatchVerified: false
    readonly livePrivateObjectReadVerified: false
    readonly productionEnabled: false
  }
}

export interface EditReferencePlanningAuthorityReadContract {
  readonly name: 'read_exact_edit_reference_application_state_v2'
  readonly serverOnly: true
  readonly authenticatedUserRequired: true
  readonly serviceRoleBrowserUseAllowed: false
  readonly oneTransactionalSnapshotRequired: true
  readonly maximumCurrentStateRows: 1
  readonly states: readonly ['not_selected', 'connected', 'cleared']
  readonly connectedStateRequires: readonly string[]
  readonly clearedStateRequires: readonly string[]
  readonly neverSelectedStateRequires: readonly string[]
  readonly rawReferenceMediaReturned: false
  readonly rawProviderPayloadReturned: false
}

export interface EditReferenceProductionPersistenceContract {
  readonly version: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  readonly status: 'review_only_blocked_by_parallel_foundations'
  readonly migrationExecutable: false
  readonly remoteMutationAllowed: false
  readonly productionReady: false
  readonly identity: {
    readonly userAnchor: 'auth.users.id'
    readonly profileAnchor: 'profiles.id'
    readonly workspaceMembershipKey: readonly ['workspace_id', 'user_id']
    readonly projectWorkspaceKey: readonly ['id', 'workspace_id']
    readonly editSessionProjectWorkspaceKey: readonly ['id', 'project_id', 'workspace_id']
    readonly callerSelectedWorkspaceAcceptedWithoutMembershipProof: false
  }
  readonly tables: readonly EditReferenceProductionTableContract[]
  readonly studyChatReasoning: EditReferenceStudyChatProductionPersistenceContract
  readonly longFormStudy: EditReferenceLongFormStudyPersistenceContract
  readonly applicationLifecycleTransaction: EditReferenceApplicationLifecycleTransactionContract
  readonly planningAuthorityRead: EditReferencePlanningAuthorityReadContract
  readonly executionAuthorityRead: EditReferenceExecutionAuthorityReadContract
  readonly recovery: {
    readonly pointInTimeRecoveryRequired: true
    readonly immutableSnapshotBackupRequired: true
    readonly auditSegmentRestoreVerificationRequired: true
    readonly idempotencyReceiptRestoreVerificationRequired: true
    readonly crossDeviceReadbackRequired: true
    readonly multiInstanceRaceProofRequired: true
  }
  readonly releaseGates: {
    readonly canonicalMigrationChainRequired: true
    readonly cleanResetRequired: true
    readonly twoUserTwoWorkspaceRlsProofRequired: true
    readonly rollbackProofRequired: true
    readonly stagingCatalogVerificationRequired: true
    readonly storageIamVerificationRequired: true
    readonly remoteSecurityAdvisorReviewRequired: true
    readonly sameSourceBrowserBackendAcceptanceRequired: true
  }
  readonly financialAndExecutionBoundaries: {
    readonly providerCallAllowed: false
    readonly workerDispatchAllowed: false
    readonly publicRenderAllowed: false
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
}

const childOfReference = (table: string, childColumn = 'edit_reference_id'):
EditReferenceCompositeForeignKeyContract => ({
  columns: [childColumn, 'workspace_id'],
  referencesTable: table,
  referencesColumns: ['id', 'workspace_id'],
  onDelete: 'restrict',
})

const childOfStudySession = (): EditReferenceCompositeForeignKeyContract => ({
  columns: ['study_session_id', 'edit_reference_id', 'workspace_id'],
  referencesTable: 'preference_study_sessions',
  referencesColumns: ['id', 'edit_reference_id', 'workspace_id'],
  onDelete: 'restrict',
})

const childOfStudyScopedRecord = (
  table: string,
  childColumn: string,
): EditReferenceCompositeForeignKeyContract => ({
  columns: [childColumn, 'study_session_id', 'edit_reference_id', 'workspace_id'],
  referencesTable: table,
  referencesColumns: ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
  onDelete: 'restrict',
})

const table = (
  input: Omit<EditReferenceProductionTableContract,
    | 'rlsEnabled'
    | 'rlsForced'
    | 'directAuthenticatedInsertAllowed'
    | 'directAuthenticatedUpdateAllowed'
    | 'directAuthenticatedDeleteAllowed'
    | 'serviceTransactionWritesOnly'>,
): EditReferenceProductionTableContract => ({
  ...input,
  rlsEnabled: true,
  rlsForced: true,
  directAuthenticatedInsertAllowed: false,
  directAuthenticatedUpdateAllowed: false,
  directAuthenticatedDeleteAllowed: false,
  serviceTransactionWritesOnly: true,
})

export const editReferenceProductionPersistenceContract: EditReferenceProductionPersistenceContract = {
  version: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
  status: 'review_only_blocked_by_parallel_foundations',
  migrationExecutable: false,
  remoteMutationAllowed: false,
  productionReady: false,
  identity: {
    userAnchor: 'auth.users.id',
    profileAnchor: 'profiles.id',
    workspaceMembershipKey: ['workspace_id', 'user_id'],
    projectWorkspaceKey: ['id', 'workspace_id'],
    editSessionProjectWorkspaceKey: ['id', 'project_id', 'workspace_id'],
    callerSelectedWorkspaceAcceptedWithoutMembershipProof: false,
  },
  tables: [
    table({
      name: 'edit_references',
      purpose: 'Workspace-owned reusable Edit Preference identity and lifecycle root.',
      requiredColumns: ['id', 'workspace_id', 'owner_user_id', 'revision', 'status', 'created_at', 'updated_at'],
      compositeForeignKeys: [{
        columns: ['workspace_id', 'owner_user_id'],
        referencesTable: 'workspace_members',
        referencesColumns: ['workspace_id', 'user_id'],
        onDelete: 'restrict',
      }],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_study_sessions',
      purpose: 'Versioned study state, progress authority, and exact reference revision.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'revision', 'status', 'created_at', 'updated_at'],
      compositeForeignKeys: [childOfReference('edit_references')],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_study_messages',
      purpose: 'Append-only user, assistant, and system study conversation records.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'study_session_id', 'sequence', 'role', 'content', 'created_at'],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
      ],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_study_reasoning_runs',
      purpose: 'Tenant-bound pre-plan Study Chat request, route, usage-approval, rate-card, budget, and aggregate lifecycle authority.',
      requiredColumns: [
        'id',
        'workspace_id',
        'actor_user_id',
        'edit_reference_id',
        'study_session_id',
        'study_revision',
        'user_message_id',
        'saved_direction_evidence_id',
        'client_message_digest',
        'structured_context_digest',
        'route_contract_version',
        'approved_usage_estimate_id',
        'internal_cost_budget_id',
        'rate_card_snapshot_id',
        'maximum_authorized_internal_cost_micros',
        'reservation_idempotency_key_digest',
        'canonical_request_hash',
        'durable_response_digest',
        'revision',
        'status',
        'created_at',
        'updated_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfStudySession(),
        childOfStudyScopedRecord('preference_study_messages', 'user_message_id'),
        childOfStudyScopedRecord('preference_evidence', 'saved_direction_evidence_id'),
        {
          columns: ['workspace_id', 'actor_user_id'],
          referencesTable: 'workspace_members',
          referencesColumns: ['workspace_id', 'user_id'],
          onDelete: 'restrict',
        },
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_study_reasoning_route_attempts',
      purpose: 'Versioned Kimi, Qwen, or DeepSeek route authorization and one-use lifecycle that becomes immutable with terminal outcome, usage, FX, and internal-cost evidence.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'reasoning_run_id',
        'attempt_ordinal',
        'revision',
        'status',
        'route_id',
        'route_authorization_digest',
        'request_digest',
        'entry_fallback_trigger',
        'terminal_outcome',
        'terminal_fallback_trigger',
        'usage_digest',
        'provider_cost_digest',
        'infrastructure_cost_digest',
        'fx_snapshot_digest',
        'internal_cost_micros',
        'failure_code',
        'started_at',
        'terminal_at',
        'created_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfStudySession(),
        childOfStudyScopedRecord('preference_study_reasoning_runs', 'reasoning_run_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'append_only_audit',
    }),
    table({
      name: 'preference_study_reasoning_provider_requests',
      purpose: 'Compare-and-swap one-use provider submission and provider-request reconciliation authority without raw payloads.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'reasoning_run_id',
        'route_attempt_id',
        'provider_boundary',
        'provider_model_id',
        'provider_model_revision',
        'provider_request_id_digest',
        'submission_idempotency_key_digest',
        'one_use_submission_authority_digest',
        'revision',
        'status',
        'provider_call_may_have_occurred',
        'created_at',
        'updated_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfStudySession(),
        childOfStudyScopedRecord('preference_study_reasoning_runs', 'reasoning_run_id'),
        childOfStudyScopedRecord('preference_study_reasoning_route_attempts', 'route_attempt_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_study_reasoning_provider_observations',
      purpose: 'Append-only provider truth observations and usage evidence that cannot authorize resubmission.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'reasoning_run_id',
        'route_attempt_id',
        'provider_request_id',
        'observation_id_digest',
        'observation_digest',
        'status',
        'provider_usage_digest',
        'result_digest',
        'observed_at',
        'created_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfStudySession(),
        childOfStudyScopedRecord('preference_study_reasoning_runs', 'reasoning_run_id'),
        childOfStudyScopedRecord('preference_study_reasoning_route_attempts', 'route_attempt_id'),
        childOfStudyScopedRecord('preference_study_reasoning_provider_requests', 'provider_request_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'append_only_audit',
    }),
    table({
      name: 'preference_study_reasoning_checkbacks',
      purpose: 'Durable provider checkback workflow, digest-only lease, deadline, and unknown-outcome recovery state.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'reasoning_run_id',
        'route_attempt_id',
        'provider_request_id',
        'workflow_id',
        'revision',
        'status',
        'lookup_attempt_count',
        'lease_owner_digest',
        'lease_token_digest',
        'lease_expires_at',
        'next_check_at',
        'deadline_at',
        'created_at',
        'updated_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfStudySession(),
        childOfStudyScopedRecord('preference_study_reasoning_runs', 'reasoning_run_id'),
        childOfStudyScopedRecord('preference_study_reasoning_route_attempts', 'route_attempt_id'),
        childOfStudyScopedRecord('preference_study_reasoning_provider_requests', 'provider_request_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_study_reasoning_run_receipts',
      purpose: 'Immutable terminal multi-attempt receipt binding route lifecycle, failed-attempt cost, final result, assistant message, and aggregate settlement.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'reasoning_run_id',
        'assistant_message_id',
        'request_digest',
        'route_attempt_set_digest',
        'cost_aggregate_digest',
        'failed_attempt_count',
        'normalized_internal_cost_micros',
        'maximum_unverified_exposure_micros',
        'terminal_state',
        'final_result_digest',
        'receipt_digest',
        'settled_at',
        'created_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfStudySession(),
        childOfStudyScopedRecord('preference_study_reasoning_runs', 'reasoning_run_id'),
        childOfStudyScopedRecord('preference_study_messages', 'assistant_message_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'preference_evidence',
      purpose: 'Versioned generalized evidence and correction lineage without raw provider payloads.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'study_session_id', 'revision', 'content_digest', 'created_at'],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
      ],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'preference_assets',
      purpose: 'Private source, proxy, analysis, and approved-preview storage identities.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'study_session_id', 'storage_object_id', 'storage_generation', 'storage_etag', 'checksum_sha256', 'created_at'],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: true,
      retentionClass: 'private_media_metadata',
    }),
    table({
      name: 'preference_long_form_study_plans',
      purpose: 'Immutable source-bound long-form study graph, cost ceiling, and user-approved study-usage authority.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'source_asset_id',
        'plan_version',
        'plan_digest',
        'source_checksum_sha256',
        'rate_card_snapshot_digest',
        'maximum_authorized_internal_cost_micros',
        'currency',
        'study_usage_approval_status',
        'created_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_assets', 'source_asset_id'),
      ],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'preference_long_form_study_runs',
      purpose: 'Compare-and-swap long-form study run state, pause/cancel intent, and recovery generation.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'study_plan_id',
        'revision',
        'status',
        'recovery_generation',
        'pause_requested_at',
        'cancel_requested_at',
        'created_at',
        'updated_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_long_form_study_plans', 'study_plan_id'),
      ],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_long_form_study_work_items',
      purpose: 'Server-derived dependency work with one durable lease, bounded retry policy, and internal-cost ceiling.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'study_plan_id',
        'study_run_id',
        'sequence',
        'work_type',
        'dependency_digest',
        'idempotency_key_hash',
        'status',
        'attempt_count',
        'lease_owner_digest',
        'lease_token_digest',
        'lease_expires_at',
        'checkpoint_sequence',
        'maximum_authorized_internal_cost_micros',
        'created_at',
        'updated_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_long_form_study_plans', 'study_plan_id'),
        childOfReference('preference_long_form_study_runs', 'study_run_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'workspace_content',
    }),
    table({
      name: 'preference_long_form_study_attempts',
      purpose: 'Append-only attempt outcome, failure, provider/infrastructure usage, and internal-cost evidence.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'study_plan_id',
        'study_run_id',
        'study_work_item_id',
        'attempt_number',
        'status',
        'usage_digest',
        'internal_cost_micros',
        'currency',
        'failure_class',
        'started_at',
        'finished_at',
        'created_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_long_form_study_plans', 'study_plan_id'),
        childOfReference('preference_long_form_study_runs', 'study_run_id'),
        childOfReference('preference_long_form_study_work_items', 'study_work_item_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'append_only_audit',
    }),
    table({
      name: 'preference_long_form_study_checkpoints',
      purpose: 'Append-only monotonic progress checkpoints that atomically renew a work-item lease.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'study_plan_id',
        'study_run_id',
        'study_work_item_id',
        'study_attempt_id',
        'sequence',
        'checkpoint_digest',
        'completed_unit_count',
        'heartbeat_at',
        'created_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_long_form_study_plans', 'study_plan_id'),
        childOfReference('preference_long_form_study_runs', 'study_run_id'),
        childOfReference('preference_long_form_study_work_items', 'study_work_item_id'),
        childOfReference('preference_long_form_study_attempts', 'study_attempt_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'append_only_audit',
    }),
    table({
      name: 'preference_long_form_study_work_outputs',
      purpose: 'Immutable private output identity and digest for one completed long-form study work item.',
      requiredColumns: [
        'id',
        'workspace_id',
        'edit_reference_id',
        'study_session_id',
        'study_plan_id',
        'study_run_id',
        'study_work_item_id',
        'study_attempt_id',
        'output_type',
        'output_digest',
        'storage_object_id',
        'storage_generation',
        'storage_etag',
        'checksum_sha256',
        'created_at',
      ],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_long_form_study_plans', 'study_plan_id'),
        childOfReference('preference_long_form_study_runs', 'study_run_id'),
        childOfReference('preference_long_form_study_work_items', 'study_work_item_id'),
        childOfReference('preference_long_form_study_attempts', 'study_attempt_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: true,
      retentionClass: 'private_media_metadata',
    }),
    table({
      name: 'preference_skill_runs',
      purpose: 'Attempt-level skill execution, provenance, result, and internal-cost lineage.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'study_session_id', 'skill_id', 'attempt', 'status', 'result_digest', 'created_at'],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'preference_dna_versions',
      purpose: 'Immutable Preference DNA versions, evidence binding, content digest, and approval snapshot.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'study_session_id', 'version', 'content_digest', 'status', 'created_at'],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
      ],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'preference_dna_qa_results',
      purpose: 'Immutable exact-version QA outcome and copy-safety decision.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'study_session_id', 'dna_version_id', 'dna_content_digest', 'status', 'result_digest', 'created_at'],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_dna_versions', 'dna_version_id'),
      ],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'preference_applications',
      purpose: 'Immutable target-adaptation content plus mutable lifecycle status for one exact project/edit.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'study_session_id', 'dna_version_id', 'project_id', 'edit_session_id', 'version', 'content_digest', 'context_hash', 'status', 'created_at', 'updated_at'],
      compositeForeignKeys: [
        childOfReference('edit_references'),
        childOfReference('preference_study_sessions', 'study_session_id'),
        childOfReference('preference_dna_versions', 'dna_version_id'),
        {
          columns: ['project_id', 'workspace_id'],
          referencesTable: 'projects',
          referencesColumns: ['id', 'workspace_id'],
          onDelete: 'restrict',
        },
        {
          columns: ['edit_session_id', 'project_id', 'workspace_id'],
          referencesTable: 'edit_sessions',
          referencesColumns: ['id', 'project_id', 'workspace_id'],
          onDelete: 'restrict',
        },
      ],
      authenticatedWorkspaceMemberRead: true,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'preference_usage_events',
      purpose: 'Append-only preference lifecycle and internal-usage evidence.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'event_type', 'event_digest', 'created_at'],
      compositeForeignKeys: [childOfReference('edit_references')],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'append_only_audit',
    }),
    table({
      name: 'preference_audit_segments',
      purpose: 'Checksummed append-only audit segments with monotonic sequence ranges.',
      requiredColumns: ['id', 'workspace_id', 'edit_reference_id', 'first_sequence', 'last_sequence', 'event_count', 'content_digest', 'previous_segment_digest', 'created_at'],
      compositeForeignKeys: [childOfReference('edit_references')],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'append_only_audit',
    }),
    table({
      name: 'preference_application_plan_invalidations',
      purpose: 'Append-only exact application-to-plan invalidation and execution-revocation receipts.',
      requiredColumns: ['id', 'workspace_id', 'project_id', 'edit_session_id', 'preference_application_id', 'edit_plan_version_id', 'application_content_digest', 'context_hash', 'reason', 'invalidated_at'],
      compositeForeignKeys: [
        childOfReference('preference_applications', 'preference_application_id'),
        {
          columns: ['project_id', 'workspace_id'],
          referencesTable: 'projects',
          referencesColumns: ['id', 'workspace_id'],
          onDelete: 'restrict',
        },
        {
          columns: ['edit_session_id', 'project_id', 'workspace_id'],
          referencesTable: 'edit_sessions',
          referencesColumns: ['id', 'project_id', 'workspace_id'],
          onDelete: 'restrict',
        },
      ],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: true,
      appendOnly: true,
      privateStorageIdentityRequired: false,
      retentionClass: 'immutable_approval_history',
    }),
    table({
      name: 'edit_reference_idempotency_receipts',
      purpose: 'Bounded hashed route-specific mutation reservation and durable response association.',
      requiredColumns: ['id', 'workspace_id', 'actor_user_id', 'operation', 'idempotency_key_hash', 'request_hash', 'status', 'response_digest', 'created_at', 'expires_at'],
      compositeForeignKeys: [{
        columns: ['workspace_id', 'actor_user_id'],
        referencesTable: 'workspace_members',
        referencesColumns: ['workspace_id', 'user_id'],
        onDelete: 'restrict',
      }],
      authenticatedWorkspaceMemberRead: false,
      immutableAfterCommit: false,
      appendOnly: false,
      privateStorageIdentityRequired: false,
      retentionClass: 'bounded_idempotency',
    }),
  ],
  studyChatReasoning: editReferenceStudyChatProductionPersistenceContract,
  longFormStudy: {
    authorityClass: 'pre_plan_edit_reference_long_form_study',
    approvedEditPlanSnapshotRequired: false,
    approvedEditCreditReservationRequired: false,
    approvedEditAuthorityFabricated: false,
    paidStudyUsageApprovalRequiredBeforeExecution: true,
    operations: [
      'enqueue',
      'claim',
      'heartbeat_and_checkpoint',
      'complete',
      'fail',
      'pause',
      'resume',
      'cancel',
      'recover_expired_lease',
    ],
    identity: {
      authenticatedUserRequired: true,
      workspaceMembershipRequired: true,
      exactReferenceStudySourceBindingRequired: true,
      immutablePlanDigestRequired: true,
      immutableSourceChecksumRequired: true,
      callerSelectedWorkerOrAttemptAllowed: false,
    },
    transaction: {
      serializableClaimRequired: true,
      oneActiveLeasePerWorkItem: true,
      leaseCredentialDigestOnly: true,
      monotonicCheckpointRequired: true,
      checkpointAndHeartbeatShareTransaction: true,
      terminalOutcomeAndUsageShareTransaction: true,
      idempotentResponseAssociationRequired: true,
      lostResponseReplayRequired: true,
      expiredLeaseRecoveryRequired: true,
      completedOutputImmutable: true,
    },
    execution: {
      browserClaimAllowed: false,
      browserSessionRequiredForCompletion: false,
      boundedWorkItemTimeoutRequired: true,
      fixedWholeStudyTimeoutAllowed: false,
      restartResumeRequired: true,
      independentReadyWorkMayContinue: true,
      requiredDependencyFailureBlocksAffectedWorkOnly: true,
    },
    cost: {
      immutableRateCardSnapshotRequired: true,
      maximumAuthorizedInternalCostRequired: true,
      attemptLevelProviderAndInfrastructureUsageRequired: true,
      failedAttemptCostRetained: true,
      cancellationReleasesUnusedInternalBudget: true,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    persistence: {
      plansImmutable: true,
      runsCompareAndSwapVersioned: true,
      workItemsServerDerived: true,
      attemptsAppendOnly: true,
      checkpointsAppendOnly: true,
      outputsImmutable: true,
      rawMediaBytesPersistedInDatabase: false,
      signedUrlsPersisted: false,
      providerCredentialsPersisted: false,
    },
    runtimeActivation: {
      databaseTransactionAdapterVerified: false,
      multiReplicaLeaseRecoveryVerified: false,
      authenticatedWorkerDispatchVerified: false,
      livePrivateObjectReadVerified: false,
      productionEnabled: false,
    },
  },
  applicationLifecycleTransaction: {
    rpcName: EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC_NAME,
    supportedMutations: ['apply', 'replace', 'remove'],
    authorization: {
      authenticatedUserRequired: true,
      workspaceEditorOrOwnerRequired: true,
      serviceRoleBrowserUseAllowed: false,
      workspaceProjectCompositeBindingRequired: true,
      projectEditSessionCompositeBindingRequired: true,
      applyOrReplaceApprovedPreferenceDnaRequired: true,
      applyOrReplaceTargetVideoUnderstandingRequired: true,
      applyOrReplaceOutputFrameConfirmedRequired: true,
      applyOrReplaceOutputFrameConfirmationDigestRequired: true,
      exactEditFrameAuthorityTransactionallyReReadRequired: true,
      callerSuppliedFrameAuthorityTrusted: false,
      currentPlanLineageReadRequired: true,
    },
    compareAndSwap: {
      expectedReferenceRevisionRequired: true,
      applicationContentDigestRequired: true,
      applicationContextHashRequired: true,
      currentApplicationExpectationRequired: true,
      exactEditPlanningInputRevisionRequired: true,
    },
    idempotency: {
      keyHashRequired: true,
      canonicalRequestHashRequired: true,
      inProgressConflictRequired: true,
      changedRequestConflictRequired: true,
      durableResponseDigestRequired: true,
      mutationAndReceiptShareTransaction: true,
    },
    planningInvalidation: {
      firstApplyInvalidatesExistingDraftPlanAndEstimate: true,
      replacementInvalidatesExistingDraftPlanAndEstimate: true,
      removalInvalidatesExistingDraftPlanAndEstimate: true,
      approvedPlanSnapshotPreserved: true,
      activeExecutionAuthorizationRevoked: true,
      freshPlanAndEstimateRequiredAfterMutation: true,
    },
    atomicEffects: [
      'lock_exact_workspace_project_edit_application_and_current_plan',
      'validate_current_application_and_compare_and_swap_revision',
      'apply_replace_or_clear_preference_application_lifecycle',
      'invalidate_exact_project_edit_session_preference_context',
      'invalidate_exact_edit_brief_preference_context',
      'mark_affected_edit_plan_version_stale',
      'revoke_affected_execution_authorization',
      'append_application_plan_invalidation_receipt',
      'append_usage_and_audit_evidence',
      'commit_idempotency_response_digest',
    ],
    preservedEvidence: [
      'approved_preference_dna_version',
      'preference_application_history',
      'approved_plan_snapshot',
      'historical_private_preview',
      'prior_usage_and_audit_events',
    ],
    forbiddenEffects: [
      'rewrite_approved_plan_snapshot',
      'delete_historical_preference_application',
      'start_provider_or_worker_execution',
      'calculate_customer_price',
      'mutate_customer_credits',
      'include_reeditpro_service_fee',
    ],
  },
  planningAuthorityRead: {
    name: 'read_exact_edit_reference_application_state_v2',
    serverOnly: true,
    authenticatedUserRequired: true,
    serviceRoleBrowserUseAllowed: false,
    oneTransactionalSnapshotRequired: true,
    maximumCurrentStateRows: 1,
    states: ['not_selected', 'connected', 'cleared'],
    connectedStateRequires: [
      'one_current_connected_application',
      'approved_dna_and_qa_lineage',
      'target_understanding_package_digest',
      'output_frame_confirmation_digest',
      'latest_application_lifecycle_request_and_receipt',
    ],
    clearedStateRequires: [
      'latest_remove_lifecycle_request_and_receipt',
      'committed_reference_revision',
      'committed_planning_input_revision',
      'execution_authorization_revoked',
    ],
    neverSelectedStateRequires: [
      'no_application_lifecycle_for_exact_edit',
      'transactional_zero_row_cardinality',
    ],
    rawReferenceMediaReturned: false,
    rawProviderPayloadReturned: false,
  },
  executionAuthorityRead: {
    name: 'assert_preference_application_plan_current_v1',
    requiredBeforeStages: [
      'approval_replay',
      'plan_activation',
      'worker_claim',
      'caption_execution',
      'visual_execution',
      'render_start',
      'artifact_persistence',
      'private_review_ready',
      'public_delivery',
    ],
    validates: [
      'workspace_project_edit_composite_identity',
      'preference_application_id_content_digest_and_context_hash',
      'approved_plan_snapshot_application_lineage',
      'absence_of_application_plan_invalidation_receipt',
      'current_application_connected_status',
      'execution_authorization_not_revoked',
    ],
    staleResult: {
      planLifecycleStatus: 'stale',
      executionAuthorizationRevoked: true,
      approvedSnapshotPreserved: true,
      historicalPrivatePreviewPreserved: true,
    },
  },
  recovery: {
    pointInTimeRecoveryRequired: true,
    immutableSnapshotBackupRequired: true,
    auditSegmentRestoreVerificationRequired: true,
    idempotencyReceiptRestoreVerificationRequired: true,
    crossDeviceReadbackRequired: true,
    multiInstanceRaceProofRequired: true,
  },
  releaseGates: {
    canonicalMigrationChainRequired: true,
    cleanResetRequired: true,
    twoUserTwoWorkspaceRlsProofRequired: true,
    rollbackProofRequired: true,
    stagingCatalogVerificationRequired: true,
    storageIamVerificationRequired: true,
    remoteSecurityAdvisorReviewRequired: true,
    sameSourceBrowserBackendAcceptanceRequired: true,
  },
  financialAndExecutionBoundaries: {
    providerCallAllowed: false,
    workerDispatchAllowed: false,
    publicRenderAllowed: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  },
}

export interface EditReferenceProductionPersistenceContractSummary {
  version: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  tableCount: number
  requiredFeatureTableCount: number
  supportingTableCount: number
  forcedRlsTableCount: number
  directAuthenticatedMutationTableCount: number
  privateStorageTableCount: number
  immutableOrAppendOnlyTableCount: number
  studyChatReasoningTableCount: number
  studyChatReasoningOperationCount: number
  studyChatReasoningRuntimeEnabled: false
  longFormStudyTableCount: number
  longFormStudyOperationCount: number
  longFormStudyRuntimeEnabled: false
  atomicLifecycleEffectCount: number
  planningAuthorityStateCount: number
  requiredExecutionReadStageCount: number
  migrationExecutable: false
  remoteMutationAllowed: false
  productionReady: false
}

export function validateEditReferenceProductionPersistenceContract(
  contract: EditReferenceProductionPersistenceContract = editReferenceProductionPersistenceContract,
): EditReferenceProductionPersistenceContractSummary {
  if (contract.version !== EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION) {
    invalid('production_persistence_contract_version_invalid')
  }
  const names = contract.tables.map((candidate) => candidate.name)
  if (new Set(names).size !== names.length) invalid('duplicate_table_name')
  for (const required of [
    ...EDIT_REFERENCE_REQUIRED_PRODUCTION_TABLES,
    ...EDIT_REFERENCE_SUPPORTING_PRODUCTION_TABLES,
  ]) {
    if (!names.includes(required)) invalid(`missing_table:${required}`)
  }
  for (const candidate of contract.tables) {
    if (!candidate.requiredColumns.includes('workspace_id')) invalid(`missing_workspace_id:${candidate.name}`)
    if (!candidate.rlsEnabled || !candidate.rlsForced) invalid(`rls_not_forced:${candidate.name}`)
    if (
      candidate.directAuthenticatedInsertAllowed
      || candidate.directAuthenticatedUpdateAllowed
      || candidate.directAuthenticatedDeleteAllowed
      || !candidate.serviceTransactionWritesOnly
    ) invalid(`direct_authenticated_mutation_allowed:${candidate.name}`)
    if (candidate.name !== 'edit_references' && candidate.compositeForeignKeys.length === 0) {
      invalid(`missing_composite_parent_binding:${candidate.name}`)
    }
    for (const key of candidate.compositeForeignKeys) {
      if (key.columns.length !== key.referencesColumns.length || !key.columns.includes('workspace_id')) {
        invalid(`unsafe_composite_foreign_key:${candidate.name}`)
      }
    }
  }
  const studyChatReasoningTableRequiredColumns: Readonly<Record<
    typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES[number],
    readonly string[]
  >> = {
    preference_study_reasoning_runs: [
      'actor_user_id',
      'study_session_id',
      'study_revision',
      'user_message_id',
      'saved_direction_evidence_id',
      'client_message_digest',
      'structured_context_digest',
      'route_contract_version',
      'approved_usage_estimate_id',
      'internal_cost_budget_id',
      'rate_card_snapshot_id',
      'maximum_authorized_internal_cost_micros',
      'reservation_idempotency_key_digest',
      'canonical_request_hash',
      'durable_response_digest',
      'revision',
      'status',
    ],
    preference_study_reasoning_route_attempts: [
      'reasoning_run_id',
      'attempt_ordinal',
      'revision',
      'status',
      'route_id',
      'route_authorization_digest',
      'request_digest',
      'terminal_outcome',
      'provider_cost_digest',
      'infrastructure_cost_digest',
      'fx_snapshot_digest',
      'internal_cost_micros',
    ],
    preference_study_reasoning_provider_requests: [
      'reasoning_run_id',
      'route_attempt_id',
      'provider_boundary',
      'provider_model_id',
      'provider_request_id_digest',
      'submission_idempotency_key_digest',
      'one_use_submission_authority_digest',
      'revision',
      'status',
    ],
    preference_study_reasoning_provider_observations: [
      'reasoning_run_id',
      'route_attempt_id',
      'provider_request_id',
      'observation_id_digest',
      'observation_digest',
      'provider_usage_digest',
      'result_digest',
      'observed_at',
    ],
    preference_study_reasoning_checkbacks: [
      'reasoning_run_id',
      'route_attempt_id',
      'provider_request_id',
      'workflow_id',
      'revision',
      'lookup_attempt_count',
      'lease_token_digest',
      'lease_expires_at',
      'next_check_at',
      'deadline_at',
    ],
    preference_study_reasoning_run_receipts: [
      'reasoning_run_id',
      'assistant_message_id',
      'request_digest',
      'route_attempt_set_digest',
      'cost_aggregate_digest',
      'failed_attempt_count',
      'normalized_internal_cost_micros',
      'maximum_unverified_exposure_micros',
      'terminal_state',
      'final_result_digest',
      'receipt_digest',
      'settled_at',
    ],
  }
  for (const tableName of EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES) {
    const candidate = contract.tables.find((entry) => entry.name === tableName)
    if (!candidate) invalid(`missing_study_chat_reasoning_table:${tableName}`)
    for (const requiredColumn of studyChatReasoningTableRequiredColumns[tableName]) {
      if (!candidate.requiredColumns.includes(requiredColumn)) {
        invalid(`study_chat_reasoning_table_missing_column:${tableName}:${requiredColumn}`)
      }
    }
  }
  const reasoningRun = contract.tables.find((candidate) => (
    candidate.name === 'preference_study_reasoning_runs'
  ))
  const reasoningAttempt = contract.tables.find((candidate) => (
    candidate.name === 'preference_study_reasoning_route_attempts'
  ))
  const reasoningProviderRequest = contract.tables.find((candidate) => (
    candidate.name === 'preference_study_reasoning_provider_requests'
  ))
  const reasoningObservation = contract.tables.find((candidate) => (
    candidate.name === 'preference_study_reasoning_provider_observations'
  ))
  const reasoningCheckback = contract.tables.find((candidate) => (
    candidate.name === 'preference_study_reasoning_checkbacks'
  ))
  const reasoningReceipt = contract.tables.find((candidate) => (
    candidate.name === 'preference_study_reasoning_run_receipts'
  ))
  const hasCompositeForeignKey = (
    tableContract: EditReferenceProductionTableContract | undefined,
    columns: readonly string[],
    referencesTable: string,
    referencesColumns: readonly string[],
  ): boolean => Boolean(tableContract?.compositeForeignKeys.some((key) => (
    key.referencesTable === referencesTable
    && key.columns.join('|') === columns.join('|')
    && key.referencesColumns.join('|') === referencesColumns.join('|')
  )))
  if (
    !hasCompositeForeignKey(
      reasoningRun,
      ['workspace_id', 'actor_user_id'],
      'workspace_members',
      ['workspace_id', 'user_id'],
    )
    || !hasCompositeForeignKey(
      reasoningRun,
      ['user_message_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_study_messages',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
    || !hasCompositeForeignKey(
      reasoningRun,
      ['saved_direction_evidence_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_evidence',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
    || !hasCompositeForeignKey(
      reasoningAttempt,
      ['reasoning_run_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_study_reasoning_runs',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
    || !hasCompositeForeignKey(
      reasoningProviderRequest,
      ['route_attempt_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_study_reasoning_route_attempts',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
    || !hasCompositeForeignKey(
      reasoningObservation,
      ['provider_request_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_study_reasoning_provider_requests',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
    || !hasCompositeForeignKey(
      reasoningCheckback,
      ['provider_request_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_study_reasoning_provider_requests',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
    || !hasCompositeForeignKey(
      reasoningReceipt,
      ['assistant_message_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_study_messages',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
    || !hasCompositeForeignKey(
      reasoningReceipt,
      ['reasoning_run_id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
      'preference_study_reasoning_runs',
      ['id', 'study_session_id', 'edit_reference_id', 'workspace_id'],
    )
  ) invalid('study_chat_reasoning_composite_authority_binding_invalid')
  if (
    reasoningRun?.immutableAfterCommit
    || reasoningRun?.appendOnly
    || reasoningAttempt?.immutableAfterCommit
    || reasoningAttempt?.appendOnly
    || reasoningProviderRequest?.immutableAfterCommit
    || reasoningProviderRequest?.appendOnly
    || !reasoningObservation?.immutableAfterCommit
    || !reasoningObservation.appendOnly
    || reasoningCheckback?.immutableAfterCommit
    || reasoningCheckback?.appendOnly
    || !reasoningReceipt?.immutableAfterCommit
    || !reasoningReceipt.appendOnly
  ) invalid('study_chat_reasoning_table_mutability_invalid')
  try {
    validateEditReferenceStudyChatProductionPersistenceContract(contract.studyChatReasoning)
  } catch {
    invalid('study_chat_reasoning_persistence_contract_invalid')
  }
  const longFormTableRequiredColumns: Readonly<Record<
    typeof EDIT_REFERENCE_LONG_FORM_STUDY_TABLES[number],
    readonly string[]
  >> = {
    preference_long_form_study_plans: [
      'study_session_id',
      'source_asset_id',
      'plan_digest',
      'source_checksum_sha256',
      'rate_card_snapshot_digest',
      'maximum_authorized_internal_cost_micros',
      'study_usage_approval_status',
    ],
    preference_long_form_study_runs: [
      'study_plan_id',
      'revision',
      'status',
      'recovery_generation',
    ],
    preference_long_form_study_work_items: [
      'study_plan_id',
      'study_run_id',
      'dependency_digest',
      'idempotency_key_hash',
      'lease_token_digest',
      'lease_expires_at',
      'checkpoint_sequence',
      'maximum_authorized_internal_cost_micros',
    ],
    preference_long_form_study_attempts: [
      'study_plan_id',
      'study_run_id',
      'study_work_item_id',
      'attempt_number',
      'usage_digest',
      'internal_cost_micros',
      'failure_class',
    ],
    preference_long_form_study_checkpoints: [
      'study_run_id',
      'study_work_item_id',
      'study_attempt_id',
      'sequence',
      'checkpoint_digest',
      'heartbeat_at',
    ],
    preference_long_form_study_work_outputs: [
      'study_run_id',
      'study_work_item_id',
      'study_attempt_id',
      'output_digest',
      'storage_object_id',
      'storage_generation',
      'storage_etag',
      'checksum_sha256',
    ],
  }
  for (const tableName of EDIT_REFERENCE_LONG_FORM_STUDY_TABLES) {
    const candidate = contract.tables.find((entry) => entry.name === tableName)
    if (!candidate) invalid(`missing_long_form_study_table:${tableName}`)
    for (const requiredColumn of longFormTableRequiredColumns[tableName]) {
      if (!candidate.requiredColumns.includes(requiredColumn)) {
        invalid(`long_form_study_table_missing_column:${tableName}:${requiredColumn}`)
      }
    }
  }
  const longFormPlan = contract.tables.find((candidate) => (
    candidate.name === 'preference_long_form_study_plans'
  ))
  const longFormRun = contract.tables.find((candidate) => (
    candidate.name === 'preference_long_form_study_runs'
  ))
  const longFormWorkItem = contract.tables.find((candidate) => (
    candidate.name === 'preference_long_form_study_work_items'
  ))
  const longFormAttempt = contract.tables.find((candidate) => (
    candidate.name === 'preference_long_form_study_attempts'
  ))
  const longFormCheckpoint = contract.tables.find((candidate) => (
    candidate.name === 'preference_long_form_study_checkpoints'
  ))
  const longFormOutput = contract.tables.find((candidate) => (
    candidate.name === 'preference_long_form_study_work_outputs'
  ))
  if (
    !longFormPlan?.immutableAfterCommit
    || !longFormPlan.appendOnly
    || longFormRun?.immutableAfterCommit
    || longFormRun?.appendOnly
    || longFormWorkItem?.immutableAfterCommit
    || longFormWorkItem?.appendOnly
    || !longFormAttempt?.immutableAfterCommit
    || !longFormAttempt.appendOnly
    || !longFormCheckpoint?.immutableAfterCommit
    || !longFormCheckpoint.appendOnly
    || !longFormOutput?.immutableAfterCommit
    || !longFormOutput.appendOnly
    || !longFormOutput.privateStorageIdentityRequired
  ) invalid('long_form_study_table_mutability_invalid')
  if (JSON.stringify(contract.longFormStudy.operations) !== JSON.stringify([
    'enqueue',
    'claim',
    'heartbeat_and_checkpoint',
    'complete',
    'fail',
    'pause',
    'resume',
    'cancel',
    'recover_expired_lease',
  ])) invalid('long_form_study_operation_set_incomplete')
  if (
    contract.longFormStudy.authorityClass !== 'pre_plan_edit_reference_long_form_study'
    || contract.longFormStudy.approvedEditPlanSnapshotRequired !== false
    || contract.longFormStudy.approvedEditCreditReservationRequired !== false
    || contract.longFormStudy.approvedEditAuthorityFabricated !== false
    || !contract.longFormStudy.paidStudyUsageApprovalRequiredBeforeExecution
    || !contract.longFormStudy.identity.authenticatedUserRequired
    || !contract.longFormStudy.identity.workspaceMembershipRequired
    || !contract.longFormStudy.identity.exactReferenceStudySourceBindingRequired
    || !contract.longFormStudy.identity.immutablePlanDigestRequired
    || !contract.longFormStudy.identity.immutableSourceChecksumRequired
    || contract.longFormStudy.identity.callerSelectedWorkerOrAttemptAllowed !== false
  ) invalid('long_form_study_authority_or_identity_invalid')
  if (
    !contract.longFormStudy.transaction.serializableClaimRequired
    || !contract.longFormStudy.transaction.oneActiveLeasePerWorkItem
    || !contract.longFormStudy.transaction.leaseCredentialDigestOnly
    || !contract.longFormStudy.transaction.monotonicCheckpointRequired
    || !contract.longFormStudy.transaction.checkpointAndHeartbeatShareTransaction
    || !contract.longFormStudy.transaction.terminalOutcomeAndUsageShareTransaction
    || !contract.longFormStudy.transaction.idempotentResponseAssociationRequired
    || !contract.longFormStudy.transaction.lostResponseReplayRequired
    || !contract.longFormStudy.transaction.expiredLeaseRecoveryRequired
    || !contract.longFormStudy.transaction.completedOutputImmutable
  ) invalid('long_form_study_transaction_incomplete')
  if (
    contract.longFormStudy.execution.browserClaimAllowed
    || contract.longFormStudy.execution.browserSessionRequiredForCompletion
    || !contract.longFormStudy.execution.boundedWorkItemTimeoutRequired
    || contract.longFormStudy.execution.fixedWholeStudyTimeoutAllowed
    || !contract.longFormStudy.execution.restartResumeRequired
    || !contract.longFormStudy.execution.independentReadyWorkMayContinue
    || !contract.longFormStudy.execution.requiredDependencyFailureBlocksAffectedWorkOnly
  ) invalid('long_form_study_execution_recovery_incomplete')
  if (
    !contract.longFormStudy.cost.immutableRateCardSnapshotRequired
    || !contract.longFormStudy.cost.maximumAuthorizedInternalCostRequired
    || !contract.longFormStudy.cost.attemptLevelProviderAndInfrastructureUsageRequired
    || !contract.longFormStudy.cost.failedAttemptCostRetained
    || !contract.longFormStudy.cost.cancellationReleasesUnusedInternalBudget
    || contract.longFormStudy.cost.customerPriceCalculated
    || contract.longFormStudy.cost.customerCreditsMutated
    || contract.longFormStudy.cost.serviceFeeIncluded
  ) invalid('long_form_study_cost_boundary_invalid')
  if (
    !contract.longFormStudy.persistence.plansImmutable
    || !contract.longFormStudy.persistence.runsCompareAndSwapVersioned
    || !contract.longFormStudy.persistence.workItemsServerDerived
    || !contract.longFormStudy.persistence.attemptsAppendOnly
    || !contract.longFormStudy.persistence.checkpointsAppendOnly
    || !contract.longFormStudy.persistence.outputsImmutable
    || contract.longFormStudy.persistence.rawMediaBytesPersistedInDatabase
    || contract.longFormStudy.persistence.signedUrlsPersisted
    || contract.longFormStudy.persistence.providerCredentialsPersisted
  ) invalid('long_form_study_persistence_boundary_invalid')
  if (
    contract.longFormStudy.runtimeActivation.databaseTransactionAdapterVerified
    || contract.longFormStudy.runtimeActivation.multiReplicaLeaseRecoveryVerified
    || contract.longFormStudy.runtimeActivation.authenticatedWorkerDispatchVerified
    || contract.longFormStudy.runtimeActivation.livePrivateObjectReadVerified
    || contract.longFormStudy.runtimeActivation.productionEnabled
  ) invalid('long_form_study_unverified_runtime_activated')
  const application = contract.tables.find((candidate) => candidate.name === 'preference_applications')
  if (!application) invalid('missing_preference_applications')
  for (const requiredColumn of ['project_id', 'edit_session_id', 'content_digest', 'context_hash']) {
    if (!application.requiredColumns.includes(requiredColumn)) invalid(`application_missing_column:${requiredColumn}`)
  }
  const requiredEffects = [
    'apply_replace_or_clear_preference_application_lifecycle',
    'invalidate_exact_project_edit_session_preference_context',
    'mark_affected_edit_plan_version_stale',
    'revoke_affected_execution_authorization',
    'append_application_plan_invalidation_receipt',
    'commit_idempotency_response_digest',
  ]
  for (const effect of requiredEffects) {
    if (!contract.applicationLifecycleTransaction.atomicEffects.includes(effect)) {
      invalid(`missing_atomic_effect:${effect}`)
    }
  }
  if (JSON.stringify(contract.applicationLifecycleTransaction.supportedMutations) !== JSON.stringify([
    'apply',
    'replace',
    'remove',
  ])) invalid('application_lifecycle_mutation_set_incomplete')
  if (
    contract.applicationLifecycleTransaction.rpcName !== EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC_NAME
    || !contract.applicationLifecycleTransaction.authorization.applyOrReplaceOutputFrameConfirmedRequired
    || !contract.applicationLifecycleTransaction.authorization.applyOrReplaceOutputFrameConfirmationDigestRequired
    || !contract.applicationLifecycleTransaction.authorization.exactEditFrameAuthorityTransactionallyReReadRequired
    || contract.applicationLifecycleTransaction.authorization.callerSuppliedFrameAuthorityTrusted !== false
  ) invalid('application_lifecycle_output_frame_authority_incomplete')
  if (
    !contract.applicationLifecycleTransaction.planningInvalidation.firstApplyInvalidatesExistingDraftPlanAndEstimate
    || !contract.applicationLifecycleTransaction.planningInvalidation.replacementInvalidatesExistingDraftPlanAndEstimate
    || !contract.applicationLifecycleTransaction.planningInvalidation.removalInvalidatesExistingDraftPlanAndEstimate
    || !contract.applicationLifecycleTransaction.planningInvalidation.approvedPlanSnapshotPreserved
    || !contract.applicationLifecycleTransaction.planningInvalidation.activeExecutionAuthorizationRevoked
    || !contract.applicationLifecycleTransaction.planningInvalidation.freshPlanAndEstimateRequiredAfterMutation
  ) invalid('application_lifecycle_planning_invalidation_incomplete')
  if (!contract.applicationLifecycleTransaction.idempotency.mutationAndReceiptShareTransaction) {
    invalid('idempotency_not_atomic_with_domain_mutation')
  }
  if (
    contract.planningAuthorityRead.name !== 'read_exact_edit_reference_application_state_v2'
    || contract.planningAuthorityRead.serverOnly !== true
    || contract.planningAuthorityRead.authenticatedUserRequired !== true
    || contract.planningAuthorityRead.serviceRoleBrowserUseAllowed !== false
    || contract.planningAuthorityRead.oneTransactionalSnapshotRequired !== true
    || contract.planningAuthorityRead.maximumCurrentStateRows !== 1
    || contract.planningAuthorityRead.states.join('|') !== 'not_selected|connected|cleared'
    || contract.planningAuthorityRead.rawReferenceMediaReturned !== false
    || contract.planningAuthorityRead.rawProviderPayloadReturned !== false
  ) invalid('planning_authority_read_contract_invalid')
  if (!contract.executionAuthorityRead.requiredBeforeStages.includes('worker_claim')) {
    invalid('worker_claim_missing_current_application_gate')
  }
  if (!contract.executionAuthorityRead.requiredBeforeStages.includes('private_review_ready')) {
    invalid('private_review_missing_current_application_gate')
  }
  if (contract.migrationExecutable || contract.remoteMutationAllowed || contract.productionReady) {
    invalid('closed_migration_or_production_gate_opened')
  }
  if (
    contract.financialAndExecutionBoundaries.providerCallAllowed
    || contract.financialAndExecutionBoundaries.workerDispatchAllowed
    || contract.financialAndExecutionBoundaries.publicRenderAllowed
    || contract.financialAndExecutionBoundaries.customerPriceCalculated
    || contract.financialAndExecutionBoundaries.customerCreditsMutated
    || contract.financialAndExecutionBoundaries.serviceFeeIncluded
  ) invalid('external_or_financial_boundary_opened')

  return {
    version: contract.version,
    tableCount: contract.tables.length,
    requiredFeatureTableCount: EDIT_REFERENCE_REQUIRED_PRODUCTION_TABLES.length,
    supportingTableCount: EDIT_REFERENCE_SUPPORTING_PRODUCTION_TABLES.length,
    forcedRlsTableCount: contract.tables.filter((candidate) => candidate.rlsEnabled && candidate.rlsForced).length,
    directAuthenticatedMutationTableCount: contract.tables.filter((candidate) => (
      candidate.directAuthenticatedInsertAllowed
      || candidate.directAuthenticatedUpdateAllowed
      || candidate.directAuthenticatedDeleteAllowed
    )).length,
    privateStorageTableCount: contract.tables.filter((candidate) => candidate.privateStorageIdentityRequired).length,
    immutableOrAppendOnlyTableCount: contract.tables.filter((candidate) => candidate.immutableAfterCommit || candidate.appendOnly).length,
    studyChatReasoningTableCount: contract.tables.filter((candidate) => (
      EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES.includes(
        candidate.name as typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES[number],
      )
    )).length,
    studyChatReasoningOperationCount: contract.studyChatReasoning.operations.length,
    studyChatReasoningRuntimeEnabled: false,
    longFormStudyTableCount: contract.tables.filter((candidate) => (
      EDIT_REFERENCE_LONG_FORM_STUDY_TABLES.includes(
        candidate.name as typeof EDIT_REFERENCE_LONG_FORM_STUDY_TABLES[number],
      )
    )).length,
    longFormStudyOperationCount: contract.longFormStudy.operations.length,
    longFormStudyRuntimeEnabled: false,
    atomicLifecycleEffectCount: contract.applicationLifecycleTransaction.atomicEffects.length,
    planningAuthorityStateCount: contract.planningAuthorityRead.states.length,
    requiredExecutionReadStageCount: contract.executionAuthorityRead.requiredBeforeStages.length,
    migrationExecutable: false,
    remoteMutationAllowed: false,
    productionReady: false,
  }
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The Edit Reference production persistence contract is incomplete or unsafe.',
    503,
    { reason, migrationBaseline: 'blocked_by_parallel_foundations', remoteMutationAttempted: false },
  )
}
