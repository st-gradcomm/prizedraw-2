import airpods from '../assets/prize-airpods.png';
import battery from '../assets/prize-battery.png';
import keyboard from '../assets/prize-keyboard.png';
import type { Rank } from '../types/raffle';

export interface PrizeMeta {
  /** 영문 서수 — Lucky Draw 포스터 표기 */
  ordinal: string;
  image: string;
  /**
   * together: 같은 등수를 한 번에 (필름 릴들이 순서대로 멈춤)
   * oneByOne: 한 명씩 키를 눌러 공개
   */
  revealMode: 'together' | 'oneByOne';
  /** 릴 회전 시간(초). 등수가 높을수록 길게 */
  spinSeconds: number;
}

export const PRIZE_META: Record<Rank, PrizeMeta> = {
  '3등': { ordinal: '3rd', image: battery, revealMode: 'together', spinSeconds: 3.6 },
  '2등': { ordinal: '2nd', image: keyboard, revealMode: 'oneByOne', spinSeconds: 5 },
  '1등': { ordinal: '1st', image: airpods, revealMode: 'oneByOne', spinSeconds: 7.5 },
};

/** 당첨자 인덱스를 공개 그룹으로 나눔. 예) together 5명 → [[0,1,2,3,4]], oneByOne 2명 → [[0],[1]] */
export function revealGroups(rank: Rank, count: number): number[][] {
  const indexes = Array.from({ length: count }, (_, index) => index);
  return PRIZE_META[rank].revealMode === 'together' ? [indexes] : indexes.map((index) => [index]);
}

/**
 * 릴에 흘려보낼 학번 목록. 참가자 목록이 있으면 실제 학번을, 새로고침 복구 등으로 없으면
 * 당첨자 학번의 앞 4자리를 이용한 임의 학번을 사용 (연출용, 추첨 결과와 무관).
 */
export function makeReelFillers(pool: string[], count: number, seedIds: string[]): string[] {
  const source =
    pool.length >= 8
      ? pool
      : Array.from({ length: 60 }, (_, index) => {
          const prefix = seedIds[index % Math.max(seedIds.length, 1)]?.slice(0, 4) ?? '2025';
          return `${prefix}${String(Math.floor(Math.random() * 10_000)).padStart(4, '0')}`;
        });

  return Array.from({ length: count }, () => source[Math.floor(Math.random() * source.length)]);
}
