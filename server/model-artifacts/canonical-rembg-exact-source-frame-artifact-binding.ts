import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION,
  assertCanonicalExactSourceFramePngWorkItem,
} from '../edit-architecture/canonical-exact-source-frame-png-authority'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
} from '../tool-execution/media-binary-execution/offline-media-binary-protocol'
import {
  verifyExactSourceFrameRgbaPng,
} from '../tool-execution/media-binary-execution/exact-source-frame-png-verifier'
import {
  CANONICAL_REMBG_EXACT_SOURCE_FRAME_ARTIFACT_BINDING_VERSION,
  type CanonicalRembgExactSourceFrameArtifactBinding,
  type CanonicalRembgExactSourceFrameArtifactBindingInput,
} from './canonical-rembg-exact-source-frame-artifact-binding-types'
import {
  canonicalRembgSourceFrameExpectationInputSchema,
} from './canonical-rembg-source-frame-expectation-schema'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_SOURCE_FRAME_BYTES = 16 * 1024 * 1024

const bindingSchema = z.object({
  bindingVersion: z.literal(
    CANONICAL_REMBG_EXACT_SOURCE_FRAME_ARTIFACT_BINDING_VERSION,
  ),
  bindingClass: z.literal(
    'server_derived_qa_reread_exact_source_frame_png_binding',
  ),
  source: canonicalRembgSourceFrameExpectationInputSchema,
  verification: z.object({
    exactCanonicalExtractionWorkItemMatched: z.literal(true),
    exactCanonicalExtractionOutputMatched: z.literal(true),
    canonicalQaPassedDependencyReadContractMatched:
      z.literal(true),
    dependencyArtifactVersionMatched: z.literal(true),
    pngChunkChecksumsVerified: z.literal(true),
    pngRgbaProfileVerified: z.literal(true),
    decodedPixelDigestVerified: z.literal(true),
    opaqueSourceAlphaVerified: z.literal(true),
  }).strict(),
  boundaries: z.object({
    serverDerived: z.literal(true),
    dependencyBytesReread: z.literal(true),
    dependencyBytesRetained: z.literal(false),
    callerBytesAccepted: z.literal(false),
    callerPathsAccepted: z.literal(false),
    callerUrlsAccepted: z.literal(false),
    sourceSelectionAuthority: z.literal(false),
    workGraphAuthority: z.literal(false),
    assetManifestAuthority: z.literal(false),
    rembgInferenceAuthority: z.literal(false),
    cloudDispatchAuthority: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  bindingDigestSha256:
    z.string().regex(DIGEST_PATTERN),
}).strict()

export function createCanonicalRembgExactSourceFrameArtifactBinding(
  input: CanonicalRembgExactSourceFrameArtifactBindingInput,
): CanonicalRembgExactSourceFrameArtifactBinding {
  const payload =
    assertCanonicalExactSourceFramePngWorkItem(
      input.extractionWorkItem,
    )
  const source = input.sourceAssetBinding
  const output = input.extractionWorkItem.expectedOutputs[0]
  const dependency = input.dependencyRead
  assertSafeDependencyRead(dependency)
  if (
    source.sourceSequenceItemId
      !== payload.sourceSequenceItemId
    || source.sourceCleanupDecisionId
      !== payload.sourceCleanupDecisionId
    || source.masterFrameIndex !== payload.masterFrameIndex
    || source.sourceFrameIndex !== payload.sourceFrameIndex
    || source.frameRate !== payload.frameRate
    || source.sourceFrameSelectionDigestSha256
      !== payload.sourceFrameSelectionDigestSha256
    || source.frameSelectionPolicy
      !== 'scene_start_meaning_anchor_v1'
    || !['video/mp4', 'video/quicktime']
      .includes(source.mimeType)
    || output?.artifactType
      !== CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE
    || output.contentType !== 'image/png'
    || dependency.contentType !== 'image/png'
    || dependency.byteLength !== dependency.bytes.byteLength
    || dependency.byteLength > payload.maximumOutputBytes
    || dependency.sha256 !== sha256(dependency.bytes)
  ) {
    throw blocked(
      'rembg_exact_source_frame_artifact_lineage_mismatch',
    )
  }
  const png = verifyExactSourceFrameRgbaPng(
    Buffer.from(dependency.bytes),
    {
      maximumWidth: payload.maximumWidth,
      maximumHeight: payload.maximumHeight,
      maximumPixelCount: payload.maximumPixelCount,
    },
  )
  const exactSource = {
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    sourceCleanupDecisionId:
      source.sourceCleanupDecisionId,
    masterFrameIndex: source.masterFrameIndex,
    sourceFrameIndex: source.sourceFrameIndex,
    frameRate: source.frameRate,
    frameSelectionPolicy:
      source.frameSelectionPolicy,
    sourceFrameSelectionDigestSha256:
      source.sourceFrameSelectionDigestSha256,
    sourceMediaContentSha256: source.checksumSha256,
    sourceMediaByteLength: source.sizeBytes,
    sourceMediaContentType:
      source.mimeType as 'video/mp4' | 'video/quicktime',
    sourceBindingHash: source.sourceBindingHash,
    storageIdentityHash: source.storageIdentityHash,
    frameExtractionWorkItemKey:
      input.extractionWorkItem.workItemKey,
    frameExtractionWorkItemDigestSha256:
      sha256AuthorityValue(input.extractionWorkItem),
    frameExtractionOperation:
      CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION,
    frameExtractionRecipeProfileId:
      OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE,
    frameExtractionToolId: 'ffmpeg' as const,
    frameExtractionToolOperationId:
      OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    frameExtractionOutputKey: output.outputKey,
    frameExtractionDependencyJobId:
      dependency.dependencyJobId,
    frameExtractionExecutionAttemptId:
      dependency.sourceExecutionAttemptId,
    frameExtractionSourceLeaseImmutableHash:
      dependency.sourceLeaseImmutableHash,
    frameExtractionDependencyReadEvidenceHash:
      dependency.dependencyReadEvidenceHash,
    frameArtifactId: dependency.artifactId,
    frameArtifactAssetId: dependency.expectedAssetId,
    frameArtifactVersion: dependency.artifactVersion,
    frameArtifactType:
      CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
    frameArtifactContentType: 'image/png' as const,
    frameArtifactSha256: dependency.sha256,
    frameArtifactByteLength: dependency.byteLength,
    frameWidth: png.width,
    frameHeight: png.height,
    frameDecodedRgbaSha256: png.decodedRgbaSha256,
    frameOpaquePixelCount: png.opaquePixelCount,
  }
  const draft = {
    bindingVersion:
      CANONICAL_REMBG_EXACT_SOURCE_FRAME_ARTIFACT_BINDING_VERSION,
    bindingClass:
      'server_derived_qa_reread_exact_source_frame_png_binding' as const,
    source: exactSource,
    verification: {
      exactCanonicalExtractionWorkItemMatched: true as const,
      exactCanonicalExtractionOutputMatched: true as const,
      canonicalQaPassedDependencyReadContractMatched:
        true as const,
      dependencyArtifactVersionMatched: true as const,
      pngChunkChecksumsVerified: true as const,
      pngRgbaProfileVerified: true as const,
      decodedPixelDigestVerified: true as const,
      opaqueSourceAlphaVerified: true as const,
    },
    boundaries: {
      serverDerived: true as const,
      dependencyBytesReread: true as const,
      dependencyBytesRetained: false as const,
      callerBytesAccepted: false as const,
      callerPathsAccepted: false as const,
      callerUrlsAccepted: false as const,
      sourceSelectionAuthority: false as const,
      workGraphAuthority: false as const,
      assetManifestAuthority: false as const,
      rembgInferenceAuthority: false as const,
      cloudDispatchAuthority: false as const,
      productionAuthority: false as const,
    },
  }
  return deepFreeze(bindingSchema.parse({
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  })) as CanonicalRembgExactSourceFrameArtifactBinding
}

export function assertCanonicalRembgExactSourceFrameArtifactBinding(
  value: unknown,
): CanonicalRembgExactSourceFrameArtifactBinding {
  const parsed = bindingSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'rembg_exact_source_frame_artifact_binding_invalid',
    )
  }
  const candidate =
    parsed.data as unknown as CanonicalRembgExactSourceFrameArtifactBinding
  const {
    bindingDigestSha256,
    ...draft
  } = candidate
  if (
    bindingDigestSha256 !== sha256AuthorityValue(draft)
  ) {
    throw blocked(
      'rembg_exact_source_frame_artifact_binding_digest_mismatch',
    )
  }
  return deepFreeze(candidate)
}

function assertSafeDependencyRead(
  value:
    CanonicalRembgExactSourceFrameArtifactBindingInput[
      'dependencyRead'
    ],
): void {
  const ids = [
    value.dependencyJobId,
    value.expectedAssetId,
    value.artifactId,
    value.sourceExecutionAttemptId,
  ]
  if (
    !Buffer.isBuffer(value.bytes)
    || value.byteLength < 68
    || value.byteLength > MAXIMUM_SOURCE_FRAME_BYTES
    || !Number.isSafeInteger(value.artifactVersion)
    || value.artifactVersion < 1
    || value.artifactVersion > 10_000
    || !DIGEST_PATTERN.test(value.sha256)
    || !DIGEST_PATTERN.test(
      value.sourceLeaseImmutableHash,
    )
    || !DIGEST_PATTERN.test(
      value.dependencyReadEvidenceHash,
    )
    || ids.some(
      (entry) =>
        !SAFE_ID_PATTERN.test(entry)
        || entry.includes('..'),
    )
  ) {
    throw invalid(
      'rembg_exact_source_frame_dependency_read_invalid',
    )
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 400)
}

function blocked(code: string): ApiError {
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate:
      'canonical_rembg_exact_source_frame_artifact_binding',
  })
}
