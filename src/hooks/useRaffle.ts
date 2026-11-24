import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PRIZES,
  createParticipantHash,
  drawWinners,
  generateSeed,
  parseParticipants,
  prizesInRevealOrder,
  totalPrizeCount,
} from '../lib/raffle';
import type { DrawResult, Participant, PrizeConfig } from '../types/raffle';

/**
 * INPUT  : 참가자 입력/검증
 * LOCKED : 참가자 목록 고정 (seed는 아직 없음 — 시드 고정 버튼을 기다림)
 * READY  : 시드 고정 + 추첨 완료 (결과는 아직 비공개)
 * REVEAL : 등수별 공개 진행 중 (3등 → 2등 → 1등)
 * RESULT : 전체 결과
 */
export type RafflePhase = 'INPUT' | 'LOCKED' | 'READY' | 'REVEAL' | 'RESULT';

interface LockedList {
  eventName: string;
  participants: Participant[];
  participantHash: string;
}

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

/** LOCKED는 저장하지 않음 (참가자 목록을 보관하지 않으므로 새로고침 시 INPUT으로 돌아감) */
interface SavedSession {
  phase: Exclude<RafflePhase, 'INPUT' | 'LOCKED'>;
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
  const [locked, setLocked] = useState<LockedList | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(saved?.result ?? null);
  const [revealIndex, setRevealIndex] = useState(saved?.revealIndex ?? -1);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (phase === 'INPUT' || phase === 'LOCKED' || !result) {
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
  const canFixSeed = phase === 'LOCKED' && locked !== null && !drawing;

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

  /** 참가자 목록만 고정 (seed·추첨은 fixSeed에서). 참가자 해시를 먼저 계산해 공개할 수 있게 함 */
  const lock = useCallback(async () => {
    if (!canLock) return;
    try {
      const participants = validation.participants;
      setLocked({
        eventName: eventName.trim() || '경품 추첨',
        participants,
        participantHash: await createParticipantHash(participants),
      });
      setError('');
      setPhase('LOCKED');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '참가자 목록을 고정할 수 없습니다.');
    }
  }, [canLock, eventName, validation.participants]);

  /** 버튼을 누른 그 시각을 seed로 고정하고 추첨 수행 (공개는 별도) */
  const fixSeed = useCallback(async () => {
    if (!canFixSeed || !locked) return;
    const seed = generateSeed();
    setDrawing(true);
    try {
      const drawn = await drawWinners(locked.eventName, locked.participants, seed, prizes);
      setResult(drawn);
      setRevealIndex(-1);
      setError('');
      setPhase('READY');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '추첨을 진행할 수 없습니다.');
    } finally {
      setDrawing(false);
    }
  }, [canFixSeed, locked, prizes]);

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

  /** 입력 단계로 복귀 — 고정된 목록, seed, 결과는 폐기됨 */
  const reset = useCallback(() => {
    setLocked(null);
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
    locked,
    canFixSeed,
    fixSeed,
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
