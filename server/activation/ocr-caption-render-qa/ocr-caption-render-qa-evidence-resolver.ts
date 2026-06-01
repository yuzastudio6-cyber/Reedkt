import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  describeControlledGcsObject,
  getApprovedControlledRealVideoOcrExecutionEvidence,
  runControlledGcloud,
  type ControlledRealVideoGcsObjectMetadata,
} from '../controlled-real-video-ocr-safe-zone'
import { getApprovedOcrRuntimeEvidence } from '../ocr-runtime'
import {
  buildOcrCaptionRenderQaBlockedGuardFixtures,
  buildOcrCaptionRenderQaControlledFixtureFromApprovedEvidence,
  buildOcrCaptionRenderQaControlledFixtureFromAvoidRegions,
  buildOcrCaptionRenderQaGeneratedFixtures,
} from './ocr-caption-render-qa-fixture-registry'
import type {
  OcrCaptionRenderQaEvidenceManifest,
  OcrCaptionRenderQaFixture,
} from './ocr-caption-render-qa-types'

const PHASE37D_SAFE_INPUT_ARTIFACTS = [
  'phase_37d_ocr_safe_zone_manifest.json',
  'phase_37d_caption_collision_report.json',
  'phase_37d_safe_zone_recommendation_report.json',
] as const

export async function resolveOcrCaptionRenderQaInputs(input: {
  createdAt: string
  readPrivateArtifacts: boolean
  localInputDir?: string
}): Promise<{
  inputManifest: OcrCaptionRenderQaEvidenceManifest
  fixtures: OcrCaptionRenderQaFixture[]
}> {
  const phase37C = getApprovedOcrRuntimeEvidence()
  const phase37D = getApprovedControlledRealVideoOcrExecutionEvidence()
  const artifactsRead: OcrCaptionRenderQaEvidenceManifest['privateArtifacts']['artifactsRead'] = []
  const warnings: string[] = []
  const blockers: string[] = []
  let controlledFixture = buildOcrCaptionRenderQaControlledFixtureFromApprovedEvidence()

  if (input.readPrivateArtifacts) {
    if (!input.localInputDir) throw new Error('localInputDir is required when reading Phase 37E private input artifacts.')
    const localInputDir = input.localInputDir
    if (process.env.REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ !== 'true') {
      blockers.push('REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ=true is required before reading private Phase 37C/37D JSON artifacts.')
    } else {
      await mkdir(localInputDir, { recursive: true })
      const phase37CArtifact = phase37C.qaReportUri
        ? await copySafeJsonArtifact({
          artifactName: 'phase_37c_ocr_runtime_qa_report.json',
          gcsUri: phase37C.qaReportUri,
          localInputDir,
        })
        : undefined
      if (phase37CArtifact) artifactsRead.push(phase37CArtifact)

      if (!phase37D.artifactPrefix) {
        blockers.push('Phase 37D approved evidence is missing the private artifact prefix.')
      } else {
        const copiedPhase37DArtifacts = await Promise.all(PHASE37D_SAFE_INPUT_ARTIFACTS.map((artifactName) => copySafeJsonArtifact({
          artifactName,
          gcsUri: `${phase37D.artifactPrefix}${artifactName}`,
          localInputDir,
        })))
        artifactsRead.push(...copiedPhase37DArtifacts)
        const safeZoneArtifact = copiedPhase37DArtifacts.find((artifact) => artifact.artifactName === 'phase_37d_ocr_safe_zone_manifest.json')
        if (safeZoneArtifact?.localPath) {
          const safeZoneManifest = JSON.parse(await readFile(safeZoneArtifact.localPath, 'utf8')) as {
            avoidTextRegions?: Array<{
              avoidRegionId?: string
              sourceRegionId?: string
              frameId?: string
              x: number
              y: number
              width: number
              height: number
              padding?: number
            }>
            frameRecommendations?: Array<{
              frameId?: string
              offsetSeconds?: number
              textRegionCount?: number
            }>
          }
          controlledFixture = buildOcrCaptionRenderQaControlledFixtureFromAvoidRegions({
            artifactPrefix: phase37D.artifactPrefix,
            safeZoneManifest,
          })
        }
      }
    }
  } else {
    warnings.push('Private Phase 37C/37D artifact reads were not attempted; report uses committed safe evidence only.')
  }

  const inputManifest: OcrCaptionRenderQaEvidenceManifest = {
    phase: '37E',
    createdAt: input.createdAt,
    phase37C: {
      status: phase37C.status,
      runId: phase37C.runId,
      artifactPrefix: phase37C.artifactPrefix,
      qaReportUri: phase37C.qaReportUri,
      fixtureIds: [...phase37C.fixtureIds],
      warnings: [...phase37C.warnings],
      blockers: [...phase37C.blockers],
    },
    phase37D: {
      status: phase37D.status,
      runId: phase37D.runId,
      sampleId: phase37D.sampleId,
      artifactPrefix: phase37D.artifactPrefix,
      frameCount: phase37D.frameCount,
      textRegionCount: phase37D.ocrSummary.totalTextRegionCount,
      framesWithLowerThirdCollision: phase37D.ocrSummary.framesWithLowerThirdCollision,
      phase37EPlanningReady: phase37D.phase37EReadiness.readyForControlledCaptionRenderQaPlanning,
      warnings: [...phase37D.warnings],
      blockers: [...phase37D.blockers],
    },
    privateArtifacts: {
      readAttempted: input.readPrivateArtifacts,
      readConfirmed: process.env.REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ === 'true',
      allowedSourcesOnly: artifactsRead.every((artifact) => artifact.gcsUri.startsWith(phase37C.artifactPrefix ?? 'missing') || artifact.gcsUri.startsWith(phase37D.artifactPrefix ?? 'missing')),
      artifactsRead,
      warnings,
      blockers,
    },
  }

  return {
    inputManifest,
    fixtures: [
      ...buildOcrCaptionRenderQaGeneratedFixtures(),
      controlledFixture,
      ...buildOcrCaptionRenderQaBlockedGuardFixtures(),
    ],
  }
}

