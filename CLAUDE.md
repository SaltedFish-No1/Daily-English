# CLAUDE.md

## Project Overview

Daily-English ("薄荷外语" / Mint Language) is a full-stack English learning platform built with Next.js 16 (App Router) and React 19. It features daily lessons with reading comprehension, vocabulary management, AI-powered essay grading, spaced repetition review, and writing practice.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 4.2
- **State**: Zustand 5 (with localStorage persistence), TanStack React Query 5
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Auth**: Supabase Auth (email OTP, password reset)
- **AI**: Vercel AI SDK 6 + @ai-sdk/openai 3 (GPT-5.4 models)
- **Email**: Resend 6
- **Validation**: Zod 4.3
- **Animations**: Framer Motion 12
- **PWA**: @ducanh2912/next-pwa
- **Error Tracking**: Sentry 10
- **Package Manager**: pnpm 10

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build (uses webpack)
pnpm start        # Run production server
pnpm lint         # ESLint check
pnpm format       # Prettier formatting
pnpm test         # Run Vitest unit tests
pnpm test:e2e     # Run Playwright E2E tests
pnpm test:e2e:ui  # E2E tests with interactive UI
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # REST API endpoints
│   │   ├── auth/           # OTP, verification, password reset
│   │   ├── dictionary/     # Word lookup with AI fallback
│   │   ├── lessons/        # Lesson CRUD
│   │   ├── review/         # AI review lesson generation
│   │   ├── tts/            # Text-to-speech
│   │   ├── writing/        # Essay submission & AI grading
│   │   └── photo-capture/  # Image upload/OCR
│   ├── lessons/[id]/       # Lesson detail page
│   ├── vocab/              # Vocabulary library
│   ├── reading/            # Reading practice
│   ├── review/             # AI-generated review lessons
│   ├── writing/[topicId]/  # Writing exercises
│   ├── profile/            # User profile
│   ├── login/              # Authentication pages
│   └── providers.tsx       # React Query + Auth providers
├── components/             # Global UI components (AppShell, AppNavBar)
├── features/               # Feature-based modules
│   ├── auth/               # Authentication components & hooks
│   ├── lesson/             # Lesson article, quiz, vocab panel
│   ├── vocab/              # Vocabulary management
│   ├── reading/            # Reading feature components
│   ├── review/             # Review lesson components
│   └── writing/            # Writing practice components
├── hooks/                  # Shared custom React hooks
├── lib/                    # Core utilities
│   ├── ai.ts               # Centralized AI model config
│   ├── supabase/           # Supabase client (browser & server)
│   ├── auth-helper.ts      # Auth utilities
│   ├── api-auth.ts         # API route auth middleware
│   ├── dictionary-quality.ts # Dictionary validation
│   ├── spaced-repetition.ts  # Review scheduling algorithm
│   └── email-templates/    # Email HTML templates
├── store/                  # Zustand stores
├── types/                  # TypeScript type definitions
├── __tests__/              # Vitest unit tests
└── middleware.ts           # Auth routing middleware
e2e/                        # Playwright E2E tests
scripts/                    # DB seed & migration scripts
```

## Architecture Patterns

### Feature-Based Modules
Each feature in `src/features/` is self-contained with its own components, hooks, and utilities. Keep related code together rather than splitting by type.

### Server vs Client Components
- Pages and layouts are Server Components by default
- Client components must be explicitly marked with `'use client'`
- API routes handle server-side logic (AI calls, DB mutations)

### State Management Layers
| Store | Persisted | Purpose |
|-------|-----------|---------|
| `useAuthStore` | No | Session, auth token, user ID |
| `useUserStore` | localStorage | Vocab, dictionary cache, quiz history |
| `useLessonStore` | No | Tab state, quiz progress |
| `usePreferenceStore` | localStorage | User settings |
| `useWritingStore` | No | Writing editor state |

### Data Sync Strategy
- **Unauthenticated**: localStorage only
- **Authenticated**: Supabase sync via `useDataSync` hook
- On login, localStorage data migrates to Supabase

### AI Model Configuration (`src/lib/ai.ts`)
- `modelFast` (gpt-5.4-mini): Dictionary fallback, quick parsing
- `modelPower` (gpt-5.4): Essay grading, review generation
- `modelVision` (gpt-5.4): OCR / image processing
- `modelSpeech` (tts-1): Word pronunciation
- All models use structured JSON output and logging middleware

### Dictionary Service
Multi-layer lookup: API query → cached results → AI enrichment fallback, with quality validation.

## Database Schema (Supabase)

**Lessons**: `lessons`, `lesson_paragraphs`, `lesson_focus_words`, `lesson_quiz_questions`
**Writing**: `writing_topics`, `writing_submissions`, `writing_grades`, `writing_drafts`, `grading_criteria`
**User Data**: `saved_words`, `quiz_progress`, `lesson_history`, `word_review_states`, `user_preferences`
**Auth**: `email_verifications`, `dictionary_cache`

Database init scripts are in `scripts/` (SQL files for table creation).

## API Routes

```
GET    /api/lessons              # List lessons (with filters)
GET    /api/lessons/[id]         # Lesson detail
POST   /api/auth/send-otp        # Request email OTP
POST   /api/auth/verify-otp      # Verify OTP
POST   /api/auth/send-reset-link # Password reset email
POST   /api/dictionary           # Word lookup
GET    /api/tts                  # Text-to-speech audio
POST   /api/writing/submit       # Submit essay
POST   /api/writing/grade        # AI grading (streaming)
POST   /api/review/generate      # AI review lesson (streaming)
POST   /api/photo-capture        # Image upload
```

## Code Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (80 char width, 2-space indent, trailing commas, Tailwind plugin)
- **Linting**: ESLint 9 flat config with Next.js + strict TypeScript rules
- **Pre-commit**: Husky runs lint-staged (ESLint fix + Prettier) on `.ts/.tsx/.json` files
- **Highlighted words** must use `data-word` attribute to sync with the vocab panel
- **Validation**: Use Zod schemas for API request/response validation
- **Streaming**: AI operations (grading, review generation) use streaming responses
- **Project Rules**: All coding rules are defined in `.rules/` directory. Code MUST strictly follow these rules:
  - [`.rules/comment-rules.md`](.rules/comment-rules.md) — TypeScript 注释规范（Comment conventions）

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_URL=http://localhost:3000
```

Optional:
```
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:
1. **Lint** → `pnpm lint`
2. **Build** → `pnpm build` (with Supabase env secrets)
3. **Test** → `pnpm test`

Environment: Ubuntu, Node.js 20, pnpm 10 with dependency caching.

## Testing

- **Unit tests**: Vitest in `src/__tests__/` — run with `pnpm test`
- **E2E tests**: Playwright in `e2e/` — Chromium only, 2 retries in CI
- Run `pnpm test` before pushing to ensure CI passes

## Security

- Security headers configured in `next.config.ts` (X-Frame-Options, HSTS, CSP, Permissions-Policy)
- Supabase RLS enforces row-level access control
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose to client
- Auth middleware in `src/middleware.ts` protects routes
- Public paths: `/login`, `/intro`, `/reset-password`
