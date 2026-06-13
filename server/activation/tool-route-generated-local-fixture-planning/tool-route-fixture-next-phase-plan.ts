import type { ToolRouteFixtureGapMap, ToolRouteFixtureNextPhasePlan } from './tool-route-fixture-planning-types'

export function buildToolRouteFixtureNextPhasePlan(
  gapMap: ToolRouteFixtureGapMap,
): ToolRouteFixtureNextPhasePlan {
  return {
    phase: 'TOOL_ROUTE_2',
    nextPhase: 'TOOL_ROUTE_3',
    readiness: gapMap.toolRoute3Readiness,
    promptPath: 'docs/implementation-prompts/prompt-tool-route-3-generated-local-fixture-contract-tests.md',
    requiredBeforeExecution: [
      'Use TOOL-ROUTE-2 generated/local fixture catalog as the only source of fixture contracts.',
      'Run contract tests against synthetic local manifests only.',
      'Keep all runtime/tool/worker/provider/route execution flags false.',
      'Keep Supabase, SQL, GCS, public artifact, signed URL, beta, production, and final render/export paths blocked.',
      'Require owner review before any future fixture execution phase.',
    ],
    blockedScope: [
      'No real provider/model calls.',
      'No worker claim/lease writes or runtime job execution.',
      'No web search, browser capture, map rendering, media processing, audio generation, or Track A render/export.',
      'No Supabase mutation, SQL, migrations, schema/RLS change, storage transfer, public artifacts, signed URLs, beta, or production.',
    ],
  }
}
