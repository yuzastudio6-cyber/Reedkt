import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

export const
LIVING_FRAME_CONTROLLED_SAFETENSORS_BYTE_INSPECTOR_VERSION =
  'living-frame-controlled-safetensors-byte-inspector-v1' as const

export const
LIVING_FRAME_CONTROLLED_SAFETENSORS_BYTE_INSPECTION_ISSUES = [
  'stream_invalid',
  'stream_failed',
  'byte_length_mismatch',
  'content_digest_mismatch',
  'prefix_invalid',
  'header_length_invalid',
  'header_json_invalid',
  'metadata_invalid',
  'tensor_entry_invalid',
  'tensor_dtype_unsupported',
  'tensor_shape_invalid',
  'tensor_offset_invalid',
  'tensor_size_mismatch',
  'tensor_offset_gap_or_overlap',
  'data_section_mismatch',
] as const

export type LivingFrameControlledSafetensorsByteInspectionIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SAFETENSORS_BYTE_INSPECTION_ISSUES)[number]

export interface LivingFrameControlledSafetensorsByteInspectionIssue {
  readonly code:
    LivingFrameControlledSafetensorsByteInspectionIssueCode
  readonly path: string
}

export interface LivingFrameControlledSafetensorsDtypeCount {
  readonly dtype: string
  readonly count: number
}

export interface LivingFrameControlledSafetensorsRankCount {
  readonly rank: number
  readonly count: number
}

export interface LivingFrameControlledSafetensorsNamespaceCount {
  readonly namespace: string
  readonly count: number
}

export interface LivingFrameControlledSafetensorsSelectedShape {
  readonly name: string
  readonly shape: readonly number[]
}

export interface LivingFrameControlledSafetensorsByteInspection {
  readonly inspectorVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SAFETENSORS_BYTE_INSPECTOR_VERSION
  readonly byteLength: number
  readonly contentSha256: string
  readonly headerLength: number
  readonly headerDigestSha256: string
  readonly tensorNameSetDigestSha256: string
  readonly tensorCount: number
  readonly dtypeCounts:
    readonly LivingFrameControlledSafetensorsDtypeCount[]
  readonly rankCounts:
    readonly LivingFrameControlledSafetensorsRankCount[]
  readonly maximumRank: number
  readonly dataSectionByteLength: number
  readonly totalTensorByteLength: number
  readonly finalDataOffset: number
  readonly offsetsContiguousFromZero: true
  readonly everyTensorSpanMatchesShapeAndDtype: true
  readonly tensorPayloadExactlyAccountsForDataSection: true
  readonly metadataPresent: boolean
  readonly metadataKeyCount: number
  readonly metadataKeySetDigestSha256: string
  readonly metadataDigestSha256: string
  readonly metadataExpectationCount: number
  readonly expectedMetadataValuesMatched: true
  readonly namespaceCounts:
    readonly LivingFrameControlledSafetensorsNamespaceCount[]
  readonly namespaceCountDigestSha256: string
  readonly selectedTensorShapes:
    readonly LivingFrameControlledSafetensorsSelectedShape[]
  readonly selectedTensorShapeDigestSha256: string
  readonly rawMetadataReturned: false
  readonly rawHeaderOrTensorBytesReturned: false
  readonly modelLoadedOrExecuted: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface InspectLivingFrameControlledSafetensorsByteStreamInput {
  readonly stream: Readable
  readonly expectedByteLength: number
  readonly expectedContentSha256: string
  readonly maximumHeaderByteLength?: number
  readonly expectedMetadataValues?:
    Readonly<Record<string, string | number | boolean | null>>
  readonly selectedTensorNames?: readonly string[]
}

interface ParsedTensor {
  readonly name: string
  readonly dtype: string
  readonly shape: readonly number[]
  readonly start: number
  readonly end: number
  readonly bytesPerElement: number
}

const SHA256 = /^[a-f0-9]{64}$/u
const DEFAULT_MAXIMUM_HEADER_BYTES = 64 * 1024 * 1024
const MAXIMUM_ARTIFACT_BYTES = 64 * 1024 * 1024 * 1024
const DTYPE_BYTE_WIDTHS = Object.freeze({
  BOOL: 1,
  U8: 1,
  I8: 1,
  U16: 2,
  I16: 2,
  U32: 4,
  I32: 4,
  U64: 8,
  I64: 8,
  F8_E4M3: 1,
  F8_E5M2: 1,
  F16: 2,
  BF16: 2,
  F32: 4,
  F64: 8,
} satisfies Readonly<Record<string, number>>)

export class LivingFrameControlledSafetensorsByteInspectionError extends Error {
  readonly issues:
    readonly LivingFrameControlledSafetensorsByteInspectionIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSafetensorsByteInspectionIssue[],
  ) {
    super('Living Frame controlled safetensors byte inspection failed.')
    this.name =
      'LivingFrameControlledSafetensorsByteInspectionError'
    this.issues = issues
  }
}

