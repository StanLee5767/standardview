# DART 재무분석기 v10 — 기술 문서

---

## 1. PRD (제품 요구사항 문서)

### 제품 개요
| 항목 | 내용 |
|------|------|
| 제품명 | DART 재무분석기 v10 |
| 배포 URL | https://dart-v9.vercel.app |
| 목적 | 금융감독원 DART API 기반 3개 기업 재무제표 자동 비교 분석 |
| 사용자 | 재무분석에 관심 있는 일반인, 투자자, 학습자 |
| 환경 | 웹 브라우저 (설치 불필요) |

### 기능 요구사항

#### FR-01 기업 검색
- 회사명 일부만 입력해도 검색 가능 (부분 일치)
- 동명이인 기업 목록에서 선택
- 상장/비상장 구분 표시 (종목코드 유무)
- 검색 결과 최대 30개

#### FR-02 재무 분석
- 3개 기업 동시 비교
- 3개년(2023/2024/2025) 재무데이터 조회
- 연결재무제표(CFS) 우선, 없으면 별도재무제표(OFS)
- 26개 계정과목 자동 수집

#### FR-03 계정 매핑
- IFRS account_id 기반 표준 매핑 (CODE_MAP)
- account_id 없는 경우 계정명 폴백 (NAME_MAP)
- 연도/회사별 계정명 차이에 무관하게 일관된 수집

#### FR-04 투자지표 자동 계산
- 영업이익률, 순이익률, ROE, ROA
- 부채비율, 유동비율, 이자보상배율
- YoY(전년대비) 증감률 (▲▼ 표시)

#### FR-05 Excel 다운로드
- 회사별 시트 3개 + 전체비교 시트 1개
- 색상 코딩 (상승 녹색, 하락 적색)
- 파일명: 멀티비교_회사A_회사B_회사C_날짜.xlsx

#### FR-06 AI 재무분석 의견
- 회사별 Claude CLI 기반 10줄 전문가 의견
- ①~⑩ 번호 형식
- Claude CLI 미설치 시 안내 메시지

### 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| 응답시간 | 분석 완료 60초 이내 |
| 가용성 | Vercel 서버리스 (자동 스케일링) |
| 접근성 | URL만 있으면 어느 기기에서나 접속 |
| 비용 | Vercel Hobby 무료 플랜 |
| 보안 | DART API 키 서버사이드 보관 |

---

