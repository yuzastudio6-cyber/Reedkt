import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'

function main() {
  const spec = EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)

  console.log(
    JSON.stringify(
      {
        ok: runtimeGatesAllFalse,
        decision: spec.decision,
        mode: spec.mode,
        projectId: spec.projectId,
        accountSelection: spec.accountSelection,
        currentLiveBlockers: spec.currentLiveBlockers,
        repairScope: spec.repairScope,
        tools: spec.tools,
        postRepairVerificationCommands: spec.postRepairVerificationCommands,
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
