import {
  buildArtifactPushPlanReport,
  summarizeArtifactPushPlanReport,
} from '../activation/artifact-push'

const jsonOutput = process.argv.includes('--json')

try {
  const report = buildArtifactPushPlanReport({
    project: readArgValue('--project') ?? process.env.GCP_PROJECT_ID,
    artifactRegion: readArgValue('--artifact-region') ?? process.env.GCP_ARTIFACT_REGION,
    repository: readArgValue('--repository') ?? process.env.REEDITPRO_ARTIFACT_REPOSITORY,
    imageTag: readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG,
  })

  if (report.blockers.length > 0) {
    process.exitCode = 1
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(summarizeArtifactPushPlanReport(report))
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      dockerPushExecuted: false,
      gcloudExecuted: false,
      deploymentExecuted: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      realUserMediaTestingAllowed: false,
    }, null, 2))
  } else {
    console.error(message)
  }
  process.exitCode = 1
}

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
