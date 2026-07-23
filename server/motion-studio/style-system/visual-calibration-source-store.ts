import { z } from 'zod'

import {
  motionStudioReferenceContractSchema,
  motionStudioVersionReferenceSchema,
  storytellingStoryContinuityGrammarSchema,
  styleCalibrationScenarioSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioVersionReference,
  ReferenceContract,
  StorytellingStoryContinuityGrammar,
  StyleCalibrationScenario,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { findApprovedSnapshotSecretLikePaths } from '../../services/approved-snapshot-validation'
import { readCanonicalPrivateGeneratedMedia } from '../../services/canonical-private-generated-media-storage'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { verifyStorytellingStoryContinuityGrammarDigest } from './story-continuity-grammar'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export const MOTION_STUDIO_VISUAL_CALIBRATION_SOURCE_RECORD_VERSION =
  'motion-studio.visual-calibration-source-record.v2' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_SOURCE_CONTEXT_VERSION = 1 as const

const MAX_RECORD_BYTES = 512 * 1024
const MAX_FRAME_BYTES = 8 * 1024 * 1024
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const privateFrameSourceSchema = z.object({
  role: z.enum(['first_frame', 'last_frame']),
  assetId: stableIdSchema,
  assetVersionId: stableIdSchema,
  sourceKind: z.enum([
    'protocol_simulator_fixture',
    'live_provider_ingest',
    'private_deterministic_render',
  ]),
  privateObjectIdentityHash: digestSchema,
  mimeType: z.literal('image/png'),
  byteLength: z.number().int().min(67).max(MAX_FRAME_BYTES),
  sha256: digestSchema,
  width: z.literal(1_280),
  height: z.literal(720),
  provenanceDigest: digestSchema,
  qaEvidenceDigest: digestSchema,
  frameAuthorityDigest: digestSchema,
}).strict().superRefine((frame, context) => {
  const unsigned = { ...frame } as Record<string, unknown>
  delete unsigned.frameAuthorityDigest
  if (sha256CanonicalJson(unsigned) !== frame.frameAuthorityDigest) {
    context.addIssue({
      code: 'custom',
      path: ['frameAuthorityDigest'],
      message: 'Private calibration frame authority digest verification failed.',
    })
  }
})

const visualCalibrationContextSchema = z.object({
  motionStudioProductionId: stableIdSchema,
  storytellingStyleAuthorityRefDigest: digestSchema,
  storytellingProductionAuthorityRefDigest: digestSchema,
  styleCalibrationPlanId: stableIdSchema,
  styleCalibrationPlanVersion: z.literal(
    MOTION_STUDIO_VISUAL_CALIBRATION_SOURCE_CONTEXT_VERSION,
  ),
  styleCalibrationPlanDigest: digestSchema,
  calibrationScenarioId: stableIdSchema,
  calibrationScenarioDigest: digestSchema,
  referenceContractId: stableIdSchema,
  referenceContractVersion: z.number().int().positive().max(1_000_000),
  referenceContractDigest: digestSchema,
  firstFrameAssetId: stableIdSchema,
  firstFrameSha256: digestSchema,
  lastFrameAssetId: stableIdSchema,
  lastFrameSha256: digestSchema,
  continuityContractId: stableIdSchema,
  continuityContractVersion: z.number().int().positive().max(1_000_000),
  continuityContractDigest: digestSchema,
}).strict()

const visualCalibrationSourceRecordSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_VISUAL_CALIBRATION_SOURCE_RECORD_VERSION,
  ),
  sourceAuthority: z.literal(
    'motion_studio_source_reverified_visual_calibration_inputs',
  ),
  evidenceClass: z.enum([
    'canonical_motion_repository_unreleased',
    'controlled_repository_fixture',
  ]),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  sourcePlanReviewInputDigest: digestSchema,
  canonicalStyleComponentDigest: digestSchema,
  approvedStyleSelectionDigest: digestSchema,
  approvedCalibrationPlanId: stableIdSchema,
  approvedCalibrationPlanDigest: digestSchema,
  sourceSelectionDigest: digestSchema,
  scenario: styleCalibrationScenarioSchema,
  scenarioDigest: digestSchema,
  referenceContractVersion: motionStudioVersionReferenceSchema,
  referenceContract: motionStudioReferenceContractSchema,
  referenceContractPayloadDigest: digestSchema,
  referenceContractArtifactPayloadDigest: digestSchema,
  firstFrame: privateFrameSourceSchema,
  lastFrame: privateFrameSourceSchema,
  continuityMotionDnaVersion: motionStudioVersionReferenceSchema,
  continuityMotionDnaArtifactPayloadDigest: digestSchema,
  continuityGrammar: storytellingStoryContinuityGrammarSchema,
  visualCalibrationContext: visualCalibrationContextSchema,
  visualCalibrationContextDigest: digestSchema,
  sourceRepositoryReverified: z.literal(true),
  privateFrameBytesReverified: z.literal(true),
  privateLocalOnly: z.literal(true),
  createOnly: z.literal(true),
  browserReadable: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  technicalQaCompleted: z.literal(false),
  creativeReviewCompleted: z.literal(false),
  routingSelectionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  productionReady: z.literal(false),
  recordDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((record, context) => {
  const scenarioReference = record.scenario.referenceContractVersions.find(
    (version) => version.versionId === record.referenceContractVersion.versionId,
  )
  const grammarReferences = record.continuityGrammar.referenceContractVersions
  const grammarReference = grammarReferences.find((version) =>
    version.versionId === record.referenceContractVersion.versionId)
  const expectedContext = visualCalibrationContextFromRecord(record)
  const unsigned = { ...record } as Record<string, unknown>
  delete unsigned.recordDigest
  if (
    record.scenarioDigest !== sha256CanonicalJson(record.scenario) ||
    !scenarioReference ||
    sha256CanonicalJson(scenarioReference) !==
      sha256CanonicalJson(record.referenceContractVersion) ||
    !grammarReference ||
    sha256CanonicalJson(grammarReference) !==
      sha256CanonicalJson(record.referenceContractVersion) ||
    record.referenceContract.id !== record.referenceContractVersion.artifactId ||
    record.referenceContract.productionId !== record.productionId ||
    record.referenceContract.workspaceId !== record.workspaceId ||
    record.referenceContract.projectId !== record.projectId ||
    record.referenceContract.editSessionId !== record.editSessionId ||
    record.referenceContractPayloadDigest !==
      sha256CanonicalJson(record.referenceContract) ||
    record.referenceContractArtifactPayloadDigest !==
      record.referenceContractVersion.contentDigest ||
    record.firstFrame.frameAuthorityDigest !==
      sha256CanonicalJson(withoutKey(record.firstFrame, 'frameAuthorityDigest')) ||
    record.lastFrame.frameAuthorityDigest !==
      sha256CanonicalJson(withoutKey(record.lastFrame, 'frameAuthorityDigest')) ||
    record.firstFrame.role !== 'first_frame' ||
    record.lastFrame.role !== 'last_frame' ||
    record.continuityGrammar.workspaceId !== record.workspaceId ||
    record.continuityGrammar.projectId !== record.projectId ||
    record.continuityGrammar.editSessionId !== record.editSessionId ||
    record.continuityGrammar.productionId !== record.productionId ||
    record.continuityGrammar.grammarDigest !==
      record.visualCalibrationContext.continuityContractDigest ||
    record.continuityMotionDnaVersion.artifactId !==
      record.visualCalibrationContext.continuityContractId ||
    record.continuityMotionDnaVersion.versionNumber !==
      record.visualCalibrationContext.continuityContractVersion ||
    record.continuityMotionDnaArtifactPayloadDigest !==
      record.continuityMotionDnaVersion.contentDigest ||
    record.visualCalibrationContextDigest !==
      sha256AuthorityValue(record.visualCalibrationContext) ||
    sha256CanonicalJson(expectedContext) !==
      sha256CanonicalJson(record.visualCalibrationContext) ||
    sha256CanonicalJson(unsigned) !== record.recordDigest
  ) {
    context.addIssue({
      code: 'custom',
      message:
        'Visual-calibration source record failed exact plan, reference, frame, continuity, or digest reconciliation.',
    })
  }
})

