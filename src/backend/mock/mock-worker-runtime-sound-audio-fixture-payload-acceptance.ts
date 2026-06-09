export type WorkerRuntimeSoundAudioFixturePayloadAcceptanceMode =
  'worker_runtime_payload_acceptance_audit_only'

export type WorkerRuntimeSoundAudioFixturePayloadUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type WorkerRuntimeSoundAudioFixturePayloadOwner =
  | 'WORKER_RUNTIME_JOBS'
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type WorkerRuntimeSoundAudioFixturePayloadDecision =
  | 'conditional_worker_runtime_acceptance_for_future_payload_shape_validation'
  | 'worker_runtime_rejects_payload_validation_for_now'

export type WorkerRuntimeSoundAudioFixturePayloadOwnerStatus =
  | 'accepted_conditionally'
  | 'missing'
  | 'not_accepted_for_execution'

export interface WorkerRuntimeSoundAudioFixturePayloadExpectation {
  workstream: 'SOUND_MUSIC_AUDIO'
  mode: 'audio_fixture_payload_shape_validation_only'
  dryRunRequestId: string
  jobIntentId: string
  approvedPlanSnapshotId: 'required'
  timingAwareCueManifestId: 'required'
  privateAudioArtifactManifestId: 'required'
  fixtureSpecId: 'required'
  idempotencyKey: 'required'
  providerPolicyRef: 'required'
  runtimeTarget: 'mock_or_local_validation_only'
  expectedArtifactKinds: string[]
  qaEvidenceRefs: string[]
  mayDispatchWorker: false
  mayCreateJob: false
  mayCreateJobEvent: false
  mayCallProvider: false
  mayMutateSupabase: false
  mayCreateGeneratedAsset: false
  signedUrlInputAllowed: false
  rawPromptExecutionAllowed: false
  serviceRoleKeyAllowed: false
  providerSecretAllowed: false
  publicArtifactUrlAllowed: false
}

export interface WorkerRuntimeSoundAudioFixturePayloadOwnerEntry {
  owner: WorkerRuntimeSoundAudioFixturePayloadOwner
  status: WorkerRuntimeSoundAudioFixturePayloadOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface WorkerRuntimeSoundAudioFixturePayloadAcceptance {
  workstream: 'WORKER_RUNTIME_JOBS'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  relatedSourceWorkstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  mode: WorkerRuntimeSoundAudioFixturePayloadAcceptanceMode
  currentUnlockStage: Extract<WorkerRuntimeSoundAudioFixturePayloadUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    WorkerRuntimeSoundAudioFixturePayloadUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    workerRuntimeDecision: Extract<
      WorkerRuntimeSoundAudioFixturePayloadDecision,
      'conditional_worker_runtime_acceptance_for_future_payload_shape_validation'
    >
    workerRuntimeAllowsFuturePayloadShapeValidation: true
    workerRuntimeAllowsDispatch: false
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    workersDispatched: false
    jobsCreated: false
    jobEventsCreated: false
    workerRuntimeConfigsCreated: false
    claimLeaseExecuted: false
    cloudRunExecuted: false
    dockerExecuted: false
    ffmpegExecuted: false
    providerCallsMade: false
    supabaseMutationPerformed: false
    generatedAssetsCreated: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
  }
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  futurePayloadShapeExpectation: WorkerRuntimeSoundAudioFixturePayloadExpectation
  requiredBeforeWORKER_RUNTIME_SOUND_1: string[]
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
  crossOwnerStatus: WorkerRuntimeSoundAudioFixturePayloadOwnerEntry[]
  recommendedImmediateNextPrompt: 'PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit'
}

const recommendedImmediateNextPrompt =
  'PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit' as const

