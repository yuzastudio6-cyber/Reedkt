export type ObservabilitySoundFixtureEvidenceAcceptanceMode =
  'observability_fixture_evidence_audit_only'

export type ObservabilitySoundFixtureEvidenceUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type ObservabilitySoundFixtureEvidenceOwner =
  | 'OBSERVABILITY_AUDIT_COST'
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type ObservabilitySoundFixtureEvidenceDecision =
  | 'conditional_observability_acceptance_for_metadata_only_fixture_evidence'
  | 'observability_rejects_fixture_evidence_for_now'

export type ObservabilitySoundFixtureEvidenceOwnerStatus =
  | 'accepted_conditionally'
  | 'missing'
  | 'not_accepted_for_execution'

export type ObservabilitySoundEvidenceArea =
  | 'audio_qa_metadata'
  | 'speech_ducking_warnings'
  | 'no_random_sfx_policy'
  | 'sfx_usefulness_evidence'
  | 'music_over_voice_evidence'
  | 'loudness_expectation_metadata'
  | 'sync_timing_expectation_metadata'
  | 'naturalness_artifact_expectation_metadata'
  | 'provider_license_blocked_evidence'
  | 'worker_no_dispatch_evidence'
  | 'supabase_no_mutation_evidence'
  | 'storage_source_of_truth_evidence'
  | 'signed_url_rejection_evidence'
  | 'public_artifact_rejection_evidence'
  | 'generated_asset_rejection_evidence'
  | 'cost_placeholder_evidence'
  | 'billing_no_spend_evidence'
  | 'owner_decision_evidence'
  | 'rollback_cleanup_expectation_evidence'
  | 'advisor_output_capture_expectations'
  | 'no_beta_no_production_evidence'

export interface ObservabilitySoundEvidenceReadinessEntry {
  area: ObservabilitySoundEvidenceArea
  currentRepoEvidence: string[]
  metadataOnlyAcceptedNow: true
  persistedEvidenceAllowedNow: false
  missingEvidence: string[]
  owner: ObservabilitySoundFixtureEvidenceOwner
  requiredBeforeGeneratedLocalFixturePassed: true
}

export interface ObservabilitySoundFixtureOwnerEntry {
  owner: ObservabilitySoundFixtureEvidenceOwner
  status: ObservabilitySoundFixtureEvidenceOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface ObservabilitySoundFixtureEvidenceAcceptance {
  workstream: 'OBSERVABILITY_AUDIT_COST'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  relatedSourceWorkstreams: ['SUPABASE_RLS_STORAGE_DATABASE', 'WORKER_RUNTIME_JOBS', 'PROVIDER_GATEWAY_MODELS']
  mode: ObservabilitySoundFixtureEvidenceAcceptanceMode
  currentUnlockStage: Extract<ObservabilitySoundFixtureEvidenceUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    ObservabilitySoundFixtureEvidenceUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    observabilityDecision: Extract<
      ObservabilitySoundFixtureEvidenceDecision,
      'conditional_observability_acceptance_for_metadata_only_fixture_evidence'
    >
    observabilityAllowsMetadataOnlyEvidenceExpectations: true
    observabilityAllowsPersistedEvidenceRows: false
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    qaReportsCreated: false
    auditEventsCreated: false
    costRowsCreated: false
    advisorCommandsRun: false
    mediaAnalysisRun: false
    ffmpegRun: false
    providerCallsMade: false
    workersDispatched: false
    supabaseMutationPerformed: false
    generatedAssetsCreated: false
    creditRowsCreated: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
  }
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  evidenceReadiness: ObservabilitySoundEvidenceReadinessEntry[]
  qaEvidenceFormatExpectation: {
    qaEvidenceId: string
    approvedPlanSnapshotId: 'required'
    timingAwareCueManifestId: 'required'
    privateAudioArtifactManifestId: 'required'
    fixtureSpecId: 'required'
    checks: [
      'speech_ducking',
      'no_random_sfx',
      'timing_sync',
      'loudness_expectation',
      'naturalness_expectation',
      'artifact_expectation',
    ]
    status: 'metadata_only_expected'
    warnings: string[]
    blockers: string[]
    validatedNow: false
    persistedNow: false
  }
  auditEvidenceFormatExpectation: {
    auditEvidenceId: string
    workstream: 'OBSERVABILITY_AUDIT_COST'
    sourceDocsAndSpecs: string[]
    ownerDecisions: string[]
    blockedUses: string[]
    noSideEffectGates: string[]
    sourceOfTruthPathRequired: true
    rawPromptRejectionRequired: true
    signedUrlRejectionRequired: true
    publicArtifactRejectionRequired: true
    claimsGeneratedLocalFixturePassed: false
    persistedNow: false
  }
  costEvidenceFormatExpectation: {
    costEvidenceId: string
    estimatedCostRecordedNow: false
    spendOccurred: false
    creditReserved: false
    refundOrReleaseOccurred: false
    billingOwnerRequired: true
    costControlsRequiredBeforeLaterPhase: true
    persistedNow: false
  }
  advisorReadinessPlan: {
    advisorCommandsRunNow: false
    securityAdvisorOutputCaptureLater: true
    performanceAdvisorOutputCaptureLater: true
    rlsNoPolicyFindingsCaptureLater: true
    mutableSearchPathFindingsCaptureLater: true
    securityDefinerFindingsCaptureLater: true
    unindexedFkFindingsCaptureLater: true
    storagePolicyFindingsCaptureLater: true
  }
  requiredBeforeOBSERVABILITY_SOUND_1: string[]
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
    requiresStructuredAgentFindings: true
    requiresEditIntents: true
    requiresApprovedPlanSnapshot: true
  }
  crossOwnerStatus: ObservabilitySoundFixtureOwnerEntry[]
  recommendedImmediateNextPrompt: 'BILLING-SOUND-0: fixture credit placeholder acceptance audit'
}

