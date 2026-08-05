import { z } from 'zod'
import {
  hashMusicValue,
  musicEvidenceRefSchema,
  musicFrameRangeSchema,
  type CanonicalMusicSkillRequest,
  type MusicEvidenceRef,
  type MusicFrameRange,
} from './music-contracts'

const sceneEvidenceSchema = z.object({
  sceneId: z.string().min(1),
  exactRange: musicFrameRangeSchema,
  storyFunction: z.enum([
    'opening', 'exposition', 'testimony', 'reflection', 'demonstration', 'montage',
    'transition', 'build', 'climax', 'resolution', 'ending', 'unknown',
  ]),
  currentStoryState: z.string().min(1).max(4_000),
  targetStoryState: z.string().min(1).max(4_000),
  importantSpeech: z.boolean(),
  speechDensity: z.number().min(0).max(1),
  naturalAmbienceValue: z.enum(['critical', 'high', 'neutral', 'low', 'unknown']),
  visualPacing: z.enum(['still', 'slow', 'measured', 'active', 'rapid', 'unknown']),
  visualRhythmAnchors: z.array(z.number().int().nonnegative()).max(4_000),
  emotionalPauseRanges: z.array(musicFrameRangeSchema).max(1_000),
  transitionBoundaryIds: z.array(z.string().min(1)).max(128),
}).strict()

const musicContextPayloadSchema = z.object({
  storyPurpose: z.string().min(1).max(4_000),
  audience: z.string().min(1).max(1_000),
  platform: z.string().min(1).max(500),
  scenes: z.array(sceneEvidenceSchema).max(2_000),
  protectedSpeechRanges: z.array(musicFrameRangeSchema).max(4_000),
  sourceMusicArtifactIds: z.array(z.string().min(1)).max(2_000),
  existingSoundPlanArtifactIds: z.array(z.string().min(1)).max(2_000),
  declaredMusicDirection: z.array(z.string().min(1).max(4_000)).max(128),
}).strict()

export type MusicSceneEvidence = z.infer<typeof sceneEvidenceSchema>
export type MusicContextPayload = z.infer<typeof musicContextPayloadSchema>

export interface ResolvedMusicContextEvidence {
  reference: MusicEvidenceRef
  payload: Partial<MusicContextPayload>
  payloadHash: string
  resolverEvidence: string[]
}

export interface MusicContextArtifactResolver {
  resolve(reference: MusicEvidenceRef): Promise<ResolvedMusicContextEvidence>
}

export interface CanonicalMusicContextPackage {
  schemaVersion: 'canonical-music-context-package-v3'
  requestId: string
  resolutionStatus: 'resolved' | 'reference_only'
  storyPurpose: string
  audience: string
  platform: string
  scenes: MusicSceneEvidence[]
  protectedSpeechRanges: MusicFrameRange[]
  sourceMusicArtifactIds: string[]
  existingSoundPlanArtifactIds: string[]
  declaredMusicDirection: string[]
  resolvedEvidence: Array<{
    evidenceId: string
    evidenceType: string
    version: number
    evidenceHash: string
    payloadHash: string
    evidenceLevel: MusicEvidenceRef['evidenceLevel']
    resolverEvidence: string[]
  }>
  missingEvidenceTypes: string[]
  reviewRequiredFindings: string[]
  packageHash: string
}

function rangesOverlap(left: MusicFrameRange, right: MusicFrameRange): boolean {
  return left.startFrame < right.endFrameExclusive && left.endFrameExclusive > right.startFrame
}

function referenceList(request: CanonicalMusicSkillRequest): MusicEvidenceRef[] {
  const refs = Object.values(request.contextRefs).filter((value): value is MusicEvidenceRef => Boolean(value))
  return [...new Map([...refs, ...request.contextEvidence].map((ref) => [
    `${ref.evidenceId}:${ref.version}:${ref.evidenceHash}`, ref,
  ])).values()]
}

function validateResolved(reference: MusicEvidenceRef, resolved: ResolvedMusicContextEvidence): void {
  musicEvidenceRefSchema.parse(resolved.reference)
  if (resolved.reference.evidenceId !== reference.evidenceId ||
    resolved.reference.version !== reference.version ||
    resolved.reference.evidenceHash !== reference.evidenceHash) {
    throw new Error(`Music context resolver returned stale evidence for ${reference.evidenceId}.`)
  }
  if (resolved.payloadHash !== hashMusicValue(resolved.payload)) {
    throw new Error(`Music context payload hash is stale for ${reference.evidenceId}.`)
  }
}

