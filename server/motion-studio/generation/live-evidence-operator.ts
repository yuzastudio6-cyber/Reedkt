import { ApiError } from '../../errors/api-error'

export type MotionStudioLiveEvidenceOperatorState =
  | 'unprepared'
  | 'ready_for_gpt_generation'
  | 'awaiting_gpt_generation_review'
  | 'ready_for_gpt_edit'
  | 'awaiting_gpt_edit_review'
  | 'ready_for_wan_submission'
  | 'wan_processing'
  | 'wan_download_ready'
  | 'wan_local_media_recovery_ready'
  | 'awaiting_wan_review'
  | 'ready_for_hailuo_submission'
  | 'hailuo_processing'
  | 'hailuo_file_ready'
  | 'hailuo_download_ready'
  | 'hailuo_local_media_recovery_ready'
  | 'awaiting_hailuo_review'
  | 'complete_wan_approved'
  | 'complete_hailuo_approved'
  | 'complete_hailuo_rejected'
  | 'stopped'

export type MotionStudioLiveEvidenceOperatorCommand =
  | 'status'
  | 'prepare'
  | 'gpt-generate'
  | 'approve-gpt-generation'
  | 'gpt-edit'
  | 'approve-gpt-edit'
  | 'wan-submit'
  | 'wan-query'
  | 'wan-download'
  | 'wan-recover'
  | 'wan-approve'
  | 'wan-reject'
  | 'hailuo-submit'
  | 'hailuo-query'
  | 'hailuo-file'
  | 'hailuo-download'
  | 'hailuo-recover'
  | 'hailuo-approve'
  | 'hailuo-reject'
  | 'stop'

export type MotionStudioLiveEvidenceOperatorPreparation =
  | {
    state: 'ready_for_gpt_edit'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 0
      wan: 0
      hailuo: 0
    }>
    manualStatusQueryCounts: Readonly<{ wan: 0; hailuo: 0 }>
  }
  | {
    state: 'ready_for_wan_submission'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 1
      wan: 0
      hailuo: 0
    }>
    manualStatusQueryCounts: Readonly<{ wan: 0; hailuo: 0 }>
  }
  | {
    state: 'wan_processing'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 1
      wan: 1
      hailuo: 0
    }>
    manualStatusQueryCounts: Readonly<{ wan: number; hailuo: 0 }>
  }
  | {
    state: 'wan_local_media_recovery_ready'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 1
      wan: 1
      hailuo: 0
    }>
    manualStatusQueryCounts: Readonly<{ wan: number; hailuo: 0 }>
  }
  | {
    state: 'awaiting_wan_review'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 1
      wan: 1
      hailuo: 0
    }>
    manualStatusQueryCounts: Readonly<{ wan: number; hailuo: 0 }>
  }
  | {
    state: 'hailuo_processing'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 1
      wan: 1
      hailuo: 1
    }>
    manualStatusQueryCounts: Readonly<{ wan: number; hailuo: number }>
  }
  | {
    state: 'hailuo_local_media_recovery_ready'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 1
      wan: 1
      hailuo: 1
    }>
    manualStatusQueryCounts: Readonly<{ wan: number; hailuo: number }>
  }
  | {
    state: 'awaiting_hailuo_review'
    providerSubmissionCounts: Readonly<{
      gptImageGeneration: 1
      gptImageEdit: 1
      wan: 1
      hailuo: 1
    }>
    manualStatusQueryCounts: Readonly<{ wan: number; hailuo: number }>
  }

export interface MotionStudioLiveEvidenceOperatorHandlers {
  prepare(): Promise<MotionStudioLiveEvidenceOperatorPreparation | void>
  generateGptImage(): Promise<void>
  approveGptGeneration(): Promise<void>
  editGptImage(): Promise<void>
  approveGptEdit(): Promise<void>
  submitWan(): Promise<void>
  queryWan(): Promise<'processing' | 'download_ready'>
  downloadWan(): Promise<void>
  recoverWan(): Promise<void>
  approveWan(): Promise<void>
  rejectWanAndPersistFallbackEligibility(): Promise<void>
  submitHailuo(): Promise<void>
  queryHailuo(): Promise<'processing' | 'file_ready'>
  retrieveHailuoFile(): Promise<void>
  downloadHailuo(): Promise<void>
  recoverHailuo(): Promise<void>
  approveHailuo(): Promise<void>
  rejectHailuo(): Promise<void>
  stop(reason: string): Promise<void>
}

