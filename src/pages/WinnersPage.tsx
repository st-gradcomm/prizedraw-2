// 임시 화면: 당첨자 공개 페이지 (#/winners). public/winners.json(마스킹)을 읽어 표시
import { useEffect, useState } from 'react';
import { PUBLIC_RESULT_FILENAME, parseResultFile } from '../lib/raffle';
import type { ResultFile } from '../types/raffle';

type LoadState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ResultFile };

export default function WinnersPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}${PUBLIC_RESULT_FILENAME}`, { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 404) return setState({ status: 'empty' });
        if (!response.ok) throw new Error(`불러오기 실패 (${response.status})`);
        setState({ status: 'ready', data: parseResultFile(await response.json()) });
      })
      .catch((caught: unknown) =>
        setState({ status: 'error', message: caught instanceof Error ? caught.message : '불러오기 실패' }),
      );
  }, []);

  if (state.status === 'loading') return <p>불러오는 중…</p>;
  if (state.status === 'empty') return <p>아직 당첨자가 발표되지 않았습니다.</p>;
  if (state.status === 'error') return <p>{state.message}</p>;

  const { data } = state;
  const prizes = [...data.prizes].sort((a, b) => b.revealOrder - a.revealOrder);

  return (
    <main>
      <h1>{data.eventName} 당첨자</h1>
      {prizes.map((prize) => (
        <section key={prize.rank}>
          <h2>{prize.rank} · {prize.name} ({prize.count}명)</h2>
          <ul>{data.winners[prize.rank].map((id) => <li key={id}>{id}</li>)}</ul>
        </section>
      ))}
      <p>참가자 {data.participantCount}명 · 추첨 {new Date(data.generatedAt).toLocaleString('ko-KR')}</p>
      <details>
        <summary>검증 정보</summary>
        <p>seed: {data.seed}</p>
        <p>participantHash: {data.participantHash}</p>
        <p>algorithm: {data.algorithm}</p>
      </details>
    </main>
  );
}
