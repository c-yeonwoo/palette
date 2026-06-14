import { FALLBACK_OPTIONS } from "../../lib/onboarding/useOnboardingOptions";
import { jobCategoryLabel } from "../../lib/jobCategory";
import { DATING_STYLE_QUESTION_LABELS, DATING_STYLE_OPTION_LABELS } from "../../lib/datingStyleLabels";

/**
 * 운영자용 프로필 미리보기 렌더 — `/api/v1/admin/users/{id}/profile`(ProfileResponse) 를
 * 사용자 노출과 유사한 구조로 렌더. 칩 라벨은 온보딩과 동일 소스(FALLBACK_OPTIONS/jobCategory)
 * 재사용 → code 가 사람이 읽는 라벨로 표시. 라벨 없는 코드는 원문 fallback.
 */
export interface AdminProfileData {
  basicInfo: { height: number | null; bodyType: string | null; mbti: string | null };
  careerInfo: { category: string | null; company: string | null; position?: string | null; incomeRange: string | null };
  educationInfo: { level: string | null; school: string | null; major: string | null };
  locationInfo: { sido: string | null; sigungu: string | null; hometownSido?: string | null; hometownSigungu?: string | null };
  lifestyleInfo: { smoking: string | null; drinking: string | null; religion: string | null };
  introduction: {
    text: string | null;
    interests: string[] | null;
    interviewAnswers: { hobby: string | null; charm: string | null; passion: string | null; happiness: string | null; motto: string | null } | null;
    datingStyle?: Record<string, string> | null;
  };
  idealType: {
    datePreferences: string[];
    importantValues: string[];
    personalities: string[];
    appearanceStyles: string[];
    dealBreakers: string[];
    bucketList?: string[];
    ageMin?: number | null;
    ageMax?: number | null;
    heightMin?: number | null;
    heightMax?: number | null;
  };
  photos: { id: string; url: string; displayOrder: number; isPrimary: boolean; rejected?: boolean }[];
  primaryPhotoUrl: string | null;
  colorType: {
    name: string | null; hex: string | null; description: string | null;
    reasoning?: string | null; personalitySummary?: string | null; idealTypeInsight?: string | null; strengths?: string[] | null;
  } | null;
  metrics: { completionRate: number; trustScore: number; viewCount: number };
  settings?: { isAcceptingMatches: boolean; detailsVisibleToFriends?: boolean };
}

const EDUCATION_LABEL: Record<string, string> = {
  HIGH_SCHOOL: "고졸", ASSOCIATE: "전문대", BACHELOR: "대졸", MASTER: "석사", DOCTORATE: "박사",
};
const INCOME_LABEL: Record<string, string> = {
  INCOME_RANGE_1: "5천만원 이하", INCOME_RANGE_2: "5천~7.5천만원", INCOME_RANGE_3: "7.5천~9천만원",
  INCOME_RANGE_4: "9천~1.1억원", INCOME_RANGE_5: "1.1억원 이상",
};

function optLabel(setKey: string, code: string | null | undefined): string | null {
  if (!code) return null;
  const found = (FALLBACK_OPTIONS[setKey] ?? []).find((o) => o.code === code);
  return found?.label ?? code;
}
function optLabels(setKey: string, codes: string[] | null | undefined): string[] {
  return (codes ?? []).map((c) => optLabel(setKey, c) ?? c);
}

