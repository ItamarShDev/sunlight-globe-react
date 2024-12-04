import type { SunPosition } from "../types";

export const getSunPosition = (): SunPosition => {
	const now = new Date();

	// Astronomical constants
	const EARTH_AXIAL_TILT = 23.439; // degrees
	const DAYS_IN_YEAR = 365.25;

	// Calculate day of year with more precision
	const start = new Date(now.getFullYear(), 0, 0);
	const diff = now.getTime() - start.getTime();
	const oneDay = 24 * 60 * 60 * 1000;
	const dayOfYear = Math.floor(diff / oneDay) + now.getHours() / 24;

	// More accurate solar declination calculation
	// Using a refined approximation of the Earth's orbit and axial tilt
	const yearFraction = (2 * Math.PI * dayOfYear) / DAYS_IN_YEAR;

	// Equation of time (accounting for Earth's elliptical orbit)
	const equationOfTime =
		229.18 *
		(0.000075 +
			0.001868 * Math.cos(yearFraction) -
			0.032077 * Math.sin(yearFraction) -
			0.014615 * Math.cos(2 * yearFraction) -
			0.040849 * Math.sin(2 * yearFraction));

	// Calculate solar declination with more precise trigonometric model
	const declination = EARTH_AXIAL_TILT * Math.sin(yearFraction);

	// Calculate current time in decimal hours (UTC)
	const utcHour = now.getUTCHours();
	const utcMinutes = now.getUTCMinutes();
	const utcSeconds = now.getUTCSeconds();
	const decimalTime = utcHour + utcMinutes / 60 + utcSeconds / 3600;

	// Correct longitude calculation to match Earth's rotation
	// Earth rotates from west to east, so we subtract time-based rotation
	let lng = 180 - (decimalTime * 15 + equationOfTime / 4);

	// Normalize longitude to [-180, 180]
	while (lng > 180) lng -= 360;
	while (lng < -180) lng += 360;

	return {
		lat: declination,
		lng,
	};
};

export const getGMTOffset = (timeZone: string): number => {
	try {
		const date = new Date();
		const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
		const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
		return Math.round(
			(tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60),
		);
	} catch (error) {
		console.warn(`Could not get GMT offset for timezone ${timeZone}:`, error);
		return 0;
	}
};

export const getLocalTime = (timeZone: string): string => {
	try {
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
		return formatter.format(new Date());
	} catch (error) {
		console.warn(`Could not get time for timezone ${timeZone}:`, error);
		return "N/A";
	}
};
