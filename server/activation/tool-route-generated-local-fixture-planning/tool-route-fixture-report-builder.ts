import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_FIXTURE_BASE_BRANCH,
  TOOL_ROUTE_FIXTURE_BRANCH,
  TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT,
  TOOL_ROUTE_FIXTURE_OWNER,
  TOOL_ROUTE_FIXTURE_PR_TITLE,
  TOOL_ROUTE_FIXTURE_REPORT_DIR,
  TOOL_ROUTE_FIXTURE_SAFETY_FLAGS,
  TOOL_ROUTE_FIXTURE_SOURCE,
  buildToolRouteFixtureSupabaseClassification,
} from './tool-route-fixture-planning-policy'
import { buildFixtureInputOutputContractMap } from './fixture-input-output-contract-builder'
import { validateFixtureBlockedExecution } from './fixture-blocked-execution-validator'
import { buildFixtureQaGateMap } from './fixture-qa-gate-map-builder'
import { buildGeneratedLocalFixtureCatalog } from './generated-local-fixture-catalog-builder'
import { buildOwnerFixtureHandoffMap } from './owner-fixture-handoff-map-builder'
import { loadToolRoute1EvidenceContext } from './tool-route-1-evidence-loader'
import { buildToolRouteFixtureGapMap } from './tool-route-fixture-gap-map'
import { buildToolRouteFixtureNextPhasePlan } from './tool-route-fixture-next-phase-plan'
import { buildToolRouteFixtureSourceAudit } from './tool-route-fixture-source-audit'
import type {
  ToolRouteFixturePlanningBundle,
  ToolRouteFixturePlanningDecision,
  ToolRouteFixturePlanningExecutionStatus,
  ToolRouteFixturePlanningStatus,
} from './tool-route-fixture-planning-types'
import { loadToolStudyFixtureEvidenceContext } from './tool-study-fixture-evidence-loader'

function unique(values: string[]): string[] {
  return values.filter((value, index, list) => list.indexOf(value) === index)
}

function selectDecision(activeBlockers: string[]): ToolRouteFixturePlanningDecision {
  if (activeBlockers.some((item) => item.includes('missing_') || item.includes('unexpected_'))) {
    return 'blocked_missing_source_evidence'
  }
  if (activeBlockers.some((item) => item.includes('fixture') || item.includes('contract') || item.includes('qa_gate'))) {
    return 'blocked_fixture_contract_incomplete'
  }
  return activeBlockers.length > 0
    ? 'blocked_unsafe_execution_scope'
    : 'tool_route_generated_local_fixture_planning_passed_ready_for_tool_route_3_generated_local_fixture_contract_tests'
}

function statusFromDecision(decision: ToolRouteFixturePlanningDecision): ToolRouteFixturePlanningStatus {
  return decision.startsWith('blocked_') ? 'blocked' : decision === 'not_attempted' ? 'not_attempted' : 'passed'
}

function bullet(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n')
}

