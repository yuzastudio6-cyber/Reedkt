import {
  buildContainerReadinessCommandPlans,
  summarizeContainerReadinessCommandPlan,
  validateContainerImageTag,
} from '../activation'

const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG
const jsonOutput = process.argv.includes('--json')

try {
  if (imageTag) {
    const tagCheck = validateContainerImageTag(imageTag)
    if (!tagCheck.allowed) {
      throw new Error(`Invalid image tag: ${tagCheck.blockers.join('; ')}`)
    }
  }

  const commandPlans = buildContainerReadinessCommandPlans(imageTag)

  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: true,
      imageTag,
      dockerExecuted: false,
      gcloudExecuted: false,
      providerExecuted: false,
      modelDownloadExecuted: false,
      mediaProcessingExecuted: false,
      commandPlans,
    }, null, 2))
  } else {
    console.log(summarizeContainerReadinessCommandPlan(commandPlans))
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      dockerExecuted: false,
      gcloudExecuted: false,
      providerExecuted: false,
      modelDownloadExecuted: false,
      mediaProcessingExecuted: false,
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
