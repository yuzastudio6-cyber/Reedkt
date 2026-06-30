import { readFileSync } from 'node:fs'
import {
  getProductionToolProfile,
  type ProductionToolExecutionMode,
  type ProductionToolId,
} from '../tool-registry'
import { productionToolReadinessSpecs } from '../workers/production-readiness'

const LOCAL_ACCEPTED_BUNDLE_PATH =
  'docs/beta-readiness/local-accepted-evidence-bundle/2026-06-30-df7fd0d-current-source-16-tool-local-accepted-evidence-bundle.json'
const PRODUCT_READY_SOURCE_RECONCILIATION_PATH =
  'docs/beta-readiness/trackb-product-ready-source-reconciliation/2026-06-30-trackb-product-ready-source-reconciliation.json'

export const TRACKB_AGENT_RUNTIME_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'hyperframe',
  'remotion',
  'sharp',
  'duckdb',
  'polars',
  'pyscenedetect',
  'opencv',
  'opencolorio',
  'openimageio',
  'audioflux',
  'signalsmith_stretch',
  'libass',
] as const satisfies readonly ProductionToolId[]

export type TrackBAgentRuntimeToolId = typeof TRACKB_AGENT_RUNTIME_TOOL_IDS[number]

export type TrackBAgentRuntimeAdmissionMode =
  | 'mock_safe_worker_dispatch'
  | 'frontend_preview_boundary'
  | 'bounded_runtime_probe'
  | 'bounded_execution_rehearsal'
  | 'deployed_live_execution'

export type TrackBAgentRuntimeBlockedScope =
  | 'deployed_product_ready_evidence_recording'
  | 'external_beta_user_media_execution'
  | 'paid_production_execution'

export interface TrackBAgentRuntimeToolContract {
  toolId: TrackBAgentRuntimeToolId
  displayName: string
  agentInvocationId: string
  productionExecutionMode: ProductionToolExecutionMode
  workerType: string
  expectedWorkerTypes: string[]
  imageRoles: string[]
  supportedActions: string[]
  requiredPayloadReferences: string[]
  requiredSafetyGates: string[]
  admittedModes: TrackBAgentRuntimeAdmissionMode[]
  agentContractReady: boolean
  paymentIndependentRuntimeReady: boolean
  liveExecutionReady: boolean
  localAcceptedEvidenceReady: boolean
  productReadySourceCloseoutReady: boolean
  deployedEvidenceRecorded: boolean
  blockedActionScope: TrackBAgentRuntimeBlockedScope[]
  nextAction: string
}

export interface TrackBAgentRuntimeReadinessReport {
  reportId: string
  createdAt: string
  decision: 'trackb_agent_runtime_readiness_admission_passed_ready_for_deployed_execution_evidence'
  toolCount: number
  expectedToolIds: TrackBAgentRuntimeToolId[]
  localAcceptedToolCount: number
  productReadySourceCount: number
  deployedEvidenceRecordedToolCount: number
  agentContractsReady: boolean
  paymentIndependentRuntimeReady: boolean
  liveAgentExecutionReady: boolean
  productReadyLocalOssCount: number
  paymentScope: 'excluded_from_this_readiness_gate'
  serviceFeeIncluded: false
  blockedActionScope: TrackBAgentRuntimeBlockedScope[]
  allowedForwardProgressScopes: string[]
  contracts: TrackBAgentRuntimeToolContract[]
  sourceEvidence: {
    localAcceptedBundlePath: string
    localAcceptedDecision?: string
    localAcceptedSourceSha?: string
    productReadySourceReconciliationPath: string
    productReadySourceDecision?: string
    productReadyCloseoutDecision?: string
    deployedEvidenceSource: 'source_reconciliation_snapshot' | 'stored_operator_status_readback'
    deployedEvidenceWorkspaceId?: string
    deployedEvidencePacketCount?: number
  }
  blockers: string[]
  nextActions: string[]
  warnings: string[]
}

export interface TrackBAgentRuntimeReadinessReportOptions {
  deployedEvidenceSource?: 'source_reconciliation_snapshot' | 'stored_operator_status_readback'
  deployedEvidenceWorkspaceId?: string
  deployedEvidencePacketCount?: number
  deployedEvidenceRecordedToolCount?: number
}

interface LocalAcceptedBundleSnapshot {
  decision?: string
  sourceSha?: string
  locallyAcceptedToolCount?: number
  locallyAcceptedToolIds?: string[]
}

interface ProductReadySourceReconciliationSnapshot {
  decision?: string
  trackBProductReadyTotals?: {
    productReadyForRankedToolCallLane?: number
  }
  activeBetaDeployedEvidenceTotals?: {
    productReadyLocalOssRecordedInActiveBetaEvidence?: number
  }
  productReadyCloseout?: {
    decision?: string
  }
}

