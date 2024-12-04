import { SunPosition } from '../types';

export const getSunPosition = (): SunPosition => {
    const now = new Date();
    
    // Calculate day of year
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const dayOfYear = Math.floor(diff / oneDay);

    // Calculate solar declination angle (more accurate formula)
    const D = 2 * Math.PI * (dayOfYear - 1) / 365;
    const declination = 0.396372 - 22.91327 * Math.cos(D) + 4.02543 * Math.sin(D) 
                       - 0.387205 * Math.cos(2 * D) + 0.051967 * Math.sin(2 * D) 
                       - 0.154527 * Math.cos(3 * D) + 0.084798 * Math.sin(3 * D);

    // Calculate current time in decimal hours (UTC)
    const utcHour = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const decimalTime = utcHour + utcMinutes / 60 + utcSeconds / 3600;

    // Convert time to longitude
    // The sun moves 15 degrees per hour (360° / 24h)
    // At UTC 0:00, the sun is at longitude 180° (midnight at prime meridian)
    let lng = -180 + (decimalTime * 15);

    // Normalize longitude to [-180, 180]
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;

    return { lat: declination, lng };
};

export const getGMTOffset = (timeZone: string): number => {
    try {
        const date = new Date();
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
        return Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60));
    } catch (error) {
        console.warn(`Could not get GMT offset for timezone ${timeZone}:`, error);
        return 0;
    }
};

export const getLocalTime = (timeZone: string): string => {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return formatter.format(new Date());
    } catch (error) {
        console.warn(`Could not get time for timezone ${timeZone}:`, error);
        return 'N/A';
    }
};
