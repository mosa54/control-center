# 프로젝트 구조 문서

## 1. 프로젝트 목적

이 프로젝트는 소방 조직의 비상 소집 및 통제단 운영을 지원하는 웹앱이다. 현재 코드 기준으로 핵심 기능은 아래 4가지다.

1. 직원/임무 엑셀 업로드
2. 직원 소집 체크인
3. 통제부서별 집결 현황 대시보드
4. 보고서 작성 및 미리보기, 일부 HWP 다운로드

실제 동작의 중심은 `src/app` 라우트와 `src/lib/store.tsx`의 전역 상태 관리에 있다.

## 2. 기술 스택

- 프레임워크: Next.js 16 App Router
- UI: React 19
- 언어: TypeScript
- 백엔드 서비스: Supabase
- 문서 처리:
  - 엑셀 파싱: `xlsx`
  - PDF 미리보기: `react-pdf`, `pdfjs-dist`
  - HWP 유사 다운로드: `file-saver` 기반 HTML 문서 저장
- 기타: `jszip`, `pdf-parse`

참고 파일:

- [package.json](C:/Users/mosa5/Desktop/코딩/통제단/package.json)
- [tsconfig.json](C:/Users/mosa5/Desktop/코딩/통제단/tsconfig.json)
- [next.config.ts](C:/Users/mosa5/Desktop/코딩/통제단/next.config.ts)

## 3. 최상위 디렉터리 구조

```text
통제단/
├─ public/                 정적 파일, PWA 리소스, PDF worker
├─ scripts/                데이터 추출/생성 보조 스크립트
├─ src/
│  ├─ app/                 Next.js App Router 페이지
│  ├─ components/          공용 UI 컴포넌트
│  └─ lib/                 상태, 데이터 파싱, Supabase, 문서 생성
├─ PROJECT_STRUCTURE.md    이 문서
├─ README.md               create-next-app 기본 README
├─ supabase_schema.sql     DB 스키마 초안
├─ page.tsx                루트 레거시 페이지 추정
├─ globals.css             루트 레거시 스타일 추정
├─ pdf_content.txt         PDF 추출 결과물 추정
├─ 사상자 이송현황판.pdf     참고 양식
├─ 화재 등 사고상황보고서.pdf 참고 양식
└─ 통제단 웹앱용 직원 임무.xlsx 기준 엑셀 데이터
```

## 4. 주요 디렉터리별 역할

### 4.1 `src/app`

실제 라우팅이 정의된 영역이다.

- [src/app/layout.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/layout.tsx)
  - 전체 앱 레이아웃
  - `AppProvider`로 전역 상태 제공
  - `InstallPrompt`를 전역으로 렌더링
- [src/app/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/page.tsx)
  - 메인 홈
  - 원 소속 부서를 선택해 체크인 페이지로 이동
  - 관전자 모드로 대시보드 진입 가능
- [src/app/admin/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/admin/page.tsx)
  - 관리자 화면
  - 엑셀 업로드
  - 훈련/비상 모드 전환
  - 소집 요약문 저장
  - 전체 체크인 초기화
  - 소집부 인쇄 화면 진입
- [src/app/checkin/[dept]/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/checkin/[dept]/page.tsx)
  - 선택한 원 소속 부서 기준 직원 체크인 화면
  - 교대근무자는 당번/비번 선택
  - 체크인 후 대시보드로 이동
- [src/app/dashboard/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/dashboard/page.tsx)
  - 집결 현황 대시보드
  - 개인 정보/개인 임무 카드 표시
  - 통제부서별 인원 현황 집계
  - `?role=observer` 관전자 모드 지원
- [src/app/reports/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/reports/page.tsx)
  - 보고서 허브
  - 사고상황보고서, 사상자 이송현황 페이지로 이동
  - 저장된 보고서 미리보기 오버레이 지원
- [src/app/reports/accident/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/reports/accident/page.tsx)
  - 사고상황보고서 업로드/미리보기
  - PDF 또는 이미지 파일 저장
  - PIN 인증 후 수정
