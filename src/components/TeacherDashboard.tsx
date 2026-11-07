import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FastForward,
  HelpCircle,
  LayoutGrid,
  Pause,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { QUIZ_ROUNDS, STUDENTS_ROSTER, TEAMS } from '../data/quizData';
import { MathDisplay } from './MathDisplay';
import { LuckyWheel } from './LuckyWheel';
import { Leaderboard } from './Leaderboard';
import { CountdownTimer } from './CountdownTimer';
import { QRCodeModal } from './QRCodeModal';
import { isSoundEnabled, toggleSound } from '../utils/sound';
import { GameState, ProjectorMode, TeamId } from '../types/game';

interface TeacherDashboardProps {
  gameState: GameState;
  onSpinWheel: (target?: number) => void;
  onSelectTurn: (turnNumber: number) => void;
  onSetProjectorMode: (mode: ProjectorMode, focusTeam?: TeamId) => void;
  onStartTimer: (duration?: number) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onResetTurns: () => void;
  onToggleReveal: () => void;
  onResetGame: () => void;
  onNextRound: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  gameState,
  onSpinWheel,
  onSelectTurn,
  onSetProjectorMode,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onResetTurns,
  onToggleReveal,
  onResetGame,
  onNextRound,
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [confirmReset, setConfirmReset] = useState(false);

