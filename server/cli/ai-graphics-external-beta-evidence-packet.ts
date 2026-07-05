import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaEvidencePacket,
  type AiGraphicsExternalBetaEvidenceRecordInput,
} from '../tool-registry/ai-graphics-external-beta-evidence-packet'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readEvidenceRecords(): AiGraphicsExternalBetaEvidenceRecordInput[] {
  const inputPath = stringFlag('--evidence-records')
  if (!inputPath) return []
  return JSON.parse(fs.readFileSync(inputPath, 'utf8')) as AiGraphicsExternalBetaEvidenceRecordInput[]
}

const packet = buildAiGraphicsExternalBetaEvidencePacket(readEvidenceRecords())

console.log(JSON.stringify({
  ...packet,
  input: {
    validatorOnly: true,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
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
