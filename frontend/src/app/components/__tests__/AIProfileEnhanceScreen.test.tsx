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

// Mock api client
vi.mock('../../../lib/api/apiClient', () => ({
  api: {
    post: vi.fn(),
  },
}));

const { api } = await import('../../../lib/api/apiClient');
const { toast } = await import('sonner');

const mockProfileData = {
  introduction: {
    interviewAnswers: {
      job: '개발자',
      passion: '음악 감상',
    },
  },
  idealType: {
    personalities: ['유머있는', '배려심 있는'],
    datePreferences: ['카페 투어'],
    importantValues: ['신뢰'],
    dealBreakers: ['거짓말'],
  },
};

const mockResult = {
  colorType: 'WARM_ORANGE',
  colorName: '따뜻한 오렌지',
  colorHex: '#F97316',
  colorDescription: '열정적이고 따뜻한 에너지의 소유자예요.',
  generatedIntroduction: '안녕하세요! 음악을 사랑하는 개발자입니다.',
};

describe('AIProfileEnhanceScreen', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
    // Remove navigator.share to test clipboard fallback
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders AI generation button initially', () => {
    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );
    expect(screen.getByText('AI 소개글 & 색깔 타입 생성하기')).toBeInTheDocument();
    expect(screen.getByText('건너뛰기 (나중에 직접 작성)')).toBeInTheDocument();
  });

  it('shows first loading step immediately after generation starts', async () => {
    // This promise never resolves so we can inspect the loading UI
    let rejectFn: (e: Error) => void;
    const neverResolves = new Promise<never>((_, reject) => { rejectFn = reject; });
    (api.post as ReturnType<typeof vi.fn>).mockReturnValue(neverResolves);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));

    // First loading step should be visible immediately
    expect(screen.getByText('답변을 하나하나 읽고 있어요')).toBeInTheDocument();
    expect(screen.getByText('잠깐이면 돼요, 거의 다 됐어요')).toBeInTheDocument();

    // Cleanup: reject the dangling promise
    act(() => { rejectFn!(new Error('cleanup')); });
    await waitFor(() => {}); // flush
  });

  it('shows color type result card after successful generation', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));

    await waitFor(() => {
      expect(screen.getByText('따뜻한 오렌지')).toBeInTheDocument();
      expect(screen.getByText('열정적이고 따뜻한 에너지의 소유자예요.')).toBeInTheDocument();
      expect(screen.getByText('안녕하세요! 음악을 사랑하는 개발자입니다.')).toBeInTheDocument();
    });
  });

  it('shows "나의 색깔 타입" label in result', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));

    await waitFor(() => {
      expect(screen.getByText('나의 색깔 타입')).toBeInTheDocument();
    });
  });

  it('shows share button in result', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));

    await waitFor(() => {
      expect(screen.getByText('공유')).toBeInTheDocument();
    });
  });

  it('copies share text to clipboard when share button clicked (no navigator.share)', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));
    await waitFor(() => expect(screen.getByText('공유')).toBeInTheDocument());

    fireEvent.click(screen.getByText('공유'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('따뜻한 오렌지')
      );
    });
  });

  it('shows "what next" guide when 완료하기 is clicked', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));
    await waitFor(() => expect(screen.getByText('이 소개글로 완료하기')).toBeInTheDocument());

    fireEvent.click(screen.getByText('이 소개글로 완료하기'));

    await waitFor(() => {
      expect(screen.getByText('프로필 완성!')).toBeInTheDocument();
      expect(screen.getByText('이제 이런 것들을 할 수 있어요')).toBeInTheDocument();
      expect(screen.getByText('매칭 요청을 받아볼 수 있어요')).toBeInTheDocument();
      expect(screen.getByText('팔레트 시작하기')).toBeInTheDocument();
    });
  });

  it('calls onComplete when "팔레트 시작하기" is clicked', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));
    await waitFor(() => expect(screen.getByText('이 소개글로 완료하기')).toBeInTheDocument());
    fireEvent.click(screen.getByText('이 소개글로 완료하기'));
    await waitFor(() => expect(screen.getByText('팔레트 시작하기')).toBeInTheDocument());
    fireEvent.click(screen.getByText('팔레트 시작하기'));

    expect(onComplete).toHaveBeenCalledWith(mockResult);
  });

  it('skip assigns SOFT_PINK and shows toast', async () => {
    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('건너뛰기 (나중에 직접 작성)'));

    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('소프트 핑크'),
      expect.any(Object)
    );
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ colorType: 'SOFT_PINK' })
    );
  });

  it('shows error toast on generation failure', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('생성에 실패했어요. 다시 시도해주세요.');
    });
  });

  it('allows re-generation after success', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    fireEvent.click(screen.getByText('AI 소개글 & 색깔 타입 생성하기'));
    await waitFor(() => expect(screen.getByText('다시 생성하기')).toBeInTheDocument());

    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockResult,
      colorName: '차분한 블루',
      colorType: 'CALM_BLUE',
    });

    fireEvent.click(screen.getByText('다시 생성하기'));
    await waitFor(() => {
      expect(screen.getByText('차분한 블루')).toBeInTheDocument();
    });
  });

  it('toggles input detail panel', () => {
    render(
      <AIProfileEnhanceScreen
        onComplete={onComplete}
        introMethod="INTERVIEW"
        profileData={mockProfileData}
      />
    );

    const toggle = screen.getByText('입력한 내용 확인');
    fireEvent.click(toggle);
    expect(screen.getByText('개발자')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('개발자')).not.toBeInTheDocument();
  });
});
