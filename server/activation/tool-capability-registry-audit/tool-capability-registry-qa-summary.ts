import { toolCapabilityRegistryExpectedCounts, toolCapabilityRegistryRequiredScripts } from './tool-capability-registry-policy'
import { buildToolCapabilityRegistrySummary, toolCapabilityRecords } from './canonical-tool-capability-records'
import type {
  ToolCapabilityRegistryQaGate,
  ToolCapabilityRegistryQaGateId,
  ToolCapabilityRegistryQaSummary,
  ToolCapabilityRegistrySupabaseSyncResult,
  ToolCapabilityRegistryValidation,
} from './tool-capability-registry-types'

export function buildToolCapabilityRegistryQaSummary(input: {
  packageScripts: Record<string, string>
  validation: ToolCapabilityRegistryValidation
  supabaseSyncResult?: ToolCapabilityRegistrySupabaseSyncResult
  executionMode: boolean
}): ToolCapabilityRegistryQaSummary {
  const summary = buildToolCapabilityRegistrySummary(toolCapabilityRecords)
  const scriptsPresent = toolCapabilityRegistryRequiredScripts.every((script) => script in input.packageScripts)
  const supabaseSyncCompleted = input.supabaseSyncResult?.status === 'completed'
  const supabaseToolCapabilitySyncCompleted = Boolean(input.supabaseSyncResult && input.supabaseSyncResult.toolCapabilityReadbackCount === toolCapabilityRegistryExpectedCounts.total)
  const gates: ToolCapabilityRegistryQaGate[] = [
    gate('phase52a_evidence', input.validation.ok && toolCapabilityRecords.every((item) => item.readinessEvidence.some((evidence) => evidence.phaseId === '52A') || item.lastValidatedPhase !== '52A'), 'Phase 52A ownership architecture evidence is referenced where required.'),
    gate('capability_schema_compliance', input.validation.ok, 'All records include Phase 52A manifest fields and Phase 52B required readiness fields.'),
    gate('track_a_capabilities', summary.byTrack.track_a_visual_video === 13, 'Track A visual/video capability records total 13.'),
    gate('web_search_capabilities', summary.byTrack.web_search === 8, 'Web search/capture capability records total 8.'),
    gate('map_geospatial_capabilities', summary.byTrack.map_geospatial === 12, 'Map/geospatial capability records total 12.'),
    gate('supabase_capabilities', summary.byTrack.supabase === 4, 'Supabase milestone/readiness capability records total 4.'),
    gate('ai_tools_placeholders', summary.byTrack.ai_tools === 12, 'AI Tools placeholder capability records total 12.'),
    gate('track_b_placeholders', summary.byTrack.track_b === 18, 'Track B placeholder/status records total 18.'),
    gate('ownership_boundaries', ownershipBoundariesPass(), 'D3/Three.js/graphics remain AI Tools-owned, Sharp/libvips general remains Track B-owned, and this chat owns only web/map/Supabase/readiness coordination.'),
    gate('supabase_tool_capability_sync', input.executionMode ? supabaseToolCapabilitySyncCompleted : true, input.executionMode ? 'Supabase tool_capabilities readback must match all 67 registry records.' : 'Static mode verifies the sync contract without writing.'),
    gate('supabase_milestone_sync', input.executionMode ? supabaseSyncCompleted : true, input.executionMode ? 'Phase 52B milestone sync must write/read back successfully.' : 'Static mode keeps milestone sync planned and gated.'),
    gate('blocked_features', scriptsPresent && blockedFeaturesPass(), 'Package scripts are present and production/beta/provider/tool-runtime paths remain blocked.'),
  ]
  const blockers = [...input.validation.blockers]
  if (!scriptsPresent) blockers.push(`Missing package scripts: ${toolCapabilityRegistryRequiredScripts.filter((script) => !(script in input.packageScripts)).join(', ')}`)
  if (input.executionMode && !supabaseSyncCompleted) blockers.push('Supabase milestone sync did not complete.')
  if (input.executionMode && !supabaseToolCapabilitySyncCompleted) blockers.push('Supabase tool_capabilities readback did not include all 67 registry records.')
  blockers.push(...gates.filter((item) => !item.passed).map((item) => `QA gate failed: ${item.gateId}`))
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: input.validation.warnings,
  }
}

function gate(gateId: ToolCapabilityRegistryQaGateId, passed: boolean, summary: string): ToolCapabilityRegistryQaGate {
  return { gateId, passed, mandatory: true, summary }
}

function ownershipBoundariesPass(): boolean {
  const d3 = toolCapabilityRecords.find((item) => item.toolId === 'd3_dataviz')
  const three = toolCapabilityRecords.find((item) => item.toolId === 'threejs_creative_3d')
  const sharp = toolCapabilityRecords.find((item) => item.toolId === 'sharp_libvips_general')
  return d3?.owningChat === 'ai_tools' && three?.owningChat === 'ai_tools' && sharp?.owningChat === 'track_b'
}

function blockedFeaturesPass(): boolean {
  return toolCapabilityRecords.every((item) =>
    !item.productionReady
    && !item.runtimeExecutionAllowed
    && !item.frontendExecutionAllowed
    && !item.providerCallAllowed
    && !item.publicArtifactAllowed
    && !item.signedUrlSourceOfTruthAllowed
    && !item.rawPromptExecutionAllowed
  )
}
