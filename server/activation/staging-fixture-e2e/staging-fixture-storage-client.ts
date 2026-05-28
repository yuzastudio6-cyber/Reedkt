import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { StagingFixtureBucketMap } from './staging-fixture-e2e-types'

const execFileAsync = promisify(execFile)

export const stagingFixtureBuckets: StagingFixtureBucketMap = {
  source: 'reeditpro-staging-reeditpro-source-media',
  proxy: 'reeditpro-staging-reeditpro-proxy-media',
  analysis: 'reeditpro-staging-reeditpro-analysis-artifacts',
  transcripts: 'reeditpro-staging-reeditpro-transcripts',
  previews: 'reeditpro-staging-reeditpro-previews',
  finalExports: 'reeditpro-staging-reeditpro-final-exports',
  temp: 'reeditpro-staging-reeditpro-worker-temp',
  qa: 'reeditpro-staging-reeditpro-qa-artifacts',
}

export function buildFixturePrefix(runId: string): string {
  if (!/^[a-z0-9-]+$/i.test(runId)) throw new Error('Fixture run id must contain letters, numbers, or dashes only.')
  return `activation-fixtures/phase25/${runId}`
}

export async function uploadFixtureWithGcloud(input: {
  fixturePath: string
  bucket: string
  object: string
  logPath?: string
}): Promise<void> {
  assertFixtureObject(input.object)
  await execFileAsync('gcloud', [
    'storage',
    'cp',
    input.fixturePath,
    `gs://${input.bucket}/${input.object}`,
    '--content-type=video/mp4',
  ], { timeout: 120_000, maxBuffer: 4 * 1024 * 1024 })
}

export function assertFixtureObject(object: string): void {
  if (!object.startsWith('activation-fixtures/phase25/')) throw new Error(`Object must stay under activation-fixtures/phase25/: ${object}`)
  if (object.startsWith('/') || object.includes('..') || /https?:\/\//i.test(object)) throw new Error(`Unsafe fixture object: ${object}`)
}
