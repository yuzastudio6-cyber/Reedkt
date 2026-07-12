import { BookOpen, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loadApprovedEditReferenceOptions,
  type ApprovedEditReferenceOption,
} from '../../lib/edit-reference-approved-options'
import { createEditReferenceApiClient, type EditReferenceApiClient } from '../../lib/edit-reference-api-client'
import { EDIT_REFERENCE_WORKSPACE_ID } from '../../lib/project-edit-session-edit-reference-integration'
import { Badge } from '../Badge'
import { Button } from '../Button'

type NewEditSessionEditReferenceSelectorProps = {
  api?: EditReferenceApiClient
  disabled?: boolean
  instruction: string
  onChange: (referenceId: string | undefined) => void
  onInstructionChange: (value: string) => void
  value?: string
}

const defaultEditReferenceApi = createEditReferenceApiClient()

export function NewEditSessionEditReferenceSelector({
  api = defaultEditReferenceApi,
  disabled = false,
  instruction,
  onChange,
  onInstructionChange,
  value,
}: NewEditSessionEditReferenceSelectorProps) {
  const [options, setOptions] = useState<ApprovedEditReferenceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [warnings, setWarnings] = useState<string[]>([])
  const [inspectedId, setInspectedId] = useState<string | undefined>(value)
  const requestEpoch = useRef(0)

  const load = useCallback(async () => {
    const epoch = ++requestEpoch.current
    setLoading(true)
    setError(undefined)
    const result = await loadApprovedEditReferenceOptions({ api, workspaceId: EDIT_REFERENCE_WORKSPACE_ID })
    if (epoch !== requestEpoch.current) return
    setLoading(false)
    setWarnings(result.warnings)
    if (!result.ok) {
      setOptions([])
      setError(result.message ?? 'Approved Edit References could not be loaded.')
      return
    }
    setOptions(result.options)
    setInspectedId((current) => (
      result.options.some((option) => option.id === current)
        ? current
        : result.options[0]?.id
    ))
  }, [api])

  useEffect(() => {
    const epoch = ++requestEpoch.current
    void loadApprovedEditReferenceOptions({ api, workspaceId: EDIT_REFERENCE_WORKSPACE_ID }).then((result) => {
      if (epoch !== requestEpoch.current) return
      setLoading(false)
      setWarnings(result.warnings)
      if (!result.ok) {
        setOptions([])
        setError(result.message ?? 'Approved Edit References could not be loaded.')
        return
      }
      setOptions(result.options)
      setInspectedId((current) => (
        result.options.some((option) => option.id === current)
          ? current
          : result.options[0]?.id
      ))
    })
    return () => {
      requestEpoch.current += 1
    }
  }, [api])

  const inspected = options.find((option) => option.id === value)
    ?? options.find((option) => option.id === inspectedId)
    ?? options[0]
  const selected = options.find((option) => option.id === value)

  return (
    <fieldset className="new-edit-reference-selector" data-testid="new-edit-reference-selector" disabled={disabled}>
      <legend>Edit Reference</legend>
      <div className="new-edit-reference-selector__intro">
        <div>
          <strong>Start with approved creative intelligence</strong>
          <p>ReEditPro adapts approved Preference DNA to this edit. It never copies reference footage, exact shots, layouts, timing, music, or identity.</p>
        </div>
        <Badge accent="cyan">Adapt, never copy</Badge>
      </div>

      {loading ? <p className="new-edit-reference-selector__state" role="status">Loading approved Edit References…</p> : null}
      {error ? (
        <div className="new-edit-reference-selector__state is-error" role="alert">
          <span>{error}</span>
          <Button icon={RefreshCw} onClick={() => void load()} size="sm" type="button" variant="ghost">Retry</Button>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="new-edit-reference-selector__layout">
          <div aria-label="Approved Edit References" className="new-edit-reference-selector__choices" role="radiogroup">
            <label className={`new-edit-reference-choice ${value === undefined ? 'is-selected' : ''}`.trim()}>
              <input
                checked={value === undefined}
                data-testid="new-edit-reference-none"
                name="new-edit-reference"
                onChange={() => onChange(undefined)}
                type="radio"
              />
              <span><strong>No Edit Reference</strong><small>Build this edit from its own source and instructions.</small></span>
            </label>
            {options.map((option) => (
              <div className={`new-edit-reference-choice-wrap ${value === option.id ? 'is-selected' : ''}`.trim()} key={option.id}>
                <label className="new-edit-reference-choice">
                  <input
                    checked={value === option.id}
                    data-testid={`new-edit-reference-${option.id}`}
                    name="new-edit-reference"
                    onChange={() => {
                      onChange(option.id)
                      setInspectedId(option.id)
                    }}
                    type="radio"
                  />
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.handle} · DNA v{option.dnaVersionNumber} · {Math.round(option.confidence * 100)}% confidence</small>
                  </span>
                </label>
                <button
                  aria-label={`Inspect ${option.name}`}
                  aria-pressed={inspected?.id === option.id}
                  className="new-edit-reference-inspect"
                  data-testid={`inspect-new-edit-reference-${option.id}`}
                  onClick={() => setInspectedId(option.id)}
                  type="button"
                >
                  <BookOpen aria-hidden="true" size={16} />
                  <span>Inspect</span>
                </button>
              </div>
            ))}
          </div>

          <aside aria-live="polite" className="new-edit-reference-selector__inspection" data-testid="new-edit-reference-inspection">
            {inspected ? (
              <>
                <div className="new-edit-reference-selector__inspection-heading">
                  <div><span>Approved Preference DNA</span><strong>{inspected.name}</strong></div>
                  <Badge accent={inspected.qaStatus === 'passed' ? 'success' : 'warning'}>{inspected.qaStatus.replaceAll('_', ' ')}</Badge>
                </div>
                <p>{inspected.description ?? inspected.summary}</p>
                <div className="new-edit-reference-selector__metrics">
                  <span><CheckCircle2 aria-hidden="true" size={15} /> DNA version {inspected.dnaVersionNumber}</span>
                  <span><ShieldCheck aria-hidden="true" size={15} /> {inspected.doNotCopyRuleCount} copy-safety boundar{inspected.doNotCopyRuleCount === 1 ? 'y' : 'ies'}</span>
                </div>
                <div aria-label="Applicable guidance" className="new-edit-reference-selector__layers">
                  {inspected.layerLabels.map((label) => <small key={label}>{label}</small>)}
                </div>
                <p className="new-edit-reference-selector__summary">{inspected.summary}</p>
              </>
            ) : (
              <div className="new-edit-reference-selector__empty">
                <ShieldCheck aria-hidden="true" size={20} />
                <p>{options.length ? 'Inspect an approved reference before choosing it.' : 'No approved Edit References are available yet. You can continue without one.'}</p>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      <div className="new-edit-reference-selector__selected" data-testid="new-edit-reference-selected-summary">
        <strong>Setup summary</strong>
        <span>{selected ? `${selected.name} · approved DNA v${selected.dnaVersionNumber} · ${selected.qaStatus.replaceAll('_', ' ')}` : 'No Edit Reference selected'}</span>
      </div>
      <label className="new-edit-session-field new-edit-reference-selector__instruction">
        <span>Target direction (optional)</span>
        <textarea
          data-testid="new-edit-reference-instruction"
          maxLength={4_000}
          onChange={(event) => onInstructionChange(event.target.value)}
          placeholder="Example: Keep captions stronger while preserving calm, evidence-led pacing."
          rows={3}
          value={instruction}
        />
        <small>Current instructions and confirmed Edit Brief markers outrank reusable DNA.</small>
      </label>
      {warnings.length ? <p className="new-edit-reference-selector__warning">{warnings[0]}</p> : null}
    </fieldset>
  )
}
