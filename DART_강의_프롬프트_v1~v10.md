# DART 재무분석기 — 수강생 프롬프트 모음 (v1, v3~v10)
> Claude에게 아래 프롬프트를 그대로 입력하면 각 버전 코드가 생성됩니다.

---

## v1 프롬프트 — DART API 기초 + GUI

```
DART OpenAPI로 재무분석기를 만들어줘.

조건:
- DART API키: f8692c12c4fad4928eabbfe55e957a4d29fef157
- 회사명을 입력하면 기업코드 XML에서 검색
- 동명이인 회사가 여러 개면 선택 팝업 표시
- 3개년(2023/2024/2025) 재무제표 자동 조회
- 수집 항목: 매출, 영업이익, 당기순이익, 자산총계, 부채총계, 자본총계
- 영업이익률, 순이익률, 부채비율 자동 계산
- YoY(전년대비) 증감률 표시 (▲▼)
- openpyxl로 Excel 파일 자동 저장
- customtkinter로 GUI (네이비 컬러, 깔끔하게)
- Python 파일 하나로 완성
- 패키지 없으면 자동 pip install
```

---

## v3 프롬프트 — 3개 회사 멀티비교 + 계정 정규화

```
v1 코드 기반으로 3개 회사 동시 비교 기능을 추가해줘.

추가 조건:
- 회사 입력칸 3개 (각각 검색 + 선택)
- 계정과목 26개로 확장:
  손익: 매출, 매출원가, 매출총이익, 판매비와관리비, 영업이익,
        금융수익, 금융비용, 법인세비용차감전순이익, 법인세비용, 당기순이익, EPS
  재무: 유동자산, 비유동자산, 자산총계, 유동부채, 비유동부채,
        부채총계, 이익잉여금, 자본총계
  지표: 영업이익률, 순이익률, ROE, ROA, 부채비율, 유동비율, 이자보상배율
- 계정명 정규화 ALIAS 딕셔너리 적용
  예) "영업이익(손실)" → "영업이익", "매출액" → "매출"
- Excel: 회사별 시트 3개 + 전체비교 시트 1개
```

---

## v4 프롬프트 — 규칙 기반 재무분석 의견 자동 생성

```
v3 코드 기반으로 재무분석 종합 의견 자동 생성을 추가해줘.

추가 조건:
- 투자지표 기준으로 조건문 의견 자동 생성
  예) 영업이익률 10% 이상 → "수익성 우수"
      부채비율 200% 초과 → "부채 수준 주의"
      ROE 15% 이상 → "자기자본 효율 양호"
- 회사당 10줄 이상 의견 생성
- Excel Sheet5에 "재무분석 의견" 시트 추가
- 3개 회사 의견 나란히 비교
```

---

## v5 프롬프트 — Anthropic API로 AI 의견 생성

```
v4의 규칙 기반 의견 생성을 Anthropic Claude API로 교체해줘.

추가 조건:
- Anthropic API키: [여기에 본인 API키 입력]
- POST https://api.anthropic.com/v1/messages 직접 호출
- 모델: claude-opus-4-7
- 프롬프트: 재무 데이터 JSON → 전문가 수준 10줄 한국어 의견
- ①~⑩ 번호로 시작하는 의견 형식 유지
- Sheet5 "AI 분석 의견" 시트에 저장
- v4 규칙 기반 코드 완전 제거
```

---

## v6 프롬프트 — Claude CLI + JSON 파이프라인

```
v5 기반으로 Anthropic API 대신 Claude CLI를 사용하도록 바꿔줘.

추가 조건:
- subprocess로 claude CLI 호출 (claude --print -)
- 재무 데이터를 JSON 파일로 저장 후 CLI에 전달
- GUI 모드: 기존처럼 화면에서 실행
- CLI 모드: python script.py data.json 형식으로도 실행 가능
- Claude CLI 없으면 안내 메시지 출력
- Anthropic API 관련 코드 제거
```

---

## v7 프롬프트 — Claude CLI로 계정 자동 분류

