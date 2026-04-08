'use client';

/**
 * @author SaltedFish-No1
 * @description 写作计时器组件，提供计时显示、暂停/继续和重置功能。
 */
import { useEffect } from 'react';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';
import { useWritingStore } from '@/store/useWritingStore';
import { Button } from '@/components/ui/button';

/** Timer icon + MM:SS display only */
export function WritingTimerDisplay() {
  const { timerSeconds, isTimerRunning, tickTimer } = useWritingStore();

  useEffect(() => {
    if (!isTimerRunning) return;
    const id = setInterval(tickTimer, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, tickTimer]);

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
  const { isTimerRunning, startTimer, stopTimer, resetTimer } =
    useWritingStore();

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        onClick={isTimerRunning ? stopTimer : startTimer}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        title={isTimerRunning ? '暂停' : '开始'}
      >
        {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
      </Button>
      <Button
        variant="ghost"
        onClick={resetTimer}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        title="重置"
      >
        <RotateCcw size={14} />
      </Button>
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
