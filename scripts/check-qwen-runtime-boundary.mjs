import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'])
const frontendRoots = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components',
  'src/pages',
  'src/hooks',
  'src/lib',
]
const qwenBoundaryRoots = [
  'src/backend/qwen-runtime',
  'src/types/qwen-runtime-boundary.ts',
  'src/backend/contracts/qwen-runtime-boundary-contracts.ts',
  'server/routes/qwen-marker-chat-beta-routes.ts',
  'server/smoke/qwen-runtime-boundary-smoke.ts',
  'server/smoke/qwen-live-readiness-route-smoke.ts',
  'server/smoke/qwen-live-provider-smoke.ts',
  'server/smoke/qwen-marker-chat-live-smoke.ts',
  'server/smoke/qwen-live-owner-config-smoke.ts',
  'server/cli/qwen-beta-doctor.ts',
  'server/cli/qwen-beta-unlock.ts',
]

async function collectFiles(rootPath) {
  if (!existsSync(rootPath)) return []
  const stats = await readdir(rootPath, { withFileTypes: true }).catch(async () => [])
  if (!stats.length && sourceExtensions.has(path.extname(rootPath))) return [rootPath]

  const files = []
  for (const entry of stats) {
    const entryPath = path.join(rootPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath))
    } else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }
  return files
}

const frontendFiles = []
for (const root of frontendRoots) {
  frontendFiles.push(...await collectFiles(path.resolve(process.cwd(), root)))
}

const boundaryFiles = []
for (const root of qwenBoundaryRoots) {
  boundaryFiles.push(...await collectFiles(path.resolve(process.cwd(), root)))
}

const violations = []
for (const filePath of frontendFiles) {
  const source = await readFile(filePath, 'utf8')
  if (/src\/backend\/qwen-runtime|backend\/qwen-runtime|server\/routes\/qwen-marker-chat-beta-routes/.test(source)) {
    violations.push({
      filePath: path.relative(process.cwd(), filePath),
      reason: 'Frontend-facing code must not import backend Qwen runtime boundary modules.',
    })
  }
}

const secretLikePatterns = [
  /sk-[A-Za-z0-9_-]{8,}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{24,}/,
  /AIza[A-Za-z0-9_-]{8,}/,
  /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  /-----BEGIN (?:PRIVATE|RSA|EC) KEY-----/,
]

for (const filePath of boundaryFiles) {
  const source = await readFile(filePath, 'utf8')
  if (secretLikePatterns.some((pattern) => pattern.test(source))) {
    violations.push({
      filePath: path.relative(process.cwd(), filePath),
      reason: 'Secret-like literal found in Qwen runtime boundary file.',
    })
  }
  if (/gcloud\s+secrets\s+(?:list|versions\s+access)/i.test(source)) {
    violations.push({
      filePath: path.relative(process.cwd(), filePath),
      reason: 'Forbidden gcloud secrets command preview found in executable Qwen boundary file.',
    })
  }
}

if (violations.length) {
  console.error(JSON.stringify({
    ok: false,
    violations,
    remoteCommandsRun: false,
    gcloudCommandRun: false,
    secretsPrinted: false,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  scannedFrontendFiles: frontendFiles.length,
  scannedBoundaryFiles: boundaryFiles.length,
  remoteCommandsRun: false,
  gcloudCommandRun: false,
  secretsPrinted: false,
  note: 'Local static Qwen runtime boundary check only; no gcloud, provider, or Supabase command is executed.',
}, null, 2))
