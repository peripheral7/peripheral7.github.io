# 4. 주소 전환 — 새 사이트가 동작하는 것을 확인한 뒤에 실행한다.
#
#   powershell -ExecutionPolicy Bypass -File tools\location-compare\migration\4-switch.ps1 -NewUrl https://whereto.mooncg0916.workers.dev
#   (-Deploy 를 붙이면 Worker 배포, -Push 를 붙이면 블로그 커밋을 GitHub 에 올림 — 둘 다 없으면 파일만 바꾸고 멈춤)
#
# 하는 일
#   1) workers/place-search 허용 출처(ALLOWED_ORIGINS)에 새 주소를 더한다(옛 주소는 남김 → 되돌리기 쉬움). -Deploy 면 wrangler deploy
#   2) 블로그 public/WhereTo/ 를 "주소가 바뀌었습니다" 안내 페이지 하나로(빌드 결과 삭제), 옛 /location-compare/ 안내도 새 주소로
#   3) 게시판 카드(content/posts/10-location-compare.json)의 링크를 새 주소로
#   4) 블로그에 커밋(-Push 면 올림). 이 PC 의 계산 서버를 끈다(새 서버가 Worker 에 등록돼 있어야 함)
# 블로그의 tools/location-compare 소스는 지우지 않는다(안정된 뒤 따로) — 다만 그 폴더에서 npm run build 하면 public/WhereTo 를 다시 덮어쓰니
# 전환 뒤에는 새 저장소에서만 작업한다.
param(
    [Parameter(Mandatory = $true)] [string]$NewUrl,
    [switch]$Deploy,
    [switch]$Push
)
# PowerShell 5.1 은 'Stop' 이면 git·npm 이 stderr 에 쓰는 안내만으로 멈춘다 → 종료 코드로 판단
$ErrorActionPreference = 'Continue'
$Tool = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Repo = Split-Path -Parent (Split-Path -Parent $Tool)
$NewUrl = $NewUrl.TrimEnd('/')
$origin = ([Uri]$NewUrl).GetLeftPart([UriPartial]::Authority)
$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host "1) Worker 허용 출처 + $origin"
$wf = Join-Path $Repo 'workers\place-search\src\index.js'
$js = [IO.File]::ReadAllText($wf, $utf8)
if ($js -notmatch [regex]::Escape("'$origin'")) {
    $js = $js -replace "const ALLOWED_ORIGINS = new Set\(\['https://peripheral7\.github\.io',", "const ALLOWED_ORIGINS = new Set(['https://peripheral7.github.io', '$origin',"
    [IO.File]::WriteAllText($wf, $js, $utf8)
}
if ($Deploy) {
    Push-Location (Join-Path $Repo 'workers\place-search')
    npx wrangler deploy
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'wrangler deploy 실패(npx wrangler login 필요할 수 있음)' }
    Pop-Location
} else { Write-Host '   (배포 안 함 — -Deploy 로 다시 실행하거나 workers/place-search 에서 npx wrangler deploy)' }

Write-Host '2) 블로그 /WhereTo/ → 새 주소 안내 페이지'
$redirect = @"
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>여기살까? — 주소가 바뀌었습니다</title>
<meta http-equiv="refresh" content="0; url=$NewUrl/">
<link rel="canonical" href="$NewUrl/">
<script>location.replace('$NewUrl/' + location.search + location.hash)</script>
</head>
<body><p>여기살까?가 새 주소로 옮겼습니다. <a href="$NewUrl/">$NewUrl</a> 로 이동합니다.</p></body>
</html>
"@
$wt = Join-Path $Repo 'public\WhereTo'
Remove-Item -Recurse -Force (Join-Path $wt '*')
[IO.File]::WriteAllText((Join-Path $wt 'index.html'), $redirect, $utf8)
[IO.File]::WriteAllText((Join-Path $Repo 'public\location-compare\index.html'), $redirect, $utf8)

Write-Host '3) 게시판 카드 링크'
$card = Join-Path $Repo 'content\posts\10-location-compare.json'
$c = [IO.File]::ReadAllText($card, $utf8)
$c = $c -replace '"href": "/WhereTo/"', ('"href": "' + $NewUrl + '/"')
[IO.File]::WriteAllText($card, $c, $utf8)

Write-Host '4) 블로그 커밋'
Set-Location $Repo
git add -- public/WhereTo public/location-compare content/posts/10-location-compare.json workers/place-search/src/index.js
git commit -q -m "여기살까?: 새 주소($NewUrl)로 이전 — /WhereTo/ 는 안내 페이지, 게시판 링크·Worker 허용 출처 변경`n`nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
if ($Push) { git push -q origin main; Write-Host '   올림 완료' } else { Write-Host '   커밋만 함(-Push 로 올림)' }

Write-Host '5) 이 PC 계산 서버 끄기'
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*analyze-server.mjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host "   끔 (PID $($_.ProcessId))" }
Write-Host '끝 — 네이버 콘솔 Web 서비스 URL 에 새 주소를 넣었는지 확인(2-cloudflare-setup.md).'
