import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { buildOwnerAcceptanceChecklist } from './owner-acceptance-checklist'
import { buildOwnerRepoAuditPrompts } from './owner-repo-audit-prompt-builder'
import { buildRuntimeUnlockBlockedScopePolicy } from './runtime-unlock-blocked-scope-policy'
import { buildRuntimeUnlockCommandPlan } from './runtime-unlock-command-plan'
import { buildRuntimeUnlockIamPlan } from './runtime-unlock-iam-plan'
import { buildRuntimeUnlockLadder } from './runtime-unlock-ladder'
import { buildOwnerAcceptanceMatrix } from './runtime-unlock-owner-matrix'
import { makeRuntimeUnlockRunId, runtimeUnlockDisabledFeatureGates } from './runtime-unlock-roadmap-policy'
import { buildRuntimeUnlockQaSummary } from './runtime-unlock-qa-summary'
import { buildRuntimeUnlockRiskRegister } from './runtime-unlock-risk-register'
import { buildRuntimeUnlockSourceAudit } from './runtime-unlock-source-audit'
import { buildNotAttemptedPhase53ASyncResult, buildPhase53ASupabaseMilestoneBundle, buildPhase53ASupabaseSyncInput } from './runtime-unlock-supabase-sync'
import type {
  RuntimeUnlockExecutionReport,
  RuntimeUnlockManifest,
  RuntimeUnlockReport,
  RuntimeUnlockRoadmap,
} from './runtime-unlock-roadmap-types'

export const RUNTIME_UNLOCK_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'runtime-unlock-roadmap',
  'phase53a',
  'job-execution',
  'phase53a-report.json',
)

