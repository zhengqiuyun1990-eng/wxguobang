# 仅同步 CLI 必需项：manifest/pages 到 src/，并复制 uni_modules 供样式解析
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'src'

if (Test-Path $src) { Remove-Item $src -Recurse -Force }
New-Item -ItemType Directory -Path $src | Out-Null

@('manifest.json', 'pages.json') | ForEach-Object {
    Copy-Item (Join-Path $root $_) (Join-Path $src $_) -Force
}

foreach ($d in @('uni_modules', 'utils', 'pages', 'static')) {
    $from = Join-Path $root $d
    if (Test-Path $from) {
        Copy-Item $from (Join-Path $src $d) -Recurse -Force
    }
}
@('App.vue', 'main.js', 'uni.scss') | ForEach-Object {
    $from = Join-Path $root $_
    if (Test-Path $from) { Copy-Item $from (Join-Path $src $_) -Force }
}

Write-Host '[sync-src] CLI src/ ready'
