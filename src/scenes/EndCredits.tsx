import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import CandidLogo from '../components/CandidLogo';
import { useAdvance, type AdvanceRef } from '../hooks/useAdvance';
import { PRIZE_META } from '../lib/prizeMeta';
import type { DrawResult, PrizeConfig } from '../types/raffle';

type Step = 'theend' | 'credits';

const CINEMA_EASE = [0.65, 0, 0.35, 1] as const;

interface EndCreditsProps {
  advanceRef: AdvanceRef;
  result: DrawResult;
  revealOrder: PrizeConfig[];
}

/** "The End" → (다음) 엔딩 크레딧으로 전체 당첨자 정리 */
export default function EndCredits({ advanceRef, result, revealOrder }: EndCreditsProps) {
  const [step, setStep] = useState<Step>('theend');

  useAdvance(advanceRef, () => {
    if (step === 'theend') setStep('credits');
  });

  const ranked = [...revealOrder].reverse(); // 1등부터

  return (
    <div className="credits">
      <AnimatePresence mode="wait">
        {step === 'theend' ? (
          <motion.h1
            key="end"
            className="credits__theend script"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 2.4, ease: CINEMA_EASE }}
          >
            The End
          </motion.h1>
        ) : (
          <motion.div
            key="credits"
            className="credits__roll"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.45, delayChildren: 0.3 } } }}
          >
            {[
              <header key="head" className="credits__head">
                <h1 className="script">Lucky Draw</h1>
                <p className="serif">ST:talk 취업진로 테이블 토크 — 당첨을 축하합니다</p>
              </header>,
              ...ranked.map((prize) => (
                <section key={prize.rank} className={`credits__row credits__row--${prize.count}`}>
                  <div className="credits__label">
                    <span className="display">{PRIZE_META[prize.rank].ordinal} Prize</span>
                    <span className="serif">{prize.name}</span>
                  </div>
                  <div className="credits__ids display">
                    {result.winners[prize.rank].map((winner) => (
                      <span key={winner.studentId}>{winner.studentId}</span>
                    ))}
                  </div>
                </section>
              )),
              <footer key="foot" className="credits__foot">
                <CandidLogo height={40} />
                <span>제 42대 총졸업준비위원회 X 취업진로본부</span>
                <span className="credits__seed">
                  참가자 {result.participantCount}명 · seed {result.seed.slice(0, 8)}…{result.seed.slice(-8)}
                </span>
              </footer>,
            ].map((node, index) => (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, y: 50 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 1.1, ease: CINEMA_EASE }}
              >
                {node}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