export function buildRuntimeUnlockReport(): RuntimeUnlockReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      ...executionReport,
      reportId: 'activation-phase-53a-runtime-unlock-roadmap',
      executionReport,
    }
  }

  const runId = makeRuntimeUnlockRunId(new Date('2026-06-06T00:00:00Z'))
  const sourceAudit = buildRuntimeUnlockSourceAudit()
  const ladder = buildRuntimeUnlockLadder()
  const blockedScopePolicy = buildRuntimeUnlockBlockedScopePolicy()
  const ownerAcceptanceMatrix = buildOwnerAcceptanceMatrix()
  const ownerAcceptanceChecklist = buildOwnerAcceptanceChecklist()
  const ownerRepoAuditPrompts = buildOwnerRepoAuditPrompts(ownerAcceptanceMatrix)
  const riskRegister = buildRuntimeUnlockRiskRegister()
  const roadmap = buildRuntimeUnlockRoadmap({ ladder, ownerAcceptanceMatrix, blockedScopePolicy })
  const syncResult = buildNotAttemptedPhase53ASyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const manifest = buildRuntimeUnlockManifest({
    runId,
    sourceAudit,
    roadmap,
    ownerAcceptanceChecklist,
    ownerRepoAuditPrompts,
    riskRegister,
    warnings: [...sourceAudit.warnings, ...syncResult.warnings],
    blockers: sourceAudit.blockers,
    phase53BReady: false,
  })
  const qa = buildRuntimeUnlockQaSummary({
    packageScripts: readRuntimeUnlockPackageScripts(),
    docsPresent: readRuntimeUnlockDocsPresent(),
    sourceAudit,
    ladder,
    blockedScopePolicy,
    ownerAcceptanceMatrix,
    ownerRepoAuditPrompts,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const syncInput = buildPhase53ASupabaseSyncInput(runId, qa)
  const milestoneBundle = buildPhase53ASupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  return {
    reportId: 'activation-phase-53a-runtime-unlock-roadmap',
    createdAt: new Date().toISOString(),
    phase: '53A',
    runId,
    status: 'planned',
    sourceAudit,
    ladder,
    blockedScopePolicy,
    ownerAcceptanceMatrix,
    ownerAcceptanceChecklist,
    ownerRepoAuditPrompts,
    riskRegister,
    roadmap,
    manifest,
    syncInput,
    milestoneBundle,
    supabaseSyncResult: buildNotAttemptedPhase53ASyncResult({
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
      blockers: [...inputValidation.blockers, ...bundleValidation.blockers],
      warnings: [...inputValidation.warnings, ...bundleValidation.warnings, 'Static report does not read Supabase credentials or write the milestone registry.'],
    }),
    commandPlan: buildRuntimeUnlockCommandPlan(),
    iamPlan: buildRuntimeUnlockIamPlan(),
    qa,
    artifacts: [],
    phase53BReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function buildRuntimeUnlockRoadmap(input: {
  ladder: RuntimeUnlockRoadmap['ladder']
  ownerAcceptanceMatrix: RuntimeUnlockRoadmap['ownerAcceptanceMatrix']
  blockedScopePolicy: RuntimeUnlockRoadmap['blockedScopePolicy']
}): RuntimeUnlockRoadmap {
  return {
    roadmapId: 'phase53a_runtime_unlock_roadmap',
    purpose: 'Define owner-owned unlock tracks so blocked runtime scopes progress through audited stages instead of becoming permanent blockers.',
    ladder: input.ladder,
    ownerAcceptanceMatrix: input.ownerAcceptanceMatrix,
    blockedScopePolicy: input.blockedScopePolicy,
    phase53BReadiness: 'blocked',
  }
}

export function buildRuntimeUnlockManifest(input: {
  runId: string
  sourceAudit: RuntimeUnlockManifest['sourceAudit']
  roadmap: RuntimeUnlockManifest['roadmap']
  ownerAcceptanceChecklist: RuntimeUnlockManifest['ownerAcceptanceChecklist']
  ownerRepoAuditPrompts: RuntimeUnlockManifest['ownerRepoAuditPrompts']
  riskRegister: RuntimeUnlockManifest['riskRegister']
  warnings: string[]
  blockers: string[]
  phase53BReady: boolean
}): RuntimeUnlockManifest {
  return {
    manifestId: 'phase53a_runtime_unlock_roadmap_manifest',
    runId: input.runId,
    phase: '53A',
    sourceAudit: input.sourceAudit,
    roadmap: {
      ...input.roadmap,
      phase53BReadiness: input.phase53BReady ? 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' : 'blocked',
    },
    ownerAcceptanceChecklist: input.ownerAcceptanceChecklist,
    ownerRepoAuditPrompts: input.ownerRepoAuditPrompts,
    riskRegister: input.riskRegister,
    supabaseMilestoneRefs: input.phase53BReady ? [`activation_runs/53A/${input.runId}`] : [],
    blockedFeatures: [...runtimeUnlockDisabledFeatureGates],
    warnings: Array.from(new Set(input.warnings)),
    blockers: Array.from(new Set(input.blockers)),
    phase53BReadiness: input.phase53BReady ? 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' : 'blocked',
  }
}

export function summarizeRuntimeUnlockReport(report: RuntimeUnlockReport): string {
  const lines = [
    `Phase ${report.phase} runtime unlock roadmap`,
    `Status: ${report.status}`,
    `Unlock ladder stages: ${report.ladder.stages.length}`,
    `Owner matrix rows: ${report.ownerAcceptanceMatrix.rows.length}`,
    `Owner repo-audit prompts: ${report.ownerRepoAuditPrompts.length}`,
    `QA: ${report.qa.status}`,
    `Phase53B readiness: ${report.phase53BReadiness}`,
  ]
  if (report.executionReport) {
    lines.push(`Run ID: ${report.executionReport.runId}`)
    lines.push(`Supabase sync: ${report.executionReport.supabaseSyncResult.status}`)
    lines.push(`Artifacts: ${report.executionReport.artifacts.length}`)
  }
  if (report.blockers.length) lines.push(`Report blockers: ${report.blockers.join('; ')}`)
  if (report.warnings.length) lines.push(`Warnings: ${report.warnings.join('; ')}`)
  return lines.join('\n')
}

export function readRuntimeUnlockPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readRuntimeUnlockDocsPresent(): Record<string, boolean> {
  return {
    'docs/runtime-unlock/runtime-unlock-roadmap.md': existsSync('docs/runtime-unlock/runtime-unlock-roadmap.md'),
    'docs/runtime-unlock/owner-acceptance-checklist.md': existsSync('docs/runtime-unlock/owner-acceptance-checklist.md'),
    'docs/runtime-unlock/runtime-unlock-ladder.md': existsSync('docs/runtime-unlock/runtime-unlock-ladder.md'),
    'docs/runtime-unlock/blocked-scope-policy.md': existsSync('docs/runtime-unlock/blocked-scope-policy.md'),
    'docs/runtime-unlock/owner-repo-audit-prompts.md': existsSync('docs/runtime-unlock/owner-repo-audit-prompts.md'),
    'docs/activation-phase-53a-runtime-unlock-roadmap-results.md': existsSync('docs/activation-phase-53a-runtime-unlock-roadmap-results.md'),
  }
}

function readLatestExecutionReport(): RuntimeUnlockExecutionReport | null {
  try {
    if (!existsSync(RUNTIME_UNLOCK_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(RUNTIME_UNLOCK_LOCAL_REPORT_PATH, 'utf8')) as RuntimeUnlockExecutionReport
  } catch {
    return null
  }
}
