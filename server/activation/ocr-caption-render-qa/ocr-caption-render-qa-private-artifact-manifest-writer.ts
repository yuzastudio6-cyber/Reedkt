import { collectOcrRuntimeArtifacts } from '../ocr-runtime'
import { ocrCaptionRenderQaConfig } from './ocr-caption-render-qa-policy'
import type {
  OcrCaptionRenderQaPrivateArtifactManifest,
} from './ocr-caption-render-qa-types'
import type { ControlledRealVideoGcsObjectMetadata } from '../controlled-real-video-ocr-safe-zone'

export async function buildOcrCaptionRenderQaPrivateArtifactManifest(input: {
  runId: string
  reportDir: string
  objectPrefix: string
  uploadedArtifacts?: ControlledRealVideoGcsObjectMetadata[]
}): Promise<OcrCaptionRenderQaPrivateArtifactManifest> {
  const artifacts = await collectOcrRuntimeArtifacts({
    rootDir: input.reportDir,
    bucket: ocrCaptionRenderQaConfig.qaBucket,
    objectPrefix: input.objectPrefix,
  })

  return {
    phase: '37E',
    runId: input.runId,
    privateOnly: true,
    bucket: ocrCaptionRenderQaConfig.qaBucket,
    prefix: input.objectPrefix,
    artifactCount: artifacts.filter((artifact) => artifact.localPath?.endsWith('.json')).length,
    jsonOnly: true,
    rawTextCommitted: false,
    rawFramesUploaded: false,
    overlaysUploaded: false,
    mediaUploaded: false,
    artifacts: artifacts
      .filter((artifact) => artifact.localPath?.endsWith('.json'))
      .map((artifact) => ({
        id: artifact.id,
        localPath: artifact.localPath,
        object: artifact.object,
        gcsUri: artifact.gcsUri,
        sizeBytes: artifact.sizeBytes ?? 0,
        sha256: artifact.sha256 ?? '',
      })),
    uploadedArtifacts: input.uploadedArtifacts ?? [],
    blocked: {
      publicAccess: true,
      signedUrls: true,
      ocrRuntime: true,
      frameExtraction: true,
      renderExecution: true,
      arbitraryMedia: true,
      trackA: true,
      beta: true,
      production: true,
    },
  }
}
