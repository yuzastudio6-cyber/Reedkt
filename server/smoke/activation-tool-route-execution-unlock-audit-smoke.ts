import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_AUDIT_OWNER_PROMPT_PATHS,
  TOOL_ROUTE_AUDIT_REPORT_DIR,
  TOOL_ROUTE_AUDIT_REPORT_PATHS,
  TOOL_ROUTE_AUDIT_SAFETY_FLAGS,
  buildToolRouteAuditBundle,
  getToolRouteAuditRunId,
} from '../activation/tool-route-execution-unlock-audit'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

const bundle = buildToolRouteAuditBundle({ runId: getToolRouteAuditRunId() })

assert(bundle.summary.phase === 'TOOL_ROUTE_0', 'phase mismatch')
assert(bundle.summary.status === 'passed', `unexpected status: ${String(bundle.summary.status)}`)
assert(
  bundle.summary.decision === 'tool_route_execution_unlock_audit_passed_ready_for_route_dry_run_planning',
  `unexpected decision: ${String(bundle.summary.decision)}`,
)
assert(bundle.sourceAudit.sourceEvidence.worker1.runId === 'worker1-20260612T193823', 'worker1 evidence mismatch')
assert(bundle.routeResolution.routeReviews.length === 7, 'expected seven worker dry-run route reviews')
assert(bundle.familyMap.routeFamilyCount === 14, 'expected fourteen route families')
assert(bundle.prerequisiteMap.prerequisites.length === 9, 'expected nine TOOL-STUDY-0 prerequisite owners')
assert(bundle.blockedUseRegister.blockedUses.length >= 18, 'blocked-use register too small')
assert(bundle.ownerPromptMap.promptCount === 6, 'expected six owner prompt files')
assert(bundle.nextPhasePlan.readiness === 'ready for route dry-run planning', 'TOOL-ROUTE-1 readiness mismatch')
assert(Object.values(TOOL_ROUTE_AUDIT_SAFETY_FLAGS).every((value) => value === false), 'safety flags must all be false')

for (const path of [
  'server/activation/tool-route-execution-unlock-audit/index.ts',
  'server/cli/activation-tool-route-execution-unlock-audit.ts',
  'server/cli/activation-tool-route-execution-unlock-audit-report.ts',
  'server/cli/activation-tool-route-execution-unlock-summary.ts',
  'scripts/validation/tool-route-execution-unlock-audit-diagnostics.mjs',
  'docs/tool-routes/tool-route-execution-unlock-audit.md',
]) {
  assert(existsSync(path), `missing expected path: ${path}`)
}

for (const path of TOOL_ROUTE_AUDIT_OWNER_PROMPT_PATHS) {
  assert(existsSync(path), `missing owner prompt: ${path}`)
}

const reportPath = `${TOOL_ROUTE_AUDIT_REPORT_DIR}/${TOOL_ROUTE_AUDIT_REPORT_PATHS.report}`
if (existsSync(reportPath)) {
  const report = readJson(reportPath)
  assert(report.status === 'passed', 'stored report must be passed')
  assert(report.toolRoute1Readiness === 'ready for route dry-run planning', 'stored report readiness mismatch')
}

console.log(JSON.stringify({
  status: 'passed',
  phase: bundle.summary.phase,
  runId: bundle.summary.runId,
  decision: bundle.summary.decision,
  routeFamilyCount: bundle.familyMap.routeFamilyCount,
  ownerPromptCount: bundle.ownerPromptMap.promptCount,
  toolRoute1Readiness: bundle.nextPhasePlan.readiness,
  toolExecution: false,
  workerExecution: false,
  routeExecution: false,
  providerModelCalls: false,
  supabaseMutation: false,
  googleCloudApiCalls: false,
  gcsStorageTransfer: false,
  production: false,
}, null, 2))
