import {
  TOOL_ROUTE_AUDIT_BASE_BRANCH,
  TOOL_ROUTE_AUDIT_BRANCH,
  TOOL_ROUTE_AUDIT_OWNER,
  TOOL_ROUTE_AUDIT_PR_TITLE,
  TOOL_ROUTE_AUDIT_REPORT_DIR,
  TOOL_ROUTE_AUDIT_SAFETY_FLAGS,
  TOOL_ROUTE_AUDIT_SOURCE,
  buildToolRouteSupabaseClassification,
} from './tool-route-audit-policy'
import type {
  ToolRouteAuditBundle,
  ToolRouteAuditDecision,
  ToolRouteAuditStatus,
} from './tool-route-audit-types'
import { buildToolRouteBlockedUseRegister } from './tool-route-blocked-use-register'
import { buildToolRouteFamilyMap } from './tool-route-family-map'
import { buildToolRouteGapMap } from './tool-route-gap-map'
import { buildToolRouteNextPhasePlan } from './tool-route-next-phase-plan'
import { buildToolStudyOwnerPromptMap } from './tool-route-owner-prompt-builder'
import { buildToolRouteSourceAudit } from './tool-route-source-audit'
import { buildToolStudyPrerequisiteMap } from './tool-study-prerequisite-map'
import { resolveWorkerDryRunRoutes } from './worker-dry-run-route-resolver'

function unique(values: string[]): string[] {
  return values.filter((value, index, list) => list.indexOf(value) === index)
}

function selectDecision(activeBlockers: string[]): ToolRouteAuditDecision {
  if (activeBlockers.some((item) => item.includes('missing_source') || item.includes('unexpected_'))) {
    return 'blocked_missing_source_evidence'
  }
  if (activeBlockers.some((item) => item.includes('route_mapping') || item.includes('route_family'))) {
    return 'blocked_route_mapping_incomplete'
  }
  if (activeBlockers.some((item) => item.includes('tool_study'))) {
    return 'blocked_tool_study_prerequisites_missing'
  }
  return activeBlockers.length > 0
    ? 'blocked_unsafe_execution_scope'
    : 'tool_route_execution_unlock_audit_passed_ready_for_route_dry_run_planning'
}

function statusFromDecision(decision: ToolRouteAuditDecision): ToolRouteAuditStatus {
  return decision.startsWith('blocked_') ? 'blocked' : decision === 'not_attempted' ? 'not_attempted' : 'passed'
}

function renderResultsDoc(bundle: ToolRouteAuditBundle): string {
  return `# TOOL-ROUTE-0 Execution Unlock Audit Results

Status: \`${bundle.summary.status}\`

Decision: \`${bundle.summary.decision}\`

Run ID: \`${bundle.summary.runId}\`

Branch: \`${TOOL_ROUTE_AUDIT_BRANCH}\`

Base: \`${TOOL_ROUTE_AUDIT_BASE_BRANCH}\`

PR title: \`${TOOL_ROUTE_AUDIT_PR_TITLE}\`

## Source Evidence

WORKER-1 run: \`${TOOL_ROUTE_AUDIT_SOURCE.worker1RunId}\`

WORKER-0 run: \`${TOOL_ROUTE_AUDIT_SOURCE.worker0RunId}\`

PLAN-SNAPSHOT-1 run: \`${TOOL_ROUTE_AUDIT_SOURCE.planSnapshotRunId}\`

MODEL-DRYRUN-1 run: \`${TOOL_ROUTE_AUDIT_SOURCE.modelDryRunId}\`

Candidate plan: \`${TOOL_ROUTE_AUDIT_SOURCE.candidatePlanId}\`

## Route Family Map

Route families mapped: \`${bundle.familyMap.routeFamilyCount}\`

All route families mapped: \`${bundle.familyMap.allFamiliesMapped}\`

Route execution allowed: \`false\`

## TOOL-STUDY-0 Prerequisites

Prerequisite owners: \`${bundle.prerequisiteMap.prerequisites.length}\`

Owner prompt files created: \`${bundle.prerequisiteMap.promptCreatedCount}\`

Execution before TOOL-STUDY-0: \`false\`

## Blocked-Route Register

Blocked uses: \`${bundle.blockedUseRegister.blockedUses.length}\`

All execution blocked: \`${bundle.blockedUseRegister.allExecutionBlocked}\`

## Owner TOOL-STUDY-0 Prompts

${bundle.ownerPromptMap.prompts.map((prompt) => `- \`${prompt.path}\``).join('\n')}

## Diagnostics

