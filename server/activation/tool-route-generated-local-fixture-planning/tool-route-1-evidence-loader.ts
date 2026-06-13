import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_FIXTURE_OWNER_IDS,
  TOOL_ROUTE_FIXTURE_ROUTE_FAMILY_IDS,
  TOOL_ROUTE_FIXTURE_SOURCE,
  TOOL_ROUTE_FIXTURE_SOURCE_PATHS,
} from './tool-route-fixture-planning-policy'
import type {
  ToolRoute1EvidenceContext,
  ToolRouteFixtureOwner,
  ToolRouteFixtureRouteFamilyId,
} from './tool-route-fixture-planning-types'

function readJson(path: string): Record<string, unknown> | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function objectArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : []
}

export function loadToolRoute1EvidenceContext(): ToolRoute1EvidenceContext {
  const report = readJson(TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1Report)
  const familyPlan = readJson(TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1RouteFamilyPlan)
  const ownerPlan = readJson(TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1OwnerRoutePlan)
  const artifactMap = readJson(TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1ArtifactContractMap)
  const qaGateMap = readJson(TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1QaGateMap)
  const blockedExecution = readJson(TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1BlockedExecution)

  const routeFamilyIds = stringArray(familyPlan?.familyIds).length > 0
    ? stringArray(familyPlan?.familyIds) as ToolRouteFixtureRouteFamilyId[]
    : objectArray(familyPlan?.families).map((family) => String(family.familyId)) as ToolRouteFixtureRouteFamilyId[]
  const ownerIds = stringArray(ownerPlan?.owners).length > 0
    ? stringArray(ownerPlan?.owners) as ToolRouteFixtureOwner[]
    : objectArray(ownerPlan?.ownerRoutes).map((route) => String(route.owner)) as ToolRouteFixtureOwner[]
  const activeBlockers = [
    ...(!report ? ['missing_tool_route_1_report'] : []),
    ...(!familyPlan ? ['missing_tool_route_1_route_family_plan'] : []),
    ...(!ownerPlan ? ['missing_tool_route_1_owner_route_plan'] : []),
    ...(!artifactMap ? ['missing_tool_route_1_artifact_contract_map'] : []),
    ...(!qaGateMap ? ['missing_tool_route_1_qa_gate_map'] : []),
    ...(!blockedExecution ? ['missing_tool_route_1_blocked_execution_validation'] : []),
    ...(report?.runId === TOOL_ROUTE_FIXTURE_SOURCE.toolRoute1RunId ? [] : [`unexpected_tool_route_1_run:${String(report?.runId)}`]),
    ...(report?.status === 'passed' ? [] : [`unexpected_tool_route_1_status:${String(report?.status)}`]),
    ...(report?.decision === TOOL_ROUTE_FIXTURE_SOURCE.toolRoute1Decision ? [] : [`unexpected_tool_route_1_decision:${String(report?.decision)}`]),
    ...(report?.toolRoute2Readiness === 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning'
      ? []
      : [`unexpected_tool_route_2_readiness:${String(report?.toolRoute2Readiness)}`]),
    ...(routeFamilyIds.length === TOOL_ROUTE_FIXTURE_ROUTE_FAMILY_IDS.length
      ? []
      : [`unexpected_tool_route_1_family_count:${routeFamilyIds.length}`]),
    ...(ownerIds.length === TOOL_ROUTE_FIXTURE_OWNER_IDS.length
      ? []
      : [`unexpected_tool_route_1_owner_count:${ownerIds.length}`]),
    ...(blockedExecution?.allExecutionBlocked === true ? [] : ['tool_route_1_execution_not_blocked']),
  ]

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    runId: TOOL_ROUTE_FIXTURE_SOURCE.toolRoute1RunId,
    decision: String(report?.decision ?? 'missing'),
    readiness: String(report?.toolRoute2Readiness ?? 'missing'),
    routeFamilyIds,
    ownerIds,
    routeFamilyCount: Number(familyPlan?.routeFamilyCount ?? 0),
    ownerRouteCount: Number(ownerPlan?.ownerRouteCount ?? 0),
    artifactContractCount: Number(artifactMap?.artifactContractCount ?? 0),
    qaGateCount: Number(qaGateMap?.gateCount ?? 0),
    allExecutionBlocked: blockedExecution?.allExecutionBlocked === true,
    evidencePaths: [
      TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1Report,
      TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1RouteFamilyPlan,
      TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1OwnerRoutePlan,
      TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1ArtifactContractMap,
      TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1QaGateMap,
      TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1BlockedExecution,
    ],
    activeBlockers,
  }
}
