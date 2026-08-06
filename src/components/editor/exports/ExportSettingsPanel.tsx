import { Badge } from '../../Badge'
import type {
  CaptionExportMode,
  ExportAspectRatio,
  ExportFileFormat,
  ExportQualityLevel,
  ExportResolution,
  ExportSettings,
  ExportTarget,
} from '../../../types'
import { ExportTargetPicker } from './ExportTargetPicker'

type ExportSettingsPanelProps = {
  settings: ExportSettings
  onUpdateTarget?: (targetId: string, patch: Partial<ExportTarget>) => void
  onToggleTarget?: (targetId: string, enabled: boolean) => void
}

const aspectRatios: ExportAspectRatio[] = ['9:16', '16:9', '1:1', '4:5', 'original', 'custom']
const resolutions: ExportResolution[] = ['720p', '1080p', '1440p', '4k', 'source', 'custom']
const formats: ExportFileFormat[] = ['mp4', 'mov', 'webm']
const qualities: ExportQualityLevel[] = ['draft', 'standard', 'high', 'maximum']
const captionModes: CaptionExportMode[] = ['burn_in', 'sidecar', 'none']

function label(value: string) {
  return value.replace(/_/g, ' ')
}

export function ExportSettingsPanel({ onToggleTarget, onUpdateTarget, settings }: ExportSettingsPanelProps) {
  return (
    <section className="inline-chat-card export-settings-panel">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Export settings</span>
          <h3>Platform versions and output settings</h3>
        </div>
        <Badge accent="info">{settings.targets.filter((target) => target.enabled).length} enabled</Badge>
      </div>
      <ExportTargetPicker onToggleTarget={onToggleTarget} targets={settings.targets} />
      <div className="export-target-settings-list">
        {settings.targets.map((target) => (
          <article className={`export-target-settings ${target.enabled ? 'export-target-settings--enabled' : ''}`} key={target.id}>
            <div className="export-target-settings-header">
              <strong>{target.label}</strong>
              <label>
                <input
                  checked={target.enabled}
                  onChange={(event) => onToggleTarget?.(target.id, event.target.checked)}
                  type="checkbox"
                />
                <span>Enabled</span>
              </label>
            </div>
            <div className="export-settings-grid">
              <label>
                <span>Aspect</span>
                <select
                  disabled={!target.enabled}
                  onChange={(event) => onUpdateTarget?.(target.id, { aspectRatio: event.target.value as ExportAspectRatio })}
                  value={target.aspectRatio}
                >
                  {aspectRatios.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>Resolution</span>
                <select
                  disabled={!target.enabled}
                  onChange={(event) => onUpdateTarget?.(target.id, { resolution: event.target.value as ExportResolution })}
                  value={target.resolution}
                >
                  {resolutions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>Format</span>
                <select
                  disabled={!target.enabled}
                  onChange={(event) => onUpdateTarget?.(target.id, { fileFormat: event.target.value as ExportFileFormat })}
                  value={target.fileFormat}
                >
                  {formats.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>Quality</span>
                <select
                  disabled={!target.enabled}
                  onChange={(event) => onUpdateTarget?.(target.id, { quality: event.target.value as ExportQualityLevel })}
                  value={target.quality}
                >
                  {qualities.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </select>
              </label>
              <label>
                <span>Captions</span>
                <select
                  disabled={!target.enabled}
                  onChange={(event) => onUpdateTarget?.(target.id, { captionMode: event.target.value as CaptionExportMode })}
                  value={target.captionMode}
                >
                  {captionModes.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </select>
              </label>
            </div>
            <div className="export-settings-toggles">
              <label>
                <input
                  checked={target.enforceSafeZones}
                  disabled={!target.enabled}
                  onChange={(event) => onUpdateTarget?.(target.id, { enforceSafeZones: event.target.checked })}
                  type="checkbox"
                />
                <span>Enforce safe zones</span>
              </label>
              <label>
                <input
                  checked={target.includeWatermarkPlaceholder}
                  disabled={!target.enabled}
                  onChange={(event) => onUpdateTarget?.(target.id, { includeWatermarkPlaceholder: event.target.checked })}
                  type="checkbox"
                />
                <span>Watermark marker</span>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
