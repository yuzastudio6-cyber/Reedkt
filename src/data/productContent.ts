import type { LucideIcon } from 'lucide-react'
import {
  AudioLines,
  Boxes,
  Captions,
  Clapperboard,
  CloudUpload,
  FolderKanban,
  Home,
  Layers3,
  MessageSquareText,
  Move3D,
  Palette,
  Settings,
} from 'lucide-react'

export type Accent = 'blue' | 'cyan' | 'violet' | 'purple' | 'success' | 'warning' | 'danger' | 'info'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  disabled?: boolean
}

export type TimelineSegment = {
  label: string
  start: string
  width: string
  state: Accent
}

export type TimelineTrack = {
  name: string
  detail: string
  segments: TimelineSegment[]
}

export type SignatureSystem = {
  title: string
  shortName: string
  subtitle: string
  description: string
  status: string
  metric: string
  items: string[]
  action: string
  accent: Accent
  icon: LucideIcon
}

export const appNav: NavItem[] = [
  { label: 'Home', to: '/dashboard', icon: Home },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Edit Videos', to: '/edit-videos', icon: Clapperboard },
  { label: 'Edit Preferences', to: '/preferences', icon: Settings },
]

export const marketingLinks = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Use cases', href: '#use-cases' },
  { label: 'Projects', href: '/projects' },
  { label: 'Security', href: '#security' },
]

export const timelineTracks: TimelineTrack[] = [
  {
    name: 'Video',
    detail: 'Source clips and scene order',
    segments: [
      { label: 'Clip 3 hook', start: '2%', width: '18%', state: 'blue' },
      { label: 'Walkthrough', start: '21%', width: '35%', state: 'blue' },
      { label: 'Exterior proof', start: '60%', width: '24%', state: 'blue' },
    ],
  },
  {
    name: 'Audio',
    detail: 'Voice cleanup and source',
    segments: [
      { label: 'Speaker A', start: '2%', width: '88%', state: 'info' },
    ],
  },
  {
    name: 'Captions',
    detail: 'Word-level transcript',
    segments: [
      { label: 'Hook captions', start: '3%', width: '20%', state: 'blue' },
      { label: 'Framework text', start: '31%', width: '24%', state: 'violet' },
      { label: 'CTA captions', start: '70%', width: '18%', state: 'blue' },
    ],
  },
  {
    name: 'Stroke Motion',
    detail: '2D transparent storytelling',
    segments: [
      { label: 'Blocked path', start: '18%', width: '18%', state: 'cyan' },
      { label: 'Forward motion', start: '48%', width: '20%', state: 'cyan' },
    ],
  },
  {
    name: 'Graphic Design / VisualExplain',
    detail: 'Graphic design overlays',
    segments: [
      { label: '3-step cards', start: '30%', width: '26%', state: 'violet' },
      { label: 'Result callout', start: '66%', width: '16%', state: 'purple' },
    ],
  },
  {
    name: 'Real Motion',
    detail: 'Realistic in-video overlays / credit-heavy',
    segments: [
      { label: 'Proof / credit-heavy', start: '42%', width: '16%', state: 'info' },
      { label: 'Symbol moment', start: '62%', width: '12%', state: 'blue' },
    ],
  },
  {
    name: 'SoundSync/SFX',
    detail: 'Audio and timing support',
    segments: [
      { label: 'Rise', start: '6%', width: '14%', state: 'warning' },
      { label: 'Clean bed', start: '22%', width: '50%', state: 'success' },
      { label: 'Resolve', start: '76%', width: '12%', state: 'warning' },
    ],
  },
  {
    name: 'AI Enhance',
    detail: 'Cleanup, stabilization, and polish',
    segments: [
      { label: 'Voice clean', start: '10%', width: '44%', state: 'success' },
      { label: 'Color polish', start: '56%', width: '22%', state: 'violet' },
    ],
  },
]

export const signatureSystems: SignatureSystem[] = [
  {
    title: 'Stroke Motion',
    shortName: 'Stroke',
    subtitle: '2D overlay motion storytelling',
    description: 'Adds transparent story motion for emotion, emphasis, movement, and transformation.',
    status: '2 moments detected',
    metric: 'Balanced intensity',
    items: ['00:12 blocked path starts on "stuck"', '00:31 walking line exits before new sentence', 'Transparent layer, not a cutaway'],
    action: 'Preview Stroke Motion',
    accent: 'cyan',
    icon: Move3D,
  },
  {
    title: 'Graphic Design / VisualExplain',
    shortName: 'VisualExplain',
    subtitle: 'Clean overlay graphics',
    description: 'Builds diagrams, frameworks, lists, concepts, and educational overlays.',
    status: '3-card framework ready',
    metric: 'High confidence',
    items: ['Cards: Plan, Create, Publish', 'Reveal each card as spoken', 'High contrast, aligned, and readable'],
    action: 'Apply graphic',
    accent: 'violet',
    icon: Layers3,
  },
  {
    title: 'Real Motion',
    shortName: 'Real',
    subtitle: 'Realistic in-video overlay motion',
    description: 'Adds real objects, products, places, proof, demos, and symbolic visuals inside the user video.',
    status: '1 proof moment found',
    metric: 'Credit-heavy / optional',
    items: ['Overlay-first: speaker footage stays the base layer', 'Face-safe placement before generation', 'Object scale changes based on meaning', 'Example: subtle miniature house proof moment'],
    action: 'Preview Real Motion',
    accent: 'blue',
    icon: Boxes,
  },
]

export const featureCards = [
  { title: 'AI Chat Editing', text: 'Ask for cuts, captions, overlays, cleanup, and exports in plain language.', icon: MessageSquareText, accent: 'blue' as Accent },
  { title: 'Stroke Motion', text: '2D transparent motion that follows the speaker story and emotional beats.', icon: Move3D, accent: 'cyan' as Accent },
  { title: 'VisualExplain', text: 'Clean graphic overlays for frameworks, lists, diagrams, and lessons.', icon: Palette, accent: 'violet' as Accent },
  { title: 'Real Motion', text: 'Realistic overlay motion for products, places, proof, demos, and symbolic moments.', icon: Boxes, accent: 'blue' as Accent },
  { title: 'Smart Auto Cut', text: 'Remove dead space, tighten pacing, and keep the speaker flow natural.', icon: Clapperboard, accent: 'success' as Accent },
  { title: 'Voice Cleanup', text: 'Improve speech clarity while keeping audio changes reversible.', icon: AudioLines, accent: 'info' as Accent },
  { title: 'Auto Captions', text: 'Editable captions timed to words, story beats, and platform formats.', icon: Captions, accent: 'violet' as Accent },
  { title: 'Export Anywhere', text: 'Prepare platform-ready outputs for YouTube, Shorts, Reels, teams, and clients.', icon: CloudUpload, accent: 'blue' as Accent },
]