export type MotionStudioVisualCalibrationContext = z.infer<
  typeof visualCalibrationContextSchema
>
export type MotionStudioVisualCalibrationSourceRecord = z.infer<
  typeof visualCalibrationSourceRecordSchema
>

export interface MotionStudioPrivateCalibrationFrameSource {
  role: 'first_frame' | 'last_frame'
  assetId: string
  assetVersionId: string
  sourceKind:
    | 'protocol_simulator_fixture'
    | 'live_provider_ingest'
    | 'private_deterministic_render'
  privateObjectIdentityHash: string
  mimeType: 'image/png'
  byteLength: number
  sha256: string
  width: 1_280
  height: 720
  provenanceDigest: string
  qaEvidenceDigest: string
  frameAuthorityDigest: string
}

export interface MotionStudioVisualCalibrationSourceBundle {
  sourceReadbackEvidenceClass:
    | 'canonical_motion_repository_unreleased'
    | 'controlled_repository_fixture'
  sourceSelectionDigest: string
  storytellingProductionAuthorityRefDigest: string
  referenceContractVersion: MotionStudioVersionReference
  referenceContract: ReferenceContract
  referenceContractArtifactPayloadDigest: string
  firstFrame: MotionStudioPrivateCalibrationFrameSource
  lastFrame: MotionStudioPrivateCalibrationFrameSource
  continuityMotionDnaVersion: MotionStudioVersionReference
  continuityMotionDnaArtifactPayloadDigest: string
  continuityGrammar: StorytellingStoryContinuityGrammar
}

