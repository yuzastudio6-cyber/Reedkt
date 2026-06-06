import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { makeCrossWorkstreamHandoffRunId } from './cross-workstream-handoff-policy'
import { buildCrossWorkstreamSourceAudit } from './handoff-source-audit'
import { resolveCrossWorkstreamHandoffEvidence } from './handoff-evidence-resolver'
import { buildOwnerResponseSchema } from './owner-response-schema'
import { buildOwnerResponseTemplate } from './owner-response-template-builder'
import { buildOwnerPromptPacketReferences } from './owner-prompt-packet-references'
import { buildOwnerResponseLedger } from './handoff-tracking-ledger-builder'
import { buildCrossWorkstreamHandoffManifest, buildOwnerResponseIntakeInstructions } from './handoff-intake-manifest-builder'
import { buildCrossWorkstreamHandoffCommandPlan } from './handoff-tracking-command-plan'
import { buildCrossWorkstreamHandoffIamPlan } from './handoff-tracking-iam-plan'
import { buildCrossWorkstreamHandoffQaSummary } from './handoff-tracking-qa-summary'
import { buildNotAttemptedPhase52HSyncResult, buildPhase52HSupabaseMilestoneBundle, buildPhase52HSupabaseSyncInput } from './handoff-tracking-supabase-sync'
import type { CrossWorkstreamExecutionReport, CrossWorkstreamReport } from './cross-workstream-handoff-types'

export const CROSS_WORKSTREAM_HANDOFF_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'cross-workstream-handoff-tracking',
  'phase52h',
  'job-execution',
  'phase52h-report.json',
)

export function buildCrossWorkstreamHandoffReport(): CrossWorkstreamReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      ...executionReport,
      reportId: 'activation-phase-52h-cross-workstream-handoff-tracking',
      executionReport,
    }
  }

  const runId = makeCrossWorkstreamHandoffRunId(new Date('2026-06-06T00:00:00Z'))
  const createdAt = new Date('2026-06-06T00:00:00.000Z').toISOString()
  const repoOwnershipAudit = buildCrossWorkstreamSourceAudit(new Date(createdAt))
  const evidenceContext = resolveCrossWorkstreamHandoffEvidence(repoOwnershipAudit)
  const ownerResponseSchema = buildOwnerResponseSchema()
  const ownerResponseTemplate = buildOwnerResponseTemplate()
  const ownerPromptPacketRefs = buildOwnerPromptPacketReferences(evidenceContext)
  const ownerResponseLedger = buildOwnerResponseLedger({ runId, evidence: evidenceContext, createdAt })
  const responseIntakeInstructions = buildOwnerResponseIntakeInstructions()
  const syncResult = buildNotAttemptedPhase52HSyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const intakeManifest = buildCrossWorkstreamHandoffManifest({
    runId,
    repoOwnershipAudit,
    ownerResponseSchema,
    ownerResponseLedger,
    ownerPromptPacketRefs,
    responseIntakeInstructions,
    warnings: [...repoOwnershipAudit.warnings, ...evidenceContext.warnings, ...syncResult.warnings],
    blockers: [...repoOwnershipAudit.blockers, ...evidenceContext.blockers],
    phase52IReady: false,
  })
  const qa = buildCrossWorkstreamHandoffQaSummary({
    packageScripts: readCrossWorkstreamHandoffPackageScripts(),
    docsPresent: readCrossWorkstreamHandoffDocsPresent(),
    repoOwnershipAudit,
    ownerResponseSchema,
    ownerResponseLedger,
    ownerPromptPacketRefs,
    intakeManifest,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const syncInput = buildPhase52HSupabaseSyncInput(runId, qa)
  const milestoneBundle = buildPhase52HSupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  return {
    reportId: 'activation-phase-52h-cross-workstream-handoff-tracking',
    createdAt: new Date().toISOString(),
    phase: '52H',
    runId,
    status: 'planned',
    repoOwnershipAudit,
    evidenceContext,
    ownerResponseSchema,
    ownerResponseTemplate,
    ownerPromptPacketRefs,
    ownerResponseLedger,
    responseIntakeInstructions,
    intakeManifest,
    syncInput,
    milestoneBundle,
    supabaseSyncResult: buildNotAttemptedPhase52HSyncResult({
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
      blockers: [...inputValidation.blockers, ...bundleValidation.blockers],
      warnings: [...inputValidation.warnings, ...bundleValidation.warnings, 'Static report does not read Supabase credentials or write the milestone registry.'],
    }),
    commandPlan: buildCrossWorkstreamHandoffCommandPlan(),
    iamPlan: buildCrossWorkstreamHandoffIamPlan(),
    qa,
    artifacts: [],
    phase52IReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeCrossWorkstreamHandoffReport(report: CrossWorkstreamReport): string {
  const lines = [
    `Phase ${report.phase} cross-workstream handoff tracking`,
    `Status: ${report.status}`,
    `Owner response schema fields: ${report.ownerResponseSchema.requiredFields.length}`,
    `Ledger records: ${report.ownerResponseLedger.records.length}`,
    `Pending owners: ${report.ownerResponseLedger.pendingResponses.length}`,
    `Accepted/partial owners: ${report.ownerResponseLedger.acceptedWithBlockersResponses.length}`,
    `Prompt references: ${report.ownerPromptPacketRefs.length}`,
    `QA: ${report.qa.status}`,
    `Phase52I readiness: ${report.phase52IReadiness}`,
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

export function readCrossWorkstreamHandoffPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readCrossWorkstreamHandoffDocsPresent(): Record<string, boolean> {
  return {
    'docs/cross-chat/README.md': existsSync('docs/cross-chat/README.md'),
    'docs/cross-chat/owner-response-tracking-ledger.md': existsSync('docs/cross-chat/owner-response-tracking-ledger.md'),
    'docs/cross-chat/owner-response-template.md': existsSync('docs/cross-chat/owner-response-template.md'),
    'docs/cross-chat/cross-workstream-handoff-policy.md': existsSync('docs/cross-chat/cross-workstream-handoff-policy.md'),
    'docs/cross-chat/cross-workstream-handoff-qa-policy.md': existsSync('docs/cross-chat/cross-workstream-handoff-qa-policy.md'),
    'docs/activation-phase-52h-cross-workstream-handoff-tracking-results.md': existsSync('docs/activation-phase-52h-cross-workstream-handoff-tracking-results.md'),
  }
}

function readLatestExecutionReport(): CrossWorkstreamExecutionReport | null {
  try {
    if (!existsSync(CROSS_WORKSTREAM_HANDOFF_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(CROSS_WORKSTREAM_HANDOFF_LOCAL_REPORT_PATH, 'utf8')) as CrossWorkstreamExecutionReport
  } catch {
    return null
  }
}
