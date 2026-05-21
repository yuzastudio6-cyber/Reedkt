import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const nodeRequire = createRequire(import.meta.url)

export interface CommandResult {
  ok: boolean
  stdout: string
  stderr: string
  command: string
  errorCode?: string
}

export async function runVersionCommand(
  commandLine: string,
  args: string[],
  timeoutMs: number,
): Promise<CommandResult> {
  const parsed = parseCommandLine(commandLine)
  if (!parsed.command) {
    return { ok: false, stdout: '', stderr: 'Command is empty.', command: commandLine, errorCode: 'command_empty' }
  }

  try {
    const result = await execFileAsync(parsed.command, [...parsed.args, ...args], {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
    return {
      ok: true,
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
      command: [parsed.command, ...parsed.args, ...args].join(' '),
    }
  } catch (error) {
    return {
      ok: false,
      stdout: outputFromError(error, 'stdout'),
      stderr: outputFromError(error, 'stderr') || (error instanceof Error ? error.message : 'Command failed.'),
      command: [parsed.command, ...parsed.args, ...args].join(' '),
      errorCode: errorCodeFromError(error),
    }
  }
}

export function parseFirstVersionLine(output: string): string | undefined {
  const firstLine = output.split(/\r?\n/).find((line) => line.trim().length > 0)
  return firstLine?.trim()
}

export function resolveOptionalPackage(packageName: string): { resolved: boolean; version?: string; errorCode?: string } {
  try {
    const packageJsonPath = nodeRequire.resolve(`${packageName}/package.json`)
    const packageJson = nodeRequire(packageJsonPath) as { version?: string }
    return { resolved: true, version: packageJson.version }
  } catch {
    return { resolved: false, errorCode: 'package_not_installed' }
  }
}

export function parseCommandLine(commandLine: string): { command: string; args: string[] } {
  const trimmed = commandLine.trim()
  if (!trimmed) return { command: '', args: [] }

  const parts = trimmed.match(/"[^"]+"|'[^']+'|\S+/g) ?? []
  const normalized = parts.map((part) => part.replace(/^["']|["']$/g, ''))
  return { command: normalized[0] ?? '', args: normalized.slice(1) }
}

function outputFromError(error: unknown, key: 'stdout' | 'stderr'): string {
  if (error && typeof error === 'object' && key in error) {
    const value = (error as Record<string, unknown>)[key]
    return typeof value === 'string' ? value : ''
  }
  return ''
}

function errorCodeFromError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const value = (error as Record<string, unknown>).code
    return typeof value === 'string' ? value : 'command_failed'
  }
  return 'command_failed'
}
