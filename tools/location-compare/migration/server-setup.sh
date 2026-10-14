#!/usr/bin/env bash
# 여기살까? 계산 서버 — 새 무료 서버(Ubuntu 22.04/24.04, Oracle Cloud A1 ARM 또는 x86)에 한 번 실행.
#   ssh ubuntu@<서버> 'bash -s' -- <새 저장소 주소> < server-setup.sh
#   (비공개 저장소면 먼저 서버에 배포 키를 등록하거나 https://<토큰>@github.com/... 주소를 쓴다)
#
# 하는 일: Node 24 · git · cloudflared 설치 → ~/whereto 에 저장소 받기 → npm ci → systemd 서비스(whereto) 등록.
# 큰 자료와 .env.local 은 3-upload-data.ps1 로 따로 올린 뒤 서비스를 시작한다(없으면 시작하지 않음).
set -euo pipefail
REPO_URL="${1:?새 저장소 주소를 넣어 주세요}"
APP="$HOME/whereto"

echo '1) 패키지'
sudo apt-get update -y
sudo apt-get install -y git curl ca-certificates
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 24 ]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

echo '2) cloudflared(빠른 터널 — 계정·도메인 설정 없이 Worker 에 주소를 자동 등록)'
if ! command -v cloudflared >/dev/null; then
  ARCH=$(dpkg --print-architecture)   # arm64 | amd64
  curl -fsSL -o /tmp/cloudflared.deb "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"
  sudo dpkg -i /tmp/cloudflared.deb
fi
cloudflared --version

echo '3) 저장소'
if [ -d "$APP/.git" ]; then git -C "$APP" pull --ff-only; else git clone "$REPO_URL" "$APP"; fi
cd "$APP"
npm ci --no-audit --no-fund
mkdir -p data raw server/cache

echo '4) 서비스'
sudo tee /etc/systemd/system/whereto.service >/dev/null <<UNIT
[Unit]
Description=WhereTo compute server (analyze/route + cloudflared quick tunnel)
After=network-online.target
Wants=network-online.target

[Service]
User=$USER
WorkingDirectory=$APP
Environment=TZ=Asia/Seoul
ExecStart=$(command -v node) server/analyze-server.mjs --tunnel
Restart=always
RestartSec=10
StandardOutput=append:$APP/server/server.log
StandardError=append:$APP/server/server.log

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable whereto
# 기준 시각(08·10·13·18시)은 한국 시간으로 판단한다 — 서버 시간대도 맞춰 둔다
sudo timedatectl set-timezone Asia/Seoul || true

if [ -f .env.local ] && [ -f data/stores.sqlite ]; then
  sudo systemctl restart whereto
  sleep 15
  tail -n 5 server/server.log
else
  echo '   .env.local · data/stores.sqlite 가 아직 없음 → 3-upload-data.ps1 로 올린 뒤:  sudo systemctl restart whereto'
fi

# (선택) 기본 후보지 실측을 저장소 routes.json 에도 남기려면 crontab -e 에:
#   5 8,18 * * 1-5  cd ~/whereto && node scripts/fetch-routes.mjs --slot rush >> scheduled-routes.log 2>&1
#   5 10,13 * * 1-5 cd ~/whereto && node scripts/fetch-routes.mjs --slot free >> scheduled-routes.log 2>&1
# (커밋·푸시까지 하려면 서버에 저장소 쓰기 권한이 필요 — 계산 서버만으로도 화면에는 반영된다)
echo '끝.'
