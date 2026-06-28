import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsExternalBetaEvidenceAdmissionBundle,
  type AiGraphicsExternalBetaEvidenceAdmissionBundleInput,
} from '../tool-registry/ai-graphics-external-beta-evidence-admission-bundle'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile(flag: string): Record<string, unknown> | undefined {
  const filePath = valueAfterFlag(flag)
  if (!filePath) return undefined

  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist for ${flag}: ${filePath}`)
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Evidence packet for ${flag} must be a JSON object: ${filePath}`)
  }
  return parsed as Record<string, unknown>
}

const input: AiGraphicsExternalBetaEvidenceAdmissionBundleInput = {
  betaEvidenceBundlePacket: readJsonFile('--beta-evidence-bundle-packet') as
    AiGraphicsExternalBetaEvidenceAdmissionBundleInput['betaEvidenceBundlePacket'],
  externalBetaEvidencePacket: readJsonFile('--external-beta-evidence-packet') as
    AiGraphicsExternalBetaEvidenceAdmissionBundleInput['externalBetaEvidencePacket'],
}

const bundle = buildAiGraphicsExternalBetaEvidenceAdmissionBundle(input)

console.log(JSON.stringify({
  ...bundle,
  input: {
    evaluatorOnly: true,
    betaEvidenceBundlePacketRead: Boolean(input.betaEvidenceBundlePacket),
    externalBetaEvidencePacketRead: Boolean(input.externalBetaEvidencePacket),
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
