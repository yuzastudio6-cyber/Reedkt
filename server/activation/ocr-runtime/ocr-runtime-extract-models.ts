import { execFile } from 'node:child_process'
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface OcrExtractedModel {
  archivePath: string
  extractDir: string
  modelDir: string
  tarEntries: string[]
}

export async function safeExtractOcrModelArchive(input: {
  archivePath: string
  extractDir: string
  expectedRootPrefix: string
}): Promise<OcrExtractedModel> {
  await mkdir(input.extractDir, { recursive: true })
  const { stdout } = await execFileAsync('tar', ['-tf', input.archivePath], { maxBuffer: 20 * 1024 * 1024 })
  const tarEntries = stdout.split('\n').map((entry) => entry.trim()).filter(Boolean)
  if (tarEntries.length === 0) throw new Error(`OCR model tar archive has no entries: ${input.archivePath}`)
  for (const entry of tarEntries) {
    if (path.isAbsolute(entry)) throw new Error(`Unsafe absolute tar entry in ${input.archivePath}: ${entry}`)
    if (entry.split('/').includes('..')) throw new Error(`Unsafe parent traversal tar entry in ${input.archivePath}: ${entry}`)
    if (entry === '.' || entry === './') throw new Error(`Unsafe empty tar entry in ${input.archivePath}: ${entry}`)
    if (!entry.startsWith(input.expectedRootPrefix)) {
      throw new Error(`Unexpected OCR model tar root in ${input.archivePath}: ${entry}; expected ${input.expectedRootPrefix}`)
    }
  }
  await execFileAsync('tar', ['-xf', input.archivePath, '-C', input.extractDir], { maxBuffer: 20 * 1024 * 1024 })
  const entries = await readdir(input.extractDir, { withFileTypes: true })
  const modelRoot = entries.find((entry) => entry.isDirectory() && entry.name.startsWith(input.expectedRootPrefix.replace(/\/$/, '')))
  if (!modelRoot) throw new Error(`Could not find extracted OCR model root under ${input.extractDir}.`)
  return {
    archivePath: input.archivePath,
    extractDir: input.extractDir,
    modelDir: path.join(input.extractDir, modelRoot.name),
    tarEntries,
  }
}
