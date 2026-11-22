import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef } from 'react';
import Ticket from '../components/Ticket';
import { makeReelFillers } from '../lib/prizeMeta';

export type ReelStatus = 'waiting' | 'spinning' | 'landed';

export interface ReelSize {
  width: number;
  frameHeight: number;
  fontSize: number;
  ticket: 'sm' | 'md' | 'lg' | 'xl';
}

interface ReelProps {
  status: ReelStatus;
  targetId: string;
  pool: string[];
  duration: number;
  delay?: number;
  size: ReelSize;
  label: string;
  onLanded: () => void;
}

/** 학번이 찍힌 필름 프레임이 세로로 흐르다 감속하며 당첨 학번에서 멈추는 릴 */
export default function Reel({ status, targetId, pool, duration, delay = 0, size, label, onLanded }: ReelProps) {
  const landedRef = useRef(false);
  const windowHeight = Math.round(size.frameHeight * 1.9);
  const fillerCount = Math.round(duration * 11);

  const frames = useMemo(() => {
    const fillers = makeReelFillers(pool, fillerCount + 1, [targetId]);
    return [...fillers.slice(0, fillerCount), targetId, fillers[fillerCount]];
    // 렌더마다 새로 섞지 않도록 대상·길이가 바뀔 때만 다시 생성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, fillerCount]);

  const centerOffset = (windowHeight - size.frameHeight) / 2;
  const yStart = centerOffset;
  const yEnd = centerOffset - fillerCount * size.frameHeight;

  return (
    <div className="reel" style={{ width: size.width, height: windowHeight }}>
      <AnimatePresence mode="wait">
        {status === 'landed' ? (
          <motion.div
            key="ticket"
            className="reel__ticket"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Ticket label={label} studentId={targetId} size={size.ticket} />
          </motion.div>
        ) : (
          <motion.div
            key="film"
            className="reel__window"
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
          >
            <motion.div
              className="reel__strip"
              initial={{ y: yStart, filter: 'blur(0px)' }}
              animate={
                status === 'spinning'
                  ? { y: yEnd, filter: ['blur(0px)', 'blur(5px)', 'blur(0px)'] }
                  : { y: yStart }
              }
              transition={{
                y: { duration, delay, ease: [0.12, 0.62, 0.12, 1] },
                filter: { duration, delay, times: [0, 0.15, 0.75] },
              }}
              onAnimationComplete={() => {
                if (status === 'spinning' && !landedRef.current) {
                  landedRef.current = true;
                  window.setTimeout(onLanded, 450);
                }
              }}
            >
              {(status === 'waiting' ? ['?'] : frames).map((id, index) => (
                <div
                  key={index}
                  className={`reel__frame ${status === 'waiting' ? 'is-waiting' : ''}`}
                  style={{ height: size.frameHeight, fontSize: size.fontSize }}
                >
                  <span className="display">{status === 'waiting' ? '? ? ? ?' : id}</span>
                </div>
              ))}
            </motion.div>
            <div className="reel__shade" />
            <div className="reel__gate" style={{ height: size.frameHeight, top: centerOffset }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
