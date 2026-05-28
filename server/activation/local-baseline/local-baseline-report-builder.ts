import { buildActivationBaselineAuditReport } from '../activation-baseline-audit-report'
import {
  buildLocalBaselineCommandPlan,
  localBaselineCommandCatalog,
} from './local-baseline-command-catalog'
import { evaluateLocalBaselineCatalogEntry } from './local-baseline-policy'
import { notRunCommandResult } from './local-baseline-result-parser'
import type {
  BuildLocalBaselineReportInput,
  LocalBaselineBlocker,
  LocalBaselineCommandCatalogSummary,
  LocalBaselineCommandCategory,
  LocalBaselineCommandResult,
  LocalBaselineMode,
  LocalBaselineNextAction,
  LocalBaselinePhase20Readiness,
  LocalBaselineReadinessStateSummary,
  LocalBaselineReport,
  LocalBaselineWarning,
} from './local-baseline-types'

export const LOCAL_BASELINE_REPORT_ID = 'activation-phase-19-local-baseline'
export const LOCAL_BASELINE_SOURCE_BRANCH = 'codex/rp-activation-19-local-readiness-baseline'

export function buildLocalBaselineReport(input: BuildLocalBaselineReportInput = {}): LocalBaselineReport {
  const mode = input.mode ?? 'static_only'
  const packageScripts = input.packageScripts ?? {}
  const commandResults = input.commandResults ?? localBaselineCommandCatalog.map((entry) => notRunCommandResult(entry.commandId, entry.npmScript))
  const commandCatalogSummary = buildCommandCatalogSummary(packageScripts)
  const readinessStateSummary = buildReadinessStateSummary(commandCatalogSummary, packageScripts, input.activationBaselineAuditExists)
  const blockers = buildBlockers(commandCatalogSummary, readinessStateSummary, commandResults)
  const warnings = buildWarnings(commandResults)
  const phase20Readiness = buildPhase20Readiness(readinessStateSummary, commandResults)

  return {
    reportId: LOCAL_BASELINE_REPORT_ID,
    createdAt: input.createdAt ?? new Date().toISOString(),
    mode,
    sourceBranch: input.sourceBranch ?? LOCAL_BASELINE_SOURCE_BRANCH,
    commandCatalogSummary,
    commandPlan: buildLocalBaselineCommandPlan(),
    commandResults,
    readinessStateSummary,
    blockers,
    warnings,
    phase20Readiness,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
    dockerBuildAllowed: false,
    nextActions: buildNextActions(phase20Readiness),
  }
}

export function buildProductionBlockedLocalBaselineReport(packageScripts: Record<string, string>): LocalBaselineReport {
  return buildLocalBaselineReport({
    mode: 'production_blocked',
    packageScripts,
  })
}

function buildCommandCatalogSummary(packageScripts: Record<string, string>): LocalBaselineCommandCatalogSummary {
  const missingScripts = localBaselineCommandCatalog
    .filter((entry) => entry.blocksPhase20IfMissing && !packageScripts[entry.npmScript])
    .map((entry) => entry.npmScript)
  const forbiddenCommandIds = localBaselineCommandCatalog
    .filter((entry) => !evaluateLocalBaselineCatalogEntry(entry).allowed)
    .map((entry) => entry.commandId)

  return {
    totalCommands: localBaselineCommandCatalog.length,
    byCategory: categoryCounts(),
    safeLocalCommands: localBaselineCommandCatalog.filter((entry) => entry.safeToExecuteLocally).length,
    requiresConfirmation: localBaselineCommandCatalog.filter((entry) => entry.requiresConfirmation).length,
    generatedFixtureCommands: localBaselineCommandCatalog
      .filter((entry) => entry.mayUseGeneratedFixtures)
      .map((entry) => entry.npmScript),
    skipSafeCommands: localBaselineCommandCatalog
      .filter((entry) => entry.maySkipIfToolUnavailable)
      .map((entry) => entry.npmScript),
    missingScripts,
    forbiddenCommandIds,
  }
}

function categoryCounts(): Record<LocalBaselineCommandCategory, number> {
  return localBaselineCommandCatalog.reduce<Record<LocalBaselineCommandCategory, number>>(
    (counts, entry) => {
      counts[entry.category] += 1
      return counts
    },
    {
      production_smoke: 0,
      activation_smoke: 0,
      summary: 0,
      build_check: 0,
      forbidden: 0,
    },
  )
}

function buildReadinessStateSummary(
  summary: LocalBaselineCommandCatalogSummary,
  packageScripts: Record<string, string>,
  activationBaselineAuditExists?: boolean,
): LocalBaselineReadinessStateSummary {
  const activationAudit = buildActivationBaselineAuditReport()
  const productionStillBlocked = activationAudit.productionReadyAllowed === false &&
    activationAudit.externalBetaAllowed === false &&
    activationAudit.realUserMediaTestingAllowed === false

  return {
    allRequiredScriptsExist: summary.missingScripts.length === 0,
    activationBaselineAuditExists: activationBaselineAuditExists ?? Boolean(packageScripts['smoke:activation-baseline-audit']),
    localBaselineCommandExists: Boolean(packageScripts['activation:local-baseline'] && packageScripts['smoke:activation-local-baseline']),
    productionStillBlocked,
    commandCatalogSafe: summary.forbiddenCommandIds.length === 0,
    revideoProductionBlocked: true,
    forbiddenCatalogCommands: summary.forbiddenCommandIds,
  }
}

