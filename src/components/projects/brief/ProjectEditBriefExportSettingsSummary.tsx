import { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { Card } from '../../Card'
import type { ProjectEditBriefExportSettingsUIModel } from '../../../lib/project-edit-brief-ui-adapter'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import {
  applyProjectEditBriefExportPresetToForm,
  createProjectEditBriefExportSettingsFormState,
  saveProjectEditBriefExportSettingsFormViaApi,
  validateProjectEditBriefExportSettingsForm,
  PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BOUNDARY,
} from '../../../lib/project-edit-brief-export-settings-ui-adapter'
import {
  PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS,
  recommendProjectEditBriefExportSettings,
} from '../../../lib/project-edit-brief-export-settings-rules'
import type {
  ProjectEditBriefExportSettingsFormState,
  ProjectEditBriefExportSettingsRecommendationInput,
  ProjectEditBriefExportSettingsPresetId,
} from '../../../types/project-edit-brief-export-settings'
import type { ProjectSourceVideoMetadataSummary } from '../../../types/project-source-video'

type ProjectEditBriefExportSettingsSummaryProps = {
  client?: ProjectEditBriefApiClient
  exportSettings?: ProjectEditBriefExportSettingsUIModel
  onSaved?: (message: string) => void
  sourceVideoRecommendationInput?: ProjectEditBriefExportSettingsRecommendationInput
  sourceVideoSummary?: ProjectSourceVideoMetadataSummary
}

function numberField(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function ProjectEditBriefExportSettingsSummary({
  client,
  exportSettings,
  onSaved,
  sourceVideoRecommendationInput,
  sourceVideoSummary,
}: ProjectEditBriefExportSettingsSummaryProps) {
  const initialForm = useMemo(() => (
    exportSettings ? createProjectEditBriefExportSettingsFormState(exportSettings.record) : undefined
  ), [exportSettings])
  const [form, setForm] = useState<ProjectEditBriefExportSettingsFormState | undefined>(initialForm)
  const [statusMessage, setStatusMessage] = useState('Recommended mock settings loaded. No render/export started.')
  const [isSaving, setIsSaving] = useState(false)

  const validation = form ? validateProjectEditBriefExportSettingsForm(form) : undefined

  function updateForm(patch: Partial<ProjectEditBriefExportSettingsFormState>) {
    setForm((current) => current ? { ...current, ...patch } : current)
  }

  function applyPreset(presetId: ProjectEditBriefExportSettingsPresetId) {
    setForm((current) => current ? applyProjectEditBriefExportPresetToForm(current, presetId) : current)
    setStatusMessage('Preset applied as mock metadata. Save to keep it for this browser session.')
  }

  function applySourceVideoRecommendation() {
    if (!sourceVideoRecommendationInput) return
    const recommendation = recommendProjectEditBriefExportSettings(sourceVideoRecommendationInput)
    setForm(createProjectEditBriefExportSettingsFormState(recommendation.exportSettings))
    setStatusMessage('Source video dimensions applied as mock/local export metadata. Frame rate defaults to 30 fps; no render/export started.')
  }

  async function saveSettings() {
    if (!form || !validation?.ok) return
    setIsSaving(true)
    try {
      const result = await saveProjectEditBriefExportSettingsFormViaApi(form, client)
      setStatusMessage(result.summary)
      onSaved?.(result.summary)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="project-edit-brief-export-summary" data-testid="project-edit-brief-export-settings">
      <span className="section-eyebrow">Export settings</span>
      <div className="project-edit-brief-export-summary__header">
        <div>
          <h3>Session output settings</h3>
          <p>ProjectEditSession-owned metadata, editable from Brief.</p>
        </div>
        <Badge accent="cyan">Mock/local</Badge>
      </div>
      {exportSettings && form ? (
        <>
          <div className="project-edit-brief-export-summary__grid">
            <span><strong>Platform</strong>{exportSettings.platformLabel}</span>
            <span><strong>Aspect</strong>{form.aspectRatio}</span>
            <span><strong>Resolution</strong>{form.resolutionWidth}x{form.resolutionHeight}</span>
            <span><strong>Frame rate</strong>{form.frameRate} fps</span>
            <span><strong>Format</strong>{form.format.toUpperCase()}</span>
            <span><strong>Codec</strong>{exportSettings.codecLabel}</span>
            <span><strong>Audio</strong>{exportSettings.audioCodecLabel}</span>
            <span><strong>Captions</strong>{form.captionSafeArea ? 'Caption safe area on' : 'Caption safe area off'}</span>
            <span><strong>Safe zone</strong>{form.safeZonePreset}</span>
            <span><strong>Source</strong>{exportSettings.sourceLabel}</span>
          </div>
          {sourceVideoSummary && sourceVideoRecommendationInput ? (
            <div className="project-edit-brief-export-summary__source-video" data-testid="project-source-video-export-recommendation">
              <div>
                <strong>Source video recommendation</strong>
                <span>{sourceVideoSummary.dimensionLabel} · {sourceVideoSummary.aspectRatioLabel} · 30 fps default</span>
              </div>
              <Button
                data-testid="project-source-video-export-recommendation-button"
                onClick={applySourceVideoRecommendation}
                size="sm"
                variant="secondary"
              >
                Use source dimensions
              </Button>
            </div>
          ) : null}
          <form className="project-edit-brief-export-form" onSubmit={(event) => {
            event.preventDefault()
            void saveSettings()
          }}>
            <label>
              <span>Preset</span>
              <select
                data-testid="project-edit-brief-export-preset-select"
                value={form.presetId}
                onChange={(event) => applyPreset(event.target.value as ProjectEditBriefExportSettingsPresetId)}
              >
                {PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS.map((preset) => (
                  <option key={preset.presetId} value={preset.presetId}>{preset.displayName}</option>
                ))}
              </select>
            </label>
            <div className="project-edit-brief-export-form__row">
              <label>
                <span>Width</span>
                <input
                  data-testid="project-edit-brief-export-width-input"
                  min={1}
                  type="number"
                  value={form.resolutionWidth}
                  onChange={(event) => updateForm({ resolutionWidth: numberField(event.target.value, form.resolutionWidth) })}
                />
              </label>
              <label>
                <span>Height</span>
                <input
                  data-testid="project-edit-brief-export-height-input"
                  min={1}
                  type="number"
                  value={form.resolutionHeight}
                  onChange={(event) => updateForm({ resolutionHeight: numberField(event.target.value, form.resolutionHeight) })}
                />
              </label>
            </div>
            <label>
              <span>Frame rate</span>
              <select
                data-testid="project-edit-brief-export-frame-rate-select"
                value={form.frameRate}
                onChange={(event) => updateForm({ frameRate: numberField(event.target.value, form.frameRate) as ProjectEditBriefExportSettingsFormState['frameRate'] })}
              >
                {[24, 25, 30, 50, 60].map((frameRate) => (
                  <option key={frameRate} value={frameRate}>{frameRate} fps</option>
                ))}
              </select>
            </label>
            <label className="project-edit-brief-export-form__check">
              <input
                checked={form.captionSafeArea}
                data-testid="project-edit-brief-export-caption-safe-area-checkbox"
                type="checkbox"
                onChange={(event) => updateForm({ captionSafeArea: event.target.checked })}
              />
              <span>Caption safe area</span>
            </label>
            {validation && !validation.ok ? (
              <p className="project-edit-brief-export-form__error" data-testid="project-edit-brief-export-settings-validation">
                {validation.blockedReasons.join(' ')}
              </p>
            ) : null}
            <Button
              disabled={isSaving || !validation?.ok}
              icon={Save}
              size="sm"
              type="submit"
              variant="primary"
              data-testid="project-edit-brief-export-settings-save-button"
            >
              Save settings
            </Button>
          </form>
          <p data-testid="project-edit-brief-export-settings-status">{statusMessage}</p>
          <p className="project-edit-brief-muted" data-testid="project-edit-brief-export-settings-boundary">
            {PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BOUNDARY}
          </p>
        </>
      ) : (
        <p>No export settings fixture exists for this Edit Chat.</p>
      )}
    </Card>
  )
}
