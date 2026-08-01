import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { deflateSync } from 'node:zlib'
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readdir,
  rm,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from './living-frame-environmental-particle-sequence-observation'
import {
  decontaminateLivingFrameAlphaEdges,
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest,
} from './living-frame-alpha-edge-decontamination'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  verifyLivingFramePrivateOpaqueRgbPng,
} from './living-frame-private-opaque-rgb-png-verifier'
import {
  verifyCanonicalRembgGray8MaskPng,
} from '../model-artifacts/canonical-rembg-mask-png-verifier'
import {
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  createPrivateDockerCliInvocation,
} from '../tool-execution/private-docker-cli'
import {
  inspectExistingOfflineRembgBackgroundRemovalDockerRuntime,
} from '../tool-execution/rembg-background-removal-execution/offline-rembg-background-removal-docker-runtime'
import {
  createPrivateOfflineSharpStructuredExecutionRuntime,
} from '../tool-execution/node-runner-execution'

const WIDTH = 1024
const HEIGHT = 1024
const PIXEL_COUNT = WIDTH * HEIGHT
const SOURCE_ARTIFACT_ID =
  'lf.animation-aware-illustration.musashi.v1'
const SOURCE_SHA256 =
  '15dae1bc8cbd6549fea2b0cf389a38e5dd5b6750745650fe91b22eb398171a1e'
const SOURCE_BYTE_LENGTH = 925_492
const ORIGINAL_GENERATION_SHA256 =
  'ab33f7f7b99877ef8a28c4047fef0a08cd7c8e714d36839fda0e4434c1ffb73a'
const IMAGE_TAG =
  'reeditpro-living-frame-rembg-approved-asset-internal-test:private-local-v1'
const CONTAINER_PROTOCOL =
  'living-frame-rembg-approved-asset-internal-test-container-v1'
const REQUEST_PROTOCOL =
  'living-frame-rembg-approved-asset-internal-test-v1'
const STORAGE_ROOT =
  '/tmp/reeditpro-living-frame-animation-aware-illustration-internal-test'
const MAX_DOCKER_OUTPUT_BYTES = 16 * 1024 * 1024
const SOURCE_MATTE_RGB = [241, 238, 234] as const

interface HostResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

export interface LivingFrameAnimationAwareIllustrationPrivateAlphaInternalTestReceipt {
  readonly schemaVersion:
    'living-frame-animation-aware-illustration-private-alpha-internal-test-v1'
  readonly evidenceClass:
    'actual_private_internal_animation_aware_illustration_alpha_pipeline'
  readonly source: {
    readonly artifactId: typeof SOURCE_ARTIFACT_ID
    readonly generationRole:
      'modern_illustrative_depiction_not_archival_evidence'
    readonly animationAware: true
    readonly originalGenerationSha256: typeof ORIGINAL_GENERATION_SHA256
    readonly normalizedSourceSha256: typeof SOURCE_SHA256
    readonly byteLength: typeof SOURCE_BYTE_LENGTH
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly opaqueRgbPngVerified: true
  }
  readonly rembg: {
    readonly toolId: 'rembg'
    readonly operationId:
      'tool.rembg.remove_image_background.v1'
    readonly packageVersion: '2.0.76'
    readonly onnxRuntimeVersion: '1.27.0'
    readonly modelId: 'u2netp'
    readonly modelSha256:
      '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
    readonly actualPackageEntrypointExecuted: true
    readonly executionDevice: 'cpu'
    readonly cpuSubstituteNotCanonicalGpuEquivalent: true
    readonly imageId: string
    readonly parentRembgImageId: string
    readonly maskSha256: string
    readonly maskByteLength: number
    readonly decodedMaskSha256: string
    readonly transparentPixelCount: number
    readonly partialPixelCount: number
    readonly opaquePixelCount: number
    readonly foregroundPixelCountAtThreshold: number
  }
  readonly sharp: {
    readonly toolId: 'sharp'
    readonly operationId:
      'tool.sharp.prepare_approved_image_asset.v1'
    readonly packageVersion: '0.35.3'
    readonly actualPackageEntrypointExecuted: true
    readonly alphaPngSha256: string
    readonly alphaPngByteLength: number
    readonly transparentPixelCount: number
    readonly partialAlphaPixelCount: number
    readonly opaquePixelCount: number
  }
  readonly decontamination: {
    readonly processingProfile:
      'srgb8_known_matte_unmix_v1'
    readonly knownSourceMatteRgb:
      readonly [241, 238, 234]
    readonly reportDigestSha256: string
    readonly findingCodes: readonly string[]
    readonly changedPixelCount: number
    readonly clampedChannelCount: number
    readonly cleanedAlphaPngSha256: string
    readonly cleanedAlphaPngByteLength: number
  }
  readonly alphaMeasurement: {
    readonly preDecontaminationReportDigestSha256: string
    readonly preDecontaminationFindingCodes:
      readonly string[]
    readonly reportDigestSha256: string
    readonly findingCodes: readonly string[]
    readonly measuredRgbaDigestSha256: string
  }
  readonly privateArtifacts: {
    readonly maskObjectKey: string
    readonly alphaObjectKey: string
    readonly receiptObjectKey: string
    readonly createOnly: true
    readonly publicUrlCreated: false
  }
  readonly authorityBoundary: {
    readonly privateInternalExecutionAuthority: true
    readonly canonicalDispatchAuthority: false
    readonly canonicalAssetManifestAuthority: false
    readonly customerBillingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productAuthority: false
    readonly productionAuthority: false
  }
  readonly openGates: readonly [
    'exact_comfyui_generated_output_requires_five_model_weights_and_gpu_execution',
    'canonical_rembg_gpu_equivalence_not_claimed',
    'canonical_artifact_qa_and_asset_manifest_reconciliation_required',
    'private_destination_composite_and_motion_review_required',
  ]
  readonly receiptDigestSha256: string
}