function buildBlockers(
  summary: LocalBaselineCommandCatalogSummary,
  readiness: LocalBaselineReadinessStateSummary,
  commandResults: LocalBaselineCommandResult[],
): LocalBaselineBlocker[] {
  const blockers: LocalBaselineBlocker[] = []

  for (const script of summary.missingScripts) {
    blockers.push({ id: `missing-script-${script}`, summary: `Missing package.json script: ${script}.` })
  }

  for (const commandId of summary.forbiddenCommandIds) {
    blockers.push({ id: `forbidden-command-${commandId}`, commandId, summary: `Forbidden command appears in the local baseline catalog: ${commandId}.` })
  }

  for (const result of commandResults.filter((item) => item.status === 'failed')) {
    blockers.push({ id: `failed-command-${result.commandId}`, commandId: result.commandId, summary: `${result.npmScript} failed during confirmed execution.` })
  }

  if (!readiness.activationBaselineAuditExists) {
    blockers.push({ id: 'activation-baseline-audit-missing', summary: 'Phase 18 activation baseline audit script is missing.' })
  }

  if (!readiness.localBaselineCommandExists) {
    blockers.push({ id: 'local-baseline-command-missing', summary: 'Phase 19 local baseline command and smoke script must exist.' })
  }

  if (!readiness.productionStillBlocked) {
    blockers.push({ id: 'production-not-blocked', summary: 'Production, external beta, and real user media must remain blocked.' })
  }

  return blockers
}

function buildWarnings(commandResults: LocalBaselineCommandResult[]): LocalBaselineWarning[] {
  const warnings: LocalBaselineWarning[] = [
    {
      id: 'phase20-preparation-only',
      summary: 'Phase 19 can prepare for Phase 20 only; it does not allow Docker build, push, or readiness execution.',
    },
  ]

  for (const result of commandResults) {
    if (result.status === 'warning' || result.status === 'skipped') {
      warnings.push({
        id: `${result.commandId}-${result.status}`,
        commandId: result.commandId,
        summary: `${result.npmScript} completed with ${result.status} status: ${result.warnings.join(', ') || 'review output'}.`,
      })
    }
  }

  return warnings
}

function buildPhase20Readiness(
  readiness: LocalBaselineReadinessStateSummary,
  commandResults: LocalBaselineCommandResult[],
): LocalBaselinePhase20Readiness {
  const failedResults = commandResults.filter((result) => result.status === 'failed')
  const blockers = [
    ...(!readiness.allRequiredScriptsExist ? ['All required local baseline package scripts must exist.'] : []),
    ...(!readiness.activationBaselineAuditExists ? ['Phase 18 activation baseline audit must exist.'] : []),
    ...(!readiness.localBaselineCommandExists ? ['Phase 19 local baseline CLI and smoke must exist.'] : []),
    ...(!readiness.productionStillBlocked ? ['Production/external beta/real user media must remain blocked.'] : []),
    ...(!readiness.commandCatalogSafe ? ['Local execution catalog must exclude Docker/GCP/provider/model/real-media commands.'] : []),
    ...failedResults.map((result) => `${result.npmScript} must pass or be documented before Phase 20 preparation.`),
  ]

  return {
    readyForContainerBuildPreparation: blockers.length === 0,
    requiredBeforeContainerBuild: [
      'Review the Phase 19 local baseline report.',
      'Keep Docker/GCP/provider/model/real-media commands outside the local baseline runner.',
      'Confirm a human owner approves any Phase 20 image names and tags before running Docker manually.',
    ],
    blockers,
    warnings: [
      'Ready means container build preparation only, not automatic Docker build or push.',
      'Container readiness remains Phase 21 and must be human-run against reviewed images.',
    ],
  }
}

function buildNextActions(phase20Readiness: LocalBaselinePhase20Readiness): LocalBaselineNextAction[] {
  return [
    {
      id: 'review-local-baseline',
      title: 'Review Phase 19 local baseline',
      summary: 'Review script coverage, blockers, warnings, and safe/static command plan output.',
    },
    {
      id: 'keep-launch-blocked',
      title: 'Keep launch states blocked',
      summary: 'Production-ready, external beta, real user media, and Docker build remain false in this report.',
    },
    {
      id: 'prepare-phase-20',
      title: phase20Readiness.readyForContainerBuildPreparation ? 'Prepare Phase 20 manually' : 'Resolve baseline blockers first',
      summary: phase20Readiness.readyForContainerBuildPreparation
        ? 'A human may prepare image names/tags for Phase 20; no automatic Docker command is allowed.'
        : 'Resolve missing scripts, forbidden catalog entries, or failed commands before Phase 20 preparation.',
    },
  ]
}

export function localBaselineModeLabel(mode: LocalBaselineMode): string {
  if (mode === 'static_only') return 'static only'
  if (mode === 'command_plan') return 'command plan'
  if (mode === 'execute_confirmed') return 'execute confirmed'
  return 'production blocked'
}
