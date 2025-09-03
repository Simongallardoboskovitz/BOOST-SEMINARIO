import React, { useState, useEffect } from 'react';

interface CarouselProps {
  items: string[];
}

const Carousel: React.FC<CarouselProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearTimeout(timer);
  }, [currentIndex, items.length]);

  return (
    <div className="max-w-4xl mx-auto relative overflow-hidden rounded-xl shadow-lg bg-black text-white p-6 sm:p-8 mb-8">
        <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
            {items.map((text, index) => (
            <div key={index} className="w-full flex-shrink-0 px-2 text-center flex items-center justify-center h-24">
                <h3 className="font-semibold text-lg sm:text-xl">{text}</h3>
            </div>
            ))}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {items.map((_, index) => (
            <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentIndex === index ? 'bg-white' : 'bg-gray-500'
                }`}
                aria-label={`Ir a la diapositiva ${index + 1}`}
            ></button>
            ))}
      </div>
    </div>
  );
};

export default Carousel;
