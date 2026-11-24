import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRIZES,
  drawWinners,
  generateSeed,
  makeSampleData,
  maskStudentId,
  parseParticipants,
  resultToCsv,
  resultToJson,
  resultToPublicJson,
  parseResultFile,
  totalPrizeCount,
} from './raffle';
import type { PrizeConfig } from '../types/raffle';

const SEED = '2026-11-24T03:12:45.123Z';

describe('parseParticipants', () => {
  it('정규화·형식 검증·중복 제거', () => {
    const result = parseParticipants('2025 0001\n2025-0002\n20250001\n1234\nabc');
    expect(result.participants.map((p) => p.studentId)).toEqual(['20250001', '20250002']);
    expect(result.invalidRows.map((r) => r.reason)).toEqual([
      'DUPLICATE',
      'INVALID_FORMAT',
      'INVALID_FORMAT',
    ]);
    expect(result.duplicateCount).toBe(1);
  });

  it('빈 줄은 무시하고 BOM + 헤더를 처리', () => {
    const result = parseParticipants('﻿학번\r\n20250001\r\n\r\n20250002\r\n');
    expect(result.headerDetected).toBe(true);
    expect(result.validCount).toBe(2);
    expect(result.invalidRows).toEqual([]);
    expect(result.totalRows).toBe(2);
  });

  it('구글폼 CSV처럼 학번 열이 중간에 있어도 헤더로 찾음', () => {
    const csv = [
      '타임스탬프,이름,학번(8자리),연락처',
      '"2026. 11. 1 오후 3:00:00",홍길동,20250001,010-1234-5678',
      '"2026. 11. 1 오후 3:01:00",김철수,20250002,010-0000-0000',
    ].join('\n');
    const result = parseParticipants(csv);
    expect(result.columnIndex).toBe(2);
    expect(result.participants.map((p) => p.studentId)).toEqual(['20250001', '20250002']);
  });

  it('헤더가 없으면 학번이 가장 많은 열을 선택', () => {
    const result = parseParticipants('홍길동,20250001\n김철수,20250002');
    expect(result.headerDetected).toBe(false);
    expect(result.columnIndex).toBe(1);
    expect(result.validCount).toBe(2);
  });
});

describe('generateSeed', () => {
  it('현재 시각을 ISO 8601(UTC, 밀리초) 문자열로 반환', () => {
    expect(generateSeed(new Date(Date.UTC(2026, 10, 24, 3, 12, 45, 123)))).toBe(SEED);
    expect(generateSeed()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('시각이 다르면 결과도 달라짐', async () => {
    const participants = parseParticipants(makeSampleData(30)).participants;
    const a = await drawWinners('t', participants, generateSeed(new Date(0)));
    const b = await drawWinners('t', participants, generateSeed(new Date(1)));
    expect(a.winners).not.toEqual(b.winners);
  });
});

describe('drawWinners', () => {
  const participants = parseParticipants(makeSampleData(30)).participants;

  it('같은 seed·참가자면 같은 결과', async () => {
    const a = await drawWinners('t', participants, SEED);
    const b = await drawWinners('t', [...participants].reverse(), SEED);
    expect(a.winners).toEqual(b.winners);
    expect(a.participantHash).toBe(b.participantHash);
  });

  it('경품 수만큼 중복 없이 당첨', async () => {
    const result = await drawWinners('t', participants, SEED);
    expect(result.winners['3등']).toHaveLength(5);
    expect(result.winners['2등']).toHaveLength(2);
    expect(result.winners['1등']).toHaveLength(1);

    const all = Object.values(result.winners).flat().map((p) => p.studentId);
    expect(new Set(all).size).toBe(totalPrizeCount());
  });

  it('인원 부족 체크는 넘겨준 경품 설정 기준', async () => {
    const big: PrizeConfig[] = [{ rank: '1등', name: 'x', count: 31, revealOrder: 1 }];
    await expect(drawWinners('t', participants, SEED, big)).rejects.toThrow('필요 31명');

    const small = parseParticipants('20250001\n20250002').participants;
    const tiny: PrizeConfig[] = [{ rank: '1등', name: 'x', count: 1, revealOrder: 1 }];
    await expect(drawWinners('t', small, SEED, tiny)).resolves.toBeTruthy();
    await expect(drawWinners('t', small, SEED, DEFAULT_PRIZES)).rejects.toThrow();
  });
});

describe('내보내기', () => {
  it('공개용은 마스킹, 기본은 전체 학번', async () => {
    const participants = parseParticipants(makeSampleData(30)).participants;
    const result = await drawWinners('t', participants, SEED);
    const first = result.winners['1등'][0];

    expect(resultToCsv(result)).toContain(first.studentId);
    expect(resultToCsv(result, { masked: true })).not.toContain(first.studentId);
    expect(resultToCsv(result, { masked: true })).toContain(maskStudentId(first.studentId));
    expect(JSON.parse(resultToJson(result)).winners['1등']).toEqual([first.studentId]);
  });
});

describe('공개 결과 파일', () => {
  it('마스킹된 JSON을 다시 읽을 수 있음', async () => {
    const participants = parseParticipants(makeSampleData(30)).participants;
    const result = await drawWinners('t', participants, SEED);
    const file = parseResultFile(JSON.parse(resultToPublicJson(result)));

    expect(file.masked).toBe(true);
    expect(file.winners['1등']).toEqual([result.winners['1등'][0].maskedId]);
    expect(() => parseResultFile({ eventName: 'x' })).toThrow();
  });
});
