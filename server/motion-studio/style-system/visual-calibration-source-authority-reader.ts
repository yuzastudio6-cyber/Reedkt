import { z } from 'zod'

import {
  motionStudioMotionDnaSchema,
  motionStudioReferenceContractSchema,
  styleCalibrationScenarioSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  StyleCalibrationScenario,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  createSupabaseMotionStudioCommandRepository,
} from '../commands/repository'
import type {
  MotionStudioArtifactVersionRow,
  MotionStudioCommandRepository,
  MotionStudioProductionRow,
} from '../commands/types'
import {
  createSupabaseMotionStudioGenerationRepository,
} from '../generation/repository'
import type {
  MotionStudioGenerationRepository,
} from '../generation/types'
import {
  ensureAdminClient,
  getRequiredAuthUserId,
} from '../../services/service-helpers'
import {
  readCanonicalPrivateGeneratedMedia,
} from '../../services/canonical-private-generated-media-storage'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  verifyStorytellingStoryContinuityGrammarDigest,
} from './story-continuity-grammar'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'
import type {
  MotionStudioPrivateCalibrationFrameSource,
  MotionStudioVisualCalibrationSourceBundle,
  MotionStudioVisualCalibrationSourceReaderPort,
} from './visual-calibration-source-store'

export const MOTION_STUDIO_VISUAL_CALIBRATION_SELECTION_AUTHORITY_VERSION =
  'motion-studio.visual-calibration-selection-authority.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

export const motionStudioVisualCalibrationSelectionAuthoritySchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_VISUAL_CALIBRATION_SELECTION_AUTHORITY_VERSION,
  ),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  scenarioId: stableIdSchema,
  storytellingProductionAuthorityRefDigest: digestSchema,
  firstFrameAssetVersionId: stableIdSchema,
  lastFrameAssetVersionId: stableIdSchema,
  source: z.enum([
    'canonical_motion_repository_unreleased',
    'controlled_repository_fixture',
  ]),
  callerSuppliedPayloadAllowed: z.literal(false),
  callerSuppliedFrameBytesAllowed: z.literal(false),
  selectionDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.selectionDigest
  if (
    value.firstFrameAssetVersionId === value.lastFrameAssetVersionId ||
    sha256CanonicalJson(unsigned) !== value.selectionDigest
  ) {
    context.addIssue({
      code: 'custom',
      message:
        'Visual-calibration selection authority failed frame or digest reconciliation.',
    })
  }
})

export type MotionStudioVisualCalibrationSelectionAuthority = z.infer<
  typeof motionStudioVisualCalibrationSelectionAuthoritySchema
>

export interface MotionStudioVisualCalibrationSelectionReaderPort {
  read(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    scenarioId: string
  }): Promise<MotionStudioVisualCalibrationSelectionAuthority>
}

export interface MotionStudioVisualCalibrationSourceAuthorityReaderDependencies {
  ownerUserId: string
  localStorageRoot: string
  commandRepository: Pick<
    MotionStudioCommandRepository,
    'findProduction' | 'findArtifactVersion'
  >
  generationRepository: Pick<
    MotionStudioGenerationRepository,
    'findMediaAuthority'
  >
  selectionReader: MotionStudioVisualCalibrationSelectionReaderPort
}

/**
 * Production adapter. Selection is a separate server-owned planning seam; the
 * referenced artifact payloads and private frame bytes are always reopened
 * from their canonical repositories by this reader.
 */
export function createCanonicalMotionStudioVisualCalibrationSourceReader(
  context: ServiceContext,
  selectionReader: MotionStudioVisualCalibrationSelectionReaderPort,
): MotionStudioVisualCalibrationSourceReaderPort {
  const admin = ensureAdminClient(context)
  return createMotionStudioVisualCalibrationSourceAuthorityReader({
    ownerUserId: getRequiredAuthUserId(context),
    localStorageRoot: context.env.localStorageRoot,
    commandRepository: createSupabaseMotionStudioCommandRepository(admin),
    generationRepository: createSupabaseMotionStudioGenerationRepository(
      admin,
    ),
    selectionReader,
  })
}

/**
 * Repository-neutral core used by the production adapter and adversarial
 * tests. It accepts only identity-bearing repository ports, never artifact
 * payloads or frame bytes from the caller.
 */