export function buildTrackBAgentRuntimeReadinessReport(
  options: TrackBAgentRuntimeReadinessReportOptions = {},
): TrackBAgentRuntimeReadinessReport {
  const localAccepted = readJson<LocalAcceptedBundleSnapshot>(LOCAL_ACCEPTED_BUNDLE_PATH)
  const productReadySource = readJson<ProductReadySourceReconciliationSnapshot>(PRODUCT_READY_SOURCE_RECONCILIATION_PATH)
  const localAcceptedToolIds = new Set(localAccepted.locallyAcceptedToolIds ?? [])
  const readinessSpecByToolId = new Map(productionToolReadinessSpecs.map((spec) => [spec.toolId, spec]))
  const productReadySourceCount = productReadySource.trackBProductReadyTotals?.productReadyForRankedToolCallLane ?? 0
  const deployedEvidenceRecordedToolCount =
    normalizeEvidenceCount(options.deployedEvidenceRecordedToolCount) ??
    productReadySource.activeBetaDeployedEvidenceTotals?.productReadyLocalOssRecordedInActiveBetaEvidence ??
    0
  const deployedEvidenceSource = options.deployedEvidenceSource ?? (
    options.deployedEvidenceRecordedToolCount === undefined
      ? 'source_reconciliation_snapshot'
      : 'stored_operator_status_readback'
  )
  const productReadySourceCloseoutReady = productReadySourceCount === TRACKB_AGENT_RUNTIME_TOOL_IDS.length

  const contracts = TRACKB_AGENT_RUNTIME_TOOL_IDS.map((toolId) => {
    const profile = getProductionToolProfile(toolId)
    const readinessSpec = readinessSpecByToolId.get(toolId)
    const localAcceptedEvidenceReady = localAcceptedToolIds.has(toolId)
    const deployedEvidenceRecorded = deployedEvidenceRecordedToolCount >= TRACKB_AGENT_RUNTIME_TOOL_IDS.length
    const workerType = profile?.workerType ?? 'missing_worker_type'
    const isFrontendPreviewBoundary = workerType === 'frontend_preview_only'
    const agentContractReady = Boolean(profile && readinessSpec) &&
      localAcceptedEvidenceReady &&
      productReadySourceCloseoutReady
    const paymentIndependentRuntimeReady = agentContractReady
    const liveExecutionReady = paymentIndependentRuntimeReady && deployedEvidenceRecorded
    const rehearsalModes: TrackBAgentRuntimeAdmissionMode[] = supportsBoundedExecutionRehearsal(toolId)
      ? ['bounded_execution_rehearsal']
      : []
    const baseAdmittedModes: TrackBAgentRuntimeAdmissionMode[] = isFrontendPreviewBoundary
      ? ['frontend_preview_boundary', 'bounded_runtime_probe', ...rehearsalModes]
      : ['mock_safe_worker_dispatch', 'bounded_runtime_probe', ...rehearsalModes]
    const admittedModes: TrackBAgentRuntimeAdmissionMode[] = !isFrontendPreviewBoundary && liveExecutionReady
      ? [...baseAdmittedModes, 'deployed_live_execution']
      : baseAdmittedModes

    return {
      toolId,
      displayName: profile?.displayName ?? toolId,
      agentInvocationId: `trackb.media_oss.${toolId}`,
      productionExecutionMode: profile?.executionMode ?? 'planning_metadata',
      workerType,
      expectedWorkerTypes: readinessSpec?.expectedWorkerTypes ?? [],
      imageRoles: readinessSpec?.imageRoles ?? [],
      supportedActions: profile?.supportedActions ?? [],
      requiredPayloadReferences: requiredPayloadReferencesFor(profile?.executionMode),
      requiredSafetyGates: [
        'approved_snapshot_gate',
        'stable_idempotency_key_gate',
        'private_artifact_reference_gate',
        'raw_prompt_block_gate',
        'signed_url_block_gate',
        'secret_block_gate',
        'registry_runtime_gate',
      ],
      admittedModes,
      agentContractReady,
      paymentIndependentRuntimeReady,
      liveExecutionReady,
      localAcceptedEvidenceReady,
      productReadySourceCloseoutReady,
      deployedEvidenceRecorded,
      blockedActionScope: liveExecutionReady
        ? []
        : [
            'deployed_product_ready_evidence_recording',
            'external_beta_user_media_execution',
            'paid_production_execution',
          ],
      nextAction: liveExecutionReady
        ? 'Ready for live agent runtime admission after deployed operator-status readback.'
        : 'Record the 16-tool product-ready deployed evidence bundle and verify operator-status readback before live agent execution.',
    } satisfies TrackBAgentRuntimeToolContract
  })

  const blockers = [
    ...missingToolMessages(contracts, 'agentContractReady', 'agent runtime contract is not ready'),
    ...missingToolMessages(contracts, 'paymentIndependentRuntimeReady', 'payment-independent mock-safe runtime admission is not ready'),
    ...(deployedEvidenceRecordedToolCount === TRACKB_AGENT_RUNTIME_TOOL_IDS.length
      ? []
      : [`deployed product-ready evidence recorded for ${deployedEvidenceRecordedToolCount}/${TRACKB_AGENT_RUNTIME_TOOL_IDS.length} Track B tools`]),
  ]
  const agentContractsReady = contracts.every((contract) => contract.agentContractReady)
  const paymentIndependentRuntimeReady = contracts.every((contract) => contract.paymentIndependentRuntimeReady)
  const liveAgentExecutionReady = contracts.every((contract) => contract.liveExecutionReady)

  return {
    reportId: `trackb-agent-runtime-readiness-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    decision: 'trackb_agent_runtime_readiness_admission_passed_ready_for_deployed_execution_evidence',
    toolCount: TRACKB_AGENT_RUNTIME_TOOL_IDS.length,
    expectedToolIds: [...TRACKB_AGENT_RUNTIME_TOOL_IDS],
    localAcceptedToolCount: localAccepted.locallyAcceptedToolCount ?? 0,
    productReadySourceCount,
    deployedEvidenceRecordedToolCount,
    agentContractsReady,
    paymentIndependentRuntimeReady,
    liveAgentExecutionReady,
    productReadyLocalOssCount: deployedEvidenceRecordedToolCount,
    paymentScope: 'excluded_from_this_readiness_gate',
    serviceFeeIncluded: false,
    blockedActionScope: liveAgentExecutionReady
      ? []
      : [
          'deployed_product_ready_evidence_recording',
          'external_beta_user_media_execution',
          'paid_production_execution',
        ],
    allowedForwardProgressScopes: [
      'agent_runtime_contract_validation',
      'bounded_runtime_probe_validation',
      'mock_safe_worker_dispatch_validation',
      'deployed_product_ready_evidence_collection',
      'operator_status_readback',
      'runtime_route_qa_without_user_media',
    ],
    contracts,
    sourceEvidence: {
      localAcceptedBundlePath: LOCAL_ACCEPTED_BUNDLE_PATH,
      localAcceptedDecision: localAccepted.decision,
      localAcceptedSourceSha: localAccepted.sourceSha,
      productReadySourceReconciliationPath: PRODUCT_READY_SOURCE_RECONCILIATION_PATH,
      productReadySourceDecision: productReadySource.decision,
      productReadyCloseoutDecision: productReadySource.productReadyCloseout?.decision,
      deployedEvidenceSource,
      deployedEvidenceWorkspaceId: options.deployedEvidenceWorkspaceId,
      deployedEvidencePacketCount: options.deployedEvidencePacketCount,
    },
    blockers,
    nextActions: [
      'Use this report as the server-side admission map for Track B agent tool calls.',
      'Use bounded_runtime_probe mode to run the approved command/import/package-metadata check for a single Track B tool without user media.',
      'Use bounded_execution_rehearsal only for backend tools with explicit synthetic/no-user-media handlers; it is non-billable and does not enable live beta or production.',
      'Keep agent calls in mock_safe_worker_dispatch or frontend_preview_boundary mode until deployed evidence readback records all 16 tools.',
      'Run npm run beta:tools:trackb-product-ready-deployed-evidence-collector with operator-supplied staging values to record product-ready deployed evidence.',
      'Rerun npm run beta:readiness:operator-status-api after deployed evidence recording and require productReadyLocalOssCount=16 before live execution.',
      'POST /v1/agent-tools/trackb/execute admits deployed_live_execution only when stored workspace evidence readback has productReadyLocalOssCount=16.',
    ],
    warnings: [
      'This report does not run tools, process media, call providers, write Supabase, enable beta, or enable production.',
      'Payment and service fees are intentionally excluded from this runtime-admission check.',
      'Live agent execution remains blocked until deployed staging evidence and operator-status readback prove the 16-tool bundle.',
    ],
  }
}

function supportsBoundedExecutionRehearsal(toolId: ProductionToolId): boolean {
  return toolId === 'ffmpeg' ||
    toolId === 'ffprobe' ||
    toolId === 'sharp' ||
    toolId === 'duckdb' ||
    toolId === 'polars' ||
    toolId === 'pyav' ||
    toolId === 'opentimelineio' ||
    toolId === 'pyscenedetect' ||
    toolId === 'opencv' ||
    toolId === 'opencolorio' ||
    toolId === 'openimageio' ||
    toolId === 'audioflux' ||
    toolId === 'remotion' ||
    toolId === 'hyperframe'
}

function normalizeEvidenceCount(value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(TRACKB_AGENT_RUNTIME_TOOL_IDS.length, Math.trunc(value)))
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function requiredPayloadReferencesFor(mode?: ProductionToolExecutionMode): string[] {
  const common = [
    'workspaceId',
    'projectId',
    'jobId',
    'approvedSnapshotId',
    'toolExecutionPlanId',
    'idempotencyKey',
  ]

  if (mode === 'preview_boundary' || mode === 'planning_metadata') {
    return [...common, 'approvedPreviewStateReference']
  }

  return [...common, 'privateStorageReferenceIds', 'requiredQualityGateIds']
}

function missingToolMessages(
  contracts: TrackBAgentRuntimeToolContract[],
  field: 'agentContractReady' | 'paymentIndependentRuntimeReady',
  message: string,
): string[] {
  return contracts
    .filter((contract) => !contract[field])
    .map((contract) => `${contract.toolId}: ${message}`)
}
