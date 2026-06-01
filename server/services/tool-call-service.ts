import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { createProjectService } from './project-service'
import { sanitizeJson } from './service-helpers'

export type ToolCallStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'
export type ToolCategory =
  | 'renderer_compositor'
  | 'maps_geospatial'
  | 'charts_dataviz'
  | 'vector_animation'
  | 'canvas_graphics'
  | 'three_d_visuals'
  | 'diagram_layout'
  | 'svg_rasterization'
  | 'browser_capture'
  | 'image_processing'
  | 'video_processing'
  | 'audio_processing'
  | 'qa_analysis'
  | 'custom'
export type ToolExecutionMode = 'planning_only' | 'preview_only' | 'future_worker' | 'blocked'

export interface ToolCallInput {
  workspaceId?: string
  projectId?: string
  approvedSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  toolId?: string
  toolChainId?: string
  toolCallIntentId?: string
  jobId?: string
  mediaAssetId?: string
  storageObjectRecordId?: string
  renderId?: string
  requestedBy?: string
  category?: ToolCategory
  whySelected?: string
  executionMode?: ToolExecutionMode
  inputTypes?: string[]
  outputTypes?: string[]
  expectedInputs?: Record<string, unknown>[]
  expectedOutputs?: Record<string, unknown>[]
  frameContract?: Record<string, unknown>
  qaRequirements?: Record<string, unknown>[]
  requestedAction?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

interface ToolCallBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface RequiredRecord {
  table: string
  id?: string
  status: 'present' | 'missing' | 'backend_required' | 'not_applicable'
  note: string
}

interface StaticTool {
  id: string
  category: ToolCategory
  label: string
  productionReadiness: 'future' | 'backend_required' | 'blocked'
  allowedExecutionMode: ToolExecutionMode
  notes: string[]
}

interface StaticToolChain {
  id: string
  category: ToolCategory
  toolIds: string[]
  productionReadiness: 'future' | 'backend_required' | 'blocked'
  notes: string[]
}

export interface ToolCallResult {
  status: ToolCallStatus
  canPreviewDecision: boolean
  canCreateIntent: boolean
  canValidateContext: boolean
  canExecuteTool: boolean
  blockers: ToolCallBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  approvedSnapshotSummary?: Record<string, unknown> | null
  creditSummary?: Record<string, unknown> | null
  mediaReadinessSummary?: Record<string, unknown> | null
  renderSummary?: Record<string, unknown> | null
  qaSummary?: Record<string, unknown> | null
  catalogSummary?: Record<string, unknown> | null
  catalogTools?: Record<string, unknown>[]
  toolSummary?: Record<string, unknown> | null
  chainSummary?: Record<string, unknown> | null
  chains?: Record<string, unknown>[]
  decisionSummary?: Record<string, unknown> | null
  contextEnvelopeSummary?: Record<string, unknown> | null
  runtimeSummary?: Record<string, unknown> | null
  qaRequirementsSummary?: Record<string, unknown> | null
  idempotencySummary?: Record<string, unknown> | null
  auditEvent?: Record<string, unknown>
}

const UNSAFE_METADATA_TERMS = [
  'secret',
  'token',
  'apikey',
  'providerkey',
  'servicerole',
  'signedurl',
  'uploadurl',
  'downloadurl',
  'temporaryurl',
  'privatekey',
  'password',
  'credential',
  'stripe',
  'env',
]

const STATIC_TOOLS: StaticTool[] = [
  tool('remotion', 'renderer_compositor', 'Remotion composition planner'),
  tool('maplibre', 'maps_geospatial', 'MapLibre map asset planner'),
  tool('turf', 'maps_geospatial', 'Turf geospatial calculation planner'),
  tool('d3', 'charts_dataviz', 'D3 chart/data visualization planner'),
  tool('echarts', 'charts_dataviz', 'ECharts chart planner'),
  tool('vega_lite', 'charts_dataviz', 'Vega-Lite chart grammar planner'),
  tool('three_js', 'three_d_visuals', 'Three.js 3D scene planner'),
  tool('pixijs', 'canvas_graphics', 'PixiJS canvas graphic planner'),
  tool('anime_js', 'vector_animation', 'Anime.js vector animation planner'),
  tool('lottie_web', 'vector_animation', 'Lottie web playback planner'),
  tool('svg_js', 'vector_animation', 'SVG.js vector graphic planner'),
  tool('viz_graphviz', 'diagram_layout', 'Graphviz diagram layout planner'),
  tool('satori', 'svg_rasterization', 'Satori card/SVG planner'),
  tool('resvg_js', 'svg_rasterization', 'Resvg rasterization planner'),
  tool('deck_gl', 'maps_geospatial', 'deck.gl map/data layer planner'),
  tool('cesium_js', 'maps_geospatial', 'Cesium 3D map planner'),
  tool('ffmpeg', 'video_processing', 'FFmpeg worker-bound media planner'),
  tool('ffprobe', 'qa_analysis', 'FFprobe media metadata planner'),
  tool('sharp', 'image_processing', 'Sharp/libvips image planner'),
  tool('playwright', 'browser_capture', 'Playwright browser capture planner'),
  tool('opencv', 'video_processing', 'OpenCV vision processing planner'),
  tool('custom', 'custom', 'Custom reviewed worker tool placeholder'),
]

const STATIC_CHAINS: StaticToolChain[] = [
  {
    id: 'map_card_chain',
    category: 'maps_geospatial',
    toolIds: ['maplibre', 'turf', 'remotion'],
    productionReadiness: 'future',
    notes: ['Planning-only chain for exact maps; no map rendering or browser capture is executed.'],
  },
  {
    id: 'chart_card_chain',
    category: 'charts_dataviz',
    toolIds: ['vega_lite', 'satori', 'resvg_js', 'remotion'],
    productionReadiness: 'future',
    notes: ['Planning-only chain for exact charts; no chart rendering or rasterization is executed.'],
  },
  {
    id: 'media_probe_qa_chain',
    category: 'qa_analysis',
    toolIds: ['ffprobe', 'opencv'],
    productionReadiness: 'backend_required',
    notes: ['Future worker-only QA chain; Prompt 12 does not process media.'],
  },
]

const TOOL_EXECUTION_BLOCKERS = [
  'No canonical tool_call_intents persistence/RLS contract has been applied.',
  'No reviewed worker runtime can execute tool calls from approved snapshots yet.',
  'No tool package install/runtime validation is enabled by Prompt 12.',
  'Tool calls require approved snapshot, credit gate, media readiness, job, storage, render, QA, and audit records in a later milestone.',
]

function tool(id: string, category: ToolCategory, label: string): StaticTool {
  return {
    id,
    category,
    label,
    productionReadiness: 'future',
    allowedExecutionMode: 'planning_only',
    notes: ['Catalog placeholder only; Prompt 12 does not install, import, execute, or probe this tool.'],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function normalizeKey(key: string): string {
  return key.replace(/[-_\s.]/g, '').toLowerCase()
}

function collectUnsafeMetadataPaths(value: unknown, path = 'metadata', paths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeMetadataPaths(item, `${path}[${index}]`, paths))
    return paths
  }

  if (!isRecord(value)) return paths

  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeKey(key)
    if (UNSAFE_METADATA_TERMS.some((term) => normalized.includes(term))) {
      paths.push(`${path}.${key}`)
    }
    collectUnsafeMetadataPaths(child, `${path}.${key}`, paths)
  }

