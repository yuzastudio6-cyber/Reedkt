import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

export type SupabaseMigrationBaselineStatus =
  | 'reproducible'
  | 'blocked_by_parallel_foundations'

export interface SupabaseMigrationSource {
  filePath: string
  sql: string
}

export interface SupabaseMigrationTableDefinition {
  tableName: string
  filePath: string
  family: string
  createMode: 'strict' | 'if_not_exists'
  columns: string[]
}

export interface SupabaseMigrationOverlap {
  tableName: string
  legacyDefinition: SupabaseMigrationTableDefinition
  rpData04Definition: SupabaseMigrationTableDefinition
  legacyOnlyColumns: string[]
  rpData04OnlyColumns: string[]
  incompatible: boolean
}

export interface SupabaseMigrationBaselineAudit {
  status: SupabaseMigrationBaselineStatus
  safeToRunRawMigrationDirectory: boolean
  migrationFiles: string[]
  migrationFileCount: number
  legacyFoundationFiles: string[]
  rpData04FoundationFiles: string[]
  laterMigrationFiles: string[]
  overlappingTables: SupabaseMigrationOverlap[]
  incompatibleOverlappingTables: string[]
  laterLegacyOnlyDependencies: string[]
  laterRpData04OnlyDependencies: string[]
  blockers: string[]
  nextActions: string[]
}

const LEGACY_FAMILY = '20260513'
const RP_DATA_04_FAMILY = '20260518'

export function auditSupabaseMigrationDirectory(directoryPath: string): SupabaseMigrationBaselineAudit {
  const sources = readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{12}_.+\.sql$/.test(entry.name))
    .map((entry) => ({
      filePath: `supabase/migrations/${entry.name}`,
      sql: readFileSync(join(directoryPath, entry.name), 'utf8'),
    }))

  return auditSupabaseMigrationSources(sources)
}

export function auditSupabaseMigrationSources(
  sources: SupabaseMigrationSource[],
): SupabaseMigrationBaselineAudit {
  const orderedSources = [...sources].sort((left, right) => left.filePath.localeCompare(right.filePath))
  const definitions = orderedSources.flatMap(parseTableDefinitions)
  const legacyDefinitions = definitions.filter((definition) => definition.family === LEGACY_FAMILY)
  const rpData04Definitions = definitions.filter((definition) => definition.family === RP_DATA_04_FAMILY)
  const legacyByTable = definitionMap(legacyDefinitions)
  const rpData04ByTable = definitionMap(rpData04Definitions)

  const overlappingTables = [...legacyByTable.keys()]
    .filter((tableName) => rpData04ByTable.has(tableName))
    .sort()
    .map((tableName): SupabaseMigrationOverlap => {
      const legacyDefinition = requiredDefinition(legacyByTable, tableName)
      const rpData04Definition = requiredDefinition(rpData04ByTable, tableName)
      const legacyColumns = new Set(legacyDefinition.columns)
      const rpData04Columns = new Set(rpData04Definition.columns)
      const legacyOnlyColumns = legacyDefinition.columns.filter((column) => !rpData04Columns.has(column))
      const rpData04OnlyColumns = rpData04Definition.columns.filter((column) => !legacyColumns.has(column))

      return {
        tableName,
        legacyDefinition,
        rpData04Definition,
        legacyOnlyColumns,
        rpData04OnlyColumns,
        incompatible: legacyOnlyColumns.length > 0 || rpData04OnlyColumns.length > 0,
      }
    })

  const legacyOnlyTables = new Set(
    [...legacyByTable.keys()].filter((tableName) => !rpData04ByTable.has(tableName)),
  )
  const rpData04OnlyTables = new Set(
    [...rpData04ByTable.keys()].filter((tableName) => !legacyByTable.has(tableName)),
  )
  const laterSources = orderedSources.filter((source) => migrationFamily(source.filePath) > RP_DATA_04_FAMILY)
  const laterDependencies = new Set(laterSources.flatMap(extractExternalTableMentions))
  const laterLegacyOnlyDependencies = [...laterDependencies]
    .filter((tableName) => legacyOnlyTables.has(tableName))
    .sort()
  const laterRpData04OnlyDependencies = [...laterDependencies]
    .filter((tableName) => rpData04OnlyTables.has(tableName))
    .sort()
  const incompatibleOverlappingTables = overlappingTables
    .filter((overlap) => overlap.incompatible)
    .map((overlap) => overlap.tableName)
  const hasParallelFoundationBlocker =
    incompatibleOverlappingTables.length > 0
    && laterLegacyOnlyDependencies.length > 0
    && laterRpData04OnlyDependencies.length > 0
  const status: SupabaseMigrationBaselineStatus = hasParallelFoundationBlocker
    ? 'blocked_by_parallel_foundations'
    : 'reproducible'
  const blockers = status === 'reproducible'
    ? []
    : [
        `${LEGACY_FAMILY} and ${RP_DATA_04_FAMILY} define ${incompatibleOverlappingTables.length} overlapping tables with incompatible column contracts.`,
        `Later migrations depend on ${laterLegacyOnlyDependencies.length} ${LEGACY_FAMILY}-only tables and ${laterRpData04OnlyDependencies.length} ${RP_DATA_04_FAMILY}-only tables.`,
        'The raw supabase/migrations directory is not a reproducible reset or deployment source until one canonical compatibility chain replaces the parallel foundations.',
      ]

  return {
    status,
    safeToRunRawMigrationDirectory: status === 'reproducible',
    migrationFiles: orderedSources.map((source) => source.filePath),
    migrationFileCount: orderedSources.length,
    legacyFoundationFiles: orderedSources
      .filter((source) => migrationFamily(source.filePath) === LEGACY_FAMILY)
      .map((source) => source.filePath),
    rpData04FoundationFiles: orderedSources
      .filter((source) => migrationFamily(source.filePath) === RP_DATA_04_FAMILY)
      .map((source) => source.filePath),
    laterMigrationFiles: laterSources.map((source) => source.filePath),
    overlappingTables,
    incompatibleOverlappingTables,
    laterLegacyOnlyDependencies,
    laterRpData04OnlyDependencies,
    blockers,
    nextActions: status === 'reproducible'
      ? ['Run the reviewed local and staging test plan before any production approval.']
      : [
          'Freeze the raw migration directory as historical input; do not run db reset, migration push, or production apply from it.',
          'Choose one identity/workspace/project contract and build a new isolated canonical chain without rewriting applied history.',
          'Port only current-product tables and compatibility data into the canonical chain, then run local RLS and immutability tests.',
          'Add durable Edit Preferences only after the canonical chain passes a clean local reset.',
        ],
  }
}

