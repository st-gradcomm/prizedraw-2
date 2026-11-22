import { useEffect, useRef } from 'react';

/** 진행(next)으로 인식하는 키 — 프레젠테이션 클리커는 보통 PageDown / ArrowRight를 보냄 */
export const NEXT_KEYS = new Set([' ', 'Enter', 'ArrowRight', 'PageDown']);
export const FULLSCREEN_KEYS = new Set(['f', 'F']);

interface StageControlsOptions {
  onNext: () => void;
  onFullscreen?: () => void;
  /** 연출 애니메이션 중에는 false로 두어 중복 진행 방지 */
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * 키보드 조작. 화면 버튼과 같은 핸들러를 호출하므로 둘 다 동시에 사용 가능.
 * 입력창에 포커스가 있거나 키를 누르고 있는 중(repeat)에는 무시.
 */
export function useStageControls({ onNext, onFullscreen, enabled = true }: StageControlsOptions) {
  const handlers = useRef({ onNext, onFullscreen });
  handlers.current = { onNext, onFullscreen };

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;

      if (NEXT_KEYS.has(event.key)) {
        // 포커스된 버튼이 Space/Enter로 한 번 더 클릭되는 것 방지
        event.preventDefault();
        handlers.current.onNext();
      } else if (FULLSCREEN_KEYS.has(event.key) && handlers.current.onFullscreen) {
        event.preventDefault();
        handlers.current.onFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
