/**
 * @author SaltedFish-No1
 * @description 判断 dictionaryapi.dev 返回的词典数据是否字段完整。
 *   不完整时触发 AI fallback。
 */

import { DictionaryEntry } from '@/types/dictionary';

/**
 * @description 判断词典条目数据是否字段完整（包含释义和音标）。
 *   不完整时调用方应触发 AI fallback 补全。
 *
 * @param entries 词典条目数组，null 视为不完整
 * @returns true 表示数据完整，false 表示需要 AI 补全
 */
export function isDictionaryEntryComplete(
  entries: DictionaryEntry[] | null
): boolean {
  if (!entries || entries.length === 0) return false;

  const primary = entries[0];

  const hasDefinitions = primary.meanings.some((m) => m.definitions.length > 0);

  const hasPhonetic =
    Boolean(primary.phonetic) || primary.phonetics.some((p) => Boolean(p.text));

  return hasDefinitions && hasPhonetic;
}
