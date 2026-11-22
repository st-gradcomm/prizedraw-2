import type { CSSProperties } from 'react';

interface TicketProps {
  label: string;
  studentId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'crimson' | 'green' | 'ink';
  style?: CSSProperties;
}

/** 이름표(티켓) 모티프의 당첨자 카드 */
export default function Ticket({ label, studentId, size = 'md', tone = 'crimson', style }: TicketProps) {
  return (
    <div className={`ticket ticket--${size} ticket--${tone}`} style={style}>
      <div className="ticket__inner">
        <div className="ticket__main">
          <div className="ticket__head">
            <span className="brand ticket__brand">ST: talk</span>
            <span className="ticket__label">{label}</span>
          </div>
          <div className="ticket__id display">{studentId}</div>
        </div>
        <div className="ticket__stub">
          <div className="ticket__barcode" aria-hidden />
        </div>
      </div>
    </div>
  );
}
