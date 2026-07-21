import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { chmod, lstat, mkdir, open, realpath, rename, rm } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import type { EditReferenceRepositoryScope } from './edit-reference-repository'
import {
  applyEditReferenceLongFormStudyControl,
  validateEditReferenceLongFormStudyPlan,
  validateEditReferenceLongFormStudyRun,
  validateRunAgainstPlan,
  type EditReferenceLongFormStudyControlAction,
  type EditReferenceLongFormStudyControlResult,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyRunRecord,
} from './edit-reference-long-form-study-contract'
import {
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  validateEditReferenceLongFormStudyWorkOutput,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import {
  validateEditReferenceLongFormSemanticWindowCheckpoint,
  type EditReferenceLongFormSemanticWindowCheckpoint,
} from './edit-reference-long-form-semantic-window-checkpoint'
import type { EditReferenceLongFormSemanticWindowPlan } from './edit-reference-long-form-semantic-window-contract'
import type { EditReferenceSemanticSpecialistId } from './edit-reference-semantic-study-contract'

const PLAN_ENVELOPE_VERSION = 'edit-reference-long-form-plan-envelope-v1' as const
const RUN_ENVELOPE_VERSION = 'edit-reference-long-form-run-envelope-v1' as const
const WORK_OUTPUT_ENVELOPE_VERSION = 'edit-reference-long-form-work-output-envelope-v1' as const
const SEMANTIC_WINDOW_CHECKPOINT_ENVELOPE_VERSION =
  'edit-reference-long-form-semantic-window-checkpoint-envelope-v1' as const
const CONTROL_COMMAND_ENVELOPE_VERSION =
  'edit-reference-long-form-control-command-envelope-v1' as const
const CONTROL_COMMAND_RECEIPT_VERSION =
  'edit-reference-long-form-control-command-receipt-v1' as const
const RECORD_SOURCE = 'edit_reference_long_form_study_repository' as const
const PLAN_MAX_BYTES = 8 * 1024 * 1024
const RUN_MAX_BYTES = 48 * 1024 * 1024
const WORK_OUTPUT_MAX_BYTES = 16 * 1024 * 1024
const SEMANTIC_WINDOW_CHECKPOINT_MAX_BYTES = 2 * 1024 * 1024
const CONTROL_COMMAND_MAX_BYTES = 32 * 1024
const DIRECTORY_MODE = 0o700
const FILE_MODE = 0o600

interface LongFormPlanEnvelopePayload {
  readonly recordVersion: typeof PLAN_ENVELOPE_VERSION
  readonly source: typeof RECORD_SOURCE
  readonly scopeHash: string
  readonly plan: EditReferenceLongFormStudyPlan
}

interface LongFormPlanEnvelope extends LongFormPlanEnvelopePayload {
  readonly checksumSha256: string
}

interface LongFormRunEnvelopePayload {
  readonly recordVersion: typeof RUN_ENVELOPE_VERSION
  readonly source: typeof RECORD_SOURCE
  readonly scopeHash: string
  readonly run: EditReferenceLongFormStudyRunRecord
}

interface LongFormRunEnvelope extends LongFormRunEnvelopePayload {
  readonly checksumSha256: string
}

interface LongFormWorkOutputEnvelopePayload {
  readonly recordVersion: typeof WORK_OUTPUT_ENVELOPE_VERSION
  readonly source: typeof RECORD_SOURCE
  readonly scopeHash: string
  readonly output: EditReferenceLongFormStudyWorkOutput
}

interface LongFormWorkOutputEnvelope extends LongFormWorkOutputEnvelopePayload {
  readonly checksumSha256: string
}

interface LongFormSemanticWindowCheckpointEnvelopePayload {
  readonly recordVersion: typeof SEMANTIC_WINDOW_CHECKPOINT_ENVELOPE_VERSION
  readonly source: typeof RECORD_SOURCE
  readonly scopeHash: string
  readonly checkpoint: EditReferenceLongFormSemanticWindowCheckpoint
}

interface LongFormSemanticWindowCheckpointEnvelope
  extends LongFormSemanticWindowCheckpointEnvelopePayload {
  readonly checksumSha256: string
}

export interface EditReferenceLongFormStudyControlCommandReceipt {
  readonly schemaVersion: typeof CONTROL_COMMAND_RECEIPT_VERSION
  readonly runId: string
  readonly action: EditReferenceLongFormStudyControlAction
  readonly commandIdDigestSha256: string
  readonly requestDigestSha256: string
  readonly expectedRunRevision: number
  readonly appliedRunRevision: number
  readonly appliedRunDigestSha256: string
  readonly activeWorkFinishesBeforePause: boolean
  readonly recoveredWorkItemCount: number
  readonly completedCheckpointsPreserved: true
  readonly appliedAt: string
  readonly receiptDigestSha256: string
}

interface LongFormControlCommandEnvelopePayload {
  readonly recordVersion: typeof CONTROL_COMMAND_ENVELOPE_VERSION
  readonly source: typeof RECORD_SOURCE
  readonly scopeHash: string
  readonly receipt: EditReferenceLongFormStudyControlCommandReceipt
}

interface LongFormControlCommandEnvelope extends LongFormControlCommandEnvelopePayload {
  readonly checksumSha256: string
}

export interface EditReferenceLongFormStudyControlPersistenceResult {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly receipt: EditReferenceLongFormStudyControlCommandReceipt
  readonly disposition: 'applied' | 'idempotent_replay'
  readonly persistence: 'backend_local_private_segmented'
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

export interface EditReferenceLongFormStudyPersistenceResult {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly disposition: 'created' | 'idempotent_replay' | 'recovered_partial_create'
  readonly persistence: 'backend_local_private_segmented'
  readonly rawMediaPersisted: false
  readonly signedUrlPersisted: false
  readonly localFilePathPersisted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

const runLocks = new Map<string, Promise<void>>()

export class PrivateEditReferenceLongFormStudyRepository {
  readonly persistence = 'backend_local_private_segmented' as const

  async create(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly plan: EditReferenceLongFormStudyPlan
    readonly run: EditReferenceLongFormStudyRunRecord
  }): Promise<EditReferenceLongFormStudyPersistenceResult> {
    validateScope(input.scope)
    validateRunAgainstPlan(input.run, input.plan)
    return withRunLock(input.scope, input.run.runId, async () => {
      const existingPlan = await readPlan(input.scope, input.run.runId)
      const existingRun = await readRun(input.scope, input.run.runId)
      if (existingPlan || existingRun) {
        if (existingPlan && existingRun) {
          if (
            existingPlan.planDigestSha256 !== input.plan.planDigestSha256
            || existingRun.recordDigestSha256 !== input.run.recordDigestSha256
          ) throw persistenceConflict('long_form_study_create_conflict')
          validateRunAgainstPlan(existingRun, existingPlan)
          return result(existingPlan, existingRun, 'idempotent_replay')
        }
        if (!existingPlan || existingPlan.planDigestSha256 !== input.plan.planDigestSha256) {
          throw persistenceConflict('long_form_study_partial_create_conflict')
        }
        await writeRun(input.scope, input.run)
        return result(input.plan, input.run, 'recovered_partial_create')
      }
      await writePlan(input.scope, input.run.runId, input.plan)
      try {
        await writeRun(input.scope, input.run)
      } catch (error) {
        throw persistenceConflict(`long_form_study_checkpoint_create_failed:${safeErrorCode(error)}`)
      }
      return result(input.plan, input.run, 'created')
    })
  }

  async read(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
  }): Promise<{ plan: EditReferenceLongFormStudyPlan; run: EditReferenceLongFormStudyRunRecord } | undefined> {
    validateScope(input.scope)
    assertId(input.runId, 'long-form study run id')
    return withRunLock(input.scope, input.runId, async () => {
      const plan = await readPlan(input.scope, input.runId)
      const run = await readRun(input.scope, input.runId)
      if (!plan && !run) return undefined
      if (!plan || !run) throw persistenceConflict('long_form_study_checkpoint_incomplete')
      validateRunAgainstPlan(run, plan)
      return { plan, run }
    })
  }

  async saveRun(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly expectedRevision: number
    readonly run: EditReferenceLongFormStudyRunRecord
  }): Promise<EditReferenceLongFormStudyRunRecord> {
    validateScope(input.scope)
    validateEditReferenceLongFormStudyRun(input.run)
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) {
      throw persistenceConflict('long_form_study_expected_revision_invalid')
    }
    return withRunLock(input.scope, input.run.runId, async () => {
      const plan = await readPlan(input.scope, input.run.runId)
      const current = await readRun(input.scope, input.run.runId)
      if (!plan || !current) throw persistenceConflict('long_form_study_checkpoint_missing')
      validateRunAgainstPlan(current, plan)
      validateRunAgainstPlan(input.run, plan)
      if (current.revision !== input.expectedRevision) {
        throw persistenceConflict('long_form_study_revision_conflict')
      }
      if (input.run.revision !== current.revision + 1) {
        throw persistenceConflict('long_form_study_revision_not_monotonic')
      }
      if (Date.parse(input.run.updatedAt) < Date.parse(current.updatedAt)) {
        throw persistenceConflict('long_form_study_updated_at_regressed')
      }
      await writeRun(input.scope, input.run)
      return structuredClone(input.run)
    })
  }

  async applyControlCommand(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly expectedRunRevision: number
    readonly action: EditReferenceLongFormStudyControlAction
    readonly idempotencyKey: string
    readonly now: string
  }): Promise<EditReferenceLongFormStudyControlPersistenceResult> {
    validateScope(input.scope)
    assertId(input.runId, 'long-form study run id')
    if (!Number.isSafeInteger(input.expectedRunRevision) || input.expectedRunRevision < 1) {
      throw persistenceConflict('long_form_control_expected_revision_invalid')
    }
    if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 500) {
      throw persistenceConflict('long_form_control_idempotency_key_invalid')
    }
    if (!Number.isFinite(Date.parse(input.now))) {
      throw persistenceConflict('long_form_control_time_invalid')
    }
    const commandIdDigestSha256 = sha256(input.idempotencyKey)
    const requestDigestSha256 = sha256(stableStringify({
      runId: input.runId,
      expectedRunRevision: input.expectedRunRevision,
      action: input.action,
    }))

    return withRunLock(input.scope, input.runId, async () => {
      const [plan, current, storedReceipt] = await Promise.all([
        readPlan(input.scope, input.runId),
        readRun(input.scope, input.runId),
        readControlCommandReceipt(input.scope, input.runId, commandIdDigestSha256),
      ])
      if (!plan || !current) throw persistenceConflict('long_form_control_checkpoint_missing')
      validateRunAgainstPlan(current, plan)
      if (storedReceipt) {
        if (storedReceipt.requestDigestSha256 !== requestDigestSha256) {
          throw persistenceConflict('long_form_control_idempotency_conflict')
        }
        return controlResult(plan, current, storedReceipt, 'idempotent_replay')
      }
      if (current.lastControlCommandIdDigestSha256 === commandIdDigestSha256) {
        if (current.lastControlRequestDigestSha256 !== requestDigestSha256) {
          throw persistenceConflict('long_form_control_idempotency_conflict')
        }
        const recoveredReceipt = createControlCommandReceipt({
          run: current,
          action: input.action,
          commandIdDigestSha256,
          requestDigestSha256,
          expectedRunRevision: input.expectedRunRevision,
          activeWorkFinishesBeforePause: current.lastControlActiveWorkFinishesBeforePause ?? false,
          recoveredWorkItemCount: current.lastControlAffectedWorkItemCount ?? 0,
          appliedAt: current.lastControlAt ?? current.updatedAt,
        })
        await writeControlCommandReceipt(input.scope, recoveredReceipt)
        return controlResult(plan, current, recoveredReceipt, 'idempotent_replay')
      }
      if (current.revision !== input.expectedRunRevision) {
        throw persistenceConflict('long_form_control_revision_conflict')
      }
      let applied: EditReferenceLongFormStudyControlResult
      try {
        applied = applyEditReferenceLongFormStudyControl({
          run: current,
          plan,
          action: input.action,
          commandIdDigestSha256,
          requestDigestSha256,
          now: input.now,
        })
      } catch (error) {
        throw persistenceConflict(`long_form_control_transition_rejected:${safeErrorCode(error)}`)
      }
      await writeRun(input.scope, applied.run)
      const receipt = createControlCommandReceipt({
        run: applied.run,
        action: input.action,
        commandIdDigestSha256,
        requestDigestSha256,
        expectedRunRevision: input.expectedRunRevision,
        activeWorkFinishesBeforePause: applied.activeWorkFinishesBeforePause,
        recoveredWorkItemCount: applied.recoveredWorkItemCount,
        appliedAt: input.now,
      })
      await writeControlCommandReceipt(input.scope, receipt)
      return controlResult(plan, applied.run, receipt, 'applied')
    })
  }

  async readWorkOutput(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly workItemId: string
  }): Promise<EditReferenceLongFormStudyWorkOutput | undefined> {
    validateScope(input.scope)
    assertId(input.runId, 'long-form study run id')
    assertId(input.workItemId, 'long-form study work item id')
    return withRunLock(input.scope, input.runId, async () => {
      const [plan, run, output] = await Promise.all([
        readPlan(input.scope, input.runId),
        readRun(input.scope, input.runId),
        readWorkOutput(input.scope, input.runId, input.workItemId),
      ])
      if (!output) return undefined
      if (!plan || !run) throw persistenceConflict('long_form_work_output_checkpoint_missing')
      const workItem = run.workItems.find((item) => item.workItemId === input.workItemId)
      if (!workItem) throw persistenceConflict('long_form_work_output_work_item_missing')
      validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output, plan, workItem })
      return output
    })
  }

  async writeWorkOutput(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly output: EditReferenceLongFormStudyWorkOutput
  }): Promise<{ output: EditReferenceLongFormStudyWorkOutput; disposition: 'created' | 'idempotent_replay' }> {
    validateScope(input.scope)
    validateEditReferenceLongFormStudyWorkOutput(input.output)
    if (input.output.runId.length < 1) throw persistenceConflict('long_form_work_output_run_missing')
    return withRunLock(input.scope, input.output.runId, async () => {
      const [plan, run] = await Promise.all([
        readPlan(input.scope, input.output.runId),
        readRun(input.scope, input.output.runId),
      ])
      if (!plan || !run) throw persistenceConflict('long_form_work_output_checkpoint_missing')
      const workItem = run.workItems.find((item) => item.workItemId === input.output.workItemId)
      if (!workItem) throw persistenceConflict('long_form_work_output_work_item_missing')
      validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output: input.output, plan, workItem })
      const current = await readWorkOutput(
        input.scope,
        input.output.runId,
        input.output.workItemId,
      )
      if (current) {
        if (current.outputDigestSha256 !== input.output.outputDigestSha256) {
          throw persistenceConflict('long_form_work_output_conflict')
        }
        return { output: structuredClone(current), disposition: 'idempotent_replay' }
      }
      if (!['running', 'paused'].includes(run.state) || workItem.status !== 'leased') {
        throw persistenceConflict('long_form_work_output_execution_authority_revoked')
      }
      const paths = workOutputPathsFor(input.scope, input.output.runId, input.output.workItemId)
      const payload: LongFormWorkOutputEnvelopePayload = {
        recordVersion: WORK_OUTPUT_ENVELOPE_VERSION,
        source: RECORD_SOURCE,
        scopeHash: scopeHash(input.scope),
        output: input.output,
      }
      const envelope: LongFormWorkOutputEnvelope = {
        ...payload,
        checksumSha256: sha256(stableStringify(payload)),
      }
      if (findForbiddenPersistenceKey(envelope)) {
        throw persistenceConflict('long_form_work_output_forbidden_private_field')
      }
      const content = `${JSON.stringify(envelope, null, 2)}\n`
      if (Buffer.byteLength(content) > WORK_OUTPUT_MAX_BYTES) {
        throw persistenceConflict('long_form_work_output_exceeds_byte_ceiling')
      }
      await writePrivateFileAtomic(paths.root, paths.outputFile, content)
      return { output: structuredClone(input.output), disposition: 'created' }
    })
  }

  async prepareWorkOutputDirectory(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly workItemId: string
  }): Promise<string> {
    validateScope(input.scope)
    assertId(input.runId, 'long-form study run id')
    assertId(input.workItemId, 'long-form study work item id')
    const paths = workOutputPathsFor(input.scope, input.runId, input.workItemId)
    await ensurePrivateDirectoryChain(paths.root, paths.outputDirectory)
    return paths.outputDirectory
  }

  async writeSemanticWindowCheckpoint(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly checkpoint: EditReferenceLongFormSemanticWindowCheckpoint
    readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  }): Promise<{
    checkpoint: EditReferenceLongFormSemanticWindowCheckpoint
    disposition: 'created' | 'idempotent_replay'
  }> {
    validateScope(input.scope)
    return withRunLock(input.scope, input.checkpoint.runId, async () => {
      const [plan, run] = await Promise.all([
        readPlan(input.scope, input.checkpoint.runId),
        readRun(input.scope, input.checkpoint.runId),
      ])
      if (!plan || !run) throw persistenceConflict('semantic_window_checkpoint_study_missing')
      const workItem = run.workItems.find((item) => item.workItemId === input.checkpoint.workItemId)
      if (!workItem) throw persistenceConflict('semantic_window_checkpoint_work_item_missing')
      validateEditReferenceLongFormSemanticWindowCheckpoint({
        checkpoint: input.checkpoint,
        plan,
        workItem,
        semanticWindowPlan: input.semanticWindowPlan,
      })
      const current = await readSemanticWindowCheckpoint({
        scope: input.scope,
        runId: input.checkpoint.runId,
        workItemId: input.checkpoint.workItemId,
        semanticWindowId: input.checkpoint.window.semanticWindowId,
        specialistId: input.checkpoint.specialistId,
      })
      if (current) {
        if (current.checkpointDigestSha256 !== input.checkpoint.checkpointDigestSha256) {
          throw persistenceConflict('semantic_window_checkpoint_conflict')
        }
        return { checkpoint: structuredClone(current), disposition: 'idempotent_replay' }
      }
      const paths = semanticWindowCheckpointPathsFor({
        scope: input.scope,
        runId: input.checkpoint.runId,
        workItemId: input.checkpoint.workItemId,
        semanticWindowId: input.checkpoint.window.semanticWindowId,
        specialistId: input.checkpoint.specialistId,
      })
      const payload: LongFormSemanticWindowCheckpointEnvelopePayload = {
        recordVersion: SEMANTIC_WINDOW_CHECKPOINT_ENVELOPE_VERSION,
        source: RECORD_SOURCE,
        scopeHash: scopeHash(input.scope),
        checkpoint: input.checkpoint,
      }
      const envelope: LongFormSemanticWindowCheckpointEnvelope = {
        ...payload,
        checksumSha256: sha256(stableStringify(payload)),
      }
      if (findForbiddenPersistenceKey(envelope)) {
        throw persistenceConflict('semantic_window_checkpoint_forbidden_private_field')
      }
      const content = `${JSON.stringify(envelope, null, 2)}\n`
      if (Buffer.byteLength(content) > SEMANTIC_WINDOW_CHECKPOINT_MAX_BYTES) {
        throw persistenceConflict('semantic_window_checkpoint_exceeds_byte_ceiling')
      }
      await writePrivateFileAtomic(paths.root, paths.checkpointFile, content)
      return { checkpoint: structuredClone(input.checkpoint), disposition: 'created' }
    })
  }

  async readSemanticWindowCheckpoint(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly workItemId: string
    readonly semanticWindowId: string
    readonly specialistId: EditReferenceSemanticSpecialistId
    readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  }): Promise<EditReferenceLongFormSemanticWindowCheckpoint | undefined> {
    validateScope(input.scope)
    assertId(input.runId, 'semantic-window checkpoint run id')
    assertId(input.workItemId, 'semantic-window checkpoint work item id')
    assertId(input.semanticWindowId, 'semantic-window checkpoint window id')
    return withRunLock(input.scope, input.runId, async () => {
      const [plan, run, checkpoint] = await Promise.all([
        readPlan(input.scope, input.runId),
        readRun(input.scope, input.runId),
        readSemanticWindowCheckpoint(input),
      ])
      if (!checkpoint) return undefined
      if (!plan || !run) throw persistenceConflict('semantic_window_checkpoint_study_missing')
      const workItem = run.workItems.find((item) => item.workItemId === input.workItemId)
      if (!workItem) throw persistenceConflict('semantic_window_checkpoint_work_item_missing')
      validateEditReferenceLongFormSemanticWindowCheckpoint({
        checkpoint,
        plan,
        workItem,
        semanticWindowPlan: input.semanticWindowPlan,
      })
      return structuredClone(checkpoint)
    })
  }

  resolveWorkOutputArtifactPath(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly runId: string
    readonly workItemId: string
    readonly storageObjectPath: string
  }): string {
    validateScope(input.scope)
    assertId(input.runId, 'long-form study run id')
    assertId(input.workItemId, 'long-form study work item id')
    if (
      !input.storageObjectPath
      || input.storageObjectPath.includes('\0')
      || input.storageObjectPath.includes('\\')
      || input.storageObjectPath.startsWith('/')
      || input.storageObjectPath.split('/').some((segment) => !segment || segment === '.' || segment === '..')
    ) throw persistenceConflict('long_form_work_output_artifact_path_invalid')
    const paths = workOutputPathsFor(input.scope, input.runId, input.workItemId)
    const artifactPath = resolve(paths.outputDirectory, input.storageObjectPath)
    assertInside(paths.outputDirectory, artifactPath)
    return artifactPath
  }
}

