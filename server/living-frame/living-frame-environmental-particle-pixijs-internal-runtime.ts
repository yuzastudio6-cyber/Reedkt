import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_CLASS,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_OPEN_GATES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_STATE,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_VERSION,
  type LivingFrameEnvironmentalParticlePixiJsInternalConfinementEvidence,
  type LivingFrameEnvironmentalParticlePixiJsInternalFrameMeasurement,
  type LivingFrameEnvironmentalParticlePixiJsInternalImageEvidence,
  type LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport,
  type LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReportDraft,
} from '../../src/types/living-frame-environmental-particle-pixijs-internal-runtime'
import type {
  LivingFrameEnvironmentalParticleKernelCandidate,
} from '../../src/types/living-frame-environmental-particle-kernel'
import type {
  LivingFrameEnvironmentalParticleOperationMaterialization,
  LivingFrameEnvironmentalParticlePrivatePixiJsRequest,
  LivingFrameEnvironmentalParticlePrivateRequestLease,
} from '../../src/types/living-frame-environmental-particle-operation-materialization'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  inspectExistingOfflineBrowserGraphicsDockerRuntime,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-docker-runtime'
import type {
  OfflineBrowserGraphicsImageEvidence,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-types'
import {
  createPrivateDockerCliInvocation,
} from '../tool-execution/private-docker-cli'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  type CompileLivingFrameEnvironmentalParticleKernelInput,
  verifyLivingFrameEnvironmentalParticleKernel,
} from './living-frame-environmental-particle-kernel'
import {
  consumeLivingFrameEnvironmentalParticlePrivateRequestLease,
  verifyLivingFrameEnvironmentalParticleOperationMaterialization,
} from './living-frame-environmental-particle-operation-materialization'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
  measureLivingFrameEnvironmentalParticleAlphaWeightedCentroid,
} from './living-frame-environmental-particle-sequence-observation'

const IMAGE_TAG =
  'reeditpro-living-frame-environmental-particle-pixijs-qualification:private-local-v1' as const
const ENTRYPOINT = [
  'node',
  '/app/living-frame-environmental-particle-runner.mjs',
] as const
const REQUEST_VERSION =
  'living-frame-environmental-particle-pixijs-internal-request-v1' as const
const CONTAINER_VERSION =
  'living-frame-environmental-particle-pixijs-internal-container-v1' as const
const OPERATION =
  'tool.pixijs.render_living_frame_environmental_particles.v1' as const
const SOURCE_FILES = [
  'Dockerfile.template',
  'browser-operation.ts',
  'build-bundle.mjs',
  'runner.mjs',
] as const
const TIMEOUT_MS = 5 * 60_000
const MAXIMUM_REQUEST_BYTES = 16 * 1024 * 1024
const MAXIMUM_OUTPUT_BYTES = 256 * 1024 * 1024
const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

interface HostResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

interface DockerInspect {
  readonly Image?: unknown
  readonly State?: unknown
  readonly HostConfig?: unknown
  readonly Mounts?: unknown
  readonly Config?: unknown
  readonly RootFS?: unknown
  readonly Id?: unknown
  readonly Os?: unknown
  readonly Architecture?: unknown
}

interface RuntimeRequestDraft {
  readonly schemaVersion: typeof REQUEST_VERSION
  readonly requestClass:
    'server_derived_private_internal_particle_runtime_request'
  readonly toolId: 'pixijs'
  readonly operationId: typeof OPERATION
  readonly renderCanvas: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly backgroundMode: 'transparent'
    readonly alphaMode: 'straight_alpha_png'
    readonly finalVideoCanvas: false
  }
  readonly approvedAppearance: {
    readonly colorHex: string
    readonly blendMode: 'normal' | 'screen' | 'multiply'
  }
  readonly frameSamples: readonly {
    readonly order: number
    readonly absoluteFrame: number
    readonly particles: readonly {
      readonly order: number
      readonly xNormalized: number
      readonly yNormalized: number
      readonly radiusNormalized: number
      readonly opacity: number
    }[]
  }[]
  readonly policy: {
    readonly serverOwnedTemplateId:
      'living_frame_environmental_particles_v1'
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
    readonly oneRequestOneAttempt: true
    readonly networkAllowed: false
    readonly callerCodeAllowed: false
    readonly callerAssetsAllowed: false
    readonly arbitrarySaveOrPreviewAllowed: false
    readonly logicalBundleCount: 1
    readonly frameImageContentType: 'image/png'
    readonly remotionOwnsFinalComposition: true
    readonly operationRegistered: false
    readonly dispatchAuthority: false
    readonly artifactAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly productionReady: false
  }
}

interface RuntimeRequest extends RuntimeRequestDraft {
  readonly requestDigestSha256: string
}

interface RuntimeFrameOutput {
  readonly order: number
  readonly absoluteFrame: number
  readonly bytesBase64: string
  readonly byteLength: number
  readonly sha256: string
  readonly nonTransparentPixelCount: number
}

