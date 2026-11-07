import React, { useEffect, useState } from 'react';
import {
  Laptop,
  QrCode,
  Radio,
  Smartphone,
  Sparkles,
  Tv,
  Users,
} from 'lucide-react';
import { TEAMS } from './data/quizData';
import { useRealtimeGame } from './hooks/useRealtimeGame';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentMobileView } from './components/StudentMobileView';
import { LaptopTeamView } from './components/LaptopTeamView';
import { ProjectorView } from './components/ProjectorView';
import { QRCodeModal } from './components/QRCodeModal';
import { TeamId } from './types/game';

type AppRole = 'teacher' | 'student' | 'laptop' | 'projector';

export default function App() {
  const {
    gameState,
    isConnected,
    lastNotification,
    spinWheel,
    setRound,
    selectTurn,
    setProjectorMode,
    projectMyTeam,
    submitAnswer,
    startTimer,
    pauseTimer,
    resetTimer,
    resetTurns,
    toggleReveal,
    resetGame,
    nextRound,
  } = useRealtimeGame();

  const [role, setRole] = useState<AppRole>('teacher');
  const [teamId, setTeamId] = useState<TeamId>(1);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  // Read URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role') as AppRole;
    const t = Number(params.get('team')) as TeamId;

    if (r === 'student' || r === 'laptop' || r === 'projector' || r === 'teacher') {
      setRole(r);
    }
    if (t === 1 || t === 2 || t === 3 || t === 4) {
      setTeamId(t);
    }
  }, []);

  const navigateToRole = (newRole: AppRole, newTeam?: TeamId) => {
    const params = new URLSearchParams();
    params.set('role', newRole);
    if (newTeam) params.set('team', String(newTeam));
    window.history.pushState({}, '', `?${params.toString()}`);
    setRole(newRole);
    if (newTeam) setTeamId(newTeam);
    setShowRoleMenu(false);
  };

  // If role is student mobile view, render the dedicated mobile view
  if (role === 'student') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Quick Back to Teacher Link */}
        <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
            <span>{isConnected ? 'Real-Time Connected' : 'Đang kết nối lại...'}</span>
          </div>
          <button
            onClick={() => navigateToRole('teacher')}
            className="hover:text-amber-400 underline"
          >
            Về bàn giáo viên
          </button>
        </div>

        <StudentMobileView
          teamId={teamId}
          gameState={gameState}
          onSubmitAnswer={submitAnswer}
          onProjectTeam={projectMyTeam}
        />
      </div>
    );
  }

  // If role is laptop team view
  if (role === 'laptop') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Top Mini Switcher */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
            <span>{isConnected ? 'Đang kết nối thời gian thực' : 'Đang thử kết nối lại...'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Đổi nhóm:</span>
              {([1, 2, 3, 4] as TeamId[]).map((t) => (
                <button
                  key={t}
                  onClick={() => navigateToRole('laptop', t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    teamId === t ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Đội {t}
                </button>
              ))}
            </div>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => navigateToRole('teacher')}
              className="hover:text-amber-400 underline"
            >
              Về bàn giáo viên
            </button>
          </div>
        </div>

        <LaptopTeamView teamId={teamId} gameState={gameState} />
      </div>
    );
  }

  // If role is projector view
  if (role === 'projector') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Quick Nav Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-1 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
            <span>Màn hình trình chiếu lớp</span>
          </div>
          <button
            onClick={() => navigateToRole('teacher')}
            className="hover:text-amber-400 underline text-[11px]"
          >
            Quay lại bàn điều khiển giáo viên
          </button>
        </div>

        <ProjectorView
          gameState={gameState}
          onSpinWheel={spinWheel}
          onSetProjectorMode={setProjectorMode}
          onResetTurns={resetTurns}
        />
      </div>
    );
  }

  // DEFAULT VIEW: TEACHER DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract: Brand Wordmark - Nav Links - 1 Primary Action */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Đấu Trường Toán Học
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                Bàn Giáo Viên
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Single-Line) */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
            <button
              onClick={() => navigateToRole('teacher')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                role === 'teacher' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Bàn điều khiển
            </button>

            <button
              onClick={() => navigateToRole('projector')}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Tv className="w-3.5 h-3.5 text-slate-400" />
              <span>Máy chiếu lớp</span>
            </button>

            {/* Quick Phone links */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-4 whitespace-nowrap shrink-0">
              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                <Smartphone className="w-3.5 h-3.5" /> 4 ĐT:
              </span>
              {([1, 2, 3, 4] as TeamId[]).map((t) => (
                <button
                  key={t}
                  onClick={() => navigateToRole('student', t)}
                  className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-bold"
                  style={{ color: TEAMS[t].hex }}
                >
                  {TEAMS[t].shortName}
                </button>
              ))}
            </div>

            {/* Quick Laptop links */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-4 whitespace-nowrap shrink-0">
              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                <Laptop className="w-3.5 h-3.5" /> 4 Laptop:
              </span>
              {([1, 2, 3, 4] as TeamId[]).map((t) => (
                <button
                  key={t}
                  onClick={() => navigateToRole('laptop', t)}
                  className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-bold"
                  style={{ color: TEAMS[t].hex }}
                >
                  {TEAMS[t].shortName}
                </button>
              ))}
            </div>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] font-mono text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                }`}
              />
              <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* QR Modal Trigger */}
            <button
              onClick={() => setShowQRModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-500 rounded-xl hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Mã QR & Link</span>
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Notification Banner */}
      {lastNotification && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2 animate-in fade-in">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{lastNotification}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <TeacherDashboard
          gameState={gameState}
          onSpinWheel={spinWheel}
          onSelectTurn={selectTurn}
          onSetProjectorMode={setProjectorMode}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onResetTimer={resetTimer}
          onResetTurns={resetTurns}
          onToggleReveal={toggleReveal}
          onResetGame={resetGame}
          onNextRound={nextRound}
        />
      </main>

      {/* QR Code & Device Link Modal */}
      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
}
