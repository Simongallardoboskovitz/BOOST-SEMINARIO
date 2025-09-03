
import React, { useState, useEffect } from 'react';

interface DesignPortalsPopupProps {
  onComplete: () => void;
}

const DesignPortalsPopup: React.FC<DesignPortalsPopupProps> = ({ onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 500); // Allow for fade-out
        }, 10000); // 10 seconds

        return () => clearTimeout(timer);
    }, [onComplete]);


  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-left">
        <h3 className="text-xl font-bold text-black mb-6">Reglas del juego</h3>
        <ul className="space-y-4 mb-8 text-gray-800 list-none p-0 font-normal">
            <li className="flex items-start" style={{ lineHeight: 1.6 }}>
                <span className="mr-3 mt-1">→</span>
                <span>El perfil que verás a continuación es una interpretación generada por IA para inspirarte.</span>
            </li>
            <li className="flex items-start" style={{ lineHeight: 1.6 }}>
                <span className="mr-3 mt-1">→</span>
                <span>Puedes usar los botones para <strong>Editar la propuesta</strong> y ajustarla, o <strong>Aceptar la propuesta</strong> para usarla como base.</span>
            </li>
            <li className="flex items-start" style={{ lineHeight: 1.6 }}>
                <span className="mr-3 mt-1">→</span>
                <span>Tu avance se guardará en cada paso, permitiéndote construir tu proyecto de forma progresiva.</span>
            </li>
        </ul>
        <button
            onClick={() => {
                setVisible(false);
                setTimeout(onComplete, 500);
            }}
            className="w-full mt-4 py-3 px-4 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 transition-colors"
        >
            Entendido
        </button>
      </div>
    </div>
  );
};

export default DesignPortalsPopup;
