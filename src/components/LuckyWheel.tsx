import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { STUDENTS_ROSTER, TEAMS } from '../data/quizData';
import { playTickSound } from '../utils/sound';

interface LuckyWheelProps {
  isSpinning: boolean;
  targetTurn: number | null;
  selectedTurn: number | null;
  availableTurns: number[]; // remaining turns to display on wheel
  onSpin: (target?: number) => void;
  onResetTurns?: () => void;
  canSpin?: boolean;
}

const TURN_COLORS: Record<number, string> = {
  1: '#10b981', // emerald
  2: '#f59e0b', // amber
  3: '#ef4444', // red
  4: '#3b82f6', // blue
  5: '#8b5cf6', // purple
  6: '#ec4899', // pink
  7: '#14b8a6', // teal
  8: '#f97316', // orange
};

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  isSpinning,
  targetTurn,
  selectedTurn,
  availableTurns = [1, 2, 3, 4, 5, 6, 7, 8],
  onSpin,
  onResetTurns,
  canSpin = true,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const lastTickSliceRef = useRef<number>(-1);
  const animFrameRef = useRef<number | null>(null);

  // If availableTurns is empty, we have completed all 8 turns!
  const numSlices = availableTurns.length;
  const sliceAngle = numSlices > 0 ? 360 / numSlices : 360;

  useEffect(() => {
    if (isSpinning && targetTurn && numSlices > 0) {
      // Find index of targetTurn within availableTurns
      const targetIndex = availableTurns.indexOf(targetTurn);
      const idx = targetIndex >= 0 ? targetIndex : 0;

      // Slice center in wheel coords
      const sliceCenter = idx * sliceAngle + sliceAngle / 2;
      // Needle is at TOP (270 degrees in SVG coordinate where 0 deg is 3 o'clock)
      const baseAngle = 270 - sliceCenter;
      const extraSpins = 360 * 6; // 6 dramatic rotations
      const targetRotation = Math.floor(rotation / 360) * 360 + extraSpins + (baseAngle >= 0 ? baseAngle : baseAngle + 360);

      const startTime = performance.now();
      const duration = 4000;
      const startRot = rotation;

      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const currentRot = startRot + (targetRotation - startRot) * easeOut(progress);

        setRotation(currentRot);

        // Sound tick check
        const currentSlice = Math.floor(((270 - (currentRot % 360) + 360) % 360) / sliceAngle);
        if (currentSlice !== lastTickSliceRef.current) {
          playTickSound();
          lastTickSliceRef.current = currentSlice;
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }
  }, [isSpinning, targetTurn, availableTurns, numSlices, sliceAngle]);

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none">
      {/* Remaining turns pill counter */}
      <div className="mb-3 flex items-center justify-between w-full max-w-sm text-xs px-2">
        <span className="text-slate-400 font-medium">
          Còn lại trên vòng quay: <span className="text-amber-400 font-bold">{numSlices}/8 lượt</span>
        </span>
        {onResetTurns && numSlices < 8 && (
          <button
            onClick={onResetTurns}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline"
            title="Khôi phục lại đủ 8 lượt trên vòng tròn"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Nạp lại vòng quay</span>
          </button>
        )}
      </div>

      {numSlices > 0 ? (
        <div className="relative w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 flex items-center justify-center">
          {/* Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-sky-500/10 to-rose-500/20 blur-xl animate-pulse" />

          {/* Outer Wheel Rim */}
          <div className="absolute inset-1 rounded-full border-4 border-slate-700 bg-slate-900 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* SVG Wheel */}
            <svg
              className="w-full h-full"
              viewBox="0 0 300 300"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '50% 50%',
              }}
            >
              {availableTurns.map((turnNum, i) => {
                const startAngle = i * sliceAngle;
                const endAngle = (i + 1) * sliceAngle;

                // Convert polar to cartesian
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const r = 145;
                const cx = 150;
                const cy = 150;

                const x1 = cx + r * Math.cos(startRad);
                const y1 = cy + r * Math.sin(startRad);
                const x2 = cx + r * Math.cos(endRad);
                const y2 = cy + r * Math.sin(endRad);

                const largeArc = sliceAngle > 180 ? 1 : 0;
                const pathData = numSlices === 1
                  ? `M 150 150 m -145 0 a 145 145 0 1 0 290 0 a 145 145 0 1 0 -290 0`
                  : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                const midAngle = startAngle + sliceAngle / 2;
                const midRad = (midAngle * Math.PI) / 180;
                const textR = numSlices > 4 ? 95 : 85;
                const tx = cx + textR * Math.cos(midRad);
                const ty = cy + textR * Math.sin(midRad);

                const isTarget = !isSpinning && selectedTurn === turnNum;

                return (
                  <g key={turnNum}>
                    <path
                      d={pathData}
                      fill={TURN_COLORS[turnNum] || '#3b82f6'}
                      opacity={isTarget ? 1 : 0.88}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill="#ffffff"
                      fontSize={numSlices > 6 ? '18' : '22'}
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                      style={{ textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}
                    >
                      LƯỢT {turnNum}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Spin Button */}
          <button
            onClick={() => canSpin && !isSpinning && onSpin()}
            disabled={!canSpin || isSpinning}
            className={`absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full z-10 flex flex-col items-center justify-center font-bold text-xs sm:text-sm tracking-wide shadow-2xl transition-transform active:scale-95 border-4 ${
              isSpinning
                ? 'bg-amber-500 border-amber-300 text-slate-950 animate-pulse'
                : 'bg-slate-900 border-amber-400 text-amber-400 hover:bg-slate-800 hover:scale-105'
            }`}
          >
            <span className="text-sm sm:text-base font-extrabold">
              {isSpinning ? 'ĐANG QUAY' : 'QUAY SỐ'}
            </span>
            <span className="text-[10px] opacity-80 font-normal">
              {isSpinning ? '...' : `${numSlices} lượt`}
            </span>
          </button>

          {/* Pointer / Needle at TOP (12 o'clock) */}
          <div className="absolute -top-3 z-20 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]" />
            <div className="w-3 h-3 -mt-7 rounded-full bg-slate-950 border-2 border-amber-400" />
          </div>
        </div>
      ) : (
        /* Empty State: All 8 turns have been completed */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm text-center flex flex-col items-center shadow-xl">
          <Trophy className="w-14 h-14 text-amber-400 mb-3 animate-bounce" />
          <h3 className="text-lg font-black text-slate-100">
            ĐÃ QUAY HẾT TẤT CẢ 8 LƯỢT THI!
          </h3>
          <p className="text-xs text-slate-400 my-3">
            Tất cả 8 câu hỏi đã được 4 đội hoàn thành. Hãy xem bảng xếp hạng vinh danh đội vô địch!
          </p>
          {onResetTurns && (
            <button
              onClick={onResetTurns}
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nạp lại 8 lượt mới</span>
            </button>
          )}
        </div>
      )}

      {/* 4 Representative Students for the Selected Turn */}
      {selectedTurn && (
        <div className="mt-4 w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-xl">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs">
            <span className="font-extrabold text-amber-400 uppercase">
              Lượt thi #{selectedTurn}
            </span>
            <span className="text-slate-400 text-[11px]">
              4 bạn đại diện cùng lên bảng trả lời (45s)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([1, 2, 3, 4] as const).map((tId) => {
              const team = TEAMS[tId];
              const student = STUDENTS_ROSTER[tId].find((s) => s.turnNumber === selectedTurn);
              return (
                <div
                  key={tId}
                  className="p-2.5 rounded-xl border bg-slate-950/80 flex flex-col justify-between"
                  style={{ borderColor: team.hex }}
                >
                  <div className="text-[11px] font-bold truncate" style={{ color: team.hex }}>
                    {team.shortName}
                  </div>
                  <div className="text-xs font-bold text-slate-100 truncate mt-1">
                    {student?.name || 'Học sinh'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