export function getOcrCaptionRenderQaSafeInputArtifactNames(): readonly string[] {
  return PHASE37D_SAFE_INPUT_ARTIFACTS
}

async function copySafeJsonArtifact(input: {
  artifactName: string
  gcsUri: string
  localInputDir: string
}): Promise<{
  artifactName: string
  gcsUri: string
  metadata?: ControlledRealVideoGcsObjectMetadata
  localPath?: string
}> {
  assertSafePrivateJsonArtifact(input.gcsUri)
  const metadata = await describeControlledGcsObject(input.gcsUri)
  const localPath = path.join(input.localInputDir, input.artifactName)
  await runControlledGcloud(['storage', 'cp', input.gcsUri, localPath])
  return {
    artifactName: input.artifactName,
    gcsUri: input.gcsUri,
    metadata,
    localPath,
  }
}

function assertSafePrivateJsonArtifact(gcsUri: string): void {
  const phase37C = getApprovedOcrRuntimeEvidence()
  const phase37D = getApprovedControlledRealVideoOcrExecutionEvidence()
  if (!gcsUri.startsWith('gs://')) throw new Error(`Phase 37E refuses non-gs artifact URI: ${gcsUri}`)
  if (gcsUri.includes('?')) throw new Error(`Phase 37E refuses signed/query artifact URI: ${gcsUri}`)
  if (!gcsUri.endsWith('.json')) throw new Error(`Phase 37E refuses non-JSON artifact URI: ${gcsUri}`)
  const allowed = Boolean(
    phase37C.artifactPrefix && gcsUri.startsWith(phase37C.artifactPrefix)
      || phase37D.artifactPrefix && gcsUri.startsWith(phase37D.artifactPrefix),
  )
  if (!allowed) throw new Error(`Phase 37E refuses artifact outside approved Phase 37C/37D private prefixes: ${gcsUri}`)
}
