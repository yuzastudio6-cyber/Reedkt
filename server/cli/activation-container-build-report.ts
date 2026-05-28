import { readFileSync } from 'node:fs'
import {
  buildContainerBuildReport,
  buildContainerBuildResultFromParsedLog,
  parseContainerBuildLog,
  summarizeContainerBuildReport,
  validateContainerImageTag,
} from '../activation/container-build'

const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG
const jsonOutput = process.argv.includes('--json')
const logPaths = readRepeatedArgValues('--log')

try {
  const tagCheck = validateContainerImageTag(imageTag)
  if (!tagCheck.allowed) {
    throw new Error(`Invalid or missing image tag: ${tagCheck.blockers.join('; ')}`)
  }

  const buildResults = logPaths.map((logPath) => {
    const logText = readFileSync(logPath, 'utf8')
    const parsedLog = parseContainerBuildLog(logText, logPath)
    return buildContainerBuildResultFromParsedLog({
      parsedLog,
      logPath,
      imageTag,
    })
  })

  const report = buildContainerBuildReport({
    mode: logPaths.length > 0 ? 'report_from_logs' : 'static_plan',
    imageTag,
    buildResults: buildResults.length > 0 ? buildResults : undefined,
  })

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(summarizeContainerBuildReport(report))
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

function readRepeatedArgValues(name: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1])
    }
  }
  return values
}
