# Ionbec Exam System - Architecture Mapping

## Overview
This document maps the legacy Laravel (ionbec-exam) architecture to the new TypeScript/React architecture.

## Core Domains

### 1. Exam Management
**Laravel Structure:**
- Controllers: `ExamController`, `QuestionPackController`, `QuestionSetController`
- Models: `Exam`, `Item`, `Question`, `Answer`
- Relations: Exam → Items → Questions → Answers

**New Architecture:**
```
backend/src/api/exam/
├── exam.ts          # Exam CRUD operations
├── item.ts          # Question sets/vignettes
├── question.ts      # Individual questions
├── answer.ts        # Answer options
└── category.ts      # Question categorization
```

### 2. User Management
**Laravel Structure:**
- Controllers: `UserController`, `TestTakerController`
- Models: `User`, `Taker`, `Role`, `Permission`
- Auth: Laravel Fortify + custom Taker auth

**New Architecture:**
```
backend/src/api/auth/
├── admin.ts         # Admin authentication
├── taker.ts         # Test taker authentication
└── permission.ts    # RBAC management
```

### 3. Test Delivery
**Laravel Structure:**
- Controllers: `DeliveryController`, `GroupController`
- Models: `Delivery`, `Group`, `DeliveryTaker`
- Features: Scheduled starts, tokens, time limits

**New Architecture:**
```
backend/src/api/delivery/
├── delivery.ts      # Test session management
├── group.ts         # Test taker groups
└── schedule.ts      # Scheduling logic
```

### 4. Exam Taking & Attempts
**Laravel Structure:**
- Controllers: `ExamController`, `AttemptController`
- Models: `Attempt`, `AttemptQuestion`
- Features: Real-time answers, progress tracking

**New Architecture:**
```
backend/src/api/attempt/
├── attempt.ts       # Attempt management
├── answer.ts        # Answer submission
└── progress.ts      # Progress tracking
```

### 5. Scoring & Results
**Laravel Structure:**
- Controllers: `ScoringController`, `ResultController`
- Jobs: `CalculateScore`
- Features: Auto-scoring MCQ, manual essay scoring

**New Architecture:**
```
backend/src/api/scoring/
├── auto-score.ts    # MCQ auto-scoring
├── manual-score.ts  # Essay scoring interface
└── result.ts        # Result generation
```

## Database Migration Strategy

### Key Table Mappings:
1. `exams` → No change (already in Prisma)
2. `items` → No change 
3. `questions` → No change
4. `answers` → No change
5. `categories` → No change
6. `groups` → No change
7. `takers` → No change
8. `deliveries` → No change
9. `attempts` → No change
10. `users` → Extended with better-auth fields

### New Tables Needed:
- `exam_settings` - Store exam-specific configurations
- `question_banks` - Organize questions into reusable banks
- `scoring_rubrics` - Define scoring criteria for essays

## Frontend Architecture

### Page Structure:
```
frontend/src/pages/
├── admin/
│   ├── dashboard.tsx
│   ├── exam/
│   │   ├── index.tsx      # Exam list
│   │   ├── create.tsx     # Create/edit exam
│   │   └── detail.tsx     # Exam details
│   ├── question/
│   │   ├── index.tsx      # Question bank
│   │   ├── create.tsx     # Question editor
│   │   └── category.tsx   # Category management
│   ├── delivery/
│   │   ├── index.tsx      # Delivery list
│   │   ├── create.tsx     # Schedule delivery
│   │   └── monitor.tsx    # Live monitoring
│   ├── scoring/
│   │   ├── index.tsx      # Scoring dashboard
│   │   ├── manual.tsx     # Manual scoring
│   │   └── report.tsx     # Score reports
│   └── user/
│       ├── taker.tsx      # Test taker management
│       └── group.tsx      # Group management
├── exam/
│   ├── lobby.tsx          # Waiting room
│   ├── test.tsx           # Main exam interface
│   ├── review.tsx         # Review answers
│   └── result.tsx         # Show results
└── taker/
    ├── login.tsx          # Taker login
    ├── dashboard.tsx      # Taker dashboard
    └── history.tsx        # Exam history
```

### State Management:
```
frontend/src/lib/states/
├── exam-state.ts          # Current exam state
├── delivery-state.ts      # Delivery management
├── scoring-state.ts       # Scoring workflow
└── attempt-state.ts       # Active attempt tracking
```

## API Patterns

### CRUD Operations:
Use standardized CRUD handler from `backend/src/lib/crud-handler.ts`

### Real-time Features:
- WebSocket for live interviews
- Server-sent events for progress tracking
- Notification system for updates

### Authentication Flow:
1. Admins: Standard better-auth flow
2. Takers: Custom token-based auth with delivery validation

## Migration Priorities

### Phase 1: Core Infrastructure
1. ✅ Database schema (already migrated)
2. Authentication system
3. Basic CRUD APIs
4. Admin dashboard

### Phase 2: Exam Management
1. Exam CRUD
2. Question bank
3. Category management
4. Import/export functionality

### Phase 3: Test Delivery
1. Group management
2. Delivery scheduling
3. Token generation
4. Access control

### Phase 4: Exam Taking
1. Exam interface
2. Timer functionality
3. Answer submission
4. Progress tracking

### Phase 5: Scoring & Results
1. Auto-scoring
2. Manual scoring interface
3. Result generation
4. Report exports

### Phase 6: Advanced Features
1. Live interviews
2. Analytics dashboard
3. Bulk operations
4. API for external systems

## Technical Considerations

### Performance:
- Lazy load questions to handle large exams
- Cache exam structure during attempts
- Optimize database queries with proper indexes

### Security:
- Token validation for exam access
- Time-based access control
- Answer encryption during transmission
- Audit logging for all actions

### Scalability:
- Horizontal scaling for exam servers
- Queue system for scoring jobs
- CDN for static assets
- Database read replicas

### Browser Support:
- Modern browsers only (Chrome, Firefox, Safari, Edge)
- No IE11 support
- Mobile-responsive design
- Offline capability for exam taking