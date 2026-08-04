export const EDIT_REFERENCE_STUDY_CHAT_PRODUCTION_PERSISTENCE_VERSION =
  'edit-reference-study-chat-production-persistence-v1' as const

export const EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES = [
  'preference_study_reasoning_runs',
  'preference_study_reasoning_route_attempts',
  'preference_study_reasoning_provider_requests',
  'preference_study_reasoning_provider_observations',
  'preference_study_reasoning_checkbacks',
  'preference_study_reasoning_run_receipts',
] as const

export const EDIT_REFERENCE_STUDY_CHAT_REASONING_OPERATIONS = [
  'reserve_run_with_saved_direction',
  'authorize_route_attempt',
  'reserve_provider_request',
  'consume_one_use_submission',
  'record_provider_observation',
  'schedule_checkback',
  'claim_checkback',
  'heartbeat_checkback',
  'settle_route_attempt_and_cost',
  'authorize_next_fallback',
  'settle_run_and_assistant_message',
  'cancel_run',
  'recover_expired_checkback_lease',
] as const

export interface EditReferenceStudyChatProductionPersistenceContract {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_PRODUCTION_PERSISTENCE_VERSION
  readonly authorityClass: 'pre_plan_edit_reference_study_chat_reasoning'
  readonly canonicalReasoningRouteContractVersion: 'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek'
  readonly approvedEditPlanSnapshotRequired: false
  readonly approvedEditCreditReservationRequired: false
  readonly approvedEditAuthorityFabricated: false
  readonly paidStudyUsageApprovalRequiredBeforeProviderCall: true
  readonly operations: typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_OPERATIONS
  readonly identity: {
    readonly authenticatedUserRequired: true
    readonly workspaceMembershipRequired: true
    readonly exactReferenceStudyRevisionRequired: true
    readonly exactSavedUserMessageAndEvidenceRequired: true
    readonly exactClientMessageAndStructuredContextDigestsRequired: true
    readonly serverDerivedReasoningRunAndRouteAttemptIdsRequired: true
    readonly browserSelectedProviderOrRouteAllowed: false
  }
  readonly routePolicy: {
    readonly exactOrder: readonly ['kimi_k3_primary', 'qwen_3_7_fallback', 'deepseek_v4_pro_fallback']
    readonly qwenVisualSpecialistMaySubstituteForReasoning: false
    readonly fallbackRequiresImmediatelyPrecedingTerminalFailure: true
    readonly fallbackRequiresCommittedFailedAttemptCost: true
    readonly completedAttemptStopsFallback: true
    readonly unknownProviderOutcomeBlocksFallback: true
  }
  readonly transaction: {
    readonly savedDirectionRunReservationAndIdempotencyShareTransaction: true
    readonly oneUseProviderSubmissionRequired: true
    readonly providerRequestAndRouteAttemptTenantBound: true
    readonly routeAttemptTerminalOutcomeAndCostShareTransaction: true
    readonly fallbackAuthorizationReadsCommittedPriorAttempt: true
    readonly checkbackLeaseCompareAndSwapRequired: true
    readonly checkbackLeaseCredentialDigestOnly: true
    readonly terminalRunReceiptAssistantMessageAndAggregateSettlementShareTransaction: true
    readonly exactDurableResponseAssociationRequired: true
    readonly lostResponseReplayRequired: true
    readonly expiredCheckbackLeaseRecoveryRequired: true
  }
  readonly cost: {
    readonly approvedUsageEstimateRequired: true
    readonly immutableRateCardSnapshotRequired: true
    readonly maximumAuthorizedInternalCostRequired: true
    readonly everyProviderAttemptMeteredSeparately: true
    readonly failedAttemptCostRetained: true
    readonly unknownOutcomeMaximumExposureRetained: true
    readonly qwenVersionedCnyToUsdFxRequired: true
    readonly providerAndInfrastructureCostSeparated: true
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly persistence: {
    readonly runsCompareAndSwapVersioned: true
    readonly routeAttemptsCompareAndSwapVersioned: true
    readonly terminalRouteAttemptsImmutable: true
    readonly providerRequestsCompareAndSwapVersioned: true
    readonly providerObservationsAppendOnly: true
    readonly checkbacksCompareAndSwapVersioned: true
    readonly terminalRunReceiptsImmutable: true
    readonly rawProviderRequestPersisted: false
    readonly rawProviderResponsePersisted: false
    readonly hiddenReasoningPersisted: false
    readonly providerCredentialPersisted: false
    readonly signedUrlPersisted: false
    readonly localPathPersisted: false
  }
  readonly recovery: {
    readonly browserSessionRequiredForCompletion: false
    readonly providerTruthReconciledBeforeResubmission: true
    readonly automaticResubmissionAfterUnknownOutcomeAllowed: false
    readonly processRestartReadbackRequired: true
    readonly multiReplicaRaceProofRequired: true
    readonly appendOnlyAuditAndPointInTimeRestoreRequired: true
  }
  readonly runtimeActivation: {
    readonly canonicalRepositoryRpcVerified: false
    readonly multiReplicaCheckbackRecoveryVerified: false
    readonly liveProviderDispatchVerified: false
    readonly liveUsageAndCostSettlementVerified: false
    readonly mountedRuntimeAdapterVerified: false
    readonly productionEnabled: false
  }
}

export const editReferenceStudyChatProductionPersistenceContract:
EditReferenceStudyChatProductionPersistenceContract = {
  schemaVersion: EDIT_REFERENCE_STUDY_CHAT_PRODUCTION_PERSISTENCE_VERSION,
  authorityClass: 'pre_plan_edit_reference_study_chat_reasoning',
  canonicalReasoningRouteContractVersion: 'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek',
  approvedEditPlanSnapshotRequired: false,
  approvedEditCreditReservationRequired: false,
  approvedEditAuthorityFabricated: false,
  paidStudyUsageApprovalRequiredBeforeProviderCall: true,
  operations: EDIT_REFERENCE_STUDY_CHAT_REASONING_OPERATIONS,
  identity: {
    authenticatedUserRequired: true,
    workspaceMembershipRequired: true,
    exactReferenceStudyRevisionRequired: true,
    exactSavedUserMessageAndEvidenceRequired: true,
    exactClientMessageAndStructuredContextDigestsRequired: true,
    serverDerivedReasoningRunAndRouteAttemptIdsRequired: true,
    browserSelectedProviderOrRouteAllowed: false,
  },
  routePolicy: {
    exactOrder: ['kimi_k3_primary', 'qwen_3_7_fallback', 'deepseek_v4_pro_fallback'],
    qwenVisualSpecialistMaySubstituteForReasoning: false,
    fallbackRequiresImmediatelyPrecedingTerminalFailure: true,
    fallbackRequiresCommittedFailedAttemptCost: true,
    completedAttemptStopsFallback: true,
    unknownProviderOutcomeBlocksFallback: true,
  },
  transaction: {
    savedDirectionRunReservationAndIdempotencyShareTransaction: true,
    oneUseProviderSubmissionRequired: true,
    providerRequestAndRouteAttemptTenantBound: true,
    routeAttemptTerminalOutcomeAndCostShareTransaction: true,
    fallbackAuthorizationReadsCommittedPriorAttempt: true,
    checkbackLeaseCompareAndSwapRequired: true,
    checkbackLeaseCredentialDigestOnly: true,
    terminalRunReceiptAssistantMessageAndAggregateSettlementShareTransaction: true,
    exactDurableResponseAssociationRequired: true,
    lostResponseReplayRequired: true,
    expiredCheckbackLeaseRecoveryRequired: true,
  },
  cost: {
    approvedUsageEstimateRequired: true,
    immutableRateCardSnapshotRequired: true,
    maximumAuthorizedInternalCostRequired: true,
    everyProviderAttemptMeteredSeparately: true,
    failedAttemptCostRetained: true,
    unknownOutcomeMaximumExposureRetained: true,
    qwenVersionedCnyToUsdFxRequired: true,
    providerAndInfrastructureCostSeparated: true,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  },
  persistence: {
    runsCompareAndSwapVersioned: true,
    routeAttemptsCompareAndSwapVersioned: true,
    terminalRouteAttemptsImmutable: true,
    providerRequestsCompareAndSwapVersioned: true,
    providerObservationsAppendOnly: true,
    checkbacksCompareAndSwapVersioned: true,
    terminalRunReceiptsImmutable: true,
    rawProviderRequestPersisted: false,
    rawProviderResponsePersisted: false,
    hiddenReasoningPersisted: false,
    providerCredentialPersisted: false,
    signedUrlPersisted: false,
    localPathPersisted: false,
  },
  recovery: {
    browserSessionRequiredForCompletion: false,
    providerTruthReconciledBeforeResubmission: true,
    automaticResubmissionAfterUnknownOutcomeAllowed: false,
    processRestartReadbackRequired: true,
    multiReplicaRaceProofRequired: true,
    appendOnlyAuditAndPointInTimeRestoreRequired: true,
  },
  runtimeActivation: {
    canonicalRepositoryRpcVerified: false,
    multiReplicaCheckbackRecoveryVerified: false,
    liveProviderDispatchVerified: false,
    liveUsageAndCostSettlementVerified: false,
    mountedRuntimeAdapterVerified: false,
    productionEnabled: false,
  },
}

export interface EditReferenceStudyChatProductionPersistenceSummary {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_PRODUCTION_PERSISTENCE_VERSION
  readonly tableCount: number
  readonly operationCount: number
  readonly routeCount: 3
  readonly approvedEditAuthorityFabricated: false
  readonly productionEnabled: false
}

export function validateEditReferenceStudyChatProductionPersistenceContract(
  contract: EditReferenceStudyChatProductionPersistenceContract =
    editReferenceStudyChatProductionPersistenceContract,
): EditReferenceStudyChatProductionPersistenceSummary {
  if (
    contract.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_PRODUCTION_PERSISTENCE_VERSION
    || contract.authorityClass !== 'pre_plan_edit_reference_study_chat_reasoning'
    || contract.canonicalReasoningRouteContractVersion !== 'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek'
    || contract.approvedEditPlanSnapshotRequired !== false
    || contract.approvedEditCreditReservationRequired !== false
    || contract.approvedEditAuthorityFabricated !== false
    || !contract.paidStudyUsageApprovalRequiredBeforeProviderCall
    || JSON.stringify(contract.operations) !== JSON.stringify(EDIT_REFERENCE_STUDY_CHAT_REASONING_OPERATIONS)
  ) invalid()
  if (
    !contract.identity.authenticatedUserRequired
    || !contract.identity.workspaceMembershipRequired
    || !contract.identity.exactReferenceStudyRevisionRequired
    || !contract.identity.exactSavedUserMessageAndEvidenceRequired
    || !contract.identity.exactClientMessageAndStructuredContextDigestsRequired
    || !contract.identity.serverDerivedReasoningRunAndRouteAttemptIdsRequired
    || contract.identity.browserSelectedProviderOrRouteAllowed
  ) invalid()
  if (
    contract.routePolicy.exactOrder.join('|') !== 'kimi_k3_primary|qwen_3_7_fallback|deepseek_v4_pro_fallback'
    || contract.routePolicy.qwenVisualSpecialistMaySubstituteForReasoning
    || !contract.routePolicy.fallbackRequiresImmediatelyPrecedingTerminalFailure
    || !contract.routePolicy.fallbackRequiresCommittedFailedAttemptCost
    || !contract.routePolicy.completedAttemptStopsFallback
    || !contract.routePolicy.unknownProviderOutcomeBlocksFallback
  ) invalid()
  if (Object.values(contract.transaction).some((value) => value !== true)) invalid()
  if (
    !contract.cost.approvedUsageEstimateRequired
    || !contract.cost.immutableRateCardSnapshotRequired
    || !contract.cost.maximumAuthorizedInternalCostRequired
    || !contract.cost.everyProviderAttemptMeteredSeparately
    || !contract.cost.failedAttemptCostRetained
    || !contract.cost.unknownOutcomeMaximumExposureRetained
    || !contract.cost.qwenVersionedCnyToUsdFxRequired
    || !contract.cost.providerAndInfrastructureCostSeparated
    || contract.cost.customerPriceCalculated
    || contract.cost.customerCreditsMutated
    || contract.cost.serviceFeeIncluded
  ) invalid()
  if (
    !contract.persistence.runsCompareAndSwapVersioned
    || !contract.persistence.routeAttemptsCompareAndSwapVersioned
    || !contract.persistence.terminalRouteAttemptsImmutable
    || !contract.persistence.providerRequestsCompareAndSwapVersioned
    || !contract.persistence.providerObservationsAppendOnly
    || !contract.persistence.checkbacksCompareAndSwapVersioned
    || !contract.persistence.terminalRunReceiptsImmutable
    || contract.persistence.rawProviderRequestPersisted
    || contract.persistence.rawProviderResponsePersisted
    || contract.persistence.hiddenReasoningPersisted
    || contract.persistence.providerCredentialPersisted
    || contract.persistence.signedUrlPersisted
    || contract.persistence.localPathPersisted
  ) invalid()
  if (
    contract.recovery.browserSessionRequiredForCompletion
    || !contract.recovery.providerTruthReconciledBeforeResubmission
    || contract.recovery.automaticResubmissionAfterUnknownOutcomeAllowed
    || !contract.recovery.processRestartReadbackRequired
    || !contract.recovery.multiReplicaRaceProofRequired
    || !contract.recovery.appendOnlyAuditAndPointInTimeRestoreRequired
  ) invalid()
  if (Object.values(contract.runtimeActivation).some((value) => value !== false)) invalid()
  return {
    schemaVersion: contract.schemaVersion,
    tableCount: EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES.length,
    operationCount: contract.operations.length,
    routeCount: 3,
    approvedEditAuthorityFabricated: false,
    productionEnabled: false,
  }
}

function invalid(): never {
  throw new Error('The production Study Chat reasoning persistence contract is incomplete or unsafe.')
}
