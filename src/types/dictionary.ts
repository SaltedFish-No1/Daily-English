/**
 * @author SaltedFish-No1
 * @description 词典领域类型：条目、释义、音标与缓存记录。
 */

export interface DictionaryDefinition {
  /** 英文释义 */
  definition: string;
  /** 中文释义，AI 补全后才有值 */
  definitionZh?: string;
  /** 例句，可能缺失 */
  example?: string;
  /** 近义词列表 */
  synonyms: string[];
  /** 反义词列表 */
  antonyms: string[];
}

export interface DictionaryMeaning {
  /** 词性，如 "noun"、"verb"，可能缺失 */
  partOfSpeech?: string;
  /** 该词性下的释义列表 */
  definitions: DictionaryDefinition[];
  /** 该词性级别的近义词 */
  synonyms: string[];
  /** 该词性级别的反义词 */
  antonyms: string[];
}

export interface DictionaryPhonetic {
  /** 音标文本，如 "/ˈwɜːrd/" */
  text?: string;
  /** 发音音频 URL */
  audio?: string;
  /** 音标数据来源 URL */
  sourceUrl?: string;
}

export interface DictionaryEntry {
  /** 单词原形 */
  word: string;
  /** 首选音标文本，从 phonetics 数组或顶层字段优先取得 */
  phonetic?: string;
  /** 首选发音音频 URL */
  audio?: string;
  /** 所有可用音标（含不同口音） */
  phonetics: DictionaryPhonetic[];
  /** 按词性分组的释义列表 */
  meanings: DictionaryMeaning[];
  /** 数据来源 URL 列表 */
  sourceUrls: string[];
}

export interface DictionaryCacheRecord {
  /** 上次获取时间戳（ms），用于缓存过期判断 */
  fetchedAt: number;
  /** 词典条目数据，null 表示查询失败或未找到 */
  data: DictionaryEntry[] | null;
  /** 缓存状态：加载中/重新验证/成功/未找到/错误 */
  status: 'loading' | 'revalidating' | 'success' | 'not_found' | 'error';
  /** 数据来源：词典 API / AI 生成 / 本地缓存 */
  source?: 'dictionaryapi' | 'ai_generated' | 'cache';
  /** TTS 发音音频 URL，null 表示暂无可用音频 */
  audioUrl?: string | null;
  /** 中文释义补全状态：已完整补全 / 正在补全 / 无中文释义 */
  zhStatus?: 'full' | 'pending' | 'none';
}
