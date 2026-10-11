# 한국 증시(KRX) 휴장일 판단 — run_daily.ps1 이 자동 실행 전에 불러 쓴다(. .\market_day.ps1).
#   휴장일 = 토·일 + krx_holidays.json 에 적힌 평일 휴장일(공휴일·대체공휴일·선거일·근로자의 날·연말 휴장일).
#   krx_holidays.json 에 없는 해는 주말만 거른다(평일은 모두 거래일로 보고 실행) — 표가 비었다고 조용히 멈추는 쪽보다 한 번 더 도는 쪽이 안전하다.
#
# 주의: 이 파일은 반드시 UTF-8 BOM으로 저장되어야 한다(run_daily.ps1과 같은 이유 — Windows PowerShell 5.1은 BOM이 없으면
# 스크립트 소스를 시스템 ANSI 코드페이지(CP949)로 읽어 한글 리터럴이 깨진다).

$script:InvariantCulture = [System.Globalization.CultureInfo]::InvariantCulture

# krx_holidays.json 을 읽어 { "2026-10-09" = "한글날"; ... } 해시테이블로 돌려준다(파일이 없으면 빈 표).
function Get-KrxHolidayTable {
    param([Parameter(Mandatory = $true)] [string]$Path)
    $table = @{}
    if (-not (Test-Path -LiteralPath $Path)) { return $table }
    $json = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($p in $json.PSObject.Properties) {
        if ($p.Name -match '^\d{4}-\d{2}-\d{2}$') { $table[$p.Name] = [string]$p.Value }   # "_안내" 같은 설명 항목은 건너뜀
    }
    return $table
}

# 그 해의 휴장일이 표에 하나라도 있으면 $true (표가 그 해를 다루는지)
function Test-KrxYearCovered {
    param([Parameter(Mandatory = $true)] [int]$Year, [Parameter(Mandatory = $true)] [hashtable]$Table)
    $prefix = "$Year-"
    foreach ($k in $Table.Keys) { if ($k.StartsWith($prefix)) { return $true } }
    return $false
}

# 휴장이면 사유("토요일" / "일요일" / "휴장일(한글날)"), 거래일이면 $null
function Get-MarketClosedReason {
    param([Parameter(Mandatory = $true)] [datetime]$Date, [Parameter(Mandatory = $true)] [hashtable]$Table)
    if ($Date.DayOfWeek -eq [System.DayOfWeek]::Saturday) { return "토요일" }
    if ($Date.DayOfWeek -eq [System.DayOfWeek]::Sunday)   { return "일요일" }
    $key = $Date.ToString("yyyy-MM-dd", $script:InvariantCulture)
    if ($Table.ContainsKey($key)) { return "휴장일($($Table[$key]))" }
    return $null
}