export async function executeLivingFrameAnimationAwareIllustrationPrivateAlphaInternalTest():
Promise<LivingFrameAnimationAwareIllustrationPrivateAlphaInternalTestReceipt> {
  if (arguments.length !== 0) {
    throw new Error(
      'Animation-aware illustration internal test accepts no caller input.',
    )
  }
  const sourcePng = await readExactSourceFixture()
  verifyLivingFramePrivateOpaqueRgbPng(sourcePng, {
    widthPixels: WIDTH,
    heightPixels: HEIGHT,
    maximumOutputBytes: 2 * 1024 * 1024,
    maximumPixelCount: PIXEL_COUNT,
  })
  const parent =
    await inspectExistingOfflineRembgBackgroundRemovalDockerRuntime()
  const image = await buildInternalTestImage(parent.imageId)
  const request = {
    schemaVersion: REQUEST_PROTOCOL,
    toolId: 'rembg',
    operationId: 'tool.rembg.remove_image_background.v1',
    payload: {
      sourceArtifactId: SOURCE_ARTIFACT_ID,
      sourceSha256: SOURCE_SHA256,
      sourceByteLength: SOURCE_BYTE_LENGTH,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      sourcePngBase64: sourcePng.toString('base64'),
      sourceVariant: 'animation_aware_illustration_fixture',
      modelId: 'u2netp',
      outputMode: 'mask_only_png',
    },
  } as const
  const run = await runInternalTestContainer({
    imageId: image.imageId,
    serializedRequest: JSON.stringify(request),
  })
  if (
    run.exitCode !== 0
    || run.oomKilled
    || run.stderr.trim().length > 0
  ) {
    throw new Error(
      'Private animation-aware illustration rembg execution failed.',
    )
  }
  const wire = record(JSON.parse(run.stdout))
  const packageIdentity = record(wire.packageIdentity)
  const readiness = record(wire.readiness)
  const maskWire = record(wire.mask)
  const semantic = record(wire.semanticEvidence)
  const maskPng = decodeArtifact(maskWire)
  if (
    wire.schemaVersion !== CONTAINER_PROTOCOL
    || wire.ok !== true
    || wire.toolId !== 'rembg'
    || wire.operationId
      !== 'tool.rembg.remove_image_background.v1'
    || wire.status
      !== 'actual_rembg_approved_asset_internal_test_completed'
    || packageIdentity.packageName !== 'rembg'
    || packageIdentity.version !== '2.0.76'
    || packageIdentity.onnxRuntimeVersion !== '1.27.0'
    || readiness.privateInternalOnly !== true
    || readiness.canonicalDispatchIntegrated !== false
    || readiness.customerBillingAuthority !== false
    || readiness.publicDeliveryAuthority !== false
    || readiness.productReady !== false
    || readiness.externalBetaReady !== false
    || readiness.productionReady !== false
    || semantic.actualPackageEntrypointExecuted !== true
    || semantic.entrypoint !== 'rembg.remove'
    || semantic.cpuExecutionProviderOnly !== true
    || semantic.cpuSubstituteNotCanonicalGpuEquivalent !== true
    || semantic.serverOwnedApprovedFixtureOnly !== true
    || semantic.callerMediaAllowed !== false
    || semantic.runtimeModelDownloadAllowed !== false
  ) {
    throw new Error(
      'Private animation-aware illustration rembg evidence is invalid.',
    )
  }
  const mask = verifyCanonicalRembgGray8MaskPng(maskPng, {
    expectedWidth: WIDTH,
    expectedHeight: HEIGHT,
    maximumPixelCount: PIXEL_COUNT,
  })
  if (
    mask.minimumMaskValue !== semantic.minimumMaskValue
    || mask.maximumMaskValue !== semantic.maximumMaskValue
    || mask.uniqueMaskValueCount !== semantic.uniqueMaskValueCount
    || mask.transparentPixelCount
      !== semantic.transparentPixelCount
    || mask.partialPixelCount !== semantic.partialPixelCount
    || mask.opaquePixelCount !== semantic.opaquePixelCount
    || mask.foregroundPixelCountAtThreshold
      !== semantic.foregroundPixelCountAtThreshold
  ) {
    throw new Error(
      'Private animation-aware illustration mask evidence changed.',
    )
  }

  const sharp =
    await createPrivateOfflineSharpStructuredExecutionRuntime()
  const sharpResult = await sharp.execute({
    toolId: 'sharp',
    operationId: 'tool.sharp.prepare_approved_image_asset.v1',
    payload: {
      imageRecipeId:
        'approved_living_frame_alpha_component_v1',
      outputFormat: 'png',
      outputWidth: WIDTH,
      outputHeight: HEIGHT,
      preserveMetadata: false,
      allowUpscale: false,
      sourceMimeType: 'image/png',
      sourceByteLength: sourcePng.byteLength,
      sourceSha256: digestBytes(sourcePng),
      sourceBytesBase64: sourcePng.toString('base64'),
      maskMimeType: 'image/png',
      maskByteLength: maskPng.byteLength,
      maskSha256: digestBytes(maskPng),
      maskBytesBase64: maskPng.toString('base64'),
    },
  })
  const sharpSemantic = sharpResult.evidence.semanticEvidence
  if (
    sharpResult.evidence.packageName !== 'sharp'
    || sharpResult.evidence.packageVersion !== '0.35.3'
    || sharpSemantic.sourceMimeType !== 'image/png'
    || sharpSemantic.actualSharpOperationCompleted !== true
    || sharpSemantic.alphaDerivedFromMask !== true
    || sharpSemantic.transparentRgbCleared !== true
    || sharpSemantic.sourcePixelsUnmodified !== true
    || sharpSemantic.transparentPixelCount
      !== mask.transparentPixelCount
    || sharpSemantic.partialAlphaPixelCount
      !== mask.partialPixelCount
    || sharpSemantic.opaquePixelCount !== mask.opaquePixelCount
  ) {
    throw new Error(
      'Actual Sharp alpha-component evidence is invalid.',
    )
  }
  const decodedAlpha =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      sharpResult.imageArtifact.bytes,
    )
  if (
    decodedAlpha.width !== WIDTH
    || decodedAlpha.height !== HEIGHT
  ) {
    throw new Error('Sharp alpha-component dimensions changed.')
  }
  const preDecontaminationAlphaReport =
    measureLivingFrameAlphaArtifact({
      artifactId: 'lf.animation-aware-illustration.alpha.pre.v1',
      artifactDigestSha256: sharpResult.imageArtifact.sha256,
      width: WIDTH,
      height: HEIGHT,
      rgbaBytes: decodedAlpha.rgba,
      alphaMode: 'straight_alpha',
      alphaExpectation: 'alpha_required',
      knownSourceMatteRgb: SOURCE_MATTE_RGB,
    })
  const decontaminated = decontaminateLivingFrameAlphaEdges({
    artifactId: 'lf.animation-aware-illustration.alpha.pre.v1',
    artifactDigestSha256: sharpResult.imageArtifact.sha256,
    width: WIDTH,
    height: HEIGHT,
    rgbaBytes: decodedAlpha.rgba,
    inputAlphaMode:
      'straight_alpha_with_known_matte_contamination',
    knownSourceMatteRgb: SOURCE_MATTE_RGB,
  })
  if (
    !verifyLivingFrameAlphaEdgeDecontaminationReportDigest(
      decontaminated.report,
    )
    || decontaminated.report.metrics.changedPixelCount < 1
    || decontaminated.report.outputArtifact
      .measuredOutputRgbaDigestSha256
      !== digestBytes(decontaminated.outputRgbaBytes)
  ) {
    throw new Error(
      'Animation-aware illustration edge decontamination failed.',
    )
  }
  const cleanedAlphaPng = encodeRgbaPng(
    WIDTH,
    HEIGHT,
    decontaminated.outputRgbaBytes,
  )
  const decodedCleaned =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      cleanedAlphaPng,
    )
  if (
    !decodedCleaned.rgba.equals(
      Buffer.from(decontaminated.outputRgbaBytes),
    )
  ) {
    throw new Error(
      'Decontaminated alpha PNG did not preserve exact RGBA bytes.',
    )
  }
  const alphaReport = measureLivingFrameAlphaArtifact({
    artifactId: 'lf.animation-aware-illustration.alpha.v1',
    artifactDigestSha256: digestBytes(cleanedAlphaPng),
    width: WIDTH,
    height: HEIGHT,
    rgbaBytes: decodedCleaned.rgba,
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
    knownSourceMatteRgb: SOURCE_MATTE_RGB,
  })
  if (
    !verifyLivingFrameAlphaMeasurementReportDigest(alphaReport)
    || alphaReport.artifactIdentity.measuredRgbaDigestSha256
      !== digestBytes(decodedCleaned.rgba)
    || !alphaReport.findingCodes.includes(
      'alpha_channel_variation_present',
    )
  ) {
    throw new Error(
      'Animation-aware illustration alpha measurement failed.',
    )
  }
  const maskObjectKey =
    `objects/${digestBytes(maskPng).slice(0, 2)}/${digestBytes(maskPng)}.mask.png`
  const alphaObjectKey =
    `objects/${digestBytes(cleanedAlphaPng).slice(0, 2)}/${digestBytes(cleanedAlphaPng)}.alpha-decontaminated.png`
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: maskObjectKey,
    content: maskPng,
  })
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: alphaObjectKey,
    content: cleanedAlphaPng,
  })
  const receiptObjectKey =
    `receipts/${digestBytes(cleanedAlphaPng).slice(0, 2)}/${digestBytes(cleanedAlphaPng)}.json`
  const draft:
    Omit<
      LivingFrameAnimationAwareIllustrationPrivateAlphaInternalTestReceipt,
      'receiptDigestSha256'
    > = {
    schemaVersion:
      'living-frame-animation-aware-illustration-private-alpha-internal-test-v1' as const,
    evidenceClass:
      'actual_private_internal_animation_aware_illustration_alpha_pipeline' as const,
    source: {
      artifactId: SOURCE_ARTIFACT_ID,
      generationRole:
        'modern_illustrative_depiction_not_archival_evidence' as const,
      animationAware: true as const,
      originalGenerationSha256: ORIGINAL_GENERATION_SHA256,
      normalizedSourceSha256: SOURCE_SHA256,
      byteLength: SOURCE_BYTE_LENGTH,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      opaqueRgbPngVerified: true as const,
    },
    rembg: {
      toolId: 'rembg' as const,
      operationId:
        'tool.rembg.remove_image_background.v1' as const,
      packageVersion: '2.0.76' as const,
      onnxRuntimeVersion: '1.27.0' as const,
      modelId: 'u2netp' as const,
      modelSha256:
        '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' as const,
      actualPackageEntrypointExecuted: true as const,
      executionDevice: 'cpu' as const,
      cpuSubstituteNotCanonicalGpuEquivalent: true as const,
      imageId: image.imageId,
      parentRembgImageId: parent.imageId,
      maskSha256: digestBytes(maskPng),
      maskByteLength: maskPng.byteLength,
      decodedMaskSha256: mask.decodedMaskSha256,
      transparentPixelCount: mask.transparentPixelCount,
      partialPixelCount: mask.partialPixelCount,
      opaquePixelCount: mask.opaquePixelCount,
      foregroundPixelCountAtThreshold:
        mask.foregroundPixelCountAtThreshold,
    },
    sharp: {
      toolId: 'sharp' as const,
      operationId:
        'tool.sharp.prepare_approved_image_asset.v1' as const,
      packageVersion: '0.35.3' as const,
      actualPackageEntrypointExecuted: true as const,
      alphaPngSha256: sharpResult.imageArtifact.sha256,
      alphaPngByteLength: sharpResult.imageArtifact.byteLength,
      transparentPixelCount:
        sharpSemantic.transparentPixelCount,
      partialAlphaPixelCount:
        sharpSemantic.partialAlphaPixelCount,
      opaquePixelCount: sharpSemantic.opaquePixelCount,
    },
    decontamination: {
      processingProfile:
        'srgb8_known_matte_unmix_v1' as const,
      knownSourceMatteRgb: SOURCE_MATTE_RGB,
      reportDigestSha256:
        decontaminated.report.reportDigestSha256,
      findingCodes: [...decontaminated.report.findingCodes],
      changedPixelCount:
        decontaminated.report.metrics.changedPixelCount,
      clampedChannelCount:
        decontaminated.report.metrics.clampedChannelCount,
      cleanedAlphaPngSha256: digestBytes(cleanedAlphaPng),
      cleanedAlphaPngByteLength: cleanedAlphaPng.byteLength,
    },
    alphaMeasurement: {
      preDecontaminationReportDigestSha256:
        preDecontaminationAlphaReport.reportDigestSha256,
      preDecontaminationFindingCodes:
        [...preDecontaminationAlphaReport.findingCodes],
      reportDigestSha256: alphaReport.reportDigestSha256,
      findingCodes: [...alphaReport.findingCodes],
      measuredRgbaDigestSha256:
        alphaReport.artifactIdentity.measuredRgbaDigestSha256,
    },
    privateArtifacts: {
      maskObjectKey,
      alphaObjectKey,
      receiptObjectKey,
      createOnly: true as const,
      publicUrlCreated: false as const,
    },
    authorityBoundary: {
      privateInternalExecutionAuthority: true as const,
      canonicalDispatchAuthority: false as const,
      canonicalAssetManifestAuthority: false as const,
      customerBillingAuthority: false as const,
      publicDeliveryAuthority: false as const,
      productAuthority: false as const,
      productionAuthority: false as const,
    },
    openGates: [
      'exact_comfyui_generated_output_requires_five_model_weights_and_gpu_execution',
      'canonical_rembg_gpu_equivalence_not_claimed',
      'canonical_artifact_qa_and_asset_manifest_reconciliation_required',
      'private_destination_composite_and_motion_review_required',
    ] as const,
  }
  const receipt:
    LivingFrameAnimationAwareIllustrationPrivateAlphaInternalTestReceipt = {
      ...draft,
      receiptDigestSha256: sha256AuthorityValue(draft),
    }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: receiptObjectKey,
    content: `${stableAuthorityStringify(receipt)}\n`,
  })
  return receipt
}

