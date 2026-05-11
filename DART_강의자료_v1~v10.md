# DART 재무분석기 — 버전별 강의자료 (v1 ~ v10)

---

## v1 — DART API 기초 + GUI 첫걸음

### 핵심 개념
- **DART OpenAPI** 가입 및 API 키 발급
- `urllib.request`로 HTTP 요청 (외부 라이브러리 없이)
- ZIP 파일 → XML 파싱 (기업코드 조회)
- `customtkinter`로 데스크탑 GUI 만들기

### 배울 점
```
DART API 호출 흐름
회사명 입력 → 기업코드 XML 검색 → corp_code 추출
→ fnlttSinglAcntAll.json 호출 → 재무데이터 수신
```

### 주요 계정 (6개)
`매출` · `영업이익` · `당기순이익` · `자산총계` · `부채총계` · `자본총계`

### 핵심 코드 패턴
```python
# ZIP 다운로드 → XML 파싱
with urllib.request.urlopen(url, timeout=30) as r:
    zdata = r.read()
with zipfile.ZipFile(io.BytesIO(zdata)) as zf:
    xml_bytes = zf.read("CORPCODE.xml")
root = ET.fromstring(xml_bytes)
```

### 한계
- 계정명이 회사마다 달라서 일부 누락 가능
- **1개 회사만** 조회 가능 → v3에서 해결

---

## v3 — 3개 회사 멀티비교 + 계정명 정규화

### 핵심 개념
- **3개 회사 동시 비교** (반복문 + 구조화)
- **계정명 정규화** (ALIAS 딕셔너리)
- **26개 계정과목** 확장
- `openpyxl`로 다중 시트 Excel 생성

### 배울 점
```
v1 한계: 회사 1개, 계정 6개
v3 개선: 회사 3개 동시 비교, 계정 26개

회사마다 계정명이 다른 문제
→ 딕셔너리로 별칭 매핑 (규칙 기반 해결)

"영업이익(손실)" → "영업이익"
"매출액" → "매출"
"당기순손익" → "당기순이익"
```

### ALIAS 딕셔너리 패턴
```python
ALIAS = {
    "영업이익(손실)":   "영업이익",
    "당기순이익(손실)": "당기순이익",
    "매출액":          "매출",
    ...
}
normalized = ALIAS.get(account_nm, account_nm)
```

### Excel 구조
```
Sheet1: 회사A 3개년
Sheet2: 회사B 3개년
Sheet3: 회사C 3개년
Sheet4: 3개사 2025년 비교
```

### 한계
- ALIAS에 없는 계정명은 여전히 누락
- `도급공사수익`, `이자수익` 같은 업종별 특수 계정 처리 불가

---

## v4 — 규칙 기반 재무분석 의견 자동 생성

### 핵심 개념
- **투자지표 자동 계산** (영업이익률, ROE, ROA, 부채비율 등)
- **조건문으로 의견 자동 생성** (if/else 규칙 트리)
- Sheet5 "재무분석 의견" 추가

### 배울 점
```
재무지표 계산 공식
영업이익률 = 영업이익 / 매출 × 100
ROE       = 당기순이익 / 자본총계 × 100
부채비율  = 부채총계 / 자본총계 × 100
유동비율  = 유동자산 / 유동부채 × 100
```

### 규칙 기반 의견 패턴
```python
if 영업이익률 >= 10:
    opinions.append("영업이익률 양호 (10% 이상)")
elif 영업이익률 >= 5:
    opinions.append("영업이익률 보통 (5~10%)")
else:
    opinions.append("영업이익률 주의 (5% 미만)")
```

### 한계
- 규칙이 고정되어 있어 복잡한 맥락 분석 불가
- 사람이 읽기 어색한 기계적 문장 → v5에서 해결

---

## v5 — Anthropic API (Claude)로 AI 의견 생성

### 핵심 개념
- **Anthropic API** 키 발급 및 사용
- `requests`로 Claude API 직접 호출
- 프롬프트 엔지니어링 기초
- v4 규칙 기반 → AI 기반으로 교체

