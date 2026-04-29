# BYBY (이주민 의료 통번역 지원 플랫폼)

이 저장소는 이주민 의료 통번역 업무를 위한 풀스택 서비스입니다.  
`frontend`(Next.js) + `backend`(Spring Boot) + `PostgreSQL` 기반으로 구성되어 있으며, Supabase 인증(JWT)과 역할 기반 접근 제어를 사용합니다.

## 1) 전체 아키텍처

```text
[Client Browser / PWA]
        |
        v
[Next.js Frontend]
  - Supabase Auth (session/token)
  - API proxy/calls
        |
        | Bearer JWT
        v
[Spring Boot Backend]
  - JWT Filter / RBAC (ADMIN, INTERPRETER, PATIENT)
  - Domain APIs (환자, 통번역가, 상담, 인수인계, 매칭, 의료대본)
        |
        v
[PostgreSQL]
```

## 2) 서버 아키텍처 (백엔드)

백엔드는 도메인 중심 패키지 구조를 따릅니다.

- `common`
  - 보안(`security`): JWT 필터, `UserPrincipal`, 시큐리티 설정
  - 응답/예외: 공통 `Response` 래퍼, 글로벌 예외 처리
  - 설정(`config`): OpenAPI/Swagger 등
- `domain`
  - `auth`: 내 정보 조회, role 기반 프로필 등록
  - `patient`, `Interpreter`, `consultation`, `handover`, `matching`, `medicalscript`
  - 각 도메인은 `controller -> service -> repository -> entity/dto` 구조

권한 모델:

- `ADMIN`: 운영/관리 권한
- `INTERPRETER`: 통번역가 권한
- `PATIENT`: 이주민(본인 데이터) 권한

인증 흐름:

1. 프론트에서 Supabase 로그인/세션 획득
2. API 요청 시 `Authorization: Bearer <token>` 전달
3. 백엔드 `JwtAuthFilter`가 JWT 검증 후 `UserPrincipal` 구성
4. 서비스 계층에서 role 기반 접근 제어 수행

## 3) 프론트엔드 아키텍처

- 프레임워크: Next.js App Router
- 주요 구성
  - `src/app`: 페이지 라우트
  - `src/components`: 공통 UI/AppShell
  - `src/lib/api.ts`: 백엔드 API 호출 클라이언트
  - `src/lib/supabase.ts`: Supabase 클라이언트/토큰 처리
  - `src/middleware.ts`: 인증 사용자 라우팅 가드

## 4) 기술 스택

### Frontend

| 분류 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | Next.js (App Router) | 14.2.29 |
| 언어 | TypeScript | 5.x |
| UI | React | 18.3.1 |
| 스타일링 | Tailwind CSS | 3.4 |
| 인증 | Supabase JS + SSR | 2.49 / 0.5 |
| PWA | @ducanh2912/next-pwa | 10.2.9 |
| 유틸리티 | clsx | 2.1 |
| 린터 | ESLint (eslint-config-next) | 8.x |

### Backend

| 분류 | 기술 | 버전 |
|---|---|---|
| 언어 | Java | 21 |
| 프레임워크 | Spring Boot | 3.3.5 |
| 빌드 도구 | Gradle | - |
| ORM | Spring Data JPA (Hibernate) | - |
| DB 마이그레이션 | Flyway (비활성화 중, 설계 안정화 후 적용 예정) | - |
| 인증 | Spring Security + JWT (JJWT) | 0.12.6 |
| 인증 공급자 | Supabase (서비스 키 검증) | - |
| HTTP 클라이언트 | Spring WebFlux RestClient | - |
| API 문서 | SpringDoc OpenAPI (Swagger UI) | 2.6.0 |
| 유효성 검사 | Spring Validation | - |
| 헬스체크 | Spring Boot Actuator | - |
| 코드 단순화 | Lombok | - |
| DB (운영) | PostgreSQL | - |
| DB (테스트) | H2 (in-memory) | - |
| 테스트 | JUnit 5 + Spring Security Test | - |
| AI | Claude API (claude-3-5-haiku) | - |

### 인프라 / 배포

| 분류 | 기술 | 역할 |
|---|---|---|
| 프론트 호스팅 | Vercel | Next.js 프로덕션 배포 |
| 백엔드 호스팅 | Railway | Docker 컨테이너 배포 |
| DB 호스팅 | Supabase (PostgreSQL) | 관계형 DB + 인증 |
| 컨테이너 | Docker | 백엔드 이미지 빌드 |
| 이미지 레지스트리 | GitHub Container Registry (GHCR) | Docker 이미지 저장 |
| CI/CD | GitHub Actions | 테스트 → 빌드 → 배포 자동화 |
| 소스 관리 | GitHub | - |

## 5) API 문서 (Swagger)

백엔드 실행 후:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## 6) 로컬 실행

### 사전 준비

루트에 `.env.local` 파일이 있어야 합니다. `.env.example`을 복사해 작성하세요.

### 6.1 전체 스택 실행 (권장, Docker)

```powershell
docker-compose --env-file .env.local up --build
```

- `frontend`: `http://localhost:3000`
- `backend`: `http://localhost:8080`
- `db`: `localhost:5432`

### 6.2 개별 실행 (Windows PowerShell)

```powershell
# DB만 실행
docker-compose --env-file .env.local up db

# 백엔드 실행 (터미널 1)
docker-compose --env-file .env.local up db backend

# 프론트 로컬 실행 (터미널 2)
cd frontend
npm install
npm run dev
```

백엔드를 Docker 없이 직접 실행할 경우:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
$env:JWT_SECRET="<Supabase JWT Secret>"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5433/byby"
cd backend
.\gradlew bootRun
```

## 7) 환경 변수

루트 `.env.local` 기준으로 사용합니다.

핵심 변수:

- DB: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_PORT`
- Backend: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CLAUDE_API_KEY`
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 공통: `FRONTEND_URL`, `BACKEND_PORT`, `FRONTEND_PORT`

샘플은 `.env.example` 참고.

## 8) 데이터베이스 마이그레이션

현재 엔티티 설계가 진행 중이므로 Flyway는 비활성화 상태입니다. `ddl-auto: update`로 Hibernate가 스키마를 자동 반영합니다.

엔티티 설계가 안정화되면 Flyway를 활성화하고 마이그레이션 파일(`backend/src/main/resources/db/migration`)을 관리할 예정입니다.

## 9) CI/CD 파이프라인

`/.github/workflows/deploy.yml`

- PR/Push 시:
  - Backend 테스트/빌드
  - Frontend lint/build
- `main` push 시:
  - Backend/Frontend Docker 이미지 빌드 + GHCR 푸시
  - Backend 배포 (Railway 또는 EC2)
  - Frontend 배포 (Vercel)

## 10) 디렉터리 구조

```text
.
├─ backend/
│  ├─ src/main/java/com/byby/backend/
│  │  ├─ common/
│  │  └─ domain/
│  └─ src/main/resources/
│     ├─ application.yaml
│     └─ db/migration/
├─ frontend/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     └─ lib/
├─ docker-compose.yml
└─ .github/workflows/deploy.yml
```