import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { z } from 'zod'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../workers/media/media-path-safety'
import { resolveFasterWhisperRuntimeReadiness } from '../workers/speech'

const manifestSchema = z.object({
  manifestVersion: z.literal('reeditpro-internal-testing-faster-whisper-model-v1'),
  toolId: z.literal('faster_whisper'),
  modelName: z.string().min(1),
  modelVersion: z.string().min(1),
  source: z.string().min(1),
  license: z.string().min(1),
  commercialUseStatus: z.enum(['allowed', 'internal_testing_only']),
  approvedForInternalTesting: z.literal(true),
  approvedBy: z.string().min(1),
  approvedAt: z.string().min(1),
  localModelPath: z.string().min(1),
  allowModelDownload: z.literal(false),
  redistributionAllowed: z.boolean(),
  requiresAttribution: z.boolean(),
  riskNotes: z.array(z.string()).default([]),
  expectedFiles: z.array(z.string()).default([]),
  modelDirectorySha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
})

const manifestPath = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_MANIFEST_PATH?.trim()
const envModelPath = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH?.trim()
const configuredFasterWhisperCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_COMMAND?.trim() || undefined
const configuredPythonCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND?.trim() || undefined
const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))

assert.equal(existsSync(fixturePath), true, `Internal testing video is missing: ${fixturePath}`)
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Internal testing video must be an MP4.')

const blockers: string[] = []
let parsedManifest: z.infer<typeof manifestSchema> | undefined
let modelPathExists = false
let modelDirectorySha256: string | undefined

if (!manifestPath) {
  blockers.push('manifest_path_missing')
} else if (!existsSync(manifestPath)) {
  blockers.push('manifest_file_missing')
} else {
  assertNoSignedUrlOrRawUrl(manifestPath, 'manifestPath')
  assertNoPathTraversal(manifestPath, 'manifestPath')
  const manifestJson = await readFile(manifestPath, 'utf8')
  assertNoForbiddenManifestContent(manifestJson)
  const parsedJson = JSON.parse(manifestJson) as unknown
  const result = manifestSchema.safeParse(parsedJson)
  if (!result.success) {
    blockers.push('manifest_schema_invalid')
  } else {
    parsedManifest = result.data
    assertNoSignedUrlOrRawUrl(parsedManifest.localModelPath, 'localModelPath')
    assertNoPathTraversal(parsedManifest.localModelPath, 'localModelPath')
    if (envModelPath && resolve(envModelPath) !== resolve(parsedManifest.localModelPath)) {
      blockers.push('env_model_path_mismatch')
    }
    modelPathExists = existsSync(parsedManifest.localModelPath)
    if (!modelPathExists) blockers.push('local_model_missing')
    if (modelPathExists) {
      for (const expectedFile of parsedManifest.expectedFiles) {
        assertNoPathTraversal(expectedFile, 'expectedFile')
        if (!existsSync(join(parsedManifest.localModelPath, expectedFile))) {
          blockers.push(`expected_model_file_missing:${expectedFile}`)
        }
      }
      modelDirectorySha256 = hashDirectory(parsedManifest.localModelPath)
      if (parsedManifest.modelDirectorySha256 && parsedManifest.modelDirectorySha256 !== modelDirectorySha256) {
        blockers.push('model_directory_checksum_mismatch')
      }
    }
  }
}

const runtimeReadiness = resolveFasterWhisperRuntimeReadiness({
  fasterWhisperCommand: configuredFasterWhisperCommand,
  pythonCommand: configuredPythonCommand,
})
blockers.push(...runtimeReadiness.blockers.map((blocker) => blocker.code))

const status = blockers.length === 0
  ? 'ready_for_real_transcription_acceptance'
  : 'blocked_missing_approved_transcription_prerequisites'
const sanitized = JSON.stringify({ status, blockers, manifest: parsedManifest }).toLowerCase()
assert.doesNotMatch(sanitized, /signed_url|supabase_service_role|api[_-]?key|secret|public_url|x-goog-signature/)
assert.doesNotMatch(sanitized, /providerrequest|liveqwen|gcs:\/\//)
assert.doesNotMatch(sanitized, /documents\/test video|internal testing\.mp4/)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-real-video-transcription-prerequisite-manifest',
  fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
  status,
  manifestConfigured: Boolean(manifestPath),
  manifestValid: Boolean(parsedManifest),
  toolId: parsedManifest?.toolId ?? 'faster_whisper',
  modelName: parsedManifest?.modelName ?? 'not_configured',
  modelVersion: parsedManifest?.modelVersion ?? 'not_configured',
  commercialUseStatus: parsedManifest?.commercialUseStatus ?? 'not_configured',
  approvedForInternalTesting: parsedManifest?.approvedForInternalTesting === true,
  localModelPathExists: modelPathExists,
  expectedFileCount: parsedManifest?.expectedFiles.length ?? 0,
  modelDirectorySha256: modelDirectorySha256 ? `${modelDirectorySha256.slice(0, 12)}...` : undefined,
  fasterWhisperRuntimeStatus: runtimeReadiness.status,
  fasterWhisperRuntimeKind: runtimeReadiness.runtimeKind,
  blockerCodes: [...new Set(blockers)],
  blockedScope: {
    modelDownload: false,
    packageInstall: false,
    providerCalls: false,
    liveQwenCalls: false,
    mediaProcessing: false,
    finalExport: false,
    publicDelivery: false,
    supabaseWrites: false,
    gcsWrites: false,
    externalBeta: false,
    paidProduction: false,
  },
}, null, 2))

function assertNoForbiddenManifestContent(content: string): void {
  assert.doesNotMatch(content.toLowerCase(), /signed_url|supabase_service_role|api[_-]?key|secret|public_url|x-goog-signature/)
}

function hashDirectory(directoryPath: string): string {
  const hash = createHash('sha256')
  for (const filePath of listFiles(directoryPath).sort()) {
    const relativePath = filePath.slice(directoryPath.length + 1)
    hash.update(relativePath)
    hash.update(createHash('sha256').update(readFileSyncSafe(filePath)).digest('hex'))
  }
  return hash.digest('hex')
}

function listFiles(root: string): string[] {
  const entries = readdirSync(root)
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(root, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) files.push(...listFiles(fullPath))
    if (stats.isFile()) files.push(fullPath)
  }
  return files
}

function readFileSyncSafe(filePath: string): Buffer {
  return Buffer.from(readFileSync(filePath))
}
