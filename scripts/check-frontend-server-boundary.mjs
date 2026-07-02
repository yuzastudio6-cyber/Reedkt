import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const serverOnlyPackages = [
  '@google-cloud/secret-manager',
  '@google-cloud/storage',
  'google-auth-library',
  'gaxios',
  'teeny-request',
  'retry-request',
]

const serverOnlyImportFragments = [
  'src/backend/qwen-runtime',
  '../backend/qwen-runtime',
  '../../backend/qwen-runtime',
  '../../../backend/qwen-runtime',
  'server/routes/qwen-marker-chat-beta-routes',
  '../server/routes/qwen-marker-chat-beta-routes',
  '../../server/routes/qwen-marker-chat-beta-routes',
  '../../../server/routes/qwen-marker-chat-beta-routes',
]

const frontendRoots = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components',
  'src/pages',
  'src/hooks',
  'src/lib',
  'src/types',
]

const frontendSecretScanRoots = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components',
  'src/pages',
  'src/hooks',
  'src/lib',
]

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'])

const backendOnlySecretNames = [
  'QWEN_API_KEY',
  'QWEN_REASONING_API_KEY_SECRET',
  'DEEPSEEK_API_KEY',
  'LYRIA_API_KEY',
  'MIRELO_API_KEY',
  'MMAUDIO_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON',
]

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function packageImportPattern(packageName) {
  const escaped = escapeRegExp(packageName)
  return new RegExp(
    [
      `from\\s+['"]${escaped}(?:/[^'"]*)?['"]`,
      `import\\s+['"]${escaped}(?:/[^'"]*)?['"]`,
      `import\\s*\\(\\s*['"]${escaped}(?:/[^'"]*)?['"]\\s*\\)`,
      `require\\s*\\(\\s*['"]${escaped}(?:/[^'"]*)?['"]\\s*\\)`,
    ].join('|'),
    'm',
  )
}

async function collectFiles(rootPath) {
  if (!existsSync(rootPath)) return []

  const statEntries = await readdir(rootPath, { withFileTypes: true }).catch(async () => [])

  if (!statEntries.length && sourceExtensions.has(path.extname(rootPath))) {
    return [rootPath]
  }

  const files = []
  for (const entry of statEntries) {
    const entryPath = path.join(rootPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath))
    } else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }
  return files
}

const files = []
for (const root of frontendRoots) {
  files.push(...await collectFiles(path.resolve(process.cwd(), root)))
}

const secretScanFiles = []
for (const root of frontendSecretScanRoots) {
  secretScanFiles.push(...await collectFiles(path.resolve(process.cwd(), root)))
}

const patterns = serverOnlyPackages.map((packageName) => ({
  packageName,
  pattern: packageImportPattern(packageName),
}))

const serverOnlyImportPatterns = serverOnlyImportFragments.map((fragment) => ({
  fragment,
  pattern: packageImportPattern(fragment),
}))

const violations = []
for (const filePath of files) {
  const source = await readFile(filePath, 'utf8')
  for (const { packageName, pattern } of patterns) {
    if (pattern.test(source)) {
      violations.push({
        filePath: path.relative(process.cwd(), filePath),
        packageName,
      })
    }
  }
  for (const { fragment, pattern } of serverOnlyImportPatterns) {
    if (pattern.test(source)) {
      violations.push({
        filePath: path.relative(process.cwd(), filePath),
        packageName: fragment,
      })
    }
  }
}

if (violations.length > 0) {
  console.error('Server-only packages were imported by frontend-facing code:')
  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.packageName}`)
  }
  process.exit(1)
}

const secretViolations = []
for (const filePath of secretScanFiles) {
  const source = await readFile(filePath, 'utf8')
  for (const secretName of backendOnlySecretNames) {
    if (source.includes(secretName)) {
      secretViolations.push({
        filePath: path.relative(process.cwd(), filePath),
        secretName,
      })
    }
  }
}

if (secretViolations.length > 0) {
  console.error('Backend/provider secret names were referenced by frontend runtime code:')
  for (const violation of secretViolations) {
    console.error(`- ${violation.filePath}: ${violation.secretName}`)
  }
  process.exit(1)
}

console.log(`Frontend/server boundary check passed for ${files.length} files. Provider secret scan passed for ${secretScanFiles.length} runtime files.`)
