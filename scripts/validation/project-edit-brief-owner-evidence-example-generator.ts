import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  evaluateProjectEditBriefOwnerEvidenceReadiness,
  parseProjectEditBriefOwnerEvidenceIntake,
  scanProjectEditBriefOwnerEvidenceSafety,
  type ProjectEditBriefOwnerEvidenceInput,
  type ProjectEditBriefOwnerEvidenceIntake,
} from '../../src/backend/project-edit-brief-production/owner-evidence-readiness'

export type ProjectEditBriefOwnerEvidenceExampleMode = 'draft' | 'strict-example'

interface ReviewPacketInput {
  id: string
  label: string
  reviewGroup: string
  decisionRequired: string
  minimumEvidence: string[]
}

interface ReviewPacket {
  requiredOwnerInputs: ReviewPacketInput[]
}

interface GeneratorOptions {
  mode: ProjectEditBriefOwnerEvidenceExampleMode
  reviewedAt: string
}

interface ParsedArgs extends GeneratorOptions {
  outputPath: string | null
}

const templatePath = 'docs/project-edit-brief-owner-evidence-intake-template.json'
const reviewPacketPath = 'docs/project-edit-brief-owner-evidence-review-packet.json'
const defaultReviewedAt = '2026-07-04T12:00:00.000Z'

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'))
}

function parseArgs(argv: string[]): ParsedArgs {
  let mode: ProjectEditBriefOwnerEvidenceExampleMode = 'draft'
  let reviewedAt = defaultReviewedAt
  let outputPath: string | null = null

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--mode') {
      const next = argv[index + 1]
      if (next !== 'draft' && next !== 'strict-example') {
        throw new Error('--mode must be draft or strict-example')
      }
      mode = next
      index += 1
      continue
    }
    if (arg === '--reviewed-at') {
      const next = argv[index + 1]
      if (!next || Number.isNaN(Date.parse(next))) {
        throw new Error('--reviewed-at requires an ISO-like timestamp')
      }
      reviewedAt = next
      index += 1
      continue
    }
    if (arg === '--output') {
      const next = argv[index + 1]
      if (!next) {
        throw new Error('--output requires a path')
      }
      outputPath = next
      index += 1
      continue
    }
    if (arg === '--stdout') {
      outputPath = null
      continue
    }
    throw new Error(`Unsupported argument: ${arg}`)
  }

  return { mode, reviewedAt, outputPath }
}

function sanitizeGeneratedGuidance(value: string): string {
  return value
    .replace(/\braw prompt\b/gi, 'redacted prompt-material')
    .replace(/\braw_prompt\b/gi, 'redacted_prompt_material')
    .replace(/\bprovider prompt\b/gi, 'provider request-material')
    .replace(/\bsigned URL\b/gi, 'signed-delivery')
    .replace(/\bsigned URL-like\b/gi, 'signed-delivery-like')
}

function joinMinimumEvidence(evidence: string[]): string {
  return evidence.map(sanitizeGeneratedGuidance).join('; ')
}

export function createProjectEditBriefOwnerEvidenceExample(
  template: ProjectEditBriefOwnerEvidenceIntake,
  reviewPacket: ReviewPacket,
  options: GeneratorOptions,
): ProjectEditBriefOwnerEvidenceIntake {
  const reviewById = new Map(reviewPacket.requiredOwnerInputs.map((input) => [input.id, input]))
  const ready = options.mode === 'strict-example'

  return {
    ...template,
    status: ready ? 'synthetic_strict_example_not_real_approval' : 'draft_owner_assignment_not_real_approval',
    decision: ready
      ? 'project_edit_brief_owner_evidence_synthetic_strict_example_not_real_approval'
      : 'project_edit_brief_owner_evidence_draft_not_real_approval',
    requiredOwnerInputs: template.requiredOwnerInputs.map((input): ProjectEditBriefOwnerEvidenceInput => {
      const review = reviewById.get(input.id)
      if (!review) {
        return input
      }

      if (!ready) {
        return {
          ...input,
          status: 'missing',
          owner: null,
          evidenceRef: null,
          reviewedAt: null,
          notes: [
            `Review group: ${sanitizeGeneratedGuidance(review.reviewGroup)}.`,
            `Decision required: ${sanitizeGeneratedGuidance(review.decisionRequired)}`,
            `Minimum evidence: ${joinMinimumEvidence(review.minimumEvidence)}.`,
            'Draft example only. Replace with real owner evidence in a reviewed PR.',
          ],
        }
      }

      return {
        ...input,
        status: 'approved',
        owner: review.reviewGroup,
        evidenceRef: `https://example.com/reeditpro/project-edit-brief-owner-evidence/${input.id}`,
        reviewedAt: options.reviewedAt,
        notes: [
          `Synthetic strict-format example for ${sanitizeGeneratedGuidance(review.label)}.`,
          `Decision required: ${sanitizeGeneratedGuidance(review.decisionRequired)}`,
          `Minimum evidence demonstrated by placeholder categories: ${joinMinimumEvidence(review.minimumEvidence)}.`,
          'Not real approval. Do not commit this generated example as source truth.',
        ],
      }
    }),
    gateState: {
      readyForRpEditBrief16: ready,
      externalBetaAllowed: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      supabasePersistenceImplementationAllowed: ready,
    },
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const parsedTemplate = parseProjectEditBriefOwnerEvidenceIntake(readJson(templatePath))
  if (!parsedTemplate.success) {
    throw new Error(`Template schema validation failed:\n${parsedTemplate.errors.join('\n')}`)
  }

  const example = createProjectEditBriefOwnerEvidenceExample(
    parsedTemplate.intake,
    readJson(reviewPacketPath) as ReviewPacket,
    args,
  )
  const readiness = evaluateProjectEditBriefOwnerEvidenceReadiness(example)
  const safety = scanProjectEditBriefOwnerEvidenceSafety(example)
  const output = `${JSON.stringify(example, null, 2)}\n`

  if (!safety.safe) {
    throw new Error(`Generated owner evidence example failed safety scan:\n${safety.findings.join('\n')}`)
  }
  if (args.mode === 'strict-example' && !readiness.readyForRpEditBrief16) {
    throw new Error(`Strict example did not pass readiness:\n${readiness.blockedReasons.join('\n')}`)
  }
  if (args.mode === 'draft' && readiness.readyForRpEditBrief16) {
    throw new Error('Draft example unexpectedly passed readiness.')
  }

  if (args.outputPath) {
    writeFileSync(path.resolve(process.cwd(), args.outputPath), output)
  } else {
    process.stdout.write(output)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 2
  }
}
