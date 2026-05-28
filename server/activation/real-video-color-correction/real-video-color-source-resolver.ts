import { realVideoColorCorrectionConfig } from './real-video-color-correction-policy'

export function resolvePhase32ApprovedArtifactUris(runId = 'phase32-planned'): {
  input: string
  colorAnalysis: string
  colorGradeRecipe: string
  frameStats: string
  colorCorrectedExport: string
  qaReport: string
  phase32Report: string
} {
  const config = realVideoColorCorrectionConfig
  const safeRunId = /^phase32-[0-9A-Za-z]+$/.test(runId) ? runId : 'phase32-planned'
  const prefix = `${config.phase32Prefix}/${safeRunId}`
  return {
    input: config.inputGcsUri,
    colorAnalysis: `gs://${config.analysisBucket}/${prefix}/color/color-analysis.json`,
    colorGradeRecipe: `gs://${config.analysisBucket}/${prefix}/color/color-grade-recipe.json`,
    frameStats: `gs://${config.generatedAssetsBucket}/${prefix}/color/frame-signalstats.json`,
    colorCorrectedExport: `gs://${config.finalExportsBucket}/${prefix}/color-corrected-export.mp4`,
    qaReport: `gs://${config.qaBucket}/${prefix}/qa/color-correction-qa.json`,
    phase32Report: `gs://${config.qaBucket}/${prefix}/reports/phase32-report.json`,
  }
}

export function parsePhase32GcsUri(uri: string): { bucket: string; object: string } {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(uri)
  if (!match) throw new Error(`Invalid GCS URI: ${uri}`)
  return { bucket: match[1], object: match[2] }
}
