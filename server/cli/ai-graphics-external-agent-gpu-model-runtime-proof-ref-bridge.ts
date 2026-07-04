import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks'
const defaultStatus =
  'gpu_model_runtime_proof_ref_bridge_blocked_until_private_local_runtime_proof_is_supplied'
const acceptedStatus =
  'gpu_model_runtime_proof_ref_bridge_accepts_private_local_runtime_proof_for_scoped_route_submission'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md'
const sourceLocalDevHarnessPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'
const sourceProofRefRouteCallerPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const

const modelWeightManifestRequiredTools = new Set<string>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

type JsonRecord = Record<string, any>
type GpuModelToolId = (typeof gpuModelTools)[number]

interface ProofRefCallerRow {
  toolId: GpuModelToolId
  capabilityId: string
  requestEnvelope: {
    nativeGpuRuntimeProofRef: string
    externalBetaPerToolRuntimeProofRef: string
    modelWeightManifestRef?: string
  }
  modelWeightManifestRequired: boolean
}

interface LocalProofHarnessRow {
  toolId: string
  adapterStatus?: string
  executionState?: string
  localRuntimeExecutionPerformed?: boolean
  toolExecutionApprovedNow?: boolean
  gpuRuntimeShouldStartNow?: boolean
  publicArtifactCreated?: boolean
  signedUrlCreated?: boolean
  runtimeReadyNow?: boolean
  externalBetaReadyNow?: boolean
  productionReadyNow?: boolean
  outputJsonPath?: string | null
  skipReasonCode?: string | null
  errorMessage?: string | null
}

interface LocalProofOutputEvidence {
  privateOutputJsonPathExists: boolean
  privateOutputJsonAccepted: boolean
  privateOutputJsonRejectionReason: string | null
}

interface BridgeRow {
  toolId: GpuModelToolId
  capabilityId: string
  modelWeightManifestRequired: boolean
  nativeGpuRuntimeProofRef: string
  modelWeightManifestRef?: string
  externalBetaPerToolRuntimeProofRef: string
  localRuntimeProofResultProvided: boolean
  localRuntimeProofAccepted: boolean
  proofRefBridgeStatus:
    | 'blocked_missing_private_local_runtime_proof_result'
    | 'blocked_private_local_runtime_proof_not_executed'
    | 'blocked_private_local_runtime_output_missing'
    | 'accepted_private_local_runtime_proof_ready_for_proof_ref_route_submission'
  blockingReason: string | null
  expectedLocalProofEvidence: {
    adapterStatus: 'controlled_gpu_model_adapter_executed_private_output_ready'
    executionState: 'executable'
    localRuntimeExecutionPerformed: true
    toolExecutionApprovedNow: true
    gpuRuntimeShouldStartNowDuringScopedProof: true
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    privateOutputJsonPathExists: true
  }
  localProofEvidenceObserved: {
    adapterStatus: string | null
    executionState: string | null
    localRuntimeExecutionPerformed: boolean
    toolExecutionApprovedNow: boolean
    gpuRuntimeShouldStartNowDuringScopedProof: boolean
    publicArtifactCreated: boolean
    signedUrlCreated: boolean
    runtimeReadyNow: boolean
    externalBetaReadyNow: boolean
    productionReadyNow: boolean
    privateOutputJsonPath: string | null
    privateOutputJsonPathExists: boolean
    privateOutputJsonAccepted: boolean
    privateOutputJsonRejectionReason: string | null
    skipReasonCode: string | null
    errorMessage: string | null
  }
  routeSubmissionReadyWithAcceptedPrivateProof: boolean
  gpuRuntimeShouldStartNow: false
  liveQueueWritePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformedByBridge: false
  modelWeightsLoadedByBridge: false
  publicArtifactCreatedByBridge: false
  signedUrlCreatedByBridge: false
}

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

function asBridgePath(file: string): string {
  return path.isAbsolute(file) ? file : path.join(process.cwd(), file)
}

