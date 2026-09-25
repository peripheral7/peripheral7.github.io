# VCP 대시보드 산출물(public/reports/vcp_dashboard.html, data.json)을 main 히스토리에 쌓지 않고
# data 브랜치에 "부모 없는 커밋 1개"로 덮어써 올린다(강제 푸시 — 이전 커밋은 남지 않는다).
#
# 이유: 이 두 파일은 매일 통째로 바뀌는 큰 생성 파일(약 7MB)이라 main에 커밋하면 저장소 용량이
# 계속 불어난다(GitHub Pages 소스 저장소 권장 한도 1GB).
# data 브랜치에는 배포 트리거 워크플로(data-branch/.github/workflows/trigger-deploy.yml)도 함께 담는다:
# push 트리거는 푸시된 브랜치에 있는 워크플로만 실행하므로, 이 트리거가 main의 deploy.yml을 실행해
# main + data를 합쳐 사이트를 다시 빌드한다.
#
# run_daily.ps1이 main.py 실행 후 호출한다. 단독 실행도 가능:
#   powershell -File publish_data.ps1 -RepoRoot <저장소 경로> [-Force]
#
# 주의: 이 파일은 반드시 UTF-8 BOM으로 저장되어야 한다(run_daily.ps1과 같은 이유 — Windows PowerShell 5.1이
# BOM이 없으면 한글 리터럴을 깨뜨려 커밋 메시지·로그가 망가진다).
param(
    [Parameter(Mandatory = $true)] [string]$RepoRoot,
    [string]$Git = "C:\Program Files\Git\cmd\git.exe",
    [switch]$Force    # 내용이 같아도 새 커밋으로 게시한다(배포 트리거 점검용)
)

$ErrorActionPreference = "Stop"
$Files  = @("vcp_dashboard.html", "data.json")
$SrcDir = Join-Path $RepoRoot "public\reports"

# data 브랜치에 담을 파일 목록: (브랜치 안 경로, 원본 경로). 산출물 두 개 + 배포 트리거 워크플로.
$Items = @()
foreach ($f in $Files) { $Items += [pscustomobject]@{ Rel = $f; Src = (Join-Path $SrcDir $f) } }
$ExtraDir = Join-Path $PSScriptRoot "data-branch"
Get-ChildItem -LiteralPath $ExtraDir -Recurse -File -Force | ForEach-Object {
    $Items += [pscustomobject]@{ Rel = $_.FullName.Substring($ExtraDir.Length + 1).Replace('\', '/'); Src = $_.FullName }
}

# 실패해도 괜찮은 git 호출(예: 아직 없는 브랜치 조회)용. Windows PowerShell 5.1은 stderr를 리다이렉트한 네이티브
# 명령이 뭔가 출력하면 $ErrorActionPreference = 'Stop'에서 예외를 던지므로, 그 구간만 Continue로 바꾸고 종료 코드만 본다.
function Invoke-GitQuiet {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { & $Git @args 2>$null } finally { $ErrorActionPreference = $prev }
}

Set-Location $RepoRoot
$remoteUrl = (& $Git remote get-url origin).Trim()

# 1) 원격 data 브랜치와 내용을 비교한다(브랜치가 아직 없으면 "바뀜"으로 본다).
$changed = [bool]$Force
if (-not $changed) {
    Invoke-GitQuiet fetch --quiet origin data | Out-Null
    foreach ($it in $Items) {
        $new = (& $Git hash-object -- $it.Src).Trim()
        $old = Invoke-GitQuiet rev-parse --verify --quiet "origin/data:$($it.Rel)"
        if ($LASTEXITCODE -ne 0 -or "$old".Trim() -ne $new) { $changed = $true }
    }
}
if (-not $changed) {
    Write-Host "변경사항 없음 — 게시 생략"
    return
}

# 2) 임시 저장소에 위 파일들만 담아 커밋 1개를 만들고 data 브랜치로 강제 푸시한다.
#    (blog 저장소의 작업 트리·브랜치는 건드리지 않는다.)
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("vcp-data-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
    foreach ($it in $Items) {
        $dest = Join-Path $tmp $it.Rel
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
        Copy-Item -LiteralPath $it.Src -Destination $dest
    }
    Set-Location $tmp
    & $Git init --quiet --initial-branch=data
    if ($LASTEXITCODE -ne 0) { throw "임시 저장소 초기화 실패 (exit code $LASTEXITCODE)" }
    & $Git add -A
    $dateStr = Get-Date -Format "yyyy-MM-dd"
    & $Git commit --quiet -m "Auto: VCP 데이터 ($dateStr)"
    if ($LASTEXITCODE -ne 0) { throw "임시 저장소 커밋 실패 (exit code $LASTEXITCODE)" }
    & $Git push --force --quiet $remoteUrl "data:data"
    if ($LASTEXITCODE -ne 0) { throw "data 브랜치 푸시 실패 (exit code $LASTEXITCODE)" }
    Write-Host "data 브랜치 게시 완료"
} finally {
    Set-Location $RepoRoot
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
