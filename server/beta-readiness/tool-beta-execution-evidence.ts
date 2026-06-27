import { PRODUCTION_TOOL_IDS, type ProductionToolId } from '../tool-registry'
import type { ToolBetaAcceptedExecutionEvidence } from './beta-readiness-types'

export function buildAcceptedToolEvidenceMap(
  evidence: ToolBetaAcceptedExecutionEvidence[] = [],
): Map<ProductionToolId, ToolBetaAcceptedExecutionEvidence> {
  const knownToolIds = new Set<ProductionToolId>(PRODUCTION_TOOL_IDS)
  const accepted = new Map<ProductionToolId, ToolBetaAcceptedExecutionEvidence>()

  for (const record of evidence) {
    const toolId = record.toolId as ProductionToolId
    if (!knownToolIds.has(toolId)) {
      throw new Error(`Accepted tool beta evidence references an unknown production tool: ${record.toolId}`)
    }
    if (accepted.has(toolId)) {
      throw new Error(`Duplicate accepted tool beta evidence for: ${record.toolId}`)
    }
    if (!record.sourceId.trim()) {
      throw new Error(`Accepted tool beta evidence for ${record.toolId} is missing sourceId.`)
    }
    if (!record.notes.length) {
      throw new Error(`Accepted tool beta evidence for ${record.toolId} must include notes.`)
    }
    accepted.set(toolId, record)
  }

  return accepted
}
