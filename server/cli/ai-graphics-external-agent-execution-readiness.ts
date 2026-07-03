import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks'
const status =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md'

type ReadinessState =
  | 'callable'
  | 'executable'
  | 'blocked_with_reason'
  | 'failed_with_diagnostics'

type ToolGroup = 'cpu_static' | 'browser_runtime' | 'gpu_model'

type JsonRecord = Record<string, any>

const cpuStaticTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
)
const browserRuntimeTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
)
const gpuModelTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
)

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function runJsonCommand(command: string): JsonRecord {
  const output = childProcess.execSync(command, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
  })
  return JSON.parse(output) as JsonRecord
}

function groupForTool(toolId: AiGraphicsCanonicalToolId): ToolGroup {
  if (cpuStaticTools.has(toolId)) return 'cpu_static'
  if (browserRuntimeTools.has(toolId)) return 'browser_runtime'
  if (gpuModelTools.has(toolId)) return 'gpu_model'
  throw new Error(`Unsupported AI graphics tool: ${toolId}`)
}

function sourceReport(pathFlag: string, defaultPath: string, command: string): JsonRecord {
  if (hasFlag('--use-records-only')) {
    return readJson(stringFlag(pathFlag) ?? defaultPath)
  }
  return runJsonCommand(command)
}

function localInputKeys(row: JsonRecord | undefined): string[] {
  const requirements = Array.isArray(row?.localInputRequirements)
    ? row?.localInputRequirements
    : []
  return requirements
    .filter((requirement: JsonRecord) => (
      requirement?.requiredForActualExecution === true &&
      typeof requirement?.key === 'string'
    ))
    .map((requirement: JsonRecord) => requirement.key)
}

function nextGpuCommand(toolId: string): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness --',
    '--attempt-local-runtime',
    `--tool ${toolId}`,
    '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>',
    '--source-image <private-approved-frame.png>',
    toolId === 'sam2' ? '--sam2-checkpoint <private-sam2-checkpoint.pt>' : '',
    toolId === 'birefnet' ? '--birefnet-model <private-birefnet-model>' : '',
    toolId === 'real_esrgan' ? '--real-esrgan-model <private-real-esrgan-model.pth>' : '',
    toolId === 'rembg' ? '--rembg-model <private-rembg-model.onnx>' : '',
    toolId === 'transparent_background'
      ? '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>'
      : '',
  ].filter(Boolean).join(' ')
}

