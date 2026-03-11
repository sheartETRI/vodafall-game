import { useState, useEffect, useCallback, useRef } from 'react';
import { HUD } from './components/HUD';
import { FallingWord } from './components/FallingWord';
import { OptionsPanel } from './components/OptionsPanel';
import { GameOver } from './components/GameOver';
import { WORDS } from './constants';
import { WordEntry, GameState, Difficulty } from './types';
import { Play, Shield, Zap, Flame, Volume2, VolumeX } from 'lucide-react';

const INITIAL_LIFE = 5;
const FALL_SPEEDS: Record<Difficulty, number> = {
  easy: 8,    // 8% per second
  normal: 15, // 15% per second
  hard: 25    // 25% per second
};

const BGM_URL = "/counting-song.wav";

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    life: INITIAL_LIFE,
    level: 1,
    combo: 0,
    status: 'idle',
    difficulty: 'normal',
    stageProgress: 0,
  });

  const [currentWord, setCurrentWord] = useState<WordEntry | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [yPos, setYPos] = useState(-20);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(false);
  
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(null);
  const isProcessingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Music control
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(BGM_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    if (isMusicOn && (gameState.status === 'playing' || gameState.status === 'studying')) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    } else {
      audioRef.current.pause();
    }
  }, [isMusicOn, gameState.status]);

  const generateNewWord = useCallback(() => {
    isProcessingRef.current = false;
    const levelWords = WORDS.filter(w => w.level === gameState.level);
    if (levelWords.length === 0) return;
    
    const randomWord = levelWords[Math.floor(Math.random() * levelWords.length)];
    
    // Generate distractors from any level to ensure variety
    const otherMeanings = WORDS
      .filter(w => w.meaning !== randomWord.meaning)
      .map(w => w.meaning);
    
    const distractors = [];
    while (distractors.length < 3) {
      const randomDistractor = otherMeanings[Math.floor(Math.random() * otherMeanings.length)];
      if (!distractors.includes(randomDistractor)) {
        distractors.push(randomDistractor);
      }
    }
    
    const allOptions = [randomWord.meaning, ...distractors].sort(() => Math.random() - 0.5);
    
    setCurrentWord(randomWord);
    setOptions(allOptions);
    setYPos(-20);
    setFeedback(null);
  }, [gameState.level]);

  const handleCorrect = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setFeedback('correct');
    
    setGameState(prev => {
      const comboBonus = prev.combo >= 10 ? 20 : prev.combo >= 5 ? 10 : prev.combo >= 3 ? 5 : 0;
      const points = 10 + comboBonus;
      const newScore = prev.score + points;
      const newProgress = prev.stageProgress + 1;
      
      let newStatus = prev.status;
      if (newProgress >= 20) {
        newStatus = prev.level === 40 ? 'gamecomplete' : 'stageclear';
      }

      return {
        ...prev,
        score: newScore,
        combo: prev.combo + 1,
        stageProgress: newProgress,
        status: newStatus,
      };
    });

    setTimeout(() => {
      setGameState(prev => {
        if (prev.status === 'playing') {
          generateNewWord();
        }
        return prev;
      });
    }, 500);
  }, [generateNewWord]);

  const handleMiss = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setFeedback('wrong');
    
    setGameState(prev => {
      const newLife = prev.life - 1;
      return {
        ...prev,
        life: newLife,
        combo: 0,
        score: Math.max(0, prev.score - 5),
        status: newLife <= 0 ? 'gameover' : prev.status
      };
    });

    setTimeout(() => {
      setGameState(prev => {
        if (prev.status !== 'gameover') {
          generateNewWord();
        }
        return prev;
      });
    }, 500);
  }, [generateNewWord]);

  const handleIncorrectSelection = useCallback(() => {
    // Don't set isProcessingRef.current = true here because we want to allow more guesses
    setFeedback('wrong');
    
    setGameState(prev => {
      return {
        ...prev,
        combo: 0,
        score: Math.max(0, prev.score - 2), // Smaller penalty for wrong choice
      };
    });

    // Clear feedback after a short delay but keep the word falling
    setTimeout(() => {
      setFeedback(null);
    }, 400);
  }, []);

  const handleSelect = (meaning: string) => {
    if (gameState.status !== 'playing' || feedback === 'correct' || isProcessingRef.current) return;
    
    if (meaning === currentWord?.meaning) {
      handleCorrect();
    } else {
      handleIncorrectSelection();
    }
  };

  // Game Loop
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== null && gameState.status === 'playing' && feedback !== 'correct' && !isProcessingRef.current) {
      let deltaTime = (time - lastTimeRef.current) / 1000;
      // If the jump is too large (e.g. tab was inactive), reset delta to avoid jumping
      if (deltaTime > 0.1) deltaTime = 0;
      
      const speed = FALL_SPEEDS[gameState.difficulty];
      setYPos(prev => prev + (speed * deltaTime));
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [gameState.status, gameState.difficulty, feedback]);

  useEffect(() => {
    if (yPos > 100 && gameState.status === 'playing' && feedback !== 'correct' && !isProcessingRef.current) {
      handleMiss();
    }
  }, [yPos, gameState.status, feedback, handleMiss]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.status !== 'playing' || feedback) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        handleSelect(options[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, options, feedback, handleSelect]);

  const startGame = (difficulty: Difficulty, stage: number) => {
    lastTimeRef.current = null;
    setGameState({
      score: 0,
      life: INITIAL_LIFE,
      level: stage,
      combo: 0,
      status: 'playing',
      difficulty,
      stageProgress: 0,
    });
    generateNewWord();
  };

  const selectStage = (stage: number) => {
    setGameState(prev => ({
      ...prev,
      level: stage,
      status: 'studying'
    }));
  };

  const nextStage = () => {
    const nextLevel = gameState.level + 1;
    if (nextLevel > 40) {
      setGameState(prev => ({ ...prev, status: 'gamecomplete' }));
    } else {
      setGameState(prev => ({
        ...prev,
        level: nextLevel,
        status: 'studying',
        stageProgress: 0,
      }));
    }
  };

  const studyWords = WORDS.filter(w => w.level === gameState.level);

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col font-sans selection:bg-black selection:text-white overflow-hidden" id="app-root">
      <div className="max-w-2xl w-full mx-auto flex flex-col h-screen p-4" id="game-container">
        <div className="flex items-center justify-between gap-4">
          <HUD 
            score={gameState.score} 
            life={gameState.life} 
            level={gameState.level} 
            combo={gameState.combo} 
            progress={gameState.stageProgress}
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMusicOn(!isMusicOn)}
              className={`p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${isMusicOn ? 'bg-yellow-400' : 'bg-gray-300'}`}
              title={isMusicOn ? "Music Off" : "Music On"}
            >
              {isMusicOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl overflow-hidden mb-6" id="game-field">
          {gameState.status === 'idle' && (
            <div className="absolute inset-0 flex flex-col bg-white z-10 p-6 overflow-y-auto" id="start-screen">
              <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-6 text-center leading-none" id="main-title">
                VOCA FALL
              </h1>
              
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8" id="stage-selection">
                {[...Array(40)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => selectStage(i + 1)}
                    className="aspect-square flex items-center justify-center bg-black text-white font-black text-lg rounded-xl hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <p className="text-center font-mono text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
                Select a Stage to Study & Play
              </p>
            </div>
          )}

          {gameState.status === 'studying' && (
            <div className="absolute inset-0 flex flex-col bg-white z-20 p-6 overflow-hidden" id="study-screen">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black uppercase italic">STAGE {gameState.level} STUDY</h2>
                <button 
                  onClick={() => setGameState(prev => ({ ...prev, status: 'idle' }))}
                  className="px-4 py-2 bg-gray-200 font-bold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Back
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {studyWords.map((w, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black rounded-xl">
                      <span className="font-black text-xl text-blue-600">{w.word}</span>
                      <span className="font-bold text-gray-600">{w.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3" id="difficulty-selection">
                <button
                  onClick={() => startGame('easy', gameState.level)}
                  className="flex flex-col items-center justify-center gap-1 py-3 bg-green-500 text-white font-black uppercase tracking-widest hover:bg-green-600 transition-all rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-xs">Easy</span>
                </button>
                
                <button
                  onClick={() => startGame('normal', gameState.level)}
                  className="flex flex-col items-center justify-center gap-1 py-3 bg-blue-500 text-white font-black uppercase tracking-widest hover:bg-blue-600 transition-all rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-xs">Normal</span>
                </button>
                
                <button
                  onClick={() => startGame('hard', gameState.level)}
                  className="flex flex-col items-center justify-center gap-1 py-3 bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 transition-all rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Flame className="w-5 h-5" />
                  <span className="text-xs">Hard</span>
                </button>
              </div>
            </div>
          )}

          {gameState.status === 'playing' && currentWord && (
            <FallingWord 
              word={currentWord.word} 
              y={yPos} 
              isCorrect={feedback === 'correct'}
              isWrong={feedback === 'wrong'}
            />
          )}

          {gameState.status === 'stageclear' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 backdrop-blur-md z-20 p-8 text-white" id="stage-clear-screen">
              <h2 className="text-6xl font-black uppercase italic mb-4">STAGE {gameState.level} CLEAR!</h2>
              <p className="text-2xl font-bold mb-8">You've mastered 20 words!</p>
              <button
                onClick={nextStage}
                className="px-12 py-6 bg-white text-green-600 text-3xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                id="next-stage-button"
              >
                Next Stage
              </button>
            </div>
          )}

          {gameState.status === 'gamecomplete' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-400/95 backdrop-blur-md z-30 p-8 text-black" id="game-complete-screen">
              <div className="text-center mb-8">
                <h2 className="text-7xl font-black uppercase italic leading-none mb-4">CONGRATULATIONS!</h2>
                <p className="text-3xl font-bold">You've completed all 40 stages!</p>
                <p className="text-xl mt-2">800 words mastered. You are a VOCA PRO!</p>
              </div>
              <button
                onClick={() => setGameState(prev => ({ ...prev, status: 'idle' }))}
                className="px-12 py-6 bg-black text-white text-3xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all rounded-2xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                id="restart-game-button"
              >
                Main Menu
              </button>
            </div>
          )}

          {/* Background Grid for Brutalist Feel */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} id="bg-grid"></div>
        </div>

        <OptionsPanel 
          options={options} 
          onSelect={handleSelect} 
          disabled={gameState.status !== 'playing' || !!feedback} 
        />

        {gameState.status === 'gameover' && (
          <GameOver score={gameState.score} onRestart={() => setGameState(prev => ({ ...prev, status: 'idle' }))} />
        )}
      </div>
    </div>
  );
}
