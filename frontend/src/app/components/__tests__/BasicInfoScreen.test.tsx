import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BasicInfoScreen } from '../BasicInfoScreen';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn(), success: vi.fn() }),
}));

vi.mock('../../../lib/api/apiClient', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      userId: 'u1',
      nickname: 'Test',
      accountType: 'REGULAR',
      isProfileCompleted: false,
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

  it('renders step 1 (신원) first with correct title', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    expect(screen.getByText('나를 소개할게요')).toBeInTheDocument();
    expect(screen.getByText('이름, 생년월일, 성별')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('본명을 입력해주세요')).toBeInTheDocument();
  });

  it('shows 4 mini-step dots', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    // Step indicator "1/4 단계"
    expect(screen.getByText('1/4 단계')).toBeInTheDocument();
  });

  it('next button is disabled when step 1 fields are empty', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();
    const nextBtn = screen.getByRole('button', { name: /다음/ });
    expect(nextBtn).toBeDisabled();
  });

  it('advances to step 2 when step 1 is complete', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    // Fill name
    fireEvent.change(screen.getByPlaceholderText('본명을 입력해주세요'), {
      target: { value: '홍길동' },
    });

    // Select year/month/day (find selects)
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1995' } }); // year
    fireEvent.change(selects[1], { target: { value: '06' } });   // month
    fireEvent.change(selects[2], { target: { value: '15' } });   // day

    // Select gender
    fireEvent.click(screen.getByText('남성'));

    // Next should now be enabled
    const nextBtn = screen.getByRole('button', { name: /다음/ });
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);

    // Should show step 2
    await waitFor(() => {
      expect(screen.getByText('조금 더 알려주세요')).toBeInTheDocument();
      expect(screen.getByText('2/4 단계')).toBeInTheDocument();
    });
  });

  it('step 2 shows height slider, body types and MBTI', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    // Go to step 2 quickly via filling step 1
    fireEvent.change(screen.getByPlaceholderText('본명을 입력해주세요'), {
      target: { value: '홍길동' },
    });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1995' } });
    fireEvent.change(selects[1], { target: { value: '06' } });
    fireEvent.change(selects[2], { target: { value: '15' } });
    fireEvent.click(screen.getByText('여성'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    await waitFor(() => expect(screen.getByText('조금 더 알려주세요')).toBeInTheDocument());

    expect(screen.getByText('슬림')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
  });

  it('shows selected MBTI combined when all 4 letters are chosen', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    // Navigate to step 2
    fireEvent.change(screen.getByPlaceholderText('본명을 입력해주세요'), { target: { value: '홍길동' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1995' } });
    fireEvent.change(selects[1], { target: { value: '06' } });
    fireEvent.change(selects[2], { target: { value: '15' } });
    fireEvent.click(screen.getByText('남성'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    await waitFor(() => expect(screen.getByText('조금 더 알려주세요')).toBeInTheDocument());

    fireEvent.click(screen.getByText('E'));
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('F'));
    fireEvent.click(screen.getByText('P'));

    await waitFor(() => {
      expect(screen.getByText('ENFP')).toBeInTheDocument();
    });
  });

  it('step 3 shows job chips, education chips, region chips', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    // Skip to step 3: step1 -> step2 -> step3
    // Step 1
    fireEvent.change(screen.getByPlaceholderText('본명을 입력해주세요'), { target: { value: '홍길동' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1995' } });
    fireEvent.change(selects[1], { target: { value: '06' } });
    fireEvent.change(selects[2], { target: { value: '15' } });
    fireEvent.click(screen.getByText('남성'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    await waitFor(() => expect(screen.getByText('조금 더 알려주세요')).toBeInTheDocument());

    // Step 2
    fireEvent.click(screen.getByText('탄탄'));
    fireEvent.click(screen.getByText('I'));
    fireEvent.click(screen.getByText('S'));
    fireEvent.click(screen.getByText('T'));
    fireEvent.click(screen.getByText('J'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    await waitFor(() => expect(screen.getByText('어디서 무슨 일을 하나요?')).toBeInTheDocument());
    expect(screen.getByText('IT/개발')).toBeInTheDocument();
    expect(screen.getByText('대졸')).toBeInTheDocument();
    expect(screen.getByText('서울')).toBeInTheDocument();
  });

  it('step 4 shows optional fields and skip button', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('본명을 입력해주세요'), { target: { value: '홍길동' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1995' } });
    fireEvent.change(selects[1], { target: { value: '06' } });
    fireEvent.change(selects[2], { target: { value: '15' } });
    fireEvent.click(screen.getByText('남성'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // Step 2
    await waitFor(() => expect(screen.getByText('조금 더 알려주세요')).toBeInTheDocument());
    fireEvent.click(screen.getByText('슬림'));
    fireEvent.click(screen.getByText('E'));
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('F'));
    fireEvent.click(screen.getByText('P'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // Step 3
    await waitFor(() => expect(screen.getByText('어디서 무슨 일을 하나요?')).toBeInTheDocument());
    fireEvent.click(screen.getByText('IT/개발'));
    fireEvent.click(screen.getByText('대졸'));
    fireEvent.click(screen.getByText('서울'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // Step 4
    await waitFor(() => expect(screen.getByText('마지막 단계예요')).toBeInTheDocument());
    expect(screen.getByText('지금은 건너뛰기 (나중에 마이프로필에서 추가)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('010-1234-5678')).toBeInTheDocument();
  });

  it('calls onNext with correct payload when step 4 is submitted', async () => {
    render(<BasicInfoScreen onNext={onNext} onBack={onBack} />);
    await waitForLoad();

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('본명을 입력해주세요'), { target: { value: '홍길동' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1995' } });
    fireEvent.change(selects[1], { target: { value: '06' } });
    fireEvent.change(selects[2], { target: { value: '15' } });
    fireEvent.click(screen.getByText('남성'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // Step 2
    await waitFor(() => expect(screen.getByText('조금 더 알려주세요')).toBeInTheDocument());
    fireEvent.click(screen.getByText('슬림'));
    fireEvent.click(screen.getByText('E'));
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('F'));
    fireEvent.click(screen.getByText('P'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // Step 3
    await waitFor(() => expect(screen.getByText('어디서 무슨 일을 하나요?')).toBeInTheDocument());
    fireEvent.click(screen.getByText('IT/개발'));
    fireEvent.click(screen.getByText('대졸'));
    fireEvent.click(screen.getByText('서울'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // Step 4 — submit
    await waitFor(() => expect(screen.getByText('다음 — 사진 등록')).toBeInTheDocument());
    fireEvent.click(screen.getByText('다음 — 사진 등록'));

    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({
        basicInfo: expect.objectContaining({
          name: '홍길동',
          gender: '남성',
          bodyType: '슬림',
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

    fireEvent.change(screen.getByPlaceholderText('본명을 입력해주세요'), { target: { value: '홍길동' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1995' } });
    fireEvent.change(selects[1], { target: { value: '06' } });
    fireEvent.change(selects[2], { target: { value: '15' } });
    fireEvent.click(screen.getByText('남성'));
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    await waitFor(() => expect(screen.getByText('2/4 단계')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('뒤로 가기'));

    await waitFor(() => expect(screen.getByText('1/4 단계')).toBeInTheDocument());
    expect(onBack).not.toHaveBeenCalled();
  });
});
