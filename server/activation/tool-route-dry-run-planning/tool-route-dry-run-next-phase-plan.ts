import {
  TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT,
} from './tool-route-dry-run-planning-policy'
import type {
  ToolRouteDryRunGapMap,
  ToolRouteDryRunNextPhasePlan,
} from './tool-route-dry-run-planning-types'

export function buildToolRouteDryRunNextPhasePlan(
  gapMap: ToolRouteDryRunGapMap,
): ToolRouteDryRunNextPhasePlan {
  return {
    phase: 'TOOL_ROUTE_1',
    nextPhase: 'TOOL_ROUTE_2',
    readiness: gapMap.toolRoute2Readiness,
    promptPath: 'docs/implementation-prompts/prompt-tool-route-2-generated-local-fixture-planning.md',
    requiredBeforeExecution: [
      'TOOL-ROUTE-2 may plan generated local fixtures only; it must not execute route/tool/worker/provider paths.',
      'Every fixture route must preserve owner approval requirements and private manifest source-of-truth rules.',
      'Any real runtime execution requires a separate explicit approval milestone after fixture planning.',
    ],
    blockedScope: [
      TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT,
      'Public artifacts, signed URLs, Supabase mutation, provider/model calls, and beta/production unlocks remain blocked.',
    ],
  }
}