async function readExactSourceFixture(): Promise<Buffer> {
  const path = join(
    repositoryRoot(),
    'server/smoke/fixtures/assets/living-frame-musashi-animation-aware-illustration-v1.png',
  )
  const handle = await open(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const stat = await handle.stat()
    if (
      !stat.isFile()
      || stat.size !== SOURCE_BYTE_LENGTH
    ) {
      throw new Error('Animation-aware illustration fixture changed.')
    }
    const bytes = await handle.readFile()
    if (digestBytes(bytes) !== SOURCE_SHA256) {
      throw new Error('Animation-aware illustration digest changed.')
    }
    return bytes
  } finally {
    await handle.close()
  }
}

async function buildInternalTestImage(parentImageId: string): Promise<{
  readonly imageId: string
}> {
  const source = join(
    repositoryRoot(),
    'docker/prod/living-frame-rembg-approved-asset-internal-test',
  )
  const context = await mkdtemp(join(
    tmpdir(),
    'reeditpro-lf-rembg-approved-asset-',
  ))
  try {
    const target = join(
      context,
      'docker/prod/living-frame-rembg-approved-asset-internal-test',
    )
    await copyCleanTree(source, target)
    const built = await runDocker([
      'build',
      '--pull=false',
      '--progress=plain',
      '--tag',
      IMAGE_TAG,
      '--build-arg',
      'BASE_IMAGE=reeditpro-offline-rembg-background-removal-execution:private-local-v1',
      '--label',
      `com.reeditpro.parent.image.id=${parentImageId}`,
      '--file',
      'docker/prod/living-frame-rembg-approved-asset-internal-test/Dockerfile',
      '.',
    ], {
      cwd: context,
      timeoutMs: 10 * 60_000,
      maxBytes: 32 * 1024 * 1024,
    })
    if (built.exitCode !== 0) {
      throw new Error('Living Frame internal rembg image build failed.')
    }
  } finally {
    await rm(context, { recursive: true, force: true })
      .catch(() => undefined)
  }
  const inspected = await runDocker([
    'image',
    'inspect',
    IMAGE_TAG,
  ], {
    timeoutMs: 120_000,
    maxBytes: 8 * 1024 * 1024,
  })
  if (inspected.exitCode !== 0 || inspected.stderr.trim()) {
    throw new Error(
      'Living Frame internal rembg image inspection failed.',
    )
  }
  const values = JSON.parse(inspected.stdout) as unknown
  if (!Array.isArray(values) || values.length !== 1) {
    throw new Error(
      'Living Frame internal rembg image identity is invalid.',
    )
  }
  const image = record(values[0])
  const config = record(image.Config)
  const labels = stringRecord(config.Labels)
  const entrypoint = stringArray(config.Entrypoint)
  if (
    image.Os !== 'linux'
    || image.Architecture !== 'arm64'
    || typeof image.Id !== 'string'
    || config.User !== '10001:10001'
    || entrypoint.join('|')
      !== 'python|-s|/app/living_frame_approved_asset_runner.py'
    || labels['com.reeditpro.parent.image.id'] !== parentImageId
    || labels['com.reeditpro.runner.protocol']
      !== CONTAINER_PROTOCOL
    || labels['com.reeditpro.runner.private-internal-only']
      !== 'true'
    || labels['com.reeditpro.runner.canonical-dispatch-authority']
      !== 'false'
    || labels['com.reeditpro.runner.customer-billing-authority']
      !== 'false'
    || labels['com.reeditpro.runner.public-delivery-authority']
      !== 'false'
    || labels['com.reeditpro.runner.production-ready'] !== 'false'
  ) {
    throw new Error(
      'Living Frame internal rembg image boundary is invalid.',
    )
  }
  return { imageId: image.Id }
}

