import { Video, X } from 'lucide-react'
import { Button, IconButton } from '../../Button'
import type { ProjectSourceVideoLocalPreview } from '../../../types/project-source-video'

type ProjectEditBriefSourceVideoPickerProps = {
  error?: string
  localPreview?: ProjectSourceVideoLocalPreview
  onClear: () => void
  onSelectFile: (file: File) => void
}

export function ProjectEditBriefSourceVideoPicker({
  error,
  localPreview,
  onClear,
  onSelectFile,
}: ProjectEditBriefSourceVideoPickerProps) {
  return (
    <section className="project-edit-brief-source-video-picker" data-testid="project-source-video-picker">
      <div>
        <span className="section-eyebrow">Primary source video</span>
        <h3>Local browser preview</h3>
        <p>Local browser preview only. This file has not been uploaded or processed.</p>
      </div>
      <div className="project-edit-brief-source-video-picker__actions">
        <label className="project-edit-brief-source-video-picker__input">
          <Video aria-hidden="true" size={18} />
          <span>{localPreview ? 'Replace source video' : 'Select source video'}</span>
          <input
            accept="video/*"
            aria-label="Select local primary source video"
            data-testid="project-source-video-file-input"
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (file) onSelectFile(file)
            }}
          />
        </label>
        {localPreview ? (
          <IconButton icon={X} label="Clear local source video" onClick={onClear} />
        ) : (
          <Button disabled icon={Video} size="sm" variant="ghost">No source selected</Button>
        )}
      </div>
      <p className="project-edit-brief-muted" data-testid="project-source-video-picker-boundary">
        Timeline markers use browser playback time. Durable uploads and media workers arrive after storage/runtime gates.
      </p>
      {error ? (
        <p className="project-edit-brief-source-video-picker__error" data-testid="project-source-video-picker-error">
          {error}
        </p>
      ) : null}
    </section>
  )
}