/**
 * Server-owned reader for the already accepted Motion artifacts. The store
 * chooses the scenario from the approved plan and never accepts caller-picked
 * routes, provider names, frame bytes, or continuity identities.
 */
export interface MotionStudioVisualCalibrationSourceReaderPort {
  readScenarioSources(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    scenario: StyleCalibrationScenario
  }): Promise<MotionStudioVisualCalibrationSourceBundle>
}

export interface MotionStudioVisualCalibrationSourceStore {
  persist(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    scenarioId: string
  }): Promise<{
    record: MotionStudioVisualCalibrationSourceRecord
    context: MotionStudioVisualCalibrationContext
    created: boolean
  }>
  read(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    // Provider work carries a broader numeric context version. Parse the
    // untrusted projection back through this store's literal-v1 schema before
    // it can select a private source record.
    visualCalibrationContext: unknown
  }): Promise<MotionStudioVisualCalibrationSourceRecord>
}

/**
 * Archives one bounded, content-addressed set of provider-calibration inputs.
 * It is not a plan, approval, queue, provider, asset, or review authority.
 */
export function createMotionStudioVisualCalibrationSourceStore(input: {
  localStorageRoot: string
  sourceReader: MotionStudioVisualCalibrationSourceReaderPort
}): MotionStudioVisualCalibrationSourceStore {
  return {
    async persist(value) {
      assertCanonicalApprovedStorytellingStylePlanSource(
        value.approvedPlanSource,
      )
      const scenario = generatedScenario(
        value.approvedPlanSource,
        stableIdSchema.parse(value.scenarioId),
      )
      const sources = await input.sourceReader.readScenarioSources({
        approvedPlanSource: value.approvedPlanSource,
        scenario,
      })
      const record = await createRecord({
        localStorageRoot: input.localStorageRoot,
        approvedPlanSource: value.approvedPlanSource,
        scenario,
        sources,
      })
      const bytes = Buffer.from(`${JSON.stringify(record)}\n`, 'utf8')
      if (bytes.byteLength > MAX_RECORD_BYTES) {
        throw invalid(
          'Visual-calibration source record exceeds its private byte ceiling.',
        )
      }
      const written = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(record.visualCalibrationContextDigest),
        content: bytes,
      })
      const readback = await readAndVerify({
        localStorageRoot: input.localStorageRoot,
        approvedPlanSource: value.approvedPlanSource,
        visualCalibrationContext: record.visualCalibrationContext,
      })
      await assertRepositoryReadback({
        localStorageRoot: input.localStorageRoot,
        sourceReader: input.sourceReader,
        approvedPlanSource: value.approvedPlanSource,
        record: readback,
      })
      if (sha256CanonicalJson(readback) !== sha256CanonicalJson(record)) {
        throw conflict(
          'Visual-calibration source changed during create-only persistence.',
        )
      }
      return {
        record,
        context: record.visualCalibrationContext,
        created: written.created,
      }
    },

    async read(value) {
      assertCanonicalApprovedStorytellingStylePlanSource(
        value.approvedPlanSource,
      )
      const record = await readAndVerify({
        localStorageRoot: input.localStorageRoot,
        approvedPlanSource: value.approvedPlanSource,
        visualCalibrationContext: visualCalibrationContextSchema.parse(
          value.visualCalibrationContext,
        ),
      })
      await assertRepositoryReadback({
        localStorageRoot: input.localStorageRoot,
        sourceReader: input.sourceReader,
        approvedPlanSource: value.approvedPlanSource,
        record,
      })
      return record
    },
  }
}

