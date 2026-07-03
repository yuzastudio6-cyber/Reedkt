import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

import { AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT } from './ai-video-broll-gen-10y-l4-payload-install-runner-contract'

type JsonRecord = Record<string, unknown>

type PhaseResult = {
  id: string
  ok: boolean
  exitCode: number | null
  timedOut: boolean
  stdoutSummary?: string
  stderrSummary?: string
}

type RunnerSummary = {
  ok: boolean
  mode: string
  status: 'planned' | 'blocked' | 'passed' | 'failed'
  decision: string
  summaryPath: string
  nextPrompt: string
  blockers: string[]
  phaseResults: PhaseResult[]
  preflightPassed: boolean
  computeVmCreateAttempted: boolean
  computeVmCreated: boolean
  postCreatePrivateOnlyVerified: boolean
  bootDiskAutoDeleteVerified: boolean
  iapLookupReadinessPassed: boolean
  python312ReadinessPassed: boolean
  wheelhousePayloadTransferred: boolean
  remoteManifestValidationPassed: boolean
  offlineDependencyInstallPassed: boolean
  dependencyImportReadinessPassed: boolean
  cleanupAttempted: boolean
  cleanupVerified: boolean
  runtimeSideEffects: JsonRecord
}

const CONTRACT = AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_10Z_L4_PAYLOAD_INSTALL_RETRY'
const DEFAULT_SUMMARY_PATH = path.join(
  '.tmp',
  'ai-video-broll-gen-10z-l4-payload-install-retry-summary.json',
)
const PROJECT_ID = CONTRACT.projectId
const PROOF_VM_NAME = CONTRACT.proofVmName
const TARGET_REGION = CONTRACT.targetRegion
const TARGET_ZONE = CONTRACT.targetZone
const MACHINE_TYPE = CONTRACT.machineType
const ACCELERATOR = 'nvidia-l4'
const TARGET_TAG = 'ai-video-broll-wan-l4-proof'
const IMAGE_FAMILY = 'common-cu129-ubuntu-2404-nvidia-580'
const IMAGE_PROJECT = 'deeplearning-platform-release'
const SERVICE_ACCOUNT = `reeditpro-ai-broll-proof-sa@${PROJECT_ID}.iam.gserviceaccount.com`
const WHEELHOUSE_PATH =
  '/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64'
const WHEELHOUSE_MANIFEST = path.join(WHEELHOUSE_PATH, 'SHA256SUMS.json')
const REQUIREMENTS_PATH = 'server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt'
const REMOTE_ROOT = '/tmp/reeditpro-broll-10z'
const REMOTE_WHEELHOUSE = `${REMOTE_ROOT}/python312-linux-x86_64`
const EXPECTED_WHEEL_COUNT = 66
const EXPECTED_WHEELHOUSE_BYTES = 2802483442
const EXPECTED_WHEELHOUSE_SHA256 = '55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64'
const NEXT_PROMPT_IF_PASSED =
  'AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference'
const NEXT_PROMPT_IF_FAILED =
  'AI-VIDEO-BROLL-GEN-10ZA-PAYLOAD-DELIVERY-TIMEOUT-FIX: fix B-roll L4 dependency payload delivery after IAP wheelhouse transfer timeout, no VM/no model/no inference'

