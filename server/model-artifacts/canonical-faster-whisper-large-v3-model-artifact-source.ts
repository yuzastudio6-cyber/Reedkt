import { createHash } from 'node:crypto'

import { z } from 'zod'

export const CANONICAL_FASTER_WHISPER_LARGE_V3_SOURCE_VERSION =
  'canonical-faster-whisper-large-v3-model-artifact-source-v1' as const
export const CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_ID =
  'faster-whisper-large-v3' as const
export const CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_FAMILY =
  'systran-faster-whisper-large-v3' as const
export const CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_REVISION =
  'edaa852ec7e145841d8ffdb056a99866b5f0a478' as const

const SOURCE_ROOT =
  `https://huggingface.co/Systran/faster-whisper-large-v3/resolve/${CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_REVISION}` as const
const SHA256 = /^[a-f0-9]{64}$/u
const safeFileName = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u)
const sourceFile = z.object({
  fileName: safeFileName,
  byteLength: z.number().int().positive().safe(),
  sha256: z.string().regex(SHA256),
  immutableSourceUrl: z.string().url(),
  runtimeRequired: z.boolean(),
}).strict()

const sourceWithoutDigest = z.object({
  schemaVersion: z.literal(CANONICAL_FASTER_WHISPER_LARGE_V3_SOURCE_VERSION),
  sourceOwner: z.literal('Systran'),
  sourceRepository: z.literal(
    'https://huggingface.co/Systran/faster-whisper-large-v3',
  ),
  modelId: z.literal(CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_ID),
  modelFamily: z.literal(CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_FAMILY),
  modelRevision: z.literal(CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_REVISION),
  modelRevisionMutable: z.literal(false),
  modelLicense: z.literal('MIT'),
  modelCardSha256: z.literal(
    '39e96252229f5a3d0141dc81afb65a36fd205461ac21e5b70f2cd1248ef0082c',
  ),
  sourceLicenseSha256: z.literal(
    'af6798135e729f8aa6c853936d037dfdea449734d26b8ea6a89805fca758c0d5',
  ),
  files: z.array(sourceFile).length(6),
  runtimeFileCount: z.literal(5),
  runtimeFileTotalBytes: z.literal(3_090_835_702),
  weightsFormat: z.literal('ctranslate2_float16'),
  modelArtifactImageRequired: z.literal(true),
  remoteFetchBoundary: z.literal(
    'private_digest_pinned_model_artifact_ingest_build_only',
  ),
  workerImageBuildRemoteFetchAllowed: z.literal(false),
  workerRuntimeRemoteFetchAllowed: z.literal(false),
  callerUrlOrModelBytesAllowed: z.literal(false),
  exactFileSetRereadRequired: z.literal(true),
  a100PrimaryTarget: z.literal(true),
  l4ClassifiedFallbackMayUseSameExactModel: z.literal(true),
  smallerOrQuantizedFallbackAllowed: z.literal(false),
  privateInternalQualificationRequired: z.literal(true),
  privateInternalQualified: z.literal(false),
  paidProductionUseApproved: z.literal(false),
  productionQualified: z.literal(false),
}).strict().superRefine((value, context) => {
  const names = value.files.map((file) => file.fileName)
  const runtime = value.files.filter((file) => file.runtimeRequired)
  if (
    new Set(names).size !== names.length
    || runtime.length !== value.runtimeFileCount
    || runtime.reduce((sum, file) => sum + file.byteLength, 0)
      !== value.runtimeFileTotalBytes
    || value.files.some((file) =>
      file.immutableSourceUrl !== `${SOURCE_ROOT}/${file.fileName}`)
  ) context.addIssue({
    code: 'custom',
    message: 'The Large-V3 source candidate lost its exact file set.',
  })
})

