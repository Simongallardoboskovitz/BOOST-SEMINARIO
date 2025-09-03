
import React from 'react';
import Timebox from './Timebox';

interface HeaderProps {
  title: string;
  showTimebox?: boolean;
  timerKey: number;
  timerDuration: number;
  onTimeUp: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showTimebox = false, timerKey, timerDuration, onTimeUp }) => {
  return (
    <header className="bg-black text-white p-4 shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-full font-black text-xl">B</div>
            <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
        </div>
        {showTimebox && <Timebox key={timerKey} durationInSeconds={timerDuration} onTimeUp={onTimeUp} />}
      </div>
    </header>
  );
};

export default Header;