async function runInternalTestContainer(input: {
  readonly imageId: string
  readonly serializedRequest: string
}): Promise<HostResult & {
  readonly oomKilled: boolean
}> {
  const created = await runDocker([
    'create',
    '--interactive',
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    '--pids-limit',
    '128',
    '--memory',
    '2g',
    '--memory-swap',
    '2g',
    '--cpus',
    '2',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=268435456',
    '--user',
    '10001:10001',
    input.imageId,
  ], {
    timeoutMs: 120_000,
    maxBytes: 64 * 1024,
  })
  if (created.exitCode !== 0 || created.stderr.trim()) {
    throw new Error(
      'Living Frame internal rembg container creation failed.',
    )
  }
  const id = created.stdout.trim()
  if (!/^[a-f0-9]{64}$/u.test(id)) {
    throw new Error('Docker returned an invalid container ID.')
  }
  try {
    const before = await inspectContainer(id)
    assertConfinement(before, input.imageId)
    const started = await runDocker([
      'start',
      '--attach',
      '--interactive',
      id,
    ], {
      input: `${input.serializedRequest}\n`,
      timeoutMs: 5 * 60_000,
      maxBytes: MAX_DOCKER_OUTPUT_BYTES,
    })
    const after = await inspectContainer(id)
    const state = record(after.State)
    if (
      state.Status !== 'exited'
      || state.Running !== false
      || state.ExitCode !== started.exitCode
      || typeof state.OOMKilled !== 'boolean'
    ) {
      throw new Error(
        'Living Frame internal rembg exit state is invalid.',
      )
    }
    return { ...started, oomKilled: state.OOMKilled }
  } finally {
    await runDocker(['rm', '--force', id], {
      timeoutMs: 120_000,
      maxBytes: 64 * 1024,
    }).catch(() => undefined)
  }
}

