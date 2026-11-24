import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import OperatorBar from '../components/OperatorBar';
import StageFrame from '../components/StageFrame';
import type { AdvanceRef } from '../hooks/useAdvance';
import { useRaffle } from '../hooks/useRaffle';
import { useStageControls } from '../hooks/useStageControls';
import { onFullscreenChange, toggleFullscreen } from '../lib/fullscreen';
import {
  PUBLIC_RESULT_FILENAME,
  downloadTextFile,
  resultToCsv,
  resultToJson,
  resultToPublicJson,
} from '../lib/raffle';
import EndCredits from '../scenes/EndCredits';
import RevealScene from '../scenes/RevealScene';
import SetupScreen from '../scenes/SetupScreen';
import TitleScene from '../scenes/TitleScene';

export default function StagePage() {
  const raffle = useRaffle();
  const { phase, result, currentStep } = raffle;
  const advanceRef: AdvanceRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRestored, setShowRestored] = useState(raffle.restored);

  useEffect(() => onFullscreenChange(setIsFullscreen), []);
  useEffect(() => {
    if (!showRestored) return undefined;
    const timer = window.setTimeout(() => setShowRestored(false), 4000);
    return () => window.clearTimeout(timer);
  }, [showRestored]);

  const advance = () => advanceRef.current?.();
  const fullscreen = () => void toggleFullscreen().catch(() => undefined);

  const onSetup = phase === 'INPUT' || phase === 'LOCKED';
  useStageControls({ onNext: advance, onFullscreen: fullscreen, enabled: !onSetup });

  // 목록 고정 후 시드 고정 전까지는 진행자 준비 화면에서 대기
  if (onSetup) return <SetupScreen raffle={raffle} />;

  const backToSetup = () => {
    const message =
      phase === 'RESULT'
        ? '처음으로 돌아가면 현재 추첨 결과가 사라집니다. 결과 파일을 저장했나요?'
        : '진행 중인 추첨을 중단하고 처음으로 돌아갈까요? 현재 추첨 결과(seed)는 폐기됩니다.';
    if (window.confirm(message)) raffle.reset();
  };

  const pool = raffle.validation.participants.map((participant) => participant.studentId);
  const sceneKey = phase === 'REVEAL' ? `reveal-${currentStep?.prize.rank}` : phase;

  return (
    <>
      <StageFrame>
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneKey}
            className="scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {phase === 'READY' && result && (
              <TitleScene
                advanceRef={advanceRef}
                prizes={result.prizes}
                participantCount={result.participantCount}
                onStart={raffle.next}
              />
            )}
            {phase === 'REVEAL' && currentStep && (
              <RevealScene advanceRef={advanceRef} step={currentStep} pool={pool} onFinish={raffle.next} />
            )}
            {phase === 'RESULT' && result && (
              <EndCredits advanceRef={advanceRef} result={result} revealOrder={raffle.revealOrder} />
            )}
          </motion.div>
        </AnimatePresence>
      </StageFrame>

      {showRestored && <div className="toast">새로고침 전 진행 상태를 복구했어요</div>}

      <OperatorBar>
        <button className="op-btn" onClick={backToSetup}>처음으로</button>
        {phase === 'RESULT' && result ? (
          <>
            <button
              className="op-btn"
              onClick={() => downloadTextFile('raffle-result.json', resultToJson(result), 'application/json')}
            >
              결과 JSON
            </button>
            <button
              className="op-btn"
              onClick={() => downloadTextFile('raffle-result.csv', resultToCsv(result), 'text/csv;charset=utf-8')}
            >
              결과 CSV
            </button>
            <button
              className="op-btn"
              onClick={() => downloadTextFile(PUBLIC_RESULT_FILENAME, resultToPublicJson(result), 'application/json')}
            >
              공개용 {PUBLIC_RESULT_FILENAME}
            </button>
          </>
        ) : null}
        <button className="op-btn" onClick={fullscreen}>{isFullscreen ? '전체화면 종료' : '전체화면'} (F)</button>
        <button className="op-btn op-btn--primary" onClick={advance}>다음 ▶</button>
      </OperatorBar>
    </>
  );
}
