import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BasicInfoScreen } from '../BasicInfoScreen';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn(), success: vi.fn() }),
}));

// 신원(이름·생일·성별)은 가입 계정에서 prefill → 화면엔 없지만 onNext payload 로 흐름
vi.mock('../../../lib/api/apiClient', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      userId: 'u1',
      nickname: 'Test',
      accountType: 'REGULAR',
      isProfileCompleted: false,
      realName: '홍길동',
      birthDate: '1995-06-15',
      gender: 'MALE',
    }),
  },
}));

describe('BasicInfoScreen', () => {
  const onNext = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function waitForLoad() {
    await waitFor(() => expect(screen.queryByText('정보를 불러오는 중...')).not.toBeInTheDocument());
  }

  it('renders step 1 (외형/성격) first — 신원은 가입에서 받아 생략', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    expect(screen.getByText('조금 더 알려주세요')).toBeInTheDocument();
    expect(screen.getByText('1/2 단계')).toBeInTheDocument();
    // 신원 입력(본명)은 더 이상 노출되지 않음
    expect(screen.queryByPlaceholderText('본명을 입력해주세요')).not.toBeInTheDocument();
  });

  it('shows 1/2 label (2 mini-steps)', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    expect(screen.getByText('1/2 단계')).toBeInTheDocument();
  });

  it('step 1 (외형/성격) is optional — next is enabled immediately', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    const nextBtn = screen.getByRole('button', { name: /다음/ });
    expect(nextBtn).not.toBeDisabled();
  });

  it('step 1 shows height slider, body types and MBTI', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    expect(screen.getByText('슬림')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
  });

  it('shows selected MBTI combined when all 4 letters are chosen', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    fireEvent.click(screen.getByText('E'));
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('F'));
    fireEvent.click(screen.getByText('P'));
    await waitFor(() => expect(screen.getByText('ENFP')).toBeInTheDocument());
  });

  it('advances to step 2 (커리어/위치) and shows job/edu/region chips', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    await waitFor(() => {
      expect(screen.getByText('어디서 무슨 일을 하나요?')).toBeInTheDocument();
      expect(screen.getByText('2/2 단계')).toBeInTheDocument();
    });
    expect(screen.getByText('IT/개발')).toBeInTheDocument();
    expect(screen.getByText('대졸')).toBeInTheDocument();
    expect(screen.getByText('서울')).toBeInTheDocument();
  });

  it('calls onNext with payload incl. account 이름·성별 + step values', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    // Step 1 — 외형/성격
    fireEvent.click(screen.getByText('슬림'));
    fireEvent.click(screen.getByText('E'));
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('F'));
    fireEvent.click(screen.getByText('P'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // Step 2 — 커리어/위치 (필수: 직업·지역)
    await waitFor(() => expect(screen.getByText('어디서 무슨 일을 하나요?')).toBeInTheDocument());
    fireEvent.click(screen.getByText('IT/개발'));
    fireEvent.click(screen.getByText('대졸'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '서울' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '강남구' } });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({
        basicInfo: expect.objectContaining({
          name: '홍길동',   // 가입 계정 prefill (화면 미노출)
          gender: '남성',   // MALE → 남성 매핑
          bodyType: 'SLIM', // ADR 0057 — 칩이 코드를 저장
          mbti: 'ENFP',
        }),
        careerInfo: expect.objectContaining({ category: 'IT/개발' }),
        educationInfo: expect.objectContaining({ level: '대졸' }),
        locationInfo: expect.objectContaining({ region: '서울' }),
      })
    );
  });

  it('back button on step 1 calls onBack prop', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    fireEvent.click(screen.getByLabelText('뒤로 가기'));
    expect(onBack).toHaveBeenCalled();
  });

  it('back button on step 2 goes back to step 1', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: /다음/ }));
    await waitFor(() => expect(screen.getByText('2/2 단계')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('뒤로 가기'));
    await waitFor(() => expect(screen.getByText('1/2 단계')).toBeInTheDocument());
    expect(onBack).not.toHaveBeenCalled();
  });
});
