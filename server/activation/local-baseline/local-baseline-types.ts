export type LocalBaselineMode =
  | 'static_only'
  | 'command_plan'
  | 'execute_confirmed'
  | 'production_blocked'

export type LocalBaselineCommandCategory =
  | 'production_smoke'
  | 'activation_smoke'
  | 'summary'
  | 'build_check'
  | 'forbidden'

export type LocalBaselineCommandStatus =
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'not_run'
  | 'warning'

export interface LocalBaselineCommandCatalogEntry {
  commandId: string
  npmScript: string
  category: LocalBaselineCommandCategory
  description: string
  defaultMode: LocalBaselineMode
  safeToExecuteLocally: boolean
  requiresConfirmation: boolean
  mayUseGeneratedFixtures: boolean
  maySkipIfToolUnavailable: boolean
  forbiddenBehaviors: string[]
  expectedOutcome: string
  blocksPhase20IfMissing: boolean
  notes: string[]
}

export interface LocalBaselineCommandPlanEntry {
  commandId: string
  npmScript: string
  command: string
  category: LocalBaselineCommandCategory
  description: string
  safeToExecuteLocally: boolean
  requiresConfirmation: boolean
  expectedOutcome: string
  notes: string[]
}

export interface LocalBaselineCommandResult {
  commandId: string
  npmScript: string
  status: LocalBaselineCommandStatus
  exitCode?: number
  startedAt?: string
  completedAt?: string
  durationMs?: number
  outputSummary?: string
  warnings: string[]
  error?: string
}

export interface LocalBaselineCommandCatalogSummary {
  totalCommands: number
  byCategory: Record<LocalBaselineCommandCategory, number>
  safeLocalCommands: number
  requiresConfirmation: number
  generatedFixtureCommands: string[]
  skipSafeCommands: string[]
  missingScripts: string[]
  forbiddenCommandIds: string[]
}

export interface LocalBaselineReadinessStateSummary {
  allRequiredScriptsExist: boolean
  activationBaselineAuditExists: boolean
  localBaselineCommandExists: boolean
  productionStillBlocked: boolean
  commandCatalogSafe: boolean
  revideoProductionBlocked: boolean
  forbiddenCatalogCommands: string[]
}

export interface LocalBaselineBlocker {
  id: string
  commandId?: string
  summary: string
}

export interface LocalBaselineWarning {
  id: string
  commandId?: string
  summary: string
}

export interface LocalBaselineNextAction {
  id: string
  title: string
  summary: string
}

export interface LocalBaselinePhase20Readiness {
  readyForContainerBuildPreparation: boolean
  requiredBeforeContainerBuild: string[]
  blockers: string[]
  warnings: string[]
}

export interface LocalBaselineReport {
  reportId: string
  createdAt: string
  mode: LocalBaselineMode
  sourceBranch?: string
  commandCatalogSummary: LocalBaselineCommandCatalogSummary
  commandPlan: LocalBaselineCommandPlanEntry[]
  commandResults: LocalBaselineCommandResult[]
  readinessStateSummary: LocalBaselineReadinessStateSummary
  blockers: LocalBaselineBlocker[]
  warnings: LocalBaselineWarning[]
  phase20Readiness: LocalBaselinePhase20Readiness
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
  dockerBuildAllowed: false
  nextActions: LocalBaselineNextAction[]
}

export interface BuildLocalBaselineReportInput {
  mode?: LocalBaselineMode
  packageScripts?: Record<string, string>
  commandResults?: LocalBaselineCommandResult[]
  createdAt?: string
  sourceBranch?: string
  activationBaselineAuditExists?: boolean
}

export interface RunLocalBaselineOptions {
  mode?: LocalBaselineMode
  cwd?: string
  env?: NodeJS.ProcessEnv
  continueOnFailure?: boolean
  sourceBranch?: string
}

export interface ParseLocalBaselineCommandResultInput {
  commandId: string
  npmScript: string
  exitCode: number | null
  stdout: string
  stderr: string
  startedAt: string
  completedAt: string
  durationMs: number
  error?: string
}