export function AdminProfilePreview({
  data,
  selectedRejectIds,
  onToggleReject,
}: {
  data: AdminProfileData;
  /** 반려 선택 모드: 선택된 사진 id 목록 (제공 시 사진 클릭으로 토글) */
  selectedRejectIds?: string[];
  onToggleReject?: (photoId: string) => void;
}) {
  const { basicInfo, careerInfo, educationInfo, locationInfo, lifestyleInfo, introduction, idealType, photos, colorType, metrics, settings } = data;
  const selectable = !!onToggleReject;

  const region = [locationInfo.sido, locationInfo.sigungu].filter(Boolean).join(" ") || null;
  const hometown = [locationInfo.hometownSido, locationInfo.hometownSigungu].filter(Boolean).join(" ") || null;
  const ageRange = idealType.ageMin || idealType.ageMax ? `${idealType.ageMin ?? "?"} ~ ${idealType.ageMax ?? "?"}세` : null;
  const heightRange = idealType.heightMin || idealType.heightMax ? `${idealType.heightMin ?? "?"} ~ ${idealType.heightMax ?? "?"}cm` : null;
  const ans = introduction.interviewAnswers;

  return (
    <div className="space-y-5">
      {/* 사진 */}
      <Section title="사진">
        {photos.length > 0 ? (
          <>
            {selectable && (
              <p className="text-xs text-muted-foreground mb-2">
                재촬영을 요청할 사진을 눌러 선택하세요. 선택한 사진만 반려 표시됩니다.
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              {photos.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((p) => {
                const picked = selectedRejectIds?.includes(p.id) ?? false;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={selectable ? () => onToggleReject!(p.id) : undefined}
                    className={`relative block ${selectable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <img
                      src={p.url}
                      alt=""
                      className={`w-24 h-32 object-cover rounded-lg border-2 ${
                        picked ? "border-red-500" : "border-border"
                      }`}
                    />
                    {p.isPrimary && (
                      <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-foreground/80 text-background">대표</span>
                    )}
                    {(picked || p.rejected) && (
                      <span className="absolute bottom-1 left-1 right-1 text-[10px] px-1 py-0.5 rounded bg-red-600 text-white text-center">
                        {picked ? "반려 선택" : "반려됨"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <Empty>등록된 사진 없음</Empty>
        )}
      </Section>

      {/* 색깔 타입 */}
      <Section title="색깔 타입">
        {colorType?.name ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {colorType.hex && <span className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: colorType.hex }} />}
              <span className="font-semibold text-foreground">{colorType.name}</span>
            </div>
            {colorType.description && <p className="text-sm text-muted-foreground">{colorType.description}</p>}
            {colorType.strengths && colorType.strengths.length > 0 && <ChipRow items={colorType.strengths} />}
            {colorType.reasoning && <SubBlock label="분석 근거" text={colorType.reasoning} />}
            {colorType.personalitySummary && <SubBlock label="성향 요약" text={colorType.personalitySummary} />}
            {colorType.idealTypeInsight && <SubBlock label="이상형 인사이트" text={colorType.idealTypeInsight} />}
          </div>
        ) : (
          <Empty>아직 색깔 분석 안 됨</Empty>
        )}
      </Section>

      {/* 기본 정보 */}
      <Section title="기본 정보">
        <Rows rows={[
          ["키", basicInfo.height ? `${basicInfo.height}cm` : null],
          ["체형", optLabel("bodyType", basicInfo.bodyType)],
          ["MBTI", basicInfo.mbti],
          ["직업", jobCategoryLabel(careerInfo.category) ?? careerInfo.category],
          ["직장", careerInfo.company],
          ["직책", careerInfo.position],
          ["소득", careerInfo.incomeRange ? (INCOME_LABEL[careerInfo.incomeRange] ?? careerInfo.incomeRange) : null],
          ["학력", educationInfo.level ? (EDUCATION_LABEL[educationInfo.level] ?? educationInfo.level) : null],
          ["학교", educationInfo.school],
          ["전공", educationInfo.major],
          ["거주지", region],
          ["고향", hometown],
        ]} />
      </Section>

      {/* 라이프스타일 */}
      <Section title="라이프스타일">
        <Rows rows={[
          ["흡연", optLabel("smoking", lifestyleInfo.smoking)],
          ["음주", optLabel("drinking", lifestyleInfo.drinking)],
          ["종교", optLabel("religion", lifestyleInfo.religion)],
        ]} />
        {introduction.interests && introduction.interests.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">관심사</p>
            <ChipRow items={optLabels("interest", introduction.interests)} />
          </div>
        )}
      </Section>

      {/* 자기소개 */}
      <Section title="자기소개">
        {introduction.text ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{introduction.text}</p>
        ) : (
          <Empty>소개글 없음</Empty>
        )}
        {ans && (ans.hobby || ans.charm || ans.passion || ans.happiness || ans.motto) && (
          <div className="mt-3 space-y-2">
            {ans.hobby && <SubBlock label="쉬는 날" text={ans.hobby} />}
            {ans.charm && <SubBlock label="매력 포인트" text={ans.charm} />}
            {ans.passion && <SubBlock label="요즘 빠진 것" text={ans.passion} />}
            {ans.happiness && <SubBlock label="행복한 순간" text={ans.happiness} />}
            {ans.motto && <SubBlock label="좌우명" text={ans.motto} />}
          </div>
        )}
        {introduction.datingStyle && Object.keys(introduction.datingStyle).length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground">데이트 스타일</p>
            {Object.entries(introduction.datingStyle).map(([q, opt]) => (
              <p key={q} className="text-sm text-foreground">
                <span className="text-muted-foreground">{DATING_STYLE_QUESTION_LABELS[q] ?? q}</span>
                {" · "}{DATING_STYLE_OPTION_LABELS[opt] ?? opt}
              </p>
            ))}
          </div>
        )}
      </Section>

      {/* 이상형 */}
      <Section title="이상형">
        <Rows rows={[
          ["나이 범위", ageRange],
          ["키 범위", heightRange],
        ]} />
        <ChipBlock label="데이트 선호" items={optLabels("datePreference", idealType.datePreferences)} />
        <ChipBlock label="중요 가치" items={optLabels("importantValue", idealType.importantValues)} />
        <ChipBlock label="선호 성격" items={optLabels("personality", idealType.personalities)} />
        <ChipBlock label="선호 외모상" items={optLabels("appearanceStyle", idealType.appearanceStyles)} />
        <ChipBlock label="딜브레이커" items={optLabels("dealBreaker", idealType.dealBreakers)} />
        {idealType.bucketList && idealType.bucketList.length > 0 && (
          <ChipBlock label="버킷리스트" items={idealType.bucketList.map((b) => b.replace(/^custom:/, ""))} />
        )}
      </Section>

      {/* 지표 / 설정 */}
      <Section title="지표 · 설정">
        <Rows rows={[
          ["완성도", `${metrics.completionRate}%`],
          ["신뢰 점수", String(metrics.trustScore)],
          ["조회수", String(metrics.viewCount)],
          ["소개받기", settings ? (settings.isAcceptingMatches ? "ON" : "OFF") : null],
        ]} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-muted/20 p-4">
      <h4 className="text-sm font-bold text-foreground mb-2">{title}</h4>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string | null | undefined][] }) {
  const visible = rows.filter(([, v]) => v != null && v !== "");
  if (visible.length === 0) return <Empty>입력 없음</Empty>;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
      {visible.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChipRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span key={`${it}-${i}`} className="text-xs px-2.5 py-1 rounded-full bg-card border border-border text-foreground">
          {it}
        </span>
      ))}
    </div>
  );
}

function ChipBlock({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <ChipRow items={items} />
    </div>
  );
}

function SubBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-card border border-border/60 px-3 py-2">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground/70">{children}</p>;
}
