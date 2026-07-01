import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC } from '../../src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness'

type ByteMismatch = {
  relativePath: string
  expectedBytes: number
  actualBytes: number
}

type IndexReferenceFinding = {
  indexPath: string
  shard: string
  reason: string
}

type WeightIndex = {
  weight_map?: Record<string, string>
}

type PipelineIndex = {
  _class_name?: string
}

const runtimeSideEffects = {
  hashesComputed: false,
  modelImportRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  computeVmCreated: false,
  dockerRun: false,
  gcpMutatingCommandsExecuted: false,
  supabaseTouched: false,
  sqlExecuted: false,
  creditMutationCreated: false,
} as const

function toRelativeUnix(basePath: string, filePath: string): string {
  return path.relative(basePath, filePath).split(path.sep).join('/')
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return walkFiles(fullPath)
    if (entry.isFile()) return [fullPath]
    return []
  })
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

function validateIndexReferences(indexPath: string): IndexReferenceFinding[] {
  const findings: IndexReferenceFinding[] = []
  const indexFilePath = path.join(
    AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC.privateCachePath,
    indexPath,
  )
  const indexDirectory = path.dirname(indexPath)
  const indexJson = readJson<WeightIndex>(indexFilePath)

  for (const shard of new Set(Object.values(indexJson.weight_map ?? {}))) {
    if (path.isAbsolute(shard)) {
      findings.push({ indexPath, shard, reason: 'absolute_shard_path' })
      continue
    }

    if (shard.split(/[\\/]/).includes('..')) {
      findings.push({ indexPath, shard, reason: 'parent_traversal_shard_path' })
      continue
    }

    const shardPath = path.join(
      AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC.privateCachePath,
      indexDirectory,
      shard,
    )
    if (!existsSync(shardPath)) {
      findings.push({ indexPath, shard, reason: 'missing_local_shard' })
    }
  }

  return findings
}

function main() {
  if (process.argv.includes('--hash') || process.argv.includes('--import-model') || process.argv.includes('--run')) {
    throw new Error(
      'This is a stat-only cache readiness check. Hashing, model imports, and runtime execution are intentionally unavailable.',
    )
  }

  const spec = AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC
  const expectedFiles = new Set(spec.manifest.map((entry) => entry.relativePath))
  const cachePathExists = existsSync(spec.privateCachePath)
  const actualFiles = cachePathExists
    ? walkFiles(spec.privateCachePath)
        .map((filePath) => toRelativeUnix(spec.privateCachePath, filePath))
        .sort()
    : []

  const missingFiles: string[] = []
  const byteMismatches: ByteMismatch[] = []
  let aggregateBytes = 0

  for (const entry of spec.manifest) {
    const filePath = path.join(spec.privateCachePath, entry.relativePath)
    if (!existsSync(filePath)) {
      missingFiles.push(entry.relativePath)
      continue
    }

    const actualBytes = statSync(filePath).size
    aggregateBytes += actualBytes
    if (actualBytes !== entry.expectedBytes) {
      byteMismatches.push({
        relativePath: entry.relativePath,
        expectedBytes: entry.expectedBytes,
        actualBytes,
      })
    }
  }

  const unexpectedFiles = actualFiles.filter((relativePath) => !expectedFiles.has(relativePath))
  const partialFiles = actualFiles.filter((relativePath) => relativePath.endsWith('.part'))
  const appleDoubleSidecars = actualFiles.filter((relativePath) => path.basename(relativePath).startsWith('._'))
  const assetsOrExamples = actualFiles.filter(
    (relativePath) => relativePath.startsWith('assets/') || relativePath.startsWith('examples/'),
  )

  let modelIndexClassName: string | undefined
  let modelIndexClassNameMatches = false
  const indexReferenceFindings: IndexReferenceFinding[] = []

  if (cachePathExists && missingFiles.length === 0) {
    const modelIndex = readJson<PipelineIndex>(path.join(spec.privateCachePath, 'model_index.json'))
    modelIndexClassName = modelIndex._class_name
    modelIndexClassNameMatches = modelIndexClassName === spec.expectedModelIndexClassName
    indexReferenceFindings.push(
      ...validateIndexReferences('text_encoder/model.safetensors.index.json'),
      ...validateIndexReferences('transformer/diffusion_pytorch_model.safetensors.index.json'),
    )
  }

  const aggregateBytesMatches = aggregateBytes === spec.aggregateBytes
  const indexRefsLocal = indexReferenceFindings.length === 0
  const runtimeGatesAllFalse = Object.values(runtimeSideEffects).every((value) => value === false)
  const ok =
    cachePathExists &&
    missingFiles.length === 0 &&
    byteMismatches.length === 0 &&
    unexpectedFiles.length === 0 &&
    partialFiles.length === 0 &&
    appleDoubleSidecars.length === 0 &&
    assetsOrExamples.length === 0 &&
    aggregateBytesMatches &&
    modelIndexClassNameMatches &&
    indexRefsLocal &&
    runtimeGatesAllFalse

  console.log(
    JSON.stringify(
      {
        ok,
        decision: spec.decision,
        mode: spec.mode,
        toolId: spec.toolId,
        modelRepository: spec.modelRepository,
        sourceCommit: spec.sourceCommit,
        privateCachePath: spec.privateCachePath,
        selectedGpu: spec.selectedGpu,
        quotaBlocker: spec.quotaBlocker,
        statOnly: spec.statOnly,
        cachePathExists,
        runtimeEssentialFileCount: spec.runtimeEssentialFileCount,
        expectedFileCount: spec.manifest.length,
        actualFileCount: actualFiles.length,
        aggregateBytes,
        expectedAggregateBytes: spec.aggregateBytes,
        aggregateBytesMatches,
        missingFiles,
        byteMismatches,
        unexpectedFiles,
        partialFiles,
        appleDoubleSidecars,
        assetsOrExamples,
        modelIndexClassName,
        expectedModelIndexClassName: spec.expectedModelIndexClassName,
        modelIndexClassNameMatches,
        indexRefsLocal,
        indexReferenceFindings,
        runtimeSideEffects,
        runtimeGatesAllFalse,
        readyForExternalAgentExecutionNow: spec.readyForExternalAgentExecutionNow,
        readyForBoundedRetryAfterBlockerClears: spec.readyForBoundedRetryAfterBlockerClears,
        nextAction: spec.nextAction,
      },
      null,
      2,
    ),
  )
}

main()
