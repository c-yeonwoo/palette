import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AIProfileEnhanceScreen } from '../AIProfileEnhanceScreen';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock api client — post: 생성, get: useOnboardingOptions(폴백 기본값)
vi.mock('../../../lib/api/apiClient', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn().mockResolvedValue({}),
  },
}));

const { api } = await import('../../../lib/api/apiClient');
const { toast } = await import('sonner');

const mockProfileData = {
  introduction: {
    interviewAnswers: {
      passion: '음악 감상',
      happiness: '주말 산책',
    },
    interests: ['MOVIE', 'TRAVEL'],
  },
  idealType: {
    personalities: ['유머있는', '배려심많은'],
    datePreferences: ['CULTURE'],
    importantValues: ['신뢰'],
    dealBreakers: ['거짓말'],
  },
  basicInfo: { mbti: 'ENFP', birthYear: '1995', height: 175, bodyType: 'AVERAGE' },
  careerInfo: { category: 'IT/개발' },
  locationInfo: { region: '서울', district: '강남구' },
  lifestyleInfo: { smoking: 'NEVER', drinking: 'SOMETIMES' },
  photos: [],
};

const mockResult = {
  colorType: 'WARM_ORANGE',
  colorName: '따뜻한 오렌지',
  colorHex: '#F97316',
  colorDescription: '열정적이고 따뜻한 에너지의 소유자예요.',
  generatedIntroduction: '안녕하세요! 음악을 사랑하는 개발자입니다.',
};

function renderScreen(extraProps = {}) {
  return render(
    <AIProfileEnhanceScreen
      onComplete={vi.fn()}
      introMethod="INTERVIEW"
      profileData={mockProfileData}
      {...extraProps}
    />
  );
}

describe('AIProfileEnhanceScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('인터뷰 직후 자동 생성 — 진입하면 바로 로딩이 보인다 (수동 버튼 없음)', async () => {
    let rejectFn: (e: Error) => void;
    const neverResolves = new Promise<never>((_, reject) => { rejectFn = reject; });
    (api.post as ReturnType<typeof vi.fn>).mockReturnValue(neverResolves);

    renderScreen();

    // 자동 생성이 시작돼 첫 로딩 스텝이 보임
    expect(await screen.findByText('답변을 하나하나 읽고 있어요')).toBeInTheDocument();
    // 옛 수동 "생성하기" 버튼은 없다
    expect(screen.queryByText('AI 소개글 & 색깔 타입 생성하기')).not.toBeInTheDocument();

    act(() => { rejectFn!(new Error('cleanup')); });
    await waitFor(() => {});
  });

  it('생성 성공 시 색깔 타입 결과 카드를 보여준다', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('따뜻한 오렌지')).toBeInTheDocument();
      expect(screen.getByText('나의 색깔 타입')).toBeInTheDocument();
      expect(screen.getByText('안녕하세요! 음악을 사랑하는 개발자입니다.')).toBeInTheDocument();
    });
  });

  it('전체 프로필 미리보기를 보여준다 (확인용)', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
    renderScreen();

    await waitFor(() => expect(screen.getByText('내 프로필 미리보기')).toBeInTheDocument());
    expect(screen.getByText('ENFP')).toBeInTheDocument();
    expect(screen.getByText('IT/개발')).toBeInTheDocument();
    expect(screen.getByText('175cm')).toBeInTheDocument();
  });

  it('"이대로 확인 — 심사 요청하기" 클릭 시 onComplete 호출 (중간 화면 없음)', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
    const onComplete = vi.fn();
    renderScreen({ onComplete });

    await waitFor(() => expect(screen.getByText('이대로 확인 — 심사 요청하기')).toBeInTheDocument());
    fireEvent.click(screen.getByText('이대로 확인 — 심사 요청하기'));

    expect(onComplete).toHaveBeenCalledWith(mockResult);
  });

  it('"다시 작성 (인터뷰로)" 클릭 시 onRedoAnswers 호출 — 이전 화면 복귀', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
    const onRedoAnswers = vi.fn();
    renderScreen({ onRedoAnswers });

    await waitFor(() => expect(screen.getByText('다시 작성 (인터뷰로)')).toBeInTheDocument());
    fireEvent.click(screen.getByText('다시 작성 (인터뷰로)'));

    expect(onRedoAnswers).toHaveBeenCalled();
  });

  it('공유 버튼 — 클립보드로 복사 (navigator.share 없을 때)', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
    renderScreen();

    await waitFor(() => expect(screen.getByText('공유')).toBeInTheDocument());
    fireEvent.click(screen.getByText('공유'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('따뜻한 오렌지')
      );
    });
  });

  it('생성 실패 시 에러 토스트 + 재시도 버튼', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderScreen();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('생성에 실패했어요. 다시 시도해주세요.');
    });
    expect(await screen.findByText('다시 시도하기')).toBeInTheDocument();
  });

  it('"소개글만 다시"로 재생성할 수 있다', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
    renderScreen();

    await waitFor(() => expect(screen.getByText('소개글만 다시')).toBeInTheDocument());

    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockResult,
      colorName: '차분한 블루',
      colorType: 'CALM_BLUE',
    });
    fireEvent.click(screen.getByText('소개글만 다시'));

    await waitFor(() => expect(screen.getByText('차분한 블루')).toBeInTheDocument());
  });
});
