import { readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { sha256File } from './ocr-runtime-checksum-verifier'
import { OCR_RUNTIME_EXPECTED_ARTIFACTS } from './ocr-runtime-blocker-policy'
import type { OcrRuntimeArtifact } from './ocr-runtime-types'

export async function collectOcrRuntimeArtifacts(input: {
  rootDir: string
  bucket?: string
  objectPrefix?: string
}): Promise<OcrRuntimeArtifact[]> {
  const files = await collectFiles(input.rootDir)
  const artifacts: OcrRuntimeArtifact[] = []
  for (const file of files) {
    const relative = path.relative(input.rootDir, file).split(path.sep).join('/')
    const fileStat = await stat(file)
    const object = input.objectPrefix ? `${input.objectPrefix}/${relative}` : undefined
    artifacts.push({
      id: relative.replace(/[^0-9A-Za-z_-]+/g, '_'),
      kind: relative.endsWith('.png') ? 'fixture_image' : OCR_RUNTIME_EXPECTED_ARTIFACTS.includes(path.basename(relative) as typeof OCR_RUNTIME_EXPECTED_ARTIFACTS[number]) ? 'report' : 'metadata',
      localPath: file,
      bucket: input.bucket,
      object,
      gcsUri: input.bucket && object ? `gs://${input.bucket}/${object}` : undefined,
      sizeBytes: fileStat.size,
      sha256: await sha256File(file),
    })
  }
  return artifacts
}

export async function writeOcrRuntimeJsonArtifact(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function collectFiles(root: string, prefix = ''): Promise<string[]> {
  const current = path.join(root, prefix)
  const entries = await readdir(current, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    const absolute = path.join(root, relative)
    if (entry.isDirectory()) files.push(...await collectFiles(root, relative))
    else files.push(absolute)
  }
  return files.sort()
}
