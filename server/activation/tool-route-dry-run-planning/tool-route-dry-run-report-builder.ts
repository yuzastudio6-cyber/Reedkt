import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_DRY_RUN_BASE_BRANCH,
  TOOL_ROUTE_DRY_RUN_BRANCH,
  TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT,
  TOOL_ROUTE_DRY_RUN_OWNER,
  TOOL_ROUTE_DRY_RUN_PR_TITLE,
  TOOL_ROUTE_DRY_RUN_REPORT_DIR,
  TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
  TOOL_ROUTE_DRY_RUN_SOURCE,
  buildToolRouteDryRunSupabaseClassification,
} from './tool-route-dry-run-planning-policy'
import type {
  ToolRouteDryRunBundle,
  ToolRouteDryRunDecision,
  ToolRouteDryRunExecutionStatus,
  ToolRouteDryRunStatus,
} from './tool-route-dry-run-planning-types'
import { buildToolRouteArtifactContractMap } from './tool-route-artifact-contract-map-builder'
import { validateToolRouteBlockedExecution } from './tool-route-blocked-execution-validator'
import { buildToolRouteDryRunGapMap } from './tool-route-dry-run-gap-map'
import { buildToolRouteDryRunNextPhasePlan } from './tool-route-dry-run-next-phase-plan'
import { buildToolRouteDryRunSourceAudit } from './tool-route-dry-run-source-audit'
import { buildToolRouteFamilyDryRunPlan } from './tool-route-family-dry-run-builder'
import { buildToolRouteOwnerRoutePlan } from './tool-route-owner-route-builder'
import { loadToolRouteOwnerStudyContext } from './tool-route-owner-study-loader'
import { buildToolRouteQaGateMap } from './tool-route-qa-gate-map-builder'
import { loadToolRouteWorkerDryRunContext } from './tool-route-worker-dry-run-loader'

function unique(values: string[]): string[] {
  return values.filter((value, index, list) => list.indexOf(value) === index)
}

function selectDecision(activeBlockers: string[]): ToolRouteDryRunDecision {
  if (activeBlockers.some((item) => item.includes('missing_source') || item.includes('unexpected_'))) {
    return 'blocked_missing_source_evidence'
  }
  if (activeBlockers.some((item) => item.includes('owner_study'))) {
    return 'blocked_owner_study_contract_incomplete'
  }
  if (activeBlockers.some((item) => item.includes('route') || item.includes('artifact_contract') || item.includes('qa_gate'))) {
    return 'blocked_route_dry_run_contract_incomplete'
  }
  return activeBlockers.length > 0
    ? 'blocked_unsafe_execution_scope'
    : 'tool_route_dry_run_planning_passed_ready_for_tool_route_2_generated_local_fixture_planning'
}

function statusFromDecision(decision: ToolRouteDryRunDecision): ToolRouteDryRunStatus {
  return decision.startsWith('blocked_') ? 'blocked' : decision === 'not_attempted' ? 'not_attempted' : 'passed'
}

function bullet(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n')
}

function renderResultsDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Route Dry-Run Planning Results

Status: \`${bundle.summary.status}\`

Decision: \`${bundle.summary.decision}\`

Run ID: \`${bundle.summary.runId}\`

Branch: \`${TOOL_ROUTE_DRY_RUN_BRANCH}\`

Base: \`${TOOL_ROUTE_DRY_RUN_BASE_BRANCH}\`

PR title: \`${TOOL_ROUTE_DRY_RUN_PR_TITLE}\`

## Source Evidence

MODEL-DRYRUN-1 run: \`${TOOL_ROUTE_DRY_RUN_SOURCE.modelDryRunId}\`

PLAN-SNAPSHOT-1 run: \`${TOOL_ROUTE_DRY_RUN_SOURCE.planSnapshotRunId}\`

WORKER-0 run: \`${TOOL_ROUTE_DRY_RUN_SOURCE.worker0RunId}\`

WORKER-1 run: \`${TOOL_ROUTE_DRY_RUN_SOURCE.worker1RunId}\`

TOOL-ROUTE-0 run: \`${TOOL_ROUTE_DRY_RUN_SOURCE.toolRoute0RunId}\`

Candidate plan: \`${TOOL_ROUTE_DRY_RUN_SOURCE.candidatePlanId}\`

Completed owner studies: \`${bundle.ownerStudyContext.completedStudyCount}\` of \`${bundle.ownerStudyContext.requiredStudyCount}\`

## Route Dry-Run Plan

Route families: \`${bundle.routeFamilyPlan.routeFamilyCount}\`

Owner routes: \`${bundle.ownerRoutePlan.ownerRouteCount}\`

Artifact contracts: \`${bundle.artifactContractMap.artifactContractCount}\`

QA gates: \`${bundle.qaGateMap.gateCount}\`

Execution status: \`${bundle.summary.executionStatus}\`

## TOOL-ROUTE-2 Readiness

\`${bundle.nextPhasePlan.readiness}\`

Prompt: \`${bundle.nextPhasePlan.promptPath}\`

## Supabase

Supabase update required: \`docs/status only\`

Supabase update status: \`docs_only\`

Supabase environment touched: \`none\`

SQL executed: \`none\`

Migration deployed: \`no\`

Milestone sync: \`blocked_current_branch_missing_sync_layer\`

Next Supabase action: \`none\`

## Safety

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}

## Active Blockers

${bundle.activeBlockers.length > 0 ? bullet(bundle.activeBlockers.map((item) => `\`${item}\``)) : '- None.'}
`
}

function renderMainDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Route Dry-Run Planning

TOOL-ROUTE-1 maps completed TOOL-STUDY-0 owner contracts and WORKER-1 dry-run evidence into deterministic route dry-run planning. It is local docs/diagnostics only.

Run ID: \`${bundle.summary.runId}\`

Decision: \`${bundle.summary.decision}\`

TOOL-ROUTE-2 readiness: \`${bundle.nextPhasePlan.readiness}\`

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}
`
}

function renderFamilyDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Route Family Dry-Run Plan

${bundle.routeFamilyPlan.families.map((family) =>
    `- \`${family.familyId}\`: owner \`${family.owner}\`; output \`${family.outputArtifactContract}\`; execution flags all \`false\`.`,
  ).join('\n')}

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}
`
}

function renderOwnerRouteDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Owner Route Plan

${bundle.ownerRoutePlan.ownerRoutes.map((route) =>
    `- \`${route.owner}\`: families \`${route.familyIds.join(', ')}\`; review only \`true\`; execution authorized \`false\`.`,
  ).join('\n')}

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}
`
}

function renderArtifactDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Artifact Contract Map

${bundle.artifactContractMap.artifacts.map((artifact) =>
    `- \`${artifact.artifactId}\`: ${artifact.contractName}; private only \`true\`; public artifact allowed \`false\`; signed URL source-of-truth allowed \`false\`.`,
  ).join('\n')}

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}
`
}

function renderQaDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 QA Gate Map

${bundle.qaGateMap.gates.map((gate) =>
    `- \`${gate.gateId}\`: status \`${gate.status}\`; required \`true\`.`,
  ).join('\n')}

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}
`
}

function renderBlockedDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Blocked Execution Validation

All execution blocked: \`${bundle.blockedExecutionValidation.allExecutionBlocked}\`

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}

Blocked categories:

${bullet(bundle.blockedExecutionValidation.blockedCategories)}
`
}

function renderGapDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Gap Map

${bundle.gapMap.gaps.map((gap) =>
    `- \`${gap.gapId}\`: owner \`${gap.owner}\`; status \`${gap.status}\`; next action: ${gap.nextAction}`,
  ).join('\n')}

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}
`
}

function renderNextPhaseDoc(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-1 Next Phase Plan

Next phase: \`${bundle.nextPhasePlan.nextPhase}\`

Readiness: \`${bundle.nextPhasePlan.readiness}\`

Prompt: \`${bundle.nextPhasePlan.promptPath}\`

Required before execution:

${bullet(bundle.nextPhasePlan.requiredBeforeExecution)}

Blocked scope:

${bullet(bundle.nextPhasePlan.blockedScope)}
`
}

function renderToolRoute2Prompt(bundle: ToolRouteDryRunBundle): string {
  return `# TOOL-ROUTE-2 Generated Local Fixture Planning Prompt

Implement TOOL-ROUTE-2 only after TOOL-ROUTE-1 reports \`${bundle.nextPhasePlan.readiness}\`.

Use committed TOOL-ROUTE-1 artifacts as source evidence:

- \`${TOOL_ROUTE_DRY_RUN_REPORT_DIR}/routes/tool-route-family-dry-run-plan.json\`
- \`${TOOL_ROUTE_DRY_RUN_REPORT_DIR}/routes/tool-route-owner-route-plan.json\`
- \`${TOOL_ROUTE_DRY_RUN_REPORT_DIR}/artifacts/tool-route-artifact-contract-map.json\`
- \`${TOOL_ROUTE_DRY_RUN_REPORT_DIR}/qa/tool-route-qa-gate-map.json\`

TOOL-ROUTE-2 may plan generated local fixtures and fixture manifests only. It must not execute tools, workers, routes, providers, media, browser/map/web, Supabase, SQL, GCS, public artifact delivery, signed URL creation, beta, production, dependency mutation, raw prompt execution, final render/export, or broad service-role handling.

${TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT}
`
}

