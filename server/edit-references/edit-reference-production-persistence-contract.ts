import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION =
  'edit-reference-production-persistence-contract-v3' as const

export const EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC_NAME =
  'mutate_edit_reference_application_lifecycle_v3' as const

export const EDIT_REFERENCE_REQUIRED_PRODUCTION_TABLES = [
  'edit_references',
  'preference_study_sessions',
  'preference_study_messages',
  'preference_evidence',
  'preference_assets',
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
  readonly applicationLifecycleTransaction: EditReferenceApplicationLifecycleTransactionContract
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
  atomicLifecycleEffectCount: number
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
    atomicLifecycleEffectCount: contract.applicationLifecycleTransaction.atomicEffects.length,
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
