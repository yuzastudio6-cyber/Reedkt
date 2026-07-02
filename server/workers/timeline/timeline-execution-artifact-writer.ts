import { buildSmartCutExecutionArtifact } from '../smart-cut/smart-cut-execution-artifact-writer'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { TimelineExecutionMode } from './timeline-execution-types'

export function buildTimelineExecutionArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'timeline_manifest' | 'opentimelineio_manifest' | 'qa_report'>
  fileName: string
  payload: unknown
  outputDirectory?: string
  mode: Exclude<TimelineExecutionMode, 'production_blocked'>
  sourceOfTruth?: boolean
}) {
  return buildSmartCutExecutionArtifact(input)
}
