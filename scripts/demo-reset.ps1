$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
  throw 'Arquivo .env não encontrado. Configure-o a partir de .env.example antes de continuar.'
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
  throw 'O reset de demonstração aceita somente PostgreSQL local.'
}

$databaseUri.Path = '/rare_essence_demo'
$originalDatabaseUrl = $env:DATABASE_URL
$hadDatabaseUrl = Test-Path Env:DATABASE_URL
$originalDirectUrl = $env:DIRECT_URL
$hadDirectUrl = Test-Path Env:DIRECT_URL
$previousLocation = Get-Location

try {
  $env:DATABASE_URL = $databaseUri.Uri.AbsoluteUri
  $env:DIRECT_URL = $databaseUri.Uri.AbsoluteUri
  Set-Location $projectRoot

  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) {
    throw 'Falha ao aplicar migrations no banco rare_essence_demo.'
  }

  npx prisma db seed
  if ($LASTEXITCODE -ne 0) {
    throw 'Falha ao recriar o catálogo de demonstração.'
  }
}
finally {
  if ($hadDatabaseUrl) {
    $env:DATABASE_URL = $originalDatabaseUrl
  }
  else {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  }
  if ($hadDirectUrl) {
    $env:DIRECT_URL = $originalDirectUrl
  }
  else {
    Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
  }
  Set-Location $previousLocation
}