export function verifyMotionStudioVisualCalibrationSourceRecord(
  value: unknown,
): value is MotionStudioVisualCalibrationSourceRecord {
  return visualCalibrationSourceRecordSchema.safeParse(value).success
}

async function createRecord(input: {
  localStorageRoot: string
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  scenario: StyleCalibrationScenario
  sources: MotionStudioVisualCalibrationSourceBundle
}): Promise<MotionStudioVisualCalibrationSourceRecord> {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const referenceContractVersion = motionStudioVersionReferenceSchema.parse(
    input.sources.referenceContractVersion,
  )
  const referenceContract = motionStudioReferenceContractSchema.parse(
    input.sources.referenceContract,
  )
  const firstFrame = privateFrameSourceSchema.parse(input.sources.firstFrame)
  const lastFrame = privateFrameSourceSchema.parse(input.sources.lastFrame)
  const continuityMotionDnaVersion = motionStudioVersionReferenceSchema.parse(
    input.sources.continuityMotionDnaVersion,
  )
  const continuityGrammar = storytellingStoryContinuityGrammarSchema.parse(
    input.sources.continuityGrammar,
  )
  assertSourceRelationships({
    approvedPlanSource: input.approvedPlanSource,
    scenario: input.scenario,
    referenceContractVersion,
    referenceContract,
    firstFrame,
    lastFrame,
    continuityMotionDnaVersion,
    continuityGrammar,
  })
  await Promise.all([
    assertFrameReadback(input.localStorageRoot, firstFrame),
    assertFrameReadback(input.localStorageRoot, lastFrame),
  ])
  const visualCalibrationContext: MotionStudioVisualCalibrationContext =
    visualCalibrationContextSchema.parse({
      motionStudioProductionId: plan.productionId,
      storytellingStyleAuthorityRefDigest:
        input.approvedPlanSource.canonicalProjectionDigest,
      storytellingProductionAuthorityRefDigest: digestSchema.parse(
        input.sources.storytellingProductionAuthorityRefDigest,
      ),
      styleCalibrationPlanId: plan.id,
      styleCalibrationPlanVersion:
        MOTION_STUDIO_VISUAL_CALIBRATION_SOURCE_CONTEXT_VERSION,
      styleCalibrationPlanDigest: plan.planDigest,
      calibrationScenarioId: input.scenario.id,
      calibrationScenarioDigest: sha256CanonicalJson(input.scenario),
      referenceContractId: referenceContractVersion.artifactId,
      referenceContractVersion: referenceContractVersion.versionNumber,
      referenceContractDigest: referenceContractVersion.contentDigest,
      firstFrameAssetId: firstFrame.assetId,
      firstFrameSha256: firstFrame.sha256,
      lastFrameAssetId: lastFrame.assetId,
      lastFrameSha256: lastFrame.sha256,
      continuityContractId: continuityMotionDnaVersion.artifactId,
      continuityContractVersion: continuityMotionDnaVersion.versionNumber,
      continuityContractDigest: continuityGrammar.grammarDigest,
    })
  const base = {
    schemaVersion: MOTION_STUDIO_VISUAL_CALIBRATION_SOURCE_RECORD_VERSION,
    sourceAuthority:
      'motion_studio_source_reverified_visual_calibration_inputs' as const,
    evidenceClass: input.sources.sourceReadbackEvidenceClass,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    sourcePlanReviewInputDigest:
      input.approvedPlanSource.sourcePlanReviewInputDigest,
    canonicalStyleComponentDigest:
      input.approvedPlanSource.canonicalProjectionDigest,
    approvedStyleSelectionDigest:
      input.approvedPlanSource.approvedStyleSelection.selectionDigest,
    approvedCalibrationPlanId: plan.id,
    approvedCalibrationPlanDigest: plan.planDigest,
    sourceSelectionDigest: digestSchema.parse(
      input.sources.sourceSelectionDigest,
    ),
    scenario: input.scenario,
    scenarioDigest: sha256CanonicalJson(input.scenario),
    referenceContractVersion,
    referenceContract,
    referenceContractPayloadDigest: sha256CanonicalJson(referenceContract),
    referenceContractArtifactPayloadDigest: digestSchema.parse(
      input.sources.referenceContractArtifactPayloadDigest,
    ),
    firstFrame,
    lastFrame,
    continuityMotionDnaVersion,
    continuityMotionDnaArtifactPayloadDigest: digestSchema.parse(
      input.sources.continuityMotionDnaArtifactPayloadDigest,
    ),
    continuityGrammar,
    visualCalibrationContext,
    visualCalibrationContextDigest:
      sha256AuthorityValue(visualCalibrationContext),
    sourceRepositoryReverified: true as const,
    privateFrameBytesReverified: true as const,
    privateLocalOnly: true as const,
    createOnly: true as const,
    browserReadable: false as const,
    providerExecutionAuthorized: false as const,
    technicalQaCompleted: false as const,
    creativeReviewCompleted: false as const,
    routingSelectionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(base)
  if (secretLikePaths.length > 0) {
    throw invalid(
      'Visual-calibration source record contains secret-like fields or values.',
      { secretLikePaths },
    )
  }
  return deepFreeze(visualCalibrationSourceRecordSchema.parse({
    ...base,
    recordDigest: sha256CanonicalJson(base),
  }))
}

function assertSourceRelationships(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  scenario: StyleCalibrationScenario
  referenceContractVersion: MotionStudioVersionReference
  referenceContract: ReferenceContract
  firstFrame: MotionStudioPrivateCalibrationFrameSource
  lastFrame: MotionStudioPrivateCalibrationFrameSource
  continuityMotionDnaVersion: MotionStudioVersionReference
  continuityGrammar: StorytellingStoryContinuityGrammar
}): void {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const selection = input.approvedPlanSource.approvedStyleSelection
  const exactReference = input.scenario.referenceContractVersions.find(
    (version) => version.versionId === input.referenceContractVersion.versionId,
  )
  const selectedReference = selection.referenceContractVersions.find(
    (version) => version.versionId === input.referenceContractVersion.versionId,
  )
  const grammarReference = input.continuityGrammar.referenceContractVersions
    .find((version) =>
      version.versionId === input.referenceContractVersion.versionId)
  if (
    !input.scenario.requiresGeneratedMedia ||
    input.scenario.deterministicTextDataRequired ||
    !plan.routePolicy.candidates.some((candidate) =>
      candidate.providerRoute === 'gemini_omni_flash') ||
    !exactReference || !selectedReference || !grammarReference ||
    sha256CanonicalJson(exactReference) !==
      sha256CanonicalJson(input.referenceContractVersion) ||
    sha256CanonicalJson(selectedReference) !==
      sha256CanonicalJson(input.referenceContractVersion) ||
    sha256CanonicalJson(grammarReference) !==
      sha256CanonicalJson(input.referenceContractVersion) ||
    input.referenceContract.id !== input.referenceContractVersion.artifactId ||
    input.referenceContract.productionId !== plan.productionId ||
    input.referenceContract.workspaceId !== plan.workspaceId ||
    input.referenceContract.projectId !== plan.projectId ||
    input.referenceContract.editSessionId !== plan.editSessionId ||
    input.firstFrame.assetId === input.lastFrame.assetId ||
    input.firstFrame.assetVersionId === input.lastFrame.assetVersionId ||
    sha256CanonicalJson(input.continuityMotionDnaVersion) !==
      sha256CanonicalJson(plan.motionDnaVersion) ||
    !verifyStorytellingStoryContinuityGrammarDigest(input.continuityGrammar) ||
    input.continuityGrammar.workspaceId !== plan.workspaceId ||
    input.continuityGrammar.projectId !== plan.projectId ||
    input.continuityGrammar.editSessionId !== plan.editSessionId ||
    input.continuityGrammar.productionId !== plan.productionId ||
    sha256CanonicalJson(input.continuityGrammar.styleProfile) !==
      sha256CanonicalJson(plan.styleProfile) ||
    sha256CanonicalJson(input.continuityGrammar.referenceContractVersions) !==
      sha256CanonicalJson([input.referenceContractVersion])
  ) {
    throw conflict(
      'Visual-calibration inputs do not match the exact approved style plan, scenario, reference, frames, or continuity authority.',
    )
  }
}

