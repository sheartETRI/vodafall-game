import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Trophy } from 'lucide-react';

interface GameOverProps {
  score: number;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, onRestart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      id="game-over-overlay"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white border-8 border-black p-12 max-w-md w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rounded-3xl text-center"
        id="game-over-modal"
      >
        <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4" id="game-over-title">Game Over</h2>
        
        <div className="flex flex-col items-center gap-2 mb-8" id="game-over-score-container">
          <Trophy className="w-16 h-16 text-yellow-400 mb-2" />
          <p className="text-gray-500 uppercase font-bold tracking-widest text-sm">Final Score</p>
          <p className="text-7xl font-black font-mono">{score}</p>
        </div>

        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-3 py-6 bg-black text-white text-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-2xl shadow-[8px_8px_0px_0px_rgba(242,125,38,1)]"
          id="restart-button"
        >
          <RefreshCw className="w-8 h-8" />
          Try Again
        </button>
      </motion.div>
    </motion.div>
  );
};
