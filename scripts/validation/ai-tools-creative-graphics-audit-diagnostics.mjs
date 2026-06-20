import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const requiredDocs = [
  'docs/ai-tools/creative-graphics-repo-audit.md',
  'docs/ai-tools/creative-graphics-tool-inventory.md',
  'docs/ai-tools/creative-graphics-capability-map.md',
  'docs/ai-tools/creative-graphics-runtime-boundary.md',
  'docs/ai-tools/creative-graphics-existing-implementation-gaps.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
  'docs/ai-tools/creative-graphics-cross-chat-handoffs.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/prompt-gd-0-validation-results.md',
  'docs/implementation-prompts/prompt-gd-0-ai-tools-creative-graphics-repo-audit.md',
];

const requiredTrackers = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
];

const ownedTools = [
  'Remotion',
  'D3.js',
  'Three.js',
  'PixiJS',
  'Anime.js',
  'Lottie-web',
  'SVG.js',
  'Apache ECharts',
  'Vega / Vega-Lite',
  'Viz.js / Graphviz',
  'Satori',
  '@resvg/resvg-js',
];

const requiredStatusTerms = [
  'blocked at repo_audit stage',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'none; AI Tools creative graphics repo audit only',
];

const requiredBoundaryTerms = [
  'Track A final render/export',
  'Track B media processing',
  'Maps/geospatial',
  'Sound/music/audio',
  'Provider gateway',
  'Worker runtime',
  'Supabase/storage/database',
];

const unsafePatterns = [
  /runtime unlock status:\s*`?(unlocked|production_candidate|runtime_enabled)`?/i,
  /tool execution:\s*`?(enabled|yes|true|executed)`?/i,
  /worker execution:\s*`?(enabled|yes|true|executed)`?/i,
  /(provider|model) calls?:\s*`?(enabled|yes|true|executed)`?/i,
  /render\/export:\s*`?(enabled|yes|true|executed)`?/i,
  /media processing:\s*`?(enabled|yes|true|executed)`?/i,
  /browser capture:\s*`?(enabled|yes|true|executed)`?/i,
  /Docker or Cloud Run execution:\s*`?(enabled|yes|true|executed)`?/i,
  /Google Cloud access:\s*`?(enabled|yes|true|used)`?/i,
  /Secret Manager access:\s*`?(enabled|yes|true|used)`?/i,
  /Supabase environment touched:\s*`?(local|staging|remote|production|yes|true)`?/i,
  /SQL executed:\s*`?(local|staging|remote|production|yes|true)`?/i,
  /Migration deployed:\s*`?(yes|true|staging|production)`?/i,
  /public artifacts?:\s*`?(created|yes|true)`?/i,
  /dependency mutation:\s*`?(yes|true|mutated)`?/i,
  /approval grant:\s*`?(yes|true|granted)`?/i,
  /staging execution approval:\s*`?(yes|true|approved|granted)`?/i,
  /production\/beta unlock:\s*`?(yes|true|unlocked)`?/i,
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
  /signed URL source-of-truth:\s*`?(allowed|enabled|yes|true)`?/i,
];

const failures = [];

function readRequired(filePath) {
  const absolute = path.join(repoRoot, filePath);
  if (!existsSync(absolute)) {
    failures.push(`Missing required file: ${filePath}`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

const docsText = requiredDocs.map(readRequired).join('\n');
const trackersText = requiredTrackers.map(readRequired).join('\n');
const combinedText = `${docsText}\n${trackersText}`;

for (const tool of ownedTools) {
  if (!combinedText.includes(tool)) {
    failures.push(`Missing owned tool mention: ${tool}`);
  }
}

for (const term of requiredStatusTerms) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing status term: ${term}`);
  }
}

for (const term of requiredBoundaryTerms) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing boundary term: ${term}`);
  }
}

for (const tracker of requiredTrackers) {
  const text = readRequired(tracker);
  if (!text.includes('GD-0') && !text.includes('Creative Graphics')) {
    failures.push(`Tracker does not reference GD-0 or Creative Graphics: ${tracker}`);
  }
}

for (const pattern of unsafePatterns) {
  if (pattern.test(combinedText)) {
    failures.push(`Unsafe claim or secret-like pattern detected: ${pattern}`);
  }
}

const migrationDir = path.join(repoRoot, 'supabase', 'migrations');
if (existsSync(migrationDir)) {
  const migrationFiles = readdirSync(migrationDir).filter((name) => name.endsWith('.sql'));
  for (const file of migrationFiles) {
    const text = readFileSync(path.join(migrationDir, file), 'utf8');
    if (/GD-0|Creative Graphics Repo Audit|AI Tools creative graphics/i.test(text)) {
      failures.push(`GD-0 marker found in active migration: ${file}`);
    }
  }
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  creativeGraphicsAuditStatus: 'blocked at repo_audit stage',
  ownedToolsChecked: ownedTools.length,
  requiredDocsChecked: requiredDocs.length,
  requiredTrackersChecked: requiredTrackers.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics repo audit only',
  nextRecommendedPrompt: 'Prompt GD-1 - AI Tools Creative Graphics Capability Manifest Contract',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
