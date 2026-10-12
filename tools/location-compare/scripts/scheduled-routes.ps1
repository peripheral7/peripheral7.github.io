# 정해진 시각에 네이버 길찾기로 차량 시간을 재고(fetch-routes.mjs) → 다시 빌드 → 그 파일만 커밋·푸시한다.
# Windows 작업 스케줄러가 부른다. 직접 실행도 가능:
#   powershell -ExecutionPolicy Bypass -File scheduled-routes.ps1 -Slot rush
#   powershell -ExecutionPolicy Bypass -File scheduled-routes.ps1 -Slot free -Force   (시간대 검사 건너뜀)
#
# 시간대 검사: rush 는 평일 07:30~09:30, free 는 평일 10:30~16:00 에만 잰다.
# PC 가 꺼져 있다가 늦게 켜져서 엉뚱한 시각에 돌면 "출퇴근" 값이 틀어지므로, 범위 밖이면 재지 않고 로그만 남긴다.
# 로그: 이 폴더 위의 scheduled-routes.log
#
# 주의: 이 파일은 UTF-8 BOM 으로 저장해야 한다(Windows PowerShell 5.1 이 한글을 깨뜨리지 않게).
param(
    [Parameter(Mandatory = $true)] [ValidateSet('rush', 'free')] [string]$Slot,
    [switch]$Force,
    [switch]$SkipFetch   # 시험용: 재지 않고 빌드·커밋 단계만
)

# 'Stop' 이면 빌드 도구가 경고를 stderr 로 내는 것만으로도 멈춘다 → 종료 코드로 판단한다
$ErrorActionPreference = 'Continue'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Tool = Split-Path -Parent $Here
$Repo = Split-Path -Parent (Split-Path -Parent $Tool)
$Log  = Join-Path $Tool 'scheduled-routes.log'
$Node = 'C:\Program Files\nodejs\node.exe'
$Git  = 'C:\Program Files\Git\cmd\git.exe'

function Write-Log($msg) { Add-Content -LiteralPath $Log -Encoding UTF8 -Value ("{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Slot, $msg) }

$now = Get-Date
$weekday = $now.DayOfWeek -notin @([DayOfWeek]::Saturday, [DayOfWeek]::Sunday)
$mins = $now.Hour * 60 + $now.Minute
$inWindow = if ($Slot -eq 'rush') { $mins -ge 450 -and $mins -le 570 } else { $mins -ge 630 -and $mins -le 960 }
if (-not $Force -and (-not $weekday -or -not $inWindow)) {
    Write-Log "시간대 밖(평일 $(if ($Slot -eq 'rush') { '07:30~09:30' } else { '10:30~16:00' }) 아님) - 재지 않음"
    exit 0
}

try {
    Set-Location $Tool
    if (-not $SkipFetch) {
        Write-Log '측정 시작'
        $out = & $Node 'scripts/fetch-routes.mjs' --slot $Slot 2>&1 | Out-String
        Write-Log ($out.Trim() -replace "`r?`n", ' | ')
        if ($LASTEXITCODE -ne 0) { throw "fetch-routes 실패 (exit $LASTEXITCODE)" }
    }

    $build = & $Node 'node_modules/vite/bin/vite.js' build 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw "빌드 실패: $($build.Trim())" }

    Set-Location $Repo
    $paths = @('tools/location-compare/src/routes.json', 'public/location-compare')
    & $Git add -A -- $paths
    & $Git diff --cached --quiet -- $paths
    if ($LASTEXITCODE -eq 0) { Write-Log '바뀐 내용 없음 - 커밋 생략'; exit 0 }
    $label = if ($Slot -eq 'rush') { '출퇴근' } else { '여유' }
    $msg = "여기살까?: 차량 소요 시간 $label 시간대 네이버 실측 반영 ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))`n`n작업 스케줄러가 scripts/scheduled-routes.ps1 -Slot $Slot 로 자동 실행.`n`nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
    & $Git commit --only -q -m $msg -- $paths   # 이 두 경로만 커밋(작업 트리의 다른 변경은 건드리지 않음)
    if ($LASTEXITCODE -ne 0) { throw "커밋 실패 (exit $LASTEXITCODE)" }
    & $Git push -q origin main
    if ($LASTEXITCODE -ne 0) { throw "푸시 실패 (exit $LASTEXITCODE)" }
    Write-Log '커밋·푸시 완료'
} catch {
    Write-Log "오류: $_"
    exit 1
}
