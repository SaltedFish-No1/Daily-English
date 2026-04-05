'use client';

import { useEffect } from 'react';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';
import { useWritingStore } from '@/store/useWritingStore';

/** Timer icon + MM:SS display only */
export function WritingTimerDisplay() {
  const { timerSeconds, timerRunning, tickTimer } = useWritingStore();

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(tickTimer, 1000);
    return () => clearInterval(id);
  }, [timerRunning, tickTimer]);

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-1.5">
      <Timer size={14} className="text-slate-400" />
      <span className="font-mono text-sm font-bold text-slate-700 tabular-nums">
        {display}
      </span>
    </div>
  );
}

/** Play/Pause + Reset buttons */
export function WritingTimerControls() {
  const { timerRunning, startTimer, stopTimer, resetTimer } =
    useWritingStore();

  return (
    <div className="flex gap-1">
      <button
        onClick={timerRunning ? stopTimer : startTimer}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        title={timerRunning ? '暂停' : '开始'}
      >
        {timerRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        onClick={resetTimer}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        title="重置"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

/** Combined timer (backward-compatible) */
export function WritingTimer() {
  return (
    <div className="flex items-center gap-2">
      <WritingTimerDisplay />
      <WritingTimerControls />
    </div>
  );
}
