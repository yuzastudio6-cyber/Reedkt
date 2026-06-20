import {
  createHash,
} from 'node:crypto'
import type {
  SyntheticFixtureDefinition,
  SyntheticFixturePlan,
} from './synthetic-fixture-plan-types'
import type {
  SyntheticFixtureDryRunArtifact,
  SyntheticFixtureDryRunPayloadJson,
  SyntheticFixtureDryRunPayloadKind,
  SyntheticFixtureDryRunResult,
} from './synthetic-fixture-dry-run-types'
import {
  validateSyntheticFixtureDryRunResult,
} from './synthetic-fixture-dry-run-validator'

type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue }

function sanitizeId(value: string): string {
  return value.replace(/[^a-z0-9_]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase()
}

function sortJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue)
  }
  if (typeof value === 'object') {
    const sortedEntries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)] as const)
    return Object.fromEntries(sortedEntries) as { readonly [key: string]: JsonValue }
  }

  return null
}

export function stableSyntheticFixtureDryRunJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value))
}

function checksumForPayload(payload: SyntheticFixtureDryRunPayloadJson): { checksum: string, sizeBytes: number } {
  const stablePayload = stableSyntheticFixtureDryRunJsonStringify(payload)
  return {
    checksum: createHash('sha256').update(stablePayload).digest('hex'),
    sizeBytes: Buffer.byteLength(stablePayload, 'utf8'),
  }
}

function payloadKindForFixture(definition: SyntheticFixtureDefinition): SyntheticFixtureDryRunPayloadKind {
  if (definition.fixtureKind === 'synthetic_timeline') return 'timeline_json'
  if (definition.fixtureKind === 'synthetic_caption_segments') return 'caption_segments_json'
  if (definition.fixtureKind === 'synthetic_mask') return 'mask_descriptor_json'
  if (definition.fixtureKind === 'synthetic_render_manifest') return 'render_manifest_json'
  if (definition.fixtureId === 'tiny_final_delivery_manifest') return 'final_delivery_manifest_json'
  if (definition.expectedSignals.includes('word_timestamps_shape')) return 'transcript_json'

  return 'descriptor_json'
}