function renderMarkedDoc(path: string, marker: string, section: string): string {
  const start = `<!-- ${marker}-START -->`
  const end = `<!-- ${marker}-END -->`
  const markedSection = `${start}\n${section.trim()}\n${end}\n`
  if (!existsSync(path)) return markedSection
  const current = readFileSync(path, 'utf8')
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}\\n?`)
  if (pattern.test(current)) return current.replace(pattern, markedSection)
  return `${current.trimEnd()}\n\n${markedSection}`
}

function renderResultsDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Generated Local Fixture Planning Results

Status: \`${bundle.summary.status}\`

Decision: \`${bundle.summary.decision}\`

Run ID: \`${bundle.summary.runId}\`

Branch: \`${TOOL_ROUTE_FIXTURE_BRANCH}\`

Base: \`${TOOL_ROUTE_FIXTURE_BASE_BRANCH}\`

PR title: \`${TOOL_ROUTE_FIXTURE_PR_TITLE}\`

## Source Evidence

MODEL-DRYRUN-1: \`${TOOL_ROUTE_FIXTURE_SOURCE.modelDryRunId}\`

PLAN-SNAPSHOT-1: \`${TOOL_ROUTE_FIXTURE_SOURCE.planSnapshotRunId}\`

WORKER-0: \`${TOOL_ROUTE_FIXTURE_SOURCE.worker0RunId}\`

WORKER-1: \`${TOOL_ROUTE_FIXTURE_SOURCE.worker1RunId}\`

TOOL-ROUTE-0: \`${TOOL_ROUTE_FIXTURE_SOURCE.toolRoute0RunId}\`

TOOL-ROUTE-1: \`${TOOL_ROUTE_FIXTURE_SOURCE.toolRoute1RunId}\`

Completed TOOL-STUDY-0 contracts: \`${bundle.toolStudyEvidence.completedStudyCount}\` of \`${bundle.toolStudyEvidence.requiredStudyCount}\`

## Fixture Catalog

Fixture families: \`${bundle.fixtureCatalog.fixtureCount}\`

Input/output contracts: \`${bundle.inputOutputContractMap.contractCount}\`

Owner handoffs: \`${bundle.ownerFixtureHandoffMap.ownerCount}\`

QA gates: \`${bundle.qaGateMap.gateCount}\`

Execution status: \`${bundle.summary.executionStatus}\`

## TOOL-ROUTE-3 Readiness

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

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}

## Active Blockers

${bundle.activeBlockers.length > 0 ? bullet(bundle.activeBlockers.map((item) => `\`${item}\``)) : '- None.'}
`
}

function renderMainDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Generated Local Fixture Planning

TOOL-ROUTE-2 converts committed TOOL-ROUTE-1, WORKER, PLAN, MODEL, and TOOL-STUDY-0 evidence into generated/local fixture planning contracts. It is local docs/diagnostics only.

Run ID: \`${bundle.summary.runId}\`

Decision: \`${bundle.summary.decision}\`

TOOL-ROUTE-3 readiness: \`${bundle.nextPhasePlan.readiness}\`

Fixture families: \`${bundle.fixtureCatalog.fixtureCount}\`

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderFixtureCatalogDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Fixture Catalog

${bundle.fixtureCatalog.fixtures.map((fixture) =>
    `- \`${fixture.fixtureId}\`: route \`${fixture.routeFamilyId}\`; owner \`${fixture.ownerWorkstream}\`; synthetic input only \`true\`; output manifest \`${fixture.expectedOutputManifest}\`.`,
  ).join('\n')}

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderInputOutputDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Fixture Input/Output Contract Map

${bundle.inputOutputContractMap.contracts.map((contract) =>
    `- \`${contract.fixtureId}\`: input \`${contract.fixtureInputManifest}\`; output \`${contract.expectedOutputManifest}\`; public artifact allowed \`false\`; signed URL source-of-truth allowed \`false\`.`,
  ).join('\n')}

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderOwnerHandoffDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Owner Fixture Handoff Map

${bundle.ownerFixtureHandoffMap.handoffs.map((handoff) =>
    `- \`${handoff.owner}\`: fixtures \`${handoff.fixtureIds.join(', ')}\`; review only \`true\`; execution authorized \`false\`.`,
  ).join('\n')}

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderQaDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Fixture QA Gate Map

${bundle.qaGateMap.gates.map((gate) =>
    `- \`${gate.gateId}\`: status \`${gate.status}\`; required \`true\`.`,
  ).join('\n')}

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderBlockedDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Blocked Execution Validation

All execution blocked: \`${bundle.blockedExecutionValidation.allExecutionBlocked}\`

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}

Blocked categories:

${bullet(bundle.blockedExecutionValidation.blockedCategories)}
`
}

function renderGapDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Gap Map

${bundle.gapMap.gaps.map((gap) =>
    `- \`${gap.gapId}\`: owner \`${gap.owner}\`; status \`${gap.status}\`; next action: ${gap.nextAction}`,
  ).join('\n')}

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderNextPhaseDoc(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-2 Next Phase Plan

Next phase: \`${bundle.nextPhasePlan.nextPhase}\`

Readiness: \`${bundle.nextPhasePlan.readiness}\`

Prompt: \`${bundle.nextPhasePlan.promptPath}\`

Required before execution:

${bullet(bundle.nextPhasePlan.requiredBeforeExecution)}

Blocked scope:

${bullet(bundle.nextPhasePlan.blockedScope)}

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderToolRoute3Prompt(bundle: ToolRouteFixturePlanningBundle): string {
  return `# TOOL-ROUTE-3 Generated Local Fixture Contract Tests Prompt

Implement TOOL-ROUTE-3 only after TOOL-ROUTE-2 reports \`${bundle.nextPhasePlan.readiness}\`.

Use committed TOOL-ROUTE-2 artifacts as source evidence:

- \`${TOOL_ROUTE_FIXTURE_REPORT_DIR}/fixtures/generated-local-fixture-catalog.json\`
- \`${TOOL_ROUTE_FIXTURE_REPORT_DIR}/contracts/fixture-input-output-contract-map.json\`
- \`${TOOL_ROUTE_FIXTURE_REPORT_DIR}/handoff/owner-fixture-handoff-map.json\`
- \`${TOOL_ROUTE_FIXTURE_REPORT_DIR}/qa/fixture-qa-gate-map.json\`
- \`${TOOL_ROUTE_FIXTURE_REPORT_DIR}/validation/fixture-blocked-execution-validation.json\`

TOOL-ROUTE-3 may run local contract tests against generated/local synthetic manifests only. It must not execute providers, tools, workers, routes, web search, browser capture, map rendering, media processing, audio generation, Track A render/export, Supabase, SQL, GCS, public artifact delivery, signed URL creation, beta, production, dependency mutation, raw prompt execution, final render/export, or broad service-role handling.

${TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT}
`
}

