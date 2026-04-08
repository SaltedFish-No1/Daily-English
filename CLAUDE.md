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
│   ├── about/              # About page
│   ├── auth/callback/      # Supabase OAuth callback
│   ├── intro/              # Product intro (public)
│   ├── learn/              # Learning center
│   ├── lessons/[id]/       # Lesson detail page
│   ├── login/              # Authentication pages
│   ├── profile/            # User profile
│   ├── reading/            # Reading practice
│   ├── reset-password/     # Password reset
│   ├── review/             # AI-generated review lessons
│   ├── review/swipe/       # Swipe-based review interface
│   ├── vocab/              # Vocabulary library
│   ├── writing/[topicId]/  # Writing exercises
│   └── providers.tsx       # React Query + Auth providers
├── components/             # Global UI components (AppShell, AppNavBar)
├── features/               # Feature-based modules
│   ├── about/              # About page
│   ├── auth/               # Authentication components & hooks
│   ├── home/               # Dashboard, CEFR guide dialog
│   ├── intro/              # Product intro page
│   ├── learn/              # Learning center
│   ├── lesson/             # Lesson article, quiz, vocab panel
│   ├── photo-capture/      # Photo capture modal & API
│   ├── profile/            # User profile
│   ├── reading/            # Reading feature components
│   ├── review/             # Review lesson components
│   ├── vocab/              # Vocabulary management
│   └── writing/            # Writing practice components
├── hooks/                  # Shared custom React hooks
├── lib/                    # Core utilities
│   ├── ai.ts               # AI model config
│   ├── ai-middleware.ts     # AI logging middleware
│   ├── api-auth.ts         # API route auth middleware
│   ├── auth-helper.ts      # Auth utilities
│   ├── dictionary.ts       # Dictionary service
│   ├── dictionary-fallback.ts # AI dictionary fallback
│   ├── dictionary-quality.ts  # Dictionary validation
│   ├── focusWords.ts       # Focus word utilities
│   ├── lesson.ts           # Lesson utilities
│   ├── lessons-db.ts       # Lesson DB queries
│   ├── otp.ts              # OTP generation
│   ├── resend.ts           # Email service (Resend)
│   ├── spaced-repetition.ts  # Review scheduling algorithm
│   ├── supabase.ts         # Supabase browser client
│   ├── supabase-admin.ts   # Supabase admin client
│   ├── supabase-middleware.ts # Supabase middleware client
│   ├── supabase-rsc.ts     # Supabase RSC client
│   ├── supabase-server.ts  # Supabase server client
│   ├── token.ts            # Token utilities
│   ├── tts-fallback.ts     # TTS fallback
│   ├── utils.ts            # Shared utilities
│   ├── env/                # Environment variable config
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
# Auth
POST   /api/auth/send-otp                  # Request email OTP
POST   /api/auth/verify-otp                # Verify OTP
POST   /api/auth/check-user                # Check user existence
POST   /api/auth/send-reset-link           # Password reset email
POST   /api/auth/reset-password-with-token # Reset password with token

# Lessons
GET    /api/lessons                         # List lessons (with filters)
GET    /api/lessons/[id]                    # Lesson detail

# Review
POST   /api/review/generate                # AI review lesson (streaming)
GET    /api/review/lessons                  # List review lessons
GET    /api/review/lessons/[id]            # Review lesson detail
POST   /api/review/save                    # Save review progress

# Writing
POST   /api/writing/submit                 # Submit essay
POST   /api/writing/grade                  # AI grading (streaming)
GET    /api/writing/topics                 # List writing topics
GET    /api/writing/submissions            # List submissions
POST   /api/writing/create-topic           # Create writing topic
GET    /api/writing/criteria               # Get grading criteria
POST   /api/writing/ocr                    # Image OCR for writing
POST   /api/writing/parse-topic-image      # Parse topic from image

# Utility
POST   /api/dictionary                     # Word lookup
GET    /api/tts                            # Text-to-speech audio
POST   /api/photo-capture                  # Image upload
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
  - [`.rules/structure-rules.md`](.rules/structure-rules.md) — 项目结构规范（Structure conventions）
  - [`.rules/state-management-rules.md`](.rules/state-management-rules.md) — 状态管理规范（State management rules）
  - [`.rules/naming-rules.md`](.rules/naming-rules.md) — TypeScript 命名规范（Naming conventions）
  - [`.rules/ui-ux-rules.md`](.rules/ui-ux-rules.md) — UI/UX 规范（UI & UX conventions）

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

## AI-Assisted Development (Claude Code)

This project uses [Claude Code](https://claude.ai/code) (Anthropic's Harness AI) as the primary AI-assisted development tool.

### Project Memory

This `CLAUDE.md` file serves as Claude Code's project memory — it is automatically loaded at the start of every session to provide full project context. Keep it up to date when architecture, commands, conventions, or dependencies change.

### Project Rules

The `.rules/` directory contains coding conventions that Claude Code must strictly follow during development. New rule files can be added to `.rules/` and referenced from the "Code Conventions" section above.

### Development Workflow

- Feature branches use the `claude/` prefix for AI-assisted work (e.g., `claude/fix-lesson-card-error`)
- Pre-commit hooks (Husky + lint-staged) run automatically on all commits, including those made by Claude Code
- Run `pnpm test` and `pnpm lint` before pushing to ensure CI passes
- The `.claude/` directory stores session-local settings and hooks — it is gitignored by default
