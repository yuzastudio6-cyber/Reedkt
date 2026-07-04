import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  evaluateProjectEditBriefOwnerEvidenceReadiness,
  scanProjectEditBriefOwnerEvidenceSafety,
  type ProjectEditBriefOwnerEvidenceIntake,
} from '../../src/backend/project-edit-brief-production/owner-evidence-readiness'

interface ParsedArgs {
  inputPath: string
  allowBlocked: boolean
  compact: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  let inputPath = 'docs/project-edit-brief-owner-evidence-intake-template.json'
  let allowBlocked = false
  let compact = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--input') {
      const next = argv[index + 1]
      if (!next) {
        throw new Error('--input requires a path')
      }
      inputPath = next
      index += 1
      continue
    }
    if (arg === '--allow-blocked') {
      allowBlocked = true
      continue
    }
    if (arg === '--compact') {
      compact = true
      continue
    }
    throw new Error(`Unsupported argument: ${arg}`)
  }

  return { inputPath, allowBlocked, compact }
}

function readIntake(inputPath: string): ProjectEditBriefOwnerEvidenceIntake {
  const absolutePath = path.resolve(process.cwd(), inputPath)
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as ProjectEditBriefOwnerEvidenceIntake
}

try {
  const args = parseArgs(process.argv.slice(2))
  const intake = readIntake(args.inputPath)
  const readiness = evaluateProjectEditBriefOwnerEvidenceReadiness(intake)
  const safety = scanProjectEditBriefOwnerEvidenceSafety(intake)
  const result = {
    command: 'project-edit-brief-owner-evidence-readiness',
    inputPath: args.inputPath,
    decision: readiness.decision,
    readyForRpEditBrief16: readiness.readyForRpEditBrief16,
    supabasePersistenceImplementationAllowed: readiness.supabasePersistenceImplementationAllowed,
    externalBetaAllowed: readiness.externalBetaAllowed,
    realUserMediaBetaAllowed: readiness.realUserMediaBetaAllowed,
    paidProductionAllowed: readiness.paidProductionAllowed,
    approvedOrWaivedInputs: readiness.approvedOrWaivedInputs,
    missingInputs: readiness.missingInputs,
    rejectedInputs: readiness.rejectedInputs,
    invalidInputs: readiness.invalidInputs,
    blockedReasons: readiness.blockedReasons,
    safety,
    nextMilestone: readiness.nextMilestone,
  }

  console.log(JSON.stringify(result, null, args.compact ? 0 : 2))

  if (!safety.safe) {
    process.exitCode = 2
  } else if (!readiness.readyForRpEditBrief16 && !args.allowBlocked) {
    process.exitCode = 1
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 2
}
