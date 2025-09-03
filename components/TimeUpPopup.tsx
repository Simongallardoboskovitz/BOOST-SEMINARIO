
import React from 'react';

interface TimeUpPopupProps {
  onExtend: () => void;
  onContinue: () => void;
}

const TimeUpPopup: React.FC<TimeUpPopupProps> = ({ onExtend, onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <h3 className="text-2xl font-bold text-black mb-4">¿Necesitas más tiempo?</h3>
        <p className="text-gray-600 mb-8">Puedes extender el tiempo por un minuto más o continuar al siguiente paso.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onExtend}
            className="flex-1 py-3 px-4 border-none rounded-lg bg-gray-200 text-black text-base font-semibold cursor-pointer hover:bg-gray-300 transition-colors"
          >
            Extender un minuto
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-3 px-4 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 transition-colors"
          >
            Seguir
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeUpPopup;
