
import React, { useState, useEffect } from 'react';

interface WarningPopupProps {
  onComplete: () => void;
}

const WarningPopup: React.FC<WarningPopupProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const DURATION = 8000; // 8 seconds

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // Allow for fade-out
    }, DURATION);

    const interval = setInterval(() => {
        setProgress(prev => {
            const newProgress = prev - (100 / (DURATION / 100));
            return newProgress <= 0 ? 0 : newProgress;
        });
    }, 100);


    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-transparent rounded-xl p-8 max-w-md w-full text-center text-white">
        <strong className="text-lg font-bold">¡ADVERTENCIA!</strong>
        <p className="mt-4">
          Cualquier similitud de esta alucinación con tu memoria es mera coincidencia.
        </p>
        <div className="w-full bg-gray-600 rounded-full h-1 mt-6 overflow-hidden">
            <div 
                className="bg-white h-1 rounded-full" 
                style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default WarningPopup;
