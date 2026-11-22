# prizedraw-2

학번 기반 경품 추첨 웹앱. (디자인 리뉴얼 진행 중 — 레퍼런스: `docs/reference/`)

## 경품

| 등수 | 경품 | 인원 |
| --- | --- | --- |
| 3등 | 샤오미 보조배터리 | 5 |
| 2등 | 로지텍 키보드 마우스 세트 | 2 |
| 1등 | 에어팟 5세대 | 1 |

공개 순서: 3등 → 2등 → 1등 (3회 진행). 설정은 `src/lib/raffle.ts`의 `DEFAULT_PRIZES`.

## 구조

- `src/lib/raffle.ts` — 엔진: 입력 파싱/검증, SHA-256 기반 재현 가능한 추첨, 결과 내보내기
- `src/hooks/useRaffle.ts` — 진행 상태 (INPUT → READY → REVEAL ×3 → RESULT), 디자인과 무관
- `src/lib/fullscreen.ts` — 전체화면 유틸
- `src/hooks/useStageControls.ts` — 키보드 조작
- `src/hooks/useHashRoute.ts` — `#/`(추첨 화면) / `#/winners`(당첨자 공개 페이지)
- `src/pages/` — 화면 (현재 임시)

## 조작

화면 버튼과 키보드 모두 지원. 노트북 화면을 폰으로 촬영하는 데스크탑 기준.

| 키 | 동작 |
| --- | --- |
| Space / Enter / → / PageDown | 다음 (클리커 사용 가능) |
| F | 전체화면 토글 |

진행 중 실수로 새로고침해도 같은 탭이면 이어서 진행 (sessionStorage, 탭 닫으면 삭제).

## 입력

- CSV 업로드 또는 붙여넣기. `학번` / `student_id` 헤더가 있으면 그 열을 사용 (구글폼 응답 CSV 그대로 가능)
- 헤더가 없으면 유효 학번이 가장 많은 열을 자동 선택
- 8자리 숫자, 공백·하이픈 제거 후 검증, 중복 제거

## 학번 표시

추첨 화면에는 전체 학번을 표시. 당첨자 공개 페이지에는 마스킹(`20****01`)된 학번만 표시.

## 당첨자 공개 페이지 올리기

1. 추첨 후 결과 화면에서 `winners.json` 다운로드 (마스킹된 공개용)
2. `public/winners.json`에 넣고 main에 push → 자동 배포
3. `https://<계정>.github.io/prizedraw-2/#/winners`에서 확인 (파일이 없으면 "발표 전" 표시)

원본 결과(`raffle-result.json/csv`, 전체 학번)는 커밋하지 말 것.

## 개발

```bash
npm install
npm run dev
npm test
npm run build
```
