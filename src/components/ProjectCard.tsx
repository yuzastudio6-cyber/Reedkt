import { Clock, Film, MoreHorizontal, UserRound } from 'lucide-react'
import type { MediaAsset, Project } from '../data/mockData'
import { Badge } from './Badge'
import { Button, IconButton } from './Button'
import { Card } from './Card'

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className={`project-card project-${project.accent}`}>
      <div className="project-thumb" aria-hidden="true">
        <div className="thumb-playhead" />
        <Film size={28} />
      </div>
      <div className="project-body">
        <div className="project-title-row">
          <div>
            <h3>{project.title}</h3>
            <p>{project.format}</p>
          </div>
          <IconButton icon={MoreHorizontal} label={`More actions for ${project.title}`} />
        </div>
        <p>{project.summary}</p>
        <div className="tag-row">
          {project.tags.map((tag) => (
            <Badge accent={project.accent} key={tag}>
              {tag}
            </Badge>
          ))}
        </div>
        <div className="project-status-row">
          <Badge accent="warning">{project.status}</Badge>
          <span>Estimate or spent credits shown in production</span>
        </div>
        <div className="progress-wrap" aria-label={`${project.progress}% complete`}>
          <span style={{ width: `${project.progress}%` }} />
        </div>
        <div className="project-meta">
          <span>
            <Clock size={14} /> {project.updated}
          </span>
          <span>
            <UserRound size={14} /> {project.owner}
          </span>
        </div>
        <Button size="sm" to="/editor" variant="secondary">
          Open in editor
        </Button>
      </div>
    </Card>
  )
}

type MediaCardProps = {
  asset: MediaAsset
}

export function MediaCard({ asset }: MediaCardProps) {
  return (
    <Card className="media-card">
      <div className="media-icon" aria-hidden="true">
        <Film size={24} />
      </div>
      <div>
        <h3>{asset.name}</h3>
        <p>
          {asset.type} / {asset.duration} / {asset.resolution} / {asset.size}
        </p>
      </div>
      <div className="tag-row">
        {asset.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      <Badge accent="cyan">{asset.status}</Badge>
    </Card>
  )
}
