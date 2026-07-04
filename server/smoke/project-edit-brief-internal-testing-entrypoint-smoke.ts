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
  'src/lib/internal-testing-auth-project-access-readiness.ts',
  'src/lib/project-edit-session-access-policy-core.ts',
  'src/lib/project-edit-session-access-policy.ts',
  'src/lib/project-edit-session-backend-persistence-plan.ts',
  'src/lib/project-edit-session-backend-skeleton.ts',
  'src/lib/project-session-supabase-route-contract-plan.ts',
  'src/lib/project-session-supabase-schema-rls-draft.ts',
  'src/backend/api/project-session-access-route-integration.ts',
  'src/backend/api/project-session-access-readback-qa.ts',
  'src/components/projects/ProjectEditSessionAccessPolicyNotice.tsx',
  'docs/project-edit-brief-internal-testing-entrypoint.md',
  'docs/project-edit-brief-internal-testing-entrypoint.json',
  'docs/internal-testing-auth-project-access-readiness.md',
  'docs/internal-testing-auth-project-access-readiness.json',
  'docs/internal-testing-auth-project-session-membership-policy.md',
  'docs/internal-testing-auth-project-session-membership-policy.json',
  'docs/internal-testing-durable-auth-project-session-backend-persistence-plan.md',
  'docs/internal-testing-durable-auth-project-session-backend-persistence-plan.json',
  'docs/internal-testing-mock-safe-durable-project-session-backend-skeleton.md',
  'docs/internal-testing-mock-safe-durable-project-session-backend-skeleton.json',
  'docs/internal-testing-durable-project-session-backend-route-integration.md',
  'docs/internal-testing-durable-project-session-backend-route-integration.json',
  'docs/internal-testing-durable-project-session-backend-readback-qa.md',
  'docs/internal-testing-durable-project-session-backend-readback-qa.json',
  'docs/internal-testing-durable-project-session-supabase-route-contract-plan.md',
  'docs/internal-testing-durable-project-session-supabase-route-contract-plan.json',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.md',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.json',
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
assert.match(page, /Preference Video limits/)
assert.match(page, /Mock-local Preference DNA/)
assert.match(page, /Open \/edit-preferences/)
assert.match(page, /internal-testing-approval-credit-gates/)
assert.match(page, /approvedPlanSnapshotId/)
assert.match(page, /creditEstimateId/)
assert.match(page, /creditReservationId/)
assert.match(page, /internal-testing-credit-lifecycle-readiness/)
assert.match(page, /Reserved credits have explicit success, release, and refund paths/)
assert.match(page, /No silent billing/)
assert.match(page, /internal-testing-repeated-local-operator-harness/)
assert.match(page, /One local loop proves the current testable path before a pass is filed/)
assert.match(page, /npm run qa:internal-testing/)
assert.match(page, /No tool execution/)
assert.match(page, /internal-testing-auth-project-access-readiness/)
assert.match(page, /Auth and project access/)
assert.match(page, /read-only Auth readiness check/)
assert.match(page, /No service-role/)
assert.match(page, /Durable project membership/)
assert.match(page, /internal-testing-auth-project-session-membership-policy/)
assert.match(page, /Membership policy/)
assert.match(page, /PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE/)
assert.match(page, /No Supabase Data API table access/)
assert.match(page, /internal-testing-durable-auth-project-session-backend-persistence-plan/)
assert.match(page, /Backend persistence plan/)
assert.match(page, /DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES/)
assert.match(page, /No migration, SQL, Storage/)
assert.match(page, /internal-testing-mock-safe-durable-project-session-backend-skeleton/)
assert.match(page, /Backend skeleton/)
assert.match(page, /Mock project\/session access can pass/)
assert.match(page, /getMockSafeDurableProjectSessionBackendSkeleton/)
assert.match(page, /internal-testing-durable-project-session-backend-route-integration/)
assert.match(page, /Route integration/)
assert.match(page, /projectSessionAccess/)
assert.match(page, /DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION/)
assert.match(page, /internal-testing-durable-project-session-backend-readback-qa/)
assert.match(page, /Readback QA/)
assert.match(page, /DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION/)
assert.match(page, /internal-testing-durable-project-session-supabase-route-contract-plan/)
assert.match(page, /Supabase route contract/)
assert.match(page, /DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION/)
assert.match(page, /getDurableProjectSessionSupabaseRouteContractPlan/)
assert.match(page, /schema\/RLS draft/)
assert.match(page, /internal-testing-durable-project-session-supabase-schema-rls-draft/)
assert.match(page, /Schema\/RLS draft/)
assert.match(page, /DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION/)
assert.match(page, /getDurableProjectSessionSupabaseSchemaRlsDraft/)
assert.match(page, /migration SQL draft/)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const authHelper = read('src/lib/internal-testing-auth-project-access-readiness.ts')
assert.match(authHelper, /getCurrentSupabaseSession/)
assert.match(authHelper, /getCurrentSupabaseUser/)
assert.doesNotMatch(authHelper, /runAuthBootstrapFlow|service_role|createSignedUrl/i)