## 2. System Architecture Diagram (텍스트 기반)

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 (브라우저)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                      │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   Static Files (CDN)    │  │  Serverless Functions    │  │
│  │                         │  │                          │  │
│  │  index.html             │  │  api/main.py (FastAPI)   │  │
│  │  assets/main.js         │  │  - /api/search           │  │
│  │  assets/main.css        │  │  - /api/analyze-multi    │  │
│  │  (React 빌드 결과물)     │  │  - /api/opinion          │  │
│  │                         │  │  - /api/download/{file}  │  │
│  └─────────────────────────┘  └──────────┬───────────────┘  │
│          /(.*) 라우팅                      │ /api/(.*) 라우팅  │
└──────────────────────────────────────────┼──────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────┐
                    │                      │                   │
                    ▼                      ▼                   ▼
          ┌──────────────┐      ┌──────────────────┐  ┌──────────────┐
          │  DART API    │      │  /tmp (임시저장)  │  │ Claude CLI   │
          │  (금감원)    │      │  - corpcode.xml  │  │ (AI 의견)    │
          │              │      │  - output/*.xlsx │  │ (로컬만)     │
          │ corpCode.xml │      └──────────────────┘  └──────────────┘
          │ fnlttSingl.. │
          └──────────────┘
```

### 라우팅 규칙
```
요청 URL              →  처리 위치
/api/search           →  api/main.py (Python Serverless)
/api/analyze-multi    →  api/main.py (Python Serverless)
/api/opinion          →  api/main.py (Python Serverless)
/api/download/파일명   →  api/main.py (Python Serverless)
/ (그 외 모두)        →  dist/index.html (React SPA)
```

---

## 3. 데이터 흐름 (Data Flow)

### 3-1. 기업 검색 흐름
```
[사용자]
    │ "삼성" 입력 후 검색
    ▼
[React - DartMulti.jsx]
    │ POST /api/search { name: "삼성" }
    ▼
[FastAPI - /api/search]
    │ get_corp_xml() 호출
    │   ├─ BASE_DIR/dart_corpcode.xml 존재? → 바로 파싱 (Vercel 번들)
    │   ├─ /tmp/dart_corpcode.xml 존재? → 캐시 사용
    │   └─ 없으면 DART API 다운로드 → /tmp 저장
    │ XML에서 "삼성" 포함 기업 검색
    │ 상장기업 우선 정렬, 최대 30개
    ▼
[React]
    결과 드롭다운 표시
    사용자가 "삼성전자 [005930]" 선택
    corp_code: "00126380" 저장
```

### 3-2. 재무분석 흐름
```
[사용자]
    │ 3개 회사 선택 완료 → "분석" 클릭
    ▼
[React]
    │ POST /api/analyze-multi
    │ { corps: [
    │     { corp_code: "00126380", corp_name: "삼성전자" },
    │     { corp_code: "00104403", corp_name: "삼성물산" },
    │     { corp_code: "00126186", corp_name: "삼성전기" }
    │   ] }
    ▼
[FastAPI - /api/analyze-multi]
    │
    │ ┌── ThreadPoolExecutor (max_workers=9) ──────────────┐
    │ │                                                    │
    │ │  fetch_one("삼성전자", 2023) ──┐                   │
    │ │  fetch_one("삼성전자", 2024)   │                   │
    │ │  fetch_one("삼성전자", 2025)   │ 9개 동시 실행     │
    │ │  fetch_one("삼성물산", 2023)   │                   │
    │ │  fetch_one("삼성물산", 2024)   │                   │
    │ │  fetch_one("삼성물산", 2025) ──┤                   │
    │ │  fetch_one("삼성전기", 2023)   │                   │
    │ │  fetch_one("삼성전기", 2024)   │                   │
    │ │  fetch_one("삼성전기", 2025) ──┘                   │
    │ └────────────────────────────────────────────────────┘
    │
    │ 각 fetch_one 내부:
    │   DART API 호출 (CFS 우선 → OFS 폴백)
    │   account_id → CODE_MAP 매핑
    │   실패 시 account_nm → NAME_MAP 매핑
    │   투자지표 계산 (add_ratios)
    │
    │ Excel 생성 (_make_excel)
    │   → /tmp/output/멀티비교_삼성전자_삼성물산_삼성전기_20260429.xlsx
    │
    ▼
[React]
    비교 테이블 렌더링
    KPI 카드 표시 (매출, 영업이익, 영업이익률, 부채비율)
    Excel 다운로드 버튼 활성화
```

### 3-3. DART API 원시 데이터 구조
```json
{
  "status": "000",
  "list": [
    {
      "corp_code":    "00126380",
      "corp_name":    "삼성전자",
      "account_id":   "ifrs-full_Revenue",
      "account_nm":   "수익(매출액)",
      "thstrm_amount": "300,870,522",   ← 당기(조회연도)
      "frmtrm_amount": "258,935,520",   ← 전기
      "fs_div":       "CFS"
    },
    ...
  ]
}
```

---

## 4. 핵심 로직 (Pseudo Code)

### 4-1. fetch_by_code() — 계정 수집 핵심
```
function fetch_by_code(corp_code, year):

    for fs_type in ["CFS", "OFS"]:   # 연결 우선

        response = DART_API.call(
            corp_code = corp_code,
            year      = year,
            report    = "사업보고서(11011)",
            fs_div    = fs_type
        )

        if response.status != "000": continue
        if response.list is empty:   continue

        result = {}

        for item in response.list:
            code = item.account_id.strip()
            name = item.account_nm.strip()

            # 1순위: IFRS 표준코드 매핑
            standard = CODE_MAP.get(code)

            # 2순위: 계정명 폴백
            if standard is None:
                standard = NAME_MAP.get(name)

            # 최초 매칭만 사용 (중복 방지)
            if standard and standard not in result:
                result[standard] = parse_int(item.thstrm_amount)

        result["_fs"] = fs_type
        return result   # CFS 성공 시 바로 반환

    return {}   # 둘 다 실패
```

### 4-2. analyze_multi() — 병렬 처리
```
function analyze_multi(corps[3]):

    # 9개 작업 정의
    tasks = []
    for corp in corps:
        for year in [2023, 2024, 2025]:
            tasks.add( (corp.code, year) )

    # 동시 실행
    results = {}
    parallel_execute(tasks, max_workers=9):
        for each (corp_code, year) in tasks:
            data = fetch_by_code(corp_code, year)
            data = add_ratios(data)
            results[corp_code][year] = data

    # Excel 생성
    excel_path = make_excel(corps, results)

    return {
        corps: [
            { name: "삼성전자", data: { 2023: {...}, 2024: {...}, 2025: {...} } },
            ...
        ],
        filename: "멀티비교_삼성전자_..._20260429.xlsx"
    }
```

### 4-3. add_ratios() — 투자지표 계산
```
function add_ratios(data):

    영업이익률  = 영업이익 / 매출 × 100
    순이익률    = 당기순이익 / 매출 × 100
    ROE        = 당기순이익 / 자본총계 × 100
    ROA        = 당기순이익 / 자산총계 × 100
    부채비율    = 부채총계 / 자본총계 × 100
    유동비율    = 유동자산 / 유동부채 × 100
    이자보상배율 = 영업이익 / 금융비용

    # 0나누기, None 처리 포함
    return data + 지표들
```

### 4-4. get_corp_xml() — 3단계 캐시
```
function get_corp_xml():

    # 1순위: 배포 번들 (빠름, 항상 최신)
    if BASE_DIR/dart_corpcode.xml exists:
        return parse_xml(BASE_DIR/dart_corpcode.xml)

    # 2순위: /tmp 캐시 (7일 이내)
    if /tmp/dart_corpcode.xml exists and age < 7days:
        return parse_xml(/tmp/dart_corpcode.xml)

    # 3순위: DART API 다운로드
    zip_data = download("https://opendart.fss.or.kr/api/corpCode.xml")
    xml_bytes = unzip(zip_data)
    save_to_tmp(xml_bytes)
    return parse_xml(xml_bytes)
```

---

## 5. 파일/폴더 구조

```
dart-v9/                          ← 프로젝트 루트
│
├── api/                          ← FastAPI 백엔드
│   ├── main.py                   ← 전체 서버 로직 (단일 파일)
│   ├── dart_corpcode.xml         ← 기업코드 번들 (Vercel 배포용)
│   └── output/                   ← 로컬 Excel 저장 (gitignore)
│
├── src/                          ← React 프론트엔드
│   ├── main.jsx                  ← React 진입점
│   ├── App.jsx                   ← 루트 컴포넌트
│   └── DartMulti.jsx             ← 핵심 UI 컴포넌트 (전체 화면)
│
├── dist/                         ← React 빌드 결과 (gitignore)
│   ├── index.html
│   └── assets/
│       ├── main-[hash].js
│       └── main-[hash].css
│
├── vercel.json                   ← Vercel 배포 설정
├── package.json                  ← Node 의존성 + 빌드 스크립트
├── vite.config.js                ← Vite 설정
├── requirements.txt              ← Python 의존성
├── .gitignore                    ← git 제외 파일
├── start.bat                     ← 로컬 실행 스크립트
├── run_api.bat                   ← API 서버만 실행
└── launch.vbs                    ← 무음 실행 (창 없이)
```

### 핵심 파일 역할

| 파일 | 역할 | 줄 수 |
|------|------|-------|
| api/main.py | DART API 호출, 계정 매핑, Excel 생성, FastAPI 엔드포인트 전체 | ~370줄 |
| src/DartMulti.jsx | 3사 검색 UI, 비교 테이블, KPI 카드, AI 분석 버튼 | ~600줄 |
| vercel.json | 빌드/라우팅 설정 | 10줄 |
| requirements.txt | fastapi, uvicorn, openpyxl | 3줄 |

---

## 6. Prompt / AI 처리 구조

### 6-1. AI 의견 생성 흐름
```
[React]
    사용자가 "삼성전자 AI 분석" 버튼 클릭
    POST /api/opinion {
        corp_name: "삼성전자",
        data: { 2023: {...}, 2024: {...}, 2025: {...} }
    }
    ▼
[FastAPI - get_ai_opinion()]
    프롬프트 조립
    ▼
[Claude CLI]
    echo "{프롬프트}" | claude --print -
    ▼
    응답 파싱 (①~⑩ 줄 추출)
    ▼
[React]
    AI 의견 10줄 화면에 표시
```

### 6-2. AI 프롬프트 구조
```
┌─────────────────────────────────────────────────────────┐
│  SYSTEM (역할 설정)                                      │
│  "당신은 대한민국 최고의 기업 재무분석 전문가입니다."     │
├─────────────────────────────────────────────────────────┤
│  TASK (작업 지시)                                        │
│  "{corp_name}의 DART 재무 데이터를 분석하여              │
│   ①~⑩ 번호로 시작하는 정확히 10줄 한국어 의견 작성"    │
│  "각 줄에 구체적 수치를 반드시 포함"                     │
├─────────────────────────────────────────────────────────┤
│  DATA (재무 데이터 JSON)                                 │
│  {                                                       │
│    "2023": { "매출": 302조, "영업이익": 43조, ... },    │
│    "2024": { "매출": 300조, "영업이익": 32조, ... },    │
│    "2025": { "매출": 320조, "영업이익": 37조, ... }     │
│  }                                                       │
├─────────────────────────────────────────────────────────┤
│  FORMAT (출력 형식)                                      │
│  "① 매출성장성  ② 영업이익률  ③ 순이익추세             │
│   ④ ROE  ⑤ ROA  ⑥ 부채비율  ⑦ 유동비율               │
│   ⑧ 이자보상배율  ⑨ 3개년추세  ⑩ 종합평가"            │
│  "① 부터 ⑩ 까지 정확히 10줄만 출력"                    │
└─────────────────────────────────────────────────────────┘
```

### 6-3. 응답 파싱 로직
```python
numbered = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"]

lines = [
    line.strip()
    for line in response.splitlines()
    if line.strip() and any(line.strip().startswith(n) for n in numbered)
]

return lines[:10]  # 최대 10줄
```

### 6-4. 예시 AI 출력
```
① 2025년 매출 320조원으로 전년 대비 6.7% 성장, 반도체 업황 회복이 주도
② 영업이익률 11.6%로 2024년 10.8% 대비 개선, 수익성 회복 추세 뚜렷
③ 당기순이익 26조원으로 3개년 평균 대비 15% 상회, 순이익 안정적 성장
④ ROE 8.2%로 업종 평균 6.5% 상회, 자기자본 활용 효율 양호
⑤ ROA 5.1%로 자산 대비 수익창출 능력 업종 내 상위권
⑥ 부채비율 38.5%로 매우 안정적, 재무건전성 최상위 수준
⑦ 유동비율 210%로 단기 유동성 우수, 단기채무 상환 능력 충분
⑧ 이자보상배율 45배로 금융비용 부담 극히 미미, 채무상환 여력 충분
⑨ 3개년 매출 성장률 연평균 3.2%, 이익률은 2024년 저점 후 반등 확인
⑩ 반도체 사이클 회복 + 비메모리 확대 전략으로 중장기 성장 기대, 매수 관점 유효
```

### 6-5. Claude CLI 설치 확인 로직
```
function find_claude_cli():
    # 1. PATH에서 검색
    if shutil.which("claude") exists: return path

    # 2. npm 글로벌 설치 경로 확인
    if AppData/Roaming/npm/claude.cmd exists: return path

    # 3. 없으면 None 반환
    return None

# Vercel 환경에서는 None → "Claude CLI를 찾을 수 없습니다" 반환
# 로컬 환경에서는 설치된 경우 정상 작동
```

---

## 전체 기술 스택 요약

| 레이어 | 기술 | 역할 |
|--------|------|------|
| 프론트엔드 | React 19 + Vite 8 | UI 렌더링 |
| 스타일 | TailwindCSS 3 | 반응형 디자인 |
| 아이콘 | lucide-react | UI 아이콘 |
| 백엔드 | FastAPI + Python 3 | API 서버 |
| 데이터 수집 | urllib.request | DART API 호출 |
| 병렬처리 | ThreadPoolExecutor | 9개 동시 API 호출 |
| Excel | openpyxl | 보고서 생성 |
| AI 분석 | Claude CLI (subprocess) | 재무 의견 생성 |
| 배포 | Vercel (Serverless) | 클라우드 호스팅 |
| CI/CD | GitHub → Vercel | 자동 배포 |
| 임시저장 | /tmp | Vercel 파일 쓰기 |

---

*DART 재무분석기 v10 기술 문서*
