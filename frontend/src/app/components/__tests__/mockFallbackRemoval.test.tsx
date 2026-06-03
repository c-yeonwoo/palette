import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompletionMeter } from '../profile/CompletionMeter';
import { MatchmakerInsights } from '../feedback/MatchmakerInsights';
import { MannerSummary } from '../feedback/MannerSummary';
import { MOCK_COMPLETION_INPUT } from '../../../lib/profile-completion';
import { MOCK_FEEDBACKS } from '../../../lib/feedback';

/**
 * Regression — 재사용 컴포넌트의 mock default/fallback 제거 (issue #25 / PR #26)
 *
 * 데이터가 없을 때 mock 으로 화면을 채우지 않고 빈 상태/안내를 노출하는지 검증한다.
 * 데이터가 주입되면 정상 렌더링되는지도 함께 검증해 회귀를 방지한다.
 */
describe('CompletionMeter — mock default 제거', () => {
  it('input 미전달 시 mock 도넛 대신 빈 상태 안내를 보여준다', () => {
    render(<CompletionMeter />);
    expect(screen.getByText('프로필 완성도를 불러올 수 없어요')).toBeInTheDocument();
  });

  it('input 이 주입되면 빈 상태가 아니라 완성도를 렌더링한다', () => {
    render(<CompletionMeter input={MOCK_COMPLETION_INPUT} />);
    expect(screen.queryByText('프로필 완성도를 불러올 수 없어요')).not.toBeInTheDocument();
  });
});

describe('MatchmakerInsights — mock feedbacks default 제거', () => {
  it('feedbacks 미전달 시 mock 후기 대신 빈 상태를 보여준다', () => {
    render(<MatchmakerInsights />);
    expect(screen.getByText('아직 후기가 없어요')).toBeInTheDocument();
  });

  it('feedbacks 가 주입되면 인사이트를 렌더링한다', () => {
    render(<MatchmakerInsights feedbacks={MOCK_FEEDBACKS} />);
    expect(screen.queryByText('아직 후기가 없어요')).not.toBeInTheDocument();
    expect(screen.getByText('인사이트')).toBeInTheDocument();
  });
});

describe('MannerSummary — mock feedbacks default 제거', () => {
  it('feedbacks 미전달 시에도 mock 데이터 없이 렌더링된다 (throw 하지 않음)', () => {
    const { container } = render(<MannerSummary />);
    expect(container).toBeTruthy();
  });
});
