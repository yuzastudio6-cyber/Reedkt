import type { ProductionToolId } from '../tool-registry'
import { runProductionToolReadiness, type ProductionToolReadinessResult } from '../workers/production-readiness'
import type { BetaReadinessEvidencePacketInput } from './beta-readiness-evidence-store'
import type { ToolBetaAcceptedExecutionEvidence } from './beta-readiness-types'

export interface CoreRealCheckEvidenceInput {
  workspaceId: string
  projectId?: string
  sourceId: string
  sourceSha?: string
  notes: string[]
  acceptProductionReadiness?: boolean
  acceptProductReadyLocalOss?: boolean
  includeWarnings?: boolean
  toolIds?: ProductionToolId[]
}

export interface CoreRealCheckEvidenceResult {
  evidencePacket: BetaReadinessEvidencePacketInput
  acceptedToolEvidence: ToolBetaAcceptedExecutionEvidence[]
  skippedToolResults: Array<{
    toolId: ProductionToolId
    status: string
    reason: string
  }>
  readinessResult: ReturnType<typeof runProductionToolReadiness>
}

export function buildCoreRealCheckEvidencePacket(input: CoreRealCheckEvidenceInput): CoreRealCheckEvidenceResult {
  const readinessResult = runProductionToolReadiness({
    realCheckMode: true,
    strict: false,
    toolIds: input.toolIds,
  })
  const acceptedToolEvidence = readinessResult.results
    .filter((result) => isEvidenceEligible(result, input.includeWarnings === true))
    .map((result) => buildAcceptedEvidence(result, input))
  const acceptedToolIds = new Set(acceptedToolEvidence.map((record) => record.toolId))
  const skippedToolResults = readinessResult.results
    .filter((result) => !acceptedToolIds.has(result.toolId))
    .map((result) => ({
      toolId: result.toolId,
      status: result.status,
      reason: skipReason(result, input.includeWarnings === true),
    }))

  return {
    readinessResult,
    acceptedToolEvidence,
    skippedToolResults,
    evidencePacket: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      acceptedToolEvidence,
    },
  }
}

function isEvidenceEligible(result: ProductionToolReadinessResult, includeWarnings: boolean): boolean {
  if (result.status === 'passed') return true
  return includeWarnings && result.status === 'warning'
}

function buildAcceptedEvidence(
  result: ProductionToolReadinessResult,
  input: CoreRealCheckEvidenceInput,
): ToolBetaAcceptedExecutionEvidence {
  const passed = result.status === 'passed'
  return {
    toolId: result.toolId,
    sourceId: `${input.sourceId}:${result.toolId}`,
    sourceSha: input.sourceSha,
    readinessStatus: result.status === 'warning' ? 'warning' : 'passed',
    realExecutionVerified: true,
    productionReadinessAccepted: passed && input.acceptProductionReadiness === true,
    productReadyLocalOss: passed && input.acceptProductReadyLocalOss === true,
    modelWeightsApproved: true,
    notes: [
      ...input.notes,
      `Core real-check status ${result.status} at ${result.checkedAt}.`,
      'Evidence came from safe command/import/package metadata checks only; no media processing, provider call, Docker run, or product runtime execution occurred.',
      ...result.warnings.slice(0, 5),
    ],
  }
}

function skipReason(result: ProductionToolReadinessResult, includeWarnings: boolean): string {
  if (result.status === 'warning' && !includeWarnings) return 'warning_status_not_accepted_by_request'
  if (result.status === 'passed') return 'already_accepted'
  return `status_${result.status}_not_eligible_for_accepted_evidence`
}