async function assertFrameReadback(
  localStorageRoot: string,
  frame: MotionStudioPrivateCalibrationFrameSource,
): Promise<void> {
  const stored = await readCanonicalPrivateGeneratedMedia({
    localStorageRoot,
    privateObjectIdentityHash: frame.privateObjectIdentityHash,
    mimeType: frame.mimeType,
  })
  if (
    !stored ||
    stored.sha256 !== frame.sha256 ||
    stored.byteLength !== frame.byteLength ||
    !pngDimensionsMatch(stored.bytes, frame.width, frame.height)
  ) {
    throw notReady(
      `The exact private ${frame.role.replace('_', ' ')} failed checksum, length, or 1280x720 readback.`,
    )
  }
}

async function readAndVerify(input: {
  localStorageRoot: string
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  visualCalibrationContext: MotionStudioVisualCalibrationContext
}): Promise<MotionStudioVisualCalibrationSourceRecord> {
  const context = visualCalibrationContextSchema.parse(
    input.visualCalibrationContext,
  )
  const contextDigest = sha256AuthorityValue(context)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(contextDigest),
  })
  if (!bytes) {
    throw notReady(
      'The exact Motion visual-calibration source record is unavailable.',
    )
  }
  if (bytes.byteLength < 512 || bytes.byteLength > MAX_RECORD_BYTES) {
    throw invalid('Visual-calibration source record has an invalid byte length.')
  }
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Visual-calibration source record is not valid JSON.')
  }
  const parsed = visualCalibrationSourceRecordSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'Visual-calibration source record failed schema or digest verification.',
      { validation: parsed.error.flatten() },
    )
  }
  const record = parsed.data
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const scenario = generatedScenario(
    input.approvedPlanSource,
    context.calibrationScenarioId,
  )
  if (
    record.visualCalibrationContextDigest !== contextDigest ||
    sha256CanonicalJson(record.visualCalibrationContext) !==
      sha256CanonicalJson(context) ||
    record.workspaceId !== plan.workspaceId ||
    record.projectId !== plan.projectId ||
    record.editSessionId !== plan.editSessionId ||
    record.productionId !== plan.productionId ||
    record.approvedSnapshotId !== input.approvedPlanSource.approvedSnapshotId ||
    record.approvedSnapshotDigest !==
      input.approvedPlanSource.approvedSnapshotDigest ||
    record.sourcePlanReviewInputDigest !==
      input.approvedPlanSource.sourcePlanReviewInputDigest ||
    record.canonicalStyleComponentDigest !==
      input.approvedPlanSource.canonicalProjectionDigest ||
    record.approvedStyleSelectionDigest !==
      input.approvedPlanSource.approvedStyleSelection.selectionDigest ||
    record.approvedCalibrationPlanId !== plan.id ||
    record.approvedCalibrationPlanDigest !== plan.planDigest ||
    sha256CanonicalJson(record.scenario) !== sha256CanonicalJson(scenario)
  ) {
    throw conflict(
      'Visual-calibration source record changed its approved snapshot, plan, scenario, or context identity.',
    )
  }
  await Promise.all([
    assertFrameReadback(input.localStorageRoot, record.firstFrame),
    assertFrameReadback(input.localStorageRoot, record.lastFrame),
  ])
  return deepFreeze(record)
}

