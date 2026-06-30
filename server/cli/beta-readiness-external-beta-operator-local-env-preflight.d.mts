export const RECOMMENDED_OPERATOR_ENV_FILE: '.env.reeditpro-beta-operator.local'

export interface BetaReadinessExternalBetaOperatorLocalEnvPreflightOptions {
  repoRoot?: string
  envFilePath?: string
  envFileContent?: string
  env?: Record<string, string | undefined>
  resolveGit?: (args: string[]) => string
}

export interface BetaReadinessExternalBetaOperatorLocalEnvPreflightReport {
  ok: boolean
  decision: string
  readyForExternalBetaEvidenceCollector: boolean
  envFile: {
    loaded: boolean
    ownerOnlyPermissions?: boolean
    gitIgnored?: boolean
    safetyGaps: string[]
  }
  operatorInputs: {
    required: number
    pending: number
    humanActionablePending: number
    autoFillablePending: number
  }
  ownerApprovalIntake: {
    counts: {
      pending: number
    }
  }
  deployedEvidenceInputManifest: {
    pendingRequiredInputs: number
  }
  safetyGaps: string[]
}

export function buildBetaReadinessExternalBetaOperatorLocalEnvPreflight(
  options?: BetaReadinessExternalBetaOperatorLocalEnvPreflightOptions,
): BetaReadinessExternalBetaOperatorLocalEnvPreflightReport

export function renderBetaReadinessExternalBetaOperatorLocalEnvPreflightMarkdown(
  report: BetaReadinessExternalBetaOperatorLocalEnvPreflightReport,
): string