export async function inspectLivingFrameControlledSafetensorsByteStream(
  input: InspectLivingFrameControlledSafetensorsByteStreamInput,
): Promise<LivingFrameControlledSafetensorsByteInspection> {
  assertInput(input)
  const maximumHeaderByteLength =
    input.maximumHeaderByteLength
    ?? DEFAULT_MAXIMUM_HEADER_BYTES
  const streamed = await streamHeaderAndDigest({
    stream: input.stream,
    expectedByteLength: input.expectedByteLength,
    expectedContentSha256: input.expectedContentSha256,
    maximumHeaderByteLength,
  })
  return inspectHeader({
    byteLength: streamed.byteLength,
    contentSha256: streamed.contentSha256,
    headerLength: streamed.headerLength,
    headerDigestSha256: streamed.headerDigestSha256,
    header: streamed.header,
    expectedMetadataValues:
      input.expectedMetadataValues ?? {},
    selectedTensorNames:
      input.selectedTensorNames ?? [],
  })
}

async function streamHeaderAndDigest(
  input: {
    readonly stream: Readable
    readonly expectedByteLength: number
    readonly expectedContentSha256: string
    readonly maximumHeaderByteLength: number
  },
): Promise<{
  readonly byteLength: number
  readonly contentSha256: string
  readonly headerLength: number
  readonly headerDigestSha256: string
  readonly header: unknown
}> {
  if (
    !input.stream
    || typeof input.stream[Symbol.asyncIterator] !== 'function'
  ) throw invalid('stream_invalid', '$.stream')
  const contentHash = createHash('sha256')
  let byteLength = 0
  let headerPrefix = Buffer.alloc(0)
  let requiredHeaderBytes: number | null = null
  try {
    for await (const rawChunk of input.stream) {
      const chunk = Buffer.isBuffer(rawChunk)
        ? rawChunk
        : Buffer.from(rawChunk as Uint8Array)
      byteLength += chunk.length
      if (byteLength > input.expectedByteLength) {
        throw invalid('byte_length_mismatch', '$.stream')
      }
      contentHash.update(chunk)
      const wantedBytes =
        requiredHeaderBytes
        ?? input.maximumHeaderByteLength + 8
      if (headerPrefix.length < wantedBytes) {
        headerPrefix = Buffer.concat([
          headerPrefix,
          chunk.subarray(
            0,
            Math.min(
              chunk.length,
              wantedBytes - headerPrefix.length,
            ),
          ),
        ])
      }
      if (
        requiredHeaderBytes === null
        && headerPrefix.length >= 8
      ) {
        const headerLengthBig = headerPrefix.readBigUInt64LE(0)
        if (
          headerLengthBig <= 1n
          || headerLengthBig
            > BigInt(input.maximumHeaderByteLength)
        ) throw invalid(
          'header_length_invalid',
          '$.safetensors.headerLength',
        )
        requiredHeaderBytes = 8 + Number(headerLengthBig)
        if (headerPrefix.length > requiredHeaderBytes) {
          headerPrefix = headerPrefix.subarray(
            0,
            requiredHeaderBytes,
          )
        }
      }
    }
  } catch (error) {
    if (
      error
      instanceof LivingFrameControlledSafetensorsByteInspectionError
    ) throw error
    throw invalid('stream_failed', '$.stream')
  }
  if (byteLength !== input.expectedByteLength) {
    throw invalid('byte_length_mismatch', '$.stream')
  }
  const contentSha256 = contentHash.digest('hex')
  if (contentSha256 !== input.expectedContentSha256) {
    throw invalid('content_digest_mismatch', '$.stream')
  }
  if (
    requiredHeaderBytes === null
    || headerPrefix.length !== requiredHeaderBytes
  ) throw invalid('prefix_invalid', '$.safetensors')
  const headerLength = requiredHeaderBytes - 8
  const headerBytes = headerPrefix.subarray(8)
  const headerDigestSha256 = digestBytes(headerBytes)
  let header: unknown
  try {
    header = JSON.parse(headerBytes.toString('utf8'))
  } catch {
    throw invalid('header_json_invalid', '$.safetensors.header')
  }
  return {
    byteLength,
    contentSha256,
    headerLength,
    headerDigestSha256,
    header,
  }
}

