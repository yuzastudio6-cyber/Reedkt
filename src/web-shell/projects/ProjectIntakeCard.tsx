import { UploadCloud } from 'lucide-react'
import { getDisabledExecutionControl } from '../web-shell-policy'
import { StatusBadge } from '../components/StatusBadge'

const uploadControl = getDisabledExecutionControl('upload_intake')

export function ProjectIntakeCard() {
  return (
    <article className="web-shell-panel web-shell-intake-card">
      <div className="web-shell-panel-heading">
        <div>
          <p className="web-shell-eyebrow">Project intake</p>
          <h2>Upload flow placeholder</h2>
        </div>
        <StatusBadge tone="warning">Mock-safe</StatusBadge>
      </div>
      <div className="web-shell-dropzone" aria-disabled="true">
        <UploadCloud aria-hidden="true" size={32} />
        <strong>Upload disabled in Phase 44C</strong>
        <span>{uploadControl?.reason}</span>
      </div>
      <fieldset className="web-shell-form-grid" disabled>
        <label>
          Project name
          <input placeholder="Controlled private project" />
        </label>
        <label>
          Intended workflow
          <select defaultValue="private-review">
            <option value="private-review">Private review only</option>
          </select>
        </label>
        <label>
          Notes
          <textarea placeholder="Backend storage and auth arrive in a later phase." />
        </label>
      </fieldset>
      <div className="web-shell-actions">
        <button className="web-shell-button primary" type="button" disabled>
          Create project disabled
        </button>
        <button className="web-shell-button" type="button" disabled>
          Choose media disabled
        </button>
      </div>
    </article>
  )
}
