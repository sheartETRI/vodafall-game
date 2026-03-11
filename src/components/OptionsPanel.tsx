import React from 'react';

interface OptionsPanelProps {
  options: string[];
  onSelect: (meaning: string) => void;
  disabled: boolean;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({ options, onSelect, disabled }) => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4" id="options-panel">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="group relative flex items-center justify-between p-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl overflow-hidden"
          id={`option-button-${index}`}
        >
          <span className="absolute left-0 top-0 bg-black text-white px-3 py-1 font-mono text-sm font-bold rounded-br-lg">
            {index + 1}
          </span>
          <span className="w-full text-center text-2xl font-bold text-black">{option}</span>
        </button>
      ))}
    </div>
  );
};
