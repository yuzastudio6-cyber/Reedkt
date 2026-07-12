import type { PreferenceApplicationRecord } from '../../types/edit-reference'
import type { ProjectEditSessionBundleRecord } from '../../types/project-edit-session-repository'
import {
  findApprovedReferenceMatches,
  loadApprovedEditReferenceOptions,
  type ApprovedEditReferenceOption,
} from '../../lib/edit-reference-approved-options'
import { createEditReferenceApiClient, type EditReferenceApiClient } from '../../lib/edit-reference-api-client'
import {
  EDIT_REFERENCE_WORKSPACE_ID,
  connectPreferenceApplicationToProjectEditSession,
  loadProjectEditSessionEditReferenceIntegration,
  preparePreferenceApplicationForProjectEditSession,
  removePreferenceApplicationFromProjectEditSession,
  replacePreferenceApplicationForProjectEditSession,
} from '../../lib/project-edit-session-edit-reference-integration'
import type { ProjectEditSessionApiClient } from '../../lib/project-edit-session-api-client'

export type EditReferenceChatCommandIntent = 'apply' | 'compare' | 'replace' | 'remove' | 'override'

export interface ParsedEditReferenceChatCommand {
  handled: boolean
  intent?: EditReferenceChatCommandIntent
  handles: string[]
  confirmed: boolean
  overrideInstruction?: string
  clarificationReason?: 'missing_action' | 'missing_handle' | 'wrong_handle_count'
}

export interface EditReferenceChatCommandResult {
  handled: boolean
  ok: boolean
  intent?: EditReferenceChatCommandIntent
  assistantText?: string
  confirmationRequired: boolean
  mutated: boolean
  idempotentReplay: boolean
  application?: PreferenceApplicationRecord
  comparedReferences: ApprovedEditReferenceOption[]
  warnings: string[]
}

export function parseEditReferenceChatCommand(text: string): ParsedEditReferenceChatCommand {
  const handles = [...text.matchAll(/@([\p{L}\p{N}_-]+)/gu)].map((match) => `@${match[1]}`)
  const confirmed = /^confirm\b/i.test(text.trim())
  const remove = /\bremove\b[\s\S]*\b(?:edit\s+)?reference\b/i.test(text)
  const compare = /\bcompare\b/i.test(text)
  const replace = /\breplace\b/i.test(text)
  const apply = /\b(?:apply|use|choose|connect)\b/i.test(text)
  const override = /\b(?:override|adjust|update)\b/i.test(text)
    || (handles.length === 1 && /\bmake\b/i.test(text))

  if (remove) {
    return {
      handled: true,
      intent: 'remove',
      handles,
      confirmed,
      clarificationReason: handles.length > 0 ? 'wrong_handle_count' : undefined,
    }
  }
  if (compare) {
    return {
      handled: true,
      intent: 'compare',
      handles,
      confirmed,
      clarificationReason: handles.length === 2 ? undefined : 'wrong_handle_count',
    }
  }
  if (replace) {
    return {
      handled: true,
      intent: 'replace',
      handles,
      confirmed,
      overrideInstruction: extractOverrideInstruction(text, handles),
      clarificationReason: handles.length === 1 ? undefined : 'missing_handle',
    }
  }
  if (handles.length > 0) {
    return {
      handled: true,
      intent: override && !apply ? 'override' : 'apply',
      handles,
      confirmed,
      overrideInstruction: extractOverrideInstruction(text, handles),
      clarificationReason: handles.length === 1
        ? apply || override ? undefined : 'missing_action'
        : 'missing_handle',
    }
  }
  return { handled: false, handles: [], confirmed: false }
}

