import React, { useState } from 'react';
import { Award, CheckCircle2, Trophy, Users, XCircle } from 'lucide-react';
import { STUDENTS_ROSTER, TEAMS } from '../data/quizData';
import { GameState, TeamId } from '../types/game';

interface LeaderboardProps {
  gameState: GameState;
  detailed?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ gameState, detailed = false }) => {
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<TeamId>(1);

  // Sort teams by score descending
  const sortedTeams = ([1, 2, 3, 4] as TeamId[])
    .map((id) => ({
      id,
      info: TEAMS[id],
      score: gameState.teamScores[id] || 0,
      students: STUDENTS_ROSTER[id],
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top 4 Podium / Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedTeams.map((team, rankIndex) => {
          const isLeader = rankIndex === 0 && team.score > 0;
          return (
            <div
              key={team.id}
              onClick={() => {
                setSelectedTeamRoster(team.id);
                setShowRosterModal(true);
              }}
              className={`relative overflow-hidden rounded-xl border p-4 bg-slate-900/80 transition-all cursor-pointer hover:border-slate-500 hover:bg-slate-900 ${
                isLeader ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10' : 'border-slate-800'
              }`}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {rankIndex === 0 ? (
                    <Trophy className="w-5 h-5 text-amber-400" />
                  ) : rankIndex === 1 ? (
                    <Award className="w-5 h-5 text-slate-300" />
                  ) : rankIndex === 2 ? (
                    <Award className="w-5 h-5 text-amber-700" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-bold">
                      4
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-400">
                    Hạng {rankIndex + 1}
                  </span>
                </div>

                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: team.info.hex }}
                />
              </div>

              {/* Team Name */}
              <div className="text-base font-bold text-slate-100 truncate">
                {team.info.name}
              </div>

              {/* Score Big Display */}
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-tight">
                  {team.score}
                </span>
                <span className="text-xs uppercase text-slate-400 font-medium">điểm</span>
              </div>

              {/* Progress Summary: Correct answers count */}
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>{team.score / 10} câu đúng</span>
                <span className="text-[11px] text-slate-500 underline hover:text-slate-300">
                  Chi tiết
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Rounds & Answers Matrix */}
      {detailed && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Kết quả từng lượt thi (Lượt 1 - 8)
            </h3>
            <span className="text-xs text-slate-400">
              Mỗi câu đúng: +10 điểm
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Lượt</th>
                  <th className="py-2.5 px-3 font-semibold">Đội 1 (Xanh Lá)</th>
                  <th className="py-2.5 px-3 font-semibold">Đội 2 (Vàng Cam)</th>
                  <th className="py-2.5 px-3 font-semibold">Đội 3 (Đỏ Hồng)</th>
                  <th className="py-2.5 px-3 font-semibold">Đội 4 (Xanh Dương)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {Array.from({ length: 8 }).map((_, i) => {
                  const roundNum = i + 1;
                  const isCurrent = gameState.currentRound === roundNum;

                  return (
                    <tr
                      key={roundNum}
                      className={isCurrent ? 'bg-amber-500/5 font-semibold' : 'hover:bg-slate-800/30'}
                    >
                      <td className="py-3 px-3 text-slate-300">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                          #{roundNum}
                        </span>
                      </td>

                      {([1, 2, 3, 4] as TeamId[]).map((tId) => {
                        const answerKey = `${roundNum}_${tId}`;
                        const sub = gameState.answers[answerKey];
                        const student = STUDENTS_ROSTER[tId].find((s) => s.turnNumber === roundNum);

                        return (
                          <td key={tId} className="py-3 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] text-slate-300 font-sans truncate max-w-[120px]">
                                {student?.name}
                              </span>
                              {sub ? (
                                <div className="flex items-center gap-1.5">
                                  {sub.isCorrect ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {sub.selectedAnswer} (+10)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-rose-400">
                                      <XCircle className="w-3.5 h-3.5" />
                                      {sub.selectedAnswer} (0)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-[11px]">Chưa trả lời</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roster & Individual Scores Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRosterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 text-xl font-bold"
            >
              ✕
            </button>

            {/* Team Tabs */}
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              {([1, 2, 3, 4] as TeamId[]).map((tId) => {
                const team = TEAMS[tId];
                const active = selectedTeamRoster === tId;
                return (
                  <button
                    key={tId}
                    onClick={() => setSelectedTeamRoster(tId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? 'bg-slate-800 text-white border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {team.shortName}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-slate-100">
                Danh sách thành viên - {TEAMS[selectedTeamRoster].name}
              </h4>
              <span className="text-sm font-mono font-bold text-amber-400">
                Tổng: {gameState.teamScores[selectedTeamRoster] || 0} điểm
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
              {STUDENTS_ROSTER[selectedTeamRoster].map((student) => {
                const answerKey = `${student.turnNumber}_${selectedTeamRoster}`;
                const sub = gameState.answers[answerKey];
                const studentKey = `${selectedTeamRoster}_${student.turnNumber}`;
                const studentScore = gameState.studentScores[studentKey] || 0;

                return (
                  <div
                    key={student.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-mono font-bold text-[10px]">
                        #{student.turnNumber}
                      </span>
                      <span className="font-medium text-slate-200 text-sm">
                        {student.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {sub ? (
                        sub.isCorrect ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Sai
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500">Chưa thi</span>
                      )}
                      <span className="font-mono font-bold text-amber-400 w-12 text-right">
                        {studentScore} đ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowRosterModal(false)}
              className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