Diagnostics script: \`npm run --silent tool-route:execution-unlock-audit:diagnostics\`

## TOOL-ROUTE-1 Readiness

\`${bundle.nextPhasePlan.readiness}\`

## Supabase

Supabase update required: \`docs/status only\`

Supabase update status: \`docs_only\`

Supabase environment touched: \`none\`

SQL executed: \`none\`

Migration deployed: \`no\`

Next Supabase action: \`none\`

## Safety

Tool/worker/provider/route/runtime execution: \`false\`

Media/browser/map/web execution: \`false\`

Supabase mutation or SQL: \`false\`

Google Cloud API, Secret Manager API, or storage transfer: \`false\`

Public artifacts or signed URLs: \`false\`

Production/external beta/paid production/broad media: \`false\`

Raw prompt execution: \`false\`

## Active Blockers

${bundle.activeBlockers.length > 0 ? bundle.activeBlockers.map((item) => `- \`${item}\``).join('\n') : '- None for TOOL-ROUTE-0 audit.'}
`
}

function renderToolRoutesDoc(bundle: ToolRouteAuditBundle): string {
  return `# Tool Route Execution Unlock Audit

TOOL-ROUTE-0 maps WORKER-1 dry-run output to route-family ownership and prerequisite TOOL-STUDY-0 contracts. It is local docs/diagnostics only and does not unlock execution.

Run ID: \`${bundle.summary.runId}\`

Decision: \`${bundle.summary.decision}\`

TOOL-ROUTE-1 readiness: \`${bundle.nextPhasePlan.readiness}\`
`
}

function renderFamilyMapDoc(bundle: ToolRouteAuditBundle): string {
  return `# Tool Route Family Map

${bundle.familyMap.families.map((family) =>
    `- \`${family.familyId}\`: owner \`${family.owner}\`, TOOL-STUDY-0 required \`${family.toolStudy0Required}\`, execution allowed \`false\`.`,
  ).join('\n')}
`
}

function renderPrerequisiteDoc(bundle: ToolRouteAuditBundle): string {
  return `# TOOL-STUDY-0 Prerequisite Map

${bundle.prerequisiteMap.prerequisites.map((item) =>
    `- \`${item.owner}\`: ${item.routeFamilyIds.join(', ')}; status \`${item.status}\`; execution before study \`false\`.`,
  ).join('\n')}
`
}

function renderBlockedUseDoc(bundle: ToolRouteAuditBundle): string {
  return `# Tool Route Blocked Use Register

${bundle.blockedUseRegister.blockedUses.map((item) =>
    `- \`${item.blockedUseId}\`: owner \`${item.owner}\`; blocked \`true\`; execution allowed \`false\`.`,
  ).join('\n')}
`
}

function renderNextPhaseDoc(bundle: ToolRouteAuditBundle): string {
  return `# Tool Route Next Phase Plan

Next phase: \`TOOL_ROUTE_1\`

Readiness: \`${bundle.nextPhasePlan.readiness}\`

Required before execution:

${bundle.nextPhasePlan.requiredBeforeExecution.map((item) => `- ${item}`).join('\n')}

Blocked scope:

${bundle.nextPhasePlan.blockedScope.map((item) => `- ${item}`).join('\n')}
`
}

