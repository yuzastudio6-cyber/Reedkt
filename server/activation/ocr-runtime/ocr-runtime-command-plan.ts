import { ocrGeneratedFixtureSpecs } from './ocr-generated-fixture-registry'
import { getPhase37COcrRuntimeAssets } from './ocr-runtime-phase37b-assets'
import { ocrRuntimeConfig, ocrRuntimeDoesNotDo } from './ocr-runtime-policy'
import type { OcrRuntimeCommandPlan } from './ocr-runtime-types'

export function buildOcrRuntimeCommandPlans(input: { runId?: string } = {}): OcrRuntimeCommandPlan[] {
  const runId = input.runId ?? 'phase37c-YYYYMMDDTHHMMSS'
  const localRoot = `${ocrRuntimeConfig.localTempRoot}/${runId}`
  const modelRawDir = `${localRoot}/models/raw`
  const reportDir = `${localRoot}/reports`
  const artifactPrefix = `gs://${ocrRuntimeConfig.qaBucket}/${ocrRuntimeConfig.qaArtifactPrefix}/${runId}/`
  const assets = getPhase37COcrRuntimeAssets()

  return [
    {
      commandId: 'ocr_runtime_preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list --filter=status:ACTIVE --format=value(account)',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro --format=value(projectId)',
        `gcloud storage buckets describe gs://${ocrRuntimeConfig.generatedAssetsBucket} --format=json`,
        `gcloud storage buckets describe gs://${ocrRuntimeConfig.qaBucket} --format=json`,
        `gcloud storage buckets get-iam-policy gs://${ocrRuntimeConfig.generatedAssetsBucket} --format=json`,
        `gcloud storage buckets get-iam-policy gs://${ocrRuntimeConfig.qaBucket} --format=json`,
        ...assets.map((asset) => `gcloud storage objects describe ${asset.gcsUri} --format=json`),
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: ['Preflight is read-only and does not mutate IAM, GCS objects, workers, or runtime services.'],
    },
    ...assets.map((asset): OcrRuntimeCommandPlan => ({
      commandId: `ocr_runtime_copy_${asset.relativePath.replace(/[^0-9A-Za-z]+/g, '_')}`,
      phase: 'model-copy',
      commandString: `gcloud storage cp ${asset.gcsUri} ${modelRawDir}/${asset.relativePath}`,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ',
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: ['Copies only verified private Phase 37B PP-OCRv5 OCR assets into /tmp for local verification.'],
    })),
    {
      commandId: 'ocr_runtime_verify_sha256',
      phase: 'checksum',
      commandString: `node -e "verify sha256 for ${assets.map((asset) => asset.relativePath).join(', ')} in ${modelRawDir}"`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: [`Expected aggregate SHA-256 is ${ocrRuntimeConfig.aggregateSha256}.`],
    },
    {
      commandId: 'ocr_runtime_safe_extract',
      phase: 'extract',
      commandString: `tar -tf ${modelRawDir}/det/PP-OCRv5_mobile_det_infer.tar && tar -tf ${modelRawDir}/rec/PP-OCRv5_mobile_rec_infer.tar`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: ['Extraction must reject absolute paths, parent traversal, and empty tar members before use.'],
    },
    {
      commandId: 'ocr_runtime_generate_fixtures',
      phase: 'fixture',
      commandString: `python server/workers/ocr-runtime/run-generated-ocr-fixture.py --run-id ${runId} --output-dir ${reportDir}`,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: [`Generates ${ocrGeneratedFixtureSpecs.length} deterministic synthetic UI/text fixtures only.`],
    },
    {
      commandId: 'ocr_runtime_execute_local_cpu',
      phase: 'execute',
      commandString: [
        'GCP_PROJECT_ID=reeditpro',
        'GCP_REGION=us-central1',
        'REEDITPRO_ENV=staging',
        'REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ=true',
        'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true',
        'REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true',
        'npm run activation:ocr-runtime -- --execute --keep-temp',
      ].join(' '),
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: ['CPU-only local runtime; PaddleOCR init/inference is wrapped in a network/download guard.'],
    },
    {
      commandId: 'ocr_runtime_upload_private_reports',
      phase: 'upload',
      commandString: `gcloud storage cp ${reportDir}/*.json ${artifactPrefix}`,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD',
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: ['Uploads only generated reports and generated fixture images to the private QA-artifacts bucket.'],
    },
    {
      commandId: 'ocr_runtime_local_docker_fallback',
      phase: 'docker',
      commandString: 'REEDITPRO_CONFIRM_OCR_RUNTIME_DOCKER_BUILD=true npm run activation:ocr-runtime -- --docker-build',
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_OCR_RUNTIME_DOCKER_BUILD',
      textOnlyByDefault: true,
      doesNotDo: ocrRuntimeDoesNotDo,
      warnings: ['Local Docker fallback only; no push, deploy, Cloud Run job, or public artifact.'],
    },
  ]
}
