#!/bin/bash
# ── Palette — EC2 서버 초기 셋업 스크립트 ─────────────────────────────────────
# EC2 접속 후 딱 한 번만 실행:
#   chmod +x server-init.sh && sudo ./server-init.sh

set -e

echo "=== [1/4] Docker 설치 ==="
if ! command -v docker &>/dev/null; then
  apt-get update -q
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker && systemctl start docker
  echo "Docker 설치 완료"
else
  echo "Docker 이미 설치됨 — skip"
fi

echo "=== [2/4] 앱 디렉토리 생성 ==="
mkdir -p /opt/palette
chmod 755 /opt/palette

echo "=== [3/4] docker-compose.server.yml 다운로드 ==="
curl -fsSL \
  https://raw.githubusercontent.com/c-yeonwoo/palette/main/docker-compose.server.yml \
  -o /opt/palette/docker-compose.server.yml

echo "=== [4/4] nginx-server.conf 다운로드 ==="
curl -fsSL \
  https://raw.githubusercontent.com/c-yeonwoo/palette/main/nginx-server.conf \
  -o /opt/palette/nginx-server.conf

echo ""
echo "✅ 초기 셋업 완료!"
echo ""
echo "다음 단계:"
echo "  1. /opt/palette/.env 파일 생성 (GitHub Secret DEV_ENV_FILE 내용과 동일)"
echo "  2. GitHub Repo → Settings → Environments → dev 생성 후 시크릿 추가:"
echo "     DEV_EC2_HOST  = 이 서버의 퍼블릭 IP 또는 도메인"
echo "     DEV_EC2_USER  = ubuntu (또는 ec2-user)"
echo "     DEV_EC2_SSH_KEY = SSH 프라이빗 키 전체 내용"
echo "     DEV_ENV_FILE  = .env 파일 전체 내용"
echo "  3. main 브랜치에 push → GitHub Actions 자동 배포"