interface RuntimeResponse {
  readonly schemaVersion: typeof CONTAINER_VERSION
  readonly ok: true
  readonly status:
    'actual_private_internal_pixijs_particle_sequence_completed'
  readonly toolId: 'pixijs'
  readonly operationId: typeof OPERATION
  readonly requestDigestSha256: string
  readonly packageIdentity: {
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
  }
  readonly renderIdentity: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly frameImageCount: number
    readonly logicalBundleCount: 1
    readonly frameImageContentType: 'image/png'
    readonly alphaMode: 'straight_alpha'
    readonly finalVideoCanvas: false
  }
  readonly frames: readonly RuntimeFrameOutput[]
  readonly semanticEvidence: {
    readonly actualPackageEntrypointExecuted: true
    readonly entrypoint: 'Application.init'
    readonly stageRendered: true
    readonly transparentCanvasRequested: true
    readonly exactFrameDimensionsVerified: true
    readonly rgbaColorTypeVerified: true
    readonly firstFrameFullyTransparent: true
    readonly lastFrameFullyTransparent: true
    readonly activeFrameAlphaVerified: true
    readonly activeFrameCount: number
    readonly uniqueFrameDigestCount: number
    readonly zeroNetworkVerified: true
    readonly oneRequestOneAttemptVerified: true
    readonly privatePngSequenceProduced: true
  }
  readonly networkRequestCount: 0
  readonly readiness: {
    readonly privateInternalQualificationOnly: true
    readonly operationRegistered: false
    readonly canonicalDispatchIntegrated: false
    readonly artifactPersisted: false
    readonly qaApproved: false
    readonly productReady: false
    readonly externalBetaReady: false
    readonly productionReady: false
  }
}

export interface ExecuteLivingFrameEnvironmentalParticlePixiJsInternalRuntimeInput {
  readonly qualificationId: string
  readonly materialization:
    LivingFrameEnvironmentalParticleOperationMaterialization
  readonly privateRequestLease:
    LivingFrameEnvironmentalParticlePrivateRequestLease
  readonly kernelCandidate:
    LivingFrameEnvironmentalParticleKernelCandidate
  readonly kernelInput:
    CompileLivingFrameEnvironmentalParticleKernelInput
}