const sourceSchema = sourceWithoutDigest.extend({
  sourceDigestSha256: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export type CanonicalFasterWhisperLargeV3ModelArtifactSource = z.infer<
  typeof sourceSchema
>

const SOURCE_FILES = Object.freeze([
  {
    fileName: 'config.json',
    byteLength: 2_394,
    sha256: 'a9306624f5ec14270a014b647e5c316b6e03a662c369758d1b90697a7b0655b9',
    immutableSourceUrl: `${SOURCE_ROOT}/config.json`,
    runtimeRequired: true,
  },
  {
    fileName: 'model.bin',
    byteLength: 3_087_284_237,
    sha256: '69f74147e3334731bc3a76048724833325d2ec74642fb52620eda87352e3d4f1',
    immutableSourceUrl: `${SOURCE_ROOT}/model.bin`,
    runtimeRequired: true,
  },
  {
    fileName: 'preprocessor_config.json',
    byteLength: 340,
    sha256: '7ccc62c6f2765af1f3b46c00c9b5894426835a05021c8b9c01eecb6dfb542711',
    immutableSourceUrl: `${SOURCE_ROOT}/preprocessor_config.json`,
    runtimeRequired: true,
  },
  {
    fileName: 'tokenizer.json',
    byteLength: 2_480_617,
    sha256: '6d8cbd7cd0d8d5815e478dac67b85a26bbe77c1f5e0c6d76d1ce2abc0e5f21ca',
    immutableSourceUrl: `${SOURCE_ROOT}/tokenizer.json`,
    runtimeRequired: true,
  },
  {
    fileName: 'vocabulary.json',
    byteLength: 1_068_114,
    sha256: 'c69260f2ab26d659b7c398f9a2b2b48ed0df16c3b47d7326782fd9cba71690c1',
    immutableSourceUrl: `${SOURCE_ROOT}/vocabulary.json`,
    runtimeRequired: true,
  },
  {
    fileName: 'README.md',
    byteLength: 2_052,
    sha256: '39e96252229f5a3d0141dc81afb65a36fd205461ac21e5b70f2cd1248ef0082c',
    immutableSourceUrl: `${SOURCE_ROOT}/README.md`,
    runtimeRequired: false,
  },
] as const)

export function createCanonicalFasterWhisperLargeV3ModelArtifactSource():
CanonicalFasterWhisperLargeV3ModelArtifactSource {
  const draft = sourceWithoutDigest.parse({
    schemaVersion: CANONICAL_FASTER_WHISPER_LARGE_V3_SOURCE_VERSION,
    sourceOwner: 'Systran',
    sourceRepository:
      'https://huggingface.co/Systran/faster-whisper-large-v3',
    modelId: CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_ID,
    modelFamily: CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_FAMILY,
    modelRevision: CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_REVISION,
    modelRevisionMutable: false,
    modelLicense: 'MIT',
    modelCardSha256:
      '39e96252229f5a3d0141dc81afb65a36fd205461ac21e5b70f2cd1248ef0082c',
    sourceLicenseSha256:
      'af6798135e729f8aa6c853936d037dfdea449734d26b8ea6a89805fca758c0d5',
    files: SOURCE_FILES.map((file) => ({ ...file })),
    runtimeFileCount: 5,
    runtimeFileTotalBytes: 3_090_835_702,
    weightsFormat: 'ctranslate2_float16',
    modelArtifactImageRequired: true,
    remoteFetchBoundary:
      'private_digest_pinned_model_artifact_ingest_build_only',
    workerImageBuildRemoteFetchAllowed: false,
    workerRuntimeRemoteFetchAllowed: false,
    callerUrlOrModelBytesAllowed: false,
    exactFileSetRereadRequired: true,
    a100PrimaryTarget: true,
    l4ClassifiedFallbackMayUseSameExactModel: true,
    smallerOrQuantizedFallbackAllowed: false,
    privateInternalQualificationRequired: true,
    privateInternalQualified: false,
    paidProductionUseApproved: false,
    productionQualified: false,
  })
  return sourceSchema.parse({
    ...draft,
    sourceDigestSha256: prefixedDigest(draft),
  })
}

export function assertCanonicalFasterWhisperLargeV3ModelArtifactSource(
  untrusted: unknown,
): CanonicalFasterWhisperLargeV3ModelArtifactSource {
  const source = sourceSchema.parse(untrusted)
  const draft = { ...source }
  Reflect.deleteProperty(draft, 'sourceDigestSha256')
  if (source.sourceDigestSha256 !== prefixedDigest(draft)) {
    throw new Error('The Large-V3 model source digest is invalid.')
  }
  return structuredClone(source)
}

function prefixedDigest(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableStringify(value), 'utf8')
    .digest('hex')}`
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort(compareUtf16).map((key) =>
      `${JSON.stringify(key)}:${stableStringify(record[key])}`
    ).join(',')}}`
  }
  return JSON.stringify(value)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
