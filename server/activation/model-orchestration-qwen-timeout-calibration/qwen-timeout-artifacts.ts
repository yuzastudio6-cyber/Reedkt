import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  QWEN_TIMEOUT_CALIBRATION_GENERATED_BUCKET,
  QWEN_TIMEOUT_CALIBRATION_OBJECT_PREFIX,
  QWEN_TIMEOUT_CALIBRATION_QA_BUCKET,
  QWEN_TIMEOUT_CALIBRATION_RUN_ID,
  getQwenTimeoutGeneratedArtifactPrefix,
  getQwenTimeoutQaArtifactPrefix,
} from './qwen-timeout-calibration-policy'
import type { PrivateArtifactUpload, QwenTimeoutCalibrationReports } from './qwen-timeout-calibration-types'

const execFileAsync = promisify(execFile)

export async function uploadQwenTimeoutPrivateArtifacts(
  reports: QwenTimeoutCalibrationReports,
): Promise<PrivateArtifactUpload> {
  const objectPrefix = `${QWEN_TIMEOUT_CALIBRATION_OBJECT_PREFIX}/${QWEN_TIMEOUT_CALIBRATION_RUN_ID}`
  const generatedArtifacts = [
    { object: 'audit/repo-ownership-audit.json', value: reports.sourceAudit },
    { object: 'policy/qwen-timeout-calibration-policy.json', value: reports.policy },
    { object: 'secrets/qwen-timeout-secret-access.json', value: reports.secretAccess },
    { object: 'cases/qwen-timeout-calibration-cases.json', value: reports.cases },
    { object: 'results/qwen-timeout-calibration-results.json', value: reports.results },
    { object: 'analysis/qwen-timeout-result-analysis.json', value: reports.analysis },
    { object: 'recommendation/qwen-model-timeout-target-recommendation.json', value: reports.recommendation },
    { object: 'manifest/qwen-timeout-calibration-manifest.json', value: reports.manifest },
  ]
  const qaArtifacts = [
    { object: 'qa/qwen-timeout-calibration-qa.json', value: reports.qa },
    { object: 'reports/qwen-timeout-calibration-report.json', value: reports.report },
  ]

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-qwentimeout1-'))
  const uploaded: Array<Record<string, unknown>> = []
  try {
    for (const artifact of generatedArtifacts) {
      uploaded.push(await uploadJsonArtifact(tmpDir, QWEN_TIMEOUT_CALIBRATION_GENERATED_BUCKET, objectPrefix, artifact.object, artifact.value))
    }
    for (const artifact of qaArtifacts) {
      uploaded.push(await uploadJsonArtifact(tmpDir, QWEN_TIMEOUT_CALIBRATION_QA_BUCKET, objectPrefix, artifact.object, artifact.value))
    }
    return {
      status: 'uploaded',
      generatedPrefix: getQwenTimeoutGeneratedArtifactPrefix(),
      qaPrefix: getQwenTimeoutQaArtifactPrefix(),
      artifacts: uploaded,
      publicArtifacts: false,
      signedUrls: false,
      rawProviderResponsesStored: false,
    }
  } catch (error) {
    return {
      status: 'blocked_private_artifact_upload_failed',
      generatedPrefix: getQwenTimeoutGeneratedArtifactPrefix(),
      qaPrefix: getQwenTimeoutQaArtifactPrefix(),
      artifacts: uploaded,
      publicArtifacts: false,
      signedUrls: false,
      rawProviderResponsesStored: false,
      blocker: error instanceof Error ? error.message : 'private_artifact_upload_failed',
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}

async function uploadJsonArtifact(
  tmpDir: string,
  bucket: string,
  objectPrefix: string,
  object: string,
  value: unknown,
) {
  const localPath = path.join(tmpDir, object)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  const destination = `gs://${bucket}/${objectPrefix}/${object}`
  await execFileAsync('gcloud', ['storage', 'cp', '--quiet', localPath, destination], {
    timeout: 30000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env },
  })
  return {
    bucket,
    object: `${objectPrefix}/${object}`,
    gcsUri: destination,
    private: true,
  }
}