export async function executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime(
  input:
    ExecuteLivingFrameEnvironmentalParticlePixiJsInternalRuntimeInput,
): Promise<LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport> {
  assertInput(input)
  if (
    !verifyLivingFrameEnvironmentalParticleOperationMaterialization(
      input.materialization,
    )
  ) throw validationFailure('Living Frame particle materialization is invalid.')
  if (
    !await verifyLivingFrameEnvironmentalParticleKernel(
      input.kernelCandidate,
      input.kernelInput,
    )
  ) throw validationFailure('Living Frame particle kernel is invalid.')
  assertLineage(input)

  const privateRequest =
    consumeLivingFrameEnvironmentalParticlePrivateRequestLease(
      input.privateRequestLease,
    )
  assertPrivateRequestLineage(input, privateRequest)
  const runtimeRequest = compileRuntimeRequest(privateRequest)
  const serializedRequest =
    stableAuthorityStringify(runtimeRequest)
  if (
    Buffer.byteLength(serializedRequest, 'utf8') >
      MAXIMUM_REQUEST_BYTES
  ) throw validationFailure('Living Frame PixiJS runtime request exceeds its ceiling.')

  const image =
    await prepareLivingFrameEnvironmentalParticlePixiJsInternalImage()
  const execution = await runQualificationContainer({
    image,
    serializedRequest,
  })
  if (
    execution.exitCode !== 0
    || execution.oomKilled
    || execution.stderr.trim()
  ) throw runtimeFailure('Living Frame PixiJS qualification container failed.')
  const response = validateRuntimeResponse(
    JSON.parse(execution.stdout) as unknown,
    runtimeRequest,
  )
  const frameMeasurements = measureFrames(
    input,
    response.frames,
  )
  const aggregate = compileAggregate(frameMeasurements)
  const draft:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReportDraft = {
      contractVersion:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_VERSION,
      resultClass:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_CLASS,
      runtimeState:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_STATE,
      qualificationId: input.qualificationId,
      sourceBindings: {
        materializationDigestSha256:
          input.materialization.materializationDigestSha256,
        privateRequestDigestSha256:
          input.materialization.requestReceipt
            .privateRequestDigestSha256,
        kernelCandidateDigestSha256:
          input.kernelCandidate.kernelCandidateDigestSha256,
        deterministicStateSequenceDigestSha256:
          input.kernelCandidate.deterministicStateSequence
            .sequenceDigestSha256,
        confirmedOutputFrameDigestSha256:
          input.kernelCandidate.sourceBindings
            .confirmedOutputFrameDigestSha256,
        masterTimingDigestSha256:
          input.kernelCandidate.sourceBindings
            .masterTimingDigestSha256,
        runtimeRequestDigestSha256:
          runtimeRequest.requestDigestSha256,
      },
      runtimeIdentity: {
        toolId: 'pixijs',
        operationId: OPERATION,
        packageName: 'pixi.js',
        packageVersion: '8.19.0',
        packageEntrypoint: 'Application.init',
        actualPackageEntrypointExecuted: true,
        fixedSupervisedEntrypointExecuted: true,
        oneRequestOneAttemptVerified: true,
        zeroNetworkVerified: true,
        containerExitCode: 0,
        oomKilled: false,
      },
      imageEvidence: image,
      confinementEvidence: execution.confinement,
      sequenceIdentity: {
        widthPixels:
          privateRequest.renderCanvas.widthPixels,
        heightPixels:
          privateRequest.renderCanvas.heightPixels,
        fps: privateRequest.renderCanvas.fps,
        startFrame:
          privateRequest.renderCanvas.startFrame,
        endFrameExclusive:
          privateRequest.renderCanvas.endFrameExclusive,
        frameImageCount: frameMeasurements.length,
        logicalBundleCount: 1,
        frameImageContentType: 'image/png',
        alphaMode: 'straight_alpha',
        finalVideoCanvas: false,
      },
      frameMeasurements,
      aggregateMeasurement: aggregate,
      authorityBoundary: {
        privateInternalRuntimeQualificationAuthority: true,
        selectedSceneAuthority: false,
        timingAuthority: false,
        operationRegistryAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        artifactAuthority: false,
        assetManifestAuthority: false,
        rendererAuthority: false,
        qaApprovalAuthority: false,
        privateReviewAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_OPEN_GATES,
      containsRawPngBytes: false,
      containsDecodedRgbaBytes: false,
      containsCallerSuppliedPathUrlCredentialCommandOrEnvironment:
        false,
      selectedSceneBound: false,
      canonicalTimingBound: false,
      operationRegistered: false,
      canonicalDispatchIntegrated: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      rendererMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      internalTestReady: true,
      externalBetaReady: false,
      productionReady: false,
    }
  const report = Object.freeze({
    ...draft,
    reportDigestSha256: sha256AuthorityValue(draft),
  })
  return report
}

export async function prepareLivingFrameEnvironmentalParticlePixiJsInternalImage(): Promise<LivingFrameEnvironmentalParticlePixiJsInternalImageEvidence> {
  const base =
    await inspectExistingOfflineBrowserGraphicsDockerRuntime()
  const sourceDigestSha256 = await sourceDigest()
  try {
    return await inspectQualificationImage({
      base,
      sourceDigestSha256,
    })
  } catch {
    // The fixed local tag is rebuilt only when its immutable evidence differs.
  }
  const buildContext =
    await mkdtemp(join(
      tmpdir(),
      'reeditpro-lf-pixijs-qualification-',
    ))
  try {
    const relative =
      'docker/qualification/living-frame-environmental-particle-pixijs'
    const target = join(buildContext, relative)
    await mkdir(target, { recursive: true, mode: 0o700 })
    for (const file of SOURCE_FILES) {
      if (file === 'Dockerfile.template') continue
      await copyBoundedFile(
        join(sourceDirectory(), file),
        join(target, file),
      )
    }
    const template = await readBoundedText(
      join(sourceDirectory(), 'Dockerfile.template'),
      64 * 1024,
    )
    const dockerfile = template
      .replaceAll('__BASE_IMAGE_ID__', base.imageTag)
      .replaceAll(
        '__BASE_IDENTITY_HASH__',
        base.imageIdentityHash,
      )
      .replaceAll(
        '__SOURCE_DIGEST__',
        sourceDigestSha256,
      )
    if (dockerfile.includes('__')) {
      throw runtimeFailure('Living Frame PixiJS qualification Dockerfile contains an unresolved token.')
    }
    await writeFile(
      join(target, 'Dockerfile'),
      dockerfile,
      {
        encoding: 'utf8',
        mode: 0o600,
        flag: 'wx',
      },
    )
    const built = await runDocker([
      'build',
      '--pull=false',
      '--progress=plain',
      '--tag',
      IMAGE_TAG,
      '--file',
      `${relative}/Dockerfile`,
      '.',
    ], {
      cwd: buildContext,
      timeoutMs: 20 * 60_000,
      maxBytes: 32 * 1024 * 1024,
    })
    if (built.exitCode !== 0) {
      throw runtimeFailure(
        `Living Frame PixiJS qualification image build failed: ${
          `${built.stderr}\n${built.stdout}`.trim().slice(-4_000)
        }`,
      )
    }
    return await inspectQualificationImage({
      base,
      sourceDigestSha256,
    })
  } finally {
    await rm(buildContext, {
      recursive: true,
      force: true,
    }).catch(() => undefined)
  }
}

async function inspectQualificationImage(input: {
  readonly base: OfflineBrowserGraphicsImageEvidence
  readonly sourceDigestSha256: string
}): Promise<LivingFrameEnvironmentalParticlePixiJsInternalImageEvidence> {
  const result = await runDocker([
    'image',
    'inspect',
    IMAGE_TAG,
  ], {
    timeoutMs: TIMEOUT_MS,
    maxBytes: 8 * 1024 * 1024,
  })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw runtimeFailure('Living Frame PixiJS qualification image is unavailable.')
  }
  const parsed = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw runtimeFailure('Living Frame PixiJS qualification image inspect is invalid.')
  }
  const inspect = record(parsed[0])
  const config = record(inspect.Config)
  const root = record(inspect.RootFS)
  const labels = stringRecord(config.Labels)
  const entrypoint = stringArray(config.Entrypoint)
  const environmentNames =
    extractEnvironmentNames(stringArray(config.Env))
  const layers = stringArray(root.Layers)
  if (
    inspect.Os !== 'linux'
    || typeof inspect.Architecture !== 'string'
    || typeof inspect.Id !== 'string'
    || config.User !== '10001:10001'
    || config.WorkingDir !== '/app'
    || stableAuthorityStringify(entrypoint) !==
      stableAuthorityStringify(ENTRYPOINT)
    || labels['com.reeditpro.runner.protocol'] !==
      CONTAINER_VERSION
    || labels[
      'com.reeditpro.runner.base-image-identity-hash'
    ] !== input.base.imageIdentityHash
    || labels['com.reeditpro.runner.source-digest'] !==
      input.sourceDigestSha256
    || labels[
      'com.reeditpro.runner.private-internal-only'
    ] !== 'true'
    || labels['com.reeditpro.runner.qualification-only'] !==
      'true'
    || labels[
      'com.reeditpro.runner.operation-registered'
    ] !== 'false'
    || labels['com.reeditpro.runner.product-ready'] !==
      'false'
    || labels[
      'com.reeditpro.runner.external-beta-ready'
    ] !== 'false'
    || labels['com.reeditpro.runner.production-ready'] !==
      'false'
    || secretLikeEnvironmentNames(environmentNames)
      .length > 0
    || layers.length < 2
  ) throw runtimeFailure('Living Frame PixiJS qualification image identity is invalid.')
  return {
    imageTag: IMAGE_TAG,
    imageId: inspect.Id,
    imageIdentityHash: sha256AuthorityValue({
      imageId: inspect.Id,
      baseImageId: input.base.imageId,
      baseImageIdentityHash:
        input.base.imageIdentityHash,
      sourceDigestSha256: input.sourceDigestSha256,
      architecture: inspect.Architecture,
      entrypoint,
      environmentNames,
      layers,
      labels,
    }),
    baseImageId: input.base.imageId,
    baseImageIdentityHash: input.base.imageIdentityHash,
    sourceDigestSha256: input.sourceDigestSha256,
    architecture: inspect.Architecture,
    imageUser: '10001:10001',
    imageEntrypoint: ENTRYPOINT,
    imageEnvironmentNames: environmentNames,
    rootFilesystemLayerDigests: layers,
    labels,
  }
}

