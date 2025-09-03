
import React from 'react';

interface ProgressBarProps {
  totalSteps: number;
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ totalSteps, currentStep }) => {
  return (
    // Contenedor que alinea la barra con el ancho del contenido principal (max-w-4xl)
    <div className="max-w-4xl mx-auto my-8 px-4 sm:px-0">
      <div className="flex justify-between items-center relative">
        {/* Línea de fondo gris que conecta todos los pasos */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 -translate-y-1/2 -z-10"></div>
        
        {/* Línea de progreso negra que se anima según el paso actual */}
        <div 
            className="absolute top-1/2 left-0 h-0.5 bg-black -translate-y-1/2 -z-10 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>

        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;

          let circleClass = 'w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 z-10';
          let numberClass = 'font-bold';
          
          if (isActive) {
            circleClass += ' bg-black border-black';
            numberClass += ' text-white';
          } else if (isCompleted) {
            // El fondo blanco se asienta limpiamente sobre la línea de conexión
            circleClass += ' bg-white border-black';
            numberClass += ' text-black';
          } else {
            // Estado inactivo: borde y número negros con fondo transparente (aspecto "hueco")
            circleClass += ' bg-transparent border-black';
            numberClass += ' text-black';
          }

          return (
            <div key={step} className={circleClass} title={`Paso ${step}`}>
              <span className={numberClass}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;