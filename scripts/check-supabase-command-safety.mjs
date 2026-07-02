#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const failOnBlocked = process.argv.includes('--fail-on-blocked')

const allowedScriptFiles = new Set([
  'scripts/check-supabase-remote-gates.mjs',
  'scripts/inspect-supabase-remote-readonly.mjs',
  'scripts/supabase-command-guard.mjs',
  'scripts/check-supabase-command-safety.mjs',
  'scripts/create-rc-worktree-inventory.mjs',
])

const forbiddenPatterns = [
  'supabase db push',
  'supabase db pull',
  'supabase db dump',
  'supabase db query',
  'supabase migration repair',
  'supabase gen types --linked',
  'supabase gen types --project-id',
]

const gatedPatterns = [
  'supabase db push --dry-run',
  'supabase migration list',
  'supabase link',
]

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(cwd, relativePath), 'utf8'))
}

function normalize(value) {
  return value.toLowerCase().replace(/\s+/g, ' ')
}

function findBlockedPattern(value) {
  const text = normalize(value)
  const gated = gatedPatterns.find((pattern) => text.includes(pattern))
  if (gated) return { pattern: gated, decision: 'requires_approved_wrapper' }
  const forbidden = forbiddenPatterns.find((pattern) => text.includes(pattern))
  if (forbidden) return { pattern: forbidden, decision: 'blocked_forbidden_command' }
  if (/`[^`]*supabase[^`]*`/i.test(value) || /\$\([^)]*supabase[^)]*\)/i.test(value)) {
    return { pattern: 'command substitution', decision: 'blocked_command_substitution_risk' }
  }
  return undefined
}

const findings = []
const packageJson = readJson('package.json')
for (const [name, script] of Object.entries(packageJson.scripts ?? {})) {
  const finding = findBlockedPattern(String(script))
  if (finding) {
    findings.push({
      file: 'package.json',
      script: name,
      pattern: finding.pattern,
      decision: finding.decision,
    })
  }
}

const scriptsDir = path.resolve(cwd, 'scripts')
if (existsSync(scriptsDir)) {
  for (const name of readdirSync(scriptsDir).filter((entry) => entry.endsWith('.mjs'))) {
    const relativePath = `scripts/${name}`
    if (allowedScriptFiles.has(relativePath)) continue
    const text = readFileSync(path.resolve(cwd, relativePath), 'utf8')
    const finding = findBlockedPattern(text)
    if (finding) {
      findings.push({
        file: relativePath,
        pattern: finding.pattern,
        decision: finding.decision,
      })
    }
  }
}

const output = {
  ok: findings.length === 0,
  findings,
  scannedPackageScripts: Object.keys(packageJson.scripts ?? {}).length,
  scannedScriptFiles: existsSync(scriptsDir) ? readdirSync(scriptsDir).filter((entry) => entry.endsWith('.mjs')).length : 0,
  remoteCommandsRun: false,
  remoteMutationsRun: false,
  remoteSQLRun: false,
  remoteTypegenRun: false,
  secretsPrinted: false,
  note: 'Static command safety check only; no Supabase command is executed.',
}

console.log(JSON.stringify(output, null, 2))

if (!output.ok && failOnBlocked) process.exit(1)
