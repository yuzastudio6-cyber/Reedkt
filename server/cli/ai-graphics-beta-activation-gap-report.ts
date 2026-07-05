import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildAiGraphicsBetaActivationGapReport } from '../tool-registry/ai-graphics-beta-activation-gap-report'
import { buildAiGraphicsBetaEvidenceBundle } from '../tool-registry/ai-graphics-beta-evidence-bundle'

function readOptionalJson(filePath: string): Record<string, unknown> | undefined {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) return undefined
  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
  return parsed as Record<string, unknown>
}

const committedRuntimeProofBundle = buildAiGraphicsBetaEvidenceBundle({
  nodeRuntimeProofPacket: readOptionalJson('docs/tool-intelligence/ai-graphics/node-runtime-proof.json'),
  browserRuntimeProofPacket: readOptionalJson('docs/tool-intelligence/ai-graphics/browser-runtime-proof.json'),
  satoriFontRuntimeProofPacket: readOptionalJson('docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json'),
})

const report = buildAiGraphicsBetaActivationGapReport({
  nodeRuntimeProofAccepted: committedRuntimeProofBundle.evidenceSources.nodeRuntimeProofPacketAccepted,
  browserRuntimeProofAccepted: committedRuntimeProofBundle.evidenceSources.browserRuntimeProofPacketAccepted,
  satoriFontRuntimeProofAccepted:
    committedRuntimeProofBundle.evidenceSources.satoriFontRuntimeProofPacketAccepted,
})

console.log(JSON.stringify({
  ...report,
  input: {
    reportOnly: true,
    duplicateSearchPerformed: true,
    committedRuntimeProofPacketsRead: true,
    nodeRuntimeProofPacketAccepted:
      committedRuntimeProofBundle.evidenceSources.nodeRuntimeProofPacketAccepted,
    browserRuntimeProofPacketAccepted:
      committedRuntimeProofBundle.evidenceSources.browserRuntimeProofPacketAccepted,
    satoriFontRuntimeProofPacketAccepted:
      committedRuntimeProofBundle.evidenceSources.satoriFontRuntimeProofPacketAccepted,
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
  },
}, null, 2))
