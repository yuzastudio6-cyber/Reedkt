import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'

function readArgValue(names: string[]): string | undefined {
  for (const name of names) {
    const equalsPrefix = `${name}=`
    const equalsMatch = process.argv.find((arg) => arg.startsWith(equalsPrefix))
    if (equalsMatch) return equalsMatch.slice(equalsPrefix.length).trim()

    const index = process.argv.indexOf(name)
    if (index >= 0) {
      const next = process.argv[index + 1]?.trim()
      if (next && !next.startsWith('--')) return next
    }
  }

  return undefined
}

function selectedAccountIndex(): number | undefined {
  const rawIndex = readArgValue(['--account-index', '--gcloud-account-index'])
  const parsed = rawIndex ? Number(rawIndex) : undefined
  return Number.isInteger(parsed) && Number(parsed) > 0 ? Number(parsed) : undefined
}

function replaceAccountIndexPlaceholders(value: string, accountIndex: number | undefined) {
  if (!accountIndex) return value

  return value
    .replace(/<account-index>/g, String(accountIndex))
    .replace(/<redacted-index>/g, String(accountIndex))
}

function main() {
  const spec = EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN
  const accountIndex = selectedAccountIndex()
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)

  console.log(
    JSON.stringify(
      {
        ok: runtimeGatesAllFalse,
        decision: spec.decision,
        mode: spec.mode,
        projectId: spec.projectId,
        accountSelection: {
          ...spec.accountSelection,
          cliAccountIndexProvided: Boolean(accountIndex),
          cliAccountIndex: accountIndex,
          cliAccountIndexValid: Boolean(accountIndex),
          cliAccountIndexMapsToChildEnv: Boolean(accountIndex),
        },
        currentLiveBlockers: spec.currentLiveBlockers,
        repairScope: spec.repairScope,
        tools: spec.tools.map((tool) => ({
          ...tool,
          verificationCommand: replaceAccountIndexPlaceholders(tool.verificationCommand, accountIndex),
        })),
        failureResponsePolicy: spec.failureResponsePolicy,
        safeRetryChecklist: spec.safeRetryChecklist.map((step) =>
          replaceAccountIndexPlaceholders(step, accountIndex),
        ),
        postRepairVerificationCommands: spec.postRepairVerificationCommands.map((command) =>
          replaceAccountIndexPlaceholders(command, accountIndex),
        ),
        runtimeGatesAllFalse,
        runtimeSideEffects: spec.runtimeSideEffects,
        recommendedNextPrompt: spec.recommendedNextPrompt,
      },
      null,
      2,
    ),
  )
}

main()
