import React from 'react';

interface NavigationProps {
  onNext: () => void;
  onPrev: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ onNext, onPrev, isPrevDisabled, isNextDisabled }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={onPrev}
              disabled={isPrevDisabled}
              className="py-3 px-6 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={onNext}
              disabled={isNextDisabled}
              className="py-3 px-6 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
        </div>
    </footer>
  );
};

export default Navigation;