const membershipCore = read('src/lib/project-edit-session-access-policy-core.ts')
assert.match(membershipCore, /PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE/)
assert.match(membershipCore, /durable_membership_ready/)
assert.match(membershipCore, /mockInternalRouteAllowed: true/)
assert.doesNotMatch(membershipCore, /\.(from|insert|update|delete)\s*\(|service_role|createSignedUrl/i)

const membershipReader = read('src/lib/project-edit-session-access-policy.ts')
assert.match(membershipReader, /readInternalTestingAuthProjectAccessReadiness/)
assert.doesNotMatch(membershipReader, /runAuthBootstrapFlow|service_role|createSignedUrl|\.from\s*\(/i)

const backendPersistencePlan = read('src/lib/project-edit-session-backend-persistence-plan.ts')
assert.match(backendPersistencePlan, /workspace_membership_verified_by_workspace_members/)
assert.match(backendPersistencePlan, /explicit_data_api_grants_verified_for_authenticated_role/)
assert.match(backendPersistencePlan, /mock_safe_backend_skeleton/)
assert.doesNotMatch(backendPersistencePlan, /createClient|\.from\s*\(|insert\s*\(|update\s*\(|delete\s*\(|createSignedUrl/i)

const backendSkeleton = read('src/lib/project-edit-session-backend-skeleton.ts')
assert.match(backendSkeleton, /mock_internal_access_allowed/)
assert.match(backendSkeleton, /blocked_durable_supabase_missing_evidence/)
assert.match(backendSkeleton, /blocked_durable_supabase_runtime_not_implemented/)
assert.match(backendSkeleton, /DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS/)
assert.doesNotMatch(backendSkeleton, /createClient|\.from\s*\(|insert\s*\(|update\s*\(|delete\s*\(|createSignedUrl/i)

const routeIntegration = read('src/backend/api/project-session-access-route-integration.ts')
assert.match(routeIntegration, /decorateProjectSessionRouteAccess/)
assert.match(routeIntegration, /projectSessionAccess/)
assert.match(routeIntegration, /DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION/)
assert.doesNotMatch(routeIntegration, /createClient|\.from\s*\(|insert\s*\(|update\s*\(|delete\s*\(|createSignedUrl/i)

const readbackQa = read('src/backend/api/project-session-access-readback-qa.ts')
assert.match(readbackQa, /createProjectSessionBackendReadbackQaReport/)
assert.match(readbackQa, /DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION/)
assert.match(readbackQa, /success_data/)
assert.match(readbackQa, /failure_error/)
assert.doesNotMatch(readbackQa, /createClient|\.from\s*\(|insert\s*\(|update\s*\(|delete\s*\(|createSignedUrl/i)

const supabaseRouteContractPlan = read('src/lib/project-session-supabase-route-contract-plan.ts')
assert.match(supabaseRouteContractPlan, /DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION/)
assert.match(supabaseRouteContractPlan, /workspace_members/)
assert.match(supabaseRouteContractPlan, /edit_sessions\.project_id/)
assert.match(supabaseRouteContractPlan, /schema_usage_granted_to_authenticated/)
assert.match(supabaseRouteContractPlan, /INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT/)
assert.doesNotMatch(supabaseRouteContractPlan, /createClient|\.from\s*\(|insert\s*\(|update\s*\(|delete\s*\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)

const supabaseSchemaRlsDraft = read('src/lib/project-session-supabase-schema-rls-draft.ts')
assert.match(supabaseSchemaRlsDraft, /DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION/)
assert.match(supabaseSchemaRlsDraft, /workspace_members/)
assert.match(supabaseSchemaRlsDraft, /edit_sessions/)
assert.match(supabaseSchemaRlsDraft, /non_member_edit_session_read_denied/)
assert.match(supabaseSchemaRlsDraft, /INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT/)
assert.doesNotMatch(supabaseSchemaRlsDraft, /createClient|\.from\s*\(|insert\s*\(|update\s*\(|delete\s*\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)

const docs = read('docs/project-edit-brief-internal-testing-entrypoint.md')
for (const phrase of [
  'production-shaped',
  '/internal-testing',
  'No upload',
  'No provider/model call',
  'No worker dispatch',
  'No render/export',
  'No credit reservation or spend',
  'Approval And Credit Gate Readiness',
  'approval-credit-gate-readiness',
  'Credit Lifecycle Readiness',
  'credit-lifecycle-readiness',
  'Repeated Local Operator Harness',
  'repeated-local-operator-harness',
  'Auth Project Access Readiness',
  'auth-project-access-readiness',
  'Auth Project Session Membership Policy',
  'auth-project-session-membership-policy',
  'Durable Auth Project Session Backend Persistence Plan',
  'durable-auth-project-session-backend-persistence-plan',
  'Mock-Safe Durable Project Session Backend Skeleton',
  'mock-safe-durable-project-session-backend-skeleton',
  'Durable Project Session Backend Route Integration',
  'durable-project-session-backend-route-integration',
  'Durable Project Session Backend Readback QA',
  'durable-project-session-backend-readback-qa',
  'Durable Project Session Supabase Route Contract Plan',
  'durable-project-session-supabase-route-contract-plan',
  'Durable Project Session Supabase Schema/RLS Draft',
  'durable-project-session-supabase-schema-rls-draft',
  'No Supabase Data API',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const docJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  decision?: string
  route?: string
  connectedRoutes?: string[]
  features?: string[]
  scenarioStatus?: Record<string, string | number>
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}

assert.equal(docJson.decision, 'project_edit_brief_internal_testing_entrypoint_passed_ready_for_repeated_internal_testing')
assert.equal(docJson.route, '/internal-testing')
assert.ok(docJson.connectedRoutes?.includes(createProjectHomePath(projectId)))
assert.ok(docJson.connectedRoutes?.includes(createProjectEditSessionChatPath(projectId, editSessionId)))
assert.ok(docJson.connectedRoutes?.includes(createProjectEditSessionBriefPath(projectId, editSessionId)))
assert.ok(docJson.features?.includes('approval_credit_gate_readiness'))
assert.ok(docJson.features?.includes('credit_lifecycle_readiness'))
assert.ok(docJson.features?.includes('repeated_local_operator_harness'))
assert.ok(docJson.features?.includes('auth_project_access_readiness'))
assert.ok(docJson.features?.includes('auth_project_session_membership_policy'))
assert.ok(docJson.features?.includes('durable_auth_project_session_backend_persistence_plan'))
assert.ok(docJson.features?.includes('mock_safe_durable_project_session_backend_skeleton'))
assert.ok(docJson.features?.includes('durable_project_session_backend_route_integration'))
assert.ok(docJson.features?.includes('durable_project_session_backend_readback_qa'))
assert.ok(docJson.features?.includes('durable_project_session_supabase_route_contract_plan'))
assert.ok(docJson.features?.includes('durable_project_session_supabase_schema_rls_draft'))
assert.equal(docJson.scenarioStatus?.['approval-credit-gate-readiness'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['credit-lifecycle-readiness'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['repeated-local-operator-harness'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['auth-project-access-readiness'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['auth-project-session-membership-policy'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['durable-auth-project-session-backend-persistence-plan'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['mock-safe-durable-project-session-backend-skeleton'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['durable-project-session-backend-route-integration'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['durable-project-session-backend-readback-qa'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['durable-project-session-supabase-route-contract-plan'], 'mock_local')
assert.equal(docJson.scenarioStatus?.['durable-project-session-supabase-schema-rls-draft'], 'mock_local')
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.workerDispatch, false)
assert.equal(docJson.blockedScope?.creditSpend, false)
assert.equal(docJson.blockedScope?.walletMutation, false)
assert.ok(docJson.validation?.required?.includes('smoke:project-edit-brief-internal-testing-entrypoint'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-approval-credit-gates'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-credit-lifecycle-readiness'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-repeated-local-operator-harness'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-auth-project-access-readiness'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-auth-project-session-membership-policy'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-auth-project-session-backend-persistence-plan'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-backend-route-integration'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-backend-readback-qa'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-route-contract-plan'))
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-schema-rls-draft'))

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-testing-entrypoint'],
  'tsx server/smoke/project-edit-brief-internal-testing-entrypoint-smoke.ts',
)

const sourceTruth = read('docs/project-edit-brief-source-truth-reconciliation.md')
assert.match(sourceTruth, /Internal testing entrypoint after RP-EDITBRIEF-23/)
assert.match(sourceTruth, /smoke:project-edit-brief-internal-testing-entrypoint/)
assert.match(sourceTruth, /Auth project\/session membership policy after RP-INTTEST-03/)
assert.match(sourceTruth, /Durable auth project\/session backend persistence plan after RP-INTTEST-04/)
assert.match(sourceTruth, /Mock-safe durable project\/session backend skeleton after RP-INTTEST-05/)
assert.match(sourceTruth, /Durable project\/session backend route integration after RP-INTTEST-06/)
assert.match(sourceTruth, /Durable project\/session backend readback QA after RP-INTTEST-07/)
assert.match(sourceTruth, /Durable project\/session Supabase route contract plan after RP-INTTEST-08/)
assert.match(sourceTruth, /Durable project\/session Supabase schema\/RLS draft after RP-INTTEST-09/)

const sourceTruthJson = JSON.parse(read('docs/project-edit-brief-source-truth-reconciliation.json')) as {
  landedScope?: string[]
  validation?: { smokesPassed?: string[] }
  remainingGates?: string[]
}
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_entrypoint'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_auth_project_session_membership_policy'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_auth_project_session_backend_persistence_plan'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_mock_safe_durable_project_session_backend_skeleton'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_backend_route_integration'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_backend_readback_qa'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_route_contract_plan'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_schema_rls_draft'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:project-edit-brief-internal-testing-entrypoint'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-auth-project-session-membership-policy'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-auth-project-session-backend-persistence-plan'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-backend-route-integration'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-backend-readback-qa'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-route-contract-plan'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-schema-rls-draft'))
assert.ok(sourceTruthJson.remainingGates?.includes('internal_testing_entrypoint_after_rp_editbrief_23'))

const statusCounts = internalTestingScenarios.reduce<Record<string, number>>((counts, scenario) => {
  counts[scenario.status] = (counts[scenario.status] ?? 0) + 1
  return counts
}, {})
assert.ok(internalTestingScenarios.length >= 100)
assert.ok(statusCounts.ready >= 10)
assert.ok(statusCounts.mock_local >= 100)
assert.equal(statusCounts.blocked ?? 0, 0)
assert.ok(internalTestingScenarios.some((scenario) => scenario.id === 'feedback-export' && scenario.route === '/internal-testing'))
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'preference-video-mock-only-limits' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'durable-project-session-supabase-schema-rls-draft' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'approval-credit-gate-readiness' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'credit-lifecycle-readiness' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'repeated-local-operator-harness' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'auth-project-access-readiness' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'auth-project-session-membership-policy' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'durable-auth-project-session-backend-persistence-plan' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'mock-safe-durable-project-session-backend-skeleton' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'durable-project-session-backend-route-integration' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'durable-project-session-supabase-route-contract-plan' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)
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
