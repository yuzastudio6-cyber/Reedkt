import {
  buildStagingDeployReport,
  summarizeStagingDeployReport,
} from '../activation/staging-deploy'

const jsonOutput = process.argv.includes('--json')

try {
  const report = buildStagingDeployReport({
    projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID,
    region: readArgValue('--region') ?? process.env.GCP_REGION,
    imageTag: readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG,
    confirmDeploy: process.env.REEDITPRO_CONFIRM_STAGING_DEPLOY === 'true',
  })
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(summarizeStagingDeployReport(report))
    console.log('\nCommand plans:')
    for (const plan of report.commandPlans) {
      console.log(`# ${plan.commandId}`)
      console.log(plan.commandString)
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) console.log(JSON.stringify({ ok: false, error: message }, null, 2))
  else console.error(message)
  process.exitCode = 1
}

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