function renderReadinessState(bundle: ToolRouteFixturePlanningBundle): string {
  return renderMarkedDoc('docs/activation-readiness-state.md', 'TOOL-ROUTE-2', `## TOOL-ROUTE-2

- Status: \`${bundle.summary.status}\`
- Decision: \`${bundle.summary.decision}\`
- Run ID: \`${bundle.summary.runId}\`
- TOOL-ROUTE-3 readiness: \`${bundle.nextPhasePlan.readiness}\`
- Supabase milestone sync: \`blocked_current_branch_missing_sync_layer\`
- Runtime/tool/worker/provider/route execution: \`false\`
`)
}

function renderNextPhaseRunbook(bundle: ToolRouteFixturePlanningBundle): string {
  return renderMarkedDoc('docs/activation-next-phase-runbook.md', 'TOOL-ROUTE-2', `## TOOL-ROUTE-2 Current Next Prompt

\`${bundle.nextPhasePlan.promptPath}\`

## TOOL-ROUTE-3 Entry Criteria

- TOOL-ROUTE-2 status: \`${bundle.summary.status}\`
- TOOL-ROUTE-2 decision: \`${bundle.summary.decision}\`
- Fixture families mapped: \`${bundle.fixtureCatalog.fixtureCount}\`
- Fixture input/output contracts mapped: \`${bundle.inputOutputContractMap.contractCount}\`
- Owner fixture handoffs mapped: \`${bundle.ownerFixtureHandoffMap.ownerCount}\`

TOOL-ROUTE-3 remains generated/local fixture contract testing only. It does not authorize runtime, tool, worker, provider, route, Supabase, media, browser/map/web, public artifact, signed URL, beta, production, dependency mutation, raw prompt execution, or final render/export execution.
`)
}

