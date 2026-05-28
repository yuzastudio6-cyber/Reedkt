import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  localBaselineCommandCatalog,
} from './local-baseline-command-catalog'
import {
  assertLocalBaselineCatalogSafe,
  assertLocalBaselineExecuteConfirmed,
  assertLocalBaselineProductionBlocked,
  evaluateLocalBaselineCatalogEntry,
} from './local-baseline-policy'
import {
  buildLocalBaselineReport,
} from './local-baseline-report-builder'
import {
  notRunCommandResult,
  parseLocalBaselineCommandResult,
} from './local-baseline-result-parser'
import type {
  LocalBaselineCommandResult,
  LocalBaselineReport,
  RunLocalBaselineOptions,
} from './local-baseline-types'

const commandOutputCaptureLimit = 12000

export async function runLocalBaseline(options: RunLocalBaselineOptions = {}): Promise<LocalBaselineReport> {
  const cwd = options.cwd ?? process.cwd()
  const env = options.env ?? process.env
  const mode = options.mode ?? 'static_only'
  const packageScripts = readPackageScripts(cwd)

  assertLocalBaselineProductionBlocked()
  assertLocalBaselineCatalogSafe(localBaselineCommandCatalog)

  if (mode !== 'execute_confirmed') {
    return buildLocalBaselineReport({
      mode,
      packageScripts,
      sourceBranch: options.sourceBranch,
      activationBaselineAuditExists: activationBaselineFilesExist(cwd),
    })
  }

  assertLocalBaselineExecuteConfirmed(env)

  const commandResults: LocalBaselineCommandResult[] = []
  let stopped = false

  for (const entry of localBaselineCommandCatalog) {
    if (stopped) {
      commandResults.push(notRunCommandResult(entry.commandId, entry.npmScript))
      continue
    }

    const policyCheck = evaluateLocalBaselineCatalogEntry(entry)
    if (!policyCheck.allowed) {
      commandResults.push({
        commandId: entry.commandId,
        npmScript: entry.npmScript,
        status: 'failed',
        warnings: [],
        error: policyCheck.blockers.join('; '),
      })
      stopped = !options.continueOnFailure
      continue
    }

    if (!packageScripts[entry.npmScript]) {
      commandResults.push({
        commandId: entry.commandId,
        npmScript: entry.npmScript,
        status: 'failed',
        warnings: [],
        error: `Missing package.json script: ${entry.npmScript}`,
      })
      stopped = !options.continueOnFailure
      continue
    }

    const result = await runPackageScript(entry.commandId, entry.npmScript, cwd, env)
    commandResults.push(result)
    if (result.status === 'failed' && !options.continueOnFailure) {
      stopped = true
    }
  }

  return buildLocalBaselineReport({
    mode,
    packageScripts,
    commandResults,
    sourceBranch: options.sourceBranch,
    activationBaselineAuditExists: activationBaselineFilesExist(cwd),
  })
}

export function readPackageScripts(cwd: string): Record<string, string> {
  const packageJsonPath = join(cwd, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> }
  return packageJson.scripts ?? {}
}

function activationBaselineFilesExist(cwd: string): boolean {
  return existsSync(join(cwd, 'docs/activation-baseline-audit.md')) &&
    existsSync(join(cwd, 'server/activation/activation-baseline-audit-report.ts'))
}

async function runPackageScript(
  commandId: string,
  npmScript: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<LocalBaselineCommandResult> {
  const startedAt = new Date().toISOString()
  const started = Date.now()
  const stdoutChunks: string[] = []
  const stderrChunks: string[] = []

  const npmExecPath = env.npm_execpath
  const command = npmExecPath ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm')
  const args = npmExecPath ? [npmExecPath, 'run', npmScript] : ['run', npmScript]

  return await new Promise<LocalBaselineCommandResult>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout?.on('data', (chunk: Buffer) => appendCapped(stdoutChunks, chunk.toString('utf8')))
    child.stderr?.on('data', (chunk: Buffer) => appendCapped(stderrChunks, chunk.toString('utf8')))

    child.on('error', (error) => {
      const completedAt = new Date().toISOString()
      resolve(parseLocalBaselineCommandResult({
        commandId,
        npmScript,
        exitCode: 1,
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
        startedAt,
        completedAt,
        durationMs: Date.now() - started,
        error: error.message,
      }))
    })

    child.on('close', (exitCode) => {
      const completedAt = new Date().toISOString()
      resolve(parseLocalBaselineCommandResult({
        commandId,
        npmScript,
        exitCode,
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
        startedAt,
        completedAt,
        durationMs: Date.now() - started,
      }))
    })
  })
}

function appendCapped(chunks: string[], next: string): void {
  const currentLength = chunks.reduce((total, chunk) => total + chunk.length, 0)
  if (currentLength >= commandOutputCaptureLimit) return
  chunks.push(next.slice(0, commandOutputCaptureLimit - currentLength))
}