function renderMarkedDoc(path: string, section: string): string {
  const start = '<!-- TOOL-ROUTE-1-START -->'
  const end = '<!-- TOOL-ROUTE-1-END -->'
  const markedSection = `${start}\n${section.trim()}\n${end}\n`
  if (!existsSync(path)) return `${markedSection}`
  const current = readFileSync(path, 'utf8')
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}\\n?`)
  if (pattern.test(current)) return current.replace(pattern, markedSection)
  return `${current.trimEnd()}\n\n${markedSection}`
}

function renderReadinessState(bundle: ToolRouteDryRunBundle): string {
  return renderMarkedDoc('docs/activation-readiness-state.md', `## TOOL-ROUTE-1

- Status: \`${bundle.summary.status}\`
- Decision: \`${bundle.summary.decision}\`
- Run ID: \`${bundle.summary.runId}\`
- TOOL-ROUTE-2 readiness: \`${bundle.nextPhasePlan.readiness}\`
- Supabase milestone sync: \`blocked_current_branch_missing_sync_layer\`
- Runtime/tool/worker/provider execution: \`false\`
`)
}

function renderNextPhaseRunbook(bundle: ToolRouteDryRunBundle): string {
  return renderMarkedDoc('docs/activation-next-phase-runbook.md', `## TOOL-ROUTE-1 Current Next Prompt

\`${bundle.nextPhasePlan.promptPath}\`

## TOOL-ROUTE-2 Entry Criteria

- TOOL-ROUTE-1 status: \`${bundle.summary.status}\`
- TOOL-ROUTE-1 decision: \`${bundle.summary.decision}\`
- Route families mapped: \`${bundle.routeFamilyPlan.routeFamilyCount}\`
- Owner route plans mapped: \`${bundle.ownerRoutePlan.ownerRouteCount}\`
- Artifact contracts mapped: \`${bundle.artifactContractMap.artifactContractCount}\`

TOOL-ROUTE-2 remains generated-local-fixture planning only. It does not authorize runtime, tool, worker, provider, Supabase, media, browser/map/web, public artifact, signed URL, beta, production, or final render/export execution.
`)
}

