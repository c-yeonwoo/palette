#!/usr/bin/env bash
# OpenAPI 스펙을 docs/generated/api-spec.json 에 빌드
# springdoc-openapi 가 노출하는 /v3/api-docs 를 받아 저장
#
# 사용법:
#   1. 백엔드 실행 중이어야 함 (localhost:8081 또는 SERVER_URL 환경변수)
#   2. ./scripts/generate-api-spec.sh
#
# CI 통합 (BACKLOG): GitHub Actions 에서 build 단계에 통합
# sot-generator 워커가 PR 머지 후 자동 호출 예정

set -euo pipefail

SERVER_URL="${SERVER_URL:-http://localhost:8081}"
OUT_DIR="$(dirname "$0")/../docs/generated"
OUT_JSON="$OUT_DIR/api-spec.json"
OUT_MD="$OUT_DIR/api-spec.md"

mkdir -p "$OUT_DIR"

echo "=== [1/3] 서버 health 확인 ==="
if ! curl -sf -o /dev/null "$SERVER_URL/actuator/health"; then
  echo "❌ $SERVER_URL/actuator/health 응답 없음. 백엔드 띄운 후 다시."
  echo "   SPRING_PROFILES_ACTIVE=local SERVER_PORT=8081 ./gradlew bootRun"
  exit 1
fi

echo "=== [2/3] OpenAPI JSON 추출 ==="
curl -sf "$SERVER_URL/v3/api-docs" | python3 -m json.tool > "$OUT_JSON"
echo "  saved: $OUT_JSON ($(wc -c < "$OUT_JSON") bytes)"

echo "=== [3/3] Markdown 요약 ==="
python3 <<PYEOF > "$OUT_MD"
import json, sys
with open("$OUT_JSON") as f:
    spec = json.load(f)

print("# API Spec (auto-generated)")
print()
print(f"> 자동 생성됨 — \`scripts/generate-api-spec.sh\`")
print(f"> **직접 수정 금지**. CONVENTIONS §6.3 참조.")
print()
print(f"- Title: {spec.get('info', {}).get('title', 'palette')}")
print(f"- Version: {spec.get('info', {}).get('version', '0.0.1')}")
print(f"- Total paths: {len(spec.get('paths', {}))}")
print()

# 도메인별 그룹핑 (path prefix 기준)
from collections import defaultdict
groups = defaultdict(list)
for path, methods in sorted(spec.get('paths', {}).items()):
    # /api/v1/{group}/...
    parts = path.split('/')
    group = '/'.join(parts[:4]) if len(parts) >= 4 else path
    for method, op in methods.items():
        if method.lower() in ('get','post','put','patch','delete'):
            summary = op.get('summary', '')
            groups[group].append((method.upper(), path, summary))

print("## Endpoints by group")
print()
for group in sorted(groups.keys()):
    print(f"### \`{group}\`")
    print()
    print("| Method | Path | Summary |")
    print("|---|---|---|")
    for method, path, summary in groups[group]:
        print(f"| {method} | \`{path}\` | {summary or '—'} |")
    print()
PYEOF

echo "  saved: $OUT_MD ($(wc -l < "$OUT_MD") lines)"
echo ""
echo "✅ 완료. 보기:"
echo "   $OUT_MD"
echo "   $OUT_JSON (swagger UI: $SERVER_URL/swagger-ui.html)"
