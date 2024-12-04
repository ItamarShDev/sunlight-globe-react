import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useGlobe } from "../hooks/useGlobe";
import { getSunPosition } from "../utils/sunPosition";

const TIME_UPDATE_INTERVAL = 60000; // 1 minute
const DEFAULT_ALTITUDE = 2.5;

export const Globe = forwardRef((_, ref) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { globe, updateSunPosition, pointOfView, addPinMarker, clearMarkers } =
		useGlobe(containerRef);

	useImperativeHandle(ref, () => ({
		pointOfView: (coords, duration) => globe && pointOfView(coords.lat, coords.lng, coords.altitude, duration),
		addPinMarker: (lat, lng, name) => globe && addPinMarker(lat, lng, name),
		clearMarkers: () => globe && clearMarkers(),
	}));

	useEffect(() => {
		if (!globe) return;

		const updateInterval = setInterval(() => {
			const sunPos = getSunPosition();
			updateSunPosition(sunPos);
		}, TIME_UPDATE_INTERVAL);

		const sunPos = getSunPosition();
		updateSunPosition(sunPos);
		pointOfView(sunPos.lat, sunPos.lng, DEFAULT_ALTITUDE, 0);

		globe.controls().addEventListener("change", () => {
			updateSunPosition(getSunPosition());
		});

		return () => clearInterval(updateInterval);
	}, [globe, updateSunPosition, pointOfView]);

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				height: "100vh",
				background: "#000",
			}}
		/>
	);
});