- [src/app/reports/casualty/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/reports/casualty/page.tsx)
  - 사상자 이송현황 표 입력
  - Supabase 저장
  - 전체 화면 미리보기
  - HWP 다운로드

### 4.2 `src/components`

화면을 구성하는 재사용 컴포넌트 모음이다.

- [src/components/SessionBanner.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/SessionBanner.tsx)
  - 현재 세션 모드와 요약 표시
- [src/components/CounterBar.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/CounterBar.tsx)
  - 통제부서별 체크인 수 집계
  - 부서를 누르면 명단 팝업
- [src/components/ControlDeptCards.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/ControlDeptCards.tsx)
  - 통제부서별 현재 인원/정원 비슷한 형태의 현황 표시
  - 선택 시 해당 부서 임무 목록 표시
- [src/components/MyInfoCard.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/MyInfoCard.tsx)
  - 현재 체크인한 직원 정보 표시
  - 통제부서 변경
  - 본인 체크인 취소
- [src/components/MyMissionCard.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/MyMissionCard.tsx)
  - 개인 임무 설명
  - 동일 임무 담당자 목록
  - 부서 비치물품 표시
- [src/components/DeptCheckInList.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/DeptCheckInList.tsx)
  - 특정 통제부서의 체크인 인원 명단 팝업
- [src/components/AssemblyRoster.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/AssemblyRoster.tsx)
  - 소집부 인쇄용 화면
  - 체크인 시간순 목록 출력
- [src/components/FullscreenOverlay.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/FullscreenOverlay.tsx)
  - 보고서 전체 화면 미리보기 컨테이너
- [src/components/InstallPrompt.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/InstallPrompt.tsx)
  - PWA 설치 안내
- [src/components/Toast.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/components/Toast.tsx)
  - 간단한 상태 메시지 표시

### 4.3 `src/lib`

핵심 비즈니스 로직과 공용 유틸이 있다.

- [src/lib/store.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/store.tsx)
  - 앱의 중심 상태 저장소
  - 세션 모드, 세션 요약, 엑셀 데이터, 체크인 목록, 현재 사용자 관리
  - Supabase 초기 로딩 및 realtime 구독
  - 체크인/취소/부서변경/전체초기화 액션 제공
- [src/lib/excel.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/excel.ts)
  - 엑셀 파싱
  - 직원/임무/비치물품 데이터 구조 정의
  - 부서 목록, 통제부서 정렬, 색상 매핑 유틸 제공
- [src/lib/defaultData.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/defaultData.ts)
  - 기본 샘플 데이터
  - 앱 첫 로드시 `excelData` 초기값으로 사용됨
- [src/lib/supabase.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/supabase.ts)
  - Supabase 클라이언트 생성
- [src/lib/hwpxGenerator.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/hwpxGenerator.ts)
  - 사고/사상자 보고서를 HTML 기반 `.hwp` 파일로 저장
- [src/lib/data.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/data.ts)
  - 정적 샘플 데이터 모음
  - 현재 주요 라우트에서는 사용 흔적이 거의 없어서 레거시 가능성이 높음

## 5. 사용자 흐름

### 5.1 관리자 흐름

1. `/admin` 진입
2. PIN `1234` 입력
3. 엑셀 업로드
4. 세션 모드와 상황 요약 저장
5. 전체 소집 초기화 또는 소집부 인쇄

관리자 화면의 실제 상태 변경은 대부분 `AppProvider` 액션을 통해 Supabase에 반영된다.

### 5.2 일반 직원 흐름

1. `/`에서 원 소속 부서 선택
2. `/checkin/[dept]`에서 본인 직위 선택
3. 필요 시 당번/비번 선택
4. 체크인 완료 후 `/dashboard` 이동
5. 내 정보, 내 임무, 전체 통제부서 현황 확인

### 5.3 관전자 흐름

1. `/dashboard?role=observer` 진입
2. 본인 카드 없이 전체 현황만 열람
3. `/reports?role=observer`로 보고서 화면 열람