function inspectHeader(
  input: {
    readonly byteLength: number
    readonly contentSha256: string
    readonly headerLength: number
    readonly headerDigestSha256: string
    readonly header: unknown
    readonly expectedMetadataValues:
      Readonly<Record<string, string | number | boolean | null>>
    readonly selectedTensorNames: readonly string[]
  },
): LivingFrameControlledSafetensorsByteInspection {
  if (!isRecord(input.header)) throw invalid(
    'header_json_invalid',
    '$.safetensors.header',
  )
  const rawMetadata = input.header.__metadata__
  if (
    rawMetadata !== undefined
    && !isRecord(rawMetadata)
  ) throw invalid('metadata_invalid', '$.safetensors.__metadata__')
  const metadata = rawMetadata === undefined
    ? null
    : deepFreeze(structuredClone(rawMetadata))
  const tensorEntries = Object.entries(input.header)
    .filter(([name]) => name !== '__metadata__')
  if (tensorEntries.length === 0) throw invalid(
    'tensor_entry_invalid',
    '$.safetensors.tensors',
  )
  const tensorNames = tensorEntries.map(([name]) => name).sort()
  if (new Set(tensorNames).size !== tensorNames.length) {
    throw invalid('tensor_entry_invalid', '$.safetensors.tensors')
  }
  const tensors = tensorEntries.map(([name, value]) =>
    parseTensor(name, value))
  const orderedByOffset = [...tensors]
    .sort((left, right) => left.start - right.start)
  let expectedStart = 0
  let totalTensorByteLength = 0
  let maximumRank = 0
  for (const tensor of orderedByOffset) {
    if (tensor.start !== expectedStart) throw invalid(
      'tensor_offset_gap_or_overlap',
      '$.safetensors.tensors',
    )
    const span = tensor.end - tensor.start
    const expectedSpan = tensor.shape.reduce(
      (product, dimension) => product * dimension,
      tensor.bytesPerElement,
    )
    if (
      !Number.isSafeInteger(expectedSpan)
      || span !== expectedSpan
    ) throw invalid(
      'tensor_size_mismatch',
      '$.safetensors.tensors',
    )
    expectedStart = tensor.end
    totalTensorByteLength += span
    maximumRank = Math.max(maximumRank, tensor.shape.length)
  }
  const dataSectionByteLength =
    input.byteLength - 8 - input.headerLength
  if (
    dataSectionByteLength <= 0
    || totalTensorByteLength !== dataSectionByteLength
    || expectedStart !== dataSectionByteLength
  ) throw invalid(
    'data_section_mismatch',
    '$.safetensors.data',
  )
  const dtypeCounts = countValues(
    tensors.map((tensor) => tensor.dtype),
  ).map(([dtype, count]) => ({ dtype, count }))
  const rankCounts = countNumbers(
    tensors.map((tensor) => tensor.shape.length),
  ).map(([rank, count]) => ({ rank, count }))
  const metadataKeys = metadata
    ? Object.keys(metadata).sort()
    : []
  if (
    Object.entries(input.expectedMetadataValues)
      .some(([key, expected]) =>
        !metadata || metadata[key] !== expected)
  ) throw invalid(
    'metadata_invalid',
    '$.safetensors.__metadata__',
  )
  const namespaceCounts = countValues(
    tensors.map((tensor) => tensor.name.split('.')[0] ?? ''),
  ).map(([namespace, count]) => ({ namespace, count }))
  const tensorShapesByName = new Map(
    tensors.map((tensor) => [tensor.name, tensor.shape]),
  )
  const selectedTensorShapes =
    input.selectedTensorNames.map((name) => {
      const shape = tensorShapesByName.get(name)
      if (!shape) throw invalid(
        'tensor_entry_invalid',
        '$.safetensors.selectedTensorNames',
      )
      return { name, shape: Object.freeze([...shape]) }
    })
  return deepFreeze({
    inspectorVersion:
      LIVING_FRAME_CONTROLLED_SAFETENSORS_BYTE_INSPECTOR_VERSION,
    byteLength: input.byteLength,
    contentSha256: input.contentSha256,
    headerLength: input.headerLength,
    headerDigestSha256: input.headerDigestSha256,
    tensorNameSetDigestSha256: digest(tensorNames),
    tensorCount: tensors.length,
    dtypeCounts,
    rankCounts,
    maximumRank,
    dataSectionByteLength,
    totalTensorByteLength,
    finalDataOffset: expectedStart,
    offsetsContiguousFromZero: true,
    everyTensorSpanMatchesShapeAndDtype: true,
    tensorPayloadExactlyAccountsForDataSection: true,
    metadataPresent: metadata !== null,
    metadataKeyCount: metadataKeys.length,
    metadataKeySetDigestSha256: digest(metadataKeys),
    metadataDigestSha256: digest(metadata),
    metadataExpectationCount:
      Object.keys(input.expectedMetadataValues).length,
    expectedMetadataValuesMatched: true,
    namespaceCounts,
    namespaceCountDigestSha256: digest(namespaceCounts),
    selectedTensorShapes,
    selectedTensorShapeDigestSha256:
      digest(selectedTensorShapes.map(({ name, shape }) => [
        name,
        shape,
      ])),
    rawMetadataReturned: false,
    rawHeaderOrTensorBytesReturned: false,
    modelLoadedOrExecuted: false,
    runtimeAuthority: false,
    productionReady: false,
  })
}

