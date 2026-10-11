# 매일 아침 8시, Windows 작업 스케줄러가 이 스크립트를 실행한다.
# 단, 토·일요일과 증시 휴장일(공휴일·대체공휴일·선거일·근로자의 날·연말 휴장일 — krx_holidays.json)에는 아무것도 돌리지 않고
# 로그 한 줄만 남긴다. 수동으로 그날 돌리려면 -Force.
# main.py 실행 -> public/reports/vcp_dashboard.html, data.json 갱신 -> 변경 시에만 data 브랜치에 게시.
# (두 파일은 main에 커밋하지 않는다: 매일 통째로 바뀌는 큰 파일이라 히스토리가 계속 불어난다.
#  publish_data.ps1이 data 브랜치에 "커밋 1개"로 덮어써 올리고, 배포 워크플로가 main + data를 합쳐 빌드한다.)
# 로그: 이 파일과 같은 폴더의 run_daily.log (실행마다 append)
#
# 사용:
#   powershell -File run_daily.ps1                   스케줄러가 쓰는 방식 — 쉬는 날이면 건너뜀
#   powershell -File run_daily.ps1 -Force            쉬는 날에도 실행(수동)
#   powershell -File run_daily.ps1 -CheckOnly        아무것도 실행하지 않고 오늘 도는 날인지만 표시
#   powershell -File run_daily.ps1 -Date 2026-10-09  그 날짜로 점검만 한다(-Date 를 주면 -CheckOnly 와 같다)
#
# 휴장일 표(krx_holidays.json)는 해마다 12월에 한국거래소가 다음 해 휴장일을 공지하면 그 해를 추가한다.
# 표에 없는 해는 주말만 거르고(평일은 실행) 로그에 경고를 남긴다 — 표가 비었다고 조용히 멈추는 것보다 한 번 더 도는 쪽이 안전하다.
#
# 주의: 이 파일은 반드시 UTF-8 BOM으로 저장되어야 한다. Windows PowerShell 5.1은 BOM이 없으면
# 스크립트 소스를 시스템 ANSI 코드페이지(예: CP949)로 읽어, 아래 한글 리터럴이 깨지고
# 그 깨진 문자열이 그대로 git 커밋 메시지 등으로 들어가 버린다(직접 겪은 버그).
param(
    [switch]$Force,
    [switch]$CheckOnly,
    [string]$Date
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$Python    = "C:\Python314\python.exe"
$Git       = "C:\Program Files\Git\cmd\git.exe"
$LogFile   = Join-Path $ScriptDir "run_daily.log"

# 오늘이 쉬는 날인지 판단한다. 판단 중에 문제가 생기면(표 파일이 깨졌거나 등) "거래일"로 보고 그대로 실행한다.
. (Join-Path $ScriptDir "market_day.ps1")
$Inv  = [System.Globalization.CultureInfo]::InvariantCulture
$When = Get-Date
if ($Date) {
    $When = [datetime]::ParseExact($Date, "yyyy-MM-dd", $Inv)
    $CheckOnly = $true
}
$Closed   = $null
$Notes    = @()
$Holidays = @{}
$TableOk  = $true
try {
    try {
        $Holidays = Get-KrxHolidayTable (Join-Path $ScriptDir "krx_holidays.json")
    } catch {
        $TableOk = $false      # 표가 깨졌어도 주말 판단은 표와 무관하니 그대로 한다(주말만 거르고 평일은 실행)
        $Notes += "경고: krx_holidays.json 을 읽지 못해 주말만 거릅니다 ($_)"
    }
    $Closed = Get-MarketClosedReason -Date $When -Table $Holidays
    if ($TableOk -and -not (Test-KrxYearCovered -Year $When.Year -Table $Holidays)) {
        $Notes += "경고: krx_holidays.json 에 $($When.Year)년 휴장일이 없어 주말만 거릅니다 - 한국거래소 공지를 보고 추가하세요"
    } elseif ($TableOk -and $When.Month -ge 12 -and -not (Test-KrxYearCovered -Year ($When.Year + 1) -Table $Holidays)) {
        $Notes += "알림: krx_holidays.json 에 $($When.Year + 1)년 휴장일이 아직 없습니다 - 한국거래소가 공지하면 추가하세요"
    }
} catch {
    $Closed = $null            # 예상 못 한 오류: 잘못 건너뛰어 하루를 놓치는 것보다 한 번 더 도는 쪽이 안전하다
    $Notes += "경고: 휴장일 판단에 실패해 그대로 실행합니다 ($_)"
}

if ($CheckOnly) {
    $day = $When.ToString("yyyy-MM-dd", $Inv)
    if ($Closed) { Write-Host "$day - ${Closed}: 자동 실행하지 않음" } else { Write-Host "$day - 거래일: 자동 실행함" }
    foreach ($n in $Notes) { Write-Host $n }
    exit 0
}

if ($Closed -and -not $Force) {
    Add-Content -LiteralPath $LogFile -Encoding UTF8 -Value "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Closed - 자동 실행 생략 (수동 실행은 -Force) ====="
    exit 0
}

Start-Transcript -Path $LogFile -Append | Out-Null
Write-Host "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') 자동 실행 시작 ====="
if ($Closed) { Write-Host "($Closed 이지만 -Force 로 실행합니다)" }
foreach ($n in $Notes) { Write-Host $n }

try {
    Set-Location $ScriptDir
    & $Python main.py
    if ($LASTEXITCODE -ne 0) {
        throw "main.py 실행 실패 (exit code $LASTEXITCODE)"
    }

    Set-Location $RepoRoot
    & (Join-Path $ScriptDir "publish_data.ps1") -RepoRoot $RepoRoot -Git $Git
} catch {
    Write-Host "오류 발생: $_"
} finally {
    Write-Host "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') 자동 실행 종료 ====="
    Stop-Transcript | Out-Null
}