export function buildToolRouteDryRunBundle(input: {
  runId: string
  executionStatus?: ToolRouteDryRunExecutionStatus
}): ToolRouteDryRunBundle {
  const sourceAudit = buildToolRouteDryRunSourceAudit()
  const ownerStudyContext = loadToolRouteOwnerStudyContext()
  const workerDryRunContext = loadToolRouteWorkerDryRunContext()
  const routeFamilyPlan = buildToolRouteFamilyDryRunPlan(workerDryRunContext, ownerStudyContext)
  const ownerRoutePlan = buildToolRouteOwnerRoutePlan(routeFamilyPlan)
  const artifactContractMap = buildToolRouteArtifactContractMap(routeFamilyPlan)
  const blockedExecutionValidation = validateToolRouteBlockedExecution({
    routeFamilyPlan,
    ownerRoutePlan,
    artifactContractMap,
  })
  const qaGateMap = buildToolRouteQaGateMap({
    ownerStudyContext,
    workerDryRunContext,
    routeFamilyPlan,
    ownerRoutePlan,
    artifactContractMap,
    blockedExecutionValidation,
  })
  const gapMap = buildToolRouteDryRunGapMap(qaGateMap)
  const nextPhasePlan = buildToolRouteDryRunNextPhasePlan(gapMap)
  const activeBlockers = unique([
    ...sourceAudit.activeBlockers,
    ...ownerStudyContext.activeBlockers,
    ...workerDryRunContext.activeBlockers,
    ...routeFamilyPlan.activeBlockers,
    ...ownerRoutePlan.activeBlockers,
    ...artifactContractMap.activeBlockers,
    ...blockedExecutionValidation.activeBlockers,
    ...qaGateMap.activeBlockers,
    ...gapMap.activeBlockers,
  ])
  const decision = selectDecision(activeBlockers)
  const status = statusFromDecision(decision)
  const executionStatus = input.executionStatus ?? 'not_attempted'
  const supabaseUpdateClassification = buildToolRouteDryRunSupabaseClassification(activeBlockers)
  const qa = {
    phase: 'TOOL_ROUTE_1' as const,
    runId: input.runId,
    status,
    decision,
    gates: qaGateMap,
    safetyFlags: TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
    passed: decision === 'tool_route_dry_run_planning_passed_ready_for_tool_route_2_generated_local_fixture_planning',
  }
  const report = {
    phase: 'TOOL_ROUTE_1',
    owner: TOOL_ROUTE_DRY_RUN_OWNER,
    runId: input.runId,
    status,
    decision,
    executionStatus,
    branch: TOOL_ROUTE_DRY_RUN_BRANCH,
    baseBranch: TOOL_ROUTE_DRY_RUN_BASE_BRANCH,
    prTitle: TOOL_ROUTE_DRY_RUN_PR_TITLE,
    sourceEvidence: sourceAudit.sourceEvidence,
    completedOwnerStudies: ownerStudyContext.completedStudyCount,
    routeFamilyPlan: {
      status: routeFamilyPlan.status,
      routeFamilyCount: routeFamilyPlan.routeFamilyCount,
      allFamiliesMapped: routeFamilyPlan.allFamiliesMapped,
      familyIds: routeFamilyPlan.families.map((family) => family.familyId),
    },
    ownerRoutePlan: {
      status: ownerRoutePlan.status,
      ownerRouteCount: ownerRoutePlan.ownerRouteCount,
      allRequiredOwnersMapped: ownerRoutePlan.allRequiredOwnersMapped,
      owners: ownerRoutePlan.ownerRoutes.map((route) => route.owner),
    },
    artifactContractMap: {
      status: artifactContractMap.status,
      artifactContractCount: artifactContractMap.artifactContractCount,
      allContractsPrivatePlanningOnly: artifactContractMap.allContractsPrivatePlanningOnly,
    },
    qaGateMap: {
      status: qaGateMap.status,
      gateCount: qaGateMap.gateCount,
      allRequiredGatesPassed: qaGateMap.allRequiredGatesPassed,
    },
    blockedExecutionValidation: {
      status: blockedExecutionValidation.status,
      allExecutionBlocked: blockedExecutionValidation.allExecutionBlocked,
      blockedCategoryCount: blockedExecutionValidation.blockedCategories.length,
    },
    toolRoute2Readiness: nextPhasePlan.readiness,
    diagnostics: {
      status: 'passed',
      script: 'scripts/validation/tool-route-dry-run-planning-diagnostics.mjs',
    },
    safetyFlags: TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
    noScopeStatement: TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT,
    supabaseUpdateClassification,
    activeBlockers,
  }
  const summary = {
    phase: 'TOOL_ROUTE_1',
    owner: TOOL_ROUTE_DRY_RUN_OWNER,
    runId: input.runId,
    status,
    decision,
    executionStatus,
    worker1RunId: TOOL_ROUTE_DRY_RUN_SOURCE.worker1RunId,
    candidatePlanId: TOOL_ROUTE_DRY_RUN_SOURCE.candidatePlanId,
    routeFamilyCount: routeFamilyPlan.routeFamilyCount,
    ownerRouteCount: ownerRoutePlan.ownerRouteCount,
    artifactContractCount: artifactContractMap.artifactContractCount,
    qaGateCount: qaGateMap.gateCount,
    toolRoute2Readiness: nextPhasePlan.readiness,
    safetyFlags: TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
    noScopeStatement: TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT,
    supabaseUpdateClassification,
    activeBlockers,
  }

  const bundle: ToolRouteDryRunBundle = {
    sourceAudit,
    ownerStudyContext,
    workerDryRunContext,
    routeFamilyPlan,
    ownerRoutePlan,
    artifactContractMap,
    qaGateMap,
    blockedExecutionValidation,
    gapMap,
    nextPhasePlan,
    qa,
    report,
    summary,
    docs: {},
    activeBlockers,
  }

  bundle.docs = {
    'docs/activation-phase-tool-route-1-route-dry-run-planning-results.md': renderResultsDoc(bundle),
    'docs/tool-routes/tool-route-1-route-dry-run-planning.md': renderMainDoc(bundle),
    'docs/tool-routes/tool-route-1-route-family-dry-run-plan.md': renderFamilyDoc(bundle),
    'docs/tool-routes/tool-route-1-owner-route-plan.md': renderOwnerRouteDoc(bundle),
    'docs/tool-routes/tool-route-1-artifact-contract-map.md': renderArtifactDoc(bundle),
    'docs/tool-routes/tool-route-1-qa-gate-map.md': renderQaDoc(bundle),
    'docs/tool-routes/tool-route-1-blocked-execution-validation.md': renderBlockedDoc(bundle),
    'docs/tool-routes/tool-route-1-gap-map.md': renderGapDoc(bundle),
    'docs/tool-routes/tool-route-1-next-phase-plan.md': renderNextPhaseDoc(bundle),
    'docs/implementation-prompts/prompt-tool-route-2-generated-local-fixture-planning.md': renderToolRoute2Prompt(bundle),
    'docs/activation-readiness-state.md': renderReadinessState(bundle),
    'docs/activation-next-phase-runbook.md': renderNextPhaseRunbook(bundle),
  }

  return bundle
}

export { TOOL_ROUTE_DRY_RUN_REPORT_DIR }
