# 🎵 Notion Worship Setlist Integrator

노션(Notion) 데이터베이스에 저장된 주일 찬양 콘티 데이터를 API로 수신하여 **누적 연주 횟수 집계, 정렬, 중복 및 오타 검출**을 자동으로 처리해 주는 찬양 콘티 데이터 관리 웹 애플리케이션입니다.

---

## 🚀 주요 기능

- **노션 API 실시간 데이터 연동**: Node.js 백엔드를 거쳐 노션 DB 데이터를 안전하게 수신
- **자동 곡별 분리 및 집계**: 날짜별 콘티 목록에서 찬양곡을 개별 추출하고 누적 연주 횟수 및 최신 연주일 자동 계산
- **⚠️ 중복 & 오타 의심 곡 자동 검출**:
  - **형식 중복**: 띄어쓰기, 소괄호`(후렴)`, Key(조성) 차이로 인해 별개 등록된 항목 통합 탐지
  - **오타/유사곡**: 편집 거리(Levenshtein Distance) 알고리즘을 적용하여 1~2글자 차이나는 유사 곡명 자동 매칭
- **🔀 다중 정렬 토글**:
  - `🔥 횟수많은순 → 빠른날짜순`
  - `📅 빠른날짜순 → 횟수많은순`
- **모듈화 구조**: HTML, CSS, JS 및 Node.js 백엔드 역할 분리로 확장성 확보

---

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **API & Storage**: Notion API (Native Fetch), `.env` (dotenv)
- **Version Control**: Git, GitHub

---

## 📂 프로젝트 구조

```text
notion-setlist/
├── .env                  # API 키 및 DB ID 설정 (보안 파일, .gitignore 처리)
├── .gitignore            # Git 업로드 제외 목록 (.env, node_modules)
├── server.js             # Express 기반 노션 API 중계 백엔드 서버
├── index.html            # 프론트엔드 메인 HTML
├── style.css             # 웹 스타일시트
├── script.js            # 데이터 파싱, 정렬 및 오타 검출 로직
└── README.md             # 프로젝트 안내 문서
```

---

## ⚙️ 실행 방법

**1. 환경변수 설정 (`.env`)**

- 프로젝트 루트 폴더에 `.env` 파일을 생성하고 본인의 노션 API 정보를 입력합니다.

```text
코드 스니펫
NOTION*API_KEY=ntn_your_notion_api_key
NOTION_DATABASE_ID=32자리*노션\_database_id
PORT=3000
```

**2. 패키지 설치 및 서버 실행**

```Bash
# 의존성 패키지 설치
npm install

# 서버 실행
node server.js
```

**3. 접속**

- 브라우저에서 `http://localhost:3000` 또는 `index.html` 파일을 직접 열어 확인합니다.

## 📝 Git 반영 (커밋 방법)

```bash
git add .
git commit -m "Docs: README.md 추가"
git push
```
