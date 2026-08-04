import { Buffer } from 'node:buffer'

import {
  MOTION_STUDIO_GPT_IMAGE_MODEL_ID,
  MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT,
  MOTION_STUDIO_GEMINI_OMNI_MODEL_ID,
  MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID,
  type MotionStudioGenerationShotSpecV1,
  type MotionStudioGenerationProviderRoute,
} from '../../../src/types/motion-studio'
import { validateMotionStudioGenerationShotSpec } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export interface GptImage2GenerationPayload {
  model: typeof MOTION_STUDIO_GPT_IMAGE_MODEL_ID
  prompt: string
  size: string
  quality: 'low'
  output_format: 'png' | 'jpeg' | 'webp'
  background: 'opaque'
  n: 1
}

export interface MotionStudioVideoCapabilityEnvelopeV1 {
  schemaVersion: 'motion-studio-video-capability-envelope-v1'
  providerRoute: Extract<MotionStudioGenerationProviderRoute, 'gemini_omni_flash' | 'wan' | 'hailuo' | 'veo'>
  shotSpecDigest: string
  generationMode: 'text_to_video' | 'image_to_video' | 'reference_to_video'
  width: number
  height: number
  durationFrames: number
  frameRate: number
  references: MotionStudioGenerationShotSpecV1['references']
  narrativePurpose: string
  visualDirection: string
  primaryAction: string
  cameraBehavior: string
  exclusions: MotionStudioGenerationShotSpecV1['exclusions']
  deterministicOverlayPolicy: MotionStudioGenerationShotSpecV1['deterministicOverlayPolicy']
  executionPolicy: {
    adapterId: typeof MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID
    externalNetworkAllowed: false
    outputIsProviderGenerated: false
  }
}

export interface ParsedSimulatorImageResponse {
  bytes: Buffer
  responseDigest: string
  providerCostIncurred: false
}

export function compileGptImage2GenerationPayload(
  shotSpec: MotionStudioGenerationShotSpecV1,
): GptImage2GenerationPayload {
  assertValidShotSpec(shotSpec)
  if (shotSpec.mediaKind !== 'still_image' || !shotSpec.output.imageFormat) {
    throw invalid('GPT Image 2 request compilation requires a registered still-image ShotSpec.')
  }
  return {
    model: MOTION_STUDIO_GPT_IMAGE_MODEL_ID,
    prompt: compileProviderPrompt(shotSpec),
    size: compileGptImage2ProviderSize(
      shotSpec.timingAuthority.width,
      shotSpec.timingAuthority.height,
    ),
    quality: 'low',
    output_format: shotSpec.output.imageFormat,
    background: 'opaque',
    n: 1,
  }
}

export function compileGptImage2ProviderSize(width: number, height: number): string {
  const dimensionCandidates = (value: number) => [...new Set([
    Math.floor(value / 16) * 16,
    Math.ceil(value / 16) * 16,
  ])].filter((candidate) => candidate >= 16 && candidate <= 3840)
  const candidates = dimensionCandidates(width).flatMap((candidateWidth) =>
    dimensionCandidates(height).map((candidateHeight) => ({
      width: candidateWidth,
      height: candidateHeight,
      score: Math.abs(candidateWidth - width) + Math.abs(candidateHeight - height),
    })))
    .filter((candidate) => {
      const pixels = candidate.width * candidate.height
      const ratio = Math.max(candidate.width, candidate.height) / Math.min(candidate.width, candidate.height)
      return candidate.width % 16 === 0 && candidate.height % 16 === 0 &&
        pixels >= 655_360 && pixels <= 8_294_400 && ratio <= 3
    })
    // Equal-distance candidates prefer the larger provider canvas so the
    // deterministic normalization pass can crop/downsample instead of asking
    // generated media to invent pixels while restoring the confirmed frame.
    .sort((left, right) => left.score - right.score || right.width - left.width || right.height - left.height)
  const selected = candidates[0]
  if (!selected) throw invalid('Confirmed frame cannot be normalized to a documented GPT Image 2 custom request size.')
  return `${selected.width}x${selected.height}`
}

