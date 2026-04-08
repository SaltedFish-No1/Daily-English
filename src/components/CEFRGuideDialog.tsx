'use client';

/**
 * @description CEFR 等级说明弹窗，含金字塔可视化与能力矩阵。
 */

import React from 'react';
import { LessonDifficulty } from '@/types/lesson';
import { Button } from '@/components/ui/button';

interface CEFRGuideDialogProps {
  open: boolean;
  difficulty: LessonDifficulty | null;
  onClose: () => void;
}

export const difficultyClassMap: Record<LessonDifficulty, string> = {
  A1: 'bg-cyan-50 text-cyan-600',
  A2: 'bg-sky-50 text-sky-600',
  B1: 'bg-emerald-50 text-emerald-600',
  B2: 'bg-amber-50 text-amber-600',
  C1: 'bg-violet-50 text-violet-600',
  C2: 'bg-rose-50 text-rose-600',
};

const difficultyLabelMap: Record<LessonDifficulty, string> = {
  A1: '入门级',
  A2: '初级',
  B1: '中级',
  B2: '中高级',
  C1: '高级',
  C2: '精通级',
};

interface CapabilityMatrixItem {
  dimension: string;
  description: string;
}

interface CapabilityMatrix {
  profile: string;
  items: CapabilityMatrixItem[];
}

const capabilityMatrixMap: Record<LessonDifficulty, CapabilityMatrix> = {
  A1: {
    profile: '基础起步阶段，目标是理解和回应最直接、最具体的语言输入。',
    items: [
      {
        dimension: '阅读理解',
        description: '识别高频词与短句，理解公告、菜单、问候等简单文本。',
      },
      {
        dimension: '口语互动',
        description: '可进行自我介绍、问答姓名/地点/时间等基础信息。',
      },
      {
        dimension: '信息表达',
        description: '使用固定句型表达需求，如点餐、问路、购物。',
      },
      { dimension: '任务完成', description: '在慢速清晰语境下完成单步任务。' },
    ],
  },
  A2: {
    profile: '日常沟通阶段，可在熟悉场景中处理连续但简单的信息。',
    items: [
      {
        dimension: '阅读理解',
        description: '理解与家庭、工作、生活相关的短文和通知。',
      },
      { dimension: '口语互动', description: '可完成日常对话与例行事务沟通。' },
      {
        dimension: '信息表达',
        description: '能描述个人背景、经历与近期计划。',
      },
      {
        dimension: '任务完成',
        description: '可在熟悉语境下完成多步但低复杂任务。',
      },
    ],
  },
  B1: {
    profile: '独立使用初阶，可在学习、工作、旅行场景中稳定沟通。',
    items: [
      {
        dimension: '阅读理解',
        description: '理解熟悉主题文本主旨与关键细节。',
      },
      {
        dimension: '口语互动',
        description: '应对旅行与生活中的常见问题并表达看法。',
      },
      {
        dimension: '信息表达',
        description: '可叙述经验、事件、目标并给出简要理由。',
      },
      {
        dimension: '任务完成',
        description: '完成中等复杂任务，具备基础问题解决能力。',
      },
    ],
  },
  B2: {
    profile: '独立使用高阶，可处理抽象话题与结构化论证。',
    items: [
      {
        dimension: '阅读理解',
        description: '把握复杂文本中的具体与抽象主旨。',
      },
      {
        dimension: '口语互动',
        description: '可与母语者自然互动并持续讨论多主题。',
      },
      {
        dimension: '信息表达',
        description: '能够结构化表达观点，进行利弊分析。',
      },
      {
        dimension: '任务完成',
        description: '可独立完成跨信息源整合的中高复杂任务。',
      },
    ],
  },
  C1: {
    profile: '高级运用阶段，可在学术与专业语境中高效、精确地沟通。',
    items: [
      {
        dimension: '阅读理解',
        description: '理解长文、隐含意义和高密度信息结构。',
      },
      {
        dimension: '口语互动',
        description: '流畅表达复杂观点，灵活调整语体策略。',
      },
      {
        dimension: '信息表达',
        description: '输出清晰且组织严密的论证性内容。',
      },
      {
        dimension: '任务完成',
        description: '处理高复杂任务并保持逻辑与语义精度。',
      },
    ],
  },
  C2: {
    profile: '精通阶段，接近母语者水平，可精准处理细微语义差异。',
    items: [
      {
        dimension: '阅读理解',
        description: '几乎无障碍理解各类高难文本及深层含义。',
      },
      {
        dimension: '口语互动',
        description: '在复杂场景中自如沟通并精细控制表达效果。',
      },
      {
        dimension: '信息表达',
        description: '可重构多来源信息并形成高质量综合论述。',
      },
      {
        dimension: '任务完成',
        description: '可在高压与高复杂环境下稳定完成精细任务。',
      },
    ],
  },
};

