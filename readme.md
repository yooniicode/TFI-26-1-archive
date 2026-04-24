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
  - Flyway Migration
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

### Backend

- Java 21
- Spring Boot 3.x
- Spring Web, Data JPA, Validation, Security
- JWT (`jjwt`)
- Flyway
- PostgreSQL
- springdoc-openapi (Swagger UI)

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase JS / SSR

### Infra / DevOps

- Docker / Docker Compose
- GitHub Actions CI/CD
- GHCR 이미지 푸시
- 배포 타깃: Railway 또는 EC2 (백엔드), Vercel (프론트)

## 5) API 문서 (Swagger)

백엔드 실행 후:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## 6) 로컬 실행

### 6.1 전체 스택 실행 (권장)

```bash
make dev
```

- `frontend`: `http://localhost:3000`
- `backend`: `http://localhost:8080`
- `db`: `localhost:5432`

### 6.2 개별 실행

```bash
# DB만 실행
make db

# 백엔드 실행
make backend

# 프론트 실행
make install
make frontend
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

- Flyway 사용 (`backend/src/main/resources/db/migration`)
- 앱 시작 시 자동 반영
- 초기 스키마: `V1__init.sql`

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
├─ Makefile
└─ .github/workflows/deploy.yml
```