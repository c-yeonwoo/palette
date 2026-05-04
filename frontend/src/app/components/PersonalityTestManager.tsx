import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, X, ExternalLink, Sparkles } from "lucide-react";

interface PersonalityTest {
  link: string;
  title: string;
}

interface PersonalityTestManagerProps {
  tests: PersonalityTest[];
  onChange: (tests: PersonalityTest[]) => void;
}

export function PersonalityTestManager({ tests, onChange }: PersonalityTestManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTest, setNewTest] = useState<PersonalityTest>({ link: "", title: "" });

  const handleAddTest = () => {
    if (!newTest.link || !newTest.title) return;
    onChange([...tests, newTest]);
    setNewTest({ link: "", title: "" });
    setShowAddForm(false);
  };

  const handleRemoveTest = (index: number) => {
    onChange(tests.filter((_, i) => i !== index));
  };

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span>🧠</span>
            <span>성격 테스트 결과</span>
            <span className="text-xs font-normal text-muted-foreground">(선택)</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            MBTI, 에니어그램 등 나를 더 잘 표현해보세요
          </p>
        </div>
        {!showAddForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="shrink-0 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </Button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* 추가된 테스트 목록 */}
        {tests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tests.map((test, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 bg-muted border border-border rounded-full px-3.5 py-2"
              >
                <a
                  href={test.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                >
                  {test.title}
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
                <button
                  onClick={() => handleRemoveTest(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                  aria-label="삭제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 추가 폼 */}
        {showAddForm && (
          <div className="bg-muted border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                테스트 결과 추가
              </p>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label
                htmlFor="test-link"
                className="block mb-2 text-sm font-semibold text-foreground"
              >
                결과 링크
              </label>
              <Input
                id="test-link"
                type="url"
                placeholder="https://..."
                value={newTest.link}
                onChange={(e) => setNewTest({ ...newTest, link: e.target.value })}
              />
            </div>

            <div>
              <label
                htmlFor="test-title"
                className="block mb-2 text-sm font-semibold text-foreground"
              >
                결과 제목
              </label>
              <Input
                id="test-title"
                placeholder="예) ENFP - 재기발랄한 활동가"
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {newTest.title.length}/50자
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleAddTest}
                disabled={!newTest.link || !newTest.title}
                className="flex-1"
              >
                추가하기
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 빈 상태 — 버튼 중앙 배치 */}
        {tests.length === 0 && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-7 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted transition-all group"
          >
            <Sparkles className="w-9 h-9 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                성격 테스트 결과 추가하기
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                MBTI · 에니어그램 · 버즈피드 등 뭐든 OK
              </p>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
