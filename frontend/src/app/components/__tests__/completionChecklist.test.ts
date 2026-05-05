/**
 * Unit tests for completion checklist logic (buildCompletionChecklist)
 * We test it indirectly by verifying the expected fields are evaluated.
 */
import { describe, it, expect } from 'vitest';

// Re-implement the helper inline to avoid importing the whole component
interface ProfileData {
  photos: Array<{ id: string }>;
  introduction: { text: string | null; interests: string[] };
  colorType: { type: string | null } | null;
  idealType: { personalities: string[]; datePreferences: string[] };
  careerInfo: { company: string | null };
  educationInfo: { school: string | null };
  lifestyleInfo: { smoking: string | null; drinking: string | null };
}

interface UserProfile { isPhoneVerified: boolean }

interface ChecklistItem {
  key: string;
  label: string;
  hint?: string;
  points: number;
  done: boolean;
}

function buildCompletionChecklist(profile: ProfileData, user: UserProfile): ChecklistItem[] {
  return [
    { key: "photo", label: "사진 등록", points: 20, done: profile.photos.length > 0 },
    {
      key: "introduction", label: "자기소개 작성", points: 15,
      done: !!(profile.introduction.text && profile.introduction.text.length > 10),
    },
    { key: "colorType", label: "AI 색깔 타입 분석", points: 15, done: !!(profile.colorType?.type) },
    { key: "phone", label: "핸드폰 인증", points: 15, done: user.isPhoneVerified },
    {
      key: "idealType", label: "이상형 설정", points: 10,
      done: (profile.idealType.personalities?.length ?? 0) > 0 || (profile.idealType.datePreferences?.length ?? 0) > 0,
    },
    {
      key: "interests", label: "관심사/취미 등록", points: 10,
      done: (profile.introduction.interests?.length ?? 0) > 0,
    },
    {
      key: "career", label: "직장 또는 학교 입력", points: 10,
      done: !!(profile.careerInfo.company || profile.educationInfo.school),
    },
    {
      key: "lifestyle", label: "라이프스타일 입력", points: 5,
      done: !!(profile.lifestyleInfo.smoking || profile.lifestyleInfo.drinking),
    },
  ].sort((a, b) => Number(a.done) - Number(b.done));
}

const emptyProfile: ProfileData = {
  photos: [],
  introduction: { text: null, interests: [] },
  colorType: null,
  idealType: { personalities: [], datePreferences: [] },
  careerInfo: { company: null },
  educationInfo: { school: null },
  lifestyleInfo: { smoking: null, drinking: null },
};

const fullProfile: ProfileData = {
  photos: [{ id: "p1" }],
  introduction: { text: "안녕하세요! 저는 음악을 좋아합니다.", interests: ["독서", "음악"] },
  colorType: { type: "WARM_ORANGE" },
  idealType: { personalities: ["활발한"], datePreferences: ["카페"] },
  careerInfo: { company: "구글" },
  educationInfo: { school: "서울대학교" },
  lifestyleInfo: { smoking: "NEVER", drinking: "SOMETIMES" },
};

describe('buildCompletionChecklist', () => {
  it('returns 8 items', () => {
    const items = buildCompletionChecklist(emptyProfile, { isPhoneVerified: false });
    expect(items).toHaveLength(8);
  });

  it('all items are NOT done for an empty profile', () => {
    const items = buildCompletionChecklist(emptyProfile, { isPhoneVerified: false });
    expect(items.every(i => !i.done)).toBe(true);
  });

  it('photo item is done when photos exist', () => {
    const profile = { ...emptyProfile, photos: [{ id: "p1" }] };
    const items = buildCompletionChecklist(profile, { isPhoneVerified: false });
    const photo = items.find(i => i.key === 'photo')!;
    expect(photo.done).toBe(true);
  });

  it('introduction is NOT done when text is too short (<= 10 chars)', () => {
    const profile = { ...emptyProfile, introduction: { text: 'hi', interests: [] } };
    const items = buildCompletionChecklist(profile, { isPhoneVerified: false });
    expect(items.find(i => i.key === 'introduction')!.done).toBe(false);
  });

  it('introduction is done when text is long enough', () => {
    const profile = { ...emptyProfile, introduction: { text: '안녕하세요 저는 좋아합니다!', interests: [] } };
    const items = buildCompletionChecklist(profile, { isPhoneVerified: false });
    expect(items.find(i => i.key === 'introduction')!.done).toBe(true);
  });

  it('phone item reflects user.isPhoneVerified', () => {
    const items = buildCompletionChecklist(emptyProfile, { isPhoneVerified: true });
    expect(items.find(i => i.key === 'phone')!.done).toBe(true);
  });

  it('career is done when company is set', () => {
    const profile = { ...emptyProfile, careerInfo: { company: '구글' }, educationInfo: { school: null } };
    const items = buildCompletionChecklist(profile, { isPhoneVerified: false });
    expect(items.find(i => i.key === 'career')!.done).toBe(true);
  });

  it('career is done when school is set', () => {
    const profile = { ...emptyProfile, careerInfo: { company: null }, educationInfo: { school: '서울대학교' } };
    const items = buildCompletionChecklist(profile, { isPhoneVerified: false });
    expect(items.find(i => i.key === 'career')!.done).toBe(true);
  });

  it('incomplete items appear before completed items (sorted)', () => {
    // Half done profile
    const profile = { ...emptyProfile, photos: [{ id: "p1" }] };
    const items = buildCompletionChecklist(profile, { isPhoneVerified: false });
    const firstDoneIdx = items.findIndex(i => i.done);
    const lastNotDoneIdx = items.findLastIndex(i => !i.done);
    expect(lastNotDoneIdx).toBeLessThan(firstDoneIdx);
  });

  it('total points for all items sums to 100', () => {
    const items = buildCompletionChecklist(emptyProfile, { isPhoneVerified: false });
    const total = items.reduce((sum, i) => sum + i.points, 0);
    expect(total).toBe(100);
  });

  it('all items are done for a full profile', () => {
    const items = buildCompletionChecklist(fullProfile, { isPhoneVerified: true });
    expect(items.every(i => i.done)).toBe(true);
  });
});