  const currentRoundNum = gameState.currentRound || 1;
  const roundData = QUIZ_ROUNDS.find((r) => r.roundNumber === currentRoundNum);
  const isTimeUp = gameState.roundStatus === 'time_up';

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider">
                Bàn Điều Khiển Giáo Viên
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Đồng Hồ 45s Real-Time
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Quản Lý Đấu Trường: HULK · THOR · SPIDERMAN · CAPTAIN
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* QR Code Launcher */}
          <button
            onClick={() => setShowQRModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Mã QR & Link 4 Đội</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center justify-center transition-colors"
            title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Reveal Answers */}
          <button
            onClick={onToggleReveal}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              gameState.isAnswerRevealed
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {gameState.isAnswerRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{gameState.isAnswerRevealed ? 'Đang hiện đáp án' : 'Mở đáp án'}</span>
          </button>

          {/* Next Round */}
          <button
            onClick={onNextRound}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow"
          >
            <FastForward className="w-4 h-4" />
            <span>Lượt tiếp theo</span>
          </button>

          {/* Reset Game with confirmation */}
          {confirmReset ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onResetGame();
                  setConfirmReset(false);
                }}
                className="px-2.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
              >
                Chắc chắn xoá điểm
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-2 bg-slate-800 text-slate-400 text-xs rounded-lg"
              >
                Huỷ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
              title="Đặt lại toàn bộ điểm và game"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 45s Countdown Controller Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CountdownTimer
            timerEndsAt={gameState.timerEndsAt}
            timerDuration={gameState.timerDuration}
            isRunning={gameState.isTimerRunning}
            roundStatus={gameState.roundStatus}
            size="md"
            showLabel={true}
          />

          {isTimeUp && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>Hết 45s! Câu hỏi đã kết thúc. Hãy bấm Quay số để chọn lượt tiếp theo.</span>
            </div>
          )}
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-2">
          {gameState.isTimerRunning ? (
            <button
              onClick={onPauseTimer}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Tạm dừng</span>
            </button>
          ) : (
            <button
              onClick={() => onStartTimer(45)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Bắt đầu 45s</span>
            </button>
          )}

          <button
            onClick={onResetTimer}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
            title="Đặt lại 45 giây và chạy lại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Chạy lại 45s</span>
          </button>

          <button
            onClick={() => onStartTimer(15)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1 border border-slate-700"
            title="Gia hạn thêm 15 giây cho học sinh"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+15s</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Wheel & Round Controls, Right = Live Answers & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lucky Wheel & Turn Select (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Wheel Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Vòng Quay Lượt Học Sinh (Đã quay sẽ biến mất)
              </span>
              <span className="text-xs text-amber-400 font-bold">
                Lượt #{currentRoundNum}
              </span>
            </div>

            <LuckyWheel
              isSpinning={gameState.isSpinning}
              targetTurn={gameState.wheelTarget}
              selectedTurn={gameState.selectedTurn}
              availableTurns={gameState.availableTurns}
              onSpin={onSpinWheel}
              onResetTurns={onResetTurns}
              canSpin={!gameState.isSpinning}
            />

            {/* Quick Turn Selection Buttons (1 to 8) */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Lượt thi (Xanh: chưa quay, Xám: đã hoàn thành):
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {gameState.availableTurns.length} lượt còn lại
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => {
                  const turnNum = i + 1;
                  const isCurrent = gameState.currentRound === turnNum;
                  const isCompleted = !gameState.availableTurns.includes(turnNum);

                  return (
                    <button
                      key={turnNum}
                      onClick={() => onSelectTurn(turnNum)}
                      disabled={gameState.isSpinning}
                      className={`py-2 rounded-lg text-xs font-bold transition-all relative ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 font-black shadow-lg scale-105 ring-2 ring-white'
                          : isCompleted
                          ? 'bg-slate-800/50 text-slate-500 border border-slate-800'
                          : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50'
                      }`}
                    >
                      <span>#{turnNum}</span>
                      {isCompleted && !isCurrent && (
                        <span className="text-[9px] block text-slate-400">Đã thi</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Projector View Mode Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="text-xs font-bold uppercase text-slate-300 mb-3 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              Điều khiển màn hình máy chiếu lớp
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onSetProjectorMode('all_teams')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                  gameState.projectorMode === 'all_teams'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                ⊞ Chiếu 4 Đề 4 Đội
              </button>

              <button
                onClick={() => onSetProjectorMode('wheel')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                  gameState.projectorMode === 'wheel'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🎡 Chiếu Vòng Quay
              </button>

              <button
                onClick={() => onSetProjectorMode('leaderboard')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                  gameState.projectorMode === 'leaderboard'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🏆 Bảng Xếp Hạng Lớn
              </button>

              <button
                onClick={() => onSetProjectorMode('team_focus', 1)}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                  gameState.projectorMode === 'team_focus'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🔍 Chiếu Tiêu Điểm 1 Đội
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Answering Status & Leaderboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Real-time Submissions for Current Round */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <div className="text-xs font-extrabold uppercase text-amber-400 tracking-wider">
                  Trạng Thái Nộp Bài Trực Tiếp - Lượt #{currentRoundNum} (45 Giây)
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {roundData?.topic}
                </div>
              </div>
              <span className="text-xs text-slate-400">
                4 học sinh đang thao tác trên điện thoại
              </span>
            </div>

            {/* 4 Teams Live Answer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="p-3.5 rounded-xl border bg-slate-950/70 flex flex-col justify-between"
                    style={{ borderColor: team.hex }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: team.hex }}
                        />
                        <span className="text-xs font-black uppercase" style={{ color: team.hex }}>
                          {team.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {gameState.teamScores[tId] || 0} đ
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-200 mb-2 truncate">
                      Thí sinh: {student?.name || 'Học sinh'}
                    </div>

                    {/* Question snippet with KaTeX math */}
                    <div className="text-xs text-slate-400 line-clamp-2 mb-3 bg-slate-900 p-2 rounded-lg">
                      <span className="font-bold text-slate-300 mr-1">
                        Câu {version?.versionId}:
                      </span>
                      <MathDisplay text={version?.content || ''} />
                    </div>

                    {/* Submission status */}
                    <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      {sub ? (
                        sub.isCorrect ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Đã chọn {sub.selectedAnswer} (ĐÚNG +10đ)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Đã chọn {sub.selectedAnswer} (SAI 0đ)
                          </span>
                        )
                      ) : isTimeUp ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Hết thời gian 45s
                        </span>
                      ) : (
                        <span className="text-amber-400/80 font-medium flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Đang suy nghĩ...
                        </span>
                      )}

                      {/* Spotlight Button */}
                      <button
                        onClick={() => onSetProjectorMode('team_focus', tId)}
                        className="text-[11px] text-slate-400 hover:text-amber-400 underline"
                      >
                        Chiếu đề {team.shortName}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Leaderboard Component */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Bảng xếp hạng 4 đội trực tiếp (HULK · THOR · SPIDERMAN · CAPTAIN)
              </h3>
              <span className="text-xs text-slate-400">
                Bấm vào từng đội để xem điểm 8 thành viên
              </span>
            </div>

            <Leaderboard gameState={gameState} detailed={true} />
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
};
