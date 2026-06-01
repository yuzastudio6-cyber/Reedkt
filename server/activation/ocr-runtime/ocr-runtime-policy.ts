import { getApprovedOcrModelDownloadEvidence } from '../ocr-model-download'
import type {
  OcrRuntimeConfig,
  OcrRuntimeEnvValidationInput,
  OcrRuntimeValidationResult,
} from './ocr-runtime-types'

const phase37B = getApprovedOcrModelDownloadEvidence()

export const ocrRuntimeConfig: OcrRuntimeConfig = {
  phase: '37C',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'generated_ui_text_frame',
  modelFamily: 'PP-OCRv5',
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1',
  modelGcsPath: phase37B.targetGcsPath,
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  qaArtifactPrefix: 'activation/phase37c/generated-ocr-runtime',
  localTempRoot: '/tmp/reeditpro-ocr-runtime/phase37c',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  cpuOnly: true,
  fixtureWidth: 1280,
  fixtureHeight: 720,
  requiredTokenRecallThreshold: 0.8,
  requiredAverageConfidenceThreshold: 0.6,
  detectionArchiveSha256: phase37B.assetSha256['det/PP-OCRv5_mobile_det_infer.tar'],
  recognitionArchiveSha256: phase37B.assetSha256['rec/PP-OCRv5_mobile_rec_infer.tar'],
  dictionarySha256: phase37B.assetSha256['dict/ppocrv5_dict.txt'],
  aggregateSha256: phase37B.aggregateSha256 ?? '',
}

export const ocrRuntimeDoesNotDo = [
  'no real media OCR',
  'no real video OCR',
  'no arbitrary uploaded files',
  'no caption/render QA integration',
  'no textline orientation classifier download',
  'no PaddleOCR/PaddlePaddle runtime model auto-download',
  'no provider calls',
  'no public buckets or public artifacts',
  'no signed URLs as source of truth',
  'no Cloud Run deploy',
  'no Docker push',
  'no GPU jobs',
  'no production or beta unlock',
  'no broad real-user media',
  'no Track A work',
]

export function phase37COcrRuntimeArtifactPrefix(runId: string): string {
  if (!/^phase37c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 37C run id: ${runId}`)
  return `${ocrRuntimeConfig.qaArtifactPrefix}/${runId}`
}

export function validateOcrRuntimeExecutionEnv(
  input: OcrRuntimeEnvValidationInput = {},
): OcrRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV

  if (projectId !== ocrRuntimeConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== ocrRuntimeConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== ocrRuntimeConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== ocrRuntimeConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if ((input.privateGcsReadConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ=true is required for Phase 37C private model reads.')
  if ((input.runtimeExecuteConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true is required for generated OCR runtime execution.')
  if ((input.artifactUploadConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true is required before private Phase 37C artifact upload.')
  if ((input.runtimeMode ?? process.env.REEDITPRO_OCR_RUNTIME_MODE ?? ocrRuntimeConfig.runtimeMode) !== ocrRuntimeConfig.runtimeMode) blockers.push('OCR runtime mode must be exactly generated_ui_text_frame.')
  if ((input.modelGcsPath ?? process.env.REEDITPRO_OCR_MODEL_GCS_PATH ?? ocrRuntimeConfig.modelGcsPath) !== ocrRuntimeConfig.modelGcsPath) blockers.push('Only the verified Phase 37B PP-OCRv5 private model GCS path may be used.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_OCR_AGGREGATE_SHA256 ?? ocrRuntimeConfig.aggregateSha256) !== ocrRuntimeConfig.aggregateSha256) blockers.push('OCR aggregate checksum must match Phase 37B evidence.')
  if ((input.generatedFixturesOnly ?? process.env.GENERATED_OCR_FIXTURES_ONLY ?? 'true') !== 'true') blockers.push('Generated OCR fixtures only guard must be true.')
  if ((input.realMediaInputEnabled ?? process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Real media input must remain disabled.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if ((input.publicOutputEnabled ?? process.env.PUBLIC_OUTPUT_ENABLED ?? 'false') !== 'false') blockers.push('Public output must remain disabled.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 37C local execution orchestration.')

  warnings.push('Phase 37C verifies PaddleOCR on generated synthetic UI/text frames only.')
  warnings.push('Passing Phase 37C does not approve controlled real-video OCR until Phase 37D or caption/render integration until Phase 37E.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateOcrRuntimeStaticPlan(
  input: Partial<OcrRuntimeEnvValidationInput> = {},
): OcrRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== ocrRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== ocrRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== ocrRuntimeConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== ocrRuntimeConfig.runtimeMode) blockers.push('Runtime mode must be generated_ui_text_frame.')
  if (input.modelGcsPath && input.modelGcsPath !== ocrRuntimeConfig.modelGcsPath) blockers.push('Model path must be the verified Phase 37B private PP-OCRv5 path.')
  warnings.push('Static plan/report mode does not copy model assets, run PaddleOCR, mutate GCS, process media, or unlock beta/production.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
