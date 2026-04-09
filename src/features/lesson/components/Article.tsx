'use client';

/**
 * @author SaltedFish-No1
 * @description 课程文章组件，渲染段落文本并高亮焦点词汇，支持点击查词。
 */

import React, { useState } from 'react';
import { buildRenderableTokens } from '@/lib/focus-words';
import { Button } from '@/components/ui/button';
import { useLessonStore } from '@/store/useLessonStore';
import { FocusWord, LessonArticle } from '@/types/lesson';

interface ArticleProps {
  article: LessonArticle;
  focusWords: FocusWord[];
  speechEnabled: boolean;
  lessonSlug: string;
  lessonTitle: string;
}

/**
 * @author SuperQ
 * @description 渲染课程正文并处理高亮词点击交互。
 * @param props 文章内容与界面文案配置。
 * @return 文章阅读视图组件。
 */
export const Article: React.FC<ArticleProps> = ({
  article,
  focusWords,
  speechEnabled,
  lessonSlug,
  lessonTitle,
}) => {
  const { selectedWordContext, setSelectedWordContext } = useLessonStore();
  const [showHint, setShowHint] = useState(true);
  const [visibleTranslations, setVisibleTranslations] = useState<
    Record<number, boolean>
  >({});
  const articleHintHtml = speechEnabled
    ? '阅读下方文章，理解核心观点。<br><strong>交互提示：</strong>点击任意英文单词可查询英文词典，<span class="text-emerald-700 font-bold border-b-2 border-emerald-300 px-1 rounded bg-white">高亮词汇</span>为本课重点词，并支持播放发音。'
    : '阅读下方文章，理解核心观点。<br><strong>交互提示：</strong>点击任意英文单词可查询英文词典，<span class="text-emerald-700 font-bold border-b-2 border-emerald-300 px-1 rounded bg-white">高亮词汇</span>为本课重点词。';

  // 切换逻辑：点击同一词同一位置则取消选中（关闭词卡），否则打开新词。
  const handleWordSelect = (
    surface: string,
    query: string,
    paragraphIndex: number,
    isFocusWord: boolean
  ) => {
    const isSameSelection =
      selectedWordContext?.surface === surface &&
      selectedWordContext.query === query &&
      selectedWordContext.lessonSlug === lessonSlug &&
      selectedWordContext.paragraphIndex === paragraphIndex;
    if (isSameSelection) {
      setSelectedWordContext(null);
      return;
    }

    setSelectedWordContext({
      surface,
      query,
      isFocusWord,
      lessonSlug,
      lessonTitle,
      paragraphIndex,
    });
  };

  const renderInteractiveText = (text: string, paragraphIndex: number) => {
    return buildRenderableTokens(text, focusWords).map((token, tokenIndex) => {
      if (token.type === 'text' || !token.query) {
        return (
          <React.Fragment key={`${paragraphIndex}-${tokenIndex}-text`}>
            {token.text}
          </React.Fragment>
        );
      }

      const query = token.query;

      const isActive =
        selectedWordContext !== null &&
        selectedWordContext.surface === token.text &&
        selectedWordContext.query === query &&
        lessonSlug === selectedWordContext.lessonSlug &&
        paragraphIndex === selectedWordContext.paragraphIndex;

      return (
        <Button
          key={`${paragraphIndex}-${tokenIndex}-${query}-${token.text}`}
          variant="ghost"
          onClick={() =>
            handleWordSelect(
              token.text,
              query,
              paragraphIndex,
              token.isFocusWord
            )
          }
          className={
            token.isFocusWord
              ? `vocab-word ${isActive ? 'vocab-active' : ''}`
              : `rounded-sm px-0.5 text-inherit transition-colors hover:bg-slate-100 ${
                  isActive ? 'bg-slate-100 text-slate-900' : ''
                }`
          }
        >
          {token.text}
        </Button>
      );
    });
  };

  const toggleTranslation = (index: number) => {
    setVisibleTranslations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="min-h-[80vh] border-gray-100 bg-white p-5 sm:min-h-0 sm:rounded-xl sm:border sm:p-8 sm:shadow-sm">
      {showHint && (
        <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">💡</span>
              <p
                className="text-sm leading-relaxed text-slate-700"
                dangerouslySetInnerHTML={{ __html: articleHintHtml }}
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowHint(false)}
              className="rounded-md px-2 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-700"
            >
              关闭
            </Button>
          </div>
        </div>
      )}

      <article className="prose prose-base sm:prose-lg serif max-w-none leading-relaxed text-slate-800">
        <div className="mb-6 flex items-start justify-between gap-4 sm:items-center">
          <h2 className="m-0 font-sans text-xl leading-snug font-bold text-slate-900 sm:text-2xl">
            {article.title}
          </h2>
        </div>

        {article.paragraphs.map((p, i) => (
          <div key={p.id} id={`p-${i}`} className="mb-8 scroll-mt-28">
            <p className="mb-2">{renderInteractiveText(p.en, i)}</p>
            {p.zh && (
              <div className="mb-2 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTranslation(i);
                  }}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    visibleTranslations[i]
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {visibleTranslations[i] ? '隐藏翻译' : '显示翻译'}
                </Button>
              </div>
            )}
            {visibleTranslations[i] && p.zh && (
              <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-4 font-sans text-base leading-relaxed text-slate-600">
                {p.zh}
              </p>
            )}
          </div>
        ))}
      </article>
    </div>
  );
};