function assertConfinement(
  inspect: Record<string, unknown>,
  imageId: string,
): void {
  const host = record(inspect.HostConfig)
  const config = record(inspect.Config)
  const caps = stringArray(host.CapDrop)
  const security = stringArray(host.SecurityOpt)
  const tmpfs = stringRecord(host.Tmpfs)
  const tmpTokens = new Set(String(tmpfs['/tmp'] ?? '').split(','))
  const mounts = array(inspect.Mounts)
  const binds = host.Binds == null ? [] : array(host.Binds)
  const command = config.Cmd == null ? [] : array(config.Cmd)
  const envNames = stringArray(config.Env)
    .map((value) => value.split('=', 1)[0] ?? '')
  if (
    inspect.Image !== imageId
    || host.NetworkMode !== 'none'
    || host.ReadonlyRootfs !== true
    || host.Privileged !== false
    || caps.length !== 1
    || caps[0] !== 'ALL'
    || !security.some((value) =>
      value.startsWith('no-new-privileges'))
    || Number(host.PidsLimit) !== 128
    || Number(host.Memory) !== 2_147_483_648
    || Number(host.MemorySwap) !== 2_147_483_648
    || Number(host.NanoCpus) !== 2_000_000_000
    || config.User !== '10001:10001'
    || command.length !== 0
    || mounts.length !== 0
    || binds.length !== 0
    || !tmpTokens.has('rw')
    || !tmpTokens.has('noexec')
    || !tmpTokens.has('nosuid')
    || !tmpTokens.has('nodev')
    || !tmpTokens.has('size=268435456')
    || envNames.some((name) =>
      /(?:TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/iu
        .test(name))
  ) {
    throw new Error(
      'Living Frame internal rembg confinement is invalid.',
    )
  }
}

async function inspectContainer(
  id: string,
): Promise<Record<string, unknown>> {
  const result = await runDocker(['inspect', id], {
    timeoutMs: 120_000,
    maxBytes: 8 * 1024 * 1024,
  })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw new Error('Docker container inspection failed.')
  }
  const value = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(value) || value.length !== 1) {
    throw new Error('Docker container inspection is invalid.')
  }
  return record(value[0])
}

