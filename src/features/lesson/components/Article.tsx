'use client';

import React, { useState } from 'react';
import { useLessonStore } from '@/store/useLessonStore';
import { LessonArticle } from '@/types/lesson';

interface ArticleProps {
  article: LessonArticle;
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
    ? '阅读下方文章，理解核心观点。<br><strong>交互提示：</strong>点击<span class="text-emerald-700 font-bold border-b-2 border-emerald-300 px-1 rounded bg-white">高亮词汇</span>可查看释义并播放发音。'
    : '阅读下方文章，理解核心观点。<br><strong>交互提示：</strong>点击<span class="text-emerald-700 font-bold border-b-2 border-emerald-300 px-1 rounded bg-white">高亮词汇</span>可查看释义与中文翻译。';

  /**
   * @author SuperQ
   * @description 处理高亮单词点击并切换当前选中状态。
   * @param e React 鼠标事件对象。
   * @return 无返回值。
   */
  const handleWordClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('vocab-word')) {
      const word = target.getAttribute('data-word');
      const paragraphIndexRaw = target.getAttribute('data-p');
      const paragraphIndex = Number(paragraphIndexRaw);
      if (!word || Number.isNaN(paragraphIndex)) return;
      const isSameSelection =
        selectedWordContext?.word === word &&
        selectedWordContext.lessonSlug === lessonSlug &&
        selectedWordContext.paragraphIndex === paragraphIndex;
      if (isSameSelection) {
        setSelectedWordContext(null);
      } else {
        setSelectedWordContext({
          word,
          lessonSlug,
          lessonTitle,
          paragraphIndex,
        });
      }
    }
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
            <button
              type="button"
              onClick={() => setShowHint(false)}
              className="rounded-md px-2 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <article
        className="prose prose-base sm:prose-lg serif max-w-none leading-relaxed text-slate-800"
        onClick={handleWordClick}
      >
        <div className="mb-6 flex items-start justify-between gap-4 sm:items-center">
          <h2 className="m-0 font-sans text-xl leading-snug font-bold text-slate-900 sm:text-2xl">
            {article.title}
          </h2>
        </div>

        {article.paragraphs.map((p, i) => (
          <div key={i} id={`p-${i}`} className="mb-8 scroll-mt-28">
            <p
              className="mb-2"
              dangerouslySetInnerHTML={{
                __html: p.en.replace(/data-word="([^"]+)"/g, (match, word) => {
                  const isActive =
                    selectedWordContext !== null &&
                    word === selectedWordContext.word &&
                    lessonSlug === selectedWordContext.lessonSlug &&
                    i === selectedWordContext.paragraphIndex;
                  return `${match} data-p="${i}" class="vocab-word ${isActive ? 'vocab-active' : ''}"`;
                }),
              }}
            />
            {p.zh && (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
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
                </button>
              </div>
            )}
            {visibleTranslations[i] && p.zh && (
              <p
                className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-4 font-sans text-base leading-relaxed text-slate-600"
                dangerouslySetInnerHTML={{ __html: p.zh }}
              />
            )}
          </div>
        ))}
      </article>
    </div>
  );
};
