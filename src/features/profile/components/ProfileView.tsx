'use client';

import { useMemo } from 'react';
import { BookOpen, Trophy, BookMarked, Calendar, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';

export function ProfileView() {
  const { savedWords, history } = useUserStore();
  const { user, isGuest } = useAuthStore();

  const stats = useMemo(() => {
    const wordCount = Object.keys(savedWords).filter(
      (k) => savedWords[k].length > 0
    ).length;
    const completedLessons = Object.values(history);
    const lessonCount = completedLessons.length;
    const avgScore =
      lessonCount > 0
        ? Math.round(
            completedLessons.reduce(
              (sum, h) => sum + (h.score / h.total) * 100,
              0
            ) / lessonCount
          )
        : 0;

    return { wordCount, lessonCount, avgScore };
  }, [savedWords, history]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      <header className="pt-safe border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            我的
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-grow px-5 py-8">
        {/* User Card */}
        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
              {isGuest ? '?' : (user?.email?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="flex-1">
              {isGuest ? (
                <div>
                  <p className="text-base font-bold text-slate-900">游客模式</p>
                  <p className="mt-1 text-sm text-slate-500">
                    登录后可同步数据到云端
                  </p>
                  <Link
                    href="/login"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    <LogIn size={14} />
                    登录账号
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-base font-bold text-slate-900">
                    {user?.email ?? '用户'}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    数据已同步至云端
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <BookOpen size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.lessonCount}
            </p>
            <p className="text-[11px] font-bold text-slate-400">已完成课程</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <BookMarked size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.wordCount}
            </p>
            <p className="text-[11px] font-bold text-slate-400">收藏生词</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <Trophy size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.avgScore > 0 ? `${stats.avgScore}%` : '--'}
            </p>
            <p className="text-[11px] font-bold text-slate-400">平均分数</p>
          </div>
        </section>

        {/* Completed Lessons */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">学习记录</h2>
          </div>
          {Object.values(history).length > 0 ? (
            <div className="space-y-2">
              {Object.values(history)
                .sort((a, b) => b.completedAt - a.completedAt)
                .map((record) => (
                  <Link
                    key={record.slug}
                    href={`/lessons/${record.slug}`}
                    className="flex items-center justify-between rounded-xl border border-slate-50 px-4 py-3 transition-colors hover:border-emerald-100 hover:bg-emerald-50/50"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {record.slug}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(record.completedAt).toLocaleDateString(
                          'zh-CN'
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-600">
                        {record.score}/{record.total}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {Math.round((record.score / record.total) * 100)}%
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400">
              还没有学习记录，去完成第一课吧！
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
