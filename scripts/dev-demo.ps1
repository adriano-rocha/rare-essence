$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
  throw 'Arquivo .env não encontrado. Configure-o a partir de .env.example antes de iniciar.'
}

$databaseLine = Get-Content -LiteralPath $envFile |
  Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } |
  Select-Object -First 1
if (-not $databaseLine) {
  throw 'DATABASE_URL não foi encontrada no .env.'
}

$databaseUrl = ($databaseLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
$databaseUri = New-Object System.UriBuilder -ArgumentList $databaseUrl
if ($databaseUri.Host -notin @('localhost', '127.0.0.1', '::1')) {
  throw 'O modo demo aceita somente DATABASE_URL apontando para PostgreSQL local.'
}

$databaseUri.Path = '/rare_essence_demo'
$originalDatabaseUrl = $env:DATABASE_URL
$hadDatabaseUrl = Test-Path Env:DATABASE_URL
$originalSessionSecret = $env:ADMIN_SESSION_SECRET
$hadSessionSecret = Test-Path Env:ADMIN_SESSION_SECRET
$previousLocation = Get-Location

try {
  $env:DATABASE_URL = $databaseUri.Uri.AbsoluteUri
  # Keep a demo-only rate-limit key ephemeral; never rewrite .env.
  $demoSessionSecret = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
  if ($LASTEXITCODE -ne 0 -or $demoSessionSecret.Length -lt 32) {
    throw 'Não foi possível gerar a chave temporária do ambiente demo.'
  }
  $env:ADMIN_SESSION_SECRET = $demoSessionSecret
  Set-Location $projectRoot
  npm run dev
  if ($LASTEXITCODE -ne 0) {
    throw 'O servidor Next.js terminou com erro.'
  }
}
finally {
  if ($hadDatabaseUrl) {
    $env:DATABASE_URL = $originalDatabaseUrl
  }
  else {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  }
  if ($hadSessionSecret) {
    $env:ADMIN_SESSION_SECRET = $originalSessionSecret
  }
  else {
    Remove-Item Env:ADMIN_SESSION_SECRET -ErrorAction SilentlyContinue
  }
  Set-Location $previousLocation
}
