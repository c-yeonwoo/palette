#!/usr/bin/env bash
#
# iOS 릴리스 준비 — 프론트(mobile 모드) 빌드 → Capacitor sync → Xcode 핸드오프.
# RUNBOOK §10 참조. Archive/TestFlight 업로드는 Xcode 에서 수동(서명 필요).
#
# 사용:
#   scripts/ios-release.sh            # 빌드 + sync + Xcode 열기
#   scripts/ios-release.sh --bump     # 빌드 번호(CURRENT_PROJECT_VERSION) +1 후 진행
#   scripts/ios-release.sh --no-open  # Xcode 자동 실행 생략 (CI/점검용)
#
set -euo pipefail

# CocoaPods + 최신 Homebrew Ruby 는 UTF-8 로케일 없으면 pod install 시
# "Unicode Normalization not appropriate for ASCII-8BIT" 로 죽는다. 강제 설정.
export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FE="$ROOT/frontend"
PBX="$FE/ios/App/App.xcodeproj/project.pbxproj"

BUMP=0; OPEN=1
for a in "$@"; do
  case "$a" in
    --bump) BUMP=1 ;;
    --no-open) OPEN=0 ;;
    *) echo "unknown arg: $a"; exit 2 ;;
  esac
done

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
die()  { printf "  \033[31m✗ %s\033[0m\n" "$1"; exit 1; }

bold "▶ 1/5 사전 점검"
command -v node >/dev/null || die "node 없음"
command -v pod  >/dev/null || die "CocoaPods 없음 → brew install cocoapods"
ok "node $(node -v) · pod $(pod --version)"

XC="$(xcode-select -p 2>/dev/null || true)"
if [[ "$XC" == *CommandLineTools* || -z "$XC" ]]; then
  warn "풀 Xcode 미설치 (현재: ${XC:-none})."
  warn "Archive/업로드는 Xcode.app 필요 — Mac App Store 설치 후:"
  warn "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  OPEN=0
else
  ok "Xcode: $XC"
fi

[[ -f "$FE/assets/icon.png" ]] || warn "frontend/assets/icon.png 없음 → python scripts/gen-app-assets.py"

bold "▶ 2/5 빌드 번호"
if [[ "$BUMP" == "1" ]]; then
  CUR=$(grep -m1 -E "CURRENT_PROJECT_VERSION = " "$PBX" | sed -E 's/.*= ([0-9]+);/\1/')
  NEW=$((CUR + 1))
  sed -i '' -E "s/(CURRENT_PROJECT_VERSION = )[0-9]+;/\1${NEW};/g" "$PBX"
  ok "build $CUR → $NEW (MARKETING_VERSION 은 Xcode 에서 수동 조정)"
else
  CUR=$(grep -m1 -E "CURRENT_PROJECT_VERSION = " "$PBX" | sed -E 's/.*= ([0-9]+);/\1/')
  MKT=$(grep -m1 -E "MARKETING_VERSION = " "$PBX" | sed -E 's/.*= ([0-9.]+);/\1/')
  ok "현재 버전 v${MKT} (build ${CUR}) — 번호 올리려면 --bump"
fi

bold "▶ 3/5 프론트 빌드 (mode=mobile, 절대 API URL 주입)"
cd "$FE"
[[ -d node_modules ]] || npm install
npm run build:mobile
ok "dist/ 생성"

bold "▶ 4/5 Capacitor sync (iOS)"
npx cap sync ios
ok "ios/App 에 dist + 플러그인 동기화 (pod install 포함)"

bold "▶ 5/5 Xcode 핸드오프"
if [[ "$OPEN" == "1" ]]; then
  npx cap open ios
  ok "Xcode 실행됨"
else
  warn "Xcode 자동 실행 생략 — 수동: cd frontend && npx cap open ios"
fi

cat <<'NEXT'

──────────────────────────────────────────────────────
다음 (Xcode 에서 수동, 서명 필요):
  1. App 타깃 → Signing & Capabilities → Team 선택 (자동 서명)
  2. 디바이스 타깃을 "Any iOS Device (arm64)" 로
  3. Product → Archive
  4. Organizer → Distribute App → TestFlight & App Store → Upload
  5. App Store Connect → TestFlight → 내부 테스터 그룹에 빌드 할당
세부 체크리스트: docs/RUNBOOK.md §10
──────────────────────────────────────────────────────
NEXT
