import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const serverOnlyPackages = [
  '@google-cloud/storage',
  'google-auth-library',
  'gaxios',
  'teeny-request',
  'retry-request',
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

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'])

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

const patterns = serverOnlyPackages.map((packageName) => ({
  packageName,
  pattern: packageImportPattern(packageName),
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
}

if (violations.length > 0) {
  console.error('Server-only packages were imported by frontend-facing code:')
  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.packageName}`)
  }
  process.exit(1)
}

console.log(`Frontend/server boundary check passed for ${files.length} files.`)