export function compileVideoCapabilityEnvelope(
  shotSpec: MotionStudioGenerationShotSpecV1,
  providerRoute: Extract<MotionStudioGenerationProviderRoute, 'gemini_omni_flash' | 'wan' | 'hailuo' | 'veo'>,
): MotionStudioVideoCapabilityEnvelopeV1 {
  assertValidShotSpec(shotSpec)
  if (shotSpec.mediaKind !== 'video_clip' || shotSpec.output.videoFormat !== 'mp4') {
    throw invalid('Video capability compilation requires a registered MP4 ShotSpec.')
  }
  const referenceRoles = new Set(shotSpec.references.map((reference) => reference.role))
  const generationMode = referenceRoles.has('first_frame') || referenceRoles.has('composition')
    ? 'image_to_video'
    : shotSpec.references.length > 0 ? 'reference_to_video' : 'text_to_video'
  return {
    schemaVersion: 'motion-studio-video-capability-envelope-v1',
    providerRoute,
    shotSpecDigest: sha256CanonicalJson(shotSpec),
    generationMode,
    width: shotSpec.timingAuthority.width,
    height: shotSpec.timingAuthority.height,
    durationFrames: shotSpec.sceneRange.endFrame - shotSpec.sceneRange.startFrame,
    frameRate: shotSpec.timingAuthority.frameRate,
    references: shotSpec.references,
    narrativePurpose: shotSpec.semanticPurpose,
    visualDirection: shotSpec.visualDirection,
    primaryAction: shotSpec.primaryAction,
    cameraBehavior: shotSpec.cameraBehavior,
    exclusions: shotSpec.exclusions,
    deterministicOverlayPolicy: shotSpec.deterministicOverlayPolicy,
    executionPolicy: {
      adapterId: MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID,
      externalNetworkAllowed: false,
      outputIsProviderGenerated: false,
    },
  }
}

export function parseGptImage2SimulatorResponse(value: unknown): ParsedSimulatorImageResponse {
  if (!isRecord(value) || !Array.isArray(value.data) || value.data.length !== 1) {
    throw invalid('Simulator image response requires exactly one data item.')
  }
  const item = value.data[0]
  if (!isRecord(item) || typeof item.b64_json !== 'string' || item.b64_json.length < 16 || item.b64_json.length > 32_000_000) {
    throw invalid('Simulator image response contains invalid bounded base64 data.')
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(item.b64_json)) {
    throw invalid('Simulator image response base64 is malformed.')
  }
  const bytes = Buffer.from(item.b64_json, 'base64')
  if (bytes.length < 8 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw invalid('Simulator image response is not a PNG.')
  }
  return {
    bytes,
    responseDigest: sha256CanonicalJson({ data: [{ byteLength: bytes.length }] }),
    providerCostIncurred: false,
  }
}

export const GPT_IMAGE_2_ADAPTER_EVIDENCE = {
  modelId: MOTION_STUDIO_GPT_IMAGE_MODEL_ID,
  snapshot: MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT,
  officialModelPage: 'https://developers.openai.com/api/docs/models/gpt-image-2',
  officialGuide: 'https://developers.openai.com/api/docs/guides/image-generation',
  verifiedAt: '2026-07-15',
  realTransportEnabled: false,
} as const

export const GEMINI_OMNI_FLASH_ADAPTER_EVIDENCE = {
  modelId: MOTION_STUDIO_GEMINI_OMNI_MODEL_ID,
  providerRoute: 'gemini_omni_flash',
  officialGuide: 'https://ai.google.dev/gemini-api/docs/omni',
  officialVideoGuide: 'https://ai.google.dev/gemini-api/docs/video',
  apiSurface: 'Gemini Interactions API',
  previewModel: true,
  verifiedAt: '2026-07-16',
  realTransportEnabled: false,
} as const

function compileProviderPrompt(shotSpec: MotionStudioGenerationShotSpecV1): string {
  const references = shotSpec.references.length
    ? shotSpec.references.map((reference) => `${reference.role}: ${reference.instruction}`).join('\n')
    : 'No external references; follow the approved visual direction only.'
  return [
    'NARRATIVE PURPOSE', shotSpec.semanticPurpose,
    'VISUAL DIRECTION', shotSpec.visualDirection,
    'PRIMARY ACTION', shotSpec.primaryAction,
    'CAMERA', shotSpec.cameraBehavior,
    'REFERENCE ROLES', references,
    'EXCLUSIONS', shotSpec.exclusions.join('\n'),
    'COMPOSITION BOUNDARY', 'Create one asset only. ReeditPro/Remotion owns exact text, data, captions, logos, timing, overlays, and final canvas composition.',
  ].join('\n')
}

function assertValidShotSpec(value: MotionStudioGenerationShotSpecV1): void {
  const validation = validateMotionStudioGenerationShotSpec(value)
  if (!validation.ok) throw invalid('Generation ShotSpec is invalid.', validation.errors)
}

function invalid(message: string, errors: readonly string[] = []): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, errors.length ? { errors } : undefined)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
