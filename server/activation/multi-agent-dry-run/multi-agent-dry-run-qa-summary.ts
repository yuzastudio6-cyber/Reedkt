import { agentRoleRegistry } from '../shared-agent-tool-architecture'
import { toolCapabilityRecords } from '../tool-capability-registry-audit'
import { multiAgentDryRunRequiredScripts, multiAgentDryRunSafetyFlags } from './multi-agent-dry-run-policy'
import type {
  EditIntentCandidate,
  MultiAgentDryRunManifest,
  MultiAgentDryRunQaGate,
  MultiAgentDryRunQaSummary,
  MultiAgentDryRunScenario,
  MultiAgentFinding,
  MultiAgentDryRunSupabaseSyncResult,
  ProducerGateResult,
  QaSafetyGateResult,
} from './multi-agent-dry-run-types'

export function buildMultiAgentDryRunQaSummary(input: {
  packageScripts: Record<string, string>
  scenarios: MultiAgentDryRunScenario[]
  findings: MultiAgentFinding[]
  editIntents: EditIntentCandidate[]
  producerGateResults: ProducerGateResult[]
  qaSafetyGateResults: QaSafetyGateResult[]
  manifest: MultiAgentDryRunManifest
  findingSchemaBlockers: string[]
  intentSchemaBlockers: string[]
  producerGateBlockers: string[]
  supabaseSyncResult?: MultiAgentDryRunSupabaseSyncResult
  executionMode: boolean
}): MultiAgentDryRunQaSummary {
  const gates: MultiAgentDryRunQaGate[] = [
    gate(
      'phase52b_evidence',
      toolCapabilityRecords.length === 67 && input.manifest.scenarioCount >= 6,
      `Phase 52B registry records available: ${toolCapabilityRecords.length}/67.`,
    ),
    gate(
      'agent_coverage',
      agentRoleRegistry.every((role) => input.manifest.agentCoverage.includes(role.agentId as never)),
      `Agent coverage: ${input.manifest.agentCoverage.length}/${agentRoleRegistry.length}.`,
    ),
    gate(
      'scenario_coverage',
      input.scenarios.length >= 6 && input.editIntents.length >= 11,
      `Scenarios: ${input.scenarios.length}; edit intent candidates: ${input.editIntents.length}.`,
    ),
    gate('finding_schema_compliance', input.findingSchemaBlockers.length === 0, input.findingSchemaBlockers[0] ?? 'Findings include the required Phase 52A schema fields.'),
    gate('edit_intent_schema_compliance', input.intentSchemaBlockers.length === 0, input.intentSchemaBlockers[0] ?? 'Edit intents include the required Phase 52A schema fields.'),
    gate(
      'capability_gating',
      input.editIntents.some((intent) => intent.intentType === 'qwen_vlm_visual_understanding_request' && intent.blocked) &&
        input.editIntents.some((intent) => intent.intentType === 'demucs_stem_separation_request' && intent.blocked),
      'VLM and Demucs requests are blocked by registry capability gates.',
    ),
    gate('producer_gate', input.producerGateBlockers.length === 0, input.producerGateBlockers[0] ?? 'Producer gate allows only internal-testing candidate-plan-only intents.'),
    gate(
      'qa_safety_gate',
      input.qaSafetyGateResults.every((item) => item.status === 'passed'),
      input.qaSafetyGateResults.find((item) => item.status !== 'passed')?.summary ?? 'QA/Safety gate passed runtime absence and policy checks.',
    ),
    gate(
      'source_of_truth_policy',
      input.manifest.sourceOfTruthPolicy.length >= 4 && input.manifest.runtimeExecutionUsed === false,
      'Source-of-truth rules remain manifest/private-gs:// based; previews/screenshots are not source of truth.',
    ),
    gate(
      'supabase_milestone_sync',
      input.executionMode ? input.supabaseSyncResult?.status === 'completed' : true,
      input.executionMode
        ? input.supabaseSyncResult?.blockers[0] ?? 'Phase 52C Supabase milestone sync completed.'
        : 'Static mode records Supabase sync as execution-only.',
    ),
    gate(
      'blocked_features',
      !multiAgentDryRunSafetyFlags.toolRuntimeExecutionAllowed &&
        !multiAgentDryRunSafetyFlags.providerCallsAllowed &&
        !multiAgentDryRunSafetyFlags.webSearchAllowed &&
        !multiAgentDryRunSafetyFlags.mapRenderingAllowed &&
        !multiAgentDryRunSafetyFlags.mediaProcessingAllowed &&
        !multiAgentDryRunSafetyFlags.productionReadyAllowed &&
        !multiAgentDryRunSafetyFlags.externalBetaAllowed &&
        multiAgentDryRunRequiredScripts.every((script) => Boolean(input.packageScripts[script])),
      'Runtime execution, providers, web search, map rendering, media processing, production/beta, public artifacts, and raw prompt execution remain blocked; package scripts are present.',
    ),
  ]
  const blockers = gates.filter((item) => item.mandatory && !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings: input.executionMode ? [] : ['Supabase readback and artifact upload are verified only during confirmed execution.'],
  }
}

function gate(gateId: MultiAgentDryRunQaGate['gateId'], passed: boolean, summary: string): MultiAgentDryRunQaGate {
  return { gateId, passed, mandatory: true, summary }
}
