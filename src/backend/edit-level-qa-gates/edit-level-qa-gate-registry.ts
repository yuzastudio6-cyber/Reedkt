import type { EditLevelQAGateDefinition } from '../../types'
import { listEditLevelQAGateDefinitions } from '../../lib/edit-level-qa-gates-rules'

export interface EditLevelQAGateRegistryResult {
  gates: EditLevelQAGateDefinition[]
  gateCount: number
  mockOnly: true
}

export function listEditLevelQAGates(): EditLevelQAGateRegistryResult {
  const gates = listEditLevelQAGateDefinitions()

  return {
    gates,
    gateCount: gates.length,
    mockOnly: true,
  }
}

export function createEditLevelQAGateRegistrySummary() {
  const result = listEditLevelQAGates()

  return {
    gateCount: result.gateCount,
    summary: `RP-EDITLEVEL-08 QA gate registry exposes ${result.gateCount} mock/local gates and executes none of them.`,
    mockOnly: true,
  }
}
