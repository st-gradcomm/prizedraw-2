import { useLayoutEffect, type MutableRefObject } from 'react';

export type AdvanceRef = MutableRefObject<(() => void) | null>;

/**
 * 현재 화면(scene)의 "다음" 동작을 등록. 키보드와 진행자 버튼은 advanceRef.current를 호출하므로
 * 장면마다 내부 단계(커튼 열기, 카운트다운, 릴 회전 등)를 스스로 처리할 수 있음.
 */
export function useAdvance(ref: AdvanceRef, handler: () => void) {
  useLayoutEffect(() => {
    ref.current = handler;
  });

  useLayoutEffect(
    () => () => {
      ref.current = null;
    },
    [ref],
  );
}
