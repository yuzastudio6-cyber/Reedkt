import { CloudUpload, LoaderCircle, Video, X } from 'lucide-react'
import { Button, IconButton } from '../../Button'
import type {
  ProjectSourceVideoBackendUploadConfig,
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoBackendUploadStatus,
  ProjectSourceVideoLocalPreview,
} from '../../../types/project-source-video'

type ProjectEditBriefSourceVideoPickerProps = {
  backendUploadConfig: ProjectSourceVideoBackendUploadConfig
  backendUploadError?: string
  backendUploadResult?: ProjectSourceVideoBackendUploadResult
  backendUploadStatus: ProjectSourceVideoBackendUploadStatus
  error?: string
  localPreview?: ProjectSourceVideoLocalPreview
  onClear: () => void
  onSelectFile: (file: File) => void
  onUploadToBackend: () => void
}

export function ProjectEditBriefSourceVideoPicker({
  backendUploadConfig,
  backendUploadError,
  backendUploadResult,
  backendUploadStatus,
  error,
  localPreview,
  onClear,
  onSelectFile,
  onUploadToBackend,
}: ProjectEditBriefSourceVideoPickerProps) {
  const uploadDisabled = !localPreview || !backendUploadConfig.available || backendUploadStatus === 'uploading'

  return (
    <section className="project-edit-brief-source-video-picker" data-testid="project-source-video-picker">
      <div>
        <span className="section-eyebrow">Primary source video</span>
        <h3>Local preview and internal upload</h3>
        <p>
          Select a browser-local preview first. Internal upload is a separate backend-local action and never starts media processing.
        </p>
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
        <Button
          disabled={uploadDisabled}
          icon={backendUploadStatus === 'uploading' ? LoaderCircle : CloudUpload}
          onClick={onUploadToBackend}
          size="sm"
          variant={backendUploadConfig.available ? 'secondary' : 'ghost'}
        >
          {backendUploadStatus === 'uploading'
            ? 'Uploading'
            : backendUploadResult
              ? 'Uploaded'
              : 'Upload for testing'}
        </Button>
      </div>
      <p className="project-edit-brief-muted" data-testid="project-source-video-picker-boundary">
        Timeline markers use browser playback time. Backend-local upload records canonical bucket/object metadata only; media workers remain blocked.
      </p>
      <div className="project-edit-brief-source-video-picker__backend" data-testid="project-source-video-backend-upload-status">
        <strong>{backendUploadStatus.replace(/_/g, ' ')}</strong>
        <span>{backendUploadResult ? `${backendUploadResult.bucketName}/${backendUploadResult.objectPath}` : backendUploadConfig.message}</span>
      </div>
      {backendUploadError ? (
        <p className="project-edit-brief-source-video-picker__error" data-testid="project-source-video-backend-upload-error">
          {backendUploadError}
        </p>
      ) : null}
      {error ? (
        <p className="project-edit-brief-source-video-picker__error" data-testid="project-source-video-picker-error">
          {error}
        </p>
      ) : null}
    </section>
  )
}
