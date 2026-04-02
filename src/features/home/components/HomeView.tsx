'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LessonDifficulty, LessonListItem } from '@/types/lesson';
import { Calendar, ArrowRight, Download, BookMarked } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import {
  CEFRGuideDialog,
  difficultyClassMap,
} from '@/features/home/components/CEFRGuideDialog';

interface HomeViewProps {
  lessons: LessonListItem[];
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallDialogState {
  open: boolean;
  title: string;
  message: string;
  showConfirm: boolean;
}

interface DifficultyGuideState {
  open: boolean;
  difficulty: LessonDifficulty | null;
}

/**
 * @author SuperQ
 * @description 渲染首页课程列表与入口卡片。
 * @param props 课程清单数据。
 * @return 首页视图组件。
 */
export const HomeView: React.FC<HomeViewProps> = ({ lessons }) => {
  const { savedWords } = useUserStore();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    const standaloneByDisplayMode = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    const standaloneByNavigator =
      'standalone' in window.navigator &&
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      );
    return standaloneByDisplayMode || standaloneByNavigator;
  });
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  });
  const [isSafari] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  });
  const [installDialog, setInstallDialog] = useState<InstallDialogState>({
    open: false,
    title: '',
    message: '',
    showConfirm: false,
  });
  const [difficultyGuide, setDifficultyGuide] = useState<DifficultyGuideState>({
    open: false,
    difficulty: null,
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isStandalone) {
      setInstallDialog({
        open: true,
        title: '已安装',
        message: 'Magic English 已经安装到本地。',
        showConfirm: false,
      });
      return;
    }
    if (!installEvent) {
      if (isIOS && !isSafari) {
        setInstallDialog({
          open: true,
          title: '请切换 Safari',
          message:
            'iOS 上 Edge/Chrome 不支持网页安装入口，请使用 Safari 打开后，通过“分享 -> 添加到主屏幕”安装。',
          showConfirm: false,
        });
        return;
      }
      if (isIOS && isSafari) {
        setInstallDialog({
          open: true,
          title: '手动安装',
          message: '请在 Safari 中点击“分享”按钮，然后选择“添加到主屏幕”。',
          showConfirm: false,
        });
        return;
      }
      setInstallDialog({
        open: true,
        title: '暂不可直接安装',
        message:
          '当前浏览器暂未触发安装事件，请使用浏览器菜单中的“安装应用”入口。',
        showConfirm: false,
      });
      return;
    }
    setInstallDialog({
      open: true,
      title: '确认安装',
      message: '确认安装 Magic English 到本地吗？',
      showConfirm: true,
    });
  };

  const closeInstallDialog = () => {
    setInstallDialog((prev) => ({ ...prev, open: false }));
  };

  const confirmInstall = async () => {
    if (!installEvent) {
      closeInstallDialog();
      return;
    }
    closeInstallDialog();
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === 'accepted') {
      setInstallDialog({
        open: true,
        title: '安装请求已提交',
        message: '系统正在完成安装流程，请稍候。',
        showConfirm: false,
      });
      return;
    }
    setInstallDialog({
      open: true,
      title: '已取消安装',
      message: '你已取消本次安装请求。',
      showConfirm: false,
    });
  };

  const openDifficultyGuide = (
    event: React.MouseEvent<HTMLElement>,
    difficulty: LessonDifficulty
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDifficultyGuide({
      open: true,
      difficulty,
    });
  };

  const closeDifficultyGuide = () => {
    setDifficultyGuide({
      open: false,
      difficulty: null,
    });
  };

  const installTitle = isStandalone ? '已安装' : '安装到本地';

  const installLabel = isStandalone ? '已安装' : '安装';
  const recentWordEntries = useMemo(() => {
    return Object.entries(savedWords)
      .filter(([, occurrences]) => occurrences.length > 0)
      .map(([word, occurrences]) => {
        const [firstOccurrence, ...restOccurrences] = occurrences;
        const latestOccurrence = restOccurrences.reduce(
          (latest, current) =>
            current.savedAt > latest.savedAt ? current : latest,
          firstOccurrence
        );
        return { word, latestOccurrence };
      })
      .sort((a, b) => b.latestOccurrence.savedAt - a.latestOccurrence.savedAt);
  }, [savedWords]);
  const savedWordCount = recentWordEntries.length;
  const previewCount = Math.min(
    8,
    Math.max(2, Math.min(6, savedWordCount || 0))
  );
  const recentWords = recentWordEntries.slice(0, previewCount);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="pt-safe sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:py-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Daily English
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:text-sm">
              Elevate Your Language
            </p>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            disabled={isStandalone}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-600 transition-colors enabled:hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            title={installTitle}
          >
            <Download size={14} />
            {installLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-grow px-5 py-8 sm:py-12">
        <section className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked size={18} className="text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                我的生词库
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {savedWordCount} 词
              </span>
              <Link
                href="/vocab"
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                查看生词表
              </Link>
            </div>
          </div>
          {recentWords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentWords.map(({ word, latestOccurrence }) => (
                <span
                  key={`${word}-${latestOccurrence.lessonSlug}-${latestOccurrence.paragraphIndex}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              还没有收藏记录，进入课程点击高亮词后可在词卡里收藏。
            </p>
          )}
        </section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {lessons.map((lesson, i) => (
            <Link
              key={lesson.date}
              href={`/lessons/${lesson.date}`}
              className="group relative block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl active:scale-95"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex h-44 items-center justify-center bg-emerald-50/50 p-6 transition-colors group-hover:bg-emerald-50 sm:h-48 sm:p-8">
                  <div className="text-center">
                    <span className="mb-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                      {lesson.tag}
                    </span>
                    <h3 className="text-lg leading-tight font-bold text-slate-900 transition-colors group-hover:text-emerald-900 sm:text-xl">
                      {lesson.title}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {lesson.date}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) =>
                        openDifficultyGuide(event, lesson.difficulty)
                      }
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        event.stopPropagation();
                        setDifficultyGuide({
                          open: true,
                          difficulty: lesson.difficulty,
                        });
                      }}
                      className={`cursor-pointer rounded-full px-2 py-0.5 ${difficultyClassMap[lesson.difficulty]}`}
                    >
                      {lesson.difficulty}
                    </span>
                  </div>
                  <p className="mb-5 line-clamp-2 text-sm leading-relaxed font-medium text-slate-500">
                    {lesson.teaser}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                      立即开始
                      <ArrowRight size={16} className="ml-1" />
                    </div>
                    <div className="flex -space-x-1.5">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[8px] font-bold text-slate-400"
                        >
                          {j}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="pb-safe border-t border-slate-100 bg-white py-12 text-center">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          © 2026 DAILY ENGLISH · DESIGNED FOR LEARNING
        </p>
      </footer>

      {installDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-slate-900">
              {installDialog.title}
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-slate-600">
              {installDialog.message}
            </p>
            <div className="flex justify-end gap-2">
              {installDialog.showConfirm && (
                <button
                  type="button"
                  onClick={closeInstallDialog}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
              )}
              <button
                type="button"
                onClick={
                  installDialog.showConfirm
                    ? confirmInstall
                    : closeInstallDialog
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                {installDialog.showConfirm ? '确认安装' : '知道了'}
              </button>
            </div>
          </div>
        </div>
      )}
      <CEFRGuideDialog
        open={difficultyGuide.open}
        difficulty={difficultyGuide.difficulty}
        onClose={closeDifficultyGuide}
      />
    </div>
  );
};
