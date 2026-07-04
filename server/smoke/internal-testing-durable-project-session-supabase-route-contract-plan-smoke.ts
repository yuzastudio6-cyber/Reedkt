import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_SCENARIO_ID,
  getDurableProjectSessionSupabaseRouteContractPlan,
} from '../../src/lib/project-session-supabase-route-contract-plan'
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
  'src/lib/project-session-supabase-route-contract-plan.ts',
  'docs/internal-testing-durable-project-session-supabase-route-contract-plan.md',
  'docs/internal-testing-durable-project-session-supabase-route-contract-plan.json',
  'server/smoke/internal-testing-durable-project-session-supabase-route-contract-plan-smoke.ts',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.md',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.json',
  'server/smoke/internal-testing-durable-project-session-supabase-schema-rls-draft-smoke.ts',
  'docs/internal-testing-durable-project-session-backend-readback-qa.md',
  'docs/internal-testing-durable-project-session-backend-readback-qa.json',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'scripts/validation/internal-testing-qa-runner.mjs',
  'docs/internal-testing-qa-wrapper.md',
  'docs/internal-testing-qa-wrapper.json',
  'server/smoke/internal-testing-qa-wrapper-smoke.ts',
  'server/smoke/project-edit-brief-internal-testing-entrypoint-smoke.ts',
  'docs/project-edit-brief-internal-testing-entrypoint.md',
  'docs/project-edit-brief-internal-testing-entrypoint.json',
  'docs/project-edit-brief-source-truth-reconciliation.md',
  'docs/project-edit-brief-source-truth-reconciliation.json',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-durable-project-session-supabase-route-contract-plan'],
  'tsx server/smoke/internal-testing-durable-project-session-supabase-route-contract-plan-smoke.ts',
)

const plan = getDurableProjectSessionSupabaseRouteContractPlan()
assert.equal(plan.decision, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION)
assert.equal(plan.scenarioId, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_SCENARIO_ID)
assert.equal(plan.currentMode, 'contract_plan_only')
assert.equal(plan.nextMode, 'schema_rls_draft')
assert.equal(plan.durableSupabaseAccessAllowed, false)
assert.equal(plan.productReady, false)
assert.equal(plan.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE)
assert.equal(plan.routeFamilies.length, 3)
assert.ok(plan.routeFamilies.some((route) => route.routeFamily === 'project_home' && route.accessChain.includes('workspace_members')))
assert.ok(plan.routeFamilies.some((route) => route.routeFamily === 'project_edit_session' && route.accessChain.includes('edit_sessions.project_id')))
assert.ok(plan.routeFamilies.some((route) => route.routeFamily === 'project_edit_brief' && route.accessChain.includes('edit_sessions.project_id')))
assert.ok(plan.requiredDataApiGrants.includes('schema_usage_granted_to_authenticated'))
assert.ok(plan.requiredDataApiGrants.includes('no_mutation_grants_until_write_route_contracts_are_separately_approved'))
assert.ok(plan.rlsPolicyIntents.some((policy) => policy.table === 'workspace_members' && policy.predicate.includes('auth.uid()')))
assert.ok(plan.rlsPolicyIntents.some((policy) => policy.table === 'edit_sessions' && policy.predicate.includes('workspace_members')))
assert.equal(plan.blockedScope.supabaseMigration, false)
assert.equal(plan.blockedScope.supabaseDataApiRead, false)
assert.equal(plan.blockedScope.supabaseRouteImplementation, false)
assert.equal(plan.blockedScope.rlsPolicyApplied, false)
assert.equal(plan.blockedScope.dataApiGrantApplied, false)
assert.equal(plan.blockedScope.liveRouteRead, false)
assert.equal(plan.blockedScope.liveRouteWrite, false)
assert.equal(plan.blockedScope.serviceRoleInBrowser, false)
assert.equal(plan.blockedScope.productReady, false)

const planSource = read('src/lib/project-session-supabase-route-contract-plan.ts')
for (const source of [planSource]) {
  assert.doesNotMatch(source, /createClient|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|supabase\.rpc/i)
}

