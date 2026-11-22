import { motion } from 'motion/react';
import { useState } from 'react';
import CandidLogo from '../components/CandidLogo';
import { useAdvance, type AdvanceRef } from '../hooks/useAdvance';
import { PRIZE_META } from '../lib/prizeMeta';
import type { PrizeConfig } from '../types/raffle';

type Step = 'closed' | 'open' | 'zoom';

const CINEMA_EASE = [0.65, 0, 0.35, 1] as const;

interface TitleSceneProps {
  advanceRef: AdvanceRef;
  prizes: PrizeConfig[];
  participantCount: number;
  onStart: () => void;
}

/** 대기 화면: 닫힌 커튼 → (다음) 커튼 열림 + Lucky Draw 스크린 → (다음) 스크린으로 줌인 후 3등 시작 */
export default function TitleScene({ advanceRef, prizes, participantCount, onStart }: TitleSceneProps) {
  const [step, setStep] = useState<Step>('closed');

  useAdvance(advanceRef, () => {
    if (step === 'closed') setStep('open');
    else if (step === 'open') {
      setStep('zoom');
      window.setTimeout(onStart, 1500);
    }
  });

  const isOpen = step !== 'closed';
  const lineup = [...prizes].sort((a, b) => b.revealOrder - a.revealOrder);

  return (
    <div className="theater">
      <motion.div
        className="theater__room"
        initial={{ opacity: 0 }}
        animate={step === 'zoom' ? { scale: 1.6, opacity: 0, y: 60 } : { scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: step === 'zoom' ? 1.5 : 1.2, ease: CINEMA_EASE }}
      >
        <div className="theater__side theater__side--left" />
        <div className="theater__side theater__side--right" />

        <div className="theater__screen">
          <motion.div
            className="screen-title"
            initial={false}
            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.4, delay: isOpen ? 1.2 : 0, ease: CINEMA_EASE }}
          >
            <p className="screen-title__org serif">제 42대 총졸업준비위원회 X 취업진로본부</p>
            <h1 className="screen-title__heading script">Lucky Draw</h1>
            <div className="screen-title__lineup">
              {lineup.map((prize) => (
                <div key={prize.rank} className="lineup-card">
                  <img src={PRIZE_META[prize.rank].image} alt="" />
                  <div>
                    <span className="lineup-card__ordinal display">
                      {PRIZE_META[prize.rank].ordinal} <small className="serif">{prize.count}명</small>
                    </span>
                    <span className="lineup-card__name serif">{prize.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="curtain curtain--left"
          initial={false}
          animate={{ x: isOpen ? '-86%' : '0%' }}
          transition={{ duration: 2.6, ease: CINEMA_EASE }}
        />
        <motion.div
          className="curtain curtain--right"
          initial={false}
          animate={{ x: isOpen ? '86%' : '0%' }}
          transition={{ duration: 2.6, ease: CINEMA_EASE }}
        />
        <div className="theater__valance" />

        <motion.div
          className="marquee"
          initial={{ opacity: 0, y: 20 }}
          animate={isOpen ? { opacity: 0, y: -40 } : { opacity: 1, y: 0 }}
          transition={{ duration: isOpen ? 0.8 : 1.6, delay: isOpen ? 0 : 0.4, ease: CINEMA_EASE }}
        >
          <h1 className="marquee__title brand">ST: talk</h1>
          <p className="marquee__subtitle">동문 선배들과의 취업진로 테이블 토크</p>
          <p className="marquee__lucky display">— Lucky Draw —</p>
          <p className="marquee__count">참가자 {participantCount}명</p>
        </motion.div>

        <div className="theater__seats" />
        <CandidLogo className="theater__logo" height={46} />
      </motion.div>
    </div>
  );
}
