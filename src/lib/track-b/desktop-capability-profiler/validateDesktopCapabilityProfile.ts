import { normalizeDesktopCapabilityProfile } from './normalizeDesktopCapabilityProfile'
import type { DesktopCapabilityFixture, DesktopCapabilityFixtureResult, DesktopCapabilityProfile } from './desktopCapabilityProfileTypes'

export function validateDesktopCapabilityProfile(profile: DesktopCapabilityProfile): string[] {
  const blockers: string[] = []
  if (profile.schemaVersion !== profile.capabilityBuckets.policy.profileSchemaVersion) blockers.push('schema_version_mismatch')
  if (profile.capabilityBuckets.policy.allowedForWorkerExecution !== false) blockers.push('worker_execution_allowed')
  if (profile.capabilityBuckets.policy.allowedForCostEstimator !== false) blockers.push('cost_estimator_allowed')
  if (profile.capabilityBuckets.policy.liveProfileUploadAllowed !== false) blockers.push('live_profile_upload_allowed')
  if (profile.capabilityBuckets.storage.directoryScanning !== false) blockers.push('directory_scanning_enabled')
  if (profile.capabilityBuckets.storage.pathListCollection !== false) blockers.push('path_list_collection_enabled')
  if (profile.capabilityBuckets.graphics.exactGpuIdentityPersisted !== false) blockers.push('exact_gpu_identity_persisted')
  if (!profile.privacyMode.includes('no_identifiers')) blockers.push('identifier_policy_missing')
  if (!profile.privacyMode.includes('no_persistence')) blockers.push('persistence_policy_missing')
  if (!profile.privacyMode.includes('redacted')) blockers.push('redaction_policy_missing')
  return blockers
}

export function runDesktopCapabilityFixture(fixture: DesktopCapabilityFixture): DesktopCapabilityFixtureResult {
  const profile = normalizeDesktopCapabilityProfile(fixture.rawSignals, {
    collectionMode: 'fixture_mock',
    generatedAt: '2026-06-04T00:00:00.000Z',
  })
  const missingExpectedHints = fixture.expectedHints.filter((hint) => !profile.routePlanningHints.includes(hint))
  const missingExpectedWarnings = fixture.expectedWarnings.filter((warning) => !profile.warnings.includes(warning))
  const missingExpectedBlockedReasons = fixture.expectedBlockedReasons.filter((reason) => !profile.blockedReasons.includes(reason))
  const profileBlockers = validateDesktopCapabilityProfile(profile)
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

export function runDesktopCapabilityFixtures(fixtures: DesktopCapabilityFixture[]): DesktopCapabilityFixtureResult[] {
  return fixtures.map((fixture) => runDesktopCapabilityFixture(fixture))
}
