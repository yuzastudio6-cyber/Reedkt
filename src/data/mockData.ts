import type { LucideIcon } from 'lucide-react'
import {
  AudioLines,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Captions,
  CheckCircle2,
  Clapperboard,
  CloudUpload,
  FolderKanban,
  Gauge,
  Home,
  Image,
  Library,
  Layers3,
  LayoutTemplate,
  ListChecks,
  MessageSquareText,
  Move3D,
  Palette,
  PlaySquare,
  Settings,
  Sparkles,
  UploadCloud,
  UsersRound,
  WandSparkles,
} from 'lucide-react'

export type Accent = 'blue' | 'cyan' | 'violet' | 'purple' | 'success' | 'warning' | 'danger' | 'info'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  disabled?: boolean
}

export type Project = {
  title: string
  format: string
  status: string
  progress: number
  updated: string
  owner: string
  summary: string
  tags: string[]
  accent: Accent
  editorTo?: string
}

export type MediaAsset = {
  name: string
  type: string
  duration: string
  resolution: string
  size: string
  tags: string[]
  status: string
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

export type PricingPlan = {
  name: string
  price: string
  description: string
  credits: string
  features: string[]
  featured?: boolean
}

export type ExportItem = {
  title: string
  destination: string
  status: string
  progress: number
  detail: string
  accent: Accent
}

export const appNav: NavItem[] = [
  { label: 'Home', to: '/dashboard', icon: Home },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'AI Editor', to: '/editor', icon: WandSparkles },
  { label: 'Media Library', to: '/projects#media-library', icon: Library },
  { label: 'Templates', to: '/dashboard', icon: LayoutTemplate, disabled: true },
  { label: 'Team', to: '/dashboard', icon: UsersRound, disabled: true },
  { label: 'Analytics', to: '/dashboard', icon: BarChart3, disabled: true },
  { label: 'Exports', to: '/exports', icon: CloudUpload },
  { label: 'Brand Kit', to: '/brand-kit', icon: BriefcaseBusiness },
  { label: 'Settings', to: '/dashboard', icon: Settings, disabled: true },
]

export const marketingLinks = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Use cases', href: '#use-cases' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '#security' },
]

export const metrics = [
  { label: 'Active projects', value: '12', detail: '4 waiting on approval', accent: 'cyan' as Accent },
  { label: 'Weekly credits', value: '100', detail: 'Personal bonus credits', accent: 'violet' as Accent },
  { label: 'Edits in progress', value: '6', detail: 'Planning, review, export', accent: 'blue' as Accent },
  { label: 'Exports completed', value: '28', detail: 'This workspace demo', accent: 'success' as Accent },
]

export const projects: Project[] = [
  {
    title: 'Founder story launch cut',
    format: '16:9 master + Shorts',
    status: 'Generating Stroke Motion',
    progress: 72,
    updated: 'Updated 12 min ago',
    owner: 'Ari',
    summary: 'Hook tightened, captions applied, and Real Motion proof overlays queued for preview.',
    tags: ['Stroke Motion', 'Real Motion', 'Review'],
    accent: 'cyan',
  },
  {
    title: 'Course module: pricing psychology',
    format: '9:16 social lesson',
    status: 'VisualExplain ready',
    progress: 88,
    updated: 'Updated 38 min ago',
    owner: 'Mika',
    summary: 'Three-card framework synced to transcript phrases with clean educational overlays.',
    tags: ['VisualExplain', 'Captions', 'Education'],
    accent: 'violet',
  },
  {
    title: 'Product demo proof reel',
    format: '1:1 product cut',
    status: 'SoundSync timing review',
    progress: 64,
    updated: 'Updated 1 hr ago',
    owner: 'Theo',
    summary: 'Real object overlays stay inside the speaker video while beat markers guide transitions.',
    tags: ['Real Motion', 'SoundSync', 'Demo'],
    accent: 'blue',
  },
]

