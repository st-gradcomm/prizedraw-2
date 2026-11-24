import type {
  DrawResult,
  InvalidReason,
  InvalidRow,
  Participant,
  PrizeConfig,
  Rank,
  ResultFile,
  ValidationResult,
} from '../types/raffle';

export const STUDENT_ID_REGEX = /^\d{8}$/;

export const RANKS: Rank[] = ['1등', '2등', '3등'];

export const DEFAULT_PRIZES: PrizeConfig[] = [
  { rank: '3등', name: '샤오미 보조배터리', count: 5, revealOrder: 1 },
  { rank: '2등', name: '로지텍 키보드 마우스 세트', count: 2, revealOrder: 2 },
  { rank: '1등', name: '에어팟 5세대', count: 1, revealOrder: 3 },
];

export const ALGORITHM = 'SHA-256(seed + ":" + studentId), ascending sort';

const HEADER_NAMES = new Set(['student_id', 'studentid', 'student id', 'id', '학번']);

export function totalPrizeCount(prizes: PrizeConfig[] = DEFAULT_PRIZES): number {
  return prizes.reduce((sum, prize) => sum + prize.count, 0);
}

/** 공개 순서대로 정렬된 경품 목록 (기본: 3등 → 2등 → 1등) */
export function prizesInRevealOrder(prizes: PrizeConfig[] = DEFAULT_PRIZES): PrizeConfig[] {
  return [...prizes].sort((a, b) => a.revealOrder - b.revealOrder);
}

export function normalizeStudentId(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function validateStudentId(value: string): boolean {
  return STUDENT_ID_REGEX.test(value);
}

export function maskStudentId(id: string): string {
  if (id.length <= 2) return '*'.repeat(id.length);
  if (id.length <= 4) {
    return `${id[0]}${'*'.repeat(id.length - 2)}${id[id.length - 1]}`;
  }

  return `${id.slice(0, 2)}${'*'.repeat(id.length - 4)}${id.slice(-2)}`;
}

export function reasonLabel(reason: InvalidReason): string {
  const labels: Record<InvalidReason, string> = {
    EMPTY: '빈 값',
    INVALID_FORMAT: '학번 형식 오류',
    DUPLICATE: '중복',
  };

  return labels[reason];
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === ',' || char === '\t') && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells.map((value) => value.trim());
}

function isHeaderCell(cell: string): boolean {
  const lower = cell.toLowerCase();
  return HEADER_NAMES.has(lower) || lower.includes('학번');
}

/**
 * 학번 열 결정:
 * 1) 첫 행에 '학번' / student_id 같은 헤더가 있으면 그 열을 사용하고 헤더 행은 건너뜀
 *    (구글폼 응답 CSV처럼 타임스탬프·이름 열이 앞에 있어도 동작)
 * 2) 헤더가 없으면 유효한 학번이 가장 많은 열을 사용
 */
function detectColumn(table: string[][]): { columnIndex: number; headerDetected: boolean } {
  const headerIndex = (table[0] ?? []).findIndex(isHeaderCell);
  if (headerIndex >= 0) return { columnIndex: headerIndex, headerDetected: true };

  const width = Math.max(0, ...table.map((cells) => cells.length));
  let best = 0;
  let bestScore = -1;

  for (let column = 0; column < width; column += 1) {
    const score = table.filter((cells) =>
      validateStudentId(normalizeStudentId(cells[column] ?? '')),
    ).length;

    if (score > bestScore) {
      best = column;
      bestScore = score;
    }
  }

  return { columnIndex: best, headerDetected: false };
}

export function parseParticipants(input: string): ValidationResult {
  const lines = input
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line, index) => ({ rowIndex: index + 1, line }))
    .filter(({ line }) => line.trim() !== '');

  const table = lines.map(({ line }) => splitCsvLine(line));
  const { columnIndex, headerDetected } = detectColumn(table);

  const seen = new Set<string>();
  const invalidRows: InvalidRow[] = [];
  const participants: Participant[] = [];

  lines.forEach(({ rowIndex }, index) => {
    if (headerDetected && index === 0) return;

    const rawValue = table[index][columnIndex] ?? '';
    const reject = (reason: InvalidReason) => invalidRows.push({ rowIndex, rawValue, reason });

    if (!rawValue) return reject('EMPTY');

    const studentId = normalizeStudentId(rawValue);
    if (!validateStudentId(studentId)) return reject('INVALID_FORMAT');
    if (seen.has(studentId)) return reject('DUPLICATE');

    seen.add(studentId);
    participants.push({ rawValue, studentId, maskedId: maskStudentId(studentId) });
  });

  participants.sort((a, b) => a.studentId.localeCompare(b.studentId));

  return {
    columnIndex,
    headerDetected,
    totalRows: lines.length - (headerDetected ? 1 : 0),
    validCount: participants.length,
    duplicateCount: invalidRows.filter((row) => row.reason === 'DUPLICATE').length,
    invalidRows,
    participants,
  };
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input: string): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error('현재 브라우저에서 SHA-256 기능을 사용할 수 없습니다. (https 또는 localhost 필요)');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return toHex(new Uint8Array(hashBuffer));
}

