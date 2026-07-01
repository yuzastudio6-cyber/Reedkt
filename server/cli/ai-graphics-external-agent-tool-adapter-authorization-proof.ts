import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION,
  buildAiGraphicsExternalAgentToolAdapterAuthorization,
} from '../tool-registry/ai-graphics-external-agent-tool-adapter-authorization'

const sourceControlledDispatcherDryRunPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.json'
const sourceControlledDispatcherDryRunDecision =
  'ai_graphics_external_agent_controlled_dispatcher_dry_run_proof_passed_with_runtime_blocks'
const sourceControlledDispatcherDryRunStatus =
  'controlled_dispatcher_dry_run_completed_all_21_no_tool_execution'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function main() {
  const source = readJson(sourceControlledDispatcherDryRunPath)
  assert(
    source.decision === sourceControlledDispatcherDryRunDecision,
    'Source controlled dispatcher dry-run decision mismatch',
  )
  assert(
    source.status === sourceControlledDispatcherDryRunStatus,
    'Source controlled dispatcher dry-run status mismatch',
  )
  assert(
    source.counts?.controlledDispatcherDryRunCompletedTools === 21,
    'Source controlled dispatcher dry-run must complete all 21 tools',
  )
  assert(
    source.counts?.aiGraphicsToolCallHandoffRouteTools === 21,
    'Source controlled dispatcher dry-run must create 21 handoff routes',
  )
  assert(
    source.counts?.gpuRuntimeShouldStartNowTools === 0,
    'Source controlled dispatcher dry-run must not start GPU runtime',
  )
  assert(
    source.booleans?.agentCanExecuteToolsNow === false,
    'Source controlled dispatcher dry-run must keep agent execution false',
  )
  assert(
    source.booleans?.toolExecutionPerformed === false,
    'Source controlled dispatcher dry-run must not execute tools',
  )
  assert(
    source.booleans?.gpuRuntimePerformed === false,
    'Source controlled dispatcher dry-run must not perform GPU runtime',
  )

  const report = buildAiGraphicsExternalAgentToolAdapterAuthorization({
    sourceControlledDispatcherDryRunDecision: source.decision,
    sourceControlledDispatcherDryRunStatus: source.status,
    sourceControlledDispatcherDryRunCompletedTools:
      source.counts.controlledDispatcherDryRunCompletedTools,
    sourceAiGraphicsHandoffRouteTools:
      source.counts.aiGraphicsToolCallHandoffRouteTools,
    sourceGpuRuntimeShouldStartNowTools:
      source.counts.gpuRuntimeShouldStartNowTools,
  })

  assert(
    report.decision === AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION,
    'Unexpected adapter authorization decision',
  )
  assert(report.counts.adapterAuthorizationRows === 21, 'Adapter authorization must cover 21 tools')
  assert(
    report.counts.adapterContractsAuthorizedWithRuntimeBlocks === 21,
    'All 21 adapter contracts must be authorized with runtime blocks',
  )
  assert(report.counts.cpuStaticToolAdapterContracts === 6, 'CPU/static adapter contract count mismatch')
  assert(report.counts.browserRuntimeToolAdapterContracts === 7, 'Browser runtime adapter contract count mismatch')
  assert(report.counts.gpuModelToolAdapterContracts === 8, 'GPU/model adapter contract count mismatch')
  assert(report.counts.externalAgentCanInvokeAdapterNowTools === 0, 'No adapter may be invokable now')
  assert(report.counts.toolExecutionApprovedNowTools === 0, 'No tool execution may be approved now')
  assert(report.counts.gpuRuntimeShouldStartNowTools === 0, 'No GPU runtime may start now')
  assert(report.booleans.sourceControlledDispatcherDryRunAccepted === true, 'Source dry-run not accepted')
  assert(report.booleans.all21AdapterContractsAuthorizedWithRuntimeBlocks === true, 'Adapter contracts not all authorized')
  assert(report.booleans.externalAgentCanInvokeAdapterNow === false, 'Adapter invocation must remain false')
  assert(report.booleans.agentCanExecuteToolsNow === false, 'Agent tool execution must remain false')
  assert(report.booleans.routeExecutionApprovedNow === false, 'Route execution must remain false')
  assert(report.booleans.workerExecutionApprovedNow === false, 'Worker execution must remain false')
  assert(report.booleans.toolExecutionApprovedNow === false, 'Tool execution must remain false')
  assert(report.booleans.gpuRuntimeApprovedNow === false, 'GPU runtime approval must remain false')
  assert(report.booleans.gpuRuntimeShouldStartNow === false, 'GPU runtime must not start now')

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
