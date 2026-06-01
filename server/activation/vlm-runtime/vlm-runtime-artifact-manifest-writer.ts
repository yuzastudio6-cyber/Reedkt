import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { VLM_RUNTIME_EXPECTED_ARTIFACTS } from './vlm-runtime-blocker-policy'
import { sha256File } from './vlm-runtime-checksum-verifier'
import type { VlmRuntimeArtifact } from './vlm-runtime-types'

export async function writeVlmRuntimeJsonArtifact(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function writeVlmRuntimeTextArtifact(filePath: string, value: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8')
}

export async function collectVlmRuntimeArtifacts(input: {
  rootDir: string
  bucket?: string
  objectPrefix?: string
}): Promise<VlmRuntimeArtifact[]> {
  const files = await collectFiles(input.rootDir)
  const artifacts: VlmRuntimeArtifact[] = []
  for (const file of files) {
    const relative = path.relative(input.rootDir, file).split(path.sep).join('/')
    const fileStat = await stat(file)
    const object = input.objectPrefix ? `${input.objectPrefix}/${relative}` : undefined
    const basename = path.basename(relative)
    artifacts.push({
      id: relative.replace(/[^0-9A-Za-z_-]+/g, '_'),
      kind: relative.endsWith('.png') ? 'fixture_image' : VLM_RUNTIME_EXPECTED_ARTIFACTS.includes(basename as typeof VLM_RUNTIME_EXPECTED_ARTIFACTS[number]) ? 'report' : 'metadata',
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

export async function copyVlmRuntimeSafeArtifacts(input: {
  fromReportDir: string
  toArtifactDir: string
}): Promise<void> {
  await mkdir(input.toArtifactDir, { recursive: true })
  for (const file of VLM_RUNTIME_EXPECTED_ARTIFACTS) {
    await copyFile(path.join(input.fromReportDir, file), path.join(input.toArtifactDir, file))
  }
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
