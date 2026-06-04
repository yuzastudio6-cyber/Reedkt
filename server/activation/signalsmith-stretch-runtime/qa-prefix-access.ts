import { execFile } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { writeVlmRuntimeJsonArtifact } from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET,
  SIGNALSMITH_CONTROLLED_REPORT_DIR,
  SIGNALSMITH_CONTROLLED_RUN_ID,
} from './controlled'

const execFileAsync = promisify(execFile)

type JsonRecord = Record<string, unknown>
type Binding = {
  role?: string
  members?: string[]
  condition?: {
    title?: string
    description?: string
    expression?: string
  }
}

const BUCKET_URI = `gs://${SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET}`
const CPU_WORKER_MEMBER = 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const OBJECT_PREFIX = 'activation/phase36j/controlled-real-media-timing-stretch/'
const RESOURCE_PREFIX = `projects/_/buckets/${SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET}/objects/${OBJECT_PREFIX}`
const CONDITION_EXPRESSION = `resource.name.startsWith('${RESOURCE_PREFIX}')`
const CREATE_CONDITION_TITLE = 'phase36j-signalsmith-qa-create'
const READBACK_CONDITION_TITLE = 'phase36j-signalsmith-qa-readback'

const REQUIRED_BINDINGS = [
  {
    id: 'phase36j-qa-prefix-create',
    role: 'roles/storage.objectCreator',
    conditionTitle: CREATE_CONDITION_TITLE,
    conditionDescription: 'Create Phase 36J Signalsmith QA artifacts only',
    conditionExpression: CONDITION_EXPRESSION,
  },
  {
    id: 'phase36j-qa-prefix-readback',
    role: 'roles/storage.objectViewer',
    conditionTitle: READBACK_CONDITION_TITLE,
    conditionDescription: 'Read back Phase 36J Signalsmith QA artifacts only',
    conditionExpression: CONDITION_EXPRESSION,
  },
] as const

export function getSignalsmithControlledQaPrefixAccessPlan() {
  return {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: 'planned',
    bucket: BUCKET_URI,
    member: CPU_WORKER_MEMBER,
    objectPrefix: OBJECT_PREFIX,
    requiredBindings: REQUIRED_BINDINGS,
    forbiddenRoles: [
      'roles/storage.objectAdmin',
      'roles/storage.admin',
      'project-wide storage roles',
      'unconditioned broad access',
      'allUsers',
      'allAuthenticatedUsers',
    ],
    confirmationVariables: [
      'REEDITPRO_CONFIRM_SIGNALSMITH_QA_PREFIX_ACCESS_FIX',
      'REEDITPRO_CONFIRM_SIGNALSMITH_SCOPED_IAM_UPDATE',
    ],
  }
}

export async function writeSignalsmithControlledQaPrefixAccessReport(reportDir = SIGNALSMITH_CONTROLLED_REPORT_DIR) {
  const before = await inspectIamPolicy()
  await writeQaPrefixReports(reportDir, {
    before,
    after: before,
    applied: [],
    mode: 'report_only',
  })
  return readPreflight(reportDir)
}

export async function applySignalsmithControlledQaPrefixAccessFix(reportDir = SIGNALSMITH_CONTROLLED_REPORT_DIR) {
  requireAccessFixConfirmations()
  const before = await inspectIamPolicy()
  const applied: JsonRecord[] = []
  for (const required of REQUIRED_BINDINGS) {
    if (bindingExists(before.policy, required.role, required.conditionTitle, required.conditionExpression)) {
      applied.push({ id: required.id, status: 'existing', role: required.role, conditionTitle: required.conditionTitle })
      continue
    }
    const result = await runCommand('gcloud', [
      'storage',
      'buckets',
      'add-iam-policy-binding',
      BUCKET_URI,
      '--member',
      CPU_WORKER_MEMBER,
      '--role',
      required.role,
      '--condition',
      `title=${required.conditionTitle},description=${required.conditionDescription},expression=${required.conditionExpression}`,
    ], 120000)
    applied.push({
      id: required.id,
      status: result.status,
      role: required.role,
      conditionTitle: required.conditionTitle,
      durationMs: result.durationMs,
      stderrSummary: result.stderrSummary,
    })
  }
  const after = await inspectIamPolicy()
  await writeQaPrefixReports(reportDir, { before, after, applied, mode: 'apply_missing' })
  return readPreflight(reportDir)
}

