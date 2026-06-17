import {
  buildOpenSourceToolStackDuckdbNativeRebuildReports,
  readOpenSourceToolStackDuckdbNativeRebuildArtifacts,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-execution'

const reports = readOpenSourceToolStackDuckdbNativeRebuildArtifacts() ?? buildOpenSourceToolStackDuckdbNativeRebuildReports()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      rebuildStatus: reports.nativeRebuildReport.rebuildStatus,
      importPassed: reports.duckdbImportProofReport.importPassed,
      queryPassed: reports.duckdbSyntheticQueryReport.queryPassed,
      integrityPassed: reports.packageLockNativeArtifactIntegrityReport.passed,
      nextPrompt: reports.decision.nextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