export function createMotionStudioVisualCalibrationSourceAuthorityReader(
  dependencies: MotionStudioVisualCalibrationSourceAuthorityReaderDependencies,
): MotionStudioVisualCalibrationSourceReaderPort {
  return {
    async readScenarioSources(input) {
      const approvedPlanSource = input.approvedPlanSource
      const plan = approvedPlanSource.approvedCalibrationPlan
      const scenario = styleCalibrationScenarioSchema.parse(input.scenario)
      const production = await dependencies.commandRepository.findProduction(
        plan.productionId,
      )
      assertProductionScope({
        production,
        ownerUserId: dependencies.ownerUserId,
        approvedPlanSource,
      })
      const selection = motionStudioVisualCalibrationSelectionAuthoritySchema
        .parse(await dependencies.selectionReader.read({
          workspaceId: plan.workspaceId,
          projectId: plan.projectId,
          editSessionId: plan.editSessionId,
          productionId: plan.productionId,
          scenarioId: scenario.id,
        }))
      assertSelectionScope({ approvedPlanSource, scenario, selection })

      if (scenario.referenceContractVersions.length !== 1) {
        throw blocked(
          'Visual calibration requires one exact Reference Contract version.',
        )
      }
      const referenceContractVersion = scenario.referenceContractVersions[0]!
      const referenceVersion = await dependencies.commandRepository
        .findArtifactVersion(
          plan.productionId,
          referenceContractVersion.artifactId,
          referenceContractVersion.versionId,
        )
      assertArtifactVersion({
        row: referenceVersion,
        production: production!,
        expectedKind: 'reference_contract',
        expectedVersion: referenceContractVersion,
      })
      const referenceContract = motionStudioReferenceContractSchema.parse(
        referenceVersion!.payload_json.data,
      )

      const motionDnaVersion = plan.motionDnaVersion
      const motionDnaRow = await dependencies.commandRepository
        .findArtifactVersion(
          plan.productionId,
          motionDnaVersion.artifactId,
          motionDnaVersion.versionId,
        )
      assertArtifactVersion({
        row: motionDnaRow,
        production: production!,
        expectedKind: 'motion_dna',
        expectedVersion: motionDnaVersion,
      })
      const motionDna = motionStudioMotionDnaSchema.parse(
        motionDnaRow!.payload_json.data,
      )
      const continuityGrammar = motionDna.storyContinuityGrammar
      if (
        !continuityGrammar ||
        !verifyStorytellingStoryContinuityGrammarDigest(continuityGrammar)
      ) {
        throw blocked(
          'The exact Motion DNA version does not contain a verified Story Continuity Grammar.',
        )
      }

      const [firstFrame, lastFrame] = await Promise.all([
        readFrameAuthority({
          dependencies,
          production: production!,
          role: 'first_frame',
          assetVersionId: selection.firstFrameAssetVersionId,
        }),
        readFrameAuthority({
          dependencies,
          production: production!,
          role: 'last_frame',
          assetVersionId: selection.lastFrameAssetVersionId,
        }),
      ])

      return deepFreeze<MotionStudioVisualCalibrationSourceBundle>({
        sourceReadbackEvidenceClass: selection.source,
        sourceSelectionDigest: selection.selectionDigest,
        storytellingProductionAuthorityRefDigest:
          selection.storytellingProductionAuthorityRefDigest,
        referenceContractVersion,
        referenceContract,
        referenceContractArtifactPayloadDigest: sha256CanonicalJson(
          referenceVersion!.payload_json,
        ),
        firstFrame,
        lastFrame,
        continuityMotionDnaVersion: motionDnaVersion,
        continuityMotionDnaArtifactPayloadDigest: sha256CanonicalJson(
          motionDnaRow!.payload_json,
        ),
        continuityGrammar,
      })
    },
  }
}

function assertProductionScope(input: {
  production: MotionStudioProductionRow | undefined
  ownerUserId: string
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
}): asserts input is {
  production: MotionStudioProductionRow
  ownerUserId: string
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
} {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const production = input.production
  if (
    !production ||
    production.id !== plan.productionId ||
    production.owner_id !== input.ownerUserId ||
    production.workspace_id !== plan.workspaceId ||
    production.project_id !== plan.projectId ||
    production.edit_session_id !== plan.editSessionId ||
    production.module_id !== 'storytelling'
  ) {
    throw blocked(
      'Motion Studio production authority does not match the authenticated approved style plan.',
    )
  }
}

function assertSelectionScope(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  scenario: StyleCalibrationScenario
  selection: MotionStudioVisualCalibrationSelectionAuthority
}): void {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  if (
    input.selection.workspaceId !== plan.workspaceId ||
    input.selection.projectId !== plan.projectId ||
    input.selection.editSessionId !== plan.editSessionId ||
    input.selection.productionId !== plan.productionId ||
    input.selection.scenarioId !== input.scenario.id
  ) {
    throw blocked(
      'Visual-calibration selection does not match the exact approved scenario scope.',
    )
  }
}