export interface MotionStudioLiveEvidenceOperatorSnapshot {
  state: MotionStudioLiveEvidenceOperatorState
  allowedCommands: readonly MotionStudioLiveEvidenceOperatorCommand[]
  providerSubmissionCounts: Readonly<{
    gptImageGeneration: 0 | 1
    gptImageEdit: 0 | 1
    wan: 0 | 1
    hailuo: 0 | 1
  }>
  manualStatusQueryCounts: Readonly<{ wan: number; hailuo: number }>
  maximumManualStatusQueriesPerProvider: number
  combinedProviderMaximumUsdMicros: 3_000_000
  automaticRetriesAllowed: false
  automaticProviderSubmissionAllowed: false
  automaticPollingAllowed: false
  automaticFallbackSubmissionAllowed: false
  purchaseOrRechargeAllowed: false
  customerBillingAuthorized: false
  stoppedReason?: string
}

const TERMINAL_STATES = new Set<MotionStudioLiveEvidenceOperatorState>([
  'complete_wan_approved',
  'complete_hailuo_approved',
  'complete_hailuo_rejected',
  'stopped',
])

/**
 * Manual, fail-closed command sequencer for the one authorized MS-010B run.
 *
 * This class never contains provider credentials, provider task identifiers,
 * temporary URLs, prompts, media bytes, or persistence authority. Those stay
 * inside the injected backend handlers. Every network-bearing action requires
 * one explicit command invocation; the sequencer has no timers, loops,
 * automatic retries, automatic fallback, or command replay.
 */
export class MotionStudioLiveEvidenceOperator {
  private readonly handlers: MotionStudioLiveEvidenceOperatorHandlers
  private readonly maximumManualStatusQueriesPerProvider: number
  private state: MotionStudioLiveEvidenceOperatorState = 'unprepared'
  private executing = false
  private stoppedReason: string | undefined
  private readonly submissions = {
    gptImageGeneration: 0 as 0 | 1,
    gptImageEdit: 0 as 0 | 1,
    wan: 0 as 0 | 1,
    hailuo: 0 as 0 | 1,
  }
  private readonly statusQueries = { wan: 0, hailuo: 0 }

  constructor(
    handlers: MotionStudioLiveEvidenceOperatorHandlers,
    maximumManualStatusQueriesPerProvider = 20,
  ) {
    if (
      !Number.isSafeInteger(maximumManualStatusQueriesPerProvider) ||
      maximumManualStatusQueriesPerProvider < 1 ||
      maximumManualStatusQueriesPerProvider > 20
    ) {
      throw invalid('Manual provider status-query ceiling must be between one and twenty.')
    }
    this.handlers = handlers
    this.maximumManualStatusQueriesPerProvider = maximumManualStatusQueriesPerProvider
  }

  snapshot(): MotionStudioLiveEvidenceOperatorSnapshot {
    return Object.freeze({
      state: this.state,
      allowedCommands: Object.freeze([...allowedCommands(this.state)]),
      providerSubmissionCounts: Object.freeze({ ...this.submissions }),
      manualStatusQueryCounts: Object.freeze({ ...this.statusQueries }),
      maximumManualStatusQueriesPerProvider: this.maximumManualStatusQueriesPerProvider,
      combinedProviderMaximumUsdMicros: 3_000_000 as const,
      automaticRetriesAllowed: false as const,
      automaticProviderSubmissionAllowed: false as const,
      automaticPollingAllowed: false as const,
      automaticFallbackSubmissionAllowed: false as const,
      purchaseOrRechargeAllowed: false as const,
      customerBillingAuthorized: false as const,
      ...(this.stoppedReason ? { stoppedReason: this.stoppedReason } : {}),
    })
  }

  async execute(command: MotionStudioLiveEvidenceOperatorCommand): Promise<MotionStudioLiveEvidenceOperatorSnapshot> {
    if (command === 'status') return this.snapshot()
    if (this.executing) throw blocked('Another operator command is already in progress.')
    if (!allowedCommands(this.state).includes(command)) {
      throw blocked(`Command ${command} is not allowed while the operator is ${this.state}.`)
    }
    this.executing = true
    try {
      await this.executeAllowed(command)
      return this.snapshot()
    } catch (error) {
      this.state = 'stopped'
      this.stoppedReason = safeFailureReason(error)
      try {
        await this.handlers.stop(this.stoppedReason)
      } catch {
        // Preserve the original fail-closed error and never attempt recovery or
        // another provider call from the stop path.
      }
      throw error
    } finally {
      this.executing = false
    }
  }