function parseTableDefinitions(source: SupabaseMigrationSource): SupabaseMigrationTableDefinition[] {
  const definitions: SupabaseMigrationTableDefinition[] = []
  const pattern = /create\s+table\s+(if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_]*)\s*\(/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(source.sql)) !== null) {
    const openParenIndex = pattern.lastIndex - 1
    const closeParenIndex = findMatchingParen(source.sql, openParenIndex)
    if (closeParenIndex < 0) {
      continue
    }

    definitions.push({
      tableName: match[2].toLowerCase(),
      filePath: source.filePath,
      family: migrationFamily(source.filePath),
      createMode: match[1] ? 'if_not_exists' : 'strict',
      columns: extractColumnNames(source.sql.slice(openParenIndex + 1, closeParenIndex)),
    })
    pattern.lastIndex = closeParenIndex + 1
  }

  return definitions
}

function findMatchingParen(sql: string, openParenIndex: number): number {
  let depth = 0
  let singleQuoted = false
  let doubleQuoted = false

  for (let index = openParenIndex; index < sql.length; index += 1) {
    const character = sql[index]
    const nextCharacter = sql[index + 1]

    if (singleQuoted) {
      if (character === "'" && nextCharacter === "'") {
        index += 1
      } else if (character === "'") {
        singleQuoted = false
      }
      continue
    }

    if (doubleQuoted) {
      if (character === '"' && nextCharacter === '"') {
        index += 1
      } else if (character === '"') {
        doubleQuoted = false
      }
      continue
    }

    if (character === "'") {
      singleQuoted = true
    } else if (character === '"') {
      doubleQuoted = true
    } else if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function extractColumnNames(tableBody: string): string[] {
  const ignoredLeadingWords = new Set([
    'check',
    'constraint',
    'exclude',
    'foreign',
    'like',
    'primary',
    'unique',
  ])

  return splitTopLevel(tableBody)
    .map((segment) => segment.replace(/--.*$/gm, '').trim())
    .map((segment) => segment.match(/^"?([a-z_][a-z0-9_]*)"?\s+/i)?.[1]?.toLowerCase())
    .filter((column): column is string => typeof column === 'string')
    .filter((column) => !ignoredLeadingWords.has(column))
    .filter((column, index, columns) => columns.indexOf(column) === index)
    .sort()
}

function splitTopLevel(value: string): string[] {
  const segments: string[] = []
  let start = 0
  let depth = 0
  let singleQuoted = false
  let doubleQuoted = false

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    const nextCharacter = value[index + 1]

    if (singleQuoted) {
      if (character === "'" && nextCharacter === "'") {
        index += 1
      } else if (character === "'") {
        singleQuoted = false
      }
      continue
    }

    if (doubleQuoted) {
      if (character === '"' && nextCharacter === '"') {
        index += 1
      } else if (character === '"') {
        doubleQuoted = false
      }
      continue
    }

    if (character === "'") {
      singleQuoted = true
    } else if (character === '"') {
      doubleQuoted = true
    } else if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth -= 1
    } else if (character === ',' && depth === 0) {
      segments.push(value.slice(start, index))
      start = index + 1
    }
  }

  segments.push(value.slice(start))
  return segments
}

function extractExternalTableMentions(source: SupabaseMigrationSource): string[] {
  const definitions = new Set(parseTableDefinitions(source).map((definition) => definition.tableName))
  const mentions = [...source.sql.matchAll(/public\.([a-z_][a-z0-9_]*)/gi)]
    .map((match) => match[1].toLowerCase())
    .filter((tableName) => !definitions.has(tableName))

  return [...new Set(mentions)]
}

function definitionMap(
  definitions: SupabaseMigrationTableDefinition[],
): Map<string, SupabaseMigrationTableDefinition> {
  return new Map(definitions.map((definition) => [definition.tableName, definition]))
}

function requiredDefinition(
  definitions: Map<string, SupabaseMigrationTableDefinition>,
  tableName: string,
): SupabaseMigrationTableDefinition {
  const definition = definitions.get(tableName)
  if (!definition) {
    throw new Error(`Missing migration table definition for ${tableName}.`)
  }
  return definition
}

function migrationFamily(filePath: string): string {
  return basename(filePath).slice(0, 8)
}