async function inspectIamPolicy() {
  const [project, activeAccount, bucketDescribe, iamPolicyCommand] = await Promise.all([
    runCommand('gcloud', ['config', 'get-value', 'project']),
    runCommand('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runCommand('gcloud', ['storage', 'buckets', 'describe', BUCKET_URI, '--format=json']),
    runCommand('gcloud', ['storage', 'buckets', 'get-iam-policy', BUCKET_URI, '--format=json']),
  ])
  const policy = iamPolicyCommand.status === 'passed'
    ? parsePolicy(iamPolicyCommand.stdout)
    : { bindings: [] as Binding[] }
  const publicAccess = hasPublicAccess(policy.bindings)
  const required = REQUIRED_BINDINGS.map((binding) => ({
    id: binding.id,
    role: binding.role,
    conditionTitle: binding.conditionTitle,
    conditionExpression: binding.conditionExpression,
    status: bindingExists(policy.bindings, binding.role, binding.conditionTitle, binding.conditionExpression) ? 'existing' : 'missing',
  }))
  const missing = required.filter((binding) => binding.status === 'missing')
  return {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    project: lastLine(project.stdout),
    activePrincipal: lastLine(activeAccount.stdout),
    bucket: BUCKET_URI,
    bucketDescribeStatus: bucketDescribe.status,
    bucketPublicAccessPrevention: parseBucketPublicAccessPrevention(bucketDescribe.stdout),
    iamReadStatus: iamPolicyCommand.status,
    policy: sanitizePolicy(policy.bindings),
    requiredBindings: required,
    publicAccessStatus: publicAccess ? 'blocked_public_member_present' : 'blocked_public_access_not_present',
    broadIamWarnings: detectBroadWarnings(policy.bindings),
    missingBindings: missing.map((binding) => binding.id),
    rerunCanProceed: missing.length === 0 && !publicAccess && iamPolicyCommand.status === 'passed',
  }
}

async function writeQaPrefixReports(reportDir: string, input: {
  before: Awaited<ReturnType<typeof inspectIamPolicy>>
  after: Awaited<ReturnType<typeof inspectIamPolicy>>
  applied: JsonRecord[]
  mode: string
}) {
  await mkdir(reportDir, { recursive: true })
  const delta = {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: input.after.rerunCanProceed ? 'passed' : 'blocked',
    mode: input.mode,
    appliedBindings: input.applied,
    beforeMissingBindings: input.before.missingBindings,
    afterMissingBindings: input.after.missingBindings,
    objectCreatorStatus: statusFor(input.after.requiredBindings, 'phase36j-qa-prefix-create'),
    objectViewerStatus: statusFor(input.after.requiredBindings, 'phase36j-qa-prefix-readback'),
    broadIam: input.after.broadIamWarnings.length ? 'warning' : 'not_granted',
    publicAccess: input.after.publicAccessStatus,
    storageObjectsGetBlocker: statusFor(input.after.requiredBindings, 'phase36j-qa-prefix-readback') === 'existing' ? 'resolved' : 'persisting',
    blockers: input.after.rerunCanProceed ? [] : [
      ...input.after.missingBindings,
      ...input.after.broadIamWarnings,
      ...(input.after.iamReadStatus === 'passed' ? [] : ['qa_bucket_iam_policy_unreadable']),
    ],
  }
  const preflight = {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: input.after.rerunCanProceed ? 'passed' : 'blocked',
    project: input.after.project,
    activePrincipal: input.after.activePrincipal,
    bucket: input.after.bucket,
    bucketDescribeStatus: input.after.bucketDescribeStatus,
    iamReadStatus: input.after.iamReadStatus,
    objectCreatorStatus: statusFor(input.after.requiredBindings, 'phase36j-qa-prefix-create'),
    objectViewerReadbackStatus: statusFor(input.after.requiredBindings, 'phase36j-qa-prefix-readback'),
    publicAccessStatus: input.after.publicAccessStatus,
    broadIamWarnings: input.after.broadIamWarnings,
    missingBindings: input.after.missingBindings,
    rerunCanProceed: input.after.rerunCanProceed,
    blockers: delta.blockers,
  }
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_qa_prefix_iam_before.json'), input.before)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_qa_prefix_iam_after.json'), input.after)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_qa_prefix_iam_delta_report.json'), delta)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_qa_prefix_access_preflight.json'), preflight)
}

