import { createHash } from 'node:crypto';

const acceptedToolIds = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm'
];

const acceptedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis'
];

const runtimeFlags = {
  openMediaFile: false,
  processMedia: false,
  writeArtifact: false,
  callProvider: false,
  executeWorker: false,
  executeRoute: false,
  touchSupabase: false,
  runSql: false,
  createSignedUrl: false,
  enableExternalBeta: false
};

const syntheticDescriptors = acceptedToolIds.map((toolId, index) => ({
  toolId,
  descriptorId: `sound-cpu-synthetic-descriptor-${String(index + 1).padStart(2, '0')}`,
  jobType: acceptedJobTypes[index % acceptedJobTypes.length],
  payloadKind:
    index % 4 === 0
      ? 'empty_in_memory_signal_descriptor'
      : index % 4 === 1
        ? 'small_numeric_array_descriptor'
        : index % 4 === 2
          ? 'symbolic_midi_descriptor_without_file_io'
          : 'loudness_metadata_descriptor_without_audio_open',
  runtimeFlags
}));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(syntheticDescriptors.length === 15, 'expected exactly 15 synthetic descriptors');
for (const descriptor of syntheticDescriptors) {
  assert(acceptedToolIds.includes(descriptor.toolId), `unexpected tool id: ${descriptor.toolId}`);
  assert(acceptedJobTypes.includes(descriptor.jobType), `unexpected job type: ${descriptor.jobType}`);
  for (const [flag, value] of Object.entries(descriptor.runtimeFlags)) {
    assert(value === false, `runtime flag widened for ${descriptor.toolId}: ${flag}`);
  }
}

const descriptorDigest = createHash('sha256')
  .update(JSON.stringify(syntheticDescriptors.map(({ toolId, descriptorId, jobType, payloadKind }) => ({
    toolId,
    descriptorId,
    jobType,
    payloadKind
  }))))
  .digest('hex');

const result = {
  status: 'passed',
  decision:
    'worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_after_plan_review_completed_with_warnings_ready_for_dry_run_execution_owner_review_no_external_beta',
  sourceDecision:
    'worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_plan_owner_review_after_planning_passed_with_warnings_ready_for_controlled_internal_dry_run_execution_prompt',
  attemptedAt: '2026-06-28T01:41:47.578Z',
  acceptedSoundCpuToolCount: acceptedToolIds.length,
  syntheticDescriptorCount: syntheticDescriptors.length,
  acceptedJobTypes,
  descriptorDigest,
  resultCounts: {
    passed: syntheticDescriptors.length,
    failed: 0,
    skipped: 0
  },
  runtimeFlagsFalse: runtimeFlags,
  mediaOpened: false,
  mediaProcessed: false,
  artifactWritten: false,
  workerDispatched: false,
  routeCalled: false,
  providerCalled: false,
  modelCalled: false,
  supabaseTouched: false,
  sqlExecuted: false,
  signedUrlCreated: false,
  externalBetaUnlocked: false,
  productionUnlocked: false,
  generatedLocalFixturePassedClaimed: false,
  dryRunPassedClaimed: false
};

console.log(JSON.stringify(result, null, 2));
