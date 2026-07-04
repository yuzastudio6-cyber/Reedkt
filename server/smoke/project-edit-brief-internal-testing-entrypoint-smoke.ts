import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'
import {
  createProjectEditSessionBriefPath,
  createProjectEditSessionChatPath,
  createProjectHomePath,
} from '../../src/lib/project-edit-session-navigation'

const root = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-youtube-wide'

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
  'src/styles/internal-testing.css',
  'src/lib/internal-testing-scenarios.ts',
  'docs/project-edit-brief-internal-testing-entrypoint.md',
  'docs/project-edit-brief-internal-testing-entrypoint.json',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const app = read('src/App.tsx')
assert.match(app, /InternalTestingPage/)
assert.match(app, /path="\/internal-testing"/)

const page = read('src/pages/InternalTestingPage.tsx')
assert.match(page, /internalTestingScenarios/)
assert.match(page, /FEEDBACK_STORAGE_KEY/)
assert.match(page, /browser-local feedback/i)
assert.match(page, /No upload/)
assert.match(page, /No provider/)
assert.match(page, /No worker/)
assert.match(page, /No render/)
assert.match(page, /No credits/)
assert.match(page, /No Supabase write/)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const docs = read('docs/project-edit-brief-internal-testing-entrypoint.md')
for (const phrase of [
  'production-shaped',
  '/internal-testing',
  'No upload',
  'No provider/model call',
  'No worker dispatch',
  'No render/export',
  'No credit reservation or spend',
  'No live Supabase',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const docJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  decision?: string
  route?: string
  connectedRoutes?: string[]
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}

assert.equal(docJson.decision, 'project_edit_brief_internal_testing_entrypoint_passed_ready_for_repeated_internal_testing')
assert.equal(docJson.route, '/internal-testing')
assert.ok(docJson.connectedRoutes?.includes(createProjectHomePath(projectId)))
assert.ok(docJson.connectedRoutes?.includes(createProjectEditSessionChatPath(projectId, editSessionId)))
assert.ok(docJson.connectedRoutes?.includes(createProjectEditSessionBriefPath(projectId, editSessionId)))
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.workerDispatch, false)
assert.ok(docJson.validation?.required?.includes('smoke:project-edit-brief-internal-testing-entrypoint'))

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-testing-entrypoint'],
  'tsx server/smoke/project-edit-brief-internal-testing-entrypoint-smoke.ts',
)

const sourceTruth = read('docs/project-edit-brief-source-truth-reconciliation.md')
assert.match(sourceTruth, /Internal testing entrypoint after RP-EDITBRIEF-23/)
assert.match(sourceTruth, /smoke:project-edit-brief-internal-testing-entrypoint/)

const sourceTruthJson = JSON.parse(read('docs/project-edit-brief-source-truth-reconciliation.json')) as {
  landedScope?: string[]
  validation?: { smokesPassed?: string[] }
  remainingGates?: string[]
}
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_entrypoint'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:project-edit-brief-internal-testing-entrypoint'))
assert.ok(sourceTruthJson.remainingGates?.includes('internal_testing_entrypoint_after_rp_editbrief_23'))

const statusCounts = internalTestingScenarios.reduce<Record<string, number>>((counts, scenario) => {
  counts[scenario.status] = (counts[scenario.status] ?? 0) + 1
  return counts
}, {})
assert.ok(internalTestingScenarios.length >= 100)
assert.ok(statusCounts.ready >= 10)
assert.ok(statusCounts.mock_local >= 100)
assert.ok(internalTestingScenarios.some((scenario) => scenario.id === 'feedback-export' && scenario.route === '/internal-testing'))
assert.ok(internalTestingScenarios.some((scenario) => scenario.id === 'edit-brief-plan-prepare-hints'))
assert.ok(internalTestingScenarios.some((scenario) => scenario.route === createProjectEditSessionBriefPath(projectId, editSessionId)))

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-23',
  route: '/internal-testing',
  scenarioCount: internalTestingScenarios.length,
  statusCounts,
  projectHome: createProjectHomePath(projectId),
  editChat: createProjectEditSessionChatPath(projectId, editSessionId),
  editBrief: createProjectEditSessionBriefPath(projectId, editSessionId),
  productionShapedInternalTesting: true,
  productReady: false,
}, null, 2))
