import {
  buildContainerBuildReport,
  summarizeContainerBuildCommandPlan,
  validateContainerImageTag,
} from '../activation/container-build'

const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG
const jsonOutput = process.argv.includes('--json')

try {
  const tagCheck = validateContainerImageTag(imageTag)
  if (!tagCheck.allowed) {
    throw new Error(`Invalid or missing image tag: ${tagCheck.blockers.join('; ')}`)
  }

  const report = buildContainerBuildReport({
    mode: 'static_plan',
    imageTag,
  })

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(summarizeContainerBuildCommandPlan(report))
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      dockerBuildExecuted: false,
      dockerPushExecuted: false,
      gcloudExecuted: false,
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