### 5.4 보고서 흐름

- 사고상황보고서:
  - 파일형 보고서
  - PDF 또는 이미지 업로드
  - Supabase `reports` 테이블에 저장
  - 전체 화면 미리보기 제공
- 사상자 이송현황:
  - 웹 폼 기반 표 입력
  - Supabase 저장
  - 전체 화면 미리보기 제공
  - HWP 다운로드 지원

## 6. 데이터 구조와 상태 흐름

### 6.1 전역 상태

[src/lib/store.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/store.tsx) 기준 전역 상태는 아래와 같다.

- `sessionMode`
  - `training | emergency`
- `sessionSummary`
  - 상황 요약 텍스트
- `excelData`
  - 직원/임무/비치물품 전체 데이터
- `checkedInEmployees`
  - 현재 체크인된 인원 목록
- `currentEmployee`
  - 현재 기기에서 체크인한 사용자
- `isLoaded`
  - 초기 로딩 완료 여부

### 6.2 체크인 데이터 흐름

1. 앱 시작 시 `system_settings`, `checkins`를 Supabase에서 조회
2. `excel_data` 안의 직원 정보와 `checkins` 테이블을 조인 비슷하게 매핑
3. `checkedInEmployees`를 구성
4. `localStorage.controlCenter_myId`로 현재 기기 사용자 복원
5. 이후 Supabase realtime 이벤트로 변경사항 동기화

### 6.3 엑셀 데이터 구조

[src/lib/excel.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/excel.ts) 기준 `ExcelData`는 다음 형태다.

- `employees`
  - 직원 기본 정보
  - 원 소속 부서
  - 통제부서
  - 근무 형태
  - 당번/비번별 임무 코드
- `missions`
  - 임무 코드, 임무명, 임무 설명
- `supplies`
  - 일부 통제부서 비치물품 목록
- `uploadedAt`
  - 업로드 시각

### 6.4 보고서 데이터 구조

- 사고상황보고서
  - 파일 업로드형
  - `files[]`, `updatedAt`
  - 구버전 단일 파일 포맷을 `migrateData()`로 호환
- 사상자 이송현황
  - 행 기반 표 데이터
  - 작성자 정보
  - 중증도별 카운트는 프론트에서 계산

## 7. Supabase 연동 구조

참고 파일:

- [src/lib/supabase.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/supabase.ts)
- [supabase_schema.sql](C:/Users/mosa5/Desktop/코딩/통제단/supabase_schema.sql)

현재 코드가 기대하는 주요 테이블은 다음과 같다.

- `system_settings`
  - 세션 모드
  - 요약문
  - 엑셀 JSON 전체
- `checkins`
  - 직원 체크인 목록
- `reports`
  - 사고상황보고서와 사상자 이송현황 저장

중요 메모:

- `supabase_schema.sql`에는 `system_settings`, `checkins`만 정의되어 있다.
- 하지만 실제 앱 코드는 `reports` 테이블도 사용한다.
- 즉, 현재 스키마 파일은 실제 애플리케이션 요구사항을 완전히 반영하지 못한다.

## 8. 파일/화면별 책임 요약

### 홈

- 부서 선택 허브
- 데이터가 없으면 관리자 업로드 유도
- 관전자 진입점 제공

### 관리자

- 시스템 설정 제어판
- 운영자가 행사/훈련 시작 전 준비하는 화면

### 체크인

- 직원 식별
- 근무 상태 선택
- 중복 체크인 방지

### 대시보드

- 개인 상태 확인
- 통제부서별 집결 현황 확인
- 보고서 페이지로 연결

### 보고서

- 현장 문서 운영 화면
- 이미지/PDF 보관과 표 기반 현황 입력이 분리되어 있음

## 9. 정적 자산과 스크립트

### 9.1 `public/`

주요 파일:

- `119_symbolmark.png`
- `icon.png`
- `manifest.json`
- `pdf.worker.min.mjs`

용도:

- 앱 아이콘
- 홈/헤더 로고
- PWA manifest
- PDF 렌더링 worker

