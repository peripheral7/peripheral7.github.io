# 매일 아침 8시, Windows 작업 스케줄러가 이 스크립트를 실행한다.
# main.py 실행 -> public/reports/vcp_dashboard.html, data.json 갱신 -> 변경 시에만 커밋 & push.
# 로그: 이 파일과 같은 폴더의 run_daily.log (실행마다 append)
#
# 주의: 이 파일은 반드시 UTF-8 BOM으로 저장되어야 한다. Windows PowerShell 5.1은 BOM이 없으면
# 스크립트 소스를 시스템 ANSI 코드페이지(예: CP949)로 읽어, 아래 한글 리터럴이 깨지고
# 그 깨진 문자열이 그대로 git 커밋 메시지 등으로 들어가 버린다(직접 겪은 버그).

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$Python    = "C:\Python314\python.exe"
$Git       = "C:\Program Files\Git\cmd\git.exe"
$LogFile   = Join-Path $ScriptDir "run_daily.log"

Start-Transcript -Path $LogFile -Append | Out-Null
Write-Host "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') 자동 실행 시작 ====="

try {
    Set-Location $ScriptDir
    & $Python main.py
    if ($LASTEXITCODE -ne 0) {
        throw "main.py 실행 실패 (exit code $LASTEXITCODE)"
    }

    Set-Location $RepoRoot
    & $Git add -- "public/reports/vcp_dashboard.html" "public/reports/data.json"
    & $Git diff --cached --quiet -- "public/reports/vcp_dashboard.html" "public/reports/data.json"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "변경사항 없음 — 커밋 생략"
    } else {
        $dateStr = Get-Date -Format "yyyy-MM-dd"
        & $Git commit -m "Auto: VCP 대시보드 데이터 갱신 ($dateStr)"
        & $Git push origin main
        Write-Host "커밋 및 푸시 완료"
    }
} catch {
    Write-Host "오류 발생: $_"
} finally {
    Write-Host "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') 자동 실행 종료 ====="
    Stop-Transcript | Out-Null
}