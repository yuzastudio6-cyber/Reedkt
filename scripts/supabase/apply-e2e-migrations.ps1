param(
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$manifestPath = Join-Path $rootDir "supabase\e2e-runtime-migration-manifest.json"
$migrationsDir = Join-Path $rootDir "supabase\migrations"

if (-not $env:SUPABASE_PROJECT_REF) {
  Write-Error "SUPABASE_PROJECT_REF is required. Refusing to infer or apply a remote target."
}

$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
if ($manifest.project -ne "reeditpro") {
  Write-Error "Manifest project is $($manifest.project); expected reeditpro."
}

$missing = @()
Write-Host "Supabase project target: $env:SUPABASE_PROJECT_REF"
Write-Host "Manifest: $manifestPath"
Write-Host "Migration apply order:"

$index = 1
foreach ($entry in $manifest.migrations) {
  $fullPath = Join-Path $migrationsDir $entry.file
  if (-not (Test-Path -LiteralPath $fullPath)) {
    $missing += $entry.file
  }
  Write-Host ("{0:D2}. {1} - {2}" -f $index, $entry.file, $entry.purpose)
  $index++
}

if ($missing.Count -gt 0) {
  Write-Error ("Missing migration files: " + ($missing -join ", "))
}

if (-not $Apply) {
  Write-Host "Dry run complete. Re-run with -Apply to run Supabase CLI migration apply."
  exit 0
}

$supabase = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabase) {
  Write-Error "Supabase CLI is required for -Apply but was not found on PATH."
}

Write-Host "Applying migrations to explicit Supabase project ref: $env:SUPABASE_PROJECT_REF"
Write-Host "No service-role key is read or printed by this helper."
Push-Location $rootDir
try {
  supabase link --project-ref $env:SUPABASE_PROJECT_REF
  supabase db push
}
finally {
  Pop-Location
}