async function runQualificationContainer(input: {
  readonly image:
    LivingFrameEnvironmentalParticlePixiJsInternalImageEvidence
  readonly serializedRequest: string
}): Promise<HostResult & {
  readonly oomKilled: boolean
  readonly confinement:
    LivingFrameEnvironmentalParticlePixiJsInternalConfinementEvidence
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
    '256',
    '--memory',
    '2g',
    '--memory-swap',
    '2g',
    '--cpus',
    '2',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=536870912',
    '--shm-size',
    '268435456',
    '--user',
    '10001:10001',
    input.image.imageId,
  ], {
    timeoutMs: TIMEOUT_MS,
    maxBytes: 64 * 1024,
  })
  if (created.exitCode !== 0 || created.stderr.trim()) {
    throw runtimeFailure('Living Frame PixiJS qualification container could not be created.')
  }
  const containerId = created.stdout.trim()
  if (!/^[a-f0-9]{64}$/u.test(containerId)) {
    throw runtimeFailure('Docker returned an invalid Living Frame PixiJS container identity.')
  }
  try {
    const confinement =
      validateConfinement(
        await inspectContainer(containerId),
        input.image,
      )
    const started = await runDocker([
      'start',
      '--attach',
      '--interactive',
      containerId,
    ], {
      input: `${input.serializedRequest}\n`,
      timeoutMs: TIMEOUT_MS,
      maxBytes: MAXIMUM_OUTPUT_BYTES,
    })
    const after = await inspectContainer(containerId)
    const state = record(after.State)
    if (
      state.Status !== 'exited'
      || state.Running !== false
      || state.ExitCode !== started.exitCode
      || typeof state.OOMKilled !== 'boolean'
    ) throw runtimeFailure('Living Frame PixiJS container exit state is inconsistent.')
    return {
      ...started,
      oomKilled: state.OOMKilled,
      confinement,
    }
  } finally {
    await runDocker([
      'rm',
      '--force',
      containerId,
    ], {
      timeoutMs: TIMEOUT_MS,
      maxBytes: 64 * 1024,
    }).catch(() => undefined)
  }
}

