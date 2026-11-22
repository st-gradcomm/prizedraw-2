import { useEffect, useState } from 'react';
import CandidLogo from '../components/CandidLogo';
import Ticket from '../components/Ticket';
import { PRIZE_META } from '../lib/prizeMeta';
import { PUBLIC_RESULT_FILENAME, parseResultFile } from '../lib/raffle';
import type { ResultFile } from '../types/raffle';

type LoadState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ResultFile };

/** 당첨자 공개 페이지 (#/winners). 배포된 public/winners.json(마스킹)을 읽어 표시 */
export default function WinnersPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    document.title = 'ST:talk Lucky Draw 당첨자 발표';
    fetch(`${import.meta.env.BASE_URL}${PUBLIC_RESULT_FILENAME}`, { cache: 'no-store' })
      .then(async (response) => {
        // 파일이 없으면 404(Pages) 또는 index.html(개발 서버 SPA 폴백)이 오므로 JSON이 아니면 "발표 전"
        const isJson = response.headers.get('content-type')?.includes('json');
        if (response.status === 404 || (response.ok && !isJson)) return setState({ status: 'empty' });
        if (!response.ok) throw new Error(`결과를 불러오지 못했습니다 (${response.status})`);
        setState({ status: 'ready', data: parseResultFile(await response.json()) });
      })
      .catch((caught: unknown) =>
        setState({
          status: 'error',
          message: caught instanceof Error ? caught.message : '결과를 불러오지 못했습니다',
        }),
      );
  }, []);

  return (
    <div className="winners">
      <main className="winners__sheet">
        <header className="winners__header">
          <p className="winners__org serif">제 42대 총졸업준비위원회 X 취업진로본부</p>
          <h1 className="script">Lucky Draw</h1>
          <p className="winners__subtitle">ST:talk 취업진로 테이블 토크 당첨자 발표</p>
        </header>

        {state.status === 'loading' && <p className="winners__message">불러오는 중…</p>}
        {state.status === 'empty' && <p className="winners__message">아직 당첨자가 발표되지 않았습니다.</p>}
        {state.status === 'error' && <p className="winners__message">{state.message}</p>}

        {state.status === 'ready' && (
          <>
            {[...state.data.prizes]
              .sort((a, b) => b.revealOrder - a.revealOrder)
              .map((prize) => {
                const meta = PRIZE_META[prize.rank];
                const ids = state.data.winners[prize.rank];
                return (
                  <section key={prize.rank} className="winners__prize">
                    <div className="winners__prize-head">
                      <img src={meta.image} alt="" />
                      <div>
                        <div className="winners__ordinal display">
                          {meta.ordinal}
                          <small>{prize.count}명</small>
                        </div>
                        <div className="winners__prize-name serif">{prize.name}</div>
                      </div>
                    </div>
                    <div className={`winners__tickets ${ids.length === 1 ? 'winners__tickets--single' : ''}`}>
                      {ids.map((id) => (
                        <Ticket key={id} label={`${meta.ordinal} Prize`} studentId={id} size="sm" />
                      ))}
                    </div>
                  </section>
                );
              })}

            <details className="winners__verify">
              <summary>추첨 검증 정보</summary>
              <dl>
                <dt>참가자</dt>
                <dd>{state.data.participantCount}명</dd>
                <dt>추첨 시각</dt>
                <dd>{new Date(state.data.generatedAt).toLocaleString('ko-KR')}</dd>
                <dt>seed</dt>
                <dd>{state.data.seed}</dd>
                <dt>참가자 해시</dt>
                <dd>{state.data.participantHash}</dd>
                <dt>방식</dt>
                <dd>{state.data.algorithm}</dd>
              </dl>
            </details>
          </>
        )}

        <footer className="winners__footer">
          <CandidLogo height={32} />
          <span>당첨자는 학번 일부만 표시됩니다. 수령 안내는 별도 공지를 확인해 주세요.</span>
        </footer>
      </main>
    </div>
  );
}
