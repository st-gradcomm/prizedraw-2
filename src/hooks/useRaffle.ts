import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PRIZES,
  drawWinners,
  generateSeed,
  parseParticipants,
  prizesInRevealOrder,
  totalPrizeCount,
} from '../lib/raffle';
import type { DrawResult, Participant, PrizeConfig } from '../types/raffle';

/**
 * INPUT  : 참가자 입력/검증
 * READY  : 목록 고정 + 추첨 완료 (결과는 아직 비공개)
 * REVEAL : 등수별 공개 진행 중 (3등 → 2등 → 1등)
 * RESULT : 전체 결과
 */
export type RafflePhase = 'INPUT' | 'READY' | 'REVEAL' | 'RESULT';

export interface RevealStep {
  prize: PrizeConfig;
  winners: Participant[];
  /** 0부터 시작하는 공개 순번 */
  index: number;
  isLast: boolean;
}

/**
 * 방송 중 실수로 새로고침해도 이어서 진행할 수 있도록 추첨 결과와 진행 위치를 sessionStorage에 보관.
 * 탭을 닫으면 사라지고, reset() 시 즉시 삭제. 참가자 전체 목록은 저장하지 않음.
 */
const SESSION_KEY = 'prizedraw:session';

interface SavedSession {
  phase: Exclude<RafflePhase, 'INPUT'>;
  result: DrawResult;
  revealIndex: number;
}

function loadSession(): SavedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
}

export function useRaffle(prizes: PrizeConfig[] = DEFAULT_PRIZES) {
  const [saved] = useState(loadSession);
  const [phase, setPhase] = useState<RafflePhase>(saved?.phase ?? 'INPUT');
  const [eventName, setEventName] = useState(saved?.result.eventName ?? 'ST:talk 경품 추첨');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<DrawResult | null>(saved?.result ?? null);
  const [revealIndex, setRevealIndex] = useState(saved?.revealIndex ?? -1);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (phase === 'INPUT' || !result) {
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        const session: SavedSession = { phase, result, revealIndex };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    } catch {
      // 저장 실패는 진행에 영향 없음
    }
  }, [phase, result, revealIndex]);

  // 복구된 결과가 있으면 그 결과의 경품 설정을 기준으로 진행
  const activePrizes = result?.prizes ?? prizes;
  const revealOrder = useMemo(() => prizesInRevealOrder(activePrizes), [activePrizes]);
  const required = totalPrizeCount(prizes);
  const validation = useMemo(() => parseParticipants(inputText), [inputText]);
  const canLock = phase === 'INPUT' && validation.validCount >= required;

  const currentStep: RevealStep | null =
    result && revealIndex >= 0
      ? {
          prize: revealOrder[revealIndex],
          winners: result.winners[revealOrder[revealIndex].rank],
          index: revealIndex,
          isLast: revealIndex === revealOrder.length - 1,
        }
      : null;

  const nextPrize = revealOrder[revealIndex + 1] ?? null;

  const loadFile = useCallback(async (file: File) => {
    try {
      setInputText(await file.text());
      setError('');
    } catch {
      setError('파일을 읽을 수 없습니다. CSV 형식이나 인코딩을 확인해 주세요.');
    }
  }, []);

  /** 참가자 목록을 고정하고 seed 생성 + 추첨까지 한 번에 수행 (공개는 별도) */
  const lock = useCallback(async () => {
    if (!canLock) return;
    try {
      const drawn = await drawWinners(
        eventName.trim() || '경품 추첨',
        validation.participants,
        generateSeed(),
        prizes,
      );
      setResult(drawn);
      setRevealIndex(-1);
      setError('');
      setPhase('READY');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '참가자 목록을 고정할 수 없습니다.');
    }
  }, [canLock, eventName, prizes, validation.participants]);

  /** 다음 등수로 진행. 마지막 등수 이후에는 RESULT로 이동 */
  const next = useCallback(() => {
    if (!result) return;
    if (revealIndex + 1 < revealOrder.length) {
      setRevealIndex(revealIndex + 1);
      setPhase('REVEAL');
    } else {
      setPhase('RESULT');
    }
  }, [result, revealIndex, revealOrder.length]);

  /** 입력 단계로 복귀 — seed와 결과는 폐기됨 */
  const reset = useCallback(() => {
    setResult(null);
    setRevealIndex(-1);
    setError('');
    setPhase('INPUT');
  }, []);

  return {
    /** 새로고침 후 이전 진행 상태를 복구했는지 */
    restored: Boolean(saved),
    phase,
    eventName,
    setEventName,
    inputText,
    setInputText,
    loadFile,
    validation,
    required,
    canLock,
    lock,
    result,
    revealOrder,
    currentStep,
    nextPrize,
    next,
    reset,
    error,
  };
}

export type RaffleController = ReturnType<typeof useRaffle>;
