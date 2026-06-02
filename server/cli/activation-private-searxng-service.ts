import { buildPrivateSearxngCommandPlan, runPrivateSearxngServiceValidation } from '../activation/private-searxng-service'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildPrivateSearxngCommandPlan(), null, 2))
} else {
  const result = await runPrivateSearxngServiceValidation({ execute: true })
  console.log(JSON.stringify({
    evidence: result.evidence,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      serviceName: result.executionReport.serviceValidation.serviceName,
      image: result.executionReport.runtimeMetadata.image,
      imageDigest: result.executionReport.runtimeMetadata.imageDigest,
      normalizedSourceCount: result.executionReport.normalizedSources.length,
      sourceManifest: result.evidence.sourceManifestUri,
      phase49GReadiness: result.executionReport.phase49GReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