async function assertRepositoryReadback(input: {
  localStorageRoot: string
  sourceReader: MotionStudioVisualCalibrationSourceReaderPort
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  record: MotionStudioVisualCalibrationSourceRecord
}): Promise<void> {
  const scenario = generatedScenario(
    input.approvedPlanSource,
    input.record.scenario.id,
  )
  const sources = await input.sourceReader.readScenarioSources({
    approvedPlanSource: input.approvedPlanSource,
    scenario,
  })
  const repositoryRecord = await createRecord({
    localStorageRoot: input.localStorageRoot,
    approvedPlanSource: input.approvedPlanSource,
    scenario,
    sources,
  })
  if (
    sha256CanonicalJson(repositoryRecord) !==
      sha256CanonicalJson(input.record)
  ) {
    throw conflict(
      'Visual-calibration source record no longer matches its canonical artifact and media repositories.',
    )
  }
}

function generatedScenario(
  source: CanonicalApprovedStorytellingStylePlanSource,
  scenarioId: string,
): StyleCalibrationScenario {
  const matches = source.approvedCalibrationPlan.scenarios.filter(
    (scenario) => scenario.id === scenarioId,
  )
  if (
    matches.length !== 1 ||
    !matches[0]!.requiresGeneratedMedia ||
    matches[0]!.deterministicTextDataRequired
  ) {
    throw invalid(
      'Visual provider calibration requires one exact approved generated-media scenario.',
    )
  }
  return styleCalibrationScenarioSchema.parse(matches[0])
}