  private async executeAllowed(command: Exclude<MotionStudioLiveEvidenceOperatorCommand, 'status'>): Promise<void> {
    switch (command) {
      case 'prepare':
        this.applyPreparation(await this.handlers.prepare())
        return
      case 'gpt-generate':
        this.consumeSubmission('gptImageGeneration')
        await this.handlers.generateGptImage()
        this.state = 'awaiting_gpt_generation_review'
        return
      case 'approve-gpt-generation':
        await this.handlers.approveGptGeneration()
        this.state = 'ready_for_gpt_edit'
        return
      case 'gpt-edit':
        this.consumeSubmission('gptImageEdit')
        await this.handlers.editGptImage()
        this.state = 'awaiting_gpt_edit_review'
        return
      case 'approve-gpt-edit':
        await this.handlers.approveGptEdit()
        this.state = 'ready_for_wan_submission'
        return
      case 'wan-submit':
        this.consumeSubmission('wan')
        await this.handlers.submitWan()
        this.state = 'wan_processing'
        return
      case 'wan-query': {
        this.consumeManualQuery('wan')
        const status = await this.handlers.queryWan()
        this.state = status === 'download_ready' ? 'wan_download_ready' : 'wan_processing'
        return
      }
      case 'wan-download':
        await this.handlers.downloadWan()
        this.state = 'awaiting_wan_review'
        return
      case 'wan-recover':
        await this.handlers.recoverWan()
        this.state = 'awaiting_wan_review'
        return
      case 'wan-approve':
        await this.handlers.approveWan()
        this.state = 'complete_wan_approved'
        return
      case 'wan-reject':
        await this.handlers.rejectWanAndPersistFallbackEligibility()
        this.state = 'ready_for_hailuo_submission'
        return
      case 'hailuo-submit':
        this.consumeSubmission('hailuo')
        await this.handlers.submitHailuo()
        this.state = 'hailuo_processing'
        return
      case 'hailuo-query': {
        this.consumeManualQuery('hailuo')
        const status = await this.handlers.queryHailuo()
        this.state = status === 'file_ready' ? 'hailuo_file_ready' : 'hailuo_processing'
        return
      }
      case 'hailuo-file':
        await this.handlers.retrieveHailuoFile()
        this.state = 'hailuo_download_ready'
        return
      case 'hailuo-download':
        await this.handlers.downloadHailuo()
        this.state = 'awaiting_hailuo_review'
        return
      case 'hailuo-recover':
        await this.handlers.recoverHailuo()
        this.state = 'awaiting_hailuo_review'
        return
      case 'hailuo-approve':
        await this.handlers.approveHailuo()
        this.state = 'complete_hailuo_approved'
        return
      case 'hailuo-reject':
        await this.handlers.rejectHailuo()
        this.state = 'complete_hailuo_rejected'
        return
      case 'stop':
        this.stoppedReason = 'manual_operator_stop'
        await this.handlers.stop(this.stoppedReason)
        this.state = 'stopped'
        return
    }
  }

