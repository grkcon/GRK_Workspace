# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GRK is a comprehensive HR and project management system built with:
- **Frontend**: React 19 + TypeScript + Tailwind CSS + React Router
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Database**: PostgreSQL (supports both local Docker and Naver Cloud Platform)

## Key Commands

### Frontend Development
```bash
cd frontend
npm start              # Start development server (port 3000)
npm run build          # Build for production
npm test               # Run tests
```

### Backend Development
```bash
cd backend
npm run start:dev      # Start development server with hot reload (port 3000)
npm run build          # Build for production
npm run start:prod     # Start production server
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
npm test               # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run test:cov       # Run tests with coverage
npm run seed           # Seed database with initial data
```

### Database Setup
```bash
# Local development with Docker
docker-compose -f docker-compose.dev.yml up -d

# Environment variables in backend/.env
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name
```

## Architecture Overview

### Backend Structure
The backend follows NestJS modular architecture with the following key modules:

1. **Employee Module** (`/modules/employee/`)
   - Manages employee data, education, and experience
   - Handles employee CRUD operations

2. **Attendance Module** (`/modules/attendance/`)
   - Manages leave requests and leave balances
   - Tracks employee attendance records

3. **Project Module** (`/modules/project/`)
   - Handles project management, clients, and payments
   - Manages internal and external staff assignments

4. **OPEX Module** (`/modules/opex/`)
   - Manages operational expenses
   - Tracks monthly and yearly OPEX items

5. **Cash Flow Module** (`/modules/cashflow/`)
   - Handles cash flow calculations and projections
   - Manages monthly financial flows

6. **HR Cost Module** (`/modules/hr-cost/`)
   - Manages HR unit costs and calculations

### Frontend Structure
The frontend is organized as a single-page application with:

- **Pages** (`/pages/`): Main application screens (Dashboard, Employee Management, OPEX, PPE, Attendance, Schedule)
- **Components** (`/components/`): Reusable UI components and modals
- **Services** (`/services/`): API client services for backend communication
- **Types** (`/types/`): TypeScript type definitions

### Database Entities
The system uses TypeORM with the following main entities:
- Employee (with Education, Experience)
- LeaveRequest, LeaveBalance
- Project (with ProjectClient, ProjectPayment, PPE)
- InternalStaff, ExternalStaff
- OpexItem, MonthlyOpex, YearlyOpex
- HRUnitCost, CashFlow, MonthlyFlow

All entities extend BaseEntity with common fields (id, createdAt, updatedAt, deletedAt).

### API Communication
- Frontend services use a centralized API client (`/services/api.ts`)
- Backend API runs on port 3000 by default
- CORS is enabled for cross-origin requests
- Swagger documentation available at `/api` when backend is running

### Authentication
- Google OAuth integration available (requires REACT_APP_GOOGLE_CLIENT_ID)
- Development mode bypasses authentication
- Production mode enforces authentication

## Important Notes
- Backend uses soft deletes for all entities
- TypeORM synchronize is enabled only in development mode
- Frontend uses Tailwind CSS for styling
- Backend supports both ESM and CommonJS module systems