import {
  buildGcpStagingFoundationReport,
  readGcpStagingConfigFromEnv,
  summarizeGcpStagingCommandPlan,
} from '../activation'

const jsonOutput = process.argv.includes('--json')

try {
  const report = buildGcpStagingFoundationReport({
    mode: 'static_plan',
    configInput: readConfigInput(),
  })

  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: report.blockers.length === 0,
      gcloudExecuted: false,
      resourcesCreated: false,
      secretValuesCreated: false,
      deploymentExecuted: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      realUserMediaTestingAllowed: false,
      commandPlans: report.commandPlans,
      blockers: report.blockers,
      warnings: report.warnings,
    }, null, 2))
  } else {
    console.log(summarizeGcpStagingCommandPlan(report))
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      gcloudExecuted: false,
      resourcesCreated: false,
      secretValuesCreated: false,
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

function readConfigInput() {
  const envInput = readGcpStagingConfigFromEnv()
  return {
    ...envInput,
    projectId: readArgValue('--project') ?? envInput.projectId,
    region: readArgValue('--region') ?? envInput.region,
    artifactRegion: readArgValue('--artifact-region') ?? envInput.artifactRegion,
    bucketLocation: readArgValue('--bucket-location') ?? envInput.bucketLocation,
    imageTag: readArgValue('--image-tag') ?? envInput.imageTag,
  }
}

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
