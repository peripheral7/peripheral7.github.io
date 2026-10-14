# 큰 자료와 키 파일을 새 서버로 올린다(scp). 서버에서 server-setup.sh 를 먼저 실행해 ~/whereto 가 있어야 한다.
#
#   powershell -ExecutionPolicy Bypass -File tools\location-compare\migration\3-upload-data.ps1 -Server ubuntu@123.45.67.89 -Key C:\Users\moonc\.ssh\oracle.key
#
# 올리는 것(합계 약 600MB):
#   data/stores.sqlite(상가 DB 490MB) · data/libraries.csv · data/copdem30-N37E127.tif(고도) · data/baseline-*.json
#   raw/국토계획공간시설(경기)/ (공원 경계 Shapefile 34MB)
#   .env.local (키 — 서버에서 권한 600)
#   server/cache/ (지금까지 잰 길·분석 결과 — 새 서버가 이어서 쓰게)
param(
    [Parameter(Mandatory = $true)] [string]$Server,
    [string]$Key = '',
    [string]$RemoteDir = 'whereto'
)
$ErrorActionPreference = 'Stop'
$Tool = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Repo = Split-Path -Parent (Split-Path -Parent $Tool)
$ssh = @(); if ($Key) { $ssh = @('-i', $Key) }

function Up($local, $remote) {
    if (-not (Test-Path $local)) { Write-Host "   없음(건너뜀): $local"; return }
    Write-Host "   $local → ${Server}:$remote"
    & scp @ssh -r -C $local "${Server}:$remote"
    if ($LASTEXITCODE -ne 0) { throw "scp 실패: $local" }
}

& ssh @ssh $Server "mkdir -p ~/$RemoteDir/data ~/$RemoteDir/raw ~/$RemoteDir/server/cache"
foreach ($f in @('stores.sqlite', 'libraries.csv', 'copdem30-N37E127.tif')) { Up (Join-Path $Tool "data\$f") "~/$RemoteDir/data/" }
Get-ChildItem (Join-Path $Tool 'data') -Filter 'baseline-*.json' | ForEach-Object { Up $_.FullName "~/$RemoteDir/data/" }
Up (Join-Path $Repo '국토계획공간시설(경기)') "~/$RemoteDir/raw/"
Up (Join-Path $Tool '.env.local') "~/$RemoteDir/.env.local"
Get-ChildItem (Join-Path $Tool 'server\cache') -Filter '*.json' -ErrorAction SilentlyContinue | ForEach-Object { Up $_.FullName "~/$RemoteDir/server/cache/" }
# csv 를 xls 보다 새것으로(서버엔 xls·Excel 이 없다), 키 파일 권한
& ssh @ssh $Server "chmod 600 ~/$RemoteDir/.env.local; touch ~/$RemoteDir/data/libraries.csv; sudo systemctl restart whereto && sleep 15 && tail -n 5 ~/$RemoteDir/server/server.log"
Write-Host '완료 — 로그에 "Worker 에 등록 완료"가 보이면 이 PC 의 계산 서버는 끈다(두 서버가 번갈아 등록하지 않게).'
