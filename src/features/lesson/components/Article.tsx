'use client';

import React from 'react';
import { useLessonStore } from '@/store/useLessonStore';
import { LessonArticle, LessonUI } from '@/types/lesson';

interface ArticleProps {
  article: LessonArticle;
  ui: LessonUI;
}

/**
 * @author SuperQ
 * @description 渲染课程正文并处理高亮词点击交互。
 * @param props 文章内容与界面文案配置。
 * @return 文章阅读视图组件。
 */
export const Article: React.FC<ArticleProps> = ({ article, ui }) => {
  const { selectedWord, setSelectedWord } = useLessonStore();

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
      if (word === selectedWord) {
        setSelectedWord(null);
      } else {
        setSelectedWord(word);
      }
    }
  };

  return (
    <div className="min-h-[80vh] border-gray-100 bg-white p-5 sm:min-h-0 sm:rounded-xl sm:border sm:p-8 sm:shadow-sm">
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <span className="mt-0.5 text-xl">💡</span>
        <p
          className="text-sm leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: ui.articleHintHtml }}
        />
      </div>

      <article
        className="prose prose-base sm:prose-lg serif max-w-none leading-relaxed text-slate-800"
        onClick={handleWordClick}
      >
        <h2 className="mb-5 font-sans text-xl leading-snug font-bold text-slate-900 sm:text-2xl">
          {article.heading}
        </h2>
        {article.paragraphs.map((p, i) => (
          <p
            key={i}
            className="mb-5"
            dangerouslySetInnerHTML={{
              __html: p.replace(
                /data-word="([^"]+)"/g,
                (match, word) =>
                  `${match} class="vocab-word ${word === selectedWord ? 'vocab-active' : ''}"`
              ),
            }}
          />
        ))}
      </article>
    </div>
  );
};
