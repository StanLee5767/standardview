# DART 재무분석기

OpenDART API를 이용해 상장기업 3곳의 재무제표를 비교 분석하는 웹 앱입니다.

## 시작하기

### 1. DART API 키 발급
[OpenDART](https://opendart.fss.or.kr)에서 회원가입 후 **마이페이지 → API 신청**에서 인증키를 발급받습니다.

### 2. 환경 설정 파일 생성
프로젝트 루트의 `.env.example`을 복사해 `.env` 파일을 만듭니다.

```bash
cp .env.example .env
```

### 3. API 키 입력
`.env` 파일을 열어 발급받은 인증키를 입력합니다.

```
DART_API_KEY=발급받은_인증키
```

### 4. 앱 실행

**로컬 실행 (Mac/Linux)**
```bash
./start.sh
```

**로컬 실행 (Windows)**
```
start.bat
```

**Vercel 배포**
```bash
vercel deploy
```
> Vercel 대시보드 → Settings → Environment Variables 에서 `DART_API_KEY` 를 추가해야 합니다.

## 기술 스택

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React + Vite + TailwindCSS
- **배포**: Vercel (서버리스)

## 주의사항

- `.env` 파일은 절대 GitHub에 커밋하지 마세요 (`.gitignore`에 포함되어 있음)
- DART API는 1일 10,000건 호출 제한이 있습니다

---

## 데이터 관리 & 백업

### 데이터 저장 위치

| 경로 | 내용 |
|------|------|
| `data/standard_view.db` | 인사이트 로그 · 매크로 캐시 (SQLite) |
| `backups/` | DB 백업 파일 (`.db`), export 파일 |
| `.env` | API 키 (절대 커밋 금지) |

> **`data/standard_view.db`** 가 인사이트 로그의 원본 저장소입니다.  
> 이 파일만 잘 보관하면 모든 인사이트 데이터를 복구할 수 있습니다.

### 백업 방법

#### 방법 1 — UI에서 백업 (권장)
1. Standard View 앱 실행 → **인사이트 로그** 탭
2. **💾 DB 백업** 버튼 클릭
3. `backups/standard_view_backup_YYYYMMDD_HHMMSS.db` 파일이 자동 생성됩니다

#### 방법 2 — 수동 복사
```bash
cp data/standard_view.db backups/standard_view_backup_$(date +%Y%m%d_%H%M%S).db
```

### 내보내기 (Export)

인사이트 로그 탭의 버튼으로 3가지 형식으로 내보낼 수 있습니다:
- **⬇ MD** — Markdown 파일 다운로드
- **⬇ CSV** — Excel 호환 CSV 다운로드  
- **⬇ JSON** — JSON 파일 다운로드

또는 API 직접 호출:
```bash
# JSON
curl http://localhost:8002/api/backup/export?format=json -o insights.json

# CSV
curl http://localhost:8002/api/backup/export?format=csv -o insights.csv
```

### 복구 방법

1. 앱을 종료합니다.
2. 백업 파일을 현재 DB로 복사합니다:
```bash
# 예시: 특정 날짜 백업으로 복구
cp backups/standard_view_backup_20260511_120000.db data/standard_view.db
```
3. 앱을 재시작합니다.

> ⚠ 복구 전 현재 DB를 반드시 별도 백업하세요.

### Git 관리

`.gitignore`에 의해 아래 파일은 Git에 포함되지 않습니다:
- `.env` (API 키)
- `data/*.db` (인사이트 데이터)
- `backups/` (백업 파일)
- `node_modules/`, `dist/`, `__pycache__/`, `.venv/`

코드만 Git으로 관리하고, 데이터는 별도 백업을 유지하세요.
