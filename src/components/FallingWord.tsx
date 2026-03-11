import React from 'react';
import { motion } from 'motion/react';

interface FallingWordProps {
  word: string;
  y: number;
  isCorrect?: boolean;
  isWrong?: boolean;
}

export const FallingWord: React.FC<FallingWordProps> = ({ word, y, isCorrect, isWrong }) => {
  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: `${y}%` }}
      id="falling-word-container"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: isCorrect || isWrong ? 1.5 : 1,
          opacity: 1,
          rotate: isWrong ? [0, -10, 10, -10, 10, 0] : 0,
          color: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#000000'
        }}
        className={`px-8 py-4 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl text-4xl font-black lowercase tracking-tighter`}
        id="falling-word-box"
      >
        {word}
      </motion.div>
    </div>
  );
};