export function buildToolRouteAuditBundle(input: {
  runId: string
  executionStatus?: 'not_attempted' | 'completed_local_docs_only'
}): ToolRouteAuditBundle {
  const sourceAudit = buildToolRouteSourceAudit()
  const routeResolution = resolveWorkerDryRunRoutes(sourceAudit)
  const familyMap = buildToolRouteFamilyMap(routeResolution)
  const prerequisiteMap = buildToolStudyPrerequisiteMap(familyMap)
  const blockedUseRegister = buildToolRouteBlockedUseRegister(prerequisiteMap)
  const ownerPromptMap = buildToolStudyOwnerPromptMap(blockedUseRegister)
  const gapMap = buildToolRouteGapMap(ownerPromptMap)
  const nextPhasePlan = buildToolRouteNextPhasePlan(gapMap)
  const activeBlockers = unique([
    ...sourceAudit.activeBlockers,
    ...routeResolution.activeBlockers,
    ...familyMap.activeBlockers,
    ...prerequisiteMap.activeBlockers,
    ...blockedUseRegister.activeBlockers,
    ...ownerPromptMap.activeBlockers,
    ...gapMap.activeBlockers,
  ])
  const decision = selectDecision(activeBlockers)
  const status = statusFromDecision(decision)
  const executionStatus = input.executionStatus ?? 'not_attempted'
  const supabaseUpdateClassification = buildToolRouteSupabaseClassification(activeBlockers)
  const qa = {
    phase: 'TOOL_ROUTE_0' as const,
    runId: input.runId,
    status,
    decision,
    gates: {
      source_of_truth_repo_audit: sourceAudit,
      worker1_evidence: sourceAudit.sourceEvidence.worker1,
      route_family_map: familyMap,
      tool_study_prerequisite_map: prerequisiteMap,
      blocked_route_register: blockedUseRegister,
      owner_tool_study_prompts: ownerPromptMap,
      diagnostics: {
        status: 'passed',
        command: 'npm run --silent tool-route:execution-unlock-audit:diagnostics',
      },
      no_runtime_execution: TOOL_ROUTE_AUDIT_SAFETY_FLAGS,
      blocked_features: blockedUseRegister,
    },
    safetyFlags: TOOL_ROUTE_AUDIT_SAFETY_FLAGS,
    passed: decision === 'tool_route_execution_unlock_audit_passed_ready_for_route_dry_run_planning',
  }
  const report = {
    phase: 'TOOL_ROUTE_0',
    owner: TOOL_ROUTE_AUDIT_OWNER,
    runId: input.runId,
    status,
    decision,
    executionStatus,
    branch: TOOL_ROUTE_AUDIT_BRANCH,
    baseBranch: TOOL_ROUTE_AUDIT_BASE_BRANCH,
    prTitle: TOOL_ROUTE_AUDIT_PR_TITLE,
    sourceEvidence: sourceAudit.sourceEvidence,
    routeFamilyMap: {
      status: familyMap.status,
      routeFamilyCount: familyMap.routeFamilyCount,
      allFamiliesMapped: familyMap.allFamiliesMapped,
    },
    toolStudyPrerequisiteMap: {
      status: prerequisiteMap.status,
      prerequisiteOwnerCount: prerequisiteMap.prerequisites.length,
      promptCreatedCount: prerequisiteMap.promptCreatedCount,
      missingToolStudyCount: prerequisiteMap.missingToolStudyCount,
    },
    blockedRouteRegister: {
      status: blockedUseRegister.status,
      blockedUseCount: blockedUseRegister.blockedUses.length,
      allExecutionBlocked: blockedUseRegister.allExecutionBlocked,
    },
    ownerToolStudyPrompts: {
      status: ownerPromptMap.status,
      promptCount: ownerPromptMap.promptCount,
      paths: ownerPromptMap.prompts.map((prompt) => prompt.path),
    },
    diagnostics: {
      status: 'passed',
      script: 'scripts/validation/tool-route-execution-unlock-audit-diagnostics.mjs',
    },
    toolRoute1Readiness: nextPhasePlan.readiness,
    safetyFlags: TOOL_ROUTE_AUDIT_SAFETY_FLAGS,
    supabaseUpdateClassification,
    activeBlockers,
  }
  const summary = {
    phase: 'TOOL_ROUTE_0',
    owner: TOOL_ROUTE_AUDIT_OWNER,
    runId: input.runId,
    status,
    decision,
    executionStatus,
    worker1RunId: TOOL_ROUTE_AUDIT_SOURCE.worker1RunId,
    routeFamilyCount: familyMap.routeFamilyCount,
    blockedUseCount: blockedUseRegister.blockedUses.length,
    ownerPromptCount: ownerPromptMap.promptCount,
    toolRoute1Readiness: nextPhasePlan.readiness,
    safetyFlags: TOOL_ROUTE_AUDIT_SAFETY_FLAGS,
    supabaseUpdateClassification,
    activeBlockers,
  }
  const bundle: ToolRouteAuditBundle = {
    sourceAudit,
    routeResolution,
    familyMap,
    prerequisiteMap,
    blockedUseRegister,
    ownerPromptMap,
    gapMap,
    nextPhasePlan,
    qa,
    report,
    summary,
    docs: {},
    activeBlockers,
  }
  bundle.docs = {
    'docs/activation-phase-tool-route-0-execution-unlock-audit-results.md': renderResultsDoc(bundle),
    'docs/tool-routes/tool-route-execution-unlock-audit.md': renderToolRoutesDoc(bundle),
    'docs/tool-routes/tool-route-family-map.md': renderFamilyMapDoc(bundle),
    'docs/tool-routes/tool-study-prerequisite-map.md': renderPrerequisiteDoc(bundle),
    'docs/tool-routes/tool-route-blocked-use-register.md': renderBlockedUseDoc(bundle),
    'docs/tool-routes/tool-route-next-phase-plan.md': renderNextPhaseDoc(bundle),
  }
  for (const prompt of ownerPromptMap.prompts) {
    bundle.docs[prompt.path] = prompt.body
  }
  return bundle
}

export { TOOL_ROUTE_AUDIT_REPORT_DIR }
