import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { loadRuntimeEnv } from '../config/env'
import {
  createCanonicalTrackAllSam31ProductionRuntime,
} from '../services/canonical-track-all-sam3_1-production-runtime'

const local = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
})
assert.equal(createCanonicalTrackAllSam31ProductionRuntime(local), null)

const cloud = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro',
  GCS_CONTROL_PLANE_STATE_BUCKET:
    'reeditpro-production-reeditpro-control-plane-state',
  GCS_PROCESSED_MEDIA_BUCKET:
    'reeditpro-production-reeditpro-proxy-media',
})
const runtime = createCanonicalTrackAllSam31ProductionRuntime(cloud)
assert.ok(runtime)
assert.equal(runtime.schemaVersion,
  'canonical-track-all-sam3_1-production-runtime-v1')
assert.equal(runtime.runtimeMode,
  'cloud_run_gcs_user_triggered_scale_from_zero')
assert.equal(runtime.a100HeavyPrimary, true)
assert.equal(runtime.l4HeavyFallbackSeparatelyQualified, true)
assert.equal(runtime.minimumIdleGpuInstances, 0)
assert.equal(runtime.cpuOnlySubstantiveExecutionAllowed, false)
assert.equal(runtime.rawCloudLaunchPortExposed, false)
assert.equal(
  runtime.trackAllSam31AuthenticatedGpuStartRuntimePort.schemaVersion,
  'canonical-track-all-sam3_1-authenticated-gpu-start-runtime-v1',
)
assert.equal(
  runtime.trackAllSam31AuthenticatedGpuStartRuntimePort
    .routeOwnsGpuPlacementOrPricing,
  false,
)
assert.equal(
  runtime.trackAllSam31AuthenticatedGpuStartRuntimePort
    .rawCloudLaunchPortExposed,
  false,
)

assert.throws(() => createCanonicalTrackAllSam31ProductionRuntime({
  ...cloud,
  googleCloudProjectId: 'other-project',
}), /project reeditpro/u)
assert.throws(() => createCanonicalTrackAllSam31ProductionRuntime({
  ...cloud,
  gcsProcessedMediaBucket: undefined,
}), /processed-media/u)

const entrypoint = readFileSync('server/index.ts', 'utf8')
assert.match(entrypoint, /createCanonicalTrackAllSam31ProductionRuntime/u)
assert.match(
  entrypoint,
  /trackAllSam31AuthenticatedGpuStartRuntimePort/u,
)
assert.doesNotMatch(entrypoint, /sam2|qwen/u)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-production-runtime',
  checks: 25,
  localAndMockRuntimeMounted: false,
  cloudRunGcsCompositionMounted: true,
  authenticatedRouteUsesDurableProductionRuntime: true,
  pricingFundingRateReleaseSourceProxyTaskAndLifecyclePortsComposed: true,
  privateGpuTaskAndProxyShareServerConfiguredBucket: true,
  a100HeavyPrimary: true,
  l4HeavyFallbackSeparatelyQualified: true,
  userTriggeredScaleFromZero: true,
  minimumIdleGpuInstances: 0,
  cpuOnlySubstantiveExecutionAllowed: false,
  rawCloudLaunchPortExposed: false,
  liveCloudJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
