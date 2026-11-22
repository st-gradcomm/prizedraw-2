import { useEffect, useState } from 'react';

const NUMBERS = [3, 2, 1];
const STEP_MS = 1000;

/** 필름 리더 카운트다운 (3-2-1) */
export default function Countdown({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (index + 1 < NUMBERS.length) setIndex(index + 1);
      else onDone();
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [index, onDone]);

  return (
    <div className="countdown">
      <div className="countdown__leader">
        <div key={index} className="countdown__sweep" />
        <div className="countdown__ring countdown__ring--outer" />
        <div className="countdown__ring countdown__ring--inner" />
        <div className="countdown__cross countdown__cross--h" />
        <div className="countdown__cross countdown__cross--v" />
        <span key={`n${index}`} className="countdown__number display">
          {NUMBERS[index]}
        </span>
      </div>
    </div>
  );
}