const evidenceReadiness: ObservabilitySoundEvidenceReadinessEntry[] = [
  {
    area: 'audio_qa_metadata',
    currentRepoEvidence: ['SOUND fixture plan and production audio QA policy describe QA expectations'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['approved fixture QA evidence schema'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'speech_ducking_warnings',
    currentRepoEvidence: ['SOUND fixture spec requires speech overlap and ducking metadata'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['accepted warning severity taxonomy'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_random_sfx_policy',
    currentRepoEvidence: ['SOUND docs require useful cue-tied SFX'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['fixture evidence checklist for random SFX rejection'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'sfx_usefulness_evidence',
    currentRepoEvidence: ['SOUND evidence cards expose cue reasons and blocked uses'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['owner accepted usefulness criteria'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'music_over_voice_evidence',
    currentRepoEvidence: ['audio QA policy includes music over voice and ducking'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['accepted metadata thresholds'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'loudness_expectation_metadata',
    currentRepoEvidence: ['production audio QA policy lists loudness gates'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['local fixture loudness expectation record'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'sync_timing_expectation_metadata',
    currentRepoEvidence: ['timing-aware cue manifest and SoundSync notes exist'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['Track A and Track B timing-consumption acceptance'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'naturalness_artifact_expectation_metadata',
    currentRepoEvidence: ['audio QA policy names naturalness and artifact expectations'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['local fixture naturalness criteria'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'provider_license_blocked_evidence',
    currentRepoEvidence: ['Provider Gateway audit blocks provider calls and captures model/license boundaries'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['future provider license evidence record'],
    owner: 'PROVIDER_GATEWAY_MODELS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'worker_no_dispatch_evidence',
    currentRepoEvidence: ['Worker Runtime audit blocks dispatch jobs events and configs'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['future no-dispatch payload validation evidence'],
    owner: 'WORKER_RUNTIME_JOBS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'supabase_no_mutation_evidence',
    currentRepoEvidence: ['Supabase owner decision blocks SQL rows storage and signed URLs'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['future local non-production target evidence'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'storage_source_of_truth_evidence',
    currentRepoEvidence: ['source docs require row private path manifest checksum and snapshot'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['live accepted row storage policy evidence'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'signed_url_rejection_evidence',
    currentRepoEvidence: ['source-of-truth docs reject signed URLs'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['signed URL rejection assertion in later fixture validation'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'public_artifact_rejection_evidence',
    currentRepoEvidence: ['source docs block public artifacts'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['public delivery policy owner acceptance'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'generated_asset_rejection_evidence',
    currentRepoEvidence: ['fixture specs keep generated assets false'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['generated asset no-create evidence in later validation'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'cost_placeholder_evidence',
    currentRepoEvidence: ['SOUND and Provider Gateway docs require cost placeholders only'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['Billing owner no-spend acceptance'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'billing_no_spend_evidence',
    currentRepoEvidence: ['current specs block credits spend reservation refund and release'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['explicit Billing acceptance'],
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'owner_decision_evidence',
    currentRepoEvidence: ['SOUND Supabase Worker Runtime and Provider Gateway packets exist'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['Billing Track A Track B and possible SOUND scope acceptance'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'rollback_cleanup_expectation_evidence',
    currentRepoEvidence: ['Supabase validation docs require rollback and cleanup expectations'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['owner accepted future cleanup evidence capture'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'advisor_output_capture_expectations',
    currentRepoEvidence: ['Supabase plans mention advisor evidence capture'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['approved advisor command plan and output capture format'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'no_beta_no_production_evidence',
    currentRepoEvidence: ['current docs block beta and production readiness claims'],
    metadataOnlyAcceptedNow: true,
    persistedEvidenceAllowedNow: false,
    missingEvidence: ['explicit no-readiness claim smoke in later phase'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
]

const recommendedImmediateNextPrompt =
  'BILLING-SOUND-0: fixture credit placeholder acceptance audit' as const

export const OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE:
  ObservabilitySoundFixtureEvidenceAcceptance = {
    workstream: 'OBSERVABILITY_AUDIT_COST',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    relatedSourceWorkstreams: [
      'SUPABASE_RLS_STORAGE_DATABASE',
      'WORKER_RUNTIME_JOBS',
      'PROVIDER_GATEWAY_MODELS',
    ],
    mode: 'observability_fixture_evidence_audit_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      observabilityDecision: 'conditional_observability_acceptance_for_metadata_only_fixture_evidence',
      observabilityAllowsMetadataOnlyEvidenceExpectations: true,
      observabilityAllowsPersistedEvidenceRows: false,
      globalGoForSUPABASE_SOUND_4: false,
      reasonGlobalGoBlocked: [
        'BILLING_STRIPE_CREDITS no-spend acceptance remains missing',
        'TRACK_A_RENDER_EXPORT no-export evidence consumption acceptance remains missing',
        'TRACK_B_MEDIA_PROCESSING no-processing evidence consumption acceptance remains missing',
        'SOUND_MUSIC_AUDIO explicit next-phase fixture scope acceptance may remain required',
      ],
    },
    execution: {
      qaReportsCreated: false,
      auditEventsCreated: false,
      costRowsCreated: false,
      advisorCommandsRun: false,
      mediaAnalysisRun: false,
      ffmpegRun: false,
      providerCallsMade: false,
      workersDispatched: false,
      supabaseMutationPerformed: false,
      generatedAssetsCreated: false,
      creditRowsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
    acceptedConditions: [
      'metadata-only QA evidence expectations',
      'metadata-only audit evidence expectations',
      'metadata-only cost placeholder expectations',
      'no persisted QA rows',
      'no audit event rows',
      'no cost rows',
      'no beta readiness claim',
      'no production readiness claim',
      'no silent acceptance',
      'no media analysis execution',
      'no FFmpeg',
      'no provider calls',
      'no worker dispatch',
      'no Supabase mutation',
      'no public artifacts',
      'no signed URLs',
      'no credits spend or reservation',
      'evidence must list what was validated and what was not validated',
    ],
    rejectedOrStillBlocked: [
      'persisted QA reports',
      'persisted audit events',
      'persisted cost rows',
      'beta readiness claim',
      'production readiness claim',
      'abuse cost guardrail claim without evidence',
      'advisor execution claim without approved advisor flow',
      'media analysis execution',
      'audio loudness analysis execution',
      'audio sync analysis execution',
      'artifact quality execution',
      'silent acceptance',
      'generated_local_fixture_passed claim',
    ],
    evidenceReadiness,
    qaEvidenceFormatExpectation: {
      qaEvidenceId: 'mock-reference-only-qa-evidence-id',
      approvedPlanSnapshotId: 'required',
      timingAwareCueManifestId: 'required',
      privateAudioArtifactManifestId: 'required',
      fixtureSpecId: 'required',
      checks: [
        'speech_ducking',
        'no_random_sfx',
        'timing_sync',
        'loudness_expectation',
        'naturalness_expectation',
        'artifact_expectation',
      ],
      status: 'metadata_only_expected',
      warnings: ['future fixture must record warning expectations without running QA now'],
      blockers: ['persisted QA rows require later owner acceptance'],
      validatedNow: false,
      persistedNow: false,
    },
    auditEvidenceFormatExpectation: {
      auditEvidenceId: 'mock-reference-only-audit-evidence-id',
      workstream: 'OBSERVABILITY_AUDIT_COST',
      sourceDocsAndSpecs: [
        'docs/sound-music-audio-generated-local-fixture-plan.md',
        'docs/sound-music-audio-owner-acceptance-checklist.md',
        'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md',
        'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md',
        'docs/provider-gateway-sound-fixture-boundary-audit.md',
      ],
      ownerDecisions: [
        'Supabase conditional local SQL validation acceptance',
        'Worker Runtime conditional payload-shape validation acceptance',
        'Provider Gateway conditional no-provider fixture boundary acceptance',
        'Observability conditional metadata-only evidence acceptance',
      ],
      blockedUses: [
        'persisted QA rows',
        'audit event rows',
        'cost rows',
        'beta readiness',
        'production readiness',
        'generated_local_fixture_passed claim',
      ],
      noSideEffectGates: [
        'no Supabase mutation',
        'no SQL',
        'no advisor commands',
        'no media analysis',
        'no FFmpeg',
        'no provider calls',
        'no worker dispatch',
      ],
      sourceOfTruthPathRequired: true,
      rawPromptRejectionRequired: true,
      signedUrlRejectionRequired: true,
      publicArtifactRejectionRequired: true,
      claimsGeneratedLocalFixturePassed: false,
      persistedNow: false,
    },
    costEvidenceFormatExpectation: {
      costEvidenceId: 'mock-reference-only-cost-evidence-id',
      estimatedCostRecordedNow: false,
      spendOccurred: false,
      creditReserved: false,
      refundOrReleaseOccurred: false,
      billingOwnerRequired: true,
      costControlsRequiredBeforeLaterPhase: true,
      persistedNow: false,
    },
    advisorReadinessPlan: {
      advisorCommandsRunNow: false,
      securityAdvisorOutputCaptureLater: true,
      performanceAdvisorOutputCaptureLater: true,
      rlsNoPolicyFindingsCaptureLater: true,
      mutableSearchPathFindingsCaptureLater: true,
      securityDefinerFindingsCaptureLater: true,
      unindexedFkFindingsCaptureLater: true,
      storagePolicyFindingsCaptureLater: true,
    },
    requiredBeforeOBSERVABILITY_SOUND_1: [
      'metadata-only QA evidence spec approved',
      'metadata-only audit evidence spec approved',
      'metadata-only cost placeholder spec approved',
      'no-persisted-rows smoke',
      'no-beta no-production claim smoke',
      'no-silent-acceptance smoke',
      'owner decision evidence links',
      'future persisted evidence schema owner decision',
      'Billing handoff accepted',
      'Track A/B evidence consumption expectations',
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
      requiresStructuredAgentFindings: true,
      requiresEditIntents: true,
      requiresApprovedPlanSnapshot: true,
    },
    crossOwnerStatus: [
      {
        owner: 'OBSERVABILITY_AUDIT_COST',
        status: 'accepted_conditionally',
        evidence: [
          'conditional metadata-only fixture evidence acceptance',
          'QA audit cost rows blocked',
          'advisor commands blocked',
        ],
        missingEvidence: [
          'future persisted evidence schema owner decision',
          'no-silent-acceptance smoke',
          'no-beta no-production claim smoke',
          'later advisor output capture approval',
        ],
      },
      {
        owner: 'PROVIDER_GATEWAY_MODELS',
        status: 'accepted_conditionally',
        evidence: ['PROVIDER-GATEWAY-SOUND-0 conditionally accepts no-provider local fixture metadata spec validation'],
        missingEvidence: ['provider route contract draft license table fallback policy and cost error audit execution acceptance'],
      },
      {
        owner: 'WORKER_RUNTIME_JOBS',
        status: 'accepted_conditionally',
        evidence: ['WORKER-RUNTIME-SOUND-0 conditionally accepts future payload-shape validation only'],
        missingEvidence: ['no-dispatch payload-shape validation smoke'],
      },
      {
        owner: 'SUPABASE_RLS_STORAGE_DATABASE',
        status: 'accepted_conditionally',
        evidence: [
          'SUPABASE-SOUND-3D conditionally accepts future local throwaway non-production SQL validation only',
        ],
        missingEvidence: ['no live rows storage writes active migration advisor output capture approval or SUPABASE-SOUND-4 authorization'],
      },
      {
        owner: 'SOUND_MUSIC_AUDIO',
        status: 'missing',
        evidence: ['SOUND dry-run fixture spec handoff packet owner checklist and fixture planning docs exist'],
        missingEvidence: ['explicit no-provider no-worker no-row fixture scope acceptance for next phase'],
      },
      {
        owner: 'BILLING_STRIPE_CREDITS',
        status: 'missing',
        evidence: ['all current fixture plans keep credit rows and spend blocked'],
        missingEvidence: ['no-spend no-reservation acceptance and future cost placeholder policy'],
      },
      {
        owner: 'TRACK_A_RENDER_EXPORT',
        status: 'missing',
        evidence: ['Track A final export remains false in SOUND Supabase Worker Runtime and Provider Gateway specs'],
        missingEvidence: ['no-export acceptance and fixture evidence consumption expectations'],
      },
      {
        owner: 'TRACK_B_MEDIA_PROCESSING',
        status: 'missing',
        evidence: ['Track B processing remains not accepted and media analysis remains blocked'],
        missingEvidence: ['no-processing acceptance and fixture evidence consumption expectations'],
      },
    ],
    recommendedImmediateNextPrompt,
  }
