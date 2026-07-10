import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'
import type {
  AutonomousVisualUnderstandingProvider,
  AutonomousVisualUnderstandingResult,
} from './autonomous-edit-planning-service'

const visualResponseSchema = z.object({
  schemaVersion: z.literal('reeditpro-visual-understanding-v1'),
  summary: z.string().trim().min(1).max(4000),
  visibleSubjects: z.array(z.string().trim().min(1).max(300)).max(80),
  visibleObjects: z.array(z.string().trim().min(1).max(300)).max(120),
  screenTextRegions: z.array(z.string().trim().min(1).max(500)).max(80),
  compositionRisks: z.array(z.string().trim().min(1).max(500)).max(80),
  brollOpportunities: z.array(z.string().trim().min(1).max(500)).max(80),
  captionObservations: z.array(z.string().trim().min(1).max(500)).max(80),
  styleObservations: z.array(z.string().trim().min(1).max(500)).max(80),
  frameEvidence: z.array(z.object({
    frameId: z.string().trim().min(1).max(200),
    timeSeconds: z.number().nonnegative().optional(),
    summary: z.string().trim().min(1).max(1200),
    visibleSubjects: z.array(z.string().trim().min(1).max(240)).max(30),
    visibleObjects: z.array(z.string().trim().min(1).max(240)).max(40),
    textLikeRegions: z.array(z.string().trim().min(1).max(400)).max(30),
    safeZones: z.array(z.string().trim().min(1).max(400)).max(30),
    uncertainty: z.array(z.string().trim().min(1).max(400)).max(30),
  }).strict()).min(1).max(8),
  model: z.object({
    modelId: z.string().trim().min(1).max(200),
    modelRevision: z.string().trim().min(1).max(200),
    modelAggregateSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  }).strict(),
  generatedAssetsCreated: z.literal(false),
  publicArtifactsCreated: z.literal(false),
  signedUrlsCreated: z.literal(false),
}).strict()

export interface QwenVisualUnderstandingProviderOptions {
  env?: Record<string, string | undefined>
  authenticatedPost?: (input: {
    url: string
    audience: string
    body: Record<string, unknown>
    timeoutMs: number
  }) => Promise<{ status: number; data: unknown }>
}

const secretLikePattern = /service.?role|api.?key|authorization|bearer\s+|signed.?url|sk-[a-z0-9_-]+/i