export const WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE:
  WorkerRuntimeSoundAudioFixturePayloadAcceptance = {
    workstream: 'WORKER_RUNTIME_JOBS',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    relatedSourceWorkstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    mode: 'worker_runtime_payload_acceptance_audit_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      workerRuntimeDecision: 'conditional_worker_runtime_acceptance_for_future_payload_shape_validation',
      workerRuntimeAllowsFuturePayloadShapeValidation: true,
      workerRuntimeAllowsDispatch: false,
      globalGoForSUPABASE_SOUND_4: false,
      reasonGlobalGoBlocked: [
        'SOUND_MUSIC_AUDIO explicit local payload-shape scope acceptance remains missing',
        'PROVIDER_GATEWAY_MODELS no-provider and credential exclusion acceptance remains missing',
        'OBSERVABILITY_AUDIT_COST evidence capture acceptance remains missing',
        'BILLING_STRIPE_CREDITS no-spend acceptance remains missing',
        'TRACK_A_RENDER_EXPORT no-export acceptance remains missing',
        'TRACK_B_MEDIA_PROCESSING no-processing acceptance remains missing',
      ],
    },
    execution: {
      workersDispatched: false,
      jobsCreated: false,
      jobEventsCreated: false,
      workerRuntimeConfigsCreated: false,
      claimLeaseExecuted: false,
      cloudRunExecuted: false,
      dockerExecuted: false,
      ffmpegExecuted: false,
      providerCallsMade: false,
      supabaseMutationPerformed: false,
      generatedAssetsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
    acceptedConditions: [
      'future payload-shape validation only',
      'no worker dispatch',
      'no job creation',
      'no job event creation',
      'no worker runtime config creation',
      'no claim lease execution',
      'approved plan snapshot id required',
      'idempotency key required',
      'timing-aware cue manifest id required',
      'private audio artifact manifest id required',
      'fixture spec id required',
      'raw prompt execution blocked',
      'signed URL input blocked',
      'service role key blocked',
      'provider secret blocked',
      'public artifact URL blocked',
      'generated asset creation blocked',
      'provider calls blocked',
      'Supabase mutation not performed by Worker Runtime in this phase',
    ],
    rejectedOrStillBlocked: [
      'production worker dispatch',
      'local worker dispatch',
      'Cloud Run execution',
      'Docker execution',
      'FFmpeg media execution',
      'provider calls',
      'job row creation',
      'job event row creation',
      'worker runtime config creation',
      'claim lease execution',
      'raw prompt worker execution',
      'signed URL worker inputs',
      'service role keys in payloads',
      'provider secrets in payloads',
      'public artifact URLs in payloads',
      'generated_local_fixture_passed claim',
    ],
    futurePayloadShapeExpectation: {
      workstream: 'SOUND_MUSIC_AUDIO',
      mode: 'audio_fixture_payload_shape_validation_only',
      dryRunRequestId: 'mock-reference-only-dry-run-request-id',
      jobIntentId: 'mock-reference-only-job-intent-id',
      approvedPlanSnapshotId: 'required',
      timingAwareCueManifestId: 'required',
      privateAudioArtifactManifestId: 'required',
      fixtureSpecId: 'required',
      idempotencyKey: 'required',
      providerPolicyRef: 'required',
      runtimeTarget: 'mock_or_local_validation_only',
      expectedArtifactKinds: [],
      qaEvidenceRefs: [],
      mayDispatchWorker: false,
      mayCreateJob: false,
      mayCreateJobEvent: false,
      mayCallProvider: false,
      mayMutateSupabase: false,
      mayCreateGeneratedAsset: false,
      signedUrlInputAllowed: false,
      rawPromptExecutionAllowed: false,
      serviceRoleKeyAllowed: false,
      providerSecretAllowed: false,
      publicArtifactUrlAllowed: false,
    },
    requiredBeforeWORKER_RUNTIME_SOUND_1: [
      'approved payload-shape spec',
      'no-dispatch smoke',
      'no raw prompt test',
      'no signed URL input test',
      'no secret service role provider key test',
      'idempotency key test',
      'approved snapshot reference test',
      'timing private manifest reference test',
      'no job or job event creation test',
      'no runtime config mutation test',
      'cross-owner acceptance status',
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
        owner: 'WORKER_RUNTIME_JOBS',
        status: 'accepted_conditionally',
        evidence: [
          'existing Worker Runtime gates require worker payload shape and idempotency',
          'existing Worker Runtime gates reject raw chat execution',
          'existing production worker gates require approved snapshot and idempotency',
          'existing production worker artifact policy rejects signed URLs raw URLs and forbidden secret-like keys',
          'WORKER-RUNTIME-SOUND-0 records future payload-shape validation only',
        ],
        missingEvidence: [
          'future no-dispatch payload validator smoke',
          'future exact payload schema review',
        ],
      },
      {
        owner: 'SUPABASE_RLS_STORAGE_DATABASE',
        status: 'accepted_conditionally',
        evidence: [
          'SUPABASE-SOUND-3D conditionally accepts future local throwaway non-production SQL validation only',
        ],
        missingEvidence: [
          'future local target name',
          'future command approval',
          'future rollback cleanup confirmation',
        ],
      },
      {
        owner: 'SOUND_MUSIC_AUDIO',
        status: 'missing',
        evidence: [
          'SOUND dry-run contract exists',
          'SOUND generated local fixture spec exists',
          'SOUND fixture handoff packet exists',
          'SOUND owner checklist exists',
        ],
        missingEvidence: [
          'explicit SOUND acceptance that local payload-shape validation remains metadata-only',
          'explicit no generated_local_fixture_passed claim acknowledgement',
        ],
      },
      {
        owner: 'PROVIDER_GATEWAY_MODELS',
        status: 'missing',
        evidence: [
          'planning docs state provider calls and provider credentials are blocked',
        ],
        missingEvidence: [
          'explicit no-provider-call acceptance',
          'provider license fixture boundary acceptance',
          'Lyria music song soundtrack boundary confirmation',
        ],
      },
      {
        owner: 'OBSERVABILITY_AUDIT_COST',
        status: 'missing',
        evidence: [
          'planning docs include local text output and evidence-capture expectations',
        ],
        missingEvidence: [
          'explicit evidence capture acceptance',
          'audit cost placeholder acceptance',
        ],
      },
      {
        owner: 'BILLING_STRIPE_CREDITS',
        status: 'missing',
        evidence: [
          'planning docs state no credit spend reservation refund release or payment operation',
        ],
        missingEvidence: [
          'explicit no-spend local validation acceptance',
          'credit placeholder boundary acceptance',
        ],
      },
      {
        owner: 'TRACK_A_RENDER_EXPORT',
        status: 'missing',
        evidence: [
          'planning docs state Track A final export remains blocked',
        ],
        missingEvidence: [
          'explicit no-export acceptance',
          'timing private manifest handoff boundary acceptance',
        ],
      },
      {
        owner: 'TRACK_B_MEDIA_PROCESSING',
        status: 'missing',
        evidence: [
          'planning docs state Track B media audio processing remains blocked',
        ],
        missingEvidence: [
          'explicit no-processing acceptance',
          'FFmpeg model execution rejection acknowledgement',
        ],
      },
    ],
    recommendedImmediateNextPrompt,
  }