### 배울 점
```
규칙 기반 vs AI 기반 차이
규칙: if/else 수백 줄 → 여전히 뻔한 분석
AI:  프롬프트 한 장 → 맥락 있는 전문가 의견
```

### API 호출 패턴
```python
import requests

response = requests.post(
    "https://api.anthropic.com/v1/messages",
    headers={"x-api-key": ANTHROPIC_API_KEY,
             "anthropic-version": "2023-06-01"},
    json={
        "model": "claude-opus-4-7",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}]
    }
)
opinion = response.json()["content"][0]["text"]
```

### 한계
- API 호출마다 비용 발생 → v6에서 CLI로 해결

---

## v6 — Claude CLI + JSON 파이프라인

### 핵심 개념
- **Claude CLI** (`claude` 명령어) 활용
- **JSON 중간 저장** → CLI에 파일로 전달
- **subprocess**로 외부 프로세스 호출
- GUI 모드 + CLI 모드 분리

### 배울 점
```
API vs CLI 차이
API: 코드에서 직접 HTTP 호출 (호출마다 비용)
CLI: 터미널 명령어로 Claude 호출 (구독 플랜, 무제한)

subprocess 패턴
result = subprocess.run(
    "claude --print -",
    input=prompt,
    capture_output=True,
    text=True, shell=True
)
```

### 데이터 파이프라인
```
DART API → 재무데이터 수집
→ data.json 저장
→ claude CLI가 JSON 읽어 분석
→ Sheet5에 의견 기록
```

### 한계
- TARGET 목록에 없는 계정명은 fetch 단계에서 버려짐
- `도급공사수익` 같은 업종별 계정 여전히 누락 → v7에서 해결

---

## v7 — Claude CLI로 계정 자동 분류

### 핵심 개념
- **전체 계정 수집** 후 AI가 분류 (TARGET 한계 극복)
- `fnlttSinglAcntAll` → 모든 계정 가져오기
- Claude CLI에게 "이 중 매출이 뭐야?" 질문
- 동적 계정 매핑

### 배울 점
```
v6 문제
→ "도급공사수익"은 TARGET에 없어서 수집 안 됨

v7 해결
→ 전체 계정 다 가져온 뒤 Claude가 분류
   "도급공사수익" → Claude → "매출"
```

### 분류 흐름
```python
# 전체 계정명 목록을 Claude에게 전달
all_accounts = ["도급공사수익", "판매비", "영업이익(손실)", ...]
prompt = f"아래 계정 중 '매출'에 해당하는 것은? {all_accounts}"
# Claude 응답 → 매핑 딕셔너리 생성
```

### 한계 (치명적 버그 발견!)
- 연도별로 계정명이 달라질 수 있음
- Claude가 한 연도 기준으로 분류 → 다른 연도 누락
- 예: 2023년 "도급공사수익" → 2025년 "건설수익"으로 변경 시 누락 → v8에서 해결

---

## v8 — account_id 기반 매핑 (버그 완전 해결)

### 핵심 개념
- **account_id** (IFRS 표준코드) 발견 및 활용
- CODE_MAP 딕셔너리로 직접 매핑
- Claude CLI 분류 호출 완전 제거
- NAME_MAP 폴백 (표준코드 미사용 기업 대응)

### 핵심 아이디어
```
account_nm (계정명): 연도/회사마다 다름 → 누락 발생
account_id  (코드):  IFRS 국제표준 → 항상 동일!

"도급공사수익" (2023) → account_id: ifrs-full_Revenue
"건설수익"    (2025) → account_id: ifrs-full_Revenue
→ 둘 다 "매출"로 정확히 매핑!
```

### CODE_MAP 패턴
```python
CODE_MAP = {
    "ifrs-full_Revenue":                           "매출",
    "ifrs-full_ProfitLossFromOperatingActivities": "영업이익",
    "ifrs-full_ProfitLoss":                        "당기순이익",
    "ifrs-full_Assets":                            "자산총계",
    "ifrs-full_Equity":                            "자본총계",
    ...  # 30개 이상
}

# 폴백: account_id 없을 때 account_nm으로
std = CODE_MAP.get(account_id) or NAME_MAP.get(account_nm)
```

