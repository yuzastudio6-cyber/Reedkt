import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  getInternalTestingToolRoutingReadiness,
  INTERNAL_TESTING_TOOL_ROUTING_READINESS_DECISION,
} from '../tool-calling/internal-testing-tool-routing-readiness'
import {
  listProductionToolProfiles,
} from '../tool-registry'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'server/tool-calling/internal-testing-tool-routing-readiness.ts',
  'server/smoke/internal-testing-tool-routing-readiness-smoke.ts',
  'src/lib/internal-testing-tool-routing-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-tool-routing-readiness'],
  'tsx server/smoke/internal-testing-tool-routing-readiness-smoke.ts',
)

const readiness = getInternalTestingToolRoutingReadiness()

assert.equal(readiness.decision, INTERNAL_TESTING_TOOL_ROUTING_READINESS_DECISION)
assert.equal(readiness.source, 'server_production_registry_adapter_route_metadata')
assert.equal(readiness.productReady, false)
assert.equal(readiness.frontendExecutableTools, 0)
assert.ok(readiness.productionRegistryTools >= 50, 'Production registry should remain represented.')
assert.ok(readiness.launchCoreTools > 0, 'Launch-core tool count should be represented.')
assert.ok(readiness.plannedOrFutureTools > 0, 'Planned/future tool count should remain represented.')
assert.equal(readiness.patternSummaries.length, 4, 'Initial internal testing patterns should be summarized.')
assert.ok(readiness.userFacingActivities.length >= 5, 'User-facing edit activities should be summarized.')

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-tool-routing-readiness')
assert.ok(scenario, 'Internal testing tool routing readiness scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

for (const summary of readiness.patternSummaries) {
  assert.ok(summary.plannedStepCount > 0, `${summary.patternId} should have planned steps.`)
  assert.equal(summary.adapterPlanCount, summary.plannedStepCount, `${summary.patternId} should have an adapter plan per step.`)
  assert.equal(summary.workerRouteBridgePlanCount, summary.plannedStepCount, `${summary.patternId} should have a worker route bridge per step.`)
  assert.equal(summary.approvedSnapshotRequired, true)
  assert.equal(summary.rawPromptAllowed, false)
  assert.equal(summary.signedUrlAllowed, false)
  assert.equal(summary.serviceRoleAllowed, false)
  assert.equal(summary.executesTools, false)
  assert.equal(summary.mediaProcessingAllowed, false)
  assert.ok(summary.selectedToolIds.length > 0, `${summary.patternId} should preserve server-side selected tool ids.`)
}

const forbiddenUserFacingTerms = listProductionToolProfiles()
  .flatMap((profile) => [profile.toolId, profile.displayName])
  .filter((term) => term.length > 2)
  .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

const userFacingText = readiness.userFacingActivities
  .flatMap((activity) => [activity.label, activity.summary])
  .join('\n')

for (const term of forbiddenUserFacingTerms) {
  assert.doesNotMatch(
    userFacingText,
    new RegExp(`\\b${term}\\b`, 'i'),
    'User-facing activity summaries must not expose internal tool/package names.',
  )
}

for (const activity of readiness.userFacingActivities) {
  assert.equal(activity.status, 'route_metadata_ready')
  assert.ok(activity.plannedOperationCount > 0, `${activity.activityId} should count planned operations.`)
}

assert.deepEqual(readiness.blockedScope, {
  directFrontendToolExecution: false,
  rawPromptExecution: false,
  publicOrSignedUrlArtifacts: false,
  serviceRoleBrowserAccess: false,
  providerOrModelCalls: false,
  workerDispatch: false,
  mediaProcessing: false,
  renderOrExport: false,
  creditSpend: false,
  ledgerWrites: false,
  supabaseWrites: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
})

const bridgeSource = read('server/tool-calling/internal-testing-tool-routing-readiness.ts')
assert.doesNotMatch(bridgeSource, /execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(bridgeSource, /providerCallMade:\s*true|productReady:\s*true|workerDispatch:\s*true/i)

const uiSource = read('src/lib/internal-testing-tool-routing-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /userFacingToolNamesHidden:\s*true/)
assert.match(pageSource, /internal-testing-tool-routing-readiness/)
assert.match(pageSource, /User-facing names hidden/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-tool-routing-readiness"')
const sectionEnd = pageSource.indexOf('internal-testing-preference-video-limits')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded tool routing readiness section.')
const toolRoutingSection = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(toolRoutingSection, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-tool-routing-readiness',
  decision: readiness.decision,
  productionRegistryTools: readiness.productionRegistryTools,
  launchCoreTools: readiness.launchCoreTools,
  plannedOrFutureTools: readiness.plannedOrFutureTools,
  patternCount: readiness.patternSummaries.length,
  userFacingActivities: readiness.userFacingActivities.map((activity) => activity.activityId),
  productReady: readiness.productReady,
}, null, 2))