function assertArtifactVersion(input: {
  row: MotionStudioArtifactVersionRow | undefined
  production: MotionStudioProductionRow
  expectedKind: 'reference_contract' | 'motion_dna'
  expectedVersion: {
    artifactId: string
    versionId: string
    versionNumber: number
    contentDigest: string
  }
}): asserts input is {
  row: MotionStudioArtifactVersionRow
  production: MotionStudioProductionRow
  expectedKind: 'reference_contract' | 'motion_dna'
  expectedVersion: {
    artifactId: string
    versionId: string
    versionNumber: number
    contentDigest: string
  }
} {
  const row = input.row
  const expectedSchemaVersion =
    `motion-studio.${input.expectedKind.replaceAll('_', '-')}.v1`
  if (
    !row ||
    row.id !== input.expectedVersion.versionId ||
    row.artifact_id !== input.expectedVersion.artifactId ||
    row.version_number !== input.expectedVersion.versionNumber ||
    row.content_digest !== input.expectedVersion.contentDigest ||
    row.kind !== input.expectedKind ||
    row.workspace_id !== input.production.workspace_id ||
    row.project_id !== input.production.project_id ||
    row.edit_session_id !== input.production.edit_session_id ||
    row.production_id !== input.production.id ||
    !['approved', 'locked'].includes(row.state) ||
    row.payload_json.schemaVersion !== expectedSchemaVersion ||
    row.content_digest !== sha256CanonicalJson(row.payload_json) ||
    row.immutable !== true
  ) {
    throw blocked(
      `The exact ${input.expectedKind.replace('_', ' ')} artifact version could not be source-reverified.`,
    )
  }
}

async function readFrameAuthority(input: {
  dependencies: MotionStudioVisualCalibrationSourceAuthorityReaderDependencies
  production: MotionStudioProductionRow
  role: 'first_frame' | 'last_frame'
  assetVersionId: string
}): Promise<MotionStudioPrivateCalibrationFrameSource> {
  const authority = await input.dependencies.generationRepository
    .findMediaAuthority(input.assetVersionId)
  const media = authority?.mediaVersion
  if (
    !authority || !media ||
    authority.production.id !== input.production.id ||
    authority.production.owner_id !== input.dependencies.ownerUserId ||
    authority.production.workspace_id !== input.production.workspace_id ||
    authority.production.project_id !== input.production.project_id ||
    authority.production.edit_session_id !== input.production.edit_session_id ||
    authority.candidate.production_id !== input.production.id ||
    authority.candidate.media_asset_id !== media.asset_id ||
    authority.candidate.media_asset_version_id !== media.id ||
    (authority.source === 'simulator' &&
      authority.candidate.safety_status !== 'passed') ||
    media.id !== input.assetVersionId ||
    media.workspace_id !== input.production.workspace_id ||
    media.project_id !== input.production.project_id ||
    media.edit_session_id !== input.production.edit_session_id ||
    media.media_kind !== 'still_image' ||
    media.mime_type !== 'image/png' ||
    media.width !== 1_280 ||
    media.height !== 720 ||
    media.qa_status !== 'passed'
  ) {
    throw blocked(
      `The selected ${input.role.replace('_', ' ')} is not an exact QA-passed private 1280x720 PNG authority.`,
    )
  }
  const stored = await readCanonicalPrivateGeneratedMedia({
    localStorageRoot: input.dependencies.localStorageRoot,
    privateObjectIdentityHash: media.private_object_identity_hash,
    mimeType: 'image/png',
  })
  if (
    !stored ||
    stored.sha256 !== media.sha256 ||
    stored.byteLength !== media.byte_length ||
    !pngDimensionsMatch(stored.bytes, 1_280, 720)
  ) {
    throw blocked(
      `The selected ${input.role.replace('_', ' ')} bytes do not match canonical media authority.`,
    )
  }
  const authorityBase = {
    role: input.role,
    assetId: media.asset_id,
    assetVersionId: media.id,
    sourceKind: media.source_kind,
    privateObjectIdentityHash: media.private_object_identity_hash,
    mimeType: 'image/png' as const,
    byteLength: media.byte_length,
    sha256: media.sha256,
    width: 1_280 as const,
    height: 720 as const,
    provenanceDigest: media.provenance_digest,
    qaEvidenceDigest: media.qa_evidence_digest,
  }
  return deepFreeze({
    ...authorityBase,
    frameAuthorityDigest: sha256CanonicalJson(authorityBase),
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

function blocked(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'motion_studio_visual_calibration_source_authority',
    productionReady: false,
  })
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