async function copyCleanTree(
  source: string,
  target: string,
): Promise<void> {
  const stat = await lstat(source)
  if (stat.isSymbolicLink()) {
    throw new Error('Docker test source cannot contain symlinks.')
  }
  if (stat.isDirectory()) {
    await mkdir(target, { recursive: true, mode: 0o700 })
    for (
      const entry of (await readdir(
        source,
        { withFileTypes: true },
      )).sort((left, right) =>
        left.name.localeCompare(right.name))
    ) {
      if (
        entry.name === '.DS_Store'
        || entry.name.startsWith('._')
        || entry.name === '__pycache__'
      ) continue
      await copyCleanTree(
        join(source, entry.name),
        join(target, entry.name),
      )
    }
    return
  }
  if (!stat.isFile() || stat.size > 256 * 1024) {
    throw new Error('Docker test source is outside bounds.')
  }
  await mkdir(dirname(target), { recursive: true, mode: 0o700 })
  await copyFile(source, target, constants.COPYFILE_EXCL)
}

function runDocker(
  args: readonly string[],
  options: {
    readonly cwd?: string
    readonly input?: string
    readonly timeoutMs: number
    readonly maxBytes: number
  },
): Promise<HostResult> {
  return new Promise((resolvePromise, reject) => {
    const invocation = createPrivateDockerCliInvocation(args)
    const child = spawn(invocation.executable, invocation.args, {
      cwd: options.cwd,
      env: invocation.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let totalBytes = 0
    let settled = false
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      if (!settled) {
        settled = true
        reject(new Error('Docker command timed out.'))
      }
    }, options.timeoutMs)
    const collect = (target: Buffer[]) => (chunk: Buffer) => {
      totalBytes += chunk.byteLength
      if (totalBytes > options.maxBytes) {
        child.kill('SIGKILL')
        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(new Error('Docker output exceeded its ceiling.'))
        }
        return
      }
      target.push(Buffer.from(chunk))
    }
    child.stdout.on('data', collect(stdout))
    child.stderr.on('data', collect(stderr))
    child.on('error', (cause) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(cause)
      }
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolvePromise({
        exitCode: code ?? -1,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
      })
    })
    child.stdin.on('error', (cause) => {
      if (
        !settled
        && (!cause || typeof cause !== 'object'
          || !('code' in cause)
          || !['EPIPE', 'ERR_STREAM_DESTROYED']
            .includes(String(cause.code)))
      ) {
        child.kill('SIGKILL')
        settled = true
        clearTimeout(timer)
        reject(cause)
      }
    })
    child.stdin.end(options.input ?? '')
  })
}

