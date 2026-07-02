export const SOUND_MUSIC_AUDIO_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT_NEXT_PROMPT =
  'SOUND-RUNTIME-MEDIA-GATE-NEXT: accept real provider, worker, storage, QA, billing, Track A/B, and export execution before any Sound runtime path' as const

export const SOUND_MUSIC_AUDIO_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT = {
  workstream: 'SOUND_MUSIC_AUDIO',
  toolId: 'sound_music_audio',
  registryToolId: 'sound_music_audio',
  mode: 'sound_music_audio_external_agent_wrapper_blocked_result',
  decision: 'sound_music_audio_external_agent_wrapper_blocked_evidence_review_result_recorded',
  wrapperCommand: {
    command: 'npm run external-agent-tool-execute-sound -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW',
    confirmationEnvRequiredValue: 'true',
    verifiesSoundOssArchiveDiagnosticsBeforeAnyRuntime: true,
    verifiesSoundRuntimeRouteSourceDiagnosticsBeforeAnyRuntime: true,
    blocksBeforeProviderWorkerStorageMediaOrExport: true,
  },
  reviewedResult: {
    wrapperMode: 'external_agent_sound_execution_evidence_review_result',
    wrapperStatus: 'blocked',
    soundOssDiagnosticsPassed: true,
    soundRuntimeRouteDiagnosticsPassed: true,
    soundRuntimeRouteStatus: 'sound_runtime_media_gate_2f_diagnostics_passed',
    soundRuntimeRouteDecision:
      'sound_runtime_media_gate_2f_controlled_synthetic_route_source_validation_passed_with_warnings_ready_for_validation_owner_review',
    sourceImported: false,
    workerExecutionRun: false,
    routeExecutionRun: false,
    supabaseTouchedByDiagnostics: false,
  },
  blockers: [
    'sound_metadata_only_runtime_execution_not_accepted',
    'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
  ],
  requiredFutureHandoffs: [
    'PROVIDER_GATEWAY_MODELS',
    'WORKER_RUNTIME_JOBS',
    'SUPABASE_RLS_STORAGE_DATABASE',
    'TRACK_A_RENDER_EXPORT',
    'TRACK_B_MEDIA_PROCESSING',
    'OBSERVABILITY_AUDIT_COST',
    'BILLING_STRIPE_CREDITS',
  ],
  runtimeResult: {
    runtimeRunNow: false,
    providerCallsMade: false,
    workersDispatched: false,
    mediaProcessingRun: false,
    ffmpegRun: false,
    ffprobeRun: false,
    generatedAudioCreated: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: false,
    creditMutationCreated: false,
    qaRowsCreated: false,
    billingRowsCreated: false,
    trackAFinalExportRun: false,
    trackBProcessingRun: false,
    betaUnlocked: false,
    productionUnlocked: false,
    paidProductionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: SOUND_MUSIC_AUDIO_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT_NEXT_PROMPT,
} as const

export type SoundMusicAudioExternalAgentWrapperBlockedResult =
  typeof SOUND_MUSIC_AUDIO_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT
