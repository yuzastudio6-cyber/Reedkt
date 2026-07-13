import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { performance } from 'node:perf_hooks'

type SmokeStep = {
  id: string
  script: string
  requiredFor: string
}

type SmokeStepResult = SmokeStep & {
  durationMs: number
  status: 'passed'
}

const steps: SmokeStep[] = [
  {
    id: 'source_upload_planning',
    script: 'smoke:source-upload-planning-backend',
    requiredFor: 'source upload planning, private upload targets, source-sequence promotion',
  },
  {
    id: 'local_project_handoff_source_safety',
    script: 'smoke:local-project-handoff-source-safety',
    requiredFor: 'local project recovery, source fingerprint, stale private-review invalidation',
  },
  {
    id: 'private_edit_decision_manifest_verification',
    script: 'smoke:private-edit-decision-manifest-verification',
    requiredFor: 'private edit decision manifest verification, professional skill trace, source identity, and blocked release scopes',
  },
  {
    id: 'approved_snapshot',
    script: 'smoke:approved-snapshot',
    requiredFor: 'approved plan snapshot, credit approval, idempotency, owner isolation',
  },
  {
    id: 'cost_controls',
    script: 'smoke:prod-cost-controls',
    requiredFor: 'professional cost-control rules around paid work',
  },
  {
    id: 'runtime_contracts',
    script: 'smoke:prod-runtime-contracts',
    requiredFor: 'runtime artifact, prompt, license, model-weight, and QA blockers',
  },
  {
    id: 'worker_claims',
    script: 'smoke:worker',
    requiredFor: 'worker claim safety and no provider calls before readiness',
  },
  {
    id: 'tool_registry',
    script: 'smoke:prod-tool-registry',
    requiredFor: 'production tool registry shape and blocked evaluation/model-weight tools',
  },
  {
    id: 'professional_tool_architecture_program',
    script: 'smoke:professional-tool-architecture-program',
    requiredFor: 'accepted owner-lane tool source truth, bounded adapter counts, registry-only backlog buckets, and product/frontend execution boundaries',
  },
  {
    id: 'professional_adapter_contracts',
    script: 'smoke:professional-tool-adapter-contracts',
    requiredFor: 'professional adapter contracts for planned edit activities',
  },
  {
    id: 'professional_skill_planner',
    script: 'smoke:professional-skill-planner',
    requiredFor: 'prompt-first professional skill planning, optional Edit Brief handling, and model-role boundaries',
  },
  {
    id: 'editor_user_facing_copy_boundary',
    script: 'smoke:editor-user-facing-copy-boundary',
    requiredFor: 'user-facing planning copy hides adapter, provider, model-role, backend, and source-truth names',
  },
  {
    id: 'bounded_adapter_source_truth',
    script: 'smoke:canonical-private-tool-dispatch',
    requiredFor: 'canonical edit authority, server source-truth checks, private tool dispatch, package probes, and private adapter QA',
  },
  {
    id: 'edit_execution_routes',
    script: 'smoke:edit-execution-security-boundary',
    requiredFor: 'canonical identity-only execution route schema and fail-closed caller-authored worker/render boundaries',
  },
  {
    id: 'edit_execution_client',
    script: 'smoke:frontend-api-transport',
    requiredFor: 'frontend-safe authenticated API transport and backend-only execution boundaries',
  },
  {
    id: 'canonical_execution_package_request_client',
    script: 'smoke:canonical-execution-package-request-client',
    requiredFor: 'exact approved-snapshot browser handoff request, bounded receipt, replay-safe identity, and no browser-owned execution',
  },
  {
    id: 'private_download_client',
    script: 'smoke:edit-execution-private-download-client',
    requiredFor: 'private MP4 and manifest fetch client safety',
  },
  {
    id: 'private_source_media_authority',
    script: 'smoke:private-source-media-authority',
    requiredFor: 'immutable private source media, restart-safe upload idempotency, and tenant isolation',
  },
  {
    id: 'canonical_execution_readiness',
    script: 'smoke:canonical-execution-readiness',
    requiredFor: 'canonical approved authority and fail-closed execution readiness',
  },
  {
    id: 'gcs_source_processing_staging',
    script: 'smoke:gcs-source-media-processing-staging',
    requiredFor: 'cloud-storage-shaped source staging without signed URLs',
  },
  {
    id: 'canonical_worker_lease_verification',
    script: 'smoke:canonical-worker-lease-verification',
    requiredFor: 'canonical worker lease identity, dependencies, fencing, and replay verification',
  },
  {
    id: 'private_canonical_worker_sandbox',
    script: 'smoke:private-canonical-worker-sandbox',
    requiredFor: 'confined private canonical worker runtime without production promotion',
  },
  {
    id: 'playwright_editor_flow',
    script: 'qa:editor',
    requiredFor: 'real editor UI upload, planning context, approval gate, private review card, and layout stability',
  },
  {
    id: 'playwright_expanded_editor_flow',
    script: 'qa:expanded',
    requiredFor: 'expanded editor planning details, advanced flow layout, and hidden internal tool names',
  },
  {
    id: 'playwright_editor_keyboard_flow',
    script: 'qa:editor-keyboard',
    requiredFor: 'keyboard-safe composer, source controls, approval, timeline, and soundflow disclosures',
  },
  {
    id: 'playwright_route_viewport_flow',
    script: 'qa:viewport',
    requiredFor: 'clean app shell routes, legacy redirects, sidebar scope, and viewport overflow',
  },
  {
    id: 'playwright_canonical_journey_flow',
    script: 'qa:canonical-journey-ui',
    requiredFor: 'named-edit planning, exact approval, private handoff request, recovery, identity isolation, and preference locking',
  },
  {
    id: 'completion_audit',
    script: 'smoke:edit-architecture-completion-audit',
    requiredFor: 'requirement-level evidence coverage for upload, approval, private render, QA, browser review, revision, and recovery',
  },
  {
    id: 'legacy_execution_routes_fail_closed',
    script: 'smoke:edit-execution-security-boundary',
    requiredFor: 'legacy caller-authored execution routes remain disabled after canonical authority cutover',
  },
]

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const playwrightPort = process.env.PLAYWRIGHT_PORT ?? String(await findAvailablePort(5184))
const suiteStart = performance.now()
const results: SmokeStepResult[] = []

