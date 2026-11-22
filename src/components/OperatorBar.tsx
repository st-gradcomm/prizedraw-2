import { useEffect, useState, type ReactNode } from 'react';

/**
 * 진행자용 버튼 막대. 마우스를 움직이면 나타나고 2.5초 뒤 커서와 함께 숨겨져 촬영 화면에 남지 않음.
 * 키보드 단축키와 같은 동작을 호출.
 */
export default function OperatorBar({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer = window.setTimeout(() => setVisible(false), 2500);
    const show = () => {
      setVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(false), 2500);
    };
    window.addEventListener('mousemove', show);
    window.addEventListener('mousedown', show);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', show);
      window.removeEventListener('mousedown', show);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('hide-cursor', !visible);
    return () => document.body.classList.remove('hide-cursor');
  }, [visible]);

  return <div className={`operator-bar ${visible ? 'is-visible' : ''}`}>{children}</div>;
}
