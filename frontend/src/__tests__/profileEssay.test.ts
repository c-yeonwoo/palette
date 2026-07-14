import { describe, it, expect } from "vitest";
import { buildProfileEssay, buildHeroSpecLine } from "../lib/profileEssay";

describe("buildProfileEssay", () => {
  it("merges intro and interview without Q labels", () => {
    const blocks = buildProfileEssay(
      "첫 문단입니다.",
      { hobby: "등산을 해요", charm: null, passion: null, happiness: null, motto: null },
      [{ id: "1", url: "https://example.com/a.jpg" }],
    );
    expect(blocks.filter((b) => b.type === "text").map((b) => b.content)).toEqual([
      "첫 문단입니다.",
      "등산을 해요",
    ]);
    expect(blocks.some((b) => b.type === "photo")).toBe(true);
  });

  it("returns empty when no content", () => {
    expect(buildProfileEssay(null, null, [])).toEqual([]);
  });
});

describe("buildHeroSpecLine", () => {
  it("joins core specs with middle dot", () => {
    const line = buildHeroSpecLine(
      {
        basicInfo: { height: 168, mbti: "INFP" },
        careerInfo: { category: "DESIGN" },
        locationInfo: { sido: "서울", sigungu: "성동구" },
      },
      () => "디자이너",
    );
    expect(line).toBe("168cm · 디자이너 · 성동구 · INFP");
  });
});
