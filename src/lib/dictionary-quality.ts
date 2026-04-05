/**
 * @description 判断 dictionaryapi.dev 返回的词典数据是否字段完整。
 *   不完整时触发 AI fallback。
 */

import { DictionaryEntry } from '@/types/dictionary';

export function isDictionaryEntryComplete(
  entries: DictionaryEntry[] | null
): boolean {
  if (!entries || entries.length === 0) return false;

  const primary = entries[0];

  const hasDefinitions = primary.meanings.some(
    (m) => m.definitions.length > 0
  );

  const hasPhonetic =
    Boolean(primary.phonetic) ||
    primary.phonetics.some((p) => Boolean(p.text));

  return hasDefinitions && hasPhonetic;
}
