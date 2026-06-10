export type BillingSoundFixtureCreditPlaceholderAcceptanceMode =
  'billing_fixture_credit_placeholder_audit_only'

export type BillingSoundFixtureCreditPlaceholderUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type BillingSoundFixtureCreditOwner =
  | 'BILLING_STRIPE_CREDITS'
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type BillingSoundFixtureCreditDecision =
  | 'conditional_billing_acceptance_for_no_spend_fixture_credit_placeholder'
  | 'billing_rejects_fixture_credit_placeholder_for_now'

export type BillingSoundFixtureCreditOwnerStatus =
  | 'accepted_conditionally'
  | 'missing'
  | 'not_accepted_for_execution'

export type BillingSoundFixtureCreditCostArea =
  | 'no_credit_estimate_row'
  | 'no_credit_approval_row'
  | 'no_credit_reservation_row'
  | 'no_spend'
  | 'no_refund'
  | 'no_release'
  | 'no_stripe_call'
  | 'no_payment_object'
  | 'metadata_only_cost_placeholder'
  | 'provider_cost_placeholder'
  | 'worker_cost_placeholder'
  | 'generated_asset_cost_placeholder'
  | 'audit_cost_evidence_link'
  | 'rollback_refund_release_future_requirement'
  | 'no_beta_no_production_evidence'

export interface BillingSoundFixtureCreditPlaceholderReadinessEntry {
  area: BillingSoundFixtureCreditCostArea
  currentRepoEvidence: string[]
  metadataOnlyAcceptedNow: true
  persistedBillingEvidenceAllowedNow: false
  missingEvidence: string[]
  owner: BillingSoundFixtureCreditOwner
  requiredBeforeGeneratedLocalFixturePassed: true
}

export interface BillingSoundFixtureOwnerEntry {
  owner: BillingSoundFixtureCreditOwner
  status: BillingSoundFixtureCreditOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface BillingSoundFixtureCreditPlaceholderAcceptance {
  workstream: 'BILLING_STRIPE_CREDITS'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  relatedSourceWorkstreams: [
    'SUPABASE_RLS_STORAGE_DATABASE',
    'WORKER_RUNTIME_JOBS',
    'PROVIDER_GATEWAY_MODELS',
    'OBSERVABILITY_AUDIT_COST',
  ]
  mode: BillingSoundFixtureCreditPlaceholderAcceptanceMode
  currentUnlockStage: Extract<BillingSoundFixtureCreditPlaceholderUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    BillingSoundFixtureCreditPlaceholderUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    billingDecision: Extract<
      BillingSoundFixtureCreditDecision,
      'conditional_billing_acceptance_for_no_spend_fixture_credit_placeholder'
    >
    billingAllowsMetadataOnlyCreditPlaceholderExpectations: true
    billingAllowsPersistedCreditRows: false
    billingAllowsSpend: false
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    creditEstimatesCreated: false
    creditApprovalsCreated: false
    creditReservationsCreated: false
    spendOccurred: false
    refundOccurred: false
    releaseOccurred: false
    stripeCallsMade: false
    paymentObjectsCreated: false
    providerCallsMade: false
    workersDispatched: false
    supabaseMutationPerformed: false
    generatedAssetsCreated: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
  }
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  creditPlaceholderReadiness: BillingSoundFixtureCreditPlaceholderReadinessEntry[]
  creditPlaceholderFormatExpectation: {
    creditPlaceholderId: string
    approvedPlanSnapshotId: 'required'
    fixtureSpecId: 'required'
    providerPolicyRef: 'required_if_applicable'
    workerPayloadRef: 'required_if_applicable'
    qaEvidenceRef: 'required_if_applicable'
    estimatedCostRecordedNow: false
    creditEstimateCreatedNow: false
    creditApprovalCreatedNow: false
    creditReservationCreatedNow: false
    spendOccurred: false
    refundOccurred: false
    releaseOccurred: false
    stripeOperationOccurred: false
    status: 'metadata_only_expected'
    warnings: string[]
    blockers: string[]
    persistedNow: false
  }
  futureBillingReadinessRequirements: string[]
  requiredBeforeBILLING_SOUND_1: string[]
  sourceOfTruthPath: {
    requiresSupabaseRow: true
    requiresPrivateGcsPath: true
    requiresManifest: true
    requiresChecksum: true
    requiresApprovedPlanSnapshot: true
    signedUrlsAreSourceOfTruth: false
    publicUrlsAllowed: false
  }
  rawPromptRule: {
    rawPromptDirectExecutionAllowed: false
    billingTriggeredFromRawPromptAllowed: false
    requiresStructuredAgentFindings: true
    requiresEditIntents: true
    requiresApprovedPlanSnapshot: true
  }
  crossOwnerStatus: BillingSoundFixtureOwnerEntry[]
  recommendedImmediateNextPrompt: 'TRACK-A-SOUND-0: audio fixture final composition handoff audit'
}

