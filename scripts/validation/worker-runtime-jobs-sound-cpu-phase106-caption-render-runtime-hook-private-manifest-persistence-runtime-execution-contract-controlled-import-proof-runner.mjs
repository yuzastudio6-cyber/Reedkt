import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const targetSourcePath =
  'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'
const expectedExports = [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult',
  'getSoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate',
]
const forbiddenSourcePatterns = [
  'create' + 'Client(',
  '.in' + 'sert(',
  '.up' + 'sert(',
  'storage' + '.from',
  'create' + 'SignedUrl',
  'fet' + 'ch(',
  'dispatch',
  'executeRoute',
]

function scanSourceText(sourceText) {
  const missingRequiredSnippets = [
    'acceptedForExternalAgentExecutionToday: false',
    'acceptedForRuntimeExecutionToday: false',
    'acceptedForWorkerDispatchToday: false',
  ].filter((snippet) => !sourceText.includes(snippet))
  const forbiddenPatternsFound = forbiddenSourcePatterns.filter((pattern) =>
    sourceText.includes(pattern),
  )

  return {
    missingRequiredSnippets,
    forbiddenPatternsFound,
    passed:
      missingRequiredSnippets.length === 0 && forbiddenPatternsFound.length === 0,
  }
}

function inspectGate(gate) {
  return {
    present: Boolean(gate),
    acceptedForExternalAgentExecutionToday:
      gate?.acceptedForExternalAgentExecutionToday === false,
    acceptedForRuntimeExecutionToday: gate?.acceptedForRuntimeExecutionToday === false,
    acceptedForWorkerDispatchToday: gate?.acceptedForWorkerDispatchToday === false,
    acceptedForPersistenceToday: gate?.acceptedForPersistenceToday === false,
    acceptedForStorageObjectCreationToday:
      gate?.acceptedForStorageObjectCreationToday === false,
    acceptedForSignedUrlCreationToday:
      gate?.acceptedForSignedUrlCreationToday === false,
    acceptedForMediaOpenToday: gate?.acceptedForMediaOpenToday === false,
    acceptedForBetaUnlockToday: gate?.acceptedForBetaUnlockToday === false,
    acceptedForProductionUnlockToday: gate?.acceptedForProductionUnlockToday === false,
  }
}

function summarizeGateInspection(gateInspection) {
  return Object.values(gateInspection).every((value) => value === true)
}

const tsxImportInspectionSource = `
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const targetSourcePath = process.env.REEDITPRO_SOUND_CPU_CONTROLLED_IMPORT_TARGET
const expectedExports = JSON.parse(process.env.REEDITPRO_SOUND_CPU_EXPECTED_EXPORTS ?? '[]')

function inspectGate(gate) {
  return {
    present: Boolean(gate),
    acceptedForExternalAgentExecutionToday:
      gate?.acceptedForExternalAgentExecutionToday === false,
    acceptedForRuntimeExecutionToday: gate?.acceptedForRuntimeExecutionToday === false,
    acceptedForWorkerDispatchToday: gate?.acceptedForWorkerDispatchToday === false,
    acceptedForPersistenceToday: gate?.acceptedForPersistenceToday === false,
    acceptedForStorageObjectCreationToday:
      gate?.acceptedForStorageObjectCreationToday === false,
    acceptedForSignedUrlCreationToday:
      gate?.acceptedForSignedUrlCreationToday === false,
    acceptedForMediaOpenToday: gate?.acceptedForMediaOpenToday === false,
    acceptedForBetaUnlockToday: gate?.acceptedForBetaUnlockToday === false,
    acceptedForProductionUnlockToday: gate?.acceptedForProductionUnlockToday === false,
  }
}

function summarizeGateInspection(gateInspection) {
  return Object.values(gateInspection).every((value) => value === true)
}

async function main() {
try {
  const targetPath = path.join(process.cwd(), targetSourcePath)
  const importedModule = await import(pathToFileURL(targetPath).href)
  const missingExports = expectedExports.filter(
    (exportName) => !(exportName in importedModule),
  )
  const gate =
    importedModule.SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE
  const gateInspection = inspectGate(gate)
  const failClosedGateConfirmed = summarizeGateInspection(gateInspection)

  console.log(
    JSON.stringify({
      ok: missingExports.length === 0 && failClosedGateConfirmed,
      moduleImported: true,
      exportsPresent: missingExports.length === 0,
      missingExports,
      failClosedGateConfirmed,
      gateInspection,
      factoryCalled: false,
      workerDispatched: false,
      supabaseTouched: false,
      mediaOpened: false,
      sqlExecuted: false,
      storageObjectCreated: false,
      signedUrlCreated: false,
      externalAgentExecutionReady: false,
      realUserMediaBetaReady: false,
      productionReady: false,
    }),
  )
} catch (error) {
  console.log(
    JSON.stringify({
      ok: false,
      blockedReason: 'tsx_controlled_import_inspection_failed',
      error: error instanceof Error ? error.message : String(error),
      moduleImported: false,
      factoryCalled: false,
      workerDispatched: false,
      supabaseTouched: false,
    }),
  )
  process.exitCode = 1
}
}

main()
`