export const mediaAssets: MediaAsset[] = [
  {
    name: 'launch-interview-master.mov',
    type: 'Video',
    duration: '18:42',
    resolution: '4K',
    size: '2.4 GB',
    tags: ['talking-head', 'founder'],
    status: 'Transcript complete',
  },
  {
    name: 'product-demo-b-roll.mp4',
    type: 'Video',
    duration: '04:18',
    resolution: '1080p',
    size: '640 MB',
    tags: ['real-motion', 'proof'],
    status: 'Scene detection ready',
  },
  {
    name: 'clean-inspire-bed.wav',
    type: 'Audio',
    duration: '02:10',
    resolution: '48 kHz',
    size: '82 MB',
    tags: ['music', 'licensed'],
    status: 'Matched by SoundSync',
  },
  {
    name: 'product-ui-flow.png',
    type: 'Image',
    duration: '-',
    resolution: '2400px',
    size: '3.8 MB',
    tags: ['overlay', 'demo'],
    status: 'Used in VisualExplain',
  },
]

export const aiSuggestions = [
  'Create a social cut from your latest upload',
  'Add captions to your draft',
  'Generate a clean VisualExplain card',
  'Review the credit estimate before editing',
]

export const activeEdits = [
  { label: 'Intro shortened', status: 'Applied', time: '00:00-00:08' },
  { label: 'Filler words removed', status: 'Preview', time: '00:11-00:44' },
  { label: 'Real Motion proof overlay', status: 'Needs review', time: '00:39-00:48' },
]

export const exportQueue: ExportItem[] = [
  { title: 'Founder story launch cut', destination: 'YouTube 16:9', status: 'Draft', progress: 8, detail: 'Estimated 54 credits', accent: 'info' },
  { title: 'Course pricing lesson', destination: 'Reels 9:16', status: 'Planning', progress: 22, detail: 'Estimated 72 credits', accent: 'violet' },
  { title: 'Product demo proof reel', destination: 'Client preview', status: 'Generating', progress: 52, detail: 'Approved 118 credits', accent: 'blue' },
  { title: 'Podcast highlight reel', destination: 'TikTok 9:16', status: 'In review', progress: 76, detail: 'Spent 64 credits', accent: 'cyan' },
  { title: 'Property tour luxury cut', destination: 'Reels 9:16', status: 'Exporting', progress: 88, detail: 'Approved 92 credits', accent: 'info' },
  { title: 'Testimonial proof edit', destination: 'Website 16:9', status: 'Completed', progress: 100, detail: 'Spent 58 credits', accent: 'success' },
  { title: 'Social ad variation B', destination: 'Shorts 9:16', status: 'Failed', progress: 0, detail: 'Mock retry available / credits refundable later', accent: 'danger' },
]