/**
 * 추첨 시각을 seed로 사용한다. (ISO 8601, UTC, 밀리초 단위 — 예: 2026-11-24T03:12:45.123Z)
 * 사람이 읽을 수 있고 방송 화면의 시각과 대조할 수 있어, 누구나 결과를 재계산해 검증할 수 있다.
 */
export function generateSeed(now: Date = new Date()): string {
  return now.toISOString();
}

export async function createParticipantHash(participants: Participant[]): Promise<string> {
  const sortedIds = participants.map((participant) => participant.studentId).sort();
  return sha256Hex(sortedIds.join('\n'));
}

export async function drawWinners(
  eventName: string,
  participants: Participant[],
  seed: string,
  prizes: PrizeConfig[] = DEFAULT_PRIZES,
): Promise<DrawResult> {
  const required = totalPrizeCount(prizes);

  if (participants.length < required) {
    throw new Error(`참가자가 부족합니다. 현재 ${participants.length}명, 필요 ${required}명`);
  }

  const scored = await Promise.all(
    participants.map(async (participant) => ({
      participant,
      score: await sha256Hex(`${seed}:${participant.studentId}`),
    })),
  );

  scored.sort((a, b) => a.score.localeCompare(b.score));

  const winners = { '1등': [], '2등': [], '3등': [] } as Record<Rank, Participant[]>;
  let cursor = 0;

  for (const prize of prizesInRevealOrder(prizes)) {
    winners[prize.rank] = scored
      .slice(cursor, cursor + prize.count)
      .map((item) => item.participant);
    cursor += prize.count;
  }

  return {
    eventName,
    participantCount: participants.length,
    participantHash: await createParticipantHash(participants),
    seed,
    algorithm: ALGORITHM,
    prizes,
    winners,
    generatedAt: new Date().toISOString(),
    appVersion: __APP_VERSION__,
  };
}

export function makeSampleData(count = 90): string {
  return Array.from({ length: count }, (_, index) => String(20250001 + index * 37)).join('\n');
}

type ExportOptions = {
  /** true면 학번을 마스킹 (당첨자 공개 페이지용) */
  masked?: boolean;
};

function displayId(participant: Participant, { masked = false }: ExportOptions): string {
  return masked ? participant.maskedId : participant.studentId;
}

export function resultToJson(result: DrawResult, options: ExportOptions = {}): string {
  const winners = Object.fromEntries(
    RANKS.map((rank) => [rank, result.winners[rank].map((winner) => displayId(winner, options))]),
  ) as Record<Rank, string[]>;

  const output: ResultFile = {
    eventName: result.eventName,
    participantCount: result.participantCount,
    participantHash: result.participantHash,
    seed: result.seed,
    algorithm: result.algorithm,
    prizes: result.prizes,
    winners,
    masked: Boolean(options.masked),
    generatedAt: result.generatedAt,
    appVersion: result.appVersion,
  };

  return JSON.stringify(output, null, 2);
}

/** 당첨자 공개 페이지에 올릴 파일 (마스킹된 JSON) */
export const PUBLIC_RESULT_FILENAME = 'winners.json';

export function resultToPublicJson(result: DrawResult): string {
  return resultToJson(result, { masked: true });
}

/** 공개 페이지에서 winners.json을 읽을 때 사용. 형식이 맞지 않으면 에러 */
export function parseResultFile(json: unknown): ResultFile {
  const data = json as Partial<ResultFile> | null;
  const ok =
    data !== null &&
    typeof data === 'object' &&
    typeof data.eventName === 'string' &&
    Array.isArray(data.prizes) &&
    typeof data.winners === 'object' &&
    data.winners !== null &&
    RANKS.every((rank) => Array.isArray(data.winners?.[rank]));

  if (!ok) throw new Error('결과 파일 형식이 올바르지 않습니다.');
  return data as ResultFile;
}

export function resultToCsv(result: DrawResult, options: ExportOptions = {}): string {
  const prizeName = Object.fromEntries(result.prizes.map((prize) => [prize.rank, prize.name]));
  const lines = ['rank,prize,student_id'];

  for (const rank of RANKS) {
    for (const winner of result.winners[rank]) {
      lines.push(`${rank},${prizeName[rank] ?? ''},${displayId(winner, options)}`);
    }
  }

  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, type: string): void {
  // Excel에서 한글이 깨지지 않도록 CSV에는 BOM 추가
  const body = type.startsWith('text/csv') ? `﻿${content}` : content;
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
