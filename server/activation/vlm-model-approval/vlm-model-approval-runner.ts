import path from 'node:path'
import { buildVlmModelApprovalArtifacts, buildVlmModelApprovalReport } from './vlm-model-approval-report-builder'
import { writeVlmModelApprovalArtifacts } from './vlm-model-artifact-manifest-writer'
import type { VlmModelApprovalRunnerResult } from './vlm-model-approval-types'

export async function runVlmModelApproval(input: {
  writeArtifacts?: boolean
  artifactDir?: string
  createdAt?: string
} = {}): Promise<VlmModelApprovalRunnerResult> {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const report = buildVlmModelApprovalReport(createdAt)
  const artifacts = buildVlmModelApprovalArtifacts(createdAt)
  const artifactDir = input.artifactDir ?? path.join('/tmp/reeditpro-vlm-model-approval/phase39a', createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15))
  const writtenArtifacts = input.writeArtifacts === true
    ? await writeVlmModelApprovalArtifacts({ artifactDir, artifacts, fullReport: report })
    : []

  return {
    report,
    localArtifactDir: artifactDir,
    writtenArtifacts,
  }
}
