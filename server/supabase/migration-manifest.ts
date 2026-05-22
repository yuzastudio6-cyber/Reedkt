import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

export interface MigrationManifestEntry {
  file: string
  purpose: string
  dependsOn: string[]
  createsTables: string[]
  createsRpcs: string[]
  remoteApplyRequiredFor: string[]
  rollbackRisk: string
}

export interface MigrationManifest {
  project: string
  generatedFor: string
  notes: string[]
  migrations: MigrationManifestEntry[]
}

export interface MigrationManifestCheckResult {
  ok: boolean
  manifestPath: string
  project: string
  migrationCount: number
  missingFiles: string[]
  missingRequiredE2eMigrations: string[]
  orderProblems: string[]
  warnings: string[]
}

const REQUIRED_E2E_MIGRATIONS = [
  '202605210001_e2e_runtime_readiness_tables.sql',
  '202605210002_e2e_service_role_runtime_rpcs.sql',
  '202605210003_e2e_production_service_path_hardening.sql',
]

export async function checkMigrationManifest(rootDir = process.cwd()): Promise<MigrationManifestCheckResult> {
  const manifestPath = path.join(rootDir, 'supabase', 'e2e-runtime-migration-manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as MigrationManifest
  const migrationFiles = manifest.migrations.map((entry) => entry.file)
  const missingFiles = migrationFiles.filter((file) => !existsSync(path.join(rootDir, 'supabase', 'migrations', file)))
  const missingRequiredE2eMigrations = REQUIRED_E2E_MIGRATIONS.filter((file) => !migrationFiles.includes(file))
  const orderProblems = [
    ...checkTimestampOrder(migrationFiles),
    ...await checkMigrationOrderDoc(rootDir, migrationFiles),
  ]
  const warnings: string[] = []
  if (manifest.project !== 'reeditpro') warnings.push(`Manifest project is ${manifest.project}, expected reeditpro.`)

  return {
    ok: missingFiles.length === 0 && missingRequiredE2eMigrations.length === 0 && orderProblems.length === 0 && manifest.project === 'reeditpro',
    manifestPath,
    project: manifest.project,
    migrationCount: manifest.migrations.length,
    missingFiles,
    missingRequiredE2eMigrations,
    orderProblems,
    warnings,
  }
}

function checkTimestampOrder(files: string[]): string[] {
  const sorted = [...files].sort()
  return files
    .map((file, index) => file === sorted[index] ? undefined : `Manifest timestamp order mismatch at index ${index}: expected ${sorted[index]}, found ${file}.`)
    .filter((value): value is string => Boolean(value))
}

async function checkMigrationOrderDoc(rootDir: string, manifestFiles: string[]): Promise<string[]> {
  const orderPath = path.join(rootDir, 'supabase', 'migration-order.md')
  const content = await readFile(orderPath, 'utf8')
  const referencedFiles = Array.from(content.matchAll(/File:\s+`migrations\/([0-9][a-zA-Z0-9_-]+\.sql)`/g)).map((match) => match[1])
  const manifestPositions = new Map(manifestFiles.map((file, index) => [file, index]))
  const problems: string[] = []
  let lastPosition = -1

  for (const file of referencedFiles) {
    const position = manifestPositions.get(file)
    if (position === undefined) {
      problems.push(`migration-order.md references ${file}, but it is missing from the manifest.`)
      continue
    }
    if (position < lastPosition) {
      problems.push(`Manifest order disagrees with migration-order.md around ${file}.`)
    }
    lastPosition = Math.max(lastPosition, position)
  }

  return problems
}
