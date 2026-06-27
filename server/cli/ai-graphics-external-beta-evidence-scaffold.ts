import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  buildAiGraphicsExternalBetaEvidenceScaffoldPacket,
  type AiGraphicsExternalBetaEvidenceScaffoldPacket,
} from '../tool-registry/ai-graphics-external-beta-evidence-scaffold'

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
    reason: 'Missing required --out-dir for local-only external-beta evidence scaffold output.',
    localOnly: true,
    privateEvidenceRefsLogged: 0,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }, null, 2))
  process.exit(2)
}

const resolvedOutputDirectory = resolve(outputDirectory)
const force = hasFlag('--force')
const packet = buildAiGraphicsExternalBetaEvidenceScaffoldPacket()
const writtenFiles: string[] = []
const skippedFiles: string[] = []

function checklistMarkdown(packet: AiGraphicsExternalBetaEvidenceScaffoldPacket): string {
  const lines = [
    '# AI Graphics External-Beta Evidence Collection Checklist',
    '',
    'Local-only checklist for future external-beta evidence refs. Do not commit these files.',
    '',
    '## Required Evidence Classes',
    '',
    ...packet.collectionChecklist[0].requiredEvidenceClasses.map((evidenceClass) => `- \`${evidenceClass}\``),
    '',
    '## Tools',
    '',
  ]

  for (const item of packet.collectionChecklist) {
    lines.push(`### ${item.toolId}`)
    lines.push('')
    lines.push(`- Runtime target: \`${item.runtimeTarget}\``)
    lines.push(`- GPU required for runtime: ${item.gpuRequiredForRuntime}`)
    lines.push(`- Local template path: \`${item.localOnlyTemplatePath}\``)
    lines.push(`- Committed evidence accepted: ${item.committedEvidenceAccepted}`)
    lines.push(`- Next action: ${item.nextAction}`)
    lines.push('')
  }

  lines.push('## Validation Commands')
  lines.push('')
  for (const command of packet.collectionChecklist[0].validationCommands) {
    lines.push(`- \`${command}\``)
  }
  lines.push('')
  lines.push('The generated template refs intentionally use rejected public placeholders. Replace every placeholder with private/backend evidence refs before validating.')
  lines.push('No tool execution, route execution, worker execution, provider/model call, browser/WebGL/canvas runtime, GPU runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta, or production unlock is approved by this scaffold.')
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
  'external-beta-evidence-records.template.json',
  `${JSON.stringify(packet.evidenceRecordTemplate, null, 2)}\n`,
)
writeSupportFile(
  'external-beta-evidence-collection-checklist.json',
  `${JSON.stringify(packet.collectionChecklist, null, 2)}\n`,
)
writeSupportFile(
  'EXTERNAL_BETA_EVIDENCE_COLLECTION_CHECKLIST.md',
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
    privateEvidenceRefsLogged: 0,
    scaffoldTemplatesAreReviewInvalid: true,
    evidencePacketInputTemplateWritten: true,
    collectionChecklistWritten: true,
  },
}, null, 2))

if (skippedFiles.length > 0) {
  process.exitCode = 2
}