function visualCalibrationContextFromRecord(
  record: z.infer<typeof visualCalibrationSourceRecordSchema>,
): MotionStudioVisualCalibrationContext {
  return visualCalibrationContextSchema.parse({
    motionStudioProductionId: record.productionId,
    storytellingStyleAuthorityRefDigest:
      record.canonicalStyleComponentDigest,
    storytellingProductionAuthorityRefDigest:
      record.visualCalibrationContext.storytellingProductionAuthorityRefDigest,
    styleCalibrationPlanId: record.approvedCalibrationPlanId,
    styleCalibrationPlanVersion:
      MOTION_STUDIO_VISUAL_CALIBRATION_SOURCE_CONTEXT_VERSION,
    styleCalibrationPlanDigest: record.approvedCalibrationPlanDigest,
    calibrationScenarioId: record.scenario.id,
    calibrationScenarioDigest: record.scenarioDigest,
    referenceContractId: record.referenceContractVersion.artifactId,
    referenceContractVersion: record.referenceContractVersion.versionNumber,
    referenceContractDigest: record.referenceContractVersion.contentDigest,
    firstFrameAssetId: record.firstFrame.assetId,
    firstFrameSha256: record.firstFrame.sha256,
    lastFrameAssetId: record.lastFrame.assetId,
    lastFrameSha256: record.lastFrame.sha256,
    continuityContractId: record.continuityMotionDnaVersion.artifactId,
    continuityContractVersion:
      record.continuityMotionDnaVersion.versionNumber,
    continuityContractDigest: record.continuityGrammar.grammarDigest,
  })
}

function pngDimensionsMatch(
  bytes: Buffer,
  width: number,
  height: number,
): boolean {
  return bytes.byteLength >= 24 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ) &&
    bytes.toString('ascii', 12, 16) === 'IHDR' &&
    bytes.readUInt32BE(16) === width &&
    bytes.readUInt32BE(20) === height
}

function relativePath(contextDigest: string): string {
  const digest = digestSchema.parse(contextDigest)
  return [
    'motion-studio',
    'visual-calibration-sources',
    'private-v1',
    digest.slice(0, 2),
    `${digest}.json`,
  ].join('/')
}

function withoutKey<T extends Record<string, unknown>>(
  value: T,
  key: keyof T,
): Record<string, unknown> {
  const copy = { ...value }
  delete copy[key]
  return copy
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(
  message: string,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'motion_studio_visual_calibration_source_readback',
    productionReady: false,
  })
}
