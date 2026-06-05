# Palette 로고 — 샘플 & 결정

## 최종 채택: `final2-*` — 필기체 P (gold on charcoal)

- 컨셉: 필기체 'P' monogram — 프리미엄 (향수/주얼리 브랜드 톤)
- 색: gold `#C9A86A` on charcoal `#2E2A24`
- 출처: macOS **Snell Roundhand** 'P' 글리프를 `fontTools` 로 SVG path vectorize
  (폰트 독립적 — 모든 플랫폼 동일 렌더)

### ⚠️ 폰트 라이선스 고지
Snell Roundhand 는 **Monotype** 폰트. 글리프 outline 을 로고로 상업적 사용 시
라이선스 확인 필요. 현재는 **베타/프로토타입** 단계 — 정식 출시 전:
- (a) Monotype 로고 라이선스 확보, 또는
- (b) 디자이너가 이 형태를 참고해 **커스텀 lettering** 으로 재제작 (권장)

### 적용 위치
- `frontend/src/app/components/LoginScreen.tsx` — 인라인 SVG path (92px)
- `frontend/public/pwa-icon.svg` — 앱아이콘 (charcoal rounded square + gold P)
- `vite.config.ts` manifest — theme_color `#2E2A24`, background `#2E2A24` (예정)

---

## 후보 히스토리 (검토 기록)

| 파일 | 컨셉 | 결과 |
|------|------|------|
| `A-overlap` / `A2-overlap-mix` | 두 색 원 겹침 + 제3색 | ❌ "빨강+파랑 겹침" 진부 |
| `B-spectrum-arc` | 8 color types 호 | ❌ 축소 시 뭉개짐 |
| `C-brushstroke` | 붓터치 ∞ | ❌ 형태 모호 |
| `D1-knot` / `D2-link-dots` / `D3-triad-link` | 연결/매듭 | ❌ |
| `D3b` / `E1` / `E2` / `E3` | 삼각 연결 (주선 3자) | ❌ "share 아이콘" 연상 |
| `P-explore` | 프리미엄 폰트 6종 탐색 | Snell Roundhand 선택 |
| **`final2-app-icon` / `final2-mark`** | **필기체 P (gold)** | ✅ **채택** |

## 재생성 방법 (path vectorize)
```python
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
font = TTFont("/System/Library/Fonts/Supplemental/SnellRoundhand.ttc", fontNumber=0)
gs = font.getGlyphSet(); g = gs[font.getBestCmap()[ord("P")]]
pen = SVGPathPen(gs); g.draw(pen); print(pen.getCommands())
# transform: translate(58.76 399.54) scale(0.4038 -0.4038)  ← Y flip + 중앙배치 (512 캔버스, P height 300)
```
