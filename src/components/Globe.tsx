import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useGlobe } from '../hooks/useGlobe';
import { getSunPosition } from '../utils/sunPosition';

const TIME_UPDATE_INTERVAL = 60000; // 1 minute
const DEFAULT_ALTITUDE = 2.5;

export const Globe = forwardRef((props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { globe, updateSunPosition, pointOfView } = useGlobe(containerRef);

    useImperativeHandle(ref, () => ({
        pointOfView: (coords: { lat: number; lng: number; altitude: number }, duration: number) => {
            if (globe) {
                pointOfView(coords.lat, coords.lng, coords.altitude, duration);
            }
        }
    }));

    useEffect(() => {
        if (!globe) return;

        const updateInterval = setInterval(() => {
            const sunPos = getSunPosition();
            updateSunPosition(sunPos);
        }, TIME_UPDATE_INTERVAL);

        // Initial update
        const sunPos = getSunPosition();
        updateSunPosition(sunPos);
        pointOfView(sunPos.lat, sunPos.lng, DEFAULT_ALTITUDE, 0);

        // Add rotation listener
        globe.controls().addEventListener('change', () => {
            updateSunPosition(getSunPosition());
        });

        return () => clearInterval(updateInterval);
    }, [globe, updateSunPosition, pointOfView]);

    return (
        <div 
            ref={containerRef} 
            style={{ 
                width: '100%', 
                height: '100vh', 
                background: '#000' 
            }} 
        />
    );
});
