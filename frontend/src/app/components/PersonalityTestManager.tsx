import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
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
  const [newTest, setNewTest] = useState<PersonalityTest>({
    link: "",
    title: "",
  });

  const handleAddTest = () => {
    if (!newTest.link || !newTest.title) {
      return;
    }
    onChange([...tests, newTest]);
    setNewTest({
      link: "",
      title: "",
    });
    setShowAddForm(false);
  };

  const handleRemoveTest = (index: number) => {
    onChange(tests.filter((_, i) => i !== index));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">나는 이런 사람이에요 (선택)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            MBTI, 에니어그램 등 성격 테스트 결과를 추가해보세요
          </p>
        </div>
        {!showAddForm && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            추가
          </Button>
        )}
      </div>

      {/* Existing Tests */}
      {tests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tests.map((test, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full px-4 py-2"
            >
              <a
                href={test.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-purple-900 hover:text-purple-700 flex items-center gap-1"
              >
                {test.title}
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => handleRemoveTest(index)}
                className="text-purple-600 hover:text-red-600 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Test Form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              성격 테스트 결과 추가
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <Label htmlFor="link">결과 링크 *</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://..."
              value={newTest.link}
              onChange={(e) => setNewTest({ ...newTest, link: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="title">결과 제목 * (예: ENFP - 재기발랄한 활동가)</Label>
            <Input
              id="title"
              placeholder="테스트 결과를 한 줄로 요약해주세요"
              value={newTest.title}
              onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {newTest.title.length}/50자
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAddTest}
              disabled={!newTest.link || !newTest.title}
              className="flex-1"
            >
              추가
            </Button>
            <Button onClick={() => setShowAddForm(false)} variant="outline">
              취소
            </Button>
          </div>
        </div>
      )}

      {tests.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">아직 추가된 테스트 결과가 없습니다</p>
          <p className="text-xs mt-1">성격 테스트 결과를 추가하여 나를 더 잘 표현해보세요</p>
        </div>
      )}
    </section>
  );
}
