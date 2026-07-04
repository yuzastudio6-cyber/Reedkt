import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  evaluateProjectEditBriefOwnerEvidenceReadiness,
  scanProjectEditBriefOwnerEvidenceSafety,
  type ProjectEditBriefOwnerEvidenceIntake,
} from '../../src/backend/project-edit-brief-production/owner-evidence-readiness'

const ownerEvidenceIntakePath = 'docs/project-edit-brief-owner-evidence-intake-template.json'

interface ParsedArgs {
  baseRef: string | null
  staged: boolean
  requireIntakeChange: boolean
  allowNoDiff: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  let baseRef: string | null = null
  let staged = true
  let requireIntakeChange = false
  let allowNoDiff = true

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--base') {
      const next = argv[index + 1]
      if (!next) {
        throw new Error('--base requires a git ref')
      }
      baseRef = next
      staged = false
      index += 1
      continue
    }
    if (arg === '--staged') {
      staged = true
      baseRef = null
      continue
    }
    if (arg === '--require-intake-change') {
      requireIntakeChange = true
      allowNoDiff = false
      continue
    }
    if (arg === '--allow-no-diff') {
      allowNoDiff = true
      continue
    }
    throw new Error(`Unsupported argument: ${arg}`)
  }

  return { baseRef, staged, requireIntakeChange, allowNoDiff }
}

function git(args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  }).trim()
}

function readChangedFiles(args: ParsedArgs): string[] {
  const diffArgs = args.staged
    ? ['diff', '--cached', '--name-only']
    : ['diff', '--name-only', `${args.baseRef ?? 'HEAD'}...HEAD`]
  return git(diffArgs).split('\n').map((line) => line.trim()).filter(Boolean)
}

function readIntake(): ProjectEditBriefOwnerEvidenceIntake {
  return JSON.parse(readFileSync(path.resolve(process.cwd(), ownerEvidenceIntakePath), 'utf8')) as ProjectEditBriefOwnerEvidenceIntake
}

try {
  const args = parseArgs(process.argv.slice(2))
  const changedFiles = readChangedFiles(args)
  const disallowedFiles = changedFiles.filter((file) => file !== ownerEvidenceIntakePath)
  const intakeChanged = changedFiles.includes(ownerEvidenceIntakePath)
  const intake = readIntake()
  const readiness = evaluateProjectEditBriefOwnerEvidenceReadiness(intake)
  const safety = scanProjectEditBriefOwnerEvidenceSafety(intake)

  const blockedReasons = [
    ...disallowedFiles.map((file) => `${file} is not allowed in an owner-evidence-only PR.`),
    args.requireIntakeChange && !intakeChanged ? `${ownerEvidenceIntakePath} must be changed in strict owner-evidence PR mode.` : undefined,
    !args.allowNoDiff && changedFiles.length === 0 ? 'No changed files found.' : undefined,
    !safety.safe ? 'Owner evidence intake contains unsafe evidence patterns.' : undefined,
    args.requireIntakeChange && !readiness.readyForRpEditBrief16
      ? 'Owner evidence intake is not ready for RP-EDITBRIEF-16.'
      : undefined,
  ].filter(Boolean)

  const result = {
    command: 'project-edit-brief-owner-evidence-pr-diff',
    mode: args.staged ? 'staged' : 'base',
    baseRef: args.baseRef,
    ownerEvidenceIntakePath,
    changedFiles,
    intakeChanged,
    disallowedFiles,
    requireIntakeChange: args.requireIntakeChange,
    readinessDecision: readiness.decision,
    readyForRpEditBrief16: readiness.readyForRpEditBrief16,
    safety,
    blockedReasons,
    passed: blockedReasons.length === 0,
  }

  console.log(JSON.stringify(result, null, 2))
  if (blockedReasons.length > 0) {
    process.exitCode = 1
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 2
}