function buildToolRows(routeSmoke: JsonRecord, gpuHarness: JsonRecord) {
  const routeRows = new Map<string, JsonRecord>(
    (Array.isArray(routeSmoke.results) ? routeSmoke.results : [])
      .map((row: JsonRecord) => [row.toolId, row]),
  )
  const gpuRows = new Map<string, JsonRecord>(
    (
      Array.isArray(gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows)
        ? gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )

  return AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const readiness = getAiGraphicsToolCallReadiness(toolId)
    assert(readiness, `Missing tool-call readiness record for ${toolId}`)
    const group = groupForTool(toolId)
    const routeRow = routeRows.get(toolId)
    assert(routeRow, `Missing all-21 route smoke row for ${toolId}`)
    const gpuRow = gpuRows.get(toolId)

    const routeCallable =
      routeRow.statusCode === 200 && routeRow.controlledAdapterInvokedNow === true
    const adapterReachable = routeCallable
    const gpuAdapterStatus = String(gpuRow?.adapterStatus ?? '')
    const gpuRuntimeSucceeded = gpuRow?.localRuntimeExecutionPerformed === true
    const gpuRuntimeFailed =
      gpuAdapterStatus === 'controlled_gpu_model_adapter_failed_before_output'
    const executionAttempted =
      group === 'gpu_model'
        ? gpuRuntimeSucceeded || gpuRuntimeFailed
        : routeRow.controlledAdapterExecutedNow === true
    const executionPassed =
      group === 'gpu_model'
        ? gpuRuntimeSucceeded &&
          gpuRow?.toolExecutionApprovedNow === true
        : routeRow.controlledAdapterExecutedNow === true &&
          routeRow.localPackageExecutionPerformed === true &&
          typeof routeRow.outputSha256 === 'string' &&
          routeRow.outputSha256.length === 64
    const failed =
      !routeCallable ||
      (executionAttempted && !executionPassed) ||
      routeRow.publicArtifactCreated === true ||
      routeRow.signedUrlCreated === true ||
      routeRow.gpuRuntimeShouldStartNow === true && group !== 'gpu_model'
    const readinessState: ReadinessState = failed
      ? 'failed_with_diagnostics'
      : executionPassed
      ? 'executable'
      : group === 'gpu_model'
      ? 'blocked_with_reason'
      : 'callable'

    const blockingPrerequisite = group === 'gpu_model' && !executionPassed
      ? [
          'approved native CUDA host',
          ...localInputKeys(gpuRow),
          'reviewed private proof refs',
          gpuRow?.skipReasonCode
            ? `adapter skip reason: ${gpuRow.skipReasonCode}`
            : 'local runtime not attempted',
        ].join('; ')
      : null

    return {
      toolId,
      displayName: readiness.displayName,
      packageName: readiness.packageName,
      primaryCapability: routeRow.capabilityId,
      group,
      callable: routeCallable,
      executable: executionPassed,
      blockedWithReason: readinessState === 'blocked_with_reason',
      failedWithDiagnostics: readinessState === 'failed_with_diagnostics',
      readinessState,
      routeCallable,
      adapterReachable,
      executionAttempted,
      executionPassed,
      outputKind: routeRow.outputKind ?? null,
      outputSha256: routeRow.outputSha256 ?? null,
      blockingPrerequisite,
      nextExactCommand: group === 'gpu_model'
        ? nextGpuCommand(toolId)
        : 'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke',
      routeStatus: routeRow.routeStatus ?? null,
      adapterStatus: group === 'gpu_model'
        ? gpuRow?.adapterStatus ?? routeRow.routeStatus ?? null
        : routeRow.routeStatus ?? null,
      gpuRuntimeShouldStartNow: false,
      sourceGpuRuntimeShouldStartDuringScopedProof:
        group === 'gpu_model'
          ? gpuRow?.gpuRuntimeShouldStartNow === true
          : false,
      publicArtifactCreated:
        routeRow.publicArtifactCreated === true ||
        gpuRow?.publicArtifactCreated === true,
      signedUrlCreated:
        routeRow.signedUrlCreated === true ||
        gpuRow?.signedUrlCreated === true,
      workerDispatchPerformed: routeRow.workerDispatchPerformed === true,
      providerRuntimePerformed: routeRow.providerRuntimePerformed === true,
      runtimeReadyNow:
        routeRow.runtimeReadyNow === true ||
        gpuRow?.runtimeReadyNow === true,
      externalBetaReadyNow:
        routeRow.externalBetaReadyNow === true ||
        gpuRow?.externalBetaReadyNow === true,
      productionReadyNow:
        routeRow.productionReadyNow === true ||
        gpuRow?.productionReadyNow === true,
      sourceEvidence: {
        routeSmoke:
          'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
        gpuLocalDevHarness: group === 'gpu_model'
          ? 'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'
          : null,
        executionGate:
          'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
      },
    }
  })
}