### 9.2 `scripts/`

주요 파일:

- [scripts/extract_excel.js](C:/Users/mosa5/Desktop/코딩/통제단/scripts/extract_excel.js)
- [scripts/extract_pdf.js](C:/Users/mosa5/Desktop/코딩/통제단/scripts/extract_pdf.js)
- [scripts/generate_default_data.js](C:/Users/mosa5/Desktop/코딩/통제단/scripts/generate_default_data.js)
- [scripts/pdf_extracted.json](C:/Users/mosa5/Desktop/코딩/통제단/scripts/pdf_extracted.json)

역할:

- 기준 문서나 엑셀에서 데이터를 추출/가공해 `defaultData`를 만드는 보조 도구로 보인다.
- 런타임에서 직접 실행되는 앱 코드라기보다 데이터 준비용 도구에 가깝다.

## 10. 현재 구조에서 주의할 점

### 10.1 레거시 또는 중복 파일

아래 파일은 현재 `src/app` 기반 구조와 별도로 존재한다.

- [page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/page.tsx)
- [globals.css](C:/Users/mosa5/Desktop/코딩/통제단/globals.css)

현재 프로젝트가 `src/app`를 사용하므로, 이 루트 파일들은 실제 라우트/스타일 진입점이 아닐 가능성이 높다. 유지보수 시 혼동 원인이 될 수 있다.

### 10.2 README 미정리

- [README.md](C:/Users/mosa5/Desktop/코딩/통제단/README.md)는 create-next-app 기본 문서 상태다.
- 실제 운영 방법, 환경변수, Supabase 설정은 별도 문서화가 필요하다.

### 10.3 PIN 하드코딩

- 관리자와 보고서 수정 PIN이 코드상 `1234`로 고정되어 있다.
- 운영 환경에서는 환경변수 또는 서버 검증 방식으로 옮기는 것이 맞다.

### 10.4 기본 데이터 상주

- [src/lib/defaultData.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/defaultData.ts)에 대량의 기본 인원/임무 데이터가 포함돼 있다.
- 데이터가 없을 때도 앱이 기본값으로 뜨는 구조라서, 운영용/개발용 데이터 경계가 모호해질 수 있다.

### 10.5 한글 인코딩 주의

- 터미널 출력 기준으로 한글 문자열이 많이 깨져 보였다.
- 코드 내부 문자열 자체의 인코딩 문제이거나, 콘솔 출력 인코딩 문제일 수 있다.
- 특히 엑셀 컬럼명, 보고서 필드명, UI 라벨 수정 시 파일 인코딩을 먼저 확인하는 것이 안전하다.

## 11. 추천 후속 문서

이 문서 다음으로 만들면 좋은 문서는 아래 3개다.

1. 운영 매뉴얼
   - 관리자 사용 순서
   - 행사 시작/종료 절차
2. 데이터 사양서
   - 엑셀 시트별 컬럼 설명
   - Supabase 테이블 정의
3. 개발자 문서
   - 환경변수
   - 로컬 실행 방법
   - 배포 및 스키마 반영 절차

## 12. 빠른 참조

- 앱 레이아웃: [src/app/layout.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/layout.tsx)
- 홈: [src/app/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/page.tsx)
- 관리자: [src/app/admin/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/admin/page.tsx)
- 체크인: [src/app/checkin/[dept]/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/checkin/[dept]/page.tsx)
- 대시보드: [src/app/dashboard/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/dashboard/page.tsx)
- 보고서 허브: [src/app/reports/page.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/app/reports/page.tsx)
- 상태관리: [src/lib/store.tsx](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/store.tsx)
- 엑셀 파싱: [src/lib/excel.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/excel.ts)
- 기본 데이터: [src/lib/defaultData.ts](C:/Users/mosa5/Desktop/코딩/통제단/src/lib/defaultData.ts)
- DB 스키마 초안: [supabase_schema.sql](C:/Users/mosa5/Desktop/코딩/통제단/supabase_schema.sql)