export function clearPrivateEditReferenceLongFormStudyRepositoryProcessStateForSmoke(): void {
  runLocks.clear()
}

function result(
  plan: EditReferenceLongFormStudyPlan,
  run: EditReferenceLongFormStudyRunRecord,
  disposition: EditReferenceLongFormStudyPersistenceResult['disposition'],
): EditReferenceLongFormStudyPersistenceResult {
  return {
    plan: structuredClone(plan),
    run: structuredClone(run),
    disposition,
    persistence: 'backend_local_private_segmented',
    rawMediaPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

async function readPlan(
  scope: EditReferenceRepositoryScope,
  runId: string,
): Promise<EditReferenceLongFormStudyPlan | undefined> {
  const paths = pathsFor(scope, runId)
  const bytes = await readPrivateFile(paths.root, paths.planFile, PLAN_MAX_BYTES)
  if (!bytes) return undefined
  const parsed = parseJson(bytes, 'long_form_study_plan_json_invalid')
  if (!isRecord(parsed)) throw persistenceConflict('long_form_study_plan_envelope_invalid')
  const envelope = parsed as unknown as LongFormPlanEnvelope
  const { checksumSha256, ...payload } = envelope
  if (
    envelope.recordVersion !== PLAN_ENVELOPE_VERSION
    || envelope.source !== RECORD_SOURCE
    || envelope.scopeHash !== scopeHash(scope)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw persistenceConflict('long_form_study_plan_envelope_invalid')
  validateEditReferenceLongFormStudyPlan(envelope.plan)
  if (envelope.plan.workspaceId !== scope.workspaceId) {
    throw persistenceConflict('long_form_study_plan_workspace_mismatch')
  }
  return structuredClone(envelope.plan)
}

async function readRun(
  scope: EditReferenceRepositoryScope,
  runId: string,
): Promise<EditReferenceLongFormStudyRunRecord | undefined> {
  const paths = pathsFor(scope, runId)
  const bytes = await readPrivateFile(paths.root, paths.runFile, RUN_MAX_BYTES)
  if (!bytes) return undefined
  const parsed = parseJson(bytes, 'long_form_study_run_json_invalid')
  if (!isRecord(parsed)) throw persistenceConflict('long_form_study_run_envelope_invalid')
  const envelope = parsed as unknown as LongFormRunEnvelope
  const { checksumSha256, ...payload } = envelope
  if (
    envelope.recordVersion !== RUN_ENVELOPE_VERSION
    || envelope.source !== RECORD_SOURCE
    || envelope.scopeHash !== scopeHash(scope)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw persistenceConflict('long_form_study_run_envelope_invalid')
  validateEditReferenceLongFormStudyRun(envelope.run)
  if (envelope.run.workspaceId !== scope.workspaceId || envelope.run.runId !== runId) {
    throw persistenceConflict('long_form_study_run_identity_mismatch')
  }
  return structuredClone(envelope.run)
}

async function readWorkOutput(
  scope: EditReferenceRepositoryScope,
  runId: string,
  workItemId: string,
): Promise<EditReferenceLongFormStudyWorkOutput | undefined> {
  const paths = workOutputPathsFor(scope, runId, workItemId)
  const bytes = await readPrivateFile(paths.root, paths.outputFile, WORK_OUTPUT_MAX_BYTES)
  if (!bytes) return undefined
  const parsed = parseJson(bytes, 'long_form_work_output_json_invalid')
  if (!isRecord(parsed)) throw persistenceConflict('long_form_work_output_envelope_invalid')
  const envelope = parsed as unknown as LongFormWorkOutputEnvelope
  const { checksumSha256, ...payload } = envelope
  if (
    envelope.recordVersion !== WORK_OUTPUT_ENVELOPE_VERSION
    || envelope.source !== RECORD_SOURCE
    || envelope.scopeHash !== scopeHash(scope)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw persistenceConflict('long_form_work_output_envelope_invalid')
  validateEditReferenceLongFormStudyWorkOutput(envelope.output)
  if (envelope.output.runId !== runId || envelope.output.workItemId !== workItemId) {
    throw persistenceConflict('long_form_work_output_identity_mismatch')
  }
  return structuredClone(envelope.output)
}

function createControlCommandReceipt(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly action: EditReferenceLongFormStudyControlAction
  readonly commandIdDigestSha256: string
  readonly requestDigestSha256: string
  readonly expectedRunRevision: number
  readonly activeWorkFinishesBeforePause: boolean
  readonly recoveredWorkItemCount: number
  readonly appliedAt: string
}): EditReferenceLongFormStudyControlCommandReceipt {
  const unsigned: Omit<EditReferenceLongFormStudyControlCommandReceipt, 'receiptDigestSha256'> = {
    schemaVersion: CONTROL_COMMAND_RECEIPT_VERSION,
    runId: input.run.runId,
    action: input.action,
    commandIdDigestSha256: input.commandIdDigestSha256,
    requestDigestSha256: input.requestDigestSha256,
    expectedRunRevision: input.expectedRunRevision,
    appliedRunRevision: input.run.revision,
    appliedRunDigestSha256: input.run.recordDigestSha256,
    activeWorkFinishesBeforePause: input.activeWorkFinishesBeforePause,
    recoveredWorkItemCount: input.recoveredWorkItemCount,
    completedCheckpointsPreserved: true,
    appliedAt: input.appliedAt,
  }
  const receipt = { ...unsigned, receiptDigestSha256: sha256(stableStringify(unsigned)) }
  validateControlCommandReceipt(receipt)
  return receipt
}

function validateControlCommandReceipt(receipt: EditReferenceLongFormStudyControlCommandReceipt): void {
  if (receipt.schemaVersion !== CONTROL_COMMAND_RECEIPT_VERSION) {
    throw persistenceConflict('long_form_control_receipt_version_invalid')
  }
  assertId(receipt.runId, 'long-form control receipt run id')
  if (!['pause', 'resume', 'cancel', 'recover'].includes(receipt.action)) {
    throw persistenceConflict('long_form_control_receipt_action_invalid')
  }
  for (const digest of [
    receipt.commandIdDigestSha256,
    receipt.requestDigestSha256,
    receipt.appliedRunDigestSha256,
    receipt.receiptDigestSha256,
  ]) {
    if (!/^[a-f0-9]{64}$/.test(digest)) {
      throw persistenceConflict('long_form_control_receipt_digest_invalid')
    }
  }
  if (
    !Number.isSafeInteger(receipt.expectedRunRevision)
    || receipt.expectedRunRevision < 1
    || !Number.isSafeInteger(receipt.appliedRunRevision)
    || receipt.appliedRunRevision <= receipt.expectedRunRevision
    || !Number.isSafeInteger(receipt.recoveredWorkItemCount)
    || receipt.recoveredWorkItemCount < 0
    || receipt.completedCheckpointsPreserved !== true
    || !Number.isFinite(Date.parse(receipt.appliedAt))
  ) throw persistenceConflict('long_form_control_receipt_state_invalid')
  const { receiptDigestSha256, ...unsigned } = receipt
  if (sha256(stableStringify(unsigned)) !== receiptDigestSha256) {
    throw persistenceConflict('long_form_control_receipt_checksum_invalid')
  }
}

async function readControlCommandReceipt(
  scope: EditReferenceRepositoryScope,
  runId: string,
  commandIdDigestSha256: string,
): Promise<EditReferenceLongFormStudyControlCommandReceipt | undefined> {
  const paths = controlCommandPathsFor(scope, runId, commandIdDigestSha256)
  const bytes = await readPrivateFile(paths.root, paths.receiptFile, CONTROL_COMMAND_MAX_BYTES)
  if (!bytes) return undefined
  const parsed = parseJson(bytes, 'long_form_control_receipt_json_invalid')
  if (!isRecord(parsed)) throw persistenceConflict('long_form_control_receipt_envelope_invalid')
  const envelope = parsed as unknown as LongFormControlCommandEnvelope
  const { checksumSha256, ...payload } = envelope
  if (
    envelope.recordVersion !== CONTROL_COMMAND_ENVELOPE_VERSION
    || envelope.source !== RECORD_SOURCE
    || envelope.scopeHash !== scopeHash(scope)
    || !/^[a-f0-9]{64}$/.test(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw persistenceConflict('long_form_control_receipt_envelope_invalid')
  validateControlCommandReceipt(envelope.receipt)
  if (
    envelope.receipt.runId !== runId
    || envelope.receipt.commandIdDigestSha256 !== commandIdDigestSha256
  ) throw persistenceConflict('long_form_control_receipt_identity_mismatch')
  return structuredClone(envelope.receipt)
}

async function writeControlCommandReceipt(
  scope: EditReferenceRepositoryScope,
  receipt: EditReferenceLongFormStudyControlCommandReceipt,
): Promise<void> {
  validateControlCommandReceipt(receipt)
  const paths = controlCommandPathsFor(scope, receipt.runId, receipt.commandIdDigestSha256)
  const payload: LongFormControlCommandEnvelopePayload = {
    recordVersion: CONTROL_COMMAND_ENVELOPE_VERSION,
    source: RECORD_SOURCE,
    scopeHash: scopeHash(scope),
    receipt,
  }
  const envelope: LongFormControlCommandEnvelope = {
    ...payload,
    checksumSha256: sha256(stableStringify(payload)),
  }
  if (findForbiddenPersistenceKey(envelope)) {
    throw persistenceConflict('long_form_control_receipt_forbidden_private_field')
  }
  const content = `${JSON.stringify(envelope, null, 2)}\n`
  if (Buffer.byteLength(content) > CONTROL_COMMAND_MAX_BYTES) {
    throw persistenceConflict('long_form_control_receipt_exceeds_byte_ceiling')
  }
  const existing = await readControlCommandReceipt(scope, receipt.runId, receipt.commandIdDigestSha256)
  if (existing) {
    if (existing.receiptDigestSha256 !== receipt.receiptDigestSha256) {
      throw persistenceConflict('long_form_control_receipt_conflict')
    }
    return
  }
  await writePrivateFileAtomic(paths.root, paths.receiptFile, content)
}

function controlResult(
  plan: EditReferenceLongFormStudyPlan,
  run: EditReferenceLongFormStudyRunRecord,
  receipt: EditReferenceLongFormStudyControlCommandReceipt,
  disposition: EditReferenceLongFormStudyControlPersistenceResult['disposition'],
): EditReferenceLongFormStudyControlPersistenceResult {
  return {
    plan: structuredClone(plan),
    run: structuredClone(run),
    receipt: structuredClone(receipt),
    disposition,
    persistence: 'backend_local_private_segmented',
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

async function writePlan(
  scope: EditReferenceRepositoryScope,
  runId: string,
  plan: EditReferenceLongFormStudyPlan,
): Promise<void> {
  validateEditReferenceLongFormStudyPlan(plan)
  if (plan.workspaceId !== scope.workspaceId) throw persistenceConflict('long_form_study_plan_workspace_mismatch')
  const payload: LongFormPlanEnvelopePayload = {
    recordVersion: PLAN_ENVELOPE_VERSION,
    source: RECORD_SOURCE,
    scopeHash: scopeHash(scope),
    plan,
  }
  const envelope: LongFormPlanEnvelope = { ...payload, checksumSha256: sha256(stableStringify(payload)) }
  await writeEnvelope(scope, runId, plan.planId, 'plan', envelope, PLAN_MAX_BYTES)
}

async function writeRun(scope: EditReferenceRepositoryScope, run: EditReferenceLongFormStudyRunRecord): Promise<void> {
  validateEditReferenceLongFormStudyRun(run)
  if (run.workspaceId !== scope.workspaceId) throw persistenceConflict('long_form_study_run_workspace_mismatch')
  const payload: LongFormRunEnvelopePayload = {
    recordVersion: RUN_ENVELOPE_VERSION,
    source: RECORD_SOURCE,
    scopeHash: scopeHash(scope),
    run,
  }
  const envelope: LongFormRunEnvelope = { ...payload, checksumSha256: sha256(stableStringify(payload)) }
  await writeEnvelope(scope, run.runId, run.planId, 'run', envelope, RUN_MAX_BYTES)
}

async function writeEnvelope(
  scope: EditReferenceRepositoryScope,
  runId: string,
  planId: string,
  kind: 'plan' | 'run',
  envelope: LongFormPlanEnvelope | LongFormRunEnvelope,
  maximumBytes: number,
): Promise<void> {
  assertId(runId, 'long-form study run id')
  assertId(planId, 'long-form study plan id')
  if (findForbiddenPersistenceKey(envelope)) {
    throw persistenceConflict('long_form_study_forbidden_private_field')
  }
  const paths = pathsFor(scope, runId)
  const file = kind === 'plan' ? paths.planFile : paths.runFile
  const content = `${JSON.stringify(envelope, null, 2)}\n`
  if (Buffer.byteLength(content) > maximumBytes) {
    throw persistenceConflict(`long_form_study_${kind}_exceeds_byte_ceiling`)
  }
  await writePrivateFileAtomic(paths.root, file, content)
}

interface LongFormStudyPaths {
  readonly root: string
  readonly directory: string
  readonly planFile: string
  readonly runFile: string
}

interface LongFormStudyWorkOutputPaths {
  readonly root: string
  readonly outputDirectory: string
  readonly outputFile: string
}

interface LongFormStudyControlCommandPaths {
  readonly root: string
  readonly receiptFile: string
}

function pathsFor(scope: EditReferenceRepositoryScope, runId: string): LongFormStudyPaths {
  const root = resolve(scope.localStorageRoot)
  const directory = resolve(
    root,
    'edit-reference-private',
    'scopes',
    scopeHash(scope),
    'long-form-studies',
    sha256(runId),
  )
  return {
    root,
    directory,
    planFile: resolve(directory, 'plan.json'),
    runFile: resolve(directory, 'checkpoint.json'),
  }
}

function workOutputPathsFor(
  scope: EditReferenceRepositoryScope,
  runId: string,
  workItemId: string,
): LongFormStudyWorkOutputPaths {
  const study = pathsFor(scope, runId)
  const outputDirectory = resolve(study.directory, 'work-outputs', sha256(workItemId))
  return {
    root: study.root,
    outputDirectory,
    outputFile: resolve(outputDirectory, 'result.json'),
  }
}

function controlCommandPathsFor(
  scope: EditReferenceRepositoryScope,
  runId: string,
  commandIdDigestSha256: string,
): LongFormStudyControlCommandPaths {
  if (!/^[a-f0-9]{64}$/.test(commandIdDigestSha256)) {
    throw persistenceConflict('long_form_control_command_digest_invalid')
  }
  const study = pathsFor(scope, runId)
  return {
    root: study.root,
    receiptFile: resolve(study.directory, 'control-commands', `${commandIdDigestSha256}.json`),
  }
}

function semanticWindowCheckpointPathsFor(input: {
  readonly scope: EditReferenceRepositoryScope
  readonly runId: string
  readonly workItemId: string
  readonly semanticWindowId: string
  readonly specialistId: EditReferenceSemanticSpecialistId
}): {
  readonly root: string
  readonly checkpointFile: string
} {
  const work = workOutputPathsFor(input.scope, input.runId, input.workItemId)
  const checkpointDirectory = resolve(work.outputDirectory, 'semantic-window-checkpoints')
  const identity = sha256(`${input.semanticWindowId}\u0000${input.specialistId}`)
  return {
    root: work.root,
    checkpointFile: resolve(checkpointDirectory, `${identity}.json`),
  }
}

async function readSemanticWindowCheckpoint(input: {
  readonly scope: EditReferenceRepositoryScope
  readonly runId: string
  readonly workItemId: string
  readonly semanticWindowId: string
  readonly specialistId: EditReferenceSemanticSpecialistId
}): Promise<EditReferenceLongFormSemanticWindowCheckpoint | undefined> {
  const paths = semanticWindowCheckpointPathsFor(input)
  const bytes = await readPrivateFile(
    paths.root,
    paths.checkpointFile,
    SEMANTIC_WINDOW_CHECKPOINT_MAX_BYTES,
  )
  if (!bytes) return undefined
  const parsed = parseJson(bytes, 'semantic_window_checkpoint_json_invalid')
  if (!isRecord(parsed)) throw persistenceConflict('semantic_window_checkpoint_envelope_invalid')
  const envelope = parsed as unknown as LongFormSemanticWindowCheckpointEnvelope
  const { checksumSha256, ...payload } = envelope
  if (
    envelope.recordVersion !== SEMANTIC_WINDOW_CHECKPOINT_ENVELOPE_VERSION
    || envelope.source !== RECORD_SOURCE
    || envelope.scopeHash !== scopeHash(input.scope)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
    || envelope.checkpoint.runId !== input.runId
    || envelope.checkpoint.workItemId !== input.workItemId
    || envelope.checkpoint.window.semanticWindowId !== input.semanticWindowId
    || envelope.checkpoint.specialistId !== input.specialistId
  ) throw persistenceConflict('semantic_window_checkpoint_envelope_invalid')
  return envelope.checkpoint
}

async function withRunLock<T>(
  scope: EditReferenceRepositoryScope,
  runId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const key = `${scopeHash(scope)}:${sha256(runId)}`
  const previous = runLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolvePromise) => { release = resolvePromise })
  const queued = previous.then(() => current)
  runLocks.set(key, queued)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (runLocks.get(key) === queued) runLocks.delete(key)
  }
}

async function readPrivateFile(root: string, file: string, maximumBytes: number): Promise<Buffer | undefined> {
  assertInside(root, file)
  if (!await validateExistingDirectoryChain(root, dirname(file), true)) return undefined
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return undefined
    throw error
  }
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > maximumBytes) throw unsafePath('long_form_study_private_file_unsafe')
    await handle.chmod(FILE_MODE)
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

async function writePrivateFileAtomic(root: string, file: string, content: string): Promise<void> {
  assertInside(root, file)
  await ensurePrivateDirectoryChain(root, dirname(file))
  await assertSafeTarget(file)
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`
  assertInside(root, temporary)
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      FILE_MODE,
    )
    await handle.writeFile(content, 'utf8')
    await handle.sync()
  } finally {
    await handle?.close()
  }
  try {
    await rename(temporary, file)
    await chmod(file, FILE_MODE)
    const directory = await open(dirname(file), constants.O_RDONLY)
    try { await directory.sync() } finally { await directory.close() }
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
}

async function ensurePrivateDirectoryChain(root: string, target: string): Promise<void> {
  const absoluteRoot = resolve(root)
  await mkdir(absoluteRoot, { recursive: true, mode: DIRECTORY_MODE })
  const rootStat = await lstat(absoluteRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw unsafePath('long_form_study_root_unsafe')
  await chmod(absoluteRoot, DIRECTORY_MODE)
  const pathSegments = relative(absoluteRoot, resolve(target)).split(sep).filter(Boolean)
  let current = absoluteRoot
  for (const segment of pathSegments) {
    current = resolve(current, segment)
    assertInside(absoluteRoot, current, true)
    try {
      await mkdir(current, { mode: DIRECTORY_MODE })
    } catch (error) {
      if (!isNodeError(error, 'EEXIST')) throw error
    }
    const stat = await lstat(current)
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw unsafePath('long_form_study_directory_unsafe')
    await chmod(current, DIRECTORY_MODE)
  }
  const canonicalRoot = await realpath(absoluteRoot)
  const canonicalTarget = await realpath(target)
  assertInside(canonicalRoot, canonicalTarget, true)
}

async function validateExistingDirectoryChain(
  root: string,
  target: string,
  allowMissing: boolean,
): Promise<boolean> {
  const absoluteRoot = resolve(root)
  try {
    const rootStat = await lstat(absoluteRoot)
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw unsafePath('long_form_study_root_unsafe')
  } catch (error) {
    if (allowMissing && isNodeError(error, 'ENOENT')) return false
    throw error
  }
  const segments = relative(absoluteRoot, resolve(target)).split(sep).filter(Boolean)
  let current = absoluteRoot
  for (const segment of segments) {
    current = resolve(current, segment)
    assertInside(absoluteRoot, current, true)
    try {
      const stat = await lstat(current)
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw unsafePath('long_form_study_directory_unsafe')
    } catch (error) {
      if (allowMissing && isNodeError(error, 'ENOENT')) return false
      throw error
    }
  }
  return true
}

async function assertSafeTarget(file: string): Promise<void> {
  try {
    const stat = await lstat(file)
    if (!stat.isFile() || stat.isSymbolicLink()) throw unsafePath('long_form_study_target_unsafe')
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) throw error
  }
}

function validateScope(scope: EditReferenceRepositoryScope): void {
  if (!scope.localStorageRoot) throw persistenceConflict('long_form_study_storage_root_missing')
  assertId(scope.ownerUserId, 'long-form study owner id')
  assertId(scope.workspaceId, 'long-form study workspace id')
}

function scopeHash(scope: EditReferenceRepositoryScope): string {
  return sha256(`${scope.ownerUserId}\u0000${scope.workspaceId}`)
}

function assertInside(root: string, target: string, allowEqual = false): void {
  const absoluteRoot = resolve(root)
  const absoluteTarget = resolve(target)
  if (allowEqual && absoluteTarget === absoluteRoot) return
  if (!absoluteTarget.startsWith(`${absoluteRoot}${sep}`)) throw unsafePath('long_form_study_path_escape')
}

function findForbiddenPersistenceKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(findForbiddenPersistenceKey)
  if (!isRecord(value)) return false
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if ([
      'rawframes',
      'rawproviderpayload',
      'signedurl',
      'localfilepath',
      'apikey',
      'servicerolekey',
      'accesstoken',
      'leasetoken',
    ].includes(normalized)) return true
    if (findForbiddenPersistenceKey(child)) return true
  }
  return false
}

function parseJson(bytes: Buffer, code: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    throw persistenceConflict(code)
  }
}

function persistenceConflict(code: string): Error {
  return new Error(`Edit Reference long-form study persistence rejected: ${code}.`)
}

function unsafePath(code: string): Error {
  return persistenceConflict(code)
}

function safeErrorCode(error: unknown): string {
  return error instanceof Error
    ? error.message.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 100)
    : 'unknown_error'
}

function assertId(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value)) throw persistenceConflict(`${label.replaceAll(' ', '_')}_invalid`)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNodeError(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