function buildReport() {
  const routeSmoke = sourceReport(
    '--all21-route-smoke-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
    'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke',
  )
  const gpuHarness = sourceReport(
    '--gpu-local-dev-harness-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
  )
  const executionGate = readJson(
    stringFlag('--execution-gate-packet') ??
      'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  )

  assert(
    routeSmoke.decision ===
      'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed',
    'all-21 controlled route smoke decision mismatch',
  )
  assert(
    gpuHarness.decision ===
      'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
    'GPU/model local-dev harness decision mismatch',
  )
  assert(
    executionGate.decision ===
      'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings',
    'external-agent execution gate decision mismatch',
  )

  const toolRows = buildToolRows(routeSmoke, gpuHarness)
  const executableTools = toolRows.filter((row) => row.executable)
  const nonGpuExecutableTools = executableTools.filter(
    (row) => row.group !== 'gpu_model',
  )
  const gpuExecutableTools = toolRows.filter(
    (row) => row.group === 'gpu_model' && row.executable,
  )
  const blockedRows = toolRows.filter((row) => row.blockedWithReason)
  const gpuBlockedRows = blockedRows.filter((row) => row.group === 'gpu_model')
  const failedRows = toolRows.filter((row) => row.failedWithDiagnostics)

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-execution-readiness',
    decision,
    status,
    summary:
      'Strict external-agent readiness report for all 21 AI graphics tools. Callable means the agent can submit a controlled private request. Executable means the controlled adapter actually performed runtime work and returned structured private output evidence. GPU/model tools remain blocked_with_reason until approved native CUDA, private model/input paths, and private proof refs are supplied for a scoped on-demand call.',
    stateDefinitions: {
      callable:
        'The external agent can submit the controlled private route request.',
      executable:
        'The controlled adapter performed bounded runtime work and produced structured private output evidence.',
      blocked_with_reason:
        'The request shape is valid, but a required runtime/model/input prerequisite is absent.',
      failed_with_diagnostics:
        'Execution was attempted or route validation failed and the row includes an actionable reason.',
    },
    sourceEvidence: {
      all21ControlledRouteExecutionSmoke: {
        decision: routeSmoke.decision,
        status: routeSmoke.status,
        accepted: true,
      },
      gpuModelLocalDevRuntimeExecutionHarness: {
        decision: gpuHarness.decision,
        status: gpuHarness.status,
        accepted: true,
      },
      externalAgentExecutionGate: {
        decision: executionGate.decision,
        status: executionGate.status,
        accepted: true,
      },
    },
    counts: {
      totalToolsCovered: toolRows.length,
      agentCallableTools: toolRows.filter((row) => row.callable).length,
      agentExecutableTools: executableTools.length,
      cpuStaticExecutableTools: toolRows.filter(
        (row) => row.group === 'cpu_static' && row.executable,
      ).length,
      browserRuntimeExecutableTools: toolRows.filter(
        (row) => row.group === 'browser_runtime' && row.executable,
      ).length,
      gpuToolsWithValidRuntimeProof: gpuExecutableTools.length,
      gpuModelBlockedWithReasonTools: gpuBlockedRows.length,
      blockedWithReasonTools: blockedRows.length,
      failedWithDiagnosticsTools: failedRows.length,
      gpuRuntimeShouldStartNowTools:
        toolRows.filter((row) => row.gpuRuntimeShouldStartNow).length,
      publicArtifactCreatedTools:
        toolRows.filter((row) => row.publicArtifactCreated).length,
      signedUrlCreatedTools:
        toolRows.filter((row) => row.signedUrlCreated).length,
      workerDispatchPerformedTools:
        toolRows.filter((row) => row.workerDispatchPerformed).length,
      providerRuntimePerformedTools:
        toolRows.filter((row) => row.providerRuntimePerformed).length,
      runtimeReadyNowTools:
        toolRows.filter((row) => row.runtimeReadyNow).length,
      externalBetaReadyNowTools:
        toolRows.filter((row) => row.externalBetaReadyNow).length,
      productionReadyNowTools:
        toolRows.filter((row) => row.productionReadyNow).length,
    },
    booleans: {
      externalAgentExecutionReadinessCompleted: true,
      all21ToolsCovered: toolRows.length === 21,
      agentCanSubmitControlledToolRequests: true,
      agentCallableToolsReady: toolRows.every((row) => row.callable),
      all13NonGpuControlledAdapterOutputsValidated:
        nonGpuExecutableTools.length === 13,
      all8GpuModelToolsEvaluated: toolRows.filter((row) => row.group === 'gpu_model').length === 8,
      gpuModelToolsBlockedUntilPrerequisites:
        gpuBlockedRows.length + gpuExecutableTools.length === 8,
      scopedGpuModelRuntimeProofAcceptedTools: gpuExecutableTools.length,
      strictCallableExecutableBlockedFailedContractCreated: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      sourceScopedGpuRuntimeStartedOnlyDuringAcceptedProof:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => (
            row.executable ||
            row.sourceGpuRuntimeShouldStartDuringScopedProof === false
          )),
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: executableTools.length > 0,
      agentCanExecute13ControlledToolsNow: nonGpuExecutableTools.length === 13,
      agentCanExecuteAll21ToolsNow: executableTools.length === 21,
      agentCanExecuteGpuModelToolsNow: gpuExecutableTools.length > 0,
      routeExecutionApprovedNow: true,
      routeExecutionPerformedInReadinessRunner: !hasFlag('--use-records-only'),
      toolExecutionApprovedFor13ControlledToolsNow: true,
      toolExecutionApprovedForGpuModelToolsNow: gpuExecutableTools.length > 0,
      toolExecutionApprovedForAll21ToolsNow: executableTools.length === 21,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
    toolReadinessRows: toolRows,
    nextExactAction:
      'Run GPU/model local-dev harness on an approved native CUDA host with reviewed private model/checkpoint paths, private source frame/media, and private output directory; then feed accepted per-tool proof back into this readiness report.',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.toolReadinessRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.group}\` | \`${row.readinessState}\` | ${row.callable} | ${row.executable} | \`${row.blockingPrerequisite ?? 'none'}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Agent Execution Readiness

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This is the strict all-21 external-agent readiness report. It separates \`callable\` from \`executable\`: all 21 tools can receive controlled private requests, 13 tools execute controlled local adapters now, and the eight GPU/model tools return \`blocked_with_reason\` until scoped native CUDA, private model/input, and private proof prerequisites are supplied. GPU runtime is on-demand only and does not start idle.

## State Definitions

${Object.entries(report.stateDefinitions).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Tool Rows

| Tool | Group | Readiness state | Callable | Executable | Blocking prerequisite |
| --- | --- | --- | ---: | ---: | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next Action

${report.nextExactAction}
`
}

const report = buildReport()
if (hasFlag('--write-records')) {
  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true })
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}
console.log(JSON.stringify(report, null, 2))
