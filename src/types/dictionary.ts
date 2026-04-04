export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryMeaning {
  partOfSpeech?: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  audio?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  sourceUrls: string[];
}

export interface DictionaryCacheRecord {
  fetchedAt: number;
  data: DictionaryEntry[] | null;
  status: 'loading' | 'success' | 'not_found' | 'error';
}
