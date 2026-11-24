import { useState, type DragEvent } from 'react';
import CandidLogo from '../components/CandidLogo';
import FilmStrip from '../components/FilmStrip';
import type { RaffleController } from '../hooks/useRaffle';
import { PRIZE_META } from '../lib/prizeMeta';
import { makeSampleData, reasonLabel } from '../lib/raffle';

/** 진행자 준비 화면 (촬영 대상 아님): 참가자 입력·검증 → 목록 고정 → 시드 고정 */
export default function SetupScreen({ raffle }: { raffle: RaffleController }) {
  const { validation, locked } = raffle;
  const [dragging, setDragging] = useState(false);
  const hasInput = raffle.inputText.trim() !== '';
  const lineup = [...raffle.revealOrder].reverse();

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (locked) return;
    const file = event.dataTransfer.files[0];
    if (file) void raffle.loadFile(file);
  };

  return (
    <div className="setup">
      <FilmStrip className="setup__film setup__film--left" />
      <FilmStrip className="setup__film setup__film--right" />

      <main className="setup__sheet">
        <header className="setup__header">
          <div>
            <p className="setup__org serif">제 42대 총졸업준비위원회 X 취업진로본부</p>
            <h1 className="script">Lucky Draw</h1>
            <p className="setup__subtitle">참가자 등록 · 상영 준비</p>
          </div>
          <CandidLogo height={44} />
        </header>

        <section className="setup__grid">
          <div className="setup__input">
            <label className="field">
              <span className="field__label">행사명</span>
              <input value={raffle.eventName} onChange={(event) => raffle.setEventName(event.target.value)} />
            </label>

            <div
              className={`dropzone ${dragging ? 'is-dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <textarea
                value={raffle.inputText}
                onChange={(event) => raffle.setInputText(event.target.value)}
                readOnly={Boolean(locked)}
                placeholder={'CSV 파일을 여기로 끌어오거나 학번을 붙여넣으세요\n구글폼 응답 CSV도 그대로 사용 가능 (학번 열 자동 인식)'}
                spellCheck={false}
              />
              {!locked && (
                <div className="dropzone__actions">
                  <label className="btn btn--ghost">
                    CSV 불러오기
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void raffle.loadFile(file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <button className="btn btn--ghost" onClick={() => raffle.setInputText(makeSampleData())}>
                    리허설용 샘플
                  </button>
                  {hasInput && (
                    <button className="btn btn--ghost" onClick={() => raffle.setInputText('')}>
                      비우기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="setup__side">
            <div className="stats">
              <div className="stat">
                <span className="stat__value display">{validation.validCount}</span>
                <span className="stat__label">유효 참가자</span>
              </div>
              <div className="stat">
                <span className="stat__value display">{raffle.required}</span>
                <span className="stat__label">필요 인원</span>
              </div>
              <div className={`stat ${validation.duplicateCount ? 'is-warn' : ''}`}>
                <span className="stat__value display">{validation.duplicateCount}</span>
                <span className="stat__label">중복</span>
              </div>
              <div className={`stat ${validation.invalidRows.length - validation.duplicateCount ? 'is-warn' : ''}`}>
                <span className="stat__value display">{validation.invalidRows.length - validation.duplicateCount}</span>
                <span className="stat__label">형식 오류</span>
              </div>
            </div>

            {hasInput && (
              <p className="setup__hint">
                {validation.columnIndex + 1}번째 열을 학번으로 사용
                {validation.headerDetected ? ' (헤더 인식)' : ' (자동 감지)'}
              </p>
            )}

            {validation.invalidRows.length > 0 && (
              <ul className="issues">
                {validation.invalidRows.slice(0, 50).map((row) => (
                  <li key={row.rowIndex}>
                    <span>{row.rowIndex}행</span>
                    <code>{row.rawValue || '(빈 값)'}</code>
                    <em>{reasonLabel(row.reason)}</em>
                  </li>
                ))}
                {validation.invalidRows.length > 50 && <li>… 외 {validation.invalidRows.length - 50}건</li>}
              </ul>
            )}

            <ul className="setup__lineup">
              {lineup.map((prize) => (
                <li key={prize.rank}>
                  <img src={PRIZE_META[prize.rank].image} alt="" />
                  <span className="display">{PRIZE_META[prize.rank].ordinal}</span>
                  <span className="serif">{prize.name}</span>
                  <span>{prize.count}명</span>
                </li>
              ))}
            </ul>

            {raffle.error && <p className="setup__error" role="alert">{raffle.error}</p>}

            {locked ? (
              <>
                <p className="setup__hint">
                  참가자 {locked.participants.length}명 고정됨 · 참가자 해시 <code>{locked.participantHash.slice(0, 16)}…</code>
                  <br />
                  버튼을 누른 시각이 seed가 되고 그 즉시 추첨됩니다.
                </p>
                <button className="btn btn--primary" disabled={!raffle.canFixSeed} onClick={() => void raffle.fixSeed()}>
                  시드 고정 (지금 시각)하고 상영 시작
                </button>
                <button className="btn btn--ghost" onClick={raffle.reset}>
                  목록 다시 수정
                </button>
              </>
            ) : (
              <button className="btn btn--primary" disabled={!raffle.canLock} onClick={() => void raffle.lock()}>
                참가자 목록 고정
              </button>
            )}
            <p className="setup__keys">
              상영 중 조작 — <kbd>Space</kbd> <kbd>Enter</kbd> <kbd>→</kbd> 다음 · <kbd>F</kbd> 전체화면 · 마우스를 움직이면 버튼 표시
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}
