import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'src/pages/PreferencesPage.tsx',
  'docs/project-edit-brief-internal-testing-entrypoint.md',
  'docs/project-edit-brief-internal-testing-entrypoint.json',
  'docs/edit-preferences-route-entrypoint.md',
]

requiredFiles.forEach(assertFile)

const scenario = internalTestingScenarios.find((item) => item.id === 'preference-video-mock-only-limits')
assert.ok(scenario, 'preference-video-mock-only-limits scenario should exist')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const statusCounts = internalTestingScenarios.reduce<Record<string, number>>((counts, item) => {
  counts[item.status] = (counts[item.status] ?? 0) + 1
  return counts
}, {})
assert.equal(statusCounts.blocked ?? 0, 0)

const page = read('src/pages/InternalTestingPage.tsx')
for (const phrase of [
  'internal-testing-preference-video-limits',
  'Preference Video limits',
  'Mock-local Preference DNA',
  'Open /edit-preferences',
  'does not authorize real reference media analysis',
  'Supabase persistence',
  'product-ready behavior',
]) {
  assert.match(page, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const docs = read('docs/project-edit-brief-internal-testing-entrypoint.md')
for (const phrase of [
  'Preference Video Limits Closeout',
  'preference-video-mock-only-limits',
  'mock_local',
  '/edit-preferences',
  'does not authorize reference upload',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const docJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  connectedRoutes?: string[]
  features?: string[]
  scenarioStatus?: Record<string, string | number>
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}
assert.ok(docJson.connectedRoutes?.includes('/edit-preferences'))
assert.ok(docJson.features?.includes('preference_video_mock_limits_closeout'))
assert.equal(docJson.scenarioStatus?.['preference-video-mock-only-limits'], 'mock_local')
assert.equal(docJson.scenarioStatus?.blockedScenarioCount, 0)
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.ok(docJson.validation?.required?.includes('smoke:preference-video-mock-limits-internal-testing-closeout'))

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:preference-video-mock-limits-internal-testing-closeout'],
  'tsx server/smoke/preference-video-mock-limits-internal-testing-closeout-smoke.ts',
)

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-PREFVIDEO-LIMITS-01',
  scenario: scenario.id,
  status: scenario.status,
  blockedScenarioCount: statusCounts.blocked ?? 0,
  route: scenario.route,
  editPreferencesRouteMounted: true,
  productReady: false,
}, null, 2))
