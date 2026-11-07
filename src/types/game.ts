export type TeamId = 1 | 2 | 3 | 4;

export interface TeamInfo {
  id: TeamId;
  name: string;
  shortName: string;
  colorName: string;
  hex: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}

export interface Student {
  id: string;
  name: string;
  turnNumber: number; // 1 to 8
  teamId: TeamId;
  score: number;
}

export interface QuestionChoice {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  latex?: string; // Optional raw LaTeX formula
}

export interface QuestionVersion {
  versionId: string; // e.g. "1.1", "1.2", "1.3", "1.4"
  teamId: TeamId;
  questionNumber: number; // 1 to 8
  content: string;
  choices: QuestionChoice[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface QuestionRound {
  roundNumber: number; // 1 to 8
  topic: string;
  versions: Record<TeamId, QuestionVersion>;
}

export interface AnswerSubmission {
  teamId: TeamId;
  roundNumber: number;
  studentName: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  pointsAwarded: number;
  submittedAt: number;
}

export type ProjectorMode = 'wheel' | 'all_teams' | 'team_focus' | 'leaderboard';

export interface GameState {
  currentRound: number; // 1 to 8
  isSpinning: boolean;
  selectedTurn: number | null; // 1 to 8
  wheelTarget: number | null; // Segment to stop on
  availableTurns: number[]; // e.g. [1, 2, 4, 5, 6, 7, 8] - turns that have NOT been spun yet
  completedTurns: number[]; // turns that have been completed
  projectorMode: ProjectorMode;
  projectorFocusTeam: TeamId | null;
  isAnswerRevealed: boolean;
  teamScores: Record<TeamId, number>;
  studentScores: Record<string, number>; // key: `${teamId}_${turnNumber}`
  answers: Record<string, AnswerSubmission>; // key: `${roundNumber}_${teamId}`
  roundStatus: 'idle' | 'question_active' | 'time_up' | 'revealed' | 'completed';
  timerEndsAt: number | null; // timestamp when 45s countdown expires
  timerDuration: number; // default 45
  isTimerRunning: boolean;
  lastUpdated: number;
}

export type ClientMessage =
  | { type: 'SPIN_WHEEL'; target?: number }
  | { type: 'SET_ROUND'; roundNumber: number }
  | { type: 'SELECT_TURN'; turnNumber: number }
  | { type: 'SET_PROJECTOR_MODE'; mode: ProjectorMode; focusTeam?: TeamId }
  | { type: 'STUDENT_PROJECT_TEAM'; teamId: TeamId }
  | {
      type: 'SUBMIT_ANSWER';
      teamId: TeamId;
      roundNumber: number;
      selectedAnswer: 'A' | 'B' | 'C' | 'D';
      studentName: string;
    }
  | { type: 'START_TIMER'; duration?: number }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'TOGGLE_REVEAL' }
  | { type: 'RESET_GAME' }
  | { type: 'RESET_TURNS' }
  | { type: 'NEXT_ROUND' };

export type ServerMessage =
  | { type: 'INIT_STATE'; state: GameState }
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'WHEEL_SPIN_START'; target: number; duration: number }
  | { type: 'WHEEL_SPIN_END'; result: number }
  | { type: 'TIME_UP'; roundNumber: number }
  | { type: 'ANSWER_RECEIVED'; submission: AnswerSubmission }
  | { type: 'PROJECT_TEAM_FOCUS'; teamId: TeamId; studentName: string };
