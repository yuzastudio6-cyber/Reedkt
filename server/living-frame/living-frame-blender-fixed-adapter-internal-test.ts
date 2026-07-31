import { createHash } from 'node:crypto'
import {
  chmodSync,
  closeSync,
  constants,
  createReadStream,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import type { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

import { z } from 'zod'

import type {
  LivingFrameBlenderFixedAdapterEnvelope,
  LivingFrameBlenderFixedAdapterMaterial,
  LivingFrameBlenderFixedAdapterMesh,
  LivingFrameBlenderFixedAdapterOutputFileCommitment,
  LivingFrameBlenderFixedAdapterOutputLease,
  LivingFrameBlenderFixedAdapterRequestDraft,
  LivingFrameBlenderFixedAdapterResult,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import {
  LIVING_FRAME_BLENDER_FIXED_ADAPTER_ENVELOPE_VERSION,
  LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_CLASS,
  LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_VERSION,
  LIVING_FRAME_BLENDER_FIXED_ADAPTER_RESULT_VERSION,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import type {
  LivingFrameRigActionPlan,
} from '../../src/types/living-frame-rig-action'
import type {
  LivingFrameRiggingAdapterCandidateRequest,
} from '../../src/types/living-frame-rigging-adapter-candidate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRigActionPlan,
} from './living-frame-rig-action'
import {
  verifyLivingFrameRiggingAdapterCandidate,
} from './living-frame-rigging-adapter-candidate'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const EXPECTED_BLENDER_EXECUTABLE =
  '/Volumes/Blender/Blender.app/Contents/MacOS/Blender'
const ADAPTER_SOURCE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'runtime/living-frame-blender-fixed-adapter.py',
)
const JOB_PREFIX = 'reeditpro-living-frame-blender-fixed-adapter-'
const MAX_CAPTURE_BYTES = 2 * 1024 * 1024

const meshSchema = z.object({
  meshId: z.string().regex(SAFE_ID),
  vertices: z.array(z.object({
    position: z.object({
      x: z.number().finite().min(0).max(1),
      y: z.number().finite().min(0).max(1),
      z: z.number().finite().min(-1).max(1),
    }).strict(),
    uv: z.object({
      x: z.number().finite().min(0).max(1),
      y: z.number().finite().min(0).max(1),
    }).strict(),
  }).strict()).min(4).max(4_096),
  triangles: z.array(z.tuple([
    z.number().int().nonnegative().max(4_095),
    z.number().int().nonnegative().max(4_095),
    z.number().int().nonnegative().max(4_095),
  ])).min(2).max(8_192),
  weights: z.array(z.array(z.object({
    boneId: z.string().regex(SAFE_ID),
    weight: z.number().finite().min(0).max(1),
  }).strict()).min(1).max(4)).min(4).max(4_096),
}).strict()

const materialSchema = z.object({
  baseColorRgba: z.tuple([
    z.number().finite().min(0).max(1),
    z.number().finite().min(0).max(1),
    z.number().finite().min(0).max(1),
    z.number().finite().min(0).max(1),
  ]),
  roughness: z.number().finite().min(0).max(1),
}).strict()

const resultSchema = z.object({
  resultVersion: z.literal(
    LIVING_FRAME_BLENDER_FIXED_ADAPTER_RESULT_VERSION,
  ),
  componentId: z.string().regex(SAFE_ID),
  candidateRequestDigestSha256: z.string().regex(SHA256),
  riggingPlanDigestSha256: z.string().regex(SHA256),
  actionPlanDigestSha256: z.string().regex(SHA256),
  payloadDigestSha256: z.string().regex(SHA256),
  frameCount: z.number().int().positive().max(240),
  rgbaBytes: z.number().int().positive(),
  rgbaAggregateDigestSha256: z.string().regex(SHA256),
  maskBytes: z.number().int().positive(),
  maskAggregateDigestSha256: z.string().regex(SHA256),
  depthBytes: z.number().int().positive(),
  depthAggregateDigestSha256: z.string().regex(SHA256),
  rigCompileDurationMs: z.number().int().nonnegative(),
  renderDurationMs: z.number().int().positive(),
  transparentRgbaProduced: z.literal(true),
  maskPassProduced: z.literal(true),
  depthPassProduced: z.literal(true),
  remotionOwnsFinalCanvas: z.literal(true),
  runtimeDispatchAuthority: z.literal(false),
  assetPersistenceAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  billingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const AUTHORITY_BOUNDARY = Object.freeze({
  privateInternalQualificationOnly: true,
  runtimeDispatchAuthority: false,
  assetPersistenceAuthority: false,
  assetManifestAuthority: false,
  costAuthority: false,
  billingAuthority: false,
  qaApprovalAuthority: false,
  finalCanvasAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
  remotionOwnsFinalCanvas: true,
} as const)

interface PrivateBlenderOutputLeaseBinding {
  readonly outputRoot: string
  readonly result: LivingFrameBlenderFixedAdapterResult
  readonly resultDigestSha256: string
  readonly artifactSetDigestSha256: string
  readonly files: readonly {
    readonly path: string
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
  }[]
  readonly cleanup: () => void
}

const privateBlenderOutputByLease =
  new WeakMap<
    LivingFrameBlenderFixedAdapterOutputLease,
    PrivateBlenderOutputLeaseBinding
  >()

export interface CompileLivingFrameBlenderFixedAdapterInternalInput {
  readonly candidateRequest:
    LivingFrameRiggingAdapterCandidateRequest
  readonly actionPlan: LivingFrameRigActionPlan
  readonly componentId: string
  readonly mesh: LivingFrameBlenderFixedAdapterMesh
  readonly material: LivingFrameBlenderFixedAdapterMaterial
  readonly fps: number
  readonly renderProfile: 'blocking_preview' | 'full'
}

export interface CompiledLivingFrameBlenderFixedAdapterInternalRequest {
  readonly payload: LivingFrameBlenderFixedAdapterRequestDraft
  readonly envelope: LivingFrameBlenderFixedAdapterEnvelope
}

export interface LivingFrameBlenderFixedAdapterInternalRun {
  readonly result: LivingFrameBlenderFixedAdapterResult
  readonly stdout: string
  readonly stderr: string
  readonly totalDurationMs: number
  readonly maximumResidentBytes: number
  readonly outputRoot: string
  readonly cleanup: () => void
}

export interface LivingFrameBlenderFixedAdapterInternalRunWithOutputLease {
  readonly result: LivingFrameBlenderFixedAdapterResult
  readonly stdout: string
  readonly stderr: string
  readonly totalDurationMs: number
  readonly maximumResidentBytes: number
  readonly outputLease: LivingFrameBlenderFixedAdapterOutputLease
}

export interface LivingFrameBlenderFixedAdapterConsumedOutput {
  readonly result: LivingFrameBlenderFixedAdapterResult
  readonly resultDigestSha256: string
  readonly artifactSetDigestSha256: string
  readonly files: readonly {
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
    readonly openStream: () => Readable
  }[]
  readonly cleanup: () => void
}

export function compileLivingFrameBlenderFixedAdapterInternalRequest(
  rawInput: CompileLivingFrameBlenderFixedAdapterInternalInput,
): CompiledLivingFrameBlenderFixedAdapterInternalRequest {
  if (!verifyLivingFrameRiggingAdapterCandidate(rawInput.candidateRequest)) {
    throw new Error('Blender fixed-adapter candidate request is invalid.')
  }
  const candidate = rawInput.candidateRequest
  const plan = candidate.riggingPlan
  if (
    candidate.adapterBinding.backend !== 'blender_headless_candidate'
    || candidate.adapterBinding.candidateToolId !== 'blender'
    || candidate.adapterBinding.candidateOperationId
      !== 'tool.blender.render_living_frame_component_rig.v1'
    || candidate.adapterBinding.fixedAdapterProfile
      !== 'server_owned_fixed_bpy_rig_adapter_v1'
    || !verifyLivingFrameRigActionPlan(rawInput.actionPlan, plan)
  ) {
    throw new Error('Blender fixed-adapter route or action lineage is invalid.')
  }
  if (
    !candidate.outputSelection.approvedRiggedComponentIds.includes(
      rawInput.componentId,
    )
    || candidate.outputSelection.excludedStaticAnchorComponentIds.includes(
      rawInput.componentId,
    )
  ) {
    throw new Error('Blender fixed-adapter component selection is invalid.')
  }
  const mesh = meshSchema.parse(rawInput.mesh)
  const material = materialSchema.parse(rawInput.material)
  assertMesh(plan, rawInput.componentId, mesh)
  const controlTrack = rawInput.actionPlan.tracks.find((track) =>
    track.property === 'control_position_normalized'
    && plan.controls.find((control) =>
      control.controlId === track.targetRefId
      && control.kind === 'ik_target'))
  const ik = plan.ikChains[0]
  if (!controlTrack || !ik || controlTrack.role !== 'primary') {
    throw new Error('Blender fixed-adapter IK action is unavailable.')
  }
  const renderProfile = z.enum([
    'blocking_preview',
    'full',
  ]).parse(rawInput.renderProfile)
  const renderScale = renderProfile === 'blocking_preview' ? 0.25 : 1
  const fps = z.number().int().min(1).max(120).parse(rawInput.fps)
  const completeWithoutBinding = {
    contractVersion:
      LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_VERSION,
    requestClass:
      LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_CLASS,
    candidateRequestDigestSha256: candidate.requestDigestSha256,
    riggingPlanDigestSha256: plan.planDigestSha256,
    actionPlanDigestSha256: rawInput.actionPlan.actionDigestSha256,
    componentId: rawInput.componentId,
    output: {
      widthPixels: Math.max(
        64,
        Math.round(plan.outputContract.widthPixels * renderScale),
      ),
      heightPixels: Math.max(
        64,
        Math.round(plan.outputContract.heightPixels * renderScale),
      ),
      fps,
      startFrame: plan.outputContract.startFrame,
      endFrameExclusive: plan.outputContract.endFrameExclusive,
      frameStep: renderScale < 1 ? 6 : 1,
      transparentRgbaRequired: true as const,
      maskPassRequired: true as const,
      depthPassRequired: true as const,
      previewScale: renderScale,
    },
    mesh: structuredClone(mesh),
    bones: plan.bones
      .filter((bone) => bone.componentId === rawInput.componentId)
      .map((bone) => ({
        order: bone.order,
        boneId: bone.boneId,
        parentBoneId: bone.parentBoneId,
        head: { ...bone.head, z: 0 },
        tail: { ...bone.tail, z: 0 },
        deform: bone.deformComponent,
      })),
    joints: plan.joints.map((joint) => ({
      order: joint.order,
      jointId: joint.jointId,
      boneId: joint.boneId,
      minimumAngleDegrees: joint.minimumAngleDegrees,
      maximumAngleDegrees: joint.maximumAngleDegrees,
    })),
    ik: {
      effectorBoneId: ik.effectorBoneId,
      chainLength: ik.chainLength,
      iterationLimit: ik.solverIterationLimit,
      targetKeyframes: controlTrack.keyframes.map((keyframe) => ({
        frame: keyframe.frame,
        position: keyframe.pointValue!,
      })),
    },
    animation: {
      interpolation: 'BEZIER' as const,
      deterministicBakeRequired: true as const,
      secondaryMotionEnabled: false as const,
    },
    material: structuredClone(material),
    authorityBoundary: AUTHORITY_BOUNDARY,
  }
  const payload: LivingFrameBlenderFixedAdapterRequestDraft = {
    ...completeWithoutBinding,
    payloadDigestBindingSha256: sha256AuthorityValue(
      completeWithoutBinding,
    ),
  }
  const payloadCanonicalJson = stableAuthorityStringify(payload)
  const envelope: LivingFrameBlenderFixedAdapterEnvelope = {
    envelopeVersion:
      LIVING_FRAME_BLENDER_FIXED_ADAPTER_ENVELOPE_VERSION,
    payloadCanonicalJson,
    payloadDigestSha256: sha256Text(payloadCanonicalJson),
  }
  return { payload, envelope }
}

export function runLivingFrameBlenderFixedAdapterInternal(
  compiled: CompiledLivingFrameBlenderFixedAdapterInternalRequest,
): LivingFrameBlenderFixedAdapterInternalRun {
  assertCompiledRequestIntegrity(compiled)
  const executable = realpathSync(EXPECTED_BLENDER_EXECUTABLE)
  if (executable !== EXPECTED_BLENDER_EXECUTABLE) {
    throw new Error('The pinned Blender executable is unavailable.')
  }
  const adapterSource = realpathSync(ADAPTER_SOURCE)
  if (adapterSource !== ADAPTER_SOURCE || lstatSync(adapterSource).isSymbolicLink()) {
    throw new Error('The fixed Blender adapter source is unavailable.')
  }
  const jobRoot = mkdtempSync(join(tmpdir(), JOB_PREFIX))
  chmodSync(jobRoot, 0o700)
  const requestRoot = join(jobRoot, '.reeditpro-rigging')
  mkdirSync(requestRoot, { mode: 0o700 })
  mkdirSync(join(jobRoot, 'no-home'), { mode: 0o700 })
  mkdirSync(join(jobRoot, 'tmp'), { mode: 0o700 })
  const requestFile = join(requestRoot, 'request-envelope.json')
  writePrivateCreateOnly(
    requestFile,
    Buffer.from(JSON.stringify(compiled.envelope), 'utf8'),
  )
  const started = performance.now()
  const process = spawnSync('/usr/bin/time', [
    '-lp',
    executable,
    '--background',
    '--factory-startup',
    '--disable-autoexec',
    '--python',
    adapterSource,
  ], {
    cwd: jobRoot,
    env: {
      PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
      HOME: join(jobRoot, 'no-home'),
      TMPDIR: join(jobRoot, 'tmp'),
    },
    encoding: 'utf8',
    maxBuffer: MAX_CAPTURE_BYTES,
    timeout: 180_000,
    killSignal: 'SIGKILL',
  })
  const totalDurationMs = Math.round(performance.now() - started)
  const maximumResidentBytes = parseMaximumResidentBytes(process.stderr)
  if (
    process.error
    || process.signal
    || process.status !== 0
    || maximumResidentBytes === null
  ) {
    const safeStderr = sanitizeProcessOutput(process.stderr)
    cleanupJobRoot(jobRoot)
    throw new Error(
      `The fixed Blender adapter failed (${process.status ?? 'signal'}): ${safeStderr}`,
    )
  }
  try {
    const resultPath = join(requestRoot, 'result.json')
    const result = resultSchema.parse(
      JSON.parse(readPrivateRegularFile(resultPath, 128 * 1024)),
    )
    assertResult(compiled, result)
    const outputRoot = realpathSync(join(requestRoot, 'output'))
    assertOutputTree(outputRoot, compiled.payload.output)
    return {
      result,
      stdout: sanitizeProcessOutput(process.stdout),
      stderr: sanitizeProcessOutput(process.stderr),
      totalDurationMs,
      maximumResidentBytes,
      outputRoot,
      cleanup: () => cleanupJobRoot(jobRoot),
    }
  } catch (error) {
    cleanupJobRoot(jobRoot)
    throw error
  }
}

export function runLivingFrameBlenderFixedAdapterInternalWithOutputLease(
  compiled: CompiledLivingFrameBlenderFixedAdapterInternalRequest,
): LivingFrameBlenderFixedAdapterInternalRunWithOutputLease {
  const run =
    runLivingFrameBlenderFixedAdapterInternal(compiled)
  try {
    const files =
      buildOutputFileCommitments(run.outputRoot)
    const resultDigestSha256 =
      sha256AuthorityValue(run.result)
    const artifactSetDigestSha256 =
      sha256AuthorityValue({
        contract:
          'living_frame_blender_output_artifact_set_v1',
        resultDigestSha256,
        files: files.map((file) => file.commitment),
      })
    const lease =
      deepFreeze({
        leaseClass:
          'process_bound_single_use_living_frame_blender_output_lease_v1' as const,
        leaseId:
          `lf-blender-output.${sha256AuthorityValue({
            artifactSetDigestSha256,
            payloadDigestSha256:
              run.result.payloadDigestSha256,
          }).slice(0, 40)}`,
        resultDigestSha256,
        candidateRequestDigestSha256:
          run.result.candidateRequestDigestSha256,
        riggingPlanDigestSha256:
          run.result.riggingPlanDigestSha256,
        actionPlanDigestSha256:
          run.result.actionPlanDigestSha256,
        payloadDigestSha256:
          run.result.payloadDigestSha256,
        artifactSetDigestSha256,
        fileCount: files.length,
        totalByteLength: files.reduce(
          (sum, file) =>
            sum + file.commitment.byteLength,
          0,
        ),
        files: files.map((file) => file.commitment),
        callerSerializable: false as const,
        runtimeDispatchAuthority: false as const,
        assetPersistenceAuthority: false as const,
        assetManifestAuthority: false as const,
        qaApprovalAuthority: false as const,
        privateReviewAuthority: false as const,
        billingAuthority: false as const,
        publicDeliveryAuthority: false as const,
        productionAuthority: false as const,
      })
    privateBlenderOutputByLease.set(
      lease,
      Object.freeze({
        outputRoot: run.outputRoot,
        result: run.result,
        resultDigestSha256,
        artifactSetDigestSha256,
        files,
        cleanup: run.cleanup,
      }),
    )
    return {
      result: run.result,
      stdout: run.stdout,
      stderr: run.stderr,
      totalDurationMs: run.totalDurationMs,
      maximumResidentBytes:
        run.maximumResidentBytes,
      outputLease: lease,
    }
  } catch (error) {
    run.cleanup()
    throw error
  }
}

export function consumeLivingFrameBlenderFixedAdapterOutputLease(
  lease: LivingFrameBlenderFixedAdapterOutputLease,
): LivingFrameBlenderFixedAdapterConsumedOutput {
  const binding =
    privateBlenderOutputByLease.get(lease)
  if (
    binding == null
    || lease.leaseClass !==
      'process_bound_single_use_living_frame_blender_output_lease_v1'
    || lease.callerSerializable !== false
    || lease.runtimeDispatchAuthority !== false
    || lease.assetPersistenceAuthority !== false
    || lease.assetManifestAuthority !== false
    || lease.qaApprovalAuthority !== false
    || lease.privateReviewAuthority !== false
    || lease.billingAuthority !== false
    || lease.publicDeliveryAuthority !== false
    || lease.productionAuthority !== false
    || lease.resultDigestSha256 !==
      binding.resultDigestSha256
    || lease.artifactSetDigestSha256 !==
      binding.artifactSetDigestSha256
    || lease.fileCount !== binding.files.length
    || lease.totalByteLength !==
      binding.files.reduce(
        (sum, file) =>
          sum + file.commitment.byteLength,
        0,
      )
    || stableAuthorityStringify(lease.files)
      !== stableAuthorityStringify(
        binding.files.map((file) =>
          file.commitment),
      )
  ) {
    throw new Error(
      'Blender fixed-adapter output lease is invalid, unknown, or already consumed.',
    )
  }
  privateBlenderOutputByLease.delete(lease)
  for (const file of binding.files) {
    const bytes =
      readPrivateRegularBytes(
        file.path,
        64 * 1024 * 1024,
      )
    if (
      bytes.byteLength !==
        file.commitment.byteLength
      || createHash('sha256')
        .update(bytes)
        .digest('hex') !==
        file.commitment.sha256
    ) {
      binding.cleanup()
      throw new Error(
        'Blender fixed-adapter output changed before lease consumption.',
      )
    }
  }
  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    binding.cleanup()
  }
  return {
    result: binding.result,
    resultDigestSha256:
      binding.resultDigestSha256,
    artifactSetDigestSha256:
      binding.artifactSetDigestSha256,
    files: binding.files.map((file) => ({
      commitment: file.commitment,
      openStream: () => {
        if (cleaned) {
          throw new Error(
            'Blender fixed-adapter output was already cleaned up.',
          )
        }
        const descriptor = openSync(
          file.path,
          constants.O_RDONLY
            | (constants.O_NOFOLLOW ?? 0),
        )
        return createReadStream(file.path, {
          fd: descriptor,
          autoClose: true,
        })
      },
    })),
    cleanup,
  }
}

function assertCompiledRequestIntegrity(
  compiled: CompiledLivingFrameBlenderFixedAdapterInternalRequest,
): void {
  const payload = compiled.payload
  const envelope = compiled.envelope
  const { payloadDigestBindingSha256, ...payloadDraft } = payload
  if (
    Object.keys(compiled).sort().join(':') !== 'envelope:payload'
    || Object.keys(envelope).sort().join(':')
      !== 'envelopeVersion:payloadCanonicalJson:payloadDigestSha256'
    || envelope.envelopeVersion
      !== LIVING_FRAME_BLENDER_FIXED_ADAPTER_ENVELOPE_VERSION
    || envelope.payloadCanonicalJson !== stableAuthorityStringify(payload)
    || envelope.payloadDigestSha256
      !== sha256Text(envelope.payloadCanonicalJson)
    || payloadDigestBindingSha256 !== sha256AuthorityValue(payloadDraft)
  ) {
    throw new Error(
      'Blender fixed-adapter compiled request integrity is invalid.',
    )
  }
}

export function fixedBlenderAdapterSourceDigestSha256(): string {
  return createHash('sha256')
    .update(readFileSync(ADAPTER_SOURCE))
    .digest('hex')
}

function assertMesh(
  plan: LivingFrameRiggingAdapterCandidateRequest['riggingPlan'],
  componentId: string,
  mesh: LivingFrameBlenderFixedAdapterMesh,
): void {
  const binding = plan.meshBindings.find((candidate) =>
    candidate.componentId === componentId)
  if (
    !binding
    || binding.topology !== 'skinned_plane_2_5d'
    || binding.vertexCount !== mesh.vertices.length
    || binding.triangleCount !== mesh.triangles.length
    || mesh.weights.length !== mesh.vertices.length
  ) {
    throw new Error('Blender fixed-adapter mesh artifact is invalid.')
  }
  const boneIds = new Set(
    plan.bones
      .filter((bone) => bone.componentId === componentId)
      .map((bone) => bone.boneId),
  )
  const triangles = new Set<string>()
  for (const triangle of mesh.triangles) {
    if (
      new Set(triangle).size !== 3
      || triangle.some((index) =>
        index < 0 || index >= mesh.vertices.length)
    ) {
      throw new Error('Blender fixed-adapter triangle is invalid.')
    }
    const key = triangle.join(':')
    if (triangles.has(key)) {
      throw new Error('Blender fixed-adapter triangle is duplicated.')
    }
    triangles.add(key)
  }
  for (const weights of mesh.weights) {
    const total = weights.reduce((sum, item) => {
      if (!boneIds.has(item.boneId)) {
        throw new Error('Blender fixed-adapter weight bone is invalid.')
      }
      return sum + item.weight
    }, 0)
    if (Math.abs(total - 1) > 0.0001) {
      throw new Error('Blender fixed-adapter vertex weights are invalid.')
    }
  }
}

function assertResult(
  compiled: CompiledLivingFrameBlenderFixedAdapterInternalRequest,
  result: LivingFrameBlenderFixedAdapterResult,
): void {
  const payload = compiled.payload
  if (
    result.componentId !== payload.componentId
    || result.candidateRequestDigestSha256
      !== payload.candidateRequestDigestSha256
    || result.riggingPlanDigestSha256 !== payload.riggingPlanDigestSha256
    || result.actionPlanDigestSha256 !== payload.actionPlanDigestSha256
    || result.payloadDigestSha256 !== payload.payloadDigestBindingSha256
    || result.frameCount
      !== Math.ceil(
        (
          payload.output.endFrameExclusive
          - payload.output.startFrame
        ) / payload.output.frameStep,
      )
  ) {
    throw new Error('Blender fixed-adapter result lineage is invalid.')
  }
}

function assertOutputTree(
  outputRoot: string,
  output: LivingFrameBlenderFixedAdapterRequestDraft['output'],
): void {
  const realRoot = realpathSync(outputRoot)
  if (realRoot !== outputRoot || lstatSync(realRoot).isSymbolicLink()) {
    throw new Error('Blender fixed-adapter output root is invalid.')
  }
  const expectedDirectories = ['depth', 'mask', 'rgba']
  const expectedFrames = new Set<number>()
  for (
    let frame = output.startFrame;
    frame < output.endFrameExclusive;
    frame += output.frameStep
  ) {
    expectedFrames.add(frame)
  }
  if (
    readdirSync(realRoot).sort().join(':')
      !== expectedDirectories.join(':')
  ) {
    throw new Error('Blender fixed-adapter output tree is invalid.')
  }
  for (const directory of expectedDirectories) {
    const directoryPath = join(realRoot, directory)
    const directoryStat = lstatSync(directoryPath)
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
      throw new Error('Blender fixed-adapter output directory is invalid.')
    }
    const entries = readdirSync(directoryPath).sort()
    if (entries.length !== expectedFrames.size) {
      throw new Error('Blender fixed-adapter output count is invalid.')
    }
    const observedFrames = new Set<number>()
    for (const entry of entries) {
      const expectedExtension = directory === 'depth' ? 'exr' : 'png'
      const nameMatch = entry.match(
        new RegExp(`^frame_(\\d+)\\.${expectedExtension}$`, 'u'),
      )
      const observedFrame = Number(nameMatch?.[1])
      if (
        !nameMatch
        || !Number.isSafeInteger(observedFrame)
        || !expectedFrames.has(observedFrame)
        || observedFrames.has(observedFrame)
      ) {
        throw new Error('Blender fixed-adapter output name is invalid.')
      }
      observedFrames.add(observedFrame)
      const entryPath = join(directoryPath, entry)
      const entryStat = lstatSync(entryPath)
      if (
        !entryStat.isFile()
        || entryStat.isSymbolicLink()
        || entryStat.size <= 0
        || entryStat.size > 64 * 1024 * 1024
      ) {
        throw new Error('Blender fixed-adapter output file is invalid.')
      }
    }
    if (observedFrames.size !== expectedFrames.size) {
      throw new Error('Blender fixed-adapter output frame set is invalid.')
    }
  }
}

function writePrivateCreateOnly(path: string, bytes: Buffer): void {
  const descriptor = openSync(
    path,
    constants.O_WRONLY
      | constants.O_CREAT
      | constants.O_EXCL
      | (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
  } finally {
    closeSync(descriptor)
  }
}

function readPrivateRegularFile(path: string, maxBytes: number): string {
  const file = lstatSync(path)
  if (
    !file.isFile()
    || file.isSymbolicLink()
    || file.size <= 0
    || file.size > maxBytes
  ) {
    throw new Error('Blender fixed-adapter result file is invalid.')
  }
  const descriptor = openSync(
    path,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    return readFileSync(descriptor, 'utf8')
  } finally {
    closeSync(descriptor)
  }
}

function sanitizeProcessOutput(value: string | null | undefined): string {
  return (value ?? '')
    .replaceAll(EXPECTED_BLENDER_EXECUTABLE, '[blender]')
    .replaceAll(ADAPTER_SOURCE, '[fixed-adapter]')
    .replace(/\/(?:private|tmp|var|Users|Volumes)\/[^\s"'`]+/gu, '[path]')
    .slice(0, 4_096)
}

function parseMaximumResidentBytes(
  value: string | null | undefined,
): number | null {
  const match = (value ?? '').match(
    /^\s*(\d+)\s+maximum resident set size$/mu,
  )
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : null
}

function cleanupJobRoot(jobRoot: string): void {
  const resolved = realpathSync(jobRoot)
  if (
    dirname(resolved) !== realpathSync(tmpdir())
    || !resolved.split('/').at(-1)?.startsWith(JOB_PREFIX)
  ) {
    throw new Error('Blender fixed-adapter cleanup root is invalid.')
  }
  rmSync(resolved, { recursive: true })
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function inspectLivingFrameBlenderOutputFiles(
  outputRoot: string,
): {
  readonly rgbaFiles: readonly string[]
  readonly maskFiles: readonly string[]
  readonly depthFiles: readonly string[]
} {
  return {
    rgbaFiles: listOutputFiles(outputRoot, 'rgba'),
    maskFiles: listOutputFiles(outputRoot, 'mask'),
    depthFiles: listOutputFiles(outputRoot, 'depth'),
  }
}

function buildOutputFileCommitments(
  outputRoot: string,
): readonly {
  readonly path: string
  readonly commitment:
    LivingFrameBlenderFixedAdapterOutputFileCommitment
}[] {
  const outputs =
    inspectLivingFrameBlenderOutputFiles(outputRoot)
  const groups = [
    {
      pass: 'rgba' as const,
      contentType: 'image/png' as const,
      files: outputs.rgbaFiles,
      extension: 'png',
    },
    {
      pass: 'mask' as const,
      contentType: 'image/png' as const,
      files: outputs.maskFiles,
      extension: 'png',
    },
    {
      pass: 'depth' as const,
      contentType: 'image/x-exr' as const,
      files: outputs.depthFiles,
      extension: 'exr',
    },
  ]
  const commitments: {
    readonly path: string
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
  }[] = []
  for (const group of groups) {
    for (const path of group.files) {
      const fileName = basename(path)
      const match = fileName.match(
        new RegExp(
          `^frame_(\\d+)\\.${group.extension}$`,
          'u',
        ),
      )
      const frame = Number(match?.[1])
      if (
        !match
        || !Number.isSafeInteger(frame)
        || frame < 0
      ) {
        throw new Error(
          'Blender fixed-adapter output commitment frame is invalid.',
        )
      }
      const bytes =
        readPrivateRegularBytes(
          path,
          64 * 1024 * 1024,
        )
      commitments.push({
        path,
        commitment: {
          pass: group.pass,
          frame,
          fileName,
          contentType: group.contentType,
          byteLength: bytes.byteLength,
          sha256: createHash('sha256')
            .update(bytes)
            .digest('hex'),
        },
      })
    }
  }
  return commitments
}

function listOutputFiles(outputRoot: string, directory: string): string[] {
  const root = realpathSync(outputRoot)
  const child = realpathSync(join(root, directory))
  if (dirname(child) !== root) {
    throw new Error('Blender fixed-adapter output selection is invalid.')
  }
  return readdirSync(child).sort().map((entry) => {
    const path = join(child, entry)
    const file = statSync(path)
    if (!file.isFile()) {
      throw new Error('Blender fixed-adapter output entry is invalid.')
    }
    return path
  })
}

function readPrivateRegularBytes(
  path: string,
  maxBytes: number,
): Buffer {
  const file = lstatSync(path)
  if (
    !file.isFile()
    || file.isSymbolicLink()
    || file.size <= 0
    || file.size > maxBytes
  ) {
    throw new Error(
      'Blender fixed-adapter output commitment file is invalid.',
    )
  }
  const descriptor = openSync(
    path,
    constants.O_RDONLY
      | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    const bytes = readFileSync(descriptor)
    if (bytes.byteLength !== file.size) {
      throw new Error(
        'Blender fixed-adapter output commitment changed during read.',
      )
    }
    return bytes
  } finally {
    closeSync(descriptor)
  }
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const nested of Object.values(
    value as Record<string, unknown>,
  )) deepFreeze(nested)
  return value
}
