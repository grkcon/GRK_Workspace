# GRK 프로젝트

React + NestJS + PostgreSQL 풀스택 애플리케이션

## 기술 스택

- **프론트엔드**: React 19 + TypeScript + Tailwind CSS
- **백엔드**: NestJS + TypeORM
- **데이터베이스**: PostgreSQL (네이버 클라우드 플랫폼)
- **인프라**: 네이버 클라우드 플랫폼

## 프로젝트 구조

```
├── frontend/          # React 프론트엔드
├── backend/           # NestJS 백엔드
└── README.md
```

## 시작하기

### 프론트엔드 실행

```bash
cd frontend
npm start
```

### 백엔드 실행

```bash
cd backend
# .env 파일에서 데이터베이스 설정 구성
npm run start:dev
```

### 환경 변수 설정

백엔드 디렉토리의 `.env` 파일에서 네이버 클라우드 PostgreSQL 연결 정보를 설정하세요:

```
DB_HOST=your-postgres-host.ntruss.com
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name
```