const creditPlaceholderReadiness: BillingSoundFixtureCreditPlaceholderReadinessEntry[] = [
  {
    area: 'no_credit_estimate_row',
    currentRepoEvidence: ['SOUND and owner audits block persisted credit estimate rows'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future Billing estimate policy'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_credit_approval_row',
    currentRepoEvidence: ['SOUND owner checklist blocks credit approvals'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future approval policy and user consent boundary'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_credit_reservation_row',
    currentRepoEvidence: ['Credit runtime docs require reservations only before expensive execution'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future reservation policy and idempotency evidence'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_spend',
    currentRepoEvidence: ['Observability and SOUND fixture docs state no spend occurred'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future spend authorization policy'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_refund',
    currentRepoEvidence: ['Credit flow docs define refunds as backend-only future behavior'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future failed-work refund policy'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_release',
    currentRepoEvidence: ['Credit flow docs define releases as backend-only future behavior'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future cancellation and release policy'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_stripe_call',
    currentRepoEvidence: ['Credit flow docs state no Stripe checkout, webhook, subscription, purchase, or refund flow is implemented'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future Stripe/payment owner acceptance'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_payment_object',
    currentRepoEvidence: ['No payment object is required for no-spend local fixture evidence'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['future payment object policy for paid phases'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'metadata_only_cost_placeholder',
    currentRepoEvidence: ['Observability accepts metadata-only cost placeholder expectations'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['accepted Billing placeholder schema'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'provider_cost_placeholder',
    currentRepoEvidence: ['Provider Gateway keeps provider cost/error semantics metadata-only'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['Provider Gateway cost/error handoff acceptance for future execution'],
    owner: 'PROVIDER_GATEWAY_MODELS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'worker_cost_placeholder',
    currentRepoEvidence: ['Worker Runtime keeps payload-shape validation only and no dispatch'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['Worker retry/release handoff acceptance'],
    owner: 'WORKER_RUNTIME_JOBS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'generated_asset_cost_placeholder',
    currentRepoEvidence: ['Supabase decision and SOUND fixture docs block generated assets'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['Supabase generated-asset source-of-truth evidence'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'audit_cost_evidence_link',
    currentRepoEvidence: ['Observability records metadata-only cost evidence expectations'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['accepted evidence link format'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'rollback_refund_release_future_requirement',
    currentRepoEvidence: ['Credit reservation, spend, release, and refund flow names backend-only future behavior'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['transaction, rollback, refund, and release acceptance'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_beta_no_production_evidence',
    currentRepoEvidence: ['Current owner docs block beta and production readiness claims'],
    metadataOnlyAcceptedNow: true,
    persistedBillingEvidenceAllowedNow: false,
    missingEvidence: ['explicit later no-paid-production readiness evidence'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
]

export const BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE:
  BillingSoundFixtureCreditPlaceholderAcceptance = {
    workstream: 'BILLING_STRIPE_CREDITS',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    relatedSourceWorkstreams: [
      'SUPABASE_RLS_STORAGE_DATABASE',
      'WORKER_RUNTIME_JOBS',
      'PROVIDER_GATEWAY_MODELS',
      'OBSERVABILITY_AUDIT_COST',
    ],
    mode: 'billing_fixture_credit_placeholder_audit_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      billingDecision: 'conditional_billing_acceptance_for_no_spend_fixture_credit_placeholder',
      billingAllowsMetadataOnlyCreditPlaceholderExpectations: true,
      billingAllowsPersistedCreditRows: false,
      billingAllowsSpend: false,
      globalGoForSUPABASE_SOUND_4: false,
      reasonGlobalGoBlocked: [
        'Track A final composition handoff is still missing.',
        'Track B processing handoff is still missing.',
        'Possible SOUND scope acceptance remains missing for the next phase.',
        'No generated/local fixture execution owner has authorized credit rows or spend.',
      ],
    },
    execution: {
      creditEstimatesCreated: false,
      creditApprovalsCreated: false,
      creditReservationsCreated: false,
      spendOccurred: false,
      refundOccurred: false,
      releaseOccurred: false,
      stripeCallsMade: false,
      paymentObjectsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      supabaseMutationPerformed: false,
      generatedAssetsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
    acceptedConditions: [
      'metadata-only credit placeholder expectations',
      'no persisted credit estimate rows',
      'no persisted credit approval rows',
      'no persisted credit reservation rows',
      'no spend, reservation, refund, or release',
      'no Stripe calls or payment objects',
      'no beta or production readiness claim',
      'evidence must list what was validated and what was not validated',
    ],
    rejectedOrStillBlocked: [
      'persisted credit estimates',
      'persisted credit approvals',
      'persisted credit reservations',
      'spend',
      'reservation',
      'refund',
      'release',
      'Stripe checkout, payment, customer, subscription, or payment-intent operations',
      'provider cost claim without Provider Gateway evidence',
      'worker cost claim without Worker Runtime evidence',
      'generated asset cost claim without Supabase and storage evidence',
      'generated_local_fixture_passed claim',
    ],
    creditPlaceholderReadiness,
    creditPlaceholderFormatExpectation: {
      creditPlaceholderId: 'mock-reference-only-sound-credit-placeholder',
      approvedPlanSnapshotId: 'required',
      fixtureSpecId: 'required',
      providerPolicyRef: 'required_if_applicable',
      workerPayloadRef: 'required_if_applicable',
      qaEvidenceRef: 'required_if_applicable',
      estimatedCostRecordedNow: false,
      creditEstimateCreatedNow: false,
      creditApprovalCreatedNow: false,
      creditReservationCreatedNow: false,
      spendOccurred: false,
      refundOccurred: false,
      releaseOccurred: false,
      stripeOperationOccurred: false,
      status: 'metadata_only_expected',
      warnings: [
        'No Billing row is created by this placeholder.',
        'No Stripe or payment object is created by this placeholder.',
      ],
      blockers: [
        'Billing row/RLS policy is not accepted for execution.',
        'Track A and Track B handoffs remain missing.',
        'SUPABASE-SOUND-4 is globally blocked.',
      ],
      persistedNow: false,
    },
    futureBillingReadinessRequirements: [
      'Billing owner accepts credit estimate policy.',
      'Billing owner accepts approval policy.',
      'Billing owner accepts reservation policy.',
      'Billing owner accepts refund/release policy.',
      'Billing owner accepts no-spend local fixture policy.',
      'Provider Gateway cost/error semantics accepted.',
      'Worker Runtime retry/release semantics accepted.',
      'Observability cost evidence accepted.',
      'Supabase credit row/RLS policy accepted.',
      'no beta/production claim without full billing evidence.',
    ],
    requiredBeforeBILLING_SOUND_1: [
      'metadata-only credit placeholder spec approved',
      'no-persisted-credit-rows smoke',
      'no-spend/no-reservation smoke',
      'no-Stripe-call smoke',
      'no-beta/no-production claim smoke',
      'Provider Gateway cost/error handoff accepted',
      'Worker Runtime retry/release handoff accepted',
      'Observability cost evidence accepted',
      'Supabase credit row policy accepted',
      'Track A/B cost impact clarified if needed',
    ],
    sourceOfTruthPath: {
      requiresSupabaseRow: true,
      requiresPrivateGcsPath: true,
      requiresManifest: true,
      requiresChecksum: true,
      requiresApprovedPlanSnapshot: true,
      signedUrlsAreSourceOfTruth: false,
      publicUrlsAllowed: false,
    },
    rawPromptRule: {
      rawPromptDirectExecutionAllowed: false,
      billingTriggeredFromRawPromptAllowed: false,
      requiresStructuredAgentFindings: true,
      requiresEditIntents: true,
      requiresApprovedPlanSnapshot: true,
    },
    crossOwnerStatus: [
      {
        owner: 'BILLING_STRIPE_CREDITS',
        status: 'accepted_conditionally',
        evidence: ['conditional metadata-only no-spend credit placeholder acceptance'],
        missingEvidence: ['future estimate, approval, reservation, spend, refund, release, and Stripe policy'],
      },
      {
        owner: 'OBSERVABILITY_AUDIT_COST',
        status: 'accepted_conditionally',
        evidence: ['OBSERVABILITY-SOUND-0 metadata-only QA/audit/cost evidence acceptance'],
        missingEvidence: ['future persisted evidence schema owner decision'],
      },
      {
        owner: 'PROVIDER_GATEWAY_MODELS',
        status: 'accepted_conditionally',
        evidence: ['PROVIDER-GATEWAY-SOUND-0 no-provider metadata/spec acceptance'],
        missingEvidence: ['provider route contract and cost/error/audit acceptance for future execution'],
      },
      {
        owner: 'WORKER_RUNTIME_JOBS',
        status: 'accepted_conditionally',
        evidence: ['WORKER-RUNTIME-SOUND-0 payload-shape validation acceptance only'],
        missingEvidence: ['no-dispatch payload-shape validation smoke and future worker-facing contract acceptance'],
      },
      {
        owner: 'SUPABASE_RLS_STORAGE_DATABASE',
        status: 'accepted_conditionally',
        evidence: ['SUPABASE-SOUND-3D future local SQL validation acceptance only'],
        missingEvidence: ['no live rows, no storage writes, no credit row/RLS execution acceptance'],
      },
      {
        owner: 'SOUND_MUSIC_AUDIO',
        status: 'missing',
        evidence: ['SOUND dry-run, fixture spec, handoff packet, owner checklist, and fixture plan exist'],
        missingEvidence: ['explicit no-provider/no-worker/no-row fixture scope acceptance for the next phase'],
      },
      {
        owner: 'TRACK_A_RENDER_EXPORT',
        status: 'missing',
        evidence: ['Track A final export remains false in all fixture owner packets'],
        missingEvidence: ['no-export acceptance and final composition handoff boundary'],
      },
      {
        owner: 'TRACK_B_MEDIA_PROCESSING',
        status: 'missing',
        evidence: ['Track B processing remains not accepted and media analysis remains blocked'],
        missingEvidence: ['no-processing acceptance and fixture evidence consumption expectations'],
      },
    ],
    recommendedImmediateNextPrompt: 'TRACK-A-SOUND-0: audio fixture final composition handoff audit',
  }
