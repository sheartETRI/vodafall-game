import React from 'react';
import { Heart, Trophy, Zap, Layers } from 'lucide-react';

interface HUDProps {
  score: number;
  life: number;
  level: number;
  combo: number;
  progress: number;
}

export const HUD: React.FC<HUDProps> = ({ score, life, level, combo, progress }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-black text-white border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 rounded-xl" id="game-hud">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2" id="hud-score">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="font-mono text-xl font-bold">{score}</span>
        </div>
        <div className="flex items-center gap-2" id="hud-level">
          <Layers className="w-5 h-5 text-blue-400" />
          <div className="flex flex-col">
            <span className="font-mono text-lg font-bold leading-none">STAGE {level}</span>
            <span className="font-mono text-[10px] opacity-70">{progress}/20</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {combo > 1 && (
          <div className="flex items-center gap-1 animate-bounce" id="hud-combo">
            <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
            <span className="font-mono text-lg font-black italic text-orange-500">{combo} COMBO</span>
          </div>
        )}
        <div className="flex items-center gap-1" id="hud-life">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 ${i < life ? 'text-red-500 fill-red-500' : 'text-gray-700'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
