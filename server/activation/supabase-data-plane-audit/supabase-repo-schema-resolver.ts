import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import type { SupabaseRepoSchemaDiscovery } from './supabase-data-plane-audit-types'

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'dist-server', 'activation-logs', '.vite'])

export function resolveSupabaseRepoSchema(root = process.cwd()): SupabaseRepoSchemaDiscovery {
  const packageJson = readJson<{ dependencies?: Record<string, string> }>('package.json')
  const migrationFiles = listSqlFiles('supabase/migrations')
  const keyPaths = [
    { path: 'server/supabase/admin-client.ts', purpose: 'server-only service-role Supabase client boundary' },
    { path: 'server/supabase/public-client.ts', purpose: 'server-only anon client boundary' },
    { path: 'server/config/env.ts', purpose: 'runtime env parsing and safe summary' },
    { path: 'src/backend/supabase/supabase-client.ts', purpose: 'frontend-safe Supabase anon client' },
    { path: 'src/backend/supabase/supabase-config.ts', purpose: 'frontend-safe public env config' },
    { path: 'src/backend/supabase/supabase-admin-placeholder.ts', purpose: 'frontend service-role denial placeholder' },
    { path: 'src/backend/supabase/database.types.ts', purpose: 'generated/planned Supabase type surface' },
    { path: 'supabase/README.md', purpose: 'Supabase migration/readiness documentation' },
    { path: 'supabase/migration-order.md', purpose: 'migration run order documentation' },
    { path: 'supabase/schema-review.md', purpose: 'local-only schema review evidence' },
  ].map((entry) => ({ ...entry, exists: existsSync(entry.path) }))
  const blockers: string[] = []
  const warnings: string[] = []

  if (!keyPaths.find((entry) => entry.path === 'server/supabase/admin-client.ts')?.exists) blockers.push('Server admin Supabase client boundary is missing.')
  if (!keyPaths.find((entry) => entry.path === 'src/backend/supabase/supabase-client.ts')?.exists) blockers.push('Frontend Supabase anon client boundary is missing.')
  if (migrationFiles.length === 0) blockers.push('No Supabase migration SQL files were found.')
  if (!existsSync('supabase/config.toml')) warnings.push('supabase/config.toml is not present in the Phase 50G base; local Supabase lifecycle readiness is not proven.')
  if (!packageJson.dependencies?.['@supabase/supabase-js']) blockers.push('@supabase/supabase-js is not listed as a dependency.')

  const docsState = readFile('supabase/schema-review.md').includes('no remote Supabase project was connected')
    ? 'local_review_ready_only'
    : 'unknown'

  return {
    repoRoot: root,
    keyPaths,
    migrationFiles,
    supabaseConfigTomlPresent: existsSync('supabase/config.toml'),
    packageHasSupabaseJs: Boolean(packageJson.dependencies?.['@supabase/supabase-js']),
    docsState,
    blockers,
    warnings,
  }
}

export function listFilesUnder(paths: string[], extensions?: string[]): string[] {
  const files: string[] = []
  for (const inputPath of paths) walk(inputPath, files, extensions)
  return files.sort()
}

export function readFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

export function readJson<T>(filePath: string): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
  } catch {
    return {} as T
  }
}

export function findLineMatches(files: string[], patterns: RegExp[]): Array<{ path: string; line: number; snippet: string }> {
  const matches: Array<{ path: string; line: number; snippet: string }> = []
  for (const filePath of files) {
    const text = readFile(filePath)
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (patterns.some((pattern) => pattern.test(line))) {
        matches.push({
          path: filePath,
          line: index + 1,
          snippet: sanitizeSnippet(line),
        })
      }
    })
  }
  return matches
}

function listSqlFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((entry) => entry.endsWith('.sql') && !entry.startsWith('._'))
    .map((entry) => path.join(dir, entry))
    .sort()
}

function walk(inputPath: string, files: string[], extensions?: string[]): void {
  if (!existsSync(inputPath)) return
  const fileStat = statSync(inputPath)
  if (fileStat.isFile()) {
    if (!extensions || extensions.some((extension) => inputPath.endsWith(extension))) files.push(inputPath)
    return
  }
  if (!fileStat.isDirectory()) return
  const base = path.basename(inputPath)
  if (SKIP_DIRS.has(base)) return
  for (const entry of readdirSync(inputPath)) {
    if (entry.startsWith('._')) continue
    walk(path.join(inputPath, entry), files, extensions)
  }
}

function sanitizeSnippet(line: string): string {
  return line
    .replace(/(SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*)[^,\s'"]+/g, '$1<redacted>')
    .replace(/(SUPABASE_DB_URL\s*[:=]\s*)[^,\s'"]+/g, '$1<redacted>')
    .replace(/(supabase(?:ServiceRole)?Key\s*[:=]\s*)[^,\s'"]+/gi, '$1<redacted>')
    .trim()
    .slice(0, 240)
}