function parseTensor(name: string, value: unknown): ParsedTensor {
  if (
    !isSafeHeaderKey(name)
    || !isRecord(value)
    || !hasExactKeys(value, [
      'dtype',
      'shape',
      'data_offsets',
    ])
    || typeof value.dtype !== 'string'
    || !(value.dtype in DTYPE_BYTE_WIDTHS)
    || !Array.isArray(value.shape)
    || value.shape.length > 16
    || value.shape.some((dimension) =>
      !Number.isSafeInteger(dimension)
      || (dimension as number) <= 0)
    || !Array.isArray(value.data_offsets)
    || value.data_offsets.length !== 2
  ) throw invalid(
    value && isRecord(value)
      && typeof value.dtype === 'string'
      && !(value.dtype in DTYPE_BYTE_WIDTHS)
      ? 'tensor_dtype_unsupported'
      : 'tensor_entry_invalid',
    '$.safetensors.tensors',
  )
  const [start, end] = value.data_offsets
  if (
    !Number.isSafeInteger(start)
    || !Number.isSafeInteger(end)
    || (start as number) < 0
    || (end as number) <= (start as number)
  ) throw invalid(
    'tensor_offset_invalid',
    '$.safetensors.tensors',
  )
  return {
    name,
    dtype: value.dtype,
    shape: value.shape as number[],
    start: start as number,
    end: end as number,
    bytesPerElement:
      DTYPE_BYTE_WIDTHS[
        value.dtype as keyof typeof DTYPE_BYTE_WIDTHS
      ],
  }
}

function assertInput(
  input: InspectLivingFrameControlledSafetensorsByteStreamInput,
): void {
  if (
    !isRecord(input)
    || !hasOnlyKeys(input, [
      'stream',
      'expectedByteLength',
      'expectedContentSha256',
      'maximumHeaderByteLength',
      'expectedMetadataValues',
      'selectedTensorNames',
    ])
    || !Number.isSafeInteger(input.expectedByteLength)
    || input.expectedByteLength <= 16
    || input.expectedByteLength > MAXIMUM_ARTIFACT_BYTES
    || typeof input.expectedContentSha256 !== 'string'
    || !SHA256.test(input.expectedContentSha256)
    || (
      input.maximumHeaderByteLength !== undefined
      && (
        !Number.isSafeInteger(input.maximumHeaderByteLength)
        || input.maximumHeaderByteLength <= 1
        || input.maximumHeaderByteLength
          > DEFAULT_MAXIMUM_HEADER_BYTES
      )
    )
    || (
      input.expectedMetadataValues !== undefined
      && (
        !isRecord(input.expectedMetadataValues)
        || Object.keys(input.expectedMetadataValues).length > 64
        || Object.entries(input.expectedMetadataValues)
          .some(([key, value]) =>
            !isSafeHeaderKey(key)
            || !isJsonScalar(value))
      )
    )
    || (
      input.selectedTensorNames !== undefined
      && (
        !Array.isArray(input.selectedTensorNames)
        || input.selectedTensorNames.length > 64
        || new Set(input.selectedTensorNames).size
          !== input.selectedTensorNames.length
        || input.selectedTensorNames.some(
          (name) => !isSafeHeaderKey(name),
        )
      )
    )
  ) throw invalid('stream_invalid', '$')
}

function isSafeHeaderKey(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 512
    && !containsControlCharacter(value)
}

function isJsonScalar(
  value: unknown,
): value is string | number | boolean | null {
  return value === null
    || (
      typeof value === 'string'
      && value.length <= 2_048
      && !containsControlCharacter(value)
    )
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
}

function containsControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

function countValues(
  values: readonly string[],
): readonly (readonly [string, number])[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
}

function countNumbers(
  values: readonly number[],
): readonly (readonly [number, number])[] {
  const counts = new Map<number, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left - right)
}

function invalid(
  code: LivingFrameControlledSafetensorsByteInspectionIssueCode,
  path: string,
): LivingFrameControlledSafetensorsByteInspectionError {
  return new LivingFrameControlledSafetensorsByteInspectionError([
    { code, path },
  ])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  throw invalid('metadata_invalid', '$.safetensors.__metadata__')
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): boolean {
  const allowed = new Set(allowedKeys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach(deepFreeze)
    return Object.freeze(value)
  }
  if (isRecord(value)) {
    Object.values(value).forEach(deepFreeze)
    return Object.freeze(value)
  }
  return value
}