function main() {
  const execute = process.argv.includes('--execute')
  const summaryPath = getArgValue('--summary-path') ?? DEFAULT_SUMMARY_PATH

  if (!execute) {
    const summary = baseSummary(summaryPath, 'planned')
    summary.mode = 'ai_video_broll_gen_10z_l4_payload_install_runner_plan'
    summary.decision = 'ai_video_broll_gen_10z_l4_payload_install_runner_static_plan_only_no_gcp_commands'
    summary.nextPrompt =
      'AI-VIDEO-BROLL-GEN-10Z-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-AFTER-RUNNER-FIX: retry bounded no-idle L4 payload/install readiness after raw JSON cleanup runner fix, no model import/no inference'
    print(summary)
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    const summary = baseSummary(summaryPath, 'blocked')
    summary.mode = 'ai_video_broll_gen_10z_l4_payload_install_runner_confirmation_blocked'
    summary.decision = 'ai_video_broll_gen_10z_l4_payload_install_runner_confirmation_required_no_gcp_commands'
    summary.blockers = [`confirmation_env_required:${CONFIRM_ENV}=true`]
    print(summary)
    return
  }

  const phaseResults: PhaseResult[] = []
  let computeVmCreated = false
  let computeVmCreateAttempted = false
  let postCreatePrivateOnlyVerified = false
  let bootDiskAutoDeleteVerified = false
  let iapLookupReadinessPassed = false
  let python312ReadinessPassed = false
  let wheelhousePayloadTransferred = false
  let remoteManifestValidationPassed = false
  let offlineDependencyInstallPassed = false
  let dependencyImportReadinessPassed = false
  let cleanupAttempted = false
  let cleanupVerified = false

  const writeSummary = (partial: Partial<RunnerSummary>) => {
    writeDurableSummary(summaryPath, {
      ...baseSummary(summaryPath, 'failed'),
      phaseResults,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      wheelhousePayloadTransferred,
      remoteManifestValidationPassed,
      offlineDependencyInstallPassed,
      dependencyImportReadinessPassed,
      cleanupAttempted,
      cleanupVerified,
      ...partial,
    })
  }

  try {
    const preflight = runPreflight()
    phaseResults.push(...preflight.phaseResults)

    if (!preflight.ok) {
      const blockedSummary: RunnerSummary = {
        ...baseSummary(summaryPath, 'blocked'),
        mode: 'ai_video_broll_gen_10z_l4_payload_install_runner_preflight_blocked',
        decision: 'ai_video_broll_gen_10z_l4_payload_install_preflight_blocked_no_vm_created',
        preflightPassed: false,
        blockers: preflight.blockers,
        phaseResults,
        runtimeSideEffects: runtimeSideEffects({
          computeVmCreateAttempted: false,
          computeVmCreated: false,
          cleanupAttempted: false,
          cleanupVerified: false,
        }),
      }
      writeDurableSummary(summaryPath, blockedSummary)
      print(blockedSummary)
      return
    }

    writeSummary({
      status: 'planned',
      mode: 'ai_video_broll_gen_10z_l4_payload_install_runner_preflight_passed_vm_create_pending',
      decision: 'ai_video_broll_gen_10z_l4_payload_install_preflight_passed_vm_create_pending',
      preflightPassed: true,
      blockers: [],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
      }),
    })

    computeVmCreateAttempted = true
    const create = runGcloud(
      'create_prompt_scoped_l4_vm',
      [
        'compute',
        'instances',
        'create',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--machine-type',
        MACHINE_TYPE,
        '--accelerator',
        `type=${ACCELERATOR},count=1`,
        '--maintenance-policy',
        'TERMINATE',
        '--image-family',
        IMAGE_FAMILY,
        '--image-project',
        IMAGE_PROJECT,
        '--network-interface',
        'network=default,no-address',
        '--tags',
        TARGET_TAG,
        '--service-account',
        SERVICE_ACCOUNT,
        '--scopes',
        'logging-write,monitoring-write',
        '--boot-disk-size',
        '120GB',
        '--boot-disk-type',
        'pd-balanced',
        '--boot-disk-auto-delete',
        '--quiet',
      ],
      10 * 60_000,
    )
    phaseResults.push(create)
    computeVmCreated = create.ok || describeInstanceCompact().ok
    writeSummary({
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      blockers: create.ok ? [] : ['l4_vm_create_failed_or_timed_out'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
      }),
    })

    if (!computeVmCreated) {
      cleanupAttempted = true
      const cleanup = cleanupPromptResources()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      finish(summaryPath, 'failed', ['l4_vm_create_failed_or_timed_out'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const readiness = waitForInstanceReadiness()
    phaseResults.push(...readiness.phaseResults)
    postCreatePrivateOnlyVerified = readiness.privateOnly
    bootDiskAutoDeleteVerified = readiness.bootDiskAutoDelete
    writeSummary({
      status: readiness.ok ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10z_l4_payload_install_runner_post_create_readiness_checkpoint',
      decision: readiness.ok
        ? 'ai_video_broll_gen_10z_l4_payload_install_post_create_readiness_verified'
        : 'ai_video_broll_gen_10z_l4_payload_install_post_create_readiness_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      blockers: readiness.blockers,
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
      }),
    })

    if (!readiness.ok) {
      cleanupAttempted = true
      const cleanup = cleanupPromptResources()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      finish(summaryPath, 'failed', readiness.blockers, {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const iap = waitForIapLookupReadiness()
    phaseResults.push(...iap.phaseResults)
    iapLookupReadinessPassed = iap.ok
    writeSummary({
      status: iap.ok ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10z_l4_payload_install_runner_iap_readiness_checkpoint',
      decision: iap.ok
        ? 'ai_video_broll_gen_10z_l4_payload_install_iap_readiness_verified'
        : 'ai_video_broll_gen_10z_l4_payload_install_iap_readiness_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      blockers: iap.ok ? [] : ['iap_lookup_readiness_not_captured'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        sshSessionOpened: iapLookupReadinessPassed,
      }),
    })
    if (!iap.ok) {
      cleanupAttempted = true
      const cleanup = cleanupPromptResources()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      finish(summaryPath, 'failed', ['iap_lookup_readiness_not_captured'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const python = runSsh('python312_readiness_check', 'python3.12 --version', 90_000)
    phaseResults.push(python)
    python312ReadinessPassed = python.ok && Boolean(python.stdoutSummary?.includes('Python 3.12'))
    writeSummary({
      status: python312ReadinessPassed ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10z_l4_payload_install_runner_python312_checkpoint',
      decision: python312ReadinessPassed
        ? 'ai_video_broll_gen_10z_l4_payload_install_python312_verified'
        : 'ai_video_broll_gen_10z_l4_payload_install_python312_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      blockers: python312ReadinessPassed ? [] : ['python312_readiness_failed_before_payload_transfer'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        sshSessionOpened: iapLookupReadinessPassed,
      }),
    })
    if (!python312ReadinessPassed) {
      cleanupAttempted = true
      const cleanup = cleanupPromptResources()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      finish(summaryPath, 'failed', ['python312_readiness_failed_before_payload_transfer'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const remotePrep = runSsh('prepare_remote_payload_directory', `rm -rf ${REMOTE_ROOT} && mkdir -p ${REMOTE_ROOT}`, 90_000)
    phaseResults.push(remotePrep)

    const transferRequirements = runGcloud(
      'transfer_requirements_manifest_over_iap',
      [
        'compute',
        'scp',
        REQUIREMENTS_PATH,
        `${PROOF_VM_NAME}:${REMOTE_ROOT}/requirements.ai-video-broll.txt`,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--tunnel-through-iap',
        '--quiet',
      ],
      5 * 60_000,
    )
    phaseResults.push(transferRequirements)

    const transferWheelhouse = runGcloud(
      'transfer_private_wheelhouse_over_iap',
      [
        'compute',
        'scp',
        '--recurse',
        WHEELHOUSE_PATH,
        `${PROOF_VM_NAME}:${REMOTE_ROOT}/`,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--tunnel-through-iap',
        '--quiet',
      ],
      30 * 60_000,
    )
    phaseResults.push(transferWheelhouse)
    wheelhousePayloadTransferred = transferRequirements.ok && transferWheelhouse.ok
    writeSummary({
      status: wheelhousePayloadTransferred ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10z_l4_payload_install_runner_payload_transfer_checkpoint',
      decision: wheelhousePayloadTransferred
        ? 'ai_video_broll_gen_10z_l4_payload_install_payload_transfer_complete'
        : 'ai_video_broll_gen_10z_l4_payload_install_payload_transfer_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      wheelhousePayloadTransferred,
      blockers: wheelhousePayloadTransferred ? [] : ['wheelhouse_payload_transfer_failed'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        sshSessionOpened: iapLookupReadinessPassed,
        iapTransferExecuted: transferRequirements.ok || transferWheelhouse.timedOut || transferWheelhouse.exitCode !== null,
        wheelhousePayloadTransferred,
      }),
    })
    if (!wheelhousePayloadTransferred) {
      cleanupAttempted = true
      const cleanup = cleanupPromptResources()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      finish(summaryPath, 'failed', ['wheelhouse_payload_transfer_failed'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        wheelhousePayloadTransferred,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const manifest = runSsh(
      'remote_wheelhouse_manifest_validation',
      [
        'python3.12',
        '-c',
        JSON.stringify(
          `import json; p='${REMOTE_WHEELHOUSE}/SHA256SUMS.json'; j=json.load(open(p)); assert j.get('realWheelCount') == ${EXPECTED_WHEEL_COUNT}; assert j.get('aggregateBytes') == ${EXPECTED_WHEELHOUSE_BYTES}; assert j.get('aggregateSha256') == '${EXPECTED_WHEELHOUSE_SHA256}'; print('REEDITPRO_BROLL_10Z_REMOTE_MANIFEST_OK')`,
        ),
      ].join(' '),
      120_000,
    )
    phaseResults.push(manifest)
    remoteManifestValidationPassed =
      manifest.ok && Boolean(manifest.stdoutSummary?.includes('REEDITPRO_BROLL_10Z_REMOTE_MANIFEST_OK'))
    if (!remoteManifestValidationPassed) {
      cleanupAttempted = true
      const cleanup = cleanupPromptResources()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      finish(summaryPath, 'failed', ['remote_manifest_validation_failed'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        wheelhousePayloadTransferred,
        remoteManifestValidationPassed,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const install = runSsh(
      'offline_dependency_install_readiness',
      [
        'python3.12 -m venv',
        `${REMOTE_ROOT}/venv`,
        '&&',
        `${REMOTE_ROOT}/venv/bin/python -m pip install --no-index --find-links`,
        REMOTE_WHEELHOUSE,
        '-r',
        `${REMOTE_ROOT}/requirements.ai-video-broll.txt`,
        '&&',
        'echo REEDITPRO_BROLL_10Z_OFFLINE_INSTALL_OK',
      ].join(' '),
      25 * 60_000,
    )
    phaseResults.push(install)
    offlineDependencyInstallPassed =
      install.ok && Boolean(install.stdoutSummary?.includes('REEDITPRO_BROLL_10Z_OFFLINE_INSTALL_OK'))
    if (!offlineDependencyInstallPassed) {
      cleanupAttempted = true
      const cleanup = cleanupPromptResources()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      finish(summaryPath, 'failed', ['offline_dependency_install_readiness_failed'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        wheelhousePayloadTransferred,
        remoteManifestValidationPassed,
        offlineDependencyInstallPassed,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const imports = runSsh(
      'dependency_import_readiness_no_model_load',
      [
        `${REMOTE_ROOT}/venv/bin/python -c`,
        JSON.stringify(
          "import torch, diffusers, transformers; print('REEDITPRO_BROLL_10Z_DEPENDENCY_IMPORT_OK')",
        ),
      ].join(' '),
      120_000,
    )
    phaseResults.push(imports)
    dependencyImportReadinessPassed =
      imports.ok && Boolean(imports.stdoutSummary?.includes('REEDITPRO_BROLL_10Z_DEPENDENCY_IMPORT_OK'))

    cleanupAttempted = true
    const cleanup = cleanupPromptResources()
    phaseResults.push(...cleanup.phaseResults)
    cleanupVerified = cleanup.cleanupVerified

    const passed = dependencyImportReadinessPassed && cleanupVerified
    finish(summaryPath, passed ? 'passed' : 'failed', passed ? [] : ['dependency_import_readiness_failed'], {
      phaseResults,
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      wheelhousePayloadTransferred,
      remoteManifestValidationPassed,
      offlineDependencyInstallPassed,
      dependencyImportReadinessPassed,
      cleanupAttempted,
      cleanupVerified,
    })
  } catch (error) {
    cleanupAttempted = true
    const cleanup = cleanupPromptResources()
    phaseResults.push(...cleanup.phaseResults)
    cleanupVerified = cleanup.cleanupVerified
    finish(
      summaryPath,
      'failed',
      [
        `runner_exception:${sanitize(error instanceof Error ? error.message : String(error)) ?? 'unknown'}`,
        ...(cleanupVerified ? [] : ['cleanup_not_verified_after_exception']),
      ],
      {
        phaseResults,
        cleanupAttempted,
        cleanupVerified,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        wheelhousePayloadTransferred,
        remoteManifestValidationPassed,
        offlineDependencyInstallPassed,
        dependencyImportReadinessPassed,
      },
    )
  }
}

function runPreflight() {
  const phaseResults: PhaseResult[] = []
  const blockers: string[] = []

  const localManifest = validateLocalWheelhouseManifest()
  phaseResults.push(localManifest)
  if (!localManifest.ok) blockers.push('local_wheelhouse_manifest_not_ready')

  const localRequirements = existsSync(REQUIREMENTS_PATH)
  phaseResults.push({
    id: 'local_requirements_manifest_exists',
    ok: localRequirements,
    exitCode: localRequirements ? 0 : 1,
    timedOut: false,
    stdoutSummary: localRequirements ? 'present' : undefined,
    stderrSummary: localRequirements ? undefined : 'missing',
  })
  if (!localRequirements) blockers.push('local_requirements_manifest_missing')

  const commands: Array<[string, string[], (result: PhaseResult) => void]> = [
    ['gcloud_project', ['config', 'get-value', 'project'], (result) => {
      if (result.stdoutSummary !== PROJECT_ID) blockers.push('gcloud_project_mismatch')
    }],
    ['gcloud_auth_refresh_suppressed', ['auth', 'print-access-token'], (result) => {
      if (!result.ok) blockers.push('gcloud_auth_refresh_failed')
    }],
    ['zone_status', ['compute', 'zones', 'describe', TARGET_ZONE, '--project', PROJECT_ID, '--format=value(status)'], (result) => {
      if (result.stdoutSummary !== 'UP') blockers.push('target_zone_not_up')
    }],
    ['machine_type_visible', ['compute', 'machine-types', 'describe', MACHINE_TYPE, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name)'], (result) => {
      if (result.stdoutSummary !== MACHINE_TYPE) blockers.push('machine_type_not_visible')
    }],
    ['accelerator_visible', ['compute', 'accelerator-types', 'describe', ACCELERATOR, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name)'], (result) => {
      if (result.stdoutSummary !== ACCELERATOR) blockers.push('accelerator_not_visible')
    }],
    ['image_family_ready', ['compute', 'images', 'describe-from-family', IMAGE_FAMILY, '--project', IMAGE_PROJECT, '--format=value(name)'], (result) => {
      if (!result.ok) blockers.push('image_family_not_ready')
    }],
    ['proof_service_account_visible', ['iam', 'service-accounts', 'describe', SERVICE_ACCOUNT, '--project', PROJECT_ID, '--format=value(disabled)'], (result) => {
      if (!result.ok || result.stdoutSummary === 'True' || result.stdoutSummary === 'true') {
        blockers.push('proof_service_account_missing_or_disabled')
      }
    }],
    ['pre_existing_instance_absent', ['compute', 'instances', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_instance_found')
    }],
    ['pre_existing_disk_absent', ['compute', 'disks', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_disk_found')
    }],
    ['pre_existing_address_absent', ['compute', 'addresses', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--region', TARGET_REGION, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_address_found')
    }],
    ['pre_existing_reservation_absent', ['compute', 'reservations', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_reservation_found')
    }],
  ]

  for (const [id, args, check] of commands) {
    const result = runGcloud(id, args, 90_000, { suppressStdout: id === 'gcloud_auth_refresh_suppressed' })
    phaseResults.push(result)
    check(result)
    if (result.timedOut) blockers.push(`${id}_timed_out`)
  }

  return {
    ok: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    phaseResults,
  }
}

function waitForInstanceReadiness() {
  const phaseResults: PhaseResult[] = []
  const blockers: string[] = []
  let privateOnly = false
  let bootDiskAutoDelete = false
  let running = false

    for (let attempt = 1; attempt <= 12; attempt += 1) {
    const describe = describeInstanceCompact(`describe_prompt_vm_compact_attempt_${attempt}`)
    const parsed = parseJson<JsonRecord>(describe.rawStdout)
    phaseResults.push(stripRawStdout(describe))
    const readiness = readInstanceReadiness(parsed)
    running = readiness.running
    privateOnly = readiness.privateOnly
    bootDiskAutoDelete = readiness.bootDiskAutoDelete
    if (running && privateOnly && bootDiskAutoDelete) break
    sleep(10_000)
  }

  if (!running) blockers.push('instance_running_not_verified')
  if (!privateOnly) blockers.push('private_only_network_not_verified')
  if (!bootDiskAutoDelete) blockers.push('boot_disk_auto_delete_not_verified')

  return {
    ok: blockers.length === 0,
    blockers,
    phaseResults,
    privateOnly,
    bootDiskAutoDelete,
  }
}

function waitForIapLookupReadiness() {
  const phaseResults: PhaseResult[] = []
  let ok = false

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const ssh = runSsh(
      `iap_lookup_readiness_attempt_${attempt}`,
      'echo REEDITPRO_BROLL_10Z_IAP_LOOKUP_READY',
      60_000,
    )
    phaseResults.push(ssh)
    ok = ssh.ok && Boolean(ssh.stdoutSummary?.includes('REEDITPRO_BROLL_10Z_IAP_LOOKUP_READY'))
    if (ok) break
    sleep(10_000)
  }

  return { ok, phaseResults }
}

function describeInstanceCompact(id = 'describe_prompt_vm_compact_raw_json') {
  const result = runGcloud(
    id,
    [
      'compute',
      'instances',
      'describe',
      PROOF_VM_NAME,
      '--project',
      PROJECT_ID,
      '--zone',
      TARGET_ZONE,
      '--format=json(status,networkInterfaces,disks)',
    ],
    90_000,
    { captureRawStdout: true },
  )
  return result
}

function cleanupPromptResources() {
  const phaseResults: PhaseResult[] = []
  const deleteResult = runGcloud(
    'delete_prompt_scoped_l4_vm_exact_name',
    [
      'compute',
      'instances',
      'delete',
      PROOF_VM_NAME,
      '--project',
      PROJECT_ID,
      '--zone',
      TARGET_ZONE,
      '--quiet',
    ],
    10 * 60_000,
  )
  phaseResults.push(deleteResult)

  const verifyCommands: Array<[string, string[]]> = [
    ['verify_prompt_instance_absent_exact_name', ['compute', 'instances', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)']],
    ['verify_prompt_disk_absent_exact_name', ['compute', 'disks', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)']],
    ['verify_prompt_address_absent_exact_name', ['compute', 'addresses', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--region', TARGET_REGION, '--format=value(name,status)']],
    ['verify_prompt_reservation_absent_exact_name', ['compute', 'reservations', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)']],
  ]

  let cleanupVerified = true
  for (const [id, args] of verifyCommands) {
    const result = runGcloud(id, args, 90_000)
    phaseResults.push(result)
    if (result.ok || result.timedOut) cleanupVerified = false
  }

  return { phaseResults, cleanupVerified }
}

function runSsh(id: string, command: string, timeoutMs: number) {
  return runGcloud(
    id,
    [
      'compute',
      'ssh',
      PROOF_VM_NAME,
      '--project',
      PROJECT_ID,
      '--zone',
      TARGET_ZONE,
      '--tunnel-through-iap',
      '--quiet',
      '--ssh-flag=-o ConnectTimeout=20',
      '--ssh-flag=-o BatchMode=yes',
      '--ssh-flag=-o StrictHostKeyChecking=no',
      '--command',
      command,
    ],
    timeoutMs,
  )
}

function runGcloud(
  id: string,
  args: string[],
  timeoutMs: number,
  options: { suppressStdout?: boolean; captureRawStdout?: boolean } = {},
): PhaseResult & { rawStdout?: string } {
  const result = spawnSync('gcloud', args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
    stdio: ['ignore', options.suppressStdout ? 'ignore' : 'pipe', 'pipe'],
    timeout: timeoutMs,
  })

  const rawStdout = options.suppressStdout ? undefined : String(result.stdout ?? '')

  return {
    id,
    ok: result.status === 0,
    exitCode: result.status,
    timedOut: Boolean(result.error && result.error.message.includes('ETIMEDOUT')),
    stdoutSummary: options.suppressStdout ? undefined : sanitize(rawStdout),
    stderrSummary: sanitize(String(result.stderr ?? '')),
    rawStdout: options.captureRawStdout ? rawStdout : undefined,
  }
}

function validateLocalWheelhouseManifest(): PhaseResult {
  if (!existsSync(WHEELHOUSE_MANIFEST)) {
    return {
      id: 'local_wheelhouse_manifest_ready',
      ok: false,
      exitCode: 1,
      timedOut: false,
      stderrSummary: 'manifest_missing',
    }
  }

  try {
    const manifest = JSON.parse(readFileSync(WHEELHOUSE_MANIFEST, 'utf8')) as JsonRecord
    const ok =
      manifest.wheelhouseComplete === true &&
      manifest.realWheelCount === EXPECTED_WHEEL_COUNT &&
      manifest.aggregateBytes === EXPECTED_WHEELHOUSE_BYTES &&
      manifest.aggregateSha256 === EXPECTED_WHEELHOUSE_SHA256
    return {
      id: 'local_wheelhouse_manifest_ready',
      ok,
      exitCode: ok ? 0 : 1,
      timedOut: false,
      stdoutSummary: ok ? 'manifest_ready_real_wheel_count_66' : 'manifest_mismatch',
    }
  } catch {
    return {
      id: 'local_wheelhouse_manifest_ready',
      ok: false,
      exitCode: 1,
      timedOut: false,
      stderrSummary: 'manifest_parse_failed',
    }
  }
}

function finish(
  summaryPath: string,
  status: 'passed' | 'failed',
  blockers: string[],
  values: Partial<RunnerSummary>,
) {
  const summary: RunnerSummary = {
    ...baseSummary(summaryPath, status),
    ...values,
    ok: status === 'passed',
    status,
    blockers: Array.from(new Set(blockers)),
    nextPrompt: status === 'passed' ? NEXT_PROMPT_IF_PASSED : NEXT_PROMPT_IF_FAILED,
    runtimeSideEffects: runtimeSideEffects({
      computeVmCreateAttempted: Boolean(values.computeVmCreateAttempted),
      computeVmCreated: Boolean(values.computeVmCreated),
      cleanupAttempted: Boolean(values.cleanupAttempted),
      cleanupVerified: Boolean(values.cleanupVerified),
      sshSessionOpened: Boolean(values.iapLookupReadinessPassed),
      iapTransferExecuted: Boolean(values.wheelhousePayloadTransferred),
      wheelhousePayloadTransferred: Boolean(values.wheelhousePayloadTransferred),
      remoteManifestValidationRun: Boolean(values.remoteManifestValidationPassed),
      dependencyInstalledOnVm: Boolean(values.offlineDependencyInstallPassed),
      dependencyImportReadinessRun: Boolean(values.dependencyImportReadinessPassed),
    }),
  }
  writeDurableSummary(summaryPath, summary)
  print(summary)
}

function baseSummary(summaryPath: string, status: RunnerSummary['status']): RunnerSummary {
  return {
    ok: status === 'passed',
    mode: 'ai_video_broll_gen_10z_l4_payload_install_runner_execute_result',
    status,
    decision:
      status === 'passed'
        ? 'ai_video_broll_gen_10z_l4_payload_install_retry_passed_cleanup_verified'
        : 'ai_video_broll_gen_10z_l4_payload_install_retry_blocked_or_failed_cleanup_required',
    summaryPath,
    nextPrompt: status === 'passed' ? NEXT_PROMPT_IF_PASSED : NEXT_PROMPT_IF_FAILED,
    blockers: [],
    phaseResults: [],
    preflightPassed: false,
    computeVmCreateAttempted: false,
    computeVmCreated: false,
    postCreatePrivateOnlyVerified: false,
    bootDiskAutoDeleteVerified: false,
    iapLookupReadinessPassed: false,
    python312ReadinessPassed: false,
    wheelhousePayloadTransferred: false,
    remoteManifestValidationPassed: false,
    offlineDependencyInstallPassed: false,
    dependencyImportReadinessPassed: false,
    cleanupAttempted: false,
    cleanupVerified: false,
    runtimeSideEffects: currentRuntimeSideEffects(),
  }
}

function currentRuntimeSideEffects(): JsonRecord {
  return {
    ...runtimeSideEffects({
      computeVmCreateAttempted: false,
      computeVmCreated: false,
      cleanupAttempted: false,
      cleanupVerified: false,
    }),
    gcpReadOnlyCommandsExecuted: false,
  }
}

function runtimeSideEffects(overrides: {
  computeVmCreateAttempted: boolean
  computeVmCreated: boolean
  cleanupAttempted: boolean
  cleanupVerified: boolean
  sshSessionOpened?: boolean
  iapTransferExecuted?: boolean
  wheelhousePayloadTransferred?: boolean
  remoteManifestValidationRun?: boolean
  dependencyInstalledOnVm?: boolean
  dependencyImportReadinessRun?: boolean
}): JsonRecord {
  return {
    gcpReadOnlyCommandsExecuted: true,
    gcpMutatingCommandsExecuted: overrides.computeVmCreateAttempted || overrides.cleanupAttempted,
    computeVmCreateAttempted: overrides.computeVmCreateAttempted,
    computeVmCreated: overrides.computeVmCreated,
    computeVmDeleted: overrides.cleanupAttempted,
    diskCreated: overrides.computeVmCreated,
    bootDiskCreatedWithVm: overrides.computeVmCreated,
    bootDiskAutoDeleted: overrides.cleanupVerified,
    cleanupRun: overrides.cleanupAttempted,
    cleanupVerified: overrides.cleanupVerified,
    publicIpCreated: false,
    staticAddressCreated: false,
    reservationCreated: false,
    sshSessionOpened: overrides.sshSessionOpened ?? false,
    iapTransferExecuted: overrides.iapTransferExecuted ?? overrides.wheelhousePayloadTransferred ?? false,
    fullWheelhousePayloadTransferred: overrides.wheelhousePayloadTransferred ?? false,
    remoteWheelhouseValidationRun: overrides.remoteManifestValidationRun ?? false,
    dependencyInstalledOnVm: overrides.dependencyInstalledOnVm ?? false,
    dependencyImportReadinessRun: overrides.dependencyImportReadinessRun ?? false,
    dockerRun: false,
    modelDownloaded: false,
    modelImportRun: false,
    modelInferenceRun: false,
    generatedVideoCreated: false,
    generatedAssetsCreated: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  }
}

function readInstanceReadiness(document: JsonRecord | undefined) {
  const interfaces = Array.isArray(document?.networkInterfaces) ? document.networkInterfaces : []
  const disks = Array.isArray(document?.disks) ? document.disks : []
  const hasNat = interfaces.some((networkInterface) => {
    const accessConfigs = asArray(asRecord(networkInterface).accessConfigs)
    return accessConfigs.some((accessConfig) => typeof asRecord(accessConfig).natIP === 'string')
  })
  const bootDiskAutoDelete = disks.some((disk) => asRecord(disk).boot === true && asRecord(disk).autoDelete === true)
  return {
    running: document?.status === 'RUNNING',
    privateOnly: interfaces.length > 0 && !hasNat,
    bootDiskAutoDelete,
  }
}

function parseJson<T>(raw: string | undefined): T | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function writeDurableSummary(summaryPath: string, summary: RunnerSummary) {
  mkdirSync(path.dirname(summaryPath), { recursive: true })
  writeFileSync(summaryPath, `${JSON.stringify(sanitizeSummaryForOutput(summary), null, 2)}\n`, 'utf8')
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, 'redacted_email')
    .replace(/\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/gi, 'redacted_ssh_public_key')
    .replace(new RegExp(SERVICE_ACCOUNT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'redacted_service_account')
    .trim()

  return sanitized ? sanitized.slice(0, 1600) : undefined
}

function stripRawStdout<T extends PhaseResult & { rawStdout?: string }>(phaseResult: T): PhaseResult {
  const safeResult = { ...phaseResult }
  delete safeResult.rawStdout
  return safeResult
}

function sanitizeSummaryForOutput(summary: RunnerSummary): RunnerSummary {
  return {
    ...summary,
    phaseResults: summary.phaseResults.map((phaseResult) => stripRawStdout(phaseResult)),
  }
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index < 0) return undefined
  return process.argv[index + 1]
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
