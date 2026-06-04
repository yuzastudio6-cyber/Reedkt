import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildMapGeospatialArtifactPrivacyAudit,
  buildMapGeospatialDependencyAudit,
  buildMapGeospatialFailurePolicy,
  buildMapGeospatialOwnershipAudit,
  buildMapGeospatialProviderDataAudit,
  buildMapGeospatialReadinessCommandPlan,
  buildMapGeospatialReadinessIamPlan,
  buildMapGeospatialReadinessQaSummary,
  buildMapGeospatialReadinessReport,
  buildMapGeospatialReadinessScopeManifest,
  buildArtifactVerificationEntries,
  mapGeospatialReadinessConfig,
  mapGeospatialReadinessRequiredDocs,
  mapGeospatialReadinessRequiredScripts,
  mapGeospatialReadinessSafetyFlags,
  resolveMapGeospatialEvidenceChain,
} from '../activation/map-geospatial-readiness'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string>; dependencies: Record<string, string> }
const evidenceChain = resolveMapGeospatialEvidenceChain()
const providerDataAudit = buildMapGeospatialProviderDataAudit()
const dependencyAudit = buildMapGeospatialDependencyAudit()
const ownershipAudit = buildMapGeospatialOwnershipAudit()
const artifactVerification = buildArtifactVerificationEntries(evidenceChain).map((entry) => ({ ...entry, exists: true }))
const artifactPrivacyAudit = buildMapGeospatialArtifactPrivacyAudit(artifactVerification)
const failurePolicy = buildMapGeospatialFailurePolicy()
const qa = buildMapGeospatialReadinessQaSummary({
  evidenceChain,
  providerDataAudit,
  dependencyAudit,
  ownershipAudit,
  artifactPrivacyAudit,
  failurePolicy,
  docsPresent: true,
  scriptsPresent: true,
})
const scopeManifest = buildMapGeospatialReadinessScopeManifest({
  runId: 'phase50g-smoke',
  ready: qa.status === 'passed',
  providerDataAudit,
  ownershipAudit,
  artifactPrivacyAudit,
  failurePolicy,
})
const commandPlan = buildMapGeospatialReadinessCommandPlan()
const iamPlan = buildMapGeospatialReadinessIamPlan()
const report = buildMapGeospatialReadinessReport()

assert.equal(mapGeospatialReadinessConfig.phase, '50G')
assert.equal(mapGeospatialReadinessConfig.mode, 'map_geospatial_internal_readiness_gate')
assert.equal(mapGeospatialReadinessConfig.canonicalPhase49PRunId, 'phase49p-20260603T21361')
assert.equal(mapGeospatialReadinessConfig.canonicalPhase50FRunId, 'phase50f-20260604T141223')
assert.equal(mapGeospatialReadinessSafetyFlags.readinessAuditOnly, true)
assert.equal(mapGeospatialReadinessSafetyFlags.newMapRenderingAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.newPlaywrightCaptureAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.liveTileProviderAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.publicOsmTileAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.liveGeocodingAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.liveRoutingAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.paidMapProviderAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.cesiumIonAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.d3RuntimeAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.threeJsRuntimeAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.productionReadyAllowed, false)
assert.equal(mapGeospatialReadinessSafetyFlags.externalBetaAllowed, false)

for (const script of mapGeospatialReadinessRequiredScripts) {
  assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
}
for (const doc of mapGeospatialReadinessRequiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

assert.equal(evidenceChain.evidenceStatus, 'ready')
for (const phase of ['49P', '50A', '50B', '50C', '50D', '50E', '50F']) {
  assert.equal(evidenceChain.phases.some((entry) => entry.phase === phase), true, `Missing evidence phase ${phase}`)
}
assert.equal(dependencyAudit.expectedPresent.find((entry) => entry.packageName === '@turf/turf')?.present, true)
assert.equal(dependencyAudit.expectedPresent.find((entry) => entry.packageName === 'maplibre-gl')?.present, true)
assert.equal(dependencyAudit.expectedPresent.find((entry) => entry.packageName === '@deck.gl/core')?.present, true)
assert.equal(dependencyAudit.expectedPresent.find((entry) => entry.packageName === 'cesium')?.present, true)
assert.equal(dependencyAudit.expectedAbsentOrInactive.find((entry) => entry.packageName === 'd3')?.present, false)
assert.equal(dependencyAudit.expectedAbsentOrInactive.find((entry) => entry.packageName === 'three')?.present, false)
assert.equal(providerDataAudit.liveTileProviderAllowed, false)
assert.equal(providerDataAudit.publicOsmTileAllowed, false)
assert.equal(providerDataAudit.liveGeocodingAllowed, false)
assert.equal(providerDataAudit.liveRoutingAllowed, false)
assert.equal(providerDataAudit.cesiumIonAllowed, false)
assert.equal(ownershipAudit.sharpOwnershipPreserved, true)
assert.equal(ownershipAudit.d3ThreeOwnershipPreserved, true)
assert.equal(failurePolicy.failClosed, true)
assert.equal(artifactPrivacyAudit.privateGcsOnly, true)
assert.equal(qa.status, 'passed')
for (const gateId of ['phase_evidence_chain', 'maplibre_ready', 'turf_ready', 'deckgl_ready', 'cesiumjs_ready', 'web_search_map_e2e_ready', 'provider_data_policy', 'network_artifact_privacy', 'ownership_boundaries', 'failure_policy', 'readiness_docs_consistency', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing gate ${gateId}`)
}
assert.equal(scopeManifest.mapGeospatialInternalTestingReady, true)
assert.equal(scopeManifest.productionReadyAllowed, false)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.includes('live tile requests'), true)
assert.equal(commandPlan.blockedAlways.includes('D3 runtime'), true)
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(report.reportId, 'activation-phase-50g-map-geospatial-readiness')

console.log('Phase 50G map/geospatial internal readiness smoke passed.')
