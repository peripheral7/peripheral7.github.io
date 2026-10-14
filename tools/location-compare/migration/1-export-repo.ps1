# 여기살까? 앱만 떼어 새 저장소 모양의 폴더를 만든다(커밋 이력 보존). -Push 를 붙여야 GitHub 에 올린다.
#
#   powershell -ExecutionPolicy Bypass -File tools\location-compare\migration\1-export-repo.ps1 -RepoUrl https://github.com/ID/whereto.git
#   (결과 폴더를 확인한 뒤)  … -RepoUrl … -Push
#
# 하는 일
#   1) git subtree split 으로 tools/location-compare 의 이력만 담은 가지(whereto-export)를 만든다 — 블로그 저장소는 건드리지 않음
#   2) 그 가지를 -Dest 폴더(기본: 블로그 저장소 옆 whereto)로 clone
#   3) 독립 사이트로 필요한 것을 더해 한 번 커밋: workers/place-search 소스, 글꼴, build:site 스크립트, .gitignore, Pages 배포 워크플로
#   4) -Push 면 origin = RepoUrl 로 main 에 push
param(
    [Parameter(Mandatory = $true)] [string]$RepoUrl,
    [string]$Dest = '',
    [switch]$Push
)
# PowerShell 5.1 은 'Stop' 이면 git·npm 이 stderr 에 쓰는 안내만으로 멈춘다 → 종료 코드로 판단
$ErrorActionPreference = 'Continue'
$Tool = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)   # tools/location-compare
$Repo = Split-Path -Parent (Split-Path -Parent $Tool)                         # 블로그 저장소
if (-not $Dest) { $Dest = Join-Path (Split-Path -Parent $Repo) 'whereto' }
if (Test-Path $Dest) {
    # 앞서 -Push 없이 만들어 확인한 폴더가 있으면 그대로 올린다
    if (-not $Push) { throw "이미 있는 폴더: $Dest (지우거나 -Dest 로 다른 곳을 고르세요. 확인을 마쳤으면 -Push 로 올림)" }
    Set-Location $Dest
    if (-not ((git remote) -contains 'origin')) { git remote add origin $RepoUrl }
    git push -u origin main
    if ($LASTEXITCODE -ne 0) { throw 'push 실패(저장소가 비어 있는지, 로그인됐는지 확인)' }
    Write-Host "올림 완료: $RepoUrl"
    exit 0
}

Set-Location $Repo
$dirty = git status --porcelain -- tools/location-compare workers/place-search
if ($dirty) { throw "tools/location-compare 또는 workers/place-search 에 커밋 안 된 변경이 있습니다 — 먼저 커밋하세요:`n$dirty" }

Write-Host '1) 이력 떼어 내기(git subtree split) — 몇 분 걸릴 수 있음'
if (git branch --list whereto-export) { git branch -D whereto-export | Out-Null }
git subtree split --prefix=tools/location-compare -b whereto-export
if ($LASTEXITCODE -ne 0) { throw 'subtree split 실패' }

Write-Host "2) $Dest 로 clone"
git clone --branch whereto-export --single-branch $Repo $Dest
if ($LASTEXITCODE -ne 0) { throw 'clone 실패' }
Set-Location $Dest
git branch -m whereto-export main
git remote remove origin

Write-Host '3) 독립 사이트 파일 더하기'
New-Item -ItemType Directory -Force 'workers' | Out-Null
Copy-Item -Recurse (Join-Path $Repo 'workers\place-search') 'workers\place-search'
Remove-Item -Recurse -Force 'workers\place-search\node_modules', 'workers\place-search\.wrangler', 'workers\place-search\.dev.vars' -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force 'public\fonts' | Out-Null
Copy-Item (Join-Path $Repo 'public\fonts\PretendardVariable.woff2') 'public\fonts\'
New-Item -ItemType Directory -Force 'raw' | Out-Null
Set-Content -Encoding utf8 'raw\README.md' "큰 원본 자료(git 제외): 「국토계획공간시설(경기)」 폴더, 전국도서관표준데이터 xls(서버에는 data/libraries.csv 만). migration/README.md 4절."

# package.json: 독립 빌드 스크립트
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$pkg.scripts | Add-Member -NotePropertyName 'build:site' -NotePropertyValue 'cross-env WHERETO_BASE=/ WHERETO_OUT=dist vite build' -Force
$pkg | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 package.json
npm install --save-dev cross-env --no-audit --no-fund | Out-Null

# .gitignore: 블로그 저장소 맨 위 .gitignore 에서 이 앱에 걸리던 규칙을 옮긴다
@'
node_modules/
dist/
.env*.local
.naver-usage.json
data/
server/cache/
server/.work/
server/.usage.json
server/server.log
scheduled-routes.log
raw/*
!raw/README.md
workers/place-search/.dev.vars
workers/place-search/.wrangler/
'@ | Set-Content -Encoding utf8 .gitignore

# Cloudflare Pages 배포(GitHub Actions) — 저장소 비밀값 CLOUDFLARE_API_TOKEN·CLOUDFLARE_ACCOUNT_ID, 변수 VITE_*
New-Item -ItemType Directory -Force '.github\workflows' | Out-Null
Copy-Item (Join-Path $Tool 'migration\deploy-pages.yml') '.github\workflows\deploy-pages.yml'
Remove-Item -Recurse -Force 'migration' -ErrorAction SilentlyContinue   # 이전 도구는 블로그 쪽에만

git add -A
git commit -q -m "여기살까? 단독 저장소로 분리: 장소 검색 Worker 소스·글꼴·독립 빌드(build:site)·Cloudflare Pages 배포 워크플로"
Write-Host "   완료: $Dest (커밋 $(git rev-parse --short HEAD), 이력 $(git rev-list --count HEAD)개)"

Write-Host '   독립 빌드 확인'
npm run build:site
if ($LASTEXITCODE -ne 0) { throw '독립 빌드 실패' }

if ($Push) {
    Write-Host "4) $RepoUrl 로 올리기"
    git remote add origin $RepoUrl
    git push -u origin main
    if ($LASTEXITCODE -ne 0) { throw 'push 실패(저장소가 비어 있는지, 로그인됐는지 확인)' }
    Write-Host '   올림 완료'
} else {
    Write-Host "4) 올리지 않음 — 확인 후 같은 명령에 -Push 를 붙이거나: cd $Dest; git remote add origin $RepoUrl; git push -u origin main"
}
Set-Location $Repo
git branch -D whereto-export | Out-Null
