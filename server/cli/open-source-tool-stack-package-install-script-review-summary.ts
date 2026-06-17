import { buildOpenSourceToolStackPackageInstallScriptReviewReports } from '../activation/open-source-tool-stack-package-install-script-review'

const reports = buildOpenSourceToolStackPackageInstallScriptReviewReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      futureCommand: reports.decision.futureCommand,
      nextPrompt: reports.decision.nextPrompt,
      blockers: reports.blockerReport.blockers,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