  return paths
}

function assertSafeMetadata(metadata: Record<string, unknown> | undefined): void {
  if (!metadata) return
  const unsafePaths = collectUnsafeMetadataPaths(metadata)
  if (unsafePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Tool-call metadata must not include secrets, tokens, signed URLs, provider keys, service-role data, Stripe keys, credentials, or private env values.',
      400,
      { unsafePaths },
    )
  }
}

function baseResult(warnings: string[] = []): ToolCallResult {
  return {
    status: 'backend_required',
    canPreviewDecision: false,
    canCreateIntent: false,
    canValidateContext: true,
    canExecuteTool: false,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'Use a future reviewed tool runtime milestone before executing tools.',
  }
}

function addBlocker(result: ToolCallResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
  result.status = code === 'BACKEND_REQUIRED' ? 'backend_required' : 'blocked'
  result.canCreateIntent = false
  result.canExecuteTool = false
}

function addRequiredRecord(result: ToolCallResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: ToolCallResult): ToolCallResult {
  if (result.blockers.length === 0) {
    if (result.status !== 'mock_only') result.status = 'ready'
    result.nextAction = 'Tool-call context and decision preview contracts are available for planning only. Prompt 12 does not execute tools, create jobs, call providers, process media, render/export media, mutate credits, write storage, or run remote Supabase.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.nextAction = result.status === 'backend_required'
    ? 'Add a reviewed canonical tool-call database/runtime milestone before persisting tool-call intents or executing tools.'
    : 'Resolve listed tool-call blockers before proceeding.'
  return result
}

function auditPreview(eventName: string, input: ToolCallInput): Record<string, unknown> {
  return sanitizeJson({
    eventName,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId,
    toolId: input.toolId,
    toolChainId: input.toolChainId,
    toolCallIntentId: input.toolCallIntentId,
    executionMode: input.executionMode,
  })
}

function contextEnvelopeSummary(scope: string, input: ToolCallInput): Record<string, unknown> {
  return sanitizeJson({
    scope,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    toolId: input.toolId,
    toolChainId: input.toolChainId,
    toolCallIntentId: input.toolCallIntentId,
    category: input.category,
    executionMode: input.executionMode ?? 'planning_only',
    inputTypes: input.inputTypes,
    outputTypes: input.outputTypes,
    frameContract: input.frameContract,
    qaRequirementCount: input.qaRequirements?.length ?? 0,
  })
}

function catalogSummary(): Record<string, unknown> {
  return {
    staticCatalogOnly: true,
    toolCount: STATIC_TOOLS.length,
    chainCount: STATIC_CHAINS.length,
    noToolPackagesInstalled: true,
    noRuntimeProbeExecuted: true,
  }
}

function requiredToolRecords(result: ToolCallResult, input: ToolCallInput): void {
  addRequiredRecord(result, {
    table: 'projects',
    id: input.projectId,
    status: input.projectId ? 'backend_required' : 'missing',
    note: 'Project/workspace access must be verified by backend before persisted tool-call records.',
  })
  addRequiredRecord(result, {
    table: 'approved_plan_snapshots',
    id: input.approvedSnapshotId,
    status: input.approvedSnapshotId ? 'present' : 'missing',
    note: 'Tool-call intents must execute approved snapshots, never raw chat.',
  })
  addRequiredRecord(result, {
    table: 'credit_estimates',
    id: input.creditEstimateId,
    status: input.creditEstimateId ? 'present' : 'backend_required',
    note: 'Expensive tool paths require credit estimate evidence before approval/execution.',
  })
  addRequiredRecord(result, {
    table: 'credit_reservations',
    id: input.creditReservationId,
    status: input.creditReservationId ? 'present' : 'backend_required',
    note: 'Execution-capable tool calls require a reservation in a later milestone.',
  })
  addRequiredRecord(result, {
    table: 'media_assets',
    id: input.mediaAssetId,
    status: input.mediaAssetId ? 'present' : 'not_applicable',
    note: 'Media-producing tools must reference approved media readiness records.',
  })
  addRequiredRecord(result, {
    table: 'storage_object_records',
    id: input.storageObjectRecordId,
    status: input.storageObjectRecordId ? 'present' : 'not_applicable',
    note: 'Tool inputs/outputs must use private storage object records, not signed URLs.',
  })
  addRequiredRecord(result, {
    table: 'renders',
    id: input.renderId,
    status: input.renderId ? 'present' : 'not_applicable',
    note: 'Render-bound tools must reference render/preview records before export readiness.',
  })
  addRequiredRecord(result, {
    table: 'qa_reports',
    status: 'backend_required',
    note: 'Tool execution output requires QA records before export/final-delivery gates can proceed.',
  })
  addRequiredRecord(result, {
    table: 'tool_catalog',
    id: input.toolId,
    status: 'backend_required',
    note: 'Canonical tool catalog/profile tables are future-only; Prompt 12 uses static planning placeholders.',
  })
  addRequiredRecord(result, {
    table: 'tool_call_intents',
    id: input.toolCallIntentId,
    status: 'backend_required',
    note: 'Intent persistence is intentionally fail-closed until canonical RLS and transactional writes are implemented.',
  })
}

async function applyProjectAccessGate(context: ServiceContext, input: ToolCallInput, result: ToolCallResult): Promise<void> {
  if (!input.projectId || !input.workspaceId) {
    addBlocker(result, 'ToolCallProjectScopeGate', 'VALIDATION_FAILED', 'workspaceId and projectId are required for project-scoped tool-call boundaries.')
    return
  }

  const access = await createProjectService(context).checkProjectAccess(input.projectId)
  if (access.status !== 'ready' || !access.hasAccess) {
    addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project/workspace access requires backend service-role runtime before tool-call boundaries can proceed.')
    return
  }

  const projectWorkspaceId = stringValue(access.project?.workspaceId)
  if (projectWorkspaceId && projectWorkspaceId !== input.workspaceId) {
    addBlocker(result, 'WorkspaceGate', 'WORKSPACE_ACCESS_DENIED', 'Project does not belong to the requested workspace.')
  }
}

function addToolRuntimeBlocker(result: ToolCallResult, input: ToolCallInput, scope: string): void {
  result.idempotencySummary = input.idempotencyKey
    ? { idempotencyKeyPresent: true, mutationBoundaryOnly: true }
    : undefined
  result.runtimeSummary = {
    scope,
    canExecuteTool: false,
    toolExecutionBlocked: true,
    blockers: TOOL_EXECUTION_BLOCKERS,
  }
  result.auditEvent = auditPreview(`tool_call.${scope}.backend_required`, input)
  addBlocker(result, 'ToolCallRuntimeGate', 'BACKEND_REQUIRED', `${scope} is backend-required and fail-closed in Prompt 12.`)
}

function findTool(toolId: string | undefined): StaticTool | undefined {
  return STATIC_TOOLS.find((toolEntry) => toolEntry.id === toolId)
}

function findChain(toolChainId: string | undefined): StaticToolChain | undefined {
  return STATIC_CHAINS.find((chain) => chain.id === toolChainId)
}

function summarizeTool(toolEntry: StaticTool | undefined): Record<string, unknown> | null {
  if (!toolEntry) return null
  return sanitizeJson({
    ...toolEntry,
    canExecuteTool: false,
    installStatus: 'not_installed_by_prompt_12',
    runtimeStatus: 'not_probed_by_prompt_12',
  })
}

function summarizeChain(chain: StaticToolChain | undefined): Record<string, unknown> | null {
  if (!chain) return null
  return sanitizeJson({
    ...chain,
    canExecuteTool: false,
    runtimeStatus: 'not_executed_by_prompt_12',
  })
}

function createStaticCatalogResult(scope: string, input: ToolCallInput = {}): ToolCallResult {
  const result = baseResult([
    'Prompt 12 catalog data is static planning metadata only; it does not install, import, run, probe, or verify tool packages.',
  ])
  result.status = 'mock_only'
  result.canPreviewDecision = true
  result.canValidateContext = true
  result.catalogSummary = catalogSummary()
  result.auditEvent = auditPreview(`tool_call.${scope}.catalog_static`, input)
  return finalize(result)
}

function createContextResult(input: ToolCallInput, scope: string): ToolCallResult {
  assertSafeMetadata(input.metadata)
  const result = baseResult([
    'Schema/context validation is planning-only and does not persist tool-call intents or execute tools.',
  ])
  result.status = 'mock_only'
  result.canPreviewDecision = true
  result.canValidateContext = true
  requiredToolRecords(result, input)
  result.contextEnvelopeSummary = contextEnvelopeSummary(scope, input)
  result.catalogSummary = catalogSummary()
  result.toolSummary = summarizeTool(findTool(input.toolId))
  result.chainSummary = summarizeChain(findChain(input.toolChainId))
  result.auditEvent = auditPreview(`tool_call.${scope}.context_validated`, input)
  return finalize(result)
}

export function createToolCallService(context: ServiceContext) {
  async function createReadiness(input: ToolCallInput, scope: string): Promise<ToolCallResult> {
    assertSafeMetadata(input.metadata)
    const result = baseResult([
      'Prompt 12 does not execute tools, process media, call providers, render/export media, create jobs, mutate credits, write storage, install packages, deploy, or run remote Supabase.',
    ])

    await applyProjectAccessGate(context, input, result)
    requiredToolRecords(result, input)
    result.contextEnvelopeSummary = contextEnvelopeSummary(scope, input)
    result.catalogSummary = catalogSummary()
    result.toolSummary = summarizeTool(findTool(input.toolId))
    result.chainSummary = summarizeChain(findChain(input.toolChainId))
    result.decisionSummary = {
      scope,
      selectedToolId: input.toolId,
      selectedToolChainId: input.toolChainId,
      whySelected: input.whySelected,
      executionMode: input.executionMode ?? 'planning_only',
      canPreviewDecision: true,
      canExecuteTool: false,
    }
    result.qaRequirementsSummary = {
      qaRequirementCount: input.qaRequirements?.length ?? 0,
      defaultGates: ['approved_snapshot', 'credit_gate', 'media_readiness', 'private_artifacts', 'qa_report', 'no_provider_or_public_url'],
    }
    result.canPreviewDecision = true
    result.canValidateContext = true
    result.auditEvent = auditPreview(`tool_call.${scope}.readiness_checked`, input)

    addBlocker(result, 'ToolCallBackendRuntimeGate', 'BACKEND_REQUIRED', 'Canonical tool-call catalog/profile/intent runtime is not implemented yet; Prompt 12 exposes contracts and fail-closed blockers only.')
    return finalize(result)
  }

  async function createBoundary(input: ToolCallInput, scope: string): Promise<ToolCallResult> {
    const result = await createReadiness(input, scope)
    addToolRuntimeBlocker(result, input, scope)
    return finalize(result)
  }

  return {
    checkCatalogReadiness(input: ToolCallInput) {
      const result = createStaticCatalogResult('catalog_readiness', input)
      addBlocker(result, 'ToolCatalogRuntimeGate', 'BACKEND_REQUIRED', 'Canonical tool catalog tables and runtime checks are not implemented; static catalog is planning-only.')
      return Promise.resolve(finalize(result))
    },
    listCatalog(input: ToolCallInput) {
      const result = createStaticCatalogResult('catalog_list', input)
      const category = input.category
      result.catalogTools = STATIC_TOOLS
        .filter((toolEntry) => !category || toolEntry.category === category)
        .map((toolEntry) => summarizeTool(toolEntry))
        .filter(isRecord)
      return Promise.resolve(result)
    },
    getCatalogTool(input: ToolCallInput) {
      const result = createStaticCatalogResult('catalog_get', input)
      const toolEntry = findTool(input.toolId)
      if (!toolEntry) addBlocker(result, 'ToolCatalogReferenceGate', 'TOOL_NOT_READY', 'Requested tool is not in the Prompt 12 static planning catalog.')
      result.toolSummary = summarizeTool(toolEntry)
      return Promise.resolve(finalize(result))
    },
    listChains(input: ToolCallInput) {
      const result = createStaticCatalogResult('chain_list', input)
      const category = input.category
      result.chains = STATIC_CHAINS
        .filter((chain) => !category || chain.category === category)
        .map((chain) => summarizeChain(chain))
        .filter(isRecord)
      return Promise.resolve(result)
    },
    getChain(input: ToolCallInput) {
      const result = createStaticCatalogResult('chain_get', input)
      const chain = findChain(input.toolChainId)
      if (!chain) addBlocker(result, 'ToolChainReferenceGate', 'TOOL_NOT_READY', 'Requested tool chain is not in the Prompt 12 static planning catalog.')
      result.chainSummary = summarizeChain(chain)
      return Promise.resolve(finalize(result))
    },
    checkDecisionReadiness(input: ToolCallInput) {
      return createReadiness(input, 'decision_readiness')
    },
    previewDecision(input: ToolCallInput) {
      const result = createContextResult(input, 'decision_preview')
      result.decisionSummary = {
        selectedToolId: input.toolId,
        selectedToolChainId: input.toolChainId,
        category: input.category,
        whySelected: input.whySelected,
        executionMode: input.executionMode ?? 'planning_only',
        allowedNow: 'schema_context_preview_only',
        blockedExecutionReason: 'Tool execution requires future backend worker/runtime milestone.',
      }
      return Promise.resolve(result)
    },
    checkCallIntentReadiness(input: ToolCallInput) {
      return createReadiness(input, 'call_intent_readiness')
    },
    createToolCallIntentBoundary(input: ToolCallInput) {
      return createBoundary(input, 'call_intent_create')
    },
    getToolCallIntent(input: ToolCallInput) {
      return createBoundary(input, 'call_intent_get')
    },
    listToolCallIntentsForProject(input: ToolCallInput) {
      return createBoundary(input, 'call_intent_list_for_project')
    },
    listToolCallBlockers(input: ToolCallInput) {
      return createReadiness(input, 'call_intent_blockers')
    },
    validateContextEnvelope(input: ToolCallInput) {
      return Promise.resolve(createContextResult(input, 'validate_context'))
    },
    buildQaRequirements(input: ToolCallInput) {
      const result = createContextResult(input, 'qa_requirements')
      result.qaRequirementsSummary = {
        requestedQaRequirements: input.qaRequirements ?? [],
        requiredDefaultGates: ['approved_snapshot', 'credit_gate', 'media_readiness', 'artifact_privacy', 'tool_output_decodes', 'qa_report_before_export'],
        exportBlockedUntilQaPasses: true,
      }
      return Promise.resolve(result)
    },
    checkExecutionReadiness(input: ToolCallInput) {
      return createBoundary(input, 'execution_readiness')
    },
    blockedExecution(input: ToolCallInput) {
      return createBoundary(input, 'execution_blocked')
    },
    checkRuntimeReadiness(input: ToolCallInput) {
      return createBoundary(input, 'runtime_readiness')
    },
    checkLicenseReadiness(input: ToolCallInput) {
      const result = createContextResult(input, 'license_readiness')
      result.runtimeSummary = {
        licenseReviewRequired: true,
        packageInstallAllowed: false,
        executionAllowed: false,
        nextAction: 'Complete future tool license/security/runtime review before production use.',
      }
      addBlocker(result, 'ToolLicenseRuntimeGate', 'BACKEND_REQUIRED', 'Tool license/runtime approval is future-only and cannot enable execution in Prompt 12.')
      return Promise.resolve(finalize(result))
    },
  }
}
