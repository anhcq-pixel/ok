import confetti from 'canvas-confetti';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  playCorrectSound,
  playIncorrectSound,
  playSpotlightSound,
  playTimeUpSound,
  playWheelWinnerSound,
} from '../utils/sound';
import { ClientMessage, GameState, ProjectorMode, ServerMessage, TeamId } from '../types/game';

const INITIAL_GAME_STATE: GameState = {
  currentRound: 1,
  isSpinning: false,
  selectedTurn: null,
  wheelTarget: null,
  availableTurns: [1, 2, 3, 4, 5, 6, 7, 8],
  completedTurns: [],
  projectorMode: 'all_teams',
  projectorFocusTeam: null,
  isAnswerRevealed: false,
  teamScores: { 1: 0, 2: 0, 3: 0, 4: 0 },
  studentScores: {},
  answers: {},
  roundStatus: 'idle',
  timerEndsAt: null,
  timerDuration: 45,
  isTimerRunning: false,
  lastUpdated: Date.now(),
};

export function useRealtimeGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send message over WebSocket with fallback to HTTP POST /api/action
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      // HTTP fallback
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.state) {
            setGameState(data.state);
          }
        })
        .catch((err) => console.error('Fallback POST error:', err));
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    let isMounted = true;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Try reconnect after 2 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket error, will retry...', err);
          ws.close();
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data) as ServerMessage;

            if (data.type === 'INIT_STATE' || data.type === 'STATE_UPDATE') {
              setGameState(data.state);
            } else if (data.type === 'WHEEL_SPIN_START') {
              setLastNotification(`Vòng quay đang quay...`);
            } else if (data.type === 'WHEEL_SPIN_END') {
              playWheelWinnerSound();
              setLastNotification(`Đã chọn Lượt số ${data.result}! Bắt đầu đếm ngược 45 giây.`);
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 },
              });
            } else if (data.type === 'TIME_UP') {
              playTimeUpSound();
              setLastNotification(`⏰ HẾT THỜI GIAN 45S cho Lượt ${data.roundNumber}!`);
            } else if (data.type === 'ANSWER_RECEIVED') {
              if (data.submission.isCorrect) {
                playCorrectSound();
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.7 },
                });
                setLastNotification(
                  `🎉 ${data.submission.studentName} (Đội ${data.submission.teamId}) trả lời đúng: +10 điểm!`
                );
              } else {
                playIncorrectSound();
                setLastNotification(
                  `${data.submission.studentName} (Đội ${data.submission.teamId}) đã nộp đáp án.`
                );
              }
            } else if (data.type === 'PROJECT_TEAM_FOCUS') {
              playSpotlightSound();
              setLastNotification(`Đang trình chiếu đề bài của Đội ${data.teamId}`);
            }
          } catch (e) {
            console.error('Failed to parse server event:', e);
          }
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }

    connect();

    // Initial state fetch via REST to ensure immediate render
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data) {
          setGameState(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // Action helpers
  const spinWheel = useCallback(
    (target?: number) => {
      sendMessage({ type: 'SPIN_WHEEL', target });
    },
    [sendMessage]
  );

  const setRound = useCallback(
    (roundNumber: number) => {
      sendMessage({ type: 'SET_ROUND', roundNumber });
    },
    [sendMessage]
  );

  const selectTurn = useCallback(
    (turnNumber: number) => {
      sendMessage({ type: 'SELECT_TURN', turnNumber });
    },
    [sendMessage]
  );

  const setProjectorMode = useCallback(
    (mode: ProjectorMode, focusTeam?: TeamId) => {
      sendMessage({ type: 'SET_PROJECTOR_MODE', mode, focusTeam });
    },
    [sendMessage]
  );

  const projectMyTeam = useCallback(
    (teamId: TeamId) => {
      sendMessage({ type: 'STUDENT_PROJECT_TEAM', teamId });
    },
    [sendMessage]
  );

  const submitAnswer = useCallback(
    (teamId: TeamId, roundNumber: number, selectedAnswer: 'A' | 'B' | 'C' | 'D', studentName: string) => {
      sendMessage({
        type: 'SUBMIT_ANSWER',
        teamId,
        roundNumber,
        selectedAnswer,
        studentName,
      });
    },
    [sendMessage]
  );

  const startTimer = useCallback(
    (duration?: number) => {
      sendMessage({ type: 'START_TIMER', duration });
    },
    [sendMessage]
  );

  const pauseTimer = useCallback(() => {
    sendMessage({ type: 'PAUSE_TIMER' });
  }, [sendMessage]);

  const resetTimer = useCallback(() => {
    sendMessage({ type: 'RESET_TIMER' });
  }, [sendMessage]);

  const resetTurns = useCallback(() => {
    sendMessage({ type: 'RESET_TURNS' });
  }, [sendMessage]);

  const toggleReveal = useCallback(() => {
    sendMessage({ type: 'TOGGLE_REVEAL' });
  }, [sendMessage]);

  const resetGame = useCallback(() => {
    sendMessage({ type: 'RESET_GAME' });
  }, [sendMessage]);

  const nextRound = useCallback(() => {
    sendMessage({ type: 'NEXT_ROUND' });
  }, [sendMessage]);

  return {
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
  };
}