function sourceProofRefRows(source: JsonRecord): ProofRefCallerRow[] {
  const rows = source.gpuModelProofRefCallerRows
  assert(Array.isArray(rows), 'source proof-ref route caller rows are missing')
  assert(rows.length === 8, `expected 8 proof-ref route caller rows, got ${rows.length}`)

  return rows.map((row) => {
    assert(
      gpuModelTools.includes(row.toolId),
      `unexpected GPU/model proof-ref caller tool: ${row.toolId}`,
    )
    const envelope = row.requestEnvelope ?? {}
    assert(
      typeof envelope.nativeGpuRuntimeProofRef === 'string' &&
        envelope.nativeGpuRuntimeProofRef.startsWith('private://'),
      `${row.toolId} native GPU runtime proof ref must be private`,
    )
    assert(
      typeof envelope.externalBetaPerToolRuntimeProofRef === 'string' &&
        envelope.externalBetaPerToolRuntimeProofRef.startsWith('private://'),
      `${row.toolId} per-tool runtime proof ref must be private`,
    )
    if (modelWeightManifestRequiredTools.has(row.toolId)) {
      assert(
        typeof envelope.modelWeightManifestRef === 'string' &&
          envelope.modelWeightManifestRef.startsWith('private://'),
        `${row.toolId} model-weight manifest ref must be private`,
      )
    }
    return row as ProofRefCallerRow
  })
}

function localProofRows(localProof?: JsonRecord): Map<string, LocalProofHarnessRow> {
  if (!localProof) return new Map()
  const rows = localProof.gpuModelLocalDevRuntimeExecutionHarnessRows
  assert(Array.isArray(rows), 'local runtime proof result has no harness rows')
  return new Map(rows.map((row) => [String(row.toolId), row as LocalProofHarnessRow]))
}

function localProofOutputExists(row: LocalProofHarnessRow | undefined): boolean {
  if (!row?.outputJsonPath) return false
  return fs.existsSync(asBridgePath(row.outputJsonPath))
}

function isLocalGpuModelProofOutputPath(file: string | null | undefined): boolean {
  if (!file) return false
  if (path.isAbsolute(file)) {
    const relative = path.relative(process.cwd(), file)
    if (relative.startsWith('..') || path.isAbsolute(relative)) return false
    return isLocalGpuModelProofOutputPath(relative)
  }
  const normalized = path.normalize(file)
  return normalized.startsWith(
    `.local-artifacts${path.sep}ai-graphics${path.sep}gpu-model-local-dev-runtime${path.sep}`,
  ) ||
    normalized.startsWith(
      `local-artifacts${path.sep}ai-graphics${path.sep}gpu-model-local-dev-runtime${path.sep}`,
    )
}

function nestedValue(
  value: unknown,
  pathSegments: string[],
): unknown {
  let current = value
  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined
    }
    current = (current as JsonRecord)[segment]
  }
  return current
}

function anyTruthyFlag(value: unknown, flags: Set<string>): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some((item) => anyTruthyFlag(item, flags))
  return Object.entries(value as JsonRecord).some(([key, child]) => {
    if (flags.has(key) && child === true) return true
    return anyTruthyFlag(child, flags)
  })
}

function anyUnsafeUrl(value: unknown): boolean {
  if (typeof value === 'string') return /^https?:\/\//i.test(value)
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(anyUnsafeUrl)
  return Object.values(value as JsonRecord).some(anyUnsafeUrl)
}

function outputToolMatches(
  toolId: GpuModelToolId,
  outputJson: JsonRecord,
): boolean {
  const topToolId = outputJson.toolId
  const runtimeToolId = nestedValue(outputJson, ['runtime', 'toolId'])
  if (topToolId === toolId || runtimeToolId === toolId) return true
  if (
    toolId === 'sam2' &&
    nestedValue(outputJson, ['runtime', 'modelId']) === 'sam2.1_hiera_tiny' &&
    outputJson.privateSourceFrame &&
    outputJson.masks
  ) {
    return true
  }
  if (toolId === 'birefnet' && outputJson.fixture && outputJson.mask) {
    return true
  }
  if (
    toolId === 'real_esrgan' &&
    nestedValue(outputJson, ['runtime', 'modelName']) === 'RealESRGAN_x4plus' &&
    outputJson.enhanced
  ) {
    return true
  }
  return false
}

function outputHasGpuEvidence(
  toolId: GpuModelToolId,
  outputJson: JsonRecord,
): boolean {
  if (toolId === 'rembg') {
    return outputJson.cudaExecutionProviderAvailable === true
  }
  return (
    outputJson.cudaAvailable === true ||
    nestedValue(outputJson, ['runtime', 'cudaAvailable']) === true
  )
}