function validateConfinement(
  inspect: DockerInspect,
  image:
    LivingFrameEnvironmentalParticlePixiJsInternalImageEvidence,
): LivingFrameEnvironmentalParticlePixiJsInternalConfinementEvidence {
  const host = record(inspect.HostConfig)
  const config = record(inspect.Config)
  const caps = stringArray(host.CapDrop)
  const security = stringArray(host.SecurityOpt)
  const tmpfs = stringRecord(host.Tmpfs)
  const tokens = new Set(
    String(tmpfs['/tmp'] ?? '').split(','),
  )
  const mounts = array(inspect.Mounts)
  const binds =
    host.Binds == null ? [] : array(host.Binds)
  const command =
    config.Cmd == null ? [] : array(config.Cmd)
  const environmentNames =
    extractEnvironmentNames(stringArray(config.Env))
  if (
    inspect.Image !== image.imageId
    || host.NetworkMode !== 'none'
    || host.ReadonlyRootfs !== true
    || host.Privileged !== false
    || caps.length !== 1
    || caps[0] !== 'ALL'
    || !security.some((value) =>
      value.startsWith('no-new-privileges'))
    || Number(host.PidsLimit) !== 256
    || Number(host.Memory) !== 2_147_483_648
    || Number(host.MemorySwap) !== 2_147_483_648
    || Number(host.NanoCpus) !== 2_000_000_000
    || Number(host.ShmSize) !== 268_435_456
    || config.User !== '10001:10001'
    || command.length > 0
    || mounts.length > 0
    || binds.length > 0
    || !tokens.has('rw')
    || !tokens.has('noexec')
    || !tokens.has('nosuid')
    || !tokens.has('nodev')
    || !tokens.has('size=536870912')
    || stableAuthorityStringify(environmentNames) !==
      stableAuthorityStringify(
        image.imageEnvironmentNames,
      )
    || secretLikeEnvironmentNames(environmentNames)
      .length > 0
  ) throw runtimeFailure('Living Frame PixiJS container confinement is invalid.')
  return {
    networkMode: 'none',
    readOnlyRootFilesystem: true,
    capDropAll: true,
    noNewPrivileges: true,
    privileged: false,
    pidsLimit: 256,
    memoryLimitBytes: 2_147_483_648,
    memoryAndSwapLimitBytes: 2_147_483_648,
    nanoCpus: 2_000_000_000,
    tmpfsPath: '/tmp',
    tmpfsSizeBytes: 536_870_912,
    tmpfsNoExec: true,
    tmpfsNoSuid: true,
    tmpfsNoDevice: true,
    shmSizeBytes: 268_435_456,
    user: '10001:10001',
    callerCommandPresent: false,
    callerBindsPresent: false,
    callerMountsPresent: false,
    callerEnvironmentPresent: false,
    secretLikeImageEnvironmentNames: [],
  }
}

function compileRuntimeRequest(
  request:
    LivingFrameEnvironmentalParticlePrivatePixiJsRequest,
): RuntimeRequest {
  const frameSamples = Array.from(
    {
      length: request.renderCanvas.durationFrames,
    },
    (_, order) => {
      const absoluteFrame =
        request.renderCanvas.startFrame + order
      const particles =
        request.deterministicStateSequence.stateTracks
          .map((track) => ({
            track,
            state: track.frameStates.find((state) =>
              state.frame === absoluteFrame),
          }))
          .filter((entry) =>
            entry.state != null
            && entry.state.opacity > 0)
          .map((entry) => ({
            order: entry.track.order,
            xNormalized: entry.state!.position.x,
            yNormalized: entry.state!.position.y,
            radiusNormalized:
              entry.state!.radiusNormalized,
            opacity: entry.state!.opacity,
          }))
          .sort((a, b) => a.order - b.order)
      return {
        order,
        absoluteFrame,
        particles,
      }
    },
  )
  const draft: RuntimeRequestDraft = {
    schemaVersion: REQUEST_VERSION,
    requestClass:
      'server_derived_private_internal_particle_runtime_request',
    toolId: 'pixijs',
    operationId: OPERATION,
    renderCanvas: {
      widthPixels: request.renderCanvas.widthPixels,
      heightPixels:
        request.renderCanvas.heightPixels,
      fps: request.renderCanvas.fps,
      startFrame: request.renderCanvas.startFrame,
      endFrameExclusive:
        request.renderCanvas.endFrameExclusive,
      durationFrames:
        request.renderCanvas.durationFrames,
      backgroundMode: 'transparent',
      alphaMode: 'straight_alpha_png',
      finalVideoCanvas: false,
    },
    approvedAppearance: {
      colorHex:
        request.approvedStyleBinding.colorHex
          .toUpperCase(),
      blendMode:
        request.particleProfile.appearance.blendMode,
    },
    frameSamples,
    policy: {
      serverOwnedTemplateId:
        'living_frame_environmental_particles_v1',
      packageName: 'pixi.js',
      packageVersion: '8.19.0',
      packageEntrypoint: 'Application.init',
      oneRequestOneAttempt: true,
      networkAllowed: false,
      callerCodeAllowed: false,
      callerAssetsAllowed: false,
      arbitrarySaveOrPreviewAllowed: false,
      logicalBundleCount: 1,
      frameImageContentType: 'image/png',
      remotionOwnsFinalComposition: true,
      operationRegistered: false,
      dispatchAuthority: false,
      artifactAuthority: false,
      costAuthority: false,
      billingAuthority: false,
      productionReady: false,
    },
  }
  return {
    ...draft,
    requestDigestSha256: sha256AuthorityValue(draft),
  }
}

