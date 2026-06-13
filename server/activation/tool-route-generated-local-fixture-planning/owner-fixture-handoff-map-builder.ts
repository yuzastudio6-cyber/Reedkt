import { TOOL_ROUTE_FIXTURE_OWNER_IDS } from './tool-route-fixture-planning-policy'
import type {
  GeneratedLocalFixtureCatalog,
  OwnerFixtureHandoff,
  OwnerFixtureHandoffMap,
  ToolRouteFixtureOwner,
} from './tool-route-fixture-planning-types'

function responsibilities(owner: ToolRouteFixtureOwner): string[] {
  return [
    `Review generated/local fixture contract scope for ${owner}.`,
    'Confirm synthetic inputs only and expected output manifests only.',
    'Confirm no runtime, worker, provider, tool, route, Supabase, public artifact, signed URL, beta, or production execution is authorized.',
    'Approve or block TOOL-ROUTE-3 generated-local fixture contract tests for owned routes.',
  ]
}

export function buildOwnerFixtureHandoffMap(
  catalog: GeneratedLocalFixtureCatalog,
): OwnerFixtureHandoffMap {
  const handoffs: OwnerFixtureHandoff[] = TOOL_ROUTE_FIXTURE_OWNER_IDS.map((owner) => {
    const fixtures = catalog.fixtures.filter((fixture) => fixture.ownerWorkstream === owner)
    return {
      owner,
      fixtureIds: fixtures.map((fixture) => fixture.fixtureId),
      sourceContracts: fixtures.map((fixture) => fixture.sourceToolStudyContract),
      responsibilities: responsibilities(owner),
      handoffType: 'review_planning_only',
      ownerApprovalRequired: true,
      executionAuthorized: false,
      nextAction:
        fixtures.length > 0
          ? 'Review fixture contracts before TOOL-ROUTE-3 generated-local fixture contract tests.'
          : 'Review coordination-only fixture planning evidence before TOOL-ROUTE-3.',
    }
  })
  const activeBlockers = [
    ...catalog.activeBlockers,
    ...handoffs.filter((handoff) => handoff.fixtureIds.length === 0).map((handoff) => `missing_owner_fixture_handoff:${handoff.owner}`),
    ...(handoffs.every((handoff) => !handoff.executionAuthorized) ? [] : ['unsafe_owner_handoff_execution_authorized']),
  ]

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    handoffs,
    ownerCount: handoffs.length,
    allRequiredOwnersMapped: activeBlockers.length === 0,
    activeBlockers,
  }
}