function localProofOutputEvidence(
  toolId: GpuModelToolId,
  row: LocalProofHarnessRow | undefined,
): LocalProofOutputEvidence {
  if (!isLocalGpuModelProofOutputPath(row?.outputJsonPath)) {
    return {
      privateOutputJsonPathExists: false,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_outside_local_artifacts_gpu_model_runtime_namespace',
    }
  }

  const privateOutputJsonPathExists = localProofOutputExists(row)
  if (!privateOutputJsonPathExists || !row?.outputJsonPath) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason: 'private_output_json_path_missing',
    }
  }

  let outputJson: JsonRecord
  try {
    outputJson = readJson(asBridgePath(row.outputJsonPath))
  } catch (error) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        error instanceof Error
          ? `private_output_json_unreadable:${error.message}`
          : 'private_output_json_unreadable',
    }
  }

  const unsafeTruthyFlags = new Set([
    'privateLocalProofFixture',
    'dry_run_passed',
    'generated_local_fixture_passed',
    'providerRuntimePerformed',
    'modelDownloadedExternally',
    'externalModelDownloadAttempted',
    'modelWeightsDownloaded',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
  ])
  if (anyTruthyFlag(outputJson, unsafeTruthyFlags)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_contains_forbidden_success_or_runtime_flag',
    }
  }
  if (anyUnsafeUrl(outputJson)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_contains_public_url',
    }
  }
  if (outputJson.ok !== true) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_missing_ok_true',
    }
  }
  if (!outputToolMatches(toolId, outputJson)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_tool_identity_mismatch',
    }
  }
  if (!outputHasGpuEvidence(toolId, outputJson)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_missing_cuda_runtime_evidence',
    }
  }

  return {
    privateOutputJsonPathExists,
    privateOutputJsonAccepted: true,
    privateOutputJsonRejectionReason: null,
  }
}

