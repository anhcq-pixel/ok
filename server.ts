import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { QUIZ_ROUNDS } from './src/data/quizData.ts';
import type { ClientMessage, GameState, ServerMessage, TeamId } from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

const ALL_TURNS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_TIMER_SECONDS = 45;

// Initial Authoritative Game State
function createInitialState(): GameState {
  return {
    currentRound: 1,
    isSpinning: false,
    selectedTurn: null,
    wheelTarget: null,
    availableTurns: [...ALL_TURNS],
    completedTurns: [],
    projectorMode: 'all_teams',
    projectorFocusTeam: null,
    isAnswerRevealed: false,
    teamScores: { 1: 0, 2: 0, 3: 0, 4: 0 },
    studentScores: {},
    answers: {},
    roundStatus: 'idle',
    timerEndsAt: null,
    timerDuration: DEFAULT_TIMER_SECONDS,
    isTimerRunning: false,
    lastUpdated: Date.now(),
  };
}

let gameState: GameState = createInitialState();

// Helper to broadcast to all connected WebSocket clients
function broadcast(msg: ServerMessage) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Check correct answer for a team and round
function evaluateAnswer(roundNumber: number, teamId: TeamId, chosenAnswer: 'A' | 'B' | 'C' | 'D'): boolean {
  const round = QUIZ_ROUNDS.find((r) => r.roundNumber === roundNumber);
  if (!round) return false;
  const version = round.versions[teamId];
  if (!version) return false;
  return version.correctAnswer.toUpperCase() === chosenAnswer.toUpperCase();
}

// Server ticker for 45s countdown timer
setInterval(() => {
  if (gameState.isTimerRunning && gameState.timerEndsAt) {
    const remaining = gameState.timerEndsAt - Date.now();
    if (remaining <= 0) {
      gameState.isTimerRunning = false;
      gameState.timerEndsAt = null;
      gameState.roundStatus = 'time_up';
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'TIME_UP', roundNumber: gameState.currentRound });
      broadcast({ type: 'STATE_UPDATE', state: gameState });
    }
  }
}, 500);