```
v6의 계정 수집 방식을 개선해줘.

문제:
- 현재는 TARGET 목록에 있는 계정명만 수집
- "도급공사수익", "이자수익" 같은 업종별 특수 계정은 누락됨

해결:
- fnlttSinglAcntAll로 전체 계정 다 가져오기
- Claude CLI에게 "이 계정 목록 중 매출/영업이익/... 에 해당하는 게 뭐야?" 질문
- Claude 응답으로 계정 매핑 딕셔너리 자동 생성
- 이후 해당 계정값 추출
- TARGET 딕셔너리 하드코딩 제거
```

---

## v8 프롬프트 — account_id 기반 매핑 (누락 버그 완전 해결)

```
v7의 계정 분류 방식을 account_id 기반으로 완전히 바꿔줘.

배경:
- DART API 응답에 account_id 필드가 있음 (IFRS 국제표준코드)
- account_nm(계정명)은 연도/회사마다 다르지만
  account_id는 항상 동일 (ifrs-full_Revenue = 항상 매출)
- Claude CLI 분류 호출이 불필요해짐

조건:
- CODE_MAP 딕셔너리로 account_id → 표준항목 직접 매핑
  예) "ifrs-full_Revenue" → "매출"
      "ifrs-full_ProfitLossFromOperatingActivities" → "영업이익"
- account_id가 없는 경우 NAME_MAP으로 account_nm 폴백
  예) "보통주기본주당이익(손실)" → "EPS"
- Claude CLI 계정분류 호출 완전 제거 → 속도 3배 향상
- Sheet5 AI 분석용 Claude CLI 호출은 유지
```

---

## v9 프롬프트 — 웹앱 전환 + LAN 공유 (FastAPI + React)

```
v8 로직을 FastAPI + React 웹앱으로 구현해줘.

조건:
- 백엔드: FastAPI 포트 8002, CORS 전체 허용
- 프론트엔드: React + Vite + TailwindCSS
- 3개 회사 멀티비교 UI (v8과 동일한 기능)
- API 엔드포인트:
  POST /api/search        → 회사명으로 기업코드 검색
  POST /api/analyze-multi → 3개 회사 재무분석 + Excel 생성
  POST /api/opinion       → Claude CLI AI 분석
  GET  /api/download/{filename} → Excel 다운로드
- API URL 동적 설정:
  const API = window.location.hostname === 'localhost'
    ? 'http://localhost:8002'
    : `http://${window.location.hostname}:8002`
- Vite 실행 시 --host 옵션 (외부 접속 허용)
- start.bat: API + Vite 동시 실행, 브라우저 자동 오픈
- 같은 WiFi의 다른 PC에서도 접속 가능하게
```

---

## v10 프롬프트 — Vercel 클라우드 배포

```
v9 웹앱을 Vercel에 배포할 수 있도록 설정 파일을 만들어줘.

조건:
- vercel.json 생성:
  - api/main.py → @vercel/python (maxDuration: 60초)
  - package.json → @vercel/static-build (distDir: dist)
  - /api/* → FastAPI, 나머지 → React 정적 파일
- requirements.txt: fastapi, uvicorn, openpyxl
- Vercel 서버리스 환경 대응:
  - 파일 쓰기는 /tmp 디렉토리 사용 (/tmp 없으면 BASE_DIR 폴백)
  - 기업코드 XML은 프로젝트에 포함 (배포 시 다운로드 불필요)
- DART API 병렬 호출:
  - ThreadPoolExecutor로 3회사×3년=9개 동시 호출
  - 순차 호출 대비 3배 속도 향상
- .gitignore: node_modules/, dist/, __pycache__/, api/output/
- GitHub push → Vercel 자동 배포 연동
```

---

## 프롬프트 활용 팁

### 코드가 안 되면 이렇게 추가 요청
```
실행하니까 이런 오류가 났어:
[오류 메시지 붙여넣기]
고쳐줘.
```

### 기능 추가하고 싶을 때
```
지금 코드에서 [추가하고 싶은 기능] 추가해줘.
나머지는 그대로 유지해.
```

### 이해 안 되는 코드 있을 때
```
이 부분이 무슨 뜻이야?
[코드 붙여넣기]
초보자도 이해할 수 있게 설명해줘.
```

---

*DART 재무분석기 강의 프롬프트 — v1, v3~v10*
