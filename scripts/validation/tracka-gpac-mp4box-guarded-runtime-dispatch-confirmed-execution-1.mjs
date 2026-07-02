#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1'
const gateName = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH'
const requiredGate = `${gateName}=true`
const packetDir =
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1'
const pinnedContractPath =
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/pinned-dispatch-contract.json'
const routeMetadataPath = 'src/backend/api/routes/gpac-mp4box-api-routes.ts'
const routeContractPath =
  'src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts.ts'
const workerSkeletonPath =
  'src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts'

function nowRunId() {
  const iso = new Date().toISOString().replace(/[:.]/g, '-')
  const suffix = crypto.randomBytes(4).toString('hex')
  return `${iso}-${suffix}`
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

function ensureSourceContract() {
  const contract = readJson(pinnedContractPath)
  const routeMetadata = read(routeMetadataPath)
  const routeContract = read(routeContractPath)
  const workerSkeleton = read(workerSkeletonPath)

  const requiredSnippets = [
    contract.route?.routeId,
    contract.route?.path,
    contract.workerTarget?.skeletonId,
    contract.workerTarget?.workerKind,
    contract.approvedSnapshotFixture?.id,
    'status: \'disabled\'',
    'routeEnabled: false',
    'workerExecution: false',
    'gpacMp4boxExecution: false',
  ].filter(Boolean)

  const sourceCorpus = [routeMetadata, routeContract, workerSkeleton].join('\n')
  const missing = requiredSnippets.filter((snippet) => !sourceCorpus.includes(snippet))

  return {
    contract,
    missing,
    routeDisabled: routeMetadata.includes("status: 'disabled'"),
    routeExecutionEnabled: /routeExecution:\s*true/.test(sourceCorpus),
    workerExecutionEnabled: /workerExecution:\s*true/.test(sourceCorpus),
    gpacMp4boxExecutionEnabled: /gpacMp4boxExecution:\s*true/.test(sourceCorpus),
  }
}

function createReport({ runId, outputDir, observedGate, blocker, sourceCheck }) {
  const decision = blocker
  const execution =
    blocker === 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation'
      ? 'blocked_confirmation_absent_no_route_worker_or_tool_execution'
      : 'blocked_source_route_handler_disabled_no_route_worker_or_tool_execution'

  const contract = sourceCheck.contract
  return {
    packet,
    runId,
    generatedAt: new Date().toISOString(),
    outputDirectory: outputDir,
    decision,
    execution,
    blocker,
    confirmationGate: {
      name: gateName,
      required: requiredGate,
      observed: observedGate,
    },
    pinnedDispatchContract: {
      source: pinnedContractPath,
      routeId: contract.route?.routeId,
      routePath: contract.route?.path,
      routeStatus: contract.route?.status,
      workerSkeletonId: contract.workerTarget?.skeletonId,
      workerKind: contract.workerTarget?.workerKind,
      approvedSnapshotFixtureId: contract.approvedSnapshotFixture?.id,
      privateInputManifestId: contract.manifestAndArtifactRefs?.privateInputManifestId,
      privateArtifactManifestId: contract.manifestAndArtifactRefs?.privateArtifactManifestId,
      cleanupPolicyId: contract.rollbackAndResidueReadback?.cleanupPolicyId,
      commandTemplateAllowlist: contract.commandTemplateAllowlist,
    },
    sourceReadiness: {
      routeMetadataFile: routeMetadataPath,
      routeContractFile: routeContractPath,
      workerSkeletonFile: workerSkeletonPath,
      routeDisabled: sourceCheck.routeDisabled,
      missingRequiredSnippets: sourceCheck.missing,
      routeExecutionEnabled: sourceCheck.routeExecutionEnabled,
      workerExecutionEnabled: sourceCheck.workerExecutionEnabled,
      gpacMp4boxExecutionEnabled: sourceCheck.gpacMp4boxExecutionEnabled,
    },
    currentPhaseExecution: {
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gpacMp4boxExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      storageTransfer: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      supabaseMutation: false,
      sqlExecution: false,
      finalRenderExport: false,
      externalBetaExpansion: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    nextRequiredAction:
      blocker === 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation'
        ? 'rerun only with REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true after confirming route source remains scoped'
        : 'implement an enabled guarded backend/service-role route handler in a separate source packet before route dispatch can execute',
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function main() {
  const runId = nowRunId()
  const outputDir = path.join(
    os.tmpdir(),
    'reeditpro-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1',
    runId,
  )
  fs.mkdirSync(outputDir, { recursive: true })

  const sourceCheck = ensureSourceContract()
  const observedGate = process.env[gateName] === 'true' ? 'present_true' : 'absent'
  const blocker =
    observedGate !== 'present_true'
      ? 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation'
      : sourceCheck.routeDisabled
        ? 'blocked_gpac_mp4box_route_handler_not_enabled_for_confirmed_dispatch'
        : sourceCheck.missing.length > 0
          ? 'blocked_gpac_mp4box_dispatch_source_contract_mismatch'
          : 'blocked_gpac_mp4box_dispatch_runner_requires_enabled_handler_implementation'

  const report = createReport({ runId, outputDir, observedGate, blocker, sourceCheck })
  const reportPath = path.join(outputDir, 'gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-report.json')
  writeJson(reportPath, report)

  const manifest = {
    packet,
    runId,
    outputDirectory: outputDir,
    files: [
      {
        path: reportPath,
        byteCount: fs.statSync(reportPath).size,
        sha256: sha256File(reportPath),
      },
      {
        path: pinnedContractPath,
        byteCount: fs.statSync(pinnedContractPath).size,
        sha256: sha256File(pinnedContractPath),
      },
    ],
    reportSha256: sha256Text(JSON.stringify(report)),
    generatedArtifactsCommitted: 'none',
  }
  const manifestPath = path.join(outputDir, 'gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-manifest.json')
  writeJson(manifestPath, manifest)

  const summary = {
    packet,
    result: blocker,
    execution: report.execution,
    runId,
    outputDirectory: outputDir,
    report: reportPath,
    manifest: manifestPath,
  }

  const output = `${JSON.stringify(summary, null, 2)}\n`
  if (blocker === 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation') {
    process.stderr.write(output)
  } else {
    process.stderr.write(output)
  }
  process.exit(1)
}

main()