function buildBridgeRow(
  proofRefRow: ProofRefCallerRow,
  localProofRow?: LocalProofHarnessRow,
): BridgeRow {
  const localRuntimeProofResultProvided = Boolean(localProofRow)
  const outputEvidence = localProofOutputEvidence(proofRefRow.toolId, localProofRow)
  const privateOutputJsonPathExists =
    outputEvidence.privateOutputJsonPathExists
  const localProofEvidenceObserved = {
    adapterStatus: localProofRow?.adapterStatus ?? null,
    executionState: localProofRow?.executionState ?? null,
    localRuntimeExecutionPerformed:
      localProofRow?.localRuntimeExecutionPerformed === true,
    toolExecutionApprovedNow: localProofRow?.toolExecutionApprovedNow === true,
    gpuRuntimeShouldStartNowDuringScopedProof:
      localProofRow?.gpuRuntimeShouldStartNow === true,
    publicArtifactCreated: localProofRow?.publicArtifactCreated === true,
    signedUrlCreated: localProofRow?.signedUrlCreated === true,
    runtimeReadyNow: localProofRow?.runtimeReadyNow === true,
    externalBetaReadyNow: localProofRow?.externalBetaReadyNow === true,
    productionReadyNow: localProofRow?.productionReadyNow === true,
    privateOutputJsonPath: localProofRow?.outputJsonPath ?? null,
    privateOutputJsonPathExists,
    privateOutputJsonAccepted: outputEvidence.privateOutputJsonAccepted,
    privateOutputJsonRejectionReason:
      outputEvidence.privateOutputJsonRejectionReason,
    skipReasonCode: localProofRow?.skipReasonCode ?? null,
    errorMessage: localProofRow?.errorMessage ?? null,
  }
  const localRuntimeProofAccepted =
    localProofEvidenceObserved.adapterStatus ===
      'controlled_gpu_model_adapter_executed_private_output_ready' &&
    localProofEvidenceObserved.executionState === 'executable' &&
    localProofEvidenceObserved.localRuntimeExecutionPerformed &&
    localProofEvidenceObserved.toolExecutionApprovedNow &&
    localProofEvidenceObserved.gpuRuntimeShouldStartNowDuringScopedProof &&
    !localProofEvidenceObserved.publicArtifactCreated &&
    !localProofEvidenceObserved.signedUrlCreated &&
    !localProofEvidenceObserved.runtimeReadyNow &&
    !localProofEvidenceObserved.externalBetaReadyNow &&
    !localProofEvidenceObserved.productionReadyNow &&
    privateOutputJsonPathExists &&
    localProofEvidenceObserved.privateOutputJsonAccepted

  const proofRefBridgeStatus: BridgeRow['proofRefBridgeStatus'] =
    localRuntimeProofAccepted
      ? 'accepted_private_local_runtime_proof_ready_for_proof_ref_route_submission'
      : !localRuntimeProofResultProvided
      ? 'blocked_missing_private_local_runtime_proof_result'
      : !localProofEvidenceObserved.localRuntimeExecutionPerformed
      ? 'blocked_private_local_runtime_proof_not_executed'
      : 'blocked_private_local_runtime_output_missing'

  const blockingReason = localRuntimeProofAccepted
    ? null
    : !localRuntimeProofResultProvided
    ? 'No private local-dev runtime proof result was supplied. Run the scoped harness on a CUDA host with private inputs first.'
    : !localProofEvidenceObserved.localRuntimeExecutionPerformed
    ? `Private local proof for ${proofRefRow.toolId} did not execute; blocker: ${localProofEvidenceObserved.skipReasonCode ?? localProofEvidenceObserved.errorMessage ?? 'unknown'}`
    : `Private local proof executed but was not accepted by the proof bridge: ${
        localProofEvidenceObserved.privateOutputJsonRejectionReason ??
        'missing existing private output JSON path or safe false runtime/public readiness booleans'
      }.`

  return {
    toolId: proofRefRow.toolId,
    capabilityId: proofRefRow.capabilityId,
    modelWeightManifestRequired: proofRefRow.modelWeightManifestRequired,
    nativeGpuRuntimeProofRef:
      proofRefRow.requestEnvelope.nativeGpuRuntimeProofRef,
    modelWeightManifestRef:
      proofRefRow.requestEnvelope.modelWeightManifestRef,
    externalBetaPerToolRuntimeProofRef:
      proofRefRow.requestEnvelope.externalBetaPerToolRuntimeProofRef,
    localRuntimeProofResultProvided,
    localRuntimeProofAccepted,
    proofRefBridgeStatus,
    blockingReason,
    expectedLocalProofEvidence: {
      adapterStatus: 'controlled_gpu_model_adapter_executed_private_output_ready',
      executionState: 'executable',
      localRuntimeExecutionPerformed: true,
      toolExecutionApprovedNow: true,
      gpuRuntimeShouldStartNowDuringScopedProof: true,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      privateOutputJsonPathExists: true,
    },
    localProofEvidenceObserved,
    routeSubmissionReadyWithAcceptedPrivateProof: localRuntimeProofAccepted,
    gpuRuntimeShouldStartNow: false,
    liveQueueWritePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformedByBridge: false,
    modelWeightsLoadedByBridge: false,
    publicArtifactCreatedByBridge: false,
    signedUrlCreatedByBridge: false,
  }
}

function validateCommittedSources(localDevHarness: JsonRecord, proofRefRouteCaller: JsonRecord): void {
  assert(
    localDevHarness.decision ===
      'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
    'source local-dev runtime harness decision mismatch',
  )
  assert(
    proofRefRouteCaller.decision ===
      'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks',
    'source proof-ref route caller decision mismatch',
  )
  assert(
    localDevHarness.counts?.gpuModelToolsCovered === 8,
    'source local-dev runtime harness must cover 8 GPU/model tools',
  )
  assert(
    proofRefRouteCaller.counts?.gpuModelProofRefRouteCallerToolsNow === 8,
    'source proof-ref route caller must cover 8 GPU/model tools',
  )
}

