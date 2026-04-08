'use client';

/**
 * @author SaltedFish-No1
 * @description 写作评分卡片组件，展示各维度得分及总分。
 */
import type { WritingGrade, GradingCriteriaDimension } from '@/types/writing';

interface GradeScoreCardProps {
  grade: WritingGrade;
  dimensions: GradingCriteriaDimension[];
}

function getScoreColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return 'bg-emerald-500';
  if (ratio >= 0.6) return 'bg-amber-500';
  return 'bg-red-400';
}

function getScoreBgColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return 'text-emerald-600 bg-emerald-50';
  if (ratio >= 0.6) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

export function GradeScoreCard({ grade, dimensions }: GradeScoreCardProps) {
  const maxScore = dimensions[0]?.maxScore ?? 9;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Overall score */}
      <div className="mb-5 flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black ${getScoreBgColor(grade.overallScore, maxScore)}`}
        >
          {grade.overallScore}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">综合评分</p>
          <p className="text-xs text-slate-400">满分 {maxScore}</p>
        </div>
      </div>

      {/* Dimension scores */}
      <div className="flex flex-col gap-3">
        {grade.dimensionScores.map((ds) => {
          const dim = dimensions.find((d) => d.key === ds.key);
          const max = dim?.maxScore ?? maxScore;
          return (
            <div key={ds.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">
                  {dim?.label ?? ds.key}
                </span>
                <span className="font-bold text-slate-900">
                  {ds.score}
                  <span className="font-normal text-slate-400">/{max}</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${getScoreColor(ds.score, max)}`}
                  style={{ width: `${(ds.score / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