// Process client action
function handleClientAction(action: ClientMessage) {
  switch (action.type) {
    case 'SPIN_WHEEL': {
      if (gameState.isSpinning) return;

      // Select only from availableTurns (turns that haven't been spun yet)
      const pool = gameState.availableTurns.length > 0 ? gameState.availableTurns : ALL_TURNS;
      const target = action.target && pool.includes(action.target)
        ? action.target
        : pool[Math.floor(Math.random() * pool.length)];

      gameState.isSpinning = true;
      gameState.wheelTarget = target;
      gameState.projectorMode = 'wheel';
      gameState.isAnswerRevealed = false;
      gameState.isTimerRunning = false;
      gameState.timerEndsAt = null;
      gameState.lastUpdated = Date.now();

      broadcast({
        type: 'WHEEL_SPIN_START',
        target,
        duration: 4000,
      });
      broadcast({ type: 'STATE_UPDATE', state: gameState });

      // After spin duration, finalize target & start 45s timer
      setTimeout(() => {
        gameState.isSpinning = false;
        gameState.selectedTurn = target;
        gameState.currentRound = target;

        // Eliminate spun turn from availableTurns
        gameState.availableTurns = gameState.availableTurns.filter((t) => t !== target);
        if (!gameState.completedTurns.includes(target)) {
          gameState.completedTurns.push(target);
        }

        // Start 45-second timer automatically for this question
        gameState.roundStatus = 'question_active';
        gameState.projectorMode = 'all_teams';
        gameState.timerDuration = DEFAULT_TIMER_SECONDS;
        gameState.timerEndsAt = Date.now() + DEFAULT_TIMER_SECONDS * 1000;
        gameState.isTimerRunning = true;
        gameState.lastUpdated = Date.now();

        broadcast({ type: 'WHEEL_SPIN_END', result: target });
        broadcast({ type: 'STATE_UPDATE', state: gameState });
      }, 4200);
      break;
    }

    case 'START_TIMER': {
      const dur = action.duration || DEFAULT_TIMER_SECONDS;
      gameState.timerDuration = dur;
      gameState.timerEndsAt = Date.now() + dur * 1000;
      gameState.isTimerRunning = true;
      if (gameState.roundStatus === 'time_up' || gameState.roundStatus === 'idle') {
        gameState.roundStatus = 'question_active';
      }
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'PAUSE_TIMER': {
      if (gameState.isTimerRunning && gameState.timerEndsAt) {
        const remainingMs = Math.max(0, gameState.timerEndsAt - Date.now());
        gameState.timerDuration = Math.ceil(remainingMs / 1000);
        gameState.isTimerRunning = false;
        gameState.timerEndsAt = null;
        gameState.lastUpdated = Date.now();
        broadcast({ type: 'STATE_UPDATE', state: gameState });
      }
      break;
    }

    case 'RESET_TIMER': {
      gameState.timerDuration = DEFAULT_TIMER_SECONDS;
      gameState.timerEndsAt = Date.now() + DEFAULT_TIMER_SECONDS * 1000;
      gameState.isTimerRunning = true;
      gameState.roundStatus = 'question_active';
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'SET_ROUND': {
      const r = Math.max(1, Math.min(8, action.roundNumber));
      gameState.currentRound = r;
      gameState.selectedTurn = r;
      gameState.roundStatus = 'question_active';
      gameState.isAnswerRevealed = false;
      gameState.timerDuration = DEFAULT_TIMER_SECONDS;
      gameState.timerEndsAt = Date.now() + DEFAULT_TIMER_SECONDS * 1000;
      gameState.isTimerRunning = true;
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'SELECT_TURN': {
      const t = Math.max(1, Math.min(8, action.turnNumber));
      gameState.selectedTurn = t;
      gameState.currentRound = t;
      gameState.roundStatus = 'question_active';
      gameState.isAnswerRevealed = false;
      // Remove from availableTurns
      gameState.availableTurns = gameState.availableTurns.filter((turn) => turn !== t);
      if (!gameState.completedTurns.includes(t)) {
        gameState.completedTurns.push(t);
      }
      gameState.timerDuration = DEFAULT_TIMER_SECONDS;
      gameState.timerEndsAt = Date.now() + DEFAULT_TIMER_SECONDS * 1000;
      gameState.isTimerRunning = true;
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'SET_PROJECTOR_MODE': {
      gameState.projectorMode = action.mode;
      if (action.focusTeam !== undefined) {
        gameState.projectorFocusTeam = action.focusTeam;
      }
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'STUDENT_PROJECT_TEAM': {
      // Student hits "Trình chiếu câu hỏi nhóm mình"
      gameState.projectorMode = 'team_focus';
      gameState.projectorFocusTeam = action.teamId;
      gameState.lastUpdated = Date.now();
      broadcast({
        type: 'PROJECT_TEAM_FOCUS',
        teamId: action.teamId,
        studentName: '',
      });
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'SUBMIT_ANSWER': {
      const { teamId, roundNumber, selectedAnswer, studentName } = action;
      const key = `${roundNumber}_${teamId}`;

      // Prevent re-submitting if already submitted or time is up
      if (gameState.answers[key] || gameState.roundStatus === 'time_up') {
        return;
      }

      const isCorrect = evaluateAnswer(roundNumber, teamId, selectedAnswer);
      const pointsAwarded = isCorrect ? 10 : 0;

      // Update team score
      gameState.teamScores[teamId] = (gameState.teamScores[teamId] || 0) + pointsAwarded;

      // Update student score
      const studentKey = `${teamId}_${roundNumber}`;
      gameState.studentScores[studentKey] = (gameState.studentScores[studentKey] || 0) + pointsAwarded;

      const submission = {
        teamId,
        roundNumber,
        studentName,
        selectedAnswer,
        isCorrect,
        pointsAwarded,
        submittedAt: Date.now(),
      };

      gameState.answers[key] = submission;
      gameState.lastUpdated = Date.now();

      broadcast({ type: 'ANSWER_RECEIVED', submission });
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'TOGGLE_REVEAL': {
      gameState.isAnswerRevealed = !gameState.isAnswerRevealed;
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'RESET_TURNS': {
      gameState.availableTurns = [...ALL_TURNS];
      gameState.completedTurns = [];
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'RESET_GAME': {
      gameState = createInitialState();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }

    case 'NEXT_ROUND': {
      if (gameState.availableTurns.length > 0) {
        const nextT = gameState.availableTurns[0];
        gameState.currentRound = nextT;
        gameState.selectedTurn = nextT;
        gameState.availableTurns = gameState.availableTurns.filter((t) => t !== nextT);
        gameState.completedTurns.push(nextT);
        gameState.roundStatus = 'question_active';
        gameState.isAnswerRevealed = false;
        gameState.projectorMode = 'all_teams';
        gameState.timerDuration = DEFAULT_TIMER_SECONDS;
        gameState.timerEndsAt = Date.now() + DEFAULT_TIMER_SECONDS * 1000;
        gameState.isTimerRunning = true;
      } else {
        gameState.roundStatus = 'completed';
        gameState.projectorMode = 'leaderboard';
        gameState.isTimerRunning = false;
        gameState.timerEndsAt = null;
      }
      gameState.lastUpdated = Date.now();
      broadcast({ type: 'STATE_UPDATE', state: gameState });
      break;
    }
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  const initMsg: ServerMessage = { type: 'INIT_STATE', state: gameState };
  ws.send(JSON.stringify(initMsg));

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString()) as ClientMessage;
      handleClientAction(data);
    } catch (err) {
      console.error('Failed to parse WS message:', err);
    }
  });
});

// REST API endpoints
app.get('/api/state', (_req, res) => {
  res.json(gameState);
});

app.get('/api/config', (req, res) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : (req.secure ? 'https' : 'http');
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  const detectedUrl = host ? `${proto}://${host}` : '';
  const appUrl = process.env.APP_URL || detectedUrl;
  res.json({ appUrl, detectedUrl, isProd: process.env.NODE_ENV === 'production' });
});

app.post('/api/action', (req, res) => {
  try {
    const action = req.body as ClientMessage;
    handleClientAction(action);
    res.json({ success: true, state: gameState });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Server running on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
