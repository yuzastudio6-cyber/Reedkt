import { localBaselineModeLabel, runLocalBaseline } from '../activation/local-baseline'
import type { LocalBaselineReport } from '../activation/local-baseline'

const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')
const commandPlan = args.includes('--command-plan')
const execute = args.includes('--execute')
const continueOnFailure = args.includes('--continue-on-failure')

const mode = execute ? 'execute_confirmed' : commandPlan ? 'command_plan' : 'static_only'

try {
  const report = await runLocalBaseline({
    mode,
    continueOnFailure,
  })

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else if (mode === 'command_plan') {
    console.log(formatCommandPlan(report))
  } else {
    console.log(formatSummary(report))
  }

  process.exitCode = report.blockers.length > 0 ? 1 : 0
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      realUserMediaTestingAllowed: false,
      dockerBuildAllowed: false,
    }, null, 2))
  } else {
    console.error(message)
  }
  process.exitCode = 1
}

function formatSummary(report: LocalBaselineReport): string {
  return [
    `Activation local baseline: ${localBaselineModeLabel(report.mode)}`,
    `Report: ${report.reportId}`,
    `Commands cataloged: ${report.commandCatalogSummary.totalCommands}`,
    `Missing scripts: ${report.commandCatalogSummary.missingScripts.length}`,
    `Forbidden catalog commands: ${report.commandCatalogSummary.forbiddenCommandIds.length}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    `Docker build allowed: ${report.dockerBuildAllowed}`,
    `Phase 20 preparation ready: ${report.phase20Readiness.readyForContainerBuildPreparation}`,
    `Blockers: ${report.blockers.length}`,
    `Warnings: ${report.warnings.length}`,
    '',
    'Next actions:',
    ...report.nextActions.map((action) => `- ${action.title}: ${action.summary}`),
  ].join('\n')
}

function formatCommandPlan(report: LocalBaselineReport): string {
  return [
    'Activation local baseline command plan',
    'Does not execute commands. Execute mode requires --execute and REEDITPRO_CONFIRM_LOCAL_BASELINE=true.',
    '',
    ...report.commandPlan.map((command) => [
      `# ${command.commandId}`,
      command.command,
      `category=${command.category}`,
      `safeToExecuteLocally=${command.safeToExecuteLocally}`,
      `requiresConfirmation=${command.requiresConfirmation}`,
      `expectedOutcome=${command.expectedOutcome}`,
    ].join('\n')),
  ].join('\n\n')
}