export function buildToolRouteFixturePlanningBundle(input: {
  runId: string
  executionStatus?: ToolRouteFixturePlanningExecutionStatus
}): ToolRouteFixturePlanningBundle {
  const sourceAudit = buildToolRouteFixtureSourceAudit()
  const toolRoute1Evidence = loadToolRoute1EvidenceContext()
  const toolStudyEvidence = loadToolStudyFixtureEvidenceContext()
  const fixtureCatalog = buildGeneratedLocalFixtureCatalog({ toolRoute1Evidence, toolStudyEvidence })
  const inputOutputContractMap = buildFixtureInputOutputContractMap(fixtureCatalog)
  const ownerFixtureHandoffMap = buildOwnerFixtureHandoffMap(fixtureCatalog)
  const blockedExecutionValidation = validateFixtureBlockedExecution({
    catalog: fixtureCatalog,
    inputOutputContractMap,
    ownerFixtureHandoffMap,
  })
  const qaGateMap = buildFixtureQaGateMap({
    toolRoute1Evidence,
    toolStudyEvidence,
    catalog: fixtureCatalog,
    inputOutputContractMap,
    ownerFixtureHandoffMap,
    blockedExecutionValidation,
  })
  const gapMap = buildToolRouteFixtureGapMap(qaGateMap)
  const nextPhasePlan = buildToolRouteFixtureNextPhasePlan(gapMap)
  const activeBlockers = unique([
    ...sourceAudit.activeBlockers,
    ...toolRoute1Evidence.activeBlockers,
    ...toolStudyEvidence.activeBlockers,
    ...fixtureCatalog.activeBlockers,
    ...inputOutputContractMap.activeBlockers,
    ...ownerFixtureHandoffMap.activeBlockers,
    ...blockedExecutionValidation.activeBlockers,
    ...qaGateMap.activeBlockers,
    ...gapMap.activeBlockers,
  ])
  const decision = selectDecision(activeBlockers)
  const status = statusFromDecision(decision)
  const executionStatus = input.executionStatus ?? 'not_attempted'
  const summary = {
    phase: 'TOOL_ROUTE_2',
    owner: TOOL_ROUTE_FIXTURE_OWNER,
    runId: input.runId,
    status,
    decision,
    executionStatus,
    branch: TOOL_ROUTE_FIXTURE_BRANCH,
    baseBranch: TOOL_ROUTE_FIXTURE_BASE_BRANCH,
    prTitle: TOOL_ROUTE_FIXTURE_PR_TITLE,
    sourceEvidence: sourceAudit.sourceEvidence,
    toolRoute1Evidence: {
      runId: toolRoute1Evidence.runId,
      decision: toolRoute1Evidence.decision,
      readiness: toolRoute1Evidence.readiness,
      routeFamilyCount: toolRoute1Evidence.routeFamilyCount,
      ownerRouteCount: toolRoute1Evidence.ownerRouteCount,
    },
    completedOwnerStudies: toolStudyEvidence.completedStudyCount,
    fixtureCatalog: {
      status: fixtureCatalog.status,
      fixtureCount: fixtureCatalog.fixtureCount,
      allFixturesMapped: fixtureCatalog.allFixturesMapped,
      allInputsSyntheticOnly: fixtureCatalog.allInputsSyntheticOnly,
      fixtureIds: fixtureCatalog.fixtures.map((fixture) => fixture.fixtureId),
    },
    inputOutputContractMap: {
      status: inputOutputContractMap.status,
      contractCount: inputOutputContractMap.contractCount,
      allContractsPrivateSyntheticOnly: inputOutputContractMap.allContractsPrivateSyntheticOnly,
    },
    ownerFixtureHandoffMap: {
      status: ownerFixtureHandoffMap.status,
      ownerCount: ownerFixtureHandoffMap.ownerCount,
      allRequiredOwnersMapped: ownerFixtureHandoffMap.allRequiredOwnersMapped,
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
    toolRoute3Readiness: nextPhasePlan.readiness,
    diagnostics: {
      status: status === 'passed' ? 'passed' : 'blocked',
      script: 'scripts/validation/tool-route-generated-local-fixture-planning-diagnostics.mjs',
    },
    safetyFlags: TOOL_ROUTE_FIXTURE_SAFETY_FLAGS,
    noScopeStatement: TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT,
    supabaseUpdateClassification: buildToolRouteFixtureSupabaseClassification(activeBlockers),
    activeBlockers,
  }
  const qa = {
    phase: 'TOOL_ROUTE_2' as const,
    runId: input.runId,
    status,
    decision,
    gates: qaGateMap,
    safetyFlags: TOOL_ROUTE_FIXTURE_SAFETY_FLAGS,
    passed: status === 'passed' && activeBlockers.length === 0,
  }
  const report = {
    ...summary,
    sourceAudit,
    toolRoute1Evidence,
    toolStudyEvidence,
    fixtureCatalog,
    inputOutputContractMap,
    ownerFixtureHandoffMap,
    qa,
    gapMap,
    nextPhasePlan,
  }
  const docs = {
    'docs/tool-routes/tool-route-2-generated-local-fixture-planning.md': renderMainDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/tool-routes/tool-route-2-fixture-catalog.md': renderFixtureCatalogDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/tool-routes/tool-route-2-fixture-input-output-contract-map.md': renderInputOutputDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/tool-routes/tool-route-2-owner-fixture-handoff-map.md': renderOwnerHandoffDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/tool-routes/tool-route-2-fixture-qa-gate-map.md': renderQaDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/tool-routes/tool-route-2-blocked-execution-validation.md': renderBlockedDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/tool-routes/tool-route-2-gap-map.md': renderGapDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/tool-routes/tool-route-2-next-phase-plan.md': renderNextPhaseDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/activation-phase-tool-route-2-generated-local-fixture-planning-results.md': renderResultsDoc({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/implementation-prompts/prompt-tool-route-3-generated-local-fixture-contract-tests.md': renderToolRoute3Prompt({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/activation-readiness-state.md': renderReadinessState({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
    'docs/activation-next-phase-runbook.md': renderNextPhaseRunbook({
      sourceAudit,
      toolRoute1Evidence,
      toolStudyEvidence,
      fixtureCatalog,
      inputOutputContractMap,
      ownerFixtureHandoffMap,
      qaGateMap,
      blockedExecutionValidation,
      gapMap,
      nextPhasePlan,
      qa,
      report,
      summary,
      docs: {},
      activeBlockers,
    }),
  }

  return {
    sourceAudit,
    toolRoute1Evidence,
    toolStudyEvidence,
    fixtureCatalog,
    inputOutputContractMap,
    ownerFixtureHandoffMap,
    qaGateMap,
    blockedExecutionValidation,
    gapMap,
    nextPhasePlan,
    qa,
    report,
    summary,
    docs,
    activeBlockers,
  }
}