function referenceOnlyPackage(request: CanonicalMusicSkillRequest, refs: readonly MusicEvidenceRef[]): CanonicalMusicContextPackage {
  const base = {
    schemaVersion: 'canonical-music-context-package-v3' as const,
    requestId: request.requestId,
    resolutionStatus: 'reference_only' as const,
    storyPurpose: 'story_context_unresolved',
    audience: 'audience_context_unresolved',
    platform: 'platform_context_unresolved',
    scenes: [] as MusicSceneEvidence[],
    protectedSpeechRanges: [] as MusicFrameRange[],
    sourceMusicArtifactIds: [] as string[],
    existingSoundPlanArtifactIds: [] as string[],
    declaredMusicDirection: [...request.userMusicPolicy.customDirectives],
    resolvedEvidence: refs.map((ref) => ({
      evidenceId: ref.evidenceId, evidenceType: ref.evidenceType, version: ref.version,
      evidenceHash: ref.evidenceHash, payloadHash: '', evidenceLevel: ref.evidenceLevel,
      resolverEvidence: ['reference_only_not_content_evidence'],
    })),
    missingEvidenceTypes: ['resolved_story', 'resolved_scene_map', 'resolved_speech_ranges'],
    reviewRequiredFindings: ['music_context_content_not_resolved'],
  }
  return { ...base, packageHash: hashMusicValue(base) }
}

export async function resolveCanonicalMusicContext(input: {
  request: CanonicalMusicSkillRequest
  resolver?: MusicContextArtifactResolver
}): Promise<CanonicalMusicContextPackage> {
  const refs = referenceList(input.request)
  if (!input.resolver) return referenceOnlyPackage(input.request, refs)
  const resolved = await Promise.all(refs.map(async (reference) => {
    const value = await input.resolver!.resolve(reference)
    validateResolved(reference, value)
    return value
  }))
  const payloads = resolved.map((item) => musicContextPayloadSchema.partial().parse(item.payload))
  const scenes = payloads.flatMap((payload) => payload.scenes ?? [])
    .filter((scene) => input.request.scopeAuthority.authorizedInspectRanges.some((range) => rangesOverlap(scene.exactRange, range)))
    .sort((left, right) => left.exactRange.startFrame - right.exactRange.startFrame || left.sceneId.localeCompare(right.sceneId))
  const uniqueScenes = [...new Map(scenes.map((scene) => [scene.sceneId, scene])).values()]
  const protectedSpeechRanges = [...new Map(payloads.flatMap((payload) => payload.protectedSpeechRanges ?? [])
    .map((range) => [`${range.rangeId}:${range.startFrame}:${range.endFrameExclusive}`, range])).values()]
  const first = <K extends 'storyPurpose' | 'audience' | 'platform'>(key: K, fallback: string): string =>
    payloads.find((payload) => typeof payload[key] === 'string')?.[key] as string | undefined ?? fallback
  const missingEvidenceTypes = [
    ...(first('storyPurpose', '') ? [] : ['resolved_story']),
    ...(uniqueScenes.length > 0 ? [] : ['resolved_scene_map']),
    ...(protectedSpeechRanges.length > 0 ? [] : ['resolved_speech_ranges']),
  ]
  const base = {
    schemaVersion: 'canonical-music-context-package-v3' as const,
    requestId: input.request.requestId,
    resolutionStatus: 'resolved' as const,
    storyPurpose: first('storyPurpose', 'story_purpose_requires_review'),
    audience: first('audience', 'audience_requires_review'),
    platform: first('platform', 'platform_requires_review'),
    scenes: uniqueScenes,
    protectedSpeechRanges,
    sourceMusicArtifactIds: [...new Set(payloads.flatMap((payload) => payload.sourceMusicArtifactIds ?? []))],
    existingSoundPlanArtifactIds: [...new Set(payloads.flatMap((payload) => payload.existingSoundPlanArtifactIds ?? []))],
    declaredMusicDirection: [...new Set([
      ...input.request.userMusicPolicy.customDirectives,
      ...payloads.flatMap((payload) => payload.declaredMusicDirection ?? []),
    ])],
    resolvedEvidence: resolved.map((item) => ({
      evidenceId: item.reference.evidenceId, evidenceType: item.reference.evidenceType,
      version: item.reference.version, evidenceHash: item.reference.evidenceHash,
      payloadHash: item.payloadHash, evidenceLevel: item.reference.evidenceLevel,
      resolverEvidence: [...item.resolverEvidence],
    })),
    missingEvidenceTypes,
    reviewRequiredFindings: missingEvidenceTypes.map((value) => `${value}_missing`),
  }
  return { ...base, packageHash: hashMusicValue(base) }
}

export class InMemoryMusicContextArtifactResolver implements MusicContextArtifactResolver {
  readonly #values = new Map<string, ResolvedMusicContextEvidence>()

  register(reference: MusicEvidenceRef, payload: Partial<MusicContextPayload>, resolverEvidence = ['verified_fixture_context']): void {
    this.#values.set(`${reference.evidenceId}:${reference.version}:${reference.evidenceHash}`, {
      reference: structuredClone(reference), payload: structuredClone(payload),
      payloadHash: hashMusicValue(payload), resolverEvidence: [...resolverEvidence],
    })
  }

  async resolve(reference: MusicEvidenceRef): Promise<ResolvedMusicContextEvidence> {
    const value = this.#values.get(`${reference.evidenceId}:${reference.version}:${reference.evidenceHash}`)
    if (!value) throw new Error(`Music context evidence ${reference.evidenceId} is not available in the approved resolver.`)
    return structuredClone(value)
  }
}
