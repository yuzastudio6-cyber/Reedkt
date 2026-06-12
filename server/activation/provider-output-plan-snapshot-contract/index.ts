import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  uploadProviderOutputPlanSnapshotPrivateArtifacts,
  writeProviderOutputPlanSnapshotContractArtifacts,
} from './plan-snapshot-contract-artifacts'
import { buildProviderOutputPlanSnapshotContractBundle } from './plan-snapshot-contract-report-builder'
import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR,
  getProviderOutputPlanSnapshotGuardBlockers,
  getProviderOutputPlanSnapshotRunId,
} from './provider-output-plan-snapshot-policy'

export * from './approved-plan-snapshot-contract-builder'
export * from './approved-plan-snapshot-contract-validator'
export * from './deepseek-output-to-implementation-proposal-mapper'
export * from './owner-route-mapper'
export * from './plan-snapshot-contract-artifacts'
export * from './plan-snapshot-contract-report-builder'
export * from './provider-output-evidence-resolver'
export * from './provider-output-plan-snapshot-policy'
export * from './provider-output-plan-snapshot-types'
export * from './provider-output-source-audit'
export * from './qwen-output-to-plan-mapper'
export * from './worker-runtime-handoff-builder'

export async function writeProviderOutputPlanSnapshotContractReport(input: {
  runId?: string
} = {}) {
  const runId = input.runId ?? getProviderOutputPlanSnapshotRunId()
  const bundle = buildProviderOutputPlanSnapshotContractBundle({
    runId,
    uploadStatus: readExistingPrivateArtifactUpload(runId),
  })
  await writeProviderOutputPlanSnapshotContractArtifacts(bundle)
  return bundle
}

export async function executeProviderOutputPlanSnapshotContract(input: {
  execute: boolean
  runId?: string
}): Promise<{ exitCode: number; summary: Record<string, unknown> }> {
  const runId = input.runId ?? getProviderOutputPlanSnapshotRunId()
  if (!input.execute) {
    const bundle = buildProviderOutputPlanSnapshotContractBundle({ runId })
    await writeProviderOutputPlanSnapshotContractArtifacts(bundle)
    return {
      exitCode: 1,
      summary: {
        ...bundle.summary,
        status: 'blocked',
        decision: 'blocked_missing_provider_dry_run_evidence',
        activeBlockers: ['execution_requires_explicit_execute_flag'],
      },
    }
  }

  const guardBlockers = getProviderOutputPlanSnapshotGuardBlockers()
  if (guardBlockers.length > 0) {
    const bundle = buildProviderOutputPlanSnapshotContractBundle({ runId })
    const summary = {
      ...bundle.summary,
      status: 'blocked',
      decision: 'blocked_unsafe_execution_flags',
      activeBlockers: guardBlockers,
    }
    await writeProviderOutputPlanSnapshotContractArtifacts({
      ...bundle,
      summary,
      report: { ...bundle.report, ...summary },
      qa: { ...bundle.qa, status: 'blocked', decision: 'blocked_unsafe_execution_flags', passed: false },
    })
    return { exitCode: 1, summary }
  }

  const initialBundle = buildProviderOutputPlanSnapshotContractBundle({ runId })
  const initialDecision = String(initialBundle.summary.decision)
  if (initialDecision.startsWith('blocked_')) {
    await writeProviderOutputPlanSnapshotContractArtifacts(initialBundle)
    return { exitCode: 1, summary: initialBundle.summary }
  }

  const uploadStatus = await uploadProviderOutputPlanSnapshotPrivateArtifacts(initialBundle)
  const finalBundle = buildProviderOutputPlanSnapshotContractBundle({ runId, uploadStatus })
  await writeProviderOutputPlanSnapshotContractArtifacts(finalBundle)
  const uploadSucceeded = uploadStatus.status === 'uploaded'
  const finalDecision = uploadSucceeded
    ? String(finalBundle.summary.decision)
    : 'blocked_private_artifact_upload_failed'
  const summary = uploadSucceeded
    ? finalBundle.summary
    : {
        ...finalBundle.summary,
        status: 'blocked',
        decision: finalDecision,
        activeBlockers: ['private_artifact_upload_failed'],
      }
  return {
    exitCode: uploadSucceeded && !finalDecision.startsWith('blocked_') ? 0 : 1,
    summary,
  }
}

export function readProviderOutputPlanSnapshotContractSummary(): Record<string, unknown> {
  const filePath = path.join(
    PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR,
    'summary/provider-output-plan-snapshot-contract-summary.json',
  )
  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  }
  return buildProviderOutputPlanSnapshotContractBundle({ runId: getProviderOutputPlanSnapshotRunId() }).summary
}

function readExistingPrivateArtifactUpload(runId: string): Record<string, unknown> | undefined {
  const filePath = path.join(
    PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR,
    'manifest/provider-output-plan-snapshot-contract-manifest.json',
  )
  if (!existsSync(filePath)) return undefined
  const manifest = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  if (manifest.runId !== runId) return undefined
  const upload = manifest.privateArtifactUpload
  if (!upload || typeof upload !== 'object' || Array.isArray(upload)) return undefined
  return upload as Record<string, unknown>
}
