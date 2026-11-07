import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Maximize2,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { QUIZ_ROUNDS, STUDENTS_ROSTER, TEAMS } from '../data/quizData';
import { MathDisplay } from './MathDisplay';
import { CountdownTimer } from './CountdownTimer';
import { GameState, TeamId } from '../types/game';

interface StudentMobileViewProps {
  teamId: TeamId;
  gameState: GameState;
  onSubmitAnswer: (
    teamId: TeamId,
    roundNumber: number,
    selectedAnswer: 'A' | 'B' | 'C' | 'D',
    studentName: string
  ) => void;
  onProjectTeam: (teamId: TeamId) => void;
}

export const StudentMobileView: React.FC<StudentMobileViewProps> = ({
  teamId,
  gameState,
  onSubmitAnswer,
  onProjectTeam,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [projectedSuccess, setProjectedSuccess] = useState(false);

  const team = TEAMS[teamId];
  const currentRoundNum = gameState.currentRound || 1;
  const roundData = QUIZ_ROUNDS.find((r) => r.roundNumber === currentRoundNum);
  const questionVersion = roundData?.versions[teamId];

  // Current active student for this team in this round
  const currentStudent = STUDENTS_ROSTER[teamId].find(
    (s) => s.turnNumber === (gameState.selectedTurn || currentRoundNum)
  );

  const submissionKey = `${currentRoundNum}_${teamId}`;
  const submission = gameState.answers[submissionKey];
  const isSubmitted = !!submission;
  const isTimeUp = gameState.roundStatus === 'time_up';

  const handleSelectChoice = (key: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted || isTimeUp) return;
    setSelectedChoice(key);
  };

  const handleSubmit = () => {
    if (!selectedChoice || isSubmitted || isTimeUp || !questionVersion) return;
    onSubmitAnswer(
      teamId,
      currentRoundNum,
      selectedChoice,
      currentStudent?.name || `Thành viên ${team.shortName}`
    );
  };

  const handleProjectClick = () => {
    onProjectTeam(teamId);
    setProjectedSuccess(true);
    setTimeout(() => setProjectedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto p-4 select-none pb-8">
      {/* Header Bar */}
      <header
        className="rounded-2xl p-4 border shadow-xl flex items-center justify-between"
        style={{ borderColor: team.hex, backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-slate-950 text-lg shadow-md"
            style={{ backgroundColor: team.hex }}
          >
            {teamId}
          </div>
          <div>
            <div className="text-xs uppercase font-black tracking-wider flex items-center gap-1.5" style={{ color: team.hex }}>
              <span>{team.name}</span>
            </div>
            <div className="text-sm font-bold text-slate-200">
              {currentStudent ? currentStudent.name : 'Đại diện trả lời'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-400 font-medium">Tổng điểm đội</div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {gameState.teamScores[teamId] || 0}
            <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
          </div>
        </div>
      </header>

      {/* 45s Countdown & Projector Controls */}
      <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-md">
        <CountdownTimer
          timerEndsAt={gameState.timerEndsAt}
          timerDuration={gameState.timerDuration}
          isRunning={gameState.isTimerRunning}
          roundStatus={gameState.roundStatus}
          size="sm"
          showLabel={false}
        />

        <div className="text-xs font-bold text-slate-300">
          Lượt thi #{currentRoundNum}
        </div>

        {/* Feature: Student clicks to project this team's question to teacher/projector screen */}
        <button
          onClick={handleProjectClick}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow ${
            projectedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {projectedSuccess ? 'Đang chiếu!' : 'Chiếu lên lớp'}
        </button>
      </div>

      {/* Time-up Warning Alert */}
      {isTimeUp && !isSubmitted && (
        <div className="my-2 p-3 bg-rose-950/80 border border-rose-500 text-rose-300 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>HẾT THỜI GIAN 45S! Câu hỏi đã kết thúc. Hãy chờ giáo viên quay số tiếp.</span>
        </div>
      )}

      {/* Main Question Body */}
      <main className="my-3 flex-1 flex flex-col justify-center">
        {questionVersion ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800/80 pb-2">
              <span className="font-extrabold text-amber-400 text-sm">
                Câu {questionVersion.versionId} ({team.shortName})
              </span>
              <span className="text-[11px] text-slate-400">
                Đúng: +10đ · Sai: 0đ
              </span>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-semibold text-slate-100 my-3 leading-relaxed">
              <MathDisplay text={questionVersion.content} />
            </div>

            {/* Choices Grid */}
            <div className="grid grid-cols-1 gap-2.5 mt-4">
              {questionVersion.choices.map((choice) => {
                const isSelected = selectedChoice === choice.key;
                const isSubmittedChoice = submission?.selectedAnswer === choice.key;

                let stateClasses = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700';

                if (isSubmitted || isTimeUp) {
                  if (gameState.isAnswerRevealed || submission) {
                    if (choice.key === questionVersion.correctAnswer) {
                      stateClasses = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold';
                    } else if (isSubmittedChoice && !submission?.isCorrect) {
                      stateClasses = 'bg-rose-950/80 border-rose-500 text-rose-300';
                    } else {
                      stateClasses = 'bg-slate-950/50 border-slate-900 text-slate-500 opacity-60';
                    }
                  } else if (isTimeUp) {
                    stateClasses = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-50 cursor-not-allowed';
                  }
                } else if (isSelected) {
                  stateClasses = 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-2 ring-amber-400/30';
                }

                return (
                  <button
                    key={choice.key}
                    onClick={() => handleSelectChoice(choice.key)}
                    disabled={isSubmitted || isTimeUp}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${stateClasses}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                          isSelected && !isSubmitted && !isTimeUp
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {choice.key}
                      </span>
                      <span className="text-base font-medium">
                        <MathDisplay text={choice.text} />
                      </span>
                    </div>

                    {isSubmitted && choice.key === questionVersion.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isSubmitted && isSubmittedChoice && !submission.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-submission Result Banner */}
            {isSubmitted && (
              <div
                className={`mt-4 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 ${
                  submission.isCorrect
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/70 border-rose-500 text-rose-300'
                }`}
              >
                {submission.isCorrect ? (
                  <>
                    <Sparkles className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-base font-extrabold text-emerald-200">
                        CHÍNH XÁC! +10 ĐIỂM
                      </div>
                      <div className="text-xs text-emerald-300/90">
                        Bạn đã mang về 10 điểm cho {team.name}!
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-8 h-8 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-base font-extrabold text-rose-200">
                        CHƯA CHÍNH XÁC (0 điểm)
                      </div>
                      <div className="text-xs text-rose-300/90">
                        Đáp án đúng là <span className="font-bold underline">{questionVersion.correctAnswer}</span>. Cố gắng ở lượt sau nhé!
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Giáo viên đang quay số chuẩn bị câu hỏi...
          </div>
        )}
      </main>

      {/* Action Footer */}
      <footer className="pt-2">
        {!isSubmitted && !isTimeUp ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedChoice}
            className={`w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
              selectedChoice
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-98 shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            {selectedChoice ? `Xác nhận đáp án ${selectedChoice}` : 'Chọn 1 đáp án để nộp'}
          </button>
        ) : isTimeUp && !isSubmitted ? (
          <div className="text-center text-xs text-rose-400 flex items-center justify-center gap-2 py-3 bg-rose-950/40 rounded-xl border border-rose-800 font-bold">
            <Clock className="w-4 h-4" />
            <span>Hết 45 giây - Đã khóa lượt trả lời này</span>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2 py-3 bg-slate-900 rounded-xl border border-slate-800">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Đã ghi nhận kết quả vào bảng xếp hạng trực tiếp</span>
          </div>
        )}
      </footer>
    </div>
  );
};