  private applyPreparation(preparation: MotionStudioLiveEvidenceOperatorPreparation | void): void {
    if (!preparation) {
      this.state = 'ready_for_gpt_generation'
      return
    }
    const validStates: MotionStudioLiveEvidenceOperatorPreparation['state'][] = [
      'ready_for_gpt_edit', 'ready_for_wan_submission', 'wan_processing',
      'wan_local_media_recovery_ready', 'awaiting_wan_review', 'hailuo_processing',
      'hailuo_local_media_recovery_ready',
      'awaiting_hailuo_review',
    ]
    const editCount = preparation.state === 'ready_for_gpt_edit' ? 0 : 1
    const wanCount = ['wan_processing', 'wan_local_media_recovery_ready', 'awaiting_wan_review', 'hailuo_processing', 'hailuo_local_media_recovery_ready', 'awaiting_hailuo_review'].includes(preparation.state) ? 1 : 0
    const hailuoCount = ['hailuo_processing', 'hailuo_local_media_recovery_ready', 'awaiting_hailuo_review'].includes(preparation.state) ? 1 : 0
    const wanQueryCount = preparation.manualStatusQueryCounts.wan
    const hailuoQueryCount = preparation.manualStatusQueryCounts.hailuo
    if (
      !validStates.includes(preparation.state) ||
      preparation.providerSubmissionCounts.gptImageGeneration !== 1 ||
      preparation.providerSubmissionCounts.gptImageEdit !== editCount ||
      preparation.providerSubmissionCounts.wan !== wanCount ||
      preparation.providerSubmissionCounts.hailuo !== hailuoCount ||
      (!Number.isSafeInteger(wanQueryCount) || wanQueryCount < 0 || wanQueryCount > this.maximumManualStatusQueriesPerProvider) ||
      (!['wan_processing', 'wan_local_media_recovery_ready', 'awaiting_wan_review', 'hailuo_processing', 'hailuo_local_media_recovery_ready', 'awaiting_hailuo_review'].includes(preparation.state) && wanQueryCount !== 0) ||
      (!Number.isSafeInteger(hailuoQueryCount) || hailuoQueryCount < 0 || hailuoQueryCount > this.maximumManualStatusQueriesPerProvider) ||
      (!['hailuo_processing', 'hailuo_local_media_recovery_ready', 'awaiting_hailuo_review'].includes(preparation.state) && hailuoQueryCount !== 0) ||
      (['hailuo_processing', 'hailuo_local_media_recovery_ready', 'awaiting_hailuo_review'].includes(preparation.state) && hailuoQueryCount < 2)
    ) {
      throw blocked('Durable operator preparation did not match the exact approved-generation recovery state.')
    }
    this.submissions.gptImageGeneration = 1
    this.submissions.gptImageEdit = editCount
    this.submissions.wan = wanCount
    this.submissions.hailuo = hailuoCount
    this.statusQueries.wan = wanQueryCount
    this.statusQueries.hailuo = hailuoQueryCount
    this.state = preparation.state
  }

  private consumeSubmission(kind: keyof typeof this.submissions): void {
    if (this.submissions[kind] !== 0) throw blocked(`The one authorized ${kind} submission was already consumed.`)
    this.submissions[kind] = 1
  }

  private consumeManualQuery(provider: keyof typeof this.statusQueries): void {
    if (this.statusQueries[provider] >= this.maximumManualStatusQueriesPerProvider) {
      throw blocked(`The manual ${provider} status-query ceiling has been reached.`)
    }
    this.statusQueries[provider] += 1
  }
}

function allowedCommands(state: MotionStudioLiveEvidenceOperatorState): readonly MotionStudioLiveEvidenceOperatorCommand[] {
  if (TERMINAL_STATES.has(state)) return ['status']
  switch (state) {
    case 'unprepared': return ['status', 'prepare', 'stop']
    case 'ready_for_gpt_generation': return ['status', 'gpt-generate', 'stop']
    case 'awaiting_gpt_generation_review': return ['status', 'approve-gpt-generation', 'stop']
    case 'ready_for_gpt_edit': return ['status', 'gpt-edit', 'stop']
    case 'awaiting_gpt_edit_review': return ['status', 'approve-gpt-edit', 'stop']
    case 'ready_for_wan_submission': return ['status', 'wan-submit', 'stop']
    case 'wan_processing': return ['status', 'wan-query', 'stop']
    case 'wan_download_ready': return ['status', 'wan-download', 'stop']
    case 'wan_local_media_recovery_ready': return ['status', 'wan-recover', 'stop']
    case 'awaiting_wan_review': return ['status', 'wan-approve', 'wan-reject', 'stop']
    case 'ready_for_hailuo_submission': return ['status', 'hailuo-submit', 'stop']
    case 'hailuo_processing': return ['status', 'hailuo-query', 'stop']
    case 'hailuo_file_ready': return ['status', 'hailuo-file', 'stop']
    case 'hailuo_download_ready': return ['status', 'hailuo-download', 'stop']
    case 'hailuo_local_media_recovery_ready': return ['status', 'hailuo-recover', 'stop']
    case 'awaiting_hailuo_review': return ['status', 'hailuo-approve', 'hailuo-reject', 'stop']
    case 'complete_wan_approved':
    case 'complete_hailuo_approved':
    case 'complete_hailuo_rejected':
    case 'stopped':
      return ['status']
  }
}

function safeFailureReason(error: unknown): string {
  if (error instanceof ApiError) return `operator_failed_${error.code.toLowerCase()}`
  if (error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name)) {
    return `operator_failed_${error.name.toLowerCase()}`
  }
  return 'operator_failed_unknown_error'
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