const cefrPyramidRows: Array<{
  level: LessonDifficulty;
  widthClassName: string;
}> = [
  { level: 'C2', widthClassName: 'w-24' },
  { level: 'C1', widthClassName: 'w-[112px]' },
  { level: 'B2', widthClassName: 'w-[136px]' },
  { level: 'B1', widthClassName: 'w-[160px]' },
  { level: 'A2', widthClassName: 'w-[184px]' },
  { level: 'A1', widthClassName: 'w-[208px]' },
];

export const CEFRGuideDialog: React.FC<CEFRGuideDialogProps> = ({
  open,
  difficulty,
  onClose,
}) => {
  if (!open || difficulty === null) return null;
  const capabilityItems = capabilityMatrixMap[difficulty].items;
  const primaryItems = capabilityItems.slice(0, 2);
  const secondaryItems = capabilityItems.slice(2);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-5">
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-h-none sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-3 sm:mb-5">
          <h3 className="text-base font-bold text-slate-900 sm:text-xl">
            CEFR 分级说明
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
            当前课程等级：
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${difficultyClassMap[difficulty]}`}
            >
              {difficulty} · {difficultyLabelMap[difficulty]}
            </span>
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:gap-5">
          <div className="hidden rounded-xl border border-slate-100 bg-slate-50 p-3 sm:block">
            <p className="mb-3 text-xs font-bold tracking-widest text-slate-500 uppercase">
              CEFR 金字塔
            </p>
            <div className="flex flex-col items-center gap-1.5">
              {cefrPyramidRows.map(({ level, widthClassName }) => (
                <div
                  key={level}
                  className={`flex h-8 items-center justify-center rounded-md text-xs font-bold ${widthClassName} ${difficultyClassMap[level]} ${
                    level === difficulty
                      ? 'ring-2 ring-emerald-300 ring-offset-1'
                      : ''
                  }`}
                >
                  {level} · {difficultyLabelMap[level]}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:hidden">
            <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              当前分级位置
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {difficulty} · {difficultyLabelMap[difficulty]}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-emerald-700">
                查看六级阶梯
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cefrPyramidRows.map(({ level }) => (
                  <span
                    key={level}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${difficultyClassMap[level]}`}
                  >
                    {level}
                  </span>
                ))}
              </div>
            </details>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-100 p-4 text-sm leading-relaxed text-slate-600">
            <p>
              <strong className="font-bold text-slate-800">CEFR</strong>{' '}
              是国际通用的语言能力框架，将能力划分为 A1 到 C2 六个等级。
            </p>
            <p>{capabilityMatrixMap[difficulty].profile}</p>
            <div className="grid gap-2">
              {primaryItems.map(({ dimension, description }) => (
                <article
                  key={dimension}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    {dimension}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {description}
                  </p>
                </article>
              ))}
              <details className="sm:hidden">
                <summary className="cursor-pointer text-xs font-semibold text-emerald-700">
                  查看完整能力矩阵
                </summary>
                <div className="mt-2 grid gap-2">
                  {secondaryItems.map(({ dimension, description }) => (
                    <article
                      key={dimension}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                        {dimension}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">
                        {description}
                      </p>
                    </article>
                  ))}
                </div>
              </details>
              <div className="hidden sm:grid sm:gap-2">
                {secondaryItems.map(({ dimension, description }) => (
                  <article
                    key={dimension}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                      {dimension}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end sm:mt-5">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            我知道了
          </Button>
        </div>
      </div>
    </div>
  );
};
