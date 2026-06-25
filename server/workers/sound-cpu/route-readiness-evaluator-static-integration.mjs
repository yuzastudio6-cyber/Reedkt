// SOUND-RUNTIME-MEDIA-GATE-2Q
// Static integration source only. This module may wire in-memory fixture
// records to the static evaluator, but it must not import route resolvers,
// execute routes, dispatch workers, open media, or claim runtime readiness.

import {
  SOUND_CPU_ROUTE_READINESS_CLOSED_CLAIMS,
  SOUND_CPU_ROUTE_READINESS_FORBIDDEN_RUNTIME_FLAGS,
  evaluateSoundCpuRouteReadinessFixtures,
} from './route-readiness-evaluator.mjs'

export const REEDITPRO_SOUND_CPU_ROUTE_READINESS_STATIC_INTEGRATION_GATE = 'SOUND-RUNTIME-MEDIA-GATE-2Q'

export const SOUND_CPU_ROUTE_READINESS_STATIC_FIXTURES = Object.freeze([
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-package-import-smoke-accepted',
    routeId: 'sound-cpu-analysis-worker.package-import-smoke',
    routeCategory: 'sound_cpu_analysis',
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    jobType: 'sound.package_import_smoke',
    expectedOutcome: 'accepted',
    rejectedPayloadFields: Object.freeze(['rawPrompt', 'mediaFilePath', 'signedUrl', 'serviceRolePayload']),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-numeric-array-analysis-accepted',
    routeId: 'sound-cpu-analysis-worker.numeric-array-analysis',
    routeCategory: 'sound_cpu_analysis',
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    jobType: 'sound.numeric_array_analysis',
    expectedOutcome: 'accepted',
    rejectedPayloadFields: Object.freeze(['providerOutputBlob', 'modelWeightLocation', 'artifactWriteTarget']),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-symbolic-midi-analysis-accepted',
    routeId: 'sound-audio-metadata-worker.symbolic-midi-analysis',
    routeCategory: 'sound_audio_metadata',
    workerName: 'sound-audio-metadata-worker',
    imageName: 'reeditpro/sound-audio-metadata-worker',
    jobType: 'sound.symbolic_midi_analysis',
    expectedOutcome: 'accepted',
    rejectedPayloadFields: Object.freeze(['ffmpegInput', 'supabaseRow', 'publicArtifactUrl']),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-loudness-synthetic-analysis-accepted',
    routeId: 'sound-audio-metadata-worker.loudness-synthetic-analysis',
    routeCategory: 'sound_audio_metadata',
    workerName: 'sound-audio-metadata-worker',
    imageName: 'reeditpro/sound-audio-metadata-worker',
    jobType: 'sound.loudness_synthetic_analysis',
    expectedOutcome: 'accepted',
    rejectedPayloadFields: Object.freeze(['cloudRunJob', 'workerExecutionLease', 'billingMutation']),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-mismatch-route-worker',
    routeId: 'sound-cpu-analysis-worker.package-import-smoke',
    routeCategory: 'mismatch',
    workerName: 'sound-audio-metadata-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    jobType: 'sound.package_import_smoke',
    expectedOutcome: 'mismatch',
    rejectedPayloadFields: Object.freeze([]),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-mismatch-image-worker',
    routeId: 'sound-cpu-analysis-worker.numeric-array-analysis',
    routeCategory: 'mismatch',
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-audio-metadata-worker',
    jobType: 'sound.numeric_array_analysis',
    expectedOutcome: 'mismatch',
    rejectedPayloadFields: Object.freeze([]),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-mismatch-job-type',
    routeId: 'sound-audio-metadata-worker.symbolic-midi-analysis',
    routeCategory: 'mismatch',
    workerName: 'sound-audio-metadata-worker',
    imageName: 'reeditpro/sound-audio-metadata-worker',
    jobType: 'sound.package_import_smoke',
    expectedOutcome: 'mismatch',
    rejectedPayloadFields: Object.freeze([]),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-mismatch-route-category',
    routeId: 'sound-audio-metadata-worker.loudness-synthetic-analysis',
    routeCategory: 'mismatch',
    workerName: 'sound-audio-metadata-worker',
    imageName: 'reeditpro/sound-audio-metadata-worker',
    jobType: 'sound.loudness_synthetic_analysis',
    expectedOutcome: 'mismatch',
    rejectedPayloadFields: Object.freeze([]),
  }),
  Object.freeze({
    fixtureCaseId: 'sound-cpu-route-mismatch-disabled-readiness',
    routeId: 'sound-cpu-analysis-worker.package-import-smoke',
    routeCategory: 'mismatch',
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    jobType: 'sound.package_import_smoke',
    expectedOutcome: 'mismatch',
    rejectedPayloadFields: Object.freeze([]),
  }),
])

export function evaluateSoundCpuStaticRouteReadinessIntegration() {
  const evaluatorSummary = evaluateSoundCpuRouteReadinessFixtures(SOUND_CPU_ROUTE_READINESS_STATIC_FIXTURES)

  return Object.freeze({
    gate: REEDITPRO_SOUND_CPU_ROUTE_READINESS_STATIC_INTEGRATION_GATE,
    evaluatorSummary,
    fixtureCount: SOUND_CPU_ROUTE_READINESS_STATIC_FIXTURES.length,
    readinessClaim: false,
    runtimeFlags: SOUND_CPU_ROUTE_READINESS_FORBIDDEN_RUNTIME_FLAGS,
    closedClaims: SOUND_CPU_ROUTE_READINESS_CLOSED_CLAIMS,
  })
}
