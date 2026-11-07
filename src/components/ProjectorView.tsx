import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Maximize,
  Minimize,
  Sparkles,
  Trophy,
  Tv,
  XCircle,
} from 'lucide-react';
import { QUIZ_ROUNDS, STUDENTS_ROSTER, TEAMS } from '../data/quizData';
import { MathDisplay } from './MathDisplay';
import { LuckyWheel } from './LuckyWheel';
import { CountdownTimer } from './CountdownTimer';
import { GameState, ProjectorMode, TeamId } from '../types/game';

interface ProjectorViewProps {
  gameState: GameState;
  onSpinWheel: (target?: number) => void;
  onSetProjectorMode: (mode: ProjectorMode, focusTeam?: TeamId) => void;
  onResetTurns?: () => void;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  gameState,
  onSpinWheel,
  onSetProjectorMode,
  onResetTurns,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentRoundNum = gameState.currentRound || 1;
  const roundData = QUIZ_ROUNDS.find((r) => r.roundNumber === currentRoundNum);
  const activeMode = gameState.projectorMode || 'all_teams';
  const isTimeUp = gameState.roundStatus === 'time_up';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Sort teams by current score descending for live leaderboard
  const sortedTeams = ([1, 2, 3, 4] as TeamId[])
    .map((id) => ({
      id,
      info: TEAMS[id],
      score: gameState.teamScores[id] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-3 sm:p-5 lg:p-6 select-none overflow-x-hidden">
      {/* Top Projector Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                Màn Hình Máy Chiếu Lớp Học
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                Lượt {currentRoundNum}/8
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                · {roundData?.topic}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-100">
              Đấu Trường Toán Học: HULK · THOR · SPIDERMAN · CAPTAIN
            </h1>
          </div>
        </div>

        {/* 45s Countdown Timer & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Synchronized 45s Countdown Timer */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
            <CountdownTimer
              timerEndsAt={gameState.timerEndsAt}
              timerDuration={gameState.timerDuration}
              isRunning={gameState.isTimerRunning}
              roundStatus={gameState.roundStatus}
              size="md"
              showLabel={true}
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onSetProjectorMode('all_teams')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'all_teams'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>4 Đề 4 Đội</span>
            </button>

            <button
              onClick={() => onSetProjectorMode('wheel')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeMode === 'wheel'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎡 Vòng Quay
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Time-up Global Banner on Projector */}
      {isTimeUp && (
        <div className="mt-2.5 bg-rose-950/90 border border-rose-500 py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-2.5 animate-pulse text-sm font-extrabold text-rose-200 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
          <span>⏰ HẾT THỜI GIAN 45 GIÂY! CÂU HỎI LƯỢT #{currentRoundNum} ĐÃ KẾT THÚC. GIÁO VIÊN HÃY QUAY SỐ CHỌN BẠN TIẾP THEO!</span>
        </div>
      )}

      {/* Main Split Layout: Left (Stage 75%) + Right (Live Scoreboard 25%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
        {/* Left Side: Question Stage or Wheel (9 cols) */}
        <div className="lg:col-span-9 flex flex-col justify-center">
          {/* VIEW 1: 4 TEAMS GRID - Each Team displays its exact assigned question */}
          {activeMode === 'all_teams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 h-full">
              {([1, 2, 3, 4] as TeamId[]).map((tId) => {
                const team = TEAMS[tId];
                const version = roundData?.versions[tId];
                const student = STUDENTS_ROSTER[tId].find(
                  (s) => s.turnNumber === (gameState.selectedTurn || currentRoundNum)
                );
                const answerKey = `${currentRoundNum}_${tId}`;
                const sub = gameState.answers[answerKey];

                return (
                  <div
                    key={tId}
                    className="bg-slate-900 border-2 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all hover:border-slate-600"
                    style={{ borderColor: team.hex }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow-md"
                          style={{ backgroundColor: team.hex }}
                        >
                          {tId}
                        </span>
                        <div>
                          <div className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-1.5" style={{ color: team.hex }}>
                            <span>{team.name}</span>
                          </div>
                          <div className="text-xs text-slate-300">
                            Thí sinh: <span className="text-white font-bold">{student?.name || 'Học sinh'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        {sub ? (
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              sub.isCorrect
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                : 'bg-rose-950 text-rose-300 border border-rose-500'
                            }`}
                          >
                            {sub.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Đúng (+10đ)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Đã nộp (0đ)</span>
                              </>
                            )}
                          </div>
                        ) : isTimeUp ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950 text-rose-400 border border-rose-800 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Hết giờ</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Đang làm bài...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Content */}
                    {version ? (
                      <div className="my-1 flex-1">
                        <div className="text-sm sm:text-base font-semibold text-slate-100 mb-3 leading-relaxed">
                          <span className="text-amber-400 font-extrabold mr-1">
                            Câu {version.versionId}:
                          </span>
                          <MathDisplay text={version.content} />
                        </div>

                        {/* 4 Choices */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {version.choices.map((c) => {
                            const isCorrect = c.key === version.correctAnswer;
                            const isChosen = sub?.selectedAnswer === c.key;

                            let choiceStyle = 'bg-slate-950 border-slate-800 text-slate-300';
                            if (sub || gameState.isAnswerRevealed) {
                              if (isCorrect) {
                                choiceStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                              } else if (isChosen && !sub?.isCorrect) {
                                choiceStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                              } else {
                                choiceStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-50';
                              }
                            }

                            return (
                              <div
                                key={c.key}
                                className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition-all ${choiceStyle}`}
                              >
                                <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                                  {c.key}
                                </span>
                                <span className="truncate font-medium">
                                  <MathDisplay text={c.text} />
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Footer */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono text-[11px]">
                        Đề riêng của {team.shortName}
                      </span>
                      <button
                        onClick={() => onSetProjectorMode('team_focus', tId)}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <span>Phóng to đề {team.shortName}</span>
                        <Maximize className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: SINGLE TEAM SPOTLIGHT (When student on phone or teacher clicks project) */}
          {activeMode === 'team_focus' && (
            <div className="w-full">
              {(() => {
                const focusId = gameState.projectorFocusTeam || 1;
                const team = TEAMS[focusId];
                const version = roundData?.versions[focusId];
                const student = STUDENTS_ROSTER[focusId].find(
                  (s) => s.turnNumber === (gameState.selectedTurn || currentRoundNum)
                );
                const answerKey = `${currentRoundNum}_${focusId}`;
                const sub = gameState.answers[answerKey];

                return (
                  <div
                    className="bg-slate-900 border-3 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
                    style={{ borderColor: team.hex }}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg"
                          style={{ backgroundColor: team.hex }}
                        >
                          {focusId}
                        </div>
                        <div>
                          <div className="text-lg font-extrabold uppercase tracking-wide flex items-center gap-2" style={{ color: team.hex }}>
                            <span>{team.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                              Đang chiếu tiêu điểm
                            </span>
                          </div>
                          <div className="text-sm text-slate-200">
                            Thí sinh đại diện: <span className="font-bold text-white text-base">{student?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub && (
                          <div
                            className={`px-3.5 py-1.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${
                              sub.isCorrect
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                : 'bg-rose-950 text-rose-300 border-rose-500'
                            }`}
                          >
                            {sub.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Chính xác: Đáp án {sub.selectedAnswer} (+10 điểm)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-rose-400" />
                                <span>Đã chọn {sub.selectedAnswer} (0 điểm)</span>
                              </>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => onSetProjectorMode('all_teams')}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
                        >
                          Thu nhỏ về 4 Đội
                        </button>
                      </div>
                    </div>

                    {version ? (
                      <div>
                        {/* Question Text */}
                        <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-100 my-6 leading-relaxed">
                          <span className="text-amber-400 font-black mr-2">
                            Câu {version.versionId}:
                          </span>
                          <MathDisplay text={version.content} />
                        </div>

                        {/* Choices Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                          {version.choices.map((c) => {
                            const isCorrect = c.key === version.correctAnswer;
                            const isChosen = sub?.selectedAnswer === c.key;

                            let choiceStyle = 'bg-slate-950 border-slate-800 text-slate-200';
                            if (sub || gameState.isAnswerRevealed) {
                              if (isCorrect) {
                                choiceStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold ring-2 ring-emerald-500/30';
                              } else if (isChosen && !sub?.isCorrect) {
                                choiceStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                              } else {
                                choiceStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                              }
                            }

                            return (
                              <div
                                key={c.key}
                                className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between text-base sm:text-xl transition-all ${choiceStyle}`}
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-lg">
                                    {c.key}
                                  </span>
                                  <span className="font-medium">
                                    <MathDisplay text={c.text} />
                                  </span>
                                </div>

                                {sub && isCorrect && (
                                  <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                    Đáp án đúng
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {(sub || gameState.isAnswerRevealed) && version.explanation && (
                          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300">
                            <span className="font-bold text-amber-400 mr-2">Giải thích:</span>
                            <MathDisplay text={version.explanation} />
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW 3: LUCKY WHEEL (Eliminates already completed turns) */}
          {activeMode === 'wheel' && (
            <div className="flex flex-col items-center justify-center py-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <LuckyWheel
                isSpinning={gameState.isSpinning}
                targetTurn={gameState.wheelTarget}
                selectedTurn={gameState.selectedTurn}
                availableTurns={gameState.availableTurns}
                onSpin={onSpinWheel}
                onResetTurns={onResetTurns}
                canSpin={!gameState.isSpinning}
              />

              {!gameState.isSpinning && gameState.selectedTurn && (
                <button
                  onClick={() => onSetProjectorMode('all_teams')}
                  className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center gap-2 animate-bounce"
                >
                  <span>Bắt đầu Lượt #{gameState.selectedTurn} (Xem 4 đề bài)</span>
                  <LayoutGrid className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: LIVE SCOREBOARD DIRECTLY ON PROJECTOR SCREEN */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-full">
            <div>
              {/* Leaderboard Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Bảng Điểm Trực Tiếp
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold animate-pulse">
                  ● LIVE
                </span>
              </div>

              {/* 4 Teams Ranked Cards */}
              <div className="flex flex-col gap-2.5">
                {sortedTeams.map((team, rankIdx) => {
                  const isLeader = rankIdx === 0 && team.score > 0;
                  const isFocused = gameState.projectorMode === 'team_focus' && gameState.projectorFocusTeam === team.id;

                  return (
                    <div
                      key={team.id}
                      onClick={() => onSetProjectorMode('team_focus', team.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isFocused
                          ? 'ring-2 ring-white scale-102 bg-slate-800 shadow-lg'
                          : 'bg-slate-950/80 hover:bg-slate-800'
                      }`}
                      style={{ borderColor: team.info.hex }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {rankIdx === 0 ? (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                              1
                            </span>
                          ) : rankIdx === 1 ? (
                            <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                              2
                            </span>
                          ) : rankIdx === 2 ? (
                            <span className="w-5 h-5 rounded-full bg-amber-700 text-slate-100 flex items-center justify-center font-bold text-[10px]">
                              3
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                              4
                            </span>
                          )}

                          <span className="font-extrabold text-sm truncate max-w-[110px]" style={{ color: team.info.hex }}>
                            {team.info.shortName}
                          </span>
                        </div>

                        {/* Team Score */}
                        <div className="text-right">
                          <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                            {team.score}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-0.5 font-sans">đ</span>
                        </div>
                      </div>

                      {/* Current Round Status for this team */}
                      {(() => {
                        const answerKey = `${currentRoundNum}_${team.id}`;
                        const sub = gameState.answers[answerKey];
                        const student = STUDENTS_ROSTER[team.id].find(
                          (s) => s.turnNumber === (gameState.selectedTurn || currentRoundNum)
                        );

                        return (
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                            <span className="truncate max-w-[95px] text-slate-300">
                              {student?.name}
                            </span>
                            {sub ? (
                              sub.isCorrect ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> +10đ
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                  <XCircle className="w-3 h-3" /> 0đ
                                </span>
                              )
                            ) : isTimeUp ? (
                              <span className="text-rose-400 text-[10px]">Hết 45s</span>
                            ) : (
                              <span className="text-amber-400/80 animate-pulse text-[10px]">Đang làm...</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Rules / Legend */}
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Thời gian:</span>
                <span className="font-bold text-amber-400">45s / câu</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Câu đúng:</span>
                <span className="font-bold text-emerald-400">+10 điểm</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                Lượt đã quay sẽ tự động biến mất khỏi vòng quay.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
