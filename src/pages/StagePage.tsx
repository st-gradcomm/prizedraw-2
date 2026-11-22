// 임시 화면: 새 디자인이 들어오기 전 엔진 동작 확인용 (스타일 없음)
import { useRaffle } from '../hooks/useRaffle';
import { useStageControls } from '../hooks/useStageControls';
import { toggleFullscreen } from '../lib/fullscreen';
import {
  PUBLIC_RESULT_FILENAME,
  downloadTextFile,
  makeSampleData,
  reasonLabel,
  resultToCsv,
  resultToJson,
  resultToPublicJson,
} from '../lib/raffle';

export default function StagePage() {
  const raffle = useRaffle();
  const { phase, validation, result, currentStep, nextPrize } = raffle;
  const canAdvance = phase === 'READY' || phase === 'REVEAL';

  // 버튼과 키보드(Space / Enter / → / PageDown, F=전체화면)가 같은 동작을 호출
  useStageControls({
    onNext: () => canAdvance && raffle.next(),
    onFullscreen: () => void toggleFullscreen(),
  });

  return (
    <main>
      <h1>{raffle.eventName}</h1>
      <p>phase: {phase}{raffle.restored && ' (새로고침 후 복구됨)'}</p>
      {raffle.error && <p role="alert">{raffle.error}</p>}
      <button onClick={() => void toggleFullscreen()}>전체화면 (F)</button>

      {phase === 'INPUT' && (
        <section>
          <input value={raffle.eventName} onChange={(e) => raffle.setEventName(e.target.value)} />
          <br />
          <input type="file" accept=".csv,.txt" onChange={(e) => e.target.files?.[0] && raffle.loadFile(e.target.files[0])} />
          <button onClick={() => raffle.setInputText(makeSampleData())}>샘플</button>
          <br />
          <textarea rows={10} cols={40} value={raffle.inputText} onChange={(e) => raffle.setInputText(e.target.value)} />
          <p>
            유효 {validation.validCount} / 필요 {raffle.required} · 오류 {validation.invalidRows.length} · 학번 열 {validation.columnIndex + 1}
            {validation.headerDetected && ' (헤더 감지)'}
          </p>
          <ul>
            {validation.invalidRows.map((row) => (
              <li key={row.rowIndex}>{row.rowIndex}행 "{row.rawValue}" — {reasonLabel(row.reason)}</li>
            ))}
          </ul>
          <button disabled={!raffle.canLock} onClick={raffle.lock}>목록 고정</button>
        </section>
      )}

      {phase === 'REVEAL' && currentStep && (
        <section>
          <h2>{currentStep.prize.rank} — {currentStep.prize.name}</h2>
          <ul>{currentStep.winners.map((w) => <li key={w.studentId}>{w.studentId}</li>)}</ul>
        </section>
      )}

      {phase === 'RESULT' && result && (
        <section>
          {raffle.revealOrder.map((prize) => (
            <p key={prize.rank}>{prize.rank} {prize.name}: {result.winners[prize.rank].map((w) => w.studentId).join(', ')}</p>
          ))}
          <p>seed: {result.seed}</p>
          <button onClick={() => downloadTextFile('raffle-result.json', resultToJson(result), 'application/json')}>JSON</button>
          <button onClick={() => downloadTextFile('raffle-result.csv', resultToCsv(result), 'text/csv;charset=utf-8')}>CSV</button>
          <button onClick={() => downloadTextFile(PUBLIC_RESULT_FILENAME, resultToPublicJson(result), 'application/json')}>
            공개 페이지용 {PUBLIC_RESULT_FILENAME}
          </button>
        </section>
      )}

      {canAdvance && (
        <button onClick={raffle.next}>{nextPrize ? `${nextPrize.rank} 공개` : '전체 결과'} (Space)</button>
      )}
      {phase !== 'INPUT' && <button onClick={raffle.reset}>처음으로</button>}
      <p><a href="#/winners">당첨자 공개 페이지 →</a></p>
    </main>
  );
}
