import { realVideoEnhancementSampleConfig } from './real-video-enhancement-sample-policy'

export function resolveRealVideoEnhancementSampleSources() {
  return {
    phase33dRunId: realVideoEnhancementSampleConfig.phase33dRunId,
    representativeFrame: realVideoEnhancementSampleConfig.sourceFrameGcsUri,
    model: realVideoEnhancementSampleConfig.modelGcsPath,
    outputPrefixes: {
      generatedAssets: `gs://${realVideoEnhancementSampleConfig.generatedAssetsBucket}/${realVideoEnhancementSampleConfig.phase34dPrefix}/<runId>/`,
      qaArtifacts: `gs://${realVideoEnhancementSampleConfig.qaBucket}/${realVideoEnhancementSampleConfig.phase34dPrefix}/<runId>/`,
      workerTemp: `gs://${realVideoEnhancementSampleConfig.workerTempBucket}/${realVideoEnhancementSampleConfig.phase34dPrefix}/<runId>/`,
    },
  }
}