function validateRuntimeResponse(
  value: unknown,
  request: RuntimeRequest,
): RuntimeResponse {
  const response = record(value)
  if (
    response.schemaVersion !== CONTAINER_VERSION
    || response.ok !== true
    || response.status !==
      'actual_private_internal_pixijs_particle_sequence_completed'
    || response.toolId !== 'pixijs'
    || response.operationId !== OPERATION
    || response.requestDigestSha256 !==
      request.requestDigestSha256
  ) throw runtimeFailure('Living Frame PixiJS response identity is invalid.')
  const packageIdentity = record(response.packageIdentity)
  const renderIdentity = record(response.renderIdentity)
  const semantic = record(response.semanticEvidence)
  const readiness = record(response.readiness)
  const frames = array(response.frames)
  if (
    packageIdentity.packageName !== 'pixi.js'
    || packageIdentity.packageVersion !== '8.19.0'
    || packageIdentity.packageEntrypoint !==
      'Application.init'
    || renderIdentity.widthPixels !==
      request.renderCanvas.widthPixels
    || renderIdentity.heightPixels !==
      request.renderCanvas.heightPixels
    || renderIdentity.fps !== request.renderCanvas.fps
    || renderIdentity.startFrame !==
      request.renderCanvas.startFrame
    || renderIdentity.endFrameExclusive !==
      request.renderCanvas.endFrameExclusive
    || renderIdentity.frameImageCount !==
      request.renderCanvas.durationFrames
    || renderIdentity.logicalBundleCount !== 1
    || renderIdentity.frameImageContentType !==
      'image/png'
    || renderIdentity.alphaMode !== 'straight_alpha'
    || renderIdentity.finalVideoCanvas !== false
    || frames.length !== request.renderCanvas.durationFrames
    || semantic.actualPackageEntrypointExecuted !== true
    || semantic.entrypoint !== 'Application.init'
    || semantic.stageRendered !== true
    || semantic.transparentCanvasRequested !== true
    || semantic.exactFrameDimensionsVerified !== true
    || semantic.rgbaColorTypeVerified !== true
    || semantic.firstFrameFullyTransparent !== true
    || semantic.lastFrameFullyTransparent !== true
    || semantic.activeFrameAlphaVerified !== true
    || semantic.zeroNetworkVerified !== true
    || semantic.oneRequestOneAttemptVerified !== true
    || semantic.privatePngSequenceProduced !== true
    || response.networkRequestCount !== 0
    || readiness.privateInternalQualificationOnly !== true
    || readiness.operationRegistered !== false
    || readiness.canonicalDispatchIntegrated !== false
    || readiness.artifactPersisted !== false
    || readiness.qaApproved !== false
    || readiness.productReady !== false
    || readiness.externalBetaReady !== false
    || readiness.productionReady !== false
  ) throw runtimeFailure('Living Frame PixiJS response evidence is invalid.')
  return value as RuntimeResponse
}

function measureFrames(
  input:
    ExecuteLivingFrameEnvironmentalParticlePixiJsInternalRuntimeInput,
  frames: readonly RuntimeFrameOutput[],
): readonly LivingFrameEnvironmentalParticlePixiJsInternalFrameMeasurement[] {
  return frames.map((frame, order) => {
    const expectedFrame =
      input.kernelCandidate.exactFrameBinding
        .startFrame + order
    const expectedActiveParticleCount =
      input.kernelCandidate.deterministicStateSequence
        .stateTracks.filter((track) =>
          track.frameStates.some((state) =>
            state.frame === expectedFrame
            && state.opacity > 0))
        .length
    if (
      !isRecord(frame)
      || frame.order !== order
      || frame.absoluteFrame !== expectedFrame
      || typeof frame.bytesBase64 !== 'string'
      || typeof frame.byteLength !== 'number'
      || typeof frame.sha256 !== 'string'
      || !SHA256.test(frame.sha256)
      || typeof frame.nonTransparentPixelCount !==
        'number'
    ) throw runtimeFailure('Living Frame PixiJS frame envelope is invalid.')
    const pngBytes = Buffer.from(frame.bytesBase64, 'base64')
    if (
      pngBytes.byteLength !== frame.byteLength
      || digestBytes(pngBytes) !== frame.sha256
      || pngBytes.toString('base64') !==
        frame.bytesBase64
    ) throw runtimeFailure('Living Frame PixiJS frame bytes are invalid.')
    const decoded =
      decodeLivingFrameEnvironmentalParticleRgbaPng(
        pngBytes,
      )
    if (
      decoded.width !==
        input.kernelCandidate.exactFrameBinding.widthPixels
      || decoded.height !==
        input.kernelCandidate.exactFrameBinding.heightPixels
    ) throw runtimeFailure('Living Frame PixiJS frame dimensions are invalid.')
    const alphaReport =
      measureLivingFrameAlphaArtifact({
        artifactId:
          `lf-pixijs-internal.${sha256AuthorityValue({
            qualificationId: input.qualificationId,
            absoluteFrame: expectedFrame,
          }).slice(0, 32)}`,
        artifactDigestSha256: frame.sha256,
        frameIndex: expectedFrame,
        width: decoded.width,
        height: decoded.height,
        rgbaBytes: decoded.rgba,
        alphaMode: 'straight_alpha',
        alphaExpectation: 'alpha_required',
      })
    if (
      !verifyLivingFrameAlphaMeasurementReportDigest(
        alphaReport,
      )
    ) throw runtimeFailure('Living Frame PixiJS alpha measurement digest is invalid.')
    const nonTransparentPixelCount =
      alphaReport.distribution.pixelCount
      - alphaReport.distribution.transparentPixelCount
    const expectationMatched =
      expectedActiveParticleCount === 0
        ? nonTransparentPixelCount === 0
        : nonTransparentPixelCount > 0
          && alphaReport.distribution
            .transparentPixelCount > 0
    if (
      !expectationMatched
      || nonTransparentPixelCount !==
        frame.nonTransparentPixelCount
    ) throw runtimeFailure('Living Frame PixiJS frame alpha expectation failed.')
    return {
      order,
      absoluteFrame: expectedFrame,
      pngDigestSha256: frame.sha256,
      pngByteLength: frame.byteLength,
      decodedRgbaDigestSha256:
        digestBytes(decoded.rgba),
      alphaMeasurementReportDigestSha256:
        alphaReport.reportDigestSha256,
      alphaCoverageRatio:
        alphaReport.distribution.alphaCoverageRatio,
      borderTransparentRatio:
        alphaReport.distribution.borderTransparentRatio,
      nonTransparentPixelCount,
      alphaWeightedCentroid:
        measureLivingFrameEnvironmentalParticleAlphaWeightedCentroid(
          decoded.rgba,
          decoded.width,
          decoded.height,
        ),
      expectedActiveParticleCount,
      expectationMatched: true,
    }
  })
}

