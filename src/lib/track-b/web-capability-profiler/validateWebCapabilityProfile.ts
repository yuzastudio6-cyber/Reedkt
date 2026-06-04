import type { WebCapabilityFixture, WebCapabilityFixtureResult, WebCapabilityProfile } from './webCapabilityProfileTypes'
import { normalizeWebCapabilityProfile } from './normalizeWebCapabilityProfile'

export function validateWebCapabilityProfile(profile: WebCapabilityProfile): string[] {
  const blockers: string[] = []
  if (profile.schemaVersion !== profile.capabilityBuckets.policy.profileSchemaVersion) blockers.push('schema_version_mismatch')
  if (profile.capabilityBuckets.policy.allowedForWorkerExecution !== false) blockers.push('worker_execution_allowed')
  if (profile.capabilityBuckets.policy.allowedForCostEstimator !== false) blockers.push('cost_estimator_allowed')
  if (profile.capabilityBuckets.network.noSpeedTest !== true) blockers.push('network_speed_test_enabled')
  if (profile.capabilityBuckets.network.noEndpointPing !== true) blockers.push('endpoint_ping_enabled')
  if (!profile.privacyMode.includes('no_identifiers')) blockers.push('identifier_policy_missing')
  if (!profile.privacyMode.includes('no_persistence')) blockers.push('persistence_policy_missing')
  return blockers
}

export function runWebCapabilityFixture(fixture: WebCapabilityFixture): WebCapabilityFixtureResult {
  const profile = normalizeWebCapabilityProfile(fixture.rawSignals, {
    collectionMode: 'fixture_mock',
    generatedAt: '2026-06-04T00:00:00.000Z',
  })
  const missingExpectedHints = fixture.expectedHints.filter((hint) => !profile.routePlanningHints.includes(hint))
  const missingExpectedWarnings = fixture.expectedWarnings.filter((warning) => !profile.warnings.includes(warning))
  const missingExpectedBlockedReasons = fixture.expectedBlockedReasons.filter((reason) => !profile.blockedReasons.includes(reason))
  const profileBlockers = validateWebCapabilityProfile(profile)
  const blockers = [...missingExpectedHints, ...missingExpectedWarnings, ...missingExpectedBlockedReasons, ...profileBlockers]
  return {
    fixtureId: fixture.fixtureId,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    profile,
    missingExpectedHints,
    missingExpectedWarnings,
    missingExpectedBlockedReasons,
  }
}

export function runWebCapabilityFixtures(fixtures: WebCapabilityFixture[]): WebCapabilityFixtureResult[] {
  return fixtures.map((fixture) => runWebCapabilityFixture(fixture))
}