### 성과
- Claude CLI 분류 호출 제거 → 속도 3배 향상
- 연도별 누락 완전 해결
- 30개 이상 계정과목 안정적 수집

---

## v9 — 웹앱 전환 + LAN 공유 (FastAPI + React)

### 핵심 개념
- v8 로직을 **웹앱**으로 전환 (첫 웹앱!)
- **FastAPI** 백엔드 + **React + Vite** 프론트엔드
- `--host` 옵션으로 LAN 전체 공개
- 동적 API URL (`window.location.hostname` 활용)
- Windows 방화벽 포트 개방

### 배울 점
```
데스크탑 앱 vs 웹앱 구조 차이
Python ↔ JavaScript 통신 방식 (JSON)

localhost vs 네트워크 접속 차이
localhost:  내 컴퓨터만 접속 가능
0.0.0.0:   같은 WiFi의 모든 기기 접속 가능

동적 URL 패턴
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:8002'
  : `http://${window.location.hostname}:8002`
```

### 실행 구조
```
start.bat
├── uvicorn api.main:app --host 0.0.0.0 --port 8002
├── vite --port 5174 --host          ← --host 필수!
└── 브라우저 자동 실행

방화벽 포트 개방 (Windows)
netsh advfirewall firewall add rule
  name="DART API" protocol=TCP dir=in localport=8002 action=allow
```

### 한계
- 같은 WiFi 내에서만 접속 가능
- 서버 컴퓨터가 켜져 있어야 함 → v10에서 해결

---

## v10 — Vercel 클라우드 배포 (누구나 접속)

### 핵심 개념
- **GitHub** 연동으로 자동 배포
- **Vercel 서버리스** (Python FastAPI)
- 클라우드 환경 제약 이해 (`/tmp` 쓰기 제한)
- **병렬 API 호출** (`ThreadPoolExecutor`)

### 배울 점
```
로컬 vs 클라우드 차이
로컬: 파일 어디든 쓰기 가능
Vercel: /tmp 만 쓰기 가능 (함수 실행 후 삭제)

로컬: API 순차 호출 OK (느려도 타임아웃 없음)
Vercel: 60초 타임아웃 → 병렬 호출 필수
```

### 병렬 처리 패턴
```python
from concurrent.futures import ThreadPoolExecutor, as_completed

# 9개 호출(3회사×3년) 동시 실행
with ThreadPoolExecutor(max_workers=9) as ex:
    futures = {ex.submit(fetch_one, corp, yr): (corp, yr)
               for corp in corps for yr in YEARS}
    for f in as_completed(futures):
        corp, yr, data = f.result()
```

### 배포 흐름
```
코드 수정
→ git push origin main
→ Vercel 자동 감지
→ npm run build (React 빌드)
→ Python 서버리스 함수 배포
→ https://dart-v9.vercel.app 업데이트 완료
```

### vercel.json 핵심
```json
{
  "builds": [
    { "src": "api/main.py", "use": "@vercel/python",
      "config": { "maxDuration": 60 } },
    { "src": "package.json", "use": "@vercel/static-build",
      "config": { "distDir": "dist" } }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "api/main.py" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

---

## 전체 버전 요약

| 버전 | 핵심 기술 | 추가된 것 |
|------|----------|----------|
| v1 | DART API, urllib, customtkinter | 기초 조회 + GUI (1개 회사) |
| v3 | ALIAS 딕셔너리, openpyxl | 3사 비교 + 26개 계정 |
| v4 | 투자지표 계산, 조건문 | 규칙 기반 재무분석 의견 |
| v5 | Anthropic API, requests | Claude API AI 의견 |
| v6 | subprocess, Claude CLI, JSON | CLI 파이프라인 (비용 절감) |
| v7 | 전체 계정 수집, 동적 분류 | AI 계정 자동 분류 |
| v8 | account_id, IFRS 코드 | 누락 버그 완전 해결 |
| v9 | FastAPI, React, --host | 웹앱 전환 + LAN 공유 |
| v10 | Vercel, GitHub CI/CD, 병렬처리 | 클라우드 배포 (URL 공유) |

---

*DART 재무분석기 강의자료 — v1, v3~v10*