export async function executeEditReferenceChatCommand(input: {
  bundle: ProjectEditSessionBundleRecord
  editReferenceClient?: EditReferenceApiClient
  projectEditSessionClient: ProjectEditSessionApiClient
  text: string
  workspaceId?: string
}): Promise<EditReferenceChatCommandResult> {
  const parsed = parseEditReferenceChatCommand(input.text)
  if (!parsed.handled) return emptyResult()
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  const workspaceId = input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID
  const optionsResult = await loadApprovedEditReferenceOptions({ api, workspaceId })
  if (!optionsResult.ok) {
    return handledResult(parsed.intent, optionsResult.message ?? 'Approved Edit References could not be loaded.', {
      warnings: optionsResult.warnings,
    })
  }

  if (parsed.clarificationReason) {
    return handledResult(parsed.intent, clarificationForSyntax(parsed), { warnings: optionsResult.warnings })
  }
  const resolution = resolveHandles(parsed.handles, optionsResult.options)
  if (!resolution.ok) {
    return handledResult(parsed.intent, resolution.message, { warnings: optionsResult.warnings })
  }

  const integration = await loadProjectEditSessionEditReferenceIntegration({
    editReferenceClient: api,
    session: input.bundle.session,
    workspaceId,
  })
  const active = integration.activeApplication
  const selected = resolution.options[0]

  if (parsed.intent === 'compare') {
    const [left, right] = resolution.options
    return handledResult('compare', compareApprovedReferences(left, right), {
      comparedReferences: resolution.options,
      warnings: [...optionsResult.warnings, ...integration.warnings],
    })
  }

  if (parsed.intent === 'remove') {
    if (!active) {
      return handledResult('remove', 'There is no connected Edit Reference to remove from this edit.', {
        idempotentReplay: true,
        warnings: [...optionsResult.warnings, ...integration.warnings],
      })
    }
    if (!parsed.confirmed) {
      return handledResult('remove', `Removing ${active.editReferenceName} will clear its active guidance and invalidate dependent planning context while preserving immutable history. Reply “Confirm remove current edit reference” to continue.`, {
        confirmationRequired: true,
        application: active,
      })
    }
    const removed = await removePreferenceApplicationFromProjectEditSession({
      application: active,
      editReferenceClient: api,
      projectEditSessionClient: input.projectEditSessionClient,
      workspaceId,
    })
    return handledResult('remove', removed.message, {
      ok: removed.ok,
      mutated: removed.ok,
      application: removed.application,
      warnings: [...optionsResult.warnings, ...integration.warnings],
    })
  }

  if (!selected) {
    return handledResult(parsed.intent, 'Name one approved Edit Reference with @ReferenceName so I can continue.')
  }
  if (integration.stagedApplication) {
    return handledResult(parsed.intent, `${integration.stagedApplication.editReferenceName} is already prepared but not connected. Retry that connection before applying another reference.`)
  }

  const sameReference = active?.editReferenceId === selected.id
  const wantsReplacement = parsed.intent === 'replace' || parsed.intent === 'override' || Boolean(active && !sameReference)
  const hasOverride = Boolean(parsed.overrideInstruction)
  if (active && sameReference && !hasOverride && parsed.intent === 'apply') {
    return handledResult('apply', `${active.editReferenceName} is already the connected canonical Edit Reference for this edit. No duplicate application was created.`, {
      application: active,
      idempotentReplay: true,
      warnings: [...optionsResult.warnings, ...integration.warnings],
    })
  }
  if (active && wantsReplacement && !parsed.confirmed) {
    const action = sameReference ? 'update the target-specific override for' : `replace ${active.editReferenceName} with`
    return handledResult(parsed.intent, `This will ${action} ${selected.name}, invalidate the current downstream context, and preserve the earlier application in history. Reply “Confirm replace with ${selected.handle}${parsed.overrideInstruction ? ` but ${parsed.overrideInstruction}` : ''}” to continue.`, {
      application: active,
      confirmationRequired: true,
    })
  }

  const instruction = buildTargetInstruction(active, parsed.overrideInstruction)
  if (active) {
    const replaced = await replacePreferenceApplicationForProjectEditSession({
      applicationSource: 'chat_tag',
      bundle: input.bundle,
      currentApplication: active,
      currentUserInstruction: instruction,
      editReferenceClient: api,
      nextEditReferenceId: selected.id,
      outputFrameConfirmed: true,
      projectEditSessionClient: input.projectEditSessionClient,
      workspaceId,
    })
    return handledResult(parsed.intent, replaced.message, {
      ok: replaced.ok,
      mutated: replaced.ok,
      application: replaced.application,
      warnings: [...optionsResult.warnings, ...integration.warnings],
    })
  }

  const prepared = await preparePreferenceApplicationForProjectEditSession({
    applicationSource: 'chat_tag',
    bundle: input.bundle,
    currentUserInstruction: instruction,
    editReferenceId: selected.id,
    editReferenceClient: api,
    outputFrameConfirmed: true,
    workspaceId,
  })
  if (!prepared.ok) return handledResult(parsed.intent, prepared.message, { warnings: optionsResult.warnings })
  const connected = await connectPreferenceApplicationToProjectEditSession({
    application: prepared.application,
    editReferenceClient: api,
    outputFrameConfirmed: true,
    projectEditSessionClient: input.projectEditSessionClient,
    referenceRevision: prepared.detail.reference.revision,
    workspaceId,
  })
  return handledResult(parsed.intent, connected.message, {
    ok: connected.ok,
    mutated: connected.ok,
    application: connected.application,
    warnings: [...optionsResult.warnings, ...integration.warnings],
  })
}

