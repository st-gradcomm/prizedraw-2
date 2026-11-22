import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import Confetti from '../components/Confetti';
import FilmStrip from '../components/FilmStrip';
import type { RevealStep } from '../hooks/useRaffle';
import { useAdvance, type AdvanceRef } from '../hooks/useAdvance';
import { PRIZE_META, revealGroups } from '../lib/prizeMeta';
import Countdown from './Countdown';
import Reel, { type ReelSize, type ReelStatus } from './Reel';

type Phase = 'countdown' | 'title' | 'draw';

const CINEMA_EASE = [0.65, 0, 0.35, 1] as const;

const REEL_SIZES: Record<number, ReelSize> = {
  1: { width: 1040, frameHeight: 300, fontSize: 190, ticket: 'xl' },
  2: { width: 720, frameHeight: 250, fontSize: 118, ticket: 'lg' },
};
const SMALL_REEL: ReelSize = { width: 330, frameHeight: 190, fontSize: 52, ticket: 'sm' };

interface RevealSceneProps {
  advanceRef: AdvanceRef;
  step: RevealStep;
  pool: string[];
  onFinish: () => void;
}

/**
 * 등수 하나의 공개 흐름
 *  카운트다운(자동) → 경품 타이틀 카드 → (다음) 릴 회전 → 멈춤 → (다음) 다음 그룹 … → (다음) 다음 등수
 */
export default function RevealScene({ advanceRef, step, pool, onFinish }: RevealSceneProps) {
  const { prize, winners } = step;
  const meta = PRIZE_META[prize.rank];
  const groups = useMemo(() => revealGroups(prize.rank, winners.length), [prize.rank, winners.length]);

  const [phase, setPhase] = useState<Phase>('countdown');
  const [groupIndex, setGroupIndex] = useState(-1);
  const [landed, setLanded] = useState<Set<number>>(() => new Set());

  const currentGroup = groups[groupIndex] ?? [];
  const groupLanded = groupIndex >= 0 && currentGroup.every((index) => landed.has(index));
  const allLanded = landed.size === winners.length;
  const isGrand = prize.rank === '1등';

  useAdvance(advanceRef, () => {
    if (phase === 'title') {
      // 대기 중인 릴을 잠깐 보여준 뒤 회전 시작
      setPhase('draw');
      window.setTimeout(() => setGroupIndex(0), 700);
    } else if (phase === 'draw' && groupLanded) {
      if (groupIndex + 1 < groups.length) setGroupIndex(groupIndex + 1);
      else onFinish();
    }
  });

  const handleCountdownDone = useCallback(() => setPhase('title'), []);
  const markLanded = useCallback(
    (index: number) => setLanded((previous) => new Set(previous).add(index)),
    [],
  );

  const statusOf = (index: number): ReelStatus => {
    if (landed.has(index)) return 'landed';
    const group = groups.findIndex((members) => members.includes(index));
    return group <= groupIndex && group >= 0 ? 'spinning' : 'waiting';
  };

  const reelSize = REEL_SIZES[winners.length] ?? SMALL_REEL;
  const label = `${meta.ordinal} Prize`;

  return (
    <div className={`reveal ${isGrand ? 'reveal--grand' : ''}`}>
      <AnimatePresence mode="wait">
        {phase === 'countdown' && (
          <motion.div key="countdown" className="reveal__layer" exit={{ opacity: 0, transition: { duration: 0.25 } }}>
            <Countdown onDone={handleCountdownDone} />
          </motion.div>
        )}

        {phase === 'title' && (
          <motion.div
            key="title"
            className="reveal__layer prize-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 0.6 }}
          >
            <FilmStrip orientation="horizontal" className="letterbox letterbox--top" />
            <div className="prize-title__body">
              <motion.div
                className="prize-title__text"
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.1, delay: 0.2, ease: CINEMA_EASE }}
              >
                <p className="prize-title__kicker script">Lucky Draw</p>
                <p className="prize-title__ordinal display">
                  {meta.ordinal}
                  <span className="prize-title__count serif">{prize.count}명</span>
                </p>
                <p className="prize-title__name serif">{prize.name}</p>
              </motion.div>
              <motion.div
                className="prize-title__visual"
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.3, delay: 0.5, ease: CINEMA_EASE }}
              >
                <img src={meta.image} alt={prize.name} />
              </motion.div>
            </div>
            <FilmStrip orientation="horizontal" className="letterbox letterbox--bottom" />
          </motion.div>
        )}

        {phase === 'draw' && (
          <motion.div
            key="draw"
            className="reveal__layer draw"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <FilmStrip orientation="horizontal" className="letterbox letterbox--top" />
            <header className="draw__header">
              <img src={meta.image} alt="" />
              <span className="draw__ordinal display">{label}</span>
              <span className="draw__name serif">{prize.name}</span>
              <span className="draw__count serif">{prize.count}명</span>
            </header>

            {isGrand && <div className={`spotlight ${allLanded ? 'is-on' : ''}`} />}

            <div className={`draw__reels draw__reels--${winners.length}`}>
              {winners.map((winner, index) => {
                const status = statusOf(index);
                // 같은 그룹 안에서의 순서 — 릴 길이가 회전 도중 바뀌지 않도록 고정값 사용
                const order = groups.find((members) => members.includes(index))?.indexOf(index) ?? 0;
                return (
                  <Reel
                    key={winner.studentId}
                    status={status}
                    targetId={winner.studentId}
                    pool={pool}
                    duration={meta.spinSeconds + order * 0.75}
                    size={reelSize}
                    label={label}
                    onLanded={() => markLanded(index)}
                  />
                );
              })}
            </div>

            {isGrand && allLanded && <Confetti />}
            {allLanded && (
              <motion.p
                className="draw__congrats script"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                Congratulations!
              </motion.p>
            )}
            <FilmStrip orientation="horizontal" className="letterbox letterbox--bottom" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
