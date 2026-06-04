# Auto commit (if needed) and push wxguobang to GitHub
$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$RemoteUrl = "https://github.com/zhengqiuyun1990-eng/wxguobang.git"
$Branch = "master"
$ProxyPorts = @(7897, 7890)

function Test-GitHubViaProxy([int]$Port) {
    try {
        $params = @{
            Uri = "https://github.com"
            Method = "Head"
            TimeoutSec = 8
            UseBasicParsing = $true
        }
        if ($Port -gt 0) {
            $params["Proxy"] = "http://127.0.0.1:$Port"
        }
        $r = Invoke-WebRequest @params
        return ($r.StatusCode -eq 200)
    } catch {
        return $false
    }
}

function Ensure-GitNetwork {
    if (-not (git config --global http.sslBackend 2>$null)) {
        git config --global http.sslBackend schannel | Out-Null
    }
    if (-not (git config --global http.version 2>$null)) {
        git config --global http.version HTTP/1.1 | Out-Null
    }
    if (-not (git config --global http.postBuffer 2>$null)) {
        git config --global http.postBuffer 524288000 | Out-Null
    }
    $usedPort = 0
    foreach ($port in $ProxyPorts) {
        if (Test-GitHubViaProxy $port) {
            $usedPort = $port
            git config --global http.proxy "http://127.0.0.1:$port" | Out-Null
            git config --global https.proxy "http://127.0.0.1:$port" | Out-Null
            break
        }
    }
    return $usedPort
}

Set-Location $RepoRoot
if (-not (Test-Path ".git")) {
    throw "Not a git repository: $RepoRoot"
}

$proxyPort = Ensure-GitNetwork
if ($proxyPort -gt 0) {
    Write-Host "Using proxy 127.0.0.1:$proxyPort"
} else {
    Write-Host "No local proxy detected; trying direct connection"
}

$remotes = @(git remote 2>$null)
if ($remotes -notcontains "origin") {
    git remote add origin $RemoteUrl
} else {
    git remote set-url origin $RemoteUrl
}

$status = git status --porcelain
if ($status) {
    git add -A
    $stat = git diff --cached --stat 2>$null | Out-String
    $stat = ($stat -replace "`r`n", " ").Trim()
    if ([string]::IsNullOrWhiteSpace($stat)) {
        $stat = "sync local changes"
    }
    if ($stat.Length -gt 200) {
        $stat = $stat.Substring(0, 200)
    }
    git commit -m "chore: sync local changes" -m $stat
    if ($LASTEXITCODE -ne 0) {
        throw "git commit failed. Set repo user: git config user.name and user.email"
    }
    Write-Host "Committed pending changes."
} else {
    Write-Host "No local changes to commit."
}

$branchInfo = git branch -vv 2>$null | Out-String
if ($branchInfo -match "\[origin/$Branch") {
    git push origin $Branch
} else {
    git push -u origin $Branch
}

if ($LASTEXITCODE -ne 0) {
    throw "git push failed with exit code $LASTEXITCODE"
}

Write-Host "---"
git status -sb
git log -1 --oneline
Write-Host "Pushed to $RemoteUrl"