function resolveHandles(
  handles: string[],
  options: ApprovedEditReferenceOption[],
): { ok: true; options: ApprovedEditReferenceOption[] } | { ok: false; message: string } {
  const resolved: ApprovedEditReferenceOption[] = []
  for (const handle of handles) {
    const matches = findApprovedReferenceMatches(options, handle)
    if (matches.length === 0) {
      return {
        ok: false,
        message: `I could not find an approved Edit Reference matching ${handle}. Try ${options.slice(0, 3).map((option) => option.handle).join(', ') || 'creating and approving a reference first'}.`,
      }
    }
    if (matches.length > 1) {
      return {
        ok: false,
        message: `${handle} matches more than one approved Edit Reference: ${matches.map((option) => option.handle).join(', ')}. Name the exact reference you want.`,
      }
    }
    resolved.push(matches[0])
  }
  if (new Set(resolved.map((option) => option.id)).size !== resolved.length) {
    return { ok: false, message: 'Choose two different approved Edit References to compare.' }
  }
  return { ok: true, options: resolved }
}

function compareApprovedReferences(left: ApprovedEditReferenceOption, right: ApprovedEditReferenceOption): string {
  const leftLayers = new Set(left.layerLabels)
  const shared = right.layerLabels.filter((layer) => leftLayers.has(layer))
  const leftOnly = left.layerLabels.filter((layer) => !right.layerLabels.includes(layer))
  const rightOnly = right.layerLabels.filter((layer) => !left.layerLabels.includes(layer))
  return `${left.name} uses approved DNA v${left.dnaVersionNumber} at ${Math.round(left.confidence * 100)}% confidence; ${right.name} uses approved DNA v${right.dnaVersionNumber} at ${Math.round(right.confidence * 100)}%. Shared guidance: ${shared.join(', ') || 'Safety only'}. ${leftOnly.length ? `${left.name} additionally covers ${leftOnly.join(', ')}. ` : ''}${rightOnly.length ? `${right.name} additionally covers ${rightOnly.join(', ')}. ` : ''}Both remain adapt-not-copy profiles. Comparing them did not change this edit.`
}

function clarificationForSyntax(parsed: ParsedEditReferenceChatCommand): string {
  if (parsed.intent === 'compare') return 'Compare exactly two approved Edit References, for example: “Compare @ProductCommercial and @MinimalCreator.”'
  if (parsed.intent === 'remove') return 'Remove does not need a reference handle. Say “Remove the current edit reference,” then confirm the destructive change.'
  if (parsed.clarificationReason === 'missing_action') return 'Tell me what to do with that reference: apply, compare, or replace it.'
  return 'Name exactly one approved Edit Reference, for example: “Use @TravelDocumentary for this edit.”'
}

function extractOverrideInstruction(text: string, handles: string[]): string | undefined {
  const butMatch = text.match(/\bbut\b([\s\S]+)$/i)?.[1]?.trim()
  if (butMatch) return cleanOverride(butMatch)
  if (!/\b(?:override|adjust|update|make)\b/i.test(text)) return undefined
  let remainder = text
  for (const handle of handles) remainder = remainder.replace(new RegExp(escapeRegExp(handle), 'ig'), ' ')
  remainder = remainder
    .replace(/^\s*confirm\s*/i, '')
    .replace(/\b(?:apply|use|choose|connect|replace|current|edit|reference|with|for|this|override|adjust|update)\b/ig, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleanOverride(remainder)
}

function cleanOverride(value: string): string | undefined {
  const cleaned = value.replace(/^[\s:,.-]+/, '').replace(/[\s.]+$/, '').trim()
  return cleaned ? cleaned.slice(0, 2_000) : undefined
}

function buildTargetInstruction(active: PreferenceApplicationRecord | undefined, overrideInstruction: string | undefined): string {
  if (!overrideInstruction) return active?.targetContext.currentUserInstruction ?? ''
  const prior = active?.targetContext.currentUserInstruction.trim()
  return prior
    ? `${prior} Target override from Edit Chat: ${overrideInstruction}`.slice(0, 4_000)
    : overrideInstruction
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function emptyResult(): EditReferenceChatCommandResult {
  return {
    handled: false,
    ok: true,
    confirmationRequired: false,
    mutated: false,
    idempotentReplay: false,
    comparedReferences: [],
    warnings: [],
  }
}

function handledResult(
  intent: EditReferenceChatCommandIntent | undefined,
  assistantText: string,
  options: Partial<Omit<EditReferenceChatCommandResult, 'handled' | 'intent' | 'assistantText'>> = {},
): EditReferenceChatCommandResult {
  return {
    handled: true,
    ok: options.ok ?? true,
    intent,
    assistantText,
    confirmationRequired: options.confirmationRequired ?? false,
    mutated: options.mutated ?? false,
    idempotentReplay: options.idempotentReplay ?? false,
    application: options.application,
    comparedReferences: options.comparedReferences ?? [],
    warnings: options.warnings ?? [],
  }
}
