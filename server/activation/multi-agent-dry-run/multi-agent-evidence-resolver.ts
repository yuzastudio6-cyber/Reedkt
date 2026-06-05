import { agentRoleRegistry } from '../shared-agent-tool-architecture'
import { buildToolCapabilityRegistrySummary, toolCapabilityRecords } from '../tool-capability-registry-audit'
import { multiAgentDryRunConfig } from './multi-agent-dry-run-policy'
import type { MultiAgentEvidenceContext, MultiAgentEvidenceRef } from './multi-agent-dry-run-types'

const phase52A: MultiAgentEvidenceRef = {
  phaseId: '52A',
  runId: multiAgentDryRunConfig.canonicalPhase52ARunId,
  reference: 'docs/activation-phase-52a-shared-agent-tool-architecture-results.md',
  evidenceType: 'committed_doc',
}

const phase52B: MultiAgentEvidenceRef = {
  phaseId: '52B',
  runId: multiAgentDryRunConfig.canonicalPhase52BRunId,
  reference: 'docs/activation-phase-52b-tool-capability-registry-audit-results.md',
  evidenceType: 'capability_registry',
}

export function buildMultiAgentEvidenceContext(input: {
  supabaseCapabilityReadback?: MultiAgentEvidenceContext['supabaseCapabilityReadback']
} = {}): MultiAgentEvidenceContext {
  const summary = buildToolCapabilityRegistrySummary(toolCapabilityRecords)
  return {
    phase52A,
    phase52B,
    canonicalRegistryRecordCount: 67,
    committedRegistryRecordCount: toolCapabilityRecords.length,
    supabaseCapabilityReadback: input.supabaseCapabilityReadback ?? {
      attempted: false,
      status: 'not_attempted',
      recordCount: 0,
      expectedCount: toolCapabilityRecords.length,
      blockers: [],
      warnings: ['Supabase tool capability readback is execution-only; static report uses committed registry records.'],
    },
    capabilities: toolCapabilityRecords,
    capabilitySummary: {
      totalRecords: summary.totalRecords,
      byTrack: summary.byTrack,
      internalTestingReadyCount: summary.internalTestingReadyCount,
      blockedOrFutureCount: summary.totalRecords - summary.internalTestingReadyCount,
    },
    sourceOfTruthRules: [
      'Agents emit structured findings and edit-intent candidates only.',
      'Workers execute only approved plan snapshots with rawPromptExecution=false.',
      'Web search source of truth is source/capture/extraction manifests, not screenshots or signed URLs.',
      'Map/geospatial source of truth is source records, location candidates, GeoJSON, Turf/style/camera/render manifests; screenshots are QA artifacts only.',
      'Supabase stores structured milestone metadata and private gs:// references only.',
      'Video, graphics, and audio outputs consume approved source manifests rather than preview artifacts.',
    ],
    executionProof: {
      runtimeExecutionUsed: false,
      workerExecutionUsed: false,
      modelInferenceUsed: false,
      providerCallUsed: false,
      webSearchUsed: false,
      browserCaptureUsed: false,
      mapRenderingUsed: false,
      mediaProcessingUsed: false,
      migrationsUsed: false,
    },
  }
}

export function requiredAgentIds() {
  return agentRoleRegistry.map((role) => role.agentId)
}
