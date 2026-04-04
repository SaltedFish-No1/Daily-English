/**
 * @description 词典 API 客户端：请求 dictionaryapi.dev 并规范化返回数据。
 */

import { DictionaryEntry, DictionaryPhonetic } from '@/types/dictionary';

interface DictionaryApiPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

interface DictionaryApiDefinition {
  definition?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface DictionaryApiMeaning {
  partOfSpeech?: string;
  definitions?: DictionaryApiDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface DictionaryApiEntry {
  word?: string;
  phonetic?: string;
  phonetics?: DictionaryApiPhonetic[];
  meanings?: DictionaryApiMeaning[];
  sourceUrls?: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

const normalizeStringList = (value: unknown) => {
  return Array.isArray(value) ? value.filter(isString) : [];
};

const mapPhonetics = (
  phonetics: DictionaryApiPhonetic[] = []
): DictionaryPhonetic[] => {
  return phonetics
    .map((item) => {
      if (!isRecord(item)) return null;

      const text = isString(item.text) ? item.text : undefined;
      const audio = isString(item.audio) ? item.audio : undefined;
      const sourceUrl =
        isRecord(item) && isString(item.sourceUrl) ? item.sourceUrl : undefined;

      if (!text && !audio && !sourceUrl) return null;

      return {
        text,
        audio,
        sourceUrl,
      };
    })
    .filter((item) => item !== null);
};

const pickPreferredPhonetic = (
  entryPhonetic: unknown,
  phonetics: DictionaryPhonetic[]
) => {
  if (isString(entryPhonetic)) return entryPhonetic;
  return phonetics.find((item) => isString(item.text))?.text;
};

const pickPreferredAudio = (phonetics: DictionaryPhonetic[]) => {
  return phonetics.find((item) => isString(item.audio))?.audio;
};

export const normalizeDictionaryQuery = (value: string) => {
  return value
    .trim()
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')
    .toLowerCase();
};

export const mapDictionaryEntries = (
  payload: unknown
): DictionaryEntry[] | null => {
  if (!Array.isArray(payload)) return null;

  const entries = payload
    .map((item) => {
      if (!isRecord(item)) return null;

      const typedItem = item as DictionaryApiEntry;
      const word = isString(typedItem.word) ? typedItem.word : null;
      const phonetics = mapPhonetics(
        Array.isArray(typedItem.phonetics) ? typedItem.phonetics : []
      );
      const meanings = Array.isArray(typedItem.meanings)
        ? typedItem.meanings
            .map((meaning) => {
              if (!isRecord(meaning)) return null;
              const definitions = Array.isArray(meaning.definitions)
                ? meaning.definitions
                    .map((definition) => {
                      if (
                        !isRecord(definition) ||
                        !isString(definition.definition)
                      ) {
                        return null;
                      }
                      return {
                        definition: definition.definition,
                        example: isString(definition.example)
                          ? definition.example
                          : undefined,
                        synonyms: normalizeStringList(definition.synonyms),
                        antonyms: normalizeStringList(definition.antonyms),
                      };
                    })
                    .filter((definition) => definition !== null)
                : [];

              if (definitions.length === 0) return null;

              return {
                partOfSpeech: isString(meaning.partOfSpeech)
                  ? meaning.partOfSpeech
                  : undefined,
                definitions,
                synonyms: normalizeStringList(meaning.synonyms),
                antonyms: normalizeStringList(meaning.antonyms),
              };
            })
            .filter((meaning) => meaning !== null)
        : [];

      if (!word || meanings.length === 0) return null;

      return {
        word,
        phonetic: pickPreferredPhonetic(typedItem.phonetic, phonetics),
        audio: pickPreferredAudio(phonetics),
        phonetics,
        meanings,
        sourceUrls: normalizeStringList(typedItem.sourceUrls),
      };
    })
    .filter((entry) => entry !== null);

  return entries.length > 0 ? entries : null;
};

const FETCH_TIMEOUT_MS = 5000;

export const fetchDictionaryEntries = async (word: string) => {
  const normalizedWord = normalizeDictionaryQuery(word);
  if (!normalizedWord) {
    return {
      status: 'not_found' as const,
      data: null,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        status: 'not_found' as const,
        data: null,
      };
    }

    if (!response.ok) {
      return {
        status: 'error' as const,
        data: null,
      };
    }

    const payload = await response.json();
    const data = mapDictionaryEntries(payload);

    if (!data) {
      return {
        status: 'error' as const,
        data: null,
      };
    }

    return {
      status: 'success' as const,
      data,
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      status: 'error' as const,
      data: null,
    };
  }
};
