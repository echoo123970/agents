#requires -Version 5.1
<#
.SYNOPSIS
  Copies the finished SEO schema files onto the live iMosaicArt theme.

.DESCRIPTION
  Source of truth is theme 192613450026 ("iMosaicArt + SEO schema"), which already
  contains the correct final version of every file. This script reads each file
  from there and writes it to the live theme, so nothing is retyped and nothing
  can be transcribed wrongly.

  It takes a backup duplicate of the live theme first, and asks before writing.

.PARAMETER DryRun
  Read and compare only. Writes nothing. Run this first.

.EXAMPLE
  .\Install-SeoSchema.ps1 -DryRun
  .\Install-SeoSchema.ps1
#>
param(
  [string]$Shop          = 'aml89.myshopify.com',
  [string]$ApiVersion    = '2026-10',
  [string]$SourceThemeId = 'gid://shopify/OnlineStoreTheme/192613450026',
  [string]$LiveThemeId   = 'gid://shopify/OnlineStoreTheme/188598747434',
  [switch]$DryRun,
  [switch]$SkipBackup
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

# Files to copy, in dependency order: snippets exist before anything renders them.
$Files = @(
  'snippets/seo-product-schema.liquid',
  'snippets/seo-breadcrumbs.liquid',
  'snippets/seo-howto-install.liquid',
  'templates/robots.txt.liquid',
  'templates/product.liquid',
  'layout/theme.liquid'
)

# ---------------------------------------------------------------- token
if ($env:SHOPIFY_ADMIN_TOKEN) {
  $token = $env:SHOPIFY_ADMIN_TOKEN
  Write-Host 'Using token from $env:SHOPIFY_ADMIN_TOKEN' -ForegroundColor DarkGray
} else {
  $sec = Read-Host 'Shopify Admin API access token (shpat_...)' -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try   { $token = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
if ([string]::IsNullOrWhiteSpace($token)) { throw 'No token supplied.' }

# ---------------------------------------------------------------- helper
$Uri = "https://$Shop/admin/api/$ApiVersion/graphql.json"

function Invoke-Shopify {
  param([Parameter(Mandatory)][string]$Query, $Variables)
  $payload = @{ query = $Query }
  if ($Variables) { $payload['variables'] = $Variables }
  $json  = $payload | ConvertTo-Json -Depth 30 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $resp = Invoke-RestMethod -Method Post -Uri $Uri `
            -Headers @{ 'X-Shopify-Access-Token' = $token } `
            -ContentType 'application/json; charset=utf-8' -Body $bytes
  if ($resp.errors) { throw ("GraphQL error: " + ($resp.errors | ConvertTo-Json -Depth 10 -Compress)) }
  return $resp.data
}

function Get-ThemeFile {
  param([string]$ThemeId, [string]$Filename)
  $q = @'
query($id: ID!, $names: [String!]) {
  theme(id: $id) {
    files(first: 1, filenames: $names) {
      nodes { filename size body { ... on OnlineStoreThemeFileBodyText { content } } }
    }
  }
}
'@
  $d = Invoke-Shopify -Query $q -Variables @{ id = $ThemeId; names = @($Filename) }
  return $d.theme.files.nodes | Select-Object -First 1
}

# ---------------------------------------------------------------- preflight
Write-Host "`n== Preflight ==" -ForegroundColor Cyan

$themeQ = @'
query($src: ID!, $live: ID!) {
  src:  theme(id: $src)  { id name role }
  live: theme(id: $live) { id name role }
}
'@
$t = Invoke-Shopify -Query $themeQ -Variables @{ src = $SourceThemeId; live = $LiveThemeId }

if (-not $t.src)  { throw "Source theme $SourceThemeId not found." }
if (-not $t.live) { throw "Live theme $LiveThemeId not found." }
Write-Host ("  source : {0}  [{1}]" -f $t.src.name,  $t.src.role)
Write-Host ("  target : {0}  [{1}]" -f $t.live.name, $t.live.role)
if ($t.live.role -ne 'MAIN') {
  Write-Warning "Target theme role is '$($t.live.role)', not MAIN. Check the theme id before continuing."
}

# Read every source file up front; abort if any is missing.
Write-Host "`n== Reading source files ==" -ForegroundColor Cyan
$plan = @()
foreach ($f in $Files) {
  $srcFile = Get-ThemeFile -ThemeId $SourceThemeId -Filename $f
  if (-not $srcFile -or -not $srcFile.body.content) { throw "Source file missing or unreadable: $f" }
  $liveFile = Get-ThemeFile -ThemeId $LiveThemeId -Filename $f
  $liveSize = if ($liveFile) { [int]$liveFile.size } else { 0 }
  $state    = if ($liveFile) { 'replace' } else { 'create ' }
  $plan += [pscustomobject]@{
    Filename = $f
    Action   = $state
    FromSize = [int]$srcFile.size
    ToSize   = $liveSize
    Content  = $srcFile.body.content
  }
  Write-Host ("  {0} {1,-42} live:{2,6} -> new:{3,6}" -f $state, $f, $liveSize, [int]$srcFile.size)
}

if ($DryRun) {
  Write-Host "`nDry run. Nothing was written." -ForegroundColor Yellow
  return
}

# ---------------------------------------------------------------- confirm
Write-Host "`n== About to write to the LIVE theme ==" -ForegroundColor Yellow
Write-Host "  $($t.live.name) ($LiveThemeId)"
Write-Host "  $($plan.Count) files. This affects every published product page."
$ans = Read-Host "Type YES to continue"
if ($ans -cne 'YES') { Write-Host 'Aborted. Nothing written.' -ForegroundColor Yellow; return }

# ---------------------------------------------------------------- backup
if (-not $SkipBackup) {
  Write-Host "`n== Backup ==" -ForegroundColor Cyan
  $stamp = Get-Date -Format 'yyyy-MM-dd HHmm'
  $dupQ = @'
mutation($id: ID!, $name: String) {
  themeDuplicate(id: $id, name: $name) {
    newTheme { id name role }
    userErrors { field message }
  }
}
'@
  $d = Invoke-Shopify -Query $dupQ -Variables @{ id = $LiveThemeId; name = "live backup before SEO schema $stamp" }
  if ($d.themeDuplicate.userErrors) { throw ($d.themeDuplicate.userErrors | ConvertTo-Json -Compress) }
  Write-Host ("  created: {0} ({1})" -f $d.themeDuplicate.newTheme.name, $d.themeDuplicate.newTheme.id) -ForegroundColor Green
  Write-Host '  (duplication finishes in the background; it is your rollback point)'
}

# ---------------------------------------------------------------- write
Write-Host "`n== Writing ==" -ForegroundColor Cyan
$upsertQ = @'
mutation($id: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
  themeFilesUpsert(themeId: $id, files: $files) {
    upsertedThemeFiles { filename size }
    userErrors { filename field message }
  }
}
'@

foreach ($p in $plan) {
  $vars = @{
    id    = $LiveThemeId
    files = @( @{ filename = $p.Filename; body = @{ type = 'TEXT'; value = $p.Content } } )
  }
  $d = Invoke-Shopify -Query $upsertQ -Variables $vars
  $errs = $d.themeFilesUpsert.userErrors
  if ($errs) { throw ("Failed on $($p.Filename): " + ($errs | ConvertTo-Json -Depth 10 -Compress)) }
  $w = $d.themeFilesUpsert.upsertedThemeFiles | Select-Object -First 1
  Write-Host ("  ok  {0,-42} {1,6} bytes" -f $w.filename, $w.size) -ForegroundColor Green
}

# ---------------------------------------------------------------- verify
Write-Host "`n== Verify ==" -ForegroundColor Cyan
$bad = 0
foreach ($p in $plan) {
  $now = Get-ThemeFile -ThemeId $LiveThemeId -Filename $p.Filename
  $ok  = $now -and ([int]$now.size -eq $p.FromSize)
  if ($ok) {
    Write-Host ("  match   {0,-42} {1,6}" -f $p.Filename, [int]$now.size) -ForegroundColor Green
  } else {
    $bad++
    $seen = if ($now) { [int]$now.size } else { 'missing' }
    Write-Host ("  MISMATCH {0,-41} expected {1} got {2}" -f $p.Filename, $p.FromSize, $seen) -ForegroundColor Red
  }
}

# Guard against a leftover second Product JSON-LD in product.liquid.
$prod = Get-ThemeFile -ThemeId $LiveThemeId -Filename 'templates/product.liquid'
$ldCount = ([regex]::Matches($prod.body.content, 'application/ld\+json')).Count
Write-Host ("`n  product.liquid ld+json blocks: {0} (expected 1 - the breadcrumb)" -f $ldCount)
if ($ldCount -ne 1) { $bad++; Write-Host '  ^ investigate before trusting the page' -ForegroundColor Red }

if ($bad -eq 0) {
  Write-Host "`nAll files verified." -ForegroundColor Green
  Write-Host 'Next: load a product page, then run it and /pages/installation-guide through'
  Write-Host 'https://search.google.com/test/rich-results'
} else {
  Write-Host "`n$bad problem(s). Roll back from the backup theme if a page is broken." -ForegroundColor Red
}
