import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkflowQASummary } from './production-workflow-types'

export function buildProductionWorkflowQASummary(input: {
  qaResults: QualityGateResult[]
  finalExportArtifact?: ToolArtifact
}): ProductionWorkflowQASummary {
  const finalDeliveryGate = input.qaResults.find((gate) => gate.gateType === 'final_delivery')
  const blockingGates = input.qaResults.filter((gate) => gate.blocking || gate.status === 'blocked' || gate.status === 'failed')
  const finalDeliveryPassed = Boolean(input.finalExportArtifact) &&
    finalDeliveryGate?.status === 'passed' &&
    blockingGates.filter((gate) => gate.gateType !== 'final_delivery').length === 0

  return {
    total: input.qaResults.length,
    passed: input.qaResults.filter((gate) => gate.status === 'passed').length,
    warning: input.qaResults.filter((gate) => gate.status === 'warning').length,
    failed: input.qaResults.filter((gate) => gate.status === 'failed').length,
    blocked: input.qaResults.filter((gate) => gate.status === 'blocked' || gate.blocking).length,
    skipped: input.qaResults.filter((gate) => gate.status === 'skipped').length,
    blocksPreview: uniqueGateTypes(input.qaResults.filter((gate) => gate.blocksPreview).map((gate) => gate.gateType)),
    blocksFinalExport: uniqueGateTypes(input.qaResults.filter((gate) => gate.blocksFinalExport || gate.blocking).map((gate) => gate.gateType)),
    finalDeliveryPassed,
    finalDeliveryAllowed: finalDeliveryPassed,
  }
}

function uniqueGateTypes<T extends string>(items: T[]): T[] {
  return [...new Set(items)]
}
