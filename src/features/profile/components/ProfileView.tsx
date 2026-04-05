'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import {
  BookOpen,
  Trophy,
  BookMarked,
  Calendar,
  LogIn,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Globe,
  Target,
  BarChart3,
  Trash2,
  Info,
  LogOut,
  Camera,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  usePreferenceStore,
  type ExamGoal,
  type DifficultyPref,
} from '@/store/usePreferenceStore';

const EXAM_GOALS: { value: ExamGoal; label: string }[] = [
  { value: 'ielts', label: '雅思 IELTS' },
  { value: 'toefl', label: '托福 TOEFL' },
  { value: 'cet4', label: '大学英语四级' },
  { value: 'cet6', label: '大学英语六级' },
  { value: 'general', label: '日常提升' },
];

const DAILY_GOALS = [
  { value: 1, label: '1 课/天' },
  { value: 2, label: '2 课/天' },
  { value: 3, label: '3 课/天' },
  { value: 5, label: '5 课/天' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyPref; label: string }[] = [
  { value: 'auto', label: '自动推荐' },
  { value: 'A1', label: 'A1 入门' },
  { value: 'A2', label: 'A2 基础' },
  { value: 'B1', label: 'B1 中级' },
  { value: 'B2', label: 'B2 中高级' },
  { value: 'C1', label: 'C1 高级' },
  { value: 'C2', label: 'C2 精通' },
];

const LANG_OPTIONS = [{ value: 'en' as const, label: '🇬🇧 英语 English' }];

/** 将图片文件压缩为 128x128 的 base64 JPEG */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // 居中裁切为正方形
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  SettingRow                                                         */
/* ------------------------------------------------------------------ */
function SettingRow<T extends string | number>({
  icon,
  label,
  value,
  options,
  onSelect,
  expanded,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onSelect: (v: T) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const currentLabel = options.find((o) => o.value === value)?.label ?? '';
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
      >
        <span className="text-emerald-600">{icon}</span>
        <span className="flex-1 text-sm font-medium text-slate-700">
          {label}
        </span>
        <span className="text-xs text-slate-400">{currentLabel}</span>
        {expanded ? (
          <ChevronDown size={16} className="text-slate-300" />
        ) : (
          <ChevronRight size={16} className="text-slate-300" />
        )}
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-2 px-4 pt-1 pb-3">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => onSelect(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                opt.value === value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProfileView                                                        */
/* ------------------------------------------------------------------ */
export function ProfileView() {
  const { savedWords, history, dictionaryCache } = useUserStore();
  const { user, isGuest, signOut } = useAuthStore();
  const prefs = usePreferenceStore();

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(prefs.nickname);
  const [showAbout, setShowAbout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (key: string) =>
    setExpandedRow((prev) => (prev === key ? null : key));

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

  const cacheCount = Object.keys(dictionaryCache).length;

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await compressImage(file);
        prefs.setAvatarUrl(dataUrl);
      } catch {
        console.error('Failed to process avatar image');
      }
      // reset so same file can be re-selected
      e.target.value = '';
    },
    [prefs]
  );

  const handleNicknameSubmit = () => {
    const trimmed = nicknameDraft.trim();
    if (trimmed) prefs.setNickname(trimmed);
    else setNicknameDraft(prefs.nickname);
    setEditingNickname(false);
  };

  const handleClearCache = () => {
    if (
      confirm('确定要清除词典缓存吗？共 ' + cacheCount + ' 条记录将被清除。')
    ) {
      useUserStore.setState({ dictionaryCache: {} });
    }
  };

  const handleSignOut = () => {
    if (confirm('确定要退出登录吗？')) {
      signOut();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      <header className="pt-safe sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            我的
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-grow space-y-6 px-5 py-8">
        {/* ── User Card ─────────────────────────────── */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 ring-2 ring-emerald-200 transition-transform hover:scale-105 active:scale-95"
              title="点击上传头像"
            >
              {prefs.avatarUrl ? (
                <img
                  src={prefs.avatarUrl}
                  alt="头像"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={28} className="text-emerald-400" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={18} className="text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <div className="min-w-0 flex-1">
              {/* Nickname */}
              {editingNickname ? (
                <input
                  value={nicknameDraft}
                  onChange={(e) => setNicknameDraft(e.target.value)}
                  onBlur={handleNicknameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleNicknameSubmit()}
                  maxLength={20}
                  autoFocus
                  className="w-full rounded-lg border border-emerald-300 bg-emerald-50/50 px-2 py-1 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              ) : (
                <button
                  onClick={() => {
                    setNicknameDraft(prefs.nickname);
                    setEditingNickname(true);
                  }}
                  className="text-left text-base font-bold text-slate-900 transition-colors hover:text-emerald-700"
                  title="点击编辑昵称"
                >
                  {prefs.nickname}
                </button>
              )}

              {isGuest ? (
                <div>
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
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {user?.email ?? '已登录'}
                  <span className="ml-2 text-emerald-600">·</span>
                  <span className="ml-1 text-xs text-emerald-600">已同步</span>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Stats Grid ────────────────────────────── */}
        <section className="grid grid-cols-3 gap-3">
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

        {/* ── Learning Settings ─────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-4 pt-4 pb-1">
            <h2 className="text-sm font-bold text-slate-900">学习设置</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <SettingRow
              icon={<GraduationCap size={18} />}
              label="备考目标"
              value={prefs.examGoal}
              options={EXAM_GOALS}
              onSelect={prefs.setExamGoal}
              expanded={expandedRow === 'exam'}
              onToggle={() => toggle('exam')}
            />
            <SettingRow
              icon={<Globe size={18} />}
              label="学习语言"
              value={prefs.learningLang}
              options={LANG_OPTIONS}
              onSelect={prefs.setLearningLang}
              expanded={expandedRow === 'lang'}
              onToggle={() => toggle('lang')}
            />
            <SettingRow
              icon={<Target size={18} />}
              label="每日目标"
              value={prefs.dailyGoal}
              options={DAILY_GOALS}
              onSelect={prefs.setDailyGoal}
              expanded={expandedRow === 'daily'}
              onToggle={() => toggle('daily')}
            />
            <SettingRow
              icon={<BarChart3 size={18} />}
              label="难度偏好"
              value={prefs.difficultyPref}
              options={DIFFICULTY_OPTIONS}
              onSelect={prefs.setDifficultyPref}
              expanded={expandedRow === 'diff'}
              onToggle={() => toggle('diff')}
            />
          </div>
        </section>

        {/* ── Learning History ──────────────────────── */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">学习记录</h2>
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

        {/* ── General Settings ──────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-4 pt-4 pb-1">
            <h2 className="text-sm font-bold text-slate-900">通用</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Clear Cache */}
            <button
              onClick={handleClearCache}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="text-slate-400">
                <Trash2 size={18} />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700">
                清除词典缓存
              </span>
              <span className="text-xs text-slate-400">{cacheCount} 条</span>
            </button>

            {/* About */}
            <button
              onClick={() => setShowAbout((p) => !p)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="text-slate-400">
                <Info size={18} />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700">
                关于薄荷外语
              </span>
              {showAbout ? (
                <ChevronDown size={16} className="text-slate-300" />
              ) : (
                <ChevronRight size={16} className="text-slate-300" />
              )}
            </button>
            {showAbout && (
              <div className="space-y-1 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <p>
                  <span className="font-medium text-slate-600">薄荷外语</span>{' '}
                  v0.1.0
                </p>
                <p>用 AI 驱动的沉浸式英语学习应用</p>
                <p className="text-slate-400">
                  Built with Next.js · Powered by AI
                </p>
              </div>
            )}

            {/* Sign Out */}
            {!isGuest && (
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-red-50"
              >
                <span className="text-red-400">
                  <LogOut size={18} />
                </span>
                <span className="flex-1 text-sm font-medium text-red-600">
                  退出登录
                </span>
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