function validateSuppliedLocalProofResult(localProof: JsonRecord): void {
  assert(
    localProof.decision ===
      'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
    'supplied local-dev runtime proof decision mismatch',
  )
  const rows = localProof.gpuModelLocalDevRuntimeExecutionHarnessRows
  assert(Array.isArray(rows), 'supplied local runtime proof result has no harness rows')
  assert(rows.length > 0, 'supplied local runtime proof result must include at least one scoped tool row')
  assert(rows.length <= gpuModelTools.length, 'supplied local runtime proof result has too many rows')

  const seen = new Set<string>()
  for (const row of rows) {
    assert(
      gpuModelTools.includes(row.toolId),
      `unexpected supplied GPU/model local proof tool: ${row.toolId}`,
    )
    assert(!seen.has(row.toolId), `duplicate supplied GPU/model local proof tool: ${row.toolId}`)
    seen.add(row.toolId)
  }
}

function buildReport(localProofResultPath?: string) {
  const localDevHarness = readJson(sourceLocalDevHarnessPath)
  const proofRefRouteCaller = readJson(sourceProofRefRouteCallerPath)
  validateCommittedSources(localDevHarness, proofRefRouteCaller)

  const suppliedLocalProof = localProofResultPath
    ? readJson(localProofResultPath)
    : undefined
  if (suppliedLocalProof) {
    validateSuppliedLocalProofResult(suppliedLocalProof)
  }

  const proofRows = sourceProofRefRows(proofRefRouteCaller)
  const suppliedRowsByTool = localProofRows(suppliedLocalProof)
  const bridgeRows = proofRows.map((row) => buildBridgeRow(row, suppliedRowsByTool.get(row.toolId)))
  const acceptedPrivateLocalRuntimeProofTools =
    bridgeRows.filter((row) => row.localRuntimeProofAccepted).length
  const routeSubmissionReadyWithAcceptedPrivateProofTools =
    bridgeRows.filter((row) => row.routeSubmissionReadyWithAcceptedPrivateProof).length

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-gpu-model-runtime-proof-ref-bridge',
    decision,
    status: acceptedPrivateLocalRuntimeProofTools > 0 ? acceptedStatus : defaultStatus,
    summary:
      'Bridges scoped private local-dev GPU/model runtime proof results to the external-agent GPU/model proof-ref route caller contract. The committed record is safe and accepts zero tools because no private local runtime proof result is supplied. Supplying a private harness result can mark only the proven scoped tool rows ready for proof-ref route submission; this bridge never starts GPU, never writes live queues, never dispatches workers, never loads model weights, and never creates public artifacts or signed URLs.',
    sourceEvidence: {
      localDevRuntimeExecutionHarness: {
        path: sourceLocalDevHarnessPath,
        decision: localDevHarness.decision,
        accepted: true,
      },
      proofRefRouteCaller: {
        path: sourceProofRefRouteCallerPath,
        decision: proofRefRouteCaller.decision,
        accepted: true,
      },
      suppliedPrivateLocalProofResult: localProofResultPath
        ? {
            path: localProofResultPath,
            acceptedRows: acceptedPrivateLocalRuntimeProofTools,
          }
        : null,
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge:diagnostics',
      cli:
        'server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge-diagnostics.mjs',
      defaultCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
      committedRecordCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --write-records',
      privateProofBridgeCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
      upstreamPrivateProofCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool <toolId> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json <per-tool-private-input-flags>',
    },
    proofRefBridgePolicy: {
      localRuntimeProofRequiredBeforeProofRefsAccepted: true,
      requiresAdapterExecutedPrivateOutputReadyStatus: true,
      requiresExecutionStateExecutable: true,
      requiresExistingPrivateOutputJsonPath: true,
      requiresPrivateOutputJsonUnderLocalArtifactsGpuModelRuntime: true,
      acceptsScopedToolRowsOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyInUpstreamScopedProofRun: true,
      bridgeStartsGpuRuntime: false,
      bridgeWritesLiveQueue: false,
      bridgeDispatchesWorker: false,
      bridgeExecutesTool: false,
      noModelDownload: true,
      noProviderRuntime: true,
      noPublicArtifact: true,
      noSignedUrl: true,
      committedRecordMustAcceptZeroTools: !localProofResultPath,
    },
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelToolsCovered: bridgeRows.length,
      sourceLocalDevHarnessToolsCovered: localDevHarness.counts?.gpuModelToolsCovered ?? 0,
      sourceProofRefRouteCallerToolsCovered:
        proofRefRouteCaller.counts?.gpuModelProofRefRouteCallerToolsNow ?? 0,
      privateLocalRuntimeProofResultSuppliedTools: suppliedRowsByTool.size,
      acceptedPrivateLocalRuntimeProofTools,
      routeSubmissionReadyWithAcceptedPrivateProofTools,
      blockedMissingPrivateLocalRuntimeProofResultTools:
        bridgeRows.filter((row) => row.proofRefBridgeStatus === 'blocked_missing_private_local_runtime_proof_result').length,
      blockedPrivateLocalRuntimeProofNotExecutedTools:
        bridgeRows.filter((row) => row.proofRefBridgeStatus === 'blocked_private_local_runtime_proof_not_executed').length,
      blockedPrivateLocalRuntimeOutputMissingTools:
        bridgeRows.filter((row) => row.proofRefBridgeStatus === 'blocked_private_local_runtime_output_missing').length,
      gpuRuntimeShouldStartNowTools: 0,
      liveQueueWritePerformedTools: 0,
      workerDispatchPerformedTools: 0,
      toolExecutionPerformedByBridgeTools: 0,
      modelWeightsLoadedByBridgeTools: 0,
      publicArtifactCreatedByBridgeTools: 0,
      signedUrlCreatedByBridgeTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    gpuModelRuntimeProofRefBridgeRows: bridgeRows,
    booleans: {
      externalAgentGpuModelRuntimeProofRefBridgePrepared: true,
      sourceLocalDevRuntimeExecutionHarnessAccepted: true,
      sourceProofRefRouteCallerAccepted: true,
      all8GpuModelToolsCoveredByBridge: bridgeRows.length === 8,
      privateLocalRuntimeProofRequiredBeforeProofRefsAccepted: true,
      exactPerToolPrivateProofEvidenceShapeEnforced: true,
      routeSubmissionAllowedOnlyWithAcceptedPrivateProof:
        routeSubmissionReadyWithAcceptedPrivateProofTools > 0,
      committedRecordAcceptsZeroGpuModelRuntimeProofs: !localProofResultPath,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForScopedAcceptedToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      routeExecutionPerformedInThisLane: false,
      backendQueueSubmissionApprovedNow: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformed: false,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
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
    nextRequiredImplementationStep:
      'Run the local-dev runtime harness on an approved CUDA host for a scoped GPU/model tool with private inputs, then feed that private harness result into this bridge before submitting proof refs to the external-agent route.',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.gpuModelRuntimeProofRefBridgeRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.capabilityId}\` | ${row.modelWeightManifestRequired} | ${row.localRuntimeProofResultProvided} | ${row.localRuntimeProofAccepted} | \`${row.proofRefBridgeStatus}\` | ${row.routeSubmissionReadyWithAcceptedPrivateProof} | ${row.gpuRuntimeShouldStartNow} |`
    ))
    .join('\n')

  return `# AI Graphics External Agent GPU Model Runtime Proof-Ref Bridge

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This bridge connects real scoped local-dev GPU/model runtime proof evidence to the external-agent proof-ref route caller. The committed record intentionally accepts zero GPU/model proofs because no private local runtime proof result is supplied.

It does not start GPU runtime, write live queues, dispatch workers, execute tools, load model weights, create public artifacts, create signed URLs, unlock external beta, or unlock production. GPU runtime can start only in the upstream scoped local-dev harness call that supplies private inputs for one requested tool.

## Bridge rows

| Tool | Capability | Needs model manifest | Local proof supplied | Local proof accepted | Bridge status | Route submission ready | GPU starts now |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Private proof bridge command

\`${report.interfaces.privateProofBridgeCommand}\`

## Next implementation step

${report.nextRequiredImplementationStep}
`
}

function main() {
  const localProofResultPath = stringFlag('--local-runtime-proof-result')
  const outputJson = stringFlag('--output-json')
  const writeRecords = hasFlag('--write-records')

  if (writeRecords && localProofResultPath) {
    throw new Error(
      '--write-records cannot be combined with --local-runtime-proof-result; private proof bridge outputs must stay local-only.',
    )
  }

  const report = buildReport(localProofResultPath)
  if (writeRecords) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
  }
  if (outputJson) {
    fs.mkdirSync(path.dirname(outputJson), { recursive: true })
    fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify(report, null, 2))
}

main()