const docJson = JSON.parse(read('docs/internal-testing-durable-project-session-supabase-route-contract-plan.json')) as {
  decision?: string
  scenarioId?: string
  currentMode?: string
  nextMode?: string
  routeFamilies?: Array<{ routeFamily?: string; accessChain?: string; futureRouteDataTables?: string[] }>
  requiredDataApiGrants?: string[]
  rlsPolicyIntents?: Array<{ table?: string; predicate?: string }>
  blockedScope?: Record<string, boolean>
  durableSupabaseAccessAllowed?: boolean
  productReady?: boolean
  validation?: { required?: string[] }
  nextGate?: string
}
assert.equal(docJson.decision, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION)
assert.equal(docJson.scenarioId, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_SCENARIO_ID)
assert.equal(docJson.currentMode, 'contract_plan_only')
assert.equal(docJson.nextMode, 'schema_rls_draft')
assert.ok(docJson.routeFamilies?.some((route) => route.routeFamily === 'project_edit_brief' && route.futureRouteDataTables?.includes('edit_briefs')))
assert.ok(docJson.requiredDataApiGrants?.includes('schema_usage_granted_to_authenticated'))
assert.ok(docJson.rlsPolicyIntents?.some((policy) => policy.table === 'projects' && policy.predicate?.includes('workspace_members')))
assert.equal(docJson.blockedScope?.supabaseMigration, false)
assert.equal(docJson.blockedScope?.supabaseSchemaDraftApplied, false)
assert.equal(docJson.blockedScope?.liveRouteRead, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.durableSupabaseAccessAllowed, false)
assert.equal(docJson.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-route-contract-plan'))
assert.equal(docJson.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE)

const docMd = read('docs/internal-testing-durable-project-session-supabase-route-contract-plan.md')
for (const phrase of [
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION,
  'Project Home',
  'Project Edit Session',
  'Project Edit Brief',
  'explicit Data API grants',
  'authenticated-role RLS',
  'workspace_members',
  'edit_sessions.project_id',
  'No Supabase migration',
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE,
]) {
  assert.match(docMd, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const runner = read('scripts/validation/internal-testing-qa-runner.mjs')
assert.match(runner, /smoke:internal-testing-durable-project-session-supabase-route-contract-plan/)

const wrapperJson = JSON.parse(read('docs/internal-testing-qa-wrapper.json')) as { smokes?: string[] }
assert.ok(wrapperJson.smokes?.includes('smoke:internal-testing-durable-project-session-supabase-route-contract-plan'))

const wrapperMd = read('docs/internal-testing-qa-wrapper.md')
assert.match(wrapperMd, /Durable project\/session Supabase route contract plan/i)

const page = read('src/pages/InternalTestingPage.tsx')
assert.match(page, /internal-testing-durable-project-session-supabase-route-contract-plan/)
assert.match(page, /DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION/)
assert.match(page, /schema\/RLS draft/i)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const entrypointJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  features?: string[]
  scenarioStatus?: Record<string, string | number>
  validation?: { required?: string[] }
}
assert.ok(entrypointJson.features?.includes('durable_project_session_supabase_route_contract_plan'))
assert.equal(entrypointJson.scenarioStatus?.['durable-project-session-supabase-route-contract-plan'], 'mock_local')
assert.ok(entrypointJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-route-contract-plan'))

const entrypointMd = read('docs/project-edit-brief-internal-testing-entrypoint.md')
assert.match(entrypointMd, /Durable Project Session Supabase Route Contract Plan/i)
assert.match(entrypointMd, /durable-project-session-supabase-route-contract-plan/)

const sourceTruthMd = read('docs/project-edit-brief-source-truth-reconciliation.md')
assert.match(sourceTruthMd, /Durable project\/session Supabase route contract plan after RP-INTTEST-08/)

const sourceTruthJson = JSON.parse(read('docs/project-edit-brief-source-truth-reconciliation.json')) as {
  landedScope?: string[]
  validation?: { smokesPassed?: string[] }
  remainingGates?: string[]
}
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_route_contract_plan'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-route-contract-plan'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_schema_rls_draft'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_migration_sql_draft'))
assert.ok(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_migration_review'))
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_migration_sql_draft'), false)
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_schema_rls_draft'), false)
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_route_contract_plan'), false)

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_SCENARIO_ID &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-project-session-supabase-route-contract-plan',
  decision: plan.decision,
  scenarioId: plan.scenarioId,
  routeFamilies: plan.routeFamilies.map((route) => route.routeFamily),
  dataApiGrantRequirements: plan.requiredDataApiGrants.length,
  rlsPolicyIntents: plan.rlsPolicyIntents.length,
  durableSupabaseAccessAllowed: plan.durableSupabaseAccessAllowed,
  productReady: plan.productReady,
  nextGate: plan.nextGate,
}, null, 2))