for (const step of steps) {
  const startedAt = performance.now()
  console.log(`\n[edit-architecture-internal-review] ${step.id}: npm run ${step.script}`)
  await runNpmScript(step.script, step.script === 'qa:editor' ? { PLAYWRIGHT_PORT: playwrightPort } : {})
  results.push({
    ...step,
    durationMs: Math.round(performance.now() - startedAt),
    status: 'passed',
  })
}

console.log(JSON.stringify({
  ok: true,
  suite: 'edit_architecture_internal_review',
  status: 'passed',
  checkedAt: new Date().toISOString(),
  stepCount: results.length,
  durationMs: Math.round(performance.now() - suiteStart),
  checks: results.map((result) => result.id),
  guarantees: [
    'User source uploads are planned, uploaded, finalized, fingerprinted, and promoted into source sequence records.',
    'Edit approval requires an approved plan snapshot, credit approval/reservation, idempotency, and owner isolation.',
    'Private edit manifests preserve approved professional skill traces without exposing adapter/tool names.',
    'The tool architecture program keeps owner-lane source truth accepted, ambiguous registry-only tools categorized, and product/frontend execution at zero.',
    'Professional adapter contracts and source-truth gates are checked before private review integration.',
    'Prompt-first professional skill planning works without requiring an Edit Brief while preserving model-role boundaries.',
    'User-facing planning copy hides adapter, provider, model-role, backend, and source-truth implementation names.',
    'Canonical private source and worker boundaries preserve tenant identity, immutable inputs, lease fencing, and fail-closed execution.',
    'The named-edit browser can request one exact private execution handoff without receiving raw package, job, tool, path, or credential authority and without starting execution.',
    'The Playwright editor flow verifies the current UI upload, planning, approval, review, and blocked failure path.',
    'Expanded and keyboard Playwright flows verify advanced planning details, composer behavior, soundflow disclosures, and hidden internal implementation names.',
    'Route viewport QA verifies the clean app shell, legacy route redirects, and the Home/Projects/Preferences-only sidebar.',
    'Canonical journey Playwright QA verifies exact approval-to-private-handoff behavior, recovery, and no browser-owned work-graph execution.',
    'The completion audit verifies the suite still covers every required internal edit architecture proof surface.',
    'Public delivery, signed URLs, billing mutation, external beta, and production remain blocked by separate gates.',
  ],
  steps: results,
}, null, 2))

async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await portIsAvailable(port)) return port
  }

  throw new Error(`No available Playwright port found from ${startPort} to ${startPort + 99}.`)
}

async function portIsAvailable(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '127.0.0.1')
  })
}

async function runNpmScript(script: string, extraEnv: Record<string, string> = {}): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(npmCommand, ['run', script], {
      cwd: process.cwd(),
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${script} failed with ${signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`}.`))
    })
  })
}
