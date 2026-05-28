import { phase33ePrefix, textBehindSubjectFrameConfig } from './text-behind-subject-frame-policy'

export function resolveTextBehindSubjectFrameInputs() {
  return {
    representativeFrame: textBehindSubjectFrameConfig.representativeFrameGcsUri,
    mask: textBehindSubjectFrameConfig.maskGcsUri,
    cutout: textBehindSubjectFrameConfig.cutoutGcsUri,
  }
}

export function resolveTextBehindSubjectFrameArtifacts(runId: string) {
  const prefix = phase33ePrefix(runId)
  return {
    textLayerPlan: `gs://${textBehindSubjectFrameConfig.generatedAssetsBucket}/${prefix}/plans/text-layer-plan.json`,
    depthCompositionManifest: `gs://${textBehindSubjectFrameConfig.generatedAssetsBucket}/${prefix}/manifests/depth-composition-manifest.json`,
    preview: `gs://${textBehindSubjectFrameConfig.previewsBucket}/${prefix}/text-behind-subject-preview.png`,
    qaReport: `gs://${textBehindSubjectFrameConfig.qaBucket}/${prefix}/qa/text-behind-subject-frame-qa.json`,
    phase33eReport: `gs://${textBehindSubjectFrameConfig.qaBucket}/${prefix}/reports/phase33e-report.json`,
  }
}