function compileAggregate(
  frames:
    readonly LivingFrameEnvironmentalParticlePixiJsInternalFrameMeasurement[],
): LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReportDraft['aggregateMeasurement'] {
  const active = frames.filter((frame) =>
    frame.expectedActiveParticleCount > 0)
  const first = frames[0]
  const last = frames.at(-1)
  const unique =
    new Set(frames.map((frame) =>
      frame.pngDigestSha256)).size
  const centroids = active
    .map((frame) => frame.alphaWeightedCentroid)
    .filter((value) =>
      value.xNormalized != null
      && value.yNormalized != null)
  const movement = centroids.some((value, index) => {
    const previous = centroids[index - 1]
    return previous != null
      && Math.hypot(
        value.xNormalized! - previous.xNormalized!,
        value.yNormalized! - previous.yNormalized!,
      ) > 0.000_001
  })
  if (
    first?.nonTransparentPixelCount !== 0
    || last?.nonTransparentPixelCount !== 0
    || active.length < 2
    || unique < 3
    || !movement
  ) throw runtimeFailure('Living Frame PixiJS aggregate sequence evidence is insufficient.')
  return {
    everyPngDecodedFromBytes: true,
    everyFrameExactDimension: true,
    everyFrameRgbaColorType: true,
    everyFrameAlphaMeasured: true,
    everyFrameExpectationMatched: true,
    firstFrameFullyTransparent: true,
    lastFrameFullyTransparent: true,
    activeFrameCount: active.length,
    fullyTransparentFrameCount:
      frames.length - active.length,
    uniqueFramePngDigestCount: unique,
    temporalVariationPresent: true,
    alphaCentroidMovementPresent: true,
  }
}

function assertInput(
  input:
    ExecuteLivingFrameEnvironmentalParticlePixiJsInternalRuntimeInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'qualificationId',
      'materialization',
      'privateRequestLease',
      'kernelCandidate',
      'kernelInput',
    ])
    || typeof input.qualificationId !== 'string'
    || !SAFE_ID.test(input.qualificationId)
    || !isRecord(input.materialization)
    || !isRecord(input.privateRequestLease)
    || !isRecord(input.kernelCandidate)
    || !isRecord(input.kernelInput)
  ) throw validationFailure('Living Frame PixiJS qualification input is invalid.')
}

function assertLineage(
  input:
    ExecuteLivingFrameEnvironmentalParticlePixiJsInternalRuntimeInput,
): void {
  if (
    input.materialization.sourceBindings
      .kernelCandidateId !==
        input.kernelCandidate.kernelCandidateId
    || input.materialization.sourceBindings
      .kernelCandidateDigestSha256 !==
        input.kernelCandidate.kernelCandidateDigestSha256
    || input.materialization.sourceBindings
      .deterministicStateSequenceDigestSha256 !==
        input.kernelCandidate.deterministicStateSequence
          .sequenceDigestSha256
    || input.materialization.sourceBindings
      .confirmedOutputFrameDigestSha256 !==
        input.kernelCandidate.sourceBindings
          .confirmedOutputFrameDigestSha256
    || input.materialization.sourceBindings
      .masterTimingDigestSha256 !==
        input.kernelCandidate.sourceBindings
          .masterTimingDigestSha256
    || input.privateRequestLease
      .materializationDigestSha256 !==
        input.materialization.materializationDigestSha256
    || input.privateRequestLease
      .privateRequestDigestSha256 !==
        input.materialization.requestReceipt
          .privateRequestDigestSha256
  ) throw validationFailure('Living Frame PixiJS qualification lineage is invalid.')
}

function assertPrivateRequestLineage(
  input:
    ExecuteLivingFrameEnvironmentalParticlePixiJsInternalRuntimeInput,
  request:
    LivingFrameEnvironmentalParticlePrivatePixiJsRequest,
): void {
  if (
    sha256AuthorityValue(request) !==
      input.materialization.requestReceipt
        .privateRequestDigestSha256
    || request.materializationCandidateId !==
      input.materialization.materializationCandidateId
    || request.kernelCandidateId !==
      input.kernelCandidate.kernelCandidateId
    || request.sourceBindings
      .kernelCandidateDigestSha256 !==
        input.kernelCandidate.kernelCandidateDigestSha256
    || request.sourceBindings
      .deterministicStateSequenceDigestSha256 !==
        input.kernelCandidate.deterministicStateSequence
          .sequenceDigestSha256
    || request.sourceBindings
      .confirmedOutputFrameDigestSha256 !==
        input.kernelCandidate.sourceBindings
          .confirmedOutputFrameDigestSha256
    || request.sourceBindings.masterTimingDigestSha256 !==
      input.kernelCandidate.sourceBindings
        .masterTimingDigestSha256
    || request.renderCanvas.widthPixels !==
      input.kernelCandidate.exactFrameBinding.widthPixels
    || request.renderCanvas.heightPixels !==
      input.kernelCandidate.exactFrameBinding.heightPixels
    || request.renderCanvas.finalVideoCanvas
    || request.operationRegistered
    || request.dispatchAuthority
    || request.runtimeAuthority
    || request.artifactAuthority
    || request.finalCanvasAuthority
    || request.costAuthority
    || request.billingAuthority
    || request.productionReady
  ) throw validationFailure('Living Frame PixiJS private request is invalid.')
}

