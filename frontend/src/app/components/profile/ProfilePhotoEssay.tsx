import { buildProfileEssay, type InterviewAnswers } from "../../../lib/profileEssay";

interface ProfilePhotoEssayProps {
  introText: string | null | undefined;
  interviewAnswers: InterviewAnswers | null | undefined;
  extraPhotos: Array<{ id: string; url: string }>;
  /** 히어로 위 connection 맥락 한 줄 (공통 친구·관심사 등) */
  contextLine?: string | null;
  accentColor?: string | null;
}

export function ProfilePhotoEssay({
  introText,
  interviewAnswers,
  extraPhotos,
  contextLine,
  accentColor,
}: ProfilePhotoEssayProps) {
  const blocks = buildProfileEssay(introText, interviewAnswers, extraPhotos);
  if (blocks.length === 0 && !contextLine) return null;

  return (
    <div className="-mx-6">
      {contextLine && (
        <p
          className="px-6 mb-4 text-[13px] leading-relaxed"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {contextLine}
        </p>
      )}
      {blocks.map((block, i) =>
        block.type === "text" ? (
          <p
            key={`t-${i}`}
            className="px-6 py-4 text-[15px] leading-[1.75] text-foreground whitespace-pre-line"
          >
            {block.content}
          </p>
        ) : (
          <img
            key={`p-${i}`}
            src={block.photoUrl}
            alt=""
            className="w-full aspect-[4/5] max-h-[460px] object-cover"
            loading="lazy"
          />
        ),
      )}
    </div>
  );
}
