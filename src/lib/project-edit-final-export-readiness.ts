import type { QualityGateResult } from '../backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../backend/contracts/tool-artifact-contracts'
import type { ProjectEditFinalExportEvidenceInput } from './project-edit-lifecycle'

type RenderExecutionStatus = 'dry_run' | 'partial' | 'completed' | 'container_ready' | 'blocked' | 'failed'

export interface ProjectEditFinalRenderEvidenceInput {
  status: RenderExecutionStatus
  commandPlans: unknown[]
  executionManifest?: {
    resolvedAssets?: unknown[]
  }
  finalDeliveryAllowed: boolean
  finalExportArtifact?: ToolArtifact
  renderArtifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}

export interface ProjectEditFinalRenderEvidenceSummary {
  status: 'blocked' | 'dry_run_ready_final_delivery_missing' | 'final_export_ready'
  finalExportEvidence: ProjectEditFinalExportEvidenceInput
  blockers: string[]
  warnings: string[]
  commandPlanCount: number
  privateArtifactCount: number
  qaGateCount: number
}

function hasUnsafeReference(value: string): boolean {
  return /^https?:\/\//i.test(value) ||
    /X-Goog-Signature|X-Amz-Signature|Signature=|signedUrl/i.test(value)
}

function artifactReferencesArePrivate(artifacts: ToolArtifact[]): boolean {
  return artifacts.length > 0 &&
    artifacts.every((artifact) => artifact.isPrivate && !hasUnsafeReference(artifact.storageObjectPath))
}

function qaGatePassedOrWarning(gate: QualityGateResult | undefined): boolean {
  return Boolean(gate && (gate.status === 'passed' || gate.status === 'warning') && !gate.blocking)
}

function hasBlockingGate(gates: QualityGateResult[], includeFinalDelivery: boolean): boolean {
  return gates.some((gate) => {
    if (!includeFinalDelivery && gate.gateType === 'final_delivery') return false
    return gate.blocking || gate.status === 'blocked' || gate.status === 'failed'
  })
}

export function createProjectEditFinalExportEvidenceFromRenderPipeline(
  input: ProjectEditFinalRenderEvidenceInput,
): ProjectEditFinalRenderEvidenceSummary {
  const renderManifestArtifact = input.renderArtifacts.find((artifact) => artifact.artifactType === 'render_manifest')
  const renderAssetGate = input.qaResults.find((gate) => gate.gateType === 'render_asset_integrity')
  const renderTimelineGate = input.qaResults.find((gate) => gate.gateType === 'render_timeline_integrity')
  const exportCodecGate = input.qaResults.find((gate) => gate.gateType === 'export_codec_format')
  const exportDurationGate = input.qaResults.find((gate) => gate.gateType === 'export_duration_sync')
  const finalDeliveryGate = input.qaResults.find((gate) => gate.gateType === 'final_delivery')
  const privateArtifactsOnly = artifactReferencesArePrivate(input.renderArtifacts)
  const hasResolvedAssets = (input.executionManifest?.resolvedAssets?.length ?? 0) > 0
  const artifactManifestReady = Boolean(renderManifestArtifact && input.executionManifest && privateArtifactsOnly)
  const requiredAssetsReady = hasResolvedAssets && qaGatePassedOrWarning(renderAssetGate)
  const professionalQaPassed = [
    renderAssetGate,
    renderTimelineGate,
    exportCodecGate,
    exportDurationGate,
  ].every(qaGatePassedOrWarning) && !hasBlockingGate(input.qaResults, false)
  const finalRenderWorkerReady = input.commandPlans.length > 0 &&
    input.status !== 'failed' &&
    input.blocksPreview === false &&
    artifactManifestReady
  const exportDeliveryPolicyReady = input.finalDeliveryAllowed &&
    Boolean(input.finalExportArtifact?.isPrivate && input.finalExportArtifact.sourceOfTruth) &&
    qaGatePassedOrWarning(finalDeliveryGate)
  const finalExportEvidence = {
    artifactManifestReady,
    exportDeliveryPolicyReady,
    finalRenderWorkerReady,
    professionalQaPassed,
    requiredAssetsReady,
  }
  const blockers = [
    professionalQaPassed ? undefined : 'professional_qa_required',
    requiredAssetsReady ? undefined : 'required_assets_required',
    artifactManifestReady ? undefined : 'artifact_manifest_required',
    finalRenderWorkerReady ? undefined : 'final_render_worker_required',
    exportDeliveryPolicyReady ? undefined : 'export_delivery_policy_required',
  ].filter(Boolean) as string[]

  return {
    status: blockers.length === 0
      ? 'final_export_ready'
      : blockers.length === 1 && blockers[0] === 'export_delivery_policy_required'
        ? 'dry_run_ready_final_delivery_missing'
        : 'blocked',
    finalExportEvidence,
    blockers,
    warnings: [
      ...(privateArtifactsOnly ? [] : ['Render evidence must use private artifact references only.']),
      ...(exportDeliveryPolicyReady ? [] : ['Final delivery remains blocked until a private final_export artifact exists and passes delivery QA.']),
    ],
    commandPlanCount: input.commandPlans.length,
    privateArtifactCount: input.renderArtifacts.filter((artifact) => artifact.isPrivate).length,
    qaGateCount: input.qaResults.length,
  }
}