async function sourceDigest(): Promise<string> {
  const hashes: Record<string, string> = {}
  for (const file of SOURCE_FILES) {
    hashes[file] =
      digestBytes(
        await readBoundedBuffer(
          join(sourceDirectory(), file),
          4 * 1024 * 1024,
        ),
      )
  }
  return sha256AuthorityValue(hashes)
}

async function copyBoundedFile(
  source: string,
  target: string,
): Promise<void> {
  const stat = await lstat(source)
  if (
    stat.isSymbolicLink()
    || !stat.isFile()
    || stat.size < 1
    || stat.size > 4 * 1024 * 1024
  ) throw runtimeFailure('Living Frame PixiJS build input is invalid.')
  await mkdir(dirname(target), {
    recursive: true,
    mode: 0o700,
  })
  await copyFile(
    source,
    target,
    constants.COPYFILE_EXCL,
  )
}

async function readBoundedText(
  path: string,
  maximumBytes: number,
): Promise<string> {
  return (
    await readBoundedBuffer(path, maximumBytes)
  ).toString('utf8')
}

async function readBoundedBuffer(
  path: string,
  maximumBytes: number,
): Promise<Buffer> {
  const handle = await open(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const stat = await handle.stat()
    if (
      !stat.isFile()
      || stat.size < 1
      || stat.size > maximumBytes
    ) throw runtimeFailure('Living Frame PixiJS source file is invalid.')
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

async function inspectContainer(
  containerId: string,
): Promise<DockerInspect> {
  const result = await runDocker([
    'inspect',
    containerId,
  ], {
    timeoutMs: TIMEOUT_MS,
    maxBytes: 8 * 1024 * 1024,
  })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw runtimeFailure('Living Frame PixiJS container inspect failed.')
  }
  const parsed = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw runtimeFailure('Living Frame PixiJS container inspect is invalid.')
  }
  return parsed[0] as DockerInspect
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
  return new Promise((resolve, reject) => {
    const invocation =
      createPrivateDockerCliInvocation(args)
    const child = spawn(
      invocation.executable,
      invocation.args,
      {
        cwd: options.cwd,
        env: invocation.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let totalBytes = 0
    let settled = false
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      if (!settled) {
        settled = true
        reject(runtimeFailure('Living Frame PixiJS Docker command exceeded timeout.'))
      }
    }, options.timeoutMs)
    const collect =
      (target: Buffer[]) => (chunk: Buffer) => {
        totalBytes += chunk.byteLength
        if (totalBytes > options.maxBytes) {
          child.kill('SIGKILL')
          if (!settled) {
            settled = true
            clearTimeout(timer)
            reject(runtimeFailure('Living Frame PixiJS Docker output exceeded its ceiling.'))
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
        reject(runtimeFailure('Living Frame PixiJS Docker runtime is unavailable.', cause))
      }
    })
    child.on('close', (code) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve({
          exitCode: code ?? -1,
          stdout: Buffer.concat(stdout).toString(),
          stderr: Buffer.concat(stderr).toString(),
        })
      }
    })
    child.stdin.end(options.input ?? '')
  })
}

function sourceDirectory(): string {
  return join(
    repositoryRoot(),
    'docker/qualification/living-frame-environmental-particle-pixijs',
  )
}

function repositoryRoot(): string {
  return fileURLToPath(
    new URL('../../', import.meta.url),
  ).replace(/[\\/]$/u, '')
}

function digestBytes(
  bytes: Uint8Array,
): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}

function record(
  value: unknown,
): Record<string, unknown> {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
  ) throw runtimeFailure('Living Frame PixiJS evidence contains an invalid object.')
  return value as Record<string, unknown>
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw runtimeFailure('Living Frame PixiJS evidence contains an invalid array.')
  }
  return value
}

function stringArray(value: unknown): string[] {
  const values = array(value)
  if (values.some((item) => typeof item !== 'string')) {
    throw runtimeFailure('Living Frame PixiJS evidence contains a non-string array.')
  }
  return values as string[]
}

function stringRecord(
  value: unknown,
): Record<string, string> {
  const object = record(value)
  if (
    Object.values(object)
      .some((item) => typeof item !== 'string')
  ) throw runtimeFailure('Living Frame PixiJS evidence contains a non-string record.')
  return object as Record<string, string>
}

function extractEnvironmentNames(
  values: readonly string[],
): string[] {
  return values
    .map((value) => value.split('=', 1)[0] ?? '')
    .sort()
}

function secretLikeEnvironmentNames(
  values: readonly string[],
): string[] {
  return values.filter((name) =>
    /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/iu
      .test(name))
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|') ===
    [...keys].sort().join('|')
}

function runtimeFailure(
  message: string,
  cause?: unknown,
): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    message,
    503,
    undefined,
    { cause },
  )
}

function validationFailure(message: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    message,
    400,
  )
}