function resolveTsxCommand() {
  const localBin = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
  )
  return fs.existsSync(localBin) ? localBin : 'tsx'
}

function runTsxImportInspection() {
  const command = resolveTsxCommand()
  const child = spawnSync(command, ['--eval', tsxImportInspectionSource], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      REEDITPRO_SOUND_CPU_CONTROLLED_IMPORT_TARGET: targetSourcePath,
      REEDITPRO_SOUND_CPU_EXPECTED_EXPORTS: JSON.stringify(expectedExports),
    },
    maxBuffer: 1024 * 1024,
  })

  if (child.error) {
    return {
      ok: false,
      blockedReason: 'tsx_controlled_import_inspection_unavailable',
      error: child.error.message,
      moduleImported: false,
      factoryCalled: false,
      workerDispatched: false,
      supabaseTouched: false,
    }
  }

  const output = child.stdout.trim()
  try {
    const parsed = JSON.parse(output)
    return {
      ...parsed,
      invokedWith: 'tsx',
      stderr: child.stderr.trim() ? 'sanitized_stderr_present' : '',
      exitStatus: child.status,
      ok: child.status === 0 && parsed.ok === true,
    }
  } catch {
    return {
      ok: false,
      blockedReason: 'tsx_controlled_import_inspection_output_parse_failed',
      stdout: output ? 'sanitized_stdout_present' : '',
      stderr: child.stderr.trim() ? 'sanitized_stderr_present' : '',
      exitStatus: child.status,
      moduleImported: false,
      factoryCalled: false,
      workerDispatched: false,
      supabaseTouched: false,
    }
  }
}

async function main() {
  const targetPath = path.join(process.cwd(), targetSourcePath)
  const sourceText = fs.readFileSync(targetPath, 'utf8')
  const staticScan = scanSourceText(sourceText)

  if (!staticScan.passed) {
    return {
      ok: false,
      blockedReason: 'target_source_static_scan_failed',
      targetSourcePath,
      staticScan,
      moduleImported: false,
      exportsPresent: false,
      failClosedGateConfirmed: false,
      factoryCalled: false,
      workerDispatched: false,
      supabaseTouched: false,
    }
  }

  const importInspection = runTsxImportInspection()

  return {
    ok: importInspection.ok === true,
    targetSourcePath,
    staticScan,
    moduleImported: importInspection.moduleImported === true,
    exportsPresent: importInspection.exportsPresent === true,
    missingExports: importInspection.missingExports ?? expectedExports,
    failClosedGateConfirmed: importInspection.failClosedGateConfirmed === true,
    gateInspection: importInspection.gateInspection ?? inspectGate(undefined),
    proofHarnessExecutionPath: 'tsx',
    importInspection,
    factoryCalled: false,
    workerDispatched: false,
    supabaseTouched: false,
    mediaOpened: false,
    sqlExecuted: false,
    storageObjectCreated: false,
    signedUrlCreated: false,
    externalAgentExecutionReady: false,
    realUserMediaBetaReady: false,
    productionReady: false,
  }
}

main()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  })
  .catch((error) => {
    console.log(
      JSON.stringify(
        {
          ok: false,
          blockedReason: 'controlled_import_proof_runner_failed',
          error: error instanceof Error ? error.message : String(error),
          moduleImported: false,
          factoryCalled: false,
          workerDispatched: false,
          supabaseTouched: false,
        },
        null,
        2,
      ),
    )
    process.exitCode = 1
  })
