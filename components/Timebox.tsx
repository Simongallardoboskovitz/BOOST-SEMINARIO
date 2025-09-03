import React, { useState, useEffect } from 'react';

interface TimeboxProps {
    durationInSeconds: number;
    onTimeUp: () => void;
}

const Timebox: React.FC<TimeboxProps> = ({ durationInSeconds, onTimeUp }) => {
    const [seconds, setSeconds] = useState(durationInSeconds);

    useEffect(() => {
        setSeconds(durationInSeconds); // Reset timer when duration changes
    }, [durationInSeconds]);

    useEffect(() => {
        if (seconds <= 0) {
            onTimeUp();
            return;
        }

        const timer = setInterval(() => {
            setSeconds(prevSeconds => prevSeconds - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds, onTimeUp]);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const timeColorClass = 'text-white';

    return (
        <div className={`text-lg font-bold ${timeColorClass}`}>
            {minutes}:{remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
        </div>
    );
};

export default Timebox;