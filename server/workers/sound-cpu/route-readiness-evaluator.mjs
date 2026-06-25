// SOUND-RUNTIME-MEDIA-GATE-2O
// Static source only. This module must not import route resolvers, execute
// routes, dispatch workers, open media, or claim runtime readiness.

export const REEDITPRO_SOUND_CPU_ROUTE_READINESS_EVALUATOR_GATE = 'SOUND-RUNTIME-MEDIA-GATE-2O'

export const SOUND_CPU_ROUTE_READINESS_EXPECTED_COUNTS = Object.freeze({
  routeContractCount: 4,
  acceptedFixtureCount: 4,
  rejectedPayloadFieldCount: 14,
  mismatchCaseCount: 5,
})

export const SOUND_CPU_ROUTE_READINESS_FORBIDDEN_RUNTIME_FLAGS = Object.freeze({
  routeResolverImported: false,
  routeExecutionRun: false,
  serverRouteExecuted: false,
  workerDispatchRun: false,
  workerExecutionRun: false,
  toolExecutionRun: false,
  mediaProcessingRun: false,
  ffmpegOrFfprobeRun: false,
  dockerBuildRun: false,
  dockerPushRun: false,
  dockerRun: false,
  gcpOrCloudRunCalled: false,
  supabaseOrSqlRun: false,
  artifactCreated: false,
  signedOrPublicUrlCreated: false,
  providerOrModelCalled: false,
})

export const SOUND_CPU_ROUTE_READINESS_CLOSED_CLAIMS = Object.freeze({
  routeReadiness: false,
  workerReadiness: false,
  runtimeReadiness: false,
  mediaReadiness: false,
  generatedLocalFixturePassed: false,
  dryRunPassed: false,
  betaReadiness: false,
  productionReadiness: false,
})

export function evaluateSoundCpuRouteReadinessFixtures(records = []) {
  if (!Array.isArray(records)) {
    throw new TypeError('records must be an array of static fixture records')
  }

  const routeIds = new Set()
  let acceptedFixtureCount = 0
  let rejectedPayloadFieldCount = 0
  let mismatchCaseCount = 0

  for (const record of records) {
    if (!record || typeof record !== 'object') continue
    if (typeof record.routeId === 'string' && record.routeId.length > 0) {
      routeIds.add(record.routeId)
    }
    if (record.expectedOutcome === 'accepted') acceptedFixtureCount += 1
    if (Array.isArray(record.rejectedPayloadFields)) {
      rejectedPayloadFieldCount += record.rejectedPayloadFields.length
    }
    if (record.expectedOutcome === 'mismatch') mismatchCaseCount += 1
  }

  return summarizeSoundCpuRouteReadiness({
    routeContractCount: routeIds.size,
    acceptedFixtureCount,
    rejectedPayloadFieldCount,
    mismatchCaseCount,
  })
}

export function summarizeSoundCpuRouteReadiness(counts = {}) {
  return Object.freeze({
    gate: REEDITPRO_SOUND_CPU_ROUTE_READINESS_EVALUATOR_GATE,
    counts: Object.freeze({
      routeContractCount: Number(counts.routeContractCount ?? 0),
      acceptedFixtureCount: Number(counts.acceptedFixtureCount ?? 0),
      rejectedPayloadFieldCount: Number(counts.rejectedPayloadFieldCount ?? 0),
      mismatchCaseCount: Number(counts.mismatchCaseCount ?? 0),
    }),
    expectedCounts: SOUND_CPU_ROUTE_READINESS_EXPECTED_COUNTS,
    matchesExpectedStaticShape:
      Number(counts.routeContractCount ?? 0) === SOUND_CPU_ROUTE_READINESS_EXPECTED_COUNTS.routeContractCount &&
      Number(counts.acceptedFixtureCount ?? 0) === SOUND_CPU_ROUTE_READINESS_EXPECTED_COUNTS.acceptedFixtureCount &&
      Number(counts.rejectedPayloadFieldCount ?? 0) === SOUND_CPU_ROUTE_READINESS_EXPECTED_COUNTS.rejectedPayloadFieldCount &&
      Number(counts.mismatchCaseCount ?? 0) === SOUND_CPU_ROUTE_READINESS_EXPECTED_COUNTS.mismatchCaseCount,
    readinessClaim: false,
    runtimeFlags: SOUND_CPU_ROUTE_READINESS_FORBIDDEN_RUNTIME_FLAGS,
    closedClaims: SOUND_CPU_ROUTE_READINESS_CLOSED_CLAIMS,
  })
}
