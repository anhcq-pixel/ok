import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { playCountdownTick, playTimeUpSound } from '../utils/sound';

interface CountdownTimerProps {
  timerEndsAt: number | null;
  timerDuration: number;
  isRunning: boolean;
  roundStatus: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  timerEndsAt,
  timerDuration = 45,
  isRunning,
  roundStatus,
  size = 'md',
  showLabel = true,
}) => {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!timerEndsAt) return isRunning ? timerDuration : 0;
    return Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
  });

  const lastBeepRef = useRef<number>(-1);
  const wasTimeUpRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isRunning || !timerEndsAt) {
      if (roundStatus === 'time_up') {
        setRemaining(0);
      } else {
        setRemaining(timerDuration);
      }
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const rem = Math.max(0, Math.ceil((timerEndsAt - now) / 1000));
      setRemaining(rem);

      // Audio beeps for last 5 seconds
      if (rem <= 5 && rem > 0 && rem !== lastBeepRef.current) {
        lastBeepRef.current = rem;
        playCountdownTick();
      }

      // Time-up buzzer
      if (rem === 0 && !wasTimeUpRef.current) {
        wasTimeUpRef.current = true;
        playTimeUpSound();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timerEndsAt, isRunning, roundStatus, timerDuration]);

  // Reset wasTimeUpRef when timer starts anew
  useEffect(() => {
    if (isRunning && timerEndsAt && timerEndsAt > Date.now()) {
      wasTimeUpRef.current = false;
      lastBeepRef.current = -1;
    }
  }, [isRunning, timerEndsAt]);

  const progress = timerDuration > 0 ? (remaining / timerDuration) * 100 : 0;
  const isDanger = remaining <= 10;
  const isTimeUp = remaining === 0 || roundStatus === 'time_up';

  // Size styling
  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition-all ${
          isTimeUp
            ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
            : isDanger
            ? 'bg-rose-950/40 border-rose-500 text-rose-400 animate-bounce'
            : 'bg-slate-900 border-slate-700 text-amber-400'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>{isTimeUp ? '0s (Hết giờ)' : `${remaining}s`}</span>
      </div>
    );
  }

  // Medium and Large circle or prominent badge
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* SVG Circle Progress */}
        <svg
          className={size === 'lg' ? 'w-20 h-20' : 'w-14 h-14'}
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke={isTimeUp ? '#ef4444' : isDanger ? '#f43f5e' : '#f59e0b'}
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-300 origin-center -rotate-90"
          />
        </svg>

        {/* Seconds Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono font-black tracking-tight leading-none ${
              size === 'lg' ? 'text-2xl' : 'text-base'
            } ${isTimeUp ? 'text-rose-400' : isDanger ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}
          >
            {isTimeUp ? '0' : remaining}
          </span>
          <span className="text-[9px] text-slate-400 font-sans uppercase font-bold">
            {isTimeUp ? 'Hết giờ' : 'giây'}
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Thời gian suy nghĩ
          </span>
          <span
            className={`text-xs font-semibold ${
              isTimeUp
                ? 'text-rose-400 font-bold'
                : isDanger
                ? 'text-rose-400'
                : 'text-slate-200'
            }`}
          >
            {isTimeUp
              ? 'Đã hết 45 giây! Đang chờ lượt mới'
              : `Còn ${remaining} giây để trả lời`}
          </span>
        </div>
      )}
    </div>
  );
};
