# Test Coverage Analysis

_Generated: 2026-04-09_

## Current State

### Unit Tests (Vitest) — 11 files, ~75 test cases

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Quiz grading | 8 | ~39 | All 7 grading functions + normalizeAnswer |
| Core lib | 3 | ~36 | spaced-repetition (22), focus-words (6), lesson (8) |

### E2E Tests (Playwright) — 3 files, ~13 test cases

- `auth.spec.ts` — Login page branding, email input, button states, guest navigation
- `reading.spec.ts` — Page header, learning stats, lesson cards, navigation
- `home.spec.ts` — Page title, navbar, navigation links

### Coverage Configuration

**None.** No `@vitest/coverage-v8`, no thresholds, no reporter configured.

---

## Gap Analysis

### Priority 1 — Pure logic with zero test coverage

#### `src/lib/dictionary.ts`

- **Functions:** `normalizeDictionaryQuery()`, `mapDictionaryEntries()`
- **Risk:** Complex data normalization handling malformed API data, nested nulls, and edge cases (~170 lines)
- **Suggested tests:**
  - `normalizeDictionaryQuery`: whitespace, non-alpha chars, empty string, mixed-case
  - `mapDictionaryEntries`: valid payload, missing fields, empty arrays, non-array input, entries without meanings

#### `src/lib/dictionary-quality.ts`

- **Function:** `isDictionaryEntryComplete()`
- **Risk:** Controls AI fallback trigger — wrong result means unnecessary AI calls (cost) or missing data
- **Suggested tests:**
  - null/empty entries → false
  - Entry with definitions but no phonetic → false
  - Entry with phonetic but no definitions → false
  - Complete entry → true
  - Phonetic in `phonetics` array vs top-level `phonetic`

#### `src/lib/otp.ts`

- **Functions:** `generateOtp()`, `hashOtp()`, `verifyOtpHash()`
- **Risk:** Security-critical authentication code with timing-safe comparison
- **Suggested tests:**
  - `generateOtp`: returns 6-digit string, range 100000-999999
  - `hashOtp`: deterministic (same input → same output), returns hex string
  - `verifyOtpHash`: correct code → true, wrong code → false, hash round-trip

#### `src/features/lesson/components/quiz/quizHelpers.ts`

- **Functions:** `computeTotals()`, `isAnswerEmpty()`, `gradeQuestion()`
- **Risk:** Orchestration layer dispatching to all graders — a bug here affects every quiz type
- **Suggested tests:**
  - `computeTotals`: mixed IELTS + legacy questions, pre-graded vs ungraded
  - `isAnswerEmpty`: each answer variant (legacy_single, tfng, multiple_choice, completion, matching_*)
  - `gradeQuestion`: correct dispatch for each question type

#### `src/features/lesson/components/quiz/buildReviewRows.ts`

- **Function:** `buildReviewRows()`
- **Risk:** 170-line pure function with switch statement. Serializes answers to human-readable review
- **Suggested tests:**
  - One test per question type (legacy, tfng, multiple_choice, matching_headings, matching_information, matching_features, completion)
  - Missing answer → "未作答"
  - Correct vs incorrect display

### Priority 2 — Complex stateful logic

#### `src/store/useUserStore.ts`

- **Functions:** `upsertVocabOccurrence()`, `fetchDictionaryRecord()`, `initWordReviewState()`, `updateWordReview()`, `batchUpdateWordReview()`
- **Risk:** 460+ line Zustand store driving vocabulary, caching (TTL), and spaced repetition
- **Suggested tests:**
  - `upsertVocabOccurrence`: new word, duplicate detection, occurrence list growth
  - `fetchDictionaryRecord`: TTL expiry, cache hit, revalidation
  - Review state methods: init, update, batch update

#### `src/features/auth/lib/data-migration.ts`

- **Risk:** Syncs local data to cloud on login — data loss risk if migration logic is wrong

### Priority 3 — API routes (integration tests)

| Route | Path | Risk |
|-------|------|------|
| Review save | `src/app/api/review/save/route.ts` | Schema validation bugs silently lose AI-generated content |
| Auth routes | `src/app/api/auth/*/route.ts` | 5 routes for OTP/password reset — testable with mocked Supabase/Resend |
| Dictionary | `src/app/api/dictionary/route.ts` | Orchestrates cache → API → AI fallback pipeline |

### Priority 4 — E2E coverage gaps

Missing page coverage:
- Lesson detail page + quiz interaction flow
- Vocabulary management (save/unsave words)
- Writing submission and grading flow
- Review/swipe interface
- Password reset flow

---

## Infrastructure Recommendations

### 1. Add coverage configuration

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**',
        'src/features/**/grading/**',
        'src/features/**/quiz/quizHelpers.ts',
        'src/features/**/quiz/buildReviewRows.ts',
        'src/store/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
      },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

### 2. Add dev dependency

```bash
pnpm add -D @vitest/coverage-v8
```

### 3. Add coverage script

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

### 4. CI integration

Add coverage reporting to `.github/workflows/ci.yml` so PRs show coverage deltas.

---

## Quick Wins (highest value, lowest effort)

All pure functions — zero mocking required:

1. **`dictionary.ts`** — `normalizeDictionaryQuery()` + `mapDictionaryEntries()` (~15 test cases)
2. **`otp.ts`** — Generate, hash, verify round-trip (~5 test cases)
3. **`dictionary-quality.ts`** — Complete vs incomplete entries (~5 test cases)
4. **`quizHelpers.ts`** — Score computation, empty detection, grade dispatch (~12 test cases)
5. **`buildReviewRows.ts`** — One test per question type (~8 test cases)

**Estimated effort:** ~45 new test cases covering ~500 lines of critical, currently untested business logic.
