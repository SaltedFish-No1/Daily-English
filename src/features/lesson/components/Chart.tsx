'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LessonChart } from '@/types/lesson';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  chart: LessonChart;
}

export const Chart: React.FC<ChartProps> = ({ chart }) => {
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: 'bold' as const,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' as const },
          bodyFont: { size: 13 },
          usePointStyle: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0,0,0,0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

  const data = useMemo(
    () => ({
      labels: chart.labels,
      datasets: chart.datasets.map((ds) => ({
        ...ds,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
      })),
    }),
    [chart]
  );

  return (
    <div className="min-h-[80vh] border-gray-100 bg-white p-5 sm:min-h-0 sm:rounded-xl sm:border sm:p-8 sm:shadow-sm">
      <div className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-slate-900 sm:text-2xl">
          {chart.title}
        </h2>
        <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
          {chart.description}
        </p>
      </div>

      <div className="mb-10 h-[300px] w-full sm:h-[400px]">
        <Line options={options} data={data} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {chart.insights.map((insight, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <h3 className="font-bold text-slate-900">{insight.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