async function readPreflight(reportDir: string) {
  return JSON.parse(await readFile(path.join(reportDir, 'phase_36j_signalsmith_qa_prefix_access_preflight.json'), 'utf8')) as JsonRecord
}

function requireAccessFixConfirmations() {
  const required = [
    'REEDITPRO_CONFIRM_SIGNALSMITH_QA_PREFIX_ACCESS_FIX',
    'REEDITPRO_CONFIRM_SIGNALSMITH_SCOPED_IAM_UPDATE',
  ]
  const missing = required.filter((name) => process.env[name] !== 'true')
  if (missing.length) throw new Error(`Missing Phase 36J scoped IAM confirmation(s): ${missing.join(', ')}`)
}

function parsePolicy(stdout: string): { bindings: Binding[] } {
  const parsed = JSON.parse(stdout) as { bindings?: Binding[] }
  return { bindings: parsed.bindings ?? [] }
}

function sanitizePolicy(bindings: Binding[]) {
  return bindings.map((binding) => ({
    role: binding.role,
    members: binding.members ?? [],
    condition: binding.condition,
  }))
}

function bindingExists(bindings: Binding[], role: string, title: string, expression: string) {
  return bindings.some((binding) => (
    binding.role === role
    && (binding.members ?? []).includes(CPU_WORKER_MEMBER)
    && binding.condition?.title === title
    && normalizeCondition(binding.condition?.expression) === normalizeCondition(expression)
  ))
}

function normalizeCondition(value: string | undefined) {
  return (value ?? '').replaceAll('"', "'").replace(/\s+/g, '')
}

function statusFor(bindings: Array<{ id: string, status: string }>, id: string) {
  return bindings.find((binding) => binding.id === id)?.status ?? 'missing'
}

function hasPublicAccess(bindings: Binding[]) {
  return bindings.some((binding) => (binding.members ?? []).some((member) => member === 'allUsers' || member === 'allAuthenticatedUsers'))
}

function detectBroadWarnings(bindings: Binding[]) {
  const warnings: string[] = []
  for (const binding of bindings) {
    const members = binding.members ?? []
    if (!members.includes(CPU_WORKER_MEMBER)) continue
    if ((binding.role === 'roles/storage.objectAdmin' || binding.role === 'roles/storage.admin') && !binding.condition) {
      warnings.push(`broad_unconditioned_role:${binding.role}`)
    }
  }
  return warnings
}

function parseBucketPublicAccessPrevention(stdout: string) {
  try {
    const parsed = JSON.parse(stdout) as { public_access_prevention?: string }
    return parsed.public_access_prevention ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

function lastLine(value: string) {
  return value.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? ''
}

async function runCommand(command: string, args: string[], timeout = 120000) {
  const started = Date.now()
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout,
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
        CLOUDSDK_PYTHON: process.env.CLOUDSDK_PYTHON ?? '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
      },
      maxBuffer: 1024 * 1024 * 16,
    })
    return {
      status: 'passed',
      durationMs: Date.now() - started,
      stdout,
      stderr,
      stderrSummary: summarize(stderr),
    }
  } catch (error) {
    const commandError = error as { stdout?: string, stderr?: string }
    return {
      status: 'blocked',
      durationMs: Date.now() - started,
      stdout: commandError.stdout ?? '',
      stderr: commandError.stderr ?? '',
      stderrSummary: summarize(commandError.stderr ?? ''),
    }
  }
}

function summarize(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(0, 8).join('\n')
}
