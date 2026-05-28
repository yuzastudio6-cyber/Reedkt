import type {
  LocalBaselineCommandCatalogEntry,
  LocalBaselineCommandCategory,
  LocalBaselineCommandPlanEntry,
} from './local-baseline-types'

export const localBaselineForbiddenBehaviors = [
  'No Docker build, run, or push.',
  'No gcloud or cloud deployment.',
  'No provider calls.',
  'No model weight downloads.',
  'No arbitrary real user media processing.',
  'No secrets or secret-value creation.',
  'No production-ready or external beta approval.',
  'No Revideo production usage.',
]

export const productionSmokeScripts = [
  'smoke:prod-runtime-contracts',
  'smoke:prod-tool-registry',
  'smoke:gcp-foundation',
  'smoke:prod-worker-orchestration',
  'smoke:prod-container-readiness',
  'smoke:prod-media-foundation',
  'smoke:prod-speech-caption',
  'smoke:prod-smart-cut-timeline',
  'smoke:prod-audio-sound',
  'smoke:prod-core-tool-install',
  'smoke:prod-gpu-ai-install',
  'smoke:prod-readiness-validation',
  'smoke:prod-real-speech-caption',
  'smoke:prod-real-smart-cut-timeline',
  'smoke:prod-real-audio',
  'smoke:prod-real-color',
  'smoke:prod-real-mask-background',
  'smoke:prod-real-enhancement-slowmotion',
  'smoke:prod-final-render-export',
  'smoke:prod-full-e2e-workflow',
  'smoke:prod-full-e2e-blockers',
  'smoke:prod-hardening',
  'smoke:prod-security-privacy',
  'smoke:prod-cost-controls',
  'smoke:beta-readiness',
] as const

export const activationSmokeScripts = [
  'smoke:activation-baseline-audit',
  'smoke:activation-local-baseline',
] as const

export const productionSummaryScripts = [
  'prod:readiness:summary',
  'prod:readiness:command-plan',
  'prod:e2e:summary',
  'prod:hardening:summary',
  'prod:security:summary',
  'prod:cost:summary',
  'prod:beta:summary',
] as const

export const buildCheckScripts = [
  'lint',
  'build',
  'build:server',
] as const

const generatedFixtureScripts = new Set<string>([
  'smoke:prod-media-foundation',
  'smoke:prod-audio-sound',
  'smoke:prod-real-speech-caption',
  'smoke:prod-real-smart-cut-timeline',
  'smoke:prod-real-audio',
  'smoke:prod-real-color',
  'smoke:prod-real-mask-background',
  'smoke:prod-real-enhancement-slowmotion',
  'smoke:prod-final-render-export',
  'smoke:prod-full-e2e-workflow',
])

const skipSafeScripts = new Set<string>([
  'smoke:prod-media-foundation',
  'smoke:prod-audio-sound',
  'smoke:prod-core-tool-install',
  'smoke:prod-readiness-validation',
  'smoke:prod-real-speech-caption',
  'smoke:prod-real-smart-cut-timeline',
  'smoke:prod-real-audio',
  'smoke:prod-real-color',
  'smoke:prod-real-mask-background',
  'smoke:prod-real-enhancement-slowmotion',
  'smoke:prod-final-render-export',
  'smoke:prod-full-e2e-workflow',
])

export const localBaselineCommandCatalog: LocalBaselineCommandCatalogEntry[] = [
  ...productionSmokeScripts.map((script) => command(script, 'production_smoke')),
  ...activationSmokeScripts.map((script) => command(script, 'activation_smoke')),
  ...productionSummaryScripts.map((script) => command(script, 'summary')),
  ...buildCheckScripts.map((script) => command(script, 'build_check')),
]

export function buildLocalBaselineCommandPlan(
  catalog: LocalBaselineCommandCatalogEntry[] = localBaselineCommandCatalog,
): LocalBaselineCommandPlanEntry[] {
  return catalog.map((entry) => ({
    commandId: entry.commandId,
    npmScript: entry.npmScript,
    command: `npm.cmd run ${entry.npmScript}`,
    category: entry.category,
    description: entry.description,
    safeToExecuteLocally: entry.safeToExecuteLocally,
    requiresConfirmation: entry.requiresConfirmation,
    expectedOutcome: entry.expectedOutcome,
    notes: entry.notes,
  }))
}

function command(
  npmScript: string,
  category: Exclude<LocalBaselineCommandCategory, 'forbidden'>,
): LocalBaselineCommandCatalogEntry {
  return {
    commandId: npmScript.replace(/[:]/g, '_'),
    npmScript,
    category,
    description: descriptionForScript(npmScript, category),
    defaultMode: 'execute_confirmed',
    safeToExecuteLocally: true,
    requiresConfirmation: true,
    mayUseGeneratedFixtures: generatedFixtureScripts.has(npmScript),
    maySkipIfToolUnavailable: skipSafeScripts.has(npmScript),
    forbiddenBehaviors: localBaselineForbiddenBehaviors,
    expectedOutcome: expectedOutcomeForCategory(category),
    blocksPhase20IfMissing: true,
    notes: notesForScript(npmScript, category),
  }
}

function descriptionForScript(
  npmScript: string,
  category: Exclude<LocalBaselineCommandCategory, 'forbidden'>,
): string {
  if (category === 'production_smoke') return `Local production smoke validation for ${npmScript}.`
  if (category === 'activation_smoke') return `Activation smoke validation for ${npmScript}.`
  if (category === 'summary') return `Static production readiness summary for ${npmScript}.`
  return `Local build/check command for ${npmScript}.`
}

function expectedOutcomeForCategory(category: Exclude<LocalBaselineCommandCategory, 'forbidden'>): string {
  if (category === 'summary') return 'Prints a static or dry-run readiness summary while keeping production blocked.'
  if (category === 'build_check') return 'Exits successfully; Vite large chunk output is warning-only when the build succeeds.'
  return 'Exits successfully or reports documented skip-safe local fixture/tool availability warnings.'
}

function notesForScript(
  npmScript: string,
  category: Exclude<LocalBaselineCommandCategory, 'forbidden'>,
): string[] {
  const notes = [
    'Cataloged for Phase 19 local baseline only.',
    'Runs only in execute_confirmed mode with REEDITPRO_CONFIRM_LOCAL_BASELINE=true.',
  ]

  if (generatedFixtureScripts.has(npmScript)) notes.push('May use generated local fixtures.')
  if (skipSafeScripts.has(npmScript)) notes.push('May skip local fixture/tool checks when host tools are unavailable.')
  if (category === 'summary') notes.push('Summary command is static/dry-run and must not execute deployment or media work.')
  if (category === 'build_check') notes.push('Build/check command must not mutate source files.')

  return notes
}
