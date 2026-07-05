import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaApiRouteMountImplementationQaInput,
  evaluateAiGraphicsExternalBetaApiRouteMountImplementationQa,
  type AiGraphicsExternalBetaApiRouteMountImplementationQaInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-mount-implementation-qa'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile(flag: string): Record<string, unknown> | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as Record<string, unknown>
}

const sourceRouteMountImplementationReviewPacket = readJsonFile(
  '--route-mount-implementation-review-packet',
)

const input: AiGraphicsExternalBetaApiRouteMountImplementationQaInput =
  sourceRouteMountImplementationReviewPacket
    ? buildAiGraphicsExternalBetaApiRouteMountImplementationQaInput(
        sourceRouteMountImplementationReviewPacket,
      )
    : {}

const report = evaluateAiGraphicsExternalBetaApiRouteMountImplementationQa(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteMountImplementationReviewPacketRead:
      Boolean(stringFlag('--route-mount-implementation-review-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
