import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: string[];
  systemMessage?: string;
  temperature: number;
  maxTokens: number;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PromptExecution {
  id: string;
  promptId: string;
  userId?: string;
  input: Record<string, string>;
  output?: string;
  tokensUsed?: number;
  durationMs?: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export function PromptManagementScreen() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [executions, setExecutions] = useState<PromptExecution[]>([]);
  const [loading, setLoading] = useState(false);

  // 새 프롬프트 생성 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    description: '',
    category: 'PROFILE_SUMMARY',
    template: '',
    variables: '',
    systemMessage: '',
    temperature: 0.7,
    maxTokens: 1000
  });

  // 프롬프트 실행 상태
  const [showExecuteForm, setShowExecuteForm] = useState(false);
  const [executeInput, setExecuteInput] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      toast.error('프롬프트 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadExecutions = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}/executions`);
      const data = await response.json();
      setExecutions(data);
    } catch (error) {
      toast.error('실행 이력을 불러오는데 실패했습니다.');
    }
  };

  const createPrompt = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPrompt,
          variables: newPrompt.variables.split(',').map(v => v.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        toast.success('프롬프트가 생성되었습니다.');
        setShowCreateForm(false);
        setNewPrompt({
          name: '',
          description: '',
          category: 'PROFILE_SUMMARY',
          template: '',
          variables: '',
          systemMessage: '',
          temperature: 0.7,
          maxTokens: 1000
        });
        loadPrompts();
      } else {
        toast.error('프롬프트 생성에 실패했습니다.');
      }
    } catch (error) {
      toast.error('프롬프트 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const executePrompt = async () => {
    if (!selectedPrompt) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/prompts/${selectedPrompt.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: executeInput })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`실행 완료! 토큰 사용: ${result.tokensUsed}`);
        setShowExecuteForm(false);
        setExecuteInput({});
        loadExecutions(selectedPrompt.id);
      } else {
        toast.error('프롬프트 실행에 실패했습니다.');
      }
    } catch (error) {
      toast.error('프롬프트 실행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const activatePrompt = async (id: string) => {
    try {
      const response = await fetch(`/api/prompts/${id}/activate`, { method: 'POST' });
      if (response.ok) {
        toast.success('프롬프트가 활성화되었습니다.');
        loadPrompts();
      }
    } catch (error) {
      toast.error('프롬프트 활성화에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">프롬프트 관리</h1>
          <p className="text-gray-600">AI 프롬프트 템플릿을 생성, 관리, 실행하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프롬프트 목록 */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">프롬프트 템플릿</h2>
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                + 새로 만들기
              </Button>
            </div>

            <div className="space-y-2">
              {prompts.map(prompt => (
                <div
                  key={prompt.id}
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    loadExecutions(prompt.id);
                  }}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedPrompt?.id === prompt.id
                      ? 'bg-purple-100 border-2 border-purple-400'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{prompt.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {prompt.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {prompt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 프롬프트 상세 */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            {selectedPrompt ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedPrompt.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedPrompt.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPrompt.status === 'DRAFT' && (
                      <Button onClick={() => activatePrompt(selectedPrompt.id)} variant="outline" size="sm">
                        활성화
                      </Button>
                    )}
                    <Button onClick={() => setShowExecuteForm(true)} size="sm">
                      실행
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">템플릿</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {selectedPrompt.template}
                    </pre>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">변수</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPrompt.variables.map(variable => (
                          <span key={variable} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">설정</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Temperature: {selectedPrompt.temperature}</div>
                        <div>Max Tokens: {selectedPrompt.maxTokens}</div>
                        <div>Version: {selectedPrompt.version}</div>
                      </div>
                    </div>
                  </div>

                  {selectedPrompt.systemMessage && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">시스템 메시지</h3>
                      <p className="bg-gray-50 p-4 rounded-lg text-sm">{selectedPrompt.systemMessage}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">실행 이력</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {executions.map(execution => (
                        <div key={execution.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              execution.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                              execution.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {execution.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(execution.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {execution.output && (
                            <p className="text-sm text-gray-700 mt-2">{execution.output}</p>
                          )}
                          {execution.tokensUsed && (
                            <p className="text-xs text-gray-500 mt-1">
                              토큰: {execution.tokensUsed} | 소요시간: {execution.durationMs}ms
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-20">
                프롬프트를 선택하세요
              </div>
            )}
          </div>
        </div>

        {/* 프롬프트 생성 모달 */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">새 프롬프트 생성</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">이름</label>
                  <Input
                    value={newPrompt.name}
                    onChange={e => setNewPrompt({ ...newPrompt, name: e.target.value })}
                    placeholder="프롬프트 이름"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <Input
                    value={newPrompt.description}
                    onChange={e => setNewPrompt({ ...newPrompt, description: e.target.value })}
                    placeholder="프롬프트 설명"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">카테고리</label>
                  <select
                    value={newPrompt.category}
                    onChange={e => setNewPrompt({ ...newPrompt, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="PROFILE_SUMMARY">프로필 요약</option>
                    <option value="IDEAL_TYPE_ANALYSIS">이상형 분석</option>
                    <option value="INTRODUCTION_ENHANCEMENT">자기소개 향상</option>
                    <option value="COLOR_TYPE_RECOMMENDATION">색깔 타입 추천</option>
                    <option value="MATCH_REASON">매칭 추천 이유</option>
                    <option value="INTERVIEW_QUESTION">AI 인터뷰 질문</option>
                    <option value="GENERAL">일반</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">템플릿</label>
                  <Textarea
                    value={newPrompt.template}
                    onChange={e => setNewPrompt({ ...newPrompt, template: e.target.value })}
                    placeholder="프롬프트 템플릿 (변수는 {변수명} 형식으로 입력)"
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">변수 (쉼표로 구분)</label>
                  <Input
                    value={newPrompt.variables}
                    onChange={e => setNewPrompt({ ...newPrompt, variables: e.target.value })}
                    placeholder="age, job, hobbies"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">시스템 메시지 (선택)</label>
                  <Textarea
                    value={newPrompt.systemMessage}
                    onChange={e => setNewPrompt({ ...newPrompt, systemMessage: e.target.value })}
                    placeholder="시스템 메시지"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Temperature</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={newPrompt.temperature}
                      onChange={e => setNewPrompt({ ...newPrompt, temperature: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Tokens</label>
                    <Input
                      type="number"
                      value={newPrompt.maxTokens}
                      onChange={e => setNewPrompt({ ...newPrompt, maxTokens: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={createPrompt} disabled={loading} className="flex-1">
                  {loading ? '생성 중...' : '생성'}
                </Button>
                <Button onClick={() => setShowCreateForm(false)} variant="outline" className="flex-1">
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 프롬프트 실행 모달 */}
        {showExecuteForm && selectedPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">프롬프트 실행</h2>

              <div className="space-y-4">
                {selectedPrompt.variables.map(variable => (
                  <div key={variable}>
                    <label className="block text-sm font-medium mb-1">{variable}</label>
                    <Input
                      value={executeInput[variable] || ''}
                      onChange={e => setExecuteInput({ ...executeInput, [variable]: e.target.value })}
                      placeholder={`${variable} 값 입력`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={executePrompt} disabled={loading} className="flex-1">
                  {loading ? '실행 중...' : '실행'}
                </Button>
                <Button onClick={() => setShowExecuteForm(false)} variant="outline" className="flex-1">
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
