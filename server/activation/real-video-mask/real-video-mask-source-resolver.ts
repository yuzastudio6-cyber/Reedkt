import { phase33dPrefix, realVideoMaskConfig } from './real-video-mask-policy'

export function resolveRealVideoMaskSource() {
  return {
    sourcePhase32RunId: realVideoMaskConfig.phase32RunId,
    sourceGcsUri: realVideoMaskConfig.sourceGcsUri,
    sourceBucket: realVideoMaskConfig.sourceBucket,
    sourceObject: realVideoMaskConfig.sourceObject,
    inputIsPrivateStagingObject: true,
    publicUrlAllowed: false,
  }
}

export function resolvePhase33DArtifactUris(runId: string) {
  const prefix = phase33dPrefix(runId)
  return {
    representativeFrame: `gs://${realVideoMaskConfig.generatedAssetsBucket}/${prefix}/representative-frame/frame.png`,
    frameExtractionReport: `gs://${realVideoMaskConfig.qaBucket}/${prefix}/reports/frame-extraction-report.json`,
    mask: `gs://${realVideoMaskConfig.generatedAssetsBucket}/${prefix}/mask/mask.png`,
    cutout: `gs://${realVideoMaskConfig.generatedAssetsBucket}/${prefix}/cutout/cutout.png`,
    maskMetadata: `gs://${realVideoMaskConfig.generatedAssetsBucket}/${prefix}/mask/mask-metadata.json`,
    qaReport: `gs://${realVideoMaskConfig.qaBucket}/${prefix}/qa/mask-qa.json`,
    phase33dReport: `gs://${realVideoMaskConfig.qaBucket}/${prefix}/reports/phase33d-report.json`,
  }
}
