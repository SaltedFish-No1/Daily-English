import { describe, it, expect } from 'vitest';
import { validateLessonData } from '@/lib/lesson';

const validLesson = {
  schemaVersion: '2.1',
  meta: { title: 'Test Lesson' },
  speech: { enabled: false },
  article: {
    title: 'Article Title',
    paragraphs: [{ id: 'p1', en: 'Hello world.', zh: '你好世界。' }],
  },
  focusWords: [{ key: 'hello', forms: ['hello', 'hellos'] }],
  quiz: {
    title: 'Quiz',
    questions: [],
  },
};

describe('validateLessonData', () => {
  it('accepts a valid lesson', () => {
    expect(validateLessonData(validLesson)).not.toBeNull();
  });

  it('rejects null input', () => {
    expect(validateLessonData(null)).toBeNull();
  });

  it('rejects wrong schemaVersion', () => {
    expect(
      validateLessonData({ ...validLesson, schemaVersion: '1.0' })
    ).toBeNull();
  });

  it('rejects HTML in article paragraphs', () => {
    const withHtml = {
      ...validLesson,
      article: {
        ...validLesson.article,
        paragraphs: [{ id: 'p1', en: 'Hello <b>world</b>.', zh: '你好。' }],
      },
    };
    expect(validateLessonData(withHtml)).toBeNull();
  });

  it('rejects duplicate focusWord keys', () => {
    const withDupeKey = {
      ...validLesson,
      focusWords: [
        { key: 'hello', forms: ['hello'] },
        { key: 'hello', forms: ['hellos'] },
      ],
    };
    expect(validateLessonData(withDupeKey)).toBeNull();
  });

  it('rejects duplicate focusWord forms across different keys', () => {
    const withDupeForm = {
      ...validLesson,
      focusWords: [
        { key: 'run', forms: ['run', 'running'] },
        { key: 'jog', forms: ['jog', 'running'] },
      ],
    };
    expect(validateLessonData(withDupeForm)).toBeNull();
  });

  it('rejects missing quiz title', () => {
    const withBadQuiz = {
      ...validLesson,
      quiz: { questions: [] },
    };
    expect(validateLessonData(withBadQuiz)).toBeNull();
  });

  it('accepts lesson with empty questions array', () => {
    const result = validateLessonData(validLesson);
    expect(result?.quiz.questions).toEqual([]);
  });
});