function decodeArtifact(
  value: Record<string, unknown>,
): Buffer {
  if (
    value.mimeType !== 'image/png'
    || value.encodingProfile !== 'gray8_mask_png_v1'
    || typeof value.bytesBase64 !== 'string'
    || typeof value.sha256 !== 'string'
    || !Number.isSafeInteger(value.byteLength)
  ) {
    throw new Error('Private rembg mask artifact is invalid.')
  }
  const bytes = Buffer.from(value.bytesBase64, 'base64')
  if (
    bytes.toString('base64') !== value.bytesBase64
    || bytes.byteLength !== value.byteLength
    || digestBytes(bytes) !== value.sha256
  ) {
    throw new Error('Private rembg mask byte commitment failed.')
  }
  return bytes
}

function repositoryRoot(): string {
  return fileURLToPath(new URL('../../', import.meta.url))
    .replace(/[\\/]$/u, '')
}

function digestBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function encodeRgbaPng(
  width: number,
  height: number,
  rgba: Uint8Array,
): Buffer {
  if (
    rgba.byteLength !== width * height * 4
    || width < 1
    || height < 1
  ) {
    throw new Error('RGBA PNG input is invalid.')
  }
  const scanlines = Buffer.alloc(height * (width * 4 + 1))
  for (let row = 0; row < height; row += 1) {
    const target = row * (width * 4 + 1)
    scanlines[target] = 0
    Buffer.from(
      rgba.buffer,
      rgba.byteOffset + row * width * 4,
      width * 4,
    ).copy(scanlines, target + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(data.byteLength + 12)
  chunk.writeUInt32BE(data.byteLength, 0)
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(
    pngCrc32(Buffer.concat([typeBytes, data])),
    data.byteLength + 8,
  )
  return chunk
}

const PNG_CRC32_TABLE = Uint32Array.from(
  { length: 256 },
  (_, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1
    }
    return value >>> 0
  },
)

function pngCrc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value =
      PNG_CRC32_TABLE[(value ^ byte) & 0xff]!
      ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a record.')
  }
  return value as Record<string, unknown>
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Expected an array.')
  return value
}

function stringArray(value: unknown): string[] {
  const values = array(value)
  if (values.some((value) => typeof value !== 'string')) {
    throw new Error('Expected a string array.')
  }
  return values as string[]
}

function stringRecord(value: unknown): Record<string, string> {
  const values = record(value)
  if (Object.values(values).some((value) =>
    typeof value !== 'string')) {
    throw new Error('Expected a string record.')
  }
  return values as Record<string, string>
}
