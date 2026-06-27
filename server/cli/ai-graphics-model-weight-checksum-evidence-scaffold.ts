import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  buildAiGraphicsModelWeightChecksumEvidenceScaffoldPacket,
  type AiGraphicsModelWeightChecksumEvidenceScaffoldPacket,
} from '../tool-registry/ai-graphics-model-weight-checksum-evidence-scaffold'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

const outputDirectory = valueAfterFlag('--out-dir')

if (!outputDirectory) {
  console.log(JSON.stringify({
    status: 'blocked_missing_out_dir',
    reason: 'Missing required --out-dir for local-only model checksum evidence scaffold output.',
    localOnly: true,
    privateArtifactRefsLogged: 0,
    checksumEvidenceRefsLogged: 0,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    runtimeReadyNow: false,
  }, null, 2))
  process.exit(2)
}

const resolvedOutputDirectory = resolve(outputDirectory)
const force = hasFlag('--force')
const packet = buildAiGraphicsModelWeightChecksumEvidenceScaffoldPacket()
const writtenFiles: string[] = []
const skippedFiles: string[] = []

function checklistMarkdown(packet: AiGraphicsModelWeightChecksumEvidenceScaffoldPacket): string {
  const lines = [
    '# AI Graphics Model-Weight Checksum Evidence Authoring Checklist',
    '',
    'Local-only checklist for private model-weight checksum evidence authoring. Do not commit these files.',
    '',
    '## Required Fields',
    '',
    ...packet.authoringChecklist[0].requiredEvidenceFields.map((field) => `- \`${field}\``),
    '',
    '## Required Review Booleans',
    '',
    ...packet.authoringChecklist[0].requiredReviewBooleans.map((field) => `- \`${field}=true\``),
    '',
    '## Tools',
    '',
  ]

  for (const item of packet.authoringChecklist) {
    lines.push(`### ${item.toolId}`)
    lines.push('')
    lines.push(`- Candidate: \`${item.candidateId}\``)
    lines.push(`- Authoring readiness: \`${item.authoringReadiness}\``)
    lines.push(`- Local checksum evidence path: \`${item.localOnlyChecksumEvidencePath}\``)
    lines.push(`- Expected artifact file: \`${item.expectedArtifactFileName}\``)
    lines.push(`- Accepted private refs: \`${item.acceptedPrivateArtifactRefNamespaces.join('`, `')}\``)
    lines.push(`- Suggested checksum source: \`${item.suggestedPrivateManifestChecksumSource}\``)
    if (item.suggestedPrivateManifestChecksumSha256) {
      lines.push(`- Suggested checksum SHA-256: \`${item.suggestedPrivateManifestChecksumSha256}\``)
    }
    lines.push(`- Checksum must match reviewed private artifact: ${item.checksumStillMustMatchReviewedPrivateArtifact}`)
    lines.push(`- Committed checksum evidence approved: ${item.committedChecksumEvidenceApproved}`)
    lines.push(`- Next action: ${item.nextAction}`)
    if (item.sourceEvidenceRefs.length > 0) {
      lines.push('- Source evidence refs:')
      for (const ref of item.sourceEvidenceRefs) {
        lines.push(`  - \`${ref}\``)
      }
    }
    lines.push('')
  }

  lines.push('## Validation Commands')
  lines.push('')
  for (const command of packet.authoringChecklist[0].validationCommands) {
    lines.push(`- \`${command}\``)
  }
  lines.push('')
  lines.push('No model downloads, model loads, inference, GPU runtime, Tool Route calls, Worker execution, public artifacts, signed URLs, beta, or production unlocks are approved by this checklist.')
  lines.push('')

  return `${lines.join('\n')}\n`
}

function writeSupportFile(relativePath: string, content: string): void {
  const filePath = join(resolvedOutputDirectory, relativePath)
  mkdirSync(dirname(filePath), { recursive: true })

  if (existsSync(filePath) && !force) {
    skippedFiles.push(filePath)
    return
  }

  writeFileSync(filePath, content, 'utf8')
  writtenFiles.push(filePath)
}

for (const record of packet.scaffoldRecords) {
  const filePath = join(resolvedOutputDirectory, record.relativeFilePath)
  mkdirSync(dirname(filePath), { recursive: true })

  if (existsSync(filePath) && !force) {
    skippedFiles.push(filePath)
    continue
  }

  writeFileSync(filePath, `${JSON.stringify(record.placeholderRecord, null, 2)}\n`, 'utf8')
  writtenFiles.push(filePath)
}

writeSupportFile(
  'checksum-evidence-authoring-checklist.json',
  `${JSON.stringify(packet.authoringChecklist, null, 2)}\n`,
)
writeSupportFile(
  'CHECKSUM_EVIDENCE_AUTHORING_CHECKLIST.md',
  checklistMarkdown(packet),
)

console.log(JSON.stringify({
  ...packet,
  output: {
    outDir: resolvedOutputDirectory,
    writtenFiles,
    skippedFiles,
    force,
    localOnly: true,
    privateArtifactRefsLogged: 0,
    checksumEvidenceRefsLogged: 0,
    scaffoldTemplatesAreReviewInvalid: true,
    authoringChecklistWritten: true,
  },
}, null, 2))

if (skippedFiles.length > 0) {
  process.exitCode = 2
}