export const activityFeed = [
  'Mika approved the pricing framework overlay at 00:26.',
  'Real Motion detected a product demonstration moment at 00:39.',
  'SoundSync added a soft rise into the transformation beat.',
  'Ari requested a more subtle Stroke Motion moment on scene 3.',
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

export const soundSyncPanel = {
  title: 'SoundSync',
  subtitle: 'Audio and timing support engine',
  status: 'Inspirational clean',
  metric: '92 BPM',
  items: ['Soft whoosh on visual entries', 'Medium ducking under voice', 'Beat marker supports the result moment'],
  action: 'Match soundtrack',
  accent: 'success' as Accent,
  icon: AudioLines,
}

export const storyBeats = [
  { label: 'Hook', time: '00:00', state: 'complete' },
  { label: 'Setup', time: '00:05', state: 'active' },
  { label: 'Explanation', time: '00:14', state: 'active' },
  { label: 'Example', time: '00:29', state: 'preview' },
  { label: 'Result', time: '00:48', state: 'queued' },
  { label: 'CTA', time: '01:08', state: 'inactive' },
]

export const chatMessages = [
  {
    role: 'User',
    text: 'Make the intro tighter, add story motion when I describe being stuck, show product proof in-frame, and keep music under the voice.',
  },
  {
    role: 'ReeditPro AI',
    text: 'I shortened the intro, removed 8 filler words, prepared two Stroke Motion moments, added one Real Motion proof overlay, and matched SoundSync timing. Preview before applying.',
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

export const uploadSteps = [
  { label: 'Upload media', detail: 'Video, audio, images, and brand assets', icon: UploadCloud },
  { label: 'Analyze transcript', detail: 'Speaker labels, scenes, emotions, and story beats', icon: Sparkles },
  { label: 'Build edit plan', detail: 'AI proposes cuts, overlays, captions, timing, and export presets', icon: CheckCircle2 },
]

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Personal',
    price: '$10/week',
    description: 'For creators and solo users who want software access plus weekly bonus credits.',
    credits: 'Includes 100 weekly bonus Reedit Credits',
    features: ['ReeditPro software access', '100 credits = $5 retail value', 'Can buy more credits', 'Plan-first approval gate'],
  },
  {
    name: 'Business',
    price: '$20/week',
    description: 'For brands, teams, coaches, agencies, and small businesses producing client-ready work.',
    credits: 'Team credit wallet placeholder',
    features: ['Stronger workflow', 'Business Brand Kit placeholder', 'Team/client review placeholders', 'Can buy more credits as needed'],
    featured: true,
  },
]

export const creditActivity = [
  { label: 'Weekly Personal bonus credits', value: '+100 credits', state: 'success' as Accent },
  { label: 'Mock edit plan estimate', value: '92 credits', state: 'violet' as Accent },
  { label: 'Real Motion proof overlay estimate', value: '34 credits', state: 'blue' as Accent },
  { label: 'SoundSync timing estimate', value: '8 credits', state: 'info' as Accent },
]

export const brandKitFields = [
  { label: 'Logo upload', status: 'Placeholder', icon: Image },
  { label: 'Brand colors', status: 'Needs setup', icon: Palette },
  { label: 'Fonts', status: 'Placeholder', icon: ListChecks },
  { label: 'Caption style', status: 'Placeholder', icon: Captions },
  { label: 'Lower third style', status: 'Placeholder', icon: Layers3 },
  { label: 'Intro/outro', status: 'Placeholder', icon: PlaySquare },
  { label: 'Watermark', status: 'Placeholder', icon: Image },
  { label: 'Stroke Motion preference', status: 'Draft', icon: Move3D },
  { label: 'Graphic Design / VisualExplain preference', status: 'Draft', icon: Palette },
  { label: 'Real Motion preference', status: 'Draft', icon: Boxes },
  { label: 'Music mood preference', status: 'Draft', icon: AudioLines },
  { label: 'Default aspect ratios', status: 'Placeholder', icon: ListChecks },
  { label: 'Social platform presets', status: 'Placeholder', icon: UploadCloud },
  { label: 'Export presets', status: 'Placeholder', icon: PlaySquare },
]

export const walletStats = [
  { label: 'Current plan', value: 'Personal', detail: '$10/week software access', accent: 'cyan' as Accent },
  { label: 'Weekly bonus credits', value: '100', detail: 'Included this week', accent: 'violet' as Accent },
  { label: 'Purchased credits', value: '0', detail: 'Buy more when needed', accent: 'blue' as Accent },
  { label: 'Total available credits', value: '100', detail: 'Deduct after approval only', accent: 'success' as Accent },
]

export const dashboardInsights = [
  { label: 'StoryTiming confidence', value: '91%', icon: Gauge },
  { label: 'Visual layer density', value: 'Balanced', icon: Layers3 },
  { label: 'Export readiness', value: '7 ready', icon: CloudUpload },
  { label: 'Team comments', value: '14 open', icon: BarChart3 },
]
