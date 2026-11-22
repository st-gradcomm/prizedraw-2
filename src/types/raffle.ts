export type Rank = '1등' | '2등' | '3등';

export interface Participant {
  /** 입력 원본 값 (공백·하이픈 등 포함 가능) */
  rawValue: string;
  /** 숫자만 남긴 정규화 학번 — 추첨·표시 기준 */
  studentId: string;
  /** 공개 페이지용 마스킹 학번 */
  maskedId: string;
}

export type InvalidReason = 'EMPTY' | 'INVALID_FORMAT' | 'DUPLICATE';

export interface InvalidRow {
  rowIndex: number;
  rawValue: string;
  reason: InvalidReason;
}

export interface ValidationResult {
  /** 학번 열로 사용한 열 번호 (0부터) */
  columnIndex: number;
  /** 헤더 행을 감지해 건너뛰었는지 */
  headerDetected: boolean;
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidRows: InvalidRow[];
  participants: Participant[];
}

export interface PrizeConfig {
  rank: Rank;
  name: string;
  count: number;
  /** 공개 순서 (1 = 가장 먼저) */
  revealOrder: number;
}

export interface DrawResult {
  eventName: string;
  participantCount: number;
  participantHash: string;
  seed: string;
  algorithm: string;
  prizes: PrizeConfig[];
  winners: Record<Rank, Participant[]>;
  generatedAt: string;
  appVersion: string;
}

/** JSON으로 내보내는 결과 파일 형식 (masked=true면 공개 페이지용) */
export interface ResultFile {
  eventName: string;
  participantCount: number;
  participantHash: string;
  seed: string;
  algorithm: string;
  prizes: PrizeConfig[];
  winners: Record<Rank, string[]>;
  masked: boolean;
  generatedAt: string;
  appVersion: string;
}