function numericLimit(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function buildDescriptorPayload(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunPayloadJson {
  const common = {
    fixtureId: definition.fixtureId,
    commandIntentId: fixturePlan.commandIntentId,
    operationId: fixturePlan.operationId,
    syntheticOnly: true,
    mediaGenerated: false,
    expectedSignals: [...definition.expectedSignals].sort(),
  }

  if (definition.fixtureKind === 'synthetic_video') {
    return {
      ...common,
      kind: 'synthetic_video_descriptor',
      durationSeconds: numericLimit(definition.maxDurationSeconds, 3),
      width: numericLimit(definition.maxWidth, 320),
      height: numericLimit(definition.maxHeight, 180),
      frameCount: numericLimit(definition.maxFrameCount, 90),
      framePattern: 'deterministic_color_blocks',
    }
  }

  if (definition.fixtureKind === 'synthetic_audio') {
    return {
      ...common,
      kind: 'synthetic_audio_descriptor',
      durationSeconds: numericLimit(definition.maxDurationSeconds, 3),
      sampleRateHz: 16000,
      channelCount: 1,
      signalPattern: 'deterministic_tone_placeholder',
    }
  }

  if (definition.fixtureKind === 'synthetic_image') {
    return {
      ...common,
      kind: 'synthetic_image_descriptor',
      width: numericLimit(definition.maxWidth, 320),
      height: numericLimit(definition.maxHeight, 180),
      regions: [
        {
          regionId: 'center_safe_region',
          x: 80,
          y: 45,
          width: 160,
          height: 90,
        },
      ],
      imagePattern: 'checkerboard_blocks',
    }
  }

  return {
    ...common,
    kind: 'synthetic_json_descriptor',
    objectCount: 1,
    maxBytes: numericLimit(definition.maxBytes, 100000),
  }
}

function buildTimelinePayload(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunPayloadJson {
  return {
    kind: 'synthetic_timeline',
    fixtureId: definition.fixtureId,
    commandIntentId: fixturePlan.commandIntentId,
    operationId: fixturePlan.operationId,
    clips: [
      {
        clipId: 'clip_a',
        startSeconds: 0,
        endSeconds: 1.5,
      },
      {
        clipId: 'clip_b',
        startSeconds: 1.5,
        endSeconds: 3,
      },
    ],
    nonOverlapping: true,
    syntheticOnly: true,
    mediaGenerated: false,
    expectedSignals: [...definition.expectedSignals].sort(),
  }
}

function buildTranscriptPayload(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunPayloadJson {
  return {
    kind: 'synthetic_transcript',
    fixtureId: definition.fixtureId,
    commandIntentId: fixturePlan.commandIntentId,
    operationId: fixturePlan.operationId,
    languageCode: 'en',
    words: [
      {
        wordId: 'word_1',
        text: 'Synthetic',
        startSeconds: 0,
        endSeconds: 0.6,
      },
      {
        wordId: 'word_2',
        text: 'caption',
        startSeconds: 0.6,
        endSeconds: 1.2,
      },
    ],
    syntheticOnly: true,
    mediaGenerated: false,
    expectedSignals: [...definition.expectedSignals].sort(),
  }
}

function buildCaptionSegmentsPayload(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunPayloadJson {
  return {
    kind: 'synthetic_caption_segments',
    fixtureId: definition.fixtureId,
    commandIntentId: fixturePlan.commandIntentId,
    operationId: fixturePlan.operationId,
    segments: [
      {
        segmentId: 'caption_1',
        text: 'Synthetic caption one',
        startSeconds: 0,
        endSeconds: 1.2,
      },
      {
        segmentId: 'caption_2',
        text: 'Synthetic caption two',
        startSeconds: 1.2,
        endSeconds: 2.4,
      },
    ],
    syntheticOnly: true,
    mediaGenerated: false,
    expectedSignals: [...definition.expectedSignals].sort(),
  }
}

function buildMaskPayload(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunPayloadJson {
  return {
    kind: 'synthetic_mask_descriptor',
    fixtureId: definition.fixtureId,
    commandIntentId: fixturePlan.commandIntentId,
    operationId: fixturePlan.operationId,
    width: numericLimit(definition.maxWidth, 320),
    height: numericLimit(definition.maxHeight, 180),
    binaryShapes: [
      {
        shapeId: 'center_square',
        x: 100,
        y: 50,
        width: 120,
        height: 80,
        value: 1,
      },
    ],
    syntheticOnly: true,
    mediaGenerated: false,
    expectedSignals: [...definition.expectedSignals].sort(),
  }
}

function buildRenderManifestPayload(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunPayloadJson {
  return {
    kind: 'synthetic_render_manifest',
    fixtureId: definition.fixtureId,
    commandIntentId: fixturePlan.commandIntentId,
    operationId: fixturePlan.operationId,
    durationSeconds: 3,
    layers: [
      {
        layerId: 'background',
        startSeconds: 0,
        endSeconds: 3,
      },
      {
        layerId: 'caption_overlay',
        startSeconds: 0.5,
        endSeconds: 2.5,
      },
    ],
    syntheticOnly: true,
    mediaGenerated: false,
    expectedSignals: [...definition.expectedSignals].sort(),
  }
}

function buildFinalDeliveryPayload(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunPayloadJson {
  return {
    kind: 'synthetic_final_delivery_manifest',
    fixtureId: definition.fixtureId,
    commandIntentId: fixturePlan.commandIntentId,
    operationId: fixturePlan.operationId,
    checks: [
      {
        checkId: 'duration_sync',
        expected: true,
      },
      {
        checkId: 'codec_profile_known',
        expected: true,
      },
    ],
    syntheticOnly: true,
    mediaGenerated: false,
    expectedSignals: [...definition.expectedSignals].sort(),
  }
}

function payloadForDefinition(
  definition: SyntheticFixtureDefinition,
  fixturePlan: SyntheticFixturePlan,
): { payloadKind: SyntheticFixtureDryRunPayloadKind, payloadJson: SyntheticFixtureDryRunPayloadJson } {
  const payloadKind = payloadKindForFixture(definition)

  if (payloadKind === 'timeline_json') {
    return { payloadKind, payloadJson: buildTimelinePayload(definition, fixturePlan) }
  }
  if (payloadKind === 'transcript_json') {
    return { payloadKind, payloadJson: buildTranscriptPayload(definition, fixturePlan) }
  }
  if (payloadKind === 'caption_segments_json') {
    return { payloadKind, payloadJson: buildCaptionSegmentsPayload(definition, fixturePlan) }
  }
  if (payloadKind === 'mask_descriptor_json') {
    return { payloadKind, payloadJson: buildMaskPayload(definition, fixturePlan) }
  }
  if (payloadKind === 'render_manifest_json') {
    return { payloadKind, payloadJson: buildRenderManifestPayload(definition, fixturePlan) }
  }
  if (payloadKind === 'final_delivery_manifest_json') {
    return { payloadKind, payloadJson: buildFinalDeliveryPayload(definition, fixturePlan) }
  }

  return { payloadKind, payloadJson: buildDescriptorPayload(definition, fixturePlan) }
}

function firstRequired<T>(values: readonly T[], label: string, fixtureId: string): T {
  const value = values[0]
  if (!value) {
    throw new Error(`${fixtureId} is missing required ${label}.`)
  }

  return value
}

export function materializeSyntheticFixtureDryRunArtifact(
  fixturePlan: SyntheticFixturePlan,
  definition: SyntheticFixtureDefinition,
): SyntheticFixtureDryRunArtifact {
  const { payloadKind, payloadJson } = payloadForDefinition(definition, fixturePlan)
  const { checksum, sizeBytes } = checksumForPayload(payloadJson)

  return {
    dryRunArtifactId: `synthetic_fixture_dry_run_artifact_${sanitizeId(fixturePlan.fixturePlanId)}_${sanitizeId(definition.fixtureId)}`,
    fixtureId: definition.fixtureId,
    fixtureKind: definition.fixtureKind,
    artifactType: firstRequired(definition.expectedArtifactTypes, 'artifact type', definition.fixtureId),
    storageBucketPurpose: firstRequired(definition.expectedStorageBucketPurposes, 'storage bucket purpose', definition.fixtureId),
    sourceFixturePlanId: fixturePlan.fixturePlanId,
    sourceCommandPlanId: fixturePlan.sourceCommandPlanId,
    sourceToolId: fixturePlan.toolId,
    sourceOperationId: fixturePlan.operationId,
    sourceCommandIntentId: fixturePlan.commandIntentId,
    payloadKind,
    payloadJson,
    checksum,
    sizeBytes,
    privateByDefault: true,
    sourceOfTruth: true,
    signedUrlAllowed: false,
    localPathAllowed: false,
    binaryMediaGenerated: false,
    toolExecutionPerformed: false,
    mediaProcessingPerformed: false,
    workerExecutionPerformed: false,
  }
}

export function materializeSyntheticFixtureDryRun(
  fixturePlan: SyntheticFixturePlan,
): SyntheticFixtureDryRunResult {
  const artifacts = fixturePlan.fixtureDefinitions
    .map((definition) => materializeSyntheticFixtureDryRunArtifact(fixturePlan, definition))
  const draftResult = {
    dryRunId: `synthetic_fixture_dry_run_${sanitizeId(fixturePlan.fixturePlanId)}`,
    sourceFixturePlanId: fixturePlan.fixturePlanId,
    toolId: fixturePlan.toolId,
    operationId: fixturePlan.operationId,
    commandIntentId: fixturePlan.commandIntentId,
    fixtureIds: fixturePlan.fixtureIds,
    artifacts,
    generatedJsonOnly: true,
    binaryMediaGenerated: false,
    fixtureGenerationPerformed: true,
    toolExecutionPerformed: false,
    shellExecutionPerformed: false,
    mediaProcessingPerformed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    executesTools: false,
  } satisfies Omit<SyntheticFixtureDryRunResult, 'validationSummary'>

  return {
    ...draftResult,
    validationSummary: validateSyntheticFixtureDryRunResult({
      ...draftResult,
      validationSummary: {
        ok: true,
        dryRunResultCount: 1,
        dryRunArtifactCount: artifacts.length,
        forbiddenFieldsFound: [],
        unsafeStringValues: [],
        missingArtifactFields: [],
        invalidPayloadKinds: [],
        pendingExternalToolsUsed: false,
        generatedJsonOnly: true,
        binaryMediaGenerated: false,
        fixtureGenerationPerformed: true,
        toolExecutionPerformed: false,
        shellExecutionPerformed: false,
        mediaProcessingPerformed: false,
        workerExecutionPerformed: false,
        providerCallsPerformed: false,
        supabaseMutationPerformed: false,
        sqlExecuted: false,
        executesTools: false,
      },
    }),
  }
}

export function materializeSyntheticFixtureDryRuns(
  fixturePlans: readonly SyntheticFixturePlan[],
): SyntheticFixtureDryRunResult[] {
  return fixturePlans.map(materializeSyntheticFixtureDryRun)
}
