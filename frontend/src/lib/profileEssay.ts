/**
 * 프로필 상세 — Q&A 없이 1인칭 산문 + 사진 인터리브 블록 생성
 */

export interface InterviewAnswers {
  hobby: string | null;
  charm: string | null;
  passion: string | null;
  happiness: string | null;
  motto: string | null;
}

export interface EssayBlock {
  type: "text" | "photo";
  content: string;
  photoUrl?: string;
}

export function buildProfileEssay(
  introText: string | null | undefined,
  interviewAnswers: InterviewAnswers | null | undefined,
  extraPhotos: Array<{ id: string; url: string }>,
): EssayBlock[] {
  const paragraphs: string[] = [];

  if (introText?.trim()) {
    introText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => paragraphs.push(p));
  }

  if (interviewAnswers) {
    const beats = [
      interviewAnswers.hobby,
      interviewAnswers.charm,
      interviewAnswers.passion,
      interviewAnswers.happiness,
      interviewAnswers.motto,
    ];
    beats
      .filter((a): a is string => !!a && a.trim().length > 0)
      .forEach((a) => paragraphs.push(a.trim()));
  }

  if (paragraphs.length === 0 && extraPhotos.length === 0) return [];

  const blocks: EssayBlock[] = [];
  let photoIdx = 0;

  paragraphs.forEach((text, i) => {
    blocks.push({ type: "text", content: text });
    if (extraPhotos[photoIdx]) {
      blocks.push({
        type: "photo",
        content: "",
        photoUrl: extraPhotos[photoIdx].url,
      });
      photoIdx++;
    } else if (i === paragraphs.length - 1) {
      // 마지막 문단 뒤에 남은 사진이 있으면 이어서
      while (photoIdx < extraPhotos.length) {
        blocks.push({
          type: "photo",
          content: "",
          photoUrl: extraPhotos[photoIdx].url,
        });
        photoIdx++;
      }
    }
  });

  // 문단 없이 사진만 있는 경우
  if (paragraphs.length === 0) {
    extraPhotos.forEach((p) => {
      blocks.push({ type: "photo", content: "", photoUrl: p.url });
    });
  } else {
    while (photoIdx < extraPhotos.length) {
      blocks.push({
        type: "photo",
        content: "",
        photoUrl: extraPhotos[photoIdx].url,
      });
      photoIdx++;
    }
  }

  return blocks;
}

export function buildHeroSpecLine(profile: {
  basicInfo: { height: number | null; mbti: string };
  careerInfo: { category: string | null };
  locationInfo: { sido: string | null; sigungu: string | null };
}, formatJob: (category: string | null) => string | null): string {
  const parts: string[] = [];
  if (profile.basicInfo.height) parts.push(`${profile.basicInfo.height}cm`);
  const job = formatJob(profile.careerInfo.category);
  if (job) parts.push(job);
  const loc = profile.locationInfo.sigungu ?? profile.locationInfo.sido;
  if (loc) parts.push(loc);
  if (profile.basicInfo.mbti?.trim()) parts.push(profile.basicInfo.mbti.trim());
  return parts.join(" · ");
}
