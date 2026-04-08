'use client';

/**
 * @author SaltedFish-No1
 * @description 写作批改报告组件，展示 AI 批改的详细评分、反馈与改进建议。
 */
import { useState } from 'react';
import {
  AlertCircle,
  Lightbulb,
  BookOpen,
  ThumbsUp,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GradeScoreCard } from './GradeScoreCard';
import type { WritingGrade, GradingCriteriaDimension } from '@/types/writing';

interface GradeReportProps {
  grade: WritingGrade;
  dimensions: GradingCriteriaDimension[];
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icon size={16} />
          {title}
        </span>
        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-50 px-4 pt-3 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GradeReport({ grade, dimensions }: GradeReportProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Score card */}
      <GradeScoreCard grade={grade} dimensions={dimensions} />

      {/* Overall comment */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-700">
          {grade.overallComment}
        </p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <ThumbsUp size={14} />
            优势
          </p>
          <ul className="flex flex-col gap-1.5">
            {grade.strengths.map((s, i) => (
              <li key={i} className="text-xs leading-relaxed text-emerald-800">
                • {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <TrendingUp size={14} />
            改进方向
          </p>
          <ul className="flex flex-col gap-1.5">
            {grade.improvements.map((s, i) => (
              <li key={i} className="text-xs leading-relaxed text-amber-800">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dimension feedback */}
      <CollapsibleSection title="各维度详细反馈" icon={BookOpen} defaultOpen>
        <div className="flex flex-col gap-3">
          {grade.dimensionScores.map((ds) => {
            const dim = dimensions.find((d) => d.key === ds.key);
            return (
              <div key={ds.key}>
                <p className="mb-1 text-xs font-bold text-violet-700">
                  {dim?.label ?? ds.key} ({ds.score})
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  {ds.feedback}
                </p>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Grammar errors */}
      {grade.grammarErrors.length > 0 && (
        <CollapsibleSection title="语法错误" icon={AlertCircle}>
          <div className="flex flex-col gap-3">
            {grade.grammarErrors.map((err, i) => (
              <div key={i} className="rounded-xl bg-red-50/50 p-3 text-xs">
                <p className="text-red-600 line-through">{err.sentence}</p>
                <p className="mt-1 font-medium text-emerald-700">
                  {err.correction}
                </p>
                <p className="mt-1 text-slate-500">{err.explanation}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Vocabulary suggestions */}
      {grade.vocabularySuggestions.length > 0 && (
        <CollapsibleSection title="词汇提升建议" icon={Lightbulb}>
          <div className="flex flex-col gap-2">
            {grade.vocabularySuggestions.map((sug, i) => (
              <div key={i} className="text-xs">
                <span className="text-slate-400">{sug.original}</span>
                <span className="mx-2 text-slate-300">→</span>
                <span className="font-medium text-violet-700">
                  {sug.suggested}
                </span>
                <span className="ml-2 text-slate-400">({sug.reason})</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Model answer */}
      <CollapsibleSection title="参考范文" icon={BookOpen}>
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
          {grade.modelAnswer}
        </p>
      </CollapsibleSection>
    </div>
  );
}
