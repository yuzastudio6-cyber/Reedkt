import { buildNextControlledCandidateOrWorkerHandoffReports } from '../activation/next-controlled-candidate-or-worker-handoff-review'

const reports = buildNextControlledCandidateOrWorkerHandoffReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      blockers: reports.blockerReport.blockers,
      recommendedNextCandidate: reports.decision.recommendedNextCandidate,
      workerHandoffReview: {
        passed: reports.workerHandoffReadinessReview.passed,
        workerExecutionApprovedThisPhase: reports.workerHandoffReadinessReview.workerExecutionApprovedThisPhase,
        nextMeaningfulStepRequiresWorkerExecution: reports.workerHandoffReadinessReview.nextMeaningfulStepRequiresWorkerExecution,
      },
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: reports.decision.nextPrompt,
    },
    null,
    2
  )
)