export function createQwenVisualUnderstandingProvider(
  options: QwenVisualUnderstandingProviderOptions = {},
): AutonomousVisualUnderstandingProvider {
  const env = options.env ?? process.env
  return {
    async analyze(input): Promise<AutonomousVisualUnderstandingResult> {
      const mode = clean(env.REEDITPRO_QWEN_VISUAL_RUNTIME_MODE)
      const url = clean(env.QWEN_VISUAL_RUNTIME_URL)
      const audience = clean(env.QWEN_VISUAL_RUNTIME_AUDIENCE) ?? url
      if (mode !== 'internal_enabled' || !url || !audience) {
        return blocked('qwen_visual_runtime_not_configured', [
          'Qwen visual runtime requires internal_enabled mode plus a private runtime URL and audience.',
        ])
      }
      if (!/^https:\/\//i.test(url)) {
        return blocked('qwen_visual_runtime_https_required', ['Qwen visual runtime URL must use HTTPS.'])
      }
      if (input.frameArtifacts.length === 0) {
        return blocked('qwen_visual_frames_required', ['No private representative frame artifact was available.'])
      }

      const frames = await Promise.all(input.frameArtifacts.slice(0, 8).map(async (frame) => {
        const bytes = await readFile(frame.localFilePath)
        if (bytes.byteLength > 2 * 1024 * 1024) {
          throw new Error(`Private visual frame ${frame.artifactId} exceeds the 2 MiB request limit.`)
        }
        return {
          frameId: frame.artifactId,
          timeSeconds: frame.timeSeconds,
          contentType: 'image/jpeg',
          checksumSha256: frame.checksum ?? createHash('sha256').update(bytes).digest('hex'),
          imageBase64: bytes.toString('base64'),
        }
      }))
      const body = {
        schemaVersion: 'reeditpro-visual-understanding-request-v1',
        requestId: `visual:${input.workspaceId}:${input.projectId}:${input.editSessionId}:${input.mediaAssetId}`,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        mediaAssetId: input.mediaAssetId,
        task: {
          useCase: input.analysisRole,
          outputMode: 'structured_metadata_only',
          analysisCategories: [
            'visible_subjects',
            'visible_objects',
            'screen_text_regions',
            'composition_risks',
            'safe_zones',
            'broll_opportunities',
            'caption_observations',
            'style_observations',
          ],
        },
        frames,
        safety: {
          privateInputOnly: true,
          rawPromptIncluded: false,
          generatedAssetsAllowed: false,
          publicArtifactsAllowed: false,
          signedUrlsAllowed: false,
        },
      }
      const post = options.authenticatedPost ?? authenticatedCloudRunPost
      let response: Awaited<ReturnType<typeof post>>
      try {
        response = await post({
          url,
          audience,
          body,
          timeoutMs: parsePositiveInt(env.QWEN_VISUAL_RUNTIME_TIMEOUT_MS, 180_000, 600_000),
        })
      } catch (error) {
        return blocked('qwen_visual_runtime_request_failed', [safeError(error)])
      }
      if (response.status < 200 || response.status >= 300) {
        return blocked('qwen_visual_runtime_non_success', [`Private visual runtime returned HTTP ${response.status}.`])
      }
      const parsed = visualResponseSchema.safeParse(response.data)
      if (!parsed.success) {
        return blocked('qwen_visual_runtime_invalid_response', parsed.error.issues.map((issue) => `${issue.path.join('.') || 'response'}: ${issue.message}`))
      }
      if (containsSecretLikeValue(parsed.data)) {
        return blocked('qwen_visual_runtime_unsafe_response', ['Structured visual response contained secret-like or signed-URL text.'])
      }
      if (
        parsed.data.model.modelId !== 'Qwen/Qwen2.5-VL-7B-Instruct' ||
        parsed.data.model.modelRevision !== 'cc594898137f460bfe9f0759e9844b3ce807cfb5' ||
        parsed.data.model.modelAggregateSha256 !== '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b'
      ) {
        return blocked('qwen_visual_runtime_model_policy_mismatch', ['Structured visual response did not match the approved model revision and aggregate checksum.'])
      }
      const returnedFrameIds = new Set(parsed.data.frameEvidence.map((frame) => frame.frameId))
      const inputFrameIds = frames.map((frame) => frame.frameId)
      if (inputFrameIds.some((frameId) => !returnedFrameIds.has(frameId))) {
        return blocked('qwen_visual_runtime_incomplete_frame_evidence', ['Structured visual response omitted one or more submitted frame IDs.'])
      }

      return {
        status: 'completed',
        summary: parsed.data.summary,
        visibleSubjects: parsed.data.visibleSubjects,
        visibleObjects: parsed.data.visibleObjects,
        screenTextRegions: parsed.data.screenTextRegions,
        compositionRisks: parsed.data.compositionRisks,
        brollOpportunities: parsed.data.brollOpportunities,
        captionObservations: parsed.data.captionObservations,
        styleObservations: parsed.data.styleObservations,
        frameEvidence: parsed.data.frameEvidence.map((frame) => ({
          frameId: frame.frameId,
          timeSeconds: frame.timeSeconds,
          summary: frame.summary,
          safeZones: frame.safeZones,
          uncertainty: frame.uncertainty,
        })),
        evidenceArtifactIds: inputFrameIds,
        blockers: [],
        warnings: [
          `Structured private visual evidence was accepted from ${parsed.data.model.modelId} at revision ${parsed.data.model.modelRevision}.`,
          'No raw prompt, generated asset, public artifact, or signed URL was included in the visual request.',
        ],
      }
    },
  }
}

async function authenticatedCloudRunPost(input: {
  url: string
  audience: string
  body: Record<string, unknown>
  timeoutMs: number
}): Promise<{ status: number; data: unknown }> {
  const auth = new GoogleAuth()
  const client = await auth.getIdTokenClient(input.audience)
  const response = await client.request<unknown>({
    url: input.url,
    method: 'POST',
    data: input.body,
    timeout: input.timeoutMs,
    headers: {
      'content-type': 'application/json',
      'x-reeditpro-runtime': 'autonomous-source-visual-understanding',
    },
  })
  return { status: response.status, data: response.data }
}

function blocked(code: string, warnings: string[]): AutonomousVisualUnderstandingResult {
  return {
    status: 'blocked',
    visibleSubjects: [],
    visibleObjects: [],
    screenTextRegions: [],
    compositionRisks: [],
    brollOpportunities: [],
    captionObservations: [],
    styleObservations: [],
    frameEvidence: [],
    evidenceArtifactIds: [],
    blockers: [code],
    warnings,
  }
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return secretLikePattern.test(message)
    ? 'Private visual runtime request failed with a redacted error.'
    : message.slice(0, 500)
}

function containsSecretLikeValue(value: unknown): boolean {
  if (typeof value === 'string') return secretLikePattern.test(value)
  if (Array.isArray(value)) return value.some(containsSecretLikeValue)
  if (value && typeof value === 'object') return Object.values(value).some(containsSecretLikeValue)
  return false
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}
