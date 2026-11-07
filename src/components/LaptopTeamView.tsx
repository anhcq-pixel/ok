import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Laptop,
  Maximize,
  Minimize,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { QUIZ_ROUNDS, STUDENTS_ROSTER, TEAMS } from '../data/quizData';
import { MathDisplay } from './MathDisplay';
import { CountdownTimer } from './CountdownTimer';
import { GameState, TeamId } from '../types/game';

interface LaptopTeamViewProps {
  teamId: TeamId;
  gameState: GameState;
}

export const LaptopTeamView: React.FC<LaptopTeamViewProps> = ({ teamId, gameState }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const team = TEAMS[teamId];
  const currentRoundNum = gameState.currentRound || 1;
  const roundData = QUIZ_ROUNDS.find((r) => r.roundNumber === currentRoundNum);
  const questionVersion = roundData?.versions[teamId];

  // Active student for this turn
  const activeStudent = STUDENTS_ROSTER[teamId].find(
    (s) => s.turnNumber === (gameState.selectedTurn || currentRoundNum)
  );

  const submissionKey = `${currentRoundNum}_${teamId}`;
  const submission = gameState.answers[submissionKey];
  const isTimeUp = gameState.roundStatus === 'time_up';

  // Calculate team rank
  const sortedTeams = ([1, 2, 3, 4] as TeamId[])
    .map((id) => ({ id, score: gameState.teamScores[id] || 0 }))
    .sort((a, b) => b.score - a.score);
  const currentRank = sortedTeams.findIndex((t) => t.id === teamId) + 1;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg"
            style={{ backgroundColor: team.hex }}
          >
            {teamId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: team.hex }}>
                <span>Màn hình nhóm: {team.name}</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Chế độ chỉ xem đề
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-slate-400" />
              Đề thi toán theo thời gian thực (Chuẩn toán VN)
            </h1>
          </div>
        </div>

        {/* 45s Countdown Timer & Live Score & Rank */}
        <div className="flex items-center gap-3">
          {/* Synchronized 45s Timer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <CountdownTimer
              timerEndsAt={gameState.timerEndsAt}
              timerDuration={gameState.timerDuration}
              isRunning={gameState.isTimerRunning}
              roundStatus={gameState.roundStatus}
              size="md"
              showLabel={true}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-right">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Điểm {team.shortName}</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {gameState.teamScores[teamId] || 0}
              <span className="text-xs text-slate-400 ml-1 font-sans">đ</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Xếp hạng</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center gap-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>#{currentRank}</span>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Teammate status ticker */}
      <div className="my-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Đại diện đội đang ở trên bảng:</div>
            <div className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{activeStudent ? activeStudent.name : 'Chưa chọn'}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                Lượt #{currentRoundNum}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Answer Status */}
        <div className="flex items-center gap-3">
          {submission ? (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-bold text-sm ${
                submission.isCorrect
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500 text-rose-300'
              }`}
            >
              {submission.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đã chọn {submission.selectedAnswer} - CHÍNH XÁC (+10 điểm)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Đã chọn {submission.selectedAnswer} - Chưa đúng (0 điểm)</span>
                </>
              )}
            </div>
          ) : isTimeUp ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-950/70 border border-rose-600 text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Hết thời gian 45s - Câu hỏi kết thúc</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold animate-pulse">
              <Clock className="w-4 h-4" />
              <span>Đại diện đang suy nghĩ & chọn đáp án trên điện thoại...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Question Display for the whole team to read */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
        {questionVersion ? (
          <div
            className="bg-slate-900 border-2 rounded-2xl p-6 sm:p-8 shadow-2xl relative"
            style={{ borderColor: team.hex }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-400 font-extrabold text-sm tracking-wide">
                  CÂU HỎI {questionVersion.versionId}
                </span>
                <span className="text-slate-400 text-xs sm:text-sm font-medium">
                  {roundData?.topic}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-semibold" style={{ color: team.hex }}>
                Đề bài riêng biệt của {team.name}
              </span>
            </div>

            {/* Question Content */}
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-100 my-6 leading-relaxed">
              <MathDisplay text={questionVersion.content} />
            </div>

            {/* Choices Grid (2 columns on large screen) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {questionVersion.choices.map((choice) => {
                const isSelectedByStudent = submission?.selectedAnswer === choice.key;
                const isCorrect = choice.key === questionVersion.correctAnswer;

                let cardStyle = 'bg-slate-950 border-slate-800 text-slate-200';

                if (submission || gameState.isAnswerRevealed) {
                  if (isCorrect) {
                    cardStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/20';
                  } else if (isSelectedByStudent && !submission?.isCorrect) {
                    cardStyle = 'bg-rose-950/80 border-rose-500 text-rose-300';
                  } else {
                    cardStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                  }
                }

                return (
                  <div
                    key={choice.key}
                    className={`p-4 sm:p-5 rounded-xl border flex items-center justify-between transition-all ${cardStyle}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-mono font-bold text-lg">
                        {choice.key}
                      </span>
                      <span className="text-lg sm:text-xl font-medium">
                        <MathDisplay text={choice.text} />
                      </span>
                    </div>

                    {submission && isCorrect && (
                      <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                        Đáp án đúng
                      </span>
                    )}
                    {submission && isSelectedByStudent && !submission.isCorrect && (
                      <span className="text-xs font-bold text-rose-400 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                        Đã chọn
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation box if revealed */}
            {(submission || gameState.isAnswerRevealed) && questionVersion.explanation && (
              <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300">
                <span className="font-bold text-amber-400 mr-1.5">Giải thích chi tiết:</span>
                <MathDisplay text={questionVersion.explanation} />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            Đang chờ giáo viên quay số chọn lượt...
          </div>
        )}
      </main>

      {/* Footer Instructions */}
      <footer className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div>
          Học sinh ở dưới theo dõi đề bài cùng nhau; đại diện ở trên thao tác trả lời trên điện thoại.
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Thời gian suy nghĩ: 45 giây</span>
          <span aria-hidden="true">·</span>
          <span>Đúng: +10 điểm, Sai: 0 điểm</span>
        </div>
      </footer>
    </div>
  );
};
