import { existsSync } from 'node:fs'
import { delimiter, resolve } from 'node:path'
import {
  runBetaToolsCoreRealCheckPreview,
  type BetaToolsCoreRealCheckPreviewEnv,
  type BetaToolsCoreRealCheckPreviewOptions,
  type BetaToolsCoreRealCheckPreviewReport,
} from './beta-tools-core-real-check-preview'

export interface BetaToolsCoreRealCheckHydratedPreviewEnv extends BetaToolsCoreRealCheckPreviewEnv {
  REEDITPRO_READINESS_PYTHON_BIN?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_VENV_DIR?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_READINESS_BIN_DIR?: string
}

export interface BetaToolsCoreRealCheckHydratedPreviewReport {
  ok: boolean
  previewOnly: true
  hydratedPythonReady: boolean
  hydratedPythonPath: string
  hydratedPythonSource: 'env_override' | 'default_readiness_venv'
  readinessBinPath: string
  readinessBinIncludedInPath: boolean
  setupCommand: 'npm run tools:readiness:install-core-python'
  previewReport?: BetaToolsCoreRealCheckPreviewReport
  warnings: string[]
}

export type BetaToolsCoreRealCheckHydratedPreviewOptions = BetaToolsCoreRealCheckPreviewOptions

export function runBetaToolsCoreRealCheckHydratedPreview(
  env: BetaToolsCoreRealCheckHydratedPreviewEnv,
  options: BetaToolsCoreRealCheckHydratedPreviewOptions = {},
): BetaToolsCoreRealCheckHydratedPreviewReport {
  const hydratedPython = resolveHydratedPython(env)
  const readinessBin = resolveReadinessBin(env)

  if (!existsSync(hydratedPython.path)) {
    return {
      ok: false,
      previewOnly: true,
      hydratedPythonReady: false,
      hydratedPythonPath: hydratedPython.path,
      hydratedPythonSource: hydratedPython.source,
      readinessBinPath: readinessBin.path,
      readinessBinIncludedInPath: readinessBin.exists,
      setupCommand: 'npm run tools:readiness:install-core-python',
      warnings: [
        `Hydrated readiness Python is missing at ${hydratedPython.path}.`,
        'Run npm run tools:readiness:install-core-python first, or set REEDITPRO_READINESS_PYTHON_BIN to an existing readiness Python.',
        ...hydratedPreviewWarnings(),
      ],
    }
  }

  const previousPythonBin = process.env.REEDITPRO_READINESS_PYTHON_BIN
  const previousPath = process.env.PATH
  process.env.REEDITPRO_READINESS_PYTHON_BIN = hydratedPython.path
  if (readinessBin.exists) {
    process.env.PATH = previousPath
      ? `${readinessBin.path}${delimiter}${previousPath}`
      : readinessBin.path
  }
  try {
    const previewReport = runBetaToolsCoreRealCheckPreview(env, options)
    return {
      ok: previewReport.ok,
      previewOnly: true,
      hydratedPythonReady: true,
      hydratedPythonPath: hydratedPython.path,
      hydratedPythonSource: hydratedPython.source,
      readinessBinPath: readinessBin.path,
      readinessBinIncludedInPath: readinessBin.exists,
      setupCommand: 'npm run tools:readiness:install-core-python',
      previewReport,
      warnings: hydratedPreviewWarnings(),
    }
  } finally {
    if (previousPythonBin === undefined) {
      delete process.env.REEDITPRO_READINESS_PYTHON_BIN
    } else {
      process.env.REEDITPRO_READINESS_PYTHON_BIN = previousPythonBin
    }
    if (previousPath === undefined) {
      delete process.env.PATH
    } else {
      process.env.PATH = previousPath
    }
  }
}

function resolveHydratedPython(env: BetaToolsCoreRealCheckHydratedPreviewEnv): {
  path: string
  source: BetaToolsCoreRealCheckHydratedPreviewReport['hydratedPythonSource']
} {
  const override = clean(env.REEDITPRO_READINESS_PYTHON_BIN)
  if (override) {
    return {
      path: resolve(override),
      source: 'env_override',
    }
  }

  const venvDir = clean(env.REEDITPRO_BETA_TOOLS_PREVIEW_VENV_DIR) ?? '.reeditpro-tool-readiness-python'
  return {
    path: resolve(venvDir, 'bin', 'python'),
    source: 'default_readiness_venv',
  }
}

function resolveReadinessBin(env: BetaToolsCoreRealCheckHydratedPreviewEnv): {
  path: string
  exists: boolean
} {
  const binDir = clean(env.REEDITPRO_BETA_TOOLS_PREVIEW_READINESS_BIN_DIR) ?? '.reeditpro-tool-readiness-bin'
  const path = resolve(binDir)
  return {
    path,
    exists: existsSync(path),
  }
}

function hydratedPreviewWarnings(): string[] {
  return [
    'Hydrated preview is local and no-write; it does not call the deployed backend or record evidence.',
    'Hydrated preview may import safe CPU/render Python packages only through the readiness venv.',
    'Hydrated preview prepends the gitignored readiness bin to PATH when present so bounded source-built tools can be checked without installing globally.',
    'Hydrated preview must not process media, run Docker, call providers, write Supabase, enable beta, or enable production.',
    'A passing hydrated preview still requires deployed staging evidence recording through beta:tools:core-real-check-evidence.',
  ]
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runBetaToolsCoreRealCheckHydratedPreview(process.env, {
    localDefaults: process.argv.includes('--local-defaults'),
  })
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) {
    process.exitCode = 1
  }
